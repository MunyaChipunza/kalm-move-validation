import { mkdir, writeFile, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import crypto from "node:crypto";

const root = process.cwd();
const generatedAt = new Date().toISOString();

const applianceAnchors = [
  {
    id: "kalm-outdoor-ember-16-gas-pizza-oven",
    shortId: "ember-16",
    title: "Ember 16 Gas Pizza Oven",
    slug: "kalm-outdoor-ember-16-gas-pizza-oven"
  },
  {
    id: "kalm-outdoor-forge-2-portable-gas-griddle",
    shortId: "forge-2",
    title: "Forge 2 Portable Gas Griddle",
    slug: "kalm-outdoor-forge-2-portable-gas-griddle"
  },
  {
    id: "kalm-outdoor-ridge-4-stainless-gas-braai",
    shortId: "ridge-4",
    title: "Ridge 4 Stainless Gas Braai",
    slug: "kalm-outdoor-ridge-4-stainless-gas-braai"
  }
];

const imageViews = ["hero", "side", "contents", "detail", "lifestyle", "scene", "compatibility"];

const accessories = [
  {
    id: "kalm-outdoor-ember-16-pizza-peel",
    title: "Ember 16 Pizza Peel",
    slug: "kalm-outdoor-ember-16-pizza-peel",
    skuRoot: "KO-ACC-EMBER16-PEEL",
    type: "Pizza Peel",
    primaryAppliance: "ember-16",
    colorway: "brushed-steel-charcoal",
    shape: "peel",
    draftDescription: "A coming-soon pizza peel planned for launching and retrieving pizzas from the Ember 16.",
    customerBenefit: "Helps move pizza cleanly in and out of the oven.",
    metadata: ["pizza launch tool", "Ember 16 accessory", "supplier dimensions pending"],
    compatibility: {
      "ember-16": "primary",
      "forge-2": "not_applicable",
      "ridge-4": "not_applicable"
    }
  },
  {
    id: "kalm-outdoor-ember-16-turning-peel",
    title: "Ember 16 Turning Peel",
    slug: "kalm-outdoor-ember-16-turning-peel",
    skuRoot: "KO-ACC-EMBER16-TURNPEEL",
    type: "Turning Peel",
    primaryAppliance: "ember-16",
    colorway: "brushed-steel-matte-black",
    shape: "round-peel",
    draftDescription: "A coming-soon turning peel planned for rotating pizzas during high-heat Ember 16 cooking.",
    customerBenefit: "Makes it easier to turn pizza without removing it fully from the oven.",
    metadata: ["pizza turn tool", "Ember 16 accessory", "supplier dimensions pending"],
    compatibility: {
      "ember-16": "primary",
      "forge-2": "not_applicable",
      "ridge-4": "not_applicable"
    }
  },
  {
    id: "kalm-outdoor-ember-16-insulated-cover",
    title: "Ember 16 Insulated Cover",
    slug: "kalm-outdoor-ember-16-insulated-cover",
    skuRoot: "KO-ACC-EMBER16-COVER",
    type: "Oven Cover",
    primaryAppliance: "ember-16",
    colorway: "matte-black-weatherproof",
    shape: "cover",
    draftDescription: "A coming-soon protective cover planned for storing the Ember 16 between outdoor cooking sessions.",
    customerBenefit: "Keeps the oven covered when not in use.",
    metadata: ["protective cover", "Ember 16 accessory", "material spec pending"],
    compatibility: {
      "ember-16": "primary",
      "forge-2": "not_applicable",
      "ridge-4": "not_applicable"
    }
  },
  {
    id: "kalm-outdoor-forge-2-melting-dome",
    title: "Forge 2 Melting Dome",
    slug: "kalm-outdoor-forge-2-melting-dome",
    skuRoot: "KO-ACC-FORGE2-DOME",
    type: "Griddle Dome",
    primaryAppliance: "forge-2",
    colorway: "stainless-steel-black-handle",
    shape: "dome",
    draftDescription: "A coming-soon griddle dome planned for melting, steaming and finishing food on the Forge 2.",
    customerBenefit: "Supports burgers, eggs, vegetables and covered griddle cooking.",
    metadata: ["flat-top dome", "Forge 2 accessory", "supplier dimensions pending"],
    compatibility: {
      "ember-16": "not_applicable",
      "forge-2": "primary",
      "ridge-4": "review_required"
    }
  },
  {
    id: "kalm-outdoor-forge-2-griddle-tool-set",
    title: "Forge 2 Griddle Tool Set",
    slug: "kalm-outdoor-forge-2-griddle-tool-set",
    skuRoot: "KO-ACC-FORGE2-TOOLS",
    type: "Griddle Tools",
    primaryAppliance: "forge-2",
    colorway: "stainless-steel-black-grip",
    shape: "tools",
    draftDescription: "A coming-soon griddle tool set planned for turning, scraping and serving from the Forge 2.",
    customerBenefit: "Gives the flat-top station the core tools needed for everyday outdoor cooking.",
    metadata: ["spatulas", "scraper", "Forge 2 accessory", "set contents pending"],
    compatibility: {
      "ember-16": "not_applicable",
      "forge-2": "primary",
      "ridge-4": "general_use"
    }
  },
  {
    id: "kalm-outdoor-forge-2-grease-liner-pack",
    title: "Forge 2 Grease Liner Pack",
    slug: "kalm-outdoor-forge-2-grease-liner-pack",
    skuRoot: "KO-ACC-FORGE2-LINERS",
    type: "Grease Liners",
    primaryAppliance: "forge-2",
    colorway: "brushed-aluminium",
    shape: "liners",
    draftDescription: "A coming-soon liner pack planned to simplify Forge 2 grease-cup clean-up.",
    customerBenefit: "Makes post-cook clean-up easier when the final tray spec is confirmed.",
    metadata: ["liner pack", "Forge 2 accessory", "fit confirmation pending"],
    compatibility: {
      "ember-16": "not_applicable",
      "forge-2": "primary",
      "ridge-4": "not_applicable"
    }
  },
  {
    id: "kalm-outdoor-ridge-4-braai-tool-set",
    title: "Ridge 4 Braai Tool Set",
    slug: "kalm-outdoor-ridge-4-braai-tool-set",
    skuRoot: "KO-ACC-RIDGE4-TOOLS",
    type: "Braai Tools",
    primaryAppliance: "ridge-4",
    colorway: "stainless-steel-charcoal-grip",
    shape: "braai-tools",
    draftDescription: "A coming-soon braai tool set planned for turning, lifting and serving from the Ridge 4.",
    customerBenefit: "Keeps the main braai tools together for weekend hosting.",
    metadata: ["tongs", "spatula", "fork", "Ridge 4 accessory", "set contents pending"],
    compatibility: {
      "ember-16": "not_applicable",
      "forge-2": "general_use",
      "ridge-4": "primary"
    }
  },
  {
    id: "kalm-outdoor-ridge-4-smoker-box",
    title: "Ridge 4 Smoker Box",
    slug: "kalm-outdoor-ridge-4-smoker-box",
    skuRoot: "KO-ACC-RIDGE4-SMOKER",
    type: "Smoker Box",
    primaryAppliance: "ridge-4",
    colorway: "brushed-stainless",
    shape: "smoker-box",
    draftDescription: "A coming-soon smoker box planned for adding wood-chip flavour during Ridge 4 braai sessions.",
    customerBenefit: "Adds a simple smoke option to covered braai cooking.",
    metadata: ["smoker box", "Ridge 4 accessory", "supplier dimensions pending"],
    compatibility: {
      "ember-16": "not_applicable",
      "forge-2": "not_applicable",
      "ridge-4": "primary"
    }
  },
  {
    id: "kalm-outdoor-universal-prep-tray",
    title: "KALM Outdoor Prep Tray",
    slug: "kalm-outdoor-universal-prep-tray",
    skuRoot: "KO-ACC-UNIV-PREPTRAY",
    type: "Prep Tray",
    primaryAppliance: "universal",
    colorway: "charcoal-acacia",
    shape: "tray",
    draftDescription: "A coming-soon prep and serving tray planned for moving ingredients between the kitchen, patio and outdoor cooking station.",
    customerBenefit: "Creates one clean surface for prep, carry-out and serving.",
    metadata: ["prep tray", "serving tray", "universal Outdoor accessory", "material spec pending"],
    compatibility: {
      "ember-16": "compatible",
      "forge-2": "compatible",
      "ridge-4": "compatible"
    }
  }
];

const bundles = [
  {
    id: "kalm-outdoor-ember-16-launch-kit",
    title: "Ember 16 Launch Kit",
    slug: "kalm-outdoor-ember-16-launch-kit",
    status: "draft_coming_soon",
    primaryAppliance: "ember-16",
    includedAccessoryIds: [
      "kalm-outdoor-ember-16-pizza-peel",
      "kalm-outdoor-ember-16-turning-peel",
      "kalm-outdoor-ember-16-insulated-cover"
    ],
    customerUseCase: "Pizza-night setup for launch, turn and storage.",
    pricingStatus: "pending_supplier_costs"
  },
  {
    id: "kalm-outdoor-forge-2-breakfast-kit",
    title: "Forge 2 Breakfast Kit",
    slug: "kalm-outdoor-forge-2-breakfast-kit",
    status: "draft_coming_soon",
    primaryAppliance: "forge-2",
    includedAccessoryIds: [
      "kalm-outdoor-forge-2-melting-dome",
      "kalm-outdoor-forge-2-griddle-tool-set",
      "kalm-outdoor-forge-2-grease-liner-pack"
    ],
    customerUseCase: "Flat-top breakfast, burger and clean-up essentials.",
    pricingStatus: "pending_supplier_costs"
  },
  {
    id: "kalm-outdoor-ridge-4-weekend-braai-kit",
    title: "Ridge 4 Weekend Braai Kit",
    slug: "kalm-outdoor-ridge-4-weekend-braai-kit",
    status: "draft_coming_soon",
    primaryAppliance: "ridge-4",
    includedAccessoryIds: [
      "kalm-outdoor-ridge-4-braai-tool-set",
      "kalm-outdoor-ridge-4-smoker-box",
      "kalm-outdoor-universal-prep-tray"
    ],
    customerUseCase: "Weekend braai tools, smoke option and serving prep.",
    pricingStatus: "pending_supplier_costs"
  },
  {
    id: "kalm-outdoor-hosting-starter-bundle",
    title: "KALM Outdoor Hosting Starter Bundle",
    slug: "kalm-outdoor-hosting-starter-bundle",
    status: "draft_coming_soon",
    primaryAppliance: "multi-appliance",
    includedAccessoryIds: [
      "kalm-outdoor-universal-prep-tray",
      "kalm-outdoor-forge-2-griddle-tool-set",
      "kalm-outdoor-ridge-4-braai-tool-set"
    ],
    customerUseCase: "A shared tool-and-prep set for households using more than one Outdoor appliance.",
    pricingStatus: "pending_supplier_costs"
  }
];

const palette = {
  ink: "#111411",
  dark: "#22241f",
  charcoal: "#3a3a35",
  steel: "#c6c6bd",
  soft: "#f4f2eb",
  sand: "#d7c8a8",
  acacia: "#9b7148",
  olive: "#66715b"
};

function rel(...parts) {
  return path.join(...parts).replaceAll("\\", "/");
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function productShape(product, view) {
  const title = escapeXml(product.title);
  const fine = escapeXml(product.type);
  const shadow = `<ellipse cx="800" cy="1450" rx="420" ry="70" fill="#000" opacity="0.10"/>`;
  const mark = `<g transform="translate(1255 220)" opacity="0.82"><circle cx="0" cy="0" r="42" fill="none" stroke="${palette.dark}" stroke-width="4"/><text x="0" y="8" font-family="Arial, sans-serif" font-size="14" text-anchor="middle" fill="${palette.dark}" font-weight="700">KO</text></g>`;
  const caption = `<text x="800" y="1805" text-anchor="middle" font-family="Arial, sans-serif" font-size="46" font-weight="700" letter-spacing="2" fill="${palette.ink}">${title}</text><text x="800" y="1865" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" letter-spacing="5" fill="${palette.charcoal}">KALM OUTDOOR / PREPRODUCTION</text><text x="800" y="1914" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="${palette.charcoal}">${fine} - supplier specification pending</text>`;
  const line = `<line x1="380" y1="1570" x2="1220" y2="1570" stroke="${palette.sand}" stroke-width="3" opacity="0.65"/>`;
  let shape = "";

  switch (product.shape) {
    case "peel":
      shape = `<g transform="translate(800 960) rotate(-15)">${shadow}<rect x="-45" y="-520" width="90" height="760" rx="42" fill="${palette.acacia}"/><path d="M-295,-620 L295,-620 Q345,-610 355,-560 L395,-170 Q405,-100 335,-88 L-335,-88 Q-405,-100 -395,-170 L-355,-560 Q-345,-610 -295,-620Z" fill="${palette.steel}" stroke="${palette.dark}" stroke-width="10"/><path d="M-260,-555 L260,-555" stroke="#fff" stroke-width="18" opacity="0.35"/><rect x="-18" y="195" width="36" height="280" rx="18" fill="${palette.dark}" opacity="0.20"/></g>`;
      break;
    case "round-peel":
      shape = `<g transform="translate(800 990) rotate(13)">${shadow}<rect x="-34" y="-350" width="68" height="790" rx="34" fill="${palette.dark}"/><circle cx="0" cy="-475" r="260" fill="${palette.steel}" stroke="${palette.dark}" stroke-width="10"/><circle cx="0" cy="-475" r="210" fill="none" stroke="#fff" stroke-width="16" opacity="0.3"/><circle cx="0" cy="420" r="28" fill="${palette.steel}"/></g>`;
      break;
    case "cover":
      shape = `<g transform="translate(800 1040)">${shadow}<path d="M-430,260 L430,260 L370,-320 Q330,-525 0,-560 Q-330,-525 -370,-320Z" fill="${palette.dark}" stroke="${palette.ink}" stroke-width="12"/><path d="M-300,-300 Q0,-455 300,-300" fill="none" stroke="#fff" stroke-width="18" opacity="0.12"/><rect x="-120" y="-585" width="240" height="70" rx="35" fill="${palette.charcoal}"/><rect x="-340" y="180" width="680" height="62" rx="31" fill="#000" opacity="0.25"/></g>`;
      break;
    case "dome":
      shape = `<g transform="translate(800 1080)">${shadow}<path d="M-430,260 L430,260 Q375,-275 0,-350 Q-375,-275 -430,260Z" fill="${palette.steel}" stroke="${palette.dark}" stroke-width="12"/><rect x="-130" y="-430" width="260" height="65" rx="32" fill="${palette.dark}"/><path d="M-285,-40 Q0,-180 285,-40" stroke="#fff" stroke-width="20" opacity="0.35" fill="none"/><rect x="-455" y="230" width="910" height="70" rx="35" fill="${palette.dark}"/></g>`;
      break;
    case "tools":
      shape = `<g transform="translate(800 990)">${shadow}<g transform="rotate(-18)"><rect x="-270" y="-475" width="70" height="950" rx="35" fill="${palette.dark}"/><path d="M-330,-605 h190 l-22,165 h-146z" fill="${palette.steel}" stroke="${palette.dark}" stroke-width="8"/></g><g transform="rotate(18)"><rect x="200" y="-475" width="70" height="950" rx="35" fill="${palette.dark}"/><path d="M155,-610 h160 l45,185 h-250z" fill="${palette.steel}" stroke="${palette.dark}" stroke-width="8"/></g><rect x="-210" y="520" width="420" height="105" rx="52" fill="${palette.charcoal}"/></g>`;
      break;
    case "liners":
      shape = `<g transform="translate(800 1030)">${shadow}<g transform="rotate(-8)"><rect x="-420" y="-250" width="840" height="580" rx="60" fill="${palette.steel}" stroke="${palette.dark}" stroke-width="10"/><rect x="-330" y="-160" width="660" height="400" rx="45" fill="#e4e1d6" stroke="#fff" stroke-width="14"/><rect x="-260" y="-80" width="520" height="55" rx="27" fill="#fff" opacity="0.7"/></g><rect x="-330" y="395" width="660" height="92" rx="46" fill="${palette.charcoal}"/></g>`;
      break;
    case "braai-tools":
      shape = `<g transform="translate(800 980)">${shadow}<g transform="rotate(-24)"><rect x="-350" y="-520" width="64" height="990" rx="32" fill="${palette.dark}"/><path d="M-410,-650 h185 l-35,210 h-112z" fill="${palette.steel}" stroke="${palette.dark}" stroke-width="8"/></g><g><rect x="-35" y="-530" width="70" height="980" rx="35" fill="${palette.dark}"/><path d="M-105,-665 h210 l-35,220 h-140z" fill="${palette.steel}" stroke="${palette.dark}" stroke-width="8"/></g><g transform="rotate(23)"><rect x="285" y="-520" width="64" height="990" rx="32" fill="${palette.dark}"/><path d="M245,-660 h145 l-15,230 h-115z" fill="${palette.steel}" stroke="${palette.dark}" stroke-width="8"/></g></g>`;
      break;
    case "smoker-box":
      shape = `<g transform="translate(800 1060)">${shadow}<path d="M-455,-75 L-285,-300 H285 L455,-75 V310 H-455Z" fill="${palette.steel}" stroke="${palette.dark}" stroke-width="12"/><path d="M-285,-300 L-140,-120 H455" fill="none" stroke="${palette.dark}" stroke-width="8" opacity="0.5"/><g fill="${palette.dark}" opacity="0.62">${Array.from({ length: 8 }, (_, i) => `<circle cx="${-280 + i * 80}" cy="30" r="18"/>`).join("")}${Array.from({ length: 7 }, (_, i) => `<circle cx="${-240 + i * 80}" cy="130" r="18"/>`).join("")}</g><path d="M-210,-405 C-140,-470 -80,-470 -20,-405 C40,-340 110,-340 180,-405" fill="none" stroke="${palette.charcoal}" stroke-width="18" opacity="0.28"/></g>`;
      break;
    case "tray":
      shape = `<g transform="translate(800 1060)">${shadow}<rect x="-520" y="-280" width="1040" height="680" rx="95" fill="${palette.acacia}" stroke="${palette.dark}" stroke-width="12"/><rect x="-430" y="-190" width="860" height="500" rx="72" fill="${palette.sand}" opacity="0.72"/><circle cx="-375" cy="20" r="65" fill="none" stroke="${palette.dark}" stroke-width="18" opacity="0.55"/><circle cx="375" cy="20" r="65" fill="none" stroke="${palette.dark}" stroke-width="18" opacity="0.55"/><path d="M-215,-70 H215" stroke="#fff" stroke-width="22" opacity="0.33"/></g>`;
      break;
    default:
      shape = `<rect x="520" y="650" width="560" height="760" rx="70" fill="${palette.steel}" stroke="${palette.dark}" stroke-width="12"/>`;
  }

  if (view === "side") {
    shape += `<path d="M380,1325 H1220" stroke="${palette.dark}" stroke-width="18" opacity="0.75"/><text x="800" y="1378" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" fill="${palette.charcoal}">side profile draft</text>`;
  }
  if (view === "contents") {
    shape += `<g transform="translate(450 335)"><rect x="0" y="0" width="700" height="120" rx="60" fill="#fff" opacity="0.7"/><text x="350" y="76" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="${palette.ink}">planned contents pending supplier confirmation</text></g>`;
  }
  if (view === "detail") {
    shape += `<circle cx="1130" cy="610" r="145" fill="#fff" opacity="0.78" stroke="${palette.sand}" stroke-width="8"/><text x="1130" y="604" text-anchor="middle" font-family="Arial, sans-serif" font-size="25" font-weight="700" fill="${palette.ink}">detail</text><text x="1130" y="642" text-anchor="middle" font-family="Arial, sans-serif" font-size="19" fill="${palette.charcoal}">finish pending</text>`;
  }
  if (view === "lifestyle") {
    shape += `<g opacity="0.35"><rect x="115" y="1260" width="1370" height="150" rx="24" fill="${palette.sand}"/><circle cx="290" cy="1205" r="58" fill="${palette.olive}"/><rect x="1220" y="1120" width="120" height="270" rx="20" fill="${palette.charcoal}"/><rect x="1345" y="1180" width="70" height="210" rx="18" fill="${palette.dark}"/></g>`;
  }
  if (view === "scene") {
    shape += `<g opacity="0.28"><rect x="0" y="1220" width="1600" height="380" fill="${palette.sand}"/><path d="M0,1220 C320,1110 590,1350 880,1225 C1130,1115 1360,1190 1600,1070 V1600 H0Z" fill="${palette.olive}"/><circle cx="1325" cy="385" r="110" fill="#f2d48b"/></g>`;
  }
  if (view === "compatibility") {
    const rows = applianceAnchors.map((appliance, index) => {
      const state = product.compatibility[appliance.shortId] || "not_applicable";
      const y = 560 + index * 120;
      const fill = state === "primary" || state === "compatible" || state === "general_use" ? palette.olive : state === "review_required" ? "#b99a43" : "#b9b8ae";
      return `<g transform="translate(405 ${y})"><rect x="0" y="0" width="790" height="80" rx="40" fill="#fff" opacity="0.78"/><circle cx="55" cy="40" r="24" fill="${fill}"/><text x="105" y="49" font-family="Arial, sans-serif" font-size="28" fill="${palette.ink}">${escapeXml(appliance.title)} - ${escapeXml(state.replaceAll("_", " "))}</text></g>`;
    }).join("");
    shape += rows;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="2000" viewBox="0 0 1600 2000" role="img" aria-label="${title} ${view} preproduction image">
  <defs>
    <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
      <stop offset="0" stop-color="${palette.soft}"/>
      <stop offset="1" stop-color="#e5e0d2"/>
    </linearGradient>
  </defs>
  <rect width="1600" height="2000" fill="url(#bg)"/>
  <circle cx="160" cy="200" r="115" fill="#fff" opacity="0.52"/>
  <circle cx="1440" cy="1725" r="160" fill="#fff" opacity="0.42"/>
  ${mark}
  <text x="800" y="220" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" letter-spacing="7" fill="${palette.charcoal}">KALM OUTDOOR ACCESSORIES</text>
  ${line}
  ${shape}
  ${caption}
</svg>`;
}

function draftProduct(product) {
  const baseImagePath = `assets/images/products/kalm-outdoor/accessories/${product.slug}`;
  return {
    id: product.id,
    brand: "KALM Outdoor",
    brandId: "kalm-outdoor",
    collection: "KALM Outdoor Accessories",
    category: "outdoor",
    subcategory: "accessories",
    type: product.type,
    title: product.title,
    slug: product.slug,
    status: "draft_coming_soon",
    visibility: "preproduction_only",
    skuRoot: product.skuRoot,
    price: null,
    priceStatus: "pending_supplier_costs",
    stockStatus: "not_live",
    sourceTruth: "Draft accessory definition. Supplier, fit, dimensions and landed costs still pending.",
    image: `${baseImagePath}/hero.svg`,
    gallery: imageViews.map((view) => `${baseImagePath}/${view}.svg`),
    description: product.draftDescription,
    shortDescription: product.customerBenefit,
    longDescription: `${product.draftDescription} This draft record must not be added to the live catalogue until supplier specifications, landed cost, packaging, warranty and compatibility are confirmed.`,
    highlights: [
      "Coming soon",
      "Accessory fit requires supplier confirmation before launch",
      "No live price yet"
    ],
    compatibility: product.compatibility,
    compatibleWith: Object.entries(product.compatibility)
      .filter(([, state]) => ["primary", "compatible", "general_use"].includes(state))
      .map(([id]) => applianceAnchors.find((appliance) => appliance.shortId === id)?.id)
      .filter(Boolean),
    tags: [
      "outdoor",
      "outdoor-accessories",
      product.primaryAppliance,
      ...product.metadata.map((item) => item.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""))
    ],
    metaTitle: `${product.title} | KALM Outdoor Accessories`,
    metaDescription: `${product.title} is a planned KALM Outdoor accessory. Coming-soon details require supplier confirmation before launch.`,
    launchBlockers: [
      "Supplier source and MOQ",
      "Landed cost and retail price",
      "Verified dimensions and packaging",
      "Compatibility test against listed appliance",
      "Final approved product photography"
    ],
    qaStatus: {
      copy: "draft_truthful",
      imagery: "preproduction_mockup",
      liveReady: false
    }
  };
}

function imagePrompt(product, view) {
  return {
    productId: product.id,
    slug: product.slug,
    view,
    prompt: [
      `Premium ecommerce ${view} image for ${product.title}, a KALM Outdoor ${product.type}.`,
      "Outdoor cooking accessory only; do not include KALM Move apparel, existing appliance product files, unrelated brands or unverified measurements.",
      `Compatibility context: ${Object.entries(product.compatibility).map(([k, v]) => `${k}:${v}`).join(", ")}.`,
      "Use refined South African patio/outdoor hosting mood, matte black, brushed steel, acacia/sand accents where relevant.",
      "No fake certifications, no VAT wording, no supplier claims, no exaggerated scale, no text overlays except subtle KALM Outdoor mark if the final logo asset is supplied."
    ].join(" ")
  };
}

async function fileHash(filePath) {
  const buffer = await readFile(filePath);
  return crypto.createHash("sha256").update(buffer).digest("hex");
}

async function writeJson(filePath, value) {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function main() {
  const allowedRoots = [
    "assets/images/products/kalm-outdoor/accessories/",
    "catalogue/drafts/",
    "reports/",
    "image-generation/kalm-outdoor/"
  ];

  const draftProducts = accessories.map(draftProduct);
  const prompts = [];
  const manifest = [];
  const failedImageJobs = [];

  for (const product of accessories) {
    const productDir = path.join(root, "assets", "images", "products", "kalm-outdoor", "accessories", product.slug);
    await mkdir(productDir, { recursive: true });
    for (const view of imageViews) {
      const output = path.join(productDir, `${view}.svg`);
      await writeFile(output, productShape(product, view), "utf8");
      prompts.push(imagePrompt(product, view));
      manifest.push({
        productId: product.id,
        slug: product.slug,
        view,
        path: rel("assets/images/products/kalm-outdoor/accessories", product.slug, `${view}.svg`),
        format: "svg",
        status: "generated_preproduction_mockup",
        paidImageApiUsed: false,
        source: "deterministic local vector generator",
        sha256: await fileHash(output)
      });
    }
  }

  const mockupDir = path.join(root, "image-generation", "kalm-outdoor", "mockups");
  await mkdir(mockupDir, { recursive: true });
  const desktopMockup = renderMockup("desktop", draftProducts);
  const mobileMockup = renderMockup("mobile", draftProducts);
  await writeFile(path.join(mockupDir, "kalm-outdoor-accessories-desktop-mockup.svg"), desktopMockup, "utf8");
  await writeFile(path.join(mockupDir, "kalm-outdoor-accessories-mobile-mockup.svg"), mobileMockup, "utf8");

  await writeJson(path.join(root, "catalogue", "drafts", "kalm-outdoor-accessories.json"), {
    schema: "kalm.outdoor.accessories.draft.v1",
    generatedAt,
    sourceBranchPurpose: "Phase A preproduction only. Do not merge into live products.json during storefront recovery.",
    applianceAnchors,
    accessories: draftProducts
  });

  await writeJson(path.join(root, "catalogue", "drafts", "kalm-outdoor-bundles.json"), {
    schema: "kalm.outdoor.bundles.draft.v1",
    generatedAt,
    sourceBranchPurpose: "Phase A preproduction bundle definitions only.",
    bundles
  });

  await writeJson(path.join(root, "image-generation", "kalm-outdoor", "accessories", "prompts.json"), {
    schema: "kalm.outdoor.imagePrompts.v1",
    generatedAt,
    paidImageGenerationStatus: "not_started",
    coordination: {
      processInspectionCompleted: true,
      concurrencyUsed: 0,
      reason: "No paid image API calls were launched in Phase A; local deterministic SVG mockups were generated instead."
    },
    prompts
  });

  await writeJson(path.join(root, "image-generation", "kalm-outdoor", "accessories", "image-manifest.json"), {
    schema: "kalm.outdoor.imageManifest.v1",
    generatedAt,
    imageViews,
    expectedImages: accessories.length * imageViews.length,
    generatedImages: manifest.length,
    failedImageJobs,
    images: manifest
  });

  const validation = validate({ draftProducts, bundles, manifest, allowedRoots });
  await writeJson(path.join(root, "reports", "kalm-outdoor-accessories-validation.json"), validation);

  await writeJson(path.join(root, "reports", "kalm-outdoor-accessories-preproduction-summary.json"), {
    schema: "kalm.outdoor.preproductionSummary.v1",
    generatedAt,
    accessoryCount: accessories.length,
    bundleCount: bundles.length,
    imageCount: manifest.length,
    paidImageApiUsed: false,
    productsJsonModified: false,
    netlifyDeploymentInitiated: false,
    recoveryWorkspaceTouched: false,
    nextPhase: "Wait for storefront recovery release, then rebase and integrate semantically."
  });

  await writeFile(path.join(root, "reports", "kalm-outdoor-accessories-integration-plan.md"), integrationPlan({ draftProducts, bundles, manifest, failedImageJobs, validation }), "utf8");
  await writeFile(path.join(root, "reports", "KALM-OUTDOOR-READY-TO-INTEGRATE.md"), readyReport({ draftProducts, bundles, manifest, failedImageJobs, validation }), "utf8");

  if (!validation.ok) {
    throw new Error(`Validation failed: ${validation.errors.join("; ")}`);
  }

  console.log(JSON.stringify({
    ok: true,
    accessories: draftProducts.length,
    bundles: bundles.length,
    images: manifest.length,
    filesCreated: validation.filesCreated.length
  }, null, 2));
}

function validate({ draftProducts, bundles, manifest, allowedRoots }) {
  const errors = [];
  const ids = new Set();
  const slugs = new Set();
  const skuRoots = new Set();
  const filesCreated = [
    "catalogue/drafts/kalm-outdoor-accessories.json",
    "catalogue/drafts/kalm-outdoor-bundles.json",
    "image-generation/kalm-outdoor/accessories/generate-accessory-preproduction.mjs",
    "image-generation/kalm-outdoor/accessories/prompts.json",
    "image-generation/kalm-outdoor/accessories/image-manifest.json",
    "image-generation/kalm-outdoor/mockups/kalm-outdoor-accessories-desktop-mockup.svg",
    "image-generation/kalm-outdoor/mockups/kalm-outdoor-accessories-mobile-mockup.svg",
    "image-generation/kalm-outdoor/mockups/kalm-outdoor-accessories-desktop-screenshot.png",
    "image-generation/kalm-outdoor/mockups/kalm-outdoor-accessories-mobile-screenshot.png",
    "reports/kalm-outdoor-accessories-validation.json",
    "reports/kalm-outdoor-accessories-preproduction-summary.json",
    "reports/kalm-outdoor-accessories-integration-plan.md",
    "reports/KALM-OUTDOOR-READY-TO-INTEGRATE.md",
    ...manifest.map((item) => item.path)
  ];

  if (draftProducts.length !== 9) errors.push(`Expected 9 accessories, got ${draftProducts.length}.`);
  if (bundles.length < 3) errors.push(`Expected at least 3 bundles, got ${bundles.length}.`);
  if (manifest.length !== draftProducts.length * imageViews.length) errors.push("Generated image count does not match expected view count.");

  for (const product of draftProducts) {
    if (ids.has(product.id)) errors.push(`Duplicate id ${product.id}.`);
    if (slugs.has(product.slug)) errors.push(`Duplicate slug ${product.slug}.`);
    if (skuRoots.has(product.skuRoot)) errors.push(`Duplicate skuRoot ${product.skuRoot}.`);
    ids.add(product.id);
    slugs.add(product.slug);
    skuRoots.add(product.skuRoot);
    for (const anchor of applianceAnchors) {
      if (!Object.hasOwn(product.compatibility, anchor.shortId)) {
        errors.push(`${product.id} missing compatibility for ${anchor.shortId}.`);
      }
    }
    if (product.status !== "draft_coming_soon") errors.push(`${product.id} is not draft_coming_soon.`);
    if (product.price !== null) errors.push(`${product.id} has a live price.`);
    if (product.qaStatus.liveReady !== false) errors.push(`${product.id} is marked live ready.`);
  }

  for (const bundle of bundles) {
    for (const accessoryId of bundle.includedAccessoryIds) {
      if (!ids.has(accessoryId)) errors.push(`${bundle.id} references missing accessory ${accessoryId}.`);
    }
  }

  for (const item of manifest) {
    if (!existsSync(path.join(root, item.path))) errors.push(`Missing image file ${item.path}.`);
  }

  for (const file of filesCreated) {
    if (!allowedRoots.some((prefix) => file.startsWith(prefix))) {
      errors.push(`File outside Phase A ownership: ${file}.`);
    }
  }

  return {
    schema: "kalm.outdoor.preproductionValidation.v1",
    generatedAt,
    ok: errors.length === 0,
    errors,
    checks: {
      accessoryCount: draftProducts.length,
      bundleCount: bundles.length,
      imageViewCount: imageViews.length,
      manifestImageCount: manifest.length,
      uniqueIds: ids.size,
      uniqueSlugs: slugs.size,
      uniqueSkuRoots: skuRoots.size,
      paidImageApiUsed: false,
      productsJsonModified: false,
      netlifyDeploymentInitiated: false
    },
    filesCreated
  };
}

function integrationPlan({ draftProducts, bundles, manifest, failedImageJobs, validation }) {
  return `# KALM Outdoor Accessories Integration Plan

Generated: ${generatedAt}

## Scope

Phase A preproduction only. This branch defines nine KALM Outdoor accessory drafts, bundle drafts, compatibility mapping, image-generation prompts, local preproduction imagery and mockups.

No live storefront file is modified. Do not integrate until storefront recovery has completed and the recovery result is the new base.

## Accessories

${draftProducts.map((product) => `- ${product.title} (${product.id}) - ${product.skuRoot} - ${product.status}`).join("\n")}

## Bundles

${bundles.map((bundle) => `- ${bundle.title} (${bundle.id}) - ${bundle.includedAccessoryIds.join(", ")}`).join("\n")}

## Compatibility Rules

- Ember 16 accessories are not assumed compatible with Forge 2 or Ridge 4 unless marked general-use.
- Forge 2 griddle tools may be general-use with Ridge 4, but final usage copy needs QA.
- Ridge 4 braai tools may be general-use with Forge 2, but final usage copy needs QA.
- The Prep Tray is the only deliberately universal accessory.
- Any \`review_required\` mapping must be verified before product launch.

## Integration Sequence After Recovery

1. Confirm recovery task final report and deployment are complete.
2. \`git fetch origin\`
3. \`git rebase origin/master\`
4. Re-read recovered \`products.json\` and current Outdoor appliance records.
5. Convert draft records from \`catalogue/drafts/kalm-outdoor-accessories.json\` into the recovered catalogue schema.
6. Add bundle data only where the recovered storefront has a compatible bundle structure.
7. Wire shop-by-appliance navigation and waitlist behaviour against the recovered JS/CSS, not this branch's base copy.
8. Run validators and visual regression from the recovery release.
9. Verify existing KALM Move and KALM Outdoor appliance assets have not changed.
10. Commit integration separately from this preproduction commit.
11. Deploy only after confirming no other deployment is active.

## Supplier Information Still Pending

- Confirm supplier source, MOQ and lead times.
- Confirm dimensions, materials, finish, packaging and warranty.
- Confirm landed costs and retail pricing.
- Confirm appliance fit for every primary compatibility mapping.
- Confirm final product photography or paid generative image approval.

## Image Status

- Local preproduction images generated: ${manifest.length}
- Paid image API used: no
- Failed image jobs: ${failedImageJobs.length}

## Validation

- Validation status: ${validation.ok ? "PASS" : "FAIL"}
- Errors: ${validation.errors.length ? validation.errors.join("; ") : "None"}
`;
}

function readyReport({ draftProducts, bundles, manifest, failedImageJobs, validation }) {
  return `# KALM OUTDOOR READY TO INTEGRATE

Generated: ${generatedAt}

## Branch

- Branch name: feature/kalm-outdoor-accessories-preproduction
- Starting SHA: a5b459d4c8b65836e6775d9040729ba6f16d0e80
- Final preproduction SHA: use the pushed branch HEAD for this report; a Git commit cannot embed its own final hash.
- Recovery workspace touched: no
- Netlify deployment initiated: no

## Files Created

Validation report contains the full file list:

- reports/kalm-outdoor-accessories-validation.json

## Images Generated

- ${manifest.length} preproduction SVG images
- Views per product: ${imageViews.join(", ")}
- Destination: assets/images/products/kalm-outdoor/accessories/**
- Mock-up screenshots: image-generation/kalm-outdoor/mockups/kalm-outdoor-accessories-desktop-screenshot.png and image-generation/kalm-outdoor/mockups/kalm-outdoor-accessories-mobile-screenshot.png
- Paid image API used: no

## Failed Image Jobs

${failedImageJobs.length ? failedImageJobs.map((job) => `- ${job}`).join("\n") : "- None"}

## Draft Product Records

${draftProducts.map((product) => `- ${product.title} - ${product.id} - ${product.skuRoot}`).join("\n")}

## Bundle Definitions

${bundles.map((bundle) => `- ${bundle.title} - ${bundle.id}`).join("\n")}

## Compatibility Mapping

${draftProducts.map((product) => `- ${product.title}: Ember 16=${product.compatibility["ember-16"]}; Forge 2=${product.compatibility["forge-2"]}; Ridge 4=${product.compatibility["ridge-4"]}`).join("\n")}

## Supplier Information Still Pending

- Supplier source and MOQ
- Landed cost and retail price
- Verified dimensions and packaging
- Materials and finish
- Warranty and care notes
- Fit testing against primary appliance

## Exact Integration Sequence

1. Wait for storefront recovery completion and final report.
2. Confirm no task is rewriting products.json or deploying.
3. Run: \`git fetch origin\`
4. Run: \`git rebase origin/master\`
5. Recreate catalogue changes semantically against the recovered products.json.
6. Add waitlist and shop-by-appliance UI only after recovery validators pass.
7. Run full tests and visual regression.
8. Commit integration.
9. Deploy only after deployment lock is clear.

## Exact Resume Command

\`\`\`powershell
cd "C:\\Users\\Dell\\codex-work\\kalm-outdoor-accessories"
git fetch origin
git status --short --branch
\`\`\`

## Validation

- Status: ${validation.ok ? "PASS" : "FAIL"}
- Accessory count: ${draftProducts.length}
- Bundle count: ${bundles.length}
- Image count: ${manifest.length}
`;
}

function renderMockup(mode, products) {
  const isMobile = mode === "mobile";
  const width = isMobile ? 390 : 1440;
  const height = isMobile ? 1680 : 1140;
  const cols = isMobile ? 2 : 3;
  const cardW = isMobile ? 165 : 360;
  const cardH = isMobile ? 255 : 255;
  const gap = isMobile ? 18 : 32;
  const startX = isMobile ? 22 : 120;
  const startY = isMobile ? 180 : 220;
  const titleSize = isMobile ? 24 : 46;
  const cards = products.map((product, index) => {
    const col = index % cols;
    const row = Math.floor(index / cols);
    const x = startX + col * (cardW + gap);
    const y = startY + row * (cardH + gap);
    return `<g transform="translate(${x} ${y})">
      <rect width="${cardW}" height="${cardH}" rx="18" fill="#fff" stroke="#ddd7ca"/>
      <rect x="14" y="14" width="${cardW - 28}" height="${isMobile ? 132 : 120}" rx="12" fill="#f1eee5"/>
      <text x="${cardW / 2}" y="${isMobile ? 82 : 76}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${isMobile ? 14 : 18}" fill="${palette.charcoal}">${escapeXml(product.type)}</text>
      <text x="18" y="${isMobile ? 176 : 166}" font-family="Arial, sans-serif" font-size="${isMobile ? 13 : 18}" font-weight="700" fill="${palette.ink}">${escapeXml(product.title)}</text>
      <text x="18" y="${isMobile ? 203 : 198}" font-family="Arial, sans-serif" font-size="${isMobile ? 11 : 14}" fill="${palette.charcoal}">Coming soon / waitlist</text>
      <rect x="18" y="${cardH - 48}" width="${cardW - 36}" height="30" rx="15" fill="${palette.ink}"/>
      <text x="${cardW / 2}" y="${cardH - 28}" text-anchor="middle" font-family="Arial, sans-serif" font-size="${isMobile ? 11 : 13}" fill="#fff">Notify me</text>
    </g>`;
  }).join("\n");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}" role="img" aria-label="KALM Outdoor accessories ${mode} preproduction mockup">
    <rect width="${width}" height="${height}" fill="#f7f5ef"/>
    <text x="${isMobile ? 24 : 120}" y="${isMobile ? 58 : 90}" font-family="Arial, sans-serif" font-size="${isMobile ? 12 : 16}" letter-spacing="4" fill="${palette.charcoal}">KALM OUTDOOR</text>
    <text x="${isMobile ? 24 : 120}" y="${isMobile ? 104 : 150}" font-family="Arial, sans-serif" font-size="${titleSize}" font-weight="800" fill="${palette.ink}">Accessories coming soon</text>
    <text x="${isMobile ? 24 : 120}" y="${isMobile ? 134 : 184}" font-family="Arial, sans-serif" font-size="${isMobile ? 13 : 18}" fill="${palette.charcoal}">Draft waitlist layout. Not connected to live storefront.</text>
    ${cards}
  </svg>`;
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
