# KALM Zero-Paid Image Visual Evidence

This directory records the before-and-after visual QA evidence for the zero-paid-image completion.

## Baseline

The pre-release storefront screenshots are retained in `reports/multi-ai-review/screenshots/`:

- `kalm-outdoor-desktop.png` and `kalm-outdoor-mobile.png`
- `outdoor-accessory-waitlist-desktop.png` and `outdoor-accessory-waitlist-mobile.png`
- `kalm-move-desktop.png` and `kalm-move-product-desktop.png`

## Final local storefront checks

`storefront/` contains desktop evidence for all nine required Outdoor product routes, plus Outdoor brand/grid, KALM Move collection/product, and the 375 px Outdoor product view. The product-route captures show the six-image concept gallery and exact disclosure. The mobile capture shows the same gallery without price or add-to-bag controls.

The post-deployment captures are `production-outdoor-accessory-desktop.png`, `production-outdoor-accessory-mobile.png`, and `production-move-product-desktop.png`. They were captured from `https://kalmcollective.co.za` after deploy `6a52cf678ede622c9112c7c3` went live.

## Image-specific KALM Move QA

- `move-contact-sheets/` contains per-product contact sheets for the 294 approved garment corrections.
- `move-diff-heatmaps/` contains an image-specific heatmap for each approved garment image.
- `../zero-paid-image-masks/` contains the corresponding narrow transparent logo-region masks.

The 26 KALM Move bottle records are deliberately excluded from the correction outputs because their source images were preserved unchanged.
