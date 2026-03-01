// app.js — Catalog Viewer (read-only)

(() => {

const API_BASE = "http://localhost:5138";

const grid = document.getElementById("grid");
const statusEl = document.getElementById("status");
const countEl = document.getElementById("count");
const qEl = document.getElementById("q");
const sortEl = document.getElementById("sort");
const refreshBtn = document.getElementById("refresh");

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
    text: p.text ?? p.Text ?? ""
  };
}

// convert relative image path to full url
function resolveImage(url){

  if(!url) return "";

  if(url.startsWith("http")) return url;

  return API_BASE + url;
}

// ---------- sorting ----------

function sortProducts(items,mode){

  const arr = items.slice();

  arr.sort((a,b)=>{

    const ax = a.id ?? 0;
    const bx = b.id ?? 0;

    return mode === "old" ? ax - bx : bx - ax;

  });

  return arr;

}

// ---------- rendering ----------

function renderProducts(items){

  countEl.textContent = `${items.length} item(s)`;

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
    const text = escapeHtml(p.text);

    return `
      <div class="rounded-2xl overflow-hidden bg-slate-900 border border-slate-800 hover:border-slate-600 transition">

        <div class="aspect-[4/3] bg-slate-950 overflow-hidden">

          <img src="${img}"
          class="w-full h-full object-cover"
          loading="lazy"/>

        </div>

        <div class="p-4 space-y-3">

          <div class="text-slate-200 line-clamp-3">${text}</div>

          <a href="${link}" target="_blank"
          class="inline-flex items-center justify-center px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 transition">

            Open →

          </a>

        </div>

      </div>
    `;

  }).join("");

}

// ---------- filters ----------

function applyFilters(){

  const q = (qEl?.value || "").toLowerCase();
  const sortMode = sortEl?.value || "new";

  let items = sortProducts(allProducts,sortMode);

  if(q){

    items = items.filter(p =>
      (p.text || "").toLowerCase().includes(q)
    );

  }

  renderProducts(items);

}

// ---------- API ----------

async function loadProducts(){

  statusEl.textContent = "Loading...";

  try{

    const res = await fetch(`${API_BASE}/api/products`);

    if(!res.ok) throw new Error();

    const data = await res.json();

    allProducts = data.map(normalizeProduct);

    statusEl.textContent = "Loaded.";

  }catch{

    statusEl.textContent = "API not available.";

    allProducts = [];

  }

  applyFilters();

}

// ---------- events ----------

qEl?.addEventListener("input",applyFilters);
sortEl?.addEventListener("change",applyFilters);
refreshBtn?.addEventListener("click",loadProducts);

// ---------- init ----------

loadProducts();

})();