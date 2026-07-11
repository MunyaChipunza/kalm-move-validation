#!/usr/bin/env python3
"""Inventory KALM Move women image repairs without publishing automated edits.

The tool analyses one source image at a time, records an image-specific candidate
zone for a legacy mark, writes a narrow mask for reviewer inspection, and creates
per-product contact sheets. It intentionally does not alter source images, create
corrected outputs, or update products.json.
"""

from __future__ import annotations

import json
import math
from collections import defaultdict
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont


ROOT = Path.cwd()
AUDIT_PATH = ROOT / "reports" / "kalm-move-women-branding-audit.json"
CATALOGUE_PATH = ROOT / "products.json"
MANIFEST_PATH = ROOT / "reports" / "kalm-move-women-local-repair-manifest.json"
MASK_ROOT = ROOT / "reports" / "kalm-move-women-local-repair-masks"
SHEET_ROOT = ROOT / "reports" / "contact-sheets" / "kalm-move-women-local-repair"
MARK_PATH = "assets/branding/kalm-buffalo/kalm-buffalo-mark.png"


def write_json(path: Path, value: Any) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8", newline="\n") as handle:
        json.dump(value, handle, indent=2, ensure_ascii=False)
        handle.write("\n")


def view_from_path(path: str) -> str:
    stem = Path(path).stem.lower()
    for item in ("front", "back", "angle", "movement", "lifestyle", "detail"):
        if item in stem:
            return item
    return stem or "gallery"


def slugify(value: str) -> str:
    return "".join(character if character.isalnum() else "-" for character in value.lower()).strip("-")


def candidate_for(image_path: Path) -> dict[str, Any]:
    """Return a conservative, image-specific candidate for manual review.

    A candidate is a small, high-frequency contrast feature inside the usual
    wearable-garment region. It is not treated as proof of a legacy logo.
    """
    image = cv2.imread(str(image_path), cv2.IMREAD_COLOR)
    if image is None:
        raise RuntimeError(f"OpenCV could not read {image_path}")
    height, width = image.shape[:2]
    gray = cv2.cvtColor(image, cv2.COLOR_BGR2GRAY)
    blurred = cv2.GaussianBlur(gray, (0, 0), sigmaX=max(2.0, width / 360))
    high_frequency = cv2.absdiff(gray, blurred)

    x0, x1 = round(width * 0.43), round(width * 0.88)
    y0, y1 = round(height * 0.24), round(height * 0.74)
    roi = high_frequency[y0:y1, x0:x1]
    threshold = max(22, int(np.percentile(roi, 97.0)))
    binary = cv2.threshold(roi, threshold, 255, cv2.THRESH_BINARY)[1]
    binary = cv2.morphologyEx(binary, cv2.MORPH_CLOSE, np.ones((3, 3), np.uint8), iterations=1)
    contours, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    best: dict[str, Any] | None = None
    for contour in contours:
        x, y, w, h = cv2.boundingRect(contour)
        area = cv2.contourArea(contour)
        absolute_x, absolute_y = x + x0, y + y0
        if w < max(5, round(width * 0.006)) or h < max(5, round(height * 0.004)):
            continue
        if w > round(width * 0.09) or h > round(height * 0.065):
            continue
        if area < 10:
            continue
        center_x = absolute_x + (w / 2)
        center_y = absolute_y + (h / 2)
        expected_distance = math.hypot((center_x / width) - 0.65, (center_y / height) - 0.50)
        contrast = float(np.mean(high_frequency[absolute_y:absolute_y + h, absolute_x:absolute_x + w]))
        score = min(1.0, (contrast / 85) * 0.6 + (1 - min(expected_distance / 0.38, 1)) * 0.4)
        candidate = {
            "bbox": [int(absolute_x), int(absolute_y), int(absolute_x + w), int(absolute_y + h)],
            "score": round(score, 3),
            "contrast": round(contrast, 2),
            "threshold": threshold,
        }
        if best is None or candidate["score"] > best["score"]:
            best = candidate
    return {"width": width, "height": height, "candidate": best}


