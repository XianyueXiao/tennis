/**
 * 绝对防御 · Figma 61:663
 * 网球从左右两侧飞入；碰到中央小白光圆反弹，未碰到则穿过。
 */
(function () {
  "use strict";

  const STAGE_W = 548.457;
  const STAGE_H = 488.457;
  const BALL_SIZE = 52;
  const BALL_RADIUS = BALL_SIZE * 0.5;

  /** Figma 61:711 · 93×93 发光圆 · 画板 (220.5, 482.5) · 舞台 -42,257 */
  const SHIELD_CX = 262.5;
  const SHIELD_CY = 225.5;
  const SHIELD_R_IDLE = 46.5;
  const SHIELD_R_CAST = 124;
  const SHIELD_CAST_SCALE = SHIELD_R_CAST / SHIELD_R_IDLE;

  const MAX_BALLS = 10;
  const MAX_BALLS_CAST = 14;
  const SPAWN_INTERVAL_MS = 420;
  const SPAWN_INTERVAL_CAST_MS = 240;
  const SPEED_MIN = 600;
  const SPEED_MAX = 960;

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function createBallEl(fromLeft) {
    const el = document.createElement("div");
    el.className = "skill-p3-ball";
    const rot = fromLeft ? rand(-15, 25) : rand(155, 195);
    el.style.setProperty("--ball-rot", `${rot}deg`);
    el.innerHTML =
      '<img class="skill-p3-ball__shadow" src="assets/skill-ball-shadow.svg" alt="">' +
      '<img class="skill-p3-ball__graphic" src="assets/skill-fly-ball.svg" alt="">';
    return el;
  }

  function spawnBall(fromLeft) {
    const y = rand(60, STAGE_H - 60);
    const speed = rand(SPEED_MIN, SPEED_MAX);
    const angle = rand(-0.22, 0.22);
    const vx = (fromLeft ? 1 : -1) * Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed * rand(0.35, 1);
    return {
      el: createBallEl(fromLeft),
      x: fromLeft ? -BALL_SIZE : STAGE_W + BALL_SIZE,
      y: y - BALL_RADIUS,
      vx,
      vy,
      fromLeft,
      bounced: false,
    };
  }

  function resolveShieldCollision(ball, shieldR) {
    const bx = ball.x + BALL_RADIUS;
    const by = ball.y + BALL_RADIUS;
    const dx = bx - SHIELD_CX;
    const dy = by - SHIELD_CY;
    const dist = Math.hypot(dx, dy);
    const minDist = shieldR + BALL_RADIUS;

    if (dist >= minDist || dist < 0.001) return false;

    const nx = dx / dist;
    const ny = dy / dist;
    const dot = ball.vx * nx + ball.vy * ny;
    if (dot >= 0) return false;

    ball.vx -= 2 * dot * nx;
    ball.vy -= 2 * dot * ny;
    ball.bounced = true;

    const push = minDist - dist + 0.5;
    ball.x += nx * push;
    ball.y += ny * push;
    return true;
  }

  function isOutOfStage(ball) {
    return (
      ball.x < -BALL_SIZE * 2 ||
      ball.x > STAGE_W + BALL_SIZE * 2 ||
      ball.y < -BALL_SIZE * 2 ||
      ball.y > STAGE_H + BALL_SIZE * 2
    );
  }

  window.createSkillP3ShieldController = function (stageRoot) {
    const ballsRoot = stageRoot && stageRoot.querySelector(".skill-p3-balls");
    const shieldGlow = stageRoot && stageRoot.querySelector(".skill-p3-shield-glow");
    if (!ballsRoot || !shieldGlow) {
      return { start() {}, stop() {} };
    }

    let running = false;
    let rafId = 0;
    let spawnTimer = 0;
    let lastFrame = 0;
    let shieldR = SHIELD_R_IDLE;
    let castProgress = 0;
    let castMode = false;
    /** @type {null | (() => void)} */
    let onBounceCallback = null;
    /** @type {Array<{el:HTMLElement,x:number,y:number,vx:number,vy:number,fromLeft:boolean,bounced:boolean}>} */
    let balls = [];
    let spawnLeft = true;

    function showShield() {
      shieldGlow.classList.add("is-visible");
    }

    function hideShield() {
      shieldGlow.classList.remove("is-visible");
    }

    function lerp(a, b, t) {
      return a + (b - a) * t;
    }

    function applyShieldVisual() {
      const scale = lerp(1, SHIELD_CAST_SCALE, castProgress);
      shieldGlow.style.transform = `translate(-50%, -50%) scale(${scale})`;
    }

    function setCastProgress(t) {
      castProgress = Math.min(1, Math.max(0, t));
      shieldR = lerp(SHIELD_R_IDLE, SHIELD_R_CAST, castProgress);
      applyShieldVisual();
    }

    function clearBalls() {
      balls.forEach((ball) => ball.el.remove());
      balls = [];
    }

    function maxBalls() {
      return castMode ? MAX_BALLS_CAST : MAX_BALLS;
    }

    function spawnIntervalMs() {
      return castMode
        ? SPAWN_INTERVAL_CAST_MS
        : SPAWN_INTERVAL_MS + Math.random() * 280;
    }

    function trySpawn() {
      if (!running || balls.length >= maxBalls()) return;
      const ball = spawnBall(spawnLeft);
      spawnLeft = !spawnLeft;
      ballsRoot.appendChild(ball.el);
      balls.push(ball);
    }

    function tick(now) {
      if (!running) return;
      const dt = Math.min(0.05, (now - lastFrame) / 1000 || 0.016);
      lastFrame = now;

      balls = balls.filter((ball) => {
        ball.x += ball.vx * dt;
        ball.y += ball.vy * dt;
        const wasBounced = ball.bounced;
        const bouncedNow = resolveShieldCollision(ball, shieldR);
        if (!wasBounced && bouncedNow && onBounceCallback) {
          onBounceCallback();
        }

        ball.el.style.left = `${ball.x}px`;
        ball.el.style.top = `${ball.y}px`;

        if (isOutOfStage(ball)) {
          ball.el.remove();
          return false;
        }
        return true;
      });

      rafId = requestAnimationFrame(tick);
    }

    function scheduleSpawn() {
      clearTimeout(spawnTimer);
      spawnTimer = window.setTimeout(() => {
        if (!running) return;
        trySpawn();
        if (Math.random() > 0.4) trySpawn();
        scheduleSpawn();
      }, spawnIntervalMs());
    }

    return {
      start() {
        if (running) return;
        running = true;
        lastFrame = performance.now();
        clearBalls();
        castMode = false;
        onBounceCallback = null;
        setCastProgress(0);
        showShield();
        stageRoot.classList.add("is-shield-active");
        for (let i = 0; i < 4; i += 1) {
          trySpawn();
          spawnLeft = !spawnLeft;
        }
        scheduleSpawn();
        rafId = requestAnimationFrame(tick);
      },
      stop() {
        running = false;
        cancelAnimationFrame(rafId);
        clearTimeout(spawnTimer);
        rafId = 0;
        spawnTimer = 0;
        clearBalls();
        castMode = false;
        onBounceCallback = null;
        hideShield();
        setCastProgress(0);
        stageRoot.classList.remove("is-shield-active");
      },
      setCastProgress,
      setCastMode(active) {
        castMode = Boolean(active);
      },
      setOnBounce(fn) {
        onBounceCallback = typeof fn === "function" ? fn : null;
      },
    };
  };
})();
