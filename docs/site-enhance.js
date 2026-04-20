/* =========================================================
   Site-wide enhancement script.
   - Dark mode toggle (persisted in localStorage)
   - Floating back-to-top button (fades in on scroll)
   - CV "Expand/Collapse all" control (persists per-section state)
   Runs on every page; guards keep it safe when elements are absent.
   ========================================================= */
(function () {
  "use strict";

  var STORAGE_KEY_THEME = "site.theme";
  var STORAGE_KEY_CV = "site.cv.sections";

  // ---------- Theme ----------
  function applyTheme(theme) {
    document.documentElement.setAttribute("data-theme", theme);
    var btn = document.querySelector(".site-theme-toggle");
    if (btn) {
      var isDark = theme === "dark";
      btn.setAttribute("aria-pressed", String(isDark));
      btn.setAttribute("aria-label", isDark ? "Switch to light mode" : "Switch to dark mode");
      btn.innerHTML = isDark
        ? '<i class="fas fa-sun" aria-hidden="true"></i>'
        : '<i class="fas fa-moon" aria-hidden="true"></i>';
    }
  }

  function initTheme() {
    var saved = null;
    try { saved = localStorage.getItem(STORAGE_KEY_THEME); } catch (e) {}
    var prefersDark = window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches;
    var theme = saved || (prefersDark ? "dark" : "light");
    applyTheme(theme);

    var btn = document.createElement("button");
    btn.className = "site-theme-toggle";
    btn.type = "button";
    document.body.appendChild(btn);
    applyTheme(theme);

    btn.addEventListener("click", function () {
      var current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
      var next = current === "dark" ? "light" : "dark";
      try { localStorage.setItem(STORAGE_KEY_THEME, next); } catch (e) {}
      applyTheme(next);
    });

    if (window.matchMedia) {
      try {
        window.matchMedia("(prefers-color-scheme: dark)").addEventListener("change", function (e) {
          var stored;
          try { stored = localStorage.getItem(STORAGE_KEY_THEME); } catch (_) {}
          if (!stored) applyTheme(e.matches ? "dark" : "light");
        });
      } catch (e) { /* older browsers */ }
    }
  }

  // ---------- Back-to-top ----------
  function initBackToTop() {
    var btn = document.createElement("button");
    btn.className = "site-back-to-top";
    btn.type = "button";
    btn.setAttribute("aria-label", "Back to top");
    btn.innerHTML = '<i class="fas fa-arrow-up" aria-hidden="true"></i>';
    document.body.appendChild(btn);

    function onScroll() {
      if (window.scrollY > 300) btn.classList.add("is-visible");
      else btn.classList.remove("is-visible");
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();

    btn.addEventListener("click", function () {
      var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" });
    });
  }

  // ---------- CV expand/collapse all with persistence ----------
  function loadCvState() {
    try {
      var raw = localStorage.getItem(STORAGE_KEY_CV);
      if (!raw) return {};
      var parsed = JSON.parse(raw);
      return (parsed && typeof parsed === "object") ? parsed : {};
    } catch (e) { return {}; }
  }

  function saveCvState(state) {
    try { localStorage.setItem(STORAGE_KEY_CV, JSON.stringify(state)); } catch (e) {}
  }

  function sectionKey(section) {
    var cls = (section.className || "").split(/\s+/).filter(Boolean);
    var named = cls.find(function (c) { return c !== "cv-section"; });
    return named || "section";
  }

  function initCv() {
    var resume = document.querySelector(".resume");
    if (!resume) return;
    var sections = resume.querySelectorAll(".cv-section > details");
    if (!sections.length) return;

    // Restore persisted state
    var state = loadCvState();
    sections.forEach(function (d) {
      var key = sectionKey(d.parentElement);
      if (Object.prototype.hasOwnProperty.call(state, key)) {
        d.open = !!state[key];
      }
      d.addEventListener("toggle", function () {
        var s = loadCvState();
        s[key] = d.open;
        saveCvState(s);
        updateToggleLabel();
      });
    });

    // Controls bar
    var controls = document.createElement("div");
    controls.className = "cv-controls";
    var toggleAll = document.createElement("button");
    toggleAll.type = "button";
    toggleAll.className = "cv-toggle-all";
    controls.appendChild(toggleAll);
    resume.insertBefore(controls, resume.firstChild);

    function allOpen() {
      return Array.prototype.every.call(sections, function (d) { return d.open; });
    }

    function updateToggleLabel() {
      toggleAll.textContent = allOpen() ? "Collapse all" : "Expand all";
    }
    updateToggleLabel();

    toggleAll.addEventListener("click", function () {
      var shouldOpen = !allOpen();
      var s = loadCvState();
      sections.forEach(function (d) {
        d.open = shouldOpen;
        s[sectionKey(d.parentElement)] = shouldOpen;
      });
      saveCvState(s);
      updateToggleLabel();
    });
  }

  function onReady(fn) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", fn);
    } else {
      fn();
    }
  }

  onReady(function () {
    try { initTheme(); } catch (e) { /* no-op */ }
    try { initBackToTop(); } catch (e) { /* no-op */ }
    try { initCv(); } catch (e) { /* no-op */ }
  });
})();
