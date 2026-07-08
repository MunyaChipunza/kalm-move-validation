# KALM Collective Storefront

Static shop-ready storefront for the KALM ecosystem:

- KS Active: original archive stock section using historical January 2023 workbook data as source reference.
- KALM Move: new activewear line under the KALM buffalo brand family.

The current stack is plain HTML, CSS and JavaScript. Product browsing, filters, product detail views, cart persistence and checkout assistance work without a build step.

## Run locally

```powershell
cd "G:\My Drive\kalm_collective_ks_active_relaunch_pack\kalm_move_validation_sprint_pack\kalm_move_simulation_baseline\site"
python -m http.server 8123
```

Open `http://127.0.0.1:8123/`.

## Deploy

- Build command: none
- Publish directory: `.`
- Netlify forms: enabled for `kalm-collective-order-assistance` and `kalm-collective-contact`

## Outstanding before full go-live

1. Connect the live payment gateway.
2. Configure live shipping/carrier rates.
3. Physically confirm KS Active archive stock before using any public "in stock" claim.

The public site uses assisted checkout wording until payment, shipping and archive stock confirmation are complete.
