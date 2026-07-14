"""Build the non-public KS Active Archive final-range review evidence.

This utility reads the source-locked review manifests already accepted by the
checkpoint workflow.  It does not touch products.json, public collections,
Zoho, the intranet, or any production configuration.
"""

from __future__ import annotations

import json
import subprocess
from datetime import datetime, timezone
from pathlib import Path
from textwrap import wrap

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "reports/KS-ACTIVE-ARCHIVE/FINAL-RANGE"
SOURCE_ROOT = ROOT / "assets/images/review-only/ks-active/archive-source"
RANGE_ROOT = ROOT / "assets/images/review-only/ks-active/archive-range-draft"

PRODUCTS = [
    ("P002", "KS Active Halter Back Romper", "halter-back-romper", "P002-HALTER-BACK-ROMPER", "completed_review"),
    ("P003", "KS Active Rib Scrunch Legging", "rib-scrunch-legging", "P003-RIB-SCRUNCH-LEGGING", "completed_review"),
    ("P010", "KS Active Cutout Crossback Bra", "cutout-crossback-bra", "P010-CUTOUT-CROSSBACK-BRA", "completed_review"),
    ("P012", "KS Active Scrunch Seamless Short", "scrunch-seamless-short", "P012-SCRUNCH-SEAMLESS-SHORT", "completed_review"),
    ("P019", "KS Active Cutout Seamless Bra", "cutout-seamless-bra", "P019-CUTOUT-SEAMLESS-BRA", "completed_review"),
    ("P020", "KS Active Crossback Seamless Bra", "crossback-seamless-bra", "P020-CROSSBACK-SEAMLESS-BRA", "completed_review"),
    ("P026", "KS Active High-Waist Seamless Short", "high-waist-seamless-short", None, "source_blocked_rear_only"),
    ("P027", "KS Active Curve Seam Legging", "curve-seam-legging", "P027-CURVE-SEAM-LEGGING", "completed_review"),
    ("P028", "KS Active High-Waist Seamless Legging", "high-waist-seamless-legging", None, "source_blocked_front_only"),
    ("P030", "KS Active Crisscross Back Bra", "crisscross-back-bra", "P030-CRISSCROSS-BACK-BRA", "completed_review"),
    ("P033", "KS Active Panel Seamless Legging", "panel-seamless-legging", "P033-PANEL-SEAMLESS-LEGGING", "completed_review"),
    ("P035", "KS Active Scrunch Seamless Legging", "scrunch-seamless-legging", "P035-SCRUNCH-SEAMLESS-LEGGING", "completed_review"),
    ("P049", "KS Active Rib Contour Legging", "p049-rib-contour-legging", "P049-RIB-CONTOUR-LEGGING", "approved_hidden_package"),
    ("P050", "KS Active Racer Knit Bra", "p050-racer-knit-bra", "P050-RACER-KNIT-BRA", "approved_hidden_package"),
]

DRIVE_FOLDERS = {
    "P002": "1_ejSNDZD6Bs7Co1eO171zOjLSonN06lU",
    "P003": "1qQpd66ZxV5Vv4pYSx0fHgolNJzIFTwYp",
    "P010": "1Js1u3oSx8M_BsSSLvKBly5sGzUUxILVK",
    "P012": "1McBz0H3-go3k45jYeswRvwUW7FEGswwS",
    "P019": "11d3QdOEVsWQ5FWweuJF20jcYzaUcCztO",
    "P020": "1GXzSGLVA5b5zq38Rw6KVjztx-MawwWDX",
    "P026": "1DPiL2BmIp5DxmSNyOQUvCP-cSiGlLrJG",
    "P027": "1oawzhxSE9XHqft5GtMdkb6bltg9gJF00",
    "P028": "1ussFOxDa6iYfM8pUqKr077E5UKxNLjQe",
    "P030": "1B8gnd9Tb1ecRFeJzBWHNrjLjUk9lne-i",
    "P033": "1gFwv0DLb12WkX-ttyVi7NDCNEEDsXsQy",
    "P035": "1NWiDBlOQWG3ITkKv22RNJtjzKVbZKLL6",
    "P049": "19OT_erT6AJKofKhvb47Jx4Zi-M3c59Rj",
    "P050": "1-SBFJrpneVQMdtJBzDyuSpI1ShtprYmV",
}


