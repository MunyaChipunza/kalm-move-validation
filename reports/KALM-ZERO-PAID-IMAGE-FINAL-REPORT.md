# KALM Zero-Paid Image Final Report

## Release

- Production URL: https://kalmcollective.co.za
- Production release master SHA: `709403ba6198329300c33a5cf07f53100c251738`
- Production deploy ID: `6a52cf678ede622c9112c7c3`
- Unique deploy URL: https://6a52cf678ede622c9112c7c3--kalm-collective-storefront.netlify.app
- Rollback commit: `a5b459d4c8b65836e6775d9040729ba6f16d0e80`
- Paid image API usage: 0

## Delivered imagery

- KALM Outdoor: 54 approved local concept images, six 1200 x 1500 WebP views for each of the nine required accessory products.
- KALM Move Women: 294 approved garment v3 logo-correction images across 19 garment products.
- KALM Move Women bottles: 26 source images preserved without any change across three bottle products.
- Rejected candidates: 614 image attempts across two rejected QA batches, before the final category-aware approved pass.

Outdoor product pages display the exact disclosure: `Pre-production concept imagery. Final sourced product may vary.` The products remain waitlist-only: no price, stock claim, variant selector, or add-to-bag control was introduced.

## Provenance and processing

- Outdoor concept imagery was rendered locally with Blender 5.1.2 using deterministic scene, material, camera, and lighting definitions.
- KALM Move corrections use approved source imagery and the approved KALM buffalo mark. The correction pipeline limits changes to narrow, image-specific target regions and records masks, placement polygons, hashes, visual-difference heatmaps, and rejection history.
- Approved images were metadata-stripped and re-encoded as RGB WebP at quality 92 using local Pillow processing.
- All local image-processing child commands cleared `OPENAI_API_KEY`, `REPLICATE_API_TOKEN`, `STABILITY_API_KEY`, `FAL_KEY`, and `RUNPOD_API_KEY`.
- No OpenAI image, Replicate, Stability, Adobe, Midjourney, paid stock, or other paid image service/API was called.

## Validation and live verification

Passed before release:

- `netlify build`
- `node --check script.js`
- `node tools/validate-catalog.mjs`: 69 products, 713 variants, 0 warnings, 0 errors
- `node tools/validate-kalm-outdoor-v2.mjs`: 9 accessories, 6 images each, 0 paid-image usage
- `node tools/validate-kalm-move-women-branding.mjs`: 294 approved garment repairs, 26 preserved bottles, 294 live v3 references
- `node tools/validate-kalm-zero-paid-images.mjs`: 54 Outdoor approved, 294 Move approved, 26 bottles preserved, paid image usage 0
- `tools/local-image-pipeline/assert-zero-paid-image.ps1`: passed, paid image usage 0
- `git diff --check`: passed

Live production verification passed after deployment:

- All nine Outdoor product routes: six unique gallery images, exact disclosure, no price, no add-to-bag control, waitlist controls present.
- 375 x 812 Outdoor product view: six unique images, exact disclosure, no price, no add-to-bag control, waitlist controls present.
- KALM Move Align Halter Legging Set: six v3 gallery images loaded successfully; normal purchasable add-to-bag state retained.

## Evidence

- Manifest: `reports/kalm-zero-paid-image-manifest.json`
- Zero-paid assertion: `reports/zero-paid-image-assertion.json`
- Optimisation log: `reports/kalm-image-optimisation.json`
- KALM Move placement records: `reports/kalm-move-women-buffalo-placement.json`
- Rejection log: `reports/kalm-move-women-buffalo-rejections.json`
- Visual evidence index: `reports/zero-paid-image-visual-evidence/README.md`
- Production screenshots: `reports/zero-paid-image-visual-evidence/storefront/production-*.png`

## NCC status

Updated and re-fetched successfully: page `33014308-1ff0-81da-9dbe-e11111561c0b` now records the production release SHA, deploy ID, approved KALM Move correction count, zero-paid-image outcome, and final-report references.
