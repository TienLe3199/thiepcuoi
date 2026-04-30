/* =============================================================
   PAGE TRANSITIONS — fallback bằng "curtain" (rèm)

   - Trình duyệt mới (có document.startViewTransition):
     để @view-transition trong styles.css lo, script không can thiệp.

   - Trình duyệt cũ:
     1. Inject 1 div .page-curtain (luôn nằm trên cùng)
     2. Khi load: rèm mở (opacity 1 → 0)
     3. Khi click link nội bộ: rèm đóng (0 → 1) → điều hướng
        → trang mới load, rèm tiếp tục che → mở lại
     => Người dùng không bao giờ thấy "khoảng trắng" giữa 2 trang.
   ============================================================= */
(function () {
    const supportsViewTransitions =
        typeof document !== "undefined" &&
        typeof document.startViewTransition === "function";

    if (supportsViewTransitions) return;

    const COVER_MS = 320;

    const curtain = document.createElement("div");
    curtain.className = "page-curtain";
    curtain.setAttribute("aria-hidden", "true");

    const mount = () => {
        document.body.appendChild(curtain);
        /* 2 RAF lồng nhau cho chắc — đảm bảo browser đã paint
           với opacity:1 trước khi transition về 0 */
        requestAnimationFrame(() => {
            requestAnimationFrame(() => curtain.classList.add("is-open"));
        });
    };

    if (document.body) {
        mount();
    } else {
        document.addEventListener("DOMContentLoaded", mount, { once: true });
    }

    const isInternalLink = (link) => {
        if (!link || !link.href) return false;
        if (link.target && link.target !== "_self") return false;
        if (link.hasAttribute("download")) return false;
        const href = link.getAttribute("href") || "";
        if (href.startsWith("#")) return false;
        if (/^(mailto:|tel:|javascript:)/i.test(href)) return false;
        try {
            const url = new URL(link.href, location.href);
            return url.origin === location.origin;
        } catch (_) {
            return false;
        }
    };

    document.addEventListener("click", (e) => {
        if (e.defaultPrevented) return;
        if (e.button !== 0) return;
        if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;

        const link = e.target.closest("a[href]");
        if (!isInternalLink(link)) return;

        const targetUrl = link.href;
        if (targetUrl === location.href) return;

        e.preventDefault();
        curtain.classList.remove("is-open");
        curtain.classList.add("is-covering");
        window.setTimeout(() => {
            location.href = targetUrl;
        }, COVER_MS);
    });

    /* Khi user nhấn Back (bfcache khôi phục) — gỡ trạng thái covering */
    window.addEventListener("pageshow", (e) => {
        if (e.persisted) {
            curtain.classList.remove("is-covering");
            requestAnimationFrame(() => curtain.classList.add("is-open"));
        }
    });
})();
