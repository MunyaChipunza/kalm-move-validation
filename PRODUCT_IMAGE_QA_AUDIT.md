# Product Image QA Audit

Scope: KALM Move and KS Active only.

Audit basis: current `products.json`, local image files, and visual contact sheets generated from live product image paths. This is an asset-quality audit, not a brand, routing, checkout or deployment audit.

## Summary

| Area | Finding | Action |
|---|---|---|
| KALM Move men apparel | Many colour variants are single-angle generated/recoloured images. Several look composited, with repeated model poses and limited natural fabric behaviour. | Regenerate priority products from strongest reference images; do not expand with low-quality recolours. |
| KALM Move Motion Hoodie | Current hoodie images look the least premium: one pose per colour, stiff garment rendering, weak fabric realism and limited model diversity. | Fix first as proof product with three images per colour. |
| KALM Move women apparel | Mostly product-only or simple set images; acceptable as temporary catalogue assets but below premium ecommerce standard. | Needs real/source model imagery before production. |
| KALM Move bottle/accessory products | Colour variants exist and load, but galleries are repetitive and model diversity is narrow. | Keep temporarily; improve after apparel benchmark. |
| KS Active | Best current model imagery, with realistic bodies and studio lighting. Main gap is gallery depth: one model shot per colour and limited angles/detail. | Keep current hero shots; add front/alternate/movement/back/detail galleries when source imagery is available. |
| Broken images | No missing referenced image files found in the scoped product data. | Keep path validation in QA. |

## Product-Level Audit

