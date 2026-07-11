# KALM Move Four Product Intake

Date: 2026-07-11

Scope: four newly uploaded KALM Move women's product references. These references are supplier screenshots and must not be used directly as customer-facing storefront imagery.

## Intake Result

Exactly four distinct product references were identified from the 14 uploaded photos:

1. Racerback pocket crop bra
2. Contrast-trim flare set
3. Cross-waist piped legging
4. Cropped wide-leg pant

No additional product was inferred beyond the visual evidence in the uploaded references.

## Product 1: Racerback Pocket Crop Bra

| Field | Intake |
|---|---|
| Source filenames | `G:\My Drive\.codex-remote-attachments\019f3c5b-22c3-72f2-8099-c6dc427b2539\72b19b80-6c9a-4aa0-a678-2b408a53317c\1-Photo-1.jpg`; `2-Photo-2.jpg`; `3-Photo-3.jpg`; `4-Photo-4.jpg` |
| Proposed customer-facing product name | KALM Move Pocket Racerback Crop Bra |
| Product type | Longline sports bra / crop tank |
| Visible garment construction | Longline fitted crop sports bra with racerback, high arm openings, front side phone pocket and multiple rear storage pockets. |
| Front design | Clean longline crop front, round/high active neckline, vertical front seam, side phone pocket under arm/chest line. |
| Back design | Racerback with wide centre spine panel, large arm cutouts, multiple horizontal rear pocket slots across lower back. |
| Straps, sleeves, waist, leg and closure details | Sleeveless racerback top; cropped hem at high waist; no visible zip or clasp closure. |
| Supported colours visible in evidence | Red, Brown |
| Unknown or ambiguous details | Exact pocket depth, internal support/padding, fabric composition and whether other hidden colours exist. |
| Recommended image folder | `assets/images/products/kalm-move/women/pocket-racerback-crop-bra/` |
| Proposed SKU root | `KM-W-POCKET-RACERBACK-CROP-BRA` |

## Product 2: Contrast-Trim Flare Set

| Field | Intake |
|---|---|
| Source filenames | `G:\My Drive\.codex-remote-attachments\019f3c5b-22c3-72f2-8099-c6dc427b2539\72b19b80-6c9a-4aa0-a678-2b408a53317c\5-Photo-5.jpg`; `G:\My Drive\.codex-remote-attachments\019f3c5b-22c3-72f2-8099-c6dc427b2539\ff5371b9-1586-4601-b3d9-e86648dd6e4a\1-Photo-1.jpg`; `2-Photo-2.jpg` |
| Proposed customer-facing product name | KALM Move Contrast Flare Set |
| Product type | Two-piece crop top and flare legging set |
| Visible garment construction | Sleeveless V-neck crop top with contrast binding, paired with high-waist flared leggings with contrast crossover waistband detail. |
| Front design | V-neck crop top with white contrast trim at neckline and armholes; leggings have high waist with diagonal/crossover contrast trim at front. |
| Back design | Low scoop or U-back top shape with contrast trim; fitted flare-leg bottom visible from side/back references. |
| Straps, sleeves, waist, leg and closure details | Sleeveless crop top; high-waist leggings; flare leg opening; no visible closure. |
| Supported colours visible in evidence | Gray, Pink, Purple, Green |
| Unknown or ambiguous details | Exact top back depth, whether trim is white on every colour, fabric composition and confirmed size chart. |
| Recommended image folder | `assets/images/products/kalm-move/women/contrast-flare-set/` |
| Proposed SKU root | `KM-W-CONTRAST-FLARE-SET` |

## Product 3: Cross-Waist Piped Legging

| Field | Intake |
|---|---|
| Source filenames | `G:\My Drive\.codex-remote-attachments\019f3c5b-22c3-72f2-8099-c6dc427b2539\ff5371b9-1586-4601-b3d9-e86648dd6e4a\3-Photo-3.jpg`; `4-Photo-4.jpg`; `5-Photo-5.jpg` |
| Proposed customer-facing product name | KALM Move Crossline Legging |
| Product type | Full-length high-waist active legging |
| Visible garment construction | Full-length leggings with cross-over V waistband and contrast piping running along the waist and outer leg line. |
| Front design | High-waist V/cross waistband with contrast trim; vertical contrast piping down the legs. |
| Back design | Not directly shown in uploaded full-size references; variation thumbnails suggest standard fitted legging back. |
| Straps, sleeves, waist, leg and closure details | No straps or sleeves; full-length fitted leg; pull-on waistband; no visible closure. |
| Supported colours visible in evidence | Red, Blue, Black, Pink |
| Unknown or ambiguous details | Back seam shape, exact piping route on rear view, fabric composition and whether the matching top is sold separately. |
| Recommended image folder | `assets/images/products/kalm-move/women/crossline-legging/` |
| Proposed SKU root | `KM-W-CROSSLINE-LEGGING` |

## Product 4: Cropped Wide-Leg Pant

| Field | Intake |
|---|---|
| Source filenames | `G:\My Drive\.codex-remote-attachments\019f3c5b-22c3-72f2-8099-c6dc427b2539\b2ad4d5a-e51f-42ec-816a-86d43bf9968d\1-Photo-1.jpg`; `2-Photo-2.jpg`; `3-Photo-3.jpg`; `4-Photo-4.jpg` |
| Proposed customer-facing product name | KALM Move Drift Crop Wide Pant |
| Product type | Cropped wide-leg active/lifestyle pant |
| Visible garment construction | High-waist pull-on pant with wide cropped leg ending below the knee/mid-calf. |
| Front design | Smooth high waistband, relaxed wide leg, clean front with no visible pockets or contrast trim. |
| Back design | Rear view visible in combined supplier image; same cropped wide-leg silhouette, clean back waistband and full fabric drape. |
| Straps, sleeves, waist, leg and closure details | Pull-on waistband; cropped wide leg; no visible zip, button or drawcord. |
| Supported colours visible in evidence | Cream White, Sunny Orange, Millennial Pink, Wine Red, Black |
| Unknown or ambiguous details | Exact inseam length across sizes, pocket availability, fabric composition and stretch level. |
| Recommended image folder | `assets/images/products/kalm-move/women/drift-crop-wide-pant/` |
| Proposed SKU root | `KM-W-DRIFT-CROP-WIDE-PANT` |

## Implementation Decision

These four products are reference-ready but not storefront-ready yet. Secure API access exists locally, but live generation is currently blocked by the OpenAI API response `billing_hard_limit_reached` for the connected Personal / Default project. Product records must not be added to `products.json` until the generated assets exist, pass QA, and are referenced with complete `image`, `gallery` and `variantImages` data.

Reference contact sheet:

`reports/contact-sheets/reference-intake-four-products.jpg`
