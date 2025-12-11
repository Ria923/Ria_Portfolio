document.addEventListener("DOMContentLoaded", () => {
  const section = document.querySelector(".logo-section");
  const svg = section?.querySelector(".logo-svg");
  if (!section || !svg) return;

  const loader = document.getElementById("loading");
  const startOverlay = document.getElementById("startOverlay");
  const startButton = document.getElementById("startButton");
  // 初始鎖定滾動，待按下 Start 才解鎖
  document.body.classList.add("no-scroll");

  const pieces = Array.from(svg.querySelectorAll("path")).filter(
    (path) =>
      !path.closest("defs") &&
      !path.closest("mask") &&
      !path.closest("clipPath")
  );

  const holder = section.querySelector(".logo-holder") || section;
  const revealables = Array.from(
    document.querySelectorAll("[data-reveal-on-snap], .about-inner")
  );
  const offsets = new Map();
  let lastProgress = 0;
  let revealObserver = null;

  // Portfolio elements
  const categoryButtons = Array.from(
    document.querySelectorAll(".category-btn")
  );
  const categorySelect = document.querySelector(".category-select select");
  const gallerySlide = document.querySelector(".gallery-slide");
  const workTitle = document.querySelector(".work-title");
  const workMeta = document.querySelector(".work-meta");
  const workDesc = document.querySelector(".work-desc");
  const workImage = document.querySelector(".work-image");
  const workOpen = document.querySelector(".work-open");
  const prevBtn = document.querySelector(".nav-arrow.prev");
  const nextBtn = document.querySelector(".nav-arrow.next");
  const dotsWrap = document.querySelector(".gallery-dots");
  const modal = document.getElementById("workModal");
  const modalClose = modal?.querySelector(".modal-close");
  const modalTitle = modal?.querySelector(".modal-title");
  const modalMeta = modal?.querySelector(".modal-meta");
  const modalDesc = modal?.querySelector(".modal-desc");
  const modalImage = modal?.querySelector(".modal-image");
  const modalCta = modal?.querySelector(".modal-cta");
  const modalPrev = modal?.querySelector(".modal-prev");
  const modalNext = modal?.querySelector(".modal-next");

  const categoryLabels = {
    all: "すべて",
    website: "Webサイト",
    webapp: "Webアプリ",
    illustration: "イラスト",
    file: "手帳・ファイル",
    menu: "メニュー",
    logo: "ロゴ",
  };

  const works = [
    {
      title: "Monhoru",
      category: "webapp",
      year: "2025",
      desc: "",
      image: 'url("./images/monhoru-01.png")',
      gallery: [
        'url("./images/monhoru-01.png")',
        'url("./images/monhoru-02.png")',
        'url("./images/monhoru-03.png")',
        'url("./images/monhoru-04.png")',
        'url("./images/monhoru-05.png")',
      ],
    },
    {
      title: "100 Wish List",
      category: "file",
      year: "2025",
      desc: "",
      image: 'url("./images/100-01.png")',
      gallery: ['url("./images/100-01.png")', 'url("./images/100-02.png")'],
    },
    {
      title: "ZION-Meet",
      category: "website",
      year: "2024",
      desc: "",
      image: 'url("./images/ZionMeet-01.png")',
      gallery: [
        'url("./images/ZionMeet-01.png")',
        'url("./images/ZionMeet-02.png")',
        'url("./images/ZionMeet-03.png")',
        'url("./images/ZionMeet-04.png")',
        'url("./images/ZionMeet-05.png")',
      ],
      galleryCtas: [
        null,
        null,
        null,
        null,
        {
          label: "サイトを見る",
          url: "https://zion-meet.vercel.app/",
        },
      ],
    },
    {
      title: "きらきらタスクノート",
      category: "webapp",
      year: "2024",
      desc: "",
      image: 'url("./images/todolist-01.png")',
      gallery: [
        'url("./images/todolist-01.png")',
        'url("./images/todolist-02.png")',
        'url("./images/todolist-03.png")',
        'url("./images/todolist-04.png")',
        'url("./images/todolist-05.png")',
      ],
      galleryCtas: [
        null,
        null,
        null,
        null,
        {
          label: "サイトを見る",
          url: "https://todo-list-nu-five-46.vercel.app/",
        },
      ],
    },
    {
      title: "RiaLogo",
      category: "logo",
      year: "2025",
      desc: "",
      image: 'url("./images/rialogo-01.png")',
      gallery: [
        'url("./images/rialogo-01.png")',
        'url("./images/rialogo-02.png")',
        'url("./images/rialogo-03.png")',
      ],
    },
    {
      title: "Webラボ所",
      category: "website",
      year: "2024",
      desc: "",
      image: 'url("./images/webrebo-01.png")',
      gallery: [
        'url("./images/webrebo-01.png")',
        'url("./images/webrebo-02.png")',
        'url("./images/webrebo-03.png")',
        'url("./images/webrebo-04.png")',
        'url("./images/webrebo-05.png")',
      ],
      galleryCtas: [
        null,
        null,
        null,
        null,
        {
          label: "サイトを見る",
          url: "https://web-ra-bo.vercel.app/index.html",
        },
      ],
    },

    {
      title: "香港点心ー居酒屋",
      category: "menu",
      year: "2024",
      desc: "",
      image: 'url("./images/hkmenu-01.png")',
      gallery: [
        'url("./images/hkmenu-01.png")',
        'url("./images/hkmenu-02.png")',
        'url("./images/hkmenu-03.png")',
      ],
    },
    {
      title: "Atakuri",
      category: "illustration",
      year: "2024/2025",
      desc: "",
      image: 'url("./images/pandaill-01.png")',
      gallery: [
        'url("./images/pandaill-01.png")',
        'url("./images/pandaill-02.png")',
      ],
    },
  ];
  let filteredWorks = [...works];
  let currentCategory = "all";
  let currentIndex = 0;
  let modalSlides = [];
  let modalSlideIndex = 0;

  // 保險：進入視窗時淡入（用 viewport 判斷，避免觀察器失效）
  function checkReveal() {
    const vh = window.innerHeight || document.documentElement.clientHeight || 1;
    revealables.forEach((el) => {
      if (el.classList.contains("reveal")) return;
      const rect = el.getBoundingClientRect();
      if (rect.top < vh * 0.95 && rect.bottom > vh * 0.05) {
        el.classList.add("reveal");
      }
    });
  }

  // 主要：用 IntersectionObserver 讓每個 about 內容確定淡入
  if ("IntersectionObserver" in window) {
    revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("reveal");
            revealObserver.unobserve(entry.target);
          }
        });
      },
      {
        threshold: 0.35,
        rootMargin: "0px 0px -10% 0px",
      }
    );
    revealables.forEach((el) => revealObserver.observe(el));
  }

  // Portfolio helpers
  function syncDots() {
    if (!dotsWrap) return;
    dotsWrap.innerHTML = "";
    filteredWorks.forEach((_, idx) => {
      const dot = document.createElement("button");
      dot.className = "dot" + (idx === currentIndex ? " active" : "");
      dot.setAttribute("aria-label", `作品 ${idx + 1}`);
      dot.addEventListener("click", () => goTo(idx));
      dotsWrap.appendChild(dot);
    });
  }

  function syncCard() {
    const work = filteredWorks[currentIndex];
    if (!work || !workTitle || !workMeta || !workDesc || !workImage) return;
    workTitle.textContent = work.title;
    workMeta.textContent = `${
      categoryLabels[work.category] || work.category
    } / ${work.year}`;
    workDesc.textContent = work.desc;
    workImage.style.backgroundImage = work.image;
    workImage.classList.remove("placeholder");
    syncDots();
    // 觸發換頁動畫
    if (gallerySlide) {
      gallerySlide.classList.remove("swap");
      void gallerySlide.offsetWidth; // force reflow
      gallerySlide.classList.add("swap");
    }
  }

  function goTo(idx) {
    if (!filteredWorks.length) return;
    const total = filteredWorks.length;
    currentIndex = ((idx % total) + total) % total;
    syncCard();
  }

  function next() {
    goTo(currentIndex + 1);
  }

  function prev() {
    goTo(currentIndex - 1);
  }

  function syncModalCta() {
    if (!modalCta) return;
    const work = filteredWorks[currentIndex];
    const ctas = Array.isArray(work?.galleryCtas) ? work.galleryCtas : [];
    const cta = ctas[modalSlideIndex];
    if (cta && cta.url) {
      modalCta.href = cta.url;
      modalCta.textContent = cta.label || "サイトを見る";
      modalCta.classList.add("show");
    } else {
      modalCta.classList.remove("show");
    }
  }

  function setCategory(cat) {
    currentCategory = cat;
    filteredWorks =
      cat === "all" ? [...works] : works.filter((w) => w.category === cat);
    currentIndex = 0;
    categoryButtons.forEach((btn) => {
      btn.classList.toggle("active", btn.dataset.category === cat);
    });
    if (categorySelect && categorySelect.value !== cat) {
      categorySelect.value = cat;
    }
    syncCard();
  }

  function openModal() {
    if (!modal || !modalTitle || !modalMeta || !modalDesc || !modalImage)
      return;
    const work = filteredWorks[currentIndex];
    if (!work) return;
    modalTitle.textContent = work.title;
    modalMeta.textContent = `${
      categoryLabels[work.category] || work.category
    } / ${work.year}`;
    modalDesc.textContent = work.desc;
    // 準備此作品的多張圖
    modalSlides =
      Array.isArray(work.gallery) && work.gallery.length
        ? [...work.gallery]
        : [work.image];
    modalSlideIndex = 0;
    modalImage.style.backgroundImage = modalSlides[modalSlideIndex];
    modalImage?.classList.remove("placeholder");
    syncModalCta();
    modal.classList.add("show");
  }

  function closeModal() {
    if (!modal) return;
    modal.classList.remove("show");
  }

  function initPortfolio() {
    if (!gallerySlide || !workOpen) return;
    setCategory(currentCategory);
    categoryButtons.forEach((btn) =>
      btn.addEventListener("click", () =>
        setCategory(btn.dataset.category || "all")
      )
    );
    if (categorySelect) {
      categorySelect.addEventListener("change", (e) => {
        const value = e.target.value || "all";
        setCategory(value);
      });
    }
    if (prevBtn) prevBtn.addEventListener("click", prev);
    if (nextBtn) nextBtn.addEventListener("click", next);
    workOpen.addEventListener("click", openModal);
    if (modalClose) modalClose.addEventListener("click", closeModal);
    if (modalPrev)
      modalPrev.addEventListener("click", (e) => {
        e.stopPropagation();
        modalSlideIndex =
          (modalSlideIndex - 1 + modalSlides.length) % modalSlides.length;
        if (modalImage && modalSlides.length) {
          modalImage.style.backgroundImage = modalSlides[modalSlideIndex];
        }
        syncModalCta();
      });
    if (modalNext)
      modalNext.addEventListener("click", (e) => {
        e.stopPropagation();
        modalSlideIndex = (modalSlideIndex + 1) % modalSlides.length;
        if (modalImage && modalSlides.length) {
          modalImage.style.backgroundImage = modalSlides[modalSlideIndex];
        }
        syncModalCta();
      });
    modal?.addEventListener("click", (e) => {
      if (e.target === modal) closeModal();
    });
    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") closeModal();
    });
  }

  const sizes = pieces.map((p) => {
    const box = p.getBBox();
    return { piece: p, size: (box.width || 0) + (box.height || 0) };
  });
  const sortedSizes = [...sizes].sort((a, b) => a.size - b.size);
  const medianSize =
    sortedSizes[Math.floor(sortedSizes.length / 2)]?.size ||
    sortedSizes[0]?.size ||
    1;

  function calcMaxRadius() {
    const rect = holder.getBoundingClientRect();
    const fallback = Math.min(window.innerWidth || 0, window.innerHeight || 0);
    const base = Math.min(rect.width || fallback, rect.height || fallback);
    const margin = 120;
    const maxRadius = base / 2 - margin;
    return Math.max(150, Math.min(maxRadius, base / 2));
  }

  function scatter() {
    const count = pieces.length || 1;
    const maxRadius = calcMaxRadius();
    const innerRadius = maxRadius * 0.2;
    pieces.forEach((piece, idx) => {
      const angle = (idx / count) * Math.PI * 2 + (Math.random() - 0.5) * 0.25;
      const sizeInfo = sizes.find((s) => s.piece === piece);
      const size = sizeInfo?.size || medianSize;
      const baseRadius = innerRadius + Math.random() * (maxRadius * 0.7);
      const radius =
        size > medianSize
          ? Math.min(maxRadius * 0.9, baseRadius * 1.1)
          : baseRadius;

      const offsetX = Math.cos(angle) * radius;
      const offsetY = Math.sin(angle) * radius;
      const rotation = (Math.random() - 0.5) * 24;
      const scale = 0.9 + Math.random() * 0.2;

      offsets.set(piece, { offsetX, offsetY, rotation, scale });
      piece.style.transition = "none";
      piece.style.transform = `translate(${offsetX}px, ${offsetY}px) rotate(${rotation}deg) scale(${scale})`;
    });

    requestAnimationFrame(() => {
      pieces.forEach((piece) => {
        piece.style.transition = "transform 0.45s ease-out";
      });
    });
  }

  function updateByScroll() {
    if (!offsets.size) return { progressRaw: 0, progressClamped: 0 };
    const viewport =
      window.innerHeight || document.documentElement.clientHeight || 1;
    const scrollY = window.scrollY || window.pageYOffset || 0;
    const sectionTop = section.offsetTop;
    const progressRaw = (scrollY - sectionTop) / viewport;
    lastProgress = Math.min(Math.max(progressRaw, 0), 1);

    pieces.forEach((piece) => {
      const off = offsets.get(piece);
      if (!off) return;
      const currentX = off.offsetX * (1 - lastProgress);
      const currentY = off.offsetY * (1 - lastProgress);
      const currentRotation = off.rotation * (1 - lastProgress);
      const currentScale = 1 + (off.scale - 1) * (1 - lastProgress);
      piece.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${currentRotation}deg) scale(${currentScale})`;
    });
    return { progressRaw, progressClamped: lastProgress };
  }

  svg.style.display = "block";
  svg.style.margin = "0 auto";
  svg.style.overflow = "visible";

  scatter();
  updateByScroll();
  initPortfolio();

  function animateIdle(time) {
    const t = (time || 0) / 1000;
    pieces.forEach((piece, idx) => {
      const off = offsets.get(piece);
      if (!off) return;

      const jitterAmp = 10 * (1 - lastProgress);
      const jitterX = Math.sin(t * 0.8 + idx) * jitterAmp;
      const jitterY = Math.cos(t * 0.9 + idx * 1.7) * jitterAmp;
      const jitterR = Math.sin(t * 1.1 + idx * 0.5) * 3 * (1 - lastProgress);

      const currentX = off.offsetX * (1 - lastProgress) + jitterX;
      const currentY = off.offsetY * (1 - lastProgress) + jitterY;
      const currentRotation = off.rotation * (1 - lastProgress) + jitterR;
      const currentScale = 1 + (off.scale - 1) * (1 - lastProgress);

      piece.style.transform = `translate(${currentX}px, ${currentY}px) rotate(${currentRotation}deg) scale(${currentScale})`;
    });
    requestAnimationFrame(animateIdle);
  }

  window.addEventListener(
    "scroll",
    () => {
      updateByScroll();
      checkReveal();
    },
    { passive: true }
  );
  window.addEventListener(
    "resize",
    () => {
      scatter();
      updateByScroll();
      checkReveal();
    },
    { passive: true }
  );

  requestAnimationFrame(animateIdle);

  // 初始檢查淡入（保留舊 checkReveal，以防某些裝置 IntersectionObserver 有問題）
  if (typeof checkReveal === "function") checkReveal();

  window.addEventListener("load", () => {
    document.body.classList.remove("loading-active");
    document.body.classList.add("app-ready", "show-start", "no-scroll");
    window.scrollTo(0, 0);
    scatter();
    lastProgress = 0;
    animateIdle(performance.now());
    if (typeof checkReveal === "function") checkReveal();
    if (loader) {
      loader.classList.add("hide");
      setTimeout(() => loader.remove(), 600);
    }
  });

  if (startButton) {
    startButton.addEventListener("click", () => {
      document.body.classList.remove("show-start");
      document.body.classList.remove("no-scroll");
      window.scrollTo(0, 0);
      scatter();
      lastProgress = 0;
      if (typeof checkReveal === "function") checkReveal();
      if (startOverlay) {
        startOverlay.classList.add("hide");
        setTimeout(() => startOverlay.remove(), 400);
      }
    });
  }
});
