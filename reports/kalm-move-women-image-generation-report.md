# KALM Move Women Image Generation Report

Date: 2026-07-11

## Scope

This report covers the requested KALM Move women image workstream:

- rebuild three existing bottle product galleries;
- prepare four newly uploaded product references for generated storefront imagery;
- record prompts, paths, model, status and QA state without exposing secrets.

## API Status

Secure OpenAI API setup succeeded through the connected OpenAI Platform connector.

- Key name: KALM Image Production Codex
- Organization: Personal
- Project: Default project
- Connector target check: Personal / Default project is the only available target in this Codex session
- Local storage: `.env.local`, ignored by git
- Plaintext key exposure: none in chat, logs, reports, tracked files or terminal output

Live generation started through the bundled image CLI, but the OpenAI API returned:

`billing_hard_limit_reached`

The run was stopped once the hard-limit response appeared.

After Munya reported billing was sorted, a single safe smoke test was run against:

`reports/kalm-move-women-api-smoke-job.jsonl`

The smoke test wrote only to `reports/api-smoke/` and did not overwrite storefront assets. It returned the same OpenAI API response:

`billing_hard_limit_reached`

This confirms the blocker is still on the OpenAI account/project billing limit, not the local browser login or missing connector access.

## V2 Resume Attempt

After Munya reported billing was sorted again, a second smoke test completed successfully. The production manifest was rebuilt as:

`reports/kalm-move-women-production-jobs-v2.jsonl`

The v2 manifest tightened the bottle prompts so front shots are product-only, human bottle shots use adult women only, and no conflicting model language is present.

The v2 production run then completed 25 of 88 jobs before the OpenAI API again returned:

`billing_hard_limit_reached`

The runner stopped immediately and skipped the remaining queued jobs to avoid a broken partial catalogue.

V2 outcome:

| Workstream | Jobs | Status |
|---|---:|---|
| KALM Move Everyday Bottle | 15 | 15 generated |
| KALM Move Slim Wellness Bottle | 12 | 10 generated, 1 blocked by billing limit, 1 skipped |
| KALM Move Studio Bottle | 12 | Skipped after billing limit |
| KALM Move Pocket Racerback Crop Bra | 7 | Skipped after billing limit |
| KALM Move Contrast Flare Set | 13 | Skipped after billing limit |
| KALM Move Crossline Legging | 13 | Skipped after billing limit |
| KALM Move Drift Crop Wide Pant | 16 | Skipped after billing limit |
| Total | 88 | 25 generated, 63 remaining |

V2 audit files:

- `reports/kalm-move-women-production-v2-status.jsonl`
- `reports/kalm-move-women-production-v2-blocker-summary.json`
- `reports/kalm-move-women-production-v2-remaining-jobs.jsonl`
- `reports/contact-sheets/v2-everyday-bottle-completed.jpg`
- `reports/contact-sheets/v2-slim-wellness-bottle-completed.jpg`

The v2 Everyday Bottle outputs visually pass the corrected bottle direction at contact-sheet level. The full image task still remains incomplete because Studio Bottle and the four new apparel products were not generated.

## Manifest

Original planning manifest:

`reports/kalm-move-women-image-generation-manifest.jsonl`

Production API manifest:

`reports/kalm-move-women-production-jobs.jsonl`

Remaining resumable jobs:

`reports/kalm-move-women-production-remaining-jobs.jsonl`

Run status:

`reports/kalm-move-women-production-run-status.jsonl`

Manifest coverage after the billing-limit stop:

| Workstream | Jobs | Status |
|---|---:|---|
| KALM Move Everyday Bottle | 15 | 12 generated, 3 blocked by billing limit |
| KALM Move Slim Wellness Bottle | 12 | Blocked by billing limit |
| KALM Move Studio Bottle | 12 | Blocked by billing limit |
| KALM Move Pocket Racerback Crop Bra | 7 | Blocked by billing limit |
| KALM Move Contrast Flare Set | 13 | Blocked by billing limit |
| KALM Move Crossline Legging | 13 | Blocked by billing limit |
| KALM Move Drift Crop Wide Pant | 16 | Blocked by billing limit |
| Total | 88 | 12 generated, 76 remaining |

## Model And Output Settings

- Model: `gpt-image-2`.
- Size: `1216x1520`.
- Output target format: WebP.
- Quality: high.
- Intended aspect ratio: 4:5.

## Bottle Rebuild Plan

| Product | Colours | Views | Planned folder |
|---|---|---|---|
| KALM Move Everyday Bottle | Cream, Blush, Sage, Stone, White | `front.webp`, `angle.webp`, `movement.webp` | `assets/images/products/kalm-move/women/everyday-bottle/` |
| KALM Move Slim Wellness Bottle | Matte White, Soft Beige, Dusty Pink, Sage Green | `front.webp`, `angle.webp`, `movement.webp` | `assets/images/products/kalm-move/women/slim-wellness-bottle/` |
| KALM Move Studio Bottle | Stone, Sand, Lavender Grey, Soft Olive | `front.webp`, `angle.webp`, `movement.webp` | `assets/images/products/kalm-move/women/studio-bottle/` |

## Four Product Reference Intake

Detailed intake file:

`KALM_MOVE_FOUR_PRODUCT_INTAKE.md`

| Product | Supported colours | Sizes visible | Planned folder | Status |
|---|---|---|---|---|
| KALM Move Pocket Racerback Crop Bra | Red, Brown | XS, S, M, L, XL, XXL | `assets/images/products/kalm-move/women/pocket-racerback-crop-bra/` | Manifested only |
| KALM Move Contrast Flare Set | Gray, Pink, Purple, Green | S, M, L, XL | `assets/images/products/kalm-move/women/contrast-flare-set/` | Manifested only |
| KALM Move Crossline Legging | Red, Blue, Black, Pink | S, M, L, XL | `assets/images/products/kalm-move/women/crossline-legging/` | Manifested only |
| KALM Move Drift Crop Wide Pant | Cream White, Sunny Orange, Millennial Pink, Wine Red, Black | S, M, L, XL | `assets/images/products/kalm-move/women/drift-crop-wide-pant/` | Manifested only |

## Inclusivity Plan

The manifest rotates adult model profiles across:

- Black women;
- White women;
- Coloured/mixed-race women;
- Indian/South Asian women;
- Asian women;
- slim, medium, athletic, curvy and plus-size active builds.

The model rotation is planned at colour/product level. Within a single colour gallery, the prompt requires consistent model identity.

## QA State

Automated file QA passed for the 12 generated files:

- valid WebP files;
- 4:5 portrait ratio;
- no zero-byte outputs;
- contact sheet generated at `reports/contact-sheets/everyday-bottle-completed-contact-sheet.jpg`.

Human visual QA failed for the partial bottle set:

- some `front` bottle images included male models instead of product-only or women-focused imagery;
- model identity was not consistent within some colour galleries;
- therefore these generated bottle files are **not approved for integration or deployment**.

Required checks after resumed API generation:

- every output is valid WebP;
- dimensions meet 4:5 portrait requirement;
- no zero-byte or corrupted files;
- buffalo mark is visible, subtle and not malformed;
- no supplier UI, watermark or random text;
- product construction matches the intake reference;
- all declared paths exist before `products.json` integration;
- contact sheets are generated for each bottle, each new product and a combined diversity sheet.

## Products.json Integration State

Bottle product records were not changed for the image rebuild.

No new products were added to `products.json` because the required generated assets do not yet exist. This avoids broken paths, placeholder images and unsupported live products.

The Brands page metadata change is separate from the image rebuild and is tracked in `BRAND_ASSET_MAP.md`.
