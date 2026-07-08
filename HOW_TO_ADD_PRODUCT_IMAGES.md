# How To Add Product Images

Product images live in brand folders under:

```text
assets/images/products/
assets/images/products/ks-active/
assets/images/products/kalm-move/
assets/images/products/kalm-home/
assets/images/products/kalm-wellness/
assets/images/products/kalm-outdoor/
```

Use `.webp` where possible. Keep product photos portrait shaped, ideally `4:5` ratio, around `1200 x 1500px` or larger before compression.

## Naming

Use lowercase words separated by hyphens:

```text
assets/images/products/kalm-home/ceramic-vase-main.webp
assets/images/products/kalm-home/ceramic-vase-black.webp
assets/images/products/kalm-home/ceramic-vase-white.webp
```

## Link A Main Product Image

Open `products.json`, find the product, and set `image`:

```json
"image": "assets/images/products/kalm-home/ceramic-vase-main.webp"
```

## Link A Colour Variant Image

Add or update `variantImages` for each colour:

```json
"variantImages": {
  "Black": "assets/images/products/kalm-home/ceramic-vase-black.webp",
  "White": "assets/images/products/kalm-home/ceramic-vase-white.webp"
}
```

When a customer selects a colour, the product image changes to that colour image. If no colour image exists, the site uses the main product image.

## Add Gallery Images

Add a `gallery` list to the same product:

```json
"gallery": [
  "assets/images/products/kalm-home/ceramic-vase-main.webp",
  "assets/images/products/kalm-home/ceramic-vase-black.webp",
  "assets/images/products/kalm-home/ceramic-vase-detail.webp"
]
```

Gallery images appear as thumbnails on the product detail page.

## Add Images For A New Product

1. Put the image files into the correct brand folder.
2. Add the new product to `products.json`.
3. Set `image` to the main product image.
4. Add `gallery` with the main image and any detail images.
5. Add `variantImages` for each colour.
6. Add `brand`, `brandId`, `category`, `colors`, `sizes`, `price`, `description`, `detailBullets`, `fitNotes`, `fabric`, `care`, `tags` and `ctaLabel`.
7. Make sure every image path exactly matches the file name.

Example:

Product: KALM Home Ceramic Vase  
Colour: Black  
Image file:

```text
assets/images/products/kalm-home/ceramic-vase-black.webp
```

Then update `products.json`:

```json
"variantImages": {
  "Black": "assets/images/products/kalm-home/ceramic-vase-black.webp"
}
```

## Test Before Deploying

1. Open the local site.
2. Go to the product card and product detail page.
3. Select each colour.
4. Confirm the image changes where a variant image exists.
5. Add the product to the bag.
6. Confirm the bag shows the selected colour, size and image.
7. Check the browser console or page for broken image icons.

## Confirm After Live Deployment

1. Deploy the storefront.
2. Open `https://kalmcollective.co.za/#/shop`.
3. Open the product detail page.
4. Select each colour and size.
5. Add the item to the bag.
6. Confirm the bag and checkout summary show the selected image, colour, size and price.
7. If an image is broken, check the exact file name and path in `products.json`.

## Avoid Broken Images

- Keep paths relative, starting with `assets/images/products/...`.
- Match spelling, hyphens and file extensions exactly.
- Do not use spaces in file names.
- Do not delete an image file while it is still referenced in `products.json`.
- After adding images, run the image audit or click through the product manually before deploying.
