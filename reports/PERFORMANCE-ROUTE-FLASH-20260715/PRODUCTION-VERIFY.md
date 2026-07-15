# Release A production verification

Production deploy: `6a576aae2a0aadc5951f7dcf`
Production URL: https://kalmcollective.co.za
Immutable URL: https://6a576aae2a0aadc5951f7dcf--kalm-collective-storefront.netlify.app
Master release SHA before evidence update: `8a838abe2b07af9fe0395409286cb479c72743ad`

## Production Lighthouse mobile

- Performance: 96
- LCP: 1.8s
- CLS: 0
- TBT: 103ms
- Speed Index: 4.52s
- FCP: 1.08s
- Transferred bytes: 247,078
- Request count: 10
- Accessibility: 100
- Best Practices: 100
- SEO: 100

## Route-flash verification

Routes checked:

- `/brands`
- `/collections/activewear`
- `/collections/wellness`
- `/collections/home`
- `/collections/outdoor`
- `/products/ks-active-racer-knit-bra`
- `/#/checkout`

Result: pass.

For non-home direct loads, `data-initial-route="non-home"`, homepage hero visibility was false before render, route skeleton was visible while data loaded, and the final requested route rendered without the homepage hero.

## Commerce regression

- KS Active visible Archive products: 14
- Hidden legacy KS Active products: 6
- KS Active SKUs: 104
- KS Active physical units: 111
- Missing KS Active images: 0
- Private source paths remain blocked by Netlify rules.
- Munya task app checked separately and remains separate.
