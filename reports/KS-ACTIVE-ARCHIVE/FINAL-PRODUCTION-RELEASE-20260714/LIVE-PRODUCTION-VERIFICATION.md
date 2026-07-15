# Live production verification

Verified at: 2026-07-15T10:19:16.139861+00:00

## Storefront

- `https://kalmcollective.co.za` loads.
- KS Active public catalogue contains exactly 14 visible Archive products.
- Six legacy KS Active products are hidden/archived and not listed in sitemap.
- All 14 Archive product routes returned HTTP 200/application content.
- `products.json` reports 104 KS Archive SKUs and 111 physical units.
- Approved temporary prices match the release manifest.
- No KS Active price mismatches were found.
- No private source evidence routes are public.
- Review-only routes and report paths return 404.
- Kuhle source photographs, likeness, and private filenames are not exposed in public catalogue paths.

## Cart and checkout

- Added `Racer Knit Bra` / `Dark Green` / `S` to the live cart.
- Bag count increased to 3 in the active browser session.
- Cart line item showed `Racer Knit Bra`, `Colour: Dark Green / Size: S`, `R399`.
- Checkout page loaded at `https://kalmcollective.co.za/#/checkout`.
- Checkout order summary included the same KS Active line item and price.
- No order was submitted.

## Zoho

- Authenticated read access verified in Zoho Inventory organization `930770020` / `KALM Collective`.
- Zoho item list shows KS Archive SKUs with stock-on-hand values.
- Zoho reconciliation reports 104 physical SKUs and 111 units.

## KALM intranet

- Authenticated read access verified at `https://intranet.kalmcollective.co.za/commerce`.
- Intranet reads `https://kalmcollective.co.za/products.json`.
- `/api/commerce/products` returns the deployed KS Active Archive products.
- KS Active Archive reconciliation passes for the release scope.
- The intranet site-wide Validate control still reports unrelated non-KS errors for existing KALM Outdoor hidden coming-soon placeholders and KALM Move All-Day Straw Tumbler coming-soon availability.

## Separation

- Munya task application `https://inquisitive-pastelito-bd6463.netlify.app` was checked separately and did not contain the KS Active Archive release content.
