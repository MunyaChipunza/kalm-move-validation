# Image Asset Index

## Public storefront images

| File | Public use | Source/reference | Status | Notes |
|---|---|---|---|---|
| `branding/kalm-collective-transparent-logo.png` | Source parent logo | Google Drive `Branding/Kalm Collective Transparent Logo.png` | verified-brand-asset | Source of truth for KALM Collective on the public site. |
| `branding/kalm-collective-display-logo.png` | Header and footer parent logo | Trimmed derivative of Google Drive `Branding/Kalm Collective Transparent Logo.png` | verified-brand-asset | Used for display because the raw source PNG has a large transparent canvas. |
| `branding/kalm-collective-logo.png` | Brand backup/source logo | Google Drive `Branding/Kalm Collective Logo.png` | verified-brand-asset | Stored as backup/source asset. |
| `branding/ks-active-logo-transparent.png` | KS Active brand page | Local KS Active documents folder | verified-brand-asset | Keeps KS Active distinct as a brand/collection inside KALM Collective. |
| `assets/images/home-hero-source-collage.webp` | Home hero collage | KS Active workbook CDN images | verified-source-collage | Built from the same source image set used for KS Active products. |
| `assets/images/ks-active-archive-hero.webp` | KS Active brand hero | KS Active workbook CDN images | verified-source-collage | Does not imply current physical stock. |
| `assets/images/ks-active-archive-tile.webp` | KS Active category tile | KS Active workbook CDN images | verified-source-collage | Used for the archive drop tile. |
| `assets/images/ks-active/*.webp` | KS Active product cards/details | `January 2023 Order.xlsx` Shopify CDN links | verified-image | See `PRODUCT_IMAGE_AUDIT.md` for per-product mapping. |
| `branding/favicon.png` | Browser favicon | Google Drive KALM Collective logo | verified-brand-asset | Generated from the Drive PNG logo. |
| `branding/icon-192.png` | Web manifest icon | Google Drive KALM Collective logo | verified-brand-asset | Generated from the Drive PNG logo. |
| `branding/icon-512.png` | Web manifest icon | Google Drive KALM Collective logo | verified-brand-asset | Generated from the Drive PNG logo. |
| `branding/social-preview.png` | Social preview | Google Drive logo plus KS source collage | verified-source-composite | Does not use generated product imagery. |

## Pending or intentionally unused

| Asset group | Public use | Status | Notes |
|---|---|---|---|
| KALM Move product images | Product cards/details | concept-only | No final supplier/product images found; public UI renders honest placeholders. |
| Wellness, Home + Living and Outdoor Living category images | Category tiles | pending | Public UI marks these as pending rather than showing unrelated imagery. |
| Older generated KALM Move lifestyle and flatlay files | None | not-used-publicly | Retained in the folder for reference only; not referenced by `products.json` or the current UI. |
| Older generated KS flatlay files | None | superseded | Replaced by workbook-source product images. |

## Guardrails

- Do not claim that generated visuals are customer photos, verified buyer images, final photoshoot output or current stock photography.
- Do not claim KS Active items are currently available until the historical workbook quantities are physically counted.
- Do not show KALM Move product imagery as final until supplier/sample review confirms the actual item.
