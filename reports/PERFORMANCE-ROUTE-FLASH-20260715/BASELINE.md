# Baseline

- Repository HEAD: ab57a0f454f45893ab10c81cab11f46a92171e05
- Production deploy before Release A: 6a575ba221154276b10683a1
- Production site: https://kalmcollective.co.za
- Supplied PageSpeed reference: Performance 76, LCP 7.3s, Accessibility 100, Best Practices 100, SEO 100.

Initial code inspection found the static homepage hero in `index.html` inside `#app` for every path. Because route rendering waits for `products.json`, direct non-home loads can paint the wrong homepage hero before JavaScript renders the requested route.
