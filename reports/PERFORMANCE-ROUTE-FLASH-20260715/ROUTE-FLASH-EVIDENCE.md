# Release A route-flash preview evidence

Preview: https://6a5769632a0aadbff91f7dd1--kalm-collective-storefront.netlify.app

Verified routes:

- `/brands`
- `/collections/activewear`
- `/collections/wellness`
- `/collections/home`
- `/collections/outdoor`
- `/products/ks-active-racer-knit-bra`
- `/#/checkout`

Result:

- Pre-paint route classifier sets `data-initial-route="non-home"` for non-home direct loads.
- Static homepage hero remains hidden before route render: `heroVisible=false`.
- Neutral route skeleton is visible while product data loads.
- After route render, the requested route heading appears and the static hero/skeleton are removed.
- Checkout hash route renders directly without home hero.

Known measurement note: hidden hero text remains in the DOM before render, but CSS suppresses it before paint and the visible body text starts with the route skeleton. This satisfies the defect requirement: the wrong homepage hero is not painted on non-home routes.
