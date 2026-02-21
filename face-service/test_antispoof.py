"""Test anti-spoofing: static photos should FAIL liveness."""
import base64, json, urllib.request, os

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
with open(img_path, "rb") as f:
    img_b64 = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()

print("="*60)
print("TEST: Static photo attack (same image 8 times)")
print("A real attacker would hold up a photo to the camera.")
print("The system should REJECT this as a spoofing attempt.")
print("="*60)

# Simulate a photo attack: same image repeated 8 times
# (as if someone held a printed photo in front of the camera)
r, s = post("/liveness", {"frames": [img_b64]*8})

print(f"\n  Liveness Passed: {r.get('livenessPassed')}")
print(f"  Spoof Score: {r.get('spoofScore')}/100")
print(f"  Blink Detected: {r.get('blinkDetected')}")
print(f"  Motion Detected: {r.get('motionDetected')}")

checks = r.get("checks", {})
for name, check in checks.items():
    passed = check.get("passed", "?")
    print(f"  {name}: {'PASS' if passed else 'FAIL'}")
    for k, v in check.items():
        if k != "passed":
            print(f"    {k}: {v}")

reasons = r.get("failureReasons", [])
if reasons:
    print(f"\n  Failure Reasons:")
    for reason in reasons:
        print(f"    X {reason}")

print(f"\n  Details: {r.get('details', '')}")

if not r.get("livenessPassed"):
    print("\n  ANTI-SPOOFING WORKING: Static photo correctly REJECTED!")
else:
    print("\n  WARNING: Static photo was NOT rejected. Anti-spoofing needs tuning.")
