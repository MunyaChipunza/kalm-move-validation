# Storefront UX Rules

The storefront should remain premium, mobile-first and simple to shop.

## KALM Move Navigation

KALM Move separates:

- Women
- Men

Use shareable URLs such as:

- `#/shop?brand=kalm-move&audience=women`
- `#/shop?brand=kalm-move&audience=men`

Only show category chips when matching products exist.

## Product Listing

Product cards prioritise:

1. image
2. brand
3. product name
4. price
5. colour information
6. availability

Permanent colour and size dropdowns do not belong on every mobile product card.

## Product Detail Gallery

Mobile product pages use a swipeable 4:5 gallery with pagination and thumbnails. Colour changes must replace the full gallery and reset to image one.

## Inventory UX

Sold-out products can remain visible, but Add to Bag must be disabled. Sold-out variants must not be orderable.

## Deployment Safety

Deploy only to `kalm-collective-storefront`, site ID `06334c13-7d82-45f1-b983-4a7295de88d8`.
