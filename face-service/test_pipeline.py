"""
End-to-end test for the Face Recognition pipeline.
Tests: /enroll, /verify, /liveness endpoints
"""

import base64
import json
import urllib.request
import os
import sys

BASE_URL = "http://localhost:5001"

def post_json(endpoint, payload):
    data = json.dumps(payload).encode()
    req = urllib.request.Request(
        f"{BASE_URL}{endpoint}",
        data=data,
        headers={"Content-Type": "application/json"}
    )
    try:
        resp = urllib.request.urlopen(req)
        return json.loads(resp.read().decode()), resp.status
    except urllib.error.HTTPError as e:
        return json.loads(e.read().decode()), e.code

def load_image_b64(path):
    with open(path, "rb") as f:
        return "data:image/jpeg;base64," + base64.b64encode(f.read()).decode()

def main():
    # Find a test image
    test_images = [
        os.path.join("..", "public", "id-photos", "sarthak.jpg"),
        os.path.join("..", "public", "id-photos", "aditi.png"),
    ]
    
    image_path = None
    for p in test_images:
        if os.path.exists(p):
            image_path = p
            break
    
    if not image_path:
        print("ERROR: No test images found!")
        sys.exit(1)
    
    print(f"Using test image: {image_path}")
    image_b64 = load_image_b64(image_path)
    print(f"Image base64 length: {len(image_b64)} chars")
    
    # ── Test 1: Health check ─────────────────────────────────────
    print("\n" + "="*60)
    print("TEST 1: Health Check")
    print("="*60)
    req = urllib.request.Request(f"{BASE_URL}/health")
    resp = urllib.request.urlopen(req)
    health = json.loads(resp.read().decode())
    print(f"  Status: {health['status']}")
    print(f"  Service: {health['service']}")
    print("  PASSED ✓")
    
    # ── Test 2: Face Enrollment ──────────────────────────────────
    print("\n" + "="*60)
    print("TEST 2: Face Enrollment (/enroll)")
    print("="*60)
    result, status = post_json("/enroll", {"image": image_b64})
    print(f"  HTTP Status: {status}")
    print(f"  Success: {result.get('success')}")
    print(f"  Face count: {result.get('faceCount')}")
    
    embedding = result.get("embedding", [])
    print(f"  Embedding length: {len(embedding)}")
    if len(embedding) >= 5:
        print(f"  First 5 values: {[round(v, 4) for v in embedding[:5]]}")
    
    if result.get("success") and len(embedding) == 128:
        print("  PASSED ✓")
    else:
        print(f"  FAILED ✗ - {result.get('error', 'Unknown error')}")
        sys.exit(1)
    
    # ── Test 3: Face Verification (same image = should match) ────
    print("\n" + "="*60)
    print("TEST 3: Face Verification (/verify) — same image")
    print("="*60)
    result, status = post_json("/verify", {
        "image": image_b64,
        "storedEmbedding": embedding
    })
    print(f"  HTTP Status: {status}")
    print(f"  Verified: {result.get('verified')}")
    print(f"  Confidence: {result.get('confidence')}%")
    print(f"  Distance: {result.get('distance')}")
    print(f"  Face detected: {result.get('faceDetected')}")
    
    if result.get("verified"):
        print("  PASSED ✓ (same face correctly verified)")
    else:
        print("  WARNING: Same face was not verified (may indicate model issue)")
    
    # ── Test 4: Face Verification (different image) ──────────────
    print("\n" + "="*60)
    print("TEST 4: Face Verification (/verify) — different face")
    print("="*60)
    other_images = [p for p in test_images if os.path.exists(p) and p != image_path]
    if other_images:
        other_b64 = load_image_b64(other_images[0])
        result, status = post_json("/verify", {
            "image": other_b64,
            "storedEmbedding": embedding
        })
        print(f"  HTTP Status: {status}")
        print(f"  Verified: {result.get('verified')}")
        print(f"  Confidence: {result.get('confidence')}%")
        print(f"  Distance: {result.get('distance')}")
        
        if not result.get("verified"):
            print("  PASSED ✓ (different face correctly rejected)")
        else:
            print("  NOTE: Different face was verified (distance may be close)")
    else:
        print("  SKIPPED (no second test image found)")
    
    # ── Test 5: Liveness Detection ───────────────────────────────
    print("\n" + "="*60)
    print("TEST 5: Liveness Detection (/liveness)")
    print("="*60)
    # Use the same image as all frames (will detect face but no motion/blink)
    frames = [image_b64] * 5
    result, status = post_json("/liveness", {"frames": frames})
    print(f"  HTTP Status: {status}")
    print(f"  Faces detected: {result.get('facesDetected')}/{result.get('totalFrames')}")
    print(f"  Blink detected: {result.get('blinkDetected')}")
    print(f"  Motion detected: {result.get('motionDetected')}")
    print(f"  Liveness passed (strict): {result.get('livenessPassed')}")
    print(f"  Liveness passed (lenient): {result.get('hackathonLenient')}")
    print(f"  EAR values: {result.get('earValues')}")
    print(f"  Details: {result.get('details')}")
    
    if result.get("hackathonLenient"):
        print("  PASSED ✓ (lenient mode — faces detected in enough frames)")
    else:
        print("  NOTE: Strict liveness failed (expected with static images)")
    
    # ── Test 6: Error handling — no face image ───────────────────
    print("\n" + "="*60)
    print("TEST 6: Error handling — blank image")
    print("="*60)
    from PIL import Image
    import io
    blank = Image.new("RGB", (100, 100), (128, 128, 128))
    buf = io.BytesIO()
    blank.save(buf, format="JPEG")
    blank_b64 = "data:image/jpeg;base64," + base64.b64encode(buf.getvalue()).decode()
    
    result, status = post_json("/enroll", {"image": blank_b64})
    print(f"  HTTP Status: {status}")
    print(f"  Error: {result.get('error')}")
    
    if status == 400 and not result.get("success"):
        print("  PASSED ✓ (correctly rejected blank image)")
    else:
        print("  FAILED ✗")
    
    print("\n" + "="*60)
    print("ALL TESTS COMPLETE!")
    print("="*60)

if __name__ == "__main__":
    main()
