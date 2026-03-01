(() => {

const API_BASE = "http://localhost:5138";

const el = (id) => document.getElementById(id);

const form = el("form");
const imageFileEl = el("imageFile");
const linkUrlEl = el("linkUrl");
const textEl = el("text");

const previewImage = el("previewImage");
const previewSkeleton = el("previewSkeleton");
const previewText = el("previewText");
const previewLink = el("previewLink");

const submitBtn = el("submitBtn");
const msgEl = el("msg");
const countEl = el("count");
const apiBadge = el("apiBadge");


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

// ---------- preview ----------

function updatePreview(){

  const linkUrl = linkUrlEl.value.trim();
  const text = textEl.value.trim();

  previewText.textContent = text || "Your description will appear here...";
  previewLink.href = isValidUrl(linkUrl) ? linkUrl : "#";

}

// preview image when file selected
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

    const res = await fetch(`${API_BASE}/api/products`);

    if(!res.ok) throw new Error();

    apiBadge.textContent = "API: online";
    apiBadge.className =
      "text-xs px-2 py-1 rounded-lg bg-emerald-600/20 text-emerald-300";

  }catch{

    apiBadge.textContent = "API: offline";
    apiBadge.className =
      "text-xs px-2 py-1 rounded-lg bg-red-600/20 text-red-300";

  }

}


// ---------- form submit ----------

form.addEventListener("submit", async (e) => {

  e.preventDefault();

  const file = imageFileEl.files[0];
  const linkUrl = linkUrlEl.value.trim();
  const text = textEl.value.trim();

  if(!file){
    setMsg("Image file required", "err");
    return;
  }

  if(!isValidUrl(linkUrl)){
    setMsg("Invalid product URL", "err");
    return;
  }

  if(!text){
    setMsg("Text required", "err");
    return;
  }

  submitBtn.disabled = true;
  setMsg("Uploading...", "info");

  try{

    const formData = new FormData();

    formData.append("image", file);
    formData.append("linkUrl", linkUrl);
    formData.append("text", text);

    const res = await fetch(`${API_BASE}/api/products`, {
      method: "POST",
      body: formData
    });

    if(!res.ok){
      const t = await res.text();
      throw new Error(t);
    }

    setMsg("Created ✅", "ok");

    form.reset();

    previewImage.classList.add("hidden");
    previewSkeleton.classList.remove("hidden");

    updateCounter();
    updatePreview();

  }catch(err){

    setMsg("Failed to create", "err");

  }

  submitBtn.disabled = false;

});


// ---------- events ----------

linkUrlEl.addEventListener("input", updatePreview);
textEl.addEventListener("input", () => {
  updatePreview();
  updateCounter();
});


// ---------- init ----------

updateCounter();
updatePreview();
pingApi();

})();