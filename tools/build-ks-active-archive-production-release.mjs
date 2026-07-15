import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const rangeRoot = "reports/KS-ACTIVE-ARCHIVE/FINAL-RANGE";
const releaseRoot = "reports/KS-ACTIVE-ARCHIVE/FINAL-PRODUCTION-RELEASE-20260714";
const publicRoot = "assets/images/products/ks-active/archive-approved";
const productCodes = ["P002", "P003", "P010", "P012", "P019", "P020", "P026", "P027", "P028", "P030", "P033", "P035", "P049", "P050"];
const prices = {
  P002: 799, P003: 499, P010: 399, P012: 399, P019: 399, P020: 399, P026: 419,
  P027: 499, P028: 529, P030: 479, P033: 529, P035: 499, P049: 529, P050: 399
};
const productKinds = {
  P002: "Romper", P003: "Leggings", P010: "Sports Bra", P012: "Shorts", P019: "Sports Bra",
  P020: "Sports Bra", P026: "Shorts", P027: "Leggings", P028: "Leggings", P030: "Sports Bra",
  P033: "Leggings", P035: "Leggings", P049: "Leggings", P050: "Sports Bra"
};
const backFirst = new Set(["P002", "P003", "P010", "P012", "P019", "P020", "P027", "P030", "P035", "P050"]);

