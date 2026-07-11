# Media Workflow

Product imagery should remain 4:5 portrait, WebP where practical, and suitable for premium ecommerce.

## Product Image Structure

Recommended colour-gallery structure:

```json
{
  "image": "assets/images/products/kalm-move/women/product/black/front.webp",
  "gallery": [
    "assets/images/products/kalm-move/women/product/black/front.webp",
    "assets/images/products/kalm-move/women/product/black/angle.webp",
    "assets/images/products/kalm-move/women/product/black/back.webp"
  ],
  "variantImages": {
    "Black": {
      "hero": "assets/images/products/kalm-move/women/product/black/front.webp",
      "gallery": [
        "assets/images/products/kalm-move/women/product/black/front.webp",
        "assets/images/products/kalm-move/women/product/black/angle.webp",
        "assets/images/products/kalm-move/women/product/black/back.webp"
      ]
    }
  }
}
```

## Ordering

Use this order per colour:

1. front or strongest hero
2. angle
3. back
4. movement or lifestyle
5. detail

## Rejection Rules

Reject images with supplier UI, watermarks, malformed anatomy, duplicated views, wrong colours, missing buffalo mark where required, broken paths or visible compression artefacts.

## Admin Upload Requirements

The intranet media manager must validate file type, MIME type, path, filename, dimensions, file size and image decode before publishing to the storefront repository.
