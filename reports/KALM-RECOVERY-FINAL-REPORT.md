# KALM Storefront Recovery Report

Date: 2026-07-11 (SAST)
Scope: KALM Move women branding recovery and production-safety verification

## Outcome

The existing production-safe catalogue is preserved. No KALM Move women source image, product record, live image path, approved website logo, or production deployment was changed during this recovery phase.

- Audited: 22 women products, 19 garment products, 3 bottle accessories, and 320 colour-image records.
- Local repair manifest: [kalm-move-women-local-repair-manifest.json](kalm-move-women-local-repair-manifest.json) covers all 320 image records.
- Approved v3 corrected assets: 0.
- Paid-image usage: 0.
- Live catalogue references to v3 assets: 0.
- Deployment: withheld; there is no approved visual correction to release.

## Local-image decision

Nineteen product contact sheets were reviewed visually. Legacy animal marks vary by garment, colour, pose, and gallery view. The conservative local detector created three review masks, but visual inspection also found candidate zones that are hands, seams, or plain fabric. No removal-plus-rebrand result met 100% visual QA, so every existing live image remains in place. The manifest keeps the required per-image target v3 path and repair fields for a future approved, image-specific local edit; it does not publish or reference a v3 output.

The previous two deterministic compositing experiments were already removed after visual QA. This phase did not call an image API, paid or metered image service, paid background removal service, local diffusion model, or external source repository.

## Validation

| Check | Result |
| --- | --- |
| `node --check script.js` | Passed |
| `node tools/validate-catalog.mjs` | Passed: 60 products, 713 variants, 0 warnings, 0 errors |
| `node tools/validate-kalm-move-women-branding.mjs` | Passed: 320 records, paid usage 0, approved repairs 0, live v3 references 0 |
| Git whitespace check | Passed |
| Local browser QA | Passed: KALM Move women filter (22 styles), product gallery and variants, add/remove bag, desktop search, mobile menu, and no console errors |

## Outstanding image work

The 294 garment records remain safely deferred. Resolution requires approved corrected source imagery or a future manual, per-image local restoration and rebrand that passes visual QA without changing product truth. Paid image generation is expressly excluded.

## Release decision

The storefront remains stable and no rollback was needed. This report records a safe checkpoint rather than a production release: deploying an unchanged site would not resolve the identified imagery, and publishing speculative local corrections would violate the visual-quality gate.
