#!/usr/bin/env python3
"""Reconstruct index1.html from patches, chunks, and DOM requirements."""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / "index1.html"

ARC_PATH = (
    "M 1100 350 Q 220 250 -670 380 Q 220 290 1100 410 Q 220 330 -670 440 "
    "Q 220 370 1100 470 Q 350 400 -400 490 Q -180 550 50 610 Q 75 580 100 618 "
    "Q 117 598 135 624 Q 145 612 155 628 Q 161 620 167 630 Q 170 626 174 633"
)

P11_DOG_PATH = (
    "M 52 48 L 178 22 L 365 92 L 108 128 L 312 58 L 372 165 L 125 195 "
    "L 328 108 L 85 255 L 275 175 L 355 268 L 165 285 L 58 210 L 215 145 "
    "L 345 228 L 198 312"
)

HEAD = """<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>训练结算报告</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="skills.css">
    <link rel="stylesheet" href="coach.css">
    <link rel="stylesheet" href="outro.css">
</head>
<body>
    <div id="page-indicator" aria-hidden="true"></div>
    <div class="scroll-container">
        <div class="sp-scene-overlay" id="spSceneOverlay" aria-hidden="true">
            <div class="sp-scene" id="spScene" data-layout="p10">
                <div class="sp-scene__bg" data-layer="bg">
                    <div class="sp-scene__grass" data-layer="grass" aria-hidden="true"></div>
                    <div class="sp-scene__tennis-field" data-layer="tennis-field">
                        <img class="sp-scene__tennis-field-img" src="assets/spatial/tennis-field.png" width="392" height="829" alt="">
                        <div class="sp-landings" id="landingsPage1"></div>
                        <div class="sp-landings sp-landings--miss" id="landingsPage2"></div>
                    </div>
                    <div class="sp-scene__nest" data-layer="nest" aria-hidden="true">
                        <div class="sp-scene__nest-media">
                            <img src="assets/spatial/nest.svg" width="498" height="67" alt="">
                        </div>
                    </div>
                    <div class="sp-scene__dog" data-layer="dog" aria-hidden="true">
                        <img class="sp-scene__dog-body" data-layer="dog-body" src="assets/spatial/dog-body.png" width="419" height="344" alt="">
                        <img class="sp-scene__dog-head" data-layer="dog-head" src="assets/spatial/dog-head.png" width="91" height="68" alt="">
                    </div>
                </div>
            </div>
        </div>

        <div id="pages-wrapper" class="pages-wrapper">
"""

FOOT = """
        </div>
    </div>

    <script src="embed.js"></script>
    <script src="data/rain-intensity-series.js"></script>
    <script src="data/spatial-session4.js"></script>
    <script src="data/skills-power.js"></script>
    <script src="data/skills-defense.js"></script>
    <script src="data/skills-awakening.js"></script>
    <script src="data/coach-whisper.js"></script>
    <script src="data/coach-hr-series.js"></script>
    <script src="data/coach-racket-rim.js"></script>
    <script src="data/outro-outlook.js"></script>
    <script src="spatial-scene.js"></script>
    <script src="spatial.js"></script>
    <script src="hr-heart-transition.js"></script>
    <script src="intro-basket.js"></script>
    <script src="intro-basket-rain.js"></script>
    <script src="intro-cake.js"></script>
    <script src="p11-run-page.js"></script>
    <script src="skill-p2-power.js"></script>
    <script src="skill-p3-shield.js"></script>
    <script src="skill-p3-defense.js"></script>
    <script src="skill-p4-hit.js"></script>
    <script src="skill-p5-awakening.js"></script>
    <script src="coach-hr-chart.js"></script>
    <script src="coach.js"></script>
    <script src="page15.js"></script>
    <script src="outro.js"></script>
    <script src="skills.js"></script>
    <script src="main.js"></script>
</body>
</html>
"""

sections = []

sections.append("""
        <!-- 导航 1 · 开场 · Figma 1:150 -->
        <section class="page page-intro" id="page-intro" data-nav="1" data-figma="1:150" aria-label="开场 第一页">
            <div class="intro-layout">
                <div class="intro-scene">
                    <img class="intro-bg fade-in-up" src="assets/page-intro/court-bg.png" width="1720" height="2048" alt="" aria-hidden="true">
                    <p class="intro-kicker fade-in-up" style="animation-delay: 0.12s;">训练结算已就绪</p>
                    <p class="intro-headline fade-in-up" style="animation-delay: 0.22s;">你准备好了吗？</p>
                    <p class="intro-hint fade-in-up" style="animation-delay: 0.44s;">下滑查看</p>
                </div>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 2 · 击球统计 · 落筐 -->
        <section class="page page-basket" id="page-basket" data-nav="2" data-figma="225:4" aria-label="开场 击球统计 · 落筐">
            <div class="page-basket__layout">
                <div class="page-basket__stat fade-in-up">
                    <p class="page-basket__kicker">本次训练你一共打了</p>
                    <p class="page-basket__number" data-count="1500">0</p>
                    <p class="page-basket__unit">拍</p>
                </div>
                <img class="page-basket__back" src="assets/page-basket/basket-back.svg" width="347" height="275" alt="" aria-hidden="true">
                <canvas class="page-basket__canvas page-basket__canvas--back" aria-hidden="true"></canvas>
                <canvas class="page-basket__canvas page-basket__canvas--front" aria-hidden="true"></canvas>
                <img class="page-basket__front" src="assets/page-basket/basket-front.svg" width="455" height="301" alt="" aria-hidden="true">
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 3 · 降雨隐喻 -->
        <section class="page page-basket-rain" id="page-basket-rain" data-nav="3" aria-label="降雨隐喻 · 毛毛雨"
            data-training-minutes="66" data-hit-count="1500" data-court-area-m2="261.4">
            <div class="page-basket__rain-layer" aria-hidden="true">
                <div class="page-basket__rain-dim"></div>
                <canvas class="page-basket__rain-canvas" aria-hidden="true"></canvas>
                <div class="page-basket__rain-headline">
                    <div class="page-basket__rain-heading">
                        <p class="page-basket__rain-line1">相当于在局部地区下了一场</p>
                        <p class="page-basket__rain-level" data-rain-level>毛毛雨</p>
                    </div>
                    <div class="page-basket__rain-stats" data-rain-stats aria-hidden="true">
                        <div class="page-basket__rain-stat-row">
                            <span class="page-basket__rain-stat-label">标准网球场</span>
                            <span class="page-basket__rain-stat-value" data-rain-court-area>261.4</span>
                            <span class="page-basket__rain-stat-suffix">m2</span>
                        </div>
                        <div class="page-basket__rain-stat-row">
                            <span class="page-basket__rain-stat-label">训练</span>
                            <span class="page-basket__rain-stat-value" data-rain-minutes>66</span>
                            <span class="page-basket__rain-stat-suffix">分钟</span>
                        </div>
                        <div class="page-basket__rain-stat-row">
                            <span class="page-basket__rain-stat-label">共</span>
                            <span class="page-basket__rain-stat-value" data-rain-hits>1500</span>
                            <span class="page-basket__rain-stat-suffix">拍</span>
                        </div>
                    </div>
                    <div class="page-basket__rain-formula-block" data-rain-formula-block aria-hidden="true">
                        <p class="page-basket__rain-formula-line" data-rain-formula-line></p>
                        <p class="page-basket__rain-formula-line" data-rain-formula-line></p>
                        <p class="page-basket__rain-formula-line" data-rain-formula-line></p>
                    </div>
                </div>
                <button type="button" class="page-basket__rain-cta" data-rain-cta>查看本次降雨情况</button>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 4 · 降雨统计图 -->
        <section class="page page-basket-rain-chart" id="page-basket-rain-chart" data-nav="4" aria-label="降雨统计 · 时段降雨量">
            <div class="page-basket__rain-chart" data-rain-chart aria-hidden="true">
                <canvas class="page-basket__rain-chart-canvas" aria-hidden="true"></canvas>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 5 · 训练强度蛋糕 · Figma 8:5 -->
        <section class="page page-cake" id="page-cake" data-nav="5" data-figma="8:5" aria-label="训练强度 · 打废网球">
            <div class="page-cake__layout">
                <div class="page-cake__headline fade-in-up">
                    <p class="page-cake__kicker">这一场，你的训练强度</p>
                    <div class="page-cake__value-row">
                        <span class="page-cake__lead">打废了</span>
                        <span class="page-cake__fraction">1/7</span>
                        <span class="page-cake__tail">个网球</span>
                    </div>
                </div>
                <div class="page-cake__scene">
                    <img class="page-cake__plate fade-in-up" src="assets/page-cake/plate.png" alt="" style="animation-delay: 0.12s;">
                    <img class="page-cake__cake-back fade-in-up" src="assets/page-cake/cake-back.png" alt="" style="animation-delay: 0.16s;">
                    <div class="page-cake__racket-wrap fade-in-up" style="animation-delay: 0.2s;">
                        <img class="page-cake__racket" src="assets/page-cake/racket.png" alt="">
                    </div>
                    <img class="page-cake__cake-front fade-in-up" src="assets/page-cake/cake-front.png" alt="" style="animation-delay: 0.24s;">
                </div>
                <div class="page-cake__outcome" aria-hidden="true">
                    <p class="page-cake__outcome-line1">你切下了1/7个8寸蛋糕</p>
                    <p class="page-cake__outcome-line2">你真是乐于分享！</p>
                </div>
                <button type="button" class="page-cake__cta fade-in-up" style="animation-delay: 0.34s;">吃一块蛋糕</button>
            </div>
        </section>
""")