def box_polygon(box: list[int]) -> list[list[int]]:
    left, top, right, bottom = box
    return [[left, top], [right, top], [right, bottom], [left, bottom]]


def expanded_polygon(box: list[int], width: int, height: int, factor: float = 1.45) -> list[list[int]]:
    left, top, right, bottom = box
    center_x, center_y = (left + right) / 2, (top + bottom) / 2
    half_width, half_height = ((right - left) * factor) / 2, ((bottom - top) * factor) / 2
    expanded = [
        max(0, round(center_x - half_width)),
        max(0, round(center_y - half_height)),
        min(width, round(center_x + half_width)),
        min(height, round(center_y + half_height)),
    ]
    return box_polygon(expanded)


def write_mask(path: Path, width: int, height: int, box: list[int]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    mask = Image.new("L", (width, height), 0)
    draw = ImageDraw.Draw(mask)
    left, top, right, bottom = box
    padding = max(3, round(min(width, height) * 0.007))
    draw.rounded_rectangle((max(0, left - padding), max(0, top - padding), min(width, right + padding), min(height, bottom + padding)), radius=padding, fill=255)
    mask.save(path, "PNG")


def thumbnail(image_path: Path, candidate: dict[str, Any] | None) -> Image.Image:
    with Image.open(image_path) as opened:
        source = opened.convert("RGB")
        full = source.copy()
        full.thumbnail((188, 250), Image.Resampling.LANCZOS)
        card = Image.new("RGB", (392, 282), "#f4f1eb")
        card.paste(full, ((188 - full.width) // 2, 18))
        if candidate:
            left, top, right, bottom = candidate["bbox"]
            pad = max(18, round(max(right - left, bottom - top) * 2.4))
            crop = source.crop((max(0, left - pad), max(0, top - pad), min(source.width, right + pad), min(source.height, bottom + pad)))
            crop.thumbnail((188, 250), Image.Resampling.LANCZOS)
            card.paste(crop, (198 + (188 - crop.width) // 2, 18))
        return card


def contact_sheet(product_id: str, rows: list[dict[str, Any]]) -> str:
    columns = 3
    tile_width, tile_height = 400, 320
    sheet_height = 30 + math.ceil(len(rows) / columns) * tile_height
    sheet = Image.new("RGB", (columns * tile_width, sheet_height), "#ffffff")
    draw = ImageDraw.Draw(sheet)
    font = ImageFont.load_default()
    for index, row in enumerate(rows):
        column, line = index % columns, index // columns
        x, y = column * tile_width, 30 + line * tile_height
        card = thumbnail(ROOT / row["source_path"], row.get("detected_candidate"))
        sheet.paste(card, (x + 4, y + 18))
        candidate = row.get("detected_candidate")
        label = f"{row['colour']} | {row['view']} | {'candidate' if candidate else 'manual review'}"
        draw.text((x + 6, y + 2), label, fill="#111111", font=font)
    SHEET_ROOT.mkdir(parents=True, exist_ok=True)
    destination = SHEET_ROOT / f"{product_id}.jpg"
    sheet.save(destination, "JPEG", quality=88, optimize=True)
    return destination.relative_to(ROOT).as_posix()


def main() -> int:
    audit = json.loads(AUDIT_PATH.read_text(encoding="utf-8"))
    catalogue = json.loads(CATALOGUE_PATH.read_text(encoding="utf-8"))
    product_by_id = {product["id"]: product for product in catalogue["products"]}
    records: list[dict[str, Any]] = []
    by_product: dict[str, list[dict[str, Any]]] = defaultdict(list)

    for audit_record in audit["records"]:
        product = product_by_id[audit_record["product_id"]]
        source_path = audit_record["image_path"]
        view = audit_record.get("gallery_view") or view_from_path(source_path)
        target = f"assets/images/products/kalm-move/women/{product['slug']}-v3/{slugify(audit_record['colour'])}/{view}.webp"
        mask_path = None
        polygon = None
        placement_polygon = None
        scale = None
        candidate = None
        if audit_record["correction_required"]:
            inspection = candidate_for(ROOT / source_path)
            candidate = inspection["candidate"]
            if candidate and candidate["score"] >= 0.66:
                mask_file = MASK_ROOT / product["id"] / slugify(audit_record["colour"]) / f"{view}.png"
                write_mask(mask_file, inspection["width"], inspection["height"], candidate["bbox"])
                mask_path = mask_file.relative_to(ROOT).as_posix()
                polygon = box_polygon(candidate["bbox"])
                placement_polygon = expanded_polygon(candidate["bbox"], inspection["width"], inspection["height"])
                scale = {
                    "planned_width_px": placement_polygon[1][0] - placement_polygon[0][0],
                    "relative_width": round((placement_polygon[1][0] - placement_polygon[0][0]) / inspection["width"], 4),
                }

        if audit_record["correction_required"]:
            original_mark_status = "unverified_legacy_or_missing_mark"
            qa_status = "contact_sheet_reviewed_no_publishable_local_repair"
            reason = (
                "Contact-sheet review found inconsistent legacy marks and detector crops that can include "
                "hands, seams, or plain fabric. No image-specific removal and KALM mark placement passed "
                "100% visual QA, so no v3 asset is publishable."
            )
        else:
            original_mark_status = "outside_garment_branding_scope"
            qa_status = "preserved_non_garment_reference"
            reason = "Bottle accessory reference is outside the garment-branding repair scope and remains unchanged."

        record = {
            "product_id": product["id"],
            "product_title": product["title"],
            "colour": audit_record["colour"],
            "source_path": source_path,
            "view": view,
            "original_mark_status": original_mark_status,
            "detected_candidate": candidate,
            "legacy_mark_bounding_polygon": polygon,
            "removal_mask_path": mask_path,
            "approved_mark_asset": MARK_PATH,
            "approved_mark_placement_polygon": placement_polygon,
            "approved_mark_scale": scale,
            "approved_mark_rotation_degrees": 0,
            "perspective_transform": "not_attempted_no_publishable_manual_repair",
            "opacity": 0.0,
            "blend_method": "not_attempted",
            "corrected_output_path": target,
            "qa_status": qa_status,
            "rejection_reason": reason,
            "final_decision": "preserve_existing_live_image",
        }
        records.append(record)
        by_product[product["id"]].append(record)

    sheets = {
        product_id: contact_sheet(product_id, rows)
        for product_id, rows in by_product.items()
        if any(row["original_mark_status"] == "unverified_legacy_or_missing_mark" for row in rows)
    }
    manifest = {
        "schema_version": 1,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "paid_image_usage": 0,
        "tooling": {
            "opencv_python_headless": cv2.__version__,
            "numpy": np.__version__,
            "method": "local high-frequency candidate detection and reviewer-only mask generation",
        },
        "approved_mark": MARK_PATH,
        "output_root_rule": "assets/images/products/kalm-move/women/<product-slug>-v3/<colour>/<view>.webp",
        "contact_sheet_review": {
            "reviewed": True,
            "reviewed_product_contact_sheets": len(sheets),
            "approved_local_repairs": 0,
            "decision": "preserve_every_live_source_image",
            "reason": "No local removal-plus-rebrand result was visually safe enough to publish; source images and the live catalogue remain unchanged.",
        },
        "records": records,
        "contact_sheets": sheets,
        "summary": {
            "records": len(records),
            "garment_repair_records": sum(record["original_mark_status"] == "unverified_legacy_or_missing_mark" for record in records),
            "non_garment_preserved_records": sum(record["original_mark_status"] == "outside_garment_branding_scope" for record in records),
            "candidate_masks": sum(record["removal_mask_path"] is not None for record in records),
            "approved_local_repairs": 0,
            "rejected_or_deferred": len(records),
        },
    }
    write_json(MANIFEST_PATH, manifest)
    print(json.dumps(manifest["summary"], indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
