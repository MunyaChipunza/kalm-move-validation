#!/usr/bin/env python3
"""Run the four bounded local branding methods and persist evidence after each batch."""
from __future__ import annotations

import json
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
HERE = Path(__file__).resolve().parent
REPORTS = ROOT / "reports"


def run(script: str) -> None:
    subprocess.run([sys.executable, str(HERE / script)], check=True)


def update_manifest() -> None:
    manifest_path = REPORTS / "kalm-zero-paid-image-manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    placement = json.loads((REPORTS / "kalm-move-women-buffalo-placement.json").read_text(encoding="utf-8"))
    outcomes = {record["sourceImage"]: record for record in placement["records"]}
    for entry in manifest["entries"]:
        if entry["workstream"] != "kalm_move_women_buffalo_correction":
            continue
        record = outcomes[entry["existingImagePath"]]
        entry["status"] = record["qaResult"]
        entry["qaResult"] = record["qaResult"]
        entry["rejectionReason"] = record["rejectionReason"]
        entry["finalHash"] = record.get("finalHash")
        entry["liveVerificationResult"] = "not_integrated_pending_visual_review"
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    for script in ("audit_branding.py", "build_masks.py", "remove_wrong_mark.py", "place_buffalo.py", "compare_views.py", "render_contact_sheets.py"):
        run(script)
    update_manifest()