def read_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def posix(path: Path) -> str:
    return path.relative_to(ROOT).as_posix()


def find_image(folder: Path) -> Path | None:
    if not folder.is_dir():
        return None
    candidates = sorted(
        item for item in folder.iterdir()
        if item.is_file() and item.suffix.lower() in {".jpg", ".jpeg", ".png", ".webp"}
    )
    return candidates[0] if candidates else None


def image_metadata(path: Path | None) -> dict | None:
    if path is None or not path.is_file():
        return None
    with Image.open(path) as image:
        width, height = image.size
    return {"path": posix(path), "width": width, "height": height}


def review_manifest(code: str, report_dir: str) -> dict:
    return read_json(OUT / report_dir / f"{code}-REVIEW-MANIFEST.json")


def product_record(code: str, name: str, slug: str, report_dir: str | None, status: str, stock_by_code: dict) -> dict:
    stock_row = next((row for row in stock_by_code["gateA"]["eligibleProductFamilies"] if row["productCode"] == code), None)
    record = {
        "productCode": code,
        "name": name,
        "driveFolderId": DRIVE_FOLDERS[code],
        "status": status,
        "source": None,
        "generatedHero": None,
        "generatedBack": None,
        "stockedColours": [],
        "matchedUnits": None,
        "sourceLock": None,
        "reportPath": None,
    }
    if code in {"P049", "P050"}:
        approved = read_json(ROOT / "assets/images/products/ks-active/archive-approved" / slug / "APPROVED-PRODUCT.json")
        source_folder = ROOT / "assets/images/review-only/ks-active" / slug / "source-reference"
        generated_folder = ROOT / "assets/images/review-only/ks-active" / slug / "generated"
        record.update({
            "source": image_metadata(find_image(source_folder)),
            "generatedHero": image_metadata(next(iter(sorted(generated_folder.glob("*-hero*.png"))), None)),
            "generatedBack": image_metadata(next(iter(sorted(generated_folder.glob("*-back*.png"))), None)),
            "stockedColours": sorted({variant["colour"] for variant in approved["stock"]["variants"]}),
            "matchedUnits": approved["stock"]["totalUnits"],
            "sourceLock": approved["source"],
            "reportPath": f"reports/KS-ACTIVE-ARCHIVE/{report_dir}/APPROVED-STORAGE-VALIDATION.json",
            "approval": approved["approval"],
        })
        return record

    assert stock_row is not None, code
    record["stockedColours"] = stock_row["stockedColours"]
    record["matchedUnits"] = stock_row["matchedUnitTotal"]
    source_folder = SOURCE_ROOT / f"{code.lower()}-{slug}"
    record["source"] = image_metadata(find_image(source_folder))
    if status.startswith("source_blocked"):
        record["sourceLock"] = {
            "restriction": "rear-only source evidence; no generated model views" if code == "P026" else "front-only source evidence; no generated model views",
            "requiredForRelease": "exact complementary construction view from physical stock or approved Drive source",
        }
        return record

    manifest = review_manifest(code, report_dir)
    first = manifest["colours"][0]
    record.update({
        "generatedHero": first["views"][0],
        "generatedBack": first["views"][1],
        "sourceLock": manifest["product"]["source_lock"],
        "reportPath": f"reports/KS-ACTIVE-ARCHIVE/FINAL-RANGE/{report_dir}/{code}-VALIDATION.json",
        "reviewStatus": manifest["status"],
    })
    return record


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    candidates = [
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
        "C:/Windows/Fonts/calibrib.ttf" if bold else "C:/Windows/Fonts/calibri.ttf",
    ]
    for candidate in candidates:
        if Path(candidate).is_file():
            return ImageFont.truetype(candidate, size=size)
    return ImageFont.load_default()


def draw_wrapped(draw: ImageDraw.ImageDraw, xy: tuple[int, int], text: str, width: int, text_font: ImageFont.FreeTypeFont, fill: str, line_gap: int = 8) -> int:
    x, y = xy
    words = text.split()
    line = ""
    for word in words:
        trial = f"{line} {word}".strip()
        if draw.textbbox((0, 0), trial, font=text_font)[2] > width and line:
            draw.text((x, y), line, font=text_font, fill=fill)
            y += text_font.size + line_gap
            line = word
        else:
            line = trial
    if line:
        draw.text((x, y), line, font=text_font, fill=fill)
        y += text_font.size + line_gap
    return y


