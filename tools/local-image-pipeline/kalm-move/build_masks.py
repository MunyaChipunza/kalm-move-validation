#!/usr/bin/env python3
"""Generate tight, reviewer-visible target masks only; no source image is changed."""
from __future__ import annotations

import json
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
REPORTS = ROOT / "reports"


def main() -> None:
    placement = json.loads((REPORTS / "kalm-move-women-buffalo-placement.json").read_text(encoding="utf-8"))
    mask_root = REPORTS / "zero-paid-image-masks"
    mask_root.mkdir(parents=True, exist_ok=True)
    for index, record in enumerate(placement["records"], start=1):
        source = cv2.imread(str(ROOT / record["sourceImage"]), cv2.IMREAD_COLOR)
        if source is None:
            continue
        mask = np.zeros(source.shape[:2], dtype=np.uint8)
        polygon = np.array(record["targetPlacementPolygon"], dtype=np.int32)
        cv2.fillConvexPoly(mask, polygon, 255)
        output = mask_root / f"{index:03d}-{Path(record['sourceImage']).stem}-target.png"
        cv2.imwrite(str(output), mask)
        record["incorrectLogoMask"] = None
        record["targetMask"] = str(output.relative_to(ROOT)).replace("\\", "/")
    (REPORTS / "kalm-move-women-buffalo-placement.json").write_text(json.dumps(placement, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"masks": len(placement["records"])}))


if __name__ == "__main__":
    main()
