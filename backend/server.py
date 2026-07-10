from fastapi import FastAPI, APIRouter, HTTPException, Depends, Header
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import json
import logging
import secrets
import string
import asyncio
from pathlib import Path
from pydantic import BaseModel, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import bcrypt
import jwt
from groq import Groq


ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection - with fallback for Render environment variables
mongo_url = os.environ.get('MONGO_URL') or os.environ.get('DATABASE_URL')
if not mongo_url:
    logging.warning("MONGO_URL or DATABASE_URL not set, using default localhost")
    mongo_url = "mongodb://localhost:27017"

db_name = os.environ.get('DB_NAME', 'ikigai')

client = AsyncIOMotorClient(mongo_url)
db = client[db_name]

JWT_SECRET = os.environ.get('JWT_SECRET', 'ikigai-sakura-sanctuary-2026')
JWT_ALG = 'HS256'

GROQ_API_KEY = os.environ.get('GROQ_API_KEY', '')
if not GROQ_API_KEY:
    logging.warning("GROQ_API_KEY not set — AI responses will use fallback text")
groq_client = Groq(api_key=GROQ_API_KEY) if GROQ_API_KEY else None

async def call_groq(prompt: str, fallback: str, max_tokens: int = 600) -> str:
    if not groq_client:
        return fallback
    try:
        response = await asyncio.to_thread(
            groq_client.chat.completions.create,
            model='llama-3.3-70b-versatile',
            messages=[{"role": "user", "content": prompt}],
            max_tokens=max_tokens,
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        logging.error(f"Groq error: {e}")
        return fallback

STATIC_DIR = ROOT_DIR / 'static'
STATIC_DIR.mkdir(exist_ok=True)
TREE_IMAGE_PATH = STATIC_DIR / 'sakura_tree.png'

app = FastAPI()
api_router = APIRouter(prefix="/api")

@app.get("/")
async def root():
    return {"app": "IKIGAI", "status": "blooming", "docs": "/docs"}


# ==================== HELPERS ====================
def hash_password(pw: str) -> str:
    return bcrypt.hashpw(pw.encode(), bcrypt.gensalt()).decode()

def verify_password(pw: str, hashed: str) -> bool:
    try:
        return bcrypt.checkpw(pw.encode(), hashed.encode())
    except Exception:
        return False

def create_token(user_id: str, role: str) -> str:
    payload = {
        "sub": user_id,
        "role": role,
        "exp": datetime.now(timezone.utc) + timedelta(days=30),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALG)

def gen_family_code() -> str:
    alpha = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(alpha) for _ in range(6))

async def get_current_user(authorization: Optional[str] = Header(None)) -> Dict[str, Any]:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Missing token")
    token = authorization.split(" ", 1)[1]
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALG])
    except jwt.PyJWTError:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": payload["sub"]}, {"_id": 0, "password": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user

async def require_teen(user: Dict = Depends(get_current_user)) -> Dict:
    if user.get("role") != "teen":
        raise HTTPException(status_code=403, detail="Teen account required")
    return user

async def require_parent(user: Dict = Depends(get_current_user)) -> Dict:
    if user.get("role") != "parent":
        raise HTTPException(status_code=403, detail="Parent account required")
    return user


# ==================== MODELS ====================
class SignupRequest(BaseModel):
    name: str
    email: EmailStr
    password: str
    role: str  # 'teen' or 'parent'

class LoginRequest(BaseModel):
    email: EmailStr
    password: str

class OnboardingPayload(BaseModel):
    age: Optional[int] = None
    grade: Optional[str] = None
    gender: Optional[str] = None
    country: Optional[str] = None
    hardest: Optional[str] = None
    wishDifferent: Optional[str] = None
    timeSpent: Optional[str] = None
    feeling: Optional[str] = None
    stressors: Optional[str] = None
    repeatingThoughts: Optional[str] = None
    # New iter 6 fields:
    lifeNow: Optional[str] = None       # "How's life right now?"
    oneMonthVision: Optional[str] = None  # "How do you want your life to be in one month?"
    growthPace: Optional[str] = "balanced"  # 'fast' (2w) | 'balanced' (4w) | 'gentle' (8w)
    goals: List[str] = []
    energy: Dict[str, int] = {}  # motivation, happiness, stress, focus, sleep, confidence (1-10)

class MoodDumpRequest(BaseModel):
    text: str
    areas: List[str] = []  # School, Friends, Family, Health, Confidence, Purpose, Hobbies
    image_base64: Optional[str] = None  # data URL or raw base64
    mood_score: Optional[int] = None    # 1-10 optional self-rating

class LifeMapEntryRequest(BaseModel):
    area: str  # one of LIFE_AREAS
    rating: int  # 1-10 how this area feels
    note: Optional[str] = None

class ProblemSolverRequest(BaseModel):
    problem: str  # e.g. "Can't focus"
    context: Optional[str] = None

class IdentitySaveRequest(BaseModel):
    section: str  # strengths | interests | values | longterm
    items: List[str]

class MissionCompleteRequest(BaseModel):
    mission_id: str

class SleepLogRequest(BaseModel):
    hours: float
    quality: int  # 1-10
    note: Optional[str] = None

class FitnessLogRequest(BaseModel):
    activity: str  # walk, run, sport, workout, yoga, dance
    minutes: int
    note: Optional[str] = None

class ScreenTimeLogRequest(BaseModel):
    hours: float
    note: Optional[str] = None

class FocusSessionRequest(BaseModel):
    minutes: int
    task: Optional[str] = None

class JournalEntryRequest(BaseModel):
    prompt: Optional[str] = ""
    response: str
    mood: Optional[str] = ""

class CoachMessageRequest(BaseModel):
    message: str
    session_id: Optional[str] = None

class FamilyLinkRequest(BaseModel):
    code: str

class CheckinRequest(BaseModel):
    mood: Optional[int] = None  # overall 1-10 (auto-computed from dims if absent)
    happiness: Optional[int] = None
    stress: Optional[int] = None
    motivation: Optional[int] = None
    energy: Optional[int] = None
    confidence: Optional[int] = None
    calmness: Optional[int] = None
    note: Optional[str] = None
    morning_mood: Optional[int] = None  # 1-10 morning mood slider
    night_mood: Optional[int] = None    # 1-10 night mood slider

class HabitProposeRequest(BaseModel):
    title: str
    why: Optional[str] = None  # user's reasoning / context

class HabitCompleteRequest(BaseModel):
    habit_id: str

class CBTRequest(BaseModel):
    thought: str
    context: Optional[str] = None

class SOSRequest(BaseModel):
    message: str

class KeepGoingRequest(BaseModel):
    message: Optional[str] = None  # what they're feeling right now (optional)

class TinyHabitRequest(BaseModel):
    mood: Optional[str] = None  # "down" | "unmotivated" | "anxious" | "stuck" | "overwhelmed"

class NegativeThoughtRequest(BaseModel):
    thought: str  # the negative thought to reframe


# ==================== AUTH ====================
@api_router.post("/auth/signup")
async def signup(req: SignupRequest):
    if req.role not in ("teen", "parent"):
        raise HTTPException(400, "Invalid role")
    existing = await db.users.find_one({"email": req.email.lower()})
    if existing:
        raise HTTPException(400, "Email already registered")
    user_id = str(uuid.uuid4())
    doc = {
        "id": user_id,
        "name": req.name,
        "email": req.email.lower(),
        "password": hash_password(req.password),
        "role": req.role,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "onboarded": False,
        "family_code": gen_family_code() if req.role == "teen" else None,
        "linked_teen_id": None,
        "streak": 0,
        "growth_score": 0,
        "tree_stage": "seed",
        "blossom_count": 0,
        "habits_completed": 0,
        "challenges_overcome": 0,
        "goals_completed": 0,
    }
    await db.users.insert_one(doc)
    token = create_token(user_id, req.role)
    safe = {k: v for k, v in doc.items() if k not in ("password", "_id")}
    return {"token": token, "user": safe}

@api_router.post("/auth/login")
async def login(req: LoginRequest):
    user = await db.users.find_one({"email": req.email.lower()})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(401, "Invalid email or password")
    token = create_token(user["id"], user["role"])
    user.pop("_id", None)
    user.pop("password", None)
    return {"token": token, "user": user}

@api_router.get("/auth/me")
async def me(user: Dict = Depends(get_current_user)):
    return user


# ==================== ONBOARDING ====================
@api_router.post("/onboarding")
async def submit_onboarding(payload: OnboardingPayload, user: Dict = Depends(require_teen)):
    profile = payload.model_dump()
    # Capture initial baseline mood snapshot for monthly comparison
    baseline = {
        "captured_at": datetime.now(timezone.utc).isoformat(),
        "energy": profile.get("energy", {}),
        "feeling": profile.get("feeling"),
        "stressors": profile.get("stressors"),
        "lifeNow": profile.get("lifeNow"),
        "oneMonthVision": profile.get("oneMonthVision"),
        "growthPace": profile.get("growthPace") or "balanced",
    }
    await db.users.update_one(
        {"id": user["id"]},
        {"$set": {"profile": profile, "onboarded": True, "baseline": baseline}}
    )
    return {"ok": True, "blueprint": {}}


