"""
face_engine.py
==============
Core facial-recognition logic for the attendance system.

Pipeline
--------
1. Training  : an admin uploads <=5 photos of a student. For each photo we
               detect the face, compute a 128-dimension encoding (dlib via the
               `face_recognition` library) and persist the vector in Supabase
               (table `face_encodings`).
2. Matching  : the live scanner sends a single captured frame. We encode the
               face in the frame and compare it (Euclidean distance) against
               every stored encoding. The closest student within TOLERANCE
               wins; anything farther away is reported as an unknown face.

The module is intentionally framework-agnostic: it takes raw image bytes and
returns plain dicts, so it can be unit-tested without Flask or a webcam.
"""
from __future__ import annotations

import io
import os
from typing import Optional

import numpy as np
from PIL import Image

try:
    import face_recognition  # dlib-backed; the real engine
    _HAS_DLIB = True
except Exception:                      # pragma: no cover - allows import on machines w/o dlib
    face_recognition = None
    _HAS_DLIB = False

# Lower tolerance => stricter match. dlib's own default is 0.6; 0.50 is a good
# classroom value that rejects look-alikes while tolerating lighting changes.
TOLERANCE: float = float(os.environ.get("FACE_MATCH_TOLERANCE", "0.50"))


# --------------------------------------------------------------------------- #
#  Low-level helpers
# --------------------------------------------------------------------------- #
def _bytes_to_rgb(image_bytes: bytes) -> np.ndarray:
    """Decode arbitrary image bytes (jpg/png/webcam frame) to an RGB ndarray."""
    img = Image.open(io.BytesIO(image_bytes)).convert("RGB")
    return np.array(img)


def encode_face(image_bytes: bytes) -> Optional[list[float]]:
    """
    Detect the most prominent face in an image and return its 128-d encoding
    as a plain python list (JSON / Postgres friendly). Returns None when no
    face is found.
    """
    if not _HAS_DLIB:
        raise RuntimeError(
            "face_recognition/dlib is not installed. Run "
            "`pip install -r requirements.txt` (needs cmake + a C++ compiler)."
        )

    rgb = _bytes_to_rgb(image_bytes)
    boxes = face_recognition.face_locations(rgb, model="hog")  # 'cnn' = slower/accurate
    if not boxes:
        return None
    # Keep the largest face (closest to camera) if several are present.
    boxes.sort(key=lambda b: (b[2] - b[0]) * (b[1] - b[3]), reverse=True)
    encodings = face_recognition.face_encodings(rgb, known_face_locations=[boxes[0]])
    if not encodings:
        return None
    return encodings[0].tolist()


# --------------------------------------------------------------------------- #
#  Matching against a known gallery
# --------------------------------------------------------------------------- #
def match_face(
    probe_bytes: bytes,
    gallery: list[dict],
) -> dict:
    """
    Compare a probe image against a gallery of stored encodings.

    Parameters
    ----------
    probe_bytes : raw bytes of the captured webcam frame.
    gallery     : list of dicts shaped like
                  {"student_id": str, "full_name": str,
                   "roll_number": str, "encoding": list[float]}

    Returns
    -------
    dict with one of three outcomes:
      {"result": "no_face"}                      -> nothing detected in frame
      {"result": "unknown", "distance": float}   -> face found, no DB match
      {"result": "match", "student_id": ...,      -> recognised student
       "full_name": ..., "roll_number": ...,
       "distance": float, "confidence": float}
    """
    probe = encode_face(probe_bytes)
    if probe is None:
        return {"result": "no_face"}

    if not gallery:
        return {"result": "unknown", "distance": 1.0}

    probe_vec = np.array(probe)
    known = np.array([g["encoding"] for g in gallery])      # (N, 128)
    distances = np.linalg.norm(known - probe_vec, axis=1)   # Euclidean per row
    best_idx = int(np.argmin(distances))
    best_dist = float(distances[best_idx])

    if best_dist <= TOLERANCE:
        g = gallery[best_idx]
        return {
            "result": "match",
            "student_id": g["student_id"],
            "full_name": g["full_name"],
            "roll_number": g["roll_number"],
            "distance": round(best_dist, 4),
            # crude but intuitive 0..1 confidence for the UI
            "confidence": round(max(0.0, 1.0 - best_dist), 4),
        }

    return {"result": "unknown", "distance": round(best_dist, 4)}
