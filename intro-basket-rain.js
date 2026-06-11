/**
 * 导航 3 · 降雨隐喻 · 导航 4 · 降雨统计图
 */
(function () {
  "use strict";

  const BALL_RADIUS_M = 0.033;
  const BALL_VOLUME_M3 = (4 / 3) * Math.PI * BALL_RADIUS_M ** 3;
  const RAIN_OPACITY = 0.38;
  const RAIN_LEN = 140;
  const RAIN_WIDTH = 1;
  const RAIN_SPEED = 1380;
  const RAIN_SPEED_JITTER = 0.32;
  const RAIN_SKEW = -0.04;
  const RAIN_GRID_STEP = 52;
  const RAIN_DENSITY = 0.24;
  const RAIN_PAGE_INDEX = 2;
  const RAIN_CHART_PAGE_INDEX = 3;
  const TYPE_CHAR_MS = 46;
  const TITLE_SLIDE_MS = 560;
  const TITLE_STAGGER_MS = 160;
  const STATS_START_PAUSE_MS = 200;
  const FORMULA_START_PAUSE_MS = 160;
  const CHART_FILL_TOP = "#4FA2D6";
  const CHART_FILL_BOTTOM = "rgba(0, 115, 209, 0)";
  const CHART_DRAW_MS = 1400;
  const CHART_STROKE_COLOR = "#ADDAFF";
  const CHART_STROKE_WIDTH = 20;
  const CHART_MARKER_COUNT = 5;
  const CHART_MARKER_R = 10;
  const CHART_MARKER_FILL = "#54B2FF";
  const CHART_MARKER_STROKE = "#ffffff";
  const CHART_MARKER_STROKE_W = 4;
  const CHART_MARKER_HIT_R = 22;
  const CHART_CARD_GAP = 16;
  /** Figma 83:969 · graph 477.5×507 · Line 矢量路径 */
  const FIGMA_GRAPH_W = 477.5;
  const FIGMA_GRAPH_H = 507;
  const FIGMA_GRAPH_X0 = -6.5;
  const FIGMA_LINE_SEGMENTS = [
    { p0: [-6.5, 291], p1: [15.5, 288.5], p2: [71.6089, 258.1], p3: [89.5112, 226.5] },
    { p0: [89.5112, 226.5], p1: [111.889, 187], p2: [137.154, 13], p3: [233.884, 13] },
    { p0: [233.884, 13], p1: [330.614, 13], p2: [308.236, 245], p3: [368.873, 245] },
    { p0: [368.873, 245], p1: [429.509, 245], p2: [386.886, 509], p3: [471, 509] },
  ];
  /** Figma 83:972 交互点位 · 圆心坐标（左→右） */
  const DEFAULT_CHART_MARKERS = [
    { fx: 89, fy: 229, timeRatio: 0, tagline: "训练才刚开始", card_phase: "热身" },
    { fx: 129, fy: 114, timeRatio: 0.25, tagline: "毛毛雨级别的热身", card_phase: "截击" },
    { fx: 232, fy: 12, timeRatio: 0.5, tagline: "雨势逐渐加码", card_phase: "高压" },
    { fx: 312, fy: 116, timeRatio: 0.75, tagline: "草坪开始解渴", card_phase: "综合" },
    { fx: 365, fy: 243, timeRatio: 1, tagline: "勉强可以浇花", card_phase: "冷却" },
  ];
  const CHART_PHASE_SHORT = {
    热身: "热身",
    截击练习: "截击",
    高压球: "高压",
    综合应用: "综合",
    冷却: "冷却",
  };

  function computeRainMeta(hits, minutes, courtAreaM2) {
    const totalVolumeM3 = hits * BALL_VOLUME_M3;
    const depthMm = (totalVolumeM3 / courtAreaM2) * 1000;
    const hours = Math.max(minutes / 60, 1 / 60);
    const rateMmH = depthMm / hours;
    const formulaLines = [
      `按单球体积 4/3πr³（r=${(BALL_RADIUS_M * 100).toFixed(1)}cm）`,
      `折算积水约 ${depthMm.toFixed(2)}mm`,
      `雨强 ${depthMm.toFixed(2)}mm ÷ ${hours.toFixed(2)}h ≈ ${rateMmH.toFixed(1)} mm/h`,
    ];
    return {
      hits,
      minutes,
      courtArea: courtAreaM2.toFixed(1),
      formulaLines,
      depthMm,
      rateMmH,
    };
  }

  function hitsPerMinAt(minute, phases) {
    for (let i = 0; i < phases.length; i += 1) {
      const phase = phases[i];
      if (minute >= phase.start_min && minute < phase.end_min) {
        const dur = phase.end_min - phase.start_min || 1;
        return phase.hits / dur;
      }
    }
    return 0;
  }

  function hitsAtMinute(minute, phases) {
    let hits = 0;
    for (let i = 0; i < phases.length; i += 1) {
      const phase = phases[i];
      if (minute <= phase.start_min) break;
      if (minute >= phase.end_min) {
        hits += phase.hits;
      } else {
        const dur = phase.end_min - phase.start_min || 1;
        hits += phase.hits * ((minute - phase.start_min) / dur);
      }
    }
    return hits;
  }

  function phaseAtMinute(minute, phases) {
    for (let i = 0; i < phases.length; i += 1) {
      const phase = phases[i];
      if (minute >= phase.start_min && minute < phase.end_min) return phase;
    }
    return phases[phases.length - 1] || { name: "" };
  }

  function cumulativeDepthAt(minute, phases, courtAreaM2) {
    const hits = hitsAtMinute(minute, phases);
    return (hits * BALL_VOLUME_M3 / courtAreaM2) * 1000;
  }

  /** 时段降雨强度 mm/h（随训练强度起伏，非累计） */
  function buildIntensityRainSeries(dataset) {
    const phases = dataset?.phases || [];
    const durationMin = dataset?.duration_min || 66;
    const courtArea = dataset?.court_area_m2 || 261.4;
    const mmPerHit = (BALL_VOLUME_M3 / courtArea) * 1000;
    const stepMin = 3;
    const wobble = dataset?.intensity_wobble || [];
    const raw = [];

    for (let t = 0; t <= durationMin; t += stepMin) {
      const baseHpm = hitsPerMinAt(t, phases);
      let mmH = baseHpm * mmPerHit * 60;
      const w = wobble.find((entry) => entry.t === t);
      if (w) mmH *= w.factor;
      else if (baseHpm > 0) {
        mmH *= 1 + 0.04 * Math.sin(t * 0.28) + 0.025 * Math.sin(t * 0.55 + 0.5);
      }
      raw.push({ t, mm: Math.max(0, mmH) });
    }

    const once = smoothRainSeries(raw, 4);
    const twice = smoothRainSeries(once, 3);
    const thrice = smoothRainSeries(twice, 2);
    return thrice;
  }

  function smoothRainSeries(points, windowRadius) {
    return points.map((point, index) => {
      let sum = 0;
      let count = 0;
      for (let offset = -windowRadius; offset <= windowRadius; offset += 1) {
        const sample = points[index + offset];
        if (!sample) continue;
        sum += sample.mm;
        count += 1;
      }
      return { t: point.t, mm: sum / count };
    });
  }

  function downsampleRainSeries(points, stride) {
    if (stride <= 1 || points.length <= 2) return points;
    const out = points.filter((_, index) => index % stride === 0);
    const last = points[points.length - 1];
    if (out[out.length - 1] !== last) out.push(last);
    return out;
  }

  function cubicPoint(p0, p1, p2, p3, t) {
    const u = 1 - t;
    return {
      x: u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
      y: u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
    };
  }

  function sampleFigmaLinePath(stepsPerSegment) {
    const steps = stepsPerSegment || 28;
    const out = [];
    FIGMA_LINE_SEGMENTS.forEach((seg) => {
      for (let i = 0; i < steps; i += 1) {
        if (out.length && i === 0) continue;
        out.push(cubicPoint(seg.p0, seg.p1, seg.p2, seg.p3, i / steps));
      }
    });
    const last = FIGMA_LINE_SEGMENTS[FIGMA_LINE_SEGMENTS.length - 1];
    out.push({ x: last.p3[0], y: last.p3[1] });
    return out;
  }

  function figmaToCanvas(fx, fy, w, h) {
    return {
      x: ((fx - FIGMA_GRAPH_X0) / FIGMA_GRAPH_W) * w,
      y: (fy / FIGMA_GRAPH_H) * h,
    };
  }

  function buildFigmaCanvasCurve(w, h) {
    return sampleFigmaLinePath().map((pt) => figmaToCanvas(pt.x, pt.y, w, h));
  }

  function sliceCurveByRevealX(curve, revealX) {
    if (!curve.length || revealX <= curve[0].x) return curve.length ? [curve[0]] : [];
    const out = [];
    for (let i = 0; i < curve.length; i += 1) {
      const pt = curve[i];
      if (pt.x <= revealX) {
        out.push(pt);
        continue;
      }
      const prev = curve[i - 1];
      if (prev && pt.x > prev.x) {
        const ratio = (revealX - prev.x) / (pt.x - prev.x);
        out.push({
          x: revealX,
          y: prev.y + (pt.y - prev.y) * ratio,
        });
      }
      break;
    }
    return out.length >= 2 ? out : out;
  }

  function buildChartMarkers(phases, courtAreaM2, durationMin, anchors) {
    const copySource = anchors?.length ? anchors : DEFAULT_CHART_MARKERS;
    const tMax = durationMin || 66;
    return copySource.slice(0, CHART_MARKER_COUNT).map((meta, index) => {
      const ratio = meta.timeRatio ?? index / Math.max(1, CHART_MARKER_COUNT - 1);
      const t = tMax * ratio;
      const phase = phaseAtMinute(t, phases);
      const cardPhase = meta.card_phase || CHART_PHASE_SHORT[phase.name] || phase.name || "";
      return {
        index,
        fx: meta.fx ?? DEFAULT_CHART_MARKERS[index]?.fx ?? 0,
        fy: meta.fy ?? DEFAULT_CHART_MARKERS[index]?.fy ?? 0,
        t,
        hpm: hitsPerMinAt(t, phases),
        depthMm: cumulativeDepthAt(t, phases, courtAreaM2),
        tagline: meta.tagline || rainTaglineForDepth(0),
        phaseName: phase.name || "",
        cardPhase,
      };
    });
  }

  function markerCardText(marker) {
    const label = marker.cardPhase || CHART_PHASE_SHORT[marker.phaseName] || marker.phaseName || "";
    const hpm = Math.round(marker.hpm);
    return label ? `${label} ${hpm}拍/分钟` : `${hpm}拍/分钟`;
  }

  function easeOutCubic(t) {
    return 1 - (1 - t) ** 3;
  }

  function rainTaglineForDepth(depthMm) {
    if (depthMm < 1.5) return "勉强可以浇花";
    if (depthMm < 5) return "够润一润草地";
    if (depthMm < 15) return "小题大做的一场雨";
    return "局部暴雨预警";
  }

  function createRainChart(canvas, hostEl, options = {}) {
    const ctx = canvas.getContext("2d");
    const tipEl = hostEl.querySelector("[data-rain-chart-tip]");
    const cardEl = hostEl.querySelector("[data-rain-p4-card]");
    const graphEl = hostEl.querySelector(".rain-p4-graph");
    const layoutEl = hostEl.querySelector(".rain-p4-layout");
    const onMarkerActive = options.onMarkerActive;
    const onMarkerClear = options.onMarkerClear;
    const hitsEl = document.createElement("div");
    hitsEl.className = "rain-p4-graph__hits";
    hitsEl.setAttribute("data-rain-chart-hits", "");
    if (graphEl) graphEl.appendChild(hitsEl);
    const hitButtons = [];
    let points = [];
    let phases = [];
    let courtAreaM2 = 261.4;
    let durationMin = 66;
    let markerAnchors = DEFAULT_CHART_MARKERS;
    let markers = [];
    let activeMarker = -1;
    let drawProgress = 1;
    let animFrame = 0;
    let animStart = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;
    let figmaCurve = [];

    function resize() {
      dpr = window.devicePixelRatio || 1;
      w = Math.max(1, graphEl?.offsetWidth || hostEl.offsetWidth || 1);
      h = Math.max(1, graphEl?.offsetHeight || hostEl.offsetHeight || 1);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      figmaCurve = buildFigmaCanvasCurve(w, h);
    }

    function toMarkerXY(marker) {
      return figmaToCanvas(marker.fx, marker.fy, w, h);
    }

    function markerIsVisible(marker, revealX) {
      return toMarkerXY(marker).x <= revealX + 1.5;
    }

    function rebuildMarkers() {
      markers = buildChartMarkers(phases, courtAreaM2, durationMin, markerAnchors);
      ensureHitButtons();
    }

    function ensureHitButtons() {
      if (!hitsEl) return;
      while (hitButtons.length < markers.length) {
        const index = hitButtons.length;
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "rain-p4-graph__hit";
        btn.setAttribute("aria-label", `降雨数据点 ${index + 1}`);
        btn.addEventListener("click", (evt) => {
          evt.stopPropagation();
          if (drawProgress < 1) return;
          showTooltip(index);
          drawFrame(drawProgress);
        });
        btn.addEventListener(
          "touchend",
          (evt) => {
            evt.stopPropagation();
          },
          { passive: true }
        );
        hitsEl.appendChild(btn);
        hitButtons.push(btn);
      }
    }

    function syncHitTargets(revealX) {
      if (!hitsEl || !w || !h) return;
      hitButtons.forEach((btn, index) => {
        const marker = markers[index];
        if (!marker || !markerIsVisible(marker, revealX)) {
          btn.hidden = true;
          return;
        }
        const coord = toMarkerXY(marker);
        btn.hidden = false;
        btn.style.left = `${(coord.x / w) * 100}%`;
        btn.style.top = `${(coord.y / h) * 100}%`;
      });
    }

    function pointerToPlot(clientX, clientY) {
      const rect = canvas.getBoundingClientRect();
      if (!rect.width || !rect.height) return null;
      return {
        x: ((clientX - rect.left) / rect.width) * w,
        y: ((clientY - rect.top) / rect.height) * h,
      };
    }

    function hideTooltip(clearHeadline = true) {
      activeMarker = -1;
      if (cardEl) cardEl.hidden = true;
      if (clearHeadline) onMarkerClear?.();
    }

    function positionCardAtCoord(coord) {
      if (!cardEl || !graphEl || !layoutEl) return;
      cardEl.hidden = false;
      void cardEl.offsetWidth;
      const cardW = cardEl.offsetWidth || 122;
      const cardH = cardEl.offsetHeight || 71;
      const halfW = cardW / 2;
      const layoutW = layoutEl.offsetWidth || 440;
      const centerX = Math.min(
        layoutW - halfW - 8,
        Math.max(halfW + 8, graphEl.offsetLeft + coord.x)
      );
      const topY = Math.max(
        200,
        graphEl.offsetTop + coord.y - cardH - CHART_CARD_GAP
      );
      cardEl.style.left = `${centerX}px`;
      cardEl.style.top = `${topY}px`;
    }

    function showTooltip(index) {
      if (index < 0 || !markers[index]) return;
      const marker = markers[index];
      const coord = toMarkerXY(marker);
      activeMarker = index;
      if (tipEl) tipEl.textContent = markerCardText(marker);
      positionCardAtCoord(coord);
      onMarkerActive?.(marker);
    }



    function pickMarker(clientX, clientY) {
      const plotPoint = pointerToPlot(clientX, clientY);
      if (!plotPoint) return -1;
      const revealX = w * easeOutCubic(Math.min(1, drawProgress));
      let best = -1;
      let bestDist = CHART_MARKER_HIT_R;
      markers.forEach((marker, index) => {
        if (!markerIsVisible(marker, revealX)) return;
        const coord = toMarkerXY(marker);
        const dist = Math.hypot(coord.x - plotPoint.x, coord.y - plotPoint.y);
        if (dist < bestDist) {
          bestDist = dist;
          best = index;
        }
      });
      return best;
    }

    function onCanvasPointer(evt) {
      if (drawProgress < 1) return;
      const index = pickMarker(evt.clientX, evt.clientY);
      if (index < 0) {
        hideTooltip();
      } else {
        showTooltip(index);
      }
      drawFrame(drawProgress);
    }

    canvas.addEventListener("click", onCanvasPointer);
    canvas.addEventListener(
      "touchend",
      (evt) => {
        const touch = evt.changedTouches[0];
        if (!touch) return;
        evt.preventDefault();
        onCanvasPointer(touch);
      },
      { passive: false }
    );

    function drawMarkers(revealX) {
      markers.forEach((marker, index) => {
        if (!markerIsVisible(marker, revealX)) return;
        const coord = toMarkerXY(marker);
        const isActive = index === activeMarker;
        ctx.beginPath();
        ctx.arc(coord.x, coord.y, isActive ? CHART_MARKER_R + 2 : CHART_MARKER_R, 0, Math.PI * 2);
        ctx.fillStyle = CHART_MARKER_FILL;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(coord.x, coord.y, isActive ? CHART_MARKER_R + 2 : CHART_MARKER_R, 0, Math.PI * 2);
        ctx.strokeStyle = CHART_MARKER_STROKE;
        ctx.lineWidth = CHART_MARKER_STROKE_W;
        ctx.stroke();
        if (isActive) {
          positionCardAtCoord(coord);
        }
      });
    }

    function drawFrame(progress) {
      drawProgress = progress;
      ctx.clearRect(0, 0, w, h);

      const axisP = easeOutCubic(Math.min(1, progress));
      const revealX = w * axisP;
      const baseY = h;
      const visible = sliceCurveByRevealX(figmaCurve, revealX);

      if (visible.length < 2 || axisP <= 0.02) return;

      const fillGrad = ctx.createLinearGradient(0, 0, 0, baseY);
      fillGrad.addColorStop(0, CHART_FILL_TOP);
      fillGrad.addColorStop(1, CHART_FILL_BOTTOM);

      ctx.beginPath();
      ctx.moveTo(visible[0].x, baseY);
      ctx.lineTo(visible[0].x, visible[0].y);
      for (let i = 1; i < visible.length; i += 1) {
        ctx.lineTo(visible[i].x, visible[i].y);
      }
      ctx.lineTo(visible[visible.length - 1].x, baseY);
      ctx.closePath();
      ctx.fillStyle = fillGrad;
      ctx.fill();

      ctx.beginPath();
      ctx.moveTo(visible[0].x, visible[0].y);
      for (let i = 1; i < visible.length; i += 1) {
        ctx.lineTo(visible[i].x, visible[i].y);
      }
      ctx.strokeStyle = CHART_STROKE_COLOR;
      ctx.lineWidth = CHART_STROKE_WIDTH;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.stroke();

      drawMarkers(revealX);
      syncHitTargets(revealX);
    }

    function tick(ts) {
      if (!animStart) animStart = ts;
      const p = Math.min(1, (ts - animStart) / CHART_DRAW_MS);
      drawFrame(p);
      if (p < 1) {
        animFrame = requestAnimationFrame(tick);
      }
    }

    return {
      setData(seriesPoints, dataset) {
        points = seriesPoints.slice();
        phases = dataset?.phases || [];
        courtAreaM2 = dataset?.court_area_m2 || 261.4;
        durationMin = dataset?.duration_min || points[points.length - 1]?.t || 66;
        markerAnchors = dataset?.chart_markers?.length
          ? dataset.chart_markers
          : DEFAULT_CHART_MARKERS;
        rebuildMarkers();
      },
      show() {
        resize();
        rebuildMarkers();
        if (markers.length > 0) {
          showTooltip(0);
        } else {
          hideTooltip(false);
        }
        animStart = 0;
        if (animFrame) cancelAnimationFrame(animFrame);
        animFrame = requestAnimationFrame(tick);
      },
      hide() {
        if (animFrame) cancelAnimationFrame(animFrame);
        animFrame = 0;
        animStart = 0;
        hideTooltip(true);
        hitButtons.forEach((btn) => {
          btn.hidden = true;
        });
        ctx.clearRect(0, 0, w, h);
      },
      resize() {
        resize();
        rebuildMarkers();
        if (figmaCurve.length) {
          drawFrame(drawProgress);
          if (activeMarker >= 0) showTooltip(activeMarker);
        }
      },
    };
  }

  function createRainRenderer(canvas, hostEl) {
    const ctx = canvas.getContext("2d");
    const drops = [];
    let running = false;
    let rafId = 0;
    let lastTs = 0;
    let w = 0;
    let h = 0;
    let dpr = 1;

    function resize() {
      const rect = hostEl.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      w = Math.max(1, rect.width);
      h = Math.max(1, rect.height);
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (running) fillScreen();
    }

    function seedDrop(y) {
      const jitter = 1 - RAIN_SPEED_JITTER / 2 + Math.random() * RAIN_SPEED_JITTER;
      return {
        x: Math.random() * w,
        y,
        len: RAIN_LEN,
        speed: RAIN_SPEED * jitter,
      };
    }

    function fillScreen() {
      drops.length = 0;
      const count = Math.ceil((w / RAIN_GRID_STEP) * (h / RAIN_GRID_STEP) * RAIN_DENSITY);
      for (let i = 0; i < count; i += 1) {
        drops.push(seedDrop(Math.random() * h));
      }
    }

    function draw(dt) {
      ctx.clearRect(0, 0, w, h);
      ctx.strokeStyle = `rgba(255, 255, 255, ${RAIN_OPACITY})`;
      ctx.lineWidth = RAIN_WIDTH;
      ctx.lineCap = "butt";
      for (let i = drops.length - 1; i >= 0; i -= 1) {
        const d = drops[i];
        d.y += d.speed * dt;
        d.x += RAIN_SKEW * d.speed * dt;
        const x1 = d.x;
        const y1 = d.y;
        const x2 = d.x + RAIN_SKEW * d.len;
        const y2 = d.y + d.len;
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        if (y1 > h + RAIN_LEN) {
          drops[i] = seedDrop(-RAIN_LEN * (1 + Math.random() * 2));
        }
      }
    }

    function loop(ts) {
      if (!running) return;
      if (!lastTs) lastTs = ts;
      const dt = Math.min(0.032, (ts - lastTs) / 1000);
      lastTs = ts;
      draw(dt);
      rafId = requestAnimationFrame(loop);
    }

    return {
      start() {
        if (running) return;
        resize();
        fillScreen();
        running = true;
        lastTs = 0;
        rafId = requestAnimationFrame(loop);
      },
      stop() {
        running = false;
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
        ctx.clearRect(0, 0, w, h);
        drops.length = 0;
      },
      resize,
      isRunning() {
        return running;
      },
    };
  }

  window.initIntroBasketRain = function (basketPageEl, rainPageEl, rainChartPageEl, sim) {
    if (!basketPageEl || !rainPageEl || !sim) return null;

    const rainLayer = rainPageEl.querySelector(".page-basket__rain-layer");
    const rainCanvas = rainPageEl.querySelector(".page-basket__rain-canvas");
    const chartWrap = rainChartPageEl?.querySelector("[data-rain-chart]");
    const chartCanvas = rainChartPageEl?.querySelector(".page-basket__rain-chart-canvas");
    const rainDepthEl = chartWrap?.querySelector("[data-rain-depth]");
    const rainTaglineEl = chartWrap?.querySelector("[data-rain-tagline]");
    const ctaBtn = rainPageEl.querySelector("[data-rain-cta]");
    const statEl = basketPageEl.querySelector(".page-basket__stat");
    const headlineEl = rainPageEl.querySelector(".page-basket__rain-headline");
    const line1El = rainPageEl.querySelector(".page-basket__rain-line1");
    const levelEl = rainPageEl.querySelector(".page-basket__rain-level");
    const statsEl = rainPageEl.querySelector("[data-rain-stats]");
    const courtAreaEl = rainPageEl.querySelector("[data-rain-court-area]");
    const minutesEl = rainPageEl.querySelector("[data-rain-minutes]");
    const hitsEl = rainPageEl.querySelector("[data-rain-hits]");
    const formulaBlockEl = rainPageEl.querySelector("[data-rain-formula-block]");
    const formulaLineEls = Array.from(
      rainPageEl.querySelectorAll("[data-rain-formula-line]")
    );
    const LINE1_TEXT = line1El?.textContent?.trim() || "相当于在局部地区下了一场";
    const LEVEL_TEXT = levelEl?.textContent?.trim() || "毛毛雨";
    const rainHost =
      document.querySelector(".scroll-container") || document.body;

    if (!rainCanvas || !rainLayer) return null;

    if (rainLayer.parentElement !== rainHost) {
      rainHost.appendChild(rainLayer);
    }
    if (chartWrap && chartWrap.parentElement !== rainHost) {
      rainHost.appendChild(chartWrap);
    }
    if (headlineEl && headlineEl.parentElement !== rainHost) {
      rainHost.appendChild(headlineEl);
    }

    const rain = createRainRenderer(rainCanvas, rainHost);
    function updateRainP4HeadlineFromMarker(marker) {
      if (rainDepthEl) rainDepthEl.textContent = `${marker.depthMm.toFixed(2)}mm`;
      if (rainTaglineEl) rainTaglineEl.textContent = marker.tagline;
    }

    function resetRainP4Headline() {
      const meta = readMeta();
      if (rainDepthEl) rainDepthEl.textContent = `${meta.depthMm.toFixed(2)}mm`;
      if (rainTaglineEl) rainTaglineEl.textContent = rainTaglineForDepth(meta.depthMm);
    }

    const chart = chartCanvas && chartWrap
      ? createRainChart(chartCanvas, chartWrap, {
          onMarkerActive: updateRainP4HeadlineFromMarker,
          onMarkerClear: resetRainP4Headline,
        })
      : null;
    let sequenceStarted = false;
    let chartVisible = false;
    let typewriterTimers = [];
    let typewriterSession = 0;

    function scheduleTypewriter(fn, ms) {
      const id = setTimeout(fn, ms);
      typewriterTimers.push(id);
      return id;
    }

    function clearFormulaLines() {
      formulaLineEls.forEach((el) => {
        el.textContent = "";
        el.classList.remove("page-basket__rain-typewriter-active");
      });
    }

    function populateStats(meta) {
      if (courtAreaEl) courtAreaEl.textContent = meta.courtArea;
      if (minutesEl) minutesEl.textContent = String(meta.minutes);
      if (hitsEl) hitsEl.textContent = String(meta.hits);
    }

    function fillFormulaLines(lines) {
      formulaLineEls.forEach((el, index) => {
        el.textContent = lines[index] || "";
      });
    }

    function stopFormulaTypewriter() {
      typewriterSession += 1;
      typewriterTimers.forEach(clearTimeout);
      typewriterTimers = [];
      clearFormulaLines();
      headlineEl?.classList.remove("page-basket__rain-headline--typing");
    }

    function ensureTitleVisible() {
      if (line1El) line1El.textContent = LINE1_TEXT;
      if (levelEl) levelEl.textContent = LEVEL_TEXT;
      headlineEl?.classList.add("page-basket__rain-headline--title-in");
    }

    function clearTypewriter() {
      typewriterSession += 1;
      typewriterTimers.forEach(clearTimeout);
      typewriterTimers = [];
      rainLayer?.classList.remove("page-basket__rain-layer--headline-done");
      headlineEl?.classList.remove(
        "page-basket__rain-headline--typing",
        "page-basket__rain-headline--title-in",
        "page-basket__rain-headline--stats-in"
      );
      statsEl?.setAttribute("aria-hidden", "true");
      formulaBlockEl?.setAttribute("aria-hidden", "true");
      clearFormulaLines();
      if (line1El) line1El.textContent = LINE1_TEXT;
      if (levelEl) levelEl.textContent = LEVEL_TEXT;
    }

    function setActiveTypewriter(el) {
      formulaLineEls.forEach((lineEl) => {
        lineEl.classList.toggle("page-basket__rain-typewriter-active", lineEl === el);
      });
    }

    function runTypewriter(session, el, text, onComplete) {
      if (!el) {
        onComplete?.();
        return;
      }
      setActiveTypewriter(el);
      el.textContent = "";
      let index = 0;

      function step() {
        if (session !== typewriterSession) return;
        if (index >= text.length) {
          onComplete?.();
          return;
        }
        el.textContent += text.charAt(index);
        index += 1;
        scheduleTypewriter(step, TYPE_CHAR_MS);
      }

      step();
    }

    function runFormulaLinesTypewriter(session, lines, index, onComplete) {
      if (index >= lines.length) {
        onComplete?.();
        return;
      }
      runTypewriter(session, formulaLineEls[index], lines[index], () => {
        runFormulaLinesTypewriter(session, lines, index + 1, onComplete);
      });
    }

    function startHeadlineReveal() {
      clearTypewriter();
      const session = typewriterSession;
      const meta = readMeta();
      if (line1El) line1El.textContent = LINE1_TEXT;
      if (levelEl) levelEl.textContent = LEVEL_TEXT;
      populateStats(meta);
      clearFormulaLines();

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          headlineEl?.classList.add("page-basket__rain-headline--title-in");
        });
      });

      scheduleTypewriter(() => {
        if (session !== typewriterSession) return;
        statsEl?.setAttribute("aria-hidden", "false");
        headlineEl?.classList.add("page-basket__rain-headline--stats-in");
      }, TITLE_SLIDE_MS + TITLE_STAGGER_MS + STATS_START_PAUSE_MS);

      scheduleTypewriter(() => {
        if (session !== typewriterSession) return;
        formulaBlockEl?.setAttribute("aria-hidden", "false");
        headlineEl?.classList.add("page-basket__rain-headline--typing");
        runFormulaLinesTypewriter(session, meta.formulaLines, 0, () => {
          if (session !== typewriterSession) return;
          setActiveTypewriter(null);
          headlineEl?.classList.remove("page-basket__rain-headline--typing");
          rainLayer?.classList.add("page-basket__rain-layer--headline-done");
        });
      }, TITLE_SLIDE_MS + TITLE_STAGGER_MS + STATS_START_PAUSE_MS + FORMULA_START_PAUSE_MS);
    }

    const intensityData = window.RAIN_INTENSITY_SERIES || {
      duration_min: 66,
      court_area_m2: 261.4,
      phases: [],
    };
    if (chart) {
      chart.setData(buildIntensityRainSeries(intensityData), intensityData);
    }

    function readMeta() {
      const hits = Math.max(0, parseInt(rainPageEl.dataset.hitCount, 10) || 0);
      const minutes = Math.max(1, parseInt(rainPageEl.dataset.trainingMinutes, 10) || 66);
      const courtArea = Math.max(1, parseFloat(rainPageEl.dataset.courtAreaM2) || 261.4);
      const numberEl = basketPageEl.querySelector(".page-basket__number[data-count]");
      const hitsFromDom = numberEl
        ? parseInt(numberEl.dataset.count, 10) || hits
        : hits;
      return computeRainMeta(hitsFromDom, minutes, courtArea);
    }

    function hideChart() {
      chartVisible = false;
      chart?.hide();
      chartWrap?.classList.remove("is-visible");
      chartWrap?.setAttribute("aria-hidden", "true");
      rainLayer?.classList.remove("page-basket__rain-layer--chart-open");
      headlineEl?.classList.remove("page-basket__rain-headline--chart-open");
      ctaBtn?.classList.remove("is-active");
    }

    function showChart() {
      if (!chart || !chartWrap) return;
      stopFormulaTypewriter();
      ensureTitleVisible();
      headlineEl?.classList.remove("page-basket__rain-headline--stats-in");
      statsEl?.setAttribute("aria-hidden", "true");
      formulaBlockEl?.setAttribute("aria-hidden", "true");
      resetRainP4Headline();
      chartVisible = true;
      rainLayer?.classList.add("page-basket__rain-layer--chart-open");
      headlineEl?.classList.add("page-basket__rain-headline--chart-open");
      chartWrap.classList.add("is-visible");
      chartWrap.setAttribute("aria-hidden", "false");
      ctaBtn?.classList.add("is-active");
      chart.show();
    }

    function hideRain() {
      sequenceStarted = false;
      clearTypewriter();
      hideChart();
      rain.stop();
      rainLayer.setAttribute("aria-hidden", "true");
      rainLayer.classList.remove("is-visible", "page-basket__rain-layer--headline-done");
      headlineEl?.classList.remove("is-visible", "page-basket__rain-headline--chart-open");
      basketPageEl.classList.remove("page-basket--stat-exit", "page-basket--bg-blur");
      if (statEl) {
        statEl.style.animation = "";
        statEl.style.transform = "";
        statEl.style.opacity = "";
      }
    }

    function showRain(options) {
      const restartHeadline = !options || options.restartHeadline !== false;
      rainLayer.setAttribute("aria-hidden", "false");
      rainLayer.classList.add("is-visible");
      headlineEl?.classList.add("is-visible");
      basketPageEl.classList.add("page-basket--stat-exit", "page-basket--bg-blur");
      rain.resize();
      if (!rain.isRunning()) rain.start();
      sequenceStarted = true;
      if (restartHeadline) {
        rainLayer.classList.remove("page-basket__rain-layer--headline-done");
        startHeadlineReveal();
      }
    }

    function beginRainHandoff() {
      if (sequenceStarted) return;
      if (!sim.isRunning?.()) return;

      if (statEl) {
        statEl.style.animation = "none";
        void statEl.offsetHeight;
      }
      basketPageEl.classList.add("page-basket--stat-exit");

      if (window.ReportPager?.goToPage) {
        window.ReportPager.goToPage(RAIN_PAGE_INDEX);
      } else {
        showRain();
      }
    }

    ctaBtn?.addEventListener("click", () => {
      if (window.ReportPager?.goToPage) {
        window.ReportPager.goToPage(RAIN_CHART_PAGE_INDEX);
      } else {
        showChart();
      }
    });

    sim.setOnSettled(beginRainHandoff);

    const origReset = sim.reset.bind(sim);
    sim.reset = function () {
      hideRain();
      origReset();
    };

    const origStop = sim.stop.bind(sim);
    sim.stop = function () {
      hideRain();
      origStop();
    };

    const origStart = sim.start.bind(sim);
    sim.start = function () {
      hideRain();
      origStart();
    };

    window.addEventListener("resize", () => {
      if (rainLayer.classList.contains("is-visible")) rain.resize();
      if (chartVisible) chart?.resize();
    });

    return { showRain, hideRain, showChart, hideChart };
  };
})();
