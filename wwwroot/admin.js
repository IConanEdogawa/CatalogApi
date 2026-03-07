(() => {
  const forceMockFromQuery = new URLSearchParams(window.location.search).get("mock") === "1";
  const isStandalonePwa =
    (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
    window.navigator.standalone === true;
  const developerSuperMode = !isStandalonePwa;
  const el = (id) => document.getElementById(id);
  const MOCK_STORE_KEY = "catalog_mock_products_dev_v2";
  const DEV_SOURCE_MODE_KEY = "catalog_admin_dev_source_mode_v1";
  const SITE_SETTINGS_KEY = "catalog_site_a_settings_v1";
  const SITE_SETTINGS_BACKUP_KEY = "catalog_site_a_settings_backup_v1";

  const META_PREFIX = "[[PRICE_META:";
  const META_SUFFIX = "]]";

  const tabAdd = el("tabAdd");
  const tabManage = el("tabManage");
  const tabSettings = el("tabSettings");
  const addSection = el("addSection");
  const manageSection = el("manageSection");
  const settingsSection = el("settingsSection");

  const form = el("form");
  const imageFileEl = el("imageFile");
  const linkUrlEl = el("linkUrl");
  const costEl = el("cost");
  const originalCostEl = el("originalCost");
  const lowestCostEl = el("lowestCost");
  const lowestCostDateEl = el("lowestCostDate");
  const enableExtraInfoEl = el("enableExtraInfo");
  const extraInfoWrapEl = el("extraInfoWrap");
  const extraInfoEl = el("extraInfo");
  const textEl = el("text");
  const siteEl = el("site");

  const previewImage = el("previewImage");
  const previewSkeleton = el("previewSkeleton");
  const previewCost = el("previewCost");
  const previewText = el("previewText");
  const previewLink = el("previewLink");

  const submitBtn = el("submitBtn");
  const msgEl = el("msg");
  const countEl = el("count");
  const apiBadge = el("apiBadge");
  const devModeLabel = el("devModeLabel");
  const settingsMsgEl = el("settingsMsg");
  const logoConfigTriggerEl = el("logoConfigTrigger");
  const cfgTitleEl = el("cfgTitle");
  const cfgNoticeEl = el("cfgNotice");
  const cfgFooterEl = el("cfgFooter");
  const cfgSaveEl = el("cfgSave");
  const cfgResetEl = el("cfgReset");
  const themePresetListEl = el("themePresetList");
  const devConfigPanelEl = el("devConfigPanel");
  const devBodyBgEl = el("devBodyBg");
  const devCardBgEl = el("devCardBg");
  const devAccentEl = el("devAccent");
  const devCircleColorEl = el("devCircleColor");
  const devCircleSizeEl = el("devCircleSize");
  const devCircleOpacityEl = el("devCircleOpacity");
  const devTxtRefreshEl = el("devTxtRefresh");
  const devTxtAdminEl = el("devTxtAdmin");
  const devTxtOpenProductEl = el("devTxtOpenProduct");
  const devTxtProductInfoEl = el("devTxtProductInfo");
  const devTxtSearchEl = el("devTxtSearch");
  const devTxtSortNewEl = el("devTxtSortNew");
  const devTxtSortOldEl = el("devTxtSortOld");
  const devAllowEmptyEl = el("devAllowEmpty");
  const devApplyEl = el("devApply");
  const devRestoreEl = el("devRestore");

  const manageSearchEl = el("manageSearch");
  const manageSiteEl = el("manageSite");
  const manageRefreshEl = el("manageRefresh");
  const manageRowsEl = el("manageRows");
  const manageMsgEl = el("manageMsg");

  const editPanel = el("editPanel");
  const editForm = el("editForm");
  const editIdEl = el("editId");
  const editLinkUrlEl = el("editLinkUrl");
  const editCostEl = el("editCost");
  const editOriginalCostEl = el("editOriginalCost");
  const editLowestCostEl = el("editLowestCost");
  const editLowestCostDateEl = el("editLowestCostDate");
  const editEnableExtraInfoEl = el("editEnableExtraInfo");
  const editExtraInfoWrapEl = el("editExtraInfoWrap");
  const editExtraInfoEl = el("editExtraInfo");
  const editTextEl = el("editText");
  const editSiteEl = el("editSite");
  const editCancelEl = el("editCancel");
  const editInfoLinkEl = el("editInfoLink");

  let allProducts = [];
  let editingId = null;
  let sourceMode = forceMockFromQuery ? "mock" : "api";

  if (developerSuperMode) {
    try {
      const stored = sessionStorage.getItem(DEV_SOURCE_MODE_KEY);
      if (stored === "mock" || stored === "api") sourceMode = stored;
    } catch {
      // ignore storage errors
    }
  }

  function isMockMode() {
    return sourceMode === "mock";
  }

  const DEFAULT_SITE_SETTINGS = {
    themePreset: "legacy",
    texts: {
      title: "Opanot com",
      notice: "이 게시물은 쿠팡파트너스 활동의 일환으로, 이에 따른 일정액의 수수료를 제공받습니다.",
      footer: "Catalog viewer вЂў Images and links are provided by the product source."
    },
    dev: {
      enabled: false,
      manualTheme: {
        bodyBg: "#020617",
        cardBg: "rgba(15,23,42,.92)",
        accent: "#10b981",
        circleColor: "rgba(56,189,248,.25)",
        circleSize: "420px",
        circleOpacity: "0.35"
      },
      textOverrides: {
        searchPlaceholder: "Search products...",
        refresh: "Refresh",
        admin: "Admin",
        openProduct: "Open Product",
        productInfo: "Product info",
        sortNew: "Newest",
        sortOld: "Oldest"
      },
      allowEmpty: false
    }
  };

  const THEME_PRESETS = {
    legacy: { bodyBg: "#020617", cardBg: "#0f172a", accent: "#059669", borderColor: "#1e293b", circleColor: "transparent", circleSize: "340px", circleOpacity: "0", flat: true },
    midnight: { bodyBg: "#020617", cardBg: "rgba(15,23,42,.92)", accent: "#10b981", circleColor: "rgba(56,189,248,.25)", circleSize: "420px", circleOpacity: "0.35" },
    ocean: { bodyBg: "#04111f", cardBg: "rgba(7,29,48,.9)", accent: "#38bdf8", circleColor: "rgba(59,130,246,.28)", circleSize: "460px", circleOpacity: "0.34" },
    forest: { bodyBg: "#03110a", cardBg: "rgba(6,31,19,.92)", accent: "#22c55e", circleColor: "rgba(16,185,129,.24)", circleSize: "440px", circleOpacity: "0.32" },
    amber: { bodyBg: "#1a1102", cardBg: "rgba(53,33,6,.9)", accent: "#f59e0b", circleColor: "rgba(245,158,11,.25)", circleSize: "430px", circleOpacity: "0.3" },
    mono: { bodyBg: "#0b0b0b", cardBg: "rgba(30,30,30,.94)", accent: "#a3a3a3", circleColor: "rgba(212,212,212,.2)", circleSize: "400px", circleOpacity: "0.28" }
  };

  let hiddenDevMode = false;
  let logoTapCount = 0;
  let logoTapTimer = null;
  let selectedThemePreset = DEFAULT_SITE_SETTINGS.themePreset;

  function readSiteSettings() {
    try {
      const raw = localStorage.getItem(SITE_SETTINGS_KEY);
      if (!raw) return deepClone(DEFAULT_SITE_SETTINGS);
      const parsed = JSON.parse(raw);
      return {
        themePreset: parsed?.themePreset || DEFAULT_SITE_SETTINGS.themePreset,
        texts: {
          ...DEFAULT_SITE_SETTINGS.texts,
          ...(parsed?.texts || {})
        },
        dev: {
          enabled: Boolean(parsed?.dev?.enabled),
          manualTheme: {
            ...DEFAULT_SITE_SETTINGS.dev.manualTheme,
            ...(parsed?.dev?.manualTheme || {})
          },
          textOverrides: {
            ...DEFAULT_SITE_SETTINGS.dev.textOverrides,
            ...(parsed?.dev?.textOverrides || {})
          },
          allowEmpty: Boolean(parsed?.dev?.allowEmpty)
        }
      };
    } catch {
      return deepClone(DEFAULT_SITE_SETTINGS);
    }
  }

  function writeSiteSettings(settings) {
    localStorage.setItem(SITE_SETTINGS_KEY, JSON.stringify(settings));
  }

  function backupSiteSettings(settings) {
    localStorage.setItem(SITE_SETTINGS_BACKUP_KEY, JSON.stringify(settings));
  }

  function restoreSiteSettingsBackup() {
    try {
      const raw = localStorage.getItem(SITE_SETTINGS_BACKUP_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function setMsg(text, kind = "info") {
    msgEl.textContent = text;
    msgEl.className =
      "text-sm " +
      (kind === "ok" ? "text-emerald-400" : kind === "err" ? "text-red-400" : "text-slate-300");
  }

  function setManageMsg(text, kind = "info") {
    manageMsgEl.textContent = text;
    manageMsgEl.className =
      "mt-3 text-sm " +
      (kind === "ok" ? "text-emerald-400" : kind === "err" ? "text-red-400" : "text-slate-300");
  }

  function isValidUrl(s) {
    try {
      const u = new URL(s);
      return u.protocol === "http:" || u.protocol === "https:";
    } catch {
      return false;
    }
  }

  function normalizeDigits(input) {
    const mapped = Array.from(String(input ?? "")).map((ch) => {
      const code = ch.codePointAt(0);
      if (code >= 0x30 && code <= 0x39) return ch;
      if (code >= 0xff10 && code <= 0xff19) return String.fromCharCode(code - 0xff10 + 0x30);
      if (code >= 0x0660 && code <= 0x0669) return String.fromCharCode(code - 0x0660 + 0x30);
      if (code >= 0x06f0 && code <= 0x06f9) return String.fromCharCode(code - 0x06f0 + 0x30);
      return "";
    });
    return mapped.join("");
  }

  function formatKrw(input) {
    const digits = normalizeDigits(input);
    if (!digits) return "KRW -";
    return `KRW ${Number(digits).toLocaleString("ko-KR")}`;
  }

  function esc(value) {
    return String(value ?? "")
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;");
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
          originalCost: normalizeDigits(parsed.originalCost || ""),
          lowestCost: normalizeDigits(parsed.lowestCost || ""),
          lowestCostDate: String(parsed.lowestCostDate || "").trim(),
          additionalInfo: String(parsed.additionalInfo || "").trim()
        }
      };
    } catch {
      return { cleanText: text.trim(), meta: null };
    }
  }

  function appendPriceMetaToText(cleanText, meta) {
    const base = String(cleanText ?? "").trim();
    const payload = {
      originalCost: normalizeDigits(meta?.originalCost || ""),
      lowestCost: normalizeDigits(meta?.lowestCost || ""),
      lowestCostDate: String(meta?.lowestCostDate || "").trim(),
      additionalInfo: String(meta?.additionalInfo || "").trim()
    };

    if (!payload.originalCost && !payload.lowestCost && !payload.lowestCostDate && !payload.additionalInfo) {
      return base;
    }

    return `${base} ${META_PREFIX}${JSON.stringify(payload)}${META_SUFFIX}`.trim();
  }

  function parseDomain(url) {
    try {
      return new URL(url).hostname;
    } catch {
      return "invalid-url";
    }
  }

  function calcDiscount(current, original) {
    const c = Number(normalizeDigits(current));
    const o = Number(normalizeDigits(original));
    if (!o || !c || c >= o) return "NO DISCOUNT";
    return `${Math.round(((o - c) / o) * 1000) / 10}% OFF`;
  }

  function normalizeProduct(p) {
    const parsed = parsePriceMetaFromText(p.text ?? p.Text ?? "");

    return {
      id: Number(p.id ?? p.Id ?? 0),
      imageUrl: p.imageUrl ?? p.ImageUrl ?? "",
      linkUrl: p.linkUrl ?? p.LinkUrl ?? "",
      cost: normalizeDigits(p.cost ?? p.Cost ?? ""),
      text: parsed.cleanText,
      rawText: p.text ?? p.Text ?? "",
      priceMeta: parsed.meta,
      site: p.site ?? p.Site ?? "a",
      createdAt: p.createdAt ?? p.CreatedAt ?? ""
    };
  }

  function getMockProducts() {
    const source = window.CATALOG_MOCK_PRODUCTS || {};
    return Object.values(source).flatMap((arr) => (Array.isArray(arr) ? arr : [])).map(normalizeProduct);
  }

  function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
  }

  function readMockMap() {
    const base = deepClone(window.CATALOG_MOCK_PRODUCTS || {});
    try {
      const raw = localStorage.getItem(MOCK_STORE_KEY);
      if (!raw) return base;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return base;
      return parsed;
    } catch {
      return base;
    }
  }

  function writeMockMap(map) {
    window.CATALOG_MOCK_PRODUCTS = map;
    try {
      localStorage.setItem(MOCK_STORE_KEY, JSON.stringify(map));
    } catch {
      // ignore localStorage quota errors
    }
  }

  function nextMockId(map) {
    const all = Object.values(map)
      .flatMap((arr) => (Array.isArray(arr) ? arr : []))
      .map((x) => Number(x.id || 0));
    const max = all.length ? Math.max(...all) : 5000;
    return max + 1;
  }

  function fileToDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result || ""));
      reader.onerror = () => reject(new Error("Failed to read image file"));
      reader.readAsDataURL(file);
    });
  }

  function showTab(tab) {
    const onAdd = tab === "add";
    const onManage = tab === "manage";
    const onSettings = tab === "settings";

    addSection.classList.toggle("hidden", !onAdd);
    manageSection.classList.toggle("hidden", !onManage);
    settingsSection.classList.toggle("hidden", !onSettings);

    tabAdd.className = onAdd
      ? "px-4 py-2 rounded-lg bg-emerald-600 text-white"
      : "px-4 py-2 rounded-lg text-slate-300 hover:text-white";

    tabManage.className = onManage
      ? "px-4 py-2 rounded-lg bg-emerald-600 text-white"
      : "px-4 py-2 rounded-lg text-slate-300 hover:text-white";

    tabSettings.className = onSettings
      ? "px-4 py-2 rounded-lg bg-emerald-600 text-white"
      : "px-4 py-2 rounded-lg text-slate-300 hover:text-white";
  }

  function updateCounter() {
    countEl.textContent = String(textEl.value.length);
  }

  function updatePreview() {
    const linkUrl = linkUrlEl.value.trim();
    const current = normalizeDigits(costEl.value);
    const original = normalizeDigits(originalCostEl.value) || current;
    const lowest = normalizeDigits(lowestCostEl.value) || current;
    const lowestDate = lowestCostDateEl.value || "-";
    const text = textEl.value.trim();

    previewCost.innerHTML = `
      <div class="inline-flex items-center px-2 py-1 rounded-lg bg-rose-500/15 text-rose-300 font-semibold text-sm">${esc(calcDiscount(current, original))}</div>
      <div class="mt-2 text-emerald-300 font-semibold">Current: ${esc(formatKrw(current))}</div>
      <div class="text-slate-400 line-through">Original: ${esc(formatKrw(original))}</div>
      <div class="text-slate-300 text-sm">All-time low (${esc(lowestDate)}): ${esc(formatKrw(lowest))}</div>
    `;

    previewText.textContent = text || "Your description will appear here...";
    previewLink.href = isValidUrl(linkUrl) ? linkUrl : "#";
  }

  function setSettingsMsg(text, kind = "info") {
    settingsMsgEl.textContent = text;
    settingsMsgEl.className =
      "text-xs " +
      (kind === "ok" ? "text-emerald-300" : kind === "err" ? "text-red-300" : "text-slate-400");
  }

  function toggleHiddenDevMode(on) {
    hiddenDevMode = on;
    devConfigPanelEl.classList.toggle("hidden", !on);
    document.body.classList.toggle("dev-super", on);
    if (devModeLabel) devModeLabel.classList.toggle("hidden", !on);
    setSettingsMsg(on ? "Developer hidden mode enabled." : "Developer hidden mode disabled.", "ok");
  }

  function loadSettingsToForm() {
    const settings = readSiteSettings();
    selectedThemePreset = settings.themePreset || DEFAULT_SITE_SETTINGS.themePreset;
    cfgTitleEl.value = settings.texts.title || "";
    cfgNoticeEl.value = settings.texts.notice || "";
    cfgFooterEl.value = settings.texts.footer || "";

    devBodyBgEl.value = settings.dev.manualTheme.bodyBg || "";
    devCardBgEl.value = settings.dev.manualTheme.cardBg || "";
    devAccentEl.value = settings.dev.manualTheme.accent || "";
    devCircleColorEl.value = settings.dev.manualTheme.circleColor || "";
    devCircleSizeEl.value = settings.dev.manualTheme.circleSize || "";
    devCircleOpacityEl.value = settings.dev.manualTheme.circleOpacity || "";

    devTxtRefreshEl.value = settings.dev.textOverrides.refresh || "";
    devTxtAdminEl.value = settings.dev.textOverrides.admin || "";
    devTxtOpenProductEl.value = settings.dev.textOverrides.openProduct || "";
    devTxtProductInfoEl.value = settings.dev.textOverrides.productInfo || "";
    devTxtSearchEl.value = settings.dev.textOverrides.searchPlaceholder || "";
    devTxtSortNewEl.value = settings.dev.textOverrides.sortNew || "";
    devTxtSortOldEl.value = settings.dev.textOverrides.sortOld || "";
    devAllowEmptyEl.checked = Boolean(settings.dev.allowEmpty);

    renderThemePresetSelection();
    applyAdminTheme(settings);
  }

  function renderThemePresetSelection() {
    themePresetListEl?.querySelectorAll("[data-theme]").forEach((btn) => {
      const active = btn.dataset.theme === selectedThemePreset;
      btn.classList.toggle("border-emerald-400", active);
      btn.classList.toggle("text-emerald-300", active);
      if (active) {
        const theme = THEME_PRESETS[selectedThemePreset] || THEME_PRESETS.midnight;
        btn.style.borderColor = theme.accent;
        btn.style.color = theme.accent;
      } else {
        btn.style.borderColor = "";
        btn.style.color = "";
      }
    });
  }

  function applyAdminTheme(settingsArg) {
    const settings = settingsArg || readSiteSettings();
    const preset = settings?.themePreset || DEFAULT_SITE_SETTINGS.themePreset;
    const useManualTheme = developerSuperMode && Boolean(settings?.dev?.enabled);
    const theme = useManualTheme
      ? {
          ...(THEME_PRESETS[preset] || THEME_PRESETS.midnight),
          ...(settings?.dev?.manualTheme || {})
        }
      : (THEME_PRESETS[preset] || THEME_PRESETS.midnight);

    const styleId = "adminThemeDynamic";
    let styleEl = document.getElementById(styleId);
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = styleId;
      document.head.appendChild(styleEl);
    }

    const adminBackground = theme.flat
      ? `${theme.bodyBg} !important`
      : `
          radial-gradient(${theme.circleSize} ${theme.circleSize} at 15% 12%, ${theme.circleColor}, transparent 60%),
          radial-gradient(${theme.circleSize} ${theme.circleSize} at 84% 14%, ${theme.circleColor}, transparent 62%),
          ${theme.bodyBg} !important
        `;

    styleEl.textContent = `
      body {
        background: ${adminBackground};
      }
      body .bg-slate-900 {
        background-color: ${theme.cardBg} !important;
      }
      body .border-slate-800 {
        border-color: ${theme.borderColor || "rgba(71, 85, 105, 0.72)"} !important;
      }
      body .hover\\:border-slate-600:hover {
        border-color: ${theme.accent} !important;
      }
      body .bg-emerald-600 {
        background-color: ${theme.accent} !important;
      }
      body .hover\\:bg-emerald-500:hover {
        background-color: ${theme.accent} !important;
        filter: brightness(1.08);
      }
      body .text-emerald-300 {
        color: ${theme.accent} !important;
      }
      body #apiBadge {
        border: 1px solid rgba(148, 163, 184, 0.28);
      }
    `;
  }

  function closeEditPanel() {
    editingId = null;
    editPanel.classList.add("hidden");
    setManageMsg("");
  }

  function openEditPanel(item) {
    editingId = item.id;
    editIdEl.textContent = String(item.id);
    editLinkUrlEl.value = item.linkUrl;
    editCostEl.value = normalizeDigits(item.cost);
    editOriginalCostEl.value = normalizeDigits(item.priceMeta?.originalCost || "");
    editLowestCostEl.value = normalizeDigits(item.priceMeta?.lowestCost || "");
    editLowestCostDateEl.value = String(item.priceMeta?.lowestCostDate || "").slice(0, 10);
    const additionalInfo = String(item.priceMeta?.additionalInfo || "");
    editEnableExtraInfoEl.checked = Boolean(additionalInfo);
    editExtraInfoWrapEl.classList.toggle("hidden", !additionalInfo);
    editExtraInfoEl.value = additionalInfo;
    editTextEl.value = item.text;
    editSiteEl.value = item.site || "a";
    editInfoLinkEl.href = `./p4d6u2m9.html?id=${encodeURIComponent(item.id)}&site=${encodeURIComponent(item.site || "a")}${isMockMode() ? "&mock=1" : ""}`;
    editPanel.classList.remove("hidden");
    setManageMsg("Editing selected product.", "info");
  }

  function getFilteredManageItems() {
    const site = manageSiteEl.value;
    const q = (manageSearchEl.value || "").trim().toLowerCase();

    let items = allProducts.slice();

    if (site !== "all") {
      items = items.filter((x) => x.site === site);
    }

    if (q) {
      items = items.filter((x) =>
        String(x.id).includes(q) ||
        String(x.text).toLowerCase().includes(q) ||
        String(x.linkUrl).toLowerCase().includes(q) ||
        String(x.cost).toLowerCase().includes(q)
      );
    }

    items.sort((a, b) => b.id - a.id);
    return items;
  }

  function renderManageTable() {
    const items = getFilteredManageItems();

    if (!items.length) {
      manageRowsEl.innerHTML = "<tr><td colspan='5' class='py-4 text-slate-400'>No products found.</td></tr>";
      return;
    }

    manageRowsEl.innerHTML = items
      .map((p) => {
        const shortText = p.text.length > 85 ? `${p.text.slice(0, 85)}...` : p.text;
        const original = p.priceMeta?.originalCost || p.cost;
        const lowest = p.priceMeta?.lowestCost || p.cost;
        const lowestDate = p.priceMeta?.lowestCostDate || "-";
        const domain = parseDomain(p.linkUrl);

        return `
          <tr>
            <td class="py-3 pr-2 align-top">${p.id}</td>
            <td class="py-3 pr-2 align-top uppercase">${esc(p.site)}</td>
            <td class="py-3 pr-2 align-top">
              <div class="flex items-start gap-3">
                <img src="${esc(p.imageUrl)}" alt="thumb" class="w-14 h-14 rounded-lg object-cover border border-slate-700" loading="lazy" onerror="this.style.visibility='hidden';" />
                <div class="min-w-0">
                  <div class="text-slate-100">${esc(shortText)}</div>
                  <a class="text-xs text-slate-400 hover:text-slate-200" href="${esc(p.linkUrl)}" target="_blank" rel="noopener">${esc(domain)}</a>
                </div>
              </div>
            </td>
            <td class="py-3 pr-2 align-top">
              <div class="text-emerald-300 font-semibold">Current: ${esc(formatKrw(p.cost))}</div>
              <div class="text-slate-400 line-through text-xs">Original: ${esc(formatKrw(original))}</div>
              <div class="text-slate-300 text-xs">Low (${esc(lowestDate)}): ${esc(formatKrw(lowest))}</div>
            </td>
            <td class="py-3 pr-2 align-top">
              <div class="flex flex-wrap gap-2">
                <button type="button" data-action="edit" data-id="${p.id}" class="px-2 py-1 rounded-lg bg-slate-800 hover:bg-slate-700">Edit</button>
                <button type="button" data-action="delete" data-id="${p.id}" class="px-2 py-1 rounded-lg bg-red-700/70 hover:bg-red-700">Delete</button>
              </div>
            </td>
          </tr>
        `;
      })
      .join("");
  }

  async function pingApi() {
    if (isMockMode()) {
      apiBadge.textContent = developerSuperMode ? "API: mock (click to switch)" : "API: mock mode";
      apiBadge.className = "text-xs px-2 py-1 rounded-lg bg-amber-500/20 text-amber-300";
      if (developerSuperMode) apiBadge.classList.add("cursor-pointer");
      return;
    }

    apiBadge.textContent = "API: checking...";

    try {
      const res = await fetch(`/api/products`, {
        headers: { Accept: "application/json" },
        credentials: "same-origin"
      });
      if (!res.ok) throw new Error();

      apiBadge.textContent = developerSuperMode ? "API: online (click to switch)" : "API: online";
      apiBadge.className = "text-xs px-2 py-1 rounded-lg bg-emerald-600/20 text-emerald-300";
      if (developerSuperMode) apiBadge.classList.add("cursor-pointer");
    } catch {
      apiBadge.textContent = developerSuperMode ? "API: offline (click to switch)" : "API: offline";
      apiBadge.className = "text-xs px-2 py-1 rounded-lg bg-red-600/20 text-red-300";
      if (developerSuperMode) apiBadge.classList.add("cursor-pointer");
    }
  }

  async function loadManageProducts() {
    if (isMockMode()) {
      const map = readMockMap();
      writeMockMap(map);
      allProducts = getMockProducts();
      renderManageTable();
      setManageMsg(`Loaded ${allProducts.length} mock product(s).`, "ok");
      return;
    }

    setManageMsg("Loading products...", "info");

    try {
      const res = await fetch(`/api/products`, {
        headers: { Accept: "application/json" },
        credentials: "same-origin"
      });
      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      const data = await res.json();
      allProducts = Array.isArray(data) ? data.map(normalizeProduct) : [];
      renderManageTable();
      setManageMsg(`Loaded ${allProducts.length} product(s).`, "ok");

      if (editingId !== null) {
        const updated = allProducts.find((x) => x.id === editingId);
        if (updated) openEditPanel(updated);
        else closeEditPanel();
      }
    } catch (err) {
      allProducts = [];
      renderManageTable();
      setManageMsg(`Failed to load: ${err?.message || "Unknown error"}`, "err");
    }
  }

  imageFileEl.addEventListener("change", () => {
    const file = imageFileEl.files[0];

    if (!file) {
      previewImage.classList.add("hidden");
      previewSkeleton.classList.remove("hidden");
      return;
    }

    const url = URL.createObjectURL(file);
    previewImage.src = url;

    previewImage.onload = () => {
      previewSkeleton.classList.add("hidden");
      previewImage.classList.remove("hidden");
    };
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const file = imageFileEl.files[0];
    const linkUrl = linkUrlEl.value.trim();
    const currentCost = normalizeDigits(costEl.value.trim());
    const originalCost = normalizeDigits(originalCostEl.value.trim());
    const lowestCost = normalizeDigits(lowestCostEl.value.trim());
    const lowestCostDate = (lowestCostDateEl.value || "").trim();
    const additionalInfo = enableExtraInfoEl.checked ? String(extraInfoEl.value || "").trim() : "";
    const cleanText = textEl.value.trim();
    const text = appendPriceMetaToText(cleanText, { originalCost, lowestCost, lowestCostDate, additionalInfo });

    if (!file) {
      setMsg("Image file required", "err");
      return;
    }
    if (!isValidUrl(linkUrl)) {
      setMsg("Invalid product URL", "err");
      return;
    }
    if (!currentCost) {
      setMsg("Current cost required", "err");
      return;
    }
    if (!cleanText) {
      setMsg("Text required", "err");
      return;
    }

    if (isMockMode()) {
      submitBtn.disabled = true;
      setMsg("Saving to mock data...", "info");
      try {
        const map = readMockMap();
        const id = nextMockId(map);
        const dataUrl = file ? await fileToDataUrl(file) : "";
        const site = siteEl.value || "a";
        const item = {
          id,
          site,
          imageUrl: dataUrl || "/image.png",
          linkUrl,
          cost: currentCost,
          text,
          createdAt: new Date().toISOString()
        };
        if (!Array.isArray(map[site])) map[site] = [];
        map[site].push(item);
        writeMockMap(map);

        setMsg(`Mock product created (#${id}).`, "ok");
        form.reset();
        extraInfoWrapEl.classList.add("hidden");
        previewImage.classList.add("hidden");
        previewSkeleton.classList.remove("hidden");
        updateCounter();
        updatePreview();
        await loadManageProducts();
      } catch (err) {
        setMsg(`Mock create failed: ${err?.message || "Unknown error"}`, "err");
      } finally {
        submitBtn.disabled = false;
      }
      return;
    }

    submitBtn.disabled = true;
    setMsg("Uploading...", "info");

    try {
      const formData = new FormData();
      formData.append("image", file);
      formData.append("linkUrl", linkUrl);
      formData.append("url", linkUrl);
      formData.append("cost", currentCost);
      formData.append("costRaw", currentCost);
      formData.append("text", text);
      formData.append("site", siteEl.value);
      formData.append("catalog", siteEl.value);

      const res = await fetch(`/api/products`, {
        method: "POST",
        body: formData,
        credentials: "same-origin"
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      setMsg("Created", "ok");
      form.reset();
      extraInfoWrapEl.classList.add("hidden");
      previewImage.classList.add("hidden");
      previewSkeleton.classList.remove("hidden");
      updateCounter();
      updatePreview();

      await loadManageProducts();
    } catch (err) {
      setMsg(`Failed to create: ${err?.message || "Unknown error"}`, "err");
    } finally {
      submitBtn.disabled = false;
    }
  });

  editForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (editingId === null) {
      setManageMsg("No product selected.", "err");
      return;
    }

    const cleanText = editTextEl.value.trim();
    const payload = {
      linkUrl: editLinkUrlEl.value.trim(),
      cost: normalizeDigits(editCostEl.value),
      text: appendPriceMetaToText(cleanText, {
        originalCost: normalizeDigits(editOriginalCostEl.value),
        lowestCost: normalizeDigits(editLowestCostEl.value),
        lowestCostDate: (editLowestCostDateEl.value || "").trim(),
        additionalInfo: editEnableExtraInfoEl.checked ? String(editExtraInfoEl.value || "").trim() : ""
      }),
      site: editSiteEl.value
    };

    if (!isValidUrl(payload.linkUrl)) {
      setManageMsg("Invalid product URL.", "err");
      return;
    }
    if (!payload.cost) {
      setManageMsg("Current cost required.", "err");
      return;
    }
    if (!cleanText) {
      setManageMsg("Text required.", "err");
      return;
    }

    if (isMockMode()) {
      try {
        const map = readMockMap();
        const groups = Object.keys(map);
        let updated = false;

        groups.forEach((groupSite) => {
          if (!Array.isArray(map[groupSite])) return;
          map[groupSite] = map[groupSite].filter((x) => Number(x.id) !== editingId);
        });

        const site = payload.site || "a";
        if (!Array.isArray(map[site])) map[site] = [];
        const existing = allProducts.find((x) => x.id === editingId);
        map[site].push({
          id: editingId,
          site,
          imageUrl: existing?.imageUrl || "/image.png",
          linkUrl: payload.linkUrl,
          cost: payload.cost,
          text: payload.text,
          createdAt: existing?.createdAt || new Date().toISOString()
        });
        updated = true;

        if (!updated) throw new Error("Product not found in mock data");

        writeMockMap(map);
        setManageMsg("Mock product updated.", "ok");
        await loadManageProducts();
      } catch (err) {
        setManageMsg(`Mock update failed: ${err?.message || "Unknown error"}`, "err");
      }
      return;
    }

    setManageMsg("Saving changes...", "info");

    try {
      const res = await fetch(`/api/products/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const t = await res.text();
        throw new Error(t || `HTTP ${res.status}`);
      }

      setManageMsg("Product updated.", "ok");
      await loadManageProducts();
    } catch (err) {
      setManageMsg(`Update failed: ${err?.message || "Unknown error"}`, "err");
    }
  });

  manageRowsEl.addEventListener("click", async (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;

    const button = target.closest("button[data-action][data-id]");
    if (!(button instanceof HTMLButtonElement)) return;

    const action = button.dataset.action;
    const idRaw = button.dataset.id;
    if (!action || !idRaw) return;

    const id = Number(idRaw);
    if (!Number.isFinite(id)) {
      setManageMsg("Invalid product id in table row.", "err");
      return;
    }

    const item = allProducts.find((x) => Number(x.id) === id);
    if (!item) {
      setManageMsg(`Product #${id} not found in current list. Click Refresh.`, "err");
      return;
    }

    if (action === "edit") {
      openEditPanel(item);
      return;
    }

    if (action === "delete") {
      if (isMockMode()) {
        try {
          const map = readMockMap();
          Object.keys(map).forEach((groupSite) => {
            if (!Array.isArray(map[groupSite])) return;
            map[groupSite] = map[groupSite].filter((x) => Number(x.id) !== id);
          });
          writeMockMap(map);
          if (editingId === id) closeEditPanel();
          await loadManageProducts();
          setManageMsg(`Mock product #${id} deleted.`, "ok");
        } catch (err) {
          setManageMsg(`Mock delete failed: ${err?.message || "Unknown error"}`, "err");
        }
        return;
      }

      const ok = window.confirm(`Delete product #${id}?`);
      if (!ok) return;

      setManageMsg(`Deleting #${id}...`, "info");

      try {
        const res = await fetch(`/api/products/${id}`, {
          method: "DELETE",
          credentials: "same-origin"
        });

        if (!res.ok && res.status !== 404) {
          const t = await res.text();
          throw new Error(t || `HTTP ${res.status}`);
        }

        if (editingId === id) closeEditPanel();

        await loadManageProducts();
        setManageMsg(`Product #${id} deleted.`, "ok");
      } catch (err) {
        setManageMsg(`Delete failed: ${err?.message || "Unknown error"}`, "err");
      }
    }
  });

  function readSettingsFromForm() {
    const current = readSiteSettings();
    const next = deepClone(current);
    next.themePreset = selectedThemePreset;
    next.texts.title = String(cfgTitleEl.value || "").trim();
    next.texts.notice = String(cfgNoticeEl.value || "").trim();
    next.texts.footer = String(cfgFooterEl.value || "").trim();
    return next;
  }

  function readDevSettingsFromForm() {
    const current = readSiteSettings();
    const next = deepClone(current);
    next.dev.enabled = true;
    next.dev.manualTheme.bodyBg = String(devBodyBgEl.value || "").trim();
    next.dev.manualTheme.cardBg = String(devCardBgEl.value || "").trim();
    next.dev.manualTheme.accent = String(devAccentEl.value || "").trim();
    next.dev.manualTheme.circleColor = String(devCircleColorEl.value || "").trim();
    next.dev.manualTheme.circleSize = String(devCircleSizeEl.value || "").trim();
    next.dev.manualTheme.circleOpacity = String(devCircleOpacityEl.value || "").trim();
    next.dev.textOverrides.refresh = String(devTxtRefreshEl.value || "").trim();
    next.dev.textOverrides.admin = String(devTxtAdminEl.value || "").trim();
    next.dev.textOverrides.openProduct = String(devTxtOpenProductEl.value || "").trim();
    next.dev.textOverrides.productInfo = String(devTxtProductInfoEl.value || "").trim();
    next.dev.textOverrides.searchPlaceholder = String(devTxtSearchEl.value || "").trim();
    next.dev.textOverrides.sortNew = String(devTxtSortNewEl.value || "").trim();
    next.dev.textOverrides.sortOld = String(devTxtSortOldEl.value || "").trim();
    next.dev.allowEmpty = Boolean(devAllowEmptyEl.checked);
    return next;
  }

  function hasInvalidBlankSettings(settings, allowEmpty) {
    if (allowEmpty) return false;
    return !settings.texts.title || !settings.texts.notice || !settings.texts.footer;
  }

  tabAdd.addEventListener("click", () => showTab("add"));
  tabManage.addEventListener("click", () => showTab("manage"));
  tabSettings.addEventListener("click", () => showTab("settings"));

  themePresetListEl?.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLElement)) return;
    const btn = target.closest("[data-theme]");
    if (!(btn instanceof HTMLButtonElement)) return;
    const theme = btn.dataset.theme;
    if (!theme || !THEME_PRESETS[theme]) return;
    const current = readSiteSettings();
    const next = deepClone(current);
    selectedThemePreset = theme;
    next.themePreset = theme;
    next.dev.enabled = false;
    backupSiteSettings(current);
    writeSiteSettings(next);
    renderThemePresetSelection();
    applyAdminTheme(next);
    setSettingsMsg(`Preset selected and applied: ${theme}`, "ok");
  });

  cfgSaveEl?.addEventListener("click", () => {
    const next = readSettingsFromForm();
    const current = readSiteSettings();
    next.dev.enabled = false;
    if (hasInvalidBlankSettings(next, current.dev.allowEmpty)) {
      setSettingsMsg("Title/notice/footer cannot be empty.", "err");
      return;
    }
    backupSiteSettings(current);
    writeSiteSettings(next);
    applyAdminTheme(next);
    setSettingsMsg("Configuration saved (preset mode). Refresh catalog tab to see changes.", "ok");
  });

  cfgResetEl?.addEventListener("click", () => {
    backupSiteSettings(readSiteSettings());
    writeSiteSettings(deepClone(DEFAULT_SITE_SETTINGS));
    selectedThemePreset = DEFAULT_SITE_SETTINGS.themePreset;
    loadSettingsToForm();
    toggleHiddenDevMode(false);
    setSettingsMsg("Reset to default settings.", "ok");
  });

  logoConfigTriggerEl?.addEventListener("click", () => {
    if (!developerSuperMode) return;
    logoTapCount += 1;
    if (logoTapTimer) clearTimeout(logoTapTimer);
    logoTapTimer = setTimeout(() => {
      logoTapCount = 0;
    }, 1200);
    if (logoTapCount >= 3) {
      logoTapCount = 0;
      toggleHiddenDevMode(!hiddenDevMode);
    }
  });

  devApplyEl?.addEventListener("click", () => {
    if (!hiddenDevMode) return;
    const current = readSiteSettings();
    const next = readDevSettingsFromForm();
    if (!next.dev.allowEmpty) {
      const required = [
        next.dev.textOverrides.searchPlaceholder,
        next.dev.textOverrides.refresh,
        next.dev.textOverrides.admin,
        next.dev.textOverrides.openProduct,
        next.dev.textOverrides.productInfo,
        next.dev.textOverrides.sortNew,
        next.dev.textOverrides.sortOld
      ];
      if (required.some((x) => !x)) {
        setSettingsMsg("Developer text fields cannot be empty without allow-empty.", "err");
        return;
      }
    } else {
      const ok = window.confirm("You enabled empty texts. This can hide buttons/text. Continue?");
      if (!ok) return;
    }
    backupSiteSettings(current);
    writeSiteSettings(next);
    applyAdminTheme(next);
    setSettingsMsg("Developer settings saved.", "ok");
  });

  devRestoreEl?.addEventListener("click", () => {
    const backup = restoreSiteSettingsBackup();
    if (!backup) {
      setSettingsMsg("No backup found.", "err");
      return;
    }
    writeSiteSettings(backup);
    loadSettingsToForm();
    setSettingsMsg("Restored previous settings.", "ok");
  });
  window.addEventListener("storage", (e) => {
    if (e.key !== SITE_SETTINGS_KEY) return;
    loadSettingsToForm();
  });

  linkUrlEl.addEventListener("input", updatePreview);
  costEl.addEventListener("input", () => {
    costEl.value = normalizeDigits(costEl.value);
    updatePreview();
  });
  originalCostEl.addEventListener("input", () => {
    originalCostEl.value = normalizeDigits(originalCostEl.value);
    updatePreview();
  });
  lowestCostEl.addEventListener("input", () => {
    lowestCostEl.value = normalizeDigits(lowestCostEl.value);
    updatePreview();
  });
  lowestCostDateEl.addEventListener("change", updatePreview);
  enableExtraInfoEl.addEventListener("change", () => {
    const on = enableExtraInfoEl.checked;
    extraInfoWrapEl.classList.toggle("hidden", !on);
    if (!on) extraInfoEl.value = "";
  });
  textEl.addEventListener("input", () => {
    updateCounter();
    updatePreview();
  });

  editCostEl.addEventListener("input", () => {
    editCostEl.value = normalizeDigits(editCostEl.value);
  });
  editOriginalCostEl.addEventListener("input", () => {
    editOriginalCostEl.value = normalizeDigits(editOriginalCostEl.value);
  });
  editLowestCostEl.addEventListener("input", () => {
    editLowestCostEl.value = normalizeDigits(editLowestCostEl.value);
  });
  editEnableExtraInfoEl.addEventListener("change", () => {
    const on = editEnableExtraInfoEl.checked;
    editExtraInfoWrapEl.classList.toggle("hidden", !on);
    if (!on) editExtraInfoEl.value = "";
  });

  manageSearchEl.addEventListener("input", renderManageTable);
  manageSiteEl.addEventListener("change", renderManageTable);
  manageRefreshEl.addEventListener("click", loadManageProducts);
  editCancelEl.addEventListener("click", closeEditPanel);
  apiBadge?.addEventListener("click", async () => {
    if (!developerSuperMode) return;
    sourceMode = isMockMode() ? "api" : "mock";
    try {
      sessionStorage.setItem(DEV_SOURCE_MODE_KEY, sourceMode);
    } catch {
      // ignore storage errors
    }
    await pingApi();
    await loadManageProducts();
    setManageMsg(`Developer source switched to ${isMockMode() ? "MOCK" : "API"}.`, "ok");
  });

  updateCounter();
  updatePreview();
  extraInfoWrapEl.classList.add("hidden");
  editExtraInfoWrapEl.classList.add("hidden");
  devConfigPanelEl.classList.add("hidden");
  loadSettingsToForm();
  showTab("add");
  pingApi();
  loadManageProducts();
})();

