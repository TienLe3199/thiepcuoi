/* =============================================================
   BACKGROUND MUSIC — nút nổi bật/tắt nhạc nền

   - Đọc cấu hình từ `info.music`
   - MẶC ĐỊNH BẬT: `isOn = true` trừ khi user đã từng tắt
     (lưu ở localStorage để giữ giữa các trang)
   - Trình duyệt chặn autoplay → cú chạm/click đầu tiên ở
     bất cứ đâu trên trang (ví dụ: click "Mở thiệp" ở veil
     phong bì) sẽ tự động kick-start nhạc.
   - Trạng thái nút sáng/tối phản ánh ĐÚNG `audio.paused` thực
     tế — không "lừa" user khi browser còn đang chặn.
   - Nếu file mp3 không tồn tại / lỗi → tự ẩn nút.
   ============================================================= */
(function () {
    const cfg = (window.info && window.info.music) || {};
    const src = cfg.src;
    if (!src) return;

    const STORAGE_KEY = "wedding-music-on";
    const TIME_KEY = "wedding-music-time";
    const TIME_TTL_MS = 8000; /* dữ liệu cũ hơn 8s coi như stale */

    const stored = (function () {
        try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
    })();
    /* MẶC ĐỊNH BẬT: chỉ tắt khi user đã chủ động tắt (stored === "0") */
    let desiredOn = stored !== "0";

    const audio = document.createElement("audio");
    audio.src = src;
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = typeof cfg.volume === "number" ? cfg.volume : 0.35;

    /* ==========  PHỤC HỒI VỊ TRÍ PHÁT KHI CHUYỂN TRANG  ========== */
    const readSavedTime = () => {
        try {
            const raw = sessionStorage.getItem(TIME_KEY);
            if (!raw) return null;
            const data = JSON.parse(raw);
            if (typeof data.t !== "number" || data.t <= 0) return null;
            if (Date.now() - data.at > TIME_TTL_MS) return null;
            return data.t;
        } catch (_) { return null; }
    };

    const saveTime = () => {
        try {
            if (audio.currentTime > 0) {
                sessionStorage.setItem(TIME_KEY, JSON.stringify({
                    t: audio.currentTime,
                    at: Date.now()
                }));
            }
        } catch (_) {}
    };

    /* `audio.currentTime` chỉ set được khi đã có metadata.
       Nếu chưa load xong thì queue lại đến khi loadedmetadata. */
    const seekWhenReady = (t) => {
        if (audio.readyState >= 1) {
            try { audio.currentTime = t; } catch (_) {}
        } else {
            audio.addEventListener("loadedmetadata", () => {
                try { audio.currentTime = t; } catch (_) {}
            }, { once: true });
        }
    };

    let restored = false;
    const restoreOnce = () => {
        if (restored) return;
        restored = true;
        const t = readSavedTime();
        if (t != null) seekWhenReady(t);
    };

    /* Lưu mỗi giây khi đang phát + lúc rời trang */
    let saveTimer = null;
    const startSaveLoop = () => {
        if (saveTimer != null) return;
        saveTimer = window.setInterval(saveTime, 1000);
    };
    const stopSaveLoop = () => {
        if (saveTimer != null) {
            window.clearInterval(saveTimer);
            saveTimer = null;
        }
    };
    window.addEventListener("pagehide", saveTime);
    window.addEventListener("beforeunload", saveTime);

    let audioOk = true;
    audio.addEventListener("error", () => {
        audioOk = false;
        btn.style.display = "none";
    });

    const btn = document.createElement("button");
    btn.className = "music-toggle";
    btn.type = "button";
    btn.setAttribute("aria-pressed", "false");
    btn.setAttribute("aria-label", cfg.autoplayHint || "Bật/tắt nhạc nền");
    btn.innerHTML = `
        <span class="music-toggle__bars" aria-hidden="true">
            <i></i><i></i><i></i><i></i>
        </span>
    `;

    const persist = () => {
        try { localStorage.setItem(STORAGE_KEY, desiredOn ? "1" : "0"); } catch (_) {}
    };

    /* Chỉ "sáng" nút khi NHẠC THẬT SỰ ĐANG PHÁT, không phải khi mong muốn */
    const render = () => {
        const playing = !audio.paused;
        btn.classList.toggle("is-on", playing);
        btn.setAttribute("aria-pressed", playing ? "true" : "false");
        btn.title = playing ? "Tắt nhạc nền" : "Bật nhạc nền";
    };
    audio.addEventListener("play", () => { render(); startSaveLoop(); });
    audio.addEventListener("pause", () => { render(); stopSaveLoop(); saveTime(); });

    const tryPlay = () => {
        if (!audioOk) return;
        restoreOnce(); /* chỉ phục hồi 1 lần đầu — sau đó để audio chạy bình thường */
        const p = audio.play();
        if (p && typeof p.catch === "function") {
            p.catch(() => { /* autoplay bị chặn — chờ user gesture */ });
        }
    };

    btn.addEventListener("click", (e) => {
        e.stopPropagation();
        desiredOn = !desiredOn;
        persist();
        if (desiredOn) tryPlay();
        else audio.pause();
    });

    /* Cú chạm đầu tiên ở bất kỳ đâu sẽ thử bật nhạc nếu desiredOn */
    const onFirstGesture = () => {
        if (desiredOn && audio.paused) tryPlay();
    };
    const gestureOpts = { passive: true, capture: true };
    document.addEventListener("click", onFirstGesture, gestureOpts);
    document.addEventListener("touchstart", onFirstGesture, gestureOpts);
    document.addEventListener("keydown", onFirstGesture, true);

    const mount = () => {
        document.body.appendChild(audio);
        document.body.appendChild(btn);
        render();
        /* Best-effort autoplay — sẽ thành công nếu browser cho phép
           (ví dụ: media engagement index cao, hoặc đã mute, …).
           Nếu bị chặn cũng không sao, gesture đầu tiên sẽ kick-start. */
        if (desiredOn) tryPlay();
    };

    if (document.body) mount();
    else document.addEventListener("DOMContentLoaded", mount, { once: true });
})();
