# KALM Move Image Rebuild Audit

Date: 2026-07-09

Benchmark: KALM Move Motion Hoodie. A benchmark-compliant product has variant-specific folders, at least three images per live colour, correct gallery switching, selected colour image carried into bag, and imagery that does not look like a cheap pasted colour edit.

## Current Women Products

| Product | Current source | Current image issue | Classification | Action |
|---|---|---|---|---|
| Everyday Movement Legging | Generated / flat product-only | Not based on Munya's supplier references; no model-on-body product context | REMOVE | Remove from live women clothing range |
| Medium Support Sports Bra | Generated / flat product-only | Not based on Munya's supplier references | REMOVE | Remove from live women clothing range |
| Modest Performance Tee | Generated / flat product-only | Not based on Munya's supplier references | REMOVE | Remove from live women clothing range |
| Studio Starter Set | Generated / flat product-only | Not based on Munya's supplier references | REMOVE | Remove from live women clothing range |
| Canvas Tote and Cap | Generated accessory pack | Not part of the supplied clothing reference reset | REMOVE | Remove from live women clothing range |
| Everyday Bottle | Generated accessory | Bottle accessory, not clothing; not part of requested women clothing reset | KEEP | Keep as KALM Move women accessory |
| Slim Wellness Bottle | Generated accessory | Bottle accessory, not clothing; not part of requested women clothing reset | KEEP | Keep as KALM Move women accessory |
| Studio Bottle | Generated accessory | Bottle accessory, not clothing; not part of requested women clothing reset | KEEP | Keep as KALM Move women accessory |

## New Women Products To Rebuild From Munya References

| New product direction | Reference files | Classification | Notes |
|---|---|---|---|
| KALM Move Align Halter Legging Set | `IMG-20260709-WA0079` to `WA0081` | REBUILD | V-front halter/tank top with open back and high-waist full-length leggings |
| KALM Move Form Short Set | `IMG-20260709-WA0082` to `WA0085` | REBUILD | Bra and fitted short set |
| KALM Move Pulse Crop Short Set | `IMG-20260709-WA0086` to `WA0088` | REBUILD | High-neck crop and layered short silhouette |
| KALM Move Ease Flare Legging | `IMG-20260709-WA0089` to `WA0091` | REBUILD | Relaxed flare / wide-leg legging |
| KALM Move Balance Strappy Set | `IMG-20260709-WA0092` to `WA0094` | REBUILD | Strappy tank/bra set |
| KALM Move Rise Long Sleeve Set | `IMG-20260709-WA0095` to `WA0098` | REBUILD | Long-sleeve three-piece set |
| KALM Move Core Seamless Tank | `IMG-20260709-WA0103` to `WA0106` | REBUILD | Seamless tank/bodysuit active piece |
| KALM Move Align Ruched Short | `IMG-20260709-WA0107` to `WA0108` | REBUILD | Ruched biker short |
| Lightweight windbreaker / jacket set | `IMG-20260709-WA0099` to `WA0102` | HOLD | Colour and size panel missing from supplied screenshots |

## Current Men Products

| Product | Motion Hoodie benchmark status | Classification | Action |
|---|---|---|---|
| KALM Move Flow Training Short | Structurally compliant but repeated colour-edit look is visible across variants | FIX | Reduce to strongest source-backed live variants and keep three-image galleries |
| KALM Move Sprint Running Short | Structurally compliant but repeated pose/colour-edit look is visible | FIX | Reduce to strongest source-backed live variants and keep three-image galleries |
| KALM Move Core Performance Tee | Structurally compliant; acceptable but still generated catalogue styling | FIX | Keep strongest variants; remove weakest over-edited variants |
| KALM Move Lift Tank | Better than most; model-on-body with clear garment | KEEP | Keep after path verification |
| KALM Move Pace Jogger | Structurally compliant but some variants look like edits | FIX | Keep strongest variants |
| KALM Move Motion Hoodie | Benchmark | KEEP | Keep unchanged |
| KALM Move Base Compression Short | Model-on-body, stronger than weak variants; watch over-polished texture | KEEP | Keep after path verification |
| KALM Move Cap | Cropped model accessory imagery is acceptable | KEEP | Keep after path verification |
| KALM Move Training Sock 3-Pack | Product/accessory imagery is acceptable | KEEP | Keep after path verification |
| KALM Move Utility Gym Bag | Model-on-body but some bag colours look recoloured | FIX | Keep strongest variants |
| KALM Move Protein Shaker Bottle | Lifestyle imagery is acceptable but repeated bottle colours are subtle edits | KEEP | Keep after path verification |

## Rebuild Rule

No old KALM Move women clothing product may remain live after this pass. New women clothing products must be based only on Munya's supplied reference screenshots. If a colour or size is not visible in the supplied reference pack, it must not be added as a live option.

## Post-Rebuild Status

Completed changes in this pass:

- Removed the five old KALM Move women clothing/accessory-set products from `products.json`.
- Added eight new KALM Move women products based on Munya's supplier screenshots only.
- Created supplier-aligned model-on-body product image folders under `assets/images/products/kalm-move/women/`.
- Replaced temporary supplier-crop assets with generated adult ecommerce model images after checking each garment against the Alibaba reference cut, colour and silhouette. Supplier screenshots remain the design source of truth; the customer-facing site does not expose Alibaba UI crops.
- Kept KALM Move women bottles because they are accessories and were not part of the clothing reset.
- Trimmed weaker live men colour variants for Flow Training Short, Sprint Running Short, Core Performance Tee, Pace Jogger and Utility Gym Bag.
- Kept Motion Hoodie unchanged as the benchmark product.

Current live-ready women clothing products:

| Product | Live colours | Sizes | Image structure |
|---|---|---|---|
| KALM Move Align Halter Legging Set | Black, Pink Drink, Grayish Blue, Delicate Red, Date Brown | S, M, L, XL | Generated human ecommerce model `front.webp`, `angle.webp`, `back.webp` per colour; checked against supplier V-front halter and straight-band back reference |
| KALM Move Form Short Set | White | S, M, L, XL | `front.webp`, `angle.webp`, `movement.webp` |
| KALM Move Pulse Crop Short Set | Black | S, M, L, XL | `front.webp`, `angle.webp`, `movement.webp` |
| KALM Move Ease Flare Legging | Gray Blue | XS, S, M, L, XL | `front.webp`, `angle.webp`, `movement.webp` |
| KALM Move Balance Strappy Set | Blossom Pink | One Size, 4, 6, 8, 10 | `front.webp`, `angle.webp`, `movement.webp` |
| KALM Move Rise Long Sleeve Set | Apricot, Rose Red, Green | S, M, L, XL | `front.webp`, `angle.webp`, `movement.webp` per colour |
| KALM Move Core Seamless Tank | Charcoal, Black | XS, S, M, L, XL | `front.webp`, `angle.webp`, `movement.webp` per colour |
| KALM Move Align Ruched Short | Purple, Pink | XS, S, M, L | `front.webp`, `angle.webp`, `movement.webp` per colour |

Known source limitation: the supplied screenshots include additional variation-panel colours that do not have enough clean product evidence for faithful model imagery. Those colours are documented in `KALM_MOVE_SUPPLIER_REFERENCE_NOTES.md` but are not exposed as live colour choices until matching supplier evidence is available.
