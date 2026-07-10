"""Iteration 6: Plan, 6-dim check-in, 7-stage tree, habits AI gating, monthly comparison."""
import os
import uuid
import json
import requests
import pytest


def _load_frontend_env():
    try:
        with open('/app/frontend/.env') as f:
            for line in f:
                if line.startswith('REACT_APP_BACKEND_URL='):
                    return line.split('=', 1)[1].strip()
    except Exception:
        pass
    return None


BASE_URL = (os.environ.get('REACT_APP_BACKEND_URL') or _load_frontend_env() or '').rstrip('/')
assert BASE_URL, "REACT_APP_BACKEND_URL not set"
API = f"{BASE_URL}/api"

UNIQ = uuid.uuid4().hex[:8]
TEEN_EMAIL = f"aiko{UNIQ}@gmail.com"
PASS = "lotus123"

st = {}
TIMEOUT_LLM = 120


def _h(t):
    return {"Authorization": f"Bearer {t}"}


# ---------- Smoke ----------
def test_root():
    r = requests.get(f"{API}/", timeout=20)
    assert r.status_code == 200
    j = r.json()
    assert isinstance(j, dict)


# ---------- Auth + onboarding with new fields ----------
def test_signup_teen():
    r = requests.post(f"{API}/auth/signup",
                      json={"name": "Aiko", "email": TEEN_EMAIL, "password": PASS, "role": "teen"},
                      timeout=30)
    assert r.status_code == 200, r.text
    d = r.json()
    st["token"] = d["token"]
    st["user_id"] = d["user"]["id"]


def test_onboarding_stores_new_baseline_fields():
    payload = {
        "age": 16,
        "grade": "11",
        "lifeNow": "I feel scattered and tired most evenings",
        "oneMonthVision": "Calmer mornings, sleeping better, one solid friendship deepened",
        "growthPace": "balanced",
        "goals": ["Better sleep", "Confidence", "Focus"],
        "energy": {"motivation": 4, "happiness": 5, "stress": 7, "focus": 4, "sleep": 3, "confidence": 5},
        "feeling": "tired",
        "stressors": "exams and friend drama",
    }
    r = requests.post(f"{API}/onboarding", json=payload, headers=_h(st["token"]), timeout=TIMEOUT_LLM)
    assert r.status_code == 200, r.text
    me = requests.get(f"{API}/auth/me", headers=_h(st["token"]), timeout=20).json()
    assert me.get("onboarded") is True
    bl = me.get("baseline") or {}
    assert bl.get("lifeNow") == payload["lifeNow"], f"baseline.lifeNow not stored: {bl}"
    assert bl.get("oneMonthVision") == payload["oneMonthVision"]
    assert bl.get("growthPace") == "balanced"
    assert bl.get("energy", {}).get("happiness") == 5


# ---------- Plan generation ----------
def test_plan_generate_balanced_4_weeks():
    r = requests.post(f"{API}/plan/generate", headers=_h(st["token"]), timeout=TIMEOUT_LLM)
    assert r.status_code == 200, r.text
    body = r.json()
    plan = body.get("plan")
    assert plan, "no plan in response"
    for k in ("summary", "weeks", "habits", "first_week_actions", "signpost", "weeks_count", "pace"):
        assert k in plan, f"plan missing {k}; got {list(plan.keys())}"
    assert plan["weeks_count"] == 4
    assert plan["pace"] == "balanced"
    assert isinstance(plan["weeks"], list) and len(plan["weeks"]) == 4
    assert isinstance(plan["habits"], list) and len(plan["habits"]) >= 1
    seeded = body.get("seeded_habits", [])
    assert isinstance(seeded, list) and len(seeded) >= 1, "habits should be auto-seeded"
    for h in seeded:
        assert h.get("source") == "plan"
        assert h.get("approved") is True
        assert "id" in h and "_id" not in h


def test_get_plan_persisted():
    r = requests.get(f"{API}/plan", headers=_h(st["token"]), timeout=20)
    assert r.status_code == 200
    j = r.json()
    assert j.get("plan") is not None
    assert j["plan"].get("weeks_count") == 4