sections.append(f"""
        <!-- 导航 6 · 心率统计 · Figma 17:214 -->
        <section class="page page-2" id="page-2" data-nav="6" data-figma="17:214" aria-label="心率统计">
            <div class="hr-layout">
                <div class="hr-stat hr-stat--avg fade-in-up">
                    <p class="hr-stat__value">129.5</p>
                    <p class="hr-stat__label">平均心率</p>
                </div>
                <div class="hr-stat hr-stat--max fade-in-up" style="animation-delay: 0.1s">
                    <p class="hr-stat__value">151</p>
                    <p class="hr-stat__label">最高心率</p>
                </div>
                <p class="hr-copy__line hr-copy__line--1 fade-in-up" style="animation-delay: 0.2s">以每次击球过程为2秒来算</p>
                <p class="hr-copy__line hr-copy__line--2 fade-in-up" style="animation-delay: 0.28s">这相当于每一次击球</p>
                <p class="hr-copy__prefix fade-in-up" style="animation-delay: 0.36s">你的心脏会跳动</p>
                <p class="hr-copy__number pop-in" style="animation-delay: 0.4s">4</p>
                <p class="hr-copy__suffix fade-in-up" style="animation-delay: 0.44s">下</p>
                <div class="hr-equation fade-in-up" aria-hidden="true" style="animation-delay: 0.44s">
                    <svg class="hr-equation__svg" width="305" height="36" viewBox="0 0 305 36" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <g class="hr-eq-part hr-eq-part--ball">
                            <path d="M36 18.0009C36 24.069 32.9961 29.4354 28.3952 32.6951C27.8591 33.0751 27.3024 33.4268 26.7268 33.7447C24.1404 35.1818 21.1647 36 17.9991 36C14.8334 36 11.8577 35.1818 9.27321 33.7447C8.69575 33.4268 8.13898 33.0751 7.60479 32.6951C3.00204 29.4354 0 24.069 0 18.0009C0 8.05998 8.0581 0 17.9991 0C27.94 0 36 8.05998 36 18.0009Z" fill="#BEEE00"/>
                            <path d="M28.3952 32.6951C27.8591 33.0751 27.3024 33.4268 26.7268 33.7447C24.0464 31.1396 25.0132 26.6515 25.7449 23.2507C26.0459 21.8607 26.328 20.5459 26.328 19.6035C26.328 14.5004 23.5254 11.9141 17.9991 11.9141C12.4728 11.9141 9.67198 14.5004 9.67198 19.6035C9.67198 20.5459 9.95412 21.8607 10.2532 23.2507C10.9868 26.6515 11.9536 31.1377 9.27321 33.7447C8.69575 33.4268 8.13898 33.0751 7.60479 32.6951C9.78484 31.0211 9.2939 27.7218 8.41549 23.6476C8.09384 22.156 7.791 20.7472 7.791 19.6035C7.791 16.0278 9.11709 10.0331 17.9991 10.0331C26.881 10.0331 28.209 16.0278 28.209 19.6035C28.209 20.7472 27.9062 22.156 27.5845 23.6476C26.7061 27.7218 26.2152 31.0211 28.3952 32.6951Z" fill="#ffffff"/>
                        </g>
                        <g class="hr-eq-part hr-eq-part--equal">
                            <rect x="61" y="9" width="28" height="6" fill="#ffffff"/>
                            <rect x="61" y="21" width="28" height="6" fill="#ffffff"/>
                        </g>
                        <g class="hr-eq-part hr-eq-part--heart">
                            <path d="M133 33C114.52 19.2562 109.492 5.12554 118.041 2.47498C126.588 -0.175579 133 9.13152 133 9.13152C133 9.13152 139.411 -0.175579 147.959 2.47498C156.508 5.12554 151.479 19.2562 133 33Z" fill="#FA4B4B"/>
                            <path d="M185.5 33C168.479 19.2562 163.848 5.12554 171.722 2.47498C179.595 -0.175579 185.5 9.13152 185.5 9.13152C185.5 9.13152 191.405 -0.175579 199.278 2.47498C207.152 5.12554 202.52 19.2562 185.5 33Z" fill="#FA4B4B"/>
                            <path d="M236.5 33C219.479 19.2562 214.848 5.12554 222.722 2.47498C230.595 -0.175579 236.5 9.13152 236.5 9.13152C236.5 9.13152 242.405 -0.175579 250.278 2.47498C258.152 5.12554 253.52 19.2562 236.5 33Z" fill="#FA4B4B"/>
                            <path d="M287.5 33C270.479 19.2562 265.848 5.12554 273.722 2.47498C281.595 -0.175579 287.5 9.13152 287.5 9.13152C287.5 9.13152 293.405 -0.175579 301.278 2.47498C309.152 5.12554 304.52 19.2562 287.5 33Z" fill="#FA4B4B"/>
                        </g>
                    </svg>
                </div>
            </div>
            <div class="hr-heart-wave" aria-hidden="true">
                <div class="hr-heart-wave__bg"></div>
                <canvas class="hr-heart-wave__canvas"></canvas>
            </div>
        </section>
""")

