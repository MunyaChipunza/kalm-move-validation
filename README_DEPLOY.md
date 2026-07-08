# KALM Collective Deploy Notes

## Netlify

- Build command: none
- Publish directory: `.`
- Forms: enabled
- Repository: `MunyaChipunza/kalm-move-validation`

## Required files

| Path | Purpose |
|---|---|
| `index.html` | Storefront shell and static Netlify form detection |
| `styles.css` | Responsive retail design system |
| `script.js` | Routing, filters, product detail views, cart and forms |
| `products.json` | Structured product catalog |
| `assets/images/` | Campaign, category and product imagery |
| `branding/` | KALM, KALM Move and KS Active brand assets |
| `netlify.toml` | Static publish and cache headers |
| `thanks.html` | Form confirmation page |

## Smoke test after deploy

1. Open the live site.
2. Open Shop and use brand, type, size, colour, price and search filters.
3. Open KS Active and KALM Move brand pages.
4. Open at least one product detail page.
5. Add an item to cart with size and colour.
6. Change cart quantity and remove an item.
7. Submit one Netlify form test from checkout assistance or contact.
8. Check mobile layout.

## Analytics placeholders

`script.js` pushes events to `window.kalmStoreEvents` and `window.dataLayer`:

- `page_view`
- `product_filter_change`
- `product_filters_clear`
- `add_to_cart`
- `cart_open`
- `cart_quantity_change`
- `cart_remove`
- `form_submit`
