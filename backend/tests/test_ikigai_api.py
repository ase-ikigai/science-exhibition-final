"""IKIGAI backend API tests - auth, onboarding, mood, journal, coach, tree, family, parent privacy."""
import os
import uuid
import time
import json
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://zen-growth-5.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

UNIQ = uuid.uuid4().hex[:8]
TEEN_EMAIL = f"TEST_teen_{UNIQ}@test.com"
PARENT_EMAIL = f"TEST_parent_{UNIQ}@test.com"
PASS = "sakura123"

state = {}


def _h(tok):
    return {"Authorization": f"Bearer {tok}"}


# ---------------- Auth ----------------
def test_root_ok():
    r = requests.get(f"{API}/")
    assert r.status_code == 200
    assert r.json().get("app") == "IKIGAI"


def test_signup_teen():
    r = requests.post(f"{API}/auth/signup", json={"name": "TestTeen", "email": TEEN_EMAIL, "password": PASS, "role": "teen"})
    assert r.status_code == 200, r.text
    d = r.json()
    assert "token" in d and d["user"]["role"] == "teen"
    assert d["user"]["family_code"] and len(d["user"]["family_code"]) == 6
    state["teen_token"] = d["token"]
    state["teen_id"] = d["user"]["id"]
    state["family_code"] = d["user"]["family_code"]


def test_signup_duplicate():
    r = requests.post(f"{API}/auth/signup", json={"name": "X", "email": TEEN_EMAIL, "password": PASS, "role": "teen"})
    assert r.status_code == 400


def test_signup_parent():
    r = requests.post(f"{API}/auth/signup", json={"name": "TestParent", "email": PARENT_EMAIL, "password": PASS, "role": "parent"})
    assert r.status_code == 200
    d = r.json()
    state["parent_token"] = d["token"]
    assert d["user"]["role"] == "parent"


def test_login_teen():
    r = requests.post(f"{API}/auth/login", json={"email": TEEN_EMAIL, "password": PASS})
    assert r.status_code == 200
    assert "token" in r.json()


def test_login_bad():
    r = requests.post(f"{API}/auth/login", json={"email": TEEN_EMAIL, "password": "wrong"})
    assert r.status_code == 401


def test_me():
    r = requests.get(f"{API}/auth/me", headers=_h(state["teen_token"]))
    assert r.status_code == 200
    assert r.json()["email"] == TEEN_EMAIL
    assert "password" not in r.json()


def test_me_unauthed():
    r = requests.get(f"{API}/auth/me")
    assert r.status_code == 401


# ---------------- Onboarding ----------------
def test_onboarding():
    payload = {"age": 15, "grade": "10", "gender": "she/her", "country": "JP",
               "hardest": "school stress", "wishDifferent": "more sleep", "timeSpent": "studying",
               "feeling": "anxious", "stressors": "exams", "repeatingThoughts": "i must do well",
               "goals": ["sleep", "focus"], "energy": {"motivation": 5, "happiness": 6, "stress": 7, "focus": 5, "sleep": 4, "confidence": 6}}
    r = requests.post(f"{API}/onboarding", json=payload, headers=_h(state["teen_token"]), timeout=60)
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["ok"] is True
    bp = d.get("blueprint", {})
    assert "morning" in bp and "school" in bp and "evening" in bp and "weekend" in bp


def test_onboarding_requires_teen():
    r = requests.post(f"{API}/onboarding", json={"goals": []}, headers=_h(state["parent_token"]))
    assert r.status_code == 403


# ---------------- Tree ----------------
def test_tree_image():
    r = requests.get(f"{API}/tree/image", timeout=60, allow_redirects=False)
    assert r.status_code in (200, 307)  # may redirect to pexels fallback
    if r.status_code == 200:
        assert "image" in r.headers.get("content-type", "")


def test_tree_state():
    r = requests.get(f"{API}/tree/state", headers=_h(state["teen_token"]))
    assert r.status_code == 200
    d = r.json()
    assert "stage" in d and "blossom_count" in d and "streak" in d


# ---------------- Check-in ----------------
def test_checkin():
    r = requests.post(f"{API}/checkin", json={"mood": 7, "note": "test"}, headers=_h(state["teen_token"]))
    assert r.status_code == 200
    assert r.json()["ok"] is True
    r2 = requests.get(f"{API}/tree/state", headers=_h(state["teen_token"]))
    assert r2.json()["streak"] >= 1