sections.append(f"""
        <!-- 导航 7 · 平均每回合拍数 -->
        <section class="page page-3" id="page-3" data-nav="7" aria-label="平均每回合拍数">
            <div class="p3-text-group fade-in-up">
                <span class="p3-subtitle">平均每回合</span>
                <span class="p3-title">你打了</span>
            </div>
            <div class="p3-stat-group fade-in-up" style="animation-delay: 0.1s">
                <span class="p3-subtitle-2">一共</span>
                <span class="p3-number pop-in" style="animation-delay: 0.2s">6</span>
                <span class="p3-unit">拍</span>
            </div>
            <div class="full-arc-container">
                <svg class="arc-svg" viewBox="0 0 440 852" xmlns="http://www.w3.org/2000/svg">
                    <path class="draw-mask-path" pathLength="100" d="{ARC_PATH}" fill="none" stroke="#BEEE00" stroke-width="4" stroke-dasharray="8 8"/>
                </svg>
                <img class="fly-arc" src="assets/ball.svg" width="36" height="36" alt="" aria-hidden="true">
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 8 · 训练阶段 · 66分钟 -->
        <section class="page page-4" id="page-4" data-nav="8" aria-label="训练阶段 · 66分钟">
            <div class="page-4-content">
                <div class="p4-scenery">
                    <div style="position:absolute;background:#fff;width:440px;height:339px;left:0;top:0;"></div>
                    <div style="position:absolute;background:#2ca867;height:84px;left:0;top:339px;width:440px;"></div>
                    <div style="position:absolute;height:221.65px;left:-30px;top:421px;width:500.7px">
                        <img alt="" style="position:absolute;inset:0;width:100%;height:100%" src="assets/page4/984db6f96a2d256fa3b36ff3c73c8cf08d2f3ed2.svg">
                    </div>
                </div>
                <div class="p4-top-text">
                    <p style="position:absolute;left:75px;top:117px;transform:translateX(-50%);font-size:20px;color:#000;">你用</p>
                    <p style="position:absolute;left:302px;top:117px;transform:translateX(-50%);font-size:20px;color:#000;">的时间经历</p>
                    <p style="position:absolute;left:139.5px;top:83px;transform:translateX(-50%);font-size:64px;font-weight:700;color:#000;">66</p>
                    <p style="position:absolute;left:214px;top:107px;transform:translateX(-50%);font-size:32px;font-weight:700;color:#000;">分钟</p>
                    <p style="position:absolute;left:220.5px;top:153px;transform:translateX(-50%);font-size:20px;font-weight:700;color:#000;">热身/截击练习/高压球/综合应用/冷却</p>
                    <p style="position:absolute;left:356px;top:185px;transform:translateX(-50%);font-size:20px;color:#000;">等阶段</p>
                </div>
                <!-- 继承自导航5（#page-3 平均回合）的静态网球 -->
                <img class="p4-static-ball" src="assets/ball.svg" width="36" height="36" alt="" aria-hidden="true">
                <div class="p4-person-and-text">
                    <p style="position:absolute;left:114.5px;top:818px;transform:translateX(-50%);font-size:20px;color:#fff;">最擅长的仍是</p>
                    <p style="position:absolute;left:244px;top:808px;transform:translateX(-50%);font-size:32px;font-weight:700;color:#fff;">正手捡球</p>
                    <p style="position:absolute;left:243px;top:866px;transform:translateX(-50%);font-size:20px;color:#fff;">和</p>
                    <p style="position:absolute;left:323px;top:856px;transform:translateX(-50%);font-size:32px;font-weight:700;color:#fff;">反手捡球</p>
                </div>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 9 · 空间分布 · 左右半场 · Figma 46:515 -->
        <section class="page page-6" id="page-6" data-nav="9" data-figma="46:515" aria-label="空间分布 · 左右半场">
            <div class="sp-content">
                <h2 class="sp-headline sp-reveal" data-order="0">
                    <span class="sp-headline__prefix">有</span>
                    <span class="sp-headline__number" data-count="page1_left_balls">323</span>
                    <span class="sp-headline__suffix">颗球落在了</span>
                </h2>
                <p class="sp-row sp-row--left sp-reveal" data-order="1">
                    <span class="sp-row__number" data-count="page1_left_balls">323</span>
                    <span class="sp-row__label">颗在左侧半场</span>
                </p>
                <p class="sp-row sp-row--right sp-reveal" data-order="2">
                    <span class="sp-row__number" data-count="page1_right_balls">292</span>
                    <span class="sp-row__label">颗在右侧半场</span>
                </p>
                <p class="sp-spatial-copy sp-spatial-copy--double sp-reveal" data-order="3">
                    <span class="sp-spatial-copy__line" data-order="3">你的击球落点</span>
                    <span class="sp-spatial-copy__line" data-order="4">左右还算均衡</span>
                </p>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 10 · 空间分布 · 深浅失误 · Figma 46:592 -->
        <section class="page page-7" id="page-7" data-nav="10" data-figma="46:592" aria-label="空间分布 · 深浅失误">
            <div class="sp-content">
                <div class="sp-depth-row sp-depth-row--1 sp-reveal" data-order="0">
                    <span class="sp-depth-row__number" data-count="deep">376</span>
                    <span class="sp-depth-row__label">颗</span>
                    <span class="sp-depth-row__tag">深</span>
                </div>
                <div class="sp-depth-row sp-depth-row--2 sp-reveal" data-order="1">
                    <span class="sp-depth-row__number" data-count="medium">187</span>
                    <span class="sp-depth-row__label">颗</span>
                    <span class="sp-depth-row__tag">中</span>
                </div>
                <div class="sp-depth-row sp-depth-row--3 sp-reveal" data-order="2">
                    <span class="sp-depth-row__number" data-count="shallow">52</span>
                    <span class="sp-depth-row__label">颗</span>
                    <span class="sp-depth-row__tag">浅</span>
                </div>
                <div class="sp-spatial-miss sp-reveal" data-order="3">
                    <span class="sp-spatial-miss__number" data-count="miss">134</span>
                    <span class="sp-spatial-miss__label">颗出了界或下网</span>
                </div>
                <p class="sp-spatial-copy sp-spatial-copy--single sp-reveal" data-order="4">深球打得不错，失误要再控制</p>
            </div>
        </section>
""")

