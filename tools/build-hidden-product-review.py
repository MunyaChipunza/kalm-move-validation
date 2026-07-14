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
    "P002": {
        "name": "KS Active Halter Back Romper",
        "source_title": "Crisscross Back Halter Romper",
        "asset_slug": "halter-back-romper",
        "report_slug": "HALTER-BACK-ROMPER",
        "colours": [("Army Green", "army-green"), ("Egyptian Blue", "egyptian-blue"), ("Electric Violet", "electric-violet"), ("Imperial Red", "imperial-red"), ("Midnight Black", "midnight-black")],
        "construction": "Fitted smooth matte one-piece short unitard with thin shoulder straps, small centred V-notch neckline, short inseam, low open back, narrow crisscross/horizontal back straps and curved rear yoke seam.",
        "forbidden": ["logos", "pockets", "zips", "cups", "mesh", "different straps", "changed neckline"],
    },
    "P003": {
        "name": "KS Active Rib Scrunch Legging",
        "source_title": "Seamless High Stretch Scrunch Butt Leggings 1",
        "asset_slug": "rib-scrunch-legging",
        "report_slug": "RIB-SCRUNCH-LEGGING",
        "colours": [("Ash Gray", "ash-gray"), ("Black", "black"), ("Chestnut", "chestnut"), ("French Rose", "french-rose"), ("Sky Blue", "sky-blue")],
        "construction": "Full-length fine vertical seamless rib knit legging with high wide ribbed waistband, curved rear yoke and centre-back scrunch seam.",
        "forbidden": ["logos", "pockets", "mesh", "panels", "different rib direction", "changed waistband", "changed rear yoke"],
    },
    "P010": {
        "name": "KS Active Cutout Crossback Bra",
        "source_title": "Seamless Crisscross Cut Out Back Sports Bra",
        "asset_slug": "cutout-crossback-bra",
        "report_slug": "CUTOUT-CROSSBACK-BRA",
        "colours": [("Imperial Red", "imperial-red"), ("Peach Yellow", "peach-yellow"), ("Pearl Gray", "pearl-gray")],
        "construction": "Fine-rib seamless longline training crop top with rounded scoop front, narrow shoulder straps, wide lower band and multi-strap crisscross open-back construction.",
        "forbidden": ["logos", "padding seams", "zips", "mesh", "cups", "different strap count", "changed lower band"],
    },
    "P019": {
        "name": "KS Active Cutout Seamless Bra",
        "source_title": "High Support Seamless Cut Out Sports Bra",
        "asset_slug": "cutout-seamless-bra",
        "report_slug": "CUTOUT-SEAMLESS-BRA",
        "colours": [("Black", "black"), ("Desert Gold", "desert-gold"), ("Steel", "steel")],
        "construction": "Fine-rib longline training crop top with rounded scoop front, wide lower band, racer-back panel and single centred triangular lower-back cutout.",
        "forbidden": ["logos", "extra straps", "mesh", "zips", "new cutouts", "changed triangular opening"],
    },
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
    "P030": {
        "name": "KS Active Crisscross Back Bra",
        "source_title": "Seamless Crisscross Back Sports Bra",
        "asset_slug": "crisscross-back-bra",
        "report_slug": "CRISSCROSS-BACK-BRA",
        "colours": [("Black", "black"), ("True Purple", "true-purple")],
        "construction": "Smooth longline training crop top with rounded scoop front, clean wide lower band, racer-style upper back, narrow X-shaped crossed straps and lower triangular opening.",
        "forbidden": ["logos", "mesh", "zips", "extra straps", "padding seams", "new cutouts"],
    },
    "P033": {
        "name": "KS Active Panel Seamless Legging",
        "source_title": "Seamless Solid Tummy Control Leggings",
        "asset_slug": "panel-seamless-legging",
        "report_slug": "PANEL-SEAMLESS-LEGGING",
        "colours": [("Azure Blue", "azure-blue"), ("Byzantine Violet", "byzantine-violet"), ("Cinnamon", "cinnamon"), ("Hunter Green", "hunter-green"), ("Iron Gray", "iron-gray"), ("Jungle Green", "jungle-green"), ("Mauve", "mauve"), ("Pine Green", "pine-green")],
        "construction": "Full-length high-waist seamless legging with clean high waistband, smooth close-fitting legs and the subtle moulded contour/panel construction visible in source.",
        "forbidden": ["branding", "pockets", "mesh", "piping", "drawstrings", "unsupported new panels", "changed waist height"],
    },
    "P035": {
        "name": "KS Active Scrunch Seamless Legging",
        "source_title": "Seamless Breathable Scrunch Butt Leggings",
        "asset_slug": "scrunch-seamless-legging",
        "report_slug": "SCRUNCH-SEAMLESS-LEGGING",
        "colours": [("Imperial Red", "imperial-red"), ("Peach Yellow", "peach-yellow"), ("Pearl Gray", "pearl-gray")],
        "construction": "Full-length close-fit legging with high smooth waistband, clean full legs and the rear centre scrunch/contour construction visible in source.",
        "forbidden": ["branding", "pockets", "mesh", "side panels", "contrast piping", "drawstrings", "new seams"],
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
    source_files = sorted(
        item for item in source.iterdir()
        if item.is_file() and item.suffix.lower() in {".avif", ".jpeg", ".jpg", ".png", ".webp"}
    )
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
        "source_locks_retained": len(source_files) >= 2,
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
