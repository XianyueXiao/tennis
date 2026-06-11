/**
 * 强力一击 · Figma 1204:308（施放前）/ 1204:398（施放后）
 * 长按「释放技能」：数字 65→87、0→38 渐升，飞球加速
 */
(function () {
  "use strict";

  const COUNT_RAMP_MS = 1200;
  const FLYER_CAST_BOOST = 2.35;

  function readCount(data, key, fallback) {
    if (data && data[key] != null) return Number(data[key]);
    return fallback;
  }

  window.createSkillP2PowerController = function createSkillP2PowerController(
    layout,
    flyers
  ) {
    if (!layout) {
      return { start() {}, stop() {} };
    }

    const panel = layout.closest(".skill-panel--page2");
    const castBtn = panel?.querySelector(".skill-p2-cast-btn");
    const speedEl = layout.querySelector(".skill-p2-stat__number--speed");
    const usesEl = layout.querySelector(".skill-p2-stat__number--uses");

    function getCounts() {
      const data = window.SKILLS_POWER || {};
      return {
        speedBefore: readCount(
          data,
          speedEl?.dataset.countIdle || "max_crit_speed_before",
          65
        ),
        speedAfter: readCount(
          data,
          speedEl?.dataset.countCast || "max_crit_speed",
          87
        ),
        usesBefore: readCount(
          data,
          usesEl?.dataset.countIdle || "crit_usage_before",
          0
        ),
        usesAfter: readCount(
          data,
          usesEl?.dataset.countCast || "crit_usage_count",
          38
        ),
      };
    }

    let cast = false;
    let activePointer = null;
    let countRaf = null;
    let castStartTime = 0;

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function setIdleCounts() {
      const { speedBefore, usesBefore } = getCounts();
      if (speedEl) speedEl.textContent = String(Math.round(speedBefore));
      if (usesEl) usesEl.textContent = String(Math.round(usesBefore));
    }

    function stopCountRamp() {
      if (countRaf != null) {
        cancelAnimationFrame(countRaf);
        countRaf = null;
      }
    }

    function tickCounts(now) {
      const { speedBefore, speedAfter, usesBefore, usesAfter } = getCounts();
      const t = Math.min(1, Math.max(0, (now - castStartTime) / COUNT_RAMP_MS));
      if (speedEl) {
        speedEl.textContent = String(Math.round(lerp(speedBefore, speedAfter, t)));
      }
      if (usesEl) {
        usesEl.textContent = String(Math.round(lerp(usesBefore, usesAfter, t)));
      }
      if (cast && t < 1) {
        countRaf = requestAnimationFrame(tickCounts);
      } else {
        countRaf = null;
      }
    }

    function setCastState(next) {
      cast = next;
      layout.classList.toggle("is-cast", cast);
      panel?.classList.toggle("is-cast", cast);
      layout.dataset.figma = cast ? "1204:398" : "1204:308";
      if (castBtn) {
        castBtn.classList.toggle("is-cast", cast);
        castBtn.setAttribute("aria-pressed", cast ? "true" : "false");
      }

      stopCountRamp();
      if (cast) {
        castStartTime = performance.now();
        countRaf = requestAnimationFrame(tickCounts);
        flyers?.setBoost?.(FLYER_CAST_BOOST);
      } else {
        setIdleCounts();
        flyers?.setBoost?.(1);
      }
    }

    function resetVisual() {
      activePointer = null;
      setCastState(false);
    }

    function beginCast(e) {
      if (activePointer != null) return;
      activePointer = e.pointerId;
      castBtn?.classList.add("is-pressed");
      castBtn?.setPointerCapture?.(e.pointerId);
      setCastState(true);
    }

    function endCast(e) {
      if (activePointer == null || e.pointerId !== activePointer) return;
      activePointer = null;
      castBtn?.classList.remove("is-pressed");
      castBtn?.releasePointerCapture?.(e.pointerId);
      setCastState(false);
    }

    if (castBtn) {
      castBtn.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        beginCast(e);
      });
      castBtn.addEventListener("pointerup", endCast);
      castBtn.addEventListener("pointercancel", endCast);
      castBtn.addEventListener("lostpointercapture", () => {
        activePointer = null;
        castBtn.classList.remove("is-pressed");
        setCastState(false);
      });
      castBtn.addEventListener("click", (e) => {
        e.preventDefault();
      });
      castBtn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
      });
    }

    setIdleCounts();

    return {
      start() {
        if (!cast) resetVisual();
        else setIdleCounts();
      },
      stop() {
        resetVisual();
      },
      isCast: () => cast,
      refreshCounts() {
        setIdleCounts();
      },
    };
  };
})();
