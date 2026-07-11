# KALM Move Women Gallery QA

Date: 2026-07-11

This report checks KALM Move women products for colour-level galleries and missing image paths after the storefront display-list normalization used by `script.js`. It verifies wiring, not subjective visual quality.

| Product | Colours checked | Minimum display images per colour | Missing paths | Status |
|---|---:|---:|---|---|
| KALM Move Align Halter Legging Set | 5 | 3 | None | basic gallery |
| KALM Move Ease Flare Set | 5 | 3 | None | basic gallery |
| KALM Move Form Short Set | 10 | 3 | None | basic gallery |
| KALM Move Pulse Crop Short Set | 1 | 3 | None | basic gallery |
| KALM Move Wide-Leg Yoga Pant | 12 | 3 | None | basic gallery |
| KALM Move Balance X-Back Legging Set | 10 | 3 | None | basic gallery |
| KALM Move Halter Biker Short Set | 7 | 3 | None | basic gallery |
| KALM Move Rise Zip Jacket Set | 11 | 3 | None | basic gallery |
| KALM Move Lightweight Windbreaker Set | 1 | 3 | None | basic gallery |
| KALM Move Cropped Zip Yoga Jacket | 1 | 3 | None | basic gallery |
| KALM Move Core Short Unitard | 10 | 3 | None | basic gallery |
| KALM Move Align Ruched Short | 8 | 3 | None | basic gallery |
| KALM Move Loose Split Running Short | 3 | 3 | None | basic gallery |
| KALM Move Split Running Skort | 3 | 3 | None | basic gallery |
| KALM Move Open Back Short Romper | 6 | 3 | None | basic gallery |
| KALM Move Pocket Racerback Crop Bra | 2 | 1 | None | basic gallery |
| KALM Move Contrast Flare Set | 4 | 1 | None | basic gallery |
| KALM Move Crossline Legging | 4 | 1 | None | basic gallery |
| KALM Move Drift Crop Wide Pant | 5 | 1 | None | basic gallery |
| KALM Move Everyday Bottle | 5 | 3 | None | basic gallery |
| KALM Move Slim Wellness Bottle | 4 | 1 | None | basic gallery |
| KALM Move Studio Bottle | 4 | 1 | None | basic gallery |

## Summary

- KALM Move women products checked: 22
- Products with missing image paths: 0
- Products with at least one display image for every colour: 22
- Products with four or more display images for every colour: 0

## Notes

- The storefront normalizes hero/gallery inputs before rendering, so repeated hero paths inside a variant object do not create duplicate visible slides.
- Products marked `basic gallery` are wired correctly but still need a future premium imagery pass if every colour must have front, angle, back and movement views.
