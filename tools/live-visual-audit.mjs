import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const BASE_URL = process.env.AUDIT_BASE_URL || 'https://kalmcollective.co.za';
const OUTPUT_DIR = process.env.AUDIT_OUTPUT_DIR || 'audit-output';
const RUN_ID = new Date().toISOString().replace(/[:.]/g, '-');
const BATCH_INDEX = Math.max(0, Number(process.env.AUDIT_BATCH_INDEX || 0));
const BATCH_COUNT = Math.max(1, Number(process.env.AUDIT_BATCH_COUNT || 1));

const viewports = [
  { name: 'mobile', width: 390, height: 844 },
  { name: 'desktop', width: 1440, height: 1000 }
];

function safeName(value) {
  return value
    .replace(/^https?:\/\//, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 150) || 'home';
}

function addRoute(map, label, route) {
  const url = route.startsWith('http') ? route : `${BASE_URL}${route}`;
  if (!map.has(url)) map.set(url, { label, url });
}

async function getCatalogue() {
  const response = await fetch(`${BASE_URL}/products.json?audit=${Date.now()}`, {
    headers: { 'cache-control': 'no-cache' }
  });
  if (!response.ok) throw new Error(`products.json returned ${response.status}`);
  return response.json();
}

async function buildRoutes() {
  const routes = new Map();
  addRoute(routes, 'Home', '/');
  addRoute(routes, 'Shop all', '/#/shop');
  addRoute(routes, 'Brands', '/#/brands');
  addRoute(routes, 'Contact', '/#/contact');
  addRoute(routes, 'Policies', '/#/policies');
  addRoute(routes, 'Account', '/#/account');
  addRoute(routes, 'Cart', '/#/cart');
  addRoute(routes, 'Checkout', '/#/checkout');

  const catalogue = await getCatalogue();
  const brands = Array.isArray(catalogue.brands) ? catalogue.brands : [];
  const products = Array.isArray(catalogue.products) ? catalogue.products : [];

  for (const brand of brands) {
    if (!brand?.id) continue;
    addRoute(routes, `Brand ${brand.name || brand.id}`, `/#/brand/${brand.id}`);
    addRoute(routes, `Shop ${brand.name || brand.id}`, `/#/shop?brand=${encodeURIComponent(brand.id)}`);
  }

  for (const audience of ['women', 'men']) {
    addRoute(routes, `KALM Move ${audience}`, `/#/shop?brand=kalm-move&audience=${audience}`);
  }

  const approvedMoveCategories = [
    'new-in',
    'sets',
    'leggings',
    'sports-bras',
    'shorts',
    'tops',
    'bottoms',
    'layers',
    'jumpsuits-rompers',
    'accessories'
  ];

  for (const product of products) {
    if (product?.slug) addRoute(routes, `Product ${product.title || product.slug}`, `/#/product/${product.slug}`);
  }

  for (const audience of ['women', 'men']) {
    for (const category of approvedMoveCategories) {
      addRoute(routes, `${audience} ${category}`, `/#/shop?brand=kalm-move&audience=${audience}&moveCategory=${category}`);
    }
  }

  return {
    routes: [...routes.values()],
    catalogueSummary: { brands: brands.length, products: products.length }
  };
}

async function scrollForLazyImages(page) {
  await page.evaluate(async () => {
    const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
    const step = Math.max(600, Math.floor(window.innerHeight * 0.9));
    for (let y = 0; y < document.documentElement.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await delay(55);
    }
    window.scrollTo(0, 0);
  });
}

async function inspectPage(page) {
  return page.evaluate(() => {
    const images = [...document.images];
    const brokenImages = images
      .filter((image) => image.complete && image.naturalWidth === 0)
      .map((image) => ({ src: image.currentSrc || image.src, alt: image.alt || '' }));
    const duplicateImageSources = Object.entries(images.reduce((acc, image) => {
      const src = image.currentSrc || image.src;
      if (src) acc[src] = (acc[src] || 0) + 1;
      return acc;
    }, {})).filter(([, count]) => count > 1).map(([src, count]) => ({ src, count }));
    const headings = [...document.querySelectorAll('h1,h2,h3')]
      .filter((element) => element.offsetParent !== null)
      .map((element) => ({ tag: element.tagName, text: element.textContent.trim() }));
    const buttons = [...document.querySelectorAll('button,a')]
      .filter((element) => element.offsetParent !== null)
      .map((element) => element.textContent.trim())
      .filter(Boolean);
    const documentWidth = document.documentElement.scrollWidth;
    const viewportWidth = window.innerWidth;
    return {
      title: document.title,
      url: location.href,
      bodyTextSample: document.body.innerText.slice(0, 2500),
      headings,
      buttons: buttons.slice(0, 120),
      imageCount: images.length,
      imageSources: images.map((image) => image.currentSrc || image.src).filter(Boolean),
      brokenImages,
      duplicateImageSources: duplicateImageSources.slice(0, 100),
      horizontalOverflow: documentWidth > viewportWidth + 2,
      documentWidth,
      viewportWidth,
      pageHeight: document.documentElement.scrollHeight,
      visibleStylesCount: document.querySelectorAll('.product-card').length,
      visibleFiltersCount: document.querySelectorAll('[data-active-filter], .active-filter-chip').length,
      soldOutCount: [...document.querySelectorAll('body *')].filter((element) => /sold out|out of stock/i.test(element.textContent || '') && element.children.length === 0).length
    };
  });
}

async function run() {
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const { routes: allRoutes, catalogueSummary } = await buildRoutes();
  const routes = allRoutes.filter((_, index) => index % BATCH_COUNT === BATCH_INDEX);
  const browser = await chromium.launch({ headless: true });
  const report = {
    runId: RUN_ID,
    baseUrl: BASE_URL,
    startedAt: new Date().toISOString(),
    catalogueSummary,
    totalRouteCount: allRoutes.length,
    batchIndex: BATCH_INDEX,
    batchCount: BATCH_COUNT,
    routeCount: routes.length,
    results: []
  };

  for (const viewport of viewports) {
    const screenshotDir = path.join(OUTPUT_DIR, viewport.name);
    await fs.mkdir(screenshotDir, { recursive: true });

    for (const route of routes) {
      const consoleMessages = [];
      const pageErrors = [];
      const failedRequests = [];
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
        deviceScaleFactor: 1,
        isMobile: viewport.name === 'mobile',
        hasTouch: viewport.name === 'mobile'
      });

      page.on('console', (message) => {
        if (['error', 'warning'].includes(message.type())) {
          consoleMessages.push({ type: message.type(), text: message.text() });
        }
      });
      page.on('pageerror', (error) => pageErrors.push(String(error)));
      page.on('requestfailed', (request) => failedRequests.push({
        url: request.url(),
        failure: request.failure()?.errorText || 'unknown'
      }));

      const started = Date.now();
      let navigationError = null;
      try {
        await page.goto(route.url, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForTimeout(900);
        await scrollForLazyImages(page);
        await page.waitForTimeout(500);
      } catch (error) {
        navigationError = String(error);
      }

      const inspection = navigationError ? null : await inspectPage(page).catch((error) => ({ inspectionError: String(error) }));
      const fileStem = safeName(`${route.label}-${route.url.replace(BASE_URL, '')}`);
      const screenshotPath = path.join(screenshotDir, `${fileStem}.jpg`);
      try {
        await page.screenshot({ path: screenshotPath, fullPage: true, type: 'jpeg', quality: 72 });
      } catch (error) {
        consoleMessages.push({ type: 'screenshot-error', text: String(error) });
      }

      report.results.push({
        viewport: viewport.name,
        width: viewport.width,
        height: viewport.height,
        label: route.label,
        requestedUrl: route.url,
        elapsedMs: Date.now() - started,
        navigationError,
        inspection,
        consoleMessages,
        pageErrors,
        failedRequests,
        screenshot: screenshotPath
      });
      await page.close();
    }
  }

  report.finishedAt = new Date().toISOString();
  await fs.writeFile(path.join(OUTPUT_DIR, 'audit-report.json'), JSON.stringify(report, null, 2));
  await fs.writeFile(path.join(OUTPUT_DIR, 'routes.json'), JSON.stringify(routes, null, 2));
  console.log(`Batch ${BATCH_INDEX + 1}/${BATCH_COUNT}: captured ${report.results.length} route/viewport combinations.`);
  await browser.close();
}

run().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
