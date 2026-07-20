/* Central merchandising source of truth for the KS Active-first storefront preview. */
const ksActiveArchive = [
  { productSlug: "ks-active-halter-back-romper", displayColour: "Army Green" },
  { productSlug: "ks-active-rib-scrunch-legging", displayColour: "Ash Gray" },
  { productSlug: "ks-active-cutout-crossback-bra", displayColour: "Imperial Red" },
  { productSlug: "ks-active-scrunch-seamless-short", displayColour: "Egyptian Blue" },
  { productSlug: "ks-active-cutout-seamless-bra", displayColour: "Black" },
  { productSlug: "ks-active-crossback-seamless-bra", displayColour: "Apricot" },
  { productSlug: "ks-active-high-waist-seamless-short", displayColour: "Electric Violet" },
  { productSlug: "ks-active-curve-seam-legging", displayColour: "Espresso" },
  { productSlug: "ks-active-high-waist-seamless-legging", displayColour: "Electric Violet" },
  { productSlug: "ks-active-crisscross-back-bra", displayColour: "Black" },
  { productSlug: "ks-active-panel-seamless-legging", displayColour: "Azure Blue" },
  { productSlug: "ks-active-scrunch-seamless-legging", displayColour: "Imperial Red" },
  { productSlug: "ks-active-rib-contour-legging", displayColour: "Bright Green" },
  { productSlug: "ks-active-racer-knit-bra", displayColour: "Dark Green" }
];

const kalmMoveSignatureTee = {
  productSlug: "kalm-signature-oversized-tee",
  displayColour: "Black"
};

window.KALM_MERCHANDISING = {
  version: "2026-07-15-ks-active-first-preview",
  campaigns: {
    ksActiveHero: {
      desktop: "assets/images/products/ks-active/archive-approved/ks-active-panel-seamless-legging/azure-blue/hero-three-quarter.jpg",
      mobile: "assets/images/products/ks-active/archive-approved/ks-active-panel-seamless-legging/azure-blue/hero-three-quarter.jpg",
      alt: "Model wearing the KS Active Panel Seamless Legging in Azure Blue"
    },
    kalmMoveTeaser: {
      desktop: "assets/images/recovered/campaigns-v3/kalm-hero-six-person-v3-desktop-perf-20260715.webp",
      mobile: "assets/images/recovered/campaigns-v3/kalm-hero-six-person-v3-mobile-perf-20260715.webp",
      alt: "KALM Move adults sharing a relaxed movement moment outdoors"
    }
  },
  homepage: {
    signatureTee: kalmMoveSignatureTee,
    featuredKsActive: [
      ksActiveArchive[0],
      ksActiveArchive[1],
      ksActiveArchive[5],
      ksActiveArchive[10],
      ksActiveArchive[12],
      ksActiveArchive[13]
    ],
    finalPieces: [
      ksActiveArchive[8],
      ksActiveArchive[9],
      ksActiveArchive[6],
      ksActiveArchive[11],
      ksActiveArchive[2],
      ksActiveArchive[4]
    ]
  },
  collections: {
    "ks-active": ksActiveArchive,
    sale: [...ksActiveArchive],
    activewear: [...ksActiveArchive],
    "new-in": [...ksActiveArchive]
  }
};
