/**
 * P6 → P7 · 爱心波浪过渡（Figma 22:284）
 * 统一尺寸爱心（22:307 · 161.5×152.7 @440）从右下飞往左上。
 */
(function () {
  'use strict';

  const DURATION = 2600;
  const HEART_COUNT = 96;
  const HEART_ROT = (-30 * Math.PI) / 180;
  const FIGMA_FRAME_W = 440;
  const HEART_W_FIGMA = 161.4852243065834;
  const HEART_H_FIGMA = 152.70061498880386;

  let rafId = 0;
  let running = false;
  let startTime = 0;
  let hearts = [];
  let canvas = null;
  let ctx = null;
  let dpr = 1;
  let viewW = 0;
  let viewH = 0;
  let heartW = 0;
  let heartH = 0;
  let heartImg = null;

  const heartPath = new Path2D(
    'M75.4984 111C13.7391 65.3353 -3.06515 18.3849 25.5053 9.57816C54.0716 0.77147 75.4984 31.695 75.4984 31.695C75.4984 31.695 96.9253 0.77147 125.496 9.57816C154.066 18.3849 137.258 65.3353 75.4984 111Z'
  );

  function rand(min, max) {
    return min + Math.random() * (max - min);
  }

  function easeOutCubic(t) {
    return 1 - Math.pow(1 - t, 3);
  }

  function seedHearts() {
    const layoutScale = viewW / FIGMA_FRAME_W;
    heartW = HEART_W_FIGMA * layoutScale;
    heartH = HEART_H_FIGMA * layoutScale;

    hearts = [];
    for (let i = 0; i < HEART_COUNT; i += 1) {
      const wave = Math.floor(i / 12);
      hearts.push({
        x0: viewW * rand(0.42, 1.14),
        y0: viewH * rand(0.62, 1.1),
        x1: viewW * rand(-0.28, 0.04),
        y1: viewH * rand(-0.32, 0.02),
        delay: wave * 75 + rand(0, 320),
        duration: rand(1700, 2500),
        layer: wave + rand(0, 0.6),
      });
    }
    hearts.sort((a, b) => a.layer - b.layer);
  }

  function resizeCanvas(page) {
    if (!canvas) return;
    const rect = page.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    viewW = rect.width;
    viewH = rect.height;
    canvas.width = Math.round(viewW * dpr);
    canvas.height = Math.round(viewH * dpr);
    canvas.style.width = `${viewW}px`;
    canvas.style.height = `${viewH}px`;
    ctx = canvas.getContext('2d');
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function drawHeart(cx, cy, rotation, alpha) {
    const scaleX = heartW / 151;
    const scaleY = heartH / 127;
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(rotation);
    ctx.scale(scaleX, scaleY);
    ctx.translate(-75.5, -55.5);
    ctx.globalAlpha = alpha;

    if (heartImg && heartImg.complete && heartImg.naturalWidth) {
      ctx.drawImage(heartImg, 0, 0, 151, 127);
    } else {
      ctx.fillStyle = '#FA4B4B';
      ctx.shadowColor = 'rgba(0,0,0,0.45)';
      ctx.shadowBlur = 10;
      ctx.shadowOffsetY = 4;
      ctx.fill(heartPath);
    }
    ctx.restore();
  }

  function tick(now) {
    if (!running || !ctx) return;
    if (!startTime) startTime = now;
    const elapsed = now - startTime;

    ctx.clearRect(0, 0, viewW, viewH);

    hearts.forEach((h) => {
      const local = elapsed - h.delay;
      if (local < 0 || local > h.duration) return;
      const t = easeOutCubic(local / h.duration);
      const x = h.x0 + (h.x1 - h.x0) * t;
      const y = h.y0 + (h.y1 - h.y0) * t;
      let alpha = 1;
      if (local < 160) alpha = local / 160;
      else if (local > h.duration - 200) alpha = (h.duration - local) / 200;
      drawHeart(x, y, HEART_ROT, alpha * 0.97);
    });

    if (elapsed < DURATION) {
      rafId = requestAnimationFrame(tick);
    } else {
      stop();
    }
  }

  function start(page) {
    if (!page) return;
    stop();
    canvas = page.querySelector('.hr-heart-wave__canvas');
    if (!canvas) return;

    running = true;
    startTime = 0;
    resizeCanvas(page);
    seedHearts();
    rafId = requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (rafId) {
      cancelAnimationFrame(rafId);
      rafId = 0;
    }
    if (ctx && canvas) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  heartImg = new Image();
  heartImg.src = 'assets/page-hr/heart-fly.svg';

  window.HrHeartTransition = {
    start,
    stop,
    isRunning: () => running,
    DURATION,
  };
})();
