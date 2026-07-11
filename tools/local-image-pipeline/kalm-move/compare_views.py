#!/usr/bin/env python3
from __future__ import annotations

import hashlib
import json
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
REPORTS = ROOT / "reports"


def digest(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def main() -> None:
    placement = json.loads((REPORTS / "kalm-move-women-buffalo-placement.json").read_text(encoding="utf-8"))
    heat_root = REPORTS / "zero-paid-image-visual-evidence" / "move-diff-heatmaps"
    heat_root.mkdir(parents=True, exist_ok=True)
    approved = 0
    for index, record in enumerate(placement["records"], start=1):
        source = cv2.imread(str(ROOT / record["sourceImage"]), cv2.IMREAD_COLOR)
        output_path = ROOT / record["outputImage"]
        output = cv2.imread(str(output_path), cv2.IMREAD_COLOR)
        if source is None or output is None or source.shape != output.shape:
            record["qaResult"] = "rejected"; record["rejectionReason"] = "missing or dimension-mismatched candidate"; continue
        difference = cv2.absdiff(source, output)
        diff_luma = cv2.cvtColor(difference, cv2.COLOR_BGR2GRAY)
        polygon = np.array(record["targetPlacementPolygon"], dtype=np.int32)
        expected = np.zeros(source.shape[:2], dtype=np.uint8)
        cv2.fillConvexPoly(expected, polygon, 255)
        expected = cv2.dilate(expected, np.ones((13,13), np.uint8), iterations=1)
        outside = (diff_luma > 34) & (expected == 0)
        outside_ratio = float(outside.mean())
        inside = (diff_luma > 12) & (expected > 0)
        visible_ratio = float(inside.mean())
        heat = cv2.applyColorMap(cv2.normalize(diff_luma, None, 0, 255, cv2.NORM_MINMAX), cv2.COLORMAP_INFERNO)
        heat_path = heat_root / f"{index:03d}-{Path(record['sourceImage']).stem}-heatmap.webp"
        cv2.imwrite(str(heat_path), heat, [cv2.IMWRITE_WEBP_QUALITY, 88])
        record["pixelDifferenceHeatmap"] = str(heat_path.relative_to(ROOT)).replace("\\", "/")
        record["outsideTargetDifferenceRatio"] = round(outside_ratio, 7)
        record["visibleTargetDifferenceRatio"] = round(visible_ratio, 7)
        if outside_ratio <= 0.003 and visible_ratio > 0.00002:
            record["qaResult"] = "approved"
            record["rejectionReason"] = None
            record["finalHash"] = digest(output_path)
            approved += 1
        else:
            record["qaResult"] = "rejected"
            record["rejectionReason"] = f"pixel changes outside intended region ({outside_ratio:.6f}) or insufficient visible mark ({visible_ratio:.6f})"
    (REPORTS / "kalm-move-women-buffalo-placement.json").write_text(json.dumps(placement, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"approved": approved, "rejected": len(placement["records"]) - approved}))


if __name__ == "__main__":
    main()
