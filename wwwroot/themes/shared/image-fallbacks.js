(() => {
  const FALLBACKS = Array.from({ length: 20 }, (_, i) =>
    `https://picsum.photos/seed/catalog-fallback-${i + 1}/960/720`
  );

  function randomCatalogFallback() {
    if (!FALLBACKS.length) return "";
    return FALLBACKS[Math.floor(Math.random() * FALLBACKS.length)];
  }

  window.CATALOG_IMAGE_FALLBACKS = FALLBACKS;
  window.randomCatalogFallback = randomCatalogFallback;
})();