const readJson = (file) => JSON.parse(fs.readFileSync(path.join(root, file), "utf8"));
const writeJson = (file, value) => {
  const destination = path.join(root, file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};
const writeText = (file, value) => {
  const destination = path.join(root, file);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.writeFileSync(destination, value.endsWith("\n") ? value : `${value}\n`, "utf8");
};
const relative = (file) => path.relative(root, file).replaceAll("\\", "/");
const slugify = (value) => value.toLowerCase().replaceAll("&", "and").replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
const sha256 = (file) => crypto.createHash("sha256").update(fs.readFileSync(file)).digest("hex").toUpperCase();
const copyFile = (source, destination) => {
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  if (fs.existsSync(destination)) {
    if (sha256(source) !== sha256(destination)) throw new Error(`Refusing to overwrite a non-matching public asset: ${relative(destination)}`);
    return;
  }
  fs.copyFileSync(source, destination);
  if (sha256(source) !== sha256(destination)) throw new Error(`Hash mismatch after copying ${relative(source)}`);
};
function imageMeta(file) {
  const buffer = fs.readFileSync(file);
  const ext = path.extname(file).toLowerCase();
  if (ext === ".png" && buffer.subarray(1, 4).toString("ascii") === "PNG") return { format: "PNG", width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  if ([".jpg", ".jpeg"].includes(ext) && buffer[0] === 0xff && buffer[1] === 0xd8) {
    let offset = 2;
    while (offset < buffer.length) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      const marker = buffer[offset + 1];
      const size = buffer.readUInt16BE(offset + 2);
      if ([0xc0, 0xc1, 0xc2, 0xc3, 0xc5, 0xc6, 0xc7, 0xc9, 0xca, 0xcb, 0xcd, 0xce, 0xcf].includes(marker)) {
        return { format: "JPEG", width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      offset += 2 + size;
    }
  }
  throw new Error(`Unable to read image dimensions: ${relative(file)}`);
}
function normaliseSourcePath(sourcePath) {
  const result = path.join(root, sourcePath.replaceAll("/", path.sep));
  if (!fs.existsSync(result)) throw new Error(`Approved generated source is missing: ${sourcePath}`);
  if (!sourcePath.includes("generated") && !sourcePath.includes("archive-range-draft")) throw new Error(`Non-generated source rejected: ${sourcePath}`);
  return result;
}
function viewName(file) {
  const name = path.basename(file).toLowerCase();
  if (name.includes("back")) return "back";
  if (name.includes("side")) return "side";
  if (name.includes("front")) return "front";
  return "hero";
}
function manifestFor(code) {
  const folder = fs.readdirSync(path.join(root, rangeRoot)).find((entry) => entry.startsWith(`${code}-`) && fs.existsSync(path.join(root, rangeRoot, entry, `${code}-REVIEW-MANIFEST.json`)));
  if (!folder) throw new Error(`Missing review manifest for ${code}`);
  return readJson(`${rangeRoot}/${folder}/${code}-REVIEW-MANIFEST.json`);
}
function getStoredApproved(code, productSlug) {
  const file = `${publicRoot}/${productSlug}/APPROVED-PRODUCT.json`;
  const stored = readJson(file);
  const byColour = new Map();
  for (const asset of stored.storedAssets.assets) {
    const source = path.join(root, publicRoot, productSlug, asset.file);
    if (!fs.existsSync(source)) throw new Error(`Stored asset missing: ${relative(source)}`);
    const list = byColour.get(asset.colour) || [];
    list.push({ source, view: asset.view === "hero_three_quarter" ? "hero" : asset.view });
    byColour.set(asset.colour, list);
  }
  return byColour;
}
function orderedGallery(assetMap, code) {
  const hero = assetMap.hero;
  const back = assetMap.back;
  const side = assetMap.side;
  const front = assetMap.front;
  if (![hero, back, side, front].every(Boolean)) throw new Error(`${code} is missing one or more approved gallery views.`);
  return backFirst.has(code) ? [back, side, front, hero] : [hero, side, back, front];
}
function releaseProduct(name, code, slug, variants, colourAssets) {
  const colors = [...new Set(variants.map((variant) => variant.colour))];
  const imageMap = {};
  for (const colour of colors) {
    const images = colourAssets.get(colour);
    if (!images) throw new Error(`${code} has stock for ${colour} but no approved generated imagery.`);
    const map = Object.fromEntries(images.map((asset) => [asset.view, asset.publicPath]));
    const gallery = orderedGallery(map, code);
    imageMap[colour] = { hero: gallery[0], gallery };
  }
  const primaryColour = colors[0];
  const type = productKinds[code];
  const title = name.replace(/^KS Active\s+/i, "");
  const total = variants.reduce((sum, variant) => sum + variant.quantity, 0);
  return {
    id: `ks-active-archive-${code.toLowerCase()}-${slug.replace(/^ks-active-/, "")}`,
    brand: "KS Active",
    brandId: "ks-active",
    collection: "KS Active Archive",
    category: "activewear",
    type,
    audience: "women",
    title,
    slug,
    price: prices[code],
    compareAtPrice: null,
    currency: "ZAR",
    temporaryArchiveLaunchPrice: true,
    priceApprovedBy: "Munya",
    priceApprovalDate: "2026-07-14",
    colors,
    sizes: ["S", "M", "L"],
    stockLabel: "Archive stock confirmed",
    image: imageMap[primaryColour].hero,
    description: `${title}. Archive stock is offered in the confirmed colours and sizes shown.`,
    detailBullets: ["Confirmed Archive stock", "Colour and size availability shown per variant", "Final-sale Archive edit"],
    fitNotes: "Refer to the selected size before purchase.",
    fabric: "Fabric composition is retained with the physical source record.",
    care: "Cold gentle wash, dry in shade, do not bleach.",
    tags: ["ks-active", "archive", "sale", "activewear", slugify(type)],
    badge: "Archive edit",
    ctaLabel: "Add to bag",
    variantImages: imageMap,
    gallery: imageMap[primaryColour].gallery,
    publicationStatus: "published",
    visibility: "visible",
    trackInventory: true,
    inventoryPolicy: "deny",
    lowStockThreshold: 3,
    availability: total > 0 ? "in_stock" : "out_of_stock",
    updatedAt: "2026-07-14T00:00:00.000+02:00",
    updatedBy: "ks-active-archive-production-release",
    skuRoot: `KS-ARCH-${code}`,
    ownershipAuthority: "Munya explicit commercial instruction",
    launchDecision: "Include",
    variants: variants.map((variant) => ({ ...variant, availability: variant.quantity > 0 ? (variant.quantity <= 3 ? "low_stock" : "in_stock") : "out_of_stock", enabled: variant.quantity > 0 }))
  };
}
function main() {
  const catalogue = readJson("products.json");
  // Rebuild idempotently from the original non-Archive catalogue records. A
  // prior local run may have written release products; those are reconstructed
  // below from the immutable physical inventory source rather than retained.
  catalogue.products = catalogue.products.filter((product) => !product.id.startsWith("ks-active-archive-"));
  const productMap = readJson(`${rangeRoot}/PRODUCT-NAME-MAP.json`);
  const staged = readJson(`${rangeRoot}/ZOHO-STAGED-PAYLOAD.json`);
  const audit = readJson(`${rangeRoot}/FINAL-RANGE-REVIEW.json`);
  const names = new Map(productMap.map((item) => [item.productCode, item]));
  const variants = staged.records.filter((item) => productCodes.includes(item.productCode)).map((item) => ({ productCode: item.productCode, sku: item.sku, colour: item.colour, size: item.size, quantity: item.quantity }));
  const grouped = new Map(productCodes.map((code) => [code, variants.filter((item) => item.productCode === code)]));
  if (variants.length !== 104 || variants.reduce((sum, item) => sum + item.quantity, 0) !== 111) throw new Error("Physical inventory source does not match the approved 104-SKU / 111-unit release total.");
  if (new Set(variants.map((item) => item.sku)).size !== variants.length) throw new Error("Duplicate Archive SKU in staged physical inventory.");

  const productRows = [];
  const publicAssets = [];
  for (const code of productCodes) {
    const info = names.get(code);
    if (!info) throw new Error(`Product naming record missing for ${code}`);
    const slug = `ks-active-${slugify(info.name.replace(/^KS Active\s+/i, ""))}`;
    const destinationBase = path.join(root, publicRoot, slug);
    const colourAssets = new Map();
    if (["P049", "P050"].includes(code)) {
      const stored = getStoredApproved(code, `${code.toLowerCase()}-${slugify(info.name.replace(/^KS Active\s+/i, ""))}`);
      for (const [colour, assets] of stored.entries()) {
        const copied = assets.map((asset) => {
          const destination = asset.source;
          const publicPath = relative(destination);
          const meta = imageMeta(destination);
          publicAssets.push({ productCode: code, colour, view: asset.view, path: publicPath, sha256: sha256(destination), ...meta });
          return { ...asset, publicPath };
        });
        colourAssets.set(colour, copied);
      }
    } else {
      const manifest = manifestFor(code);
      for (const colourRecord of manifest.colours) {
        const copied = colourRecord.views.map((view) => {
          const source = normaliseSourcePath(view.path);
          const destination = path.join(destinationBase, slugify(colourRecord.colour), path.basename(source));
          copyFile(source, destination);
          const publicPath = relative(destination);
          const meta = imageMeta(destination);
          publicAssets.push({ productCode: code, colour: colourRecord.colour, view: viewName(source), path: publicPath, sha256: sha256(destination), ...meta });
          return { source, view: viewName(source), publicPath };
        });
        colourAssets.set(colourRecord.colour, copied);
      }
    }
    const productVariants = grouped.get(code).map(({ productCode: _productCode, ...variant }) => variant);
    productRows.push(releaseProduct(info.name, code, slug, productVariants, colourAssets));
  }

  const legacyProducts = catalogue.products.filter((product) => product.brandId === "ks-active");
  const removalManifest = legacyProducts.map((product) => ({
    oldProductId: product.id,
    oldName: product.title,
    oldSlug: product.slug,
    oldPublicRoute: `/products/${product.slug}`,
    removalReason: "Superseded by the physically confirmed fourteen-product KS Active Archive release.",
    replacementProduct: null,
    internalEvidenceLocation: "Git history and pre-release catalogue state",
    rollbackReference: "rollback/kalm-before-ks-active-archive-20260714"
  }));
  for (const product of legacyProducts) {
    product.publicationStatus = "archived";
    product.visibility = "hidden";
    product.availability = "discontinued";
    product.trackInventory = false;
    product.inventoryPolicy = "deny";
    product.legacyRetirement = { reason: "Superseded by the physically confirmed fourteen-product KS Active Archive release.", archivedAt: "2026-07-14", rollbackReference: "rollback/kalm-before-ks-active-archive-20260714" };
  }
  catalogue.products.push(...productRows);
  fs.writeFileSync(path.join(root, "products.json"), `${JSON.stringify(catalogue, null, 2)}\n`, "utf8");

  const expectedBySku = new Map(variants.map((variant) => [variant.sku, variant]));
  const finalSkus = productRows.flatMap((product) => product.variants.map((variant) => ({ productCode: product.skuRoot.replace("KS-ARCH-", ""), productName: `KS Active ${product.title}`, productSlug: product.slug, price: product.price, currency: "ZAR", ownershipAuthority: product.ownershipAuthority, launchDecision: product.launchDecision, launchQuantity: variant.quantity, ...variant })));
  if (finalSkus.length !== expectedBySku.size) throw new Error("Storefront SKU count does not match the physical inventory manifest.");
  for (const sku of finalSkus) {
    const expected = expectedBySku.get(sku.sku);
    if (!expected || expected.quantity !== sku.quantity || expected.colour !== sku.colour || expected.size !== sku.size) throw new Error(`Storefront SKU mapping differs from physical inventory: ${sku.sku}`);
  }
  const totals = { products: productRows.length, stockedColours: productRows.reduce((sum, product) => sum + product.colors.length, 0), purchasableVariants: finalSkus.length, zeroStockVariants: 0, physicalLaunchQuantity: finalSkus.reduce((sum, item) => sum + item.quantity, 0), approvedGeneratedPublicAssets: publicAssets.length };
  const productManifest = productRows.map((product) => ({ productCode: product.skuRoot.replace("KS-ARCH-", ""), productId: product.id, name: `KS Active ${product.title}`, slug: product.slug, price: product.price, currency: product.currency, temporaryArchiveLaunchPrice: true, priceApprovedBy: "Munya", priceApprovalDate: "2026-07-14", colours: product.colors, imagePaths: product.variantImages, launchQuantity: product.variants.reduce((sum, variant) => sum + variant.quantity, 0), visualRangeApprovalRecorded: true, visualApprovalBy: "Munya", visualApprovalDate: "2026-07-14" }));
  const priceManifest = productRows.map((product) => ({ productCode: product.skuRoot.replace("KS-ARCH-", ""), productName: `KS Active ${product.title}`, price: product.price, currency: "ZAR", temporaryArchiveLaunchPrice: true, priceApprovedBy: "Munya", priceApprovalDate: "2026-07-14" }));
  const inventoryManifest = { schemaVersion: 1, authority: "Final reconciled physical-stock manifest plus Munya manual P049/P050 inventory", ownershipAuthority: "Munya explicit commercial instruction", launchDecision: "Include", totals, variants: finalSkus };
  writeJson(`${releaseRoot}/FINAL-PRODUCT-MANIFEST.json`, { schemaVersion: 1, visualRangeApprovalRecorded: true, visualApprovalBy: "Munya", visualApprovalDate: "2026-07-14", products: productManifest, totals });
  writeJson(`${releaseRoot}/FINAL-SKU-MANIFEST.json`, { schemaVersion: 1, variants: finalSkus, totals });
  writeJson(`${releaseRoot}/FINAL-PRICE-MANIFEST.json`, { schemaVersion: 1, temporaryArchiveLaunchPrice: true, priceApprovedBy: "Munya", priceApprovalDate: "2026-07-14", prices: priceManifest });
  writeJson(`${releaseRoot}/FINAL-INVENTORY-MANIFEST.json`, inventoryManifest);
  writeJson(`${releaseRoot}/FINAL-ASSET-MANIFEST.json`, { schemaVersion: 1, approvedGeneratedPublicAssets: publicAssets, privateAndReviewOnlyPathsForbidden: true });
  writeJson(`${releaseRoot}/LEGACY-KS-ACTIVE-PUBLIC-REMOVAL-MANIFEST.json`, { schemaVersion: 1, removedLegacyProducts: removalManifest });

  const authorisedPayload = finalSkus.map((sku) => ({ ...sku, archiveCategory: "KS Active Archive", storefrontRoute: `/products/${sku.productSlug}`, stockStatus: sku.quantity > 0 ? "in_stock" : "out_of_stock", launchStatus: "Include", operation: "CREATE_OR_UPDATE_AFTER_AUTHENTICATED_SESSION_AVAILABLE" }));
  writeJson(`${releaseRoot}/ZOHO-BEFORE-SYNC.json`, { status: "blocked", reason: "Authenticated browser session bridge is unavailable in this Codex environment; no Zoho export was read or changed.", records: [] });
  writeJson(`${releaseRoot}/ZOHO-AFTER-SYNC.json`, { status: "not_performed", reason: "No Zoho write is permitted until authenticated session access is restored.", records: [] });
  writeJson(`${releaseRoot}/ZOHO-RECONCILIATION.json`, { passed: false, status: "blocked", requiredPayload: authorisedPayload, reason: "Zoho has not been read or written in this session." });
  writeJson(`${releaseRoot}/INTRANET-BEFORE-SYNC.json`, { status: "blocked", reason: "Authenticated browser session bridge is unavailable in this Codex environment; no intranet export was read or changed.", records: [] });
  writeJson(`${releaseRoot}/INTRANET-AFTER-SYNC.json`, { status: "not_performed", reason: "No intranet write is permitted until authenticated session access is restored.", records: [] });
  writeJson(`${releaseRoot}/INTRANET-RECONCILIATION.json`, { passed: false, status: "blocked", requiredPayload: authorisedPayload, reason: "The intranet has not been read or written in this session." });
  writeJson(`${releaseRoot}/THREE-SYSTEM-RECONCILIATION.json`, { passed: false, status: "blocked_pending_authenticated_system_access", variants: finalSkus.map((sku) => ({ sku: sku.sku, expectedQuantity: sku.quantity, storefrontQuantity: sku.quantity, zohoQuantity: null, intranetQuantity: null, expectedPrice: sku.price, storefrontPrice: sku.price, zohoPrice: null, intranetPrice: null, pass: false, exceptionReason: "Zoho and intranet values are unread because authenticated system access is unavailable." })) });
  writeJson(`${rangeRoot}/ZOHO-STAGED-PAYLOAD.json`, { stagedOnly: true, writeAuthorised: true, releaseAuthorisation: "Munya explicit commercial instruction, 2026-07-14", records: authorisedPayload });
  writeJson(`${rangeRoot}/INTRANET-STAGED-PAYLOAD.json`, { stagedOnly: true, writeAuthorised: true, releaseAuthorisation: "Munya explicit commercial instruction, 2026-07-14", records: authorisedPayload });
  writeJson(`${rangeRoot}/PROGRESS.json`, { stage: "validation", currentProduct: "KS Active Archive final production reconciliation", completedProducts: 14, totalEligibleProducts: 14, completedColours: 56, totalEligibleColours: 56, approvedImageCount: 224, rejectedImageCount: 1, lastCompletedProduct: "P026 - KS Active High-Waist Seamless Short", lastCommit: "40465af717856739558144738dd36c094efe8496", lastUpdated: new Date().toISOString(), blocker: "Zoho and KALM intranet cannot be audited or updated because the authenticated browser-session bridge fails before session access (Cannot redefine property: process). GitHub fetch cannot reach github.com:443 through the local proxy, and Netlify CLI cannot open its configuration temporary file (EPERM).", nextAction: "Restore authenticated Zoho and intranet browser access and GitHub/Netlify connectivity, run live reconciliation, then push and deploy only after every release gate passes." });
  writeText(`${releaseRoot}/PRODUCTION-DEPLOY.md`, "# Production deployment\n\nNot performed. The local storefront catalogue and release evidence are prepared, but production is blocked until Zoho and KALM intranet reconciliation can be completed through authenticated access.\n");
  writeText(`${releaseRoot}/LIVE-PRODUCTION-VERIFICATION.md`, "# Live production verification\n\nNot performed. No production deployment has been made from this release workspace.\n");
  writeText(`${releaseRoot}/NCC-UPDATE-STATUS.md`, "# NCC update status\n\nNo local NCC or `soul.md` source is present in this release workspace. No NCC entry was fabricated; this must be updated in the authoritative NCC system once it is accessible.\n");
  writeText(`${releaseRoot}/RELEASE-NOTES.md`, `# KS Active Archive release preparation\n\n- Visual approval recorded: Munya, 2026-07-14.\n- Public catalogue prepared: ${totals.products} Archive products, ${totals.stockedColours} stocked colours, ${totals.purchasableVariants} physical SKUs, ${totals.physicalLaunchQuantity} units.\n- Legacy KS Active catalogue records are archived and hidden in the local release catalogue.\n- Only approved generated image copies under \`${publicRoot}/\` are referenced by the new public products.\n- Release remains blocked until actual Zoho and intranet reconciliation is possible.\n`);
  console.log(JSON.stringify({ status: "prepared", totals, legacyArchived: removalManifest.length, publicAssetCopies: publicAssets.length, reviewSummary: audit.summary }, null, 2));
}

main();