@api_router.post("/plan/generate")
async def generate_plan_endpoint(user: Dict = Depends(require_teen)):
    """Generate (or re-generate) personalized plan from onboarding profile."""
    profile = user.get("profile", {})
    plan = {
        "weeks_count": 4,
        "pace": "balanced",
        "summary": "A gentle, doable plan to begin the next chapter — small, kind steps that fit your real life.",
        "weeks": [{"week": i+1, "theme": "Steady ground", "focus": "Small daily kindness toward yourself.",
                   "intentions": ["One mood note a day", "One small body kindness", "One honest reflection"]} for i in range(4)],
        "habits": [
            {"title": "One mood note daily", "why": "Tiny self-listening — supports your goals.", "cadence": "daily"},
            {"title": "Two-minute breath pause", "why": "Calms the system — supports steadier mood.", "cadence": "daily"},
            {"title": "Walk outside 10 min", "why": "Clears the mind — supports energy & focus.", "cadence": "3x-week"},
        ],
        "first_week_actions": ["Drop your first Mood Dump", "Mark today's mood", "Try one habit"],
        "signpost": "Mornings will feel a bit lighter, and choosing kindness toward yourself will feel slightly easier.",
    }
    await db.users.update_one({"id": user["id"]}, {"$set": {"plan": plan, "plan_generated_at": datetime.now(timezone.utc).isoformat()}})
    # Auto-seed AI-recommended habits (approved)
    suggested = plan.get("habits") or []
    seeded = []
    for h in suggested[:6]:
        title = (h.get("title") if isinstance(h, dict) else str(h)).strip()
        if not title:
            continue
        why = h.get("why", "") if isinstance(h, dict) else ""
        cadence = h.get("cadence", "daily") if isinstance(h, dict) else "daily"
        doc = {
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "title": title[:80],
            "why": why,
            "cadence": cadence,
            "source": "plan",
            "approved": True,
            "completions": 0,
            "created_at": datetime.now(timezone.utc).isoformat(),
        }
        await db.habits.insert_one(doc)
        doc.pop("_id", None)
        seeded.append(doc)
    return {"plan": plan, "seeded_habits": seeded}


@api_router.get("/plan")
async def get_plan(user: Dict = Depends(require_teen)):
    return {"plan": user.get("plan"), "generated_at": user.get("plan_generated_at")}


# ==================== MOOD DUMP ====================
@api_router.post("/mood-dump")
async def mood_dump(req: MoodDumpRequest, user: Dict = Depends(require_teen)):
    if not req.text.strip() and not req.image_base64:
        raise HTTPException(400, "Empty mood dump")

    name = user.get("name", "you")
    text = req.text or ""
    areas = ", ".join(req.areas) if req.areas else "general"
    profile = user.get("profile", {})
    goals = ", ".join(profile.get("goals", [])) if profile.get("goals") else ""

    fallback = {
        "themes": ["thoughtful", "tender", "reflective"],
        "emotions": ["thoughtful", "reflective"],
        "validation": "It took something to put this into words — that act alone is a form of care toward yourself.",
        "insight": "What you're feeling isn't a problem to solve. It's information from a part of you that deserves to be heard.",
        "perspective": "Most feelings pass when given space rather than resistance. You've already started that process by naming this.",
        "action": "Set a 3-minute timer, sit somewhere quiet, and just let this feeling exist without trying to fix it.",
        "suggestion": "Once a day, write one sentence about how you actually feel — not how you think you should feel.",
    }

    if groq_client and text.strip():
        prompt = (
            f"You are IKIGAI, a warm and insightful companion for a teen named {name}.\n"
            f"They have shared the following mood dump: \"{text}\"\n"
            f"Life areas they tagged: {areas}\n"
            + (f"Their personal goals: {goals}\n" if goals else "")
            + "\nAnalyze this with genuine empathy and return ONLY a raw JSON object (no markdown, no backticks, no extra text) with these exact keys:\n"
            "- \"themes\": list of 3 single-word emotional themes you detect (e.g. \"overwhelmed\", \"lonely\", \"hopeful\")\n"
            "- \"emotions\": list of 2-3 primary emotions beneath the surface of what they wrote\n"
            "- \"validation\": 2 sentences that specifically acknowledge what THEY wrote — name the exact feeling, don't be generic\n"
            "- \"insight\": 1 sentence revealing something they might not have noticed about their own pattern or feeling\n"
            "- \"perspective\": 1-2 sentences offering a realistic, honest reframe that respects how hard this actually is\n"
            "- \"action\": ONE specific, concrete action for the next 30 minutes that directly addresses what they shared — not generic advice\n"
            "- \"suggestion\": ONE small daily habit for the next few days that connects directly to what they need right now\n\n"
            "Be specific to their actual words. Avoid clichés. Give real help."
        )
        try:
            raw = await call_groq(prompt, "")
            if raw:
                analysis = json.loads(raw)
            else:
                analysis = fallback
        except Exception:
            analysis = fallback
    else:
        analysis = fallback

    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "text": req.text,
        "areas": req.areas,
        "mood_score": req.mood_score,
        "has_image": bool(req.image_base64),
        "analysis": analysis,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.mood_dumps.insert_one(doc)
    # Mood dump: small gentle blossom (it's emotional release, not a habit completion)
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"growth_score": 3, "blossom_count": 1}},
    )
    doc.pop("_id", None)
    return doc


@api_router.get("/mood-dump")
async def list_mood_dumps(user: Dict = Depends(require_teen)):
    items = await db.mood_dumps.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return items


# ==================== NEGATIVE THOUGHTS (CBT) ====================
@api_router.post("/mood-dump/negative-thoughts")
async def submit_negative_thought(req: NegativeThoughtRequest, user: Dict = Depends(require_teen)):
    """Submit a negative thought for CBT analysis."""
    if not req.thought.strip():
        raise HTTPException(400, "Share a thought to reframe")

    name = user.get("name", "you")
    thought = req.thought.strip()

    fallback = {
        "thought_pattern": "Overgeneralization",
        "challenge": f"Is this thought about this one moment, or are you applying it to everything about yourself?",
        "evidence_for": [
            "This thought feels completely true right now",
            "You have experienced moments that seem to support it",
        ],
        "evidence_against": [
            "There are specific times this thought wasn't true — even if they feel distant right now",
            "This thought describes a feeling, not a permanent fact about who you are",
            "A person who cares about you would likely see things very differently",
        ],
        "reframe": f"A more balanced version: this is a hard moment, not a permanent verdict. Thoughts like this show up when you're stressed or tired — they're your mind trying to protect you, not a forecast of your future.",
    }

    if groq_client:
        prompt = (
            f"You are IKIGAI, a CBT-trained companion for a teen named {name}.\n"
            f"They shared this negative thought: \"{thought}\"\n\n"
            "Apply CBT (Cognitive Behavioral Therapy) principles to this specific thought and return ONLY a raw JSON object (no markdown, no backticks) with these exact keys:\n"
            "- \"thought_pattern\": the precise cognitive distortion this thought represents. Choose the most accurate one from: "
            "All-or-nothing thinking, Overgeneralization, Mental filter, Disqualifying the positive, Mind reading, "
            "Fortune telling, Catastrophizing, Emotional reasoning, Should statements, Labeling, Personalization\n"
            "- \"challenge\": ONE direct Socratic question that specifically challenges THIS thought — make it feel personal, not textbook\n"
            "- \"evidence_for\": list of exactly 2 things the teen genuinely feels support this thought — acknowledge their reality with empathy\n"
            "- \"evidence_against\": list of exactly 3 specific counter-evidences or alternative perspectives for THIS exact thought\n"
            "- \"reframe\": A specific balanced alternative to their exact thought — not generic positivity, but a realistic, compassionate middle ground that they could actually believe\n\n"
            "Address their exact thought word for word. Do not give generic CBT templates."
        )
        try:
            raw = await call_groq(prompt, "")
            if raw:
                analysis = json.loads(raw)
            else:
                analysis = fallback
        except Exception:
            analysis = fallback
    else:
        analysis = fallback

    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "thought": req.thought,
        "analysis": analysis,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.negative_thoughts.insert_one(doc)
    # CBT work: growth contribution
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"growth_score": 5, "blossom_count": 1}},
    )
    doc.pop("_id", None)
    return doc


@api_router.get("/mood-dump/negative-thoughts")
async def list_negative_thoughts(user: Dict = Depends(require_teen)):
    """Get all reframed negative thoughts."""
    items = await db.negative_thoughts.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return items


# ==================== I'M NOT OKAY (Life Problems) ====================
@api_router.post("/mood-dump/im-not-okay")
async def im_not_okay(req: MoodDumpRequest, user: Dict = Depends(require_teen)):
    """Handle deep life problems with adapted support."""
    text = req.text or ""
    if not text.strip():
        raise HTTPException(400, "Share what's troubling you")

    name = user.get("name", "you")
    profile = user.get("profile", {})
    stressors = profile.get("stressors", "")

    fallback = {
        "validation": "You reached out, and that took real courage. Whatever is happening right now is real and it matters.",
        "today_actions": [
            "Right now: place both feet flat on the floor, take 3 slow breaths, and name 3 things you can see around you",
            "In the next hour: drink a full glass of water slowly and let yourself do absolutely nothing for 10 minutes",
        ],
        "habit_suggestion": "Each morning, write one sentence: 'Today I will be kind to myself by ___.' Keep it tiny and doable.",
        "reminder": "You don't have to fix everything today. You just have to get through today — and you're already doing that.",
    }

    if groq_client:
        prompt = (
            f"You are IKIGAI, a deeply compassionate companion for a teen named {name} who is struggling right now.\n"
            f"They shared: \"{text}\"\n"
            + (f"Background context about them: {stressors}\n" if stressors else "")
            + "\nThis is serious — they need REAL help, not platitudes. Give them practical support.\n\n"
            "Return ONLY a raw JSON object (no markdown, no backticks) with these exact keys:\n"
            "- \"validation\": 2-3 sentences that specifically reflect back what THEY described — name the exact situation they're in. Make them feel truly heard, not just 'validated'.\n"
            "- \"today_actions\": list of exactly 3 concrete actions for RIGHT NOW or the next few hours — be specific, sequential, and realistic for someone who is struggling. Include one grounding technique, one basic self-care, and one small social or reaching-out step.\n"
            "- \"habit_suggestion\": ONE small daily habit (under 5 minutes) that directly addresses the root of what they shared — not generic\n"
            "- \"reminder\": ONE honest, hopeful sentence that feels true rather than hollow — avoid clichés\n\n"
            "Do not give generic wellness advice. Respond to what they actually wrote."
        )
        try:
            raw = await call_groq(prompt, "")
            analysis = json.loads(raw) if raw else fallback
        except Exception:
            analysis = fallback
    else:
        analysis = fallback

    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "problem": text,
        "context": None,
        "analysis": analysis,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.not_okay_entries.insert_one(doc)
    # Deep support: significant growth
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"growth_score": 10, "blossom_count": 2}},
    )
    doc.pop("_id", None)
    return doc


