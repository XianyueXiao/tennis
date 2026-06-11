/**
 * 页码约定：用户说的「第 N 页 / Pn」= 左侧导航按钮 N（1…25），不是 section 的 id（如 page-2）。
 * 代码下标：pageIndex = 导航 N - 1。
 */
document.addEventListener('DOMContentLoaded', () => {
    const pagesWrapper = document.getElementById('pages-wrapper');
    const pages = pagesWrapper
        ? pagesWrapper.querySelectorAll(':scope > section.page')
        : document.querySelectorAll('.page');
    const INTRO_PAGE_COUNT = 4;
    const CAKE_PAGE_INDEX = 4;
    const totalPages = pages.length;
    let currentPage = 0;
    let isAnimating = false;
    /** 一次滚动手势会连发多个 wheel，需比翻页动画(800ms)更长地锁住输入 */
    let navInputLockedUntil = 0;
    const NAV_INPUT_LOCK_MS = 900;
    /** 同一触控板/滚轮手势内只翻一页：末次 wheel 后间隔到期才允许下一次 */
    let wheelGestureLocked = false;
    let wheelGestureUnlockTimer = null;
    const WHEEL_GESTURE_GAP_MS = 320;

    function canAcceptNavInput() {
        return !isAnimating && !wheelGestureLocked && performance.now() >= navInputLockedUntil;
    }

    function lockNavInput() {
        navInputLockedUntil = performance.now() + NAV_INPUT_LOCK_MS;
    }

    function lockWheelGesture() {
        wheelGestureLocked = true;
        clearTimeout(wheelGestureUnlockTimer);
        wheelGestureUnlockTimer = setTimeout(() => {
            wheelGestureLocked = false;
            wheelGestureUnlockTimer = null;
        }, WHEEL_GESTURE_GAP_MS);
    }

    function extendWheelGestureLock() {
        if (!wheelGestureLocked) return;
        clearTimeout(wheelGestureUnlockTimer);
        wheelGestureUnlockTimer = setTimeout(() => {
            wheelGestureLocked = false;
            wheelGestureUnlockTimer = null;
        }, WHEEL_GESTURE_GAP_MS);
    }

    const SCROLL_TARGETS = [
        0, 0, 0, 0, 100, 200, 300, 300, 400, 400, 500, 600,
        700, 800, 800, 800, 900, 1000, 1100, 1200, 1300, 1400, 1500, 1600, 1700
    ];

    if (SCROLL_TARGETS.length !== totalPages) {
        console.warn(
            `[ReportPager] SCROLL_TARGETS(${SCROLL_TARGETS.length}) 与页面数(${totalPages}) 不一致，可能导致索引错位`
        );
    }

    const reportPageMeta = Array.from(pages, (page, index) => {
        const nav = index + 1;
        return {
            index,
            nav,
            id: page.id || `page-${index}`,
            label: page.getAttribute('aria-label') || page.id || `导航 ${nav}`,
        };
    });

    function pageIndexById(id) {
        return reportPageMeta.find((m) => m.id === id)?.index ?? -1;
    }

    const PAGE15_INDEX = pageIndexById('page-15');
    const SKILLS_PAGE_INDEX = pageIndexById('page-skills');
    const COACH_PAGE_START = pageIndexById('page-coach-1');
    const COACH_PAGE_END = pageIndexById('page-coach-4');
    const OUTRO_PAGE_START = pageIndexById('page-outro-1');
    const OUTRO_PAGE_END = pageIndexById('page-outro-1');
    const RUN_TRAIL_PAGE_INDEX = pageIndexById('page-5-trail');
    const SPATIAL_PAGE6_INDEX = pageIndexById('page-6');
    const SPATIAL_PAGE7_INDEX = pageIndexById('page-7');
    const SPATIAL_PAGE_ID_MAP = {
        'page-6': 6,
        'page-7': 7,
        'page-8': 8,
        'page-9': 9,
    };
    const PAGE2_INDEX = pageIndexById('page-2');
    const PAGE3_INDEX = pageIndexById('page-3');
    const PAGE4_INDEX = pageIndexById('page-4');

    /** 空间分布首屏（page-6）在 DOM 中的下标，用于 SpatialModule 页码 6–9 */
    const SPATIAL_FIRST_INDEX = pageIndexById('page-6');
    /** 球星影子叠层首屏（page-10） */
    const HERO_STACK_FIRST_INDEX = pageIndexById('page-10');

    function syncLayoutCssVars() {
        document.documentElement.style.setProperty('--intro-page-count', String(INTRO_PAGE_COUNT));
        const stackVars = [
            ['--stack-p3-top', 'page-3'],
            ['--stack-p6-top', 'page-6'],
            ['--hero-stack-top', 'page-10'],
        ];
        stackVars.forEach(([cssVar, pageId]) => {
            const idx = pageIndexById(pageId);
            if (idx >= 0) {
                document.documentElement.style.setProperty(cssVar, `${getScrollTarget(idx)}vh`);
            }
        });
    }
    syncLayoutCssVars();

    function getScrollTarget(pageIndex) {
        return SCROLL_TARGETS[pageIndex] ?? pageIndex * 100;
    }

    /** 左侧索引跳转时重置叠层/过渡 class，避免与滚轮翻页状态不一致 */
    function resetOverlayTransitionState() {
        const p8 = document.getElementById('page-8');
        const p9 = document.getElementById('page-9');
        const p9Ball = p9 ? p9.querySelector('.sp-rpm-ball') : null;

        const page2El = document.getElementById('page-2');
        if (page2El) page2El.classList.remove('hr-transition-active', 'hr-transition-done');
        if (page2El) page2El.style.background = '';
        if (window.HrHeartTransition?.stop) window.HrHeartTransition.stop();
        if (p8) p8.classList.remove('p8-fade-out');
        const p10 = document.getElementById('page-10');
        const p11 = document.getElementById('page-11');
        const forehandPage = document.getElementById('page-14');
        if (p10) p10.classList.remove('exit-to-11');
        if (p11) p11.classList.remove('exit-to-12');
        if (forehandPage) forehandPage.classList.remove('exit-to-13');
        const coach4 = document.getElementById('page-coach-4');
        if (coach4) coach4.classList.remove('exit-to-outro');
        document.documentElement.classList.remove('html--court-p24-p25');
    }

    function syncStackedOverlayStates(pageIndex) {
        /** #page-3 = 导航7 平均回合；#page-4 = 导航8 训练阶段（id 与导航号不一致） */
        const p3 = document.getElementById('page-3');
        const p4 = document.getElementById('page-4');
        const p7 = document.getElementById('page-7');
        const p10 = document.getElementById('page-10');
        const p11 = document.getElementById('page-11');
        /** id 与导航对齐：正手 = page-14；法网 2005 = page-12（样式仍用 .page-12 / .page-14） */
        const forehandPage = document.getElementById('page-14');
        const frenchOpenPage = document.getElementById('page-12');

        /** 导航 8–9：平均回合页淡出，训练阶段叠层激活 */
        const showP4Stack = pageIndex === PAGE4_INDEX || pageIndex === SPATIAL_PAGE6_INDEX;
        if (p3) {
            p3.classList.toggle('zoom-out-active', showP4Stack);
            if (pageIndex === PAGE3_INDEX) {
                p3.querySelectorAll('.p3-text-group, .p3-stat-group, .arc-svg').forEach((el) => {
                    el.style.opacity = '';
                    el.style.animation = '';
                });
            }
        }
        if (p4) p4.classList.toggle('active', showP4Stack);

        if (p7) p7.classList.toggle('active', pageIndex === pageIndexById('page-7'));

        /** 叠层退出动画：仅在翻到「下一层」时加 exit-to，当前页本身不加 */
        if (p10) p10.classList.toggle('exit-to-11', HERO_STACK_FIRST_INDEX >= 0 && pageIndex > HERO_STACK_FIRST_INDEX);
        if (p11) p11.classList.toggle('exit-to-12', HERO_STACK_FIRST_INDEX >= 0 && pageIndex > HERO_STACK_FIRST_INDEX + 1);
        if (forehandPage) forehandPage.classList.toggle('exit-to-13', HERO_STACK_FIRST_INDEX >= 0 && pageIndex > HERO_STACK_FIRST_INDEX + 2);

        if (frenchOpenPage) frenchOpenPage.classList.toggle('exit-to-15', pageIndex > pageIndexById('page-12'));

        const coach4 = document.getElementById('page-coach-4');
        if (coach4) {
            coach4.classList.toggle(
                'exit-to-outro',
                OUTRO_PAGE_START >= 0 && COACH_PAGE_END >= 0 && pageIndex > COACH_PAGE_END
            );
        }
    }

    function clearAllPageActive() {
        pages.forEach((page) => page.classList.remove('active'));
    }

    function isCoachPage(pageIndex) {
        return pageIndex >= COACH_PAGE_START && pageIndex <= COACH_PAGE_END;
    }

    function coachPageNum(pageIndex) {
        return pageIndex - COACH_PAGE_START + 1;
    }

    function isOutroPage(pageIndex) {
        return pageIndex >= OUTRO_PAGE_START && pageIndex <= OUTRO_PAGE_END;
    }

    function outroPageNum(pageIndex) {
        return pageIndex - OUTRO_PAGE_START + 1;
    }

    const introPage = document.getElementById('page-intro');
    const basketPage = document.getElementById('page-basket');
    const basketRainPage = document.getElementById('page-basket-rain');
    const basketRainChartPage = document.getElementById('page-basket-rain-chart');
    const basketSim = basketPage && window.initIntroBasketPage
        ? window.initIntroBasketPage(basketPage)
        : { start() {}, stop() {}, reset() {}, resize() {}, setOnSettled() {} };
    const basketRainCtrl = basketPage && basketRainPage && window.initIntroBasketRain
        ? window.initIntroBasketRain(basketPage, basketRainPage, basketRainChartPage, basketSim)
        : null;
    const pageIndicator = document.getElementById('page-indicator');

    function updatePageIndicator(pageIndex) {
        if (pageIndicator) {
            pageIndicator.textContent = `${pageIndex + 1} / ${totalPages}`;
        }
        syncDevPageNav(pageIndex);
        if (window.parent !== window.self) {
            window.parent.postMessage({ type: 'tennis-report-page', page: pageIndex }, '*');
        }
    }

    const SKILL_DETAIL_NAV = [
        { nav: '20-1', page: 2, label: '强力一击' },
        { nav: '20-2', page: 3, label: '绝对防御' },
        { nav: '20-3', page: 5, label: '能力觉醒' },
    ];

    function syncDevPageNav(pageIndex) {
        const skillState =
            pageIndex === SKILLS_PAGE_INDEX
                ? window.SkillsModule?.getNavState?.()
                : null;

        document.querySelectorAll('.dev-page-nav__btn').forEach((btn) => {
            const skillNav = btn.dataset.skillNav;
            let active = false;

            if (skillNav) {
                active =
                    skillState?.mode === 'detail' && skillState?.nav === skillNav;
            } else {
                active = Number(btn.dataset.page) === pageIndex + 1;
                if (
                    active &&
                    pageIndex === SKILLS_PAGE_INDEX &&
                    skillState?.mode === 'detail'
                ) {
                    active = false;
                }
            }

            btn.classList.toggle('is-active', active);
        });
    }

    function jumpToSkillDetail(detailPage) {
        if (SKILLS_PAGE_INDEX < 0) return;
        window.SkillsModule?.setPendingDetail?.(detailPage);
        if (currentPage === SKILLS_PAGE_INDEX) {
            window.SkillsModule?.openDetailDirect?.(detailPage);
            syncDevPageNav(SKILLS_PAGE_INDEX);
            return;
        }
        jumpToPage(SKILLS_PAGE_INDEX);
    }

    let forceNavJump = false;
    let pageTransitionTimer = null;

    function jumpToPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= totalPages || pageIndex === currentPage) return;
        isAnimating = false;
        navInputLockedUntil = 0;
        wheelGestureLocked = false;
        clearTimeout(wheelGestureUnlockTimer);
        wheelGestureUnlockTimer = null;

        const wrapper = document.getElementById('pages-wrapper');
        if (wrapper) wrapper.style.transition = 'none';

        forceNavJump = true;
        goToPage(pageIndex);
        forceNavJump = false;

        if (wrapper) {
            void wrapper.offsetHeight;
            requestAnimationFrame(() => {
                wrapper.style.transition = '';
            });
        }
    }

    function initDevPageNav() {
        if (window.self !== window.top) return;

        const nav = document.createElement('nav');
        nav.className = 'dev-page-nav';
        nav.setAttribute('aria-label', '页面索引');

        reportPageMeta.forEach((meta) => {
            const btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'dev-page-nav__btn';
            btn.dataset.page = String(meta.index + 1);
            btn.textContent = String(meta.index + 1);
            btn.title = meta.label
                ? `导航 ${meta.nav} · ${meta.label}${meta.id ? `（${meta.id}）` : ''}`
                : `导航 ${meta.nav}${meta.id ? `（${meta.id}）` : ''}`;
            btn.setAttribute('aria-label', meta.label || `导航 ${meta.nav}`);
            btn.addEventListener('click', () => {
                if (meta.id === 'page-skills' && window.SkillsModule?.goToHub) {
                    window.SkillsModule.goToHub();
                }
                jumpToPage(meta.index);
            });
            nav.appendChild(btn);

            if (meta.id === 'page-skills') {
                SKILL_DETAIL_NAV.forEach((sub) => {
                    const subBtn = document.createElement('button');
                    subBtn.type = 'button';
                    subBtn.className = 'dev-page-nav__btn dev-page-nav__btn--sub';
                    subBtn.dataset.skillNav = sub.nav;
                    subBtn.textContent = sub.nav.replace('20-', '·');
                    subBtn.title = `导航 ${sub.nav} · ${sub.label}（page-skills）`;
                    subBtn.setAttribute('aria-label', sub.label);
                    subBtn.addEventListener('click', () => jumpToSkillDetail(sub.page));
                    nav.appendChild(subBtn);
                });
            }
        });

        document.body.prepend(nav);
        document.addEventListener('skill-nav-change', () => {
            syncDevPageNav(currentPage);
        });
        syncDevPageNav(currentPage);
    }

    window.ReportPager = {
        goToPage: jumpToPage,
        goToSkillDetail: jumpToSkillDetail,
        getCurrentPage: () => currentPage,
        getTotalPages: () => totalPages,
        getPageMeta: () => reportPageMeta.slice(),
    };

    window.addEventListener('message', (e) => {
        if (e.data?.type === 'tennis-report-goto' && typeof e.data.page === 'number') {
            jumpToPage(e.data.page);
        }
        if (e.data?.type === 'tennis-report-goto-skill' && typeof e.data.page === 'number') {
            jumpToSkillDetail(e.data.page);
        }
    });

    updatePageIndicator(currentPage);

    pagesWrapper.style.transition = 'none';
    pagesWrapper.style.transform = 'translateY(0)';
    setTimeout(() => {
        pagesWrapper.style.transition = '';
    }, 100);

    if (window.SpatialScene) {
        window.SpatialScene.init();
    }
    if (window.SpatialModule) {
        window.SpatialModule.init();
    }

    pages.forEach((page, index) => {
        if (index === currentPage) {
            page.classList.add('active');
        } else {
            page.classList.remove('active');
            const animatedElements = page.querySelectorAll('.fade-in-up, .pop-in, .slide-up, .draw-mask-path, .fly-arc');
            animatedElements.forEach(el => {
                el.style.animation = 'none';
            });
        }
    });

    window.addEventListener('wheel', (e) => {
        e.preventDefault();

        if (wheelGestureLocked) {
            extendWheelGestureLock();
            return;
        }

        if (!canAcceptNavInput()) return;

        if (
            currentPage === SKILLS_PAGE_INDEX &&
            window.SkillsModule?.getNavState?.()?.mode === 'detail'
        ) {
            if (e.deltaY > 0 && COACH_PAGE_START >= 0) {
                goToPage(COACH_PAGE_START);
                lockWheelGesture();
                return;
            }
            if (e.deltaY < 0) {
                lockWheelGesture();
                return;
            }
        }

        if (window.SkillsModule?.scrollGuard?.()) return;
        if (window.CoachModule?.isBusy?.()) return;
        if (window.OutroModule?.isBusy?.()) return;

        if (e.deltaY > 0) {
            goToPage(currentPage + 1);
            lockWheelGesture();
        } else if (e.deltaY < 0) {
            goToPage(currentPage - 1);
            lockWheelGesture();
        }
    }, { passive: false });

    let startY = 0;
    window.addEventListener('touchstart', (e) => {
        startY = e.touches[0].clientY;
    });

    window.addEventListener('touchend', (e) => {
        if (!canAcceptNavInput()) return;

        const endY = e.changedTouches[0].clientY;
        const diff = startY - endY;

        if (
            currentPage === SKILLS_PAGE_INDEX &&
            window.SkillsModule?.getNavState?.()?.mode === 'detail'
        ) {
            if (diff > 50 && COACH_PAGE_START >= 0) {
                goToPage(COACH_PAGE_START);
                lockWheelGesture();
                return;
            }
            if (diff < -50) {
                lockWheelGesture();
                return;
            }
        }

        if (window.SkillsModule?.scrollGuard?.()) return;
        if (window.CoachModule?.isBusy?.()) return;
        if (window.OutroModule?.isBusy?.()) return;

        if (diff > 50) {
            goToPage(currentPage + 1);
            lockWheelGesture();
        } else if (diff < -50) {
            goToPage(currentPage - 1);
            lockWheelGesture();
        }
    });


    const INTRO_IMAGE_SLIDE_MS = 1050;
    const INTRO_P2_ENTER_AT_MS = Math.round(INTRO_IMAGE_SLIDE_MS * 0.78);
    const INTRO_P2_STABLE_MS = INTRO_IMAGE_SLIDE_MS + 500;
    let introP2EnterTimer = null;
    let introP2ImageGoneTimer = null;
    let introP2StableTimer = null;

    function clearIntroP2Timers() {
        clearTimeout(introP2EnterTimer);
        clearTimeout(introP2ImageGoneTimer);
        clearTimeout(introP2StableTimer);
        introP2EnterTimer = null;
        introP2ImageGoneTimer = null;
        introP2StableTimer = null;
    }


    function restartIntroExitAnimation() {
        if (!introPage) return;
        introPage.querySelectorAll('.intro-scene, .intro-kicker, .intro-headline, .intro-hint, .intro-bg').forEach((el) => {
            el.style.animation = 'none';
            void el.offsetHeight;
            el.style.animation = '';
            el.style.opacity = '';
            el.style.transform = '';
        });
    }

    function syncIntroOverlayState(pageIndex, { animateFromP1 = false } = {}) {
        if (!introPage || !basketPage) return;
        clearIntroP2Timers();

        if (pageIndex === 1) {
            introPage.classList.add('active', 'intro-text-hidden');
            introPage.classList.remove('intro-text-gone', 'intro-image-gone');
            restartIntroExitAnimation();
            basketPage.classList.add('page-basket--overlay');
            basketPage.classList.remove('page-basket--intro-stable');
            if (animateFromP1) {
                basketPage.classList.remove('active');
                introPage.classList.add('intro-image-sliding');
                document.documentElement.classList.add('html--intro-slide');
                introP2EnterTimer = setTimeout(() => {
                    introP2EnterTimer = null;
                    basketPage.classList.add('active');
                }, INTRO_P2_ENTER_AT_MS);
                introP2ImageGoneTimer = setTimeout(() => {
                    introP2ImageGoneTimer = null;
                    introPage.classList.remove('intro-image-sliding');
                    introPage.classList.add('intro-image-gone');
                }, INTRO_IMAGE_SLIDE_MS);
                introP2StableTimer = setTimeout(() => {
                    introP2StableTimer = null;
                    document.documentElement.classList.remove('html--intro-slide');
                    introPage.classList.add('intro-text-gone');
                    basketPage.classList.add('page-basket--intro-stable');
                    basketSim.reset();
                    basketSim.start();
                }, INTRO_P2_STABLE_MS);
            } else {
                introPage.classList.add('intro-text-gone', 'intro-image-gone');
                basketPage.classList.add('active', 'page-basket--intro-stable');
            }
        } else if (pageIndex === 0) {
            clearIntroP2Timers();
            introPage.classList.remove(
                'intro-text-hidden',
                'intro-text-gone',
                'intro-image-sliding',
                'intro-image-gone'
            );
            document.documentElement.classList.remove('html--intro-slide');
            basketPage.classList.remove('page-basket--overlay', 'active', 'page-basket--intro-stable');
            introPage.querySelectorAll('.intro-scene, .intro-kicker, .intro-headline, .intro-hint, .intro-bg').forEach((el) => {
                el.style.animation = 'none';
                el.style.opacity = '';
                el.style.transform = '';
            });
        } else if (pageIndex === 2 || pageIndex === 3) {
            introPage.classList.add('intro-text-hidden', 'intro-text-gone', 'intro-image-gone');
            introPage.classList.remove('intro-image-sliding');
            basketPage.classList.add('page-basket--overlay', 'active');
        } else {
            introPage.classList.remove('intro-text-hidden', 'intro-text-gone');
            basketPage.classList.remove('page-basket--overlay', 'active', 'page-basket--stat-exit');
        }
    }

    function syncBasketOverflowClip(pageIndex) {
        const sc = document.querySelector('.scroll-container');
        const pw = document.getElementById('pages-wrapper');
        const on = pageIndex === 1 || pageIndex === 2;
        sc?.classList.toggle('scroll-container--basket-overflow', on);
        pw?.classList.toggle('pages-wrapper--basket-overflow', on);
        document.documentElement.classList.toggle('html--basket-overflow', on);
    }

    function syncBasketPhysics(pageIndex) {
        if (pageIndex === 1) {
            basketSim.reset();
            basketSim.start();
        } else if (pageIndex !== 2) {
            basketSim.stop();
        }
    }

    function syncBasketStatVisibility(pageIndex) {
        if (!basketPage) return;
        const hideStat = pageIndex === 2 || pageIndex === 3;
        basketPage.classList.toggle('page-basket--stat-hidden', hideStat);
    }

    function syncRainPageState(pageIndex, isFinish = false) {
        if (!basketRainCtrl) return;
        if (pageIndex === 2) {
            if (!isFinish) {
                basketRainCtrl.showRain();
                basketRainCtrl.hideChart?.();
            }
        } else if (pageIndex === 3) {
            if (!isFinish) {
                basketRainCtrl.showRain({ restartHeadline: false });
                basketRainCtrl.showChart?.();
            }
        } else {
            if (isFinish) {
                basketRainCtrl.hideRain();
            }
        }
    }

    function isSpatialPageIndex(pageIndex) {
        const page = pages[pageIndex];
        return Boolean(page && Object.prototype.hasOwnProperty.call(SPATIAL_PAGE_ID_MAP, page.id));
    }

    function isScenePageIndex(pageIndex) {
        const id = pages[pageIndex]?.id;
        return id === 'page-6' || id === 'page-7' || id === 'page-5-trail';
    }

    function sceneLayoutForPageIndex(pageIndex) {
        const id = pages[pageIndex]?.id;
        if (id === 'page-6') return 'p10';
        if (id === 'page-7') return 'p11';
        if (id === 'page-5-trail') return 'p9';
        return '';
    }

    function spatialPageNum(pageIndex) {
        const page = pages[pageIndex];
        if (!page) return 0;
        return SPATIAL_PAGE_ID_MAP[page.id] ?? 0;
    }

    function goToPage(pageIndex) {
        if (pageIndex < 0 || pageIndex >= totalPages) return;
        if (!forceNavJump && isAnimating) return;
        if (!forceNavJump && window.HrHeartTransition?.isRunning?.()) return;
        if (
            !forceNavJump &&
            currentPage === SKILLS_PAGE_INDEX &&
            pageIndex !== SKILLS_PAGE_INDEX &&
            window.SkillsModule?.getNavState?.()?.mode === 'detail' &&
            pageIndex !== COACH_PAGE_START
        ) {
            return;
        }

        if (
            !forceNavJump &&
            isCoachPage(currentPage) &&
            pageIndex !== currentPage &&
            window.CoachModule?.isBusy?.()
        ) {
            return;
        }

        if (
            !forceNavJump &&
            isOutroPage(currentPage) &&
            pageIndex !== currentPage &&
            window.OutroModule?.isBusy?.()
        ) {
            return;
        }

        if (
            !forceNavJump &&
            currentPage === CAKE_PAGE_INDEX &&
            pageIndex !== currentPage &&
            window.CakePageModule?._busy
        ) {
            return;
        }

        if (pageTransitionTimer) {
            clearTimeout(pageTransitionTimer);
            pageTransitionTimer = null;
        }

        isAnimating = true;
        lockNavInput();
        const previousPage = currentPage;
        const targetPage = pages[pageIndex];
        const instantFinish = forceNavJump;

        // Ensure page 9's ball is correctly hidden before sliding to it
        if (targetPage && targetPage.id === 'page-9') {
            const p9Ball = targetPage.querySelector('.sp-rpm-ball');
            if (p9Ball) p9Ball.classList.add('ball-zoom-start');
        }

        if (instantFinish) {
            resetOverlayTransitionState();
            clearAllPageActive();
        }

        if (previousPage === SKILLS_PAGE_INDEX && pageIndex !== SKILLS_PAGE_INDEX && window.SkillsModule?.onSkillsHubLeave) {
            window.SkillsModule.onSkillsHubLeave();
        }
        if (isCoachPage(previousPage) && pageIndex !== previousPage && window.CoachModule?.leavePage) {
            window.CoachModule.leavePage(coachPageNum(previousPage));
        }
        if (isOutroPage(previousPage) && pageIndex !== previousPage && window.OutroModule?.leavePage) {
            window.OutroModule.leavePage(outroPageNum(previousPage));
        }
        if (previousPage === PAGE15_INDEX && pageIndex !== PAGE15_INDEX && window.Page15Module?.leavePage) {
            window.Page15Module.leavePage();
        }
        if (previousPage === CAKE_PAGE_INDEX && pageIndex !== CAKE_PAGE_INDEX && window.CakePageModule?.leavePage) {
            window.CakePageModule.leavePage();
        }

        let animatedElements = [];
        if (RUN_TRAIL_PAGE_INDEX >= 0 && pageIndex === RUN_TRAIL_PAGE_INDEX) {
            animatedElements = targetPage.querySelectorAll('.p11-text-fade, .p11-dog__stroke, .p11-dog__head');
        } else if (
            SPATIAL_PAGE6_INDEX >= 0 &&
            pageIndex >= CAKE_PAGE_INDEX &&
            pageIndex < SPATIAL_PAGE6_INDEX
        ) {
            animatedElements = targetPage.querySelectorAll('.fade-in-up, .pop-in, .slide-up, .draw-mask-path, .fly-arc');
        }

        animatedElements.forEach(el => {
            el.style.animation = 'none';
        });

        const wrapper = document.getElementById('pages-wrapper');
        const p8 = document.getElementById('page-8');
        const page2El = document.getElementById('page-2');
        let scrollTarget = getScrollTarget(pageIndex);

        const isP6toP7 = (
            PAGE2_INDEX >= 0 &&
            PAGE3_INDEX >= 0 &&
            previousPage === PAGE2_INDEX &&
            pageIndex === PAGE3_INDEX
        );
        const isP7toP6 = (
            PAGE2_INDEX >= 0 &&
            PAGE3_INDEX >= 0 &&
            previousPage === PAGE3_INDEX &&
            pageIndex === PAGE2_INDEX
        );

        if (isP7toP6) {
            if (page2El) {
                page2El.classList.remove('hr-transition-active', 'hr-transition-done');
                page2El.style.background = '';
            }
            window.HrHeartTransition?.stop();
        }

        if (isP6toP7 && !instantFinish) {
            scrollTarget = getScrollTarget(PAGE2_INDEX);
        }

        const isP1toP2 = previousPage === 0 && pageIndex === 1;
        const isP2toP1 = previousPage === 1 && pageIndex === 0;
        const isP2toP3 = previousPage === 1 && pageIndex === 2;
        const isP3toP2 = previousPage === 2 && pageIndex === 1;
        const isP3toP4 = previousPage === 2 && pageIndex === 3;
        const isP4toP3 = previousPage === 3 && pageIndex === 2;

        if (isP2toP1) {
            if (basketPage) basketPage.classList.remove('active');
        } else if (
            previousPage <= 3 &&
            previousPage !== pageIndex &&
            pageIndex !== 1 &&
            pageIndex !== 2 &&
            pageIndex !== 3
        ) {
            if (!instantFinish) {
                setTimeout(() => {
                    if (pages[previousPage] && previousPage !== currentPage) {
                        pages[previousPage].classList.remove('active');
                    }
                }, 800);
            } else {
                pages[previousPage].classList.remove('active');
            }
        } else if (
            previousPage >= CAKE_PAGE_INDEX &&
            SPATIAL_PAGE6_INDEX >= 0 &&
            previousPage <= SPATIAL_PAGE6_INDEX &&
            previousPage !== pageIndex &&
            !(isP6toP7 && !instantFinish)
        ) {
            pages[previousPage].classList.remove('active');
        }

        syncIntroOverlayState(pageIndex, { animateFromP1: isP1toP2 && !instantFinish });

        if (HERO_STACK_FIRST_INDEX >= 0 && previousPage >= HERO_STACK_FIRST_INDEX) {
            const isP10toP11 = previousPage === HERO_STACK_FIRST_INDEX && pageIndex === HERO_STACK_FIRST_INDEX + 1;
            const isP11toP12 = previousPage === HERO_STACK_FIRST_INDEX + 1 && pageIndex === HERO_STACK_FIRST_INDEX + 2;
            const isP12toP13 = previousPage === HERO_STACK_FIRST_INDEX + 2 && pageIndex === HERO_STACK_FIRST_INDEX + 3;

            if (isP10toP11 || isP11toP12 || isP12toP13) {
                setTimeout(() => {
                    if (pages[previousPage]) pages[previousPage].classList.remove('active');
                }, 800);
            } else if (
                COACH_PAGE_END >= 0 &&
                OUTRO_PAGE_START >= 0 &&
                previousPage === COACH_PAGE_END &&
                pageIndex === OUTRO_PAGE_START &&
                !instantFinish
            ) {
                setTimeout(() => {
                    if (pages[previousPage]) pages[previousPage].classList.remove('active');
                }, 800);
            } else {
                pages[previousPage].classList.remove('active');
            }
        }

        const spinPageIndex = pageIndexById('page-8');
        const rpmPageIndex = pageIndexById('page-9');
        const isP8toP9 = spinPageIndex >= 0 && rpmPageIndex >= 0
            && previousPage === spinPageIndex && pageIndex === rpmPageIndex;
        const isDepthToRun = (
            SPATIAL_PAGE7_INDEX >= 0 &&
            RUN_TRAIL_PAGE_INDEX >= 0 &&
            previousPage === SPATIAL_PAGE7_INDEX &&
            pageIndex === RUN_TRAIL_PAGE_INDEX
        );
        const isRunToDepth = (
            SPATIAL_PAGE7_INDEX >= 0 &&
            RUN_TRAIL_PAGE_INDEX >= 0 &&
            previousPage === RUN_TRAIL_PAGE_INDEX &&
            pageIndex === SPATIAL_PAGE7_INDEX
        );

        if (
            RUN_TRAIL_PAGE_INDEX >= 0 &&
            previousPage === RUN_TRAIL_PAGE_INDEX &&
            pageIndex !== RUN_TRAIL_PAGE_INDEX
        ) {
            window.P11RunPage?.stop();
        }

        if (isDepthToRun && window.SpatialScene) {
            if (instantFinish) {
                window.SpatialScene.setLayout('p9', { show: true, animate: false });
            } else {
                window.SpatialScene.slideFromSpatialToRun();
            }
        }

        if (isRunToDepth && window.SpatialScene) {
            if (instantFinish) {
                window.SpatialScene.setLayout('p10', { show: true, animate: false });
            } else {
                window.SpatialScene.slideFromRunToSpatial();
            }
        }

        if (isP1toP2 || isP2toP1 || isP2toP3 || isP3toP2 || isP3toP4 || isP4toP3 || (isP6toP7 && !instantFinish)) {
            wrapper.style.transition = 'none';
        }

        if (isP6toP7 && !instantFinish) {
            if (page2El) {
                page2El.classList.add('hr-transition-active');
                window.HrHeartTransition?.start(page2El);
            }
        }

        if (isP8toP9) {
            wrapper.style.transition = 'none';
            if (p8) p8.classList.add('p8-fade-out');
        }

        wrapper.style.transform = `translateY(-${scrollTarget}vh)`;
        currentPage = pageIndex;
        updatePageIndicator(pageIndex);
        if (!(isP1toP2 && !instantFinish)) {
            syncBasketOverflowClip(pageIndex);
            syncBasketPhysics(pageIndex);
            syncBasketStatVisibility(pageIndex);
            syncRainPageState(pageIndex, false);
        }

        if (isP1toP2 || isP2toP1 || isP2toP3 || isP3toP2 || isP3toP4 || isP4toP3 || (isP6toP7 && !instantFinish)) {
            wrapper.offsetHeight;
            wrapper.style.transition = '';
        }

        if (isP8toP9) {
            wrapper.offsetHeight;
            wrapper.style.transition = '';

            requestAnimationFrame(() => {
                requestAnimationFrame(() => {
                    setTimeout(() => {
                        if (p8) p8.classList.remove('p8-fade-out');
                    }, 800);
                });
            });
        }

        const isCoach4toOutro = (
            COACH_PAGE_END >= 0 &&
            OUTRO_PAGE_START >= 0 &&
            previousPage === COACH_PAGE_END &&
            pageIndex === OUTRO_PAGE_START &&
            !instantFinish
        );

        if (isCoach4toOutro) {
            wrapper.style.transition = 'none';
            document.documentElement.classList.add('html--court-p24-p25');
            setTimeout(() => {
                document.documentElement.classList.remove('html--court-p24-p25');
                wrapper.style.transition = '';
            }, 800);
        }

        syncStackedOverlayStates(pageIndex);

        if (
            instantFinish &&
            previousPage !== pageIndex &&
            isSpatialPageIndex(previousPage) &&
            window.SpatialModule
        ) {
            window.SpatialModule.leavePage(spatialPageNum(previousPage));
        }

        if (instantFinish && targetPage) {
            targetPage.classList.add('active');
            if (window.SpatialScene && isScenePageIndex(pageIndex)) {
                const layout = sceneLayoutForPageIndex(pageIndex);
                if (layout) {
                    window.SpatialScene.setLayout(layout, { show: true, animate: false });
                }
            }
            if (isOutroPage(pageIndex) && window.OutroModule?.enterPage) {
                window.OutroModule.enterPage(outroPageNum(pageIndex));
            }
        }

        if (isSpatialPageIndex(previousPage) && window.SpatialModule) {
            const prevPageNum = spatialPageNum(previousPage);
            const nextPageNum = spatialPageNum(pageIndex);
            const isSpatialOverlayTransition =
                (prevPageNum === 6 && nextPageNum === 7) ||
                (prevPageNum === 7 && nextPageNum === 6);

            if (isP8toP9) {
                window.SpatialModule.leavePage(8);
            } else if (isSpatialOverlayTransition || isDepthToRun) {
                window.SpatialModule.leaveTextOnly(prevPageNum);
            } else {
                window.SpatialModule.leavePage(prevPageNum);
            }
        }

        if (isDepthToRun && window.SpatialModule) {
            window.SpatialModule.hideCourtMarkers();
        }

        if (
            isScenePageIndex(previousPage) &&
            !isScenePageIndex(pageIndex) &&
            window.SpatialScene
        ) {
            window.SpatialScene.hide();
        }

        const finishDelay = (() => {
            if (instantFinish) return 0;
            if (isP6toP7) return window.HrHeartTransition?.DURATION ?? 2600;
            return 800;
        })();

        if (isP6toP7 && !instantFinish) {
            navInputLockedUntil = performance.now() + finishDelay + NAV_INPUT_LOCK_MS;
        }

        pageTransitionTimer = setTimeout(() => {
            pageTransitionTimer = null;
            isAnimating = false;

            if (isP6toP7 && !instantFinish) {
                window.HrHeartTransition?.stop();
                wrapper.style.transition = 'none';
                wrapper.style.transform = `translateY(-${getScrollTarget(PAGE3_INDEX)}vh)`;
                wrapper.offsetHeight;
                wrapper.style.transition = '';
                if (page2El) {
                    page2El.classList.remove('hr-transition-active', 'active');
                    page2El.classList.add('hr-transition-done');
                    page2El.style.background = '';
                }
            }

            if (PAGE2_INDEX >= 0 && pageIndex === PAGE2_INDEX && page2El) {
                page2El.classList.remove('hr-transition-done');
                page2El.style.background = '';
            }

            if (
                pageIndex <= 3 ||
                (pageIndex >= CAKE_PAGE_INDEX && SPATIAL_PAGE6_INDEX >= 0 && pageIndex <= SPATIAL_PAGE6_INDEX) ||
                isSpatialPageIndex(pageIndex) ||
                (RUN_TRAIL_PAGE_INDEX >= 0 && pageIndex === RUN_TRAIL_PAGE_INDEX) ||
                (HERO_STACK_FIRST_INDEX >= 0 && pageIndex >= HERO_STACK_FIRST_INDEX) ||
                isCoachPage(pageIndex) ||
                isOutroPage(pageIndex) ||
                instantFinish
            ) {
                targetPage.classList.add('active');
            }

            animatedElements.forEach(el => {
                el.offsetHeight;
                el.style.animation = null;
            });

            if (pageIndex === 1 && introPage) {
                introPage.classList.add('intro-text-gone');
            }

            if (isRunToDepth && window.SpatialModule) {
                window.SpatialModule.reenterPage(7);
            } else if (isSpatialPageIndex(pageIndex) && window.SpatialModule) {
                window.SpatialModule.enterPage(spatialPageNum(pageIndex));
            }

            if (
                RUN_TRAIL_PAGE_INDEX >= 0 &&
                pageIndex === RUN_TRAIL_PAGE_INDEX &&
                window.SpatialScene &&
                !isDepthToRun
            ) {
                window.SpatialScene.setLayout('p9', { show: true, animate: false });
            }

            if (RUN_TRAIL_PAGE_INDEX >= 0 && pageIndex === RUN_TRAIL_PAGE_INDEX) {
                window.P11RunPage?.start(targetPage);
            }

            if (pageIndex === SKILLS_PAGE_INDEX && window.SkillsModule?.onSkillsHubEnter) {
                window.SkillsModule.onSkillsHubEnter();
            }

            if (isCoachPage(pageIndex) && window.CoachModule?.enterPage) {
                window.CoachModule.enterPage(coachPageNum(pageIndex));
            }

            if (isOutroPage(pageIndex) && window.OutroModule?.enterPage) {
                window.OutroModule.enterPage(outroPageNum(pageIndex));
            }

            if (pageIndex === PAGE15_INDEX && window.Page15Module?.enterPage) {
                window.Page15Module.enterPage();
            }

            syncRainPageState(pageIndex, true);
        }, finishDelay);
    }

    function updateBaseScale() {
        const container = document.querySelector('.scroll-container');
        if (container) {
            const scale = Math.max(container.clientWidth / 440, 0.01);
            document.documentElement.style.setProperty('--base-scale', String(scale));
            if (basketSim.resize) basketSim.resize();
        }
    }
    window.addEventListener('resize', updateBaseScale);
    updateBaseScale();

    initDevPageNav();

    document.querySelectorAll('.page11-arrow-icon, .page12-arrow-icon').forEach(icon => {
        icon.addEventListener('click', function() {
            this.classList.toggle('rotated');

            let footerWrap;
            if (this.classList.contains('page11-arrow-icon')) {
                footerWrap = document.querySelector('.page11-footer-wrap');
            } else {
                footerWrap = document.querySelector('.page12-footer-wrap');
            }

            if (footerWrap) {
                footerWrap.classList.toggle('expanded');
            }
        });
    });
});
