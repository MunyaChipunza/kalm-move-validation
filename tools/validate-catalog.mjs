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

if (!Array.isArray(data.products)) fail("products.json must contain a products array.");

for (const product of data.products || []) {
  if (!product.id) fail("Product missing id.");
  if (!product.slug) fail(`${product.id || "Unknown product"} missing slug.`);
  if (ids.has(product.id)) fail(`Duplicate product id: ${product.id}`);
  if (slugs.has(product.slug)) fail(`Duplicate product slug: ${product.slug}`);
  ids.add(product.id);
  slugs.add(product.slug);

  if (typeof product.price !== "number" || product.price < 0) fail(`${product.id} has invalid price.`);
  if (!["draft", "published", "archived"].includes(product.publicationStatus || "published")) fail(`${product.id} has invalid publicationStatus.`);
  if (!["visible", "hidden"].includes(product.visibility || "visible")) fail(`${product.id} has invalid visibility.`);
  if (!["in_stock", "low_stock", "out_of_stock", "preorder", "discontinued"].includes(product.availability || "in_stock")) fail(`${product.id} has invalid availability.`);
  if (!exists(product.image)) fail(`${product.id} hero image does not exist: ${product.image}`);

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
