# Test Summary

| Check | Result |
| --- | --- |
| `node --check script.js` | Passed |
| `node tools/validate-catalog.mjs` | Passed: 69 products, 713 variants, 0 warnings, 0 errors |
| `node tools/validate-kalm-outdoor-v2.mjs` | Passed: 9 accessories, 6 bundles, 3 approved anchors, zero live SVG references, paid image usage 0 |
| Git whitespace check | Passed before checkpoint |
| Outdoor desktop route | Passed |
| Outdoor mobile route and anchor navigation | Passed |
| Compatibility filter | Passed: Forge 2 returns its three coming-soon accessories |
| Waitlist error state | Passed with a local failed-request response; stays inline |
| Waitlist success state | Passed with a local 200-response endpoint |
| Waitlist duplicate state | Passed in the same browser session |
| Appliance cross-sell | Passed: Ember detail links its three planned accessories |
| Cart regression | Passed: Ember appliance add/remove works on desktop and mobile; bag reset after test |
| KALM Move regression | Passed: Women edit renders 22 cards, with no missing image alt attributes |
| All-brand navigation | Passed: five brand routes visible, with no missing image alt attributes |
| Browser console errors | 0 |
