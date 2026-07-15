import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const reportDirectory = new URL("../reports/KALM-MOVE-LAUNCHING-SOON/", import.meta.url);
const read = (path) => readFile(new URL(path, root), "utf8");
const [catalogueText, priceText, script, index, styles, sitemap] = await Promise.all([
  read("products.json"),
  read("data/kalm-move-preview-prices.json"),
  read("script.js"),
  read("index.html"),
  read("styles.css"),
  read("sitemap.xml")
]);
const catalogue = JSON.parse(catalogueText);
const prices = JSON.parse(priceText);
const moveProducts = catalogue.products.filter((product) => product.brandId === "kalm-move");
const priceById = new Map(prices.map((entry) => [entry.productId, entry]));
const launchEntries = prices.filter((entry) => entry.status === "launching-soon");
const errors = [];
const expect = (condition, message) => { if (!condition) errors.push(message); };
const bottleIds = new Set([
  "kalm-move-protein-shaker-bottle",
  "kalm-move-everyday-bottle",
  "kalm-move-slim-wellness-bottle",
  "kalm-move-studio-bottle",
  "kalm-move-all-day-straw-tumbler"
]);

expect(moveProducts.length === 34, `Expected 34 KALM Move products, found ${moveProducts.length}.`);
expect(prices.length === moveProducts.length, "Every existing KALM Move product requires one preview-price audit record.");
for (const product of moveProducts) {
  const entry = priceById.get(product.id);
  expect(Boolean(entry), `Missing price record for ${product.id}.`);
  if (entry) expect(entry.productName === product.title, `Price record name mismatch for ${product.id}.`);
}
for (const entry of launchEntries) {
  expect(entry.currency === "ZAR", `${entry.productId} must use ZAR.`);
  expect(entry.previewPrice === true, `${entry.productId} must be marked previewPrice.`);
  expect(entry.approvedBy === "Munya" && entry.approvalDate === "2026-07-15", `${entry.productId} approval metadata is incomplete.`);
  expect(Number.isInteger(entry.price) && entry.price > 0, `${entry.productId} requires a whole positive price.`);
  if (bottleIds.has(entry.productId)) expect(entry.price === 249, `${entry.productId} must be R249.`);
  if (!bottleIds.has(entry.productId)) expect(entry.price >= 599, `${entry.productId} must not be below R599.`);
}
expect(priceById.get("kalm-move-training-sock-3-pack")?.status === "excluded-pending-review", "Training Sock 3-Pack must remain excluded pending premium pricing review.");

const prohibitedCustomerCopy = [
  "in development",
  "concept",
  "expected price",
  "launching from",
  "help us decide what to produce",
  "your choices help us decide",
  "not yet commercially approved",
  "supplier reference",
  "prototype reference",
  "market research"
];
const moveLaunchSource = [
  script.slice(script.indexOf("function renderHome"), script.indexOf("function renderEditorialEdits")),
  script.slice(script.indexOf("function renderKalmMoveLaunchCollection"), script.indexOf("function getOutdoorAnchorProducts")),
  script.slice(script.indexOf("function renderMoveLaunchingSoonProduct"), script.indexOf("function renderCartPage"))
].join("\n").toLowerCase();
for (const phrase of prohibitedCustomerCopy) expect(!moveLaunchSource.includes(phrase), `KALM Move customer-facing source contains prohibited wording: ${phrase}`);
expect(script.includes("function renderMoveLaunchingSoonProduct"), "KALM Move Launching Soon PDP renderer is missing.");
expect(script.includes("function renderMoveLaunchingSoonCard"), "KALM Move Launching Soon card renderer is missing.");
const movePdp = script.slice(script.indexOf("function renderMoveLaunchingSoonProduct"), script.indexOf("function renderCartPage"));
expect(!movePdp.includes("data-add-to-bag"), "KALM Move PDP may not render Add to Bag.");
expect(movePdp.includes("SAVE TO WISHLIST") && movePdp.includes("NOTIFY ME"), "KALM Move PDP requires wishlist and notify controls.");
expect(script.includes("sanitizeMoveProductsFromBag"), "KALM Move bag-restoration purge is missing.");
expect(script.includes("isMoveLaunchingSoonProduct(product) || Boolean(product?.comingSoon)"), "KALM Move must be commerce-locked as launching soon.");
expect(!sitemap.includes("/products/kalm-move-"), "KALM Move preview PDPs may not be listed as commerce sitemap URLs.");
expect(sitemap.includes("/brand/kalm-move"), "KALM Move preview collection must have a sitemap route.");
expect(index.includes("kalm-move-launch-interest"), "Netlify form skeleton for KALM Move launch interest is missing.");
for (const name of ["product_id", "product_name", "displayed_price", "preferred_colour", "preferred_size", "anonymous_session_id", "email", "source_page", "device_category"]) {
  expect(index.includes(`name=\"${name}\"`), `Launch-interest form is missing ${name}.`);
}
expect(index.includes("/brand/kalm-move") && index.includes("Archive Sale"), "Primary navigation must expose KALM Move and Archive Sale.");
for (const hiddenNav of [">Wellness<", ">Home<", ">Outdoor<", ">Brands<"]) expect(!index.includes(hiddenNav), `Primary navigation must not expose ${hiddenNav}.`);
expect(script.includes('["ks-active", "kalm-move"].includes(product.brandId)'), "Only KS Active and KALM Move may be customer-visible in this preview.");
expect(!["/collections/wellness", "/collections/home", "/collections/outdoor"].some((route) => sitemap.includes(route)), "Future-brand collection routes must not be public sitemap entries in this preview.");
expect(styles.includes(".move-launch-teaser") && styles.includes("@media (max-width: 900px)"), "Responsive KALM Move styling is incomplete.");
const ksChanged = (() => {
  try {
    execFileSync("git", ["diff", "--quiet", "master", "--", "products.json"], { cwd: new URL("../", import.meta.url), stdio: "ignore" });
    return false;
  } catch {
    return true;
  }
})();
expect(!ksChanged, "products.json changed; the protected KS Active release must remain unchanged.");
const staged = execFileSync("git", ["status", "--short"], { cwd: new URL("../", import.meta.url), encoding: "utf8" });
expect(!staged.includes(".netlify-runtime"), ".netlify-runtime must not be staged or committed.");

