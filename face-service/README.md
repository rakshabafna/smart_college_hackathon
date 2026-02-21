# Face Recognition Microservice

Python Flask backend for **AI-powered face verification** in the Smart College Hackathon portal.

## Features

- **Face Enrollment** (`POST /enroll`) — Extracts 128D face embedding from college ID photo
- **Face Verification** (`POST /verify`) — Compares live face against stored embedding (L2 distance, threshold 0.5)
- **Liveness Detection** (`POST /liveness`) — Multi-frame blink detection (EAR) + head motion tracking

## Quick Setup

```bash
# Install dependencies (Windows - uses dlib-bin for pre-built binaries)
python -m pip install dlib-bin
python -m pip install face_recognition --no-deps
python -m pip install face_recognition_models Click
python -m pip install opencv-python numpy flask flask-cors pillow

# Start the service
python app.py
# → 🧠 Face Recognition Service running on http://localhost:5001
```

## API Reference

### `POST /enroll`
Extract face embedding from an image.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,/9j/4AAQ..."
}
```

**Response:**
```json
{
  "success": true,
  "embedding": [0.123, -0.456, ...],  // 128 float values
  "faceCount": 1
}
```

### `POST /verify`
Compare live face against stored embedding.

**Request:**
```json
{
  "image": "data:image/jpeg;base64,...",
  "storedEmbedding": [128 float values]
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "faceDetected": true,
  "confidence": 87.3,
  "distance": 0.127,
  "threshold": 0.5
}
```

### `POST /liveness`
Multi-frame liveness detection.

**Request:**
```json
{
  "frames": ["base64_frame_1", "base64_frame_2", ...]
}
```

**Response:**
```json
{
  "success": true,
  "livenessPassed": true,
  "hackathonLenient": true,
  "facesDetected": 4,
  "totalFrames": 5,
  "blinkDetected": true,
  "motionDetected": true,
  "earValues": [0.28, 0.19, 0.27, 0.31]
}
```

### `GET /health`
Health check.

## Architecture

```
Student uploads College ID photo
         ↓
Frontend → POST /api/face-enroll → Python /enroll
         ↓
Backend extracts 128D embedding → saved to Firestore
         ↓
Student starts live verification
         ↓
Frontend captures 5 frames → POST /api/face-liveness → Python /liveness
         ↓
Liveness check (blink + motion analysis)
         ↓
Final frame → POST /api/verify-face → Python /verify
         ↓
face_distance(stored, live) < 0.5 → ✅ Verified
```

## Firestore Structure

```
users/
  {uid}/
    faceEmbedding: [128 float values]
    faceVerified: true/false
    faceConfidence: 0-100
    livenessPassed: true/false

verificationSessions/
  {sessionId}/
    studentUid: string
    verified: true/false
    confidence: 96
    livenessPassed: true
    blinkDetected: true
    motionDetected: true
    timestamp: Timestamp
```
