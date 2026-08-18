# KALM Collective Storefront

Static ecommerce storefront for `kalmcollective.co.za`.

## Current Storefront

- Parent brand: KALM Collective.
- Brand family: KS Active, KALM Move, KALM Outdoor, KALM Wellness and KALM Home.
- Catalog: product data lives in `products.json`.
- Checkout: PayFast-only protected payment initiation, a standard delivery address and server-side confirmation before an order is fulfilled.
- Public metadata: canonical and Open Graph URLs point to `https://kalmcollective.co.za/`.

## Stack

Plain HTML, CSS and JavaScript. There is no build step.

```powershell
cd "G:\My Drive\kalm_collective_ks_active_relaunch_pack\kalm_move_validation_sprint_pack\kalm_move_simulation_baseline\site"
python -m http.server 8123
```

## Verification

- `node --check script.js`
- JSON parse and product count check
- Local browser pass through home, shop, brands, product detail, bag and checkout

## Verdict

The internal venture verdict is unchanged: KALM Move is validation-ready, not bank-ready or production-ready. The public storefront is now presented as KALM Collective retail experience; payment gateway credentials remain an external setup task.
