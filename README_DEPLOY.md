# KALM Move Site Deployment

## Purpose

This is the public KALM Move validation site. It is a complete static site with campaign visuals, product-direction visuals, waitlist capture, fake-door checkout intent and Netlify-ready form wiring.

The site must continue to state:

> This is a validation page. Products are not yet available for purchase. No payment is currently being taken. Final product details may change after supplier confirmation and fit testing.

## Files

| File/folder | Purpose |
|---|---|
| `index.html` | Public homepage and validation page |
| `styles.css` | Brand visual system and responsive layout |
| `script.js` | Product card loading, analytics placeholders, fake checkout and form states |
| `products.json` | Product and bundle data with simulation price points |
| `assets/images/` | Campaign, lifestyle and product-direction imagery |
| `branding/` | KALM Move logo assets, favicon, social preview and notes |
| `netlify.toml` | Static publish and cache rules |
| `thanks.html` | Fallback form thank-you page |
| `robots.txt` | Search crawler instruction |
| `site.webmanifest` | Basic install metadata |

## Netlify Deploy

If using the same GitHub + Netlify workflow as `munyachipunza.com`:

1. Create or update a GitHub repository for this `site` folder.
2. Push all files in this folder to the repository root.
3. In Netlify, create or link a site to that repository.
4. Build command: none.
5. Publish directory: `.`.
6. Forms: enabled. Netlify detects `name="kalm-move-waitlist"` because the form is present in `index.html`.
7. After deployment, submit one test waitlist entry and confirm the form appears in Netlify Forms.

## Manual Netlify Drop

1. Open Netlify Drop.
2. Drag the whole `site` folder.
3. Confirm `index.html`, `styles.css`, `script.js`, `products.json`, `assets/` and `branding/` all deploy.
4. Netlify Drop may not preserve form handling in the same way as a linked site. Prefer a GitHub-linked Netlify project for live validation.

## Analytics Placeholders

`script.js` pushes events to both `window.kalmMoveEvents` and `window.dataLayer`.

Events:

- `page_view`
- `product_card_click`
- `size_selection`
- `colour_selection`
- `price_acceptance_click`
- `fake_checkout_click`
- `waitlist_submit`
- `hero_waitlist_click`
- `hero_collection_click`

## Before Public Traffic

- Keep the validation disclaimer visible.
- Do not add payment links.
- Do not claim products are in stock.
- Do not claim visuals show real customers, verified buyers or final production products.
- Confirm the Netlify form submission flow.
- Review POPIA wording if collecting high volume data.
- Replace the embedded PNG buffalo mark with an official vector only if one is later found.
