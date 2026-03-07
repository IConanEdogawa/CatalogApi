const API_LOGIN = "/api/admin/login"; // сделаем такой endpoint в .NET

const form = document.getElementById("form");
const email = document.getElementById("email");
const key = document.getElementById("key");
const btn = document.getElementById("btn");
const btnText = document.getElementById("btnText");
const msg = document.getElementById("msg");
const showKey = document.getElementById("showKey");
const card = document.querySelector(".card");
const blob1 = document.querySelector(".blob.b1");
const blob2 = document.querySelector(".blob.b2");
const cursorDot = document.getElementById("cursorDot");
const cursorRing = document.getElementById("cursorRing");
const loginBrandTitle = document.getElementById("loginBrandTitle");

const SITE_SETTINGS_KEY = "catalog_site_a_settings_v1";
const isStandalonePwa =
  (window.matchMedia && window.matchMedia("(display-mode: standalone)").matches) ||
  window.navigator.standalone === true;
const developerModeAvailable = !isStandalonePwa;

const THEME_PRESETS = {
  legacy: { bodyBg: "#020617", cardBg: "#0f172a", accent: "#059669", borderColor: "#1e293b", circleColor: "transparent", circleSize: "340px", circleOpacity: "0", flat: true },
  midnight: { bodyBg: "#020617", cardBg: "rgba(15,23,42,.92)", accent: "#10b981", circleColor: "rgba(56,189,248,.25)", circleSize: "420px", circleOpacity: "0.35" },
  ocean: { bodyBg: "#04111f", cardBg: "rgba(7,29,48,.9)", accent: "#38bdf8", circleColor: "rgba(59,130,246,.28)", circleSize: "460px", circleOpacity: "0.34" },
  forest: { bodyBg: "#03110a", cardBg: "rgba(6,31,19,.92)", accent: "#22c55e", circleColor: "rgba(16,185,129,.24)", circleSize: "440px", circleOpacity: "0.32" },
  amber: { bodyBg: "#1a1102", cardBg: "rgba(53,33,6,.9)", accent: "#f59e0b", circleColor: "rgba(245,158,11,.25)", circleSize: "430px", circleOpacity: "0.3" },
  mono: { bodyBg: "#0b0b0b", cardBg: "rgba(30,30,30,.94)", accent: "#a3a3a3", circleColor: "rgba(212,212,212,.2)", circleSize: "400px", circleOpacity: "0.28" }
};

