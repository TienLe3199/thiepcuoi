/* =============================================================
   APP LOADER — màn loading thanh thoát hiện ngay khi vào trang

   - Hiển thị monogram + 1 dot loader nhẹ
   - Tự ẩn khi:
       1) Ảnh background đầu tiên load xong (sự kiện "app:bg-ready"
          do bg-rotator phát)
       2) Window đã "load" (mọi resource khác xong)
       3) Hoặc sau timeout 4500ms — phòng trường hợp lỗi
   ============================================================= */
(function () {
    if (window.__appLoaderMounted) return;
    window.__appLoaderMounted = true;

    const overlay = document.createElement("div");
    overlay.className = "app-loader";
    overlay.setAttribute("aria-hidden", "true");
    overlay.innerHTML = `
        <div class="app-loader__inner">
            <div class="app-loader__monogram">
                <span class="app-loader__amp">&amp;</span>
            </div>
            <div class="app-loader__dots" aria-hidden="true">
                <span></span><span></span><span></span>
            </div>
        </div>
    `;

    const mount = () => {
        document.body.appendChild(overlay);
    };

    /* Mount càng sớm càng tốt — script được include ngay đầu <body>
       nên document.body đã tồn tại lúc này */
    if (document.body) {
        mount();
    } else {
        document.addEventListener("DOMContentLoaded", mount, { once: true });
    }

    let hidden = false;
    const hide = () => {
        if (hidden) return;
        hidden = true;
        overlay.classList.add("is-hiding");
        window.setTimeout(() => overlay.remove(), 700);
    };

    let bgReady = false;
    let windowLoaded = false;

    const tryHide = () => {
        if (bgReady && windowLoaded) hide();
    };

    window.addEventListener("app:bg-ready", () => {
        bgReady = true;
        tryHide();
    }, { once: true });

    if (document.readyState === "complete") {
        windowLoaded = true;
        tryHide();
    } else {
        window.addEventListener("load", () => {
            windowLoaded = true;
            tryHide();
        }, { once: true });
    }

    /* safety net — không bao giờ treo loader > 4.5s */
    window.setTimeout(hide, 4500);
})();
