/* =============================================================
   ENVELOPE OVERLAY — hiệu ứng "mở thiệp" cho thiep.html

   - Khi vào thiep.html: hiển thị 1 lớp phủ chia làm 2 cánh.
     Giữa 2 cánh có monogram (tên cô dâu / chú rể).
   - User chạm vào → 2 cánh tách ra 2 bên + fade, monogram
     scale lớn dần rồi mờ → hiện thiệp ở dưới.
   - Đã mở 1 lần / phiên (sessionStorage) sẽ không hiện lại,
     trừ khi user xoá session hoặc quay lại sau khi đóng tab.
   ============================================================= */
(function () {
    if (typeof window === "undefined" || !window.info) return;

    const STORAGE_KEY = "wedding-envelope-opened";
    let opened = false;
    try { opened = sessionStorage.getItem(STORAGE_KEY) === "1"; } catch (_) {}
    if (opened) return;

    const groomName = (window.info.groom && window.info.groom.name) || "";
    const brideName = (window.info.bride && window.info.bride.name) || "";

    const overlay = document.createElement("div");
    overlay.className = "envelope-veil";
    overlay.setAttribute("role", "button");
    overlay.setAttribute("tabindex", "0");
    overlay.setAttribute("aria-label", "Chạm để mở thiệp");
    overlay.innerHTML = `
        <div class="envelope-veil__half envelope-veil__half--left"></div>
        <div class="envelope-veil__half envelope-veil__half--right"></div>
        <div class="envelope-veil__center">
            <div class="envelope-veil__seal">
                <span class="envelope-veil__amp">&amp;</span>
            </div>
            <p class="envelope-veil__eyebrow">The Wedding Of</p>
            <h2 class="envelope-veil__names">
                <span class="envelope-veil__name">${groomName}</span>
                <span class="envelope-veil__and">&</span>
                <span class="envelope-veil__name">${brideName}</span>
            </h2>
            <p class="envelope-veil__hint">
                <span class="envelope-veil__hint-arrow">↓</span>
                Chạm để mở thiệp
            </p>
        </div>
    `;

    const mount = () => {
        document.body.appendChild(overlay);
        /* Khoá scroll khi veil còn hiển thị */
        document.documentElement.style.overflow = "hidden";
        requestAnimationFrame(() => {
            requestAnimationFrame(() => overlay.classList.add("is-shown"));
        });
    };

    if (document.body) mount();
    else document.addEventListener("DOMContentLoaded", mount, { once: true });

    let opening = false;
    const open = () => {
        if (opening) return;
        opening = true;
        try { sessionStorage.setItem(STORAGE_KEY, "1"); } catch (_) {}
        overlay.classList.add("is-opening");
        document.documentElement.style.overflow = "";
        window.setTimeout(() => overlay.remove(), 1400);
    };

    overlay.addEventListener("click", open);
    overlay.addEventListener("keydown", (e) => {
        if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            open();
        }
    });
})();
