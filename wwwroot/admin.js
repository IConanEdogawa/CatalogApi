(() => {

const el = (id) => document.getElementById(id);


const form = el("form");
const imageFileEl = el("imageFile");
const linkUrlEl = el("linkUrl");
const textEl = el("text");
const siteEl = el("site");

const previewImage = el("previewImage");
const previewSkeleton = el("previewSkeleton");
const previewText = el("previewText");
const previewLink = el("previewLink");

const submitBtn = el("submitBtn");
const msgEl = el("msg");
const countEl = el("count");
const apiBadge = el("apiBadge");
let authHeader = sessionStorage.getItem("adminBasicAuth") || "";

// ---------- helpers ----------

function setMsg(text, kind="info"){
  msgEl.textContent = text;
  msgEl.className =
    "text-sm " +
    (kind === "ok"
      ? "text-emerald-400"
      : kind === "err"
      ? "text-red-400"
      : "text-slate-300");
}

function isValidUrl(s){
  try{
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  }catch{
    return false;
  }
}

function updateCounter(){
  countEl.textContent = textEl.value.length;
}

function toBasicHeader(username, password){
  return "Basic " + btoa(`${username}:${password}`);
}

function askCredentials(){
  const username = window.prompt("Admin login:", "admin");
  if(username === null) return null;

  const password = window.prompt("Admin password:");
  if(password === null) return null;

  return toBasicHeader(username, password);
}

async function fetchWithRetry(url, options = {}){
  const makeRequest = async (headerValue) => {
    const headers = new Headers(options.headers || {});
    if(headerValue){
      headers.set("Authorization", headerValue);
    }

    return fetch(url, {
      ...options,
      headers
    });
  };

  let res = await makeRequest(authHeader);

  if(res.status !== 401){
    return res;
  }

  const nextHeader = askCredentials();
  if(!nextHeader){
    return res;
  }

  authHeader = nextHeader;
  sessionStorage.setItem("adminBasicAuth", authHeader);

  res = await makeRequest(authHeader);

  if(res.status === 401){
    sessionStorage.removeItem("adminBasicAuth");
    authHeader = "";
  }

  return res;
}

// ---------- preview ----------

function updatePreview(){
  const linkUrl = linkUrlEl.value.trim();
  const text = textEl.value.trim();

  previewText.textContent = text || "Your description will appear here...";
  previewLink.href = isValidUrl(linkUrl) ? linkUrl : "#";
}

imageFileEl.addEventListener("change", () => {
  const file = imageFileEl.files[0];

  if(!file){
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

// ---------- API ping ----------

async function pingApi(){
  apiBadge.textContent = "API: checking...";

  try{
    const res = await fetchWithRetry(`/api/products`, {
      headers: { "Accept": "application/json" }
    });
    if(!res.ok) throw new Error();

    apiBadge.textContent = "API: online";
    apiBadge.className = "text-xs px-2 py-1 rounded-lg bg-emerald-600/20 text-emerald-300";
  }catch{
    apiBadge.textContent = "API: offline";
    apiBadge.className = "text-xs px-2 py-1 rounded-lg bg-red-600/20 text-red-300";
  }
}

// ---------- form submit ----------

form.addEventListener("submit", async (e) => {
  e.preventDefault();

  const file = imageFileEl.files[0];
  const linkUrl = linkUrlEl.value.trim();
  const text = textEl.value.trim();

  if(!file){ setMsg("Image file required", "err"); return; }
  if(!isValidUrl(linkUrl)){ setMsg("Invalid product URL", "err"); return; }
  if(!text){ setMsg("Text required", "err"); return; }

  submitBtn.disabled = true;
  setMsg("Uploading...", "info");

  try{
    const formData = new FormData();
    formData.append("image", file);
    formData.append("linkUrl", linkUrl);
    formData.append("text", text);
    formData.append("site", siteEl.value);

    // same-origin POST
    const res = await fetchWithRetry(`/api/products`, {
      method: "POST",
      body: formData
    });

    if(!res.ok){
      if(res.status === 401){
        throw new Error("UNAUTHORIZED");
      }
      const t = await res.text();
      throw new Error(t || `HTTP ${res.status}`);
    }

    setMsg("Created ✅", "ok");
    form.reset();

    previewImage.classList.add("hidden");
    previewSkeleton.classList.remove("hidden");

    updateCounter();
    updatePreview();
  }catch(err){
    if(err && err.message === "UNAUTHORIZED"){
      setMsg("Invalid login/password. Try again.", "err");
    }else{
      setMsg("Failed to create (check login/password).", "err");
    }
  }finally{
    submitBtn.disabled = false;
  }
});

// ---------- events ----------
linkUrlEl.addEventListener("input", updatePreview);
textEl.addEventListener("input", () => { updatePreview(); updateCounter(); });

// ---------- init ----------
updateCounter();
updatePreview();
pingApi();

})();
