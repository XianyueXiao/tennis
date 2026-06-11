# TENNIS webapp2.0 — Memory Bank

## 页码约定（必读）

**用户说的「第 N 页 / Pn」= 左侧导航按钮数字（1…25），不是 HTML 的 `id`（如 `page-3`）。**

公式：**代码 index = 导航号 − 1** · `ReportPager.goToPage(导航号 - 1)`

### 常见错位（id ≠ 导航）

| 导航 Pn | `id` | 实际内容 |
|---------|------|----------|
| P6 | `page-2` | 心率统计（Figma 17:214） |
| P7 | `page-3` | **平均每回合拍数** |
| P8 | `page-4` | 训练阶段（66 分钟）叠层 |
| P15 | `page-14` | 正手（class `page-12`） |
| P16 | `page-13` | 高旋转球（class `page-13`） |
| P17 | `page-12` | 2005 法网决赛（class `page-14`） |

左侧导航悬停 tooltip：`导航 N · aria-label（id）`，由 `section[aria-label]` 驱动。

---

## 完整映射：导航 ↔ DOM ↔ 内容

| 导航 | index | id | aria-label | 内容摘要 |
|------|-------|-----|------------|----------|
| 1 | 0 | page-intro | 开场 第一页 | 训练结算开场 |
| 2 | 1 | page-basket | 开场 击球统计 · 落筐 | 1500 拍落筐物理 |
| 3 | 2 | page-basket-rain | 降雨隐喻 · 毛毛雨 | 雨丝 + 公式 |
| 4 | 3 | page-basket-rain-chart | 降雨统计 | **Figma 83:899** · graph 矢量路径 + 5 交互点（83:972） |
| 5 | 4 | page-cake | 训练强度 · 打废网球 | Figma 4:5 |
| 6 | 5 | page-2 | 心率统计 | Figma 17:214 |
| 7 | 6 | page-3 | 平均每回合拍数 | 6 拍飞球 |
| 8 | 7 | page-4 | 训练阶段 · 66分钟 | 叠在 P7 上 |
| 9 | 8 | page-6 | 空间分布 · 左右半场 | **Figma 46:515** |
| 10 | 9 | page-7 | 空间分布 · 深浅失误 | **Figma 46:592** |
| 11 | 10 | page-5-trail | 跑动距离 | **Figma 37:454** · 共用 scene layout `p9` |
| 12 | 11 | page-8 | 旋球类型 | 上旋 / 平击 / 下旋 |
| 13 | 12 | page-9 | 转速 | 平均/最高 rpm |
| 14 | 13 | page-10 | 球星影子 | **Figma 74:875** 像素级 · `page-p14-layout` 440×956 + `page-p14.css` |
| 15 | 14 | page-11 | 反手击球率 | 35% |
| 16 | 15 | page-14 | 正手 | Figma 365:885 |
| 17 | 16 | page-13 | 高旋转球 | Figma 717:140 |
| 18 | 17 | page-12 | 2005年法网决赛 | |
| 19 | 18 | page-15 | 相似度对比 | |
| 20 | 19 | page-skills | 隐藏大招 CD | hub（`data-nav="20"`） |
| 20-1 | 19* | skill panel 2 | 强力一击 | |
| 20-2 | 19* | skill panel 3 | 绝对防御 | |
| 20-3 | 19* | skill panel 5 | 能力觉醒 | |
| 22 | 21 | page-coach-2 | 打框统计 · 老毛病 | **Figma 65:777** 像素级 · `coach-p22.css` + MCP 资源 |
| 23 | 22 | page-coach-3 | 电量告急 · 心率下降 | **Figma 74:801** · `coach-p23.css` |
| 21–24 | 20–23 | page-coach-1/4 | 教练碎碎念 | |
| 24 | 23 | page-coach-4 | 球路太单一 | **Figma 74:814** · `coach-p24.css` |
| 25 | 24 | page-outro-1 | 完结撒花 | **Figma 74:832** · `outro-p25.css` |

**P24/P25 共用 `assets/tennis-field.svg`**（页内渲染 + `court-p24-p25.css` 旋转过渡 · P24 30° → P25 0°）

**SCROLL_TARGETS[24] = 1800**（`page-outro-1` 文档流 top = 1800vh；勿用 1900，否则会滚到页底空白区）

---

## 项目结构

```
webapp2.0/
├── index1.html              # 主应用（25 页）
├── page-p14.css             # P14 专用（#page-10 · Figma 74:875）
├── coach-p22.css            # P22 专用（.coach-panel--page2）
├── coach-p23.css            # P23 专用（.coach-panel--page3）
├── outro-p25.css            # P25 专用（.outro-panel--page1 · Figma 74:832）
├── coach-p24.css            # P24 专用（#page-coach-4 · Figma 74:814）
├── rain-p4.css              # P4 降雨统计（Figma 83:899 · headline + graph + floating card）
├── assets/rain-p4/          # floating-card.svg、graph-ref.svg
├── court-p24-p25.css        # P24/P25 Tennis Field 旋转过渡
├── assets/tennis-field.svg  # Figma Tennis Field 共用资产
├── coach.css / coach.js     # 教练页共用
├── main.js                  # 分页、场景页
├── spatial-scene.js         # P10–P11 共用场景
├── spatial.js               # 空间分布 / 旋球 / 转速
├── assets/page-p14/         # P14 球星影子（vector、nadal、swiatek、zheng）
├── assets/coach-p22-*       # P22 资源（head、quote、paper、racket）
├── assets/page5/            # 球场 SVG、trail 资源
└── style.css
```

---

## P9–P11 共用场景（spatial-scene.js）

**Figma：** P9 `46:515` · P10 `46:592` · P11 `37:454`

同一片 `#spScene` · `tennis-field` DOM，layout 切换坐标：

| layout | 页面 | grass-top | field-top | nest-top |
|--------|------|-----------|-----------|----------|
| `p10`/`p11` | page-6/7 | 336px | 501px | 855px |
| `p9` | page-5-trail (P11) | -108px | -167px | 187px |

- P10→P11：`slideFromSpatialToRun()` 球场/草地上滚 800ms
- P11→P10：`slideFromRunToSpatial()`
- P9↔P10 深度页：仅文案，场景坐标不变（`p10`/`p11` 相同）

---

## API

- `SpatialScene.setLayout('p10'|'p11', { show, animate })`
- `isScenePageIndex(i)` — `page-6` / `page-7` / `page-5-trail`
- `slideFromSpatialToRun` / `slideFromRunToSpatial`
- `SpatialModule.enterPage(6|7|8|9)`
