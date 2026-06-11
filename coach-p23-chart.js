/**
 * P23 · Figma 74:812/813 · 心率曲线描边 + 球沿路径运动
 */
(function () {
  "use strict";

  const PATH_D =
    "M10.0027 310L57.0027 191L79.5027 183.5L115.003 21.5002L134.003 75.0002L153.003 10.0002L164.503 34.5002L184.503 21.5002L203.503 34.5002L218.003 10.0002L248.503 65.5002L279.503 10.0002L288.503 34.5002L323.003 21.5002L339.503 34.5002L348.003 10.0002L355.003 42.0002L416.503 191";

  const VIEW_W = 426.505;
  const VIEW_H = 320.003;
  const CHART_LEFT = -26;
  const CHART_TOP = 560;
  const CHART_W = 406.5;
  const CHART_H = 300;
  const BLEED_X = 0.0246;
  const BLEED_Y = 0.0333;
  const DURATION_MS = 3400;
  const BALL_WRAP = 63.025;
  const BALL_ROT_END = 105;

  let chartWrap = null;
  let pathEl = null;
  let ballEl = null;
  let ballImg = null;
  let pathLen = 0;
  let animFrame = null;
  let animStart = 0;

  function bleedRect() {
    const w = CHART_W * (1 + BLEED_X * 2);
    const h = CHART_H * (1 + BLEED_Y * 2);
    return {
      left: CHART_LEFT - CHART_W * BLEED_X,
      top: CHART_TOP - CHART_H * BLEED_Y,
      w,
      h,
    };
  }

  function svgToPage(x, y) {
    const b = bleedRect();
    return {
      x: b.left + (x / VIEW_W) * b.w,
      y: b.top + (y / VIEW_H) * b.h,
    };
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  }

  function pathAngleAt(progress) {
    if (!pathEl || pathLen <= 0) return BALL_ROT_END;
    const dist = pathLen * progress;
    const a = pathEl.getPointAtLength(Math.max(0, dist - 0.75));
    const b = pathEl.getPointAtLength(Math.min(pathLen, dist + 0.75));
    if (Math.hypot(b.x - a.x, b.y - a.y) < 0.01) return BALL_ROT_END;
    return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI + 90;
  }

  function placeBall(progress) {
    if (!pathEl || !ballEl) return;
    const p = Math.min(1, Math.max(0, progress));
    const pt = pathEl.getPointAtLength(pathLen * p);
    const page = svgToPage(pt.x, pt.y);
    const half = BALL_WRAP / 2;
    ballEl.style.left = `${page.x - half}px`;
    ballEl.style.top = `${page.y - half}px`;
    if (ballImg) {
      const rot = p >= 0.98 ? BALL_ROT_END : pathAngleAt(p);
      ballImg.style.transform = `rotate(${rot}deg)`;
    }
  }

  function applyProgress(raw) {
    const t = easeInOutCubic(Math.min(1, Math.max(0, raw)));
    if (pathEl) {
      pathEl.style.strokeDashoffset = String(pathLen * (1 - t));
    }
    placeBall(t);
  }

  function stopAnim() {
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
  }

  function reset() {
    stopAnim();
    if (!pathEl || !ballEl) return;
    pathEl.style.strokeDasharray = String(pathLen);
    pathEl.style.strokeDashoffset = String(pathLen);
    ballEl.classList.remove("is-visible");
    placeBall(0);
    if (ballImg) ballImg.style.transform = `rotate(${BALL_ROT_END}deg)`;
  }

  function showComplete() {
    stopAnim();
    if (!pathEl || !ballEl) return;
    pathEl.style.strokeDashoffset = "0";
    ballEl.classList.add("is-visible");
    placeBall(1);
    if (ballImg) ballImg.style.transform = `rotate(${BALL_ROT_END}deg)`;
  }

  function play() {
    if (!pathEl || !ballEl || pathLen <= 0) return;
    stopAnim();
    ballEl.classList.add("is-visible");
    pathEl.style.strokeDasharray = String(pathLen);
    pathEl.style.strokeDashoffset = String(pathLen);
    placeBall(0);
    animStart = 0;

    function tick(now) {
      if (!animStart) animStart = now;
      const raw = (now - animStart) / DURATION_MS;
      applyProgress(raw);
      if (raw < 1) {
        animFrame = requestAnimationFrame(tick);
      } else {
        showComplete();
        animFrame = null;
      }
    }

    animFrame = requestAnimationFrame(tick);
  }

  function init() {
    chartWrap = document.querySelector(".coach-panel--page3 .coach-p23-chart-wrap");
    pathEl = document.querySelector(".coach-panel--page3 .coach-p23-chart__path");
    ballEl = document.querySelector(".coach-panel--page3 .coach-p23-ball");
    ballImg = ballEl?.querySelector(".coach-p23-ball__img");
    if (!pathEl || !ballEl) return;

    pathLen = pathEl.getTotalLength();
    reset();
  }

  window.CoachP23Chart = { init, play, reset, showComplete };

  document.addEventListener("DOMContentLoaded", init);
})();
