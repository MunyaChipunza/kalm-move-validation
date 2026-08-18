# KALM Phase 1 Inventory Rules

The reconciled KS Active Archive inventory manifest is the Phase 1 quantity authority. The current launch scope contains 14 approved products, 56 stocked colours, 104 physical SKUs and 111 physical units.

## Server-side source of truth

The commerce database is seeded from the final reconciled manifest and records available, reserved and sold quantities per SKU. Browser `products.json` quantity is informative only; the payment initiation function reconstructs the payable cart from the server-controlled Phase 1 SKU map.

## Lifecycle

1. A valid owner-test or public checkout reserves available stock atomically.
2. A verified PayFast ITN moves a reservation to sold exactly once.
3. A failed, cancelled or expired unpaid payment releases the reservation.
4. A return restores stock only after operations marks the received item restockable and records the actual refund reference.

Non-Phase-1 products, including KALM Move launch previews, cannot be added to a payable order even if a browser, local storage or request payload is altered.

## Reconciliation

Run `npm run commerce:reconcile` from the canonical storefront root. The report identifies missing, duplicate, invalid, mismatched or unsupported public SKU mappings before release. Do not change stock from historic Shopify quantities, OneDayOnly quantities or imagery.
