/**
 * 导航 5 · 网球蛋糕切分动画（Figma 4:6 → 4:18 → 4:30）
 */
(function () {
  "use strict";

  const CUT_MS = 780;
  const SAW_MS = 1680;
  const SLICE_MS = 1100;
  const RACKET_CUT_POSE = "rotate(-93.59deg) translateX(0)";
  const CAKE_PAGE_INDEX = 4;

  function clearCakeTimers() {
    clearTimeout(window.CakePageModule._cutTimer);
    clearTimeout(window.CakePageModule._sawTimer);
    clearTimeout(window.CakePageModule._sliceTimer);
    window.CakePageModule._cutTimer = 0;
    window.CakePageModule._sawTimer = 0;
    window.CakePageModule._sliceTimer = 0;
  }

  window.CakePageModule = {
    reset() {
      const page = document.getElementById("page-cake");
      if (!page) return;
      page.classList.remove("page-cake--cutting", "page-cake--sawing", "page-cake--sliced");
      const racket = page.querySelector(".page-cake__racket");
      if (racket && window.CakePageModule._onSawEnd) {
        racket.removeEventListener("animationend", window.CakePageModule._onSawEnd);
        window.CakePageModule._onSawEnd = null;
      }
      if (racket) {
        racket.style.animation = "";
        racket.style.transform = "";
      }
      const outcome = page.querySelector(".page-cake__outcome");
      const btn = page.querySelector(".page-cake__cta");
      if (outcome) outcome.setAttribute("aria-hidden", "true");
      if (btn && !page.classList.contains("page-cake--started")) {
        btn.disabled = false;
        btn.removeAttribute("aria-disabled");
      }
      clearCakeTimers();
      window.CakePageModule._busy = false;
    },

    leavePage() {
      window.CakePageModule.reset();
    },
  };

  function initCakePage() {
    const page = document.getElementById("page-cake");
    if (!page) return;

    const btn = page.querySelector(".page-cake__cta");
    const outcome = page.querySelector(".page-cake__outcome");
    if (!btn) return;

    btn.addEventListener("click", () => {
      if (window.CakePageModule._busy) return;
      if (page.classList.contains("page-cake--started")) return;
      if (page.classList.contains("page-cake--sliced")) return;

      window.CakePageModule._busy = true;
      btn.disabled = true;
      btn.setAttribute("aria-disabled", "true");

      page.classList.remove("page-cake--sliced", "page-cake--sawing");
      page.classList.add("page-cake--started", "page-cake--cutting");
      clearCakeTimers();

      window.CakePageModule._cutTimer = setTimeout(() => {
        const racket = page.querySelector(".page-cake__racket");

        function beginRelease() {
          page.classList.remove("page-cake--sawing");
          if (racket) {
            racket.style.animation = "none";
            racket.style.transform = RACKET_CUT_POSE;
          }
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              page.classList.add("page-cake--sliced");
              if (outcome) outcome.setAttribute("aria-hidden", "false");

              window.CakePageModule._sliceTimer = setTimeout(() => {
                if (racket) {
                  racket.style.animation = "";
                  racket.style.transform = "";
                }
                window.CakePageModule._busy = false;
              }, SLICE_MS);
            });
          });
        }

        function onSawEnd(e) {
          if (e && e.animationName !== "pageCakeRacketSaw") return;
          if (racket && window.CakePageModule._onSawEnd) {
            racket.removeEventListener("animationend", window.CakePageModule._onSawEnd);
            window.CakePageModule._onSawEnd = null;
          }
          clearTimeout(window.CakePageModule._sawTimer);
          beginRelease();
        }

        window.CakePageModule._onSawEnd = onSawEnd;
        if (racket) racket.addEventListener("animationend", onSawEnd);
        page.classList.add("page-cake--sawing");

        window.CakePageModule._sawTimer = setTimeout(() => {
          onSawEnd({ animationName: "pageCakeRacketSaw" });
        }, SAW_MS + 120);
      }, CUT_MS);
    });
  }

  document.addEventListener("DOMContentLoaded", initCakePage);

  window.CakePageModule.pageIndex = CAKE_PAGE_INDEX;
})();