sections.append(f"""
        <!-- 导航 11 · 跑动距离 · Figma 37:454 -->
        <section class="page page-5-trail" id="page-5-trail" data-nav="11" data-figma="37:454" aria-label="跑动距离">
            <div class="page-5-trail__content">
                <p class="p11-lead p11-text-fade">本场训练</p>
                <p class="p11-sublead p11-text-fade">你为了击球一共跑动了</p>
                <p class="p11-distance p11-text-fade">4.13</p>
                <p class="p11-unit p11-text-fade">公里</p>
                <div class="p11-dog" data-layer="dog" aria-hidden="true">
                    <svg class="p11-dog__svg" viewBox="0 0 418 343" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                        <path id="p11-dog-path" pathLength="100" d="{P11_DOG_PATH}" fill="none" stroke="none"/>
                        <path class="p11-dog__stroke p11-dog__stroke--black" data-layer="dog-body" pathLength="100" d="{P11_DOG_PATH}"/>
                        <path class="p11-dog__stroke p11-dog__stroke--white" pathLength="100" d="{P11_DOG_PATH}"/>
                    </svg>
                    <img class="p11-dog__head" data-layer="dog-head" src="assets/page5/dog-head.svg" width="91" height="68" alt="">
                </div>
                <p class="p11-foot-bold p11-text-fade">满场被遛的你</p>
                <p class="p11-foot-regular p11-text-fade">下次一定会跑得更快吧！</p>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 12 · 旋球类型 -->
        <section class="page page-8" id="page-8" data-nav="12" aria-label="旋球类型">
            <div class="sp-content">
                <div class="sp-spin-hero sp-reveal" data-order="0">
                    <span class="sp-spin-hero__number" data-count="spin_successful">615</span>
                    <span class="sp-spin-hero__type">颗有效击球中</span>
                    <span class="sp-spin-hero__unit">有</span>
                </div>
                <div class="sp-spin-percent sp-reveal" data-order="1">
                    <span class="sp-spin-percent__value" data-count="spin_topspin_pct">55</span>
                    <span class="sp-spin-percent__label">%是上旋球</span>
                </div>
                <div class="sp-spin-cols sp-reveal" data-order="2">
                    <p class="sp-spin-stat sp-spin-stat__number--flat" data-count="spin_flat">220</p>
                    <p class="sp-spin-stat sp-spin-stat__unit--flat">颗</p>
                    <p class="sp-spin-stat sp-spin-stat__type--flat">平击</p>
                    <span class="sp-spin-cols__divider sp-spin-cols__divider--1"></span>
                    <p class="sp-spin-stat sp-spin-stat__number--slice" data-count="spin_slice">57</p>
                    <p class="sp-spin-stat sp-spin-stat__unit--slice">颗</p>
                    <p class="sp-spin-stat sp-spin-stat__type--slice">下旋</p>
                    <span class="sp-spin-cols__divider sp-spin-cols__divider--2"></span>
                    <p class="sp-spin-stat sp-spin-stat__number--topspin" data-count="spin_topspin">338</p>
                    <p class="sp-spin-stat sp-spin-stat__unit--topspin">颗</p>
                    <p class="sp-spin-stat sp-spin-stat__type--topspin">上旋</p>
                </div>
                <p class="sp-spin-copy sp-reveal" data-order="3">上旋是你的主旋律</p>
                <p class="sp-spin-copy sp-reveal" data-order="4">但别忘了变化</p>
                <div class="sp-spin-balls sp-reveal" data-order="2">
                    <div class="sp-spin-balls__tilt">
                        <div class="sp-spin-balls__grid" id="spinBallsGrid"></div>
                    </div>
                </div>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 13 · 转速 -->
        <section class="page page-9" id="page-9" data-nav="13" aria-label="转速">
            <div class="sp-content">
                <div class="sp-rpm-avg sp-reveal" data-order="0">
                    <span class="sp-rpm-avg__label">平均转速</span>
                    <span class="sp-rpm-avg__value" data-count="rpm_avg">1868</span>
                </div>
                <p class="sp-rpm-label sp-reveal" data-order="1">最高转速</p>
                <p class="sp-rpm-max sp-reveal" data-order="2" data-count="rpm_max">2975</p>
                <div class="sp-rpm-ball sp-reveal" data-order="2">
                    <div class="sp-rpm-ball__tilt">
                        <div class="sp-rpm-ball__spin" id="rpmBallSpin">
                            <img class="sp-rpm-ball__img sp-rpm-ball__img--idle" src="assets/rpm-ball.svg" alt="" aria-hidden="true">
                        </div>
                    </div>
                </div>
                <div class="sp-rpm-fact-row">
                    <span class="sp-rpm-fact__lead sp-rpm-fact__lead--1 sp-reveal" data-order="3">相当于</span>
                    <span class="sp-rpm-fact__num sp-rpm-fact__num--1 sp-reveal" data-order="3" data-count="rpm_year_seconds">7.36</span>
                    <span class="sp-rpm-fact__unit sp-rpm-fact__unit--1 sp-reveal" data-order="3">秒地球自转</span>
                    <span class="sp-rpm-fact__lead sp-rpm-fact__lead--2 sp-reveal" data-order="4">或</span>
                    <span class="sp-rpm-fact__num sp-rpm-fact__num--2 sp-reveal" data-order="4" data-count="rpm_history_minutes">2</span>
                    <span class="sp-rpm-fact__unit sp-rpm-fact__unit--2 sp-reveal" data-order="4">分钟历史长河</span>
                </div>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 14 · 球星影子 -->
        <section class="page page-10" id="page-10" data-nav="14" aria-label="球星影子">
            <p class="page10-title-regular anim-text" data-delay="0">你的击球风格</p>
            <p class="page10-title-bold anim-text" data-delay="100">有点像</p>
            <p class="page10-label-bold page10-label-1 anim-text" data-delay="240">纳达尔</p>
            <p class="page10-label-bold page10-label-2 anim-text" data-delay="360">费德勒</p>
            <p class="page10-label-bold page10-label-3 anim-text" data-delay="480">德约科维奇</p>
            <img class="page10-hero-image anim-text" data-delay="600" src="" alt="" aria-hidden="true">
            <div class="page10-footer-bold anim-text" data-delay="600">
                <p>你也有属于自己的</p>
                <p>球星影子</p>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 15 · 反手击球率 -->
        <section class="page page-11" id="page-11" data-nav="15" aria-label="反手击球率">
            <p class="page11-text-regular page11-title anim-text" data-delay="0">你的反手击球率</p>
            <p class="page11-text-regular page11-line-1 anim-text" data-delay="120">本场达到了</p>
            <p class="page11-text-bold page11-percent anim-text" data-delay="240">35%</p>
            <p class="page11-line-2 anim-text" data-delay="360">反手也能打出进攻性</p>
            <div class="page11-vector-mask anim-text" data-delay="480"></div>
            <img class="page11-hero-image anim-text" data-delay="600" src="" alt="" aria-hidden="true">
            <div class="page11-arrow-icon anim-text" data-delay="600" aria-hidden="true"></div>
            <div class="page11-footer-wrap anim-text" data-delay="600">
                <p>反手不是防守的代名词</p>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 16 · 正手 · Figma 365:885 -->
        <section class="page page-12 page-14" id="page-14" data-nav="16" aria-label="正手">
            <p class="page12-text-regular page12-title anim-text" data-delay="0">你的正手</p>
            <p class="page12-text-regular page12-line-1 anim-text" data-delay="100">本场击球占比</p>
            <div class="page12-stat-row anim-text" data-delay="240">
                <p class="page12-line-4">达到了</p>
                <p class="page12-percent">62%</p>
            </div>
            <p class="page12-line-2 anim-text" data-delay="360">正手是你的招牌</p>
            <img class="page12-hero-image anim-text" data-delay="480" src="" alt="" aria-hidden="true">
            <div class="page12-arrow-icon anim-text" data-delay="600" aria-hidden="true"></div>
            <div class="page12-footer-wrap anim-text" data-delay="600">
                <p>继续打磨这一拍</p>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 17 · 高旋转球 · Figma 717:140 -->
        <section class="page page-13" id="page-13" data-nav="17" aria-label="高旋转球">
            <p class="page13-kicker anim-text" data-delay="0">你的高旋转球</p>
            <p class="page13-headline anim-text" data-delay="120">本场占比 18%</p>
            <div class="page13-hero anim-text" data-delay="240">
                <img class="page13-ball__img" src="assets/ball-spin.svg" alt="" aria-hidden="true">
            </div>
            <img class="page13-shadow anim-text" data-delay="360" src="" alt="" aria-hidden="true">
        </section>
""")

