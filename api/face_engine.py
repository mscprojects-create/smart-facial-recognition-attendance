"""
api/face_engine.py  (Vercel / serverless build)
===============================================
Dependency-light recognition engine used for the cloud demo.

Unlike the local backend (which uses dlib + OpenCV for true facial
recognition), this version uses a **perceptual hash (dHash)** computed with
Pillow + NumPy only. It contains no native ML build dependencies, so it runs
on Vercel's Python serverless runtime.

How the demo works with this engine
-----------------------------------
- On registration we dHash each of the 5 uploaded photos -> a 256-bit vector.
- On scan we dHash the captured frame and compare it to the gallery by
  normalised Hamming distance. Holding up one of the registered photos (printed
  or on a phone) yields a near-zero distance -> a confident match.

This is an honest "perceptual match", not biometric face recognition. The
local backend/ keeps the real dlib pipeline for offline use.
"""
from __future__ import annotations

import io
import os
from typing import Optional

import numpy as np
from PIL import Image

HASH_SIZE = 16                       # -> 16 * 16 = 256-bit fingerprint
TOLERANCE = float(os.environ.get("FACE_MATCH_TOLERANCE", "0.22"))  # 0..1, lower = stricter
_HAS_DLIB = False                    # advertised at /api/health


def _dhash(image_bytes: bytes) -> Optional[list[float]]:
    """Return a 256-length 0/1 perceptual-hash vector, or None on decode error."""
    try:
        img = (Image.open(io.BytesIO(image_bytes))
               .convert("L")
               .resize((HASH_SIZE + 1, HASH_SIZE), Image.LANCZOS))
    except Exception:
        return None
    px = np.asarray(img, dtype=np.float32)
    diff = px[:, 1:] > px[:, :-1]            # row-wise gradient -> HASH_SIZE x HASH_SIZE
    return diff.flatten().astype(np.float32).tolist()


# Public API mirrors the real engine so app code is unchanged ----------------
def encode_face(image_bytes: bytes) -> Optional[list[float]]:
    return _dhash(image_bytes)


def match_face(probe_bytes: bytes, gallery: list[dict]) -> dict:
    probe = _dhash(probe_bytes)
    if probe is None:
        return {"result": "no_face"}
    if not gallery:
        return {"result": "unknown", "distance": 1.0}

    probe_vec = np.array(probe, dtype=np.float32)
    best_dist, best = 1.0, None
    for g in gallery:
        vec = np.array(g["encoding"], dtype=np.float32)
        if vec.shape != probe_vec.shape:
            continue                          # skip incompatible (e.g. seed) vectors
        dist = float(np.mean(np.abs(vec - probe_vec)))  # normalised Hamming
        if dist < best_dist:
            best_dist, best = dist, g

    if best is not None and best_dist <= TOLERANCE:
        return {
            "result": "match",
            "student_id": best["student_id"],
            "full_name": best["full_name"],
            "roll_number": best["roll_number"],
            "distance": round(best_dist, 4),
            "confidence": round(max(0.0, 1.0 - best_dist), 4),
        }
    return {"result": "unknown", "distance": round(best_dist, 4)}
