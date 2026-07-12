# KALM Move Bottles Stage 2 — Production release record

Production is live for the approved KALM Move bottle-only scope.

| Product | Approved colours | Audience placement | Commercial state |
| --- | --- | --- | --- |
| Everyday Bottle | Black, Cream, Lilac, Sky Blue | Men and Women | R279, purchasable |
| Slim Wellness Bottle | Matte White, Stone, Soft Pink, Sage | Women | R299, purchasable |
| Studio Bottle | Black, Stone, Lilac, Sky Blue | Women | R329, purchasable |
| Protein Shaker Bottle | Black, Charcoal, Navy, Smoke Grey | Men and Women | R249, purchasable |
| All-Day Straw Tumbler | Black, Cream, Lilac, Sky Blue | Men and Women | Coming soon, non-purchasable; supplier/sample lock pending |

- Previous master: `699c571f9a5462688a935482ec88f2af38f7e2d2`
- Integration branch: `codex/kalm-move-bottles-stage2-20260712`
- Stage 1 review commit: `7dcab8867be78ff133e1debf5518736120ca6472`
- Implementation commit: `92b3216d2feba18e282b289db95c56509f9d0140`
- Production master/deployed release: `cde8186d1490a42e86fcc9759111f4a0318b6332`
- Draft: [`6a53ccb972c185e4420af41d`](https://6a53ccb972c185e4420af41d--kalm-collective-storefront.netlify.app)
- Production: [`6a53ce7fb63d08e5a8f70e8a`](https://kalmcollective.co.za)
- Rollback tag: `checkpoint/pre-kalm-bottles-stage2-20260712` -> `699c571f9a5462688a935482ec88f2af38f7e2d2`

Sixty approved Stage 1 JPEG assets were copied to fresh `assets/images/products/kalm-move/bottles-v2/` paths with matching SHA-256 hashes. The detailed hash manifest, validator results and desktop/mobile screenshots are in [the full Stage 2 evidence pack](KALM-MOVE-BOTTLES-STAGE2-20260712/KALM-MOVE-BOTTLES-STAGE2-20260712.md).

Production verification passed: the authorised site is current, `products.json` exposes all five products, the versioned Lilac bottle asset returns HTTP 200, and the All-Day record is `comingSoon: true` with no price. No non-bottle KALM Move, Outdoor, Home, Wellness, navigation, or Munya task-application scope was changed. Future Hydration navigation remains a separate task.
