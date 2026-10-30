(() => {
  "use strict";

  const root = document.documentElement;
  const isEnglish = root.lang === "en";
  const themeKey = "tehtsekh-theme";
  const themeToggle = document.getElementById("themeToggle");
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const copy = {
    ru: {
      switchToLight: "Включить светлую тему",
      switchToDark: "Включить тёмную тему",
      screens: [
        {
          title: "Библиотека материалов",
          description: "Реальный экран участника из кейса «Фабрика заготовок».",
          alt: "Библиотека материалов с видео и файлами для участников клуба",
        },
        {
          title: "Поддержка оплат",
          description: "Реальный экран. Рабочие показатели скрыты на снимке.",
          alt: "Обезличенный реальный экран поддержки оплат платформы «Фабрика заготовок»",
        },
        {
          title: "Проверка доступа",
          description: "Реальный блок. Данные клиентов скрыты на снимке.",
          alt: "Обезличенный реальный блок проверки доступа платформы «Фабрика заготовок»",
        },
      ],
      steps: [
        ["Бриф", "Разбираем продукт, участников, материалы и сценарий запуска. Это точка, от которой считаются сроки.", "Старт проекта"],
        ["Проектирование", "Согласуем, как будет устроена платформа, какие функции нужны проекту и как разместить материалы.", "Состав фиксируем"],
        ["Сборка", "Создаём платформу по согласованному плану и размещаем стартовые материалы для участников.", "Материалы размещаем мы"],
        ["Приёмка", "Показываем результат, собираем замечания, вносим согласованные доработки и проводим финальную приёмку.", "До финального согласования"],
        ["Запуск", "Обучаем команду, открываем платформу участникам и остаёмся на связи первую неделю.", "Неделя сопровождения включена"],
      ],
      stepLabel: (number) => `Этап ${number} из 5`,
    },
    en: {
      switchToLight: "Switch to light theme",
      switchToDark: "Switch to dark theme",
      screens: [
        {
          title: "Content library",
          description: "A real member screen from the Fabrika Zagotovok case.",
          alt: "Member library with videos and files for a food-preserving club",
        },
        {
          title: "Payment support",
          description: "A real admin screen. Working metrics are hidden.",
          alt: "An anonymized payment support screen from the Fabrika Zagotovok platform",
        },
        {
          title: "Access check",
          description: "A real admin panel. Client data is hidden.",
          alt: "An anonymized access check from the Fabrika Zagotovok platform",
        },
      ],
      steps: [
        ["Brief", "We review the product, participants, materials, and launch flow. This is when the timeline starts.", "Project starts"],
        ["Planning", "We agree on the platform structure, required features, and how materials will be organized.", "Scope agreed"],
        ["Build", "We create the platform to the agreed plan and add the initial materials for participants.", "We add the materials"],
        ["Acceptance", "We present the result, collect feedback, make agreed updates, and complete final acceptance.", "Final review"],
        ["Launch", "We train your team, open the platform to participants, and stay available for the first week.", "One week of support"],
      ],
      stepLabel: (number) => `Step ${number} of 5`,
    },
  }[isEnglish ? "en" : "ru"];

  function getSystemTheme() {
    return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeColor) themeColor.content = theme === "dark" ? "#0b1526" : "#f5f7f9";
    if (themeToggle) {
      themeToggle.setAttribute("aria-label", theme === "dark" ? copy.switchToLight : copy.switchToDark);
      themeToggle.title = theme === "dark" ? copy.switchToLight : copy.switchToDark;
    }
  }

  let storedTheme = null;
  try {
    storedTheme = localStorage.getItem(themeKey);
  } catch (error) {
    // The theme still follows the system when storage is unavailable.
  }
  applyTheme(storedTheme || getSystemTheme());

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const nextTheme = root.getAttribute("data-theme") === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      try {
        localStorage.setItem(themeKey, nextTheme);
      } catch (error) {
        // Keep the current selection for this page view.
      }
    });
  }

  if (!storedTheme && window.matchMedia) {
    const colorScheme = window.matchMedia("(prefers-color-scheme: dark)");
    const syncSystemTheme = (event) => {
      let manualChoice = null;
      try {
        manualChoice = localStorage.getItem(themeKey);
      } catch (error) {
        // Ignore unavailable storage.
      }
      if (!manualChoice) applyTheme(event.matches ? "dark" : "light");
    };
    if (typeof colorScheme.addEventListener === "function") {
      colorScheme.addEventListener("change", syncSystemTheme);
    } else if (typeof colorScheme.addListener === "function") {
      colorScheme.addListener(syncSystemTheme);
    }
  }

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  const carousel = document.getElementById("caseCarousel");
  if (carousel) {
    const slides = [
      { src: "images/fabrika-library.png" },
      { src: "images/admin-payments-redacted.png" },
      { src: "images/admin-access-redacted.png" },
    ];
    const activeCard = document.getElementById("carouselActive");
    const image = document.getElementById("carouselImage");
    const peek = document.getElementById("carouselPeek");
    const title = document.getElementById("carouselTitle");
    const description = document.getElementById("carouselDescription");
    const count = document.getElementById("carouselCount");
    const dots = Array.from(carousel.querySelectorAll("[data-carousel-go]"));
    let activeIndex = 0;

    const showSlide = (nextIndex, direction = 1) => {
      activeIndex = (nextIndex + slides.length) % slides.length;
      const slide = copy.screens[activeIndex];
      image.src = slides[activeIndex].src;
      image.alt = slide.alt;
      peek.src = slides[(activeIndex + 1) % slides.length].src;
      title.textContent = slide.title;
      description.textContent = slide.description;
      count.textContent = `${String(activeIndex + 1).padStart(2, "0")} / ${String(slides.length).padStart(2, "0")}`;
      activeCard.setAttribute("aria-label", `${activeIndex + 1} ${isEnglish ? "of" : "из"} ${slides.length}: ${slide.title}`);
      dots.forEach((dot, index) => dot.setAttribute("aria-pressed", String(index === activeIndex)));
      activeCard.classList.remove("is-next", "is-previous");
      void activeCard.offsetWidth;
      activeCard.classList.add(direction > 0 ? "is-next" : "is-previous");
    };

    carousel.querySelector("[data-carousel-prev]")?.addEventListener("click", () => showSlide(activeIndex - 1, -1));
    carousel.querySelector("[data-carousel-next]")?.addEventListener("click", () => showSlide(activeIndex + 1, 1));
    dots.forEach((dot) => dot.addEventListener("click", () => {
      const nextIndex = Number(dot.dataset.carouselGo);
      if (nextIndex !== activeIndex) showSlide(nextIndex, nextIndex > activeIndex ? 1 : -1);
    }));
    carousel.addEventListener("keydown", (event) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        showSlide(activeIndex - 1, -1);
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        showSlide(activeIndex + 1, 1);
      }
    });

    let pointerStart = null;
    const stack = carousel.querySelector(".ac-stack");
    const finishSwipe = (distanceX, distanceY) => {
      if (Math.abs(distanceX) < 55 || Math.abs(distanceX) <= Math.abs(distanceY)) return;
      if (distanceX < 0) showSlide(activeIndex + 1, 1);
      else showSlide(activeIndex - 1, -1);
    };

    if (stack && "PointerEvent" in window) {
      stack.addEventListener("pointerdown", (event) => {
        if (event.pointerType === "mouse" && event.button !== 0) return;
        pointerStart = { x: event.clientX, y: event.clientY };
        if (typeof stack.setPointerCapture === "function") {
          try {
            stack.setPointerCapture(event.pointerId);
          } catch (error) {
            // Keep swipe available in browsers that reject pointer capture.
          }
        }
      });
      stack.addEventListener("pointerup", (event) => {
        if (!pointerStart) return;
        finishSwipe(event.clientX - pointerStart.x, event.clientY - pointerStart.y);
        pointerStart = null;
      });
      stack.addEventListener("pointercancel", () => { pointerStart = null; });
    } else if (stack) {
      let touchStart = null;
      stack.addEventListener("touchstart", (event) => {
        const touch = event.changedTouches[0];
        if (touch) touchStart = { x: touch.clientX, y: touch.clientY };
      }, { passive: true });
      stack.addEventListener("touchend", (event) => {
        const touch = event.changedTouches[0];
        if (!touch || !touchStart) return;
        finishSwipe(touch.clientX - touchStart.x, touch.clientY - touchStart.y);
        touchStart = null;
      }, { passive: true });
      stack.addEventListener("touchcancel", () => { touchStart = null; });
    }
  }

  document.querySelectorAll(".lms-addon-button").forEach((button) => {
    button.addEventListener("click", () => {
      const expanded = button.getAttribute("aria-expanded") === "true";
      const panel = document.getElementById(button.getAttribute("aria-controls"));
      button.setAttribute("aria-expanded", String(!expanded));
      if (panel) panel.hidden = expanded;
    });
  });

  const steps = copy.steps;
  const processPanel = document.querySelector(".lms-process-panel");
  const processNumber = document.getElementById("processNumber");
  const processIndex = document.getElementById("processIndex");
  const processTitle = document.getElementById("processTitle");
  const processBody = document.getElementById("processBody");
  const processChip = document.getElementById("processChip");
  const processFill = document.querySelector(".lms-process-fill");

  // Reserve the tallest step at the current width without changing the live
  // selection or announcing measurement content to assistive technology.
  function measureProcessPanel() {
    if (!processPanel || typeof processPanel.cloneNode !== "function") return;
    const probe = processPanel.cloneNode(true);
    const title = probe.querySelector("#processTitle");
    const body = probe.querySelector("#processBody");
    const chip = probe.querySelector("#processChip");
    if (!title || !body || !chip) return;
    probe.querySelectorAll("[id]").forEach((element) => element.removeAttribute("id"));
    probe.removeAttribute("id");
    probe.removeAttribute("aria-live");
    probe.setAttribute("aria-hidden", "true");
    Object.assign(probe.style, {
      position: "absolute", visibility: "hidden", pointerEvents: "none",
      width: `${processPanel.getBoundingClientRect().width}px`,
      minHeight: "0", height: "auto", top: "0", left: "0",
      transform: "none", transition: "none",
    });
    processPanel.parentElement.appendChild(probe);
    let height = 0;
    steps.forEach((step) => {
      title.textContent = step[0];
      body.textContent = step[1];
      chip.textContent = step[2];
      height = Math.max(height, probe.getBoundingClientRect().height);
    });
    probe.remove();
    processPanel.style.setProperty("--process-panel-height", `${Math.ceil(height)}px`);
  }
  measureProcessPanel();
  if (document.fonts?.ready) document.fonts.ready.then(measureProcessPanel);
  let processResizeTimer;
  window.addEventListener("resize", () => {
    window.clearTimeout(processResizeTimer);
    processResizeTimer = window.setTimeout(measureProcessPanel, 120);
  });

  document.querySelectorAll(".lms-process-tab").forEach((button) => {
    button.addEventListener("click", () => {
      const index = Number(button.dataset.step);
      const step = steps[index];
      if (!step) return;
      document.querySelectorAll(".lms-process-tab").forEach((tab) => tab.setAttribute("aria-pressed", String(tab === button)));
      processNumber.textContent = String(index + 1).padStart(2, "0");
      processIndex.textContent = copy.stepLabel(index + 1);
      processTitle.textContent = step[0];
      processBody.textContent = step[1];
      processChip.textContent = step[2];
      if (processFill) processFill.style.transform = `scaleX(${(index + 1) / steps.length})`;
      if (processPanel) {
        processPanel.classList.remove("is-visible");
        void processPanel.offsetWidth;
        processPanel.classList.add("is-visible");
      }
    });
  });

  const page = document.querySelector(".lms-full-page");
  const updateProgress = () => {
    const range = document.documentElement.scrollHeight - window.innerHeight;
    const progress = range > 0 ? Math.min(1, Math.max(0, window.scrollY / range)) : 0;
    page?.style.setProperty("--page-progress", String(progress));
  };
  updateProgress();
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress);

  const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  if (page && !reduceMotion && "IntersectionObserver" in window) {
    const reveals = Array.from(page.querySelectorAll("[data-reveal]"));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      });
    }, { threshold: 0.1, rootMargin: "0px 0px -6% 0px" });
    page.classList.add("lms-motion-ready");
    reveals.forEach((element) => observer.observe(element));
  } else {
    page?.querySelectorAll("[data-reveal]").forEach((element) => element.classList.add("is-visible"));
  }
})();
