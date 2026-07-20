import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";
import vm from "node:vm";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const read = (path) => readFile(resolve(root, path), "utf8");
const write = (path, value) => writeFile(resolve(root, path), `${JSON.stringify(value, null, 2)}\n`, "utf8");
const data = JSON.parse(await read("products.json"));
const index = await read("index.html");
const script = await read("script.js");
const styles = await read("styles.css");
const merchandisingSource = await read("merchandising.js");
const sandbox = { window: {} };
vm.runInNewContext(merchandisingSource, sandbox, { filename: "merchandising.js" });
const merchandising = sandbox.window.KALM_MERCHANDISING;
const reportRoot = "reports/KALM-MOVE-LAUNCHING-SOON";
const protectedCommit = "53e3dd3bbdd15ebec6ddcf3a0418d8da6ae23c04";
const runGit = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const currentBranch = runGit("branch", "--show-current");
const approvedKsProducts = data.products.filter((product) => product.brandId === "ks-active" && (product.publicationStatus || "published") === "published" && (product.visibility || "visible") === "visible");
const resolveEntries = (entries = []) => entries.map((entry) => data.products.find((product) => product.slug === entry.productSlug || product.id === entry.productId)).filter(Boolean);
const collectionProducts = (name) => resolveEntries(merchandising.collections?.[name]);
const collectionIsApprovedKsOnly = (name) => {
  const products = collectionProducts(name);
  return products.length === 14 && products.every((product) => product.brandId === "ks-active") && new Set(products.map((product) => product.id)).size === 14;
};
const primaryNav = index.match(/<nav id="site-nav"[\s\S]*?<\/nav>/)?.[0] || "";
const footerShop = script.match(/footerSection\("Shop", `[\s\S]*?`\)/)?.[0] || "";
const navOrder = ["/collections/ks-active", "/collections/sale", "/brand/kalm-move"];
const inRequiredOrder = (source, values) => values.every((value, index) => source.indexOf(value) >= 0 && (index === 0 || source.indexOf(values[index - 1]) < source.indexOf(value)));
const protectedReleaseIsAncestor = (() => {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", protectedCommit, "HEAD"], { cwd: root, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();
const protectedProductsUnchanged = (() => {
  const baseline = JSON.parse(execFileSync("git", ["show", "origin/master:products.json"], { cwd: root, encoding: "utf8" }));
  const currentKs = data.products.filter((product) => product.brandId === "ks-active");
  const baselineKs = baseline.products.filter((product) => product.brandId === "ks-active");
  return JSON.stringify(currentKs) === JSON.stringify(baselineKs);
})();
const moveProductRenderer = script.slice(script.indexOf("function renderMoveLaunchingSoonProduct"), script.indexOf("function renderMoveNotifyForm"));
const runtimeUnstaged = !runGit("diff", "--cached", "--name-only").split(/\r?\n/).some((path) => path.startsWith(".netlify-runtime/"));
const now = new Date().toISOString();
const base = {
  generatedAt: now,
  branch: currentBranch,
  previewOnly: true,
  protectedReleaseCommit: protectedCommit,
  browserEvidence: {
    desktopHomepage: "reports/KALM-MOVE-LAUNCHING-SOON/COMMERCIAL-HIERARCHY-DESKTOP.png",
    mobileHomepage: "reports/KALM-MOVE-LAUNCHING-SOON/COMMERCIAL-HIERARCHY-MOBILE.png"
  }
};

const reports = {
  "NAVIGATION-VALIDATION.json": {
    ...base,
    checks: {
      desktopPrimaryOrder: inRequiredOrder(primaryNav, navOrder),
      mobileMenuUsesPrimaryNavigation: primaryNav.includes("data-nav"),
      footerShoppingOrder: inRequiredOrder(footerShop, navOrder),
      newInAbsentFromPrimaryNavigation: !primaryNav.includes("/collections/new-in"),
      activewearAbsentFromPrimaryNavigation: !primaryNav.includes("/collections/activewear"),
      futureBrandsAbsentFromPrimaryNavigation: !/(kalm-wellness|kalm-home|kalm-outdoor|\/brands)/.test(primaryNav)
    }
  },
  "KS-ACTIVE-COLLECTION-VALIDATION.json": {
    ...base,
    checks: {
      approvedKsActiveProductCountIsFourteen: approvedKsProducts.length === 14,
      ksActiveCollectionContainsFourteenKsOnly: collectionIsApprovedKsOnly("ks-active"),
      archiveSaleContainsFourteenKsOnly: collectionIsApprovedKsOnly("sale"),
      archiveSaleContainsZeroKalmMove: collectionProducts("sale").every((product) => product.brandId !== "kalm-move"),
      activewearRestrictsToPurchasableKsActive: collectionIsApprovedKsOnly("activewear"),
      newInDoesNotSurfaceFutureProducts: collectionProducts("new-in").every((product) => product.brandId === "ks-active"),
      approvedKsPricesAndQuantitiesUnchanged: protectedProductsUnchanged,
      noPrivateSourceReferenceInPublicRuntime: !/(kuhle|source reference - not for publication|review-only)/i.test(`${script}\n${index}\n${merchandisingSource}`)
    }
  },
  "HOMEPAGE-ORDER-VALIDATION.json": {
    ...base,
    checks: {
      firstHeroIsKsActive: script.includes('class="hero-shell ks-active-hero"') && script.includes("KS ACTIVE ARCHIVE") && script.includes("THE FINAL COLLECTION"),
      primaryHeroCtaTargetsPurchasableKsActive: script.includes('collectionRoute("ks-active")') && script.includes("SHOP KS ACTIVE"),
      firstCommercialGridIsKsActiveOnly: script.indexOf('renderProductRail("SHOP KS ACTIVE"') < script.indexOf('renderProductRail("FINAL PIECES"'),
      secondCommercialGridIsKsActiveOnly: script.includes('renderProductRail("FINAL PIECES", finalPieces, collectionRoute("sale")'),
      kalmMoveAppearsAfterKsActiveSections: script.indexOf("renderTrustStrip()") < script.indexOf("renderMoveLaunchTeaser") && script.indexOf("renderProductRail(\"FINAL PIECES\"") < script.indexOf("renderMoveLaunchTeaser"),
      noKalmMovePrimaryHeroImage: !script.includes('config.campaigns?.homeHero'),
      responsiveKsActiveHeroImage: index.includes("ks-active-panel-seamless-legging/azure-blue/hero-three-quarter.jpg") && styles.includes(".ks-active-hero .hero-media")
    }
  },
  "COMMERCIAL-HIERARCHY-VALIDATION.json": {
    ...base,
    checks: {
      searchSeparatesPurchasableProductsFromMovePreview: script.includes("function renderShopResults") && script.includes("Available products") && script.includes("KALM Move preview"),
      kalmMoveWishlistPreserved: script.includes("kalmMoveLaunchWishlist") && script.includes("card_selected_preference"),
      kalmMoveNotifyPreserved: script.includes("kalm-move-launch-interest") && script.includes("NOTIFY ME"),
      kalmMoveCommerceLockPreserved: moveProductRenderer.includes("data-move-wishlist-save") && !moveProductRenderer.includes("data-add-to-bag"),
      kalmMoveNotInSaleMerchandising: collectionProducts("sale").every((product) => product.brandId !== "kalm-move"),
      protectedReleaseRemainsUnchanged: protectedReleaseIsAncestor && protectedProductsUnchanged,
      netlifyRuntimeNotStaged: runtimeUnstaged,
      taskApplicationNotTargeted: !/inquisitive-pastelito-bd6463/.test(`${script}\n${index}`)
    }
  }
};

await mkdir(resolve(root, reportRoot), { recursive: true });
for (const report of Object.values(reports)) {
  report.errors = Object.entries(report.checks).filter(([, passed]) => !passed).map(([name]) => name);
  report.passed = report.errors.length === 0;
}
for (const [name, report] of Object.entries(reports)) await write(`${reportRoot}/${name}`, report);
if (Object.values(reports).some((report) => !report.passed)) {
  console.error(JSON.stringify(reports, null, 2));
  process.exit(1);
}
console.log(`Commercial hierarchy validation passed: ${Object.keys(reports).length} reports.`);
