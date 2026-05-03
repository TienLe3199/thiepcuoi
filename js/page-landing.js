/* =============================================================
   PAGE LANDING — bind dữ liệu cho `index.html`

   - Trước đây logic này nằm trong inline <script> ở cuối index.html
   - Tách ra để SPA navigation có thể GỌI LẠI khi chuyển trang
     (mà không cần reload full → giữ nguyên audio nền)
   - Auto-render khi script được load tĩnh (không qua SPA)
   ============================================================= */
(function () {
    const byPath = (obj, path) =>
        path.split(".").reduce((o, k) => (o == null ? undefined : o[k]), obj);

    const buildUrl = (path, updates = {}) => {
        const nextParams = new URLSearchParams(location.search);
        Object.entries(updates).forEach(([key, value]) => {
            if (value == null || value === "") nextParams.delete(key);
            else nextParams.set(key, value);
        });
        const query = nextParams.toString();
        return query ? `${path}?${query}` : path;
    };

    window.renderLandingPage = function () {
        const info = window.info || {};
        if (!Array.isArray(info.events)) return;

        const params = new URLSearchParams(location.search);
        const defaultSide = info.defaultSide === "bride" ? "bride" : "groom";
        const currentSide = params.get("side") === "bride"
            ? "bride"
            : (params.get("side") === "groom" ? "groom" : defaultSide);
        const nextSide = currentSide === "groom" ? "bride" : "groom";

        const getSideDetails = (event) =>
            (event.detailsBySide && event.detailsBySide[currentSide]) || {};
        const getEventValue = (event, key) => {
            const sideDetails = getSideDetails(event);
            return sideDetails[key] ?? event[key] ?? "";
        };
        const getEventName = (event) => {
            const sideDetails = getSideDetails(event);
            return sideDetails.name
                || (event.nameBySide && event.nameBySide[currentSide])
                || event.name
                || "";
        };

        document.title = info.pageTitle || document.title;

        const switchLink = document.querySelector("[data-side-toggle]");
        if (switchLink) {
            switchLink.href = buildUrl("index.html", { side: nextSide, event: null });
            switchLink.textContent = nextSide === "groom" ? "Xem chú rể" : "Xem cô dâu";
            switchLink.title = currentSide === "groom"
                ? "Đang xem phía chú rể"
                : "Đang xem phía cô dâu";
        }

        document.querySelectorAll("[data-bind]").forEach((el) => {
            const v = byPath(info, el.dataset.bind);
            if (v !== undefined && v !== null) el.textContent = String(v);
        });

        const list = document.querySelector("[data-event-list]");
        if (list) {
            list.innerHTML = info.events.map((ev, idx) => `
                <li class="event-card-wrap" style="animation-delay:${0.1 + idx * 0.08}s">
                    <a class="event-card" href="${buildUrl("thiep.html", { event: ev.id, side: currentSide })}">
                        <h2 class="event-name">${getEventName(ev)}</h2>
                        <p class="event-date">${getEventValue(ev, "date")}</p>
                        <p class="event-date-al">${getEventValue(ev, "date_al")}</p>
                        <p class="event-venue">${getEventValue(ev, "venue")}</p>
                        <p class="event-address">${getEventValue(ev, "address")}</p>
                        <span class="event-cta">Xem thiệp &rarr;</span>
                    </a>
                </li>
            `).join("");
        }

        /* Sau khi đã render landing, dựng lại block đếm ngược (nếu có) */
        if (typeof window.renderCountdown === "function") {
            window.renderCountdown();
        }
    };

    /* Chỉ auto-render khi DOM đã có khung của trang landing.
       (Khi script load trên thiep.html — selector rỗng — sẽ skip.) */
    const autoInit = () => {
        if (document.querySelector(".landing-card")) {
            window.renderLandingPage();
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", autoInit, { once: true });
    } else {
        autoInit();
    }
})();
