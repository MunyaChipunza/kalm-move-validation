#!/usr/bin/env python3
from __future__ import annotations

import json
from collections import defaultdict
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parents[3]
REPORTS = ROOT / "reports"


def tile(image, label):
    preview = cv2.resize(image, (180, 270), interpolation=cv2.INTER_AREA)
    canvas = np.full((300, 180, 3), 244, dtype=np.uint8)
    canvas[:270] = preview
    cv2.putText(canvas, label[:25], (8, 290), cv2.FONT_HERSHEY_SIMPLEX, 0.35, (25,25,25), 1, cv2.LINE_AA)
    return canvas


def main() -> None:
    placement = json.loads((REPORTS / "kalm-move-women-buffalo-placement.json").read_text(encoding="utf-8"))
    grouped = defaultdict(list)
    for record in placement["records"]:
        grouped[record["productId"]].append(record)
    sheet_root = REPORTS / "zero-paid-image-visual-evidence" / "move-contact-sheets"
    sheet_root.mkdir(parents=True, exist_ok=True)
    for product_id, records in grouped.items():
        tiles = []
        for record in records:
            output = cv2.imread(str(ROOT / record["outputImage"]), cv2.IMREAD_COLOR)
            if output is not None:
                tiles.append(tile(output, f"{record['colour']} {record['view']} {record['qaResult']}"))
        rows = []
        for start in range(0, len(tiles), 5):
            row = tiles[start:start+5]
            row += [np.full_like(tiles[0], 244) for _ in range(5-len(row))]
            rows.append(np.hstack(row))
        if rows:
            sheet = np.vstack(rows)
            cv2.imwrite(str(sheet_root / f"{product_id}.webp"), sheet, [cv2.IMWRITE_WEBP_QUALITY, 90])
    print(json.dumps({"contactSheets": len(grouped)}))


if __name__ == "__main__":
    main()