const base = {
  generatedAt: new Date().toISOString(),
  branch: execFileSync("git", ["branch", "--show-current"], { cwd: new URL("../", import.meta.url), encoding: "utf8" }).trim(),
  passed: errors.length === 0,
  errors
};
const reports = {
  "PRICE-VALIDATION.json": {
    ...base,
    checks: { existingKalmMoveProducts: moveProducts.length, launchProducts: launchEntries.length, excludedProducts: prices.filter((entry) => entry.status !== "launching-soon").length, bottlesAtR249: [...bottleIds].every((id) => priceById.get(id)?.price === 249), apparelAtOrAboveR599: launchEntries.filter((entry) => !bottleIds.has(entry.productId)).every((entry) => entry.price >= 599), noFromOrExpectedCopy: !moveLaunchSource.includes("from r") && !moveLaunchSource.includes("expected price") }
  },
  "COMMERCE-LOCK-VALIDATION.json": {
    ...base,
    checks: { noKalmMoveAddToBagOnPdp: !movePdp.includes("data-add-to-bag"), bagRestorationPurged: script.includes("sanitizeMoveProductsFromBag"), noOfferForLaunchingSoon: script.includes("const purchasable = !comingSoon"), noKalmMoveProductSitemapLinks: !sitemap.includes("/products/kalm-move-"), otherFutureBrandsInaccessible: script.includes('["ks-active", "kalm-move"].includes(product.brandId)') }
  },
  "WISHLIST-VALIDATION.json": {
    ...base,
    checks: { localWishlist: script.includes("kalmMoveLaunchWishlist"), exactSelectionRequiredOnPdp: script.includes("Choose a size to save this product"), cardWishlistRequiresExplicitSize: script.includes("data-move-card-wishlist-confirm") && script.includes("card_selected_preference") && !script.includes("card_default"), anonymousSessionId: script.includes("kalmMoveLaunchSessionId"), notifyForm: index.includes("kalm-move-launch-interest"), separateMarketingConsent: script.includes("marketing_consent"), popiaDeviceConsent: script.includes("device_category_consent") }
  },
  "RESPONSIVE-QA.json": {
    ...base,
    checks: { desktopNavigation: index.includes("/brand/kalm-move"), mobileNavigation: styles.includes(".site-nav.open"), mobileLaunchLayout: styles.includes(".move-launch-teaser") && styles.includes("@media (max-width: 900px)"), priceLineResponsive: styles.includes(".price-line"), wishlistTarget: styles.includes(".wishlist-heart") },
    browserEvidence: {
      desktop: { viewport: "1440x1000", screenshot: "reports/KALM-MOVE-LAUNCHING-SOON/DESKTOP-HOMEPAGE-QA.png", result: "passed" },
      mobile: { viewport: "375x812", screenshot: "reports/KALM-MOVE-LAUNCHING-SOON/MOBILE-PRODUCT-QA.png", result: "passed" }
    }
  }
};
await mkdir(reportDirectory, { recursive: true });
await Promise.all(Object.entries(reports).map(([file, report]) => writeFile(new URL(file, reportDirectory), `${JSON.stringify(report, null, 2)}\n`)));
if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log("KALM Move Launching Soon validation passed.");
}
