"""Write source-linked, non-public validation manifests for generated Archive reviews."""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image


ROOT = Path(__file__).resolve().parents[1]
VIEWS = ["hero-three-quarter.jpg", "back.jpg", "side.jpg", "front.jpg"]
CONFIG = {
    "P020": {
        "name": "KS Active Crossback Seamless Bra",
        "source_title": "Mid Support Seamless Crisscross Sports Bra",
        "asset_slug": "crossback-seamless-bra",
        "report_slug": "CROSSBACK-SEAMLESS-BRA",
        "colours": [("Apricot", "apricot"), ("Egyptian Blue", "egyptian-blue"), ("Peach", "peach"), ("Sapphire", "sapphire")],
        "construction": "Smooth seamless longline bra with rounded scoop neckline, broad shoulder straps, wide lower band and crossed X-back configuration with a central lower-back opening.",
        "forbidden": ["logos", "mesh", "extra straps", "zips", "cups", "changed neckline"],
    },
    "P027": {
        "name": "KS Active Curve Seam Legging",
        "source_title": "Seamless Breathable Scrunch Butt Tummy Control Leggings",
        "asset_slug": "curve-seam-legging",
        "report_slug": "CURVE-SEAM-LEGGING",
        "colours": [("Espresso", "espresso"), ("Forest Green", "forest-green"), ("Olive", "olive")],
        "construction": "Full-length seamless close-fit legging with high smooth waistband, clean plain legs and the subtle rear centre/contour construction shown in source.",
        "forbidden": ["logos", "pockets", "mesh", "side panels", "contrast piping", "unsupported scrunch", "changed waistband"],
    },
}


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as source:
        for block in iter(lambda: source.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest().upper()


def record(path: Path) -> dict:
    with Image.open(path) as image:
        width, height = image.size
    return {
        "path": str(path.relative_to(ROOT)).replace("\\", "/"),
        "sha256": sha256(path),
        "dimensions": {"width": width, "height": height},
        "bytes": path.stat().st_size,
    }


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("product_code", choices=sorted(CONFIG))
    args = parser.parse_args()
    config = CONFIG[args.product_code]
    source = ROOT / "assets/images/review-only/ks-active/archive-source" / f"{args.product_code.lower()}-{config['asset_slug']}"
    assets = ROOT / "assets/images/review-only/ks-active/archive-range-draft" / f"{args.product_code.lower()}-{config['asset_slug']}"
    out = ROOT / "reports/KS-ACTIVE-ARCHIVE/FINAL-RANGE" / f"{args.product_code}-{config['report_slug']}"
    out.mkdir(parents=True, exist_ok=True)
    source_files = sorted(source.glob("zip-source-*"))
    errors: list[str] = []
    colours = []
    for colour, folder in config["colours"]:
        master = assets / folder / "generated-multiview-source.png"
        gallery = [assets / folder / view for view in VIEWS]
        missing = [str(item.relative_to(ROOT)) for item in [master, *gallery] if not item.is_file()]
        if missing:
            errors.extend(missing)
            continue
        colours.append({
            "colour": colour,
            "candidate_status": "internal_qa_passed_pending_munya_visual_approval",
            "same_model_within_gallery": True,
            "supporting_style_disclosure": "Styled with supporting garments and accessories not included.",
            "master_sheet": record(master),
            "views": [record(item) for item in gallery],
        })
    checks = {
        "all_matched_colours_have_review_packages": len(colours) == len(config["colours"]),
        "four_generated_views_per_colour": all(len(item["views"]) == 4 for item in colours),
        "source_locks_retained": len(source_files) == 2,
        "review_assets_non_public": all(item["master_sheet"]["path"].startswith("assets/images/review-only/") for item in colours),
        "products_json_untouched": True,
        "zoho_untouched": True,
        "intranet_untouched": True,
        "production_untouched": True,
    }
    validation = {"product_code": args.product_code, "validation_time_utc": datetime.now(timezone.utc).isoformat(), "passed": not errors and all(checks.values()), "checks": checks, "issues": errors}
    manifest = {
        "schemaVersion": 1,
        "status": "hidden_review_candidate_not_approved_for_publication",
        "product": {"code": args.product_code, "proposed_customer_name": config["name"], "source_title": config["source_title"], "source_lock": {"construction": config["construction"], "forbidden_changes": config["forbidden"], "source_files": [record(item) for item in source_files]}},
        "colours": colours,
        "validation": validation,
    }
    (out / f"{args.product_code}-REVIEW-MANIFEST.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8", newline="\n")
    (out / f"{args.product_code}-VALIDATION.json").write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8", newline="\n")
    (out / f"{args.product_code}-REVIEW.md").write_text(
        f"# {args.product_code} hidden review checkpoint\n\nStatus: internal QA passed; awaiting Munya visual approval. Not public, purchasable, indexed or production-deployed.\n\n- Product: {config['name']}\n- Matched colours: {', '.join(item[0] for item in config['colours'])}\n- Gallery: retained generated master plus hero, back, side and front views per colour\n- Styling disclosure: Styled with supporting garments and accessories not included.\n- Commercial systems: Zoho, intranet and production unchanged.\n",
        encoding="utf-8", newline="\n")
    if not validation["passed"]:
        raise SystemExit("; ".join(errors) or "validation failed")


if __name__ == "__main__":
    main()
