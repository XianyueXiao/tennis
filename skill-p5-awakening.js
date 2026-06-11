/**
 * 能力觉醒 · Figma 31:347（施放前）/ 31:367（施放后）
 * 长按「释放技能」进入施放态，松开恢复
 */
(function () {
  "use strict";

  window.createSkillP5AwakeningController = function createSkillP5AwakeningController(stage) {
    if (!stage) {
      return { start() {}, stop() {} };
    }

    const layout = stage.closest(".skill-layout--p5");
    const panel = stage.closest(".skill-panel--page5");
    const castBtn = panel?.querySelector(".skill-p5-cast-btn");

    let cast = false;
    let activePointer = null;

    function setCastState(next) {
      cast = next;
      stage.classList.toggle("is-cast", cast);
      layout?.classList.toggle("is-cast", cast);
      stage.dataset.figma = cast ? "31:367" : "31:347";
      if (castBtn) {
        castBtn.classList.toggle("is-cast", cast);
        castBtn.setAttribute("aria-pressed", cast ? "true" : "false");
      }
    }

    function resetVisual() {
      activePointer = null;
      setCastState(false);
    }

    function beginCast(e) {
      if (activePointer != null) return;
      activePointer = e.pointerId;
      castBtn?.classList.add("is-pressed");
      castBtn?.setPointerCapture?.(e.pointerId);
      setCastState(true);
    }

    function endCast(e) {
      if (activePointer == null || e.pointerId !== activePointer) return;
      activePointer = null;
      castBtn?.classList.remove("is-pressed");
      castBtn?.releasePointerCapture?.(e.pointerId);
      setCastState(false);
    }

    if (castBtn) {
      castBtn.addEventListener("pointerdown", (e) => {
        if (e.button !== 0) return;
        e.preventDefault();
        beginCast(e);
      });
      castBtn.addEventListener("pointerup", endCast);
      castBtn.addEventListener("pointercancel", endCast);
      castBtn.addEventListener("lostpointercapture", () => {
        activePointer = null;
        castBtn.classList.remove("is-pressed");
        setCastState(false);
      });
      castBtn.addEventListener("click", (e) => {
        e.preventDefault();
      });
      castBtn.addEventListener("contextmenu", (e) => {
        e.preventDefault();
      });
    }

    return {
      start() {
        if (!cast) resetVisual();
      },
      stop() {
        resetVisual();
      },
      isCast: () => cast,
    };
  };
})();
