/**
 * 无敌时间 · Figma 225:205
 * 远球飞来 → 击中拍面（球保持 + 白色圆闪）→ 光晕 + +1 → 远球缩回。
 */
(function () {
  "use strict";

  /** Figma 636:486 · 远球起始 */
  const FAR = { x: 104.75, y: 552.75, size: 33.307, rot: 105 };
  /** Figma 639:490 · 击打位置 */
  const HIT = { x: 214, y: 640.01, size: 107.949, rot: 45 };

  const OUT_MS = 560;
  const RETURN_MS = 520;
  const HIT_FX_MS = 920;
  const GAP_MS = 480;

  function easeInCubic(t) {
    return t * t * t;
  }

  function easeOutCubic(t) {
    const u = 1 - t;
    return 1 - u * u * u;
  }

  function quadPoint(t, a, b, c) {
    const u = 1 - t;
    return u * u * a + 2 * u * t * b + t * t * c;
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function centerOf(box) {
    return {
      x: box.x + box.size * 0.5,
      y: box.y + box.size * 0.5,
    };
  }

  window.createSkillP4HitController = function createSkillP4HitController(root) {
    if (!root) {
      return { start() {}, stop() {} };
    }

    const flyBall = root.querySelector("#skillP4FlyBall");
    const hitSpot = root.querySelector("#skillP4HitSpot");
    const flash = root.querySelector("#skillP4Flash");
    const lightWrap = root.querySelector("#skillP4Light");
    const plus = root.querySelector("#skillP4Plus");

    const farCenter = centerOf(FAR);
    const hitCenter = centerOf(HIT);
    const arcControl = {
      x: farCenter.x + (hitCenter.x - farCenter.x) * 0.38 - 28,
      y: farCenter.y + (hitCenter.y - farCenter.y) * 0.22 - 42,
    };

    let rafId = 0;
    let running = false;
    let cycleToken = 0;

    function applyFlyBall(box) {
      if (!flyBall) return;
      flyBall.style.left = `${box.x}px`;
      flyBall.style.top = `${box.y}px`;
      flyBall.style.width = `${box.size}px`;
      flyBall.style.height = `${box.size}px`;
      flyBall.style.transform = `rotate(${box.rot}deg)`;
      flyBall.style.opacity = "1";
      flyBall.style.filter = "";
    }

    function resetFlyBall() {
      applyFlyBall(FAR);
    }

    function pulseClass(el, className) {
      if (!el) return;
      el.classList.remove(className);
      void el.offsetWidth;
      el.classList.add(className);
    }

    function showHitFlash() {
      hitSpot?.classList.add("is-active");
      pulseClass(flash, "is-active");
    }

    function hideHitFlash() {
      hitSpot?.classList.remove("is-active");
      flash?.classList.remove("is-active");
    }

    function triggerHitFx() {
      showHitFlash();
      pulseClass(lightWrap, "is-pulsing");
      pulseClass(plus, "is-active");
    }

    function clearHitFx() {
      hideHitFlash();
      lightWrap?.classList.remove("is-pulsing");
      plus?.classList.remove("is-active");
    }

    function animateSegment(duration, easeFn, onFrame, onDone) {
      const start = performance.now();
      function frame(now) {
        if (!running) return;
        const raw = Math.min(1, (now - start) / duration);
        const eased = easeFn(raw);
        onFrame(eased, raw);
        if (raw < 1) {
          rafId = requestAnimationFrame(frame);
        } else if (onDone) {
          onDone();
        }
      }
      rafId = requestAnimationFrame(frame);
    }

    function waitMs(ms) {
      return new Promise((resolve) => {
        const token = cycleToken;
        setTimeout(() => {
          if (running && token === cycleToken) resolve();
        }, ms);
      });
    }

    async function runCycle() {
      const token = cycleToken;
      resetFlyBall();
      clearHitFx();

      await new Promise((resolve) => {
        animateSegment(
          OUT_MS,
          easeInCubic,
          (t) => {
            const cx = quadPoint(t, farCenter.x, arcControl.x, hitCenter.x);
            const cy = quadPoint(t, farCenter.y, arcControl.y, hitCenter.y);
            const size = lerp(FAR.size, HIT.size, easeInCubic(t));
            const rot = lerp(FAR.rot, HIT.rot, t);
            applyFlyBall({
              x: cx - size * 0.5,
              y: cy - size * 0.5,
              size,
              rot,
            });
          },
          resolve
        );
      });
      if (!running || token !== cycleToken) return;

      applyFlyBall(HIT);
      triggerHitFx();

      await waitMs(Math.max(HIT_FX_MS, 120));
      if (!running || token !== cycleToken) return;

      hideHitFlash();

      await new Promise((resolve) => {
        animateSegment(
          RETURN_MS,
          easeOutCubic,
          (t) => {
            const cx = quadPoint(t, hitCenter.x, arcControl.x, farCenter.x);
            const cy = quadPoint(t, hitCenter.y, arcControl.y, farCenter.y);
            const size = lerp(HIT.size, FAR.size, easeOutCubic(t));
            const rot = lerp(HIT.rot, FAR.rot, t);
            applyFlyBall({
              x: cx - size * 0.5,
              y: cy - size * 0.5,
              size,
              rot,
            });
          },
          resolve
        );
      });
      if (!running || token !== cycleToken) return;

      resetFlyBall();
      clearHitFx();
      await waitMs(GAP_MS);
      if (running && token === cycleToken) runCycle();
    }

    return {
      start() {
        if (running) return;
        running = true;
        cycleToken += 1;
        runCycle();
      },
      stop() {
        running = false;
        cycleToken += 1;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        resetFlyBall();
        clearHitFx();
      },
    };
  };
})();
