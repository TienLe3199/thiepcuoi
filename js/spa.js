/* =============================================================
   SPA SOFT NAVIGATION — chuyển trang KHÔNG reload

   Mục đích: nhạc nền chạy LIÊN TỤC khi user chuyển giữa
     `index.html` <-> `thiep.html`, thay vì bị browser ngắt
     bởi chính sách autoplay sau mỗi lần điều hướng cứng.

   Cách hoạt động:
     1) Bắt click trên link nội bộ (capture-phase) → preventDefault
     2) Fetch HTML đích → parse với DOMParser
     3) Swap nội dung <body>:
          - Giữ NGUYÊN các phần tử "persist" (audio, nút nhạc,
            bg-rotator, app-loader, page-curtain, ...) → audio
            không bị huỷ.
          - Bỏ qua tất cả <script> trong HTML mới (tránh re-run).
     4) Update document.title + history.pushState
     5) Gọi renderer tương ứng:
          - landing → window.renderLandingPage()
          - detail  → window.renderDetailPage()
     6) popstate (back/forward) → cũng chạy luồng trên (push=false)

   Thứ tự load script CHÚ Ý:
     - music.js phải load TRƯỚC spa.js để click capture-handler
       của music.js (kick-start audio) đăng ký trước → vẫn được
       chạy khi user click link.
     - page-landing.js / page-detail.js load trước spa.js để
       có sẵn 2 hàm render khi cần.
   ============================================================= */
(function () {
    if (window.__spaInit) return;
    window.__spaInit = true;

    const PERSIST_SELECTORS = [
        "audio",
        ".music-toggle",
        ".bg-rotator",
        ".app-loader",
        ".page-curtain",
        ".envelope-veil",
        "[data-spa-persist]"
    ];

    const PAGE_RENDERERS = {
        landing: () => typeof window.renderLandingPage === "function" && window.renderLandingPage(),
        detail: () => typeof window.renderDetailPage === "function" && window.renderDetailPage()
    };

    const detectPageType = (path) => {
        const file = (path.split("?")[0].split("#")[0] || "").toLowerCase();
        if (file.endsWith("thiep.html")) return "detail";
        if (file.endsWith("index.html") || file.endsWith("/") || file === "") return "landing";
        return null;
    };

    const isInternalNav = (link) => {
        if (!link || !link.href) return false;
        if (link.target && link.target !== "_self") return false;
        if (link.hasAttribute("download")) return false;
        if (link.hasAttribute("data-no-spa")) return false;
        const href = link.getAttribute("href") || "";
        if (href.startsWith("#")) return false;
        if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;
        try {
            const u = new URL(link.href, location.href);
            if (u.origin !== location.origin) return false;
            return detectPageType(u.pathname) != null;
        } catch (_) {
            return false;
        }
    };

    /* Cache HTML đã fetch để chuyển trang lần 2+ mượt hơn */
    const cache = new Map();
    const fetchPage = async (url) => {
        const u = new URL(url, location.href);
        const key = u.pathname.toLowerCase();
        if (cache.has(key)) return cache.get(key);
        const resp = await fetch(u.pathname, { credentials: "same-origin" });
        if (!resp.ok) throw new Error("fetch failed: " + resp.status);
        const html = await resp.text();
        cache.set(key, html);
        return html;
    };

    const collectPersisted = () => {
        const set = new Set();
        PERSIST_SELECTORS.forEach((sel) => {
            document.querySelectorAll(sel).forEach((el) => {
                if (el.parentElement === document.body) set.add(el);
            });
        });
        return set;
    };

    const swapBody = (newDoc) => {
        const newBody = newDoc.body;
        const persisted = collectPersisted();

        document.body.className = newBody.className || "";

        Array.from(document.body.children).forEach((child) => {
            if (!persisted.has(child)) child.remove();
        });

        Array.from(newBody.children).forEach((node) => {
            if (node.tagName === "SCRIPT") return;
            const clone = node.cloneNode(true);
            document.body.appendChild(clone);
        });
    };

    const fadeOutMain = () => new Promise((resolve) => {
        const main = document.querySelector("body > main");
        if (!main) return resolve();
        main.style.transition = "opacity 220ms ease, transform 220ms ease";
        main.style.opacity = "0";
        main.style.transform = "translateY(-6px)";
        window.setTimeout(resolve, 220);
    });

    const fadeInMain = () => {
        const main = document.querySelector("body > main");
        if (!main) return;
        main.style.opacity = "0";
        main.style.transform = "translateY(8px)";
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                main.style.transition = "opacity 320ms ease, transform 320ms ease";
                main.style.opacity = "1";
                main.style.transform = "translateY(0)";
            });
        });
    };

    let navigating = false;
    const navigateTo = async (url, { push = true } = {}) => {
        if (navigating) return;
        const target = new URL(url, location.href);
        if (target.href === location.href && push) return;

        const targetType = detectPageType(target.pathname);
        if (!targetType) {
            if (push) location.href = url;
            return;
        }

        navigating = true;
        try {
            const [html] = await Promise.all([fetchPage(target.href), fadeOutMain()]);
            const newDoc = new DOMParser().parseFromString(html, "text/html");

            if (push) history.pushState({ spa: true, url: target.href }, "", target.href);

            const titleEl = newDoc.querySelector("title");
            if (titleEl && titleEl.textContent) document.title = titleEl.textContent;

            swapBody(newDoc);

            const renderer = PAGE_RENDERERS[targetType];
            if (renderer) renderer();

            window.scrollTo(0, 0);
            fadeInMain();
        } catch (err) {
            /* Lỗi gì đó → fallback full reload */
            location.href = url;
        } finally {
            navigating = false;
        }
    };

    /* Bắt click ở capture-phase, NHƯNG không stopImmediatePropagation
       để các capture-handler khác (vd: music.js kick-start audio)
       vẫn chạy được. preventDefault() đủ để chặn transitions.js
       (handler bubble-phase, sẽ check defaultPrevented). */
    document.addEventListener("click", (e) => {
        if (e.defaultPrevented) return;
        if (e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
        const link = e.target.closest("a[href]");
        if (!isInternalNav(link)) return;
        const targetUrl = link.href;
        if (targetUrl === location.href) {
            e.preventDefault();
            return;
        }
        e.preventDefault();
        navigateTo(targetUrl);
    }, true);

    window.addEventListener("popstate", () => {
        navigateTo(location.href, { push: false });
    });

    /* Đăng ký state ban đầu để popstate có thể quay lại đúng URL */
    if (!history.state || !history.state.spa) {
        history.replaceState({ spa: true, url: location.href }, "", location.href);
    }
})();