@api_router.get("/mood-dump/im-not-okay")
async def list_not_okay(user: Dict = Depends(require_teen)):
    """Get all 'I'm not okay' entries and AI responses."""
    items = await db.not_okay_entries.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return items


# ==================== JOURNAL ====================
@api_router.get("/journal/prompts")
async def journal_prompts(user: Dict = Depends(require_teen)):
    return [
        {"category": "reflection", "prompt": "What's one moment from today that felt more meaningful than it looked?"},
        {"category": "gratitude", "prompt": "Who or what gave you a small spark of joy this week — even briefly?"},
        {"category": "growth", "prompt": "What would the kindest version of yourself whisper to you right now?"},
    ]


@api_router.post("/journal/entries")
async def create_journal(req: JournalEntryRequest, user: Dict = Depends(require_teen)):
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "prompt": req.prompt or "",
        "response": req.response,
        "mood": req.mood or "",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.journal_entries.insert_one(doc)
    # Journal = deep reflection — 1 blossom per entry
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"growth_score": 8, "blossom_count": 1, "habits_completed": 1}},
    )
    doc.pop("_id", None)
    return doc


@api_router.get("/journal/entries")
async def list_journal(user: Dict = Depends(require_teen)):
    items = await db.journal_entries.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return items


# ==================== AI COACH (SIMPLE MODE - No streaming) ====================
@api_router.post("/coach/chat")
async def coach_chat(req: CoachMessageRequest, user: Dict = Depends(require_teen)):
    session_id = req.session_id or f"coach-{user['id']}"
    
    # Save user message
    await db.coach_messages.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "session_id": session_id,
        "role": "user",
        "content": req.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })

    name = user.get("name", "you")
    profile = user.get("profile", {})
    goals = ", ".join(profile.get("goals", [])) if profile.get("goals") else ""
    life_now = profile.get("lifeNow", "")
    vision = profile.get("oneMonthVision", "")

    history = await db.coach_messages.find(
        {"user_id": user["id"], "session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(20)
    history_text = "\n".join(f"{m['role'].upper()}: {m['content']}" for m in history[:-1])

    context_lines = []
    if goals:
        context_lines.append(f"Their goals: {goals}")
    if life_now:
        context_lines.append(f"Their current life situation: {life_now[:300]}")
    if vision:
        context_lines.append(f"Their one-month vision: {vision[:200]}")
    context_block = "\n".join(context_lines)

    prompt = (
        f"You are IKIGAI, a compassionate and real companion for a teen named {name}.\n"
        + (context_block + "\n" if context_block else "")
        + "\nYour role is NOT to just be a chatbot — you're here to give REAL help. Rules:\n"
        "- Respond DIRECTLY to what they just said — no generic platitudes\n"
        "- If they're in distress, validate their feeling in one sentence, then offer ONE concrete strategy or micro-action\n"
        "- If they share a thought or situation, reflect it back accurately and ask ONE sharp, Socratic question to help them see it more clearly\n"
        "- If they share progress, celebrate it briefly and help them build on it\n"
        "- Use 2-4 sentences max. Never lecture. Never list bullet points. Sound like a wise older friend, not a therapist.\n"
        "- Do NOT say 'I understand how you feel', 'that must be hard', or repeat what they said verbatim.\n"
        "- If they're going in circles, gently call it out: 'You've mentioned this a few times — what would change if you let yourself decide right now?'\n"
        + (f"\nConversation so far:\n{history_text}\n" if history_text else "")
        + f"\nUSER: {req.message}\nIKIGAI:"
    )
    response_text = await call_groq(prompt, "I'm here with you. What feels most pressing right now?")
    
    # Save response
    await db.coach_messages.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "session_id": session_id,
        "role": "assistant",
        "content": response_text,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    
    return {"response": response_text}


@api_router.get("/coach/history")
async def coach_history(session_id: Optional[str] = None, user: Dict = Depends(require_teen)):
    sid = session_id or f"coach-{user['id']}"
    items = await db.coach_messages.find(
        {"user_id": user["id"], "session_id": sid}, {"_id": 0}
    ).sort("created_at", 1).to_list(200)
    return items


# ==================== KEEP GOING (Motivation & Reflection) ====================
@api_router.post("/keep-going/chat")
async def keep_going_chat(req: CoachMessageRequest, user: Dict = Depends(require_teen)):
    """When a teen wants to quit: reflective questions about why they started, progress made."""
    session_id = req.session_id or f"keep-going-{user['id']}"
    
    # Save user message
    await db.keep_going_messages.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "session_id": session_id,
        "role": "user",
        "content": req.message,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    
    history = await db.keep_going_messages.find(
        {"user_id": user["id"], "session_id": session_id}, {"_id": 0}
    ).sort("created_at", 1).to_list(20)
    history_text = "\n".join(f"{m['role'].upper()}: {m['content']}" for m in history[:-1])
    prompt = (
        "You are a compassionate motivational coach for teens named IKIGAI. "
        "The teen is struggling and wants to give up. Help them reconnect with their 'why'. "
        "Keep responses short (2-4 sentences), warm, and never dismissive. Do not repeat the same response.\n\n"
        f"Conversation so far:\n{history_text}\n\nUSER: {req.message}\nASSISTANT:"
    )
    response_text = await call_groq(prompt, "Wanting to quit doesn't mean you're failing — it means you're tired. Both can be true. What did you hope would feel different when you started?")
    
    # Save response
    await db.keep_going_messages.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "session_id": session_id,
        "role": "assistant",
        "content": response_text,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    
    return {"response": response_text}


@api_router.get("/keep-going/history")
async def keep_going_history(session_id: Optional[str] = None, user: Dict = Depends(require_teen)):
    """Get keep going conversation history."""
    sid = session_id or f"keep-going-{user['id']}"
    items = await db.keep_going_messages.find(
        {"user_id": user["id"], "session_id": sid}, {"_id": 0}
    ).sort("created_at", 1).to_list(200)
    return items


# ==================== DAILY CHECK-IN / TREE ====================
@api_router.post("/checkin")
async def checkin(req: CheckinRequest, user: Dict = Depends(require_teen)):
    today = datetime.now(timezone.utc).date().isoformat()
    # Build dims dict (only set values)
    dims = {}
    for k in ("happiness", "stress", "motivation", "energy", "confidence", "calmness"):
        v = getattr(req, k)
        if v is not None:
            dims[k] = max(1, min(10, int(v)))
    # Overall mood: explicit, else avg of "positive" dims (stress inverted)
    if req.mood is not None:
        overall = max(1, min(10, int(req.mood)))
    elif dims:
        positives = [dims.get("happiness"), dims.get("motivation"), dims.get("energy"),
                     dims.get("confidence"), dims.get("calmness")]
        positives = [p for p in positives if p is not None]
        stress_inv = (11 - dims["stress"]) if "stress" in dims else None
        if stress_inv is not None:
            positives.append(stress_inv)
        overall = round(sum(positives) / len(positives)) if positives else 5
    else:
        overall = 5

    existing = await db.checkins.find_one({"user_id": user["id"], "date": today})
    payload = {"mood": overall, "dims": dims, "note": req.note}
    
    # Add morning/night mood if provided
    if req.morning_mood is not None:
        payload["morning_mood"] = max(1, min(10, int(req.morning_mood)))
    if req.night_mood is not None:
        payload["night_mood"] = max(1, min(10, int(req.night_mood)))
    
    if existing:
        await db.checkins.update_one(
            {"user_id": user["id"], "date": today},
            {"$set": payload}
        )
    else:
        await db.checkins.insert_one({
            "id": str(uuid.uuid4()),
            "user_id": user["id"],
            "date": today,
            **payload,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
        await db.users.update_one(
            {"id": user["id"]},
            {"$inc": {"streak": 1, "growth_score": 2}}
        )
    return {"ok": True, "mood": overall, "dims": dims, "morning_mood": payload.get("morning_mood"), "night_mood": payload.get("night_mood")}


@api_router.get("/checkin/today")
async def checkin_today(user: Dict = Depends(require_teen)):
    today = datetime.now(timezone.utc).date().isoformat()
    c = await db.checkins.find_one({"user_id": user["id"], "date": today}, {"_id": 0})
    return {"checked_in": bool(c), "checkin": c}


@api_router.get("/checkin/recent")
async def checkin_recent(user: Dict = Depends(require_teen)):
    items = await db.checkins.find({"user_id": user["id"]}, {"_id": 0}).sort("date", -1).to_list(14)
    return items


# ---- 7-stage tree ladder ----
TREE_STAGES = [
    ("seed", 0),
    ("sprout", 1),
    ("seedling", 5),
    ("growing", 12),
    ("mature", 25),
    ("blooming", 50),
    ("radiant", 100),
]

def stage_for_blossoms(blossoms: int) -> str:
    out = "seed"
    for name, thr in TREE_STAGES:
        if blossoms >= thr:
            out = name
    return out


@api_router.get("/tree/state")
async def tree_state(user: Dict = Depends(require_teen)):
    blossoms = user.get("blossom_count", 0)
    stage = stage_for_blossoms(blossoms)
    # "Resting" hint when last 7 days avg mood is low or no recent check-ins
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()[:10]
    checkins = await db.checkins.find(
        {"user_id": user["id"], "date": {"$gte": week_ago}}, {"_id": 0}
    ).to_list(14)
    moods = [c.get("mood") for c in checkins if c.get("mood")]
    resting = (len(checkins) == 0) or (moods and sum(moods)/len(moods) < 4.0)
    await db.users.update_one({"id": user["id"]}, {"$set": {"tree_stage": stage}})
    return {
        "stage": stage,
        "blossom_count": blossoms,
        "growth_score": user.get("growth_score", 0),
        "streak": user.get("streak", 0),
        "resting": bool(resting),
        "next_stage": next((s for s, t in TREE_STAGES if t > blossoms), None),
        "next_stage_at": next((t for s, t in TREE_STAGES if t > blossoms), None),
    }


# ==================== TREE IMAGE ====================
@api_router.get("/tree/image")
async def get_tree_image():
    if TREE_IMAGE_PATH.exists():
        return FileResponse(TREE_IMAGE_PATH, media_type="image/png")
    # Fallback redirect to Pexels reference
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url="https://images.pexels.com/photos/22619493/pexels-photo-22619493.jpeg")


@api_router.post("/tree/regenerate")
async def regenerate_tree(user: Dict = Depends(require_teen)):
    if TREE_IMAGE_PATH.exists():
        TREE_IMAGE_PATH.unlink()
    return {"ok": True}


# ==================== HEALTH ====================
@api_router.get("/health")
async def health():
    return {"app": "IKIGAI", "status": "blooming"}


# ==================== FAMILY LINKING ====================
@api_router.get("/family/code")
async def family_code(user: Dict = Depends(require_teen)):
    code = user.get("family_code") or gen_family_code()
    await db.users.update_one({"id": user["id"]}, {"$set": {"family_code": code}})
    return {"code": code}


@api_router.post("/family/link")
async def family_link(req: FamilyLinkRequest, user: Dict = Depends(require_parent)):
    teen = await db.users.find_one({"family_code": req.code.upper().strip(), "role": "teen"})
    if not teen:
        raise HTTPException(404, "Invalid family code")
    await db.users.update_one({"id": user["id"]}, {"$set": {"linked_teen_id": teen["id"]}})
    return {"ok": True, "teen_name": teen["name"]}


# ==================== PARENT DASHBOARD ====================
@api_router.get("/parent/overview")
async def parent_overview(user: Dict = Depends(require_parent)):
    teen_id = user.get("linked_teen_id")
    if not teen_id:
        return {"linked": False}
    teen = await db.users.find_one({"id": teen_id}, {"_id": 0, "password": 0})
    if not teen:
        return {"linked": False}
    
    # Get 14 days of data for trend and weekly analysis
    checkins = await db.checkins.find({"user_id": teen_id}, {"_id": 0}).sort("date", -1).to_list(14)
    
    # Mood trend (averages, not individual notes/contents)
    moods = [c["mood"] for c in checkins]
    avg_mood = round(sum(moods) / len(moods), 1) if moods else None
    
    # Count of journal/mood activity (NOT contents)
    journal_count = await db.journal_entries.count_documents({"user_id": teen_id})
    mood_dump_count = await db.mood_dumps.count_documents({"user_id": teen_id})
    
    # Mental behavior analysis - stress, energy, motivation patterns
    dims_data = [c.get("dims", {}) for c in checkins if c.get("dims")]
    mental_behavior = {
        "stress_avg": None,
        "energy_avg": None,
        "motivation_avg": None,
        "confidence_avg": None,
    }
    if dims_data:
        stresses = [d.get("stress") for d in dims_data if d.get("stress")]
        energies = [d.get("energy") for d in dims_data if d.get("energy")]
        motivations = [d.get("motivation") for d in dims_data if d.get("motivation")]
        confidences = [d.get("confidence") for d in dims_data if d.get("confidence")]
        
        mental_behavior["stress_avg"] = round(sum(stresses) / len(stresses), 1) if stresses else None
        mental_behavior["energy_avg"] = round(sum(energies) / len(energies), 1) if energies else None
        mental_behavior["motivation_avg"] = round(sum(motivations) / len(motivations), 1) if motivations else None
        mental_behavior["confidence_avg"] = round(sum(confidences) / len(confidences), 1) if confidences else None
    
    # Weekly report: this week vs last week comparison
    today = datetime.now(timezone.utc).date()
    week_start = today - timedelta(days=today.weekday())  # Monday of this week
    last_week_start = week_start - timedelta(days=7)
    
    this_week_checkins = await db.checkins.find(
        {"user_id": teen_id, "date": {"$gte": week_start.isoformat()}}, {"_id": 0}
    ).to_list(7)
    last_week_checkins = await db.checkins.find(
        {"user_id": teen_id, "date": {"$gte": last_week_start.isoformat(), "$lt": week_start.isoformat()}}, {"_id": 0}
    ).to_list(7)
    
    this_week_moods = [c["mood"] for c in this_week_checkins if c.get("mood")]
    last_week_moods = [c["mood"] for c in last_week_checkins if c.get("mood")]
    
    this_week_avg = round(sum(this_week_moods) / len(this_week_moods), 1) if this_week_moods else None
    last_week_avg = round(sum(last_week_moods) / len(last_week_moods), 1) if last_week_moods else None
    
    # Trend analysis
    trend_direction = "stable"
    if this_week_avg is not None and last_week_avg is not None:
        diff = this_week_avg - last_week_avg
        if diff > 1.0:
            trend_direction = "improving"
        elif diff < -1.0:
            trend_direction = "declining"
    
    # Weekly engagement
    this_week_missions = await db.missions.count_documents({
        "user_id": teen_id,
        "date": {"$gte": week_start.isoformat()}
    })
    this_week_reflections = await db.mood_dumps.count_documents({
        "user_id": teen_id,
        "created_at": {"$gte": week_start.isoformat() + "T00:00:00Z"}
    })
    
    weekly_report = {
        "week_start": week_start.isoformat(),
        "this_week_avg_mood": this_week_avg,
        "last_week_avg_mood": last_week_avg,
        "trend": trend_direction,
        "checkins_this_week": len(this_week_checkins),
        "missions_completed": this_week_missions,
        "reflections": this_week_reflections,
    }
    
    return {
        "linked": True,
        "teen_name": teen["name"],
        "wellbeing_score": teen.get("growth_score", 0),
        "streak": teen.get("streak", 0),
        "tree_stage": teen.get("tree_stage", "seedling"),
        "avg_mood_14d": avg_mood,
        "mood_trend": [{"date": c["date"], "mood": c["mood"]} for c in checkins],
        "journal_count": journal_count,
        "mood_dump_count": mood_dump_count,
        "blossoms": teen.get("blossom_count", 0),
        "habits_completed": teen.get("habits_completed", 0),
        "challenges_overcome": teen.get("challenges_overcome", 0),
        "goals_completed": teen.get("goals_completed", 0),
        "mental_behavior": mental_behavior,
        "weekly_report": weekly_report,
    }


# ==================== LIFE MAP ====================
LIFE_AREAS = ["School", "Friends", "Family", "Health", "Confidence", "Purpose", "Hobbies"]

@api_router.get("/life-map/areas")
async def life_map_areas():
    return {"areas": LIFE_AREAS}

@api_router.post("/life-map/entry")
async def life_map_entry(req: LifeMapEntryRequest, user: Dict = Depends(require_teen)):
    if req.area not in LIFE_AREAS:
        raise HTTPException(400, "Unknown area")
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "area": req.area,
        "rating": max(1, min(10, req.rating)),
        "note": req.note,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.life_map.insert_one(doc)
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"growth_score": 2, "blossom_count": 1, "habits_completed": 1}},
    )
    doc.pop("_id", None)
    return doc

