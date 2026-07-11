# KALM Women Basic Live Coverage

Date: 2026-07-11

## Reason For Basic Pass

The full API/CLI gallery workflow was stopped by the OpenAI Images API returning `billing_hard_limit_reached` on the only available Platform target, Personal / Default project. To avoid more high-cost full-gallery generation, this pass uses the completed review images already generated plus basic built-in image generation for missing variant heroes.

## Scope Completed

- Replaced the KALM Move Everyday Bottle galleries with the completed API/CLI review outputs.
- Partially replaced the KALM Move Slim Wellness Bottle with completed API/CLI review outputs and basic fallback heroes for missing colours.
- Added basic front hero images for KALM Move Studio Bottle colours.
- Added four new KALM Move women products with one front hero per colour:
  - KALM Move Pocket Racerback Crop Bra
  - KALM Move Contrast Flare Set
  - KALM Move Crossline Legging
  - KALM Move Drift Crop Wide Pant

## Image Standard Used

This is a cost-controlled live coverage pass, not a full Motion Hoodie-style gallery pass.

- API/CLI review outputs are used where they already existed.
- Built-in image generation is used for missing basic heroes.
- Each fallback image is converted to 1200 x 1500 WebP.
- Every declared colour has a matching image path.
- Single-image galleries are intentional for the basic pass.
- Future premium upgrade should add angle/back/movement images after billing/cost limits are resolved.

## QA Files

- Contact sheet: `reports/contact-sheets/kalm-women-basic-live-coverage-20260711.jpg`
- Basic API attempt status: `reports/kalm-women-basic-hero-status.jsonl`
- Reduced manifest: `reports/kalm-move-women-basic-hero-jobs-20260711.jsonl`

## QA Result

- `products.json` parses successfully.
- No duplicate product IDs.
- No duplicate product slugs.
- No missing product image paths.
- All new assets are valid WebP files.
- New basic fallback assets are 1200 x 1500.
- Completed API/CLI review assets are 1216 x 1520.
- Contact sheet visual QA passed for basic live use.

## Known Limitation

The four new products and some bottle variants currently have one-image galleries. This is a deliberate cost-control compromise so the store can go live without broken variants or supplier screenshots.