# ---------------- Mood Dump ----------------
def test_mood_dump_create_and_list():
    r = requests.post(f"{API}/mood-dump", json={"text": "feeling overwhelmed today with school"},
                      headers=_h(state["teen_token"]), timeout=45)
    assert r.status_code == 200, r.text
    d = r.json()
    a = d["analysis"]
    assert "emotions" in a and "reflection" in a and "insight" in a and "suggestion" in a

    r2 = requests.get(f"{API}/mood-dump", headers=_h(state["teen_token"]))
    assert r2.status_code == 200 and len(r2.json()) >= 1


def test_mood_dump_empty():
    r = requests.post(f"{API}/mood-dump", json={"text": "  "}, headers=_h(state["teen_token"]))
    assert r.status_code == 400


# ---------------- Journal ----------------
def test_journal_prompts():
    r = requests.get(f"{API}/journal/prompts", headers=_h(state["teen_token"]), timeout=45)
    assert r.status_code == 200
    data = r.json()
    assert isinstance(data, list) and len(data) >= 1
    assert "prompt" in data[0] and "category" in data[0]


def test_journal_entry_create_list():
    r = requests.post(f"{API}/journal/entries",
                      json={"prompt": "What gave you joy today?", "response": "A walk in sun."},
                      headers=_h(state["teen_token"]))
    assert r.status_code == 200
    r2 = requests.get(f"{API}/journal/entries", headers=_h(state["teen_token"]))
    assert r2.status_code == 200 and len(r2.json()) >= 1


# ---------------- Coach SSE ----------------
def test_coach_chat_stream_and_history():
    r = requests.post(f"{API}/coach/chat", json={"message": "I feel a bit lost today."},
                      headers=_h(state["teen_token"]), stream=True, timeout=60)
    assert r.status_code == 200
    assert "text/event-stream" in r.headers.get("content-type", "")
    got_delta = False
    got_done = False
    for raw in r.iter_lines():
        if not raw:
            continue
        line = raw.decode("utf-8")
        if line.startswith("data: "):
            payload = json.loads(line[6:])
            if "delta" in payload:
                got_delta = True
            if payload.get("done"):
                got_done = True
                break
            if "error" in payload:
                pytest.fail(f"coach stream error: {payload['error']}")
    assert got_delta and got_done

    # history
    time.sleep(1)
    rh = requests.get(f"{API}/coach/history", headers=_h(state["teen_token"]))
    assert rh.status_code == 200
    hist = rh.json()
    assert any(m["role"] == "user" for m in hist) and any(m["role"] == "assistant" for m in hist)


# ---------------- Family + Parent privacy ----------------
def test_family_code():
    r = requests.get(f"{API}/family/code", headers=_h(state["teen_token"]))
    assert r.status_code == 200
    assert r.json()["code"] == state["family_code"]


def test_parent_link_invalid():
    r = requests.post(f"{API}/family/link", json={"code": "XXXXXX"}, headers=_h(state["parent_token"]))
    assert r.status_code == 404


def test_parent_link_and_overview_privacy():
    r = requests.post(f"{API}/family/link", json={"code": state["family_code"]}, headers=_h(state["parent_token"]))
    assert r.status_code == 200 and r.json()["ok"] is True

    r2 = requests.get(f"{API}/parent/overview", headers=_h(state["parent_token"]))
    assert r2.status_code == 200
    o = r2.json()
    assert o["linked"] is True
    for k in ("wellbeing_score", "streak", "avg_mood_14d", "journal_count", "mood_dump_count"):
        assert k in o
    # Privacy: must NOT leak content
    body = json.dumps(o).lower()
    assert "feeling overwhelmed" not in body
    assert "walk in sun" not in body
    assert "i feel a bit lost" not in body


def test_parent_cannot_access_teen_endpoints():
    for ep in ["/mood-dump", "/journal/entries", "/coach/history", "/tree/state"]:
        r = requests.get(f"{API}{ep}", headers=_h(state["parent_token"]))
        assert r.status_code == 403, f"{ep} leaked to parent"


def test_teen_cannot_access_parent_overview():
    r = requests.get(f"{API}/parent/overview", headers=_h(state["teen_token"]))
    assert r.status_code == 403