@api_router.get("/life-map/summary")
async def life_map_summary(user: Dict = Depends(require_teen)):
    entries = await db.life_map.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(200)
    by_area: Dict[str, List[Dict]] = {a: [] for a in LIFE_AREAS}
    for e in entries:
        by_area.setdefault(e["area"], []).append(e)
    summary = []
    for area in LIFE_AREAS:
        lst = by_area.get(area, [])
        avg = round(sum(x["rating"] for x in lst) / len(lst), 1) if lst else None
        recent = lst[:5]
        summary.append({
            "area": area,
            "avg": avg,
            "count": len(lst),
            "recent": recent,
        })
    return {"summary": summary, "areas": LIFE_AREAS}

@api_router.get("/life-map/patterns")
async def life_map_patterns(user: Dict = Depends(require_teen)):
    """Recurring themes & patterns detected from life map and mood data."""
    entries = await db.life_map.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    mood_dumps = await db.mood_dumps.find({"user_id": user["id"]}, {"_id": 0, "text": 1, "areas": 1}).sort("created_at", -1).to_list(30)
    if not entries and not mood_dumps:
        return {"patterns": [], "areas_to_water": []}

    name = user.get("name", "you")
    profile = user.get("profile", {})
    goals = ", ".join(profile.get("goals", [])) if profile.get("goals") else ""

    areas_data: dict = {}
    for e in entries:
        area = e.get("area", "")
        score = e.get("score", 5)
        note = e.get("note", "")
        if area:
            if area not in areas_data:
                areas_data[area] = {"scores": [], "notes": []}
            areas_data[area]["scores"].append(score)
            if note:
                areas_data[area]["notes"].append(note[:100])

    areas_summary = "; ".join(
        f"{area}: avg score {sum(v['scores'])/len(v['scores']):.1f}/10, notes: {', '.join(v['notes'][:2])}"
        for area, v in areas_data.items()
    )
    mood_texts = [m.get("text", "")[:150] for m in mood_dumps if m.get("text")]
    mood_summary = " | ".join(mood_texts[:10])

    fallback = {"patterns": [], "areas_to_water": []}
    if not groq_client:
        return fallback

    prompt = (
        f"You are IKIGAI, a compassionate wellness companion for a teen named {name}.\n"
        f"Life map data (area scores and notes):\n{areas_summary or 'No data yet.'}\n"
        f"Recent mood entries:\n{mood_summary or 'No entries yet.'}\n"
        + (f"Their stated goals: {goals}\n" if goals else "")
        + "\nAnalyze for genuine patterns — things that repeat, correlate, or stand out.\n"
        "Return ONLY a raw JSON object (no markdown, no backticks) with these keys:\n"
        "- \"patterns\": list of 2-4 pattern objects, each with:\n"
        "  - \"title\": short name for the pattern (e.g. 'Social energy drains fast')\n"
        "  - \"insight\": 1-2 sentences describing the pattern in a human, non-clinical way\n"
        "  - \"suggestion\": ONE specific, actionable suggestion for this pattern\n"
        "- \"areas_to_water\": list of 1-3 life areas that seem neglected or low-scoring, each as a string\n\n"
        "If data is insufficient, return fewer patterns (even just 1-2). Do not fabricate patterns from no data."
    )
    try:
        raw = await call_groq(prompt, "")
        if raw:
            data = json.loads(raw)
            return data
        return fallback
    except Exception:
        return fallback


