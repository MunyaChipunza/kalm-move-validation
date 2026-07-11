from __future__ import annotations

import cv2
import numpy as np


def integrate(alpha: np.ndarray, source_bgr: np.ndarray, polygon: np.ndarray) -> np.ndarray:
    """Use local luminance as a small, deterministic opacity modulation; never move source geometry."""
    x, y, w, h = cv2.boundingRect(polygon.astype(np.int32))
    local = source_bgr[max(0,y):y+h, max(0,x):x+w]
    if local.size == 0:
        return alpha
    grey = cv2.cvtColor(local, cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    texture = cv2.GaussianBlur(grey, (0, 0), 1.1)
    texture = cv2.resize(texture, (alpha.shape[1], alpha.shape[0]), interpolation=cv2.INTER_LINEAR)
    return np.clip(alpha.astype(np.float32) * (0.82 + texture * 0.18), 0, 255).astype(np.uint8)
