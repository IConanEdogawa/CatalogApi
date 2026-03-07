(() => {
  const params = new URLSearchParams(window.location.search);
  const id = Number(params.get("id") || 0);
  const site = (params.get("site") || "a").toLowerCase();
  const forceMock = params.get("mock") === "1";
  const isStandalonePwa =
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true;
  const developerModeAvailable = !isStandalonePwa;
  const META_PREFIX = "[[PRICE_META:";
  const META_SUFFIX = "]]";
  const SITE_SETTINGS_KEY = "catalog_site_a_settings_v1";

  const backLink = document.getElementById("backLink");
  const brandTitleEl = document.getElementById("brandTitle");
  const historyTitleEl = document.getElementById("historyTitle");
  const statusEl = document.getElementById("status");
  const contentEl = document.getElementById("content");
  const historySectionEl = document.getElementById("historySection");
  const historyRowsEl = document.getElementById("historyRows");

  const imageEl = document.getElementById("image");
  const discountBadgeEl = document.getElementById("discountBadge");
  const currentCostEl = document.getElementById("currentCost");
  const originalCostEl = document.getElementById("originalCost");
  const lowestCostEl = document.getElementById("lowestCost");
  const textEl = document.getElementById("text");
  const extraInfoBlockEl = document.getElementById("extraInfoBlock");
  const extraInfoTextEl = document.getElementById("extraInfoText");
  const productLinkEl = document.getElementById("productLink");

  const DEFAULT_UI_TEXTS = {
    title: "Opanot com",
    openProduct: "Open Product",
    productInfo: "Product info"
  };

  const THEME_PRESETS = {
    legacy: { bodyBg: "#020617", cardBg: "#0f172a", accent: "#059669", borderColor: "#1e293b", circleColor: "transparent", circleSize: "340px", circleOpacity: "0", flat: true },
    midnight: { bodyBg: "#020617", cardBg: "rgba(15,23,42,.92)", accent: "#10b981", circleColor: "rgba(56,189,248,.25)", circleSize: "420px", circleOpacity: "0.35" },
    ocean: { bodyBg: "#04111f", cardBg: "rgba(7,29,48,.9)", accent: "#38bdf8", circleColor: "rgba(59,130,246,.28)", circleSize: "460px", circleOpacity: "0.34" },
    forest: { bodyBg: "#03110a", cardBg: "rgba(6,31,19,.92)", accent: "#22c55e", circleColor: "rgba(16,185,129,.24)", circleSize: "440px", circleOpacity: "0.32" },
    amber: { bodyBg: "#1a1102", cardBg: "rgba(53,33,6,.9)", accent: "#f59e0b", circleColor: "rgba(245,158,11,.25)", circleSize: "430px", circleOpacity: "0.3" },
    mono: { bodyBg: "#0b0b0b", cardBg: "rgba(30,30,30,.94)", accent: "#a3a3a3", circleColor: "rgba(212,212,212,.2)", circleSize: "400px", circleOpacity: "0.28" }
  };

  const sitePage = site === "b" ? "/q7r8s2t4.html" : site === "c" ? "/k1m4n6p8.html" : "/f9b3c1a2.html";
  backLink.href = `${sitePage}${forceMock ? "?mock=1" : ""}`;

  function readSiteSettings() {
    try {
      const raw = localStorage.getItem(SITE_SETTINGS_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function applySiteASettings() {
    if (site !== "a") return;
    const settings = readSiteSettings();
    if (!settings) return;

    const textOverrides = settings?.dev?.textOverrides || {};
    const title = settings?.texts?.title || DEFAULT_UI_TEXTS.title;
    const openProduct = textOverrides.openProduct || DEFAULT_UI_TEXTS.openProduct;
    const productInfo = textOverrides.productInfo || DEFAULT_UI_TEXTS.productInfo;

    if (brandTitleEl) brandTitleEl.textContent = title;
    if (productLinkEl) productLinkEl.textContent = openProduct;
    if (historyTitleEl) historyTitleEl.textContent = `${productInfo} - Price History`;

    const preset = settings?.themePreset;
    const useManualTheme = developerModeAvailable && Boolean(settings?.dev?.enabled);
    const theme = useManualTheme
      ? {
          ...(THEME_PRESETS[preset] || THEME_PRESETS.midnight),
          ...(settings?.dev?.manualTheme || {})
        }
      : (THEME_PRESETS[preset] || THEME_PRESETS.midnight);

    const styleId = "siteAProductInfoThemeDynamic";
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const pageBackground = theme.flat
      ? `${theme.bodyBg} !important`
      : `
          radial-gradient(${theme.circleSize} ${theme.circleSize} at 18% 12%, ${theme.circleColor}, transparent 62%),
          radial-gradient(${theme.circleSize} ${theme.circleSize} at 82% 16%, ${theme.circleColor}, transparent 64%),
          ${theme.bodyBg} !important
        `;

    styleEl.textContent = `
      body {
        background: ${pageBackground};
      }
      #content, #historySection {
        background: ${theme.cardBg} !important;
      }
      #content, #historySection, #content .border-slate-800, #historySection .border-slate-800 {
        border-color: ${theme.borderColor || "rgba(71, 85, 105, 0.72)"} !important;
      }
      #productLink {
        background-color: ${theme.accent} !important;
      }
      #productLink:hover {
        filter: brightness(1.08);
      }
      #brandTitle:hover {
        color: ${theme.accent} !important;
      }
    `;
  }

  function toDigits(value) {
    return String(value ?? "").replace(/\D/g, "");
  }

  function parseMoney(value) {
    const digits = toDigits(value);
    return digits ? Number(digits) : null;
  }

  function money(value) {
    const n = typeof value === "number" ? value : parseMoney(value);
    if (n === null || !Number.isFinite(n)) return "KRW -";
    return `KRW ${n.toLocaleString("ko-KR")}`;
  }

  function fmtDate(value) {
    if (!value) return "-";
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return String(value);
    return d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
  }

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
  }

  function normalize(p) {
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
    return pool.map(normalize);
  }

  function calcPriceMeta(item, history) {
    if (item.priceMeta) {
      const current = parseMoney(item.cost);
      const original = parseMoney(item.priceMeta.originalCost) ?? current;
      const lowest = parseMoney(item.priceMeta.lowestCost) ?? current;
      const lowestDate = item.priceMeta.lowestCostDate || item.createdAt || "";
      const discount = original > 0 && current !== null ? ((original - current) / original) * 100 : 0;
      return { current, original, lowest, lowestDate, discount };
    }

    const values = history
      .map((x) => ({ amount: parseMoney(x.cost), createdAt: x.createdAt }))
      .filter((x) => x.amount !== null);

    const current = parseMoney(item.cost);

    if (!values.length) {
      return { current, original: current, lowest: current, lowestDate: item.createdAt || "", discount: 0 };
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

    const discount = original > 0 && current !== null ? ((original - current) / original) * 100 : 0;

    return { current, original, lowest, lowestDate, discount };
  }

  async function load() {
    if (!id) {
      statusEl.textContent = "Invalid product id.";
      return;
    }

    try {
      let items = [];

      if (forceMock) {
        items = getMockProducts();
      } else {
        const res = await fetch(`/api/products?site=${encodeURIComponent(site)}`, {
          headers: { Accept: "application/json" },
          cache: "no-store"
        });

        if (!res.ok) {
          const t = await res.text();
          throw new Error(t || `HTTP ${res.status}`);
        }

        const data = await res.json();
        items = Array.isArray(data) ? data.map(normalize) : [];
      }

      const current = items.find((x) => x.id === id);

      if (!current) {
        statusEl.textContent = `Product #${id} not found.`;
        return;
      }

      const history = items
        .filter((x) => x.linkUrl === current.linkUrl)
        .sort((a, b) => new Date(a.createdAt || 0).getTime() - new Date(b.createdAt || 0).getTime());

      const meta = calcPriceMeta(current, history);

      imageEl.src = current.imageUrl || "";
      imageEl.onerror = () => {
        imageEl.style.display = "none";
      };

      discountBadgeEl.textContent = (meta.discount > 0.1 ? `${Math.round(meta.discount * 10) / 10}% OFF` : "NO DISCOUNT");
      currentCostEl.textContent = money(meta.current);
      originalCostEl.textContent = `Original: ${money(meta.original)}`;
      lowestCostEl.textContent = `All-time low (${fmtDate(meta.lowestDate)}): ${money(meta.lowest)}`;
      textEl.textContent = current.text || "";
      const extraInfo = String(current.priceMeta?.additionalInfo || "").trim();
      if (extraInfo) {
        extraInfoTextEl.textContent = extraInfo;
        extraInfoBlockEl.classList.remove("hidden");
      } else {
        extraInfoTextEl.textContent = "";
        extraInfoBlockEl.classList.add("hidden");
      }
      productLinkEl.href = current.linkUrl || "#";

      historyRowsEl.innerHTML = history
        .map((x) => `
          <tr>
            <td class="py-2 pr-2">${esc(fmtDate(x.createdAt))}</td>
            <td class="py-2 pr-2">${esc(money(x.cost))}</td>
            <td class="py-2 pr-2">${x.id}</td>
          </tr>
        `)
        .join("");

      statusEl.textContent = "Loaded.";
      contentEl.classList.remove("hidden");
      historySectionEl.classList.remove("hidden");
    } catch (err) {
      statusEl.textContent = `Failed to load: ${err?.message || "Unknown error"}`;
    }
  }

  applySiteASettings();
  window.addEventListener("storage", (e) => {
    if (e.key !== SITE_SETTINGS_KEY) return;
    applySiteASettings();
  });
  load();
})();
