(() => {
  const path = window.location.pathname.replace(/\/+$/, "") || "/";
  const hash = window.location.hash.replace(/^#/, "");
  const isHome = (path === "/" || path === "/index.html") && (!hash || hash === "/");
  document.documentElement.dataset.initialRoute = isHome ? "home" : "non-home";
  document.documentElement.dataset.routeRendered = "false";
  if (!isHome) return;

  [
    ["(max-width: 640px)", "assets/images/recovered/campaigns-v3/kalm-hero-six-person-v3-mobile-perf-20260715.webp"],
    ["(min-width: 641px) and (max-width: 1100px)", "assets/images/recovered/campaigns-v3/kalm-hero-six-person-v3-tablet-perf-20260715.webp"],
    ["(min-width: 1101px)", "assets/images/recovered/campaigns-v3/kalm-hero-six-person-v3-desktop-perf-20260715.webp"]
  ].forEach(([media, href]) => {
    const link = document.createElement("link");
    link.rel = "preload";
    link.as = "image";
    link.href = href;
    link.media = media;
    link.fetchPriority = "high";
    document.head.appendChild(link);
  });
})();