# ==================== PROBLEM SOLVER ====================
PROBLEMS = [
    {"id": "overthinking", "label": "Overthinking", "emoji": "🌀"},
    {"id": "anxiety", "label": "Anxiety", "emoji": "🌫️"},
    {"id": "motivation", "label": "Motivation", "emoji": "🌧️"},
    {"id": "loneliness", "label": "Loneliness", "emoji": "🌑"},
    {"id": "friendship", "label": "Friendship Issues", "emoji": "💔"},
    {"id": "family", "label": "Family Issues", "emoji": "🏠"},
    {"id": "burnout", "label": "Burnout", "emoji": "🍂"},
    {"id": "school-stress", "label": "School Stress", "emoji": "📚"},
    {"id": "confidence", "label": "Confidence Problems", "emoji": "🪞"},
]

@api_router.get("/problem-solver/problems")
async def list_problems():
    return PROBLEMS

@api_router.post("/problem-solver/solve")
async def solve_problem(req: ProblemSolverRequest, user: Dict = Depends(require_teen)):
    name = user.get("name", "you")
    problem = req.problem.strip()
    context = req.context or ""
    profile = user.get("profile", {})
    goals = ", ".join(profile.get("goals", [])) if profile.get("goals") else ""

    fallback = {
        "happening": f"You're dealing with {problem} — and that's genuinely hard, not just in your head.",
        "why": "This kind of challenge is real and common for teens. Your brain is still developing its stress-response systems, which makes everything feel more intense.",
        "control": [
            "The exact words you use when you talk to yourself about this",
            "Your next one action, however small",
            "Whether you sleep, eat, and move your body today",
        ],
        "action_today": "Write down the single smallest step you could take today — not the whole solution, just the first inch. Then do only that.",
        "longterm": "Sustainable change happens through small, consistent choices rather than big heroic efforts. One kind thing a day adds up.",
        "reframe": f"Struggling with {problem} doesn't define you. It tells you something needs attention — and you're already giving it attention by being here.",
        "today": [
            "Name the problem out loud or in writing — clarity reduces anxiety",
            "Do the single smallest useful thing you can think of right now",
        ],
        "this_week": [
            "Track what makes this better or worse — patterns will emerge",
            "Tell one trusted person what you're working through",
        ],
    }

    if groq_client:
        prompt = (
            f"You are IKIGAI, a practical and compassionate problem-solving companion for a teen named {name}.\n"
            f"They are dealing with: {problem}\n"
            + (f"Additional context they shared: {context}\n" if context else "")
            + (f"Their goals: {goals}\n" if goals else "")
            + "\nGive them a REAL, actionable playbook — not generic wellness tips. Use evidence-based strategies.\n\n"
            "Return ONLY a raw JSON object (no markdown, no backticks) with these exact keys:\n"
            "- \"happening\": 2 sentences explaining what is actually going on psychologically/socially when someone faces this specific problem — normalize it without dismissing it\n"
            "- \"why\": 2 sentences on WHY this happens — the real underlying cause (not just 'stress is hard')\n"
            "- \"control\": list of exactly 3 specific things they CAN control about this situation right now\n"
            "- \"action_today\": ONE very specific action for TODAY that directly addresses this problem — be concrete, not vague\n"
            "- \"longterm\": 2 sentences on what actually works long-term for this specific issue, based on what helps people in this situation\n"
            "- \"reframe\": ONE honest, non-cliché way of seeing this situation that gives perspective without dismissing the difficulty\n"
            "- \"today\": list of 2-3 concrete steps for today, in order — actionable and specific\n"
            "- \"this_week\": list of 2-3 strategies for this week that build on today's actions\n\n"
            f"Make every answer specific to '{problem}' — not generic mental health advice."
        )
        try:
            raw = await call_groq(prompt, "")
            if raw:
                data = json.loads(raw)
            else:
                data = fallback
        except Exception:
            data = fallback
    else:
        data = fallback

    # save
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "problem": req.problem,
        "context": req.context,
        "playbook": data,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.problem_solver.insert_one(doc)
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"growth_score": 4, "blossom_count": 1, "challenges_overcome": 1}},
    )
    doc.pop("_id", None)
    return doc

@api_router.get("/problem-solver/history")
async def problem_history(user: Dict = Depends(require_teen)):
    items = await db.problem_solver.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)
    return items


# ==================== IDENTITY BUILDER ====================
IDENTITY_SECTIONS = ["strengths", "interests", "values", "longterm"]

@api_router.get("/identity")
async def get_identity(user: Dict = Depends(require_teen)):
    doc = await db.identity.find_one({"user_id": user["id"]}, {"_id": 0})
    if not doc:
        return {"strengths": [], "interests": [], "values": [], "longterm": []}
    return doc

@api_router.post("/identity")
async def save_identity(req: IdentitySaveRequest, user: Dict = Depends(require_teen)):
    if req.section not in IDENTITY_SECTIONS:
        raise HTTPException(400, "Unknown section")
    existing = await db.identity.find_one({"user_id": user["id"]})
    if existing:
        await db.identity.update_one({"user_id": user["id"]}, {"$set": {req.section: req.items}})
    else:
        await db.identity.insert_one({
            "user_id": user["id"],
            "strengths": [], "interests": [], "values": [], "longterm": [],
            req.section: req.items,
            "created_at": datetime.now(timezone.utc).isoformat(),
        })
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"growth_score": 5, "blossom_count": 1, "goals_completed": 1}},
    )
    return {"ok": True}

@api_router.post("/identity/suggest")
async def identity_suggest(user: Dict = Depends(require_teen)):
    """AI suggests possible identity traits based on profile, journals, and mood dumps."""
    name = user.get("name", "you")
    profile = user.get("profile", {})
    goals = ", ".join(profile.get("goals", [])) if profile.get("goals") else ""
    life_now = profile.get("lifeNow", "")
    vision = profile.get("oneMonthVision", "")

    journals = await db.journal_entries.find({"user_id": user["id"]}, {"_id": 0, "response": 1, "prompt": 1}).sort("created_at", -1).to_list(5)
    journal_text = " | ".join(j.get("response", j.get("prompt", ""))[:300] for j in journals if j.get("response") or j.get("prompt"))

    mood_dumps = await db.mood_dumps.find({"user_id": user["id"]}, {"_id": 0, "text": 1, "areas": 1}).sort("created_at", -1).to_list(5)
    mood_text = " | ".join(m.get("text", "")[:200] for m in mood_dumps if m.get("text"))

    context_parts = []
    if journal_text:
        context_parts.append(f"Journal entries: {journal_text}")
    if mood_text:
        context_parts.append(f"Recent emotional entries: {mood_text}")
    if goals:
        context_parts.append(f"Their stated goals: {goals}")
    if life_now:
        context_parts.append(f"Their life right now: {life_now[:200]}")
    if vision:
        context_parts.append(f"Their one-month vision: {vision[:200]}")
    context_str = "\n".join(context_parts) if context_parts else "No data yet — suggest encouraging possibilities based on who a thoughtful, self-aware teen might be."

    prompt = (
        f"You are IKIGAI, helping a teen named {name} discover their identity.\n"
        f"Based on everything you know about them:\n{context_str}\n\n"
        "Suggest identity traits that FEEL true to THEM — not generic. "
        "Strengths should reflect how they actually show up in life. "
        "Interests should be specific (not just 'music' but 'using music to process emotions'). "
        "Values should name what matters most to them. "
        "Long-term should be aspirational but rooted in who they're becoming.\n\n"
        "Return ONLY a raw JSON object (no markdown, no backticks) with these exact keys:\n"
        "- \"strengths\": list of 3 specific, affirming strength statements (not single words — full phrases like 'You notice what others miss')\n"
        "- \"interests\": list of 3 specific interest descriptions (not just labels — e.g. 'Exploring how emotions show up in creative writing')\n"
        "- \"values\": list of 3 specific values with brief why (e.g. 'Honesty — you'd rather feel the truth than a comfortable lie')\n"
        "- \"longterm\": list of 2 aspirational long-term visions that feel personal to them\n\n"
        "Make every suggestion feel like it was written for THIS person, not a generic teen."
    )
    fallback = {
        "strengths": ["You notice what others miss — your inner world runs deep", "Quiet courage: you keep showing up even when it's hard", "Empathy that makes people feel genuinely seen"],
        "interests": ["Processing emotions through creative expression", "Understanding why people think and feel the way they do", "Building things — ideas, art, connections — that didn't exist before"],
        "values": ["Honesty — you'd rather feel the truth than a comfortable lie", "Growth — staying still feels like going backwards", "Connection — real connection, not just presence"],
        "longterm": ["Build a life that feels like yours, not a version of someone else's expectations", "Be someone whose presence makes others feel less alone"],
    }
    try:
        raw = await call_groq(prompt, "")
        if raw:
            data = json.loads(raw)
            return data
        return fallback
    except Exception:
        return fallback


