# Catalogue Schema

The public storefront reads `products.json`. Existing product fields remain supported. New commerce-admin fields are additive and backward-compatible.

## Product Fields

Required commerce fields:

```json
{
  "publicationStatus": "published",
  "visibility": "visible",
  "trackInventory": true,
  "inventoryPolicy": "deny",
  "lowStockThreshold": 3,
  "availability": "in_stock",
  "updatedAt": "ISO_DATE",
  "updatedBy": "AUTHENTICATED_USER"
}
```

Allowed `publicationStatus` values:

- `draft`
- `published`
- `archived`

Allowed `visibility` values:

- `visible`
- `hidden`

Allowed `availability` values:

- `in_stock`
- `low_stock`
- `out_of_stock`
- `preorder`
- `discontinued`

Draft, archived and hidden products must not render in public listings or product pages.

## Variant Fields

Each product can define colour and size stock:

```json
{
  "sku": "KM-RANGE-ITEM-BLACK-S",
  "colour": "Black",
  "size": "S",
  "quantity": null,
  "availability": "in_stock",
  "enabled": true
}
```

`quantity: null` means stock count is not yet tracked, but explicit availability still controls ordering.

## Validation

Run:

```powershell
node tools/validate-catalog.mjs
```

The validator checks product IDs, slugs, SKUs, prices, image paths, gallery paths and inventory states.
