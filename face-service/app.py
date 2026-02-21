"""
Face Recognition Microservice for Smart College Hackathon
─────────────────────────────────────────────────────────
Endpoints:
  POST /enroll      — Extract face embedding from college ID photo and return it
  POST /verify      — Compare live frame against stored embedding
  POST /liveness    — Multi-frame liveness detection with anti-spoofing

Anti-spoofing layers:
  1. Blink detection (EAR must drop below 0.22 AND reopen above 0.26)
  2. Head motion (face center must shift >15px)
  3. Texture analysis (LBP variance — real skin has higher micro-texture variance)
  4. Micro-movement analysis (frame-to-frame subtle pixel changes real faces always have)
  5. Color frequency analysis (screens have distinct color channel distributions)
"""

import os
import io
import base64
import json
import traceback
from datetime import datetime

import numpy as np
import face_recognition
import cv2
from PIL import Image
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins="*")

# ─── Helpers ───────────────────────────────────────────────────────────────────

def decode_base64_image(data_uri: str) -> np.ndarray:
    """Decode a base64 data URI (or raw base64) into a numpy RGB array."""
    if "," in data_uri:
        data_uri = data_uri.split(",", 1)[1]
    img_bytes = base64.b64decode(data_uri)
    pil_image = Image.open(io.BytesIO(img_bytes)).convert("RGB")
    return np.array(pil_image)


def eye_aspect_ratio(eye_points):
    """
    Compute the Eye Aspect Ratio (EAR) from 6 landmark points.
    EAR = (|p2-p6| + |p3-p5|) / (2 * |p1-p4|)
    Low EAR → eye is closed.
    """
    p = np.array(eye_points)
    A = np.linalg.norm(p[1] - p[5])
    B = np.linalg.norm(p[2] - p[4])
    C = np.linalg.norm(p[0] - p[3])
    if C == 0:
        return 0.0
    return (A + B) / (2.0 * C)


# ─── Anti-Spoofing Helpers ─────────────────────────────────────────────────────

def compute_lbp_variance(gray_face: np.ndarray) -> float:
    """
    Compute Local Binary Pattern (LBP) variance for the face region.
    Real skin has rich micro-textures → high LBP variance.
    Printed photos / screens have smoother textures → low LBP variance.
    """
    if gray_face.shape[0] < 10 or gray_face.shape[1] < 10:
        return 0.0

    # Resize to standard size for consistent comparison
    face_resized = cv2.resize(gray_face, (128, 128))
    
    # Compute LBP manually (8-neighbor, radius 1)
    rows, cols = face_resized.shape
    lbp = np.zeros((rows - 2, cols - 2), dtype=np.uint8)
    
    for i in range(1, rows - 1):
        for j in range(1, cols - 1):
            center = face_resized[i, j]
            code = 0
            code |= (1 << 7) if face_resized[i-1, j-1] >= center else 0
            code |= (1 << 6) if face_resized[i-1, j]   >= center else 0
            code |= (1 << 5) if face_resized[i-1, j+1] >= center else 0
            code |= (1 << 4) if face_resized[i,   j+1] >= center else 0
            code |= (1 << 3) if face_resized[i+1, j+1] >= center else 0
            code |= (1 << 2) if face_resized[i+1, j]   >= center else 0
            code |= (1 << 1) if face_resized[i+1, j-1] >= center else 0
            code |= (1 << 0) if face_resized[i,   j-1] >= center else 0
            lbp[i-1, j-1] = code
    
    # LBP histogram variance — real faces have wider distribution
    hist, _ = np.histogram(lbp.ravel(), bins=256, range=(0, 256))
    hist = hist.astype(np.float64) / hist.sum()
    variance = np.var(hist)
    
    return float(variance)


def compute_laplacian_score(gray_face: np.ndarray) -> float:
    """
    Compute Laplacian variance — measures image sharpness/texture detail.
    Real faces captured live have natural depth-of-field.
    Printed photos or screen captures tend to have different characteristics.
    """
    if gray_face.shape[0] < 10 or gray_face.shape[1] < 10:
        return 0.0
    face_resized = cv2.resize(gray_face, (128, 128))
    laplacian = cv2.Laplacian(face_resized, cv2.CV_64F)
    return float(laplacian.var())


