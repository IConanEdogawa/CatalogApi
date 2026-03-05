// app.js — Catalog Viewer (read-only)

(() => {

const site = document.body.dataset.site || "a";
const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const qEl = document.getElementById("q");
const sortEl = document.getElementById("sort");
const refreshBtn = document.getElementById("refresh");

// style helpers for alternate look
function cardClasses(){
  // site b will render a simple horizontal list entry
  if(site === "b"){
    return "flex flex-col sm:flex-row items-center bg-gray-100 border-b border-gray-300 p-4 gap-4";
  }
  // site c is the light card
  if(site === "c"){
    return "rounded-lg overflow-hidden bg-white border border-slate-200 hover:shadow-lg transition";
  }
  // default (site a) dark rounded card
  return "rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-600 transition";
}

function imageWrapperClasses(){
  if(site === "b"){
    // fixed height banner on left
    return "w-full sm:w-1/4 h-32 bg-gray-200 overflow-hidden flex-shrink-0";
  }
  if(site === "c"){
    return "aspect-[4/3] bg-slate-50 overflow-hidden";
  }
  return "aspect-[4/3] bg-slate-950 overflow-hidden";
}

function textClasses(){
  if(site === "b"){
    return "text-gray-800 text-base sm:text-lg"; // no clamp
  }
  return site === "c" ? "text-slate-900 line-clamp-3" : "text-slate-200 line-clamp-3";
}

function linkButtonClasses(){
  if(site === "b"){
    return "text-indigo-600 hover:underline text-sm sm:text-base";
  }
  return site === "c"
    ? "inline-flex items-center justify-center px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 transition text-white"
    : "inline-flex items-center justify-center px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition";
}

function costClasses(){
  if(site === "b"){
    return "inline-flex items-center px-2 py-1 rounded-md bg-emerald-100 text-emerald-800 font-semibold text-sm";
  }
  return site === "c"
    ? "inline-flex items-center px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 font-semibold text-sm"
    : "inline-flex items-center px-2 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 font-semibold text-sm";
}

let allProducts = [];

// ---------- helpers ----------

function escapeHtml(str){
  return String(str ?? "")
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;");
}

function normalizeProduct(p){
  return {
    id: p.id ?? p.Id ?? 0,
    imageUrl: p.imageUrl ?? p.ImageUrl ?? "",
    linkUrl: p.linkUrl ?? p.LinkUrl ?? "",
    cost: p.cost ?? p.Cost ?? "",
    text: p.text ?? p.Text ?? ""
  };
}

// On same domain: "/uploads/..." is already correct.
// If admin ever stores full http url, also ok.
function resolveImage(url){
  if(!url) return "";
  return url; // keep as-is
}

function sortProducts(items,mode){
  const arr = items.slice();
  arr.sort((a,b)=>{
    const ax = a.id ?? 0;
    const bx = b.id ?? 0;
    return mode === "old" ? ax - bx : bx - ax;
  });
  return arr;
}

function renderProducts(items){

  countEl.textContent = items.length ? `${items.length} item(s)` : "";

  if(!items.length){
    grid.innerHTML = `
      <div class="col-span-full p-6 rounded-2xl bg-slate-900 border border-slate-800">
        No products yet.
      </div>
    `;
    return;
  }

  grid.innerHTML = items.map(p=>{

    const img = resolveImage(p.imageUrl);
    const link = escapeHtml(p.linkUrl);
    const cost = escapeHtml(p.cost || "");
    const text = escapeHtml(p.text);

    // build markup with classes determined by helpers
    return `
      <div class="${cardClasses()}">
        <div class="${imageWrapperClasses()}">
          <img src="${img}" alt="product"
               class="w-full h-full object-cover"
               loading="lazy"
               onerror="this.style.display='none'; this.parentElement.innerHTML='<div class=\\'p-4 text-slate-400\\'>Image failed to load</div>';" />
        </div>

        <div class="p-4 space-y-3">
          <div class="${costClasses()}">${cost || "Price unavailable"}</div>

          <div class="${textClasses()}">${text}</div>

          <a href="${link}" target="_blank" rel="noopener"
             class="${linkButtonClasses()}">
            Open →
          </a>
        </div>
      </div>
    `;
  }).join("");
}

function applyFilters(){

  const q = (qEl?.value || "").toLowerCase().trim();
  const sortMode = sortEl?.value || "new";

  let items = sortProducts(allProducts, sortMode);

  if(q){
    items = items.filter(p =>
      (p.text || "").toLowerCase().includes(q) ||
      (p.cost || "").toLowerCase().includes(q));
  }

  statusEl.textContent = "Loaded.";
  renderProducts(items);
}

async function loadProducts(){

  statusEl.textContent = "Loading...";

  try{
    const res = await fetch(`/api/products?site=${site}`, {
  headers: { "Accept": "application/json" }
});

    if(!res.ok){
      const t = await res.text();
      throw new Error(t || `HTTP ${res.status}`);
    }

    const data = await res.json();
    allProducts = Array.isArray(data) ? data.map(normalizeProduct) : [];
  }
  catch(e){
    statusEl.textContent = "Failed to load.";
    allProducts = [];
  }

  applyFilters();
}

// events
qEl?.addEventListener("input", applyFilters);
sortEl?.addEventListener("change", applyFilters);
refreshBtn?.addEventListener("click", loadProducts);

// init
loadProducts();

})();
