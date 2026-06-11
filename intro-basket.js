/**
 * 开场第二页 · 网球落筐（Figma 225:4）
 * 图层：Basket-back → 动态网球（canvas）→ Basket-front
 */
(function () {
  "use strict";

  const DESIGN_W = 440;
  const DESIGN_H = 956;
  const GRAVITY = 2200;
  const RESTITUTION = 0.48;
  const WALL_RESTITUTION = 0.38;
  const FRICTION = 0.992;
  const SPAWN_INTERVAL = 0.0275;
  /** 持续约 2.5 秒后停止生成新下落球（原时长 1/2） */
  const SPAWN_DURATION = 2.5;
  const MAX_LIVE = 96;
  /** 下落球砸到球堆后，向左右弹飞并出界的概率 */
  const PILE_EJECT_CHANCE = 0.2;
  const EJECT_VX_MIN = 300;
  const EJECT_VX_MAX = 560;
  const EJECT_VY_MIN = -480;
  const EJECT_VY_MAX = -240;
  /** 完全离开可视区域后才移除（含飞出界外） */
  const OFFSCREEN_MARGIN = 72;
  const BALL_SIZE = 51;
  const BALL_R = BALL_SIZE / 2;
  const COLLISION_PASSES = 6;
  const SETTLE_SPEED = 24;
  const SETTLE_SPIN = 1.4;
  const SETTLE_HOLD = 0.9;
  const SETTLE_SNAP = 0.45;
  const CALM_FRICTION = 0.968;
  const CALM_RESTITUTION = 0.28;
  const MOUND_RELAX_DURATION = 2.4;
  /** 落球停生后 → 降雨的间隔（ms） */
  const RAIN_HANDOFF_DELAY_MS = 2200;
  const SETTLE_FALLBACK_MS = SPAWN_DURATION * 1000 + RAIN_HANDOFF_DELAY_MS + 200;
  const MOUND_CENTER_X = 215;
  const MOUND_PEAK_LIFT = 52;
  /** 球堆最底端与页面底边间距（设计稿 956px 高） */
  const PILE_BOTTOM_GAP = 24;
  const BIN_FLOOR_Y = DESIGN_H - PILE_BOTTOM_GAP;

  /** 与 CSS .page-basket__front top 对齐 · 低于此且筐内 → back 层，由 front 图遮挡 */
  const BASKET_FRONT_TOP = 744;
  const CANVAS_EXTRA_BOTTOM = 56;
  const CANVAS_EXTRA_FRONT = 200;

  const BIN = {
    rimY: 718,
    floorY: BIN_FLOOR_Y,
    leftRimX: 98,
    rightRimX: 338,
    leftFloorX: 72,
    rightFloorX: 358,
  };

  /** 筐沿上方：仍在 back 层绘制；越过筐沿溢出到 front 层 */
  const RIM_OVERFLOW_BAND = 28;

  const BALL_STYLE_SRC = ["assets/page-basket/ball.svg"];
  /** 下落球双色层：dim 在后、normal 在前 */
  const FALL_SHADE_DIM = "dim";
  const FALL_SHADE_NORMAL = "normal";
  const DIM_BALL_BRIGHTNESS = 0.68;
  const DIM_BALL_SATURATE = 0.82;

  /** 初始球堆布局：沿小山包曲面分层 */
  const PILE_MOUND_SLOTS = [
    { x: 215, lift: 0 },
    { x: 178, lift: 1 },
    { x: 252, lift: 1 },
    { x: 148, lift: 2 },
    { x: 282, lift: 2 },
    { x: 198, lift: 2 },
    { x: 232, lift: 2 },
    { x: 128, lift: 3 },
    { x: 305, lift: 3 },
    { x: 165, lift: 3 },
    { x: 268, lift: 3 },
    { x: 215, lift: 4 },
  ];

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function wallXAtY(y, side) {
    const t = Math.max(0, Math.min(1, (y - BIN.rimY) / (BIN.floorY - BIN.rimY)));
    if (side === "left") return lerp(BIN.leftRimX, BIN.leftFloorX, t);
    return lerp(BIN.rightRimX, BIN.rightFloorX, t);
  }

  function pickStyleIndex() {
    return 0;
  }

  function createBall(x, y, opts = {}) {
    return {
      x,
      y,
      vx: opts.vx ?? 0,
      vy: opts.vy ?? 0,
      r: BALL_R,
      settled: Boolean(opts.settled),
      overflow: Boolean(opts.overflow),
      style: opts.style ?? pickStyleIndex(),
      rot: opts.rot ?? Math.random() * Math.PI * 2,
      rotV: opts.rotV ?? (Math.random() - 0.5) * 4,
      fade: 1,
      layer: opts.layer ?? "back",
      ejecting: Boolean(opts.ejecting),
      pile: Boolean(opts.pile),
      shade: opts.shade ?? FALL_SHADE_NORMAL,
      restTimer: 0,
      frozen: Boolean(opts.frozen),
    };
  }

  function sameShade(a, b) {
    return a.shade === b.shade;
  }

  function moundSurfaceY(x) {
    const halfWidth = 108;
    const floor = BIN.floorY - BALL_R;
    const peak = floor - MOUND_PEAK_LIFT;
    const t = Math.min(1, Math.abs(x - MOUND_CENTER_X) / halfWidth);
    return lerp(peak, floor, t * t);
  }

  function isPileBall(b) {
    if (b.frozen || b.pile) return true;
    return b.y + b.r > BIN.rimY + 8 && Math.hypot(b.vx, b.vy) < 72;
  }

  function kineticEnergy(b) {
    return b.vx * b.vx + b.vy * b.vy;
  }

  function maybeEjectFromPile(dynamic, pile, calmPhase) {
    if (!sameShade(dynamic, pile)) return;
    if (calmPhase || dynamic.ejecting || dynamic.frozen || !isPileBall(pile)) return;
    if (dynamic.vy < 90) return;
    if (Math.random() > PILE_EJECT_CHANCE) return;

    dynamic.frozen = false;
    dynamic.restTimer = 0;
    dynamic.ejecting = true;
    const side = dynamic.x <= pile.x ? -1 : 1;
    const jitter = 0.75 + Math.random() * 0.55;
    dynamic.vx = side * (EJECT_VX_MIN + Math.random() * (EJECT_VX_MAX - EJECT_VX_MIN)) * jitter;
    dynamic.vy =
      EJECT_VY_MIN + Math.random() * (EJECT_VY_MAX - EJECT_VY_MIN);
    dynamic.rotV = side * (5 + Math.random() * 9);
    updateBallLayer(dynamic);
  }

  function loadBallStyles() {
    return BALL_STYLE_SRC.map((src) => {
      const img = new Image();
      img.src = src;
      return img;
    });
  }

  function isInsideBinX(x, y) {
    const inset = BALL_R * 0.32;
    const left = wallXAtY(Math.min(y, BIN.floorY), "left") + inset;
    const right = wallXAtY(Math.min(y, BIN.floorY), "right") - inset;
    return x >= left && x <= right;
  }

  /** 球堆与筐内静止球：back 层（在 basket-front 后、basket-back 前） */
  function isPileLayerBall(b) {
    return b.pile || (b.frozen && !b.ejecting && isInsideBinX(b.x, b.y));
  }

  function isOverflowBall(b) {
    if (b.ejecting || b.overflow) return true;
    if (!isInsideBinX(b.x, b.y) && b.y + b.r > BIN.rimY - 16) return true;
    if (!b.pile && !b.frozen && b.vy < -80 && b.y + b.r < BIN.rimY + RIM_OVERFLOW_BAND) {
      return true;
    }
    return false;
  }

  function isBehindBasketFront(b) {
    if (isOverflowBall(b)) return false;
    if (!isInsideBinX(b.x, b.y)) return false;
    if (isPileLayerBall(b)) return true;
    return b.y + b.r * 0.35 > BIN.rimY - 6;
  }

  function updateBallLayer(b) {
    if (isOverflowBall(b)) {
      b.layer = "front";
      b.overflow = true;
      return;
    }

    if (isPileLayerBall(b)) {
      b.layer = "back";
      b.overflow = false;
      return;
    }

    if (!isInsideBinX(b.x, b.y)) {
      b.layer = "front";
      b.overflow = false;
      return;
    }

    if (isBehindBasketFront(b)) {
      b.layer = "back";
      b.overflow = false;
      return;
    }

    b.layer = "front";
    b.overflow = false;
  }

  function smoothstep(t) {
    const x = Math.max(0, Math.min(1, t));
    return x * x * (3 - 2 * x);
  }

  function createBasketPhysics(canvasBack, canvasFront, layoutEl, numberEl) {
    const ctxBack = canvasBack.getContext("2d");
    const ctxFront = canvasFront.getContext("2d");
    const ballImgs = loadBallStyles();
    const balls = [];
    let running = false;
    let rafId = 0;
    let lastTs = 0;
    let spawnAcc = 0;
    let spawnElapsed = 0;
    let spawning = true;
    let spawnDimNext = false;
    let calmPhase = false;
    let moundRelaxT = 0;
    let scale = 1;
    let settledFired = false;
    let onSettled = null;
    let settleFallbackTimer = null;
    let rainHandoffTimer = null;
    let spawnComplete = false;

    function fireSettled() {
      if (settledFired || !running) return;
      settledFired = true;
      clearTimeout(settleFallbackTimer);
      clearTimeout(rainHandoffTimer);
      settleFallbackTimer = null;
      rainHandoffTimer = null;
      onSettled?.();
    }

    function scheduleSettleFallback() {
      clearTimeout(settleFallbackTimer);
      settleFallbackTimer = setTimeout(fireSettled, SETTLE_FALLBACK_MS);
    }

    function scheduleRainHandoff() {
      if (spawnComplete || settledFired || !running) return;
      spawnComplete = true;
      clearTimeout(rainHandoffTimer);
      rainHandoffTimer = setTimeout(fireSettled, RAIN_HANDOFF_DELAY_MS);
    }

    function clearSettleTimers() {
      clearTimeout(settleFallbackTimer);
      clearTimeout(rainHandoffTimer);
      settleFallbackTimer = null;
      rainHandoffTimer = null;
      spawnComplete = false;
    }

    function isInBin(b) {
      return b.y + b.r > BIN.rimY && isInsideBinX(b.x, b.y);
    }

    function maybeEnterCalmPhase() {
      if (spawning || calmPhase || fallingBallCount() > 0) return;
      calmPhase = true;
    }

    function stackTargetY(b) {
      let top = moundSurfaceY(b.x) - b.r;
      for (const other of balls) {
        if (other === b) continue;
        if (!sameShade(b, other)) continue;
        if (Math.abs(b.x - other.x) >= BALL_SIZE * 0.92) continue;
        const under = other.y - BALL_R * 2 - 1.5;
        if (under < top) top = under;
      }
      return top;
    }

    function updateRestState(b, dt) {
      if (b.frozen || b.ejecting) return;
      const inBin = b.y + b.r > BIN.rimY && isInsideBinX(b.x, b.y);
      if (!inBin) {
        b.restTimer = 0;
        return;
      }
      const speed = Math.hypot(b.vx, b.vy);
      if (speed > SETTLE_SPEED || Math.abs(b.rotV) > SETTLE_SPIN) {
        b.restTimer = 0;
        return;
      }
      b.restTimer += dt;
      const damp = calmPhase ? 0.86 : 0.93;
      b.vx *= damp;
      b.vy *= damp;
      b.rotV *= damp;
      if (b.restTimer > SETTLE_HOLD) {
        const snap = Math.min(1, (b.restTimer - SETTLE_HOLD) / SETTLE_SNAP);
        b.vx *= 1 - snap * 0.38;
        b.vy *= 1 - snap * 0.38;
        b.rotV *= 1 - snap * 0.5;
      }
      if (b.restTimer >= SETTLE_HOLD + SETTLE_SNAP) {
        b.frozen = true;
        b.pile = true;
        b.settled = true;
        b.vx = 0;
        b.vy = 0;
        b.rotV = 0;
      }
    }

    function applyMoundRelax(dt) {
      if (!calmPhase) return;
      const stillMoving = balls.some((b) => {
        if (b.frozen || b.ejecting || !isInsideBinX(b.x, b.y)) return false;
        return Math.hypot(b.vx, b.vy) > SETTLE_SPEED * 0.85;
      });
      moundRelaxT = Math.min(1, moundRelaxT + dt / MOUND_RELAX_DURATION);
      const moveFactor = stillMoving ? 0.35 : 1;
      const k = smoothstep(moundRelaxT) * 3.8 * dt * moveFactor;
      const pinch = 0.2 * smoothstep(moundRelaxT);

      for (const b of balls) {
        if (b.ejecting || !isInsideBinX(b.x, b.y)) continue;
        if (b.y + b.r < BIN.rimY + 24) continue;
        const targetY = stackTargetY(b);
        const targetX = MOUND_CENTER_X + (b.x - MOUND_CENTER_X) * (1 - pinch);
        b.x += (targetX - b.x) * k;
        b.y += (targetY - b.y) * k * 0.9;
      }
    }
    const targetCount = numberEl
      ? Math.max(0, parseInt(numberEl.dataset.count, 10) || 0)
      : 0;

    function updateHitCount() {
      if (!numberEl || !targetCount) return;
      const progress = spawning
        ? Math.min(1, spawnElapsed / SPAWN_DURATION)
        : 1;
      numberEl.textContent = String(Math.round(targetCount * smoothstep(progress)));
    }

    function resetHitCount() {
      if (numberEl) numberEl.textContent = "0";
    }

    function resize() {
      const rect = layoutEl.getBoundingClientRect();
      scale = rect.width / DESIGN_W;
      const drawW = rect.width;
      const backH = rect.height + CANVAS_EXTRA_BOTTOM * scale;
      const frontH = rect.height + CANVAS_EXTRA_FRONT * scale;
      canvasBack.width = Math.round(drawW * devicePixelRatio);
      canvasBack.height = Math.round(backH * devicePixelRatio);
      canvasBack.style.width = `${drawW}px`;
      canvasBack.style.height = `${backH}px`;
      canvasFront.width = Math.round(drawW * devicePixelRatio);
      canvasFront.height = Math.round(frontH * devicePixelRatio);
      canvasFront.style.width = `${drawW}px`;
      canvasFront.style.height = `${frontH}px`;
      ctxBack.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
      ctxFront.setTransform(devicePixelRatio, 0, 0, devicePixelRatio, 0, 0);
    }

    function seedPileBalls() {
      let seedDimNext = false;
      PILE_MOUND_SLOTS.forEach(({ x, lift }) => {
        seedDimNext = !seedDimNext;
        const shade = seedDimNext ? FALL_SHADE_DIM : FALL_SHADE_NORMAL;
        const y = moundSurfaceY(x) - BALL_R - lift * (BALL_SIZE * 0.84);
        const b = createBall(
          x + (Math.random() - 0.5) * 8,
          y + (Math.random() - 0.5) * 4,
          { pile: true, frozen: false, vx: 0, vy: 0, rotV: 0, shade }
        );
        updateBallLayer(b);
        balls.push(b);
      });
    }

    function fallingBallCount() {
      return balls.filter((b) => !b.frozen && !b.pile && !b.ejecting).length;
    }

    function spawnFallingBall() {
      if (!spawning || fallingBallCount() >= MAX_LIVE) return;
      const margin = 28;
      const x = margin + BALL_R + Math.random() * (DESIGN_W - margin * 2 - BALL_R * 2);
      spawnDimNext = !spawnDimNext;
      const b = createBall(x, -BALL_R - Math.random() * 220, {
        vx: (Math.random() - 0.5) * 95,
        vy: 140 + Math.random() * 160,
        shade: spawnDimNext ? FALL_SHADE_DIM : FALL_SHADE_NORMAL,
      });
      updateBallLayer(b);
      balls.push(b);
    }

    function resolveBallWall(b) {
      if (b.ejecting) {
        updateBallLayer(b);
        return;
      }

      if (b.y + b.r > BIN.floorY) {
        b.y = BIN.floorY - b.r;
        const rest = calmPhase ? CALM_RESTITUTION : RESTITUTION;
        const hitThreshold = calmPhase ? 50 : 42;
        if (Math.abs(b.vy) > hitThreshold) {
          b.vy = -Math.abs(b.vy) * rest;
          b.vx *= calmPhase ? 0.88 : FRICTION;
        } else {
          b.vy *= calmPhase ? 0.38 : 0.52;
          b.vx *= 0.78;
          b.rotV *= 0.84;
        }
      }

      if (b.y + b.r < BIN.rimY - BALL_R * 0.35) {
        return;
      }

      const yClamp = Math.min(b.y, BIN.floorY);
      const inset = b.r * 0.34;
      const left = wallXAtY(yClamp, "left") + inset;
      const right = wallXAtY(yClamp, "right") - inset;

      if (b.x - b.r < left) {
        b.x = left + b.r;
        b.vx = Math.abs(b.vx) * WALL_RESTITUTION;
      }
      if (b.x + b.r > right) {
        b.x = right - b.r;
        b.vx = -Math.abs(b.vx) * WALL_RESTITUTION;
      }

      if (b.y + b.r >= BIN.rimY && !isInsideBinX(b.x, b.y)) {
        if (b.vy > 0 && b.y + b.r > BIN.rimY + 4) {
          b.overflow = true;
        }
      }

      updateBallLayer(b);
    }

    function resolveBallBall(a, b) {
      if (!sameShade(a, b)) return;
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      const dist = Math.hypot(dx, dy);
      const minDist = a.r + b.r;
      if (dist >= minDist || dist === 0) return;

      const nx = dx / dist;
      const ny = dy / dist;
      const overlap = minDist - dist;
      a.x -= nx * overlap * 0.5;
      a.y -= ny * overlap * 0.5;
      b.x += nx * overlap * 0.5;
      b.y += ny * overlap * 0.5;

      const dvx = a.vx - b.vx;
      const dvy = a.vy - b.vy;
      const vn = dvx * nx + dvy * ny;
      if (vn > 0) return;

      const rest = calmPhase ? CALM_RESTITUTION : RESTITUTION;
      const impulse = (-(1 + rest) * vn) / 2;
      a.vx += impulse * nx;
      a.vy += impulse * ny;
      b.vx -= impulse * nx;
      b.vy -= impulse * ny;
      a.frozen = false;
      b.frozen = false;
      a.restTimer = 0;
      b.restTimer = 0;

      const keA = kineticEnergy(a);
      const keB = kineticEnergy(b);
      if (keA > keB + 800) maybeEjectFromPile(a, b, calmPhase);
      else if (keB > keA + 800) maybeEjectFromPile(b, a, calmPhase);

      updateBallLayer(a);
      updateBallLayer(b);
    }

    function isOffScreen(b) {
      if (b.pile) return false;
      const m = OFFSCREEN_MARGIN;
      const bottomExtra = b.layer === "front" ? CANVAS_EXTRA_FRONT : CANVAS_EXTRA_BOTTOM;
      if (b.x + b.r < -m) return true;
      if (b.x - b.r > DESIGN_W + m) return true;
      if (b.y - b.r > DESIGN_H + bottomExtra + m) return true;
      if (b.y + b.r < -m) return true;
      return false;
    }

    function step(dt) {
      if (spawning) {
        spawnElapsed += dt;
        if (spawnElapsed >= SPAWN_DURATION) {
          spawning = false;
          spawnAcc = 0;
          scheduleRainHandoff();
        } else {
          spawnAcc += dt;
          while (spawnAcc >= SPAWN_INTERVAL) {
            spawnAcc -= SPAWN_INTERVAL;
            spawnFallingBall();
          }
        }
      }

      for (const b of balls) {
        if (!b.frozen) {
          b.vy += (b.ejecting ? GRAVITY * 0.82 : GRAVITY) * dt;
          b.x += b.vx * dt;
          b.y += b.vy * dt;
          b.vx *= b.ejecting ? 0.9985 : FRICTION;
          b.rot += b.rotV * dt;
          if (calmPhase && !b.ejecting && (b.pile || isInBin(b))) {
            b.vx *= CALM_FRICTION;
            b.vy *= CALM_FRICTION;
            b.rotV *= 0.93;
          }
        }
      }

      for (let pass = 0; pass < COLLISION_PASSES; pass += 1) {
        for (const b of balls) {
          resolveBallWall(b);
        }
        for (let i = 0; i < balls.length; i += 1) {
          for (let j = i + 1; j < balls.length; j += 1) {
            resolveBallBall(balls[i], balls[j]);
          }
        }
      }

      for (const b of balls) {
        updateRestState(b, dt);
      }

      applyMoundRelax(dt);
      maybeEnterCalmPhase();

      for (const b of balls) {
        updateBallLayer(b);
      }

      for (let i = balls.length - 1; i >= 0; i -= 1) {
        if (isOffScreen(balls[i])) {
          balls.splice(i, 1);
        }
      }

      updateHitCount();
    }

    function drawBall(ctx, b) {
      const img = ballImgs[b.style];
      const isDim = b.shade === FALL_SHADE_DIM;
      ctx.save();
      ctx.globalAlpha = 1;
      if (isDim) {
        ctx.filter = `brightness(${DIM_BALL_BRIGHTNESS}) saturate(${DIM_BALL_SATURATE})`;
      }
      if (img?.complete && img.naturalWidth) {
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.drawImage(img, -BALL_R, -BALL_R, BALL_SIZE, BALL_SIZE);
      } else {
        ctx.translate(b.x, b.y);
        ctx.rotate(b.rot);
        ctx.beginPath();
        ctx.fillStyle = isDim ? "#8fb300" : "#c7f900";
        ctx.strokeStyle = isDim ? "#6d9200" : "#9bc400";
        ctx.lineWidth = 2;
        ctx.arc(0, 0, BALL_R, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
      }
      ctx.restore();
    }

    function drawLayer(ctx, canvas, layer) {
      const cw = canvas.width / devicePixelRatio;
      const ch = canvas.height / devicePixelRatio;
      ctx.clearRect(0, 0, cw, ch);
      ctx.save();
      ctx.scale(scale, scale);
      for (const b of balls) {
        if (b.layer !== layer || !b.pile) continue;
        drawBall(ctx, b);
      }
      for (const b of balls) {
        if (b.layer !== layer || b.pile || b.shade !== FALL_SHADE_DIM) continue;
        drawBall(ctx, b);
      }
      for (const b of balls) {
        if (b.layer !== layer || b.pile || b.shade !== FALL_SHADE_NORMAL) continue;
        drawBall(ctx, b);
      }
      ctx.restore();
    }

    function draw() {
      drawLayer(ctxBack, canvasBack, "back");
      drawLayer(ctxFront, canvasFront, "front");
    }

    function loop(ts) {
      if (!running) return;
      if (!lastTs) lastTs = ts;
      const dt = Math.min(0.032, (ts - lastTs) / 1000);
      lastTs = ts;
      step(dt);
      draw();
      rafId = requestAnimationFrame(loop);
    }

    function clearCanvases() {
      ctxBack.clearRect(0, 0, canvasBack.width, canvasBack.height);
      ctxFront.clearRect(0, 0, canvasFront.width, canvasFront.height);
    }

    return {
      start() {
        if (running) return;
        resize();
        running = true;
        lastTs = 0;
        spawnAcc = 0;
        spawnElapsed = 0;
        spawning = true;
        calmPhase = false;
        moundRelaxT = 0;
        spawnDimNext = false;
        settledFired = false;
        balls.length = 0;
        resetHitCount();
        seedPileBalls();
        scheduleSettleFallback();
        rafId = requestAnimationFrame(loop);
      },
      stop() {
        running = false;
        clearSettleTimers();
        if (rafId) cancelAnimationFrame(rafId);
        rafId = 0;
      },
      reset() {
        this.stop();
        balls.length = 0;
        spawnAcc = 0;
        spawnElapsed = 0;
        spawning = true;
        calmPhase = false;
        moundRelaxT = 0;
        spawnDimNext = false;
        settledFired = false;
        resetHitCount();
        clearCanvases();
      },
      setOnSettled(fn) {
        onSettled = typeof fn === "function" ? fn : null;
      },
      isRunning() {
        return running;
      },
      resize,
    };
  }

  window.initIntroBasketPage = function (pageEl) {
    const canvasBack = pageEl.querySelector(".page-basket__canvas--back");
    const canvasFront = pageEl.querySelector(".page-basket__canvas--front");
    const layout = pageEl.querySelector(".page-basket__layout");
    const numberEl = pageEl.querySelector(".page-basket__number");
    if (!canvasBack || !canvasFront || !layout) {
      return { start() {}, stop() {}, reset() {}, resize() {} };
    }

    const sim = createBasketPhysics(canvasBack, canvasFront, layout, numberEl);
    window.addEventListener("resize", sim.resize);
    return sim;
  };
})();
