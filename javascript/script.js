// Khai báo lại biến này để các file cũ (như auth.js) không bị lỗi toLowerCase()
// Tuyệt đối KHÔNG khai báo password ở đây nữa để bảo mật.
window.ADMIN_ACCOUNT = "vancuong140904";

const firebaseConfig = {
    apiKey: "AIzaSyBrbaiECPkErRotePLyNop594s-em6WO_c",
    authDomain: "pikachu-vancuong-6d602.firebaseapp.com",
    databaseURL: "https://pikachu-vancuong-6d602-default-rtdb.firebaseio.com",
    projectId: "pikachu-vancuong-6d602",
    storageBucket: "pikachu-vancuong-6d602.firebasestorage.app",
    messagingSenderId: "452927813810",
    appId: "1:452927813810:web:9ef3a40c37f022f094b1ab"
};

window.db = null;
try {
    if (typeof window.firebase !== 'undefined') {
        if (!window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);
        window.db = window.firebase.database();
    } else {
        console.warn("⚠️ Firebase bị chặn hoặc tải chậm. Game sẽ chạy chế độ Offline.");
    }
} catch(e) { console.error("❌ Lỗi hệ thống Firebase:", e); }


// --- CÁC HÀM TOÀN CỤC DÙNG CHUNG ---
window.gameStateGlobal = { isMuted: false };
window.playSoundInternal = function(type) { /* Logic gán lại bên game.js */ };
window.showCustomAlertInternal = function(message, callback) { alert(message); if (callback) callback(); }

window.getVipLevelInfo = function(vipPoints) {
    let pts = parseInt(vipPoints) || 0;
    if (pts >= 100000) return { level: 10, name: "Tiên Nhân", color: "#ff0000" }; 
    if (pts >= 50000)  return { level: 9,  name: "Độ Kiếp",   color: "#ff00ff" }; 
    if (pts >= 20000)  return { level: 8,  name: "Đại Thừa",  color: "#9c27b0" }; 
    if (pts >= 10000)  return { level: 7,  name: "Hợp Thể",   color: "#00e5ff" }; 
    if (pts >= 5000)   return { level: 6,  name: "Luyện Hư",  color: "#00e676" }; 
    if (pts >= 2000)   return { level: 5,  name: "Hóa Thần",  color: "#ff9100" }; 
    if (pts >= 1000)   return { level: 4,  name: "Nguyên Anh",color: "#2979ff" }; 
    if (pts >= 500)    return { level: 3,  name: "Kết Đan",   color: "#ffd700" }; 
    if (pts >= 200)    return { level: 2,  name: "Trúc Cơ",   color: "#e0e0e0" }; 
    if (pts >= 100)    return { level: 1,  name: "Luyện Khí", color: "#cd7f32" }; 
    return { level: 0, name: "Phàm Nhân", color: "#888888" }; 
};

