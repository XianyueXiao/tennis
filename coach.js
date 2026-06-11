/**
 * 教练碎碎念 · 四页整页滑动（P21–P24）
 */

(function () {
  "use strict";

  const STAGGER_MS = 220;
  const REVEAL_MS = 480;
  const LIFT = 22;
  /** P20–P23 教练页：分阶段文字出现（ms），key = data-order */
  const COACH_REVEAL_AT_MS = {
    2: {
      0: 0,      // 标题
      1: 700,    // 四堂课了
      2: 1250,   // 打框了
      3: 1800,   // 209
      4: 2350,   // 次
      5: 2900,   // 甜区离婚？
      6: 3800,   // 正手失误率
      7: 4350,   // 达到了
      8: 4900,   // 20%
      9: 5450,   // 比截击还高
      10: 6000,  // 喜新厌旧
    },
    3: {
      0: 0,      // 标题
      1: 750,    // 引导 1
      2: 1400,   // 引导 2
      3: 2200,   // 到训练后期
      4: 2750,   // 心率下降
      5: 3600,   // 心率曲线 + 球
      6: 4500,   // 底部吐槽
    },
    4: {
      0: 0,      // 其实我一直…
      1: 700,    // 球路太单一
      2: 2000,   // 穿刺线 1
      3: 2300,
      4: 2600,
      5: 2900,
      6: 3200,
      7: 4200,   // 斜线 %
      8: 4750,   // 直线 %
      9: 5300,   // 追身 %
    },
  };
  const EXIT_LIFT = 22;
  const SNAP_EDGE = 6;
  const PAGE_COUNT = 4;
  const DATA_URL = "data/coach-whisper.json";

  function loadCoachData() {
    if (window.COACH_WHISPER) {
      return Promise.resolve(window.COACH_WHISPER);
    }
    return fetch(DATA_URL).then((r) => {
      if (!r.ok) throw new Error("coach data load failed");
      return r.json();
    });
  }

  function applyDisplayCounts(data) {
    if (!data) return;
    document.querySelectorAll("[data-count]").forEach((el) => {
      const key = el.dataset.count;
      if (data[key] != null) {
        el.textContent = String(data[key]);
      }
    });
  }

  /** Figma 65:795 · area 椭圆（相对 65:794 拍面 406.5×268.5） */
  const RACKET_AREA_DEFAULT = {
    cx: 120.60256958007812,
    cy: 161.30803680419922,
    rx: 92.14553833007812,
    ry: 72.74358367919922,
    rotDeg: 13.034543460122498,
  };

  /** 拍框外缘路径（旧资源备用） */
  const RIM_URL = "data/coach-racket-rim.json";

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function next() {
      a += 0x6d2b79f5;
      let t = Math.imul(a ^ (a >>> 15), a | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function loadRimPath() {
    if (window.COACH_RACKET_RIM?.path) {
      return Promise.resolve(window.COACH_RACKET_RIM);
    }
    return fetch(RIM_URL)
      .then((r) => {
        if (!r.ok) throw new Error("rim path load failed");
        return r.json();
      });
  }

  function buildRimRadiusLookup(path, cx, cy) {
    const lookup = new Array(360).fill(0);
    path.forEach((p) => {
      const ang =
        ((Math.atan2(p.y - cy, p.x - cx) * 180) / Math.PI + 360) % 360;
      const idx = Math.round(ang) % 360;
      const r = Math.hypot(p.x - cx, p.y - cy);
      lookup[idx] = Math.max(lookup[idx], r);
    });
    for (let i = 0; i < 360; i += 1) {
      if (lookup[i] > 0) continue;
      for (let d = 1; d < 180; d += 1) {
        const a = lookup[(i + d) % 360];
        const b = lookup[(i - d + 360) % 360];
        if (a > 0 || b > 0) {
          lookup[i] = Math.max(a, b);
          break;
        }
      }
    }
    return lookup;
  }

  function buildPathMetrics(path) {
    const segs = [];
    let totalLen = 0;

    for (let i = 0; i < path.length; i += 1) {
      const a = path[i];
      const b = path[(i + 1) % path.length];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const segLen = Math.hypot(dx, dy) || 1;
      const tx = dx / segLen;
      const ty = dy / segLen;
      segs.push({
        x: a.x,
        y: a.y,
        len: totalLen,
        segLen,
        tx,
        ty,
        nx: -ty,
        ny: tx,
      });
      totalLen += segLen;
    }

    return { segs, totalLen };
  }

  function pointOnPath(segs, totalLen, dist) {
    const d = ((dist % totalLen) + totalLen) % totalLen;
    let lo = 0;
    let hi = segs.length - 1;

    while (lo < hi) {
      const mid = Math.floor((lo + hi + 1) / 2);
      if (segs[mid].len <= d) lo = mid;
      else hi = mid - 1;
    }

    const seg = segs[lo];
    const along = d - seg.len;
    return {
      x: seg.x + seg.tx * along,
      y: seg.y + seg.ty * along,
      nx: seg.nx,
      ny: seg.ny,
      tx: seg.tx,
      ty: seg.ty,
    };
  }

  function readRacketArea() {
    const el = document.querySelector(".coach-panel--page2 .coach-p22-area");
    if (!el) return { ...RACKET_AREA_DEFAULT };

    return {
      cx: parseFloat(el.dataset.areaCx) || RACKET_AREA_DEFAULT.cx,
      cy: parseFloat(el.dataset.areaCy) || RACKET_AREA_DEFAULT.cy,
      rx: parseFloat(el.dataset.areaRx) || RACKET_AREA_DEFAULT.rx,
      ry: parseFloat(el.dataset.areaRy) || RACKET_AREA_DEFAULT.ry,
      rotDeg: parseFloat(el.dataset.areaRot) || RACKET_AREA_DEFAULT.rotDeg,
    };
  }

  /** Figma/CSS 顺时针旋转：局部椭圆坐标 → 拍面 SVG 坐标 */
  function mapAreaLocalToRacket(area, lx, ly) {
    const rotRad = (area.rotDeg * Math.PI) / 180;
    const cosR = Math.cos(rotRad);
    const sinR = Math.sin(rotRad);
    return {
      x: area.cx + lx * cosR + ly * sinR,
      y: area.cy - lx * sinR + ly * cosR,
    };
  }

  /** 以 Figma 65:795 area 椭圆（球网区域）为基准，在椭圆内散布打框落点 */
  function buildFrameHitPoints(count, area) {
    const rand = mulberry32((count * 2654435761) >>> 0);
    const points = [];

    for (let k = 0; k < count; k += 1) {
      const baseAngle = (k / count) * Math.PI * 2;
      const angle = baseAngle + (rand() - 0.5) * (Math.PI * 2 / count) * 1.8;

      const radial = 0.72 + Math.sqrt(rand()) * 0.28;
      let lx = area.rx * radial * Math.cos(angle);
      let ly = area.ry * radial * Math.sin(angle);

      const tx = -area.ry * Math.sin(angle);
      const ty = area.rx * Math.cos(angle);
      const tLen = Math.hypot(tx, ty) || 1;
      const tangential = (rand() - 0.5) * 12;
      lx += (tx / tLen) * tangential;
      ly += (ty / tLen) * tangential;

      const mapped = mapAreaLocalToRacket(area, lx, ly);

      points.push({
        x: mapped.x,
        y: mapped.y,
        r: 2 + rand() * 1.4,
        opacity: 0.82 + rand() * 0.18,
      });
    }

    return points;
  }

  /** 沿拍框轮廓 + 切向随机，落点保持在框缘上（不向外扩散） */
  function buildScatteredRimPoints(count, rim) {
    const path = rim.path;
    const cx = rim.cx ?? 114;
    const cy = rim.cy ?? 158;
    const rand = mulberry32((count * 2654435761) >>> 0);
    const { segs, totalLen } = buildPathMetrics(path);
    const rimRadius = buildRimRadiusLookup(path, cx, cy);
    if (totalLen <= 0 || count <= 0) return [];

    const points = [];
    const slot = totalLen / count;

    for (let k = 0; k < count; k += 1) {
      const slotStart = slot * k;
      const slotEnd = slot * (k + 1);
      const bleed = slot * (0.35 + rand() * 0.55);
      const dist =
        slotStart - bleed + rand() * (slotEnd - slotStart + bleed * 2);

      const base = pointOnPath(segs, totalLen, dist);
      const tangential = (rand() - 0.5) * (8 + rand() * 10);
      const normal = (rand() - 0.5) * (2 + rand() * 3);

      let x = base.x + base.tx * tangential + base.nx * normal;
      let y = base.y + base.ty * tangential + base.ny * normal;

      const angIdx =
        Math.round(
          ((Math.atan2(y - cy, x - cx) * 180) / Math.PI + 360) % 360
        ) % 360;
      const rimR = rimRadius[angIdx] || Math.hypot(base.x - cx, base.y - cy);
      const r = Math.hypot(x - cx, y - cy) || 1;
      const targetR = rimR * (0.9 + rand() * 0.08);
      const scale = targetR / r;
      x = cx + (x - cx) * scale;
      y = cy + (y - cy) * scale;

      points.push({
        x,
        y,
        r: 2 + rand() * 1.4,
        opacity: 0.82 + rand() * 0.18,
      });
    }

    return points;
  }

  function renderCoachRacketDots(count, rim) {
    const svg = document.getElementById("coachRacketDots");
    if (!svg) return;

    const n = Math.max(0, Math.min(500, Math.round(Number(count) || 0)));
    svg.replaceChildren();
    if (n === 0) return;

    const areaEl = document.querySelector(".coach-panel--page2 .coach-p22-area");
    const points = areaEl
      ? buildFrameHitPoints(n, readRacketArea())
      : rim?.path?.length
        ? buildScatteredRimPoints(n, rim)
        : [];
    if (!points.length) return;
    const frag = document.createDocumentFragment();

    points.forEach((p) => {
      const dot = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      dot.setAttribute(
        "class",
        areaEl ? "coach-p22-dot" : "coach-racket__dot"
      );
      dot.setAttribute("cx", p.x.toFixed(2));
      dot.setAttribute("cy", p.y.toFixed(2));
      dot.setAttribute("r", p.r.toFixed(2));
      dot.setAttribute("fill-opacity", p.opacity.toFixed(2));
      frag.appendChild(dot);
    });

    svg.appendChild(frag);
  }

  function initCoachPages() {
    const sections = [...document.querySelectorAll(".page-coach[data-coach-page]")];
    const noopModule = {
      enterPage() {},
      leavePage() {},
      isBusy() {
        return false;
      },
    };
    if (!sections.length) return noopModule;

    const panelForCoachPage = {};
    const itemsByPage = {};
    sections.forEach((section) => {
      const page = Number(section.dataset.coachPage);
      const panel = section.querySelector(".coach-panel");
      if (!panel || !page) return;
      panelForCoachPage[page] = panel;
      itemsByPage[page] = [...panel.querySelectorAll(".spatial-reveal")].sort(
        (a, b) => Number(a.dataset.order) - Number(b.dataset.order)
      );
    });

    let isRevealing = false;
    let revealTimers = [];

    function itemsForPage(page) {
      return itemsByPage[page] || [];
    }

    function isPierceEl(el) {
      return el.classList.contains("coach-page4-pierce-line");
    }

    function pierceTransform(el, settled) {
      const ux = parseFloat(el.dataset.pierceUx || "0");
      const uy = parseFloat(el.dataset.pierceUy || "0");
      const dist = parseFloat(el.dataset.pierceDist || "120");
      if (settled) return "translate(0, 0)";
      return `translate(${-ux * dist}px, ${-uy * dist}px)`;
    }

    function revealTransform(el, liftPx) {
      const ty = `${liftPx}px`;
      if (isPierceEl(el)) {
        return pierceTransform(el, liftPx === 0);
      }
      if (
        el.classList.contains("coach-alert") ||
        el.classList.contains("coach-line") ||
        el.classList.contains("coach-headline") ||
        el.classList.contains("coach-foot--3") ||
        el.classList.contains("coach-foot--rate") ||
        el.classList.contains("coach-page4-intro") ||
        el.classList.contains("coach-page4-title")
      ) {
        return `translateX(-50%) translateY(${ty})`;
      }
      return `translateY(${ty})`;
    }

    function setRevealState(el, visible, animate) {
      if (isPierceEl(el)) {
        el.classList.toggle("is-animating", animate);
        if (visible && animate) {
          el.classList.add("is-animating");
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              el.style.opacity = "1";
              el.style.transform = "translate(0, 0)";
              el.classList.add("is-visible");
            });
          });
          return;
        }
        el.style.opacity = visible ? "1" : "0";
        el.style.transform = pierceTransform(el, visible);
        el.classList.toggle("is-visible", visible);
        return;
      }

      if (visible && animate) {
        el.classList.add("is-animating");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.opacity = "1";
            el.style.transform = revealTransform(el, 0);
            el.classList.add("is-visible");
          });
        });
        return;
      }

      el.style.opacity = visible ? "1" : "0";
      el.style.transform = revealTransform(el, visible ? 0 : LIFT);
      el.classList.toggle("is-visible", visible);
      el.classList.toggle("is-animating", animate);
    }

    function scheduleTimer(fn, delay) {
      const id = setTimeout(fn, delay);
      revealTimers.push(id);
      return id;
    }

    function clearRevealTimers() {
      revealTimers.forEach(clearTimeout);
      revealTimers = [];
    }

    function hideItems(list) {
      list.forEach((el) => setRevealState(el, false, false));
    }

    function hideTextItemsInstant(list) {
      list.forEach((el) => {
        el.classList.remove("is-animating", "is-visible");
        if (isPierceEl(el)) {
          el.style.opacity = "0";
          el.style.transform = pierceTransform(el, false);
          return;
        }
        el.style.opacity = "0";
        el.style.transform = revealTransform(el, LIFT);
      });
      if (list.some((el) => el.classList.contains("coach-p23-chart-wrap"))) {
        window.CoachP23Chart?.reset();
      }
    }

    function getCoachRevealDelay(page, el, index) {
      const order = Number(el.dataset.order);
      const pageMap = COACH_REVEAL_AT_MS[page];
      if (pageMap && pageMap[order] != null) return pageMap[order];
      return index * STAGGER_MS;
    }

    function playReveal(list, panel) {
      clearRevealTimers();
      isRevealing = true;
      hideItems(list);
      panel.classList.remove("is-fading-out");

      const page = Number(panel.dataset.page);
      const delays = list.map((el, index) => getCoachRevealDelay(page, el, index));

      list.forEach((el, index) => {
        scheduleTimer(() => setRevealState(el, true, true), delays[index]);
      });

      if (page === 3) {
        window.CoachP23Chart?.reset();
        const chartEl = panel.querySelector(".coach-p23-chart-wrap");
        if (chartEl) {
          const chartIndex = list.indexOf(chartEl);
          const chartDelay =
            chartIndex >= 0
              ? delays[chartIndex]
              : getCoachRevealDelay(3, chartEl, Number(chartEl.dataset.order));
          scheduleTimer(
            () => window.CoachP23Chart?.play(),
            chartDelay + REVEAL_MS * 0.35
          );
        }
      }

      const pierceMs = list.some(isPierceEl) ? 920 : REVEAL_MS;
      const maxDelay = delays.length ? Math.max(...delays) : 0;
      scheduleTimer(() => {
        isRevealing = false;
      }, maxDelay + pierceMs);
    }

    function resetPanelStyles(panel) {
      if (!panel) return;
      panel.style.transform = "";
      panel.style.opacity = "";
      panel.style.visibility = "";
    }

    function enterPage(page) {
      const panel = panelForCoachPage[page];
      if (!panel) return;
      resetPanelStyles(panel);
      playReveal(itemsForPage(page), panel);
      if (page === 2) {
        requestAnimationFrame(() => {
          loadCoachData()
            .then((data) => {
              renderCoachRacketDots(data?.frame_hits_total);
            })
            .catch(() => {
              renderCoachRacketDots(
                window.COACH_WHISPER?.frame_hits_total ?? 209
              );
            });
        });
      }
    }

    function leavePage(page) {
      clearRevealTimers();
      isRevealing = false;
      const panel = panelForCoachPage[page];
      hideTextItemsInstant(itemsForPage(page));
      if (page === 3) window.CoachP23Chart?.reset();
      resetPanelStyles(panel);
    }

    for (let p = 1; p <= PAGE_COUNT; p += 1) {
      hideTextItemsInstant(itemsForPage(p));
    }

    return {
      enterPage,
      leavePage,
      isBusy() {
        return isRevealing;
      },
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    window.CoachModule = initCoachPages();
    loadCoachData()
      .then((data) => {
        applyDisplayCounts(data);
        renderCoachRacketDots(data?.frame_hits_total);
      })
      .catch(() => {
        renderCoachRacketDots(
          window.COACH_WHISPER?.frame_hits_total ?? 209
        );
      });
  });
})();
