/**
 * 绝对防御 · Figma 61:663 / 61:722
 * 仅长按触发施放；松开即回初始；倒计结束打断后光晕与数字缓慢恢复。
 */
(function () {
  "use strict";

  const LONG_PRESS_MS = 480;
  const CAST_DRAIN_MS = 4200;
  const GLOW_RAMP_MS = CAST_DRAIN_MS;
  const GLOW_FADE_MS = 3200;
  const COUNT_RECOVER_MS = 8500;

  function readCount(data, key, fallback) {
    if (data && data[key] != null) return Number(data[key]);
    return fallback;
  }

  function formatDuration(value) {
    const rounded = Math.round(value * 10) / 10;
    return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(1);
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  window.createSkillP3DefenseController = function createSkillP3DefenseController(
    layout,
    shield
  ) {
    if (!layout) {
      return { start() {}, stop() {} };
    }

    const panel = layout.closest(".skill-panel--page3");
    const castBtn = panel?.querySelector(".skill-p3-cast-btn");
    const vignette = panel?.querySelector(".skill-p3-cast-vignette");
    const shotsEl = layout.querySelector(".skill-p3-stat-num--shots [data-count]");
    const durationEl = layout.querySelector(
      ".skill-p3-stat-num--duration [data-count]"
    );

    function getCounts() {
      const data = window.SKILLS_DEFENSE || {};
      return {
        shotsIdle: readCount(
          data,
          shotsEl?.dataset.countIdle || "longest_rally_shots_before",
          18
        ),
        shotsCast: readCount(
          data,
          shotsEl?.dataset.countCast || "longest_rally_shots",
          25
        ),
        durationIdle: readCount(
          data,
          durationEl?.dataset.countIdle || "longest_rally_duration_before",
          36.6
        ),
        durationCast: readCount(
          data,
          durationEl?.dataset.countCast || "longest_rally_duration",
          68.7
        ),
      };
    }

    /** @type {'idle' | 'pressing' | 'active' | 'recovering'} */
    let castPhase = "idle";
    let activePointer = null;
    let drainRaf = null;
    let pressRaf = null;
    let glowFadeRaf = null;
    let recoverRaf = null;
    let castStartTime = 0;
    let pressStartTime = 0;
    let glowIntensity = 0;
    let shotsCastMax = 25;
    let durationCastMax = 68.7;
    let shotsRemaining = 0;
    let durationRemaining = 0;

    function setCastVisual(active) {
      layout.classList.toggle("is-cast", active);
      panel?.classList.toggle("is-cast", active);
      layout.dataset.figma = active ? "61:722" : "61:663";
      if (castBtn) {
        castBtn.classList.toggle("is-cast", active);
        castBtn.setAttribute("aria-pressed", active ? "true" : "false");
      }
    }

    function setGlow(intensity) {
      glowIntensity = Math.min(1, Math.max(0, intensity));
      if (vignette) vignette.style.opacity = String(glowIntensity);
    }

    function cancelGlowFade() {
      if (glowFadeRaf != null) {
        cancelAnimationFrame(glowFadeRaf);
        glowFadeRaf = null;
      }
      vignette?.classList.remove("is-fading");
    }

    function stopRecoverLoop() {
      if (recoverRaf != null) {
        cancelAnimationFrame(recoverRaf);
        recoverRaf = null;
      }
    }

    function fadeGlowOut() {
      cancelGlowFade();
      const from = glowIntensity;
      if (from <= 0.001) {
        setGlow(0);
        return;
      }
      const fadeStart = performance.now();
      vignette?.classList.add("is-fading");
      function tickFade(now) {
        const t = Math.min(1, (now - fadeStart) / GLOW_FADE_MS);
        const eased = easeOutCubic(t);
        setGlow(from * (1 - eased));
        if (t < 1) {
          glowFadeRaf = requestAnimationFrame(tickFade);
        } else {
          glowFadeRaf = null;
          vignette?.classList.remove("is-fading");
          setGlow(0);
        }
      }
      glowFadeRaf = requestAnimationFrame(tickFade);
    }

    function updateGlow(now) {
      if (glowFadeRaf != null || activePointer == null) return;
      if (castPhase !== "pressing" && castPhase !== "active") return;
      const t = Math.min(1, Math.max(0, (now - pressStartTime) / GLOW_RAMP_MS));
      setGlow(t);
    }

    function setIdleCounts() {
      const { shotsIdle, durationIdle } = getCounts();
      if (shotsEl) shotsEl.textContent = String(Math.round(shotsIdle));
      if (durationEl) durationEl.textContent = formatDuration(durationIdle);
    }

    function updateCastCounts() {
      if (shotsEl) shotsEl.textContent = String(Math.max(0, Math.round(shotsRemaining)));
      if (durationEl) {
        durationEl.textContent = formatDuration(Math.max(0, durationRemaining));
      }
    }

    function stopDrainLoop() {
      if (drainRaf != null) {
        cancelAnimationFrame(drainRaf);
        drainRaf = null;
      }
    }

    function stopPressLoop() {
      if (pressRaf != null) {
        cancelAnimationFrame(pressRaf);
        pressRaf = null;
      }
    }

    function startInterruptedRecovery() {
      const { shotsIdle, durationIdle } = getCounts();
      castPhase = "recovering";
      if (shotsEl) shotsEl.textContent = "0";
      if (durationEl) durationEl.textContent = "0";
      fadeGlowOut();

      const recoverStart = performance.now();
      function tickRecover(now) {
        const t = Math.min(1, (now - recoverStart) / COUNT_RECOVER_MS);
        const eased = easeOutCubic(t);
        if (shotsEl) {
          shotsEl.textContent = String(Math.round(shotsIdle * eased));
        }
        if (durationEl) {
          durationEl.textContent = formatDuration(durationIdle * eased);
        }
        if (t < 1) {
          recoverRaf = requestAnimationFrame(tickRecover);
        } else {
          recoverRaf = null;
          castPhase = "idle";
          setIdleCounts();
        }
      }
      stopRecoverLoop();
      recoverRaf = requestAnimationFrame(tickRecover);
    }

    function resetToIdle(instantGlow) {
      castPhase = "idle";
      activePointer = null;
      stopDrainLoop();
      stopPressLoop();
      stopRecoverLoop();
      if (instantGlow) {
        cancelGlowFade();
        setGlow(0);
      }
      shield?.setCastMode?.(false);
      shield?.setCastProgress?.(0);
      setCastVisual(false);
      setIdleCounts();
      castBtn?.classList.remove("is-pressed", "is-cast");
      castBtn?.setAttribute("aria-pressed", "false");
    }

    function interruptCastComplete() {
      if (castPhase !== "active") return;
      activePointer = null;
      stopDrainLoop();
      shield?.setCastMode?.(false);
      shield?.setCastProgress?.(0);
      setCastVisual(false);
      castBtn?.classList.remove("is-pressed", "is-cast");
      castBtn?.setAttribute("aria-pressed", "false");
      stopRecoverLoop();
      startInterruptedRecovery();
    }

    function tickDrain(now) {
      if (castPhase !== "active" || activePointer == null) return;
      updateGlow(now);
      const t = Math.min(1, Math.max(0, (now - castStartTime) / CAST_DRAIN_MS));

      if (t >= 1) {
        shotsRemaining = 0;
        durationRemaining = 0;
        updateCastCounts();
        interruptCastComplete();
        return;
      }

      const remain = 1 - t;
      shotsRemaining = Math.max(0, Math.ceil(shotsCastMax * remain - 1e-6));
      durationRemaining = durationCastMax * remain;
      updateCastCounts();
      drainRaf = requestAnimationFrame(tickDrain);
    }

    function activateCast() {
      if (castPhase !== "pressing" || activePointer == null) return;
      const { shotsCast, durationCast } = getCounts();
      castPhase = "active";
      shotsCastMax = shotsCast;
      durationCastMax = durationCast;
      shotsRemaining = shotsCast;
      durationRemaining = durationCast;
      setCastVisual(true);
      updateCastCounts();
      shield?.setCastMode?.(true);
      shield?.setCastProgress?.(1);
      castStartTime = performance.now();
      stopPressLoop();
      stopDrainLoop();
      drainRaf = requestAnimationFrame(tickDrain);
    }

    function tickPress(now) {
      if (castPhase !== "pressing" || activePointer == null) return;
      updateGlow(now);
      if (now - pressStartTime >= LONG_PRESS_MS) {
        activateCast();
        return;
      }
      pressRaf = requestAnimationFrame(tickPress);
    }

    function resetVisual() {
      resetToIdle(true);
    }

    function beginPress(e) {
      if (castPhase !== "idle" || activePointer != null) return;
      activePointer = e.pointerId;
      castPhase = "pressing";
      pressStartTime = performance.now();
      cancelGlowFade();
      stopRecoverLoop();
      setGlow(0);
      castBtn?.classList.add("is-pressed");
      castBtn?.setPointerCapture?.(e.pointerId);
      stopPressLoop();
      pressRaf = requestAnimationFrame(tickPress);
    }

    function endPress(e) {
      if (activePointer == null || e.pointerId !== activePointer) return;
      castBtn?.releasePointerCapture?.(e.pointerId);
      if (castPhase === "recovering") return;
      resetToIdle(true);
    }

    if (castBtn) {
      castBtn.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        beginPress(e);
      });
      castBtn.addEventListener("pointerup", endPress);
      castBtn.addEventListener("pointercancel", endPress);
      castBtn.addEventListener("lostpointercapture", () => {
        if (castPhase === "recovering") return;
        resetToIdle(true);
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
        if (castPhase === "idle") resetVisual();
      },
      stop() {
        resetVisual();
      },
      isCast: () => castPhase === "active",
      refreshCounts() {
        if (castPhase === "idle") setIdleCounts();
      },
    };
  };
})();