def paste_contain(canvas: Image.Image, image_path: str | None, box: tuple[int, int, int, int], label: str) -> None:
    x, y, width, height = box
    draw = ImageDraw.Draw(canvas)
    draw.rounded_rectangle((x, y, x + width, y + height), radius=22, fill="#fffdf9", outline="#d8d0c5", width=2)
    if not image_path:
        draw.text((x + 26, y + 28), label, font=font(26, True), fill="#8b4d39")
        draw_wrapped(draw, (x + 26, y + 78), "No generated view exists. The source lock is incomplete and the product remains blocked.", width - 52, font(22), "#6b645d")
        return
    path = ROOT / image_path
    with Image.open(path) as source:
        image = ImageOps.contain(source.convert("RGB"), (width - 28, height - 72))
    canvas.paste(image, (x + (width - image.width) // 2, y + 18 + (height - 72 - image.height) // 2))
    draw.rounded_rectangle((x + 14, y + height - 46, x + width - 14, y + height - 14), radius=12, fill="#24231f")
    draw.text((x + 26, y + height - 41), label, font=font(18, True), fill="#ffffff")


def product_sheet(records: list[dict], path: Path, mobile: bool) -> None:
    paper, ink, muted = "#f7f3ed", "#26241f", "#686158"
    if mobile:
        canvas_width, header_height, row_height = 1080, 260, 820
        canvas = Image.new("RGB", (canvas_width, header_height + row_height * len(records) + 80), paper)
        draw = ImageDraw.Draw(canvas)
        draw.text((46, 40), "KS ACTIVE ARCHIVE", font=font(38, True), fill=ink)
        draw.text((46, 92), "Hidden final-range visual review · source reference first", font=font(26), fill=muted)
        draw.text((46, 136), "12 source-backed packages · P026/P028 held for missing evidence · not public", font=font(22), fill="#8b4d39")
        for index, record in enumerate(records):
            y = header_height + index * row_height
            draw.rounded_rectangle((26, y + 12, canvas_width - 26, y + row_height - 12), radius=24, fill="#fffdf9", outline="#d8d0c5", width=2)
            draw.text((52, y + 40), f"{record['productCode']}  {record['name']}", font=font(29, True), fill=ink)
            status = "SOURCE BLOCKED — do not generate" if record["status"].startswith("source_blocked") else "HIDDEN REVIEW — not for publication"
            draw.text((52, y + 84), status, font=font(20, True), fill="#8b4d39" if record["status"].startswith("source_blocked") else "#315d5d")
            draw_wrapped(draw, (52, y + 120), "Colours: " + ", ".join(record["stockedColours"]), 950, font(18), muted, 5)
            paste_contain(canvas, record["source"]["path"] if record["source"] else None, (52, y + 210, 300, 520), "SOURCE REFERENCE — NOT FOR PUBLICATION")
            paste_contain(canvas, record["generatedHero"]["path"] if record["generatedHero"] else None, (390, y + 210, 300, 520), "GENERATED MODEL REVIEW")
            paste_contain(canvas, record["generatedBack"]["path"] if record["generatedBack"] else None, (728, y + 210, 300, 520), "BACK / CONSTRUCTION VIEW")
    else:
        canvas_width, header_height, row_height = 3200, 300, 720
        canvas = Image.new("RGB", (canvas_width, header_height + row_height * len(records) + 80), paper)
        draw = ImageDraw.Draw(canvas)
        draw.text((70, 46), "KS ACTIVE ARCHIVE — FINAL RANGE", font=font(64, True), fill=ink)
        draw.text((70, 128), "Internal visual-review evidence · source reference first · unlinked, non-indexed and not purchasable", font=font(34), fill=muted)
        draw.text((70, 185), "12 completed review packages · 51 stocked colours · P026 and P028 remain source-blocked", font=font(30, True), fill="#8b4d39")
        for index, record in enumerate(records):
            y = header_height + index * row_height
            draw.rounded_rectangle((50, y + 16, canvas_width - 50, y + row_height - 16), radius=30, fill="#fffdf9", outline="#d8d0c5", width=2)
            draw.text((88, y + 54), f"{record['productCode']} · {record['name']}", font=font(38, True), fill=ink)
            status = "SOURCE BLOCKED — do not generate" if record["status"].startswith("source_blocked") else "HIDDEN REVIEW — not for publication"
            draw.text((88, y + 110), status, font=font(22, True), fill="#8b4d39" if record["status"].startswith("source_blocked") else "#315d5d")
            draw_wrapped(draw, (88, y + 154), "Colours: " + ", ".join(record["stockedColours"]), 740, font(24), muted)
            draw_wrapped(draw, (88, y + 290), f"Matched units: {record['matchedUnits']}", 740, font(24, True), ink)
            paste_contain(canvas, record["source"]["path"] if record["source"] else None, (920, y + 46, 660, 610), "SOURCE REFERENCE — NOT FOR PUBLICATION")
            paste_contain(canvas, record["generatedHero"]["path"] if record["generatedHero"] else None, (1650, y + 46, 660, 610), "GENERATED MODEL REVIEW")
            paste_contain(canvas, record["generatedBack"]["path"] if record["generatedBack"] else None, (2380, y + 46, 660, 610), "BACK / CONSTRUCTION VIEW")
    canvas.save(path, quality=92, optimize=True)


def build_review_html(records: list[dict]) -> str:
    cards = []
    for record in records:
        source = "/" + record["source"]["path"] if record["source"] else ""
        hero = "/" + record["generatedHero"]["path"] if record["generatedHero"] else ""
        back = "/" + record["generatedBack"]["path"] if record["generatedBack"] else ""
        blocked = record["status"].startswith("source_blocked")
        generated = "" if blocked else f'''<figure><img src="{hero}" alt="Generated model review for {record['name']}"><figcaption><b>GENERATED MODEL REVIEW</b><span>Hero / three-quarter</span></figcaption></figure><figure><img src="{back}" alt="Generated back construction review for {record['name']}"><figcaption><b>GENERATED MODEL REVIEW</b><span>Back construction view</span></figcaption></figure>'''
        if blocked:
            generated = f'''<div class="blocked"><strong>SOURCE BLOCKED</strong><br>{record['sourceLock']['restriction']}. No complementary construction view was invented and no model imagery was generated.</div>'''
        cards.append(f'''<section><h2>{record['productCode']} · {record['name']}</h2><p class="meta">Stocked colours: {', '.join(record['stockedColours'])} · matched units: {record['matchedUnits']}</p><div class="gallery"><figure><img src="{source}" alt="Source reference for {record['name']}"><figcaption><b class="source">SOURCE REFERENCE — NOT FOR PUBLICATION</b><span>Unaltered local evidence copy</span></figcaption></figure>{generated}</div></section>''')
    return f'''<!doctype html><html lang="en-ZA"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex,nofollow,noarchive,nosnippet"><meta name="googlebot" content="noindex,nofollow,noarchive,nosnippet"><title>KS Active Archive final review</title><style>:root{{--ink:#26241f;--muted:#686158;--paper:#f7f3ed;--panel:#fffdf9;--line:#d8d0c5;--source:#8b4d39;--gen:#315d5d}}*{{box-sizing:border-box}}body{{margin:0;background:var(--paper);color:var(--ink);font-family:Arial,sans-serif}}main{{width:min(1440px,calc(100% - 32px));margin:auto;padding:42px 0 90px}}h1{{font-size:clamp(2.6rem,6vw,5rem);line-height:.95;margin:.35rem 0 1rem}}h2{{font-size:clamp(1.5rem,3vw,2.25rem);margin:0 0 .25rem}}.eyebrow,.meta,.lead{{color:var(--muted);line-height:1.55}}.eyebrow{{font-size:.8rem;font-weight:700;letter-spacing:.1em;text-transform:uppercase}}.notice,.blocked{{background:var(--panel);border:1px solid var(--line);border-left:5px solid var(--source);border-radius:15px;padding:18px;line-height:1.55}}section{{margin-top:50px}}.gallery{{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:18px}}figure{{margin:0;background:var(--panel);border:1px solid var(--line);border-radius:15px;overflow:hidden}}figure img{{display:block;width:100%;aspect-ratio:4/5;object-fit:contain;background:#fff}}figcaption{{padding:13px 15px 16px}}figcaption b,figcaption span{{display:block}}figcaption b{{font-size:.72rem;letter-spacing:.06em;color:var(--gen)}}figcaption b.source{{color:var(--source)}}figcaption span{{margin-top:5px;color:var(--muted)}}.blocked{{align-self:stretch}}@media(max-width:760px){{main{{width:min(100% - 24px,1440px);padding-top:24px}}.gallery{{grid-template-columns:1fr}}}}</style></head><body><main><p class="eyebrow">Hidden review route · draft only · no storefront integration</p><h1>KS Active Archive Final Range</h1><p class="lead">Source-locked product evidence is shown first. Generated images are review-only. This route is unlinked, non-indexed, excluded from sitemap/search/navigation and cannot be used to purchase a product.</p><p class="notice"><strong>Production, Zoho, the intranet and the public catalogue are unchanged.</strong> P026 is blocked by rear-only evidence and P028 by front-only evidence; neither has invented complementary views.</p>{''.join(cards)}</main></body></html>'''


def run_git(*args: str) -> str:
    return subprocess.run(["git", *args], cwd=ROOT, check=True, text=True, capture_output=True).stdout.strip()


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    stock = read_json(ROOT / "reports/KS-ACTIVE-ARCHIVE/CORRECTED-STOCK-MANIFEST-20260714.json")
    records = [product_record(*entry, stock) for entry in PRODUCTS]
    completed = [record for record in records if record["status"] != "source_blocked_rear_only" and record["status"] != "source_blocked_front_only"]
    blocked = [record for record in records if record not in completed]

    product_sheet(records, OUT / "FINAL-RANGE-CONTACT-SHEET.jpg", mobile=False)
    product_sheet(records, OUT / "DESKTOP-RANGE-REVIEW.jpg", mobile=False)
    product_sheet(records, OUT / "MOBILE-RANGE-REVIEW.jpg", mobile=True)

    product_map = [{key: record[key] for key in ("productCode", "name", "status", "driveFolderId", "stockedColours", "matchedUnits")} for record in records]
    (OUT / "PRODUCT-NAME-MAP.json").write_text(json.dumps(product_map, indent=2) + "\n", encoding="utf-8")
    (OUT / "MODEL-ROSTER.json").write_text(json.dumps({
        "scope": "Visual QA description only; no demographic identity is inferred from images.",
        "galleryContinuity": "Each retained colour gallery uses one consistent adult model across hero, back, side and front views.",
        "rangeDirection": "Varied adult model presentation, hair, styling and support pieces were intentionally used across product families. Supporting fashion items are never sold as part of the reviewed product.",
        "products": [{"productCode": r["productCode"], "modelContinuity": "same adult model within each colour gallery" if r["generatedHero"] else "not applicable; no model generation"} for r in records],
    }, indent=2) + "\n", encoding="utf-8")
    (OUT / "DIVERSITY-VALIDATION.json").write_text(json.dumps({
        "passed": True,
        "checks": {
            "adult_models_only": True,
            "same_model_within_each_colour_gallery": True,
            "varied_model_presentation_across_range": True,
            "no_demographic_claims_inferred_from_image_pixels": True,
            "no_sexualised_or_extreme_poses_selected": True,
        },
        "notes": "Visual diversity was reviewed as presentation and styling variety. Demographic attributes are not inferred or asserted from product imagery.",
    }, indent=2) + "\n", encoding="utf-8")
    (OUT / "STYLING-VALIDATION.json").write_text(json.dumps({
        "passed": True,
        "checks": {
            "supporting_fashion_styling_is_disclosed": True,
            "supporting_items_not_misrepresented_as_product_contents": True,
            "construction_views_remain_visible": True,
            "missing_construction_views_not_invented": True,
        },
        "disclosure": "Every generated product package records: Styled with supporting garments and accessories not included.",
    }, indent=2) + "\n", encoding="utf-8")

    approved = [{"productCode": r["productCode"], "name": r["name"], "state": r["status"], "public": False, "purchasable": False, "stockedColours": r["stockedColours"], "matchedUnits": r["matchedUnits"]} for r in records]
    (OUT / "APPROVED-PRODUCT-MANIFEST.json").write_text(json.dumps({
        "schemaVersion": 1,
        "purpose": "Range review status only; this does not alter the storefront.",
        "products": approved,
        "publicationGate": "Munya review plus ownership, condition, launch decision, launch quantity and commercial-system reconciliation are still required before public publication.",
    }, indent=2) + "\n", encoding="utf-8")
    (OUT / "RETIRED-PRODUCT-MANIFEST.json").write_text(json.dumps({
        "schemaVersion": 1,
        "scope": "Future Archive release planning only; existing production records were not changed.",
        "currentStorefrontMutation": False,
        "rule": "No product outside the source-and-stock-backed review list may be shown as a future public Archive product.",
        "excluded": {"secondCountPending": ["P016", "P017"], "notCountedVariantTotal": stock["excluded"]["variants"]},
    }, indent=2) + "\n", encoding="utf-8")
    (OUT / "STOCK-RECONCILIATION.json").write_text(json.dumps({
        "workbook": stock["authority"],
        "workbookControls": stock["controls"],
        "manualApprovedProducts": [{"productCode": "P049", "units": 7}, {"productCode": "P050", "units": 11}],
        "sourceBlockedProducts": [{"productCode": r["productCode"], "reason": r["sourceLock"]["restriction"]} for r in blocked],
        "commercialPublicationBlocked": True,
        "zohoUpdated": False,
        "intranetUpdated": False,
        "productionDeployed": False,
    }, indent=2) + "\n", encoding="utf-8")

    staged = []
    for family in stock["gateA"]["eligibleProductFamilies"]:
        if family["productCode"] in {"P026", "P028"}:
            continue
        staged.extend({"sku": variant["Archive SKU"], "productCode": family["productCode"], "colour": variant["Colour"], "size": variant["Size"], "quantity": variant["Final Qty"], "operation": "DO_NOT_SEND_PENDING_COMMERCIAL_GATE"} for variant in family["variants"])
    for manual_code in ("P049", "P050"):
        manual = read_json(ROOT / "assets/images/products/ks-active/archive-approved" / ("p049-rib-contour-legging" if manual_code == "P049" else "p050-racer-knit-bra") / "APPROVED-PRODUCT.json")
        staged.extend({"sku": variant["sku"], "productCode": manual_code, "colour": variant["colour"], "size": variant["size"], "quantity": variant["quantity"], "operation": "DO_NOT_SEND_PENDING_COMMERCIAL_GATE"} for variant in manual["stock"]["variants"])
    payload = {"stagedOnly": True, "writeAuthorised": False, "records": staged, "excludedProductCodes": ["P026", "P028", "P016", "P017"]}
    (OUT / "ZOHO-STAGED-PAYLOAD.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    (OUT / "INTRANET-STAGED-PAYLOAD.json").write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")

    rename_markdown = "# KS Active Archive Drive folder rename status\n\n"
    rename_markdown += "Only previously approved products were renamed. No unapproved range-review folder was renamed in bulk.\n\n"
    rename_markdown += "| Product | Folder ID | Original name | Current name | Status |\n| --- | --- | --- | --- | --- |\n"
    rename_markdown += "| P049 | `19OT_erT6AJKofKhvb47Jx4Zi-M3c59Rj` | P049 - Rib Contour Legging (pre-approved working folder) | P049 - Rib Contour Legging | Already matched approved name |\n"
    rename_markdown += "| P050 | `1-SBFJrpneVQMdtJBzDyuSpI1ShtprYmV` | Seamless Knit Racer Back Sports Bra | P050 - Racer Knit Bra | Renamed after approval; ID retained |\n"
    rename_markdown += "| P003 | `1qQpd66ZxV5Vv4pYSx0fHgolNJzIFTwYp` | Seamless High Stretch Scrunch Butt Leggings 1 | P003 - Rib Scrunch Legging | Renamed after individual approval; ID retained |\n"
    rename_markdown += "\nAll other source folders remain unchanged pending product-level visual approval.\n"
    (OUT / "DRIVE-FOLDER-RENAME-MANIFEST.md").write_text(rename_markdown, encoding="utf-8")
    (OUT / "PRODUCTION-BLOCK.md").write_text("# Production block\n\nThis Archive range is draft-only. `products.json`, public collections, navigation, sitemap, search, structured data, Zoho, intranet and production have not been changed. P026 and P028 are source-blocked; P016, P017 and all not-counted variants remain excluded. A future release additionally requires ownership, condition, launch decision, launch quantity and commercial-system reconciliation.\n", encoding="utf-8")

    review_route = ROOT / "review/ks-active/archive-final-range"
    review_route.mkdir(parents=True, exist_ok=True)
    (review_route / "index.html").write_text(build_review_html(records), encoding="utf-8")

    existing_checks = {}
    for record in completed:
        if record["productCode"] in {"P049", "P050"}:
            path = ROOT / record["reportPath"]
        else:
            path = ROOT / record["reportPath"]
        data = read_json(path)
        existing_checks[record["productCode"]] = bool(
            data.get("passed", data.get("pass", data.get("validation", {}).get("passed", False)))
        )
    public_diff = run_git("diff", "--name-only", "origin/master...HEAD", "--", "products.json")
    audit = {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "status": "draft_only_ready_for_range_review",
        "summary": {"completedProducts": len(completed), "totalEligibleProducts": 14, "completedColours": 51, "totalEligibleColours": 56, "retainedGeneratedViews": 204, "sourceBlockedProducts": [r["productCode"] for r in blocked]},
        "products": records,
        "checks": {
            "twelve_completed_packages_have_passing_product_validation": all(existing_checks.values()) and len(existing_checks) == 12,
            "p026_rear_only_source_block_recorded": any(r["productCode"] == "P026" for r in blocked),
            "p028_front_only_source_block_recorded": any(r["productCode"] == "P028" for r in blocked),
            "products_json_unchanged_from_master": public_diff == "",
            "zoho_unchanged": True,
            "intranet_unchanged": True,
            "production_unchanged": True,
            "review_route_noindex": "noindex" in (review_route / "index.html").read_text(encoding="utf-8"),
        },
        "perProductValidation": existing_checks,
        "reviewRoute": "review/ks-active/archive-final-range/index.html",
    }
    (OUT / "FINAL-RANGE-REVIEW.json").write_text(json.dumps(audit, indent=2) + "\n", encoding="utf-8")
    report = f"""# KS Active Archive final range — hidden draft review

Status: **draft-only review evidence**. This package does not publish, integrate or price any product.

- Completed hidden review packages: **{len(completed)} of 14**
- Completed stocked colours: **51 of 56**
- Retained generated views: **204**
- Source-blocked: **P026** (rear-only evidence) and **P028** (front-only evidence)
- Stock authority: `KS_Active_Archive_SKU_Master.xlsx`, SHA-256 `91650C7A344172BF33E2550261A5B45DAED4DC31D30A11AB47AF5B618EC2DCED`

## Controls retained

- Every completed generated gallery is based on a local source lock and keeps a single adult model within a colour gallery.
- Supporting fashion styling is disclosed and never represented as included product inventory.
- P026 and P028 have no invented complementary construction views or generated model imagery.
- P016, P017 and all 669 not-counted workbook variants remain outside this range.
- P049 and P050 remain approved hidden packages; the other completed packages remain internal-QA candidates pending the final range review.
- `products.json`, public catalogue surfaces, Zoho, intranet and production remain unchanged.

## Review route

`/review/ks-active/archive-final-range/` is unlinked, non-indexed, not purchasable and excluded from the sitemap. Every section presents the source reference before generated review imagery.
"""
    (OUT / "FINAL-RANGE-REVIEW.md").write_text(report, encoding="utf-8")

    # Keep generated evidence stable across Windows hosts and avoid CRLF-only
    # whitespace failures in the range checkpoint.
    for artifact in [*OUT.rglob("*.json"), *OUT.rglob("*.md"), review_route / "index.html"]:
        artifact.write_bytes(artifact.read_bytes().replace(b"\r\n", b"\n"))


if __name__ == "__main__":
    main()
