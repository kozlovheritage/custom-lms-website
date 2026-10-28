/* ============================================================
   TEKHCEKH LANDING — script.js
   Theme toggle · year · form validation & stub submit
   ============================================================ */
(function () {
  "use strict";

  /* ---------- 1. THEME ---------- */
  const THEME_KEY = "tehtsekh-theme";
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");

  function getSystemTheme() {
    return window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    if (themeToggle) {
      themeToggle.setAttribute(
        "aria-label",
        theme === "dark" ? "Switch to light theme" : "Switch to dark theme"
      );
    }
  }

  function initTheme() {
    const stored = localStorage.getItem(THEME_KEY);
    applyTheme(stored || getSystemTheme());

    // если пользователь ещё не выбирал тему вручную — следуем системе
    if (!stored && window.matchMedia) {
      window
        .matchMedia("(prefers-color-scheme: dark)")
        .addEventListener("change", (e) => {
          if (!localStorage.getItem(THEME_KEY)) {
            applyTheme(e.matches ? "dark" : "light");
          }
        });
    }
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const current = root.getAttribute("data-theme") || "light";
      const next = current === "dark" ? "light" : "dark";
      applyTheme(next);
      localStorage.setItem(THEME_KEY, next);
    });
  }

  initTheme();

  /* ---------- 2. FOOTER YEAR ---------- */
  const yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  /* ---------- 3. FORM ---------- */
  const form = document.getElementById("contactForm");
  const note = document.getElementById("formNote");

  if (form && note) {
    const isEN = document.documentElement.lang === "en";
    const MESSAGES = {
      ru: {
        required: "Заполните это поле.",
        success: "Спасибо! Заявка отправлена — свяжусь с вами в ближайшее время.",
        sending: "Отправляю…",
        error: "Что-то пошло не так. Попробуйте ещё раз или напишите напрямую.",
      },
      en: {
        required: "Please fill in this field.",
        success: "Thank you! Your request has been sent — I'll get back to you soon.",
        sending: "Sending…",
        error: "Something went wrong. Please try again or reach out directly.",
      },
    };
    const msg = isEN ? MESSAGES.en : MESSAGES.ru;

    // очистка сообщений при вводе
    form.addEventListener("input", (e) => {
      const field = e.target;
      if (field.classList) field.classList.remove("is-invalid");
      note.textContent = "";
      note.classList.remove("is-error", "is-success");
    });

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      // --- валидация ---
      const name = form.querySelector("#name");
      const contact = form.querySelector("#contact");
      let firstInvalid = null;

      [name, contact].forEach((field) => {
        const value = field.value.trim();
        field.classList.remove("is-invalid");
        if (!value) {
          field.classList.add("is-invalid");
          if (!firstInvalid) firstInvalid = field;
        }
      });

      if (firstInvalid) {
        note.textContent = msg.required;
        note.classList.add("is-error");
        firstInvalid.focus();
        return;
      }

      // --- заглушка отправки ---
      const submitBtn = form.querySelector('button[type="submit"]');
      const originalLabel = submitBtn ? submitBtn.textContent : "";

      note.textContent = msg.sending;
      note.classList.remove("is-error", "is-success");
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = msg.sending;
      }

      try {
        // TODO: заменить на реальную отправку (fetch на backend / сторонний сервис)
        await new Promise((resolve) => setTimeout(resolve, 700));

        note.textContent = msg.success;
        note.classList.add("is-success");
        form.reset();
      } catch (err) {
        note.textContent = msg.error;
        note.classList.add("is-error");
      } finally {
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = originalLabel;
        }
      }
    });
  }
})();