| Product | Slug | Current image paths | Colour variants | Images per colour | Realism / quality | Gallery coverage | Diversity | Recommended action |
|---|---|---|---|---|---|---|---|---|
| High Waist Seamless Leggings | `ks-high-waist-seamless-leggings` | `assets/images/products/ks-active/model-shoot/ks-high-waist-seamless-leggings/black-01.webp`; `wine-01.webp`; `deep-plum-01.webp`; legacy flat/source images in `assets/images/products/ks-active/` | Black, Wine, Deep Plum | Yes, 1 model shot per colour | Realistic enough to keep; studio lighting and garment fit are acceptable | Not enough: needs alternate angle, back and movement per colour | Female model representation is present but narrow | Keep current hero shots; expand gallery with source/human model images |
| High Stretch Seamless Leggings | `ks-high-stretch-seamless-leggings` | `assets/images/products/ks-active/model-shoot/ks-high-stretch-seamless-leggings/black-01.webp`; `charcoal-01.webp`; legacy flat/source images | Black, Charcoal | Yes, 1 model shot per colour | Keep; realistic fit and proportions | Not enough: one pose per colour | Female model representation is present but narrow | Keep; needs additional source/model angles |
| Open Back Romper | `ks-open-back-romper` | `assets/images/products/ks-active/model-shoot/ks-open-back-romper/black-01.webp`; legacy flat/source images | Black | Yes, 1 model shot | Keep; back angle is useful and realistic | Not enough: needs front and movement | Female model representation is present but narrow | Keep; needs additional source/model angles |
| High Waist Seamless Shorts | `ks-high-waist-seamless-shorts` | `assets/images/products/ks-active/model-shoot/ks-high-waist-seamless-shorts/black-01.webp`; `wine-01.webp`; `deep-plum-01.webp`; legacy flat/source images | Black, Wine, Deep Plum | Yes, 1 model shot per colour | Keep; realistic enough for collection grid | Not enough: needs alternate angle and movement | Female model representation is present but narrow | Keep; needs additional source/model angles |
| Crisscross Back Sports Bra | `ks-crisscross-back-sports-bra` | `assets/images/products/ks-active/model-shoot/ks-crisscross-back-sports-bra/blue-01.webp`; `black-01.webp`; `purple-01.webp`; legacy flat/source images | Blue, Black, Purple | Yes, 1 model shot per colour | Keep; back/strap detail is useful and realistic | Not enough: no front/movement/detail set per colour | Female model representation is present but narrow | Keep; needs additional source/model angles |
| Dual Zip Long-Sleeve Crop | `ks-dual-zip-long-sleeve-crop` | `assets/images/products/ks-active/model-shoot/ks-dual-zip-long-sleeve-crop/black-01.webp`; `stone-01.webp`; `taupe-01.webp`; legacy flat/source images | Black, Stone, Taupe | Yes, 1 model shot per colour | Keep; good current hero quality | Not enough: one pose per colour | Female model representation is present but narrow | Keep; needs additional source/model angles |
| Everyday Movement Legging | `kalm-move-everyday-movement-legging` | `assets/images/products/kalm-move/kalm-move-everyday-movement-legging-main.webp`; `kalm-move-everyday-movement-legging-black.webp` | Black | Yes, product-only/flat | Product-only imagery is clean but not enough for premium apparel | Not enough: no model, movement, side or back | No model representation | Needs human/source model image |
| Medium Support Sports Bra | `kalm-move-medium-support-sports-bra` | `assets/images/products/kalm-move/kalm-move-medium-support-sports-bra-main.webp`; `kalm-move-medium-support-sports-bra-olive.webp` | Olive | Yes, product-only/flat | Product-only imagery is clean but not enough for premium apparel | Not enough: no model, movement, side or back | No model representation | Needs human/source model image |
| Modest Performance Tee | `kalm-move-modest-performance-tee` | `assets/images/products/kalm-move/kalm-move-modest-performance-tee-main.webp`; `kalm-move-modest-performance-tee-oat.webp` | Oat | Yes, product-only/flat | Product-only imagery is clean but not enough for premium apparel | Not enough: no model, movement, side or back | No model representation | Needs human/source model image |
| Studio Starter Set | `kalm-move-studio-starter-set` | `assets/images/products/kalm-move/kalm-move-studio-starter-set-main.webp`; `kalm-move-studio-starter-set-black-olive-oat.webp` | Black / Olive / Oat | Yes, set image | Acceptable as temporary bundle image; not enough for product assessment | Not enough: no model, movement, details | No model representation | Needs source/model images for each included item |
| Canvas Tote and Cap | `kalm-move-canvas-tote-and-cap` | `assets/images/products/kalm-move/kalm-move-canvas-tote-and-cap-main.webp`; `kalm-move-canvas-tote-and-cap-black-natural.webp` | Black / Natural | Yes, product/set image | Keep temporarily | Not enough: no worn/carry scale shot | No model representation | Keep as temporary; needs lifestyle/source image |
| KALM Move Flow Training Short | `kalm-move-flow-training-short` | `assets/images/products/kalm-move/men/flow-training-short/*-hero.webp` | Black, Charcoal, Navy, Olive | Yes, 1 image per colour | Some colours are acceptable at grid size but look generated/composited on detail view | Not enough: one pose, no side/back/movement | One male model pose repeated | Regenerate or needs source human images |
| KALM Move Sprint Running Short | `kalm-move-sprint-running-short` | `assets/images/products/kalm-move/men/sprint-running-short/*-hero.webp` | Black, Navy, Cobalt, Charcoal | Yes, 1 image per colour | Looks more natural than some KALM Move men items, but still narrow and repetitive | Not enough: one pose, no detail/back | One male model pose repeated | Regenerate/add source images |
| KALM Move Core Performance Tee | `kalm-move-core-performance-tee` | `assets/images/products/kalm-move/men/core-performance-tee/*-hero.webp` | Black, White, Charcoal, Navy, Olive | Yes, 1 image per colour | Mixed quality; some recolours feel artificial and poses repeat | Not enough: one pose per colour | Limited male diversity | Regenerate/add source images |
| KALM Move Lift Tank | `kalm-move-lift-tank` | `assets/images/products/kalm-move/men/lift-tank/*-hero.webp` | Black, White, Charcoal, Navy | Yes, 1 image per colour | Stronger body/product fit than hoodie, but still AI-staged and repetitive | Not enough: one pose per colour | One muscular male model repeated | Regenerate/add source images |
| KALM Move Pace Jogger | `kalm-move-pace-jogger` | `assets/images/products/kalm-move/men/pace-jogger/*-hero.webp` | Black, Charcoal, Stone, Navy, Olive | Yes, 1 image per colour | Some shots look plausible; fabric and colour changes still read generated | Not enough: one pose per colour | One male model repeated | Regenerate/add source images |
| KALM Move Motion Hoodie | `kalm-move-motion-hoodie` | `assets/images/products/kalm-move/men/motion-hoodie/{black,charcoal,stone,olive,navy}/{front,angle,movement}.webp` | Black, Charcoal, Stone, Olive, Navy | Yes, 3 images per colour | Replaced after audit with cleaner proof-product imagery; garment now reads more naturally than the previous masked/recoloured set | Minimum acceptable now met: front, angle and movement per colour | Improved across Black, mixed-race/Coloured, White, Indian/South Asian and Black male representation | Keep as proof benchmark; review before expanding to full catalogue |
| KALM Move Base Compression Short | `kalm-move-base-compression-short` | `assets/images/products/kalm-move/men/base-compression-short/*-hero.webp` | Black, Charcoal, Navy | Yes, 1 image per colour | Reasonable at small size, but not enough to trust as premium detail imagery | Not enough: one pose per colour | One male model repeated | Regenerate/add source images |
| KALM Move Cap | `kalm-move-cap` | `assets/images/products/kalm-move/men/move-cap/*-hero.webp` | Black, White, Navy, Olive, Charcoal | Yes, 1 image per colour | Cap imagery is usable but repetitive and cropped tightly | Not enough: one close-up per colour | One model repeated | Keep temporarily; add lifestyle/detail shots |
| KALM Move Training Sock 3-Pack | `kalm-move-training-sock-3-pack` | `assets/images/products/kalm-move/men/training-sock-3-pack/*-hero.webp` | Black Pack, White Pack, Mixed Neutral Pack | Yes, 1 image per colour/pack | Usable as product detail asset; not a model-diversity driver | Not enough: one lower-body/product angle | Partial lower-body only | Keep temporarily; add styled footwear/lifestyle source shots |
| KALM Move Utility Gym Bag | `kalm-move-utility-gym-bag` | `assets/images/products/kalm-move/men/utility-gym-bag/*-hero.webp` | Black, Charcoal, Olive, Navy | Yes, 1 image per colour | Usable at grid size, but repeated pose and bag recolours feel generated | Not enough: one carry pose per colour | One model repeated | Regenerate/add source images |
| KALM Move Protein Shaker Bottle | `kalm-move-protein-shaker-bottle` | `assets/images/products/kalm-move/men/protein-shaker-bottle/*-hero.webp` | Black, Charcoal, Navy, Smoke Grey | Yes, 1 image per colour | Lifestyle context is acceptable but variants are repetitive | Not enough: one pose per colour | One male model repeated | Keep temporarily; add product-only and hand-held detail source images |
| KALM Move Everyday Bottle | `kalm-move-everyday-bottle` | `assets/images/products/kalm-move/women/everyday-bottle/*-hero.webp` | Cream, Blush, Sage, Stone, White | Yes, 1 image per colour | Lifestyle bottle images are acceptable but bottle is small in frame | Not enough: one repeated pose per colour | One female model repeated | Keep temporarily; add product close-up/source images |
| KALM Move Slim Wellness Bottle | `kalm-move-slim-wellness-bottle` | `assets/images/products/kalm-move/women/slim-wellness-bottle/*-hero.webp` | Matte White, Soft Beige, Dusty Pink, Sage Green | Yes, 1 image per colour | Acceptable lifestyle look, but repetitive and bottle detail is weak | Not enough: one repeated pose per colour | One female model repeated | Keep temporarily; add product close-up/source images |
| KALM Move Studio Bottle | `kalm-move-studio-bottle` | `assets/images/products/kalm-move/women/studio-bottle/*-hero.webp` | Stone, Sand, Lavender Grey, Soft Olive | Yes, 1 image per colour | Acceptable lifestyle look, but repetitive and bottle detail is weak | Not enough: one repeated pose per colour | One female model repeated | Keep temporarily; add product close-up/source images |

