from __future__ import annotations

import json
import subprocess
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont


ROOT = Path(__file__).resolve().parent.parent
REPORT = ROOT / "reports" / "KALM-MOVE-WOMEN-BACK-FIRST-20260713"
BASELINE_SHA = "44d46ed8ce10817de05773984d9efda98d4b3153"

AFFECTED = {
    "kalm-move-align-strappy-jumpsuit": "Open-back halter strap structure",
    "kalm-move-ease-flare-set": "Low X-back strap detail",
    "kalm-move-form-short-set": "Straight-band open back",
    "kalm-move-balance-strappy-set": "X-back construction",
    "kalm-move-halter-biker-short-set": "Open-back halter construction",
    "kalm-move-core-seamless-tank": "Strappy open-back unitard",
    "kalm-move-align-ruched-short": "Ruched back short detail",
    "kalm-move-open-back-short-romper": "Hollow open-back romper construction",
}

EXCLUDED = {
    "kalm-move-pulse-crop-short-set": "No clean back image exists.",
    "kalm-move-wide-leg-yoga-pant": "Back view is not a major selling feature.",
    "kalm-move-rise-long-sleeve-set": "Jacket/base back view is not a major selling feature.",
    "kalm-move-lightweight-windbreaker-set": "Windbreaker back view is not a major selling feature.",
    "kalm-move-cropped-zip-yoga-jacket": "Jacket back view is not a major selling feature.",
    "kalm-move-loose-split-running-short": "Side split, not back construction, is the selling feature.",
    "kalm-move-split-running-skort": "Skort overlay is not a back-detail product.",
    "kalm-move-pocket-racerback-crop-bra": "No clean back image exists.",
    "kalm-move-contrast-flare-set": "No clean back image exists.",
    "kalm-move-crossline-legging": "No clean back image exists.",
    "kalm-move-drift-crop-wide-pant": "No clean back image exists.",
}


def load_catalogue_from_git() -> dict:
    raw = subprocess.check_output(
        ["git", "show", f"{BASELINE_SHA}:products.json"], cwd=ROOT, text=True
    )
    return json.loads(raw)


def by_id(catalogue: dict) -> dict[str, dict]:
    return {product["id"]: product for product in catalogue["products"]}


def font(size: int, bold: bool = False):
    name = "arialbd.ttf" if bold else "arial.ttf"
    return ImageFont.truetype(Path("C:/Windows/Fonts") / name, size)


def draw_image(draw: ImageDraw.ImageDraw, sheet: Image.Image, source: Path, box: tuple[int, int, int, int], label: str):
    x, y, width, height = box
    image = Image.open(source).convert("RGB")
    image.thumbnail((width - 12, height - 36), Image.Resampling.LANCZOS)
    px = x + (width - image.width) // 2
    py = y + 24 + (height - 36 - image.height) // 2
    sheet.paste(image, (px, py))
    draw.rectangle((x, y, x + width, y + height), outline=(198, 193, 186), width=1)
    draw.text((x + 6, y + 5), label, font=font(14, True), fill=(24, 24, 22))


def build_contact_sheet(before: dict[str, dict], after: dict[str, dict]):
    tile_width, tile_height = 184, 256
    margin, heading, row_height = 28, 92, 300
    width = margin * 3 + tile_width * 6
    height = heading + row_height * len(AFFECTED)
    sheet = Image.new("RGB", (width, height), (247, 245, 241))
    draw = ImageDraw.Draw(sheet)
    draw.text((margin, 18), "KALM Move women — back-first merchandising", font=font(28, True), fill=(22, 22, 20))
    draw.text((margin, 55), "Before: front → angle → back    |    After: back → angle → front", font=font(16), fill=(72, 69, 64))

    for row, product_id in enumerate(AFFECTED):
        before_product, after_product = before[product_id], after[product_id]
        y = heading + row * row_height
        draw.text((margin, y), after_product["title"], font=font(18, True), fill=(22, 22, 20))
        draw.text((margin + 500, y + 3), AFFECTED[product_id], font=font(14), fill=(72, 69, 64))
        before_images = before_product["gallery"][:3]
        after_images = after_product["gallery"][:3]
        for index, image_path in enumerate(before_images):
            draw_image(draw, sheet, ROOT / image_path, (margin + index * tile_width, y + 28, tile_width, tile_height), f"Before {index + 1}")
        for index, image_path in enumerate(after_images):
            draw_image(draw, sheet, ROOT / image_path, (margin * 2 + tile_width * 3 + index * tile_width, y + 28, tile_width, tile_height), f"After {index + 1}")

    sheet.save(REPORT / "before-vs-after-contact-sheet.jpg", quality=92)


