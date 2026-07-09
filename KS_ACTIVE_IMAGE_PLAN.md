# KS Active Image Plan

## Source Of Truth

Product data source: `products.json`

Current product image folder: `assets/images/products/ks-active/`

New model-shot folder: `assets/images/products/ks-active/model-shoot/`

Image standard for this pass: one polished ecommerce model hero per existing colour variant, with original reference images retained in product galleries behind the new model shots. The generated images must preserve the current garment type, silhouette, strap/sleeve treatment, waist height, leg length and listed colours.

## Product Audit

| Product name | Product type | Existing reference image(s) | Colour variants | Fit / product cues | Image status | New model images required |
|---|---|---|---|---|---|---|
| High Waist Seamless Leggings | Leggings | `assets/images/products/ks-active/ks-high-waist-seamless-leggings-main.webp`; `...-black.webp`; `...-wine.webp`; `...-deep-plum.webp` | Black; Wine; Deep Plum | Sculpting seamless legging, high-rise waistband, clean studio-to-street finish, full length | Existing model references are cropped and repetitive; upgrade required | Black hero, Wine hero, Deep Plum hero |
| High Stretch Seamless Leggings | Leggings | `assets/images/products/ks-active/ks-high-stretch-seamless-leggings-main.webp`; `...-black.webp`; `...-charcoal.webp` | Black; Charcoal | Flexible everyday legging, smooth waistband, minimal seam lines, full length | Existing references are model-based but colour/detail clarity is limited; upgrade required | Black hero, Charcoal hero |
| Open Back Romper | Romper / one-piece | `assets/images/products/ks-active/ks-open-back-romper-main.webp`; `...-black.webp` | Black | Streamlined one-piece, sculpted open back, crisscross straps, short length | Existing back-view reference is useful but limited; upgrade required | Black hero |
| High Waist Seamless Shorts | Shorts | `assets/images/products/ks-active/ks-high-waist-seamless-shorts-main.webp`; `...-black.webp`; `...-wine.webp`; `...-deep-plum.webp` | Black; Wine; Deep Plum | Breathable high-waist shorts, seamless finish, short length | Existing references are cropped and repetitive; upgrade required | Black hero, Wine hero, Deep Plum hero |
| Crisscross Back Sports Bra | Sports bra | `assets/images/products/ks-active/ks-crisscross-back-sports-bra-main.webp`; `...-blue.webp`; `...-black.webp`; `...-purple.webp` | Blue; Black; Purple | Medium support sports bra, clean front, crisscross back straps, wide lower band | Existing references show back detail but colours are inconsistent; upgrade required | Blue hero, Black hero, Purple hero |
| Dual Zip Long-Sleeve Crop | Long-sleeve crop top | `assets/images/products/ks-active/ks-dual-zip-long-sleeve-crop-main.webp`; `...-black.webp`; `...-stone.webp`; `...-taupe.webp` | Black; Stone; Taupe | Fitted long-sleeve cropped layer, zip styling, studio warmup layer | Existing references repeat one black crop image; upgrade required | Black hero, Stone hero, Taupe hero |

## Diversity Plan

The first-pass model set should show a visible mix across the catalogue: Black women, White women, Coloured / mixed-race women and Indian / Asian women. Poses should be natural and confident, with athletic but realistic proportions, clean styling and no over-sexualised framing.

## Implementation Plan

1. Generate one model hero per current colour variant.
2. Save web-friendly `.webp` files under `assets/images/products/ks-active/model-shoot/[product-slug]/[colour-slug]-01.webp`.
3. Update each KS Active product in `products.json`:
   - `image` points to the strongest new model hero.
   - `variantImages` maps each listed colour to its new model hero.
   - `gallery` starts with the new model heroes and keeps the existing reference images after them.
4. Validate:
   - KS Active collection cards show model photos.
   - Product detail pages show model photos.
   - Colour selectors switch to the matching model image.
   - Bag and checkout carry the selected colour/size and variant image.
   - No broken images.

## Final Image Coverage

| Product | Variant | New model image |
|---|---|---|
| High Waist Seamless Leggings | Black | `assets/images/products/ks-active/model-shoot/ks-high-waist-seamless-leggings/black-01.webp` |
| High Waist Seamless Leggings | Wine | `assets/images/products/ks-active/model-shoot/ks-high-waist-seamless-leggings/wine-01.webp` |
| High Waist Seamless Leggings | Deep Plum | `assets/images/products/ks-active/model-shoot/ks-high-waist-seamless-leggings/deep-plum-01.webp` |
| High Stretch Seamless Leggings | Black | `assets/images/products/ks-active/model-shoot/ks-high-stretch-seamless-leggings/black-01.webp` |
| High Stretch Seamless Leggings | Charcoal | `assets/images/products/ks-active/model-shoot/ks-high-stretch-seamless-leggings/charcoal-01.webp` |
| Open Back Romper | Black | `assets/images/products/ks-active/model-shoot/ks-open-back-romper/black-01.webp` |
| High Waist Seamless Shorts | Black | `assets/images/products/ks-active/model-shoot/ks-high-waist-seamless-shorts/black-01.webp` |
| High Waist Seamless Shorts | Wine | `assets/images/products/ks-active/model-shoot/ks-high-waist-seamless-shorts/wine-01.webp` |
| High Waist Seamless Shorts | Deep Plum | `assets/images/products/ks-active/model-shoot/ks-high-waist-seamless-shorts/deep-plum-01.webp` |
| Crisscross Back Sports Bra | Blue | `assets/images/products/ks-active/model-shoot/ks-crisscross-back-sports-bra/blue-01.webp` |
| Crisscross Back Sports Bra | Black | `assets/images/products/ks-active/model-shoot/ks-crisscross-back-sports-bra/black-01.webp` |
| Crisscross Back Sports Bra | Purple | `assets/images/products/ks-active/model-shoot/ks-crisscross-back-sports-bra/purple-01.webp` |
| Dual Zip Long-Sleeve Crop | Black | `assets/images/products/ks-active/model-shoot/ks-dual-zip-long-sleeve-crop/black-01.webp` |
| Dual Zip Long-Sleeve Crop | Stone | `assets/images/products/ks-active/model-shoot/ks-dual-zip-long-sleeve-crop/stone-01.webp` |
| Dual Zip Long-Sleeve Crop | Taupe | `assets/images/products/ks-active/model-shoot/ks-dual-zip-long-sleeve-crop/taupe-01.webp` |

Status: generated, compressed to `.webp`, and wired into `products.json` as the active `image` and `variantImages` source for each KS Active product. Existing reference files remain in galleries after the new model images.
