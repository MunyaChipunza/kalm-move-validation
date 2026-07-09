# Product Navigation Fix Report

## Cause

The storefront is a hash-routed single-page app. Product-card clicks were rendering the product route while the browser could still preserve the previous scroll position, and the product detail layout stacked a tall gallery before the purchase panel on mobile. The result was that product pages technically opened, but mobile customers could land with the useful product detail content pushed below the first viewport.

## Files Changed

- `script.js`
- `styles.css`
- `products.json`
- `assets/images/products/kalm-move/men/**`
- `assets/images/products/kalm-move/women/**`

## How Scroll Restoration Works Now

- `history.scrollRestoration` is set to `manual` during app startup.
- The current hash route stores its scroll position before each route render.
- Product detail routes always force `window.scrollTo(0, 0)` after render, including two `requestAnimationFrame` passes so mobile browsers cannot restore the old grid scroll after layout.
- Non-product routes restore their saved scroll position, so the Back button returns sensibly to the previous product grid position.
- Product detail mobile layout now keeps the main image, title, price, colour selector and size selector inside the first viewport.

## Variant Image Behaviour

- `variantImages` now supports arrays per colour.
- Product galleries include all variant-specific images.
- Selecting a colour updates the main image and active gallery thumbnail.
- Add-to-bag stores the selected variant image on the bag item.
- Bag and checkout render the stored selected variant image, colour and size.

## Pages Tested

Route-click QA passed on mobile `390x844` and desktop `1440x1100` for:

| Entry route | Product clicked | Result |
|---|---|---|
| `#/` | KALM Move Flow Training Short | Pass |
| `#/shop` | KALM Move Core Performance Tee | Pass |
| `#/brand/kalm-move` | KALM Move Sprint Running Short | Pass |
| `#/shop?brand=kalm-move&audience=men` | KALM Move Motion Hoodie | Pass |
| `#/shop?brand=kalm-move&audience=women` | KALM Move Everyday Bottle | Pass |
| `#/brand/ks-active` | High Waist Seamless Leggings | Pass |
| `#/brand/kalm-wellness` | Matte Steel Water Bottle | Pass |
| `#/brand/kalm-outdoor` | Ember 16 Gas Pizza Oven | Pass |
| `#/brand/kalm-home` | White Cotton Bedding Set | Pass |

## QA Summary

- Product-card click navigation: 18/18 passed.
- Variant, bag and checkout checks: 24/24 passed.
- Broken image checks: 0 broken image groups.
- Console/page errors during QA: 0.
- Before screenshot: not captured in this pass; issue was reproduced through measured mobile layout state before the fix.
- After screenshots saved outside the repo:
  - `C:\Users\Dell\.codex\qa\kalm-product-detail-top-mobile.png`
  - `C:\Users\Dell\.codex\qa\kalm-flow-navy-variant-mobile.png`
  - `C:\Users\Dell\.codex\qa\kalm-flow-navy-bag-mobile.png`
  - `C:\Users\Dell\.codex\qa\kalm-flow-navy-checkout-summary-mobile.png`
  - `C:\Users\Dell\.codex\qa\kalm-shop-men-desktop.png`
