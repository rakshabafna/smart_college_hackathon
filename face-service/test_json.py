"""Clean JSON output test for anti-spoofing."""
import base64, json, urllib.request, os

BASE = "http://localhost:5001"
img_path = os.path.join("..", "public", "id-photos", "sarthak.jpg")
with open(img_path, "rb") as f:
    img_b64 = "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()

data = json.dumps({"frames": [img_b64]*8}).encode()
req = urllib.request.Request(f"{BASE}/liveness", data=data, headers={"Content-Type": "application/json"})
resp = urllib.request.urlopen(req)
result = json.loads(resp.read().decode())

# Write clean JSON to file
with open("antispoof_detail.json", "w") as f:
    json.dump(result, f, indent=2)

print("DONE - see antispoof_detail.json")
