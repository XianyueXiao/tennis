/**
 * 结尾展望 · P25 完结撒花（Figma 74:832）
 */

(function () {
  "use strict";

  const STAGGER_MS = 220;
  const REVEAL_MS = 480;
  const LIFT = 22;
  const PAGE_COUNT = 1;
  const DATA_URL = "data/outro-outlook.json";

  function loadOutroData() {
    if (window.OUTRO_OUTLOOK) {
      return Promise.resolve(window.OUTRO_OUTLOOK);
    }
    return fetch(DATA_URL).then((r) => {
      if (!r.ok) throw new Error("outro data load failed");
      return r.json();
    });
  }

  function applyDisplayCounts(data) {
    if (!data) return;
    document.querySelectorAll("[data-count]").forEach((el) => {
      const key = el.dataset.count;
      if (data[key] != null) {
        el.textContent = String(data[key]);
      }
    });
  }

  function isCenteredOutroEl(el) {
    return el.classList.contains("outro-drop") || el.classList.contains("outro-copy");
  }

  function initOutroPages() {
    const sections = [...document.querySelectorAll(".page-outro[data-outro-page]")];
    const noopModule = {
      enterPage() {},
      leavePage() {},
      isBusy() {
        return false;
      },
    };
    if (!sections.length) return noopModule;

    const panelForOutroPage = {};
    const itemsByPage = {};
    sections.forEach((section) => {
      const page = Number(section.dataset.outroPage);
      const panel = section.querySelector(".outro-panel");
      if (!panel || !page) return;
      panelForOutroPage[page] = panel;
      itemsByPage[page] = [...panel.querySelectorAll(".spatial-reveal")].sort(
        (a, b) => Number(a.dataset.order) - Number(b.dataset.order)
      );
    });

    let isRevealing = false;
    let revealTimers = [];

    function itemsForPage(page) {
      return itemsByPage[page] || [];
    }

    function revealTransform(el, liftPx) {
      const ty = `${liftPx}px`;
      if (isCenteredOutroEl(el)) {
        return `translateX(-50%) translateY(${ty})`;
      }
      return `translateY(${ty})`;
    }

    function setRevealState(el, visible, animate) {
      if (visible && animate) {
        el.classList.add("is-animating");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.opacity = "1";
            el.style.transform = revealTransform(el, 0);
            el.classList.add("is-visible");
          });
        });
        return;
      }

      el.style.opacity = visible ? "1" : "0";
      el.style.transform = revealTransform(el, visible ? 0 : LIFT);
      el.classList.toggle("is-visible", visible);
      el.classList.toggle("is-animating", animate);
    }

    function scheduleTimer(fn, delay) {
      const id = setTimeout(fn, delay);
      revealTimers.push(id);
      return id;
    }

    function clearRevealTimers() {
      revealTimers.forEach(clearTimeout);
      revealTimers = [];
    }

    function hideItems(list) {
      list.forEach((el) => setRevealState(el, false, false));
    }

    function hideTextItemsInstant(list) {
      list.forEach((el) => {
        el.classList.remove("is-animating", "is-visible");
        el.style.opacity = "0";
        el.style.transform = revealTransform(el, LIFT);
      });
    }

    function playReveal(list, panel) {
      clearRevealTimers();
      isRevealing = true;
      hideItems(list);
      panel.classList.remove("is-fading-out");

      list.forEach((el, index) => {
        scheduleTimer(() => setRevealState(el, true, true), index * STAGGER_MS);
      });

      const totalMs = Math.max(0, list.length - 1) * STAGGER_MS + REVEAL_MS;
      scheduleTimer(() => {
        isRevealing = false;
      }, totalMs);
    }

    function resetPanelStyles(panel) {
      if (!panel) return;
      panel.style.transform = "";
      panel.style.opacity = "";
      panel.style.visibility = "";
    }

    function enterPage(page) {
      const panel = panelForOutroPage[page];
      if (!panel) return;
      resetPanelStyles(panel);
      playReveal(itemsForPage(page), panel);
    }

    function leavePage(page) {
      clearRevealTimers();
      isRevealing = false;
      const panel = panelForOutroPage[page];
      hideTextItemsInstant(itemsForPage(page));
      resetPanelStyles(panel);
    }

    for (let p = 1; p <= PAGE_COUNT; p += 1) {
      const list = itemsForPage(p);
      if (list.length) hideTextItemsInstant(list);
    }

    return {
      enterPage,
      leavePage,
      isBusy() {
        return isRevealing;
      },
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    window.OutroModule = initOutroPages();
    loadOutroData()
      .then((data) => {
        applyDisplayCounts(data);
      })
      .catch(() => {});
  });
})();
