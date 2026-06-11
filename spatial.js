/**
 * spatial.js — 空间分布 + 旋球 + 转速 (适配 webapp 翻页系统)
 * 从 webapp2/main.js 提取并改造，去掉 scroll-snap，改为命令式 API
 *
 * 对外接口:
 *   window.SpatialModule.init()           — 初始化 DOM / 数据
 *   window.SpatialModule.enterPage(n)     — 翻入第 n 页 (6/7/8/9)
 *   window.SpatialModule.leavePage(n)     — 翻离第 n 页
 */
(function () {
  "use strict";

  /* ── 常量 ── */
  const STAGGER_MS  = 220;
  const REVEAL_MS   = 480;
  const LIFT         = 22;
  /** P10 旋球页：分阶段文字出现（ms） */
  const P8_REVEAL_AT_MS = {
    0: 0,      // 上旋 338 拍
    1: 750,    // 45% 占总拍数
    2: 1500,   // 三列统计（平击 / 下旋 / 上旋）
    3: 3000,   // 底部文案 1
    4: 3700,   // 底部文案 2
  };
  /** P11 转速页：分阶段文字出现（ms） */
  const P9_REVEAL_AT_MS = {
    0: 0,      // 平均转速
    1: 750,    // 全场最高
    2: 1500,   // 2975 rpm（大球在此之后飞入）
    3: 3000,   // 地球一年只有 X 秒
    4: 3700,   // 历史上下五千年
  };
  const BALL_INTERVAL_MS = 10;
  const BALL_SETTLE_MS = 1000;
  const DEPTH_GROUPS = ["深", "中等", "浅"];
  const DEPTH_HIGHLIGHT_HOLD_MS = REVEAL_MS;
  /** 文案 reveal 完成后再落点/高亮（ms） */
  const TEXT_TO_BALL_DELAY_MS = REVEAL_MS + 60;

  /* ── 落点坐标 · Figma tennis-field 392×829 ── */
  const COURT_LAYOUT = {
    cx: 196,
    cy: 415,
    halfWidth: 115.15,
    halfHeight: 411.5,
    xRange: 5.485,
    yRange: 11.885,
  };

  function landingToPixel(x, y) {
    const c = COURT_LAYOUT;
    return {
      left: c.cx + (x / c.xRange) * c.halfWidth,
      top: c.cy - (y / c.yRange) * c.halfHeight,
    };
  }

  function setSceneLayout(layout, opts) {
    if (window.SpatialScene) window.SpatialScene.setLayout(layout, opts);
  }
  /* ── 旋球网格 ── */
  const SPIN_GRID = {
    rows: 8, frameW: 703.348, frameH: 517.882,
    scale: 0.7, ballSize: 47.53, rowGap: 5,
    pitchX: 630.091 / 10,
  };
  const DEFAULT_SPIN_COUNTS = { 上旋: 338, 平击: 220, 下旋: 57 };
  const DEFAULT_RPM = { avg: 1868, max: 2975, year_seconds: 7.36, history_minutes: 2 };
  const RPM_RAMP_MS = 2000;
  /** P10 旋球页：相对原始转速的倍率（越大转得越快） */
  const SPIN_SPEED_FACTOR = 14.5;

  function shuffleInPlace(list) {
    for (let i = list.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [list[i], list[j]] = [list[j], list[i]];
    }
    return list;
  }

  function buildSpinTypePool(total, counts) {
    const keys = ["上旋", "平击", "下旋"];
    const sum = keys.reduce((s, k) => s + (counts[k] || 0), 0);
    if (!sum || total <= 0) return Array(Math.max(0, total)).fill("平击");
    const floors = keys.map((k) => Math.floor((total * counts[k]) / sum));
    let rem = total - floors.reduce((a, b) => a + b, 0);
    const order = keys.map((k, i) => ({ i, frac: (total * counts[k]) / sum - floors[i] })).sort((a, b) => b.frac - a.frac);
    for (let j = 0; j < rem; j += 1) floors[order[j].i] += 1;
    const pool = [];
    keys.forEach((k, i) => { for (let n = 0; n < floors[i]; n += 1) pool.push(k); });
    return shuffleInPlace(pool);
  }

  function spinClassForType(type) {
    if (type === "上旋") return "spin-ball--topspin";
    if (type === "下旋") return "spin-ball--slice";
    return "spin-ball--flat";
  }
  function spinBallSrcForType(type) {
    return type === "平击" ? "assets/ball-round.svg" : "assets/ball-spin.svg";
  }
  function randomSpinDuration(min, max) {
    return min + Math.random() * (max - min);
  }
  function spinDuration(min, max) {
    return randomSpinDuration(min, max) / SPIN_SPEED_FACTOR;
  }
  function applySpinBallStyle(el, type, index) {
    const tilt = Math.random() * 360;
    const img = el.querySelector(".spin-ball__svg");
    el.style.setProperty("--ball-tilt", `${tilt.toFixed(1)}deg`);
    el.style.setProperty("--spin-delay", `-${randomSpinDuration(0, 6).toFixed(2)}s`);
    el.classList.remove("spin-ball--topspin", "spin-ball--slice");
    if (type === "平击") {
      const cw = Math.random() < 0.5;
      el.classList.add(cw ? "spin-ball--topspin" : "spin-ball--slice");
      if (img) img.src = spinBallSrcForType("上旋");
      el.style.setProperty("--spin-dur", `${spinDuration(4.5, 9).toFixed(2)}s`);
      return;
    }
    el.classList.add(spinClassForType(type));
    if (img) img.src = spinBallSrcForType(type);
    el.style.setProperty("--spin-dur", `${spinDuration(1.6, 4.8).toFixed(2)}s`);
    if (index % 5 === 0) {
      el.style.setProperty("--spin-dur", `${spinDuration(0.9, 2.2).toFixed(2)}s`);
    }
  }

  function restartSpinBallAnimations() {
    const grid = document.getElementById("spinBallsGrid");
    if (!grid) return;
    grid.querySelectorAll(".spin-ball").forEach((el, index) => {
      applySpinBallStyle(el, el.dataset.spin || "平击", index);
      const img = el.querySelector(".spin-ball__svg");
      if (!img) return;
      img.style.animation = "none";
      void img.offsetWidth;
      img.style.animation = "";
    });
  }

  /* ── 模块状态 ── */
  let balls = null;           // { inCourt:[], bySide:{left:[], right:[]}, byDepth:{}, miss:[] }
  let revealTimers = [];
  let activeBallGroups = new Set();
  let currentSpatialPage = 0; // 0 = 不在 spatial 页
  let currentMaxRpm = DEFAULT_RPM.max;
  let rpmRampRaf = 0;

  /* ── 工具函数 ── */
  function scheduleTimer(fn, delay) {
    const id = setTimeout(fn, delay);
    revealTimers.push(id);
    return id;
  }
  function clearRevealTimers() {
    revealTimers.forEach(clearTimeout);
    revealTimers = [];
    activeBallGroups.clear();
    stopRpmRamp();
  }

  /* ── 数据加载 ── */
  function loadData() {
    if (window.SPATIAL_SESSION4) return Promise.resolve(window.SPATIAL_SESSION4);
    return fetch("data/spatial-session4.json").then(r => { if (!r.ok) throw new Error(); return r.json(); });
  }

  function applyDisplayCounts(data) {
    const counts = data?.counts;
    if (!counts) return;
    document.querySelectorAll("[data-count]").forEach(el => {
      const key = el.dataset.count;
      if (counts[key] != null) el.textContent = String(counts[key]);
    });
  }

  /* ── 初始化落点球 ── */
  function initSpatialBalls() {
    const layerInCourt = document.getElementById("landingsPage1");
    const layerMiss    = document.getElementById("landingsPage2");
    if (!layerInCourt || !layerMiss) return Promise.resolve(null);

    return loadData().then(data => {
      const b = {
        inCourt: [], bySide: { left: [], right: [] },
        byDepth: { 深: [], 中等: [], 浅: [] }, miss: [],
      };
      function createBall(pt, opts) {
        const el = document.createElement("span");
        const side = opts.side || (pt.x < 0 ? "left" : "right");
        el.className =
          "spatial-ball" +
          (opts.miss ? " spatial-ball--miss" : "") +
          (side === "left" ? " spatial-ball--left" : " spatial-ball--right");
        el.dataset.side = side;
        if (opts.depth) el.dataset.depth = opts.depth;
        if (pt.seq != null) el.dataset.seq = String(pt.seq);
        const pos = landingToPixel(pt.x, pt.y);
        el.style.left = `${pos.left}px`;
        el.style.top  = `${pos.top}px`;
        return el;
      }
      function sortBySeq(list) { return [...list].sort((a, b2) => (a.seq ?? 0) - (b2.seq ?? 0)); }

      ["left", "right"].forEach(side => {
        sortBySeq(data.page1[side] || []).forEach(pt => {
          const depth = pt.depth;
          const el = createBall(pt, { side, depth });
          layerInCourt.appendChild(el);
          b.inCourt.push(el);
          b.bySide[side].push(el);
          if (depth && b.byDepth[depth]) b.byDepth[depth].push(el);
        });
      });

      sortBySeq(data.page2.miss || []).forEach(pt => {
        const side = pt.x < 0 ? "left" : "right";
        const el = createBall(pt, { miss: true, side });
        layerMiss.appendChild(el);
        b.miss.push(el);
      });

      return b;
    }).catch(err => {
      console.warn("[spatial] landing data:", err);
      return null;
    });
  }

  /* ── 旋球网格 ── */
  function initSpinBallGrid(spinCounts) {
    const root = document.getElementById("spinBallsGrid");
    if (!root) return;
    const { rows, frameW, frameH, scale, ballSize, rowGap, pitchX: basePitchX } = SPIN_GRID;
    const size = ballSize * scale;
    const gapY = rowGap * scale;
    const pitchX = basePitchX * scale;
    const rowPitch = size + gapY;
    const cols = Math.ceil((frameW - pitchX / 2) / pitchX) + 1;
    const gridH = (rows - 1) * rowPitch + size;
    const y0 = (frameH - gridH) / 2;
    const baseX = 0;
    const ballEls = [];
    const frag = document.createDocumentFragment();
    for (let row = 0; row < rows; row += 1) {
      const stagger = row % 2 === 1 ? pitchX / 2 : 0;
      for (let col = 0; col < cols; col += 1) {
        const x = baseX + col * pitchX + stagger + (pitchX - size) / 2;
        const y = y0 + row * rowPitch;
        const el = document.createElement("span");
        el.className = "spin-ball";
        el.dataset.row = String(row);
        el.dataset.y = String(y);
        el.style.left = `${x}px`;
        el.style.top = `${y}px`;
        el.style.width = `${size}px`;
        el.style.height = `${size}px`;
        const img = document.createElement("img");
        img.className = "spin-ball__svg";
        img.alt = "";
        el.appendChild(img);
        frag.appendChild(el);
        ballEls.push(el);
      }
    }
    const pool = buildSpinTypePool(ballEls.length, spinCounts || DEFAULT_SPIN_COUNTS);
    ballEls.forEach((el, index) => {
      const type = pool[index] || "平击";
      el.dataset.spin = type;
      el.classList.add(spinClassForType(type));
      const img = el.querySelector(".spin-ball__svg");
      if (img) img.src = spinBallSrcForType(type);
      applySpinBallStyle(el, type, index);
    });
    root.appendChild(frag);
    root.dataset.maxRow = String(rows - 1);
    root.dataset.maxY = String(frameH);
  }

  /* ── 转速球 ── */
  function getRpmBallEls() {
    const page = document.getElementById("page-9");
    if (!page) return null;
    return {
      ball: page.querySelector(".sp-rpm-ball"),
      spinImg: page.querySelector(".sp-rpm-ball__img"),
    };
  }

  function getRpmMaxEl() {
    return document.querySelector('#page-9 [data-count="rpm_max"]');
  }

  function rpmToSpinDur(rpm) {
    return `${60 / Math.max(rpm, 1)}s`;
  }

  function initRpmBallSpin(maxRpm) {
    const spinEl = document.getElementById("rpmBallSpin");
    if (!maxRpm) return;
    currentMaxRpm = maxRpm;
    if (!spinEl) return;
    spinEl.style.setProperty("--rpm-spin-dur", rpmToSpinDur(maxRpm));
  }

  function setRpmBallSpinning(active) {
    const { spinImg } = getRpmBallEls() || {};
    if (!spinImg) return;
    spinImg.classList.toggle("sp-rpm-ball__img--idle", !active);
  }

  function stopRpmRamp() {
    cancelAnimationFrame(rpmRampRaf);
    rpmRampRaf = 0;
  }

  function resetRpmMaxDisplay() {
    const maxEl = getRpmMaxEl();
    if (maxEl) maxEl.textContent = "0";
  }

  function playRpmRamp(maxRpm) {
    stopRpmRamp();
    const spinEl = document.getElementById("rpmBallSpin");
    const maxEl = getRpmMaxEl();
    if (!spinEl || !maxRpm) return;

    const target = maxRpm;
    if (maxEl) maxEl.textContent = "0";
    spinEl.style.setProperty("--rpm-spin-dur", rpmToSpinDur(1));

    const startTime = performance.now();
    function tick(now) {
      const t = Math.min((now - startTime) / RPM_RAMP_MS, 1);
      const rpm = Math.round(t * target);
      if (maxEl) maxEl.textContent = String(rpm);
      spinEl.style.setProperty("--rpm-spin-dur", rpmToSpinDur(Math.max(rpm, 1)));

      if (t < 1) {
        rpmRampRaf = requestAnimationFrame(tick);
        return;
      }

      if (maxEl) maxEl.textContent = String(target);
      spinEl.style.setProperty("--rpm-spin-dur", rpmToSpinDur(target));
    }

    rpmRampRaf = requestAnimationFrame(tick);
  }

  function resetRpmBall() {
    const { ball } = getRpmBallEls() || {};
    stopRpmRamp();
    resetRpmMaxDisplay();
    if (!ball) return;
    ball.classList.add("ball-zoom-start");
    setRpmBallSpinning(false);
    const spinEl = document.getElementById("rpmBallSpin");
    if (spinEl) spinEl.style.setProperty("--rpm-spin-dur", rpmToSpinDur(1));
  }

  function playRpmBallEntrance() {
    resetRpmBall();
    const flyAt = P9_REVEAL_AT_MS[2] ?? 0;
    scheduleTimer(() => {
      const { ball } = getRpmBallEls() || {};
      if (!ball) return;
      setRpmBallSpinning(true);
      ball.offsetHeight;
      ball.classList.remove("ball-zoom-start");
      playRpmRamp(currentMaxRpm);
    }, flyAt);
  }

  /* ── reveal 动画 ── */
  function isP11RevealEl(el) {
    return Boolean(el.closest("#page-7"));
  }

  function revealTransform(el, liftPx) {
    const y = `${liftPx}px`;
    if (isP11RevealEl(el)) return "none";
    if (el.classList.contains("sp-spin-copy"))       return `translateX(-50%) translateY(${y})`;
    if (el.classList.contains("sp-rpm-fact-row"))     return `translateY(${y})`;
    if (el.classList.contains("sp-spatial-copy--single") || el.classList.contains("sp-spatial-copy__line"))
      return `translateX(-50%) translateY(${y})`;
    if (el.classList.contains("sp-depth-row") || el.classList.contains("sp-spatial-miss"))
      return `translateY(${y})`;
    return `translateY(${y})`;
  }

  function setRevealState(el, visible, animate) {
    if (visible && animate) {
      el.classList.add("sp-is-animating");
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          el.style.opacity = "1";
          el.style.transform = revealTransform(el, 0);
          el.classList.add("sp-is-visible");
        });
      });
      return;
    }
    el.style.opacity = visible ? "1" : "0";
    el.style.transform = revealTransform(el, visible ? 0 : LIFT);
    el.classList.toggle("sp-is-visible", visible);
    el.classList.toggle("sp-is-animating", false);
  }

  function hideItems(items) {
    items.forEach(el => setRevealState(el, false, false));
  }
  function showItemsInstant(items) {
    items.forEach(el => {
      el.classList.remove("sp-is-animating");
      setRevealState(el, true, false);
    });
  }

  /* ── 落点标记显隐 ── */
  function playBallLandSettle(el) {
    el.classList.remove("sp-is-animating", "sp-is-visible");
    el.style.animation = "none";
    el.style.opacity = "0";
    void el.offsetWidth;
    el.style.animation = "";
    el.classList.add("sp-is-animating", "sp-is-visible");
  }
  function hideBallEl(el) {
    el.classList.remove(
      "sp-is-visible",
      "sp-is-animating",
      "spatial-ball--trace",
      "spatial-ball--highlight"
    );
    el.style.animation = "none";
    el.style.opacity = "0";
    el.style.transform = "";
  }
  function setBallTraceState(el) {
    el.classList.remove("sp-is-animating", "spatial-ball--highlight");
    el.classList.add("sp-is-visible", "spatial-ball--trace");
    el.style.animation = "none";
    el.style.opacity = "";
    el.style.transform = "";
  }
  /** P11 · 保留 P10 落点痕迹（半透明） */
  function prepareInCourtTraces() {
    if (!balls) return;
    balls.inCourt.forEach((el) => {
      setBallTraceState(el);
      el.dataset.landPlayed = "1";
    });
  }
  function clearDepthHighlights() {
    if (!balls) return;
    DEPTH_GROUPS.forEach((depth) => {
      (balls.byDepth[depth] || []).forEach((el) => setBallTraceState(el));
    });
  }
  /** P11 · 按深度高亮当前分组，其余保持痕迹态 */
  function highlightBallGroup(group) {
    if (!balls) return;
    DEPTH_GROUPS.forEach((depth) => {
      const isActive = depth === group;
      (balls.byDepth[depth] || []).forEach((el) => {
        el.style.animation = "none";
        el.classList.toggle("spatial-ball--highlight", isActive);
        el.classList.toggle("spatial-ball--trace", !isActive);
        el.style.opacity = "";
        el.style.transform = "";
      });
    });
  }
  function hideAllBalls() {
    if (!balls) return;
    balls.inCourt.forEach(el => {
      hideBallEl(el);
      delete el.dataset.landPlayed;
    });
    balls.miss.forEach(el => {
      hideBallEl(el);
      delete el.dataset.landPlayed;
    });
  }
  function resetInCourtMarkers() {
    if (!balls) return;
    balls.inCourt.forEach((el) => {
      hideBallEl(el);
      delete el.dataset.landPlayed;
    });
  }
  function hideCourtMarkers() {
    hideAllBalls();
    resetInCourtMarkers();
  }
  function reenterPage(n) {
    currentSpatialPage = 0;
    enterPage(n);
  }
  function hasBallPlayed(el) {
    return el.dataset.landPlayed === "1";
  }
  function revealBallGroup(group) {
    if (!balls) return;
    const key = `group:${group}`;
    if (activeBallGroups.has(key)) return;
    activeBallGroups.add(key);

    let list = [];
    if (group === "miss") list = balls.miss;
    else if (group === "left" || group === "right") list = balls.bySide[group] || [];
    else list = balls.byDepth[group] || [];

    list.forEach((el, index) => {
      if (hasBallPlayed(el)) return;
      scheduleTimer(() => {
        el.dataset.landPlayed = "1";
        playBallLandSettle(el);
      }, index * BALL_INTERVAL_MS);
    });
  }

  /* ── 旋球网格动画 ── */
  const SPIN_BALL_LIFT = 80;
  const SPIN_BALL_ROW_SPAN = 0.42;
  const SPIN_BALL_ROW_LEAD = 0.38;

  function showSpinBalls() {
    const grid = document.getElementById("spinBallsGrid");
    if (!grid) return;
    restartSpinBallAnimations();
    const spinBalls = grid.closest(".sp-spin-balls");
    if (spinBalls) spinBalls.style.opacity = "1";
    const ballEls = grid.querySelectorAll(".spin-ball");
    const maxRow = parseInt(grid.dataset.maxRow || "7", 10);
    ballEls.forEach(b => {
      const row = parseInt(b.dataset.row || "0", 10);
      const order = maxRow > 0 ? (maxRow - row) / maxRow : 0;
      const start = order * SPIN_BALL_ROW_LEAD;
      // animate staggered appearance
      const delayMs = start * 600;
      b.style.opacity = "0";
      b.style.transform = `translateY(${SPIN_BALL_LIFT}px)`;
      scheduleTimer(() => {
        b.style.transition = "opacity 0.4s ease, transform 0.4s ease";
        b.style.opacity = "1";
        b.style.transform = "translateY(0)";
      }, delayMs);
    });
  }
  function hideSpinBalls() {
    const grid = document.getElementById("spinBallsGrid");
    if (!grid) return;
    const spinBalls = grid.closest(".sp-spin-balls");
    if (spinBalls) spinBalls.style.opacity = "0";
    const ballEls = grid.querySelectorAll(".spin-ball");
    ballEls.forEach(b => {
      b.style.transition = "none";
      b.style.opacity = "0";
      b.style.transform = `translateY(${SPIN_BALL_LIFT}px)`;
    });
  }

  function groupBallDuration(group) {
    if (!balls) return 0;
    let list = [];
    if (group === "miss") list = balls.miss;
    else if (group === "left" || group === "right") list = balls.bySide[group] || [];
    else list = balls.byDepth[group] || [];
    const count = list.filter((el) => !hasBallPlayed(el)).length;
    if (!count) return 0;
    return (count - 1) * BALL_INTERVAL_MS + BALL_SETTLE_MS;
  }

  /** P11 · 深/中/浅文案 → 依次高亮对应落点（P10 痕迹保留） */
  function playRevealPage7(items) {
    clearRevealTimers();
    hideItems(items);
    prepareInCourtTraces();

    const missRow = items.find((el) => el.dataset.ballGroup === "miss");
    const copyLine = items.find((el) => el.classList.contains("sp-spatial-copy--single"));

    let t = 0;

    DEPTH_GROUPS.forEach((group, index) => {
      const row = items.find((el) => Number(el.dataset.order) === index);
      scheduleTimer(() => setRevealState(row, true, true), t);
      t += TEXT_TO_BALL_DELAY_MS;
      scheduleTimer(() => highlightBallGroup(group), t);
      t += DEPTH_HIGHLIGHT_HOLD_MS + STAGGER_MS;
    });

    if (missRow) {
      scheduleTimer(() => {
        clearDepthHighlights();
        setRevealState(missRow, true, true);
      }, t);
      t += STAGGER_MS;
    }

    if (copyLine) {
      scheduleTimer(() => setRevealState(copyLine, true, true), t);
    }
  }

  /** P10 · 左文案 → 左半场落点 → 右文案 → 右半场落点 */
  function playRevealPage6(items) {
    clearRevealTimers();
    hideItems(items);

    const byOrder = (n) => items.find((el) => Number(el.dataset.order) === n);
    const headline = byOrder(0);
    const leftRow = items.find((el) => el.dataset.ballGroup === "left");
    const rightRow = items.find((el) => el.dataset.ballGroup === "right");
    const copyLines = items.filter((el) => el.classList.contains("sp-spatial-copy__line"));

    let t = 0;

    scheduleTimer(() => setRevealState(headline, true, true), t);
    t += STAGGER_MS;

    scheduleTimer(() => setRevealState(leftRow, true, true), t);
    t += TEXT_TO_BALL_DELAY_MS;

    scheduleTimer(() => revealBallGroup("left"), t);
    t += groupBallDuration("left") + STAGGER_MS;

    scheduleTimer(() => setRevealState(rightRow, true, true), t);
    t += TEXT_TO_BALL_DELAY_MS;

    scheduleTimer(() => revealBallGroup("right"), t);
    t += groupBallDuration("right") + STAGGER_MS;

    copyLines.forEach((el, i) => {
      scheduleTimer(() => setRevealState(el, true, true), t + i * STAGGER_MS);
    });
  }

  /* ── 逐条 reveal 播放（P11 深/中/浅/失误） ── */
  function playReveal(items, ballAction, delayForItem) {
    clearRevealTimers();
    hideItems(items);
    items.forEach((el, index) => {
      const delay = delayForItem
        ? delayForItem(el, index)
        : index * STAGGER_MS;
      scheduleTimer(() => {
        setRevealState(el, true, true);
        if (ballAction === "group" && el.dataset.ballGroup) {
          const group = el.dataset.ballGroup;
          scheduleTimer(() => revealBallGroup(group), TEXT_TO_BALL_DELAY_MS);
        }
      }, delay);
    });
  }

  /* ── 页面 DOM 引用 ── */
  let page6Items = [];
  let page7Items = [];
  let page8Items = [];
  let page9Items = [];

  function getRevealItems(pageEl) {
    return [...pageEl.querySelectorAll(".sp-reveal")].sort(
      (a, b) => Number(a.dataset.order) - Number(b.dataset.order)
    );
  }

  /* ── 图层控制 ── */
  function fadeLayer(layer, show) {
    if (!layer) return;
    if (show) {
      layer.classList.remove("sp-fading-out");
      layer.classList.add("sp-active");
    } else {
      layer.classList.add("sp-fading-out");
      setTimeout(() => layer.classList.remove("sp-active", "sp-fading-out"), 400);
    }
  }

  function showCourtOverlay() {
    if (window.SpatialScene) window.SpatialScene.show();
  }
  function hideCourtOverlay() {
    if (window.SpatialScene) window.SpatialScene.hide();
  }

  function enterPage(n) {
    if (currentSpatialPage === n) return;
    const prevPage = currentSpatialPage;
    currentSpatialPage = n;
    clearRevealTimers();

    const layerInCourt = document.getElementById("landingsPage1");
    const layerMiss    = document.getElementById("landingsPage2");

    if (n === 6) {
      setSceneLayout("p10", { show: true, animate: false });
      fadeLayer(layerInCourt, true);
      fadeLayer(layerMiss, false);
      if (balls) balls.miss.forEach(el => hideBallEl(el));
      resetInCourtMarkers();
      playRevealPage6(page6Items);
    } else if (n === 7) {
      setSceneLayout("p11", { show: true, animate: false });
      fadeLayer(layerInCourt, true);
      fadeLayer(layerMiss, false);
      if (balls) balls.miss.forEach((el) => hideBallEl(el));
      playRevealPage7(page7Items);
    } else if (n === 8) {
      // 旋球: 隐藏球场落点, 显示旋球网格
      hideCourtOverlay();
      fadeLayer(layerInCourt, false);
      fadeLayer(layerMiss, false);
      hideAllBalls();
      playReveal(page8Items, null, (el) => P8_REVEAL_AT_MS[Number(el.dataset.order)] ?? 0);
      showSpinBalls();                // 再追加旋球 timer
    } else if (n === 9) {
      // 转速: 隐藏旋球网格
      hideCourtOverlay();
      fadeLayer(layerInCourt, false);
      fadeLayer(layerMiss, false);
      hideAllBalls();
      hideSpinBalls();
      resetRpmMaxDisplay();
      playReveal(page9Items, null, (el) => P9_REVEAL_AT_MS[Number(el.dataset.order)] ?? 0);
      playRpmBallEntrance();
    }
  }

  function leavePage(n) {
    clearRevealTimers();
    hideCourtOverlay();
    hideAllBalls();
    if (n === 6) hideItems(page6Items);
    if (n === 7) hideItems(page7Items);
    if (n === 8) {
      hideItems(page8Items);
      hideSpinBalls();
    }
    if (n === 9) {
      hideItems(page9Items);
      resetRpmBall();
    }
    currentSpatialPage = 0;
  }

  // 只隐藏文字，保留球场和球不变（用于 page-6 ↔ page-7 过渡）
  function leaveTextOnly(n) {
    clearRevealTimers();
    if (n === 6) hideItems(page6Items);
    if (n === 7) hideItems(page7Items);
    // 不重置 currentSpatialPage，让 enterPage 能检测到 6↔7 过渡
  }

  /* ── 初始化 ── */
  function init() {
    if (window.SpatialScene) window.SpatialScene.init();
    const p6 = document.getElementById("page-6");
    const p7 = document.getElementById("page-7");
    const p8 = document.getElementById("page-8");
    const p9 = document.getElementById("page-9");

    if (p6) page6Items = getRevealItems(p6);
    if (p7) page7Items = getRevealItems(p7);
    if (p8) page8Items = getRevealItems(p8);
    if (p9) page9Items = getRevealItems(p9);

    // 初始隐藏所有 reveal 元素
    [page6Items, page7Items, page8Items, page9Items].forEach(items => hideItems(items));
    resetRpmBall();

    loadData()
      .then(data => {
        applyDisplayCounts(data);
        initSpinBallGrid(data?.spin?.counts);
        initRpmBallSpin(data?.rpm?.max ?? DEFAULT_RPM.max);
        return initSpatialBalls();
      })
      .then(b => { balls = b; })
      .catch(() => {
        initSpinBallGrid(DEFAULT_SPIN_COUNTS);
        initRpmBallSpin(DEFAULT_RPM.max);
        initSpatialBalls().then(b => { balls = b; });
      });
  }

  /* ── 公开 API ── */
  window.SpatialModule = {
    init,
    enterPage,
    leavePage,
    leaveTextOnly,
    hideCourtMarkers,
    reenterPage,
  };
})();
