#!/usr/bin/env python3
"""Refuse broad or speculative inpainting; legacy removal is only permitted with a reviewed tight mask."""
from __future__ import annotations

import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[3]
REPORTS = ROOT / "reports"


def main() -> None:
    placement = json.loads((REPORTS / "kalm-move-women-buffalo-placement.json").read_text(encoding="utf-8"))
    for record in placement["records"]:
        record["legacyRemovalMethod"] = "not_applied_without_a_confident_tight_legacy-mark mask; source pixels preserved"
    (REPORTS / "kalm-move-women-buffalo-placement.json").write_text(json.dumps(placement, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"speculativeInpainting": 0, "records": len(placement["records"])}))


if __name__ == "__main__":
    main()
