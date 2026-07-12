"""Integrate the approved Stage 1 KALM Move bottle review images without altering them."""
from __future__ import annotations

import hashlib
import json
import shutil
from datetime import datetime, timezone
from pathlib import Path


ROOT = Path(__file__).resolve().parents[1]
REVIEW_ROOT = ROOT / "reports" / "KALM-MOVE-BOTTLES-PHOTOREAL-DRAFT-20260712" / "generated"
PUBLIC_ROOT = ROOT / "assets" / "images" / "products" / "kalm-move" / "bottles-v2"
REPORT_ROOT = ROOT / "reports" / "KALM-MOVE-BOTTLES-STAGE2-20260712"
VIEWS = ("front", "angle", "detail")

PRODUCTS = {
    "kalm-move-everyday-bottle": {
        "folder": "everyday-bottle",
        "colours": ["Black", "Cream", "Lilac", "Sky Blue"],
        "colour_paths": {"Black": "black", "Cream": "cream", "Lilac": "lilac", "Sky Blue": "sky-blue"},
        "codes": {"Black": "BLK", "Cream": "CRM", "Lilac": "LIL", "Sky Blue": "SKY"},
        "audiences": ["women", "men"],
    },
    "kalm-move-slim-wellness-bottle": {
        "folder": "slim-wellness-bottle",
        "colours": ["Matte White", "Stone", "Soft Pink", "Sage"],
        "colour_paths": {"Matte White": "matte-white", "Stone": "stone", "Soft Pink": "soft-pink", "Sage": "sage"},
        "codes": {"Matte White": "MATTE-WHITE", "Stone": "STONE", "Soft Pink": "SOFT-PINK", "Sage": "SAGE"},
        "audiences": ["women"],
    },
    "kalm-move-studio-bottle": {
        "folder": "studio-bottle",
        "colours": ["Black", "Stone", "Lilac", "Sky Blue"],
        "colour_paths": {"Black": "black", "Stone": "stone", "Lilac": "lilac", "Sky Blue": "sky-blue"},
        "codes": {"Black": "BLK", "Stone": "STONE", "Lilac": "LIL", "Sky Blue": "SKY"},
        "audiences": ["women"],
    },
    "kalm-move-protein-shaker-bottle": {
        "folder": "protein-shaker-bottle",
        "colours": ["Black", "Charcoal", "Navy", "Smoke Grey"],
        "colour_paths": {"Black": "black", "Charcoal": "charcoal", "Navy": "navy", "Smoke Grey": "smoke-grey"},
        "codes": {"Black": "BLACK", "Charcoal": "CHARCOAL", "Navy": "NAVY", "Smoke Grey": "SMOKE-GREY"},
        "audiences": ["men", "women"],
    },
}

ALL_DAY = {
    "id": "kalm-move-all-day-straw-tumbler",
    "folder": "all-day-straw-tumbler",
    "colours": ["Black", "Cream", "Lilac", "Sky Blue"],
    "colour_paths": {"Black": "black", "Cream": "cream", "Lilac": "lilac", "Sky Blue": "sky-blue"},
    "codes": {"Black": "BLK", "Cream": "CRM", "Lilac": "LIL", "Sky Blue": "SKY"},
}


def sha256(path: Path) -> str:
    return hashlib.sha256(path.read_bytes()).hexdigest()


def public_images(folder: str, colour_path: str) -> dict[str, str]:
    base = f"assets/images/products/kalm-move/bottles-v2/{folder}/{colour_path}"
    return {view: f"{base}/{view}.jpg" for view in VIEWS}


def copy_images(folder: str, colour_path: str, manifest: list[dict]) -> dict[str, str]:
    source_base = REVIEW_ROOT / folder / colour_path
    destination_base = PUBLIC_ROOT / folder / colour_path
    destination_base.mkdir(parents=True, exist_ok=True)
    public = public_images(folder, colour_path)
    for view in VIEWS:
        source = source_base / f"{view}.jpg"
        destination = destination_base / f"{view}.jpg"
        if not source.exists():
            raise FileNotFoundError(f"Approved review asset is missing: {source}")
        shutil.copyfile(source, destination)
        source_hash = sha256(source)
        destination_hash = sha256(destination)
        if source_hash != destination_hash:
            raise RuntimeError(f"Hash mismatch after copy: {source} -> {destination}")
        manifest.append({
            "reviewSource": source.relative_to(ROOT).as_posix(),
            "reviewSha256": source_hash,
            "publicPath": public[view],
            "publicSha256": destination_hash,
            "view": view,
        })
    return public


def media_presentation() -> dict[str, str]:
    return {
        "cardFit": "contain",
        "cardPosition": "50% 50%",
        "mobileCardFit": "contain",
        "mobileCardPosition": "50% 50%",
        "cardAspectRatio": "4 / 5",
        "mobileCardAspectRatio": "4 / 5",
        "galleryFit": "contain",
        "galleryPosition": "50% 50%",
        "background": "#f6f5f2",
    }


