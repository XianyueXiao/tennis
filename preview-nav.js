(function () {
    "use strict";

    function getTotalPages(iframe) {
        try {
            const total = iframe?.contentWindow?.ReportPager?.getTotalPages?.();
            if (typeof total === "number" && total > 0) return total;
        } catch (err) {
            /* cross-origin */
        }
        return 28;
    }

    function getPageMeta(iframe) {
        try {
            const meta = iframe?.contentWindow?.ReportPager?.getPageMeta?.();
            if (Array.isArray(meta) && meta.length) return meta;
        } catch (err) {
            /* cross-origin */
        }
        return null;
    }

    const SKILL_DETAIL_NAV = [
        { nav: "20-1", page: 2, label: "强力一击" },
        { nav: "20-2", page: 3, label: "绝对防御" },
        { nav: "20-3", page: 5, label: "能力觉醒" },
    ];

    function getSkillNavState(iframe, pageIndex, pageMeta) {
        if (!iframe || pageIndex < 0) return null;
        const skillsIndex = pageMeta?.findIndex((m) => m.id === "page-skills");
        if (skillsIndex !== pageIndex) return null;
        try {
            return iframe.contentWindow?.SkillsModule?.getNavState?.() ?? null;
        } catch (err) {
            return null;
        }
    }

    function syncPreviewNav(nav, pageIndex, iframe, pageMeta, skillStateOverride) {
        const pageMetaList = pageMeta || getPageMeta(iframe);
        const skillState =
            skillStateOverride ?? getSkillNavState(iframe, pageIndex, pageMetaList);

        nav.querySelectorAll(".preview-page-nav__btn").forEach((btn) => {
            const skillNav = btn.dataset.skillNav;
            let active = false;

            if (skillNav) {
                active =
                    skillState?.mode === "detail" && skillState?.nav === skillNav;
            } else {
                active = Number(btn.dataset.page) === pageIndex + 1;
                if (
                    active &&
                    pageMetaList?.[pageIndex]?.id === "page-skills" &&
                    skillState?.mode === "detail"
                ) {
                    active = false;
                }
            }

            btn.classList.toggle("is-active", active);
        });
        iframe?.classList.toggle("phone-screen--basket-overflow", pageIndex === 1 || pageIndex === 2);
    }

    function gotoSkillDetailInIframe(iframe, detailPage) {
        const win = iframe.contentWindow;
        if (!win) return;

        try {
            if (win.ReportPager?.goToSkillDetail) {
                win.ReportPager.goToSkillDetail(detailPage);
                return;
            }
        } catch (err) {
            /* postMessage fallback */
        }

        win.postMessage({ type: "tennis-report-goto-skill", page: detailPage }, "*");
    }

    function gotoPageInIframe(iframe, pageIndex) {
        const win = iframe.contentWindow;
        if (!win) return;

        try {
            if (win.ReportPager?.goToPage) {
                win.ReportPager.goToPage(pageIndex);
                return;
            }
        } catch (err) {
            /* 部分环境禁止直接访问 contentWindow，改走 postMessage */
        }

        win.postMessage({ type: "tennis-report-goto", page: pageIndex }, "*");
    }

    function buildPreviewNav(iframe) {
        if (!iframe) return null;

        const totalPages = getTotalPages(iframe);
        const pageMeta = getPageMeta(iframe);

        const nav = document.createElement("nav");
        nav.className = "preview-page-nav";
        nav.setAttribute("aria-label", "页面索引");

        for (let i = 0; i < totalPages; i += 1) {
            const meta = pageMeta?.[i];
            const btn = document.createElement("button");
            btn.type = "button";
            btn.className = "preview-page-nav__btn";
            btn.dataset.page = String(i + 1);
            btn.textContent = String(i + 1);
            if (meta) {
                const nav = meta.nav ?? i + 1;
                btn.title = meta.label
                    ? `导航 ${nav} · ${meta.label}${meta.id ? `（${meta.id}）` : ""}`
                    : `导航 ${nav}${meta.id ? `（${meta.id}）` : ""}`;
                btn.setAttribute("aria-label", meta.label || `导航 ${nav}`);
            }
            btn.addEventListener("click", (ev) => {
                ev.preventDefault();
                ev.stopPropagation();
                if (meta?.id === "page-skills") {
                    try {
                        iframe.contentWindow?.SkillsModule?.goToHub?.();
                    } catch (err) {
                        /* ignore */
                    }
                }
                gotoPageInIframe(iframe, i);
            });
            nav.appendChild(btn);

            if (meta?.id === "page-skills") {
                SKILL_DETAIL_NAV.forEach((sub) => {
                    const subBtn = document.createElement("button");
                    subBtn.type = "button";
                    subBtn.className = "preview-page-nav__btn preview-page-nav__btn--sub";
                    subBtn.dataset.skillNav = sub.nav;
                    subBtn.textContent = sub.nav.replace("20-", "·");
                    subBtn.title = `导航 ${sub.nav} · ${sub.label}（page-skills）`;
                    subBtn.setAttribute("aria-label", sub.label);
                    subBtn.addEventListener("click", (ev) => {
                        ev.preventDefault();
                        ev.stopPropagation();
                        gotoSkillDetailInIframe(iframe, sub.page);
                    });
                    nav.appendChild(subBtn);
                });
            }
        }

        document.body.prepend(nav);
        return nav;
    }

    function initPreviewPageNav(iframe) {
        if (!iframe) return;

        let nav = null;

        const mountNav = () => {
            const existing = document.querySelector(".preview-page-nav");
            if (existing) existing.remove();
            nav = buildPreviewNav(iframe);
        };

        window.addEventListener("message", (e) => {
            if (!nav) return;
            if (e.data?.type === "tennis-report-page") {
                syncPreviewNav(nav, e.data.page, iframe);
                return;
            }
            if (e.data?.type === "tennis-report-skill-nav") {
                const page = iframe.contentWindow?.ReportPager?.getCurrentPage?.();
                if (typeof page === "number") {
                    syncPreviewNav(nav, page, iframe, null, {
                        mode: e.data.mode,
                        detailPage: e.data.detailPage,
                        nav: e.data.nav,
                    });
                }
            }
        });

        const trySync = () => {
            if (!nav) return;
            const page = iframe.contentWindow?.ReportPager?.getCurrentPage?.();
            if (typeof page === "number") syncPreviewNav(nav, page, iframe);
        };

        mountNav();
        iframe.addEventListener("load", () => {
            mountNav();
            trySync();
        });
        trySync();
    }

    function boot() {
        const iframe = document.querySelector(".phone-screen");
        if (iframe) initPreviewPageNav(iframe);
    }

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", boot);
    } else {
        boot();
    }
})();
