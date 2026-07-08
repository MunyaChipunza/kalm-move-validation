# Inventory Needs Confirmation

The January 2023 KS Active workbook contains inventory-style S/M/L quantities, but the file is historical. It is not enough to publicly claim current stock.

## Confirmation steps

1. Locate all KS Active remaining stock.
2. Count units by product, colour and size.
3. Separate sellable, damaged, missing-tag and sample units.
4. Photograph each confirmed product group.
5. Update `products.json`:
   - Change `stockStatus` from `stock_pending` to `in_stock`.
   - Replace `stockLabel` with a public stock message.
   - Add current verified quantity by variant.
6. Keep any uncounted product in assisted checkout only.

## Current public handling

The storefront does not show "in stock" for KS Active archive products. It uses assisted checkout and availability confirmation so the shop does not oversell.

## Count template

| Product | Colour | S | M | L | Sellable total | Notes |
|---|---:|---:|---:|---:|---:|---|
| Seamless Breathable Leggings | Black |  |  |  |  |  |
| Crisscross Back Sports Bra | Black |  |  |  |  |  |
| High Waist Seamless Shorts | Flamingo |  |  |  |  |  |