def test_habits_list_after_plan_seed():
    r = requests.get(f"{API}/habits", headers=_h(st["token"]), timeout=20)
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list) and len(items) >= 1
    for h in items:
        assert "done_today" in h
        assert "_id" not in h
    st["seeded_habit_id"] = items[0]["id"]


# ---------- AI-gated habit propose ----------
def test_propose_aligned_habit_approved():
    r = requests.post(f"{API}/habits/propose",
                      json={"title": "10 minute walk after school",
                            "why": "to wind down before bed and clear my head"},
                      headers=_h(st["token"]), timeout=TIMEOUT_LLM)
    assert r.status_code == 200, r.text
    j = r.json()
    assert j.get("approved") is True, f"aligned habit should be approved: {j}"
    assert j.get("habit") and j["habit"].get("id")
    assert "_id" not in j["habit"]
    st["user_habit_id"] = j["habit"]["id"]


def test_propose_offtopic_habit_response_shape():
    # Verdict may be approved=false (LLM smart) OR approved=true (permissive fallback). Both ok.
    r = requests.post(f"{API}/habits/propose",
                      json={"title": "collect rare coins", "why": "for fun"},
                      headers=_h(st["token"]), timeout=TIMEOUT_LLM)
    assert r.status_code == 200, r.text
    j = r.json()
    assert "approved" in j
    if j["approved"]:
        assert j.get("habit") is not None
    else:
        assert j.get("habit") is None
        assert isinstance(j.get("reason"), str) and len(j["reason"]) > 0


# ---------- Complete habit ----------
def test_complete_habit_increments_then_idempotent():
    hid = st.get("seeded_habit_id")
    assert hid
    r1 = requests.post(f"{API}/habits/complete", json={"habit_id": hid},
                       headers=_h(st["token"]), timeout=20)
    assert r1.status_code == 200
    assert r1.json().get("already") is False
    r2 = requests.post(f"{API}/habits/complete", json={"habit_id": hid},
                       headers=_h(st["token"]), timeout=20)
    assert r2.status_code == 200
    assert r2.json().get("already") is True
    # confirm completions count via list
    items = requests.get(f"{API}/habits", headers=_h(st["token"]), timeout=20).json()
    target = next(h for h in items if h["id"] == hid)
    assert target.get("completions", 0) >= 1
    assert target.get("done_today") is True


def test_delete_habit():
    # Create a throwaway habit to delete (don't blow up plan-seeded state)
    pr = requests.post(f"{API}/habits/propose",
                       json={"title": "5 min morning stretch", "why": "energy"},
                       headers=_h(st["token"]), timeout=TIMEOUT_LLM).json()
    if not pr.get("approved"):
        pytest.skip("propose returned not-approved; skip delete")
    hid = pr["habit"]["id"]
    r = requests.delete(f"{API}/habits/{hid}", headers=_h(st["token"]), timeout=20)
    assert r.status_code == 200
    assert r.json().get("deleted") == 1
    items = requests.get(f"{API}/habits", headers=_h(st["token"]), timeout=20).json()
    assert all(h["id"] != hid for h in items)


# ---------- 6-dim check-in ----------
def test_checkin_6dim_persists():
    payload = {"happiness": 7, "stress": 4, "motivation": 6,
               "energy": 6, "confidence": 5, "calmness": 7}
    r = requests.post(f"{API}/checkin", json=payload,
                      headers=_h(st["token"]), timeout=20)
    assert r.status_code == 200, r.text
    body = r.json()
    assert body.get("ok") is True
    assert isinstance(body.get("mood"), int)
    assert body["dims"] == payload
    g = requests.get(f"{API}/checkin/today", headers=_h(st["token"]), timeout=20).json()
    assert g["checked_in"] is True
    assert g["checkin"]["dims"] == payload


# ---------- Tree (7-stage + resting) ----------
def test_tree_state_7_stage_keys():
    r = requests.get(f"{API}/tree/state", headers=_h(st["token"]), timeout=20)
    assert r.status_code == 200
    j = r.json()
    for k in ("stage", "blossom_count", "resting", "next_stage", "next_stage_at"):
        assert k in j, f"missing {k}"
    valid_stages = {"seed", "sprout", "seedling", "growing", "mature", "blooming", "radiant"}
    assert j["stage"] in valid_stages
    if j["next_stage"] is not None:
        assert j["next_stage"] in valid_stages
        assert isinstance(j["next_stage_at"], int)