## Catalogue Diversity Notes

- KS Active currently shows adult female models only, but diversity is limited and most products appear on a narrow range of body types and poses.
- KALM Move men currently includes a few different male appearances across product families, but many products repeat one generated model/pose across colours.
- KALM Move women bottle imagery repeats one female model and pose too often.
- KALM Move women apparel has no model representation in the current assets.

## Immediate Priority

Fix `kalm-move-motion-hoodie` first and use it as the benchmark for:

- three images per colour variant,
- selected colour gallery switching,
- realistic garment fit,
- less repetitive posing,
- at least some model diversity across the product gallery,
- cart/bag using the selected colour image.

## Rollout Completed After Motion Hoodie Benchmark

The Motion Hoodie object-form variant gallery pattern has now been applied across KALM Move and KS Active. Each scoped product has `image`, default `gallery`, and colour-specific `variantImages` using `hero` plus a three-image `gallery` where source imagery exists. Motion Hoodie remains unchanged as the benchmark proof product.

| Product | Variants covered | Image count per variant | Model diversity note | Status |
|---|---|---|---|---|
| High Waist Seamless Leggings | Black, Wine, Deep Plum | Black: 3; Wine: 3; Deep Plum: 3 | Adult female model imagery retained and expanded from colour-specific model sources; catalogue includes Black, White and mixed-race representation. | complete |
| High Stretch Seamless Leggings | Black, Charcoal | Black: 3; Charcoal: 3 | Adult female model imagery retained and expanded from colour-specific model sources; catalogue includes Black, White and mixed-race representation. | complete |
| Open Back Romper | Black | Black: 3 | Adult female model imagery retained and expanded from colour-specific model sources; catalogue includes Black, White and mixed-race representation. | complete |
| High Waist Seamless Shorts | Black, Wine, Deep Plum | Black: 3; Wine: 3; Deep Plum: 3 | Adult female model imagery retained and expanded from colour-specific model sources; catalogue includes Black, White and mixed-race representation. | complete |
| Crisscross Back Sports Bra | Blue, Black, Purple | Blue: 3; Black: 3; Purple: 3 | Adult female model imagery retained and expanded from colour-specific model sources; catalogue includes Black, White and mixed-race representation. | complete |
| Dual Zip Long-Sleeve Crop | Black, Stone, Taupe | Black: 3; Stone: 3; Taupe: 3 | Adult female model imagery retained and expanded from colour-specific model sources; catalogue includes Black, White and mixed-race representation. | complete |
| Everyday Movement Legging | Black | Black: 3 | Product/source imagery expanded into galleries; still needs final source model photography before production merchandising. | complete for variant system; needs final source/model images |
| Medium Support Sports Bra | Olive | Olive: 3 | Product/source imagery expanded into galleries; still needs final source model photography before production merchandising. | complete for variant system; needs final source/model images |
| Modest Performance Tee | Oat | Oat: 3 | Product/source imagery expanded into galleries; still needs final source model photography before production merchandising. | complete for variant system; needs final source/model images |
| Studio Starter Set | Black / Olive / Oat | Black / Olive / Oat: 3 | Product/source imagery expanded into galleries; still needs final source model photography before production merchandising. | complete for variant system; needs final source/model images |
| Canvas Tote and Cap | Black / Natural | Black / Natural: 3 | Product/source imagery expanded into galleries; still needs final source model photography before production merchandising. | complete for variant system; needs final source/model images |
| KALM Move Flow Training Short | Black, Charcoal, Navy, Olive | Black: 3; Charcoal: 3; Navy: 3; Olive: 3 | Adult male ecommerce imagery expanded; catalogue-level men coverage includes Black, White, mixed-race/Coloured and South Asian representation. | complete |
| KALM Move Sprint Running Short | Black, Navy, Cobalt, Charcoal | Black: 3; Navy: 3; Cobalt: 3; Charcoal: 3 | Adult male ecommerce imagery expanded; catalogue-level men coverage includes Black, White, mixed-race/Coloured and South Asian representation. | complete |
| KALM Move Core Performance Tee | Black, White, Charcoal, Navy, Olive | Black: 3; White: 3; Charcoal: 3; Navy: 3; Olive: 3 | Adult male ecommerce imagery expanded; catalogue-level men coverage includes Black, White, mixed-race/Coloured and South Asian representation. | complete |
| KALM Move Lift Tank | Black, White, Charcoal, Navy | Black: 3; White: 3; Charcoal: 3; Navy: 3 | Adult male ecommerce imagery expanded; catalogue-level men coverage includes Black, White, mixed-race/Coloured and South Asian representation. | complete |
| KALM Move Pace Jogger | Black, Charcoal, Stone, Navy, Olive | Black: 3; Charcoal: 3; Stone: 3; Navy: 3; Olive: 3 | Adult male ecommerce imagery expanded; catalogue-level men coverage includes Black, White, mixed-race/Coloured and South Asian representation. | complete |
| KALM Move Motion Hoodie | Black, Charcoal, Stone, Olive, Navy | Black: 3; Charcoal: 3; Stone: 3; Olive: 3; Navy: 3 | Benchmark product retained: adult male models across Black, mixed-race/Coloured, White, Indian/South Asian and Black representation. | complete - benchmark retained |
| KALM Move Base Compression Short | Black, Charcoal, Navy | Black: 3; Charcoal: 3; Navy: 3 | Adult male ecommerce imagery expanded; catalogue-level men coverage includes Black, White, mixed-race/Coloured and South Asian representation. | complete |
| KALM Move Cap | Black, White, Navy, Olive, Charcoal | Black: 3; White: 3; Navy: 3; Olive: 3; Charcoal: 3 | Adult male ecommerce imagery expanded; catalogue-level men coverage includes Black, White, mixed-race/Coloured and South Asian representation. | complete |
| KALM Move Training Sock 3-Pack | Black Pack, White Pack, Mixed Neutral Pack | Black Pack: 3; White Pack: 3; Mixed Neutral Pack: 3 | Adult male ecommerce imagery expanded; catalogue-level men coverage includes Black, White, mixed-race/Coloured and South Asian representation. | complete |
| KALM Move Utility Gym Bag | Black, Charcoal, Olive, Navy | Black: 3; Charcoal: 3; Olive: 3; Navy: 3 | Adult male ecommerce imagery expanded; catalogue-level men coverage includes Black, White, mixed-race/Coloured and South Asian representation. | complete |
| KALM Move Protein Shaker Bottle | Black, Charcoal, Navy, Smoke Grey | Black: 3; Charcoal: 3; Navy: 3; Smoke Grey: 3 | Adult male ecommerce imagery expanded; catalogue-level men coverage includes Black, White, mixed-race/Coloured and South Asian representation. | complete |
| KALM Move Everyday Bottle | Cream, Blush, Sage, Stone, White | Cream: 3; Blush: 3; Sage: 3; Stone: 3; White: 3 | Adult women lifestyle imagery retained and expanded; bottle catalogue includes Black and Asian representation across the range. | complete |
| KALM Move Slim Wellness Bottle | Matte White, Soft Beige, Dusty Pink, Sage Green | Matte White: 3; Soft Beige: 3; Dusty Pink: 3; Sage Green: 3 | Adult women lifestyle imagery retained and expanded; bottle catalogue includes Black and Asian representation across the range. | complete |
| KALM Move Studio Bottle | Stone, Sand, Lavender Grey, Soft Olive | Stone: 3; Sand: 3; Lavender Grey: 3; Soft Olive: 3 | Adult women lifestyle imagery retained and expanded; bottle catalogue includes Black and Asian representation across the range. | complete |

