import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const cataloguePath = path.join(root, "products.json");
const data = JSON.parse(fs.readFileSync(cataloguePath, "utf8"));
const errors = [];
const warnings = [];

function fail(message) {
  errors.push(message);
}

function warn(message) {
  warnings.push(message);
}

function exists(relativePath) {
  return Boolean(relativePath) && fs.existsSync(path.join(root, relativePath.replace(/^\/+/, "")));
}

function imageList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.filter(Boolean);
  if (typeof value === "object") {
    return [value.hero, ...(Array.isArray(value.gallery) ? value.gallery : [])].filter(Boolean);
  }
  return [value].filter(Boolean);
}

const ids = new Set();
const slugs = new Set();
const skus = new Set();
const comingSoonProducts = [];

if (!Array.isArray(data.products)) fail("products.json must contain a products array.");

for (const product of data.products || []) {
  if (!product.id) fail("Product missing id.");
  if (!product.slug) fail(`${product.id || "Unknown product"} missing slug.`);
  if (ids.has(product.id)) fail(`Duplicate product id: ${product.id}`);
  if (slugs.has(product.slug)) fail(`Duplicate product slug: ${product.slug}`);
  ids.add(product.id);
  slugs.add(product.slug);

  const comingSoon = Boolean(product.comingSoon) || product.availability === "coming_soon";
  if (comingSoon ? product.price !== null && product.price !== undefined : (typeof product.price !== "number" || product.price < 0)) {
    fail(`${product.id} has invalid price.`);
  }
  if (!["draft", "published", "archived"].includes(product.publicationStatus || "published")) fail(`${product.id} has invalid publicationStatus.`);
  if (!["visible", "hidden"].includes(product.visibility || "visible")) fail(`${product.id} has invalid visibility.`);
  if (!["in_stock", "low_stock", "out_of_stock", "preorder", "discontinued", "coming_soon"].includes(product.availability || "in_stock")) fail(`${product.id} has invalid availability.`);
  if (comingSoon) {
    comingSoonProducts.push(product);
    if (product.availability !== "coming_soon") fail(`${product.id} must use coming_soon availability.`);
    const hasConceptImages = Boolean(product.image) || imageList(product.gallery).length > 0;
    if (Object.keys(product.variantImages || {}).length || (product.variants || []).length) fail(`${product.id} coming-soon record must not include variants.`);
    if (hasConceptImages && !product.conceptImageDisclosure) fail(`${product.id} concept imagery requires a disclosure.`);
    if (product.brandId === "kalm-outdoor" && !hasConceptImages) fail(`${product.id} Outdoor coming-soon record must include its approved concept gallery.`);
    if (product.photographyStatus !== "Photography in production") fail(`${product.id} must state Photography in production.`);
    if (!Array.isArray(product.compatibleAppliances) || !product.compatibleAppliances.length) fail(`${product.id} missing compatible appliance mapping.`);
  } else if (!exists(product.image)) {
    fail(`${product.id} hero image does not exist: ${product.image}`);
  }

  const gallery = imageList(product.gallery);
  const gallerySet = new Set();
  for (const image of gallery) {
    if (gallerySet.has(image)) warn(`${product.id} has duplicate gallery image: ${image}`);
    gallerySet.add(image);
    if (!exists(image)) fail(`${product.id} gallery image does not exist: ${image}`);
  }

  for (const [colour, variantImages] of Object.entries(product.variantImages || {})) {
    const images = imageList(variantImages);
    if (!images.length) fail(`${product.id} colour ${colour} has empty variantImages.`);
    for (const image of images) {
      if (!exists(image)) fail(`${product.id} colour ${colour} image does not exist: ${image}`);
    }
  }

  for (const variant of product.variants || []) {
    if (!variant.sku) fail(`${product.id} variant missing sku.`);
    if (skus.has(variant.sku)) fail(`Duplicate variant sku: ${variant.sku}`);
    skus.add(variant.sku);
    if (!variant.colour) fail(`${product.id} variant ${variant.sku} missing colour.`);
    if (!variant.size) fail(`${product.id} variant ${variant.sku} missing size.`);
    if (!["in_stock", "low_stock", "out_of_stock", "preorder", "discontinued"].includes(variant.availability || "in_stock")) fail(`${product.id} variant ${variant.sku} has invalid availability.`);
    if (variant.quantity !== null && variant.quantity !== undefined && (!Number.isFinite(variant.quantity) || variant.quantity < 0)) {
      fail(`${product.id} variant ${variant.sku} has invalid quantity.`);
    }
  }
}

for (const product of comingSoonProducts) {
  for (const applianceId of product.compatibleAppliances) {
    if (!ids.has(applianceId)) fail(`${product.id} references missing compatible appliance ${applianceId}.`);
  }
}

if (data.outdoorBundles !== undefined) {
  if (!Array.isArray(data.outdoorBundles)) fail("outdoorBundles must be an array.");
  const expectedBundleNames = new Set(["Ember Essential", "Pizza Night", "Ridge Precision", "Ridge Host", "Forge Essential", "Forge Burger"]);
  const bundleIds = new Set();
  for (const bundle of data.outdoorBundles || []) {
    if (!bundle.id || bundleIds.has(bundle.id)) fail(`Invalid or duplicate outdoor bundle id: ${bundle.id || "unknown"}.`);
    bundleIds.add(bundle.id);
    if (!expectedBundleNames.has(bundle.title)) fail(`Unexpected outdoor bundle title: ${bundle.title}.`);
    if (bundle.status !== "coming_soon") fail(`${bundle.id} must be coming soon.`);
    if ("price" in bundle || "stock" in bundle || "availability" in bundle) fail(`${bundle.id} must not state price, stock, or availability.`);
    if (!ids.has(bundle.compatibleAppliance)) fail(`${bundle.id} references missing compatible appliance.`);
    for (const accessoryId of bundle.accessoryIds || []) {
      if (!comingSoonProducts.some((product) => product.id === accessoryId)) fail(`${bundle.id} references a non-coming-soon accessory: ${accessoryId}.`);
    }
  }
  if ((data.outdoorBundles || []).length !== expectedBundleNames.size) fail("Expected six Outdoor coming-soon bundle roadmaps.");
}

const summary = {
  products: data.products?.length || 0,
  variants: (data.products || []).reduce((sum, product) => sum + (product.variants?.length || 0), 0),
  warnings: warnings.length,
  errors: errors.length
};

if (warnings.length) console.warn(warnings.join("\n"));
if (errors.length) {
  console.error(JSON.stringify(summary, null, 2));
  console.error(errors.join("\n"));
  process.exit(1);
}

console.log(JSON.stringify(summary, null, 2));
