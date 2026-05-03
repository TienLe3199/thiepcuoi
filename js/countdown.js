/* =============================================================
   COUNTDOWN — đếm ngược tới sự kiện gần nhất

   - Đọc danh sách `info.events`, tìm sự kiện sắp tới gần nhất
     (theo phía groom/bride đang chọn — vì 1 số sự kiện có
      detailsBySide với ngày khác nhau).
   - Render block 4 ô: ngày / giờ / phút / giây
   - Tự cập nhật mỗi giây
   - Khi đã qua — hiển thị "Cảm ơn quý khách đã đến chia vui"

   - SPA: phơi `window.renderCountdown()` để page-landing.js
     gọi lại sau mỗi lần điều hướng mềm (nội dung landing-card
     được thay mới → block countdown cần dựng lại).
   ============================================================= */
(function () {
    if (typeof window === "undefined" || !window.info) return;

    let tickTimer = null;

    const buildBlock = () => {
        const params = new URLSearchParams(location.search);
        const defaultSide = window.info.defaultSide === "bride" ? "bride" : "groom";
        const currentSide = params.get("side") === "bride"
            ? "bride"
            : (params.get("side") === "groom" ? "groom" : defaultSide);

        const parseEventDate = (event) => {
            const sideDetails = (event.detailsBySide && event.detailsBySide[currentSide]) || {};
            const dateStr = sideDetails.date || event.date || "";
            const timeStr = sideDetails.time || event.time || "00:00";
            const m = /(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(dateStr);
            if (!m) return null;
            const [, dd, mm, yyyy] = m;
            const [hh = "0", mi = "0"] = String(timeStr).split(":");
            return new Date(+yyyy, +mm - 1, +dd, +hh, +mi);
        };

        const getEventName = (event) => {
            const sideDetails = (event.detailsBySide && event.detailsBySide[currentSide]) || {};
            return sideDetails.name
                || (event.nameBySide && event.nameBySide[currentSide])
                || event.name
                || "";
        };

        const now = new Date();
        const upcoming = (window.info.events || [])
            .map((ev) => ({ event: ev, date: parseEventDate(ev) }))
            .filter((x) => x.date instanceof Date && !isNaN(x.date) && x.date > now)
            .sort((a, b) => a.date - b.date);

        const wrap = document.createElement("section");
        wrap.className = "countdown";
        wrap.setAttribute("aria-live", "polite");

        if (!upcoming.length) {
            wrap.innerHTML = `
                <p class="countdown__label">Cảm ơn quý khách đã đến chia vui cùng chúng tôi</p>
            `;
            return { wrap, target: null };
        }

        const target = upcoming[0];
        wrap.innerHTML = `
            <p class="countdown__label">Còn lại</p>
            <div class="countdown__grid">
                <div class="countdown__cell"><span data-d>0</span><small>Ngày</small></div>
                <div class="countdown__sep">:</div>
                <div class="countdown__cell"><span data-h>00</span><small>Giờ</small></div>
                <div class="countdown__sep">:</div>
                <div class="countdown__cell"><span data-m>00</span><small>Phút</small></div>
                <div class="countdown__sep">:</div>
                <div class="countdown__cell"><span data-s>00</span><small>Giây</small></div>
            </div>
            <p class="countdown__note">tới ${getEventName(target.event)}</p>
        `;
        return { wrap, target };
    };

    const startTicking = (wrap, target) => {
        if (!target) return;
        const elD = wrap.querySelector("[data-d]");
        const elH = wrap.querySelector("[data-h]");
        const elM = wrap.querySelector("[data-m]");
        const elS = wrap.querySelector("[data-s]");
        const pad = (n) => String(n).padStart(2, "0");
        const tick = () => {
            /* Nếu wrap đã bị gỡ khỏi DOM (sau SPA navigate) — dừng timer */
            if (!wrap.isConnected) {
                if (tickTimer != null) {
                    window.clearInterval(tickTimer);
                    tickTimer = null;
                }
                return;
            }
            let diff = Math.max(0, target.date - new Date());
            const days = Math.floor(diff / 86400000); diff -= days * 86400000;
            const hrs  = Math.floor(diff / 3600000);  diff -= hrs * 3600000;
            const mins = Math.floor(diff / 60000);    diff -= mins * 60000;
            const secs = Math.floor(diff / 1000);
            elD.textContent = days;
            elH.textContent = pad(hrs);
            elM.textContent = pad(mins);
            elS.textContent = pad(secs);
        };
        tick();
        if (tickTimer != null) window.clearInterval(tickTimer);
        tickTimer = window.setInterval(tick, 1000);
    };

    const insert = () => {
        const list = document.querySelector("[data-event-list]");
        const card = document.querySelector(".landing-card");
        if (!list && !card) return; /* không phải trang landing — bỏ qua */

        /* Gỡ block cũ (nếu có) trước khi dựng lại */
        document.querySelectorAll(".countdown").forEach((el) => el.remove());

        const { wrap, target } = buildBlock();
        if (list && list.parentNode) list.parentNode.insertBefore(wrap, list);
        else if (card) card.appendChild(wrap);
        startTicking(wrap, target);
    };

    /* Phơi cho SPA gọi lại khi quay về trang landing */
    window.renderCountdown = insert;

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", insert, { once: true });
    } else {
        insert();
    }
})();
