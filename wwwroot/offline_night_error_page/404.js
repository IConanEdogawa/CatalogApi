const networkStatus = document.getElementById("networkStatus");
const routeStatus = document.getElementById("routeStatus");
const tryAgain = document.getElementById("tryAgain");
const goBack = document.getElementById("goBack");
const returnHome = document.getElementById("returnHome");

function updateNetwork() {
  const online = navigator.onLine;
  networkStatus.textContent = online ? "Online" : "Offline";
  routeStatus.textContent = online ? "404 / unavailable" : "Offline / unreachable";
}

function goBackWithFallback() {
  if (window.history.length > 1) {
    window.history.back();
    return;
  }

  window.location.href = returnHome.getAttribute("href") || "/";
}

function setupActions() {
  tryAgain.addEventListener("click", () => window.location.reload());
  goBack.addEventListener("click", goBackWithFallback);
}

updateNetwork();
setupActions();

window.addEventListener("online", updateNetwork);
window.addEventListener("offline", updateNetwork);

console.log("Requested path:", window.location.pathname + window.location.search + window.location.hash);