# ==================== MISSIONS ====================
DEFAULT_MISSIONS = [
    {"id": "walk-10", "label": "Walk for 10 minutes outside", "icon": "🚶"},
    {"id": "kind-1", "label": "Compliment someone genuinely", "icon": "💗"},
    {"id": "read-5", "label": "Read 5 pages of anything", "icon": "📖"},
    {"id": "breath-3", "label": "Three slow breaths by a window", "icon": "🫧"},
    {"id": "screen-off", "label": "Phone away during a meal", "icon": "📵"},
    {"id": "water-3", "label": "Drink 3 glasses of water", "icon": "💧"},
    {"id": "tidy-5", "label": "Tidy your space for 5 minutes", "icon": "🌿"},
    {"id": "stretch", "label": "Stretch for 3 minutes", "icon": "🧘"},
]

@api_router.get("/missions/today")
async def missions_today(user: Dict = Depends(require_teen)):
    today = datetime.now(timezone.utc).date().isoformat()
    completed = await db.missions.find({"user_id": user["id"], "date": today}, {"_id": 0}).to_list(20)
    done_ids = {c["mission_id"] for c in completed}
    # deterministic daily set: rotate by date
    day_idx = int(datetime.now(timezone.utc).strftime("%j"))
    picks = [DEFAULT_MISSIONS[(day_idx + i) % len(DEFAULT_MISSIONS)] for i in range(5)]
    seen = set(); unique = []
    for p in picks:
        if p["id"] in seen: continue
        seen.add(p["id"]); unique.append({**p, "done": p["id"] in done_ids})
    return {"date": today, "missions": unique}

@api_router.post("/missions/complete")
async def complete_mission(req: MissionCompleteRequest, user: Dict = Depends(require_teen)):
    today = datetime.now(timezone.utc).date().isoformat()
    existing = await db.missions.find_one({"user_id": user["id"], "date": today, "mission_id": req.mission_id})
    if existing:
        return {"ok": True, "already": True}
    await db.missions.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "mission_id": req.mission_id,
        "date": today,
        "created_at": datetime.now(timezone.utc).isoformat(),
    })
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"growth_score": 4, "blossom_count": 1, "habits_completed": 1}}
    )
    return {"ok": True}


# ==================== INSIGHTS ====================
@api_router.get("/insights/overview")
async def insights_overview(user: Dict = Depends(require_teen)):
    checkins = await db.checkins.find({"user_id": user["id"]}, {"_id": 0}).sort("date", -1).to_list(30)
    life_entries = await db.life_map.find({"user_id": user["id"]}, {"_id": 0}).to_list(500)
    missions = await db.missions.find({"user_id": user["id"]}, {"_id": 0}).to_list(500)
    # mood trend
    mood_trend = [{"date": c["date"], "mood": c["mood"]} for c in reversed(checkins)]
    # area averages
    by_area: Dict[str, List[int]] = {}
    for e in life_entries:
        by_area.setdefault(e["area"], []).append(e["rating"])
    area_avgs = [{"area": a, "avg": round(sum(v)/len(v), 1), "count": len(v)} for a, v in by_area.items()]
    area_avgs.sort(key=lambda x: x["avg"] or 0, reverse=True)
    # mission consistency (last 14 days)
    today = datetime.now(timezone.utc).date()
    days_set = {(today - timedelta(days=i)).isoformat() for i in range(14)}
    days_with_mission = len({m["date"] for m in missions if m["date"] in days_set})
    consistency = round(days_with_mission / 14 * 100)
    # avg mood
    avg_mood = round(sum(c["mood"] for c in checkins) / len(checkins), 1) if checkins else None
    return {
        "mood_trend": mood_trend,
        "avg_mood": avg_mood,
        "area_avgs": area_avgs,
        "consistency_pct": consistency,
        "missions_completed": len(missions),
        "growth_score": user.get("growth_score", 0),
        "blossoms": user.get("blossom_count", 0),
        "streak": user.get("streak", 0),
    }


