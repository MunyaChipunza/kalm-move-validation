# KALM Zero-Paid Image Execution Log

## 2026-07-12 - Phase 0 and local-toolchain baseline

- Verified `master` and `origin/master` at `07258b3a6f2960718750a78b57a01f9537d4ce34`, with a clean worktree and no active merge, rebase, cherry-pick, or Git lock.
- Verified the approved Netlify project `kalm-collective-storefront` (`06334c13-7d82-45f1-b983-4a7295de88d8`), production URL `https://kalmcollective.co.za`, current production deploy `6a52b608d813d38d4986c54e`, and rollback `a5b459d4c8b65836e6775d9040729ba6f16d0e80`.
- Created and pushed empty branch `feature/kalm-zero-paid-imagery-v1`.
- Verified the official Blender Foundation WinGet package, then installed Blender 5.1.2 locally. No rendering service or paid image API was used.
- Created `tools/local-image-pipeline/.venv` and installed only NumPy, Pillow, OpenCV, scikit-image, ImageIO, and PyYAML with paid-image credential variables removed from the child process environment.
- Paid image usage: 0.

## 2026-07-12 - Local generation, integration, and QA

- Corrected the Blender 5.1 render-engine identifier after the initial smoke run reported that `BLENDER_EEVEE_NEXT` was unavailable; the local renderer now uses the supported `BLENDER_EEVEE` identifier.
- Rendered 54 local WebP concept images (six views for each of the nine required KALM Outdoor accessories). Each catalogue item carries the exact required pre-production disclosure and remains waitlist-only with no price, stock, variant, or add-to-bag state.
- Ran three image-specific KALM Move logo-correction candidate passes. Candidate 1 (320 images) and candidate 2 (294 garment images) were rejected after QA; the final category-aware pass approved 294 garment images. The 26 bottle source images were preserved without changes.
- Re-encoded the 348 approved outputs as metadata-stripped RGB WebP at quality 92. The local environment did not expose ImageMagick or FFmpeg on `PATH`, so image structure was checked with Pillow and a native WebP dimension parser instead; no external image-processing service was used.
- Integrated only approved Outdoor v2 and garment v3 asset paths into the catalogue. Local desktop and 375 px mobile storefront checks confirmed the nine Outdoor product galleries, disclosure, waitlist-only state, and KALM Move v3 gallery references with no browser console errors.
- Re-ran the zero-paid-image assertion: passed, paid image usage 0.
