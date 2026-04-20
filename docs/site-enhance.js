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

  // ---------- Table of contents (auto-built, grouped, sticky) ----------
  function slugify(s) {
    return (s || "")
      .trim().toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "section";
  }

  function cleanText(s) {
    return (s || "").trim().replace(/\s+/g, " ");
  }

  // Build grouped TOC model for a given page.
  // Returns { label, groups: [{label, items:[{node,text,href}]}] } or null.
  function buildTocModel(article) {
    // Projects: group by the <details><summary> banner (Current / Past).
    var projectCards = article.querySelectorAll(".projects-grid .project-card");
    if (projectCards.length >= 2) {
      var byGroup = {};
      var order = [];
      Array.prototype.forEach.call(projectCards, function (card) {
        var details = card.closest("details");
        var summary = details ? details.querySelector("summary") : null;
        var groupLabel = summary ? cleanText(summary.textContent) : "Projects";
        if (!byGroup[groupLabel]) {
          byGroup[groupLabel] = { label: groupLabel, items: [], details: details };
          order.push(groupLabel);
        }
        var title = card.querySelector(".project-title-text");
        if (!title) return;
        byGroup[groupLabel].items.push({ node: title, text: cleanText(title.textContent) });
      });
      var groups = order.map(function (k) { return byGroup[k]; });
      if (groups.length) return { label: "Projects", groups: groups };
    }

    // Teaching: group by year parsed from the .teach-date text.
    var teachBlocks = article.querySelectorAll(".teach-block");
    if (teachBlocks.length >= 3) {
      var yearMap = {};
      var yearOrder = [];
      Array.prototype.forEach.call(teachBlocks, function (block) {
        var course = block.querySelector(".teach-course");
        if (!course) return;
        var date = block.querySelector(".teach-date");
        var m = date ? (date.textContent.match(/20\d{2}/g) || []) : [];
        var year = m.length ? m[m.length - 1] : "Other";
        if (!yearMap[year]) {
          yearMap[year] = { label: year, items: [] };
          yearOrder.push(year);
        }
        yearMap[year].items.push({ node: course, text: cleanText(course.textContent) });
      });
      // Sort years descending (newest first).
      yearOrder.sort(function (a, b) {
        if (a === "Other") return 1;
        if (b === "Other") return -1;
        return parseInt(b, 10) - parseInt(a, 10);
      });
      var tGroups = yearOrder.map(function (k) { return yearMap[k]; });
      if (tGroups.length) return { label: "Courses", groups: tGroups };
    }

    // Generic: h2 / h3 headings inside article.
    var heads = article.querySelectorAll("h2, h3");
    if (heads.length >= 3) {
      var items = [];
      Array.prototype.forEach.call(heads, function (h) {
        items.push({ node: h, text: cleanText(h.textContent) });
      });
      return { label: "On this page", groups: [{ label: "", items: items }] };
    }

    return null;
  }

  function renderToc(model) {
    var toc = document.createElement("nav");
    toc.className = "site-toc";
    toc.setAttribute("aria-label", model.label);

    var title = document.createElement("div");
    title.className = "site-toc__title";
    title.textContent = model.label;
    toc.appendChild(title);

    var nodeIndex = 0;
    model.groups.forEach(function (group) {
      if (group.label) {
        var h = document.createElement("div");
        h.className = "site-toc__group";
        h.textContent = group.label;
        toc.appendChild(h);
      }
      var ul = document.createElement("ul");
      group.items.forEach(function (item) {
        var n = item.node;
        if (!n.id) n.id = "toc-" + (nodeIndex++) + "-" + slugify(item.text);
        var li = document.createElement("li");
        li.className = "site-toc__item";
        var a = document.createElement("a");
        a.href = "#" + n.id;
        a.textContent = item.text;
        // If target lives inside a closed <details>, opening the parent makes
        // the anchor scroll to a visible element.
        a.addEventListener("click", function () {
          var parent = n.closest("details");
          if (parent && !parent.open) parent.open = true;
        });
        li.appendChild(a);
        ul.appendChild(li);
      });
      toc.appendChild(ul);
    });

    return toc;
  }

  function initTOC() {
    var article = document.querySelector("d-article, .d-article");
    if (!article) return;
    if (document.querySelector(".resume")) return; // CV has its own UI
    var model = buildTocModel(article);
    if (!model) return;

    var toc = renderToc(model);
    // Placement depends on viewport width:
    //  - Wide (>=1181px): attached to <body> so position:fixed is always
    //    relative to the viewport (Distill's <d-article> can otherwise
    //    create a containing block for fixed descendants).
    //  - Narrow: inserted at the top of the article as a compact panel.
    // Re-evaluated on matchMedia changes so resizing the window still works.
    var mmWide = window.matchMedia("(min-width: 1181px)");
    function placeToc() {
      if (mmWide.matches) {
        toc.classList.remove("site-toc--inline");
        toc.classList.add("site-toc--rail");
        if (toc.parentNode !== document.body) {
          document.body.appendChild(toc);
        }
      } else {
        toc.classList.remove("site-toc--rail");
        toc.classList.add("site-toc--inline");
        if (toc.parentNode !== article) {
          article.insertBefore(toc, article.firstChild);
        }
      }
    }
    placeToc();
    if (mmWide.addEventListener) {
      mmWide.addEventListener("change", placeToc);
    } else if (mmWide.addListener) {
      mmWide.addListener(placeToc); // Safari < 14
    }

    // Active-link tracking via IntersectionObserver
    if (!("IntersectionObserver" in window)) return;
    var linkByHash = {};
    var allNodes = [];
    toc.querySelectorAll("a").forEach(function (a) { linkByHash[a.getAttribute("href")] = a; });
    model.groups.forEach(function (g) {
      g.items.forEach(function (i) { allNodes.push(i.node); });
    });
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var link = linkByHash["#" + entry.target.id];
        if (!link) return;
        toc.querySelectorAll("a.is-active").forEach(function (el) { el.classList.remove("is-active"); });
        link.classList.add("is-active");
      });
    }, { rootMargin: "-20% 0px -65% 0px", threshold: 0 });
    allNodes.forEach(function (n) { observer.observe(n); });
  }

  // ---------- Per-page background image (light mode only) ----------
  function initPageBackground() {
    var page = (location.pathname.split("/").pop() || "").toLowerCase();
    if (!page || page === "/") page = "index.html";
    // [background file, white-overlay alpha]. Lower alpha = image more visible.
    var map = {
      "index.html":    ["back6.jpg",  0.82],
      "cv.html":       ["back7.jpg",  0.78],
      "teaching.html": ["back5.jpg",  0.86],
      "projects.html": ["back4.jpg",  0.74],
      "research.html": ["back10.jpg", 0.72]
    };
    var entry = map[page] || ["back1.jpg", 0.86];
    var root = document.documentElement;
    root.style.setProperty("--page-background", "url('images/" + entry[0] + "')");
    root.style.setProperty("--page-overlay", "rgba(255,255,255," + entry[1] + ")");
    // Expose the page name so CSS can target per-page tweaks (e.g. the
    // research article card behind text).
    var slug = page.replace(/\.html$/, "") || "index";
    root.setAttribute("data-page", slug);
  }

  // ---------- Icon Legend (About page only) ----------
  // Renders a small reference panel explaining what each nav/social icon
  // means. Wide screens: sticky left rail (appended to <body> so it can
  // fix-position relative to the viewport). Narrow screens: an inline
  // card inserted after the bio card.
  function initIconLegend() {
    var page = (location.pathname.split("/").pop() || "index.html").toLowerCase();
    if (!(page === "index.html" || page === "" || page === "/")) return;

    var article = document.querySelector("d-article, .d-article");
    if (!article) return;
    if (document.querySelector(".icon-legend")) return;

    var groups = [
      {
        heading: "Navigation",
        items: [
          { href: "index.html",     icon: "fa fa-home",                label: "About" },
          { href: "teaching.html",  icon: "fa fa-chalkboard-teacher",  label: "Teaching" },
          { href: "projects.html",  icon: "fa fa-folder-open",         label: "Projects" },
          { href: "research.html",  icon: "fa fa-flask",               label: "Research" },
          { href: "cv.html",        icon: "fa fa-file",                label: "CV" }
        ]
      },
      {
        heading: "Connect",
        items: [
          { href: "mailto:nmathlouthi@ucsb.edu",         icon: "fa fa-envelope-o", label: "Email" },
          { href: "https://github.com/narjesmath",       icon: "fab fa-github",    label: "GitHub" },
          { href: "https://www.linkedin.com/in/narjes-m/", icon: "fab fa-linkedin", label: "LinkedIn" },
          { href: "https://twitter.com/NarjesMathlout1", icon: "fab fa-twitter",   label: "Twitter" }
        ]
      }
    ];

    function makeNode() {
      var nav = document.createElement("nav");
      nav.className = "icon-legend";
      nav.setAttribute("aria-label", "Site icon legend");
      groups.forEach(function (g) {
        var groupEl = document.createElement("div");
        groupEl.className = "icon-legend__group";
        var h = document.createElement("p");
        h.className = "icon-legend__heading";
        h.textContent = g.heading;
        groupEl.appendChild(h);
        var ul = document.createElement("ul");
        ul.className = "icon-legend__list";
        g.items.forEach(function (it) {
          var li = document.createElement("li");
          var a = document.createElement("a");
          a.className = "icon-legend__item";
          a.href = it.href;
          a.title = it.label;
          var isExternal = /^https?:/.test(it.href);
          if (isExternal) { a.target = "_blank"; a.rel = "noopener"; }
          var iSpan = document.createElement("span");
          iSpan.className = "icon-legend__icon";
          var icon = document.createElement("i");
          icon.className = it.icon;
          icon.setAttribute("aria-hidden", "true");
          iSpan.appendChild(icon);
          var label = document.createElement("span");
          label.className = "icon-legend__label";
          label.textContent = it.label;
          a.appendChild(iSpan);
          a.appendChild(label);
          li.appendChild(a);
          ul.appendChild(li);
        });
        groupEl.appendChild(ul);
        nav.appendChild(groupEl);
      });
      return nav;
    }

    var mq = window.matchMedia("(min-width: 1181px)");
    var node = null;

    function mount() {
      if (node && node.parentNode) node.parentNode.removeChild(node);
      node = makeNode();
      if (mq.matches) {
        node.classList.add("icon-legend--rail");
        document.body.appendChild(node);
      } else {
        node.classList.add("icon-legend--inline");
        // Insert after the bio card and before the page footer (which is
        // the copyright/Back-to-Top block also nested inside d-article).
        var footer = article.querySelector(":scope > footer");
        if (footer) {
          article.insertBefore(node, footer);
        } else {
          article.appendChild(node);
        }
      }
    }

    mount();
    // Re-mount on viewport crossings so the legend hops between rail/inline.
    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", mount);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(mount);
    }
  }

  // ---------- Page-to-page nav arrows ----------
  // Floating prev/next buttons + global arrow-key handler that cycle
  // through the top-nav pages (About -> Teaching -> Projects ->
  // Research -> CV). No wrap-around; arrows are hidden at the ends.
  var PAGE_ORDER = [
    { href: "index.html",    label: "About" },
    { href: "teaching.html", label: "Teaching" },
    { href: "projects.html", label: "Projects" },
    { href: "research.html", label: "Research" },
    { href: "cv.html",       label: "CV" }
  ];

  function currentPageIndex() {
    var page = (location.pathname.split("/").pop() || "").toLowerCase();
    if (!page || page === "/") page = "index.html";
    for (var i = 0; i < PAGE_ORDER.length; i++) {
      if (PAGE_ORDER[i].href === page) return i;
    }
    return -1;
  }

  function initPageNav() {
    var idx = currentPageIndex();
    if (idx < 0) return;
    var prev = idx > 0 ? PAGE_ORDER[idx - 1] : null;
    var next = idx < PAGE_ORDER.length - 1 ? PAGE_ORDER[idx + 1] : null;

    function makeButton(kind, target) {
      if (!target) return null;
      var a = document.createElement("a");
      a.className = "site-page-nav site-page-nav--" + kind;
      a.href = target.href;
      var verb = kind === "prev" ? "Previous" : "Next";
      a.setAttribute("aria-label", verb + ": " + target.label);
      a.setAttribute(
        "title",
        verb + ": " + target.label + " (" + (kind === "prev" ? "\u2190" : "\u2192") + ")"
      );
      var icon = document.createElement("span");
      icon.className = "site-page-nav__icon";
      icon.setAttribute("aria-hidden", "true");
      icon.innerHTML = kind === "prev"
        ? '<i class="fas fa-chevron-left"></i>'
        : '<i class="fas fa-chevron-right"></i>';
      var label = document.createElement("span");
      label.className = "site-page-nav__label";
      label.textContent = target.label;
      if (kind === "prev") {
        a.appendChild(icon);
        a.appendChild(label);
      } else {
        a.appendChild(label);
        a.appendChild(icon);
      }
      document.body.appendChild(a);
      return a;
    }

    makeButton("prev", prev);
    makeButton("next", next);

    function isTypingTarget(el) {
      if (!el) return false;
      var tag = (el.tagName || "").toLowerCase();
      if (tag === "input" || tag === "textarea" || tag === "select") return true;
      if (el.isContentEditable) return true;
      return false;
    }

    document.addEventListener("keydown", function (e) {
      if (e.defaultPrevented) return;
      if (e.altKey || e.ctrlKey || e.metaKey) return;
      if (isTypingTarget(e.target)) return;
      if (e.key === "ArrowRight" && next) {
        location.href = next.href;
      } else if (e.key === "ArrowLeft" && prev) {
        location.href = prev.href;
      }
    });
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

  // Set background as early as possible so there is no flash.
  try { initPageBackground(); } catch (e) { /* no-op */ }

  onReady(function () {
    try { initPageBackground(); } catch (e) { /* no-op */ }
    try { initTheme(); } catch (e) { /* no-op */ }
    try { initBackToTop(); } catch (e) { /* no-op */ }
    try { initCv(); } catch (e) { /* no-op */ }
    try { initTOC(); } catch (e) { /* no-op */ }
    try { initIconLegend(); } catch (e) { /* no-op */ }
    try { initPageNav(); } catch (e) { /* no-op */ }
    try { initAnalytics(); } catch (e) { /* no-op */ }
  });
})();
