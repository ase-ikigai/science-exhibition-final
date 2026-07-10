"""IKIGAI enhancements tests: Life Map, Problem Solver, Identity, blossom math, parent privacy v2."""
import os
import uuid
import json
import time
import requests
import pytest

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://zen-growth-5.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

UNIQ = uuid.uuid4().hex[:8]
TEEN_EMAIL = f"TEST_enh_teen_{UNIQ}@test.com"
PARENT_EMAIL = f"TEST_enh_parent_{UNIQ}@test.com"
PASS = "sakura123"

st = {}


def _h(t):
    return {"Authorization": f"Bearer {t}"}


# ---------- bootstrap: fresh teen + parent ----------
def test_signup_fresh_teen_zero_blossoms():
    r = requests.post(f"{API}/auth/signup", json={"name": "EnhTeen", "email": TEEN_EMAIL, "password": PASS, "role": "teen"})
    assert r.status_code == 200, r.text
    d = r.json()
    st["teen_token"] = d["token"]
    st["family_code"] = d["user"]["family_code"]
    # Verify CLEAN 0-blossom start for new teen
    tr = requests.get(f"{API}/tree/state", headers=_h(st["teen_token"]))
    assert tr.status_code == 200
    tj = tr.json()
    assert tj["blossom_count"] == 0, f"new teen should start at 0 blossoms, got {tj['blossom_count']}"
    assert tj["streak"] == 0


def test_signup_fresh_parent():
    r = requests.post(f"{API}/auth/signup", json={"name": "EnhParent", "email": PARENT_EMAIL, "password": PASS, "role": "parent"})
    assert r.status_code == 200
    st["parent_token"] = r.json()["token"]


# ---------- Checkin should NOT add blossom anymore ----------
def test_checkin_does_not_add_blossom():
    before = requests.get(f"{API}/tree/state", headers=_h(st["teen_token"])).json()
    r = requests.post(f"{API}/checkin", json={"mood": 6, "note": "ok"}, headers=_h(st["teen_token"]))
    assert r.status_code == 200
    after = requests.get(f"{API}/tree/state", headers=_h(st["teen_token"])).json()
    assert after["blossom_count"] == before["blossom_count"], "checkin must NOT add blossom"
    assert after["streak"] >= 1


# ---------- Mood-dump adds +1 blossom ----------
def test_mood_dump_adds_one_blossom():
    before = requests.get(f"{API}/tree/state", headers=_h(st["teen_token"])).json()
    r = requests.post(f"{API}/mood-dump", json={"text": "Today felt heavy with school noise."},
                      headers=_h(st["teen_token"]), timeout=45)
    assert r.status_code == 200
    after = requests.get(f"{API}/tree/state", headers=_h(st["teen_token"])).json()
    assert after["blossom_count"] == before["blossom_count"] + 1


# ---------- Journal entry adds blossom + habits_completed ----------
def test_journal_entry_adds_blossom_and_habit():
    me_before = requests.get(f"{API}/auth/me", headers=_h(st["teen_token"])).json()
    before_h = me_before.get("habits_completed", 0)
    before_b = me_before.get("blossom_count", 0)
    r = requests.post(f"{API}/journal/entries",
                      json={"prompt": "What gave you joy?", "response": "tea by the window"},
                      headers=_h(st["teen_token"]))
    assert r.status_code == 200
    me_after = requests.get(f"{API}/auth/me", headers=_h(st["teen_token"])).json()
    assert me_after["blossom_count"] == before_b + 1
    assert me_after.get("habits_completed", 0) == before_h + 1


# ---------- LIFE MAP ----------
def test_life_map_areas_returns_seven():
    r = requests.get(f"{API}/life-map/areas")
    assert r.status_code == 200
    areas = r.json()["areas"]
    assert len(areas) == 7
    for a in ["School", "Friends", "Family", "Health", "Confidence", "Purpose", "Hobbies"]:
        assert a in areas


def test_life_map_entry_save_and_counters():
    me_before = requests.get(f"{API}/auth/me", headers=_h(st["teen_token"])).json()
    bb = me_before["blossom_count"]
    bh = me_before.get("habits_completed", 0)
    r = requests.post(f"{API}/life-map/entry",
                      json={"area": "School", "rating": 6, "note": "okay-ish day"},
                      headers=_h(st["teen_token"]))
    assert r.status_code == 200, r.text
    d = r.json()
    assert d["area"] == "School" and d["rating"] == 6 and d["note"] == "okay-ish day"
    assert "id" in d and "_id" not in d
    me_after = requests.get(f"{API}/auth/me", headers=_h(st["teen_token"])).json()
    assert me_after["blossom_count"] == bb + 1
    assert me_after.get("habits_completed", 0) == bh + 1


def test_life_map_entry_unknown_area():
    r = requests.post(f"{API}/life-map/entry",
                      json={"area": "NotAnArea", "rating": 5, "note": ""},
                      headers=_h(st["teen_token"]))
    assert r.status_code == 400


