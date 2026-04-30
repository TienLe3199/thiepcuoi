/* =============================================================
   BACKGROUND MUSIC — nút nổi bật/tắt nhạc nền

   - Đọc cấu hình từ `info.music`
   - Lưu trạng thái on/off vào localStorage để giữ giữa các trang
   - Trình duyệt chặn autoplay → nếu đang on, click bất kỳ đâu
     trong document sẽ kick-start nhạc
   - Nếu file mp3 không tồn tại / lỗi → tự ẩn nút
   ============================================================= */
(function () {
    const cfg = (window.info && window.info.music) || {};
    const src = cfg.src;
    if (!src) return;

    const STORAGE_KEY = "wedding-music-on";
    const stored = (function () {
        try { return localStorage.getItem(STORAGE_KEY); } catch (_) { return null; }
    })();
    let isOn = stored === "1";

    const audio = document.createElement("audio");
    audio.src = src;
    audio.loop = true;
    audio.preload = "auto";
    audio.volume = typeof cfg.volume === "number" ? cfg.volume : 0.35;

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
        try { localStorage.setItem(STORAGE_KEY, isOn ? "1" : "0"); } catch (_) {}
    };

    const render = () => {
        btn.classList.toggle("is-on", isOn);
        btn.setAttribute("aria-pressed", isOn ? "true" : "false");
        btn.title = isOn ? "Tắt nhạc nền" : "Bật nhạc nền";
    };

    const tryPlay = () => {
        if (!audioOk) return;
        const p = audio.play();
        if (p && typeof p.catch === "function") {
            p.catch(() => { /* trình duyệt chặn — đợi user gesture */ });
        }
    };

    btn.addEventListener("click", () => {
        isOn = !isOn;
        persist();
        render();
        if (isOn) tryPlay(); else audio.pause();
    });

    /* Nếu user đã bật nhạc ở trang trước, sang trang mới sẽ thử
       phát ngay. Nếu trình duyệt chặn — chờ user gesture đầu tiên. */
    const kickstart = () => {
        if (isOn) tryPlay();
    };
    const onFirstGesture = () => {
        if (isOn) tryPlay();
    };
    document.addEventListener("click", onFirstGesture, { passive: true });
    document.addEventListener("touchstart", onFirstGesture, { passive: true });
    document.addEventListener("keydown", onFirstGesture);

    const mount = () => {
        document.body.appendChild(audio);
        document.body.appendChild(btn);
        render();
        kickstart();
    };

    if (document.body) mount();
    else document.addEventListener("DOMContentLoaded", mount, { once: true });
})();
