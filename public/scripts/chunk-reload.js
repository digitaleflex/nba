(function() {
  var KEY = "__nba_chunk_reload_at";
  var COOLDOWN = 10000;
  function safeReload() {
    try {
      var last = parseInt(sessionStorage.getItem(KEY) || "0", 10);
      var now = Date.now();
      if (now - last < COOLDOWN) {
        console.error("[chunk] Rechargement déjà tenté récemment — arrêt pour éviter une boucle. Videz le cache (Ctrl+Maj+R).");
        return;
      }
      sessionStorage.setItem(KEY, String(now));
    } catch (_) {}
    window.location.reload();
  }
  window.addEventListener("error", function(e) {
    if (e.target && e.target.tagName === "SCRIPT" && e.target.src && e.target.src.indexOf("/_next/static/chunks/") !== -1) {
      console.warn("[chunk] Échec de chargement, rechargement automatique...");
      e.preventDefault();
      safeReload();
    }
  }, true);
  window.addEventListener("unhandledrejection", function(e) {
    if (e.reason && e.reason.message && e.reason.message.indexOf("dynamically imported module") !== -1) {
      console.warn("[chunk] Échec d'import dynamique, rechargement automatique...");
      safeReload();
    }
  });
})();
