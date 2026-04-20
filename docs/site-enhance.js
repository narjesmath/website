/* =========================================================
   Site-wide enhancement script.
   - Dark mode toggle (persisted in localStorage)
   - Floating back-to-top button (fades in on scroll)
   - CV "Expand/Collapse all" control (persists per-section state)
   Runs on every page; guards keep it safe when elements are absent.
   ========================================================= */
(function () {
  "use strict";

  // ---------------------------------------------------------------
  // Privacy-friendly analytics (GoatCounter). DISABLED by default.
  //
  // To enable:
  //   1. Sign up (free, no credit card) at https://www.goatcounter.com/signup
  //   2. Set the line below to your GoatCounter code, e.g. "narjesmath".
  //      Script will load //{code}.goatcounter.com/count automatically.
  //   3. Deploy. Done — no cookies, no PII, GDPR-compliant.
  //
  // Leave the string empty to keep analytics off.
  // ---------------------------------------------------------------
  if (typeof window.SITE_ANALYTICS_CODE === "undefined") {
    window.SITE_ANALYTICS_CODE = ""; // <-- put your GoatCounter subdomain here
  }

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
      btn.setAttribute("title", isDark ? "Switch to light mode (t)" : "Switch to dark mode (t)");
      btn.innerHTML = isDark
        ? '<i class="fas fa-sun" aria-hidden="true"></i>'
        : '<i class="fas fa-moon" aria-hidden="true"></i>';
    }
  }

  function toggleTheme() {
    var current = document.documentElement.getAttribute("data-theme") === "dark" ? "dark" : "light";
    var next = current === "dark" ? "light" : "dark";
    try { localStorage.setItem(STORAGE_KEY_THEME, next); } catch (e) {}
    applyTheme(next);
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

    // Prefer injecting into the site's top nav so it lives inline with the
    // other navigation icons. Fall back to a fixed floating button.
    var navRight = document.querySelector(".distill-site-header .nav-right");
    if (navRight) {
      btn.classList.add("site-theme-toggle--in-nav");
      navRight.insertBefore(btn, navRight.firstChild);
    } else {
      btn.classList.add("site-theme-toggle--floating");
      document.body.appendChild(btn);
    }
    applyTheme(theme);

    btn.addEventListener("click", toggleTheme);

    // Keyboard shortcut: "t" toggles theme (ignored in inputs / when modifier held).
    document.addEventListener("keydown", function (e) {
      if (e.key !== "t" && e.key !== "T") return;
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      var target = e.target;
      if (target && (target.isContentEditable ||
          /^(INPUT|TEXTAREA|SELECT)$/i.test(target.tagName))) return;
      e.preventDefault();
      toggleTheme();
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

  // ---------- Table of contents (auto-built, sticky left rail) ----------
  function slugify(s) {
    return (s || "")
      .trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section";
  }

  function pickTocTargets(article) {
    // Preference order: real article headings, teaching course titles, project titles.
    var primary = article.querySelectorAll("h2, h3");
    if (primary.length >= 3) return { nodes: primary, label: "On this page" };
    var teachCourses = article.querySelectorAll(".teach-course");
    if (teachCourses.length >= 3) return { nodes: teachCourses, label: "Courses" };
    var projects = article.querySelectorAll(".projects-grid .project-title-text");
    if (projects.length >= 3) return { nodes: projects, label: "Projects" };
    return null;
  }

  function initTOC() {
    var article = document.querySelector("d-article, .d-article");
    if (!article) return;
    // CV has its own expand/collapse UI; don't stack a TOC on top.
    if (document.querySelector(".resume")) return;
    var picked = pickTocTargets(article);
    if (!picked) return;
    var nodes = picked.nodes;

    var toc = document.createElement("nav");
    toc.className = "site-toc";
    toc.setAttribute("aria-label", picked.label);

    var title = document.createElement("div");
    title.className = "site-toc__title";
    title.textContent = picked.label;
    toc.appendChild(title);

    var list = document.createElement("ul");
    toc.appendChild(list);

    Array.prototype.forEach.call(nodes, function (n, i) {
      if (!n.id) n.id = "toc-" + i + "-" + slugify(n.textContent);
      var li = document.createElement("li");
      li.className = "site-toc__item site-toc__item--" + (n.tagName || "").toLowerCase();
      var a = document.createElement("a");
      a.href = "#" + n.id;
      a.textContent = (n.textContent || "").trim().replace(/\s+/g, " ");
      li.appendChild(a);
      list.appendChild(li);
    });

    document.body.appendChild(toc);

    // Mobile drawer toggle
    var toggle = document.createElement("button");
    toggle.type = "button";
    toggle.className = "site-toc__toggle";
    toggle.setAttribute("aria-label", "Toggle table of contents");
    toggle.innerHTML = '<i class="fas fa-list" aria-hidden="true"></i>';
    document.body.appendChild(toggle);
    toggle.addEventListener("click", function () { toc.classList.toggle("is-open"); });

    // Highlight current section via IntersectionObserver
    if (!("IntersectionObserver" in window)) return;
    var linkByHash = {};
    toc.querySelectorAll("a").forEach(function (a) { linkByHash[a.getAttribute("href")] = a; });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var link = linkByHash["#" + entry.target.id];
        if (!link) return;
        toc.querySelectorAll("a.is-active").forEach(function (el) { el.classList.remove("is-active"); });
        link.classList.add("is-active");
      });
    }, { rootMargin: "-20% 0px -65% 0px", threshold: 0 });
    Array.prototype.forEach.call(nodes, function (n) { observer.observe(n); });
  }

  // ---------- Analytics (GoatCounter) ----------
  function initAnalytics() {
    var code = window.SITE_ANALYTICS_CODE;
    if (!code || typeof code !== "string") return;
    // Honor Do-Not-Track.
    if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return;
    var s = document.createElement("script");
    s.async = true;
    s.setAttribute("data-goatcounter", "https://" + code + ".goatcounter.com/count");
    s.src = "//gc.zgo.at/count.js";
    document.head.appendChild(s);
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
    try { initTOC(); } catch (e) { /* no-op */ }
    try { initAnalytics(); } catch (e) { /* no-op */ }
  });
})();