# ==================== WELLNESS (Sleep / Fitness / Screen-time) ====================
@api_router.post("/wellness/sleep")
async def log_sleep(req: SleepLogRequest, user: Dict = Depends(require_teen)):
    doc = {"id": str(uuid.uuid4()), "user_id": user["id"], "hours": req.hours, "quality": req.quality,
           "note": req.note, "date": datetime.now(timezone.utc).date().isoformat(),
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.sleep_logs.insert_one(doc)
    await db.users.update_one({"id": user["id"]}, {"$inc": {"growth_score": 2, "blossom_count": 1, "habits_completed": 1}})
    doc.pop("_id", None); return doc

@api_router.get("/wellness/sleep")
async def list_sleep(user: Dict = Depends(require_teen)):
    return await db.sleep_logs.find({"user_id": user["id"]}, {"_id": 0}).sort("date", -1).to_list(30)

@api_router.post("/wellness/fitness")
async def log_fitness(req: FitnessLogRequest, user: Dict = Depends(require_teen)):
    doc = {"id": str(uuid.uuid4()), "user_id": user["id"], "activity": req.activity, "minutes": req.minutes,
           "note": req.note, "date": datetime.now(timezone.utc).date().isoformat(),
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.fitness_logs.insert_one(doc)
    await db.users.update_one({"id": user["id"]}, {"$inc": {"growth_score": 3, "blossom_count": 1, "habits_completed": 1}})
    doc.pop("_id", None); return doc

@api_router.get("/wellness/fitness")
async def list_fitness(user: Dict = Depends(require_teen)):
    return await db.fitness_logs.find({"user_id": user["id"]}, {"_id": 0}).sort("date", -1).to_list(30)

@api_router.post("/wellness/screentime")
async def log_screentime(req: ScreenTimeLogRequest, user: Dict = Depends(require_teen)):
    doc = {"id": str(uuid.uuid4()), "user_id": user["id"], "hours": req.hours, "note": req.note,
           "date": datetime.now(timezone.utc).date().isoformat(),
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.screentime_logs.insert_one(doc)
    await db.users.update_one({"id": user["id"]}, {"$inc": {"growth_score": 1, "habits_completed": 1}})
    doc.pop("_id", None); return doc

@api_router.get("/wellness/screentime")
async def list_screentime(user: Dict = Depends(require_teen)):
    return await db.screentime_logs.find({"user_id": user["id"]}, {"_id": 0}).sort("date", -1).to_list(30)


# ==================== FOCUS ====================
@api_router.post("/focus/session")
async def log_focus(req: FocusSessionRequest, user: Dict = Depends(require_teen)):
    blossom = 1 if req.minutes >= 20 else 0
    doc = {"id": str(uuid.uuid4()), "user_id": user["id"], "minutes": req.minutes, "task": req.task,
           "created_at": datetime.now(timezone.utc).isoformat()}
    await db.focus_sessions.insert_one(doc)
    await db.users.update_one({"id": user["id"]},
        {"$inc": {"growth_score": max(1, req.minutes // 10), "blossom_count": blossom, "habits_completed": 1}})
    doc.pop("_id", None); return doc

@api_router.get("/focus/sessions")
async def list_focus(user: Dict = Depends(require_teen)):
    return await db.focus_sessions.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(50)


# ==================== ACHIEVEMENTS ====================
ACHIEVEMENT_DEFS = [
    {"id": "first-bloom", "title": "First Bloom", "desc": "Earned your first blossom", "check": lambda u: u.get("blossom_count", 0) >= 1},
    {"id": "ten-blossoms", "title": "Spring Has Begun", "desc": "10 blossoms on your tree", "check": lambda u: u.get("blossom_count", 0) >= 10},
    {"id": "fifty-blossoms", "title": "Full Bloom", "desc": "50 blossoms on your tree", "check": lambda u: u.get("blossom_count", 0) >= 50},
    {"id": "week-streak", "title": "Seven Soft Days", "desc": "7-day streak", "check": lambda u: u.get("streak", 0) >= 7},
    {"id": "month-streak", "title": "Lunar Cycle", "desc": "30-day streak", "check": lambda u: u.get("streak", 0) >= 30},
    {"id": "ten-habits", "title": "Quiet Discipline", "desc": "10 habits completed", "check": lambda u: u.get("habits_completed", 0) >= 10},
    {"id": "five-challenges", "title": "Brave Heart", "desc": "5 challenges overcome", "check": lambda u: u.get("challenges_overcome", 0) >= 5},
    {"id": "three-goals", "title": "Rooted in Purpose", "desc": "3 identity items planted", "check": lambda u: u.get("goals_completed", 0) >= 3},
]

@api_router.get("/achievements")
async def get_achievements(user: Dict = Depends(require_teen)):
    return [{
        "id": a["id"], "title": a["title"], "desc": a["desc"], "earned": a["check"](user),
    } for a in ACHIEVEMENT_DEFS]


# ==================== MEMORY / INSIGHTS ====================
@api_router.get("/memory/insights")
async def memory_insights(user: Dict = Depends(require_teen)):
    """Long-term memory: recurring patterns, monthly growth narrative."""
    return {
        "patterns": [],
        "correlations": [],
        "monthly_narrative": "Your sanctuary is still settling. Drop a mood, write a line — IKIGAI begins listening from the very first word.",
        "data_points": 0,
    }


# ==================== HOME SNAPSHOT ====================
@api_router.get("/home/snapshot")
async def home_snapshot(user: Dict = Depends(require_teen)):
    """Lightweight daily home summary."""
    today = datetime.now(timezone.utc).date()
    week_ago = (today - timedelta(days=7)).isoformat()
    last_mood = await db.mood_dumps.find_one({"user_id": user["id"]}, {"_id": 0}, sort=[("created_at", -1)])
    last_journal = await db.journal_entries.find_one({"user_id": user["id"]}, {"_id": 0}, sort=[("created_at", -1)])
    last_solve = await db.problem_solver.find_one({"user_id": user["id"]}, {"_id": 0}, sort=[("created_at", -1)])
    checkins_week = await db.checkins.find(
        {"user_id": user["id"], "date": {"$gte": week_ago}}, {"_id": 0}
    ).sort("date", 1).to_list(14)
    blossoms_week = await db.users.find_one({"id": user["id"]}, {"_id": 0, "blossom_count": 1}) or {}
    
    # Compose "continue where you left off"
    continue_candidate = None
    candidates = [
        (last_mood, "/mood", "Mood Dump", lambda x: ((x.get("analysis") or {}).get("themes") or (x.get("analysis") or {}).get("emotions") or [""])[0]),
        (last_journal, "/journal", "Journal", lambda x: (x.get("prompt") or "")[:64]),
        (last_solve, "/solve", "Solve", lambda x: x.get("problem", "")),
    ]
    candidates = [(item, path, label, fn) for item, path, label, fn in candidates if item]
    candidates.sort(key=lambda c: c[0].get("created_at", ""), reverse=True)
    if candidates:
        item, path, label, fn = candidates[0]
        continue_candidate = {"path": path, "label": label, "hint": fn(item) or "", "created_at": item.get("created_at")}

    # Week mood overview (simple stats)
    moods = [c.get("mood") for c in checkins_week if c.get("mood")]
    avg = round(sum(moods)/len(moods), 1) if moods else None
    return {
        "encouragement": "However today feels — you don't have to perform here. Just arrive.",
        "continue": continue_candidate,
        "week": {
            "checkins": len(checkins_week),
            "avg_mood": avg,
            "blossoms": blossoms_week.get("blossom_count", 0),
            "trend": [{"date": c["date"], "mood": c["mood"]} for c in checkins_week],
        },
    }


# ==================== TREE TIMELINE / MILESTONES ====================
@api_router.get("/tree/timeline")
async def tree_timeline(user: Dict = Depends(require_teen)):
    """Chronological tree growth events."""
    blossom_total = user.get("blossom_count", 0)
    stage_thresholds = [
        (1, "sprout", "A Sprout Appeared"),
        (5, "seedling", "Young Seedling Steady"),
        (12, "growing", "Branches Found the Sky"),
        (25, "mature", "A Mature Tree"),
        (50, "blooming", "Full Bloom Arrived"),
        (100, "radiant", "Radiant Sakura"),
    ]
    return {
        "total_blossoms": blossom_total,
        "stage": user.get("tree_stage", "seed"),
        "events": [],
    }


# ==================== WEEKLY GROWTH CARD ====================
@api_router.get("/retention/weekly-card")
async def weekly_card(user: Dict = Depends(require_teen)):
    week_ago = (datetime.now(timezone.utc) - timedelta(days=7)).isoformat()
    moods = await db.mood_dumps.count_documents({"user_id": user["id"], "created_at": {"$gte": week_ago}})
    journals = await db.journal_entries.count_documents({"user_id": user["id"], "created_at": {"$gte": week_ago}})
    missions = await db.missions.count_documents({"user_id": user["id"], "created_at": {"$gte": week_ago}})
    solves = await db.problem_solver.count_documents({"user_id": user["id"], "created_at": {"$gte": week_ago}})
    checkins = await db.checkins.find({"user_id": user["id"]}, {"_id": 0}).sort("date", -1).to_list(7)
    moods_arr = [c.get("mood") for c in checkins if c.get("mood")]
    avg = round(sum(moods_arr)/len(moods_arr), 1) if moods_arr else None
    blossoms_added = moods + journals + missions + solves
    return {
        "moods": moods, "journals": journals, "missions": missions, "solves": solves,
        "avg_mood": avg, "blossoms_added": blossoms_added, "headline": "A quiet week of small petals.",
    }


# ==================== HABITS (AI-gated) ====================
@api_router.post("/habits/propose")
async def propose_habit(req: HabitProposeRequest, user: Dict = Depends(require_teen)):
    title = req.title.strip()
    if not title:
        raise HTTPException(400, "Habit title required")
    
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "title": title[:80],
        "why": req.why or "",
        "cadence": "daily",
        "source": "user",
        "approved": True,
        "completions": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.habits.insert_one(doc)
    doc.pop("_id", None)
    return {"approved": True, "reason": "Looks like a fit for steady growth.", "habit": doc}


@api_router.get("/habits")
async def list_habits(user: Dict = Depends(require_teen)):
    items = await db.habits.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", 1).to_list(100)
    today = datetime.now(timezone.utc).date().isoformat()
    # mark whether done today
    for h in items:
        last = h.get("last_completed_date")
        h["done_today"] = (last == today)
    return items


@api_router.post("/habits/complete")
async def complete_habit(req: HabitCompleteRequest, user: Dict = Depends(require_teen)):
    today = datetime.now(timezone.utc).date().isoformat()
    h = await db.habits.find_one({"id": req.habit_id, "user_id": user["id"]})
    if not h:
        raise HTTPException(404, "Habit not found")
    if h.get("last_completed_date") == today:
        return {"ok": True, "already": True}
    await db.habits.update_one(
        {"id": req.habit_id},
        {"$set": {"last_completed_date": today}, "$inc": {"completions": 1}}
    )
    await db.users.update_one(
        {"id": user["id"]},
        {"$inc": {"growth_score": 3, "blossom_count": 1, "habits_completed": 1}}
    )
    return {"ok": True, "already": False}


@api_router.delete("/habits/{habit_id}")
async def delete_habit(habit_id: str, user: Dict = Depends(require_teen)):
    res = await db.habits.delete_one({"id": habit_id, "user_id": user["id"]})
    return {"deleted": res.deleted_count}


# ==================== MONTHLY COMPARISON ====================
@api_router.get("/retention/monthly-comparison")
async def monthly_comparison(user: Dict = Depends(require_teen)):
    baseline = user.get("baseline") or {}
    # Compute "now" from last 14 days
    fortnight_ago = (datetime.now(timezone.utc) - timedelta(days=14)).isoformat()[:10]
    checkins = await db.checkins.find({"user_id": user["id"], "date": {"$gte": fortnight_ago}}, {"_id": 0}).to_list(30)

    def avg(arr):
        arr = [a for a in arr if a is not None]
        return round(sum(arr)/len(arr), 1) if arr else None

    now_dims = {}
    for k in ("happiness", "stress", "motivation", "energy", "confidence", "calmness"):
        now_dims[k] = avg([(c.get("dims") or {}).get(k) for c in checkins])
    overall_now = avg([c.get("mood") for c in checkins])

    moods_total = await db.mood_dumps.count_documents({"user_id": user["id"]})
    journals_total = await db.journal_entries.count_documents({"user_id": user["id"]})
    missions_total = await db.missions.count_documents({"user_id": user["id"]})
    blossoms = user.get("blossom_count", 0)

    return {
        "baseline": baseline,
        "now": {"dims": now_dims, "overall_mood": overall_now},
        "totals": {"moods": moods_total, "journals": journals_total, "missions": missions_total, "blossoms": blossoms},
        "narrative": "Your sanctuary has begun to settle into a rhythm. Each small gesture has shaped this month — keep listening to yourself the same way.",
    }


# ==================== CBT THOUGHT REFRAMING ====================
@api_router.post("/cbt/reframe")
async def cbt_reframe(req: CBTRequest, user: Dict = Depends(require_teen)):
    """Identify cognitive distortion in the user's thought, then suggest balanced reframes."""
    if not req.thought.strip():
        raise HTTPException(400, "Share the thought you'd like to look at")

    name = user.get("name", "you")
    thought = req.thought.strip()
    context = req.context or ""

    fallback = {
        "distortion": "cognitive distortion",
        "distortion_explanation": "Our minds sometimes create thought patterns that feel completely true but are actually filters that distort reality — especially when we're stressed or tired.",
        "questions": [
            "Is this thought stating a fact, or is it your interpretation of facts?",
            "If your best friend said this thought out loud, what would you tell them?",
            "What's one piece of evidence that complicates or contradicts this thought?",
        ],
        "evidence_for": "This thought feels real because it's connected to something genuinely difficult you're experiencing.",
        "evidence_against": "This thought is presenting one possible interpretation as the only truth — but there are other ways to read the same situation.",
        "balanced_thought": "A more complete version of this might be: something genuinely hard is happening, and I'm doing my best with what I have.",
        "action": "Write your original thought, then write 'AND also...' and complete the sentence with one true thing that complicates or softens it.",
    }

    if groq_client:
        prompt = (
            f"You are IKIGAI, a CBT-trained companion for a teen named {name}.\n"
            f"They want to examine this thought: \"{thought}\"\n"
            + (f"Context: {context}\n" if context else "")
            + "\nApply Cognitive Behavioral Therapy techniques and return ONLY a raw JSON object (no markdown, no backticks) with these exact keys:\n"
            "- \"distortion\": the specific name of the cognitive distortion (e.g. 'Catastrophizing', 'Mind reading', 'All-or-nothing thinking', 'Overgeneralization', 'Should statements', 'Personalization', 'Emotional reasoning', 'Fortune telling')\n"
            "- \"distortion_explanation\": 1-2 sentences explaining what this distortion does to thinking — make it relatable for a teen, using their specific thought as the example\n"
            "- \"questions\": list of 3 Socratic questions specifically crafted to challenge THIS thought — not generic CBT questions\n"
            "- \"evidence_for\": 1-2 sentences genuinely acknowledging what makes this thought feel true — validate their experience first\n"
            "- \"evidence_against\": 2-3 sentences offering specific alternative evidence or perspectives that challenge this exact thought\n"
            "- \"balanced_thought\": A specific alternative thought that replaces theirs — realistic, compassionate, and actually believable. Should directly reference their original thought.\n"
            "- \"action\": ONE concrete behavioral experiment or writing exercise they can do in the next 15 minutes to test or loosen this thought\n\n"
            "Make every answer specific to their exact thought. Do not give generic templates."
        )
        try:
            raw = await call_groq(prompt, "")
            if raw:
                data = json.loads(raw)
            else:
                data = fallback
        except Exception:
            data = fallback
    else:
        data = fallback
    # Save (private to user)
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "thought": req.thought,
        "context": req.context,
        "reframe": data,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.cbt_reframes.insert_one(doc)
    # Reward: a small blossom for the brave act of looking at a hard thought
    await db.users.update_one({"id": user["id"]}, {"$inc": {"growth_score": 3, "blossom_count": 1}})
    doc.pop("_id", None)
    return {"reframe": data, "id": doc["id"]}


@api_router.get("/cbt/history")
async def cbt_history(user: Dict = Depends(require_teen)):
    items = await db.cbt_reframes.find({"user_id": user["id"]}, {"_id": 0}).sort("created_at", -1).to_list(30)
    return items


# ==================== "I'M NOT OKAY" (SOS) ====================
@api_router.post("/sos")
async def sos(req: SOSRequest, user: Dict = Depends(require_teen)):
    """Adaptive emergency-mode response."""
    if not req.message.strip():
        raise HTTPException(400, "Tell IKIGAI what's happening")
    
    data = {
        "acknowledge": "Whatever is happening, it makes sense that you're feeling this. You don't have to be okay for IKIGAI to be here.",
        "right_now": ["Place one hand on your chest, one on your stomach, and take three slow breaths.",
                      "Name five things you can see in the room.",
                      "Drink water slowly — feel it move through you."],
        "reframe": "This moment is enormous and it is temporary. Both are true.",
        "next_hour": "Wrap yourself in something soft, sit somewhere safe, and let the next 60 minutes be only about being.",
        "reach_out": "If a trusted person comes to mind — a friend, parent, teacher, counselor — they would want to know.",
        "safety": "",
    }
    doc = {
        "id": str(uuid.uuid4()),
        "user_id": user["id"],
        "message": req.message,
        "response": data,
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    await db.sos_calls.insert_one(doc)
    return {"response": data}


# ==================== "KEEP GOING" ====================
@api_router.post("/keep-going")
async def keep_going(req: KeepGoingRequest, user: Dict = Depends(require_teen)):
    """When the teen feels like quitting."""
    name = user.get("name", "you")
    message = req.message or ""
    profile = user.get("profile", {})
    goals = ", ".join(profile.get("goals", [])) if profile.get("goals") else ""
    life_now = profile.get("lifeNow", "")
    vision = profile.get("oneMonthVision", "")
    tree_stage = user.get("tree_stage", "seed")
    streak = user.get("streak", 0)

    fallback = {
        "opening": "Wanting to quit doesn't mean you're failing — it means you're tired. Both things can be true at the same time.",
        "questions": [
            "What did you hope would feel different when you started this journey?",
            "Whose voice is loudest in your head right now — yours or someone else's?",
            "If you could take the tiniest possible step today — under two minutes — what would that look like?",
        ],
        "why_started": "You started because something in the old version of your days didn't feel like enough. That desire hasn't disappeared — it's just quieter right now.",
        "contrast": "The version of you who began this journey wanted more peace, more clarity, more feeling like yourself. None of that is gone — it's under the fog.",
        "one_small_step": "Take one slow breath right now. Then do one thing — just one — from your plan that takes under two minutes. That's enough for today.",
        "if_still_quitting": "If today is a rest day, rest. The sanctuary will be here exactly where you left it, whenever you're ready.",
    }

    if groq_client:
        context_parts = []
        if message:
            context_parts.append(f"What they shared: \"{message}\"")
        if goals:
            context_parts.append(f"Their goals: {goals}")
        if life_now:
            context_parts.append(f"Their life situation: {life_now[:200]}")
        if vision:
            context_parts.append(f"Their one-month vision: {vision[:200]}")
        if streak > 0:
            context_parts.append(f"Current streak: {streak} days")
        context_str = "\n".join(context_parts)

        prompt = (
            f"You are IKIGAI, a compassionate motivational companion for a teen named {name} who feels like giving up.\n"
            + (context_str + "\n" if context_str else "")
            + f"Their tree is at the '{tree_stage}' stage — they've made real progress.\n\n"
            "They need REAL support, not empty encouragement. Help them reconnect with their 'why' and find one tiny step forward.\n\n"
            "Return ONLY a raw JSON object (no markdown, no backticks) with these exact keys:\n"
            "- \"opening\": 2 sentences that directly respond to their specific situation — validate that wanting to quit is understandable RIGHT NOW for THEM, not generic\n"
            "- \"questions\": list of 3 honest, Socratic questions that help them reflect — personalized to what they shared\n"
            "- \"why_started\": 2 sentences reminding them of their original motivation — if you know their goals, reference them specifically\n"
            "- \"contrast\": 2 sentences painting the contrast between where they started and the version of themselves they were moving toward\n"
            "- \"one_small_step\": ONE ultra-specific action for RIGHT NOW that takes under 2 minutes — make it concrete and easy enough that even a burned-out person could do it\n"
            "- \"if_still_quitting\": 1-2 sentences for the case where they still want to quit — give them permission to rest without shame, while leaving a door open\n\n"
            "Be real, warm, and specific. No hollow encouragement."
        )
        try:
            raw = await call_groq(prompt, "")
            if raw:
                data = json.loads(raw)
            else:
                data = fallback
        except Exception:
            data = fallback
    else:
        data = fallback

    return {"response": data}


# ==================== TINY HABIT ====================
@api_router.post("/tiny-habit")
async def tiny_habit(req: TinyHabitRequest, user: Dict = Depends(require_teen)):
    """When user feels down/unmotivated."""
    fallback_options = {
        "down":        {"habit": "Step outside and feel the air on your face for 60 seconds.",
                        "why": "A change of light shifts the mind faster than a change of mood.",
                        "link_to_goal": "Tiny breaks build the steady calm you've been wanting."},
        "unmotivated": {"habit": "Open one notebook page and write the first sentence — anything.",
                        "why": "The first step is the only step that matters right now.",
                        "link_to_goal": "Momentum lives in the doing, not the planning."},
        "anxious":     {"habit": "Trace your hand slowly with your finger, breathing through each finger.",
                        "why": "Touch + slow breath gently signals safety to your nervous system.",
                        "link_to_goal": "Calm is a skill you can practice in 60-second pieces."},
        "stuck":       {"habit": "Drink a glass of water slowly, eyes closed.",
                        "why": "The smallest reset is sometimes the most underrated.",
                        "link_to_goal": "Tiny resets honor the goals you've already set."},
        "overwhelmed": {"habit": "Write down the one thing — only one — that would help most right now.",
                        "why": "Naming the next step shrinks the impossible into the doable.",
                        "link_to_goal": "Clarity is the first habit of every plan you've named."},
    }
    return fallback_options.get(req.mood or "stuck", fallback_options["stuck"])


# ==================== PROGRESS QUOTE ====================
@api_router.get("/quotes/progress")
async def progress_quote(user: Dict = Depends(require_teen)):
    """Motivational line calibrated to the teen's CURRENT progress."""
    bcount = user.get("blossom_count", 0)
    stage = user.get("tree_stage", "seed")
    by_stage = {
        "seed":     "The first decision is the petal.",
        "sprout":   "A sprout has nothing to prove — only to be.",
        "seedling": "Roots don't shout. They steady.",
        "growing":  "Growth is just slow choosing.",
        "mature":   "Strength is built in the days you almost didn't show up.",
        "blooming": "You're blooming — let it count.",
        "radiant":  "Radiance is a habit, not a moment.",
    }
    quote = by_stage.get(stage, "Tiny petals, still petals.")
    return {"quote": quote, "blossoms": bcount, "stage": stage}


@api_router.get("/motivations/quote")
async def get_motivational_quote(user: Dict = Depends(require_teen)):
    """Get a personalized motivational quote."""
    fallbacks = [
        "You're building something real. Keep going.",
        "Every bloom started as a seed in the dark. You're growing.",
        "Progress isn't about speed. It's about showing up, even when it's hard.",
        "You're different from yesterday. That counts.",
        "The hard moments are where the real strength is built.",
        "One small choice at a time. That's how transformation happens.",
    ]
    import random
    return {"quote": random.choice(fallbacks)}


app.include_router(api_router)

# ==================== MIDDLEWARE & STATIC FILES ====================
app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Serve frontend static files only when built into the same directory (single-service deployment)
frontend_build_dir = ROOT_DIR.parent / 'frontend' / 'build'
if frontend_build_dir.exists():
    app.mount("/", StaticFiles(directory=frontend_build_dir, html=True), name="frontend")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
