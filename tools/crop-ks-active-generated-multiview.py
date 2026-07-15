"""Split an internally generated 2×2 review sheet into named gallery views.

The source sheet is retained unchanged for audit.  Crops remove only the narrow
generated panel dividers; they do not retouch or alter garment pixels.
"""

from __future__ import annotations

import argparse
from pathlib import Path

from PIL import Image


VIEWS = (("hero-three-quarter", 0, 0), ("back", 1, 0), ("side", 0, 1), ("front", 1, 1))


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("destination", type=Path)
    args = parser.parse_args()
    args.destination.mkdir(parents=True, exist_ok=True)
    with Image.open(args.source) as image:
        image = image.convert("RGB")
        half_w, half_h = image.width // 2, image.height // 2
        # Keep a four-pixel margin within each quadrant to exclude divider artefacts.
        inset = max(4, min(image.width, image.height) // 500)
        for name, col, row in VIEWS:
            left = col * half_w + inset
            top = row * half_h + inset
            right = (col + 1) * half_w - inset
            bottom = (row + 1) * half_h - inset
            crop = image.crop((left, top, right, bottom))
            crop.save(args.destination / f"{name}.jpg", quality=94, subsampling=0, optimize=True)


if __name__ == "__main__":
    main()
