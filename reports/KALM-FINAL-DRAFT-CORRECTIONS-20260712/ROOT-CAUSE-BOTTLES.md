# Bottle Integration Root Cause

## Finding

The Stage 1 masters were not degraded in the repository. A fresh SHA-256 audit verified that all 60 `bottles-v2` public files matched their corresponding Stage 1 review source byte-for-byte.

The supplied review screenshot for Studio Bottle shows the prior lifestyle-product path rather than the approved Stage 1 studio master. It therefore cannot be a rendering of the then-current Stage 1 byte-identical source set. The implementation had two cache-risk conditions:

- public bottle URLs were still the previously introduced `bottles-v2` URLs;
- homepage configuration and application entry points reused fixed query-string versions, allowing an existing browser cache to retain older JavaScript and merchandising mappings.

This is an integration freshness problem, not a Stage 1 image-generation or recompression problem.

## Correction

- Copied the 60 approved Stage 1 review assets to `assets/images/products/kalm-move/bottles-v3/` byte-for-byte.
- Changed every active scoped bottle image, gallery and colour-variant path in `products.json` from `bottles-v2` to `bottles-v3`.
- Updated stylesheet, merchandising and application-script version query strings to `final-correction-20260712` so browsers fetch the correction branch's current runtime mapping.
- Kept `contain` fitting on card, mobile-card and gallery surfaces. No CSS stretching, resampling, sharpening or recompression was applied.
- Preserved All-Day Straw Tumbler as visible, Coming soon and non-purchasable.

## Verification

- 60/60 Stage 1 source-to-`bottles-v3` hash pairs match.
- 0 active scoped bottle paths reference `bottles-v2`.
- All active bottle paths resolve under `bottles-v3`.
- The dedicated final-correction validator and the existing catalogue, bottle, rejected-assets, image-dimension and comprehensive validators pass.

See `APPROVED-VS-SMUDGED-VS-CORRECTED-BOTTLES.jpg` and `VALIDATION.json` for the visual and hash evidence.
