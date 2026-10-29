const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");

const script = fs.readFileSync(path.join(__dirname, "../js/script.js"), "utf8");

function element(attributes = {}) {
  return {
    attributes: { ...attributes }, listeners: {}, dataset: {},
    style: { setProperty() {} }, classList: { add() {}, remove() {} },
    textContent: "", hidden: false, offsetWidth: 1,
    addEventListener(type, callback) { this.listeners[type] = callback; },
    setAttribute(name, value) { this.attributes[name] = String(value); },
    getAttribute(name) { return this.attributes[name] ?? null; },
    querySelectorAll() { return []; },
    setPointerCapture() {},
  };
}

function loadPage(lang, mediaApi, pointerEvents, blockedStorage = false) {
  const ids = {};
  for (const id of [
    "themeToggle", "year", "carouselActive", "carouselImage", "carouselPeek",
    "carouselTitle", "carouselDescription", "carouselCount", "processNumber",
    "processIndex", "processTitle", "processBody", "processChip", "addon-panel",
  ]) ids[id] = element();
  ids["addon-panel"].hidden = true;
  const root = element(); root.lang = lang; root.scrollHeight = 1800;
  const page = element();
  const carousel = element(); ids.caseCarousel = carousel;
  const stack = element(), previous = element(), next = element();
  const dots = [0, 1, 2].map(index => {
    const dot = element(); dot.dataset.carouselGo = String(index); return dot;
  });
  carousel.querySelector = selector => ({
    ".ac-stack": stack,
    "[data-carousel-prev]": previous,
    "[data-carousel-next]": next,
  })[selector] ?? null;
  carousel.querySelectorAll = () => dots;
  const addon = element({ "aria-expanded": "false", "aria-controls": "addon-panel" });
  const tabs = Array.from({ length: 5 }, (_, index) => {
    const tab = element(); tab.dataset.step = String(index); return tab;
  });
  const selectors = {
    'meta[name="theme-color"]': element(), ".lms-full-page": page,
    ".lms-process-panel": element(), ".lms-process-fill": element(),
  };
  const document = {
    documentElement: root,
    getElementById: id => ids[id] ?? null,
    querySelector: selector => selectors[selector] ?? null,
    querySelectorAll: selector => selector === ".lms-addon-button" ? [addon]
      : selector === ".lms-process-tab" ? tabs : [],
  };
  const media = { matches: false };
  if (mediaApi === "modern") media.addEventListener = () => {};
  if (mediaApi === "legacy") media.addListener = () => {};
  const localStorage = {
    getItem() { if (blockedStorage) throw new Error("Storage blocked"); return null; },
    setItem() { if (blockedStorage) throw new Error("Storage blocked"); },
  };
  const window = {
    matchMedia: () => media, innerHeight: 800, scrollY: 0, addEventListener() {},
  };
  if (pointerEvents) window.PointerEvent = function PointerEvent() {};
  vm.runInNewContext(script, { document, window, localStorage });
  return { ids, stack, previous, next, dots, addon, tabs };
}

for (const lang of ["ru", "en"]) {
  for (const mediaApi of ["modern", "legacy", "none"]) {
    test(`${lang}: all controls initialize with ${mediaApi} media-query API`, () => {
      const pointerEvents = mediaApi === "modern";
      const page = loadPage(lang, mediaApi, pointerEvents, mediaApi === "none");
      const { ids, stack, previous, next, dots, addon, tabs } = page;
      next.listeners.click();
      assert.equal(ids.carouselCount.textContent, "02 / 03");
      previous.listeners.click();
      assert.equal(ids.carouselCount.textContent, "01 / 03");
      previous.listeners.click();
      assert.equal(ids.carouselCount.textContent, "03 / 03");
      dots[0].listeners.click();
      assert.equal(ids.carouselCount.textContent, "01 / 03");
      if (pointerEvents) {
        stack.listeners.pointerdown({ clientX: 200, clientY: 100, pointerId: 1 });
        stack.listeners.pointerup({ clientX: 90, clientY: 105 });
      } else {
        stack.listeners.touchstart({ changedTouches: [{ clientX: 200, clientY: 100 }] });
        stack.listeners.touchend({ changedTouches: [{ clientX: 90, clientY: 105 }] });
      }
      assert.equal(ids.carouselCount.textContent, "02 / 03");
      if (pointerEvents) {
        stack.listeners.pointerdown({ clientX: 200, clientY: 100, pointerId: 1 });
        stack.listeners.pointerup({ clientX: 180, clientY: 250 });
      } else {
        stack.listeners.touchstart({ changedTouches: [{ clientX: 200, clientY: 100 }] });
        stack.listeners.touchend({ changedTouches: [{ clientX: 180, clientY: 250 }] });
      }
      assert.equal(ids.carouselCount.textContent, "02 / 03", "vertical scroll must not change slide");
      addon.listeners.click();
      assert.equal(addon.getAttribute("aria-expanded"), "true");
      assert.equal(ids["addon-panel"].hidden, false);
      addon.listeners.click();
      assert.equal(ids["addon-panel"].hidden, true);
      tabs.forEach((tab, index) => {
        tab.listeners.click();
        assert.equal(ids.processNumber.textContent, String(index + 1).padStart(2, "0"));
        assert.equal(tab.getAttribute("aria-pressed"), "true");
        assert.ok(ids.processTitle.textContent);
      });
    });
  }
}
