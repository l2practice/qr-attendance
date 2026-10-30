/* Shared helpers for live.html (teacher) and student.html (phones). */
(function () {
  var QR = window.QR = {};

  /* The Firebase web config identifies the project; it is not a secret
     (same values as in index.html). Students' phones have no saved config. */
  QR.FB_PREFILL = {
    apiKey: "AIzaSyAKhFxDYKQkTwxBFMRYruTUL0Y-9ds-F9I",
    authDomain: "qr-att-73f4b.firebaseapp.com",
    projectId: "qr-att-73f4b",
    storageBucket: "qr-att-73f4b.firebasestorage.app",
    messagingSenderId: "752287916403",
    appId: "1:752287916403:web:efee0c7d9dbb8fccd86506"
  };

  QR.$ = function (id) { return document.getElementById(id); };
  QR.esc = function (s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  };
  QR.pad2 = function (n) { return String(n).padStart(2, "0"); };
  QR.todayISO = function (d) {
    d = d || new Date();
    return d.getFullYear() + "-" + QR.pad2(d.getMonth() + 1) + "-" + QR.pad2(d.getDate());
  };
  /* 1 → "1", 1.5 → "1.5": scores never show float noise */
  QR.fmt = function (n) { return String(Math.round((+n || 0) * 100) / 100); };

  var toastTimer = null;
  QR.toast = function (msg, isErr, ms) {
    var t = QR.$("toast");
    if (!t) return;
    t.textContent = msg;
    t.className = "show" + (isErr ? " err" : "");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.className = ""; }, ms || (isErr ? 5000 : 2600));
  };

  /* Class identity: a stable pale hue from the class id, so the same class
     has the same colour on every device. */
  var HUES = [205, 28, 150, 340, 50, 185, 10, 100];
  QR.hue = function (id) {
    var h = 0, s = String(id || "");
    for (var i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
    return HUES[h % HUES.length];
  };
  QR.monogram = function (name) {
    var n = String(name || "").trim();
    var m = n.match(/[-_ ]([A-Za-z0-9]{1,3})$/);
    return (m ? m[1] : n.slice(0, 2)).toUpperCase();
  };
  QR.monoHtml = function (cls) {
    return '<span class="mono" style="--h:' + QR.hue(cls.id) + '" aria-hidden="true">' + QR.esc(QR.monogram(cls.name)) + '</span>';
  };

  /* Light / dark toggle button (the theme itself is set by the head script) */
  QR.currentTheme = function () { return document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light"; };
  QR.setTheme = function (t) {
    document.documentElement.setAttribute("data-theme", t);
    try { localStorage.setItem("qr-attendance:theme", t); } catch (e) {}
  };
  QR.mountThemeButton = function (bar) {
    var b = document.createElement("button");
    b.type = "button"; b.className = "theme-btn"; b.setAttribute("aria-label", "Switch light / dark theme");
    b.innerHTML = '<svg class="ico-moon" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/></svg>' +
      '<svg class="ico-sun" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/></svg>';
    b.addEventListener("click", function () { QR.setTheme(QR.currentTheme() === "dark" ? "light" : "dark"); });
    bar.appendChild(b);
  };

  /* Firestore handle. Long polling is auto-detected because school and
     mobile networks often block the default streaming channel. */
  QR.initFirestore = function (cfg) {
    if (typeof firebase === "undefined" || !firebase.initializeApp) throw new Error("Firebase library not loaded");
    if (!firebase.apps.length) firebase.initializeApp(cfg);
    var db = firebase.firestore();
    try { db.settings({ experimentalAutoDetectLongPolling: true, merge: true }); } catch (e) {}
    return db;
  };

  /* Readable reason for a Firestore error */
  QR.errText = function (e) {
    var c = e && e.code || "";
    if (c === "permission-denied") return "Firestore rules refused access";
    if (c === "unavailable") return "cannot reach Firestore — check the network";
    return c || (e && e.message) || "unknown error";
  };
})();
