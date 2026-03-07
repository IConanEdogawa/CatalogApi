// app.js - Catalog Viewer (read-only)

(() => {
  const DEFAULT_NOTICE_KO = "이 게시물은 쿠팡파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.";
  const LEGACY_NOTICE_EN = "This post contains affiliate links and may provide a commission.";
  const site = document.body.dataset.site || "a";
  const isStandalonePwa =
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true;
  const developerModeAvailable = !isStandalonePwa;
  const forceMock = new URLSearchParams(window.location.search).get("mock") === "1";
  const META_PREFIX = "[[PRICE_META:";
  const META_SUFFIX = "]]";
  const grid = document.getElementById("grid");
  const statusEl = document.getElementById("status");
  const countEl = document.getElementById("count");
  const qEl = document.getElementById("q");
  const sortEl = document.getElementById("sort");
  const refreshBtn = document.getElementById("refresh");
  const adminLinkEl = document.getElementById("adminLink");
  const brandTitleEl = document.getElementById("brandTitle");
  const siteNoticeEl = document.getElementById("siteNotice");
  const refreshLabelEl = document.getElementById("refreshLabel");
  const sortNewLabelEl = document.getElementById("sortNewLabel");
  const sortOldLabelEl = document.getElementById("sortOldLabel");
  const footerNoteEl = document.getElementById("footerNote");
  const SITE_SETTINGS_KEY = "catalog_site_a_settings_v1";

  const DEFAULT_UI_TEXTS = {
    title: "Opanot com",
    notice: DEFAULT_NOTICE_KO,
    footer: "Catalog viewer • Images and links are provided by the product source.",
    searchPlaceholder: "Search products...",
    refresh: "Refresh",
    admin: "Admin",
    openProduct: "Open Product",
    productInfo: "Product info",
    sortNew: "Newest",
    sortOld: "Oldest"
  };

  const THEME_PRESETS = {
    legacy: { bodyBg: "#020617", cardBg: "#0f172a", accent: "#059669", borderColor: "#1e293b", circleColor: "transparent", circleSize: "340px", circleOpacity: "0", flat: true },
    midnight: { bodyBg: "#020617", cardBg: "rgba(15,23,42,.92)", accent: "#10b981", circleColor: "rgba(56,189,248,.25)", circleSize: "420px", circleOpacity: "0.35" },
    ocean: { bodyBg: "#04111f", cardBg: "rgba(7,29,48,.9)", accent: "#38bdf8", circleColor: "rgba(59,130,246,.28)", circleSize: "460px", circleOpacity: "0.34" },
    forest: { bodyBg: "#03110a", cardBg: "rgba(6,31,19,.92)", accent: "#22c55e", circleColor: "rgba(16,185,129,.24)", circleSize: "440px", circleOpacity: "0.32" },
    amber: { bodyBg: "#1a1102", cardBg: "rgba(53,33,6,.9)", accent: "#f59e0b", circleColor: "rgba(245,158,11,.25)", circleSize: "430px", circleOpacity: "0.3" },
    mono: { bodyBg: "#0b0b0b", cardBg: "rgba(30,30,30,.94)", accent: "#a3a3a3", circleColor: "rgba(212,212,212,.2)", circleSize: "400px", circleOpacity: "0.28" }
  };

  let uiTexts = { ...DEFAULT_UI_TEXTS };

  function cardClasses() {
    if (site === "b") return "flex flex-col sm:flex-row items-center bg-gray-100 border-b border-gray-300 p-4 gap-4";
    if (site === "c") return "rounded-lg overflow-hidden bg-white border border-slate-200 hover:shadow-lg transition";
    return "rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-600 transition";
  }

  function imageWrapperClasses() {
    if (site === "b") return "w-full sm:w-1/4 h-32 bg-gray-200 overflow-hidden flex-shrink-0";
    if (site === "c") return "aspect-[4/3] bg-slate-50 overflow-hidden";
    return "aspect-[4/3] bg-slate-950 overflow-hidden";
  }

  function textClasses() {
    if (site === "b") return "text-gray-800 text-base sm:text-lg";
    return site === "c" ? "text-slate-900 line-clamp-3" : "text-slate-200 line-clamp-3";
  }

  function linkButtonClasses() {
    if (site === "b") return "inline-flex items-center justify-center px-3 py-2 rounded-xl bg-indigo-600 text-white hover:bg-indigo-500 transition text-sm sm:text-base";
    return site === "c"
      ? "inline-flex items-center justify-center px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition text-white"
      : "inline-flex items-center justify-center px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition";
  }

  function infoButtonClasses() {
    if (site === "b") return "inline-flex items-center justify-center px-3 py-2 rounded-xl bg-gray-200 text-gray-800 hover:bg-gray-300 transition text-sm sm:text-base";
    return site === "c"
      ? "inline-flex items-center justify-center px-3 py-2 rounded-xl bg-slate-200 text-slate-800 hover:bg-slate-300 transition"
      : "inline-flex items-center justify-center px-3 py-2 rounded-xl bg-slate-800 text-slate-100 hover:bg-slate-700 transition";
  }

  function escapeHtml(str) {
    return String(str ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function toDigits(input) {
    return String(input ?? "").replace(/\D/g, "");
  }

  function parseMoney(input) {
    const digits = toDigits(input);
    return digits ? Number(digits) : null;
  }

  function formatKrw(input) {
    const value = typeof input === "number" ? input : parseMoney(input);
    if (value === null || !Number.isFinite(value)) return "KRW -";
    return `KRW ${value.toLocaleString("ko-KR")}`;
  }

  function formatPct(v) {
    if (!Number.isFinite(v)) return "0%";
    return `${Math.max(0, Math.round(v * 10) / 10).toFixed(1).replace(/\.0$/, "")}%`;
  }

  function formatDate(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  function resolveImage(url) {
    if (!url) return "";
    return url;
  }

  function normalizeProduct(p) {
    const parsed = parsePriceMetaFromText(p.text ?? p.Text ?? "");
    return {
      id: p.id ?? p.Id ?? 0,
      imageUrl: p.imageUrl ?? p.ImageUrl ?? "",
      linkUrl: p.linkUrl ?? p.LinkUrl ?? "",
      cost: p.cost ?? p.Cost ?? "",
      text: parsed.cleanText,
      priceMeta: parsed.meta,
      site: p.site ?? p.Site ?? "a",
      createdAt: p.createdAt ?? p.CreatedAt ?? ""
    };
  }

  function parsePriceMetaFromText(rawText) {
    const text = String(rawText ?? "");
    const start = text.lastIndexOf(META_PREFIX);
    if (start < 0) return { cleanText: text.trim(), meta: null };

    const end = text.indexOf(META_SUFFIX, start);
    if (end < 0) return { cleanText: text.trim(), meta: null };

    const json = text.slice(start + META_PREFIX.length, end);
    try {
      const parsed = JSON.parse(json);
      const cleanText = (text.slice(0, start) + text.slice(end + META_SUFFIX.length)).trim();
      return {
        cleanText,
        meta: {
          originalCost: toDigits(parsed.originalCost || ""),
          lowestCost: toDigits(parsed.lowestCost || ""),
          lowestCostDate: String(parsed.lowestCostDate || "").trim(),
          additionalInfo: String(parsed.additionalInfo || "").trim()
        }
      };
    } catch {
      return { cleanText: text.trim(), meta: null };
    }
  }

  function getMockProducts() {
    const pool = window.CATALOG_MOCK_PRODUCTS?.[site];
    if (!Array.isArray(pool)) return [];
    return pool.map(normalizeProduct);
  }

  function readSiteSettings() {
    try {
      const raw = localStorage.getItem(SITE_SETTINGS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function applyCatalogSettings() {
    if (site !== "a") return;
    const settings = readSiteSettings();
    if (!settings) return;

    const allowEmpty = Boolean(settings?.dev?.allowEmpty);
    const textOverrides = settings?.dev?.textOverrides || {};

    const merged = {
      ...DEFAULT_UI_TEXTS,
      title: settings?.texts?.title ?? DEFAULT_UI_TEXTS.title,
      notice: settings?.texts?.notice ?? DEFAULT_UI_TEXTS.notice,
      footer: settings?.texts?.footer ?? DEFAULT_UI_TEXTS.footer,
      searchPlaceholder: textOverrides.searchPlaceholder ?? DEFAULT_UI_TEXTS.searchPlaceholder,
      refresh: textOverrides.refresh ?? DEFAULT_UI_TEXTS.refresh,
      admin: textOverrides.admin ?? DEFAULT_UI_TEXTS.admin,
      openProduct: textOverrides.openProduct ?? DEFAULT_UI_TEXTS.openProduct,
      productInfo: textOverrides.productInfo ?? DEFAULT_UI_TEXTS.productInfo,
      sortNew: textOverrides.sortNew ?? DEFAULT_UI_TEXTS.sortNew,
      sortOld: textOverrides.sortOld ?? DEFAULT_UI_TEXTS.sortOld
    };

    if (!allowEmpty) {
      Object.keys(merged).forEach((k) => {
        if (!merged[k]) merged[k] = DEFAULT_UI_TEXTS[k] || "";
      });
    }
    if (merged.notice === LEGACY_NOTICE_EN || /[А-яЁё]/.test(String(merged.notice))) {
      merged.notice = DEFAULT_NOTICE_KO;
    }

    uiTexts = merged;

    if (brandTitleEl) brandTitleEl.textContent = merged.title;
    if (siteNoticeEl) siteNoticeEl.textContent = merged.notice;
    if (footerNoteEl) footerNoteEl.textContent = merged.footer;
    if (qEl) qEl.placeholder = merged.searchPlaceholder;
    if (refreshLabelEl) refreshLabelEl.textContent = merged.refresh;
    if (adminLinkEl) adminLinkEl.textContent = merged.admin;
    if (sortNewLabelEl) sortNewLabelEl.textContent = merged.sortNew;
    if (sortOldLabelEl) sortOldLabelEl.textContent = merged.sortOld;

    const preset = settings?.themePreset;
    const useManualTheme = developerModeAvailable && Boolean(settings?.dev?.enabled);
    const theme = useManualTheme
      ? {
          ...(THEME_PRESETS[preset] || THEME_PRESETS.midnight),
          ...(settings?.dev?.manualTheme || {})
        }
      : (THEME_PRESETS[preset] || THEME_PRESETS.midnight);

    const styleId = "siteAThemeDynamic";
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const pageBackground = theme.flat
      ? `${theme.bodyBg} !important`
      : `
          radial-gradient(${theme.circleSize} ${theme.circleSize} at 18% 15%, ${theme.circleColor}, transparent 62%),
          radial-gradient(${theme.circleSize} ${theme.circleSize} at 82% 18%, ${theme.circleColor}, transparent 64%),
          ${theme.bodyBg} !important
        `;

    styleEl.textContent = `
      body[data-site="a"] {
        background: ${pageBackground};
      }
      body[data-site="a"] #grid > div {
        background: ${theme.cardBg} !important;
        border-color: ${theme.borderColor || "rgba(51, 65, 85, 0.9)"} !important;
      }
      body[data-site="a"] #grid > div:hover {
        border-color: ${theme.accent} !important;
      }
      body[data-site="a"] #brandTitle:hover {
        color: ${theme.accent} !important;
      }
      body[data-site="a"] #refresh:hover,
      body[data-site="a"] #adminLink:hover {
        border-color: ${theme.accent} !important;
      }
      body[data-site="a"] .dev-night-fx {
        position: fixed;
        inset: 0;
        pointer-events: none;
        z-index: 0;
        overflow: hidden;
      }
      body[data-site="a"] .dev-night-fx .orb {
        position: absolute;
        border-radius: 9999px;
        filter: blur(26px);
        animation: devNightFloat 19s ease-in-out infinite, devNightShade 10s ease-in-out infinite;
        opacity: ${theme.circleOpacity || "0.35"};
        background: ${theme.circleColor};
        mix-blend-mode: screen;
      }
      body[data-site="a"] .dev-night-fx .orb.a {
        width: ${theme.circleSize};
        height: ${theme.circleSize};
        left: -12%;
        top: 14%;
      }
      body[data-site="a"] .dev-night-fx .orb.b {
        width: calc(${theme.circleSize} * 0.82);
        height: calc(${theme.circleSize} * 0.82);
        right: -8%;
        top: 8%;
        animation-delay: -7s;
      }
      body[data-site="a"] .dev-night-fx .orb.c {
        width: calc(${theme.circleSize} * 1.05);
        height: calc(${theme.circleSize} * 1.05);
        left: 34%;
        bottom: -18%;
        animation-delay: -12s;
      }
      body[data-site="a"] .catalog-shell {
        position: relative;
        z-index: 1;
      }
      @keyframes devNightFloat {
        0%, 100% { transform: translateY(0) translateX(0) scale(1); }
        33% { transform: translateY(-20px) translateX(16px) scale(1.05); }
        66% { transform: translateY(14px) translateX(-10px) scale(0.96); }
      }
      @keyframes devNightShade {
        0%, 100% { opacity: ${theme.circleOpacity || "0.35"}; filter: blur(22px) saturate(1); }
        50% { opacity: calc((${theme.circleOpacity || "0.35"}) + 0.16); filter: blur(30px) saturate(1.22); }
      }
    `;

    const devEnabled = useManualTheme;
    let fx = document.getElementById("devNightFx");
    if (devEnabled) {
      if (!fx) {
        fx = document.createElement("div");
        fx.id = "devNightFx";
        fx.className = "dev-night-fx";
        fx.innerHTML = `<div class="orb a"></div><div class="orb b"></div><div class="orb c"></div>`;
        document.body.prepend(fx);
      }
      const shell = document.querySelector("body[data-site='a'] > .max-w-6xl");
      if (shell instanceof HTMLElement) shell.classList.add("catalog-shell");
    } else if (fx) {
      fx.remove();
    }
  }

  function buildHistoryMap(items) {
    const map = new Map();

    items.forEach((item) => {
      const key = String(item.linkUrl || "").trim();
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key).push(item);
    });

    map.forEach((arr) => {
      arr.sort((a, b) => {
        const ad = new Date(a.createdAt || 0).getTime();
        const bd = new Date(b.createdAt || 0).getTime();
        return ad - bd;
      });
    });

    return map;
  }

  function getPriceMeta(item, historyMap) {
    const current = parseMoney(item.cost);

    if (item.priceMeta) {
      const originalExplicit = parseMoney(item.priceMeta.originalCost);
      const lowestExplicit = parseMoney(item.priceMeta.lowestCost);
      const original = originalExplicit ?? current;
      const lowest = lowestExplicit ?? current;
      const lowestDate = item.priceMeta.lowestCostDate || item.createdAt || "";
      const baseline = original || current || 0;
      const discountPct = baseline > 0 && current !== null ? ((baseline - current) / baseline) * 100 : 0;

      return {
        current,
        original,
        lowest,
        lowestDate,
        discountPct,
        hasDiscount: discountPct > 0.1,
        hasHistory: true,
        baseline
      };
    }

    const history = historyMap.get(String(item.linkUrl || "").trim()) || [];
    const values = history.map((x) => ({
      amount: parseMoney(x.cost),
      createdAt: x.createdAt
    })).filter((x) => x.amount !== null);

    const base = current ?? 0;

    if (!values.length) {
      return {
        current,
        original: current,
        lowest: current,
        lowestDate: item.createdAt || "",
        discountPct: 0,
        hasDiscount: false,
        hasHistory: false,
        baseline: base
      };
    }

    let original = values[0].amount;
    let lowest = values[0].amount;
    let lowestDate = values[0].createdAt;

    values.forEach((v) => {
      if (v.amount > original) original = v.amount;
      if (v.amount < lowest) {
        lowest = v.amount;
        lowestDate = v.createdAt;
      }
    });

    if (current !== null && current > original) original = current;

    const baseline = original || current || 0;
    const discountPct = baseline > 0 && current !== null ? ((baseline - current) / baseline) * 100 : 0;

    return {
      current,
      original,
      lowest,
      lowestDate,
      discountPct,
      hasDiscount: discountPct > 0.1,
      hasHistory: values.length > 1,
      baseline
    };
  }

  function sortProducts(items, mode) {
    const arr = items.slice();
    arr.sort((a, b) => {
      const ax = a.id ?? 0;
      const bx = b.id ?? 0;
      return mode === "old" ? ax - bx : bx - ax;
    });
    return arr;
  }

  let allProducts = [];

  function renderPriceBlock(price) {
    const badgeClass = site === "c"
      ? "inline-flex items-center px-2 py-1 rounded-lg bg-rose-100 text-rose-700 font-semibold text-sm"
      : site === "b"
      ? "inline-flex items-center px-2 py-1 rounded-md bg-rose-100 text-rose-700 font-semibold text-sm"
      : "inline-flex items-center px-2 py-1 rounded-lg bg-rose-500/15 text-rose-300 font-semibold text-sm";

    const currentClass = site === "c" ? "text-xl font-bold text-slate-900" : site === "b" ? "text-xl font-bold text-gray-900" : "text-xl font-bold text-emerald-300";
    const originalClass = site === "c" ? "text-sm text-slate-500 line-through" : site === "b" ? "text-sm text-gray-500 line-through" : "text-sm text-slate-400 line-through";
    const lowestClass = site === "c" ? "text-sm text-slate-700" : site === "b" ? "text-sm text-gray-700" : "text-sm text-slate-300";

    const discountLabel = price.hasDiscount ? `${formatPct(price.discountPct)} OFF` : "NO DISCOUNT";

    return `
      <div class="space-y-1">
        <div class="${badgeClass}">${escapeHtml(discountLabel)}</div>
        <div class="${currentClass}">${escapeHtml(formatKrw(price.current))}</div>
        <div class="${originalClass}">Original: ${escapeHtml(formatKrw(price.original))}</div>
        <div class="${lowestClass}">All-time low (${escapeHtml(formatDate(price.lowestDate))}): ${escapeHtml(formatKrw(price.lowest))}</div>
      </div>
    `;
  }

  function renderProducts(items) {
    countEl.textContent = items.length ? `${items.length} item(s)` : "";

    if (!items.length) {
      grid.innerHTML = `
        <div class="col-span-full p-6 rounded-2xl bg-slate-900 border border-slate-800">
          No products yet.
        </div>
      `;
      return;
    }

    const historyMap = buildHistoryMap(allProducts);

    grid.innerHTML = items.map((p) => {
      const img = resolveImage(p.imageUrl);
      const link = escapeHtml(p.linkUrl);
      const text = escapeHtml(p.text);
      const infoUrl = `./p4d6u2m9.html?id=${encodeURIComponent(p.id)}&site=${encodeURIComponent(site)}${forceMock ? "&mock=1" : ""}`;
      const priceMeta = getPriceMeta(p, historyMap);

      return `
        <div class="${cardClasses()} cursor-pointer" data-info-url="${escapeHtml(infoUrl)}">
          <div class="${imageWrapperClasses()}">
            <img src="${img}" alt="product"
                 class="w-full h-full object-cover"
                 loading="lazy"
                 onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'p-4 text-slate-400\\'>Image failed to load</div>';" />
          </div>

          <div class="p-4 space-y-3">
            ${renderPriceBlock(priceMeta)}

            <div class="${textClasses()}">${text}</div>

            <div class="flex flex-wrap gap-2">
              <a href="${link}" target="_blank" rel="noopener" class="${linkButtonClasses()} js-no-card-nav">
                ${escapeHtml(uiTexts.openProduct)}
              </a>
              <a href="${escapeHtml(infoUrl)}" class="${infoButtonClasses()} js-no-card-nav">
                ${escapeHtml(uiTexts.productInfo)}
              </a>
            </div>
          </div>
        </div>
      `;
    }).join("");
  }

  function applyFilters() {
    const q = (qEl?.value || "").toLowerCase().trim();
    const sortMode = sortEl?.value || "new";

    let items = sortProducts(allProducts, sortMode);

    if (q) {
      items = items.filter((p) =>
        (p.text || "").toLowerCase().includes(q) ||
        (p.cost || "").toLowerCase().includes(q)
      );
    }

    statusEl.textContent = "Loaded.";
    renderProducts(items);
  }

  async function loadProducts() {
    if (forceMock) {
      allProducts = getMockProducts();
      statusEl.textContent = allProducts.length ? "Loaded (mock)." : "Mock data not found.";
      applyFilters();
      return;
    }

    statusEl.textContent = "Loading...";

    try {
      const res = await fetch(`/api/products?site=${site}`, {
        headers: { Accept: "application/json" }
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      const data = await res.json();
      allProducts = Array.isArray(data) ? data.map(normalizeProduct) : [];
    } catch {
      statusEl.textContent = "Failed to load.";
      allProducts = [];
    }

    applyFilters();
  }

  async function checkAdminEntry() {
    if (!adminLinkEl) return;
    adminLinkEl.classList.add("hidden");

    try {
      const res = await fetch("/api/admin/me", {
        headers: { Accept: "application/json" },
        credentials: "same-origin"
      });
      if (!res.ok) return;

      const data = await res.json();
      if (data?.ok) {
        adminLinkEl.classList.remove("hidden");
      }
    } catch {
      // keep hidden
    }
  }

  qEl?.addEventListener("input", applyFilters);
  sortEl?.addEventListener("change", applyFilters);
  refreshBtn?.addEventListener("click", loadProducts);
  grid?.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    if (target.closest(".js-no-card-nav")) return;

    const card = target.closest("[data-info-url]");
    if (!(card instanceof HTMLElement)) return;

    const url = card.dataset.infoUrl;
    if (!url) return;

    window.location.href = url;
  });
  window.addEventListener("storage", (e) => {
    if (e.key !== SITE_SETTINGS_KEY) return;
    applyCatalogSettings();
    applyFilters();
  });

  applyCatalogSettings();
  checkAdminEntry();
  loadProducts();
})();