sections.append("""
        <!-- 导航 18 · 2005年法网决赛 -->
        <section class="page page-14 page-12" id="page-12" data-nav="18" aria-label="2005年法网决赛">
            <div class="page14-bg-wrap anim-text" data-delay="0">
                <div class="page14-bg-inner">
                    <img src="" alt="" aria-hidden="true">
                </div>
            </div>
            <p class="page5-text-regular page5-title-regular anim-text" data-delay="120">如果把你本场</p>
            <p class="page5-text-bold page5-title-bold anim-text" data-delay="240">最精彩的一分</p>
            <p class="page5-text-label page5-label-1 anim-text" data-delay="360">放进2005年法网决赛</p>
            <div class="page5-footer-wrap anim-text" data-delay="480">
                <p class="page5-text-regular small"><em>你会是</em></p>
                <p class="page5-text-regular small"><em>场上的主角吗？</em></p>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 19 · 相似度对比 -->
        <section class="page page-15" id="page-15" data-nav="19" aria-label="相似度对比">
            <svg class="page15-court-svg" viewBox="0 0 440 469" aria-hidden="true">
                <use href="assets/p15-ball.svg#court"></use>
            </svg>
            <p class="page15-text page15-desc-1 anim-text" data-delay="0">如果把你本场击球</p>
            <p class="page15-text page15-desc-2 anim-text" data-delay="100">和职业选手对比</p>
            <p class="page15-text page15-desc-3 anim-text" data-delay="200">相似度会从</p>
            <p class="page15-text page15-desc-4 anim-text" data-delay="300">100% 降到</p>
            <p class="page15-text page15-similar-title anim-text" data-delay="400">相似度</p>
            <p class="page15-big-number page15-percent-0 anim-text" data-delay="500">0%</p>
            <p class="page15-text page15-fact-title anim-text" data-delay="600">但事实是</p>
            <p class="page15-big-number page15-percent-100 anim-text" data-delay="700">100%</p>
            <img class="page15-tennis-icon anim-text" data-delay="800" src="assets/p15-ball.svg" alt="" aria-hidden="true">
            <img class="page15-racket-img anim-text" data-delay="800" src="assets/p17-racket-group.svg" alt="" aria-hidden="true">
        </section>
""")