def test_tree_timeline_uses_new_stage_names():
    r = requests.get(f"{API}/tree/timeline", headers=_h(st["token"]), timeout=20)
    assert r.status_code == 200
    j = r.json()
    assert "events" in j and isinstance(j["events"], list)
    valid_stages = {"seed", "sprout", "seedling", "growing", "mature", "blooming", "radiant"}
    stage_events = [e for e in j["events"] if e.get("type") == "stage"]
    for s in stage_events:
        assert s.get("stage") in valid_stages, f"unexpected stage milestone: {s}"


# ---------- Monthly comparison ----------
def test_monthly_comparison_structure():
    r = requests.get(f"{API}/retention/monthly-comparison",
                     headers=_h(st["token"]), timeout=TIMEOUT_LLM)
    assert r.status_code == 200, r.text
    j = r.json()
    for k in ("baseline", "now", "totals", "narrative"):
        assert k in j, f"missing {k}"
    assert j["baseline"].get("lifeNow")  # baseline persisted from onboarding
    assert "dims" in j["now"]
    for k in ("happiness", "stress", "motivation", "energy", "confidence", "calmness"):
        assert k in j["now"]["dims"]
    for k in ("moods", "journals", "missions", "blossoms"):
        assert k in j["totals"]
    assert isinstance(j["narrative"], str) and len(j["narrative"]) > 0


# ---------- Tree resting hint when no recent check-ins (new user) ----------
def test_tree_resting_for_fresh_user():
    fresh_email = f"fresh{uuid.uuid4().hex[:8]}@gmail.com"
    r = requests.post(f"{API}/auth/signup",
                      json={"name": "Fresh", "email": fresh_email, "password": PASS, "role": "teen"},
                      timeout=30)
    assert r.status_code == 200
    tk = r.json()["token"]
    requests.post(f"{API}/onboarding",
                  json={"lifeNow": "x", "oneMonthVision": "y", "growthPace": "gentle",
                        "goals": ["calm"], "energy": {"happiness": 5}},
                  headers=_h(tk), timeout=TIMEOUT_LLM)
    ts = requests.get(f"{API}/tree/state", headers=_h(tk), timeout=20).json()
    assert ts["stage"] == "seed"
    assert ts["resting"] is True


# ---------- Pace variations ----------
def test_plan_pace_fast_two_weeks():
    em = f"fast{uuid.uuid4().hex[:8]}@gmail.com"
    r = requests.post(f"{API}/auth/signup",
                      json={"name": "F", "email": em, "password": PASS, "role": "teen"},
                      timeout=30)
    tk = r.json()["token"]
    requests.post(f"{API}/onboarding",
                  json={"lifeNow": "rushing constantly",
                        "oneMonthVision": "calmer rhythm",
                        "growthPace": "fast",
                        "goals": ["focus"], "energy": {"motivation": 7}},
                  headers=_h(tk), timeout=TIMEOUT_LLM)
    pg = requests.post(f"{API}/plan/generate", headers=_h(tk), timeout=TIMEOUT_LLM).json()
    plan = pg["plan"]
    assert plan["weeks_count"] == 2
    assert plan["pace"] == "fast"
    assert len(plan["weeks"]) == 2


def test_plan_pace_gentle_eight_weeks():
    em = f"gentle{uuid.uuid4().hex[:8]}@gmail.com"
    r = requests.post(f"{API}/auth/signup",
                      json={"name": "G", "email": em, "password": PASS, "role": "teen"},
                      timeout=30)
    tk = r.json()["token"]
    requests.post(f"{API}/onboarding",
                  json={"lifeNow": "tender",
                        "oneMonthVision": "soft growth",
                        "growthPace": "gentle",
                        "goals": ["self-kindness"], "energy": {"happiness": 4}},
                  headers=_h(tk), timeout=TIMEOUT_LLM)
    pg = requests.post(f"{API}/plan/generate", headers=_h(tk), timeout=TIMEOUT_LLM).json()
    plan = pg["plan"]
    assert plan["weeks_count"] == 8
    assert plan["pace"] == "gentle"
    assert len(plan["weeks"]) == 8
