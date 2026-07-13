import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const root = resolve(new URL("..", import.meta.url).pathname.replace(/^\/(.:)/, "$1"));
const catalogPath = resolve(root, "products.json");
const catalog = JSON.parse(readFileSync(catalogPath, "utf8"));

const affectedProductIds = new Set([
  "kalm-move-align-strappy-jumpsuit",
  "kalm-move-ease-flare-set",
  "kalm-move-form-short-set",
  "kalm-move-balance-strappy-set",
  "kalm-move-halter-biker-short-set",
  "kalm-move-core-seamless-tank",
  "kalm-move-align-ruched-short",
  "kalm-move-open-back-short-romper"
]);

function reorderGallery(images, context) {
  const gallery = [...new Set(images || [])];
  const front = gallery.find((image) => /\/front\.(webp|jpg|jpeg|png)$/i.test(image));
  const side = gallery.find((image) => /\/(angle|side|three-quarter)\.(webp|jpg|jpeg|png)$/i.test(image));
  const back = gallery.find((image) => /\/back\.(webp|jpg|jpeg|png)$/i.test(image));

  if (!front || !back) throw new Error(`${context} must contain clean front and back views.`);
  const ordered = [back, side, front].filter(Boolean);
  return [...ordered, ...gallery.filter((image) => !ordered.includes(image))];
}

const changed = [];
for (const product of catalog.products) {
  if (!affectedProductIds.has(product.id)) continue;
  if (product.brandId !== "kalm-move" || product.collection !== "KALM Move Women") {
    throw new Error(`${product.id} is outside the approved women-only scope.`);
  }

  const nextGallery = reorderGallery(product.gallery, `${product.id} default gallery`);
  product.gallery = nextGallery;
  product.image = nextGallery[0];

  for (const colour of product.colors) {
    const variant = product.variantImages?.[colour];
    if (!variant) throw new Error(`${product.id} ${colour} has no variant image mapping.`);
    const nextVariantGallery = reorderGallery(variant.gallery || [variant.hero], `${product.id} ${colour}`);
    variant.gallery = nextVariantGallery;
    variant.hero = nextVariantGallery[0];
  }

  changed.push({ id: product.id, title: product.title, colours: product.colors.length });
}

if (changed.length !== affectedProductIds.size) {
  throw new Error(`Expected ${affectedProductIds.size} affected products, updated ${changed.length}.`);
}

for (const product of catalog.products) {
  if (!affectedProductIds.has(product.id)) continue;
  for (const [colour, variant] of Object.entries(product.variantImages || {})) {
    for (const image of variant.gallery || []) {
      if (!existsSync(resolve(root, image))) throw new Error(`Missing mapped image: ${product.id} ${colour} ${image}`);
    }
  }
}

writeFileSync(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8");
console.log(JSON.stringify({ updated: changed }, null, 2));
