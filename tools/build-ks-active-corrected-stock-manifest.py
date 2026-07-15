"""Read the authoritative Desktop workbook and emit the Gate-A stock manifest only."""
from __future__ import annotations

import hashlib
import json
from datetime import datetime, timezone
from pathlib import Path

import pandas as pd

WORKBOOK = Path(r"C:\Users\Dell\OneDrive\Desktop\KS_Active_Archive_SKU_Master.xlsx")
OUT = Path("reports/KS-ACTIVE-ARCHIVE")


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest().upper()


def json_safe(value):
    if pd.isna(value):
        return None
    if isinstance(value, float) and value.is_integer():
        return int(value)
    return value


def rows(frame: pd.DataFrame) -> list[dict]:
    keys = ["Archive SKU", "Product Code", "Product Title", "Colour", "Size", "Count 1", "Count 2", "Final Qty", "Count Status", "Condition Grade", "Ownership", "Launch Decision", "Launch Qty", "Ready Status"]
    return [{key: json_safe(record.get(key)) for key in keys} for record in frame[keys].to_dict(orient="records")]


def main() -> None:
    if not WORKBOOK.exists():
        raise SystemExit(f"Authoritative workbook is missing: {WORKBOOK}")
    frame = pd.read_excel(WORKBOOK, sheet_name="Physical Count", header=2)
    for column in ["Count 1", "Count 2", "Final Qty", "Launch Qty"]:
        frame[column] = pd.to_numeric(frame[column], errors="coerce")
    for column in ["Product Code", "Count Status", "Archive SKU"]:
        frame[column] = frame[column].fillna("").astype(str).str.strip()

    matched = frame[(frame["Count 1"].notna()) & (frame["Count 2"].notna()) & (frame["Count 1"] == frame["Count 2"]) & (frame["Final Qty"] > 0)].copy()
    pending = frame[frame["Count Status"].str.casefold() == "second count pending"].copy()
    not_counted = frame[frame["Count Status"].str.casefold() == "not counted"].copy()

    expected = {
        "dataRows": 767,
        "matchedPositiveRows": 87,
        "secondCountPendingRows": 11,
        "notCountedRows": 669,
        "count1PopulatedRows": 98,
        "count2PopulatedRows": 87,
        "eligibleProducts": 12,
        "eligibleUnits": 93,
    }
    actual = {
        "dataRows": len(frame),
        "matchedPositiveRows": len(matched),
        "secondCountPendingRows": len(pending),
        "notCountedRows": len(not_counted),
        "count1PopulatedRows": int(frame["Count 1"].notna().sum()),
        "count2PopulatedRows": int(frame["Count 2"].notna().sum()),
        "eligibleProducts": int(matched["Product Code"].nunique()),
        "eligibleUnits": int(matched["Final Qty"].sum()),
    }
    if actual != expected:
        raise SystemExit(f"Workbook controls do not match the correction mandate. Expected {expected}; got {actual}.")

    products = []
    for code, group in matched.groupby("Product Code", sort=True):
        product_rows = rows(group.sort_values(["Colour", "Size", "Archive SKU"]))
        colours = sorted(group["Colour"].dropna().astype(str).unique().tolist())
        products.append({
            "productCode": code,
            "sourceTitle": group["Product Title"].iloc[0],
            "matchedVariantRows": len(product_rows),
            "matchedUnitTotal": int(group["Final Qty"].sum()),
            "stockedColours": colours,
            "variants": product_rows,
            "gateAEligible": True,
            "gateBEligible": False,
            "gateBBlockers": ["ownership", "condition", "launch decision", "launch quantity", "commercial system reconciliation", "Munya production authorisation"],
        })

    manifest = {
        "schemaVersion": 1,
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "authority": {
            "path": str(WORKBOOK),
            "filename": WORKBOOK.name,
            "fileSizeBytes": WORKBOOK.stat().st_size,
            "modifiedAt": datetime.fromtimestamp(WORKBOOK.stat().st_mtime, tz=timezone.utc).isoformat(),
            "sha256": sha256(WORKBOOK),
            "physicalCountSheet": "Physical Count",
            "headerRow": 3,
        },
        "controls": actual,
        "gateA": {"eligibleProductFamilies": products, "eligibleColourCount": sum(len(product["stockedColours"]) for product in products)},
        "gateAHeld": {"classification": "second_count_pending", "products": sorted(pending["Product Code"].unique().tolist()), "variants": rows(pending.sort_values("Archive SKU"))},
        "excluded": {"classification": "not_counted", "variants": len(not_counted)},
        "manualAuthorityPackages": [
            {"productCode": "P049", "units": 7, "status": "approved hidden package; excluded from workbook matched totals"},
            {"productCode": "P050", "units": 11, "status": "approved hidden package; excluded from workbook matched totals"},
        ],
        "commercialPublication": {"blocked": True, "zohoUpdated": False, "intranetUpdated": False, "productionDeployed": False},
    }
    OUT.mkdir(parents=True, exist_ok=True)
    (OUT / "CORRECTED-STOCK-MANIFEST-20260714.json").write_text(json.dumps(manifest, indent=2), encoding="utf-8")
    print(json.dumps({"controls": actual, "output": str(OUT / 'CORRECTED-STOCK-MANIFEST-20260714.json')}, indent=2))


if __name__ == "__main__":
    main()
