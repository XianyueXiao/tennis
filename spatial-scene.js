/**
 * spatial-scene.js — P9/P10/P11 共用 Figma 场景（bg · grass · tennis-field · nest）
 * 同一片 tennis-field DOM，通过 layout 切换坐标实现平移。
 */
(function () {
  "use strict";

  const SCENE_MS = 800;
  const EASE = "cubic-bezier(0.645, 0.045, 0.355, 1)";

  let overlay = null;
  let scene = null;
  let currentLayout = "";

  function init() {
    overlay = document.getElementById("spSceneOverlay");
    scene = document.getElementById("spScene");
  }

  function show() {
    if (!overlay) return;
    overlay.classList.add("sp-scene-overlay--active");
  }

  function hide() {
    if (!overlay) return;
    overlay.classList.remove("sp-scene-overlay--active");
    currentLayout = "";
  }

  function setLayout(layout, opts = {}) {
    if (!scene) return;
    const { animate = true, show: shouldShow = false } = opts;
    const shouldAnimate = animate && currentLayout && currentLayout !== layout;

    if (shouldShow) show();

    if (shouldAnimate) {
      scene.classList.add("sp-scene--animating");
      window.setTimeout(() => scene.classList.remove("sp-scene--animating"), SCENE_MS);
    }

    scene.dataset.layout = layout;
    currentLayout = layout;
  }

  /** P10/P11 空间分布 → P11 跑动（37:454） */
  function slideFromSpatialToRun() {
    if (!scene) return;
    show();
    scene.style.setProperty("--scene-ease", EASE);
    scene.style.setProperty("--scene-duration", `${SCENE_MS}ms`);
    const from = currentLayout === "p9" ? "p9" : currentLayout === "p11" ? "p11" : "p10";
    setLayout(from, { animate: false, show: true });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setLayout("p9", { animate: true }));
    });
  }

  /** P11 跑动 → P10 空间分布 */
  function slideFromRunToSpatial() {
    if (!scene) return;
    show();
    setLayout("p9", { animate: false, show: true });
    requestAnimationFrame(() => {
      requestAnimationFrame(() => setLayout("p10", { animate: true }));
    });
  }

  function isSceneLayout(layout) {
    return layout === "p9" || layout === "p10" || layout === "p11";
  }

  window.SpatialScene = {
    init,
    show,
    hide,
    setLayout,
    slideFromSpatialToRun,
    slideFromRunToSpatial,
    isSceneLayout,
    SCENE_MS,
    EASE,
  };
})();
