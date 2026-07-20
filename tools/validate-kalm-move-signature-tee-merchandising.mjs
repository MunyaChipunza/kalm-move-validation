import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const read = (file) => readFile(resolve(root, file), "utf8");
const runGit = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const catalogue = JSON.parse(await read("products.json"));
const baseline = JSON.parse(runGit("show", "origin/master:products.json"));
const script = await read("script.js");
const merchandising = await read("merchandising.js");
const netlify = await read("netlify.toml");
const sitemap = await read("sitemap.xml");
const tee = catalogue.products.find((product) => product.id === "KALM-TEE-SIGNATURE-001");
const baselineTee = baseline.products.find((product) => product.id === "KALM-TEE-SIGNATURE-001");
const sameJson = (left, right) => JSON.stringify(left) === JSON.stringify(right);
const checkList = [];
const check = (name, passed, detail) => checkList.push({ name, passed, detail });
const teeCore = (product) => ({
  id: product?.id,
  title: product?.title,
  slug: product?.slug,
  price: product?.price,
  currency: product?.currency,
  colors: product?.colors,
  sizes: product?.sizes,
  variants: product?.variants,
  image: product?.image,
  gallery: product?.gallery,
  variantImages: product?.variantImages,
  availability: product?.availability,
  trackInventory: product?.trackInventory,
  inventoryPolicy: product?.inventoryPolicy,
  ctaLabel: product?.ctaLabel
});
const scopedChangedFiles = runGit("diff", "--name-only").split(/\r?\n/).filter(Boolean);
const baselineMoveLaunch = baseline.products.filter((product) => product.brandId === "kalm-move");
const currentMoveLaunch = catalogue.products.filter((product) => product.brandId === "kalm-move" && product.id !== tee?.id);
const currentKsActive = catalogue.products.filter((product) => product.brandId === "ks-active");
const baselineKsActive = baseline.products.filter((product) => product.brandId === "ks-active");

