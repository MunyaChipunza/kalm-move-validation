# Inventory Rules

Inventory is controlled by product-level availability and optional variant-level availability.

## Product-Level Stock

If all variants are unavailable, the product is treated as sold out. It may remain visible unless `visibility` is set to `hidden`.

If `publicationStatus` is `draft` or `archived`, the product is not public.

If `visibility` is `hidden`, the product is not public.

## Variant-Level Stock

For products with variants:

- unavailable colour and size combinations are disabled
- sold-out colours are disabled
- Add to Bag is blocked for unavailable variants
- the bag keeps the selected colour, size, image and SKU

Unavailable states:

- `out_of_stock`
- `discontinued`
- quantity `0`
- `enabled: false`

Available states:

- `in_stock`
- `low_stock`
- `preorder`

## Manual Stock Limitation

Orders do not automatically decrement inventory yet. Inventory updates remain manual until Zoho Inventory, Zoho Books or another tested commerce stock integration is connected.

Do not claim transactional stock reservation until that workflow exists and is tested.
