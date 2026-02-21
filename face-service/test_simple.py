"""Simplified pipeline test — ASCII only output, no unicode."""
import base64, json, urllib.request, os, sys, io

BASE = "http://localhost:5001"

def post(endpoint, payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(f"{BASE}{endpoint}", data=data, headers={"Content-Type": "application/json"})
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read().decode()), resp.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode()), e.code

img_path = os.path.join("..", "public", "id-photos", "sarthak.jpg")
img2_path = os.path.join("..", "public", "id-photos", "aditi.png")

with open(img_path, "rb") as f:
    img_b64 = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()

with open(img2_path, "rb") as f:
    img2_b64 = "data:image/png;base64," + base64.b64encode(f.read()).decode()

# TEST 1: Health
req = urllib.request.Request(f"{BASE}/health")
resp = urllib.request.urlopen(req)
h = json.loads(resp.read().decode())
print("[TEST 1] Health:", h["status"])

# TEST 2: Enroll
r, s = post("/enroll", {"image": img_b64})
emb = r.get("embedding", [])
print(f"[TEST 2] Enroll: success={r['success']}, faces={r.get('faceCount')}, embedding_len={len(emb)}")

# TEST 3: Verify same image
r, s = post("/verify", {"image": img_b64, "storedEmbedding": emb})
print(f"[TEST 3] Verify SAME: verified={r.get('verified')}, confidence={r.get('confidence')}%, distance={r.get('distance')}")

# TEST 4: Verify different face
r, s = post("/verify", {"image": img2_b64, "storedEmbedding": emb})
print(f"[TEST 4] Verify DIFF: verified={r.get('verified')}, confidence={r.get('confidence')}%, distance={r.get('distance')}")

# TEST 5: Liveness (static frames)
r, s = post("/liveness", {"frames": [img_b64]*5})
print(f"[TEST 5] Liveness: faces={r.get('facesDetected')}/{r.get('totalFrames')}, blink={r.get('blinkDetected')}, motion={r.get('motionDetected')}, lenient={r.get('hackathonLenient')}")

# TEST 6: No face
from PIL import Image
blank = Image.new("RGB", (100, 100), (128, 128, 128))
buf = io.BytesIO()
blank.save(buf, format="JPEG")
blank_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
r, s = post("/enroll", {"image": blank_b64})
print(f"[TEST 6] No face: status={s}, error={r.get('error','none')}")

print("\nALL TESTS DONE!")