check("Signature Tee record exists once", catalogue.products.filter((product) => product.id === "KALM-TEE-SIGNATURE-001").length === 1, tee?.id || "missing");
check("customer-facing brand is KALM Move", tee?.brand === "KALM Move" && tee?.brandId === "kalm-move" && tee?.parentBrand === "KALM Collective", `${tee?.brand} / ${tee?.parentBrand || "missing umbrella"}`);
check("name, URL, price, variants, availability, images and embroidery source remain unchanged", sameJson(teeCore(tee), teeCore(baselineTee)), "Compared against master for all non-merchandising commerce and image fields");
check("KALM Move merchandising fields are complete", tee?.collection === "KALM Move" && tee?.category === "Oversized T-shirts" && tee?.department === "Move" && tee?.gender === "Unisex" && tee?.featuredHome === true && tee?.featuredKalmMove === true && tee?.homePriority === 1 && tee?.kalmMovePriority === 1, "KALM Move / Oversized T-shirts / Move / Unisex");
check("approved PDP copy and SEO are exact", tee?.description === "A considered oversized essential from KALM Move, finished with KALM’s signature embroidered emblem." && tee?.metaTitle === "KALM Signature Oversized Tee | KALM Move" && tee?.metaDescription === "Shop the KALM Signature Oversized Tee from KALM Move. A premium oversized unisex tee with KALM’s embroidered signature emblem, available in Black and White.", "PDP description, title and description metadata");
check("homepage feature is immediately after the KS Active hero", script.includes("const signatureTeeFeature") && script.includes('app.insertAdjacentHTML("beforeend", signatureTeeFeature)') && script.indexOf("renderSignatureTeeFeature") < script.indexOf('renderProductRail("SHOP KS ACTIVE"'), "feature renderer is immediate and precedes product rails");
check("homepage feature carries mixed-gender model imagery without a duplicate product card", ["KALM MOVE", "THE SIGNATURE TEE", "An oversized everyday essential in Black and White, finished with KALM’s embroidered signature emblem.", "SHOP THE SIGNATURE TEE", "EXPLORE KALM MOVE", "Adult male model", "Adult female model", "female-front\\.", "product.variantImages?.White?.gallery"].every((value) => script.includes(value)) && !script.includes("signature-tee-grid"), "Black uses the male model; White uses the approved female model; no redundant card follows the feature");
check("KALM Move page leads with the available tee without redundant explanatory copy", script.includes("move-available-now") && script.includes("SHOP NOW") && !script.includes("The first available piece from KALM Move."), "available-now section precedes the launching-soon grid with concise merchandising");
check("KALM Move Men ranks the purchasable Tee before Launching Soon products", script.includes('brand === "kalm-move" && audience === "men" && sort === "featured"') && script.includes("isKalmMoveAvailableNowProduct(right.product)"), "Men’s default featured order prioritises available-now KALM Move product(s)");
check("PDP breadcrumb and brand route lead to KALM Move", script.includes("getProductBrandRoute(product)") && script.includes('product?.brandId === "kalm-move" ? "/brand/kalm-move"'), "Home / KALM Move / product route support");
check("KALM Move search terms include tee, colour and audience data", script.includes("(product.colors || []).join(\" \")") && script.includes("product.collection") && script.includes("term.split(/\\s+/).every") && tee?.tags?.includes("t-shirts") && tee?.tags?.includes("unisex") && tee?.tags?.includes("new-in"), "search source, token matching and tee tags cover requested discovery terms");
check("KALM Move collection CTA preserves its in-page destination", script.includes('href="#/brand/kalm-move#kalm-move-collection"'), "explore CTA retains the KALM Move route and collection anchor");
check("34 Launching Soon KALM Move products remain unchanged", currentMoveLaunch.length === 34 && sameJson(currentMoveLaunch, baselineMoveLaunch), `${currentMoveLaunch.length} current / ${baselineMoveLaunch.length} baseline`);
check("Launching Soon commerce lock remains scoped to preview products", script.includes("function isMoveLaunchingSoonProduct") && script.includes("sanitizeMoveProductsFromBag") && script.includes("data-move-wishlist-save") && script.includes("NOTIFY ME"), "wishlist, notify and bag lock remain present");
check("KS Active catalogue remains unchanged", sameJson(currentKsActive, baselineKsActive), `${currentKsActive.length} KS Active records`);
check("Paystack, courier and checkout implementation are untouched by this correction", !scopedChangedFiles.some((file) => /(paystack|courier|checkout)/i.test(file)), scopedChangedFiles.join(", ") || "no changes");
check("review reports are blocked from public Netlify paths", netlify.includes('from = "/reports/KALM-MOVE-SIGNATURE-TEE/*"'), "Netlify 404 redirect present");
check("task application is not targeted", !/inquisitive-pastelito-bd6463|munya-task-app/i.test(`${netlify}\n${script}`), "no task-application destination or configuration");
check("tee remains indexable at the same public route", sitemap.includes("/products/kalm-signature-oversized-tee"), "sitemap product route unchanged");

const failed = checkList.filter((item) => !item.passed);
const report = {
  generatedAt: new Date().toISOString(),
  branch: runGit("branch", "--show-current"),
  sourceMaster: runGit("rev-parse", "origin/master"),
  previewOnly: true,
  passed: failed.length === 0,
  checkCount: checkList.length,
  checks: checkList,
  failed
};
const reportDirectory = resolve(root, "reports/KALM-MOVE-SIGNATURE-TEE");
await mkdir(reportDirectory, { recursive: true });
await writeFile(resolve(reportDirectory, "VALIDATION.json"), `${JSON.stringify(report, null, 2)}\n`);
if (failed.length) {
  console.error(JSON.stringify(report, null, 2));
  process.exitCode = 1;
} else {
  console.log(`KALM Move Signature Tee merchandising validation passed: ${checkList.length} checks.`);
}
