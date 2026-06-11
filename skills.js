/**
 * 技能板块 · 总览 + 详情导航（Figma 31:340 hub · 详情 225:185 … 225:215）
 */

(function () {
  "use strict";

  const STAGGER_MS = 220;
  const REVEAL_MS = 480;
  const LIFT = 22;
  const EXIT_LIFT = 22;
  const SNAP_EDGE = 6;
  const FLY_MS = 520;
  const PANEL_FADE_MS = 450;
  const HIDE_STAGGER_MS = 120;
  const SKILL_PANEL_COUNT = 4;
  const DETAIL_PAGES = [2, 3, 5];
  const POWER_DATA_URL = "data/skills-power.json";
  const DEFENSE_DATA_URL = "data/skills-defense.json";
  const AWAKENING_DATA_URL = "data/skills-awakening.json";
  const FLYER_MAX = 3;
  const FLYER_MIN = 2;
  const FLY_BALL = "assets/skill-fly-ball.svg";
  const FLYER_SIZE = 90;
  const FLYER_MIN_DIST = FLYER_SIZE + 48;
  const FLYER_SPAWN_ATTEMPTS = 36;

  /** Figma 31:340 hub / 详情顶栏 · 布局内绝对坐标（440×956） */
  const SKILL_FLY_ANCHORS = {
    2: {
      hub: { x: 154, y: 308, w: 169, h: 169 },
      hero: { x: 136, y: 21, w: 169, h: 169 },
    },
    3: {
      hub: { x: 51, y: 410, w: 169, h: 169 },
      hero: { x: 136, y: 21, w: 169, h: 169 },
    },
    5: {
      hub: { x: 220, y: 495, w: 169, h: 169 },
      hero: { x: 136, y: 21, w: 169, h: 169 },
    },
  };

  const SKILL_PANEL_INDEX = { 1: 0, 2: 1, 3: 2, 5: 3 };
  const SKILL_NAV_BY_PAGE = { 2: "20-1", 3: "20-2", 5: "20-3" };

  function loadJsonData(globalName, url) {
    if (window[globalName]) {
      return Promise.resolve(window[globalName]);
    }
    return fetch(url).then((r) => {
      if (!r.ok) throw new Error(`${url} load failed`);
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
    document.querySelectorAll("[data-count-idle]").forEach((el) => {
      const key = el.dataset.countIdle;
      if (data[key] != null) {
        el.textContent = String(data[key]);
      }
    });
  }

  function applyDisplayText(data, attrName) {
    if (!data) return;
    const fieldMap = {
      skill_name_p3: "skill_name",
      skill_name_p5: "skill_name",
    };
    const key = fieldMap[attrName] || attrName;
    if (data[key] == null) return;
    document.querySelectorAll(`[data-text="${attrName}"]`).forEach((el) => {
      el.textContent = String(data[key]);
    });
  }

  function isCenteredSkillEl(el) {
    return (
      el.classList.contains("skill-kicker") ||
      el.classList.contains("skill-headline") ||
      el.classList.contains("skill-hint") ||
      el.classList.contains("skill-p2-line") ||
      el.classList.contains("skill-p4-tagline") ||
      el.classList.contains("skill-p4-badge") ||
      el.classList.contains("skill-p5-tagline") ||
      el.classList.contains("skill-close-btn") ||
      el.classList.contains("skill-icon-item--center")
    );
  }

  function createFlyerController(root) {
    if (!root) {
      return { start() {}, stop() {} };
    }

    let running = false;
    let spawnTimer = null;
    let speedMul = 1;
    /** @type {Map<HTMLElement, { sx:number, sy:number, dx:number, dy:number, dur:number, startTime:number }>} */
    const active = new Map();

    function spawnDelay(base) {
      return base / speedMul;
    }

    function clearSpawnTimer() {
      if (spawnTimer) {
        clearTimeout(spawnTimer);
        spawnTimer = null;
      }
    }

    function flyerPos(state, elapsedSec) {
      const t = Math.min(1, Math.max(0, elapsedSec / state.dur));
      return {
        x: state.sx + state.dx * t,
        y: state.sy + state.dy * t,
      };
    }

    function wouldOverlap(candidate, others, nowSec) {
      const stepSec = 0.06;
      const horizon = candidate.dur;

      for (let t = 0; t <= horizon; t += stepSec) {
        const cp = flyerPos(candidate, t);
        for (const other of others) {
          const ot = nowSec + t - other.startTime;
          if (ot < 0 || ot > other.dur) continue;
          const op = flyerPos(other, ot);
          if (Math.hypot(cp.x - op.x, cp.y - op.y) < FLYER_MIN_DIST) {
            return true;
          }
        }
      }
      return false;
    }

    function buildCandidate(panelW, panelH) {
      const angle = Math.random() * Math.PI * 2;
      const travel = Math.hypot(panelW, panelH) * (1.05 + Math.random() * 0.35);
      const dx = Math.cos(angle) * travel;
      const dy = Math.sin(angle) * travel;
      const sx = panelW * 0.5 - dx * 0.5 + (Math.random() - 0.5) * panelW * 0.22;
      const sy = panelH * 0.5 - dy * 0.5 + (Math.random() - 0.5) * panelH * 0.18;
      const dur = (0.425 + Math.random() * 0.375) / speedMul;
      const ballRot = Math.round((angle * 180) / Math.PI + 90);
      const shadowRot = Math.round((angle * 180) / Math.PI - 35);

      return { sx, sy, dx, dy, dur, ballRot, shadowRot };
    }

    function mountFlyer(candidate, nowSec) {
      const el = document.createElement("div");
      el.className = "skill-flyer";
      el.style.setProperty("--sx", `${candidate.sx}px`);
      el.style.setProperty("--sy", `${candidate.sy}px`);
      el.style.setProperty("--dx", `${candidate.dx}px`);
      el.style.setProperty("--dy", `${candidate.dy}px`);
      el.style.setProperty("--dur", `${candidate.dur.toFixed(2)}s`);
      el.style.setProperty("--ball-rot", `${candidate.ballRot}deg`);
      el.style.setProperty("--shadow-rot", `${candidate.shadowRot}deg`);

      el.innerHTML =
        `<img class="skill-flyer__shadow" src="assets/skill-ball-shadow.svg" alt="">` +
        `<img class="skill-flyer__ball" src="${FLY_BALL}" alt="">`;

      const state = {
        sx: candidate.sx,
        sy: candidate.sy,
        dx: candidate.dx,
        dy: candidate.dy,
        dur: candidate.dur,
        startTime: nowSec,
      };

      el.addEventListener(
        "animationend",
        () => {
          active.delete(el);
          el.remove();
          if (running) {
            queueSpawn(spawnDelay(80 + Math.random() * 160));
          }
        },
        { once: true }
      );

      root.appendChild(el);
      active.set(el, state);
    }

    function spawnFlyer() {
      if (!running || active.size >= FLYER_MAX) return false;

      const panelW = root.clientWidth || 440;
      const panelH = root.clientHeight || window.innerHeight;
      const nowSec = performance.now() / 1000;
      const others = [...active.values()];
      let candidate = null;

      for (let attempt = 0; attempt < FLYER_SPAWN_ATTEMPTS; attempt += 1) {
        const next = buildCandidate(panelW, panelH);
        if (!wouldOverlap(next, others, nowSec)) {
          candidate = next;
          break;
        }
      }

      if (!candidate) {
        queueSpawn(spawnDelay(160 + Math.random() * 180));
        return false;
      }

      mountFlyer(candidate, nowSec);
      return true;
    }

    function queueSpawn(delay) {
      clearSpawnTimer();
      spawnTimer = setTimeout(() => {
        spawnTimer = null;
        if (!running) return;

        while (active.size < FLYER_MIN) {
          if (!spawnFlyer()) break;
        }
        if (active.size < FLYER_MAX && Math.random() > 0.35) {
          spawnFlyer();
        }

        if (running) {
          queueSpawn(spawnDelay(320 + Math.random() * 420));
        }
      }, delay);
    }

    return {
      start() {
        if (running) return;
        running = true;
        root.replaceChildren();
        active.clear();
        queueSpawn(spawnDelay(60));
      },
      stop() {
        running = false;
        speedMul = 1;
        clearSpawnTimer();
        root.replaceChildren();
        active.clear();
      },
      setBoost(multiplier) {
        speedMul = Math.max(1, Number(multiplier) || 1);
      },
    };
  }

  function isHeroEl(el) {
    return (
      el.classList.contains("skill-p2-hero") ||
      el.classList.contains("skill-p3-hero") ||
      el.classList.contains("skill-p4-hero") ||
      el.classList.contains("skill-p5-hero")
    );
  }

  function bindTapFeedback(root) {
    root.querySelectorAll(".app-tap").forEach((el) => {
      const press = () => el.classList.add("is-pressed");
      const release = () => el.classList.remove("is-pressed");
      el.addEventListener("pointerdown", press);
      el.addEventListener("pointerup", release);
      el.addEventListener("pointerleave", release);
      el.addEventListener("pointercancel", release);
    });
  }

  function waitMs(ms) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  function pauseBob(bob) {
    if (!bob) return;
    bob.classList.add("is-fly-paused");
  }

  function resumeBob(bob) {
    if (!bob) return;
    bob.classList.remove("is-fly-paused");
  }

  function waitFrames(count) {
    return new Promise((resolve) => {
      let left = count;
      const step = () => {
        left -= 1;
        if (left <= 0) {
          resolve();
          return;
        }
        requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
    });
  }

  function getFlyArtRect(bob) {
    const art = bob?.querySelector(".skill-icon-item__art");
    return (art || bob)?.getBoundingClientRect() || null;
  }

  /** skill-stage 在 webapp2.0 内用 --base-scale 缩放，视口坐标需还原为 440 设计稿坐标 */
  function getStageScale(stage) {
    if (!stage) return 1;
    const sr = stage.getBoundingClientRect();
    const designW = stage.offsetWidth || 440;
    if (designW <= 0 || sr.width <= 0) return 1;
    const scale = sr.width / designW;
    return scale > 0 ? scale : 1;
  }

  function toStageLocal(viewportRect, stage) {
    const sr = stage.getBoundingClientRect();
    const scale = getStageScale(stage);
    return {
      x: (viewportRect.left - sr.left) / scale,
      y: (viewportRect.top - sr.top) / scale,
      w: viewportRect.width / scale,
      h: viewportRect.height / scale,
    };
  }

  function cacheFlyOriginRect(bubbleBtn, rect, stage) {
    bubbleBtn.dataset.flyOrigin = JSON.stringify(toStageLocal(rect, stage));
  }

  function readFlyOriginLocal(bubbleBtn) {
    try {
      return JSON.parse(bubbleBtn.dataset.flyOrigin);
    } catch {
      return null;
    }
  }

  function getFlyAnchorStageLocal(page, role, panel, stage) {
    const anchor = SKILL_FLY_ANCHORS[page]?.[role];
    if (!anchor || !panel || !stage) return null;

    const layout = panel.querySelector(".skill-layout");
    if (!layout) return null;

    const wasActive = panel.classList.contains("is-active");
    if (!wasActive) {
      panel.style.visibility = "visible";
      panel.style.opacity = "0";
      panel.style.pointerEvents = "none";
    }

    const lr = layout.getBoundingClientRect();
    const sr = stage.getBoundingClientRect();
    const scale = getStageScale(stage);

    if (!wasActive) {
      panel.style.visibility = "";
      panel.style.opacity = "";
      panel.style.pointerEvents = "";
    }

    if (lr.width <= 0 || lr.height <= 0) return null;

    return {
      x: (lr.left - sr.left) / scale + anchor.x,
      y: (lr.top - sr.top) / scale + anchor.y,
      w: anchor.w,
      h: anchor.h,
    };
  }

  function usesFlyAnchors(page) {
    return Boolean(SKILL_FLY_ANCHORS[page]);
  }

  function measureHeroLocal(panel, stage) {
    const rect = measureHeroRect(panel);
    return rect ? toStageLocal(rect, stage) : null;
  }

  const FLY_TRANSITION =
    "transform 0.52s cubic-bezier(0.22, 1, 0.36, 1), width 0.52s cubic-bezier(0.22, 1, 0.36, 1), height 0.52s cubic-bezier(0.22, 1, 0.36, 1)";

  function applyStageFlyLocal(el, local) {
    el.style.width = `${local.w}px`;
    el.style.height = `${local.h}px`;
    el.style.transform = `translate3d(${local.x}px, ${local.y}px, 0)`;
  }

  function createFlyCloneAtLocal(fromLocal, bob, stage, bubbleBtn) {
    const el = document.createElement("div");
    el.className = "skill-fly-clone";
    if (bubbleBtn) {
      for (let i = 1; i <= 4; i += 1) {
        if (bubbleBtn.classList.contains(`skill-icon-item--${i}`)) {
          el.classList.add(`skill-fly-clone--${i}`);
          break;
        }
      }
    }
    const inner = document.createElement("div");
    inner.className = "skill-fly-clone__inner skill-fly-clone__bob";
    inner.innerHTML = bob.innerHTML;
    el.appendChild(inner);
    stage.appendChild(el);
    applyStageFlyLocal(el, fromLocal);
    return el;
  }

  function animateFlyCloneLocal(clone, fromLocal, toLocal) {
    return new Promise((resolve) => {
      let done = false;
      const finish = () => {
        if (done) return;
        done = true;
        resolve();
      };

      const onEnd = (event) => {
        if (event.propertyName !== "transform") return;
        finish();
      };

      clone.style.transition = "none";
      applyStageFlyLocal(clone, fromLocal);
      void clone.offsetWidth;
      clone.style.transition = FLY_TRANSITION;
      clone.addEventListener("transitionend", onEnd);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          applyStageFlyLocal(clone, toLocal);
        });
      });
      setTimeout(finish, FLY_MS + 80);
    });
  }

  function resolveHubFlyLocal(bubbleBtn, page, hubPanel, stage, bob) {
    if (bubbleBtn?.classList.contains("skill-icon-item--center")) {
      const rect = getFlyArtRect(bob);
      if (rect) {
        const local = toStageLocal(rect, stage);
        bubbleBtn.dataset.flyOrigin = JSON.stringify(local);
        return local;
      }
    }
    return getFlyAnchorStageLocal(page, "hub", hubPanel, stage);
  }

  function resolveHubFlyReturnLocal(bubbleBtn, page, hubPanel, stage, bob) {
    if (bubbleBtn?.classList.contains("skill-icon-item--center")) {
      const rect = getFlyArtRect(bob);
      if (rect) return toStageLocal(rect, stage);
      const cached = readFlyOriginLocal(bubbleBtn);
      if (cached) return cached;
      return resolveHubFlyLocal(bubbleBtn, page, hubPanel, stage, bob);
    }
    return getFlyAnchorStageLocal(page, "hub", hubPanel, stage);
  }

  function applyHeroFlyTransform(hero) {
    if (
      hero.classList.contains("skill-p2-hero") ||
      hero.classList.contains("skill-p3-hero") ||
      hero.classList.contains("skill-p4-hero") ||
      hero.classList.contains("skill-p5-hero")
    ) {
      hero.style.transform = "none";
      return;
    }
    hero.style.transform = "translateX(calc(-50% + 1.5px)) translateY(0)";
  }

  function flyBallForHero(hero) {
    return hero?.closest(".skill-detail-switcher__ball") || null;
  }

  function swapCloneToHero(clone, hero) {
    clone.remove();
    hero.classList.remove("is-fly-hidden");
    const ball = flyBallForHero(hero);
    if (ball) {
      ball.style.transition = "none";
      ball.classList.remove("is-fly-hidden");
      ball.offsetHeight; // Force reflow
      ball.style.transition = "";
    }
    hero.style.opacity = "1";
    hero.style.visibility = "visible";
    applyHeroFlyTransform(hero);
  }

  function measureHeroRect(panel) {
    const hero = panel.querySelector(
      ".skill-p2-hero, .skill-p3-hero, .skill-p4-hero, .skill-p5-hero"
    );
    const bubble = hero?.querySelector(".skill-hero-bubble") || hero;
    if (!bubble || !hero) return null;

    const prevPanel = {
      visibility: panel.style.visibility,
      opacity: panel.style.opacity,
      pointerEvents: panel.style.pointerEvents,
    };
    const prevHero = {
      opacity: hero.style.opacity,
      visibility: hero.style.visibility,
      transform: hero.style.transform,
    };

    panel.style.visibility = "visible";
    panel.style.opacity = "0";
    panel.style.pointerEvents = "none";
    hero.style.opacity = "1";
    hero.style.visibility = "visible";
    applyHeroFlyTransform(hero);

    const rect = bubble.getBoundingClientRect();

    panel.style.visibility = prevPanel.visibility;
    panel.style.opacity = prevPanel.opacity;
    panel.style.pointerEvents = prevPanel.pointerEvents;
    hero.style.opacity = prevHero.opacity;
    hero.style.visibility = prevHero.visibility;
    hero.style.transform = prevHero.transform;
    return rect;
  }

  function setCloseHint(panel, active) {
    panel?.querySelectorAll(".skill-close-btn").forEach((btn) => {
      btn.classList.toggle("is-hint-active", active);
    });
  }

  function initSkillNavigation() {
    const stage = document.getElementById("skillStage");
    const pageSkillsRoot = document.getElementById("page-skills");
    if (!stage) return { scrollGuard() { return false; }, onSkillsHubEnter() {}, onSkillsHubLeave() {}, onSkillsHubSlide() {} };

    function toggleSkillRootClass(name, on) {
      if (pageSkillsRoot) pageSkillsRoot.classList.toggle(name, on);
      else document.body.classList.toggle(name, on);
    }

    const panels = [...stage.querySelectorAll(".skill-panel")];
    if (panels.length < SKILL_PANEL_COUNT) return { scrollGuard() { return false; }, onSkillsHubEnter() {}, onSkillsHubLeave() {}, onSkillsHubSlide() {} };

    const flyerRoot = document.getElementById("skillP2Flyers");
    const flyers = createFlyerController(flyerRoot);
    const p2Layout = stage.querySelector(".skill-layout--p2");
    const p2Power =
      typeof window.createSkillP2PowerController === "function"
        ? window.createSkillP2PowerController(p2Layout, flyers)
        : { start() {}, stop() {} };
    const p3Stage = document.getElementById("skillP3Stage");
    const p3Shield =
      typeof window.createSkillP3ShieldController === "function"
        ? window.createSkillP3ShieldController(p3Stage)
        : { start() {}, stop() {} };
    const p3Layout = stage.querySelector(".skill-layout--p3");
    const p3Defense =
      typeof window.createSkillP3DefenseController === "function"
        ? window.createSkillP3DefenseController(p3Layout, p3Shield)
        : { start() {}, stop() {} };
    const p5Stage = document.getElementById("skillP5Stage");
    const p5Awakening =
      typeof window.createSkillP5AwakeningController === "function"
        ? window.createSkillP5AwakeningController(p5Stage)
        : { start() {}, stop() {} };

    const itemsByPage = panels.map((panel) =>
      [...panel.querySelectorAll(".spatial-reveal")].sort(
        (a, b) => Number(a.dataset.order) - Number(b.dataset.order)
      )
    );

    let isRevealing = false;
    let revealTimers = [];
    let mode = "hub";
    let detailPage = null;
    let isTransitioning = false;
    let activeBubble = null;
    let hubRevealPending = false;
    let pendingDetailPage = null;

    function panelForPage(page) {
      const idx = SKILL_PANEL_INDEX[page];
      return idx != null ? panels[idx] : null;
    }

    function itemsForPage(page) {
      const idx = SKILL_PANEL_INDEX[page];
      return idx != null ? itemsByPage[idx] || [] : [];
    }

    function detailRevealItems(page) {
      return itemsForPage(page).filter((el) => !isHeroEl(el));
    }

    function detailHideItems(page) {
      const panel = panelForPage(page);
      if (!panel) return [];
      return [...panel.querySelectorAll(".spatial-reveal")].filter(
        (el) => !isHeroEl(el)
      );
    }

    function heroForPage(page) {
      return (
        panelForPage(page)?.querySelector(
          ".skill-p2-hero, .skill-p3-hero, .skill-p5-hero"
        ) || null
      );
    }

    function resetHubBubble(btn) {
      if (!btn) return;
      btn.classList.remove("is-flying", "is-pressed", "is-nudge");
      const bob = btn.querySelector(".skill-icon-item__bob");
      resumeBob(bob);
      setRevealState(btn, true, false);
    }

    function swapCloneToBubble(clone, bubbleBtn, bob) {
      clone.remove();
      bubbleBtn.classList.remove("is-flying", "is-pressed", "is-nudge");
      resumeBob(bob);
      setRevealState(bubbleBtn, true, false);
    }

    function resetDetailPage(page) {
      const panel = panelForPage(page);
      const hero = heroForPage(page);
      if (hero) {
        hero.classList.remove("is-fly-hidden");
        hero.style.opacity = "";
        hero.style.visibility = "";
        hero.style.transform = "";
      }
      if (panel) {
        panel.style.opacity = "";
        panel.style.visibility = "";
        panel.style.pointerEvents = "";
      }
      hideTextItemsInstant(itemsForPage(page));
    }

    function ensureHubScrollTop() {
      if (pageSkillsRoot || window.scrollY <= SNAP_EDGE) return;
      window.scrollTo({ top: 0, behavior: "instant" });
    }

    function onDetailScrollLock() {
      if (pageSkillsRoot || mode !== "detail") return;
      if (window.scrollY !== 0) {
        window.scrollTo({ top: 0, behavior: "instant" });
      }
    }

    function syncPageEffects(page) {
      flyers.stop();
      p2Power.stop();
      p3Defense.stop();
      p3Shield.stop();
      p5Awakening.stop();
      if (page === 2) {
        scheduleTimer(() => {
          flyers.start();
          p2Power.start();
        }, PANEL_FADE_MS);
      } else if (page === 3) {
        scheduleTimer(() => {
          p3Shield.start();
          p3Defense.start();
        }, PANEL_FADE_MS);
      } else if (page === 5) {
        scheduleTimer(() => p5Awakening.start(), PANEL_FADE_MS);
      }
    }

    function setHubScrollExitState(el, progress, direction) {
      const p = Math.min(1, Math.max(0, progress));
      el.classList.remove("is-animating");

      if (p <= 0) {
        el.style.opacity = "1";
        el.style.transform = revealTransform(el, 0);
        el.classList.add("is-visible");
        return;
      }

      const lift = (direction === "forward" ? -EXIT_LIFT : EXIT_LIFT) * p;
      el.style.opacity = String(1 - p);
      el.style.transform = revealTransform(el, lift);

      if (p >= 1) {
        el.classList.remove("is-visible");
      }
    }

    function showHubItems(force) {
      if (isRevealing && !force) return;
      itemsForPage(1).forEach((el) => setHubScrollExitState(el, 0, "back"));
    }

    function applySkillHubSlide(y, vh, pageFloat, scrollDir, isSettled) {
      if (mode !== "hub") return;

      if (pageSkillsRoot) {
        const hubPanel = panelForPage(1);
        if (hubPanel) {
          hubPanel.style.transform = "translateY(0)";
          hubPanel.style.opacity = "1";
        }
        showHubItems(true);
        return;
      }

      const skillStage = document.getElementById("skillStage");
      const hubPanel = panelForPage(1);
      if (!skillStage || !hubPanel) return;

      hubPanel.style.opacity = "1";
      hubPanel.style.transform = `translateY(${-y}px)`;

      const onHub = Math.abs(y) <= SNAP_EDGE;
      const between = y > SNAP_EDGE && y < vh - SNAP_EDGE;
      const towardCoach = y > vh * 0.5;
      const hubZoneEnd = vh * 0.12;

      document.body.classList.toggle("skill-scroll-coach", !pageSkillsRoot && y > vh - SNAP_EDGE);

      skillStage.style.visibility = "visible";
      skillStage.style.opacity = "1";
      skillStage.style.pointerEvents = onHub || between ? "auto" : "none";
      hubPanel.style.visibility = "visible";
      skillStage.style.zIndex = between && towardCoach ? "1" : "2";

      if (vh <= 0) return;

      if (isTransitioning) return;

      if (y <= hubZoneEnd) {
        showHubItems(false);
        return;
      }

      if (isRevealing) return;

      const progress = Math.min(
        1,
        Math.max(0, (y - hubZoneEnd) / Math.max(vh * 0.35, 1))
      );
      const dir = scrollDir >= 0 ? "forward" : "back";
      itemsForPage(1).forEach((el) => setHubScrollExitState(el, progress, dir));
    }

    function onSkillsHubSlide(y, vh, pageFloat, scrollDir, isSettled) {
      applySkillHubSlide(y, vh, pageFloat, scrollDir, isSettled);
    }

    function onSkillsHubEnter() {
      hubRevealPending = false;
      toggleSkillRootClass("skill-scroll-coach", false);

      const skillStage = document.getElementById("skillStage");
      const hubPanel = panelForPage(1);
      if (skillStage) {
        skillStage.style.visibility = "visible";
        skillStage.style.opacity = "1";
        skillStage.style.pointerEvents = "auto";
        skillStage.style.zIndex = "2";
      }
      if (hubPanel) {
        hubPanel.style.transform = "translateY(0)";
        hubPanel.style.visibility = "visible";
        hubPanel.style.opacity = "1";
      }

      if (pendingDetailPage && DETAIL_PAGES.includes(pendingDetailPage)) {
        const page = pendingDetailPage;
        pendingDetailPage = null;
        openDetailDirect(page);
        return;
      }

      mode = "hub";
      detailPage = null;
      syncSkillNavIndicator();
      setActivePage(1);
      syncPageEffects(1);

      const items = itemsForPage(1);
      if (areHubItemsVisible()) {
        isRevealing = false;
        items.forEach((el) => setRevealState(el, true, false));
        return;
      }
      if (isRevealing) return;
      playReveal(items, hubPanel);
    }

    function onSkillsHubLeave() {
      hubRevealPending = true;
      isRevealing = false;
    }

    function scrollGuard() {
      return false;
    }

    function syncSwitcherActive(page) {
      stage.querySelectorAll(".skill-detail-switcher").forEach((nav) => {
        nav.dataset.active = String(page);
        nav.querySelectorAll("[data-skill-switch]").forEach((btn) => {
          const on = Number(btn.dataset.skillSwitch) === page;
          btn.setAttribute("aria-current", on ? "true" : "false");
        });
      });
    }

    function switchDetail(targetPage) {
      if (!DETAIL_PAGES.includes(targetPage) || isTransitioning) return;
      if (mode !== "detail") {
        openDetailDirect(targetPage);
        return;
      }
      if (targetPage === detailPage) return;

      isTransitioning = true;
      const fromPage = detailPage;
      flyers.stop();
      p2Power.stop();
      p3Defense.stop();
      p3Shield.stop();
      p5Awakening.stop();
      clearRevealTimers();
      isRevealing = false;

      hideTextItemsInstant(detailHideItems(fromPage));
      resetDetailPage(fromPage);

      detailPage = targetPage;
      activeBubble =
        stage.querySelector(`[data-skill-target="${targetPage}"]`) || activeBubble;
      syncSwitcherActive(targetPage);
      syncSkillNavIndicator();
      setDetailMode(targetPage);

      const hero = heroForPage(targetPage);
      if (hero) {
        hero.classList.remove("is-fly-hidden");
        flyBallForHero(hero)?.classList.remove("is-fly-hidden");
        hero.style.opacity = "";
        hero.style.visibility = "";
        applyHeroFlyTransform(hero);
        setRevealState(hero, true, false);
      }

      showItemsInstant(detailRevealItems(targetPage));
      isTransitioning = false;
    }

    function revealTransform(el, liftPx) {
      const ty = `${liftPx}px`;
      if (isCenteredSkillEl(el)) {
        return `translateX(-50%) translateY(${ty})`;
      }
      return `translateY(${ty})`;
    }

    function setRevealState(el, visible, animate) {
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

      if (!visible && animate) {
        el.classList.add("is-animating", "is-visible");
        requestAnimationFrame(() => {
          requestAnimationFrame(() => {
            el.style.opacity = "0";
            el.style.transform = revealTransform(el, LIFT);
            el.classList.remove("is-visible");
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

    function hideItems(list, animate) {
      list.forEach((el) => setRevealState(el, false, animate));
    }

    function playHide(list) {
      return new Promise((resolve) => {
        if (!list.length) {
          resolve();
          return;
        }
        clearRevealTimers();
        isRevealing = true;
        const reversed = [...list].reverse();
        reversed.forEach((el, index) => {
          scheduleTimer(
            () => setRevealState(el, false, true),
            index * HIDE_STAGGER_MS
          );
        });
        const totalMs =
          Math.max(0, reversed.length - 1) * HIDE_STAGGER_MS + REVEAL_MS;
        scheduleTimer(() => {
          isRevealing = false;
          resolve();
        }, totalMs);
      });
    }

    function hubItemsExcept(exceptEl) {
      return itemsForPage(1).filter((el) => el !== exceptEl);
    }

    function areHubItemsVisible() {
      return itemsForPage(1).every(
        (el) =>
          el.classList.contains("is-visible") &&
          parseFloat(el.style.opacity || "0") > 0.92
      );
    }

    function hideTextItemsInstant(list) {
      list.forEach((el) => {
        el.classList.remove("is-animating", "is-visible");
        el.style.opacity = "0";
        el.style.transform = revealTransform(el, LIFT);
      });
    }

    function showItemsInstant(list) {
      list.forEach((el) => {
        el.classList.remove("is-animating");
        setRevealState(el, true, false);
      });
    }

    function playReveal(list, panel) {
      clearRevealTimers();
      isRevealing = true;
      hideItems(list, false);
      panel.classList.remove("is-fading-out");

      list.forEach((el, index) => {
        scheduleTimer(() => setRevealState(el, true, true), index * STAGGER_MS);
      });

      const totalMs = Math.max(0, list.length - 1) * STAGGER_MS + REVEAL_MS;
      scheduleTimer(() => {
        isRevealing = false;
      }, totalMs);
    }

    function setActivePage(page) {
      panels.forEach((panel) => {
        const panelPage = Number(panel.dataset.page);
        const active = panelPage === page;
        panel.classList.toggle("is-active", active);
        panel.setAttribute("aria-hidden", active ? "false" : "true");
        panel.style.transform = "translateY(0)";
        panel.style.zIndex = active ? "2" : "1";
      });
    }

    function syncSkillNavIndicator() {
      const payload = {
        mode,
        detailPage,
        nav: mode === "detail" && detailPage ? SKILL_NAV_BY_PAGE[detailPage] : "20",
      };
      document.dispatchEvent(
        new CustomEvent("skill-nav-change", { detail: payload })
      );
      if (window.parent !== window.self) {
        window.parent.postMessage({ type: "tennis-report-skill-nav", ...payload }, "*");
      }
    }

    function setHubMode(options = {}) {
      mode = "hub";
      detailPage = null;
      syncSkillNavIndicator();
      toggleSkillRootClass("skill-mode-detail", false);
      ensureHubScrollTop();
      if (!pageSkillsRoot && window.scrollY <= SNAP_EDGE) {
        toggleSkillRootClass("skill-scroll-coach", false);
      }
      setActivePage(1);
      syncPageEffects(1);

      if (!options.skipHubReveal) {
        if (pageSkillsRoot) {
          showHubItems(true);
        } else {
          const vh = window.innerHeight;
          applySkillHubSlide(window.scrollY, vh, vh > 0 ? window.scrollY / vh : 0, 0, true);
        }
      }
    }

    function setDetailMode(page) {
      mode = "detail";
      detailPage = page;
      syncSwitcherActive(page);
      syncSkillNavIndicator();
      toggleSkillRootClass("skill-mode-detail", true);
      setActivePage(page);
      syncPageEffects(page);
    }

    function openDetailDirect(page) {
      if (!DETAIL_PAGES.includes(page) || isTransitioning) return false;

      const targetPanel = panelForPage(page);
      const hero = heroForPage(page);
      const bubbleBtn = stage.querySelector(`[data-skill-target="${page}"]`);
      const bob = bubbleBtn?.querySelector(".skill-icon-item__bob");
      if (!targetPanel || !hero || !bubbleBtn || !bob) return false;

      clearRevealTimers();
      isRevealing = false;
      isTransitioning = false;
      ensureHubScrollTop();

      if (activeBubble && activeBubble !== bubbleBtn) {
        resetHubBubble(activeBubble);
      }

      activeBubble = bubbleBtn;
      pauseBob(bob);
      hubItemsExcept(activeBubble).forEach((el) => setRevealState(el, false, false));
      setRevealState(activeBubble, false, false);

      setDetailMode(page);
      hero.classList.remove("is-fly-hidden");
      flyBallForHero(hero)?.classList.remove("is-fly-hidden");
      hero.style.opacity = "";
      hero.style.visibility = "";
      applyHeroFlyTransform(hero);
      setRevealState(hero, true, false);
      showItemsInstant(detailRevealItems(page));
      return true;
    }

    async function openDetail(targetPage, bubbleBtn) {
      if (isTransitioning || mode !== "hub" || !bubbleBtn) return;
      ensureHubScrollTop();
      if (!pageSkillsRoot && window.scrollY > SNAP_EDGE) return;

      const targetPanel = panelForPage(targetPage);
      const hero = heroForPage(targetPage);
      const bob = bubbleBtn.querySelector(".skill-icon-item__bob");
      if (!hero || !bob) return;

      isTransitioning = true;
      activeBubble = bubbleBtn;

      const hubOthers = hubItemsExcept(activeBubble);
      const hideHubPromise = playHide(hubOthers);

      pauseBob(bob);
      await waitFrames(2);

      const hubPanel = panelForPage(1);
      let fromLocal = null;

      if (usesFlyAnchors(targetPage)) {
        fromLocal = resolveHubFlyLocal(
          bubbleBtn,
          targetPage,
          hubPanel,
          stage,
          bob
        );
      } else {
        const fromRect = getFlyArtRect(bob);
        if (fromRect) {
          cacheFlyOriginRect(bubbleBtn, fromRect, stage);
          fromLocal = readFlyOriginLocal(bubbleBtn);
        }
      }

      if (!fromLocal) {
        resumeBob(bob);
        isTransitioning = false;
        activeBubble = null;
        return;
      }

      hero.classList.add("is-fly-hidden");
      flyBallForHero(hero)?.classList.add("is-fly-hidden");
      hideTextItemsInstant(itemsForPage(targetPage));

      const clone = createFlyCloneAtLocal(fromLocal, bob, stage, bubbleBtn);
      stage.classList.add("is-fly-active");
      await waitFrames(2);

      bubbleBtn.classList.add("is-flying");
      setDetailMode(targetPage);
      await waitFrames(1);

      const toLocal = usesFlyAnchors(targetPage)
        ? getFlyAnchorStageLocal(targetPage, "hero", targetPanel, stage)
        : measureHeroLocal(targetPanel, stage);
      if (!toLocal) {
        clone.remove();
        stage.classList.remove("is-fly-active");
        bubbleBtn.classList.remove("is-flying");
        hero.classList.remove("is-fly-hidden");
        resumeBob(bob);
        setHubMode();
        isTransitioning = false;
        activeBubble = null;
        return;
      }

      await Promise.all([
        hideHubPromise,
        animateFlyCloneLocal(clone, fromLocal, toLocal),
      ]);
      swapCloneToHero(clone, hero);
      stage.classList.remove("is-fly-active");

      bubbleBtn.classList.remove("is-flying");
      setRevealState(bubbleBtn, false, false);
      await waitMs(Math.min(PANEL_FADE_MS, 220));
      playReveal(detailRevealItems(targetPage), targetPanel);

      isTransitioning = false;
    }

    async function closeDetail() {
      if (isTransitioning || mode !== "detail" || !detailPage || !activeBubble) return;

      const page = detailPage;
      const targetPanel = panelForPage(page);
      const hero = heroForPage(page);
      const bob = activeBubble.querySelector(".skill-icon-item__bob");
      if (!hero || !bob) return;

      isTransitioning = true;
      setCloseHint(targetPanel, false);
      clearRevealTimers();
      isRevealing = false;
      syncPageEffects(0);

      await playHide(detailHideItems(page));

      pauseBob(bob);

      const hubPanel = panelForPage(1);
      let fromLocal = null;
      let toLocal = null;

      if (usesFlyAnchors(page)) {
        fromLocal = getFlyAnchorStageLocal(page, "hero", targetPanel, stage);
      } else {
        const heroBubble =
          hero.querySelector(".skill-hero-bubble") ||
          hero.querySelector(".skill-hero-bubble__img");
        const heroRect = (heroBubble || hero).getBoundingClientRect();
        fromLocal = toStageLocal(heroRect, stage);
        toLocal = readFlyOriginLocal(activeBubble);
      }

      hero.classList.add("is-fly-hidden");

      if (!fromLocal || (!usesFlyAnchors(page) && !toLocal)) {
        hero.classList.remove("is-fly-hidden");
        resumeBob(bob);
        isTransitioning = false;
        return;
      }

      const clone = createFlyCloneAtLocal(fromLocal, bob, stage, activeBubble);
      stage.classList.add("is-fly-active");
      await waitFrames(2);

      activeBubble.classList.add("is-flying");
      setHubMode({ skipHubReveal: true });
      await waitFrames(1);

      if (usesFlyAnchors(page)) {
        toLocal = resolveHubFlyReturnLocal(
          activeBubble,
          page,
          hubPanel,
          stage,
          bob
        );
      }

      if (!toLocal) {
        clone.remove();
        stage.classList.remove("is-fly-active");
        activeBubble.classList.remove("is-flying");
        hero.classList.remove("is-fly-hidden");
        resumeBob(bob);
        isTransitioning = false;
        return;
      }

      await animateFlyCloneLocal(clone, fromLocal, toLocal);
      swapCloneToBubble(clone, activeBubble, bob);
      stage.classList.remove("is-fly-active");

      playReveal(hubItemsExcept(activeBubble), panelForPage(1));
      if (pageSkillsRoot) {
        showHubItems(true);
      } else {
        const vh = window.innerHeight;
        applySkillHubSlide(window.scrollY, vh, vh > 0 ? window.scrollY / vh : 0, 0, true);
      }

      resetDetailPage(page);
      activeBubble = null;
      isTransitioning = false;
    }

    stage.querySelectorAll("[data-skill-target]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const page = Number(btn.dataset.skillTarget);
        if (DETAIL_PAGES.includes(page)) {
          openDetail(page, btn);
        }
      });
    });

    stage.querySelectorAll(".skill-icon-item--soon").forEach((el) => {
      el.addEventListener("click", () => {
        el.classList.remove("is-nudge");
        void el.offsetWidth;
        el.classList.add("is-nudge");
      });
    });

    stage.querySelectorAll("[data-skill-switch]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const page = Number(btn.dataset.skillSwitch);
        if (DETAIL_PAGES.includes(page)) {
          switchDetail(page);
        }
      });
    });

    bindTapFeedback(stage);

    if (!pageSkillsRoot) {
      window.addEventListener("scroll", onDetailScrollLock, { passive: true });
    }

    if (!pageSkillsRoot) {
      window.scrollTo({ top: 0, behavior: "instant" });
    }
    setHubMode();
    DETAIL_PAGES.forEach((p) => {
      hideTextItemsInstant(itemsForPage(p));
    });
    showItemsInstant(itemsForPage(1));
    isRevealing = false;
    showHubItems(true);

    syncSkillNavIndicator();

    return {
      scrollGuard,
      onSkillsHubEnter,
      onSkillsHubLeave,
      onSkillsHubSlide,
      openDetailDirect,
      switchDetail,
      goToHub() {
        if (mode === "detail" && activeBubble) {
          closeDetail();
          return;
        }
        setHubMode();
        showItemsInstant(itemsForPage(1));
      },
      setPendingDetail(page) {
        pendingDetailPage = DETAIL_PAGES.includes(page) ? page : null;
      },
      getNavState() {
        return {
          mode,
          detailPage,
          nav: mode === "detail" && detailPage ? SKILL_NAV_BY_PAGE[detailPage] : "20",
        };
      },
    };
  }

  document.addEventListener("DOMContentLoaded", () => {
    Promise.all([
      loadJsonData("SKILLS_POWER", POWER_DATA_URL).catch(() => null),
      loadJsonData("SKILLS_DEFENSE", DEFENSE_DATA_URL).catch(() => null),
      loadJsonData("SKILLS_AWAKENING", AWAKENING_DATA_URL).catch(() => null),
    ]).then(([power, defense, awakening]) => {
      applyDisplayCounts(power);
      document.querySelectorAll('[data-text="skill_name"]').forEach((el) => {
        if (power?.skill_name) el.textContent = power.skill_name;
      });
      applyDisplayCounts(defense);
      applyDisplayText(defense, "skill_name_p3");
      applyDisplayCounts(awakening);
      applyDisplayText(awakening, "skill_name_p5");

      window.SkillsModule = initSkillNavigation();
    });
  });
})();
