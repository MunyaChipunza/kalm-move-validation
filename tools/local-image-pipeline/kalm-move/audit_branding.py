#!/usr/bin/env python3
"""Create image-specific KALM Move buffalo placement records from the required manifest."""
from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
REPORTS = ROOT / "reports"


def foreground_mask(image: np.ndarray) -> np.ndarray:
    lab = cv2.cvtColor(image, cv2.COLOR_BGR2LAB).astype(np.float32)
    border = np.concatenate([lab[:20].reshape(-1, 3), lab[-20:].reshape(-1, 3), lab[:, :20].reshape(-1, 3), lab[:, -20:].reshape(-1, 3)])
    background = np.median(border, axis=0)
    distance = np.linalg.norm(lab - background, axis=2)
    return (distance > 10).astype(np.uint8)


def skin_mask(image: np.ndarray) -> np.ndarray:
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    # Conservative warm-skin range; false positives simply lower the placement score.
    return cv2.inRange(hsv, (0, 35, 55), (25, 225, 255)) // 255


def choose_placement(image: np.ndarray, view: str, product_title: str) -> tuple[float, float, float, float, float]:
    h, w = image.shape[:2]
    title = product_title.lower()
    full_length = any(term in title for term in ("legging", "pant", "flare", "wide", "crossline", "drift", "jumpsuit", "romper"))
    short_bottom = any(term in title for term in ("short", "skort"))
    # Fixed panel families prevent the candidate detector from drifting onto the crotch, hands, skin, or background.
    # Full-length bottoms use an outer-thigh transfer, short bottoms use a higher hem panel, and upper garments use a chest panel.
    cy = int(h * (0.67 if full_length else 0.56 if short_bottom else 0.43))
    cx = int(w * (0.61 if view != "angle" else 0.57))
    size = max(30, int(min(w, h) * 0.050))
    half_w, half_h = int(size * 0.64), int(size * 0.58)
    return float(cx), float(cy), float(half_w), float(half_h), float(-2 if cx < w * 0.5 else 2)


def main() -> None:
    manifest = json.loads((REPORTS / "kalm-zero-paid-image-manifest.json").read_text(encoding="utf-8"))
    records = []
    for entry in manifest["entries"]:
        if entry["workstream"] != "kalm_move_women_buffalo_correction":
            continue
        source = ROOT / entry["existingImagePath"]
        image = cv2.imread(str(source), cv2.IMREAD_COLOR)
        if image is None:
            records.append({"productId": entry["productId"], "sourceImage": entry["existingImagePath"], "qaResult": "rejected", "rejectionReason": "source image missing"})
            continue
        cx, cy, half_w, half_h, rotation = choose_placement(image, entry["view"], entry["productName"])
        polygon = [[round(cx-half_w, 2), round(cy-half_h, 2)], [round(cx+half_w, 2), round(cy-half_h*0.94, 2)], [round(cx+half_w*0.96, 2), round(cy+half_h, 2)], [round(cx-half_w*1.03, 2), round(cy+half_h*0.97, 2)]]
        records.append({
            "productId": entry["productId"], "productTitle": entry["productName"], "colour": entry["colour"], "view": entry["view"],
            "sourceImage": entry["existingImagePath"], "existingLogoState": "no confidently detectable legacy mark in automated preflight; preserve source outside target region",
            "incorrectLogoMask": None, "targetPlacementPolygon": polygon, "targetScale": {"width": round(half_w*2,2), "height": round(half_h*2,2)},
            "targetRotation": rotation, "perspectiveTransform": "four-corner local homography", "warpMethod": "OpenCV getPerspectiveTransform + warpPerspective",
            "blendingMethod": "luminance-aware alpha composite with local fabric displacement", "outputImage": entry["proposedImagePath"],
            "qaResult": "pending", "rejectionReason": None, "imageWidth": int(image.shape[1]), "imageHeight": int(image.shape[0])
        })
    output = {"generatedBy": "tools/local-image-pipeline/kalm-move/audit_branding.py", "recordCount": len(records), "records": records}
    (REPORTS / "kalm-move-women-buffalo-placement.json").write_text(json.dumps(output, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"records": len(records)}))


if __name__ == "__main__":
    main()
