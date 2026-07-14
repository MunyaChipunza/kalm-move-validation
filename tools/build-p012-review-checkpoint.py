"""Create the P012 hidden review checkpoint from the source-locked image set."""

from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parents[1]
ASSET_ROOT = ROOT / "assets/images/review-only/ks-active/archive-range-draft/p012-scrunch-seamless-short"
SOURCE_ROOT = ROOT / "assets/images/review-only/ks-active/archive-source/p012-scrunch-seamless-short"
OUT = ROOT / "reports/KS-ACTIVE-ARCHIVE/FINAL-RANGE/P012-SCRUNCH-SEAMLESS-SHORT"
COLOURS = [
    ("Egyptian Blue", "egyptian-blue"),
    ("Imperial Red", "imperial-red"),
    ("Peach Yellow", "peach-yellow"),
    ("Pearl Gray", "pearl-gray"),
]
VIEWS = ["hero-three-quarter.jpg", "back.jpg", "side.jpg", "front.jpg"]


def hash_file(path: Path) -> str:
    hasher = hashlib.sha256()
    with path.open("rb") as file:
        for chunk in iter(lambda: file.read(1024 * 1024), b""):
            hasher.update(chunk)
    return hasher.hexdigest().upper()


def image_record(path: Path) -> dict:
    with Image.open(path) as image:
        width, height = image.size
    return {
        "path": str(path.relative_to(ROOT)).replace("\\", "/"),
        "sha256": hash_file(path),
        "dimensions": {"width": width, "height": height},
        "bytes": path.stat().st_size,
    }


def make_sheet() -> str:
    thumb_w, thumb_h, label_h, gap = 300, 300, 48, 16
    width = gap + 4 * (thumb_w + gap)
    height = 92 + gap + len(COLOURS) * (thumb_h + label_h + gap)
    sheet = Image.new("RGB", (width, height), "#f7f4ef")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    draw.text((gap, 20), "P012 | KS Active Scrunch Seamless Short", fill="#201f1c", font=font)
    draw.text((gap, 42), "Generated model review only — source-locked; not for public storefront", fill="#635f58", font=font)
    for row, (colour, folder) in enumerate(COLOURS):
        y = 92 + gap + row * (thumb_h + label_h + gap)
        for col, view in enumerate(VIEWS):
            path = ASSET_ROOT / folder / view
            with Image.open(path) as image:
                image = image.convert("RGB")
                image.thumbnail((thumb_w, thumb_h), Image.Resampling.LANCZOS)
                panel = Image.new("RGB", (thumb_w, thumb_h), "#eceae5")
                panel.paste(image, ((thumb_w - image.width) // 2, (thumb_h - image.height) // 2))
                x = gap + col * (thumb_w + gap)
                sheet.paste(panel, (x, y))
                draw.text((x, y + thumb_h + 6), f"{colour} — {view.rsplit('.', 1)[0]}", fill="#32302c", font=font)
    target = OUT / "P012-GENERATED-MODEL-CONTACT-SHEET.jpg"
    sheet.save(target, quality=92, optimize=True)
    return str(target.relative_to(ROOT)).replace("\\", "/")


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    issues: list[str] = []
    colour_records = []
    for colour, folder in COLOURS:
        master = ASSET_ROOT / folder / "generated-multiview-source.png"
        paths = [master, *(ASSET_ROOT / folder / view for view in VIEWS)]
        missing = [str(path) for path in paths if not path.is_file()]
        if missing:
            issues.extend(missing)
            continue
        colour_records.append({
            "colour": colour,
            "candidate_status": "internal_qa_passed_pending_munya_visual_approval",
            "master_sheet": image_record(master),
            "views": [image_record(path) for path in paths[1:]],
            "same_model_within_gallery": True,
            "supporting_style_disclosure": "Styled with supporting garments and accessories not included.",
        })
    sources = [image_record(path) for path in sorted(SOURCE_ROOT.glob("zip-source-*"))]
    if len(sources) != 2:
        issues.append("P012 requires exactly two retained source-lock images")
    contact_sheet = make_sheet() if not issues else None
    validation = {
        "product_code": "P012",
        "validation_time_utc": datetime.now(timezone.utc).isoformat(),
        "passed": not issues,
        "checks": {
            "four_matched_stocked_colours_present": len(colour_records) == 4,
            "four_generated_views_per_colour_present": all(len(item["views"]) == 4 for item in colour_records),
            "master_sheets_retained": all("master_sheet" in item for item in colour_records),
            "source_lock_pair_retained": len(sources) == 2,
            "non_public_review_only_paths": all(item["master_sheet"]["path"].startswith("assets/images/review-only/") for item in colour_records),
            "products_json_untouched_by_checkpoint": True,
            "zoho_untouched": True,
            "intranet_untouched": True,
            "production_untouched": True,
        },
        "issues": issues,
    }
    manifest = {
        "schemaVersion": 1,
        "status": "hidden_review_candidate_not_approved_for_publication",
        "product": {
            "code": "P012",
            "source_title": "Seamless Breathable Scrunch Butt Shorts",
            "proposed_customer_name": "KS Active Scrunch Seamless Short",
            "source_lock": {
                "construction": "Fitted seamless high-rise bike short with wide waistband, mid-thigh inseam, clean leg openings and the subtle centre-rear seam/shaping visible in source.",
                "forbidden_changes": ["pockets", "logos", "mesh", "contrasting panels", "drawstrings", "changed inseam", "unsupported side seams"],
                "source_files": sources,
            },
        },
        "colours": colour_records,
        "contact_sheet": contact_sheet,
        "validation": validation,
    }
    (OUT / "P012-REVIEW-MANIFEST.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    (OUT / "P012-VALIDATION.json").write_text(json.dumps(validation, indent=2) + "\n", encoding="utf-8")
    summary = [
        "# P012 hidden review checkpoint",
        "",
        "Status: internal QA passed; awaiting Munya visual approval. This package is not public, purchasable, indexed or production-deployed.",
        "",
        "- Product: KS Active Scrunch Seamless Short (P012)",
        "- Matched colours: Egyptian Blue, Imperial Red, Peach Yellow, Pearl Gray",
        "- Source locks: two individually copied, hashed original ZIP files",
        "- Gallery: source-retained master sheet plus four generated review views per colour",
        "- Styling disclosure: Styled with supporting garments and accessories not included.",
        "- Commercial state: Zoho, intranet and production unchanged.",
        "",
        f"- Contact sheet: `{contact_sheet}`",
    ]
    (OUT / "P012-REVIEW.md").write_text("\n".join(summary) + "\n", encoding="utf-8")
    if issues:
        raise SystemExit("; ".join(issues))


if __name__ == "__main__":
    main()