sections.append("""
        <!-- 导航 20 · 隐藏大招 -->
        <section class="page page-skills" id="page-skills" data-nav="20" aria-label="隐藏大招">
            <div class="skill-stage" id="skillStage">
                <div class="skill-bg" aria-hidden="true"></div>

                <div class="skill-panel skill-panel--page1 is-active" data-page="1" data-nav="20" aria-label="技能总览">
                    <div class="skill-layout" data-figma="31:340">
                        <p class="skill-kicker spatial-reveal" data-order="0">如果你是一个游戏角色</p>
                        <p class="skill-headline spatial-reveal" data-order="1">你应该会有这些技能</p>
                        <div class="skill-icons">
                            <button type="button" class="skill-icon-item skill-icon-item--1 skill-icon-item--btn spatial-reveal app-tap" data-order="2" data-skill-target="2" aria-label="强力一击 · 查看详情">
                                <div class="skill-icon-item__bob">
                                    <img class="skill-icon-item__art" src="assets/page-skills/hub-skill-1.png" width="169" height="169" alt="">
                                </div>
                            </button>
                            <button type="button" class="skill-icon-item skill-icon-item--2 skill-icon-item--btn spatial-reveal app-tap" data-order="3" data-skill-target="3" aria-label="绝对防御 · 查看详情">
                                <div class="skill-icon-item__bob">
                                    <img class="skill-icon-item__art" src="assets/page-skills/hub-skill-2.png" width="169" height="169" alt="">
                                </div>
                            </button>
                            <button type="button" class="skill-icon-item skill-icon-item--3 skill-icon-item--btn spatial-reveal app-tap" data-order="4" data-skill-target="5" aria-label="能力觉醒 · 查看详情">
                                <div class="skill-icon-item__bob">
                                    <img class="skill-icon-item__art" src="assets/page-skills/hub-skill-3.png" width="169" height="169" alt="">
                                </div>
                            </button>
                        </div>
                        <p class="skill-hint spatial-reveal" data-order="5">点击查看详情</p>
                    </div>
                </div>

                <div class="skill-panel skill-panel--page2" data-page="2" data-nav="20-1" aria-label="技能 强力一击">
                    <div class="skill-p2-flyers" id="skillP2Flyers" aria-hidden="true"></div>
                    <div class="skill-layout skill-layout--p2" data-figma="225:185">
                        <nav class="skill-detail-switcher spatial-reveal" data-order="0" data-active="2" aria-label="技能切换">
                            <button type="button" class="skill-detail-switcher__ball app-tap" data-skill-switch="3" aria-label="绝对防御">
                                <span class="skill-detail-switcher__hero"><img src="assets/page-skills/hub-skill-2.png" width="169" height="169" alt=""></span>
                            </button>
                            <button type="button" class="skill-detail-switcher__ball app-tap" data-skill-switch="2" aria-label="强力一击" aria-current="true">
                                <span class="skill-p2-hero skill-detail-switcher__hero"><img src="assets/page-skills/hub-skill-1.png" width="169" height="169" alt=""></span>
                            </button>
                            <button type="button" class="skill-detail-switcher__ball app-tap" data-skill-switch="5" aria-label="能力觉醒">
                                <span class="skill-detail-switcher__hero"><img src="assets/page-skills/hub-skill-3.png" width="169" height="169" alt=""></span>
                            </button>
                        </nav>
                        <p class="skill-p2-badge spatial-reveal" data-order="1"><span data-text="skill_name">强力一击</span></p>
                        <p class="skill-p2-line skill-p2-line--1 spatial-reveal" data-order="2">释放后下一次击球</p>
                        <p class="skill-p2-line skill-p2-line--2 spatial-reveal" data-order="3">球速大幅提升</p>
                        <div class="skill-p2-stat skill-p2-stat--speed spatial-reveal" data-order="5">
                            <p class="skill-p2-stat__label">本场最高暴击</p>
                            <p class="skill-p2-stat__value">
                                <span class="skill-p2-stat__number skill-p2-stat__number--speed" data-count-idle="max_crit_speed_before" data-count-cast="max_crit_speed">65</span>
                                <span class="skill-p2-stat__unit">km/h</span>
                            </p>
                        </div>
                        <div class="skill-p2-stat skill-p2-stat--stroke spatial-reveal" data-order="6">
                            <p class="skill-p2-stat__label">来自</p>
                            <p class="skill-p2-stat__stroke" data-text="max_crit_stroke">正手截击</p>
                        </div>
                        <div class="skill-p2-stat skill-p2-stat--uses spatial-reveal" data-order="7">
                            <p class="skill-p2-stat__label">使用次数</p>
                            <p class="skill-p2-stat__value">
                                <span class="skill-p2-stat__number skill-p2-stat__number--uses" data-count-idle="crit_usage_before" data-count-cast="crit_usage_count">0</span>
                                <span class="skill-p2-stat__unit">拍</span>
                            </p>
                        </div>
                        <div class="skill-p2-cast-wrap spatial-reveal" data-order="8">
                            <button type="button" class="skill-p2-cast-btn app-tap" aria-label="释放技能">释放技能</button>
                        </div>
                    </div>
                    <button type="button" class="skill-close-btn app-tap spatial-reveal" data-order="9" aria-label="返回技能总览"><span class="skill-close-btn__x" aria-hidden="true"></span></button>
                </div>

                <div class="skill-panel skill-panel--page3" data-page="3" data-nav="20-2" aria-label="技能 绝对防御">
                    <div class="skill-layout skill-layout--p3" data-figma="225:196">
                        <nav class="skill-detail-switcher spatial-reveal" data-order="0" data-active="3" aria-label="技能切换">
                            <button type="button" class="skill-detail-switcher__ball app-tap" data-skill-switch="2" aria-label="强力一击">
                                <span class="skill-detail-switcher__hero"><img src="assets/page-skills/hub-skill-1.png" width="169" height="169" alt=""></span>
                            </button>
                            <button type="button" class="skill-detail-switcher__ball app-tap" data-skill-switch="5" aria-label="能力觉醒">
                                <span class="skill-detail-switcher__hero"><img src="assets/page-skills/hub-skill-3.png" width="169" height="169" alt=""></span>
                            </button>
                            <button type="button" class="skill-detail-switcher__ball app-tap" data-skill-switch="3" aria-label="绝对防御" aria-current="true">
                                <span class="skill-p3-hero skill-detail-switcher__hero"><img src="assets/page-skills/hub-skill-2.png" width="169" height="169" alt=""></span>
                            </button>
                        </nav>
                        <p class="skill-p3-badge spatial-reveal" data-order="1"><span data-text="skill_name_p3">绝对防御</span></p>
                        <p class="skill-p3-tagline spatial-reveal" data-order="2">最长回合守护</p>
                        <div class="skill-p3-spiral-stage" id="skillP3Stage">
                            <div class="skill-p3-shield-glow" aria-hidden="true"></div>
                            <div class="skill-p3-balls" aria-hidden="true"></div>
                        </div>
                        <p class="skill-p3-stat-label spatial-reveal" data-order="3">最长回合</p>
                        <p class="skill-p3-stat-num skill-p3-stat-num--shots spatial-reveal" data-order="4">
                            <span data-count="longest_rally_shots" data-count-idle="longest_rally_shots_before" data-count-cast="longest_rally_shots">18</span>拍
                        </p>
                        <p class="skill-p3-stat-label spatial-reveal" data-order="5">持续了</p>
                        <p class="skill-p3-stat-num skill-p3-stat-num--duration spatial-reveal" data-order="6">
                            <span data-count="longest_rally_duration" data-count-idle="longest_rally_duration_before" data-count-cast="longest_rally_duration">36.6</span>秒
                        </p>
                        <button type="button" class="skill-p3-cast-btn app-tap spatial-reveal" data-order="7" aria-label="施放技能">施放技能</button>
                    </div>
                    <button type="button" class="skill-close-btn app-tap spatial-reveal" data-order="8" aria-label="返回技能总览"><span class="skill-close-btn__x" aria-hidden="true"></span></button>
                </div>

                <div class="skill-panel skill-panel--page5" data-page="5" data-nav="20-3" aria-label="技能 能力觉醒">
                    <div class="skill-p5-bg" aria-hidden="true"></div>
                    <div class="skill-layout skill-layout--p5" data-figma="31:347">
                        <nav class="skill-detail-switcher spatial-reveal" data-order="0" data-active="5" aria-label="技能切换">
                            <button type="button" class="skill-detail-switcher__ball app-tap" data-skill-switch="2" aria-label="强力一击">
                                <span class="skill-detail-switcher__hero"><img src="assets/page-skills/hub-skill-1.png" width="169" height="169" alt=""></span>
                            </button>
                            <button type="button" class="skill-detail-switcher__ball app-tap" data-skill-switch="5" aria-label="能力觉醒" aria-current="true">
                                <span class="skill-p5-hero skill-detail-switcher__hero"><img src="assets/page-skills/hub-skill-3.png" width="169" height="169" alt=""></span>
                            </button>
                            <button type="button" class="skill-detail-switcher__ball app-tap" data-skill-switch="3" aria-label="绝对防御">
                                <span class="skill-detail-switcher__hero"><img src="assets/page-skills/hub-skill-2.png" width="169" height="169" alt=""></span>
                            </button>
                        </nav>
                        <p class="skill-p5-badge spatial-reveal" data-order="1"><span data-text="skill_name_p5">能力觉醒</span></p>
                        <p class="skill-p5-tagline spatial-reveal" data-order="2">使用后获得一种拍型的巨大进步</p>
                        <div class="skill-p5-chart spatial-reveal" id="skillP5Stage" data-order="3">
                            <div class="skill-p5-arrow-bg" aria-hidden="true">
                                <img src="assets/page-skills/p5-arrow-polygon.svg" width="551" height="925" alt="">
                            </div>
                            <div class="skill-p5-bar skill-p5-bar--mistake">
                                <p class="skill-p5-bar__value">
                                    <span class="skill-p5-bar__val skill-p5-bar__val--before"><span data-count="mistake_rate_before_pct">21.63</span>%</span>
                                    <span class="skill-p5-bar__val skill-p5-bar__val--after" aria-hidden="true"><span data-count="mistake_rate_after_pct">17.89</span>%</span>
                                </p>
                                <div class="skill-p5-bar__fill"></div>
                                <div class="skill-p5-bar__tick"></div>
                                <p class="skill-p5-bar__label">失误率</p>
                            </div>
                            <div class="skill-p5-bar skill-p5-bar--speed">
                                <p class="skill-p5-bar__value">
                                    <span class="skill-p5-bar__val skill-p5-bar__val--before"><span data-count="avg_speed_before_kmh">63.89</span>km/h</span>
                                    <span class="skill-p5-bar__val skill-p5-bar__val--after" aria-hidden="true"><span data-count="avg_speed_after_kmh">68.19</span> km/h</span>
                                </p>
                                <div class="skill-p5-bar__fill"></div>
                                <div class="skill-p5-bar__tick"></div>
                                <p class="skill-p5-bar__label">平均球速</p>
                            </div>
                            <div class="skill-p5-bar skill-p5-bar--deep">
                                <p class="skill-p5-bar__value">
                                    <span class="skill-p5-bar__val skill-p5-bar__val--before"><span data-count="deep_rate_before_pct">43.93</span>%</span>
                                    <span class="skill-p5-bar__val skill-p5-bar__val--after" aria-hidden="true"><span data-count="deep_rate_after_pct">50.20</span>%</span>
                                </p>
                                <div class="skill-p5-bar__fill"></div>
                                <div class="skill-p5-bar__tick"></div>
                                <p class="skill-p5-bar__label">平均深球率</p>
                            </div>
                        </div>
                        <button type="button" class="skill-p5-cast-btn app-tap spatial-reveal" data-order="4" aria-label="施放技能">施放技能</button>
                    </div>
                    <button type="button" class="skill-close-btn app-tap spatial-reveal" data-order="5" aria-label="返回技能总览"><span class="skill-close-btn__x" aria-hidden="true"></span></button>
                </div>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 21 · 教练碎碎念 第一页 -->
        <section class="page page-coach page-coach-1" id="page-coach-1" data-coach-page="1" data-nav="21" aria-label="教练碎碎念 第一页">
            <div class="coach-stage">
                <div class="coach-panel coach-panel--page1 is-active" data-page="1" aria-label="教练碎碎念 第一页">
                    <div class="coach-bg" aria-hidden="true"></div>
                    <img class="coach-alert spatial-reveal" data-order="0" src="assets/coach-alert.svg" alt="" aria-hidden="true">
                    <p class="coach-line coach-line--1 spatial-reveal" data-order="1">教练有话说</p>
                    <p class="coach-line coach-line--2 spatial-reveal" data-order="2">下滑听听碎碎念</p>
                </div>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 22 · 教练碎碎念 第二页 · Figma 63:751 -->
        <section class="page page-coach page-coach-2" id="page-coach-2" data-coach-page="2" data-nav="22" aria-label="教练碎碎念 第二页">
            <div class="coach-stage">
                <div class="coach-panel coach-panel--page2 is-active" data-page="2" data-figma="63:751" aria-label="教练碎碎念 第二页">
                    <div class="coach-page2-bg" aria-hidden="true">
                        <div class="coach-page2-paper-lines" aria-hidden="true"></div>
                        <div class="coach-page2-blue-wrap">
                            <img class="coach-page2-blue" src="assets/coach-page2-blue.svg" alt="">
                        </div>
                    </div>
                    <img class="coach-quote-open" src="assets/coach-page2-quote.svg" width="188" height="142" alt="" aria-hidden="true">
                    <h1 class="coach-headline spatial-reveal" data-order="0">
                        <span class="coach-headline__line">老毛病</span>
                        <span class="coach-headline__line">咱能改改吗？</span>
                    </h1>
                    <p class="coach-stat coach-stat--lead spatial-reveal" data-order="1">四堂课了，</p>
                    <p class="coach-stat coach-stat--prefix spatial-reveal" data-order="2">你一共打框了</p>
                    <p class="coach-stat coach-stat--number spatial-reveal" data-order="3"><span data-count="frame_hits_total">209</span></p>
                    <p class="coach-stat coach-stat--suffix spatial-reveal" data-order="4">次</p>
                    <p class="coach-stat coach-stat--question spatial-reveal" data-order="5">你球拍的甜区和网球刚离婚吗？</p>
                    <div class="coach-page2-paper-card-wrap spatial-reveal" data-order="5" aria-hidden="true">
                        <img class="coach-page2-paper-card" src="assets/coach-page2-paper-card.svg" alt="">
                    </div>
                    <div class="coach-racket spatial-reveal" data-order="5" aria-hidden="true">
                        <div class="coach-racket__visual">
                            <img class="coach-racket__img" src="assets/coach-racket-figure.svg" width="407" height="269" alt="">
                            <div class="coach-racket__area" style="opacity:0" data-area-cx="118.635" data-area-cy="200.216" data-area-rx="106.178" data-area-ry="91.652" data-area-rot="-13.03" aria-hidden="true"></div>
                            <svg class="coach-racket__dots" id="coachRacketDots" viewBox="0 0 406.5 268.5" preserveAspectRatio="xMidYMid meet" aria-hidden="true"></svg>
                        </div>
                    </div>
                    <p class="coach-foot coach-foot--1 spatial-reveal" data-order="6">正手的失误率居然比第二次训练还高</p>
                    <p class="coach-foot coach-foot--reach spatial-reveal" data-order="7">达到了</p>
                    <p class="coach-foot coach-foot--rate spatial-reveal" data-order="8"><span data-count="forehand_mistake_rate_pct">20</span>%</p>
                    <p class="coach-foot coach-foot--2 spatial-reveal" data-order="9">比刚学的正、反手截击还高！！！</p>
                    <p class="coach-foot coach-foot--3 spatial-reveal" data-order="10">喜新厌旧的人！！！</p>
                </div>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 23 · 教练碎碎念 第三页 -->
        <section class="page page-coach page-coach-3" id="page-coach-3" data-coach-page="3" data-nav="23" aria-label="教练碎碎念 第三页">
            <div class="coach-stage">
                <div class="coach-panel coach-panel--page3 is-active" data-page="3" aria-label="教练碎碎念 第三页">
                    <div class="coach-page3-bg" aria-hidden="true">
                        <div class="coach-page3-red-wrap">
                            <img class="coach-page3-red" src="assets/coach-page3-red.svg" alt="">
                        </div>
                    </div>
                    <img class="coach-quote-open" src="assets/coach-quote-open.svg" alt="" aria-hidden="true">
                    <h1 class="coach-headline spatial-reveal" data-order="0"><span class="coach-headline__line">心率曲线</span><span class="coach-headline__line">有点意思</span></h1>
                    <p class="coach-page3-lead spatial-reveal" data-order="1">四堂课下来，你的心率</p>
                    <p class="coach-page3-prefix spatial-reveal" data-order="2">到训练后期</p>
                    <p class="coach-page3-emphasis spatial-reveal" data-order="3">居然在下降</p>
                    <div class="coach-page3-chart spatial-reveal" data-order="4" id="coachHrChart">
                        <svg class="coach-page3-chart__svg" viewBox="0 0 440 300" aria-hidden="true">
                            <g id="coachHrHearts"></g>
                        </svg>
                        <div class="coach-page3-chart__ball"><img src="assets/ball.svg" alt="" aria-hidden="true"></div>
                    </div>
                    <p class="coach-page3-foot spatial-reveal" data-order="5">你是来练球还是来冥想？</p>
                </div>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 24 · 教练碎碎念 第四页 -->
        <section class="page page-coach page-coach-4" id="page-coach-4" data-coach-page="4" data-nav="24" aria-label="教练碎碎念 第四页">
            <div class="coach-stage">
                <div class="coach-panel coach-panel--page4 is-active" data-page="4" aria-label="教练碎碎念 第四页">
                    <div class="coach-page4-bg" aria-hidden="true">
                        <div class="coach-page4-diagonal-wrap">
                            <div class="coach-page4-diagonal-inner">
                                <img class="coach-page4-diagonal" src="assets/coach-page4-diagonal.svg" alt="">
                            </div>
                        </div>
                        <img class="coach-page4-court__svg" src="assets/coach-page4-court-lines.svg" alt="" aria-hidden="true">
                    </div>
                    <p class="coach-page4-intro spatial-reveal" data-order="0">其实我一直觉得</p>
                    <p class="coach-page4-title spatial-reveal" data-order="1">你的球路太单一</p>
                    <svg class="coach-page4-pierce-line spatial-reveal" data-order="2" data-pierce-ux="0.7" data-pierce-uy="0.3" data-pierce-dist="120" viewBox="0 0 440 956" aria-hidden="true"><line x1="80" y1="200" x2="360" y2="700" stroke="#fff" stroke-width="2"/></svg>
                    <svg class="coach-page4-pierce-line spatial-reveal" data-order="3" data-pierce-ux="0.5" data-pierce-uy="0.5" data-pierce-dist="120" viewBox="0 0 440 956" aria-hidden="true"><line x1="220" y1="300" x2="220" y2="750" stroke="#fff" stroke-width="2"/></svg>
                    <svg class="coach-page4-pierce-line spatial-reveal" data-order="4" data-pierce-ux="-0.6" data-pierce-uy="0.4" data-pierce-dist="120" viewBox="0 0 440 956" aria-hidden="true"><line x1="360" y1="250" x2="100" y2="720" stroke="#fff" stroke-width="2"/></svg>
                    <div class="coach-page4-row coach-page4-row--1 spatial-reveal" data-order="7">
                        <span class="coach-page4-row__lead">斜线</span>
                        <span class="coach-page4-row__pct" data-count="direction_cross_pct">64.1</span>
                        <span class="coach-page4-row__tail">%</span>
                    </div>
                    <div class="coach-page4-row coach-page4-row--2 spatial-reveal" data-order="8">
                        <span class="coach-page4-row__lead">直线</span>
                        <span class="coach-page4-row__pct" data-count="direction_straight_pct">27.3</span>
                        <span class="coach-page4-row__tail">%</span>
                    </div>
                    <div class="coach-page4-row coach-page4-row--3 spatial-reveal" data-order="9">
                        <span class="coach-page4-row__lead">追身</span>
                        <span class="coach-page4-row__pct" data-count="direction_body_pct">8.6</span>
                        <span class="coach-page4-row__tail">%</span>
                    </div>
                </div>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 25 · 教练碎碎念 第五页 -->
        <section class="page page-coach page-coach-5" id="page-coach-5" data-coach-page="5" data-nav="25" aria-label="教练碎碎念 第五页">
            <div class="coach-stage">
                <div class="coach-panel coach-panel--page5 is-active" data-page="5" aria-label="教练碎碎念 第五页">
                    <div class="coach-page5-bg" aria-hidden="true">
                        <div class="coach-page5-blue-wrap">
                            <img class="coach-page5-blue" src="assets/coach-page5-blue.svg" alt="">
                        </div>
                    </div>
                    <img class="coach-quote-close" src="assets/coach-quote-close.svg" alt="" aria-hidden="true">
                    <h1 class="coach-headline coach-headline--page5 spatial-reveal" data-order="0">
                        <span class="coach-headline__line">最长回合</span>
                        <span class="coach-headline__line">有点离谱</span>
                    </h1>
                    <p class="coach-page5-line coach-page5-line--stat coach-page5-line--1 spatial-reveal" data-order="1">
                        <span class="coach-page5-line__regular">一共打了 </span><span class="coach-page5-line__em" data-count="smash_rally_shots">25</span><span class="coach-page5-line__regular"> 拍</span>
                    </p>
                    <p class="coach-page5-line coach-page5-line--stat coach-page5-line--2 spatial-reveal" data-order="2">
                        <span class="coach-page5-line__regular">持续了 </span><span class="coach-page5-line__em" data-count="smash_rally_seconds">66.9</span><span class="coach-page5-line__regular"> 秒</span>
                    </p>
                    <p class="coach-page5-line coach-page5-line--body spatial-reveal" data-order="3">这一分要是放电视上，观众都要换台了</p>
                    <p class="coach-page5-punch spatial-reveal" data-order="4">你还打框了！</p>
                    <p class="coach-page5-qr-lead spatial-reveal" data-order="5">扫码看这一分的回放</p>
                    <div class="coach-page5-qr spatial-reveal" data-order="6" aria-hidden="true"></div>
                    <div class="coach-page5-foot spatial-reveal" data-order="7">
                        <p class="coach-page5-foot__line">教练已经无话可说了</p>
                        <p class="coach-page5-foot__line">下次见</p>
                    </div>
                </div>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 26 · 结尾展望 第一页 -->
        <section class="page page-outro page-outro-1" id="page-outro-1" data-outro-page="1" data-nav="26" aria-label="结尾展望 第一页">
            <div class="outro-stage">
                <div class="outro-panel outro-panel--page1 is-active" data-page="1" aria-label="结尾展望 第一页">
                    <div class="outro-bg" aria-hidden="true"></div>
                    <div class="outro-layout">
                        <div class="outro-intro spatial-reveal" data-order="0">
                            <p class="outro-intro__line">四堂课下来</p>
                            <p class="outro-intro__line">你的失误率从</p>
                            <p class="outro-intro__spacer" aria-hidden="true"></p>
                            <p class="outro-intro__line">一路降到</p>
                        </div>
                        <p class="outro-pct outro-pct--from spatial-reveal" data-order="1" data-count="mistake_rate_first">20%</p>
                        <p class="outro-drop spatial-reveal" data-order="2">下降了</p>
                        <p class="outro-pct outro-pct--to spatial-reveal" data-order="3" data-count="mistake_rate_last">18%</p>
                        <p class="outro-copy spatial-reveal" data-order="4">按这个速度</p>
                        <p class="outro-bottom-lead spatial-reveal" data-order="5">再练</p>
                        <p class="outro-pct outro-pct--proj spatial-reveal" data-order="6" data-count="extra_sessions">30</p>
                        <p class="outro-bottom-tail spatial-reveal" data-order="7">节课</p>
                    </div>
                </div>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 27 · 结尾展望 第二页 -->
        <section class="page page-outro page-outro-2" id="page-outro-2" data-outro-page="2" data-nav="27" aria-label="结尾展望 第二页">
            <div class="outro-stage">
                <div class="outro-panel outro-panel--page2 is-active" data-page="2" aria-label="结尾展望 第二页">
                    <div class="outro-page2-bg" aria-hidden="true"></div>
                    <div class="outro-layout">
                        <p class="outro2-intro spatial-reveal" data-order="0"><span class="outro2-intro__line">如果保持</span></p>
                        <h2 class="outro2-headline spatial-reveal" data-order="1">
                            <span class="outro2-headline__line">每</span>
                            <span class="outro2-headline__spacer" aria-hidden="true"></span>
                            <span class="outro2-headline__line"><span data-count="avg_interval_days">11</span>天</span>
                        </h2>
                        <p class="outro2-visit spatial-reveal" data-order="2">来一次</p>
                        <div class="outro2-punch spatial-reveal" data-order="3">
                            <p class="outro2-punch__line">一年后</p>
                            <p class="outro2-punch__line">你会变成什么样？</p>
                        </div>
                        <div class="outro2-copy outro2-copy--1 spatial-reveal" data-order="4">
                            <p class="outro2-copy__line">也许失误率</p>
                            <p class="outro2-copy__line">还能再降一点</p>
                        </div>
                        <div class="outro2-copy outro2-copy--2 spatial-reveal" data-order="5">
                            <p class="outro2-copy__line">也许你会打出</p>
                            <p class="outro2-copy__spacer" aria-hidden="true"></p>
                            <p class="outro2-copy__line">属于自己的风格</p>
                        </div>
                        <p class="outro2-tagline spatial-reveal" data-order="6">值得期待</p>
                    </div>
                </div>
            </div>
        </section>
""")

sections.append("""
        <!-- 导航 28 · 结尾展望 第三页 -->
        <section class="page page-outro page-outro-3" id="page-outro-3" data-outro-page="3" data-nav="28" aria-label="结尾展望 第三页">
            <div class="outro-stage">
                <div class="outro-panel outro-panel--page3 is-active" data-page="3" aria-label="结尾展望 第三页">
                    <div class="outro-layout outro-layout--page3">
                        <div class="outro-page3-court-wrap" aria-hidden="true">
                            <img class="outro-page3-court" src="assets/outro-page3-court.svg" alt="">
                        </div>
                        <p class="outro3-kicker spatial-reveal" data-order="0">下一场训练</p>
                        <h2 class="outro3-title spatial-reveal" data-order="1">球场见</h2>
                        <p class="outro3-copy spatial-reveal" data-order="2">继续把数据</p>
                        <p class="outro3-copy outro3-copy--2 spatial-reveal" data-order="3">打成你的故事</p>
                    </div>
                </div>
            </div>
        </section>
""")

html = HEAD + "".join(sections) + FOOT
OUT.write_text(html, encoding="utf-8")
print(f"Wrote {OUT} ({len(html)} bytes, {len(sections)} sections)")
