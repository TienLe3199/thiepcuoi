/* =============================================================
   DỮ LIỆU THIỆP — NGUỒN DUY NHẤT (single source of truth)
   File này được include ở cả `index.html` (trang giới thiệu)
   và `thiep.html` (trang chi tiết 3 thẻ).

   Sau khi chỉnh ở đây, mở lại trình duyệt là toàn bộ site cập nhật.
   ============================================================= */

window.info = {
    /* --- Chung --- */
    pageTitle: "Thiệp cưới | Minh Tiến & Thùy Linh",
    title: "Hành trình chung đôi",            // eyebrow trên trang giới thiệu
    defaultSide: "groom",

    /* --- Background xoay vòng ---
       Danh sách ảnh nền sẽ tự động luân phiên (crossfade) sau mỗi
       `backgroundIntervalMs` mili-giây. Thêm/bớt đường dẫn tuỳ ý.
    */
    backgrounds: [
        "assets/bg.jpg",
        "assets/bg1.jpg",
        "assets/bg2.jpg"
    ],
    backgroundIntervalMs: 10000,
    backgroundFadeMs: 1200,

    /* --- Nhạc nền ---
       Đặt file mp3 vào assets/ rồi điền tên file vào `src`.
       Nếu để trống hoặc file không tồn tại, nút sẽ tự ẩn.
    */
    music: {
        src: "assets/music.mp3",
        volume: 0.35,
        autoplayHint: "Bật nhạc nền"
    },

    /* --- Cô dâu / Chú rể --- */
    groom: {
        name: "Minh Tiến",
        fullname: "Lê Minh Tiến",
        parents: {
            father: "Lê Đức Hòa",
            mother: "Nguyễn Thị Ngọc Ánh"
        }
    },
    bride: {
        name: "Thùy Linh",
        fullname: "Nguyễn Phạm Thùy Linh",
        parents: {
            father: "Nguyễn Ngọc Nhẫn",
            mother: "Phạm Thị Lựu"
        }
    },

    /* --- Danh sách sự kiện ---
       Mỗi event hiển thị 1 ô trên trang giới thiệu (index.html).
       Khi click sẽ mở `thiep.html?event=<id>` và bind dữ liệu của
       event đó vào 3 thẻ chi tiết.

       date  : "Thứ … - dd/mm/yyyy"
       time  : "HH:mm"                (giờ lễ, dùng cho Card 2)
       detailsBySide: (tuỳ chọn) ghi đè thông tin lễ theo groom/bride
       party : (tuỳ chọn) thông tin tiệc, dùng cho Card 3
    */
    events: [
        {
            id: "engagement",
            name: "Lễ Đính Hôn",
            date: "Thứ Sáu - 05/06/2026",
            date_al: "ÂL: 20/04",

            /* Lễ — hiển thị ở Card 2 */
            time: "09:40",
            venue: "Tư gia nhà gái",
            address: "36A, đường 100, KP8, phường Tăng Nhơn Phú",

            /* Tiệc — hiển thị ở Card 3 (nếu không có sẽ dùng giống lễ) */
            party: {
                time: "11:00",
                venueName: "Tư gia nhà gái",
                addressLines: [
                    "36A, đường 100, KP8, phường Tăng Nhơn Phú",
                    "TP. Hồ Chí Minh"
                ]
            },

            /* Tuỳ biến chữ trên thẻ chi tiết */
            card1Title: "Save the Date",
            card2Title: "Lễ đính hôn của chúng tôi",
            card3EyebrowTop: "Engagement Party"
        },
        {
            id: "wedding",
            name: "Tân Hôn",
            detailsBySide: {
                groom: {
                    name: "Tân Hôn",
                    card2Title: "Lễ Tân Hôn của chúng tôi",
                    date: "Thứ Hai - 16/11/2026",
                    date_al: "ÂL: 08/10",
                    time: "09:00",
                    venue: "Tư gia nhà trai",
                    address: "61, đường Nam Cao, KP15 , phường Tăng Nhơn Phú"
                },
                bride: {
                    name: "Vu Quy",
                    card2Title: "Lễ Vu Quy của chúng tôi",
                    date: "Chủ Nhật - 15/11/2026",
                    date_al: "ÂL: 07/10",
                    time: "09:00",
                    venue: "Tư gia nhà gái",
                    address: "36A, đường 100, KP8, phường Tăng Nhơn Phú"
                }
            },

            party: {
                time: "18:00",
                venueName: "Nhà Hàng Cát Đằng",
                addressLines: [
                    "11, đường Trương Văn Thành, KP4, phường Tăng Nhơn Phú",
                    "TP. Hồ Chí Minh"
                ]
            },

            card1Title: "Save the Date",
            card3EyebrowTop: "Wedding Reception"
        }
    ],

    /* Event mặc định khi mở thiep.html không có tham số ?event */
    defaultEventId: "wedding",

    /* ========= Nhãn mặc định cho 3 thẻ chi tiết =========
       Những text nào phụ thuộc sự kiện đã chuyển lên trong events[].
       Ở đây chỉ còn label chung.
    */
    card1: {
        eyebrowTop: "The Wedding Of",
        amp: "&",
        inviteNote: "Trân trọng kính mời",
        eyebrowBottom: "Together forever"
    },

    card2: {
        nhaTraiLabel: "Nhà Trai",
        nhaGaiLabel: "Nhà Gái",
        fatherPrefix: "Ông",
        motherPrefix: "Bà",
        amp: "&",
        hourSuffix: "Giờ"
    },

    card3: {
        welcome: "Trân trọng kính mời",
        hourSuffix: "Giờ",
        closingLines: [
            "Sự hiện diện của quý khách",
            "là niềm vinh hạnh cho gia đình chúng tôi."
        ],
        eyebrowBottom: "Save our love"
    },

    /* ========= Trang giới thiệu (index.html) ========= */
    landing: {
        footer: "Trân trọng kính báo"
    }
};
