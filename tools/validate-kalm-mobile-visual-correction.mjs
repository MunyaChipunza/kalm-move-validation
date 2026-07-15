import { execFileSync } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { resolve } from "node:path";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const read = (file) => readFile(resolve(root, file), "utf8");
const write = (file, value) => writeFile(resolve(root, file), `${JSON.stringify(value, null, 2)}\n`, "utf8");
const [catalogueText, index, script, styles, merchandising] = await Promise.all([
  read("products.json"),
  read("index.html"),
  read("script.js"),
  read("styles.css"),
  read("merchandising.js")
]);
const catalogue = JSON.parse(catalogueText);
const reportRoot = "reports/KALM-MOVE-LAUNCHING-SOON";
const protectedCommit = "53e3dd3bbdd15ebec6ddcf3a0418d8da6ae23c04";
const productCardRenderer = script.slice(script.indexOf("function renderProductCard"), script.indexOf("function renderMoveLaunchingSoonCard"));
const moveCardRenderer = script.slice(script.indexOf("function renderMoveLaunchingSoonCard"), script.indexOf("function renderPrice"));
const mobileRules = styles.slice(styles.indexOf("@media (max-width: 900px)"), styles.indexOf("@media (max-width: 520px)"));
const compactRules = styles.slice(styles.indexOf("@media (max-width: 520px)"));
const narrowRules = styles.slice(styles.indexOf("@media (max-width: 390px)"));
const matchingRules = (source, selector) => [...source.matchAll(new RegExp(`${selector}\\s*\\{([^}]*)\\}`, "g"))].map((match) => match[1]);
const mobileBrandRules = [
  ...matchingRules(mobileRules, "\\.brand(?:\\s+img)?"),
  ...matchingRules(compactRules, "\\.brand(?:\\s+img)?")
];
const mobileHeroCopyRules = matchingRules(mobileRules, "\\.hero-copy");
const primaryNavigation = index.match(/<nav id="site-nav"[\s\S]*?<\/nav>/)?.[0] || "";
const runGit = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8" }).trim();
const protectedReleaseRemainsUnchanged = (() => {
  try {
    execFileSync("git", ["merge-base", "--is-ancestor", protectedCommit, "HEAD"], { cwd: root, stdio: "ignore" });
    execFileSync("git", ["diff", "--quiet", `${protectedCommit}..HEAD`, "--", "products.json"], { cwd: root, stdio: "ignore" });
    return true;
  } catch {
    return false;
  }
})();
const approvedKs = catalogue.products.filter((product) => product.brandId === "ks-active" && product.publicationStatus === "published" && product.visibility === "visible");
const evidence = {
  viewport360: [
    "reports/KALM-MOVE-LAUNCHING-SOON/MOBILE-360-FULL-HEADER-LOCKUP.png",
    "reports/KALM-MOVE-LAUNCHING-SOON/MOBILE-360-KS-ACTIVE-GRID.png",
    "reports/KALM-MOVE-LAUNCHING-SOON/MOBILE-360-KALM-MOVE-CARD.png"
  ],
  viewport412: [
    "reports/KALM-MOVE-LAUNCHING-SOON/MOBILE-412-FULL-HEADER-LOCKUP.png",
    "reports/KALM-MOVE-LAUNCHING-SOON/MOBILE-412-KS-ACTIVE-GRID.png",
    "reports/KALM-MOVE-LAUNCHING-SOON/MOBILE-412-KALM-MOVE-CARD.png"
  ],
  desktop: ["reports/KALM-MOVE-LAUNCHING-SOON/DESKTOP-FULL-HEADER-LOCKUP.png"]
};
const base = {
  generatedAt: new Date().toISOString(),
  branch: runGit("branch", "--show-current"),
  previewOnly: true,
  protectedReleaseCommit: protectedCommit,
  visualEvidence: evidence
};
const reports = {
  "PRODUCT-BADGE-VALIDATION.json": {
    ...base,
    checks: {
      zeroAvailableNowProductCardBadges: !productCardRenderer.includes('"AVAILABLE NOW"'),
      ksActiveCardsDoNotRenderGenericProductBadges: productCardRenderer.includes('product.brandId === "ks-active" ? ""'),
      soldOutCardsRetainExceptionalStatus: productCardRenderer.includes('isUnavailable ? "Sold out"'),
      kalmMoveLaunchingSoonBadgesRemain: moveCardRenderer.includes('launching-soon-badge') && moveCardRenderer.includes("LAUNCHING SOON"),
      productMediaHasNoBadgeSpaceReservation: !styles.includes(".product-media .product-badge")
    }
  },
  "MOBILE-LOGO-VALIDATION.json": {
    ...base,
    checks: {
      desktopUsesCompleteKalmCollectiveLockup: index.includes('src="assets/branding/kalm-collective/kalm-collective-logo.png"'),
      mobileAndTabletUseCompleteKalmCollectiveLockup: !index.includes("kalm-buffalo-mark-cropped.png") && !index.includes("<source media=") && index.includes('src="assets/branding/kalm-collective/kalm-collective-logo.png"'),
      headerLogoUsesContainSafeSizing: styles.includes(".brand img") && styles.includes("height: auto;") && styles.includes("object-fit: contain"),
      headerLogoHasNoScaleOrCropTransform: mobileBrandRules.length > 0 && mobileBrandRules.every((rule) => !rule.includes("transform:")),
      headerLogoContainerDoesNotClip: mobileRules.includes("overflow: visible"),
      fullHeaderLockupHasDedicatedSpace: mobileRules.includes("min-height: 180px") && mobileRules.includes("width: min(180px, 100%)") && narrowRules.includes("width: 180px")
    }
  },
  "MOBILE-HERO-SPACING-VALIDATION.json": {
    ...base,
    checks: {
      staticHeroHasNoDuplicateLogo: !index.includes("hero-brand-logo"),
      renderedHeroHasNoDuplicateLogo: !script.includes("hero-brand-logo"),
      mobileHeroCopyUsesNormalFlowPadding: mobileRules.includes(".hero-copy") && mobileRules.includes("padding: 26px 20px 30px"),
      mobileHeroHasNoNegativeMarginRule: mobileHeroCopyRules.length > 0 && mobileHeroCopyRules.every((rule) => !rule.includes("margin: -")),
      ksActiveHeroRemainsFirst: script.includes('class="hero-shell ks-active-hero"') && script.includes("KS ACTIVE ARCHIVE") && script.includes("THE FINAL COLLECTION"),
      navigationOrderRemainsCorrect: ["/collections/ks-active", "/collections/sale", "/brand/kalm-move"].every((route, index) => primaryNavigation.indexOf(route) >= 0 && (!index || primaryNavigation.indexOf(["/collections/ks-active", "/collections/sale", "/brand/kalm-move"][index - 1]) < primaryNavigation.indexOf(route))),
      fourteenKsProductsRemainPublic: approvedKs.length === 14,
      kalmMoveCommerceLockRemains: script.includes("function renderMoveLaunchingSoonProduct") && script.includes("data-move-wishlist-save"),
      protectedReleaseRemainsUnchanged,
      taskApplicationIsNotTargeted: !/inquisitive-pastelito-bd6463/.test(`${index}\n${script}\n${merchandising}`)
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
console.log(`Mobile visual correction validation passed: ${Object.keys(reports).length} reports.`);
