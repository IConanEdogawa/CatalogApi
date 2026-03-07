(() => {
  const site = "c";
  const qEl = document.getElementById("q");
  const sortEl = document.getElementById("sort");
  const viewEl = document.getElementById("view");
  const refreshBtn = document.getElementById("refresh");
  const statusEl = document.getElementById("status");
  const countEl = document.getElementById("count");
  const workspace = document.getElementById("workspace");
  const fallbackPool = Array.isArray(window.CATALOG_IMAGE_FALLBACKS)
    ? window.CATALOG_IMAGE_FALLBACKS
    : [];
  const forceMock = new URLSearchParams(window.location.search).get("mock") === "1";

  let all = [];

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;");
  }

  function toDigits(input) {
    return String(input ?? "").replace(/\D/g, "");
  }

  function formatKrw(input) {
    const digits = toDigits(input);
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
    const query = (qEl.value || "").trim().toLowerCase();
    const mode = sortEl.value || "new";
    let items = sorted(all, mode);

    if (query) {
      items = items.filter((p) =>
        String(p.text).toLowerCase().includes(query) ||
        String(p.cost).toLowerCase().includes(query)
      );
    }
    return items;
  }

  function getMock() {
    return Array.isArray(window.CATALOG_MOCK_DATA?.[site])
      ? window.CATALOG_MOCK_DATA[site].map(normalize)
      : [];
  }

  function renderCabinet(items) {
    if (!items.length) {
      workspace.innerHTML = "<div class='empty'>No products to display.</div>";
      return;
    }

    workspace.innerHTML = "<div class='grid'>" + items.map((p) => {
      const img = esc(getSafeImage(p.imageUrl));
      const text = esc(p.text || "");
      const link = esc(p.linkUrl || "#");
      const cost = esc(formatKrw(p.cost));
      return `
        <article class="card">
          <img data-product-image="1" src="${img}" alt="item" loading="lazy" decoding="async">
          <div class="card-body">
            <span class="badge">${cost}</span>
            <p class="text">${text}</p>
            <a class="open" href="${link}" target="_blank" rel="noopener">Inspect Item</a>
          </div>
        </article>
      `;
    }).join("") + "</div>";
    bindImageFallbacks();
  }

  function renderLedger(items) {
    if (!items.length) {
      workspace.innerHTML = "<div class='empty'>No products to display.</div>";
      return;
    }

    workspace.innerHTML = `
      <div class="ledger-wrap">
        <table class="ledger">
          <thead>
            <tr>
              <th>ID</th>
              <th>Preview</th>
              <th>Description</th>
              <th>Price</th>
              <th>Link</th>
            </tr>
          </thead>
          <tbody>
            ${items.map((p) => `
              <tr>
                <td>${p.id}</td>
                <td><img class="mini" data-product-image="1" src="${esc(getSafeImage(p.imageUrl))}" alt="preview" loading="lazy" decoding="async"></td>
                <td>${esc(p.text)}</td>
                <td>${esc(formatKrw(p.cost))}</td>
                <td><a class="open" href="${esc(p.linkUrl)}" target="_blank" rel="noopener">Open</a></td>
              </tr>
            `).join("")}
          </tbody>
        </table>
      </div>
    `;
    bindImageFallbacks();
  }

  function render() {
    const items = filtered();
    countEl.textContent = String(items.length);
    statusEl.textContent = "Loaded";
    statusEl.className = "status-ok";

    if ((viewEl.value || "cabinet") === "ledger") renderLedger(items);
    else renderCabinet(items);
  }

  async function loadRemote() {
    const res = await fetch("/api/products?site=" + encodeURIComponent(site), {
      headers: { Accept: "application/json" },
      cache: "no-store"
    });
    if (!res.ok) {
      const t = await res.text();
      throw new Error(t || ("HTTP " + res.status));
    }
    const data = await res.json();
    all = Array.isArray(data) ? data.map(normalize) : [];
  }

  async function load() {
    if (forceMock) {
      all = getMock();
      render();
      statusEl.textContent = all.length ? "Loaded (mock)" : "Load error";
      statusEl.className = all.length ? "status-ok" : "status-error";
      return;
    }

    statusEl.textContent = "Loading...";
    statusEl.className = "";

    try {
      await loadRemote();
      render();
      return;
    } catch {
    }

    all = [];
    workspace.innerHTML = "<div class='empty'>Failed to load products.</div>";
    statusEl.textContent = "Load error";
    statusEl.className = "status-error";
    countEl.textContent = "0";
  }

  qEl.addEventListener("input", render);
  sortEl.addEventListener("change", render);
  viewEl.addEventListener("change", render);
  refreshBtn.addEventListener("click", load);

  load();
})();
