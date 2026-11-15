from conftest import login

PLATE = {"material": "Sperrholzplatten", "length_cm": 100, "width_cm": 100, "thickness_cm": 1, "quantity": 1}


def test_login_rejects_bad_password(client):
    assert client.post("/api/auth/login", json={"username": "bauer", "password": "x"}).status_code == 401


def test_role_guard(client):
    assert client.get("/api/regnauer/items", headers=login(client, "bauer")).status_code == 403
    assert client.get("/api/regnauer/items").status_code == 401


def test_offer_accepts_needed_and_validates_dimensions(client):
    h = login(client, "meier")
    bad = client.post("/api/offers", json={"items": [{"material": "Holzbalken", "quantity": 1}]}, headers=h)
    assert bad.status_code == 422
    ok = client.post("/api/offers", json={"items": [PLATE]}, headers=h)
    assert ok.status_code == 200 and ok.json()["items"][0]["accepted"] is True


def test_unknown_material_is_rejected_at_boundary(client):
    r = client.post("/api/offers", json={"items": [{**PLATE, "material": "Glaswolle"}]}, headers=login(client, "meier"))
    assert r.status_code == 422


def test_produce_consumes_stock_and_scores(client):
    reg = login(client, "regnauer")
    before = client.get("/api/scoreboard").json()
    assert {r["name"] for r in before} >= {"Regnauer", "Holzwerk Bauer GmbH"}
    stock = len(client.get("/api/regnauer/modules", headers=reg).json())
    assert client.post("/api/regnauer/produce/wandelement_leichtbau", headers=reg).status_code == 200
    assert len(client.get("/api/regnauer/modules", headers=reg).json()) == stock + 1
    # Scores are whole persons now, so a single quarter-person module may not move them; the module count does.
    after = {r["name"]: r["modules"] for r in client.get("/api/scoreboard").json()}
    assert after["Holzwerk Bauer GmbH"] > {r["name"]: r["modules"] for r in before}["Holzwerk Bauer GmbH"]


def test_produce_fails_without_material(client):
    reg = login(client, "regnauer")
    # Beams are not delivered in seed data in sufficient amount for two Ständer elements.
    codes = [client.post("/api/regnauer/produce/holzstaender_element", headers=reg).status_code for _ in range(4)]
    assert 409 in codes


def test_aid_filter(client):
    aid = login(client, "drk")
    search = lambda **f: client.post("/api/aid/search", json={"people": 50, "filters": f}, headers=aid)
    all_ = search().json()
    assert all_["total_people"] > 0
    strict = search(insulation={"min": 9}).json()
    assert strict["total_people"] == 0 and strict["shortfall"] == 50
    # Only the Ständer element covers -15 °C; the lightweight wall starts at -5 °C.
    cold = search(temperature={"min": -15, "max": 20}).json()
    assert {g["recipe_id"] for g in cold["groups"]} == {"holzstaender_element"}
    assert search(temperature={"min": 10, "max": 0}).status_code == 422
    assert search(x={"min": 1}).status_code == 422


def test_recipe_ratings_validated(client):
    reg = login(client, "regnauer")
    rec = client.get("/api/regnauer/recipes", headers=reg).json()[0]
    body = {k: rec[k] for k in ("description", "build_minutes", "shelter_person_factor")}
    bad = client.put(f"/api/regnauer/recipes/{rec['id']}", json=body | {"ratings": {**rec["ratings"], "temperature": [30, -5]}}, headers=reg)
    assert bad.status_code == 422


def test_recipe_meta_update(client):
    reg = login(client, "regnauer")
    rec = client.get("/api/regnauer/recipes", headers=reg).json()[0]
    upd = {k: rec[k] for k in ("description", "shelter_person_factor", "ratings")} | {"build_minutes": 99}
    assert client.put(f"/api/regnauer/recipes/{rec['id']}", json=upd, headers=reg).json()["build_minutes"] == 99
    assert client.post("/api/regnauer/recipes", json={}, headers=reg).status_code == 405


def test_supplier_estimate(client):
    h = login(client, "bauer")
    e = client.get("/api/supplier/estimate", headers=h).json()
    assert e["potential_score"] >= 0 and e["credited_modules"] >= 0
    assert client.get("/api/supplier/estimate", headers=login(client, "regnauer")).status_code == 403


def test_logistics_requires_valid_json(client):
    h = login(client, "nordlicht")
    assert client.post("/api/logistics", json={"filename": "a.json", "content": "{"}, headers=h).status_code == 422
    assert client.post("/api/logistics", json={"filename": "a.json", "content": "{}"}, headers=h).status_code == 201


def test_produce_count_limited_and_atomic(client):
    reg = login(client, "regnauer")
    rec = next(r for r in client.get("/api/regnauer/buildable", headers=reg).json() if r["max_count"] >= 1)
    stock = len(client.get("/api/regnauer/modules", headers=reg).json())
    too_many = client.post(f"/api/regnauer/produce/{rec['id']}", json={"count": rec["max_count"] + 1}, headers=reg)
    assert too_many.status_code == 409
    assert len(client.get("/api/regnauer/modules", headers=reg).json()) == stock
    ok = client.post(f"/api/regnauer/produce/{rec['id']}", json={"count": rec["max_count"]}, headers=reg)
    assert ok.status_code == 200 and len(ok.json()) == rec["max_count"]
    assert all(r["id"] != rec["id"] for r in client.get("/api/regnauer/buildable", headers=reg).json())


def test_photo_analysis(client, monkeypatch):
    from app import vision
    sup = login(client, "bauer")
    img = "data:image/jpeg;base64,AAAA"
    monkeypatch.delenv("GEMINI_API_KEY", raising=False)
    assert client.post("/api/offers/analyze-photo", json={"image_data_url": img}, headers=sup).status_code == 503

    seen = {}

    def fake(payload):
        seen.update(payload)
        text = '{"material": "Rundhölzer", "length_cm": 200, "diameter_cm": 12, "quantity": 5, "note": "ok"}'
        return {"candidates": [{"content": {"parts": [{"text": text}]}}]}

    monkeypatch.setattr(vision, "_generate", fake)
    r = client.post("/api/offers/analyze-photo", json={"image_data_url": img}, headers=sup)
    assert r.status_code == 200 and r.json()["diameter_cm"] == 12 and r.json()["quantity"] == 5
    assert "Rundhölzer" in seen["contents"][0]["parts"][0]["text"]  # every material's format is in the request
    assert client.post("/api/offers/analyze-photo", json={"image_data_url": "x"}, headers=sup).status_code == 422
    assert client.post("/api/offers/analyze-photo", json={"image_data_url": img}, headers=login(client, "drk")).status_code == 403


def test_offer_with_new_material_fields(client):
    sup = login(client, "bauer")
    item = {"material": "Rundhölzer", "length_cm": 200, "diameter_cm": 12, "quantity": 3}
    r = client.post("/api/offers", json={"items": [item]}, headers=sup)
    assert r.status_code == 200 and r.json()["items"][0]["diameter_cm"] == 12
    bad = client.post("/api/offers", json={"items": [{**item, "diameter_cm": None}]}, headers=sup)
    assert bad.status_code == 422
