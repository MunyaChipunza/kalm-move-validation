# Legacy Source Cleanup Required

This record belongs to release-control PR #3 only as evidence. These are genuine current `master` storefront-source matches and must be corrected in a separate storefront-source PR, not inside the release-control PR.

Command used:

```powershell
rg -ni "\b(Wellness|Outdoor|Home|Brands)\b|movement, outdoor routines and everyday living" data/kalm-move-preview-prices.json index.html products.json route-bootstrap.js script.js site.webmanifest styles.css thanks.html
```

Matches:

```text
styles.css:24:html[data-initial-route="non-home"][data-route-rendered="false"] #app > .hero-shell {
styles.css:55:html[data-initial-route="non-home"][data-route-rendered="false"] .route-skeleton {
styles.css:952:.outdoor-cooking-band {
styles.css:964:.outdoor-cooking-media {
styles.css:970:.outdoor-cooking-media img {
styles.css:976:.outdoor-cooking-copy {
styles.css:983:.outdoor-cooking-copy h2 {
styles.css:989:.outdoor-cooking-copy p:not(.eyebrow) {
styles.css:995:.outdoor-cooking-copy .button {
styles.css:1002:.outdoor-cooking-products {
styles.css:1007:.outdoor-cooking-products a {
styles.css:1016:.outdoor-cooking-products a:last-child {
styles.css:1020:.outdoor-cooking-products img {
styles.css:1028:.outdoor-cooking-products span,
styles.css:1029:.outdoor-cooking-products strong {
styles.css:1033:.outdoor-cooking-products span {
styles.css:1039:.outdoor-cooking-products strong {
styles.css:1519:.outdoor-collection-intro {
styles.css:1527:.outdoor-collection-logo {
styles.css:1535:.outdoor-collection-intro p {
styles.css:1543:.outdoor-appliance-collection {
styles.css:1547:.outdoor-hero {
styles.css:1555:.outdoor-hero > div {
styles.css:1560:.outdoor-hero--text {
styles.css:1568:.outdoor-hero--text > div {
styles.css:1572:.outdoor-hero--text h1,
styles.css:1573:.outdoor-hero--text p,
styles.css:1574:.outdoor-hero--text .eyebrow {
styles.css:1578:.outdoor-hero--text p:not(.eyebrow) {
styles.css:1582:.outdoor-hero h1 {
styles.css:1590:.outdoor-hero p:not(.eyebrow) {
styles.css:1596:.outdoor-hero > img {
styles.css:1603:.outdoor-anchor-grid,
styles.css:1610:.outdoor-anchor-card,
styles.css:1618:.outdoor-anchor-card > div,
styles.css:1623:.outdoor-anchor-card h3,
styles.css:1629:.outdoor-anchor-card p,
styles.css:1635:.outdoor-appliance-links {
styles.css:1641:.outdoor-appliance-links a {
styles.css:1652:.outdoor-appliance-links span {
styles.css:1658:.outdoor-care-band,
styles.css:1659:.outdoor-waitlist-panel {
styles.css:1668:.outdoor-care-band {
styles.css:1673:.outdoor-care-band h2,
styles.css:1674:.outdoor-waitlist-panel h2 {
styles.css:1681:.outdoor-care-band p {
styles.css:1688:.outdoor-waitlist-panel {
styles.css:1694:.outdoor-waitlist-panel > div > p:not(.eyebrow) {
styles.css:1784:.outdoor-waitlist-form {
styles.css:1793:.outdoor-waitlist-form label,
styles.css:1794:.outdoor-waitlist-form fieldset {
styles.css:1802:.outdoor-waitlist-form input,
styles.css:1803:.outdoor-waitlist-form select {
styles.css:1811:.outdoor-waitlist-form .optional {
styles.css:1829:.outdoor-waitlist-form .consent {
styles.css:1837:.outdoor-waitlist-form .consent input {
styles.css:2588:  .outdoor-hero,
styles.css:2593:  .outdoor-cooking-band,
styles.css:2639:  .outdoor-hero > img {
styles.css:2652:  .outdoor-hero > div {
styles.css:2656:  .outdoor-anchor-grid,
styles.css:2658:  .outdoor-appliance-links,
styles.css:2659:  .outdoor-care-band,
styles.css:2660:  .outdoor-waitlist-panel {
styles.css:2664:  .outdoor-care-band,
styles.css:2665:  .outdoor-waitlist-panel {
styles.css:2675:  .outdoor-collection-intro {
styles.css:2680:  .outdoor-collection-logo {
styles.css:2732:  .outdoor-cooking-band {
styles.css:2736:  .outdoor-cooking-media {
styles.css:2740:  .outdoor-cooking-copy {
styles.css:2744:  .outdoor-cooking-products {
styles.css:2750:  .outdoor-cooking-products a {
styles.css:2757:  .outdoor-cooking-products a:last-child {
styles.css:2761:  .outdoor-cooking-products img,
styles.css:2762:  .outdoor-cooking-products span,
styles.css:2763:  .outdoor-cooking-products strong {
styles.css:2767:  .outdoor-cooking-products img {
styles.css:3008:  .outdoor-cooking-media {
styles.css:3012:  .outdoor-cooking-copy {
styles.css:3016:  .outdoor-cooking-copy h2 {
styles.css:3020:  .outdoor-cooking-products {
styles.css:3024:  .outdoor-cooking-products a {
styles.css:3030:  .outdoor-cooking-products a:last-child {
styles.css:3034:  .outdoor-cooking-products img {
styles.css:3039:  .outdoor-cooking-products span,
styles.css:3040:  .outdoor-cooking-products strong {
site.webmanifest:4:  "description": "Premium essentials for movement, outdoor routines and everyday living.",
thanks.html:13:    <a class="brand" href="index.html" aria-label="KALM Collective home">
route-bootstrap.js:5:  document.documentElement.dataset.initialRoute = isHome ? "home" : "non-home";
data/kalm-move-preview-prices.json:33:  { "productId": "kalm-move-slim-wellness-bottle", "productName": "KALM Move Slim Wellness Bottle", "category": "Bottles", "price": 249, "currency": "ZAR", "previewPrice": true, "status": "launching-soon", "approvedBy": "Munya", "approvalDate": "2026-07-15" },
script.js:301:  document.documentElement.dataset.initialRoute = isHomeRoute ? "home" : "non-home";
script.js:309:  if (route.path === "/brands") return renderBrands();
script.js:529:    if (app.querySelector("[data-home-sections]")) return;
script.js:530:    app.insertAdjacentHTML("beforeend", `<div data-home-sections>${sections}</div>`);
script.js:736:    <section class="outdoor-cooking-band">
script.js:737:      <a class="outdoor-cooking-media" href="#/product/${heroProduct.slug}">
script.js:738:        <img src="${transparentPixel}" data-src="${escapeHtml(heroProduct.gallery?.[4] || heroProduct.image)}" alt="${escapeAttribute(heroProduct.title)} outdoor cooking scene" width="1200" height="1500" loading="lazy" decoding="async" fetchpriority="low">
script.js:740:      <div class="outdoor-cooking-copy">
script.js:741:        <p class="eyebrow">KALM Outdoor Cooking</p>
script.js:743:        <p>Original gas pizza, flat-top and braai products designed for patio counters, weekend hosting and premium outdoor routines.</p>
script.js:744:        <a class="button primary" href="#/shop?category=outdoor">Shop outdoor cooking</a>
script.js:746:      <div class="outdoor-cooking-products">
script.js:805:    "Shop KALM Collective essentials across activewear, outdoor cooking, wellness, home and archive activewear.",
script.js:858:          ${brand === "kalm-outdoor" ? renderOutdoorApplianceFilter(appliance) : ""}
script.js:907:    "Brands | KALM Collective",
script.js:908:    "Explore KS Active, KALM Move, KALM Outdoor, KALM Wellness and KALM Home."
script.js:912:      <p class="eyebrow">Brands</p>
script.js:914:      <p>Five connected brands, each built around simple essentials for movement, outdoor routines, wellness and home.</p>
script.js:918:      ${state.data.brands.map((brand) => {
script.js:940:  const brand = state.data.brands.find((item) => item.id === brandId);
script.js:943:  if (brand.id === "kalm-outdoor") return renderKalmOutdoorExperience(brand);
script.js:1075:    "kalm-outdoor-ember-16-gas-pizza-oven",
script.js:1076:    "kalm-outdoor-forge-2-portable-gas-griddle",
script.js:1077:    "kalm-outdoor-ridge-4-stainless-gas-braai"
script.js:1089:    "KALM Outdoor | Premium outdoor cooking appliances",
script.js:1090:    "Discover KALM Outdoor appliances for considered cooking and open-air gatherings."
script.js:1093:    <section class="outdoor-collection-intro">
script.js:1094:      <img class="outdoor-collection-logo" src="${escapeHtml(getBrandLogo(brand))}" alt="${escapeAttribute(brand.logoAlt || brand.name)}" width="1254" height="1254">
script.js:1101:    <section class="section-block outdoor-appliance-collection" aria-labelledby="outdoor-appliances-title">
script.js:1104:          <p class="eyebrow">Outdoor cooking</p>
script.js:1105:          <h2 id="outdoor-appliances-title">Appliances</h2>
script.js:1124:function renderOutdoorWaitlistForm({ interest = "", applianceId = "", source = "outdoor-brand-page" } = {}) {
script.js:1129:  const fieldId = `outdoor-waitlist-${source.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "")}`;
script.js:1137:    <form class="outdoor-waitlist-form" name="kalm-outdoor-accessory-waitlist" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thanks.html" data-netlify-ajax data-waitlist-form data-success-message="You are on the KALM Outdoor waitlist. We will share launch and compatibility updates when they are confirmed.">
script.js:1138:      <input type="hidden" name="form-name" value="kalm-outdoor-accessory-waitlist">
script.js:1154:      <label class="consent"><input type="checkbox" name="consent" value="yes" required> <span>I consent to KALM Collective using my details for KALM Outdoor launch and compatibility updates.</span></label>
script.js:1238:          <a href="/">Home</a>
script.js:1264:          source: `outdoor-product-${product.slug}`
script.js:1611:      <article class="policy-card" id="returns"><h2>Returns</h2><p>Returns are accepted within 30 days on unworn apparel and unused home or wellness items in their original condition and packaging.</p></article>
script.js:1788:        <option value="all">All Outdoor products</option>
script.js:1817:    brand: (value) => state.data.brands.find((item) => item.id === value)?.name || value,
script.js:2554:  if (brand && brand !== "all") return state.data.brands.find((item) => item.id === brand)?.name || "Shop";
script.js:2948:          <p>Premium essentials for movement, outdoor routines and everyday living.</p>
script.js:2955:        ${footerSection("Brands", `
index.html:43:    <a class="brand" href="/" aria-label="KALM Collective home">
index.html:179:  <form name="kalm-outdoor-accessory-waitlist" method="POST" data-netlify="true" netlify-honeypot="bot-field" action="/thanks.html" hidden>
index.html:180:    <input type="hidden" name="form-name" value="kalm-outdoor-accessory-waitlist">
products.json:14:  "brands": [
products.json:50:      "heroImage": "assets/images/recovered/brands-v1/kalm-move-brand-hero-lifestyle-v1.webp",
products.json:51:      "tileImage": "assets/images/recovered/brands-v1/kalm-move-brand-hero-lifestyle-v1.webp",
products.json:58:      "homepageTileImage": "assets/images/recovered/brands-v1/kalm-move-brand-hero-lifestyle-v1.webp"
products.json:61:      "id": "kalm-outdoor",
products.json:62:      "name": "KALM Outdoor",
products.json:63:      "role": "Outdoor cooking and living",
products.json:64:      "summary": "Original outdoor cooking, patio and open-air living pieces for weekend meals and relaxed hosting.",
products.json:65:      "heroImage": "assets/images/recovered/brands-v1/kalm-outdoor-brand-hero-lifestyle-v1.webp",
products.json:66:      "tileImage": "assets/images/recovered/brands-v1/kalm-outdoor-brand-hero-lifestyle-v1.webp",
products.json:67:      "logo": "assets/branding/kalm-outdoor/kalm-outdoor-logo.png",
products.json:68:      "slug": "kalm-outdoor",
products.json:69:      "approvedLogo": "assets/branding/kalm-outdoor/kalm-outdoor-logo.png",
products.json:70:      "logoAlt": "KALM Outdoor logo",
products.json:71:      "description": "Original outdoor cooking, patio and open-air living pieces for weekend meals and relaxed hosting.",
products.json:72:      "categoryLink": "#/shop?category=outdoor",
products.json:73:      "homepageTileImage": "assets/images/recovered/brands-v1/kalm-outdoor-brand-hero-lifestyle-v1.webp"
products.json:76:      "id": "kalm-wellness",
products.json:77:      "name": "KALM Wellness",
products.json:78:      "role": "Wellness accessories",
products.json:80:      "heroImage": "assets/images/products/kalm-wellness/breathe-mat-v2/sand/lifestyle.webp",
products.json:81:      "tileImage": "assets/images/products/kalm-wellness/breathe-mat-v2/sand/front.webp",
products.json:82:      "logo": "assets/branding/kalm-wellness/kalm-wellness-logo.png",
products.json:83:      "slug": "kalm-wellness",
products.json:84:      "approvedLogo": "assets/branding/kalm-wellness/kalm-wellness-logo.png",
products.json:85:      "logoAlt": "KALM Wellness logo",
products.json:86:      "description": "Studio, recovery and ritual essentials from KALM Wellness.",
products.json:87:      "categoryLink": "#/shop?category=wellness",
products.json:88:      "homepageTileImage": "assets/images/products/kalm-wellness/ritual-set-v2/natural-oat/front.webp"
products.json:91:      "id": "kalm-home",
products.json:92:      "name": "KALM Home",
products.json:93:      "role": "Home essentials",
products.json:95:      "heroImage": "assets/images/generated/brand-tiles/kalm-home-tile.webp",
products.json:96:      "tileImage": "assets/images/generated/kalm-home/white-cotton-bedding-set.webp",
products.json:97:      "logo": "assets/branding/kalm-home/kalm-home-logo.png",
products.json:98:      "slug": "kalm-home",
products.json:99:      "approvedLogo": "assets/branding/kalm-home/kalm-home-logo.png",
products.json:100:      "logoAlt": "KALM Home logo",
products.json:101:      "description": "Home decor, bedding, storage and living essentials from KALM Collective.",
products.json:102:      "categoryLink": "#/shop?category=home",
products.json:103:      "homepageTileImage": "assets/images/generated/kalm-home/white-cotton-bedding-set.webp"
products.json:118:      "id": "wellness",
products.json:119:      "name": "Wellness",
products.json:120:      "image": "assets/images/products/kalm-wellness/breathe-mat-v2/sand/front.webp"
products.json:123:      "id": "home",
products.json:124:      "name": "Home",
products.json:125:      "image": "assets/images/products/kalm-home/kalm-home-white-cotton-bedding-set-main.webp"
products.json:128:      "id": "outdoor",
products.json:129:      "name": "Outdoor",
products.json:130:      "image": "assets/images/products/kalm-outdoor/kalm-outdoor-ridge-4-scene.webp"
products.json:4310:      "description": "A hooded windbreaker and running short set for light outdoor movement.",
products.json:4311:      "shortDescription": "A hooded windbreaker and running short set for light outdoor movement.",
products.json:4312:      "longDescription": "The Lightweight Windbreaker Set pairs a hooded zip layer with matching running shorts. It is an easy throw-on set for walks, travel days and light outdoor sessions.",
products.json:4316:        "Light outdoor layer",
products.json:4322:        "Light outdoor layer",
products.json:4354:      "metaDescription": "A hooded windbreaker and running short set for light outdoor movement.",
products.json:10324:      "id": "kalm-move-slim-wellness-bottle",
products.json:10330:      "title": "KALM Move Slim Wellness Bottle",
products.json:10331:      "slug": "kalm-move-slim-wellness-bottle",
products.json:10346:      "image": "assets/images/products/kalm-move/bottles-v4/slim-wellness-bottle/matte-white/front.webp",
products.json:10347:      "description": "A sleek wellness bottle with a slim profile and calm studio finish.",
products.json:10348:      "shortDescription": "A sleek wellness bottle with a slim profile and calm studio finish.",
products.json:10349:      "longDescription": "The Slim Wellness Bottle is a refined accessory for studio sessions, walks and daily routines. Its slim profile keeps the look elegant, while the small buffalo mark keeps the KALM Move identity subtle and premium.",
products.json:10352:        "Soft wellness colour palette",
products.json:10359:        "Soft wellness colour palette",
products.json:10380:          "hero": "assets/images/products/kalm-move/bottles-v4/slim-wellness-bottle/matte-white/front.webp",
products.json:10382:            "assets/images/products/kalm-move/bottles-v4/slim-wellness-bottle/matte-white/front.webp",
products.json:10383:            "assets/images/products/kalm-move/bottles-v4/slim-wellness-bottle/matte-white/angle.webp"
products.json:10387:          "hero": "assets/images/products/kalm-move/bottles-v4/slim-wellness-bottle/stone/front.webp",
products.json:10389:            "assets/images/products/kalm-move/bottles-v4/slim-wellness-bottle/stone/front.webp",
products.json:10390:            "assets/images/products/kalm-move/bottles-v4/slim-wellness-bottle/stone/angle.webp"
products.json:10394:          "hero": "assets/images/products/kalm-move/bottles-v4/slim-wellness-bottle/soft-pink/front.webp",
products.json:10396:            "assets/images/products/kalm-move/bottles-v4/slim-wellness-bottle/soft-pink/front.webp",
products.json:10397:            "assets/images/products/kalm-move/bottles-v4/slim-wellness-bottle/soft-pink/angle.webp"
products.json:10401:          "hero": "assets/images/products/kalm-move/bottles-v4/slim-wellness-bottle/sage/front.webp",
products.json:10403:            "assets/images/products/kalm-move/bottles-v4/slim-wellness-bottle/sage/front.webp",
products.json:10404:            "assets/images/products/kalm-move/bottles-v4/slim-wellness-bottle/sage/angle.webp"
products.json:10409:        "assets/images/products/kalm-move/bottles-v4/slim-wellness-bottle/matte-white/front.webp",
products.json:10410:        "assets/images/products/kalm-move/bottles-v4/slim-wellness-bottle/matte-white/angle.webp"
products.json:10413:      "metaTitle": "KALM Move Slim Wellness Bottle | KALM Move",
products.json:10414:      "metaDescription": "A sleek wellness bottle with a slim profile and calm studio finish.",
products.json:10423:      "skuRoot": "KALM-MOVE-SLIM-WELLNESS-BOTTLE",
products.json:10426:          "sku": "KALM-MOVE-SLIM-WELLNESS-BOTTLE-MATTE-WHITE-ONE-SIZE",
products.json:10434:          "sku": "KALM-MOVE-SLIM-WELLNESS-BOTTLE-STONE-ONE-SIZE",
products.json:10442:          "sku": "KALM-MOVE-SLIM-WELLNESS-BOTTLE-SOFT-PINK-ONE-SIZE",
products.json:10450:          "sku": "KALM-MOVE-SLIM-WELLNESS-BOTTLE-SAGE-ONE-SIZE",
products.json:10625:      "id": "kalm-outdoor-ember-16-gas-pizza-oven",
products.json:10626:      "brand": "KALM Outdoor",
products.json:10627:      "brandId": "kalm-outdoor",
products.json:10628:      "collection": "KALM Outdoor Cooking",
products.json:10629:      "category": "outdoor",
products.json:10632:      "slug": "kalm-outdoor-ember-16-gas-pizza-oven",
products.json:10645:      "image": "assets/images/products/kalm-outdoor/kalm-outdoor-ember-16-main.webp",
products.json:10647:      "shortDescription": "Original 16-inch outdoor gas pizza oven with a refined KALM finish.",
products.json:10648:      "longDescription": "The Ember 16 is designed for weekend pizza nights and compact outdoor kitchens. A dark faceted shell, stone-style cooking deck and simple gas control give it a premium KALM Outdoor profile for patios, garden counters and relaxed hosting.",
products.json:10660:        "Low-profile legs for outdoor counters and tables",
products.json:10670:          "value": "Outdoor LPG gas"
products.json:10682:          "value": "Outdoor patios, garden counters and covered braai areas"
products.json:10689:      "fitNotes": "Best for covered patios, outdoor counters and braai areas with ventilation.",
products.json:10694:        "outdoor",
products.json:10695:        "outdoor-cooking",
products.json:10704:          "assets/images/products/kalm-outdoor/kalm-outdoor-ember-16-main.webp"
products.json:10708:        "assets/images/products/kalm-outdoor/kalm-outdoor-ember-16-main.webp",
products.json:10709:        "assets/images/products/kalm-outdoor/kalm-outdoor-ember-16-front.webp",
products.json:10710:        "assets/images/products/kalm-outdoor/kalm-outdoor-ember-16-side.webp",
products.json:10711:        "assets/images/products/kalm-outdoor/kalm-outdoor-ember-16-lifestyle.webp",
products.json:10712:        "assets/images/products/kalm-outdoor/kalm-outdoor-ember-16-scene.webp",
products.json:10713:        "assets/images/products/kalm-outdoor/kalm-outdoor-ember-16-detail.webp"
products.json:10716:        "kalm-outdoor-ember-launch-pro-perforated-peel",
products.json:10717:        "kalm-outdoor-ember-turn-pro-turning-peel",
products.json:10718:        "kalm-outdoor-ember-dough-and-heat-kit",
products.json:10719:        "kalm-outdoor-forge-2-portable-gas-griddle"
products.json:10721:      "metaTitle": "Ember 16 Gas Pizza Oven | KALM Outdoor",
products.json:10722:      "metaDescription": "Shop the KALM Outdoor Ember 16, an original 16-inch gas pizza oven for patio cooking and open-air hosting.",
products.json:10744:      "id": "kalm-outdoor-forge-2-portable-gas-griddle",
products.json:10745:      "brand": "KALM Outdoor",
products.json:10746:      "brandId": "kalm-outdoor",
products.json:10747:      "collection": "KALM Outdoor Cooking",
products.json:10748:      "category": "outdoor",
products.json:10751:      "slug": "kalm-outdoor-forge-2-portable-gas-griddle",
products.json:10764:      "image": "assets/images/products/kalm-outdoor/kalm-outdoor-forge-2-main.webp",
products.json:10765:      "description": "A two-burner flat-top gas griddle on a rolling frame for breakfasts, burgers and relaxed outdoor cooking.",
products.json:10767:      "longDescription": "The Forge 2 brings flat-top cooking into the KALM Outdoor range with a clean black frame, stainless cooking plate and folding-friendly silhouette. It is built for breakfasts, burgers, vegetables and casual meals around the patio.",
products.json:10780:        "Matte black KALM Outdoor finish"
products.json:10793:          "value": "Outdoor LPG gas"
products.json:10808:      "fitNotes": "Designed for patios, balconies and compact outdoor entertainment spaces with ventilation.",
products.json:10813:        "outdoor",
products.json:10814:        "outdoor-cooking",
products.json:10823:          "assets/images/products/kalm-outdoor/kalm-outdoor-forge-2-main.webp"
products.json:10827:        "assets/images/products/kalm-outdoor/kalm-outdoor-forge-2-main.webp",
products.json:10828:        "assets/images/products/kalm-outdoor/kalm-outdoor-forge-2-front.webp",
products.json:10829:        "assets/images/products/kalm-outdoor/kalm-outdoor-forge-2-side.webp",
products.json:10830:        "assets/images/products/kalm-outdoor/kalm-outdoor-forge-2-lifestyle.webp",
products.json:10831:        "assets/images/products/kalm-outdoor/kalm-outdoor-forge-2-scene.webp",
products.json:10832:        "assets/images/products/kalm-outdoor/kalm-outdoor-forge-2-detail.webp"
products.json:10835:        "kalm-outdoor-forge-pro-griddle-tool-roll",
products.json:10836:        "kalm-outdoor-forge-smash-and-steam-kit",
products.json:10837:        "kalm-outdoor-forge-season-and-care-kit",
products.json:10838:        "kalm-outdoor-ember-16-gas-pizza-oven"
products.json:10840:      "metaTitle": "Forge 2 Portable Gas Griddle | KALM Outdoor",
products.json:10841:      "metaDescription": "Shop the KALM Outdoor Forge 2, an original two-burner flat-top gas griddle for patio cooking.",
products.json:10863:      "id": "kalm-outdoor-ridge-4-stainless-gas-braai",
products.json:10864:      "brand": "KALM Outdoor",
products.json:10865:      "brandId": "kalm-outdoor",
products.json:10866:      "collection": "KALM Outdoor Cooking",
products.json:10867:      "category": "outdoor",
products.json:10870:      "slug": "kalm-outdoor-ridge-4-stainless-gas-braai",
products.json:10883:      "image": "assets/images/products/kalm-outdoor/kalm-outdoor-ridge-4-main.webp",
products.json:10884:      "description": "A four-burner stainless cart gas braai for polished outdoor kitchens, family grilling and weekend hosting.",
products.json:10886:      "longDescription": "The Ridge 4 anchors the KALM Outdoor Cooking range with a stainless hood, black cart frame and open-air hosting presence. It gives larger patios a polished braai setup for family grilling, weekend prep and outdoor meals.",
products.json:10895:        "Four-burner cooking surface for full outdoor meals",
products.json:10899:        "Premium KALM Outdoor buffalo detailing"
products.json:10908:          "value": "Outdoor LPG gas"
products.json:10920:          "value": "Outdoor kitchens, patios and family braai areas"
products.json:10927:      "fitNotes": "Best for permanent patio setups, outdoor kitchens and larger braai areas with ventilation.",
products.json:10932:        "outdoor",
products.json:10933:        "outdoor-cooking",
products.json:10942:          "assets/images/products/kalm-outdoor/kalm-outdoor-ridge-4-main.webp"
products.json:10946:        "assets/images/products/kalm-outdoor/kalm-outdoor-ridge-4-main.webp",
products.json:10947:        "assets/images/products/kalm-outdoor/kalm-outdoor-ridge-4-front.webp",
products.json:10948:        "assets/images/products/kalm-outdoor/kalm-outdoor-ridge-4-side.webp",
products.json:10949:        "assets/images/products/kalm-outdoor/kalm-outdoor-ridge-4-lifestyle.webp",
products.json:10950:        "assets/images/products/kalm-outdoor/kalm-outdoor-ridge-4-scene.webp",
products.json:10951:        "assets/images/products/kalm-outdoor/kalm-outdoor-ridge-4-detail.webp"
products.json:10954:        "kalm-outdoor-ridge-smart-temperature-system",
products.json:10955:        "kalm-outdoor-ridge-pro-rotisserie-kit",
products.json:10956:        "kalm-outdoor-ridge-cast-iron-sear-system",
products.json:10957:        "kalm-outdoor-ember-16-gas-pizza-oven"
products.json:10959:      "metaTitle": "Ridge 4 Stainless Gas Braai | KALM Outdoor",
products.json:10960:      "metaDescription": "Shop the KALM Outdoor Ridge 4, an original stainless four-burner gas braai for premium outdoor hosting.",
products.json:10982:      "id": "kalm-outdoor-canvas-utility-tote",
products.json:10983:      "brand": "KALM Outdoor",
products.json:10984:      "brandId": "kalm-outdoor",
products.json:10985:      "collection": "KALM Outdoor Edit",
products.json:10986:      "category": "outdoor",
products.json:10989:      "slug": "kalm-outdoor-canvas-utility-tote",
products.json:10999:      "image": "assets/images/products/kalm-outdoor/kalm-outdoor-canvas-utility-tote-main.webp",
products.json:11011:        "outdoor",
products.json:11018:          "assets/images/products/kalm-outdoor/kalm-outdoor-canvas-utility-tote-black-natural.webp"
products.json:11022:        "assets/images/products/kalm-outdoor/kalm-outdoor-canvas-utility-tote-main.webp",
products.json:11023:        "assets/images/products/kalm-outdoor/kalm-outdoor-canvas-utility-tote-black-natural.webp"
products.json:11033:      "skuRoot": "KALM-OUTDOOR-CANVAS-UTILITY-TOTE",
products.json:11036:          "sku": "KALM-OUTDOOR-CANVAS-UTILITY-TOTE-BLACK-NATURAL-ONE-SIZE",
products.json:11046:      "id": "kalm-outdoor-weather-ready-picnic-blanket",
products.json:11047:      "brand": "KALM Outdoor",
products.json:11048:      "brandId": "kalm-outdoor",
products.json:11049:      "collection": "KALM Outdoor Edit",
products.json:11050:      "category": "outdoor",
products.json:11053:      "slug": "kalm-outdoor-weather-ready-picnic-blanket",
products.json:11063:      "image": "assets/images/products/kalm-outdoor/kalm-outdoor-weather-ready-picnic-blanket-main.webp",
products.json:11064:      "description": "A roll-up picnic blanket with a soft top layer and practical outdoor underside.",
products.json:11068:        "Outdoor-ready backing"
products.json:11074:        "outdoor",
products.json:11081:          "assets/images/products/kalm-outdoor/kalm-outdoor-weather-ready-picnic-blanket-charcoal.webp"
products.json:11085:        "assets/images/products/kalm-outdoor/kalm-outdoor-weather-ready-picnic-blanket-main.webp",
products.json:11086:        "assets/images/products/kalm-outdoor/kalm-outdoor-weather-ready-picnic-blanket-charcoal.webp"
products.json:11096:      "skuRoot": "KALM-OUTDOOR-WEATHER-READY-PICNIC-BLANKET",
products.json:11099:          "sku": "KALM-OUTDOOR-WEATHER-READY-PICNIC-BLANKET-CHARCOAL-ONE-SIZE",
products.json:11109:      "id": "kalm-outdoor-patio-cushion-pair",
products.json:11110:      "brand": "KALM Outdoor",
products.json:11111:      "brandId": "kalm-outdoor",
products.json:11112:      "collection": "KALM Outdoor Edit",
products.json:11113:      "category": "outdoor",
products.json:11116:      "slug": "kalm-outdoor-patio-cushion-pair",
products.json:11126:      "image": "assets/images/products/kalm-outdoor/kalm-outdoor-patio-cushion-pair-main.webp",
products.json:11127:      "description": "A two-piece cushion pair for patio chairs, balcony benches and relaxed outdoor corners.",
products.json:11130:        "Textured outdoor handle",
products.json:11133:      "fitNotes": "Pair of outdoor cushions.",
products.json:11134:      "fabric": "Outdoor-feel woven cover with filled insert.",
products.json:11137:        "outdoor",
products.json:11144:          "assets/images/products/kalm-outdoor/kalm-outdoor-patio-cushion-pair-ivory-black.webp"
products.json:11148:        "assets/images/products/kalm-outdoor/kalm-outdoor-patio-cushion-pair-main.webp",
products.json:11149:        "assets/images/products/kalm-outdoor/kalm-outdoor-patio-cushion-pair-ivory-black.webp"
products.json:11159:      "skuRoot": "KALM-OUTDOOR-PATIO-CUSHION-PAIR",
products.json:11162:          "sku": "KALM-OUTDOOR-PATIO-CUSHION-PAIR-IVORY-BLACK-PAIR",
products.json:11172:      "id": "kalm-outdoor-matte-camp-lantern",
products.json:11173:      "brand": "KALM Outdoor",
products.json:11174:      "brandId": "kalm-outdoor",
products.json:11175:      "collection": "KALM Outdoor Edit",
products.json:11176:      "category": "outdoor",
products.json:11179:      "slug": "kalm-outdoor-matte-camp-lantern",
products.json:11189:      "image": "assets/images/products/kalm-outdoor/kalm-outdoor-matte-camp-lantern-main.webp",
products.json:11200:        "outdoor",
products.json:11207:          "assets/images/products/kalm-outdoor/kalm-outdoor-matte-camp-lantern-black.webp"
products.json:11211:        "assets/images/products/kalm-outdoor/kalm-outdoor-matte-camp-lantern-main.webp",
products.json:11212:        "assets/images/products/kalm-outdoor/kalm-outdoor-matte-camp-lantern-black.webp"
products.json:11222:      "skuRoot": "KALM-OUTDOOR-MATTE-CAMP-LANTERN",
products.json:11225:          "sku": "KALM-OUTDOOR-MATTE-CAMP-LANTERN-BLACK-ONE-SIZE",
products.json:11235:      "id": "kalm-outdoor-insulated-carafe-and-tumbler",
products.json:11236:      "brand": "KALM Outdoor",
products.json:11237:      "brandId": "kalm-outdoor",
products.json:11238:      "collection": "KALM Outdoor Edit",
products.json:11239:      "category": "outdoor",
products.json:11242:      "slug": "kalm-outdoor-insulated-carafe-and-tumbler",
products.json:11252:      "image": "assets/images/products/kalm-outdoor/kalm-outdoor-insulated-carafe-and-tumbler-main.webp",
products.json:11256:        "Outdoor-friendly finish",
products.json:11263:        "outdoor",
products.json:11270:          "assets/images/products/kalm-outdoor/kalm-outdoor-insulated-carafe-and-tumbler-smoke-steel.webp"
products.json:11274:        "assets/images/products/kalm-outdoor/kalm-outdoor-insulated-carafe-and-tumbler-main.webp",
products.json:11275:        "assets/images/products/kalm-outdoor/kalm-outdoor-insulated-carafe-and-tumbler-smoke-steel.webp"
products.json:11285:      "skuRoot": "KALM-OUTDOOR-INSULATED-CARAFE-AND-TUMBLER",
products.json:11288:          "sku": "KALM-OUTDOOR-INSULATED-CARAFE-AND-TUMBLER-SMOKE-STEEL-SET",
products.json:11298:      "id": "kalm-home-white-cotton-bedding-set",
products.json:11299:      "brand": "KALM Home",
products.json:11300:      "brandId": "kalm-home",
products.json:11301:      "collection": "KALM Home Core",
products.json:11302:      "category": "home",
products.json:11305:      "slug": "kalm-home-white-cotton-bedding-set",
products.json:11317:      "image": "assets/images/products/kalm-home/kalm-home-white-cotton-bedding-set-main.webp",
products.json:11329:        "home",
products.json:11336:          "assets/images/products/kalm-home/kalm-home-white-cotton-bedding-set-white.webp"
products.json:11340:        "assets/images/products/kalm-home/kalm-home-white-cotton-bedding-set-main.webp",
products.json:11341:        "assets/images/products/kalm-home/kalm-home-white-cotton-bedding-set-white.webp"
products.json:11351:      "skuRoot": "KALM-HOME-WHITE-COTTON-BEDDING-SET",
products.json:11354:          "sku": "KALM-HOME-WHITE-COTTON-BEDDING-SET-WHITE-DOUBLE",
products.json:11362:          "sku": "KALM-HOME-WHITE-COTTON-BEDDING-SET-WHITE-QUEEN",
products.json:11370:          "sku": "KALM-HOME-WHITE-COTTON-BEDDING-SET-WHITE-KING",
products.json:11380:      "id": "kalm-home-charcoal-bath-towel-stack",
products.json:11381:      "brand": "KALM Home",
products.json:11382:      "brandId": "kalm-home",
products.json:11383:      "collection": "KALM Home Core",
products.json:11384:      "category": "home",
products.json:11387:      "slug": "kalm-home-charcoal-bath-towel-stack",
products.json:11397:      "image": "assets/images/products/kalm-home/kalm-home-charcoal-bath-towel-stack-main.webp",
products.json:11408:        "home",
products.json:11415:          "assets/images/products/kalm-home/kalm-home-charcoal-bath-towel-stack-charcoal.webp"
products.json:11419:        "assets/images/products/kalm-home/kalm-home-charcoal-bath-towel-stack-main.webp",
products.json:11420:        "assets/images/products/kalm-home/kalm-home-charcoal-bath-towel-stack-charcoal.webp"
products.json:11430:      "skuRoot": "KALM-HOME-CHARCOAL-BATH-TOWEL-STACK",
products.json:11433:          "sku": "KALM-HOME-CHARCOAL-BATH-TOWEL-STACK-CHARCOAL-SET",
products.json:11443:      "id": "kalm-home-ceramic-mug-pair",
products.json:11444:      "brand": "KALM Home",
products.json:11445:      "brandId": "kalm-home",
products.json:11446:      "collection": "KALM Home Core",
products.json:11447:      "category": "home",
products.json:11450:      "slug": "kalm-home-ceramic-mug-pair",
products.json:11460:      "image": "assets/images/products/kalm-home/kalm-home-ceramic-mug-pair-main.webp",
products.json:11471:        "home",
products.json:11478:          "assets/images/products/kalm-home/kalm-home-ceramic-mug-pair-black-ivory.webp"
products.json:11482:        "assets/images/products/kalm-home/kalm-home-ceramic-mug-pair-main.webp",
products.json:11483:        "assets/images/products/kalm-home/kalm-home-ceramic-mug-pair-black-ivory.webp"
products.json:11493:      "skuRoot": "KALM-HOME-CERAMIC-MUG-PAIR",
products.json:11496:          "sku": "KALM-HOME-CERAMIC-MUG-PAIR-BLACK-IVORY-PAIR",
products.json:11506:      "id": "kalm-home-woven-storage-basket",
products.json:11507:      "brand": "KALM Home",
products.json:11508:      "brandId": "kalm-home",
products.json:11509:      "collection": "KALM Home Core",
products.json:11510:      "category": "home",
products.json:11513:      "slug": "kalm-home-woven-storage-basket",
products.json:11523:      "image": "assets/images/products/kalm-home/kalm-home-woven-storage-basket-main.webp",
products.json:11534:        "home",
products.json:11541:          "assets/images/products/kalm-home/kalm-home-woven-storage-basket-natural.webp"
products.json:11545:        "assets/images/products/kalm-home/kalm-home-woven-storage-basket-main.webp",
products.json:11546:        "assets/images/products/kalm-home/kalm-home-woven-storage-basket-natural.webp"
products.json:11556:      "skuRoot": "KALM-HOME-WOVEN-STORAGE-BASKET",
products.json:11559:          "sku": "KALM-HOME-WOVEN-STORAGE-BASKET-NATURAL-ONE-SIZE",
products.json:11569:      "id": "kalm-home-black-reed-diffuser",
products.json:11570:      "brand": "KALM Home",
products.json:11571:      "brandId": "kalm-home",
products.json:11572:      "collection": "KALM Home Core",
products.json:11573:      "category": "home",
products.json:11576:      "slug": "kalm-home-black-reed-diffuser",
products.json:11586:      "image": "assets/images/products/kalm-home/kalm-home-black-reed-diffuser-main.webp",
products.json:11597:        "home",
products.json:11598:        "home-fragrance"
products.json:11604:          "assets/images/products/kalm-home/kalm-home-black-reed-diffuser-smoke-black.webp"
products.json:11608:        "assets/images/products/kalm-home/kalm-home-black-reed-diffuser-main.webp",
products.json:11609:        "assets/images/products/kalm-home/kalm-home-black-reed-diffuser-smoke-black.webp"
products.json:11619:      "skuRoot": "KALM-HOME-BLACK-REED-DIFFUSER",
products.json:11622:          "sku": "KALM-HOME-BLACK-REED-DIFFUSER-SMOKE-BLACK-ONE-SIZE",
products.json:11632:      "id": "kalm-wellness-breathe-mat",
products.json:11633:      "brand": "KALM Wellness",
products.json:11634:      "brandId": "kalm-wellness",
products.json:11635:      "collection": "KALM Wellness Core",
products.json:11636:      "category": "wellness",
products.json:11639:      "slug": "kalm-wellness-breathe-mat",
products.json:11651:      "image": "assets/images/products/kalm-wellness/breathe-mat-v2/sand/front.webp",
products.json:11663:        "wellness",
products.json:11670:        "Sand": "assets/images/products/kalm-wellness/breathe-mat-v2/sand/front.webp",
products.json:11671:        "Stone": "assets/images/products/kalm-wellness/breathe-mat-v2/stone/front.webp",
products.json:11672:        "Sage": "assets/images/products/kalm-wellness/breathe-mat-v2/sage/front.webp"
products.json:11675:        "assets/images/products/kalm-wellness/breathe-mat-v2/sand/front.webp",
products.json:11676:        "assets/images/products/kalm-wellness/breathe-mat-v2/sand/angle.webp",
products.json:11677:        "assets/images/products/kalm-wellness/breathe-mat-v2/sand/detail.webp",
products.json:11678:        "assets/images/products/kalm-wellness/breathe-mat-v2/sand/lifestyle.webp",
products.json:11679:        "assets/images/products/kalm-wellness/breathe-mat-v2/stone/front.webp",
products.json:11680:        "assets/images/products/kalm-wellness/breathe-mat-v2/stone/angle.webp",
products.json:11681:        "assets/images/products/kalm-wellness/breathe-mat-v2/stone/detail.webp",
products.json:11682:        "assets/images/products/kalm-wellness/breathe-mat-v2/stone/lifestyle.webp",
products.json:11683:        "assets/images/products/kalm-wellness/breathe-mat-v2/sage/front.webp",
products.json:11684:        "assets/images/products/kalm-wellness/breathe-mat-v2/sage/angle.webp",
products.json:11685:        "assets/images/products/kalm-wellness/breathe-mat-v2/sage/detail.webp",
products.json:11686:        "assets/images/products/kalm-wellness/breathe-mat-v2/sage/lifestyle.webp"
products.json:11696:      "skuRoot": "KALM-WELLNESS-BREATHE-MAT",
products.json:11699:          "sku": "KALM-WELLNESS-BREATHE-MAT-SAND-ONE-SIZE",
products.json:11707:          "sku": "KALM-WELLNESS-BREATHE-MAT-STONE-ONE-SIZE",
products.json:11715:          "sku": "KALM-WELLNESS-BREATHE-MAT-SAGE-ONE-SIZE",
products.json:11725:      "id": "kalm-wellness-restore-towel",
products.json:11726:      "brand": "KALM Wellness",
products.json:11727:      "brandId": "kalm-wellness",
products.json:11728:      "collection": "KALM Wellness Core",
products.json:11729:      "category": "wellness",
products.json:11732:      "slug": "kalm-wellness-restore-towel",
products.json:11744:      "image": "assets/images/products/kalm-wellness/restore-towel-v2/oat/front.webp",
products.json:11745:      "description": "A soft wellness towel for studio sessions, recovery routines and calm daily use.",
products.json:11751:      "fitNotes": "One size wellness towel.",
products.json:11756:        "wellness",
products.json:11763:        "Oat": "assets/images/products/kalm-wellness/restore-towel-v2/oat/front.webp",
products.json:11764:        "Charcoal": "assets/images/products/kalm-wellness/restore-towel-v2/charcoal/front.webp",
products.json:11765:        "Dusty Rose": "assets/images/products/kalm-wellness/restore-towel-v2/dusty-rose/front.webp"
products.json:11768:        "assets/images/products/kalm-wellness/restore-towel-v2/oat/front.webp",
products.json:11769:        "assets/images/products/kalm-wellness/restore-towel-v2/oat/angle.webp",
products.json:11770:        "assets/images/products/kalm-wellness/restore-towel-v2/oat/detail.webp",
products.json:11771:        "assets/images/products/kalm-wellness/restore-towel-v2/oat/lifestyle.webp",
products.json:11772:        "assets/images/products/kalm-wellness/restore-towel-v2/charcoal/front.webp",
products.json:11773:        "assets/images/products/kalm-wellness/restore-towel-v2/charcoal/angle.webp",
products.json:11774:        "assets/images/products/kalm-wellness/restore-towel-v2/charcoal/detail.webp",
products.json:11775:        "assets/images/products/kalm-wellness/restore-towel-v2/charcoal/lifestyle.webp",
products.json:11776:        "assets/images/products/kalm-wellness/restore-towel-v2/dusty-rose/front.webp",
products.json:11777:        "assets/images/products/kalm-wellness/restore-towel-v2/dusty-rose/angle.webp",
products.json:11778:        "assets/images/products/kalm-wellness/restore-towel-v2/dusty-rose/detail.webp",
products.json:11779:        "assets/images/products/kalm-wellness/restore-towel-v2/dusty-rose/lifestyle.webp"
products.json:11789:      "skuRoot": "KALM-WELLNESS-RESTORE-TOWEL",
products.json:11792:          "sku": "KALM-WELLNESS-RESTORE-TOWEL-OAT-ONE-SIZE",
products.json:11800:          "sku": "KALM-WELLNESS-RESTORE-TOWEL-CHARCOAL-ONE-SIZE",
products.json:11808:          "sku": "KALM-WELLNESS-RESTORE-TOWEL-DUSTY-ROSE-ONE-SIZE",
products.json:11818:      "id": "kalm-wellness-ground-bottle",
products.json:11819:      "brand": "KALM Wellness",
products.json:11820:      "brandId": "kalm-wellness",
products.json:11821:      "collection": "KALM Wellness Core",
products.json:11822:      "category": "wellness",
products.json:11825:      "slug": "kalm-wellness-ground-bottle",
products.json:11837:      "image": "assets/images/products/kalm-wellness/ground-bottle-v2/soft-white/front.webp",
products.json:11849:        "wellness",
products.json:11855:        "Soft White": "assets/images/products/kalm-wellness/ground-bottle-v2/soft-white/front.webp",
products.json:11856:        "Olive": "assets/images/products/kalm-wellness/ground-bottle-v2/olive/front.webp",
products.json:11857:        "Black": "assets/images/products/kalm-wellness/ground-bottle-v2/black/front.webp"
products.json:11860:        "assets/images/products/kalm-wellness/ground-bottle-v2/soft-white/front.webp",
products.json:11861:        "assets/images/products/kalm-wellness/ground-bottle-v2/soft-white/angle.webp",
products.json:11862:        "assets/images/products/kalm-wellness/ground-bottle-v2/soft-white/detail.webp",
products.json:11863:        "assets/images/products/kalm-wellness/ground-bottle-v2/soft-white/lifestyle.webp",
products.json:11864:        "assets/images/products/kalm-wellness/ground-bottle-v2/olive/front.webp",
products.json:11865:        "assets/images/products/kalm-wellness/ground-bottle-v2/olive/angle.webp",
products.json:11866:        "assets/images/products/kalm-wellness/ground-bottle-v2/olive/detail.webp",
products.json:11867:        "assets/images/products/kalm-wellness/ground-bottle-v2/olive/lifestyle.webp",
products.json:11868:        "assets/images/products/kalm-wellness/ground-bottle-v2/black/front.webp",
products.json:11869:        "assets/images/products/kalm-wellness/ground-bottle-v2/black/angle.webp",
products.json:11870:        "assets/images/products/kalm-wellness/ground-bottle-v2/black/detail.webp",
products.json:11871:        "assets/images/products/kalm-wellness/ground-bottle-v2/black/lifestyle.webp"
products.json:11881:      "skuRoot": "KALM-WELLNESS-GROUND-BOTTLE",
products.json:11884:          "sku": "KALM-WELLNESS-GROUND-BOTTLE-SOFT-WHITE-750ML",
products.json:11892:          "sku": "KALM-WELLNESS-GROUND-BOTTLE-OLIVE-750ML",
products.json:11900:          "sku": "KALM-WELLNESS-GROUND-BOTTLE-BLACK-750ML",
products.json:11910:      "id": "kalm-wellness-pause-journal",
products.json:11911:      "brand": "KALM Wellness",
products.json:11912:      "brandId": "kalm-wellness",
products.json:11913:      "collection": "KALM Wellness Core",
products.json:11914:      "category": "wellness",
products.json:11917:      "slug": "kalm-wellness-pause-journal",
products.json:11929:      "image": "assets/images/products/kalm-wellness/pause-journal-v2/oat/front.webp",
products.json:11930:      "description": "A simple wellness journal for reflection, planning and slower daily rituals.",
products.json:11941:        "wellness",
products.json:11947:        "Oat": "assets/images/products/kalm-wellness/pause-journal-v2/oat/front.webp",
products.json:11948:        "Charcoal": "assets/images/products/kalm-wellness/pause-journal-v2/charcoal/front.webp",
products.json:11949:        "Blush": "assets/images/products/kalm-wellness/pause-journal-v2/blush/front.webp"
products.json:11952:        "assets/images/products/kalm-wellness/pause-journal-v2/oat/front.webp",
products.json:11953:        "assets/images/products/kalm-wellness/pause-journal-v2/oat/angle.webp",
products.json:11954:        "assets/images/products/kalm-wellness/pause-journal-v2/oat/detail.webp",
products.json:11955:        "assets/images/products/kalm-wellness/pause-journal-v2/oat/lifestyle.webp",
products.json:11956:        "assets/images/products/kalm-wellness/pause-journal-v2/charcoal/front.webp",
products.json:11957:        "assets/images/products/kalm-wellness/pause-journal-v2/charcoal/angle.webp",
products.json:11958:        "assets/images/products/kalm-wellness/pause-journal-v2/charcoal/detail.webp",
products.json:11959:        "assets/images/products/kalm-wellness/pause-journal-v2/charcoal/lifestyle.webp",
products.json:11960:        "assets/images/products/kalm-wellness/pause-journal-v2/blush/front.webp",
products.json:11961:        "assets/images/products/kalm-wellness/pause-journal-v2/blush/angle.webp",
products.json:11962:        "assets/images/products/kalm-wellness/pause-journal-v2/blush/detail.webp",
products.json:11963:        "assets/images/products/kalm-wellness/pause-journal-v2/blush/lifestyle.webp"
products.json:11973:      "skuRoot": "KALM-WELLNESS-PAUSE-JOURNAL",
products.json:11976:          "sku": "KALM-WELLNESS-PAUSE-JOURNAL-OAT-A5",
products.json:11984:          "sku": "KALM-WELLNESS-PAUSE-JOURNAL-CHARCOAL-A5",
products.json:11992:          "sku": "KALM-WELLNESS-PAUSE-JOURNAL-BLUSH-A5",
products.json:12002:      "id": "kalm-wellness-ritual-set",
products.json:12003:      "brand": "KALM Wellness",
products.json:12004:      "brandId": "kalm-wellness",
products.json:12005:      "collection": "KALM Wellness Core",
products.json:12006:      "category": "wellness",
products.json:12007:      "type": "Wellness set",
products.json:12009:      "slug": "kalm-wellness-ritual-set",
products.json:12021:      "image": "assets/images/products/kalm-wellness/ritual-set-v2/natural-oat/front.webp",
products.json:12026:        "Neutral premium wellness finish"
products.json:12028:      "fitNotes": "Wellness set.",
products.json:12029:      "fabric": "Mixed wellness accessories in soft textile, matte bottle and natural-feel components.",
products.json:12033:        "wellness",
products.json:12040:        "Natural Oat": "assets/images/products/kalm-wellness/ritual-set-v2/natural-oat/front.webp",
products.json:12041:        "Sage": "assets/images/products/kalm-wellness/ritual-set-v2/sage/front.webp",
products.json:12042:        "Charcoal": "assets/images/products/kalm-wellness/ritual-set-v2/charcoal/front.webp"
products.json:12045:        "assets/images/products/kalm-wellness/ritual-set-v2/natural-oat/front.webp",
products.json:12046:        "assets/images/products/kalm-wellness/ritual-set-v2/natural-oat/angle.webp",
products.json:12047:        "assets/images/products/kalm-wellness/ritual-set-v2/natural-oat/detail.webp",
products.json:12048:        "assets/images/products/kalm-wellness/ritual-set-v2/natural-oat/lifestyle.webp",
products.json:12049:        "assets/images/products/kalm-wellness/ritual-set-v2/sage/front.webp",
products.json:12050:        "assets/images/products/kalm-wellness/ritual-set-v2/sage/angle.webp",
products.json:12051:        "assets/images/products/kalm-wellness/ritual-set-v2/sage/detail.webp",
products.json:12052:        "assets/images/products/kalm-wellness/ritual-set-v2/sage/lifestyle.webp",
products.json:12053:        "assets/images/products/kalm-wellness/ritual-set-v2/charcoal/front.webp",
products.json:12054:        "assets/images/products/kalm-wellness/ritual-set-v2/charcoal/angle.webp",
products.json:12055:        "assets/images/products/kalm-wellness/ritual-set-v2/charcoal/detail.webp",
products.json:12056:        "assets/images/products/kalm-wellness/ritual-set-v2/charcoal/lifestyle.webp"
products.json:12066:      "skuRoot": "KALM-WELLNESS-RITUAL-SET",
products.json:12069:          "sku": "KALM-WELLNESS-RITUAL-SET-NATURAL-OAT-SET",
products.json:12077:          "sku": "KALM-WELLNESS-RITUAL-SET-SAGE-SET",
products.json:12085:          "sku": "KALM-WELLNESS-RITUAL-SET-CHARCOAL-SET",
products.json:12095:      "id": "kalm-wellness-align-block-set",
products.json:12096:      "brand": "KALM Wellness",
products.json:12097:      "brandId": "kalm-wellness",
products.json:12098:      "collection": "KALM Wellness Core",
products.json:12099:      "category": "wellness",
products.json:12102:      "slug": "kalm-wellness-align-block-set",
products.json:12114:      "image": "assets/images/products/kalm-wellness/align-block-set-v2/natural-cork/front.webp",
products.json:12126:        "wellness",
products.json:12133:        "Natural Cork": "assets/images/products/kalm-wellness/align-block-set-v2/natural-cork/front.webp",
products.json:12134:        "Sage": "assets/images/products/kalm-wellness/align-block-set-v2/sage/front.webp",
products.json:12135:        "Charcoal": "assets/images/products/kalm-wellness/align-block-set-v2/charcoal/front.webp"
products.json:12138:        "assets/images/products/kalm-wellness/align-block-set-v2/natural-cork/front.webp",
products.json:12139:        "assets/images/products/kalm-wellness/align-block-set-v2/natural-cork/angle.webp",
products.json:12140:        "assets/images/products/kalm-wellness/align-block-set-v2/natural-cork/detail.webp",
products.json:12141:        "assets/images/products/kalm-wellness/align-block-set-v2/natural-cork/lifestyle.webp",
products.json:12142:        "assets/images/products/kalm-wellness/align-block-set-v2/sage/front.webp",
products.json:12143:        "assets/images/products/kalm-wellness/align-block-set-v2/sage/angle.webp",
products.json:12144:        "assets/images/products/kalm-wellness/align-block-set-v2/sage/detail.webp",
products.json:12145:        "assets/images/products/kalm-wellness/align-block-set-v2/sage/lifestyle.webp",
products.json:12146:        "assets/images/products/kalm-wellness/align-block-set-v2/charcoal/front.webp",
products.json:12147:        "assets/images/products/kalm-wellness/align-block-set-v2/charcoal/angle.webp",
products.json:12148:        "assets/images/products/kalm-wellness/align-block-set-v2/charcoal/detail.webp",
products.json:12149:        "assets/images/products/kalm-wellness/align-block-set-v2/charcoal/lifestyle.webp"
products.json:12159:      "skuRoot": "KALM-WELLNESS-ALIGN-BLOCK-SET",
products.json:12162:          "sku": "KALM-WELLNESS-ALIGN-BLOCK-SET-NATURAL-CORK-SET-OF-2",
products.json:12170:          "sku": "KALM-WELLNESS-ALIGN-BLOCK-SET-SAGE-SET-OF-2",
products.json:12178:          "sku": "KALM-WELLNESS-ALIGN-BLOCK-SET-CHARCOAL-SET-OF-2",
products.json:12188:      "id": "kalm-wellness-ease-strap",
products.json:12189:      "brand": "KALM Wellness",
products.json:12190:      "brandId": "kalm-wellness",
products.json:12191:      "collection": "KALM Wellness Core",
products.json:12192:      "category": "wellness",
products.json:12195:      "slug": "kalm-wellness-ease-strap",
products.json:12207:      "image": "assets/images/products/kalm-wellness/ease-strap-v2/oat/front.webp",
products.json:12219:        "wellness",
products.json:12226:        "Oat": "assets/images/products/kalm-wellness/ease-strap-v2/oat/front.webp",
products.json:12227:        "Sage": "assets/images/products/kalm-wellness/ease-strap-v2/sage/front.webp",
products.json:12228:        "Charcoal": "assets/images/products/kalm-wellness/ease-strap-v2/charcoal/front.webp"
products.json:12231:        "assets/images/products/kalm-wellness/ease-strap-v2/oat/front.webp",
products.json:12232:        "assets/images/products/kalm-wellness/ease-strap-v2/oat/angle.webp",
products.json:12233:        "assets/images/products/kalm-wellness/ease-strap-v2/oat/detail.webp",
products.json:12234:        "assets/images/products/kalm-wellness/ease-strap-v2/oat/lifestyle.webp",
products.json:12235:        "assets/images/products/kalm-wellness/ease-strap-v2/sage/front.webp",
products.json:12236:        "assets/images/products/kalm-wellness/ease-strap-v2/sage/angle.webp",
products.json:12237:        "assets/images/products/kalm-wellness/ease-strap-v2/sage/detail.webp",
products.json:12238:        "assets/images/products/kalm-wellness/ease-strap-v2/sage/lifestyle.webp",
products.json:12239:        "assets/images/products/kalm-wellness/ease-strap-v2/charcoal/front.webp",
products.json:12240:        "assets/images/products/kalm-wellness/ease-strap-v2/charcoal/angle.webp",
products.json:12241:        "assets/images/products/kalm-wellness/ease-strap-v2/charcoal/detail.webp",
products.json:12242:        "assets/images/products/kalm-wellness/ease-strap-v2/charcoal/lifestyle.webp"
products.json:12252:      "skuRoot": "KALM-WELLNESS-EASE-STRAP",
products.json:12255:          "sku": "KALM-WELLNESS-EASE-STRAP-OAT-ONE-SIZE",
products.json:12263:          "sku": "KALM-WELLNESS-EASE-STRAP-SAGE-ONE-SIZE",
products.json:12271:          "sku": "KALM-WELLNESS-EASE-STRAP-CHARCOAL-ONE-SIZE",
products.json:12281:      "id": "kalm-wellness-centre-pouch",
products.json:12282:      "brand": "KALM Wellness",
products.json:12283:      "brandId": "kalm-wellness",
products.json:12284:      "collection": "KALM Wellness Core",
products.json:12285:      "category": "wellness",
products.json:12288:      "slug": "kalm-wellness-centre-pouch",
products.json:12300:      "image": "assets/images/products/kalm-wellness/centre-pouch-v2/oat/front.webp",
products.json:12301:      "description": "A softly structured pouch for carrying small wellness pieces, studio accessories and daily essentials.",
products.json:12305:        "Compact wellness carry size"
products.json:12312:        "wellness",
products.json:12319:        "Oat": "assets/images/products/kalm-wellness/centre-pouch-v2/oat/front.webp",
products.json:12320:        "Sage": "assets/images/products/kalm-wellness/centre-pouch-v2/sage/front.webp",
products.json:12321:        "Charcoal": "assets/images/products/kalm-wellness/centre-pouch-v2/charcoal/front.webp"
products.json:12324:        "assets/images/products/kalm-wellness/centre-pouch-v2/oat/front.webp",
products.json:12325:        "assets/images/products/kalm-wellness/centre-pouch-v2/oat/angle.webp",
products.json:12326:        "assets/images/products/kalm-wellness/centre-pouch-v2/oat/detail.webp",
products.json:12327:        "assets/images/products/kalm-wellness/centre-pouch-v2/oat/lifestyle.webp",
products.json:12328:        "assets/images/products/kalm-wellness/centre-pouch-v2/sage/front.webp",
products.json:12329:        "assets/images/products/kalm-wellness/centre-pouch-v2/sage/angle.webp",
products.json:12330:        "assets/images/products/kalm-wellness/centre-pouch-v2/sage/detail.webp",
products.json:12331:        "assets/images/products/kalm-wellness/centre-pouch-v2/sage/lifestyle.webp",
products.json:12332:        "assets/images/products/kalm-wellness/centre-pouch-v2/charcoal/front.webp",
products.json:12333:        "assets/images/products/kalm-wellness/centre-pouch-v2/charcoal/angle.webp",
products.json:12334:        "assets/images/products/kalm-wellness/centre-pouch-v2/charcoal/detail.webp",
products.json:12335:        "assets/images/products/kalm-wellness/centre-pouch-v2/charcoal/lifestyle.webp"
products.json:12345:      "skuRoot": "KALM-WELLNESS-CENTRE-POUCH",
products.json:12348:          "sku": "KALM-WELLNESS-CENTRE-POUCH-OAT-ONE-SIZE",
products.json:12356:          "sku": "KALM-WELLNESS-CENTRE-POUCH-SAGE-ONE-SIZE",
products.json:12364:          "sku": "KALM-WELLNESS-CENTRE-POUCH-CHARCOAL-ONE-SIZE",
products.json:12374:      "id": "kalm-outdoor-ember-launch-pro-perforated-peel",
products.json:12375:      "brand": "KALM Outdoor",
products.json:12376:      "brandId": "kalm-outdoor",
products.json:12377:      "collection": "KALM Outdoor Accessories",
products.json:12378:      "category": "outdoor",
products.json:12381:      "slug": "kalm-outdoor-ember-launch-pro-perforated-peel",
products.json:12397:        "outdoor",
products.json:12398:        "outdoor-accessories",
products.json:12412:        "kalm-outdoor-ember-16-gas-pizza-oven"
products.json:12420:      "id": "kalm-outdoor-ember-turn-pro-turning-peel",
products.json:12421:      "brand": "KALM Outdoor",
products.json:12422:      "brandId": "kalm-outdoor",
products.json:12423:      "collection": "KALM Outdoor Accessories",
products.json:12424:      "category": "outdoor",
products.json:12427:      "slug": "kalm-outdoor-ember-turn-pro-turning-peel",
products.json:12443:        "outdoor",
products.json:12444:        "outdoor-accessories",
products.json:12458:        "kalm-outdoor-ember-16-gas-pizza-oven"
products.json:12466:      "id": "kalm-outdoor-ember-dough-and-heat-kit",
products.json:12467:      "brand": "KALM Outdoor",
products.json:12468:      "brandId": "kalm-outdoor",
products.json:12469:      "collection": "KALM Outdoor Accessories",
products.json:12470:      "category": "outdoor",
products.json:12473:      "slug": "kalm-outdoor-ember-dough-and-heat-kit",
products.json:12489:        "outdoor",
products.json:12490:        "outdoor-accessories",
products.json:12504:        "kalm-outdoor-ember-16-gas-pizza-oven"
products.json:12512:      "id": "kalm-outdoor-ridge-smart-temperature-system",
products.json:12513:      "brand": "KALM Outdoor",
products.json:12514:      "brandId": "kalm-outdoor",
products.json:12515:      "collection": "KALM Outdoor Accessories",
products.json:12516:      "category": "outdoor",
products.json:12519:      "slug": "kalm-outdoor-ridge-smart-temperature-system",
products.json:12535:        "outdoor",
products.json:12536:        "outdoor-accessories",
products.json:12550:        "kalm-outdoor-ridge-4-stainless-gas-braai"
products.json:12558:      "id": "kalm-outdoor-ridge-pro-rotisserie-kit",
products.json:12559:      "brand": "KALM Outdoor",
products.json:12560:      "brandId": "kalm-outdoor",
products.json:12561:      "collection": "KALM Outdoor Accessories",
products.json:12562:      "category": "outdoor",
products.json:12565:      "slug": "kalm-outdoor-ridge-pro-rotisserie-kit",
products.json:12581:        "outdoor",
products.json:12582:        "outdoor-accessories",
products.json:12596:        "kalm-outdoor-ridge-4-stainless-gas-braai"
products.json:12604:      "id": "kalm-outdoor-ridge-cast-iron-sear-system",
products.json:12605:      "brand": "KALM Outdoor",
products.json:12606:      "brandId": "kalm-outdoor",
products.json:12607:      "collection": "KALM Outdoor Accessories",
products.json:12608:      "category": "outdoor",
products.json:12611:      "slug": "kalm-outdoor-ridge-cast-iron-sear-system",
products.json:12627:        "outdoor",
products.json:12628:        "outdoor-accessories",
products.json:12642:        "kalm-outdoor-ridge-4-stainless-gas-braai"
products.json:12650:      "id": "kalm-outdoor-forge-pro-griddle-tool-roll",
products.json:12651:      "brand": "KALM Outdoor",
products.json:12652:      "brandId": "kalm-outdoor",
products.json:12653:      "collection": "KALM Outdoor Accessories",
products.json:12654:      "category": "outdoor",
products.json:12657:      "slug": "kalm-outdoor-forge-pro-griddle-tool-roll",
products.json:12662:      "description": "A coming-soon Forge 2 tool roll for outdoor griddle routines. Final contents and photography are in production.",
products.json:12673:        "outdoor",
products.json:12674:        "outdoor-accessories",
products.json:12688:        "kalm-outdoor-forge-2-portable-gas-griddle"
products.json:12696:      "id": "kalm-outdoor-forge-smash-and-steam-kit",
products.json:12697:      "brand": "KALM Outdoor",
products.json:12698:      "brandId": "kalm-outdoor",
products.json:12699:      "collection": "KALM Outdoor Accessories",
products.json:12700:      "category": "outdoor",
products.json:12703:      "slug": "kalm-outdoor-forge-smash-and-steam-kit",
products.json:12719:        "outdoor",
products.json:12720:        "outdoor-accessories",
products.json:12734:        "kalm-outdoor-forge-2-portable-gas-griddle"
products.json:12742:      "id": "kalm-outdoor-forge-season-and-care-kit",
products.json:12743:      "brand": "KALM Outdoor",
products.json:12744:      "brandId": "kalm-outdoor",
products.json:12745:      "collection": "KALM Outdoor Accessories",
products.json:12746:      "category": "outdoor",
products.json:12749:      "slug": "kalm-outdoor-forge-season-and-care-kit",
products.json:12765:        "outdoor",
products.json:12766:        "outdoor-accessories",
products.json:12780:        "kalm-outdoor-forge-2-portable-gas-griddle"
products.json:15398:      "id": "kalm-outdoor-ember-essential",
products.json:15401:      "compatibleAppliance": "kalm-outdoor-ember-16-gas-pizza-oven",
products.json:15403:        "kalm-outdoor-ember-launch-pro-perforated-peel",
products.json:15404:        "kalm-outdoor-ember-turn-pro-turning-peel"
products.json:15409:      "id": "kalm-outdoor-pizza-night",
products.json:15412:      "compatibleAppliance": "kalm-outdoor-ember-16-gas-pizza-oven",
products.json:15414:        "kalm-outdoor-ember-launch-pro-perforated-peel",
products.json:15415:        "kalm-outdoor-ember-turn-pro-turning-peel",
products.json:15416:        "kalm-outdoor-ember-dough-and-heat-kit"
products.json:15421:      "id": "kalm-outdoor-ridge-precision",
products.json:15424:      "compatibleAppliance": "kalm-outdoor-ridge-4-stainless-gas-braai",
products.json:15426:        "kalm-outdoor-ridge-smart-temperature-system",
products.json:15427:        "kalm-outdoor-ridge-cast-iron-sear-system"
products.json:15432:      "id": "kalm-outdoor-ridge-host",
products.json:15435:      "compatibleAppliance": "kalm-outdoor-ridge-4-stainless-gas-braai",
products.json:15437:        "kalm-outdoor-ridge-pro-rotisserie-kit",
products.json:15438:        "kalm-outdoor-ridge-cast-iron-sear-system"
products.json:15443:      "id": "kalm-outdoor-forge-essential",
products.json:15446:      "compatibleAppliance": "kalm-outdoor-forge-2-portable-gas-griddle",
products.json:15448:        "kalm-outdoor-forge-pro-griddle-tool-roll",
products.json:15449:        "kalm-outdoor-forge-season-and-care-kit"
products.json:15454:      "id": "kalm-outdoor-forge-burger",
products.json:15457:      "compatibleAppliance": "kalm-outdoor-forge-2-portable-gas-griddle",
products.json:15459:        "kalm-outdoor-forge-pro-griddle-tool-roll",
products.json:15460:        "kalm-outdoor-forge-smash-and-steam-kit"
```