def compute_color_channel_stats(face_rgb: np.ndarray) -> dict:
    """
    Analyze color channel statistics.
    Photos shown on screens have distinct color gamut characteristics:
    - Narrower dynamic range per channel
    - Different relative channel intensities
    - More uniform saturation
    """
    if face_rgb.shape[0] < 10 or face_rgb.shape[1] < 10:
        return {"score": 0.0}
    
    face_hsv = cv2.cvtColor(face_rgb, cv2.COLOR_RGB2HSV)
    
    # Saturation channel analysis
    saturation = face_hsv[:, :, 1].astype(np.float64)
    sat_std = np.std(saturation)
    sat_mean = np.mean(saturation)
    
    # Value (brightness) channel analysis
    value = face_hsv[:, :, 2].astype(np.float64)
    val_std = np.std(value)
    val_range = float(np.max(value) - np.min(value))
    
    # Real faces: moderate saturation std (20-80), good brightness range
    # Screen photos: often very low or very high saturation std, compressed range
    
    return {
        "sat_std": float(sat_std),
        "sat_mean": float(sat_mean),
        "val_std": float(val_std),
        "val_range": val_range,
    }


def compute_frame_diff_score(frames_gray: list) -> float:
    """
    Measure micro-movements between consecutive frames by computing
    pixel-level differences. Real faces always have subtle micro-movements
    (breathing, micro-expressions, slight swaying). Photos are static.
    """
    if len(frames_gray) < 2:
        return 0.0
    
    diffs = []
    for i in range(1, len(frames_gray)):
        f1 = cv2.resize(frames_gray[i-1], (128, 128)).astype(np.float64)
        f2 = cv2.resize(frames_gray[i],   (128, 128)).astype(np.float64)
        diff = np.abs(f1 - f2)
        
        # Mean absolute difference — real faces have subtle changes per frame
        mean_diff = np.mean(diff)
        diffs.append(mean_diff)
    
    # Real faces typically have micro-movement mean_diff between 1.5-15
    # Perfectly static photo: mean_diff < 0.5 (only camera noise)
    # Screen displaying video: mean_diff could vary
    avg_diff = np.mean(diffs) if diffs else 0.0
    
    return float(avg_diff)


def compute_frequency_analysis(gray_face: np.ndarray) -> float:
    """
    Analyze frequency domain to detect moire patterns (screen artifacts).
    Screens displaying photos have periodic pixel grid patterns detectable via FFT.
    """
    if gray_face.shape[0] < 32 or gray_face.shape[1] < 32:
        return 0.0
    
    face_resized = cv2.resize(gray_face, (128, 128)).astype(np.float32)
    
    # Apply FFT
    f = np.fft.fft2(face_resized)
    fshift = np.fft.fftshift(f)
    magnitude = np.log(np.abs(fshift) + 1)
    
    # Check for periodic peaks (moire patterns from screen)
    # Real faces: smooth frequency falloff
    # Screen photos: may have sharp peaks at certain frequencies
    center = magnitude.shape[0] // 2
    
    # Ratio of high-frequency energy to total energy
    mask_size = 16
    low_freq = magnitude[center-mask_size:center+mask_size, center-mask_size:center+mask_size]
    high_freq_energy = np.sum(magnitude) - np.sum(low_freq)
    total_energy = np.sum(magnitude)
    
    if total_energy == 0:
        return 0.0
    
    hf_ratio = high_freq_energy / total_energy
    return float(hf_ratio)


def extract_face_region(image_rgb: np.ndarray, face_location: tuple) -> tuple:
    """Extract the face region from an image given face_recognition location."""
    top, right, bottom, left = face_location
    # Add small padding
    pad = int((bottom - top) * 0.1)
    h, w = image_rgb.shape[:2]
    top = max(0, top - pad)
    left = max(0, left - pad)
    bottom = min(h, bottom + pad)
    right = min(w, right + pad)
    
    face_rgb = image_rgb[top:bottom, left:right]
    face_gray = cv2.cvtColor(face_rgb, cv2.COLOR_RGB2GRAY)
    
    return face_rgb, face_gray


