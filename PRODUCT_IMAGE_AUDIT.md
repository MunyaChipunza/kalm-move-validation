# Product Image Audit

Updated: 2026-07-08

## Current Image Set

| Brand | Product count | Image source |
| --- | ---: | --- |
| KS Active | 6 | Existing KS Active product photography assets. |
| KALM Move | 5 | Generated ecommerce product imagery for the storefront. |
| KALM Outdoor | 5 | Generated ecommerce product imagery for the storefront. |
| KALM Wellness | 5 | Generated ecommerce product imagery for the storefront. |
| KALM Home | 5 | Generated ecommerce product imagery for the storefront. |

## New Generated Assets

- `assets/images/generated/kalm-move/`
- `assets/images/generated/kalm-outdoor/`
- `assets/images/generated/kalm-wellness/`
- `assets/images/generated/kalm-home/`
- `assets/images/generated/brand-tiles/`
- `assets/images/generated/hero/`

## Notes

Path audit result:

- Referenced brand/category/product image paths checked: 77.
- Missing referenced images: 0.

Variant behavior:

- Product cards use the main product image by default.
- Product detail pages use the main product image by default.
- Selecting a colour changes the visible product image when `variantImages` contains that colour.
- If a colour image is missing, the site falls back to the product `image`.
- Bag lines store and show the selected colour image.
- Checkout order summary shows the selected colour, size, quantity and image.

The public site no longer displays product-image setup copy. The internal venture verdict is unchanged: KALM Move is validation-ready, not bank-ready or production-ready.
