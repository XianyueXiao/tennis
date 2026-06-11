/**
 * 教练碎碎念 · 第三页心率爱心轨迹
 */
(function () {
  "use strict";

  const DATA_URL = "data/coach-hr-series.json";
  const HEART_SPACING = 7;
  const HEART_SIZE = 10;
  const HEART_VIEW = 24;
  const BALL_SIZE = 26;
  const DURATION_MS = 3800;

  const PAD = { l: 20, r: 24, t: 22, b: 28 };

  let chartEl = null;
  let svgEl = null;
  let heartsGroup = null;
  let ballEl = null;
  let pathPoints = [];
  let heartNodes = [];
  let animFrame = null;
  let animStart = 0;
  let plotW = 0;
  let plotH = 0;

  function loadHrData() {
    if (window.COACH_HR_SERIES?.series?.length) {
      return Promise.resolve(window.COACH_HR_SERIES);
    }
    return fetch(DATA_URL).then((r) => {
      if (!r.ok) throw new Error("hr series load failed");
      return r.json();
    });
  }

  function heartPath() {
    return "M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z";
  }

  function buildPlotPoints(series, width, height) {
    if (!series.length) return [];

    const tMin = series[0].t;
    const tMax = series[series.length - 1].t;
    const bpmMin = Math.min(...series.map((p) => p.bpm)) - 4;
    const bpmMax = Math.max(...series.map((p) => p.bpm)) + 4;
    const tSpan = tMax - tMin || 1;
    const bpmSpan = bpmMax - bpmMin || 1;

    return series.map((p) => ({
      x: PAD.l + ((p.t - tMin) / tSpan) * (width - PAD.l - PAD.r),
      y: PAD.t + (1 - (p.bpm - bpmMin) / bpmSpan) * (height - PAD.t - PAD.b),
      bpm: p.bpm,
    }));
  }

  function densify(points, perEdge) {
    if (points.length < 2) return points.slice();
    const out = [points[0]];
    for (let i = 1; i < points.length; i += 1) {
      const a = points[i - 1];
      const b = points[i];
      for (let s = 1; s <= perEdge; s += 1) {
        const t = s / perEdge;
        out.push({
          x: a.x + (b.x - a.x) * t,
          y: a.y + (b.y - a.y) * t,
        });
      }
    }
    return out;
  }

  function sampleByDistance(points, spacing) {
    if (!points.length) return [];
    const out = [points[0]];
    let acc = 0;
    for (let i = 1; i < points.length; i += 1) {
      const dx = points[i].x - points[i - 1].x;
      const dy = points[i].y - points[i - 1].y;
      acc += Math.hypot(dx, dy);
      if (acc >= spacing) {
        out.push(points[i]);
        acc = 0;
      }
    }
    const last = points[points.length - 1];
    if (out[out.length - 1] !== last) out.push(last);
    return out;
  }

  function attachAngles(points) {
    return points.map((p, i) => {
      const a = points[Math.max(0, i - 1)];
      const b = points[Math.min(points.length - 1, i + 1)];
      const angle = (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
      return { ...p, angle };
    });
  }

  function buildPath(data) {
    const width = chartEl.clientWidth || 376;
    const height = chartEl.clientHeight || 300;
    plotW = width;
    plotH = height;

    svgEl.setAttribute("viewBox", `0 0 ${width} ${height}`);

    const coarse = buildPlotPoints(data.series, width, height);
    const dense = densify(coarse, 10);
    pathPoints = attachAngles(dense);
    const heartAnchors = attachAngles(sampleByDistance(dense, HEART_SPACING));

    heartsGroup.replaceChildren();
    heartNodes = heartAnchors.map((p) => {
      const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
      g.setAttribute("class", "coach-hr-heart");
      g.setAttribute("transform", `translate(${(p.x - HEART_SIZE / 2).toFixed(2)} ${(p.y - HEART_SIZE / 2).toFixed(2)})`);
      g.style.opacity = "0";

      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", heartPath());
      path.setAttribute("fill", "#ED7272");
      path.setAttribute("transform", `scale(${(HEART_SIZE / HEART_VIEW).toFixed(4)})`);
      g.appendChild(path);
      heartsGroup.appendChild(g);
      return g;
    });
  }

  function pointAtProgress(progress) {
    const idx = Math.min(
      pathPoints.length - 1,
      Math.max(0, Math.floor(progress * (pathPoints.length - 1)))
    );
    return pathPoints[idx];
  }

  function heartsAtProgress(progress) {
    const count = heartNodes.length;
    if (!count) return 0;
    return Math.min(count, Math.max(1, Math.ceil(progress * count)));
  }

  function placeBall(p) {
    const half = BALL_SIZE / 2;
    ballEl.style.transform = `translate(${(p.x - half).toFixed(2)}px, ${(p.y - half).toFixed(2)}px) rotate(${p.angle.toFixed(1)}deg)`;
  }

  function applyProgress(progress) {
    const p = Math.min(1, Math.max(0, progress));
    const visible = heartsAtProgress(p);
    heartNodes.forEach((node, i) => {
      node.style.opacity = i < visible ? "1" : "0";
    });
    placeBall(pointAtProgress(p));
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - (-2 * t + 2) ** 3 / 2;
  }

  function stopAnim() {
    if (animFrame) {
      cancelAnimationFrame(animFrame);
      animFrame = null;
    }
  }

  function reset() {
    stopAnim();
    if (!heartNodes.length) return;
    heartNodes.forEach((node) => {
      node.style.opacity = "0";
    });
    ballEl.style.opacity = "0";
    ballEl.style.transform = `translate(0px, 0px) rotate(0deg)`;
  }

  function showComplete() {
    stopAnim();
    if (!heartNodes.length) return;
    heartNodes.forEach((node) => {
      node.style.opacity = "1";
    });
    ballEl.style.opacity = "1";
    placeBall(pathPoints[pathPoints.length - 1]);
  }

  function play() {
    stopAnim();
    if (!pathPoints.length) return;

    heartNodes.forEach((node) => {
      node.style.opacity = "0";
    });
    ballEl.style.opacity = "1";
    placeBall(pathPoints[0]);
    animStart = 0;

    function tick(now) {
      if (!animStart) animStart = now;
      const raw = (now - animStart) / DURATION_MS;
      const t = easeInOutCubic(Math.min(1, raw));
      applyProgress(t);
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
    chartEl = document.getElementById("coachHrChart");
    if (!chartEl) return;

    svgEl = chartEl.querySelector(".coach-page3-chart__svg");
    heartsGroup = chartEl.querySelector("#coachHrHearts");
    ballEl = chartEl.querySelector(".coach-page3-chart__ball");
    if (!svgEl || !heartsGroup || !ballEl) return;

    loadHrData()
      .then((data) => {
        buildPath(data);
        reset();
      })
      .catch(() => {
        buildPath({
          series: [
            { t: 0, bpm: 95 },
            { t: 20, bpm: 130 },
            { t: 40, bpm: 145 },
            { t: 65, bpm: 102 },
          ],
        });
        reset();
      });
  }

  window.CoachHrChart = { init, play, reset, showComplete };

  document.addEventListener("DOMContentLoaded", init);
  window.addEventListener("resize", () => {
    if (!chartEl) return;
    loadHrData()
      .then((data) => {
        buildPath(data);
        reset();
      })
      .catch(() => {});
  });
})();
