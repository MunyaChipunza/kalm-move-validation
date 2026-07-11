#!/usr/bin/env python3
import argparse
import json
import sys
from pathlib import Path

SCRIPT_DIR = Path(__file__).resolve().parent
if str(SCRIPT_DIR) not in sys.path:
    sys.path.append(str(SCRIPT_DIR))
from render_accessory import render

VIEWS = ["hero-three-quarter", "opposite-side", "component-layout", "material-detail", "lifestyle-use", "compatible-appliance"]


def options():
    raw = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
    parser = argparse.ArgumentParser()
    parser.add_argument("--output-root", required=True)
    parser.add_argument("--definitions", default=str(SCRIPT_DIR / "product_definitions.json"))
    parser.add_argument("--product-id")
    return parser.parse_args(raw)


if __name__ == "__main__":
    args = options()
    products = json.loads(Path(args.definitions).read_text(encoding="utf-8"))["products"]
    if args.product_id:
        products = [item for item in products if item["id"] == args.product_id]
        if not products:
            raise SystemExit(f"Unknown product id: {args.product_id}")
    output_root = Path(args.output_root)
    for product in products:
        for index, view in enumerate(VIEWS, start=1):
            output = output_root / f"{product['slug']}-v2" / f"{index:02d}-{view}.webp"
            print(f"Rendering {product['id']} / {view}", flush=True)
            render(product, view, output)
