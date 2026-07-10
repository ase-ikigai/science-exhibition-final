"""Iteration 5: Ikigai polish features — 5-part mood dump, 9 problems, AI memory, home snapshot, tree timeline, weekly card."""
import os
import uuid
import json
import base64
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


def _h(t):
    return {"Authorization": f"Bearer {t}"}


# Tiny 1x1 png base64
TINY_PNG = (
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9ZkmrxgAAAAASUVORK5CYII="
)


# ----- Smoke -----
def test_root_blooming():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    j = r.json()
    # status should mention blooming/ok
    assert "status" in j or "message" in j


# ----- Auth -----
def test_signup_rejects_test_tld():
    r = requests.post(f"{API}/auth/signup", json={
        "name": "X", "email": f"bad{UNIQ}@example.test", "password": PASS, "role": "teen"})
    assert r.status_code in (400, 422), f"expected rejection of .test TLD, got {r.status_code}"


def test_signup_teen_gmail():
    r = requests.post(f"{API}/auth/signup", json={
        "name": "Aiko", "email": TEEN_EMAIL, "password": PASS, "role": "teen"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert "token" in d and "user" in d
    st["token"] = d["token"]
    st["user_id"] = d["user"]["id"]


def test_login_returns_token():
    r = requests.post(f"{API}/auth/login", json={"email": TEEN_EMAIL, "password": PASS})
    assert r.status_code == 200
    assert "token" in r.json()


def test_auth_me():
    r = requests.get(f"{API}/auth/me", headers=_h(st["token"]))
    assert r.status_code == 200
    assert r.json()["email"] == TEEN_EMAIL


# ----- Onboarding -----
def test_onboarding_sets_flag():
    payload = {"profile": {"age": 15, "goals": ["calm", "focus"], "interests": ["music"], "challenges": ["sleep"], "school_year": "10"}}
    r = requests.post(f"{API}/onboarding", json=payload, headers=_h(st["token"]))
    assert r.status_code == 200, r.text
    me = requests.get(f"{API}/auth/me", headers=_h(st["token"])).json()
    assert me.get("onboarded") is True


# ----- Mood dump (flagship) -----
def test_mood_dump_5part_specific():
    text = "I bombed my chemistry test and my best friend keeps cancelling on me. I feel invisible."
    r = requests.post(f"{API}/mood-dump", json={"text": text}, headers=_h(st["token"]), timeout=90)
    assert r.status_code == 200, r.text
    body = r.json()
    a = body["analysis"]
    for k in ("themes", "concerns", "causes", "perspective", "action", "validation"):
        assert k in a, f"missing 5-part key {k}"
    # back-compat aliases
    for k in ("emotions", "reflection", "insight", "suggestion"):
        assert k in a, f"missing back-compat key {k}"
    # Should NOT be the placeholder fallback (placeholder uses 'thoughtful, tender, reflective')
    themes_lower = " ".join(a.get("themes", [])).lower()
    blob = json.dumps(a).lower()
    placeholder = (
        "thoughtful" in themes_lower
        and "tender" in themes_lower
        and "reflective" in themes_lower
    )
    # If it's the fallback shape, report — Claude likely failed
    if placeholder:
        pytest.fail(f"Mood analysis returned generic placeholder — LLM likely failed: {a}")
    # Heuristic: at least one specific word from the input should appear in the body
    assert any(w in blob for w in ["chem", "test", "friend", "cancel", "invisible", "school"]), \
        f"Analysis not specific to input: {a}"
    st["mood_dump_id"] = body["id"]


def test_mood_dump_with_image():
    r = requests.post(f"{API}/mood-dump",
                      json={"text": "Sky in my window today.", "image_base64": TINY_PNG},
                      headers=_h(st["token"]), timeout=90)
    assert r.status_code == 200
    body = r.json()
    assert body["has_image"] is True
    assert "analysis" in body


def test_mood_dump_list():
    r = requests.get(f"{API}/mood-dump", headers=_h(st["token"]))
    assert r.status_code == 200
    arr = r.json()
    assert isinstance(arr, list) and len(arr) >= 2


# ----- Solve (9 problems, 5-part playbook) -----
def test_problems_list_has_nine_required_ids():
    r = requests.get(f"{API}/problem-solver/problems")
    assert r.status_code == 200
    arr = r.json()
    ids = {p["id"] for p in arr}
    required = {"overthinking", "anxiety", "motivation", "loneliness", "friendship",
                "family", "burnout", "school-stress", "confidence"}
    missing = required - ids
    assert not missing, f"missing problems: {missing}"
    assert len(arr) >= 9


def test_solve_returns_5part_playbook():
    r = requests.post(f"{API}/problem-solver/solve",
                      json={"problem": "anxiety", "context": "presentation tomorrow"},
                      headers=_h(st["token"]), timeout=90)
    assert r.status_code == 200, r.text
    pb = r.json()["playbook"]
    for k in ("happening", "why", "control", "action_today", "longterm", "reframe"):
        assert k in pb, f"playbook missing key {k}; got keys: {list(pb.keys())}"
    assert isinstance(pb["control"], list)


# ----- AI Memory -----
def test_memory_insights_shape():
    r = requests.get(f"{API}/memory/insights", headers=_h(st["token"]), timeout=90)
    assert r.status_code == 200
    j = r.json()
    for k in ("patterns", "correlations", "monthly_narrative", "data_points"):
        assert k in j
    assert isinstance(j["patterns"], list)
    assert isinstance(j["correlations"], list)
    assert isinstance(j["monthly_narrative"], str)


# ----- Home snapshot -----
def test_home_snapshot():
    r = requests.get(f"{API}/home/snapshot", headers=_h(st["token"]), timeout=90)
    assert r.status_code == 200
    j = r.json()
    assert "encouragement" in j and isinstance(j["encouragement"], str) and len(j["encouragement"]) > 0
    assert "continue" in j  # may be None or object
    assert "week" in j
    for k in ("checkins", "avg_mood", "blossoms", "trend"):
        assert k in j["week"], f"week missing {k}"


# ----- Tree timeline -----
def test_tree_timeline_after_activity():
    r = requests.get(f"{API}/tree/timeline", headers=_h(st["token"]))
    assert r.status_code == 200
    j = r.json()
    assert "total_blossoms" in j and "stage" in j and "events" in j
    assert isinstance(j["events"], list)
    # we created 2 mood dumps + 1 solve -> >= 3 blossom events
    blossom_events = [e for e in j["events"] if e["type"] == "blossom"]
    assert len(blossom_events) >= 3, f"expected >= 3 blossom events, got {len(blossom_events)}"
    kinds = {e.get("kind") for e in blossom_events}
    assert "mood" in kinds and "solve" in kinds
    # First stage milestone for seedling at threshold 1
    stage_events = [e for e in j["events"] if e["type"] == "stage"]
    assert any(e.get("stage") == "seedling" for e in stage_events), "missing seedling milestone"


# ----- Weekly card -----
def test_weekly_card():
    r = requests.get(f"{API}/retention/weekly-card", headers=_h(st["token"]), timeout=90)
    assert r.status_code == 200
    j = r.json()
    for k in ("moods", "journals", "missions", "solves", "avg_mood", "blossoms_added", "headline"):
        assert k in j
    assert isinstance(j["moods"], int)
    assert isinstance(j["headline"], str) and len(j["headline"]) > 0


# ----- Tree state -----
def test_tree_state_incremented():
    r = requests.get(f"{API}/tree/state", headers=_h(st["token"]))
    assert r.status_code == 200
    j = r.json()
    assert "stage" in j and "blossom_count" in j
    assert j["blossom_count"] >= 3


# ----- Insights overview -----
def test_insights_overview():
    r = requests.get(f"{API}/insights/overview", headers=_h(st["token"]))
    assert r.status_code == 200
    j = r.json()
    for k in ("mood_trend", "avg_mood", "area_avgs", "consistency_pct", "missions_completed", "blossoms"):
        assert k in j, f"insights overview missing {k}"


# ----- Missions -----
def test_missions_today_and_complete():
    r = requests.get(f"{API}/missions/today", headers=_h(st["token"]))
    assert r.status_code == 200
    body = r.json()
    arr = body["missions"] if isinstance(body, dict) else body
    assert isinstance(arr, list) and len(arr) == 5, f"expected 5 missions, got {len(arr)}"
    before = requests.get(f"{API}/tree/state", headers=_h(st["token"])).json()["blossom_count"]
    mid = arr[0]["id"] if isinstance(arr[0], dict) else arr[0]
    r2 = requests.post(f"{API}/missions/complete", json={"mission_id": mid}, headers=_h(st["token"]))
    assert r2.status_code == 200
    after = requests.get(f"{API}/tree/state", headers=_h(st["token"])).json()["blossom_count"]
    assert after >= before + 1


# ----- Journal -----
def test_journal_prompts_and_entry():
    r = requests.get(f"{API}/journal/prompts", headers=_h(st["token"]), timeout=60)
    assert r.status_code == 200
    arr = r.json()
    # accept list or object with prompts key
    if isinstance(arr, dict):
        arr = arr.get("prompts", [])
    assert isinstance(arr, list) and len(arr) >= 1
    r2 = requests.post(f"{API}/journal/entries",
                       json={"prompt": "What made you smile today?", "response": "a warm mug of tea"},
                       headers=_h(st["token"]))
    assert r2.status_code == 200