def write_markdown(before: dict[str, dict], after: dict[str, dict]):
    affected_rows = []
    excluded_rows = []
    for product_id, reason in AFFECTED.items():
        product = after[product_id]
        affected_rows.append(
            f"| {product['title']} | `{product_id}` | {reason} | {len(product['colors'])} | Back → angle → front |"
        )
    for product_id, reason in EXCLUDED.items():
        product = after[product_id]
        excluded_rows.append(f"| {product['title']} | `{product_id}` | {reason} |")

    (REPORT / "affected-products-list.md").write_text(
        "# Affected KALM Move women products\n\n"
        "Each listed product has a clean back image and a material back-design feature. Its product, colour-variant and collection-card default is now back-first.\n\n"
        "| Product | ID | Back-feature rationale | Colours | Required gallery order |\n| --- | --- | --- | ---: | --- |\n"
        + "\n".join(affected_rows) + "\n",
        encoding="utf-8",
    )
    (REPORT / "excluded-products-list.md").write_text(
        "# Excluded KALM Move women products\n\n"
        "These product image mappings remain exactly as they were at the live baseline.\n\n"
        "| Product | ID | Reason current order remains |\n| --- | --- | --- |\n"
        + "\n".join(excluded_rows) + "\n",
        encoding="utf-8",
    )

    (REPORT / "KS-ACTIVE-REDIRECT-AUDIT.md").write_text(
        "# KS Active domain redirect audit\n\n"
        "## Verified target\n\n"
        "`https://kalmcollective.co.za/#/brand/ks-active` — the live KS Active brand landing route, not the general KALM homepage.\n\n"
        "## Read-only before state\n\n"
        "- Registrar/account interface: GoDaddy, accessible through the existing authenticated Chrome profile.\n"
        "- GoDaddy domain status: **Pending Registration**.\n"
        "- Expiry shown by GoDaddy: 14 July 2027.\n"
        "- Auto-renew shown by GoDaddy: Off.\n"
        "- Public DNS audit: apex and `www` returned NXDOMAIN; therefore no active NS, A, AAAA, CNAME, MX or TXT records could be inventoried.\n"
        "- GoDaddy did not expose an editable DNS zone while registration remains pending.\n"
        "- No forwarding product, hosted website product, SSL certificate, or DNS record change was made.\n\n"
        "## Prepared, not activated\n\n"
        "`netlify.toml` contains four host-specific 301 redirect rules (HTTP and HTTPS for apex and www) to the verified KS Active route. The rules are inactive until the domains can be assigned to the KALM Netlify site and the pending registration permits DNS setup.\n\n"
        "## Required next technical action\n\n"
        "Wait for GoDaddy registration to complete. Then add `ksactive.co.za` to the existing Netlify `kalm-collective-storefront` site, use Netlify's displayed external-DNS values only, and add the matching GoDaddy apex and `www` records without changing mail or ownership records.\n",
        encoding="utf-8",
    )

    (REPORT / "README.md").write_text(
        "# KALM Move Women Back-First — draft evidence\n\n"
        "Scope: the eight women’s products whose back construction is a genuine selling feature. No men’s product, non-KALM Move brand, accessory, Outdoor, Home or Wellness product has been changed.\n\n"
        "- [Affected products](affected-products-list.md)\n"
        "- [Excluded products](excluded-products-list.md)\n"
        "- [Redirect and DNS audit](KS-ACTIVE-REDIRECT-AUDIT.md)\n"
        "- `before-vs-after-contact-sheet.jpg`\n"
        "- `validation-summary.json`\n\n"
        "Production publication is blocked pending GoDaddy registration and DNS availability.\n",
        encoding="utf-8",
    )

    report = {
        "scope": "KALM Move women back-first merchandising and KS Active redirect preparation",
        "baselineSha": BASELINE_SHA,
        "affectedProducts": [
            {
                "id": product_id,
                "title": after[product_id]["title"],
                "backFeature": reason,
                "colourCount": len(after[product_id]["colors"]),
                "galleryOrder": "back, angle, front",
            }
            for product_id, reason in AFFECTED.items()
        ],
        "excludedProducts": [
            {"id": product_id, "title": after[product_id]["title"], "reason": reason}
            for product_id, reason in EXCLUDED.items()
        ],
        "redirect": {
            "source": ["http://ksactive.co.za/*", "https://ksactive.co.za/*", "http://www.ksactive.co.za/*", "https://www.ksactive.co.za/*"],
            "destination": "https://kalmcollective.co.za/#/brand/ks-active",
            "status": 301,
            "configuration": "netlify.toml",
            "statusAtReportTime": "blocked_pending_godaddy_registration",
        },
    }
    (REPORT / "report.json").write_text(json.dumps(report, indent=2) + "\n", encoding="utf-8")


def main():
    REPORT.mkdir(parents=True, exist_ok=True)
    before = by_id(load_catalogue_from_git())
    after = by_id(json.loads((ROOT / "products.json").read_text(encoding="utf-8")))
    build_contact_sheet(before, after)
    write_markdown(before, after)


if __name__ == "__main__":
    main()