def test_life_map_summary_shape():
    # Add a couple more entries
    requests.post(f"{API}/life-map/entry", json={"area": "Friends", "rating": 8, "note": ""}, headers=_h(st["teen_token"]))
    requests.post(f"{API}/life-map/entry", json={"area": "School", "rating": 4, "note": ""}, headers=_h(st["teen_token"]))
    r = requests.get(f"{API}/life-map/summary", headers=_h(st["teen_token"]))
    assert r.status_code == 200
    body = r.json()
    assert len(body["summary"]) == 7
    school = next(s for s in body["summary"] if s["area"] == "School")
    assert school["count"] >= 2 and school["avg"] is not None
    friends = next(s for s in body["summary"] if s["area"] == "Friends")
    assert friends["count"] >= 1


def test_life_map_patterns_ai():
    r = requests.get(f"{API}/life-map/patterns", headers=_h(st["teen_token"]), timeout=45)
    assert r.status_code == 200
    body = r.json()
    assert "patterns" in body and "areas_to_water" in body
    assert isinstance(body["patterns"], list)
    assert isinstance(body["areas_to_water"], list)


# ---------- PROBLEM SOLVER ----------
def test_problems_list_has_eight():
    r = requests.get(f"{API}/problem-solver/problems")
    assert r.status_code == 200
    arr = r.json()
    assert len(arr) == 8
    assert {"id", "label", "emoji"} <= set(arr[0].keys())


def test_problem_solver_solve_increments_challenges():
    me_before = requests.get(f"{API}/auth/me", headers=_h(st["teen_token"])).json()
    bc = me_before.get("challenges_overcome", 0)
    r = requests.post(f"{API}/problem-solver/solve",
                      json={"problem": "Can't focus", "context": "school project due"},
                      headers=_h(st["teen_token"]), timeout=45)
    assert r.status_code == 200, r.text
    d = r.json()
    pb = d["playbook"]
    for k in ("why", "today", "this_week", "reframe"):
        assert k in pb, f"missing key {k} in playbook"
    assert isinstance(pb["today"], list) and isinstance(pb["this_week"], list)
    assert "_id" not in d
    me_after = requests.get(f"{API}/auth/me", headers=_h(st["teen_token"])).json()
    assert me_after.get("challenges_overcome", 0) == bc + 1


def test_problem_solver_history():
    r = requests.get(f"{API}/problem-solver/history", headers=_h(st["teen_token"]))
    assert r.status_code == 200
    items = r.json()
    assert isinstance(items, list) and len(items) >= 1
    assert "playbook" in items[0]


# ---------- IDENTITY ----------
def test_identity_default_empty():
    r = requests.get(f"{API}/identity", headers=_h(st["teen_token"]))
    assert r.status_code == 200
    d = r.json()
    for sec in ("strengths", "interests", "values", "longterm"):
        assert sec in d and d[sec] == []


def test_identity_save_and_goal_counter():
    me_before = requests.get(f"{API}/auth/me", headers=_h(st["teen_token"])).json()
    bg = me_before.get("goals_completed", 0)
    r = requests.post(f"{API}/identity",
                      json={"section": "strengths", "items": ["curiosity", "empathy"]},
                      headers=_h(st["teen_token"]))
    assert r.status_code == 200 and r.json()["ok"] is True
    r2 = requests.get(f"{API}/identity", headers=_h(st["teen_token"]))
    assert r2.json()["strengths"] == ["curiosity", "empathy"]
    me_after = requests.get(f"{API}/auth/me", headers=_h(st["teen_token"])).json()
    assert me_after.get("goals_completed", 0) == bg + 1


def test_identity_save_unknown_section():
    r = requests.post(f"{API}/identity", json={"section": "weird", "items": ["x"]}, headers=_h(st["teen_token"]))
    assert r.status_code == 400


def test_identity_suggest_ai():
    r = requests.post(f"{API}/identity/suggest", headers=_h(st["teen_token"]), timeout=45)
    assert r.status_code == 200
    d = r.json()
    for sec in ("strengths", "interests", "values", "longterm"):
        assert sec in d and isinstance(d[sec], list) and len(d[sec]) >= 1


# ---------- PARENT OVERVIEW v2 ----------
def test_parent_link_and_new_overview_fields_with_privacy():
    r = requests.post(f"{API}/family/link", json={"code": st["family_code"]}, headers=_h(st["parent_token"]))
    assert r.status_code == 200
    r2 = requests.get(f"{API}/parent/overview", headers=_h(st["parent_token"]))
    assert r2.status_code == 200
    o = r2.json()
    assert o["linked"] is True
    for k in ("wellbeing_score", "streak", "avg_mood_14d", "journal_count", "mood_dump_count",
              "blossoms", "habits_completed", "challenges_overcome", "goals_completed"):
        assert k in o, f"parent overview missing {k}"
    # Privacy: no journal/mood/coach text in body
    body = json.dumps(o).lower()
    for leak in ["tea by the window", "today felt heavy", "school noise", "can't focus", "school project"]:
        assert leak not in body, f"parent overview leaked content: {leak}"


def test_parent_cannot_access_new_endpoints():
    for ep in ["/life-map/summary", "/life-map/patterns", "/problem-solver/history", "/identity"]:
        r = requests.get(f"{API}{ep}", headers=_h(st["parent_token"]))
        assert r.status_code == 403, f"{ep} leaked to parent"
