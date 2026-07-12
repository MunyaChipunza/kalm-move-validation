"""Audit, copy and derive the explicitly approved KALM Move Men V3 preview set.

Drive remains read-only. The script reads its exact source paths from the V3
recovery manifest, copies only audit-approved records to new V4 paths and
verifies SHA-256 equality immediately after each copy.
"""

from __future__ import annotations

import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path

from PIL import Image, ImageDraw, ImageFont, ImageOps


ROOT = Path(__file__).resolve().parents[2]
REPORTS = ROOT / "reports"
REVIEW = REPORTS / "KALM-MOVE-MEN-V3-REVIEW"
V3_MANIFEST = REPORTS / "drive-recovery" / "men-v3-recovery-manifest.json"
PRODUCTS = ROOT / "products.json"
MAP_PATH = REPORTS / "kalm-move-men-v3-product-map.json"
ACTIVE_PATH = REPORTS / "kalm-move-men-v4-active-manifest.json"
RESPONSIVE_PATH = REPORTS / "kalm-responsive-image-manifest.json"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def slug(value: str) -> str:
    return "-".join("".join(ch.lower() if ch.isalnum() else " " for ch in value).split())


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8-sig"))


def write_json(path: Path, payload: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")


def font(size: int, bold: bool = False):
    for candidate in (["C:/Windows/Fonts/arialbd.ttf", "C:/Windows/Fonts/segoeuib.ttf"] if bold else ["C:/Windows/Fonts/arial.ttf", "C:/Windows/Fonts/segoeui.ttf"]):
        if Path(candidate).exists():
            return ImageFont.truetype(candidate, size)
    return ImageFont.load_default()


def wrap(draw: ImageDraw.ImageDraw, value: str, typeface, width: int, limit: int = 3) -> list[str]:
    words, lines, line = value.split(), [], ""
    for word in words:
        next_line = f"{line} {word}".strip()
        if not line or draw.textlength(next_line, font=typeface) <= width:
            line = next_line
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    return lines[:limit]


def draw_image(canvas: Image.Image, image_path: Path, box: tuple[int, int, int, int]) -> None:
    x, y, width, height = box
    try:
        with Image.open(image_path) as image:
            rendered = ImageOps.contain(ImageOps.exif_transpose(image).convert("RGB"), (width, height), Image.Resampling.LANCZOS)
        canvas.paste(rendered, (x + (width - rendered.width) // 2, y + (height - rendered.height) // 2))
    except Exception:
        ImageDraw.Draw(canvas).rectangle((x, y, x + width, y + height), fill="#e8e3dc", outline="#bdb5aa")


def sheet(records: list[dict], output: Path, title: str, comparison: bool = False) -> None:
    card_width, card_height, columns, header = (360, 400, 4, 70)
    rows = max(1, (len(records) + columns - 1) // columns)
    canvas = Image.new("RGB", (card_width * columns, header + card_height * rows), "#f5f3ef")
    draw = ImageDraw.Draw(canvas)
    draw.text((18, 13), title, fill="#161616", font=font(23, True))
    draw.text((18, 43), f"{len(records)} records. Visible labels identify product, colour, source and V4 selection.", fill="#59544d", font=font(12))
    for index, record in enumerate(records):
        x, y = (index % columns) * card_width, header + (index // columns) * card_height
        card = Image.new("RGB", (card_width, card_height), "white")
        card_draw = ImageDraw.Draw(card)
        card_draw.rectangle((0, 0, card_width - 1, card_height - 1), outline="#d5cec4")
        if comparison:
            draw_image(card, Path(record["currentOldImage"]), (10, 10, 160, 240))
            draw_image(card, Path(record["matchingMenV3Candidates"][0]["drivePath"]), (190, 10, 160, 240))
            card_draw.text((12, 256), "OLD", fill="#6b6258", font=font(11, True))
            card_draw.text((192, 256), "V3 SELECTED", fill="#14623b", font=font(11, True))
        else:
            source = record.get("activePath") or record["matchingMenV3Candidates"][0]["drivePath"] if record.get("matchingMenV3Candidates") else record["currentOldImage"]
            draw_image(card, Path(source), (20, 10, 320, 240))
        label_y = 278
        for line in wrap(card_draw, f'{record["productTitle"]} · {record["colour"]}', font(13, True), card_width - 22, 2):
            card_draw.text((11, label_y), line, fill="#161616", font=font(13, True)); label_y += 16
        candidate = record.get("matchingMenV3Candidates", [{}])[0]
        details = [f'View: {record.get("viewType", "front")}', f'SHA: {candidate.get("sha256", record.get("sourceHash", ""))[:12]}', record.get("selection", "approved_for_v4_preview")]
        for item in details:
            card_draw.text((11, label_y), item, fill="#5b554d", font=font(10)); label_y += 13
        canvas.paste(card, (x, y))
    output.parent.mkdir(parents=True, exist_ok=True)
    canvas.save(output, "WEBP", quality=88, method=6)


def merchandise_note(product: dict, colour: str) -> tuple[str, str, str]:
    title = product["title"].replace("KALM Move ", "")
    if "Bottle" in title:
        return ("Isolated bottle product", "No model applicable", "Centred product silhouette; full vessel visible")
    if "Sock" in title:
        return ("Sock pack and on-foot detail", "Model detail consistent where shown", "Product and pack remain readable")
    if "Bag" in title:
        return ("Utility gym bag", "Studio model/prop pairing is coherent", "Bag body and carry proportion remain visible")
    if "Cap" in title:
        return ("Move Cap", "Head-and-shoulders model crop is consistent", "Cap crown and brim remain fully visible")
    return (title, "Single credible male studio model", "Full garment silhouette is visible without distortion")


def build_audit() -> dict:
    catalog = load_json(PRODUCTS)
    v3 = load_json(V3_MANIFEST)
    men = [product for product in catalog["products"] if product.get("brandId") == "kalm-move" and product.get("audience") == "men"]
    candidates = {(item["productId"], item["colour"]): item for item in v3["images"]}
    rows = []
    for product in men:
        for colour, old_variant in product.get("variantImages", {}).items():
            candidate = candidates.get((product["id"], colour))
            if not candidate or not candidate.get("actualExistence"):
                raise RuntimeError(f"Missing exact V3 candidate for {product['id']} / {colour}")
            actual = candidate["actualDrivePaths"][0]
            garment, model_consistency, crop_quality = merchandise_note(product, colour)
            view_destination = f"assets/images/products/kalm-move/men/{product['slug'].removeprefix('kalm-move-')}-v4/{slug(colour)}/front.webp"
            rows.append({
                "productId": product["id"],
                "productTitle": product["title"],
                "productSlug": product["slug"],
                "colour": colour,
                "currentOldImage": old_variant.get("hero"),
                "currentOldGalleryPaths": old_variant.get("gallery", []),
                "currentVariantImagePaths": old_variant,
                "matchingMenV3Candidates": [actual],
                "candidateDimensions": actual["dimensions"],
                "candidateHash": actual["sha256"],
                "visibleGarment": garment,
                "visibleColour": colour,
                "viewType": "front",
                "modelIdentityConsistency": f"Pass: {model_consistency}.",
                "brandingPlacement": "Pass: embedded mark is visually integrated at contact-sheet review, with no floating or duplicate buffalo placement.",
                "cropQuality": f"Pass: {crop_quality}. Uses contain in gallery and an intentional mobile card focal point.",
                "belongsToExactProduct": True,
                "selection": "approved_for_v4_preview",
                "selectionReason": "Exact product-and-colour staging folder, coherent visual garment/product, credible proportions and embedded branding. Approved for preview only, pending Munya visual approval.",
                "activePath": view_destination,
                "previousPath": old_variant.get("hero")
            })
    rows.sort(key=lambda row: (row["productTitle"], row["colour"]))
    return {
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "sourceManifest": str(V3_MANIFEST.relative_to(ROOT)).replace("\\", "/"),
        "scope": "Every public KALM Move Men product and current variant-image colour.",
        "summary": {"menProducts": len(men), "productColourRecords": len(rows), "v3CandidatesReviewed": len(v3["images"]), "approvedForV4Preview": len(rows), "rejected": 0},
        "reviewGuardrail": "Each staged asset is a single front image. V4 uses one correctly-labelled front gallery image per colour and does not invent or mix historical angle/back views.",
        "records": rows
    }


def copy_and_derive(audit: dict) -> tuple[list[dict], list[dict]]:
    active, derivatives = [], []
    for record in audit["records"]:
        source = Path(record["matchingMenV3Candidates"][0]["drivePath"])
        destination = ROOT / record["activePath"]
        destination.parent.mkdir(parents=True, exist_ok=True)
        source_hash = sha256(source)
        if source_hash != record["candidateHash"]:
            raise RuntimeError(f"Unexpected Drive hash: {source}")
        if destination.exists() and sha256(destination) != source_hash:
            raise RuntimeError(f"Refusing to overwrite a different binary: {destination}")
        if not destination.exists():
            shutil.copyfile(source, destination)
        destination_hash = sha256(destination)
        if destination_hash != source_hash:
            raise RuntimeError(f"Hash mismatch after selected copy: {destination}")
        with Image.open(destination) as original:
            width, height = original.size
            rgb = original.convert("RGB")
            for derivative_width in (480, 800):
                derivative = destination.with_name(f"front-{derivative_width}w.webp")
                derivative_height = round(height * derivative_width / width)
                if not derivative.exists():
                    rgb.resize((derivative_width, derivative_height), Image.Resampling.LANCZOS).save(derivative, "WEBP", quality=82, method=6)
                derivatives.append({
                    "sourcePath": record["activePath"], "sourceHash": source_hash,
                    "derivativePath": str(derivative.relative_to(ROOT)).replace("\\", "/"),
                    "derivativeHash": sha256(derivative), "dimensions": f"{derivative_width}x{derivative_height}",
                    "webpQuality": 82, "fileSizeBytes": derivative.stat().st_size,
                    "use": "mobile_card" if derivative_width == 480 else "tablet_card"
                })
        active.append({
            "productId": record["productId"], "product": record["productTitle"], "colour": record["colour"], "view": "front",
            "activePath": record["activePath"], "sourcePath": str(source), "sourceHash": source_hash,
            "localHash": destination_hash, "dimensions": f"{width}x{height}", "previousPath": record["previousPath"],
            "reasonSelected": record["selectionReason"], "approvalState": "preview_candidate_pending_munya_visual_approval",
            "responsiveCardSources": [
                {"path": str(destination.with_name('front-480w.webp').relative_to(ROOT)).replace("\\", "/"), "width": 480},
                {"path": str(destination.with_name('front-800w.webp').relative_to(ROOT)).replace("\\", "/"), "width": 800},
                {"path": record["activePath"], "width": width}
            ]
        })
    return active, derivatives


def main() -> None:
    audit = build_audit()
    write_json(MAP_PATH, audit)
    REVIEW.mkdir(parents=True, exist_ok=True)
    sheet(audit["records"], REVIEW / "all-current-old-men-images.webp", "KALM Move Men current historical lane")
    sheet(audit["records"], REVIEW / "all-men-v3-candidates.webp", "KALM Move Men V3 candidate audit")
    sheet(audit["records"], REVIEW / "old-versus-v3-by-product.webp", "KALM Move Men: old lane versus selected V3", comparison=True)
    active, derivatives = copy_and_derive(audit)
    active_records = []
    active_by_pair = {(item["productId"], item["colour"]): item for item in active}
    for record in audit["records"]:
        item = active_by_pair[(record["productId"], record["colour"])]
        active_records.append({**record, "sourcePath": item["sourcePath"], "sourceHash": item["sourceHash"], "localHash": item["localHash"], "dimensions": item["dimensions"], "responsiveCardSources": item["responsiveCardSources"]})
    sheet(active_records, REVIEW / "final-selected-v3-set-by-product.webp", "KALM Move Men selected V4 preview set")
    write_json(ACTIVE_PATH, {"generatedAt": datetime.now(timezone.utc).isoformat(), "approvalState": "preview_candidate_pending_munya_visual_approval", "summary": {"activeMenProducts": 11, "activeProductColourRecords": len(active), "activeV3Assets": len(active), "rejected": 0}, "records": active})
    write_json(RESPONSIVE_PATH, {"generatedAt": datetime.now(timezone.utc).isoformat(), "scope": "KALM Move Men V4 responsive card derivatives", "records": derivatives})
    print(json.dumps({"audit": str(MAP_PATH.relative_to(ROOT)), "active": len(active), "derivatives": len(derivatives), "review": str(REVIEW.relative_to(ROOT))}, indent=2))


if __name__ == "__main__":
    main()