function readSiteSettings() {
  try {
    const raw = localStorage.getItem(SITE_SETTINGS_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function applyLoginSettings() {
  const settings = readSiteSettings();
  if (!settings) return;

  const title = settings?.texts?.title;
  if (title && loginBrandTitle) loginBrandTitle.textContent = title;

  const preset = settings?.themePreset;
  const useManualTheme = developerModeAvailable && Boolean(settings?.dev?.enabled);
  const theme = useManualTheme
    ? {
        ...(THEME_PRESETS[preset] || THEME_PRESETS.midnight),
        ...(settings?.dev?.manualTheme || {})
      }
    : (THEME_PRESETS[preset] || THEME_PRESETS.midnight);

  document.documentElement.style.setProperty("--bg", theme.bodyBg);
  document.documentElement.style.setProperty("--card", theme.cardBg);
  document.documentElement.style.setProperty("--card2", theme.cardBg);
  document.documentElement.style.setProperty("--accent1", theme.accent);
  document.documentElement.style.setProperty("--accent2", theme.accent);
}

const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const isTouch = window.matchMedia("(pointer: coarse)").matches;
const allowMotion = !prefersReducedMotion;
const allowCustomCursor = allowMotion && !isTouch;

let mouseX = window.innerWidth / 2;
let mouseY = window.innerHeight / 2;
let ringX = mouseX;
let ringY = mouseY;

showKey.addEventListener("change", () => {
  key.type = showKey.checked ? "text" : "password";
});

function setMsg(text, type) {
  msg.className = "msg show " + (type === "ok" ? "ok" : "err");
  msg.textContent = text;

  if (type !== "ok" && card) {
    card.classList.remove("shake");
    void card.offsetWidth;
    card.classList.add("shake");
  }
}

function setLoading(isLoading) {
  btn.disabled = isLoading;
  btnText.textContent = isLoading ? "Signing in..." : "Sign in";
}

function clamp(v, min, max) {
  return Math.max(min, Math.min(max, v));
}

function setupMotionEffects() {
  if (!allowMotion) {
    return;
  }

  window.addEventListener("mousemove", (e) => {
    mouseX = e.clientX;
    mouseY = e.clientY;

    document.documentElement.style.setProperty("--mx", `${mouseX}px`);
    document.documentElement.style.setProperty("--my", `${mouseY}px`);

    const nx = mouseX / window.innerWidth - 0.5;
    const ny = mouseY / window.innerHeight - 0.5;

    if (blob1) {
      blob1.style.transform = `translate(${nx * 24}px, ${ny * 20}px)`;
    }

    if (blob2) {
      blob2.style.transform = `translate(${nx * -26}px, ${ny * -22}px)`;
    }

    if (!card) {
      return;
    }

    const rect = card.getBoundingClientRect();
    const px = (mouseX - rect.left) / rect.width;
    const py = (mouseY - rect.top) / rect.height;

    const inside = px >= 0 && px <= 1 && py >= 0 && py <= 1;
    if (!inside) {
      return;
    }

    const rx = clamp((0.5 - py) * 10, -8, 8);
    const ry = clamp((px - 0.5) * 12, -10, 10);
    card.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg)`;
    card.style.setProperty("--gx", `${(px * 100).toFixed(1)}%`);
    card.style.setProperty("--gy", `${(py * 100).toFixed(1)}%`);
    card.classList.add("hovered");
  });

  if (card) {
    card.addEventListener("mouseleave", () => {
      card.style.transform = "";
      card.classList.remove("hovered");
    });
  }
}

function setupCustomCursor() {
  if (!allowCustomCursor || !cursorDot || !cursorRing) {
    return;
  }

  const animateCursor = () => {
    ringX += (mouseX - ringX) * 0.18;
    ringY += (mouseY - ringY) * 0.18;

    cursorDot.style.transform = `translate(${mouseX}px, ${mouseY}px) translate(-50%, -50%)`;
    cursorRing.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
    requestAnimationFrame(animateCursor);
  };

  requestAnimationFrame(animateCursor);

  const interactive = "button, input, a, label, .toggle";
  document.querySelectorAll(interactive).forEach((el) => {
    el.addEventListener("mouseenter", () => document.body.classList.add("cursorActive"));
    el.addEventListener("mouseleave", () => document.body.classList.remove("cursorActive"));
  });
}

function setupMagneticButton() {
  if (!allowMotion || !btn) {
    return;
  }

  const reset = () => {
    btn.style.setProperty("--bx", "0px");
    btn.style.setProperty("--by", "0px");
  };

  window.addEventListener("mousemove", (e) => {
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    const dx = e.clientX - cx;
    const dy = e.clientY - cy;
    const dist = Math.hypot(dx, dy);

    if (dist < 110) {
      btn.style.setProperty("--bx", `${clamp(dx * 0.12, -10, 10)}px`);
      btn.style.setProperty("--by", `${clamp(dy * 0.12, -8, 8)}px`);
    } else {
      reset();
    }
  });

  btn.addEventListener("mouseleave", reset);
}

function setupRipple() {
  if (!btn) {
    return;
  }

  btn.addEventListener("click", (e) => {
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "ripple";
    ripple.style.left = `${e.clientX - rect.left}px`;
    ripple.style.top = `${e.clientY - rect.top}px`;
    btn.appendChild(ripple);
    ripple.addEventListener("animationend", () => ripple.remove(), { once: true });
  });
}

setupMotionEffects();
setupCustomCursor();
setupMagneticButton();
setupRipple();
applyLoginSettings();
window.addEventListener("storage", (e) => {
  if (e.key !== SITE_SETTINGS_KEY) return;
  applyLoginSettings();
});

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msg.className = "msg";
  msg.textContent = "";

  const payload = {
    email: email.value.trim(),
    key: key.value.trim()
  };

  if (!payload.email || !payload.key) {
    setMsg("Заполни email и ключ.", "err");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(API_LOGIN, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include", // важно: если токен будет в httpOnly cookie
      body: JSON.stringify(payload)
    });

    if (!res.ok) {
      const t = await res.text().catch(() => "");
      setMsg(t || "Неверный email или ключ.", "err");
      setLoading(false);
      return;
    }

    // Вариант A (лучший): сервер сам поставит httpOnly cookie и вернёт {redirect:"/f9b3c1a2.html"}
    const data = await res.json().catch(() => ({}));
    setMsg("Готово. Открываю админку…", "ok");

    const to = data && data.redirect ? data.redirect : "/f9b3c1a2.html";
    setTimeout(() => {
      location.href = to;
    }, 450);
  } catch (err) {
    setMsg("Ошибка сети. Проверь соединение и попробуй снова.", "err");
    setLoading(false);
  }
});
