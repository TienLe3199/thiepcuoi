/* =============================================================
   BACKGROUND ROTATOR — xoay vòng ảnh nền với hiệu ứng crossfade

   - Đọc danh sách ảnh từ `window.info.backgrounds`
     (fallback sang 3 ảnh mặc định nếu thiếu)
   - Tạo 2 layer fixed chồng lên nhau, đổi opacity để crossfade
   - Preload toàn bộ ảnh ngay từ đầu để chuyển mượt, không nháy
   - Tạm dừng khi tab ẩn (visibilitychange) — tránh "nhảy" 1 phát
     khi quay lại do nhiều interval đã tích lại trong background
   ============================================================= */
(function () {
    const cfg = (typeof window !== "undefined" && window.info) || {};
    const sources = (Array.isArray(cfg.backgrounds) && cfg.backgrounds.length)
        ? cfg.backgrounds.slice()
        : ["assets/bg.jpg", "assets/bg1.jpg", "assets/bg2.jpg"];

    if (!sources.length) return;

    const INTERVAL_MS = Number(cfg.backgroundIntervalMs) > 0
        ? Number(cfg.backgroundIntervalMs)
        : 5000;
    const FADE_MS = Number(cfg.backgroundFadeMs) > 0
        ? Number(cfg.backgroundFadeMs)
        : 1200;

    const stage = document.createElement("div");
    stage.className = "bg-rotator";
    stage.setAttribute("aria-hidden", "true");

    const layerA = document.createElement("div");
    layerA.className = "bg-rotator__layer is-active";

    const layerB = document.createElement("div");
    layerB.className = "bg-rotator__layer";

    layerA.style.transitionDuration = FADE_MS + "ms";
    layerB.style.transitionDuration = FADE_MS + "ms";

    stage.append(layerA, layerB);

    let activeIndex = 0;
    let activeLayer = layerA;
    let inactiveLayer = layerB;
    let timerId = null;

    const setLayerImage = (layer, src) => {
        layer.style.backgroundImage = `url("${src}")`;
    };

    const preloadAll = () => {
        sources.forEach((src) => {
            const img = new Image();
            img.src = src;
        });
    };

    /* Báo cho loader biết khi ảnh đầu tiên đã sẵn sàng */
    const signalReady = () => {
        const evt = new Event("app:bg-ready");
        window.dispatchEvent(evt);
    };
    const firstImg = new Image();
    firstImg.onload = signalReady;
    firstImg.onerror = signalReady; /* nếu lỗi cũng vẫn cho qua, đừng treo */
    firstImg.src = sources[0];

    const swap = () => {
        activeIndex = (activeIndex + 1) % sources.length;
        setLayerImage(inactiveLayer, sources[activeIndex]);

        /* force reflow để transition opacity chạy chuẩn */
        void inactiveLayer.offsetWidth;

        inactiveLayer.classList.add("is-active");
        activeLayer.classList.remove("is-active");

        const tmp = activeLayer;
        activeLayer = inactiveLayer;
        inactiveLayer = tmp;
    };

    const start = () => {
        if (timerId != null) return;
        if (sources.length < 2) return;
        timerId = window.setInterval(swap, INTERVAL_MS);
    };

    const stop = () => {
        if (timerId == null) return;
        window.clearInterval(timerId);
        timerId = null;
    };

    const mount = () => {
        document.body.prepend(stage);
        setLayerImage(layerA, sources[0]);
        preloadAll();
        start();
    };

    if (document.body) {
        mount();
    } else {
        document.addEventListener("DOMContentLoaded", mount, { once: true });
    }

    document.addEventListener("visibilitychange", () => {
        if (document.hidden) stop();
        else start();
    });
})();
