#!/usr/bin/env python3
from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np

from fabric_displacement import integrate

ROOT = Path(__file__).resolve().parents[3]
REPORTS = ROOT / "reports"
MARK = ROOT / "assets/branding/kalm-buffalo/kalm-buffalo-mark.png"


def crop_mark() -> np.ndarray:
    mark = cv2.imread(str(MARK), cv2.IMREAD_UNCHANGED)
    if mark is None or mark.shape[2] != 4:
        raise RuntimeError("Approved buffalo mark is missing transparency")
    alpha = mark[:, :, 3]
    x, y, w, h = cv2.boundingRect(alpha)
    return mark[y:y+h, x:x+w]


def place(source: np.ndarray, record: dict, mark: np.ndarray) -> np.ndarray:
    polygon = np.array(record["targetPlacementPolygon"], dtype=np.float32)
    width = int(max(20, record["targetScale"]["width"]))
    height = int(max(20, record["targetScale"]["height"]))
    source_quad = np.array([[0,0],[width-1,0],[width-1,height-1],[0,height-1]], dtype=np.float32)
    resized = cv2.resize(mark, (width, height), interpolation=cv2.INTER_AREA)
    transform = cv2.getPerspectiveTransform(source_quad, polygon)
    warped = cv2.warpPerspective(resized, transform, (source.shape[1], source.shape[0]), flags=cv2.INTER_LINEAR, borderMode=cv2.BORDER_CONSTANT)
    alpha = warped[:, :, 3]
    alpha = integrate(alpha, source, polygon)
    # Preserve the approved artwork shape; only adapt ink tone for garment contrast.
    patch_luma = cv2.cvtColor(source, cv2.COLOR_BGR2GRAY)[alpha > 0].mean() if np.any(alpha > 0) else 128
    ink = np.full_like(source, 245 if patch_luma < 112 else 16)
    alpha = cv2.GaussianBlur(alpha, (0, 0), 0.35)
    composite = source.astype(np.float32)
    blend = (alpha.astype(np.float32) / 255.0 * 0.78)[:, :, None]
    composite = composite * (1.0 - blend) + ink.astype(np.float32) * blend
    return np.clip(composite, 0, 255).astype(np.uint8)


def main() -> None:
    placement = json.loads((REPORTS / "kalm-move-women-buffalo-placement.json").read_text(encoding="utf-8"))
    mark = crop_mark()
    for record in placement["records"]:
        source = cv2.imread(str(ROOT / record["sourceImage"]), cv2.IMREAD_COLOR)
        if source is None:
            record["qaResult"] = "rejected"; record["rejectionReason"] = "source missing"; continue
        output = ROOT / record["outputImage"]
        output.parent.mkdir(parents=True, exist_ok=True)
        result = place(source, record, mark)
        if not cv2.imwrite(str(output), result, [cv2.IMWRITE_WEBP_QUALITY, 96]):
            record["qaResult"] = "rejected"; record["rejectionReason"] = "WebP write failed"; continue
        record["qaResult"] = "candidate_rendered"
    (REPORTS / "kalm-move-women-buffalo-placement.json").write_text(json.dumps(placement, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"candidates": len(placement["records"])}))


if __name__ == "__main__":
    main()
