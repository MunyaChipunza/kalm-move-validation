# Product Image Style Guide

Scope: KALM Move and KS Active product imagery.

## Image Quality Standard

All replacement product imagery must look like premium ecommerce photography:

- realistic garment fit,
- realistic fabric folds, weight and seams,
- realistic lighting and shadows,
- no obvious pasted-on clothing,
- no distorted limbs, hands, faces, torsos or proportions,
- no plastic or overly glossy AI skin,
- no awkward posing,
- no broken anatomy,
- no fake-looking logos,
- no unreadable text on clothing,
- clean studio or light lifestyle backgrounds,
- product remains the visual priority.

## Model Direction

- Use adult models only.
- Use adult female models only for women’s product lines.
- Use adult male models only for men’s product lines unless a product is explicitly unisex or accessory-led.
- Show diverse models across the catalogue, including Black, White, Coloured/mixed-race and Indian/Asian representation where suitable.
- Models should look natural, confident and healthy.
- Do not oversexualise models.
- Do not exaggerate body proportions.
- Do not promote unrealistic body ideals.
- Poses should support shopping decisions: standing front, side/three-quarter, back, movement, and detail/close-up.

## Gallery Standard

Ideal per product colour variant:

1. front full-body shot,
2. side or three-quarter shot,
3. back shot where relevant,
4. movement or lifestyle pose,
5. close-up/detail shot if useful.

Minimum acceptable for the current sprint:

1. front,
2. alternate angle,
3. movement/lifestyle.

## Variant Colour Standard

- A black product must look black.
- A charcoal product must look charcoal.
- A navy product must look navy.
- A stone product must look stone.
- An olive product must look olive.
- A white product must look white.
- Do not relabel one colour image as another colour.
- Do not use a fallback image silently when a colour is sold.
- If an exact colour image is unavailable, mark the data internally as needing source imagery and use the cleanest non-customer-facing fallback only until replaced.

## KALM Move Branding Standard

- Use the plain buffalo mark only when it appears natural and subtle.
- No giant centre-chest logo.
- No “Buffalo-branded” wording.
- Small logo placement only: left chest, sleeve edge, back neck, lower hem, upper thigh, cap front/side, sock cuff, bag corner or bottle side.
- Logos must follow fabric perspective and lighting. If the logo cannot be applied naturally, omit it rather than adding a fake-looking mark.

### Buffalo Mark Placement Rule

- Use only the approved plain buffalo source asset. Do not invent, redraw, regenerate or substitute the buffalo mark.
- Treat the buffalo mark as part of KALM Move product construction on every render unless the supplier design clearly cannot carry it.
- The mark must be subtle, premium and small. It should read like refined activewear branding, not a graphic print.
- No giant centre-chest logo.
- No "Buffalo-branded" wording.
- Preferred placement by product type:
  - women's sets/leggings: upper left hip or upper thigh on front and side/angle views; keep back views clean unless the supplier reference already shows back branding.
  - sports bras, tanks and tees: left chest, lower hem or side seam only if it does not disrupt the supplier strap, neckline or back construction.
  - layers: sleeve edge, back neck, lower hem or small left chest.
  - caps: front or side.
  - socks: cuff.
  - bags: corner, side panel or strap detail.
  - bottles: side or front, small and clean.
- Light garments use a subtle dark mark. Dark garments use a subtle light or tone-on-tone mark.
- If the mark floats off the garment, distorts the fabric, covers a strap detail or looks pasted on, the image fails QA.

## File Structure Standard

Use product-specific folders and colour folders for richer galleries:

```text
assets/images/products/kalm-move/men/motion-hoodie/black/front.webp
assets/images/products/kalm-move/men/motion-hoodie/black/angle.webp
assets/images/products/kalm-move/men/motion-hoodie/black/movement.webp
```

Preferred naming:

- `front.webp`
- `angle.webp`
- `back.webp`
- `movement.webp`
- `detail.webp`

## Product Data Standard

Preferred structure:

```json
{
  "image": "assets/images/products/kalm-move/men/motion-hoodie/black/front.webp",
  "gallery": [
    "assets/images/products/kalm-move/men/motion-hoodie/black/front.webp",
    "assets/images/products/kalm-move/men/motion-hoodie/black/angle.webp",
    "assets/images/products/kalm-move/men/motion-hoodie/black/movement.webp"
  ],
  "variantImages": {
    "Black": {
      "hero": "assets/images/products/kalm-move/men/motion-hoodie/black/front.webp",
      "gallery": [
        "assets/images/products/kalm-move/men/motion-hoodie/black/front.webp",
        "assets/images/products/kalm-move/men/motion-hoodie/black/angle.webp",
        "assets/images/products/kalm-move/men/motion-hoodie/black/movement.webp"
      ]
    }
  }
}
```

The frontend may still accept legacy array-based variant images, but new premium galleries should use the object form with `hero` and `gallery`.

## QA Standard

Before shipping replacement imagery:

- product page loads without broken images,
- selected colour updates hero image,
- selected colour updates gallery thumbnails,
- active thumbnail state follows selected colour,
- bag image matches selected colour,
- checkout/order summary image matches selected colour,
- mobile product page keeps image/title/price/selectors visible early,
- collection grid looks premium and not repetitive,
- no obvious pasted-on garment effect,
- no visible placeholder or “image coming soon” text.

## Rollout Completed After Motion Hoodie Benchmark

Implementation notes for the completed rollout:

- Use the Motion Hoodie data shape for new premium product imagery: `image`, default `gallery`, and object-form `variantImages` with `hero` and `gallery`.
- The current KALM Move and KS Active rollout now uses three gallery files per sold colour variant.
- KS Active colour galleries are derived from colour-specific model-shot sources only, so Black, Wine, Deep Plum, Blue, Purple, Stone and Taupe variants do not borrow mismatched source colours.
- Existing KALM Move men and bottle imagery was expanded into gallery-ready `front`, `angle` and `movement` files without changing product design, logos, copy, checkout, domains or routing.
- The original KALM Move women apparel flatlay/source assets remain usable for variant switching, but still need approved model photography before final production merchandising.
