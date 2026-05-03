/* =============================================================
   PAGE DETAIL — bind dữ liệu sự kiện được chọn vào 3 thẻ ở `thiep.html`

   - Trước đây logic này nằm trong inline <script> ở cuối thiep.html
   - Tách ra để SPA navigation có thể GỌI LẠI khi chuyển trang
     (mà không cần reload full → giữ nguyên audio nền)
   - Auto-render khi script được load tĩnh (không qua SPA)
   ============================================================= */
(function () {
    const escapeHtml = (value) =>
        String(value ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/\"/g, "&quot;")
            .replace(/'/g, "&#39;");

    const parseDate = (s) => {
        const m = /^\s*(.+?)\s*-\s*(\d{1,2})\/(\d{1,2})\/(\d{4})\s*$/.exec(s || "");
        return m
            ? { weekday: m[1].trim(), day: m[2], month: m[3], year: m[4] }
            : { weekday: "", day: "", month: "", year: "" };
    };

    const parseTime = (s) => {
        const [h = "", mm = ""] = (s || "").split(":");
        return { hour: h, minute: mm };
    };

    const linesToHtml = (lines) =>
        (Array.isArray(lines) ? lines : [lines])
            .filter((l) => l != null && l !== "")
            .map((l) => String(l))
            .join("<br/>");

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

    window.renderDetailPage = function () {
        const info = window.info || {};
        if (!Array.isArray(info.events)) return;

        const renderFamily = (family, card2) => `
            <div class="family">
                <p class="role">${escapeHtml(family.label)}</p>
                <p>
                    <span>${escapeHtml(card2.fatherPrefix)}</span>&nbsp;
                    <span class="parent-name">${escapeHtml(family.parents.father)}</span>
                </p>
                <p>
                    <span>${escapeHtml(card2.motherPrefix)}</span>&nbsp;
                    <span class="parent-name">${escapeHtml(family.parents.mother)}</span>
                </p>
            </div>
        `;

        const params = new URLSearchParams(location.search);
        const defaultSide = info.defaultSide === "bride" ? "bride" : "groom";
        const currentSide = params.get("side") === "bride"
            ? "bride"
            : (params.get("side") === "groom" ? "groom" : defaultSide);
        const nextSide = currentSide === "groom" ? "bride" : "groom";
        const eventId = params.get("event")
            || info.defaultEventId
            || (info.events[0] && info.events[0].id);

        const ev = info.events.find((e) => e.id === eventId) || info.events[0] || {};
        const sideDetails = (ev.detailsBySide && ev.detailsBySide[currentSide]) || {};
        const getEventValue = (key) => sideDetails[key] ?? ev[key] ?? "";
        const party = (ev.partyBySide && ev.partyBySide[currentSide]) || ev.party || {};
        const eventName = sideDetails.name
            || (ev.nameBySide && ev.nameBySide[currentSide])
            || ev.name
            || "";
        const card2Title = sideDetails.card2Title
            || (ev.card2TitleBySide && ev.card2TitleBySide[currentSide])
            || ev.card2Title
            || info.card2.title
            || eventName;
        const familyOrder = currentSide === "bride"
            ? [
                { label: info.card2.nhaGaiLabel, parents: info.bride.parents },
                { label: info.card2.nhaTraiLabel, parents: info.groom.parents }
            ]
            : [
                { label: info.card2.nhaTraiLabel, parents: info.groom.parents },
                { label: info.card2.nhaGaiLabel, parents: info.bride.parents }
            ];
        const familiesHtml = `
            ${renderFamily(familyOrder[0], info.card2)}
            <div class="vline"></div>
            ${renderFamily(familyOrder[1], info.card2)}
        `;

        const d = parseDate(getEventValue("date"));
        const t2 = parseTime(getEventValue("time"));
        const t3 = parseTime(party.time || getEventValue("time"));

        const hSfx2 = info.card2.hourSuffix || "Giờ";
        const hSfx3 = info.card3.hourSuffix || "Giờ";

        const lunarRaw = (getEventValue("date_al") || "").replace(/^ÂL\s*:\s*/i, "").trim();
        const lunarNote = lunarRaw ? `(Nhằm ngày ${lunarRaw} Âm lịch)` : "";

        const buildMapsUrl = (parts) => {
            const q = (Array.isArray(parts) ? parts : [parts])
                .filter(Boolean).join(", ").trim();
            return q ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(q)}` : "";
        };
        const isPrivateHome = (venue) => /t[ưu]\s*gia/i.test(String(venue || ""));

        const venue2 = getEventValue("venue");
        const addr2 = getEventValue("address");
        const card2MapsUrl = sideDetails.mapsUrl
            || ev.mapsUrl
            || buildMapsUrl(isPrivateHome(venue2) ? [addr2] : [venue2, addr2]);

        const venue3 = party.venueName || info.card3.venueName || "";
        const addrLines3 = party.addressLines || info.card3.addressLines || [];
        const card3MapsUrl = (party && party.mapsUrl)
            || buildMapsUrl(isPrivateHome(venue3) ? addrLines3 : [venue3, ...addrLines3]);

        const pickLobby = (src) => {
            if (!src) return "";
            if (src.lobbyBySide && src.lobbyBySide[currentSide]) return src.lobbyBySide[currentSide];
            if (typeof src.lobby === "string") return src.lobby;
            if (src.lobby && typeof src.lobby === "object" && src.lobby[currentSide]) return src.lobby[currentSide];
            return "";
        };
        const partyLobby = pickLobby(party) || pickLobby(info.card3);

        const vm = {
            groom: info.groom,
            bride: info.bride,

            card1: {
                ...info.card1,
                title: sideDetails.card1Title || ev.card1Title || info.card1.title || "Save the Date",
                dateDisplay: (d.day && d.month && d.year)
                    ? `${d.day} · ${d.month} · ${d.year}`
                    : ""
            },

            card2: {
                ...info.card2,
                title: card2Title,
                weekday: d.weekday,
                day: d.day,
                month: d.month,
                year: d.year,
                hour: t2.hour,
                minuteLabel: hSfx2 + " " + (t2.minute || "00"),
                venueName: (getEventValue("venue") || "").toUpperCase(),
                venueAddress: getEventValue("address"),
                lunarNote,
                familiesHtml,
                mapsUrl: card2MapsUrl
            },

            card3: {
                ...info.card3,
                eyebrowTop: sideDetails.card3EyebrowTop || ev.card3EyebrowTop || info.card3.eyebrowTop || "",
                venueName: party.venueName || info.card3.venueName || "",
                lobby: partyLobby,
                weekday: d.weekday,
                day: d.day,
                month: d.month,
                year: d.year,
                hour: t3.hour,
                minuteLabel: hSfx3 + " " + (t3.minute || "00"),
                addressHtml: linesToHtml(party.addressLines || info.card3.addressLines || []),
                closingHtml: linesToHtml(info.card3.closingLines),
                mapsUrl: card3MapsUrl
            }
        };

        const backLink = document.querySelector(".back-link");
        if (backLink) backLink.href = buildUrl("index.html", { side: currentSide, event: null });

        const switchLink = document.querySelector("[data-side-toggle]");
        if (switchLink) {
            switchLink.href = buildUrl("thiep.html", { event: eventId, side: nextSide });
            switchLink.textContent = nextSide === "groom" ? "Xem chú rể" : "Xem cô dâu";
            switchLink.title = currentSide === "groom"
                ? "Đang xem phía chú rể"
                : "Đang xem phía cô dâu";
        }

        document.title = eventName
            ? `${eventName} | ${info.groom.name} & ${info.bride.name}`
            : (info.pageTitle || document.title);

        document.querySelectorAll("[data-bind]").forEach((el) => {
            const v = byPath(vm, el.dataset.bind);
            if (v !== undefined && v !== null && v !== "") {
                el.textContent = String(v);
                el.style.display = "";
            } else if (el.dataset.hideEmpty === "true") {
                el.style.display = "none";
            }
        });

        document.querySelectorAll("[data-bind-html]").forEach((el) => {
            const v = byPath(vm, el.dataset.bindHtml);
            if (v !== undefined && v !== null) el.innerHTML = String(v);
        });

        document.querySelectorAll("[data-bind-href]").forEach((el) => {
            const v = byPath(vm, el.dataset.bindHref);
            if (v) {
                el.setAttribute("href", String(v));
                el.style.display = "";
            } else {
                el.style.display = "none";
            }
        });
    };

    /* Chỉ auto-render khi DOM đã có khung của trang detail.
       (Khi script load trên index.html — selector rỗng — sẽ skip.) */
    const autoInit = () => {
        if (document.querySelector(".invitation")) {
            window.renderDetailPage();
        }
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", autoInit, { once: true });
    } else {
        autoInit();
    }
})();