def update_active_product(product: dict, definition: dict, copied: dict[str, dict[str, str]]) -> None:
    existing_variants = {variant.get("colour") or variant.get("color"): variant for variant in product.get("variants", [])}
    product["colors"] = definition["colours"]
    product["audiences"] = definition["audiences"]
    product["image"] = copied[definition["colours"][0]]["front"]
    product["gallery"] = list(copied[definition["colours"][0]].values())
    product["variantImages"] = {
        colour: {"hero": copied[colour]["front"], "gallery": list(copied[colour].values())}
        for colour in definition["colours"]
    }
    variants = []
    for colour in definition["colours"]:
        previous = existing_variants.get(colour, {})
        variants.append({
            "sku": previous.get("sku") or f"{product['skuRoot']}-{definition['codes'][colour]}-ONE-SIZE",
            "colour": colour,
            "size": previous.get("size", "One size"),
            "quantity": previous.get("quantity"),
            "availability": previous.get("availability", "in_stock"),
            "enabled": previous.get("enabled", True),
        })
    product["variants"] = variants
    product["mediaPresentation"] = media_presentation()
    product["updatedAt"] = "2026-07-12T19:00:00.000+02:00"
    product["updatedBy"] = "kalm-move-bottles-stage2"
    product["tags"] = list(dict.fromkeys([*(product.get("tags") or []), *definition["audiences"], "bottle", "accessories", "bottles-v2"]))


def create_all_day_product(copied: dict[str, dict[str, str]]) -> dict:
    colours = ALL_DAY["colours"]
    return {
        "id": ALL_DAY["id"],
        "brand": "KALM Move",
        "brandId": "kalm-move",
        "collection": "KALM Move Accessories",
        "category": "activewear",
        "type": "Straw tumbler",
        "title": "KALM Move All-Day Straw Tumbler",
        "slug": "kalm-move-all-day-straw-tumbler",
        "price": None,
        "compareAtPrice": None,
        "colors": colours,
        "sizes": ["One size"],
        "audience": "women",
        "audiences": ["women", "men"],
        "moveCategory": "accessories",
        "stockLabel": "Coming soon",
        "image": copied["Black"]["front"],
        "description": "A larger straw tumbler for desks, commutes and all-day hydration.",
        "shortDescription": "A larger straw tumbler for desks, commutes and all-day hydration.",
        "longDescription": "A larger straw tumbler for desks, commutes and all-day hydration.",
        "detailBullets": ["Larger all-day straw format", "Integrated handle", "Clean KALM Move finish"],
        "features": ["Larger all-day straw format", "Integrated handle", "Clean KALM Move finish"],
        "fitNotes": "Accessory item for desks, commutes and all-day hydration.",
        "fabric": "Premium tumbler body with a straw lid.",
        "care": "Hand wash recommended.",
        "tags": ["new-in", "activewear", "kalm-move", "men", "women", "accessories", "bottle", "tumbler", "coming-soon", "bottles-v2"],
        "badge": "Coming soon",
        "ctaLabel": "Coming soon",
        "variantImages": {
            colour: {"hero": copied[colour]["front"], "gallery": list(copied[colour].values())}
            for colour in colours
        },
        "gallery": list(copied["Black"].values()),
        "relatedProducts": [],
        "metaTitle": "KALM Move All-Day Straw Tumbler | KALM Move",
        "metaDescription": "A larger straw tumbler for desks, commutes and all-day hydration.",
        "publicationStatus": "published",
        "visibility": "visible",
        "trackInventory": False,
        "inventoryPolicy": "deny",
        "availability": "coming_soon",
        "comingSoon": True,
        "comingSoonMessage": "A larger straw tumbler for desks, commutes and all-day hydration.",
        "comingSoonCallToAction": False,
        "updatedAt": "2026-07-12T19:00:00.000+02:00",
        "updatedBy": "kalm-move-bottles-stage2",
        "skuRoot": "KM-HYDR-ADT",
        "variants": [
            {
                "sku": f"KM-HYDR-ADT-{ALL_DAY['codes'][colour]}",
                "colour": colour,
                "size": "One size",
                "availability": "coming_soon",
                "enabled": False,
            }
            for colour in colours
        ],
        "mediaPresentation": media_presentation(),
    }


def main() -> None:
    catalog_path = ROOT / "products.json"
    catalog = json.loads(catalog_path.read_text(encoding="utf-8"))
    copied_manifest: list[dict] = []
    copied_by_product: dict[str, dict[str, dict[str, str]]] = {}

    for product_id, definition in PRODUCTS.items():
        copied_by_product[product_id] = {}
        for colour in definition["colours"]:
            colour_path = definition["colour_paths"][colour]
            copied_by_product[product_id][colour] = copy_images(definition["folder"], colour_path, copied_manifest)

    all_day_copied: dict[str, dict[str, str]] = {}
    for colour in ALL_DAY["colours"]:
        all_day_copied[colour] = copy_images(ALL_DAY["folder"], ALL_DAY["colour_paths"][colour], copied_manifest)

    by_id = {product["id"]: product for product in catalog["products"]}
    for product_id, definition in PRODUCTS.items():
        if product_id not in by_id:
            raise KeyError(f"Expected existing product not found: {product_id}")
        update_active_product(by_id[product_id], definition, copied_by_product[product_id])

    catalog["products"] = [product for product in catalog["products"] if product["id"] != ALL_DAY["id"]]
    catalog["products"].append(create_all_day_product(all_day_copied))
    catalog_path.write_text(json.dumps(catalog, indent=2) + "\n", encoding="utf-8")

    REPORT_ROOT.mkdir(parents=True, exist_ok=True)
    (REPORT_ROOT / "product-image-manifest.json").write_text(json.dumps({
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "stage1ReviewCommit": "7dcab8867be78ff133e1debf5518736120ca6472",
        "sourceReviewRoot": "reports/KALM-MOVE-BOTTLES-PHOTOREAL-DRAFT-20260712/generated",
        "publicRoot": "assets/images/products/kalm-move/bottles-v2",
        "assetCount": len(copied_manifest),
        "assets": copied_manifest,
    }, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"status": "passed", "copiedAssets": len(copied_manifest), "products": 5}, indent=2))


if __name__ == "__main__":
    main()
