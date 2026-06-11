/**
 * P17（page-15）· 相似度 0% / 100% 数字滚动
 */
(function () {
  "use strict";

  const COUNT_DURATION = 1200;
  const DELAY_PERCENT_0 = 500;
  const DELAY_PERCENT_100 = 700;

  let stop0 = null;
  let stop100 = null;

  function easeOutCubic(t) {
    return 1 - (1 - t) ** 3;
  }

  function runCount(el, from, to, startDelay, duration) {
    let delayTimer = 0;
    let rafId = 0;

    function stop() {
      clearTimeout(delayTimer);
      if (rafId) cancelAnimationFrame(rafId);
      rafId = 0;
    }

    delayTimer = setTimeout(() => {
      const t0 = performance.now();
      el.textContent = `${from}%`;

      function tick(now) {
        const p = Math.min(1, (now - t0) / duration);
        const v = Math.round(from + (to - from) * easeOutCubic(p));
        el.textContent = `${v}%`;
        if (p < 1) {
          rafId = requestAnimationFrame(tick);
        } else {
          el.textContent = `${to}%`;
          rafId = 0;
        }
      }

      rafId = requestAnimationFrame(tick);
    }, startDelay);

    return stop;
  }

  window.Page15Module = {
    enterPage() {
      const page = document.getElementById("page-15");
      if (!page) return;

      const el0 = page.querySelector(".page15-percent-0");
      const el100 = page.querySelector(".page15-percent-100");
      if (!el0 || !el100) return;

      if (stop0) stop0();
      if (stop100) stop100();

      stop0 = runCount(el0, 100, 0, DELAY_PERCENT_0, COUNT_DURATION);
      stop100 = runCount(el100, 0, 100, DELAY_PERCENT_100, COUNT_DURATION);
    },

    leavePage() {
      if (stop0) stop0();
      if (stop100) stop100();
      stop0 = null;
      stop100 = null;

      const el0 = document.querySelector(".page15-percent-0");
      const el100 = document.querySelector(".page15-percent-100");
      if (el0) el0.textContent = "0%";
      if (el100) el100.textContent = "100%";
    },
  };
})();
