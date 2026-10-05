(function () {
  const header = document.querySelector("[data-header]");
  const toggle = document.querySelector("[data-nav-toggle]");
  const nav = document.querySelector("[data-nav]");
  const page = document.body.dataset.page;

  if (header) {
    const onScroll = () => {
      header.classList.toggle("is-stuck", window.scrollY > 8);
      document.documentElement.style.setProperty("--header-bottom", header.offsetHeight + "px");
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    header.addEventListener("click", () => header.classList.add("is-solid"));
  }

  const toTop = document.querySelector("[data-to-top]");
  if (toTop) {
    const syncTop = () => toTop.classList.toggle("is-on", window.scrollY > 420);
    syncTop();
    window.addEventListener("scroll", syncTop, { passive: true });
    toTop.addEventListener("click", () => {
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
    });
  }

  if (nav && page) {
    nav.querySelectorAll("a").forEach((link) => {
      if (link.dataset.nav === page) link.setAttribute("aria-current", "page");
    });
    if (page === "koleksiyon") {
      const grup = new URLSearchParams(location.search).get("grup");
        if (grup) {
          const extras = ["sehpa", "zigon", "dresuar", "vitrin", "servis", "ayna"];
          nav.querySelectorAll(".nav-sub a").forEach((link) => {
            const url = new URL(link.getAttribute("href"), location.href);
            const linkGrup = url.searchParams.get("grup");
            if (linkGrup === grup || (linkGrup === "tamamlayici" && extras.includes(grup))) {
              link.setAttribute("aria-current", "page");
            }
          });
        }
    }
  }

  if (toggle && nav && header) {
    toggle.addEventListener("click", () => {
      const open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      nav.style.top = open ? header.offsetHeight + "px" : "";
      document.body.style.overflow = open ? "hidden" : "";
    });
  }

  const products = window.KUCAR_PRODUCTS || [];

  const catKey = {
    "Yemek Odası": "cat.dining",
    "Masa": "cat.table",
    "Sandalye": "cat.chair",
    "Bar Sandalye": "cat.barchair",
    "Dresuar": "cat.console",
    "Sehpa": "cat.low",
    "Zigon": "cat.zigon",
    "Koltuk": "cat.sofa",
    "Vitrin": "cat.vitrine",
    "Servis Arabası": "cat.trolley",
    "Ayna": "cat.mirror",
    "Aksesuar": "cat.extra",
    "Tümü": "cat.all"
  };
  const t = (key) => (window.KUCAR_I18N ? window.KUCAR_I18N.t(key) : key);
  const catLabel = (name) => (catKey[name] ? t(catKey[name]) : name);

  function cardMarkup(item, index) {
    const photo = item.image
      ? `<span class="card-media"><img class="card-photo" src="${item.image}" alt="" width="800" height="1000" loading="lazy" decoding="async"></span>`
      : `<span class="card-swatch finish-${item.finish}" aria-hidden="true"></span>`;
    return `<button class="card" type="button" data-index="${index}">
      ${photo}
      <span class="card-body">
        <small>${catLabel(item.category)}</small>
        <strong>${item.name}</strong>
      </span>
    </button>`;
  }

  const dialog = document.querySelector("[data-dialog]");
  const dialogTitle = document.querySelector("[data-dialog-title]");
  const dialogText = document.querySelector("[data-dialog-text]");
  const dialogPhoto = document.querySelector("[data-dialog-photo]");
  const dialogThumbs = document.querySelector("[data-dialog-thumbs]");
  const dialogPrev = document.querySelector("[data-dialog-prev]");
  const dialogNext = document.querySelector("[data-dialog-next]");
  let galleryShots = [];
  let galleryIndex = 0;

  const syncGallery = () => {
    if (!dialogPhoto) return;
    const src = galleryShots[galleryIndex] || "";
    dialogPhoto.src = src;
    dialogPhoto.hidden = !src;
    if (dialogThumbs) {
      dialogThumbs.querySelectorAll("[data-shot]").forEach((btn, i) => {
        btn.classList.toggle("is-active", i === galleryIndex);
      });
    }
    const many = galleryShots.length > 1;
    if (dialogPrev) dialogPrev.hidden = !many;
    if (dialogNext) dialogNext.hidden = !many;
  };

  const setGallery = (shots, start = 0) => {
    galleryShots = (shots || []).filter(Boolean);
    galleryIndex = galleryShots.length
      ? Math.max(0, Math.min(start, galleryShots.length - 1))
      : 0;
    if (dialogThumbs) {
      dialogThumbs.innerHTML = galleryShots.length > 1
        ? galleryShots.map((src, i) => `<button type="button" data-shot="${src}" data-shot-index="${i}"${i === galleryIndex ? ' class="is-active"' : ""}><img src="${src}" alt="" width="160" height="160" loading="lazy" decoding="async"></button>`).join("")
        : "";
    }
    syncGallery();
  };

  const stepGallery = (delta) => {
    if (galleryShots.length < 2) return;
    galleryIndex = (galleryIndex + delta + galleryShots.length) % galleryShots.length;
    syncGallery();
  };

  const openProduct = (index) => {
    const item = products[index];
    if (!item || !dialog) return;
    dialogTitle.textContent = item.name;
    dialogText.textContent = `${catLabel(item.category)}. ${t("dialog.more")}`;
    if (dialogPhoto) dialogPhoto.alt = item.name;
    const shots = item.images?.length ? item.images : (item.image ? [item.image] : []);
    setGallery(shots, 0);
    dialog.showModal();
  };

  const onCardClick = (event) => {
    const shot = event.target.closest("[data-shot]");
    if (shot && dialogPhoto) {
      const idx = Number(shot.dataset.shotIndex);
      galleryIndex = Number.isFinite(idx) ? idx : Math.max(0, galleryShots.indexOf(shot.dataset.shot));
      syncGallery();
      return;
    }
    const card = event.target.closest(".card");
    if (!card || card.dataset.index === undefined) return;
    openProduct(Number(card.dataset.index));
  };

  const featured = document.querySelector("[data-featured]");
  if (featured) featured.addEventListener("click", onCardClick);
  const renderFeatured = () => {
    if (!featured || !products.length) return;
    const order = ["Yemek Odası", "Sandalye", "Masa", "Dresuar", "Sehpa", "Koltuk"];
    featured.innerHTML = order.map((category) => {
      const index = products.findIndex((item) => item.category === category);
      return index >= 0 ? cardMarkup(products[index], index) : "";
    }).join("");
  };
  renderFeatured();

  const catalog = document.querySelector("[data-catalog]");
  if (catalog && products.length) {
    const filters = document.querySelector("[data-filters]");
    const subFilters = document.querySelector("[data-filters-sub]");
    let current = "Tümü";

    const groups = {
      masalar: ["Masa", "Yemek Odası"],
      sandalyeler: ["Sandalye", "Bar Sandalye"],
      koltuk: ["Koltuk"],
      tamamlayici: ["Dresuar", "Sehpa", "Zigon", "Vitrin", "Servis Arabası", "Ayna", "Aksesuar"],
      sehpa: ["Sehpa"],
      zigon: ["Zigon"],
      dresuar: ["Dresuar"],
      vitrin: ["Vitrin"],
      servis: ["Servis Arabası"],
      ayna: ["Ayna"]
    };
    const extras = new Set(["tamamlayici", "sehpa", "zigon", "dresuar", "vitrin", "servis", "ayna"]);
    const categoryGroup = {
      "Masa": "masalar",
      "Yemek Odası": "masalar",
      "Sandalye": "sandalyeler",
      "Bar Sandalye": "sandalyeler",
      "Koltuk": "koltuk",
      "Dresuar": "dresuar",
      "Sehpa": "sehpa",
      "Zigon": "zigon",
      "Vitrin": "vitrin",
      "Servis Arabası": "servis",
      "Ayna": "ayna",
      "Aksesuar": "tamamlayici"
    };

    const params = new URLSearchParams(location.search);
    const fromGroup = params.get("grup");
    const fromQuery = params.get("kategori");
    if (fromGroup && groups[fromGroup]) current = fromGroup;
    else if (fromQuery && categoryGroup[fromQuery]) current = categoryGroup[fromQuery];
    else if (fromQuery) current = fromQuery;

    const matches = (item) => {
      if (current === "Tümü") return true;
      if (groups[current]) return groups[current].includes(item.category);
      return item.category === current;
    };

    const render = () => {
      const cards = products.map((item, index) => (
        matches(item) ? cardMarkup(item, index) : ""
      )).join("");
      catalog.innerHTML = cards || `<p class="catalog-empty">${t("col.empty")}</p>`;
      const buttons = document.querySelectorAll("[data-filters] button, [data-filters-sub] button");
      buttons.forEach((button) => {
        const key = button.dataset.filter;
        const active = key === current || (key === "tamamlayici" && extras.has(current));
        button.classList.toggle("is-active", active);
      });
      if (subFilters) subFilters.classList.toggle("is-on", extras.has(current));
    };

    [filters, subFilters].forEach((bar) => {
      if (!bar) return;
      bar.addEventListener("click", (event) => {
        const button = event.target.closest("button");
        if (!button) return;
        current = button.dataset.filter;
        render();
      });
    });

    catalog.addEventListener("click", onCardClick);
    if (dialogThumbs) dialogThumbs.addEventListener("click", onCardClick);
    render();
    document.addEventListener("kucar:lang", () => {
      render();
      renderFeatured();
    });
  }
  if (!catalog) {
    document.addEventListener("kucar:lang", renderFeatured);
  }

  const projects = window.KUCAR_PROJECTS || [];
  const projectGrid = document.querySelector("[data-projects]");
  const projectFeature = document.querySelector("[data-project-feature]");
  const openProject = (index) => {
    const item = projects[index];
    if (!item || !dialog) return;
    dialogTitle.textContent = item.name;
    dialogText.textContent = t("prj.more");
    if (dialogPhoto) dialogPhoto.alt = item.name;
    const shots = item.images?.length ? item.images : (item.image ? [item.image] : []);
    setGallery(shots, 0);
    dialog.showModal();
  };
  const projectIndexById = (id) => projects.findIndex((item) => item.id === id);
  if (projectFeature) {
    const openFeatured = () => {
      const index = projectIndexById(projectFeature.dataset.projectId);
      if (index >= 0) openProject(index);
    };
    projectFeature.addEventListener("click", openFeatured);
    projectFeature.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        openFeatured();
      }
    });
    if (!projectFeature.hasAttribute("tabindex")) projectFeature.tabIndex = 0;
    if (!projectFeature.hasAttribute("role")) projectFeature.setAttribute("role", "button");
  }
  if (projectGrid && projects.length) {
    const renderProjects = () => {
      const featuredId = projectFeature?.dataset.projectId;
      const limit = Number(projectGrid.dataset.projectsLimit) || 0;
      let shown = 0;
      projectGrid.innerHTML = projects.map((item, index) => {
        if (featuredId && item.id === featuredId) return "";
        if (limit && shown >= limit) return "";
        shown += 1;
        const count = (item.images || []).length;
        return `<button class="card" type="button" data-project-index="${index}">
          <span class="card-media"><img class="card-photo" src="${item.image}" alt="" width="1200" height="900" loading="lazy" decoding="async"></span>
          <span class="card-body">
            <small>${t("prj.label")}</small>
            <strong>${item.name}</strong>
            <em>${count} ${t("prj.photos")}</em>
          </span>
        </button>`;
      }).join("");
    };
    projectGrid.addEventListener("click", (event) => {
      const shot = event.target.closest("[data-shot]");
      if (shot && dialogPhoto) {
        const idx = Number(shot.dataset.shotIndex);
        galleryIndex = Number.isFinite(idx) ? idx : Math.max(0, galleryShots.indexOf(shot.dataset.shot));
        syncGallery();
        return;
      }
      const card = event.target.closest("[data-project-index]");
      if (!card) return;
      openProject(Number(card.dataset.projectIndex));
    });
    if (dialogThumbs) dialogThumbs.addEventListener("click", onCardClick);
    renderProjects();
    document.addEventListener("kucar:lang", renderProjects);
  }

  const form = document.querySelector("[data-form]");
  if (form) {
    form.addEventListener("submit", (event) => {
      const data = new FormData(form);
      const name = String(data.get("ad") || "").trim();
      const phone = String(data.get("telefon") || "").trim();
      const message = String(data.get("mesaj") || "").trim();
      const note = form.querySelector("[data-form-note]");
      if (!name || !phone || !message) {
        event.preventDefault();
        if (note) note.textContent = t("form.need");
        return;
      }
      // Netlify Forms: tarayıcı POST eder; mailto kullanılmaz
      if (form.hasAttribute("data-netlify")) {
        if (note) note.textContent = t("form.sending");
        return;
      }
      event.preventDefault();
      const email = String(data.get("eposta") || "").trim();
      const topic = String(data.get("konu") || "").trim();
      const body = `${t("form.name")}: ${name}\n${t("form.phone")}: ${phone}\n${t("form.email")}: ${email}\n${t("form.topic")}: ${topic}\n\n${message}`;
      const mailto = `mailto:tr-kucar@hotmail.com?subject=${encodeURIComponent("Kuçar — " + topic)}&body=${encodeURIComponent(body)}`;
      if (note) note.textContent = t("form.opening");
      window.location.href = mailto;
    });
  }

  document.querySelectorAll("[data-close-dialog]").forEach((button) => {
    button.addEventListener("click", () => button.closest("dialog")?.close());
  });

  if (dialogPrev) dialogPrev.addEventListener("click", () => stepGallery(-1));
  if (dialogNext) dialogNext.addEventListener("click", () => stepGallery(1));
  document.addEventListener("keydown", (event) => {
    if (!dialog?.open) return;
    if (event.key === "ArrowLeft") {
      event.preventDefault();
      stepGallery(-1);
    } else if (event.key === "ArrowRight") {
      event.preventDefault();
      stepGallery(1);
    }
  });

  const igFeed = document.querySelector("[data-ig-feed]");
  if (igFeed) {
    const embed = igFeed.querySelector("[data-ig-embed]");
    const renderLikesIoGrid = (posts) => {
      const grid = document.createElement("div");
      grid.className = "ig-grid";
      grid.setAttribute("role", "list");
      posts.forEach((post) => {
        if (!post?.permalink || !post?.imageUrl) return;
        const item = document.createElement("a");
        item.className = "ig-grid-item";
        item.href = post.permalink;
        item.target = "_blank";
        item.rel = "noopener noreferrer";
        item.setAttribute("role", "listitem");
        const caption = (post.caption || "").trim();
        item.title = caption || "@kucarfurniture";
        item.setAttribute("aria-label", caption || "Instagram gönderisi");

        const img = document.createElement("img");
        img.src = post.imageUrl;
        img.alt = caption || "Instagram";
        img.width = 480;
        img.height = 480;
        img.loading = "lazy";
        img.decoding = "async";
        item.appendChild(img);

        if ((post.type || "").toLowerCase() === "video") {
          const badge = document.createElement("span");
          badge.className = "ig-grid-badge";
          badge.setAttribute("aria-hidden", "true");
          badge.innerHTML =
            '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="currentColor" d="M8 5.5v13l11-6.5L8 5.5z"/></svg>';
          item.appendChild(badge);
        }
        grid.appendChild(item);
      });
      return grid;
    };

    const hideIgPlaceholder = () => {
      const placeholder = embed?.querySelector("[data-ig-placeholder]");
      if (placeholder) placeholder.remove();
      if (embed) embed.classList.add("is-empty");
    };

    const loadIgFeed = () => {
      if (!embed || embed.dataset.igLoaded === "1") return;
      const service = (embed.dataset.igService || "").trim().toLowerCase();
      const widgetId = (embed.dataset.igWidgetId || "").trim();
      const scriptSrc = (embed.dataset.igScript || "").trim();

      if (service === "likesio") {
        const feed = window.KUCAR_IG_FEED;
        const posts = Array.isArray(feed?.posts) ? feed.posts : [];
        if (!posts.length) return;
        embed.dataset.igLoaded = "1";
        hideIgPlaceholder();
        embed.classList.remove("is-empty");
        embed.appendChild(renderLikesIoGrid(posts.slice(0, 9)));
        return;
      }

      if (!service || !widgetId) return;

      embed.dataset.igLoaded = "1";
      hideIgPlaceholder();
      embed.classList.remove("is-empty");

      if (service === "snapwidget") {
        const frame = document.createElement("iframe");
        frame.title = "Instagram Feed";
        frame.className = "snapwidget-widget";
        frame.loading = "lazy";
        frame.allowTransparency = true;
        frame.scrolling = "no";
        frame.style.border = "none";
        frame.style.overflow = "hidden";
        frame.style.width = "100%";
        frame.style.minHeight = "420px";
        frame.src = `https://snapwidget.com/embed/${encodeURIComponent(widgetId)}`;
        embed.appendChild(frame);
        const src = scriptSrc || "https://snapwidget.com/js/snapwidget.js";
        if (!document.querySelector(`script[data-ig-script="${src}"]`)) {
          const script = document.createElement("script");
          script.src = src;
          script.async = true;
          script.dataset.igScript = src;
          document.body.appendChild(script);
        }
      } else if (service === "behold") {
        const root = document.createElement("div");
        root.dataset.beholdFeed = widgetId;
        embed.appendChild(root);
        const src = scriptSrc || "https://w.behold.so/widget.js";
        if (!document.querySelector(`script[data-ig-script="${src}"]`)) {
          const script = document.createElement("script");
          script.src = src;
          script.async = true;
          script.type = "module";
          script.dataset.igScript = src;
          document.body.appendChild(script);
        }
      } else if (service === "elfsight") {
        const root = document.createElement("div");
        root.className = `elfsight-app-${widgetId}`;
        root.dataset.elfsightAppLazy = "true";
        embed.appendChild(root);
        const src = scriptSrc || "https://static.elfsight.com/platform/platform.js";
        if (!document.querySelector(`script[data-ig-script="${src}"]`)) {
          const script = document.createElement("script");
          script.src = src;
          script.async = true;
          script.dataset.igScript = src;
          document.body.appendChild(script);
        }
      }
    };

    window.setTimeout(() => {
      if (embed && embed.dataset.igLoaded !== "1") hideIgPlaceholder();
    }, 4000);

    if ("IntersectionObserver" in window) {
      const io = new IntersectionObserver((entries) => {
        if (!entries.some((entry) => entry.isIntersecting)) return;
        loadIgFeed();
        io.disconnect();
      }, { rootMargin: "200px 0px" });
      io.observe(igFeed);
    } else {
      loadIgFeed();
    }
  }

  document.querySelectorAll("[data-year-num]").forEach((el) => {
    el.textContent = String(new Date().getFullYear());
  });

  const fab = document.querySelector("[data-fab]");
  const fabToggle = document.querySelector("[data-fab-toggle]");
  if (fab && fabToggle) {
    const setFabOpen = (open) => {
      fab.classList.toggle("is-open", open);
      fabToggle.setAttribute("aria-expanded", open ? "true" : "false");
    };
    fabToggle.addEventListener("click", () => {
      setFabOpen(!fab.classList.contains("is-open"));
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && fab.classList.contains("is-open")) setFabOpen(false);
    });
  }
})();