Source-image caveat: the original KALM Move women apparel and canvas set products now participate fully in the variant image system, but their current source assets remain product-only/flatlay. They should be replaced with approved supplier or studio model photography before paid production merchandising.

## KALM Move Reference Reset - 2026-07-09

The original KALM Move women clothing products listed above have now been removed from the live catalogue data:

- Everyday Movement Legging
- Medium Support Sports Bra
- Modest Performance Tee
- Studio Starter Set
- Canvas Tote and Cap

The current KALM Move women clothing range is rebuilt from Munya's supplied supplier screenshots only. The screenshots define the garment cut, colour and silhouette; the customer-facing files are generated adult model-on-body ecommerce images checked against those references, not Alibaba UI crops.

| Product | Live colours | Sizes | Image count per live colour | Source status | QA status |
|---|---|---|---|---|---|
| KALM Move Align Halter Legging Set | Black, Pink Drink, Grayish Blue, Delicate Red, Date Brown | S, M, L, XL | 3 | Generated adult human ecommerce model images per colour, checked against `IMG-20260709-WA0079` to `WA0081` for the V-front halter, straight-band open back and colour range. Model mix includes Black fuller/XL fit, White size-L fit, Coloured/mixed-race medium fit, South Asian/Indian medium fit and Black medium fit. Not Alibaba UI crops. | Complete for first-product diverse human-model reset |
| KALM Move Form Short Set | White | S, M, L, XL | 3 | Generated model-on-body images matched to `IMG-20260709-WA0082` to `WA0084` | Complete for source-backed reset |
| KALM Move Pulse Crop Short Set | Black | S, M, L, XL | 3 | Generated model-on-body images matched to `IMG-20260709-WA0085` to `WA0087` | Complete for source-backed reset |
| KALM Move Ease Flare Set | Sage, Black, Taupe, Espresso, Cream | XS, S, M, L, XL | 3 per live colour | Generated diverse model-on-body images matched to `IMG-20260709-WA0077` to `WA0078`; rejected and regenerated taupe back until the X-back strap construction matched | Complete for second-product diverse human-model reset |
| KALM Move Balance Strappy Set | Blossom Pink | One Size, 4, 6, 8, 10 | 3 | Generated model-on-body images matched to `IMG-20260709-WA0091` to `WA0094` | Complete for source-backed reset |
| KALM Move Rise Long Sleeve Set | Apricot, Rose Red, Green | S, M, L, XL | 3 | Generated model-on-body images matched to `IMG-20260709-WA0095` to `WA0098` | Complete for source-backed reset |
| KALM Move Core Seamless Tank | Charcoal, Black | XS, S, M, L, XL | 3 | Generated model-on-body images matched to `IMG-20260709-WA0103` to `WA0106` | Complete for source-backed reset |
| KALM Move Align Ruched Short | Purple, Pink | XS, S, M, L | 3 | Generated model-on-body images matched to `IMG-20260709-WA0107` to `WA0108` | Complete for source-backed reset |

Men correction status: Motion Hoodie remains the benchmark. Flow Training Short, Sprint Running Short, Core Performance Tee, Pace Jogger and Utility Gym Bag have been trimmed to the strongest live variants to avoid exposing the weakest recoloured catalogue variants. Remaining men products keep the three-image `front`, `angle`, `movement` folder structure and pass path validation.

Known source limitation: the supplier pack shows more colour names in variation panels than it provides enough product evidence for faithful model imagery. Live women colours are limited to colours with usable supplier-backed references; the full visible colour lists are documented in `KALM_MOVE_SUPPLIER_REFERENCE_NOTES.md`.
