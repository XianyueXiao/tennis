/**
 * p11-run-page.js — P11 公里数随狗头递增，跑完后显示底部文案
 */
(function () {
  "use strict";

  const DOG_MS = 3000;
  const TARGET_KM = 4.13;

  let rafId = 0;
  let activePage = null;

  function formatKm(value) {
    return value.toFixed(2);
  }

  function reset(page) {
    if (!page) return;
    page.classList.remove("p11-foot-visible");
    const distance = page.querySelector(".p11-distance");
    if (distance) distance.textContent = "0";
  }

  function tick(page, startTime) {
    const distance = page.querySelector(".p11-distance");
    if (!distance) return;

    const t = Math.min((performance.now() - startTime) / DOG_MS, 1);
    distance.textContent = formatKm(t * TARGET_KM);

    if (t < 1) {
      rafId = requestAnimationFrame(() => tick(page, startTime));
      return;
    }

    distance.textContent = "4.13";
    page.classList.add("p11-foot-visible");
  }

  function start(page) {
    stop();
    if (!page) return;
    activePage = page;
    reset(page);
    rafId = requestAnimationFrame(() => tick(page, performance.now()));
  }

  function stop() {
    cancelAnimationFrame(rafId);
    rafId = 0;
    if (activePage) {
      reset(activePage);
      activePage = null;
    }
  }

  window.P11RunPage = {
    start,
    stop,
    reset,
    DOG_MS,
    TARGET_KM,
  };
})();
