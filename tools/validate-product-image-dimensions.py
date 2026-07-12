"""Fail if any local public catalogue image is missing natural dimensions."""
from __future__ import annotations

import json
from pathlib import Path

from PIL import Image

root = Path(__file__).resolve().parents[1]
catalog = json.loads((root / "products.json").read_text(encoding="utf-8-sig"))
paths: set[str] = set()
for product in catalog["products"]:
    if product.get("publicationStatus", "published") != "published" or product.get("visibility", "visible") != "visible":
        continue
    paths.update([product.get("image", ""), *product.get("gallery", [])])
    for variant in product.get("variantImages", {}).values():
        if isinstance(variant, dict):
            paths.update([variant.get("hero", ""), *variant.get("gallery", [])])
        elif isinstance(variant, list):
            paths.update(variant)
        elif isinstance(variant, str):
            paths.add(variant)
for relative in sorted(path for path in paths if path and not path.startswith(("http:", "https:", "data:"))):
    source = root / relative
    if not source.exists():
        raise SystemExit(f"Missing public image: {relative}")
    with Image.open(source) as image:
        if image.width <= 0 or image.height <= 0:
            raise SystemExit(f"Invalid image dimensions: {relative}")
print(json.dumps({"status": "passed", "publicImagePaths": len(paths)}, indent=2))
