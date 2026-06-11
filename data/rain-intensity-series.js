/**
 * train_004 · 各训练阶段击球强度 → 时段降雨强度曲线（mm/h）
 * 阶段与导航 9（page-4）文案一致；总拍数 1500、时长 66 分钟
 * intensity_wobble：在阶段基准上叠加起伏，使折线非单调上升
 */
window.RAIN_INTENSITY_SERIES = {
  session_id: "train_004",
  duration_min: 66,
  total_hits: 1500,
  court_area_m2: 261.4,
  phases: [
    { name: "热身", start_min: 0, end_min: 10, hits: 150 },
    { name: "截击练习", start_min: 10, end_min: 22, hits: 300 },
    { name: "高压球", start_min: 22, end_min: 35, hits: 390 },
    { name: "综合应用", start_min: 35, end_min: 55, hits: 560 },
    { name: "冷却", start_min: 55, end_min: 66, hits: 100 },
  ],
  intensity_wobble: [
    { t: 0, factor: 0.72 },
    { t: 4, factor: 0.95 },
    { t: 8, factor: 0.68 },
    { t: 12, factor: 1.18 },
    { t: 16, factor: 0.88 },
    { t: 20, factor: 1.05 },
    { t: 24, factor: 1.32 },
    { t: 28, factor: 1.08 },
    { t: 32, factor: 0.92 },
    { t: 36, factor: 1.22 },
    { t: 40, factor: 1.38 },
    { t: 44, factor: 1.12 },
    { t: 48, factor: 0.96 },
    { t: 52, factor: 1.15 },
    { t: 56, factor: 0.78 },
    { t: 60, factor: 0.55 },
    { t: 64, factor: 0.42 },
    { t: 66, factor: 0.38 },
  ],
  /** P4 · Figma 83:972 交互点位（fx/fy 为 graph 477.5×507 内圆心坐标） */
  chart_markers: [
    { fx: 89, fy: 229, timeRatio: 0, tagline: "训练才刚开始", card_phase: "热身" },
    { fx: 129, fy: 114, timeRatio: 0.25, tagline: "毛毛雨级别的热身", card_phase: "截击" },
    { fx: 232, fy: 12, timeRatio: 0.5, tagline: "雨势逐渐加码", card_phase: "高压" },
    { fx: 312, fy: 116, timeRatio: 0.75, tagline: "草坪开始解渴", card_phase: "综合" },
    { fx: 365, fy: 243, timeRatio: 1, tagline: "勉强可以浇花", card_phase: "冷却" },
  ],
};