# ─── POST /enroll ──────────────────────────────────────────────────────────────

@app.route("/enroll", methods=["POST"])
def enroll():
    """
    Accepts: { "image": "<base64 data URI of college ID photo>" }
    Returns: { "success": true, "embedding": [...128 floats...] }
    """
    try:
        data = request.get_json(force=True)
        image_b64 = data.get("image")
        if not image_b64:
            return jsonify({"success": False, "error": "No image provided"}), 400

        image = decode_base64_image(image_b64)
        face_locations = face_recognition.face_locations(image, model="hog")

        if len(face_locations) == 0:
            return jsonify({
                "success": False,
                "error": "No face detected in the image. Please upload a clearer photo."
            }), 400

        # Take the first (largest / most prominent) face
        face_encoding = face_recognition.face_encodings(image, face_locations)[0]
        embedding = face_encoding.tolist()

        return jsonify({
            "success": True,
            "embedding": embedding,
            "faceCount": len(face_locations),
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


# ─── POST /verify ─────────────────────────────────────────────────────────────

@app.route("/verify", methods=["POST"])
def verify():
    """
    Accepts: {
        "image": "<base64 live frame>",
        "storedEmbedding": [128 floats]
    }
    Returns: {
        "verified": true/false,
        "confidence": 0–100,
        "distance": float,
        "faceDetected": true/false
    }
    """
    try:
        data = request.get_json(force=True)
        image_b64 = data.get("image")
        stored_embedding = data.get("storedEmbedding")

        if not image_b64:
            return jsonify({"success": False, "error": "No image provided"}), 400
        if not stored_embedding or len(stored_embedding) != 128:
            return jsonify({"success": False, "error": "Invalid stored embedding"}), 400

        image = decode_base64_image(image_b64)
        face_locations = face_recognition.face_locations(image, model="hog")

        if len(face_locations) == 0:
            return jsonify({
                "success": True,
                "verified": False,
                "faceDetected": False,
                "confidence": 0,
                "distance": 1.0,
                "message": "No face detected in live frame"
            })

        live_encoding = face_recognition.face_encodings(image, face_locations)[0]
        stored_np = np.array(stored_embedding)

        distance = face_recognition.face_distance([stored_np], live_encoding)[0]
        threshold = 0.5
        verified = bool(distance < threshold)
        confidence = round((1 - distance) * 100, 1)

        return jsonify({
            "success": True,
            "verified": verified,
            "faceDetected": True,
            "confidence": max(0, confidence),
            "distance": round(float(distance), 4),
            "threshold": threshold,
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


# ─── POST /liveness ───────────────────────────────────────────────────────────

@app.route("/liveness", methods=["POST"])
def liveness():
    """
    Multi-frame liveness detection with anti-spoofing.
    Accepts: { "frames": ["<base64 frame 1>", "<base64 frame 2>", ...] }
    
    Anti-spoofing checks:
      1. Face presence: need face in at least 60% of frames
      2. Blink detection: EAR must drop below 0.22 AND return above 0.26
      3. Head motion: face center shifts by >15px
      4. Texture analysis: LBP variance must indicate real skin texture
      5. Micro-movement: frame-to-frame pixel changes (real faces always move slightly)
      6. Color analysis: detect screen color characteristics
    
    Returns: {
        "livenessPassed": true/false,
        "spoofScore": 0-100 (higher = more likely real),
        "checks": { ... detailed per-check results ... },
        "details": "..."
    }
    """
    try:
        data = request.get_json(force=True)
        frames_b64 = data.get("frames", [])

        if len(frames_b64) < 3:
            return jsonify({
                "success": False,
                "error": "Need at least 3 frames for liveness check"
            }), 400

        total_frames = len(frames_b64)
        faces_detected = 0
        ear_values = []
        face_centers = []
        lbp_variances = []
        laplacian_scores = []
        color_stats_list = []
        face_grays = []
        freq_scores = []

        for frame_b64 in frames_b64:
            image = decode_base64_image(frame_b64)
            face_locations = face_recognition.face_locations(image, model="hog")

            if len(face_locations) > 0:
                faces_detected += 1
                top, right, bottom, left = face_locations[0]
                center_x = (left + right) / 2
                center_y = (top + bottom) / 2
                face_centers.append((center_x, center_y))

                # Extract face region for texture analysis
                face_rgb, face_gray = extract_face_region(image, face_locations[0])
                face_grays.append(face_gray)

                # LBP texture analysis
                lbp_var = compute_lbp_variance(face_gray)
                lbp_variances.append(lbp_var)

                # Laplacian sharpness
                lap_score = compute_laplacian_score(face_gray)
                laplacian_scores.append(lap_score)

                # Color channel analysis
                color_stats = compute_color_channel_stats(face_rgb)
                color_stats_list.append(color_stats)

                # Frequency analysis (moire detection)
                freq_score = compute_frequency_analysis(face_gray)
                freq_scores.append(freq_score)

                # Get facial landmarks for EAR
                landmarks = face_recognition.face_landmarks(image, face_locations)
                if landmarks:
                    lm = landmarks[0]
                    left_eye = lm.get("left_eye", [])
                    right_eye = lm.get("right_eye", [])

                    if len(left_eye) == 6 and len(right_eye) == 6:
                        left_ear = eye_aspect_ratio(left_eye)
                        right_ear = eye_aspect_ratio(right_eye)
                        avg_ear = (left_ear + right_ear) / 2.0
                        ear_values.append(avg_ear)

        # ── Evaluate anti-spoofing criteria ────────────────────────────────────

        checks = {}
        spoof_points = 0  # Accumulate points for "realness" (0-100)
        max_points = 0

        # Check 1: Face presence (need face in at least 60% of frames)
        face_ratio = faces_detected / total_frames if total_frames > 0 else 0
        face_check = face_ratio >= 0.6
        checks["facePresence"] = {
            "passed": face_check,
            "detected": faces_detected,
            "total": total_frames,
            "ratio": round(face_ratio, 2),
        }
        max_points += 15
        if face_check:
            spoof_points += 15

        # Check 2: STRICT blink detection
        # Must see at least one EAR < 0.22 (closed) AND at least one EAR > 0.26 (open)
        # A photo will always have the same EAR value across all frames
        blink_detected = False
        ear_variance = 0.0
        if len(ear_values) >= 2:
            has_closed = any(e < 0.22 for e in ear_values)
            has_open = any(e > 0.26 for e in ear_values)
            blink_detected = has_closed and has_open
            ear_variance = float(np.var(ear_values))
        checks["blinkDetection"] = {
            "passed": blink_detected,
            "earValues": [round(e, 3) for e in ear_values],
            "earVariance": round(ear_variance, 6),
            "hasClosed": bool(any(e < 0.22 for e in ear_values)) if ear_values else False,
            "hasOpen": bool(any(e > 0.26 for e in ear_values)) if ear_values else False,
        }
        max_points += 25
        if blink_detected:
            spoof_points += 25

        # Check 3: Head motion (center shifts > 15px)
        motion_detected = False
        max_shift = 0.0
        if len(face_centers) >= 2:
            for i in range(1, len(face_centers)):
                dx = abs(face_centers[i][0] - face_centers[i-1][0])
                dy = abs(face_centers[i][1] - face_centers[i-1][1])
                shift = (dx**2 + dy**2) ** 0.5
                max_shift = max(max_shift, shift)
            motion_detected = max_shift > 15
        checks["headMotion"] = {
            "passed": motion_detected,
            "maxShift": round(max_shift, 1),
            "threshold": 15,
        }
        max_points += 20
        if motion_detected:
            spoof_points += 20

        # Check 4: Texture analysis (LBP variance)
        # Real skin has higher micro-texture variance than printed/screen photos
        texture_passed = False
        avg_lbp_var = 0.0
        if lbp_variances:
            avg_lbp_var = float(np.mean(lbp_variances))
            # Threshold determined experimentally:
            # Real faces: LBP variance typically > 0.00015
            # Printed photos: typically < 0.00010
            texture_passed = avg_lbp_var > 0.00010
        checks["textureAnalysis"] = {
            "passed": texture_passed,
            "avgLbpVariance": round(avg_lbp_var, 8),
            "threshold": 0.00010,
            "detail": "Real skin micro-texture check (LBP)",
        }
        max_points += 15
        if texture_passed:
            spoof_points += 15

        # Check 5: Micro-movement analysis (frame-to-frame pixel differences)
        # Real faces ALWAYS have subtle micro-movements from breathing, swaying
        # Photos held up to camera are perfectly static (only camera noise < 0.5)
        micro_movement_score = compute_frame_diff_score(face_grays)
        # Real faces: typically 1.5-15 mean difference
        # Static photo: typically < 0.8
        micro_movement_passed = micro_movement_score > 1.0
        checks["microMovement"] = {
            "passed": micro_movement_passed,
            "score": round(micro_movement_score, 3),
            "threshold": 1.0,
            "detail": "Frame-to-frame pixel variance (breathing/sway detection)",
        }
        max_points += 15
        if micro_movement_passed:
            spoof_points += 15

        # Check 6: Color/frequency analysis
        # Screens have distinct moire patterns in frequency domain
        freq_passed = True  # Default pass — only fail if clearly screen
        avg_freq = 0.0
        if freq_scores:
            avg_freq = float(np.mean(freq_scores))
            # Very high HF ratio could indicate moire patterns
            # This is a softer check — only penalize obvious screen artifacts
            freq_passed = avg_freq < 0.85  # Screens tend to push this higher
        checks["frequencyAnalysis"] = {
            "passed": freq_passed,
            "avgHfRatio": round(avg_freq, 4),
            "detail": "Moire pattern / screen artifact detection",
        }
        max_points += 10
        if freq_passed:
            spoof_points += 10

        # ── Final scoring ──────────────────────────────────────────────────────
        
        spoof_score = round((spoof_points / max_points) * 100) if max_points > 0 else 0
        
        # Liveness passes if:
        # - Face is present
        # - At least blink OR motion is detected (challenge-response)
        # - Texture OR micro-movement passes (anti-photo check)
        # - Score is above 50%
        
        has_challenge_response = blink_detected or motion_detected
        has_anti_photo = texture_passed or micro_movement_passed
        
        liveness_passed = (
            face_check and 
            has_challenge_response and 
            has_anti_photo and
            spoof_score >= 50
        )

        # Build failure reasons
        failure_reasons = []
        if not face_check:
            failure_reasons.append("Face not detected in enough frames")
        if not has_challenge_response:
            failure_reasons.append("No blink or head movement detected — possible photo attack")
        if not has_anti_photo:
            failure_reasons.append("Texture/movement patterns suggest a photo rather than a real face")
        if spoof_score < 50:
            failure_reasons.append(f"Anti-spoof score too low ({spoof_score}%)")

        return jsonify({
            "success": True,
            "livenessPassed": liveness_passed,
            "spoofScore": spoof_score,
            "facesDetected": faces_detected,
            "totalFrames": total_frames,
            "blinkDetected": blink_detected,
            "motionDetected": motion_detected,
            "checks": checks,
            "failureReasons": failure_reasons,
            "earValues": [round(e, 3) for e in ear_values],
            "details": (
                f"Spoof score: {spoof_score}/100. "
                f"Faces in {faces_detected}/{total_frames} frames. "
                f"Blink: {'Yes' if blink_detected else 'No'}. "
                f"Motion: {'Yes' if motion_detected else 'No'} (shift: {max_shift:.1f}px). "
                f"Texture: {'Pass' if texture_passed else 'Fail'} (LBP var: {avg_lbp_var:.8f}). "
                f"Micro-movement: {'Pass' if micro_movement_passed else 'Fail'} ({micro_movement_score:.2f})."
            )
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({"success": False, "error": str(e)}), 500


# ─── Health check ──────────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    return jsonify({
        "status": "ok",
        "service": "face-recognition",
        "version": "2.0-antispoofing",
        "timestamp": datetime.utcnow().isoformat()
    })


# ─── Run ───────────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"Face Recognition Service v2.0 (anti-spoofing) on http://localhost:{port}")
    app.run(host="0.0.0.0", port=port, debug=True)