// Thêm biến skipSync để chống lặp vô hạn khi tự gọi lại chính nó
window.showMainMenu = function(skipSync = false) {
    let gc = document.querySelector('.game-container'); if (gc) gc.style.display = 'none';

    let accId = localStorage.getItem('pikachu_account_id'); 
    let playerName = localStorage.getItem('pikachu_player_name');
    
    if (!accId || !playerName) { if(window.showAuthScreen) window.showAuthScreen(); return; }
    
    let existingMenu = document.getElementById('main-menu-overlay'); 
    if (existingMenu) existingMenu.remove();
    
    // --- DIỆT CHỮ UNDEFINED VÀ TẠO AVATAR CHUẨN ---
    let avatarSrc = localStorage.getItem('pikachu_player_avatar');
    if (!avatarSrc || avatarSrc === 'undefined' || avatarSrc === 'null' || avatarSrc.includes('imgur.com')) { 
        let safeName = encodeURIComponent(playerName || 'Boss'); 
        avatarSrc = `https://ui-avatars.com/api/?name=${safeName}&background=random&color=fff&size=100&bold=true`; 
    }
    // Cập nhật Avatar cho bảng Cột Trái (lúc vào chơi Game Pikachu)
    let inGameAvatar = document.getElementById('avatar-img');
    if (inGameAvatar) {
        inGameAvatar.src = avatarSrc;
    }
    
    let vipPts = localStorage.getItem('pikachu_vip_points') || 0;
    let vipInfo = window.getVipLevelInfo(vipPts);
    
    // --- KIỂM TRA QUYỀN ADMIN TỪ LOCALSTORAGE ---
    let isAdmin = localStorage.getItem('pikachu_is_admin') === 'true';
    if (isAdmin) { vipInfo = { level: 10, name: "Tiên Nhân", color: "#ff0000", glow: "0 0 20px #ff0000" }; }

    let glowClass = vipInfo.level > 0 ? 'vip-glow-frame' : '';
    let textGlowClass = vipInfo.level > 0 ? 'vip-glow-text' : '';
    let adminBtnHTML = isAdmin ? `<button id="btn-admin-panel" style="background: #9c27b0; border: 1px solid #e1bee7; color: #fff; font-size: 0.8rem; padding: 5px 8px; border-radius: 5px; cursor: pointer; margin-top: 5px; width: 100%;">⚙️ Admin Panel</button>` : "";

    let currentFrame = localStorage.getItem('pikachu_equipped_frame') || 'none';
    
    let avatarWithFrameHTML = '';
    if (window.renderAvatarWithFrame) {
        avatarWithFrameHTML = window.renderAvatarWithFrame(avatarSrc, currentFrame, vipInfo.color, 60); 
    } else {
        avatarWithFrameHTML = `<img src="${avatarSrc}" style="width: 60px; height: 60px; border-radius: 50%; border: 3px solid ${vipInfo.color}; object-fit: cover;">`;
    }

    const menuHTML = `
    <div id="main-menu-overlay" style="z-index: 999999; background: radial-gradient(circle, #8b5a2b, #3e2723); display: flex; flex-direction: column; align-items: center; position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh; box-sizing: border-box; overflow-y: auto; padding: 20px;">
        <div style="display: flex; width: 100%; max-width: 1200px; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 15px;">
            <div style="display: flex; gap: 10px; flex-wrap: wrap; z-index: 10;">
                <button id="btn-shop-open" style="background: linear-gradient(to bottom, #4caf50, #2e7d32); border: 3px solid #69f0ae; color: #fff; font-weight: bold; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-size: 1.1rem; box-shadow: 0 0 15px rgba(76, 175, 80, 0.8);">🛒 CỬA HÀNG</button>
                <button id="btn-menu-wealth" style="background: linear-gradient(to bottom, #1a237e, #000000); border: 3px solid #00ffff; color: #00ffff; font-weight: bold; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-size: 1.1rem; box-shadow: 0 0 15px rgba(0,255,255,0.6);">💰 ĐẠI GIA</button>
                <button id="btn-menu-nhiemvu" style="background: linear-gradient(to bottom, #f57f17, #e65100); border: 3px solid #ffcc80; color: #fff; font-weight: bold; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-size: 1.1rem; box-shadow: 0 0 15px rgba(255, 152, 0, 0.6);">📜 NHIỆM VỤ</button>
                <button id="btn-menu-friends" style="background: linear-gradient(to bottom, #00838f, #4a148c); border: 3px solid #e040fb; color: #fff; font-weight: bold; padding: 10px 20px; border-radius: 12px; cursor: pointer; font-size: 1.1rem; box-shadow: 0 0 15px rgba(224, 64, 251, 0.6);">👥 HẢO HỮU</button>
            </div>
            
            <div class="${glowClass}" style="background: rgba(0,0,0,0.6); padding: 10px 15px; border-radius: 15px; border: 2px solid ${vipInfo.color}; display: flex; align-items: center; gap: 15px; box-shadow: ${vipInfo.glow}; --vip-color: ${vipInfo.color}; z-index: 10;">
                <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
                    <div style="color: #00ffff; font-size: 0.9rem; margin-bottom: 5px;">ID: ${accId}</div>
                    
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px; margin-bottom: 8px;">
                        <span style="font-size:0.75rem; background: ${vipInfo.color}; color:#000; padding:3px 8px; border-radius:4px; font-weight:bold; box-shadow: 0 0 5px ${vipInfo.color}; white-space: nowrap; text-transform: uppercase;">${vipInfo.name}</span>
                        <span class="name-txt ${textGlowClass}" style="color: ${vipInfo.color}; font-size: 1.4rem; font-weight: bold; font-family: 'Times New Roman', serif; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; --vip-color: ${vipInfo.color};">${playerName}</span>
                    </div>

                    <div class="mm-actions" style="display: flex; gap: 5px; justify-content: flex-end; align-items: center;">
                        <button onclick="localStorage.removeItem('pikachu_is_admin'); if(window.logout) window.logout()" style="background: #d32f2f; color: white; border: 1px solid #fff; padding: 4px 15px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.85rem; box-shadow: 0 2px 5px rgba(0,0,0,0.5);">Đăng Xuất</button>
                    </div>
                    ${adminBtnHTML}
                </div>
                
                <div style="position: relative; cursor: pointer; transition: 0.2s;" id="btn-change-avatar" title="Bấm để mở Hồ Sơ">
                    ${avatarWithFrameHTML}
                </div>
            </div>
        </div>
        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; padding-bottom: 20px; margin-top: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: clamp(3rem, 8vw, 5rem); font-weight: bold; text-shadow: 5px 5px 0 #000; margin-bottom: 20px; letter-spacing: 5px; line-height: 1.1;">
                    <span style="color: #ffd700;">E</span><span style="color: #ffa500;">M</span><span style="color: #ffd700;">O</span><span style="color: #ffa500;">J</span><span style="color: #ffd700;">I</span><br><span style="font-size: clamp(1.5rem, 4vw, 2rem); color: #fff; text-shadow: 2px 2px 0 #000;">VĂN CƯỜNG</span>
                </div>
                <div style="animation: bounce 2s infinite;"><span style="font-size: clamp(4rem, 10vw, 8rem);">🎮</span></div>
            </div>
            <div style="display: flex; flex-direction: column; gap: clamp(10px, 2vh, 20px); align-items: center;">
                <button id="btn-menu-start" style="background: radial-gradient(circle, #ffd700, #ff8c00); border: 4px solid #fff; color: #000; font-weight: bold; padding: 20px 40px; border-radius: 50px; cursor: pointer; font-size: clamp(1.5rem, 5vw, 2.5rem); box-shadow: 0 10px 20px rgba(0,0,0,0.6); transition: transform 0.1s; text-shadow: 2px 2px 0 #fff; width: 100%;">CHƠI</button>
                <button id="btn-menu-pvp" class="pvp-btn" style="background: linear-gradient(to right, #d32f2f, #b71c1c); border: 3px solid #ffeb3b; border-radius: 30px; padding: clamp(8px, 1.5vh, 15px) clamp(20px, 5vw, 50px); font-size: clamp(1.1rem, 3.5vw, 1.6rem); font-weight: bold; color: #fff; cursor: pointer; box-shadow: 0 5px 15px rgba(211,47,47,0.6); transition: 0.2s; text-shadow: 1px 1px 2px #000; width: 100%;">⚔️ VÕ ĐÀI PVP</button>
                <button id="btn-menu-history" style="background: linear-gradient(to right, #455a64, #263238); border: 3px solid #90a4ae; border-radius: 30px; padding: clamp(8px, 1.5vh, 15px) clamp(20px, 5vw, 50px); font-size: clamp(1.1rem, 3.5vw, 1.6rem); font-weight: bold; color: #fff; cursor: pointer; box-shadow: 0 5px 15px rgba(0,0,0,0.6); transition: 0.2s; text-shadow: 1px 1px 2px #000; width: 100%;">📜 LỊCH SỬ PVP</button>
                <button id="btn-menu-ranking" style="background: linear-gradient(to bottom, #8b4513, #5c2e0b); border: 3px solid #d4af37; color: #ffd700; font-weight: bold; padding: 15px 40px; border-radius: 12px; cursor: pointer; font-size: clamp(1.2rem, 3vw, 1.5rem); box-shadow: 0 6px 10px rgba(0,0,0,0.5); transition: transform 0.1s; width: 100%;">🏆 BẢNG PHONG THẦN</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', menuHTML);

    // Xử lý sự kiện các nút
    document.getElementById('btn-menu-ranking').addEventListener('click', () => { window.playSoundInternal('select'); if(window.showLeaderboardInternal) window.showLeaderboardInternal(); });
    document.getElementById('btn-menu-start').addEventListener('click', () => { window.playSoundInternal('select'); let diffModal = document.getElementById('difficulty-modal'); if (diffModal) diffModal.classList.remove('hidden'); });
    document.getElementById('btn-shop-open').addEventListener('click', () => { if(window.openShopPanel) window.openShopPanel(); else window.showCustomAlertInternal("Lỗi Cửa hàng!"); });
    
    let btnWealth = document.getElementById('btn-menu-wealth');
    if(btnWealth) btnWealth.addEventListener('click', () => { window.playSoundInternal('select'); if(window.showWealthLeaderboard) window.showWealthLeaderboard(); else window.showCustomAlertInternal("Thiếu file daigia.js!"); });

    let btnAdmin = document.getElementById('btn-admin-panel');
    if (btnAdmin) btnAdmin.addEventListener('click', () => { window.playSoundInternal('select'); if (window.openAdminPanel) window.openAdminPanel(); });

    let btnFriends = document.getElementById('btn-menu-friends');
    if(btnFriends) btnFriends.addEventListener('click', () => { 
        if(window.playSoundInternal) window.playSoundInternal('select'); 
        if(window.FriendSystem) window.FriendSystem.openLobby(); 
        else window.showCustomAlertInternal("Hệ thống Bạn bè đang nâng cấp!"); 
    });

    let btnHistory = document.getElementById('btn-menu-history');
    if(btnHistory) btnHistory.addEventListener('click', () => { 
        if(window.playSoundInternal) window.playSoundInternal('select'); 
        if(window.PvPHistory) window.PvPHistory.open(); 
    });
    
    let btnChangeAvt = document.getElementById('btn-change-avatar');
    if (btnChangeAvt) {
        btnChangeAvt.onmouseover = () => btnChangeAvt.style.transform = "scale(1.05)";
        btnChangeAvt.onmouseleave = () => btnChangeAvt.style.transform = "scale(1)";
        btnChangeAvt.onclick = () => {
            if(window.playSoundInternal) window.playSoundInternal('select'); 
            if(window.PlayerProfile) window.PlayerProfile.open(); 
        };
    }

    let btnNhiemVu = document.getElementById('btn-menu-nhiemvu');
    if(btnNhiemVu) btnNhiemVu.addEventListener('click', () => { 
        if(window.playSoundInternal) window.playSoundInternal('select'); 
        if(window.DailyQuest) window.DailyQuest.open(); 
        else alert("Thiếu file nhiemvu.js sếp ơi!");
    });

    // --- ĐỒNG BỘ DỮ LIỆU NGẦM (CHỐNG KẸT F5 LÚC LOGIN) ---
    if (!skipSync && window.db && accId) {
        window.db.ref('users/' + accId).once('value').then(snap => {
            if (snap.exists()) {
                let d = snap.val();
                let realIsAdmin = d.isAdmin === true;
                let localIsAdmin = localStorage.getItem('pikachu_is_admin') === 'true';
                
                // Đồng bộ cờ từ Firebase về máy
                if (realIsAdmin) {
                    localStorage.setItem('pikachu_is_admin', 'true');
                } else {
                    localStorage.removeItem('pikachu_is_admin');
                }

                // Nếu phát hiện có sự thay đổi quyền (Ví dụ vừa log nick Admin vào), tự động vẽ lại UI
                if (realIsAdmin !== localIsAdmin) {
                    window.showMainMenu(true); // truyền true để bỏ qua vòng lặp check ngầm
                }
            }
        }).catch(err => console.log("Lỗi đồng bộ ngầm: ", err));
    }
}

window.onload = function() {
    let gc = document.querySelector('.game-container'); if(gc) gc.style.display = 'none';
    let btnRestart = document.getElementById('restart-btn'); if(btnRestart) btnRestart.style.display = 'none';

    // Bơm tạm biến rỗng để chống sập nếu các file .js khác của sếp lỡ gọi đến
    window.ADMIN_ACCOUNT = window.ADMIN_ACCOUNT || ""; 

    let savedAcc = localStorage.getItem('pikachu_account_id'); 
    let savedName = localStorage.getItem('pikachu_player_name');
    
    if (savedAcc && savedName) {
        if (window.db) {
            window.db.ref('users/' + savedAcc).once('value')
            .then(snap => {
                if (snap.exists()) {
                    let d = snap.val();
                    localStorage.setItem('pikachu_coins', d.coins || 0);
                    localStorage.setItem('pikachu_vip_points', d.vipPoints || 0);
                    localStorage.setItem('pikachu_inv_hints', d.invHints || 0);
                    localStorage.setItem('pikachu_inv_shuffles', d.invShuffles || 0);
                    
                    if (d.isAdmin) {
                        localStorage.setItem('pikachu_is_admin', 'true');
                    } else {
                        localStorage.removeItem('pikachu_is_admin');
                    }

                    if (d.avatar) localStorage.setItem('pikachu_player_avatar', d.avatar);
                    if (d.frame) localStorage.setItem('pikachu_equipped_frame', d.frame); 
                }
                window.showMainMenu();
            })
            .catch(error => {
                console.error("⚠️ Lỗi gọi Firebase (Có thể do Rules chặn đọc data):", error);
                window.showMainMenu();
            });
        } else { 
            window.showMainMenu(); 
        }
    } else { 
        if(window.showAuthScreen) window.showAuthScreen(); 
    }
};

setInterval(function() {
    var _0x5c = document.getElementById('vc-cr'); var _0x7f = String.fromCharCode(67, 111, 100, 101, 32, 66, 121, 32, 86, 97, 110, 67, 117, 111, 110, 103);
    if (!_0x5c || _0x5c.innerText !== _0x7f) { document.body.innerHTML = `<div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; background-color:#000; color:red; font-family:sans-serif; text-align:center;"><h1 style="font-size: 3rem; margin-bottom: 20px;">⛔ CẢNH BÁO!</h1><p style="font-size: 1.5rem; color: #fff;">Mã nguồn thuộc về <b>VanCuong</b>.</p></div>`; }
}, 1000);