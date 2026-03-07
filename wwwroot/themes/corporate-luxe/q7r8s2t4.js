(() => {
  const site = document.body.dataset.site || "b";
  const cacheKey = `catalog_cache_${site}_v1`;
  const fallbackPool = Array.isArray(window.CATALOG_IMAGE_FALLBACKS)
    ? window.CATALOG_IMAGE_FALLBACKS
    : [];

  const qEl = document.getElementById("q");
  const sortEl = document.getElementById("sort");
  const viewEl = document.getElementById("view");
  const refreshBtn = document.getElementById("refresh");
  const statusEl = document.getElementById("status");
  const countEl = document.getElementById("count");
  const workspace = document.getElementById("workspace");

  let all = [];
  const forceMock = new URLSearchParams(window.location.search).get("mock") === "1";

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function toDigits(value) {
    return String(value ?? "").replace(/\D/g, "");
  }

  function money(value) {
    const digits = toDigits(value);
    if (!digits) return "KRW -";
    return "KRW " + Number(digits).toLocaleString("ko-KR");
  }

  function pickFallbackImage() {
    if (typeof window.randomCatalogFallback === "function") {
      return window.randomCatalogFallback();
    }
    if (!fallbackPool.length) return "";
    return fallbackPool[Math.floor(Math.random() * fallbackPool.length)];
  }

  function getSafeImage(url) {
    const raw = String(url ?? "").trim();
    if (!raw) return pickFallbackImage();
    try {
      // Validate absolute or relative URL
      new URL(raw, window.location.origin);
      return raw;
    } catch {
      return pickFallbackImage();
    }
  }

  function bindImageFallbacks() {
    workspace.querySelectorAll("img[data-product-image]").forEach((img) => {
      if (img.dataset.fallbackBound === "1") return;
      img.dataset.fallbackBound = "1";

      img.addEventListener("error", () => {
        const next = pickFallbackImage();
        if (!next) return;
        if (img.dataset.fallbackApplied === "1" && img.src === next) return;
        img.dataset.fallbackApplied = "1";
        img.src = next;
      });
    });
  }

  function normalize(p) {
    return {
      id: p.id ?? p.Id ?? 0,
      imageUrl: p.imageUrl ?? p.ImageUrl ?? "",
      linkUrl: p.linkUrl ?? p.LinkUrl ?? "",
      cost: p.cost ?? p.Cost ?? "",
      text: p.text ?? p.Text ?? ""
    };
  }

  function sorted(items, mode) {
    const arr = items.slice();
    arr.sort((a, b) => (mode === "old" ? a.id - b.id : b.id - a.id));
    return arr;
  }

  function filtered() {
    const q = (qEl.value || "").trim().toLowerCase();
    const mode = sortEl.value || "new";
    let items = sorted(all, mode);

    if (q) {
      items = items.filter((p) =>
        String(p.text).toLowerCase().includes(q) ||
        String(p.cost).toLowerCase().includes(q)
      );
    }

    return items;
  }

  function animateCards() {
    const targets = workspace.querySelectorAll(".card, .row-item");
    if (!targets.length) return;

    if (window.anime && typeof window.anime === "function") {
      window.anime({
        targets,
        opacity: [0, 1],
        translateY: [12, 0],
        duration: 360,
        easing: "easeOutQuad",
        delay: window.anime.stagger(35)
      });
      return;
    }

    targets.forEach((el) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(8px)";
      requestAnimationFrame(() => {
        el.style.transition = "opacity 260ms ease, transform 260ms ease";
        el.style.opacity = "1";
        el.style.transform = "none";
      });
    });
  }

  function renderGrid(items) {
    if (!items.length) {
      workspace.innerHTML = "<div class='empty'>No products found.</div>";
      return;
    }

    workspace.innerHTML = `<div class="grid">${
      items.map((p) => `
        <article class="card">
          <div class="media">
            <img data-product-image="1" src="${esc(getSafeImage(p.imageUrl))}" alt="product" loading="lazy" decoding="async" />
          </div>
          <div class="body">
            <span class="price">${esc(money(p.cost))}</span>
            <p class="desc">${esc(p.text)}</p>
            <a class="link" href="${esc(p.linkUrl)}" target="_blank" rel="noopener">Open Brief</a>
          </div>
        </article>
      `).join("")
    }</div>`;

    bindImageFallbacks();
    animateCards();
  }

  function renderList(items) {
    if (!items.length) {
      workspace.innerHTML = "<div class='empty'>No products found.</div>";
      return;
    }

    workspace.innerHTML = `<div class="list">${
      items.map((p) => `
        <article class="row-item">
          <img class="thumb" data-product-image="1" src="${esc(getSafeImage(p.imageUrl))}" alt="thumb" loading="lazy" decoding="async" />
          <div class="row-text">
            <p>${esc(p.text)}</p>
            <div class="row-meta">
              <span>${esc(money(p.cost))}</span>
              <span>ID ${p.id}</span>
            </div>
          </div>
          <a class="link" href="${esc(p.linkUrl)}" target="_blank" rel="noopener">Open</a>
        </article>
      `).join("")
    }</div>`;

    bindImageFallbacks();
    animateCards();
  }

  function render() {
    const items = filtered();
    countEl.textContent = String(items.length);
    statusEl.textContent = "Loaded";
    statusEl.className = "status-ok";

    if ((viewEl.value || "grid") === "list") renderList(items);
    else renderGrid(items);
  }

  function revealUi() {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("ready"));
  }

  function getMock() {
    return Array.isArray(window.CATALOG_MOCK_DATA?.[site])
      ? window.CATALOG_MOCK_DATA[site].map(normalize)
      : [];
  }

  function saveCache(items) {
    try {
      localStorage.setItem(cacheKey, JSON.stringify({
        ts: Date.now(),
        items
      }));
    } catch {
      // ignore quota errors
    }
  }

  function loadCache() {
    try {
      const raw = localStorage.getItem(cacheKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || !Array.isArray(parsed.items)) return null;
      return parsed.items.map(normalize);
    } catch {
      return null;
    }
  }

  async function loadRemote() {
    statusEl.textContent = "Syncing...";
    statusEl.className = "";

    const res = await fetch(`/api/products?site=${encodeURIComponent(site)}`, {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || `HTTP ${res.status}`);
    }

    const data = await res.json();
    all = Array.isArray(data) ? data.map(normalize) : [];
    saveCache(all);
    render();
  }

  async function load() {
    if (forceMock) {
      all = getMock();
      render();
      statusEl.textContent = all.length ? "Loaded (mock)" : "Load error";
      statusEl.className = all.length ? "status-ok" : "status-error";
      return;
    }

    const cached = loadCache();
    if (cached && cached.length) {
      all = cached;
      statusEl.textContent = "Loaded (cached)";
      statusEl.className = "status-ok";
      render();
    } else {
      statusEl.textContent = "Loading...";
      statusEl.className = "";
    }

    try {
      await loadRemote();
    } catch {
      if (!all.length) {
        workspace.innerHTML = "<div class='empty'>Failed to load products.</div>";
        countEl.textContent = "0";
      }
      statusEl.textContent = "Load error";
      statusEl.className = "status-error";
    }
  }

  qEl.addEventListener("input", render);
  sortEl.addEventListener("change", render);
  viewEl.addEventListener("change", render);
  refreshBtn.addEventListener("click", loadRemote);

  revealUi();
  load();
})();
