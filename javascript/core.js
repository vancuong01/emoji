/* ========================================================
 * TÁC GIẢ: BỞI VĂN CƯỜNG (CODE BY VANCUONG)
 * TÊN FILE: core.js (Hộ Tông Đại Trận - Anti Hack/Cheat)
 * BẢN QUYỀN: ĐỘC QUYỀN SERVER TU TIÊN PIKACHU
 * ======================================================== */
(function() {
    // ----------------------------------------------------
    // TRẬN PHÁP 1: KHÓA CHẶT CỬA VÀO (CHẶN F12, CHUỘT PHẢI)
    // ----------------------------------------------------
    
    // Chặn chuột phải (Không cho Inspect Element)
    document.addEventListener('contextmenu', event => {
        event.preventDefault();
        antiCheatWarn("Khu vực cấm! Không thể dùng thần thức (Chuột phải) dò xét!");
    });

    // Chặn các phím tắt nguy hiểm
    document.addEventListener('keydown', function(e) {
        // Chặn F12
        if (e.keyCode === 123) {
            e.preventDefault();
            antiCheatWarn("Kẻ gian định phá giải Hộ Tông Đại Trận (F12)? Vô ích!");
            return false;
        }
        // Chặn Ctrl+Shift+I (Mở DevTools)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 73) {
            e.preventDefault();
            antiCheatWarn("Nghiệt súc, dám dùng ma pháp Ctrl+Shift+I à?");
            return false;
        }
        // Chặn Ctrl+Shift+J (Mở Console)
        if (e.ctrlKey && e.shiftKey && e.keyCode === 74) {
            e.preventDefault();
            antiCheatWarn("Ma đạo Ctrl+Shift+J không có tác dụng ở đây!");
            return false;
        }
        // Chặn Ctrl+U (View Source - Xem mã nguồn)
        if (e.ctrlKey && e.keyCode === 85) {
            e.preventDefault();
            antiCheatWarn("Định trộm bí kíp (Ctrl+U) sao? Nằm mơ!");
            return false;
        }
    });

    // ----------------------------------------------------
    // TRẬN PHÁP 2: LỜI NGUYỀN "PHẢN PHỆ" (DEBUGGER TRAP)
    // ----------------------------------------------------
    // Nếu tà tu dùng mưu hèn kế bẩn mở được F12 trước khi vào web,
    // Trận pháp này sẽ làm trình duyệt của hắn bị kẹt vĩnh viễn, không thể gõ lệnh hack.
    
    setInterval(function() {
        let before = new Date().getTime();
        
        // CẢNH BÁO CHO SẾP: Khi SẾP muốn tự mở F12 để code, 
        // hãy thêm dấu // vào trước chữ debugger dưới đây để tắt bẫy nhé!
        debugger; 
        
        let after = new Date().getTime();
        if (after - before > 100) {
            // Phát hiện có người đang mở F12 và bị kẹt ở lệnh debugger
            document.body.innerHTML = `
                <div style="background:#000; height:100vh; display:flex; flex-direction:column; justify-content:center; align-items:center; color:red; font-family:sans-serif;">
                    <div style="font-size: 5rem;">☠️</div>
                    <h1 style="text-shadow: 0 0 20px red;">PHÁT HIỆN TÀ TU HACK GAME!</h1>
                    <p style="color: #fff; font-size:1.2rem;">Thiên Đạo đã ghi nhận IP của ngươi. Trình duyệt đã bị đóng băng!</p>
                </div>
            `;
        }
    }, 1000);

    // ----------------------------------------------------
    // TRẬN PHÁP 3: CẢNH BÁO TẠI BẢNG ĐIỀU KHIỂN (CONSOLE)
    // ----------------------------------------------------
    setTimeout(() => {
        console.clear();
        console.log("%c⚡ DỪNG LẠI NGAY! ⚡", "color: red; font-size: 50px; font-weight: bold; text-shadow: 2px 2px 0 #fff;");
        console.log("%cKhu vực này là cấm địa của Tông Môn. Mọi hành vi dùng mã lệnh can thiệp vào chỉ số (Hack/Cheat) đều bị Thiên Đạo (Firebase) ghi lại và khóa tài khoản vĩnh viễn!", "color: yellow; font-size: 18px; font-weight: bold; background: #000; padding: 10px; border-radius: 5px;");
        console.log("%cCode by Văn Cường", "color: #00ffff; font-size: 14px; font-style: italic;");
    }, 2000);

    // ----------------------------------------------------
    // TRẬN PHÁP 4: CHỐNG SỬA LOCALSTORAGE BẰNG LỆNH CƠ BẢN
    // ----------------------------------------------------
    // Chặn bọn trẻ trâu gõ: localStorage.setItem('pikachu_coins', 9999999)
    const originalSetItem = localStorage.setItem;
    localStorage.setItem = function(key, value) {
        // Chỉ cho phép hệ thống game lưu những biến có chữ 'pikachu_'
        // Nếu ai đó gõ lệnh bậy bạ ngoài hệ thống, chặn luôn!
        if (key.includes('pikachu_')) {
            originalSetItem.apply(this, arguments);
        } else {
            console.error("⛔ Hành vi mờ ám bị từ chối!");
        }
    };

    // Hàm gọi thông báo hiển thị
    function antiCheatWarn(msg) {
        if (window.showCustomAlertInternal) {
            window.showCustomAlertInternal(msg);
        } else {
            alert(msg);
        }
    }
})();