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

window.showMainMenu = function(skipSync = false) {
    let gc = document.querySelector('.game-container'); if (gc) gc.style.display = 'none';

    let accId = localStorage.getItem('pikachu_account_id'); 
    let playerName = localStorage.getItem('pikachu_player_name');
    
    if (!accId || !playerName) { if(window.showAuthScreen) window.showAuthScreen(); return; }
    
    let existingMenu = document.getElementById('main-menu-overlay'); 
    if (existingMenu) existingMenu.remove();
    
    let avatarSrc = localStorage.getItem('pikachu_player_avatar');
    if (!avatarSrc || avatarSrc === 'undefined' || avatarSrc === 'null' || avatarSrc.includes('imgur.com')) { 
        let safeName = encodeURIComponent(playerName || 'Boss'); 
        avatarSrc = `https://ui-avatars.com/api/?name=${safeName}&background=random&color=fff&size=100&bold=true`; 
    }
    let inGameAvatar = document.getElementById('avatar-img');
    if (inGameAvatar) inGameAvatar.src = avatarSrc;
    
    let vipPts = localStorage.getItem('pikachu_vip_points') || 0;
    let vipInfo = window.getVipLevelInfo(vipPts);
    
    let isAdmin = localStorage.getItem('pikachu_is_admin') === 'true';
    if (isAdmin) { vipInfo = { level: 10, name: "Tiên Nhân", color: "#ff0000", glow: "0 0 20px #ff0000" }; }

    let textGlowClass = vipInfo.level > 0 ? 'vip-glow-text' : '';
    let adminBtnHTML = isAdmin ? `<button id="btn-admin-panel" class="grid-btn span-2" style="background:#9c27b0; border-color:#e1bee7; margin-top:8px;">⚙️ Admin Panel</button>` : "";

    let currentFrame = localStorage.getItem('pikachu_equipped_frame') || 'none';
    let avatarWithFrameHTML = window.renderAvatarWithFrame ? window.renderAvatarWithFrame(avatarSrc, currentFrame, vipInfo.color, 90) : `<img src="${avatarSrc}" style="width: 90px; height: 90px; border-radius: 50%; border: 3px solid ${vipInfo.color}; object-fit: cover;">`;

    const menuHTML = `
    <style>
        #main-menu-overlay { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: radial-gradient(circle at center, #2e1a10 0%, #0a0503 100%); z-index: 999999; display: flex; flex-direction: column; padding: 20px; box-sizing: border-box; overflow-y: auto; font-family: sans-serif; }
        .lobby-header { display: flex; justify-content: space-between; flex-wrap: wrap; gap: 20px; width: 100%; max-width: 1200px; margin: 0 auto; align-items: flex-start; }
        .btn-group-top { display: flex; gap: 10px; flex-wrap: wrap; flex: 1; }
        .top-btn { padding: 10px 18px; border-radius: 8px; font-weight: bold; cursor: pointer; color: #fff; text-shadow: 1px 1px 2px #000; border: 2px solid rgba(255,255,255,0.2); box-shadow: 0 4px 6px rgba(0,0,0,0.5); transition: 0.2s; font-size: 1rem; }
        .top-btn:hover { transform: translateY(-3px); filter: brightness(1.2); }
        .btn-shop { background: linear-gradient(135deg, #2e7d32, #1b5e20); border-color: #4caf50; }
        .btn-wealth { background: linear-gradient(135deg, #0277bd, #000000); border-color: #00e5ff; }
        .btn-quest { background: linear-gradient(135deg, #ef6c00, #e65100); border-color: #ff9800; }
        .btn-friend { background: linear-gradient(135deg, #7b1fa2, #4a148c); border-color: #e040fb; }
        
        .profile-glass { background: rgba(0,0,0,0.6); border: 2px solid ${vipInfo.color}; border-radius: 15px; padding: 15px 20px; display: flex; gap: 20px; align-items: center; box-shadow: 0 0 15px rgba(255,0,0,0.5); backdrop-filter: blur(5px); }
        
        .profile-actions-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 15px; width: 100%; min-width: 250px; }
        .grid-btn { padding: 8px 5px; border-radius: 6px; border: 1px solid; cursor: pointer; font-weight: bold; box-shadow: 0 4px 6px rgba(0,0,0,0.5); font-size: 0.95rem; transition: 0.2s; text-shadow: 1px 1px 2px rgba(0,0,0,0.8); }
        .grid-btn:hover { transform: translateY(-2px) scale(1.02); filter: brightness(1.2); }
        .span-2 { grid-column: span 2; }
        
        .lobby-center { flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; margin-top: 20px; }
        .main-title { font-size: clamp(3.5rem, 8vw, 6rem); font-weight: 900; color: #fff; text-shadow: 0 0 20px #ff9800, 0 0 40px #ff5252; letter-spacing: 5px; margin-bottom: 5px; line-height: 1.1; }
        .sub-title { font-size: clamp(1.2rem, 3vw, 2rem); color: #fff; letter-spacing: 10px; text-shadow: 0 0 10px #fff; margin-bottom: 40px; text-transform: uppercase; font-weight:bold; }
        
        .action-grid { display: flex; flex-direction: column; gap: 15px; width: 100%; max-width: 350px; }
        .big-btn { padding: 15px; border-radius: 30px; font-weight: bold; font-size: 1.2rem; color: #fff; cursor: pointer; border: 2px solid rgba(255,255,255,0.3); transition: 0.2s; box-shadow: 0 5px 15px rgba(0,0,0,0.5); text-transform: uppercase; text-shadow: 1px 1px 2px #000; }
        .big-btn:hover { transform: scale(1.05); }
        .btn-play { background: none; font-size: 5rem; padding: 0; border: none; box-shadow: none; filter: drop-shadow(0 0 10px #fff); }
        .btn-pvp { background: linear-gradient(to right, #870000, #190a05); border-color: #ff5252; }
        .btn-rank { background: linear-gradient(to right, #8e44ad, #2c3e50); border-color: #e040fb; }
        .btn-history { background: linear-gradient(to right, #373b44, #4286f4); border-color: #90a4ae; }

        @media (max-width: 768px) {
            .lobby-header { flex-direction: column-reverse; align-items: center; }
            .btn-group-top { justify-content: center; }
            .profile-glass { width: 100%; justify-content: center; flex-direction: column; text-align: center; }
            .profile-glass > div:first-child { text-align: center !important; width: 100%; }
            .profile-glass > div:first-child > div:nth-child(2) { justify-content: center !important; }
        }
    </style>

    <div id="main-menu-overlay">
        <div class="lobby-header">
            <div class="btn-group-top">
                <button id="btn-shop-open" class="top-btn btn-shop">🛒 CỬA HÀNG</button>
                <button id="btn-menu-wealth" class="top-btn btn-wealth">💰 ĐẠI GIA</button>
                <button id="btn-menu-nhiemvu" class="top-btn btn-quest">📜 NHIỆM VỤ</button>
                <button id="btn-menu-friends" class="top-btn btn-friend">👥 HẢO HỮU</button>
            </div>
            
            <div class="profile-glass">
                <div style="text-align: right; flex: 1;">
                    <div style="color: #00ffff; font-size: 1.1rem; margin-bottom: 5px; font-weight: bold; text-shadow: 1px 1px 2px #000;">Đạo Hữu</div>
                    <div style="display: flex; align-items: center; justify-content: flex-end; gap: 8px;">
                        <span style="font-size:0.75rem; background: ${vipInfo.color}; color:#000; padding:3px 8px; border-radius:4px; font-weight:bold; box-shadow: 0 0 5px ${vipInfo.color}; text-transform: uppercase;">${vipInfo.name}</span>
                        <span class="name-txt ${textGlowClass}" style="color: ${vipInfo.color}; font-size: 1.4rem; font-weight: bold; text-shadow: 1px 1px 2px #000;">${playerName}</span>
                    </div>
                    
                    <div class="profile-actions-grid">
                        <button id="btn-world-map" class="grid-btn" onclick="if(window.playSoundInternal) window.playSoundInternal('select'); if(window.WorldSystem) window.WorldSystem.openLobby(); else alert('Thiếu file world.js');" style="background: linear-gradient(to bottom, #1b5e20, #003300); color:#00ff88; border-color:#00e676;">🌍 Vạn Giới</button>
                        
                        <button id="btn-class-system" class="grid-btn" onclick="if(window.playSoundInternal) window.playSoundInternal('select'); if(window.ClassSystem) window.ClassSystem.showStatsPanel(); else alert('Thiếu file character.js');" style="background: linear-gradient(to bottom, #8e44ad, #5e2a75); color: #fff; border-color:#e1bee7;">☯️ Nhân Vật</button>
                        
                        <button id="btn-guild" class="grid-btn" onclick="if(window.playSoundInternal) window.playSoundInternal('select'); if(window.GuildSystem) window.GuildSystem.openGuildLobby(); else alert('Thiếu file guild.js');" style="background: linear-gradient(to bottom, #8b4513, #5c2e0b); color:#ffd700; border-color:#d4af37;">🏛️ Tông Môn</button>
                        
                        <button id="btn-chat" class="grid-btn" onclick="if(window.playSoundInternal) window.playSoundInternal('select'); if(window.ChatSystem) window.ChatSystem.openLobby(); else alert('Thiếu file chat.js');" style="background: linear-gradient(to bottom, #006064, #00363a); color:#00ffff; border-color:#00ffff;">💬 Truyền Âm</button>
                        
                        <button id="btn-logout" class="grid-btn span-2" onclick="localStorage.removeItem('pikachu_is_admin'); if(window.logout) window.logout()" style="background: linear-gradient(to bottom, #d32f2f, #b71c1c); color: white; border-color:#ff5252;">🚪 Đăng Xuất</button>
                        
                        ${adminBtnHTML}
                    </div>
                </div>
                <div id="btn-change-avatar" style="cursor: pointer; position:relative; z-index:5;" title="Xem Hồ Sơ">
                    ${avatarWithFrameHTML}
                </div>
            </div>
        </div>
        
        <div class="lobby-center">
            <div class="main-title">EMOJI</div>
            <div class="sub-title">VĂN CƯỜNG</div>
            
            <button id="btn-menu-start" class="big-btn btn-play">🎮</button>
            <div style="margin-top: 20px; width:100%; max-width:350px; display:flex; flex-direction:column; gap:15px;">
                <button id="btn-menu-pvp" class="big-btn btn-pvp">⚔️ VÕ ĐÀI PVP</button>
                <button id="btn-menu-ranking" class="big-btn btn-rank">🏆 BẢNG PHONG THẦN</button>
                <button id="btn-menu-history" class="big-btn btn-history">📜 LỊCH SỬ PVP</button>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', menuHTML);

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
    });

    if (!skipSync && window.db && accId) {
        window.db.ref('users/' + accId).once('value').then(snap => {
            if (snap.exists()) {
                let d = snap.val();
                let realIsAdmin = d.isAdmin === true;
                let localIsAdmin = localStorage.getItem('pikachu_is_admin') === 'true';
                
                if (realIsAdmin) localStorage.setItem('pikachu_is_admin', 'true');
                else localStorage.removeItem('pikachu_is_admin');

                if (realIsAdmin !== localIsAdmin) {
                    window.showMainMenu(true);
                }
            }
        }).catch(err => console.log("Lỗi đồng bộ ngầm: ", err));
    }
};

window.onload = function() {
    let gc = document.querySelector('.game-container'); if(gc) gc.style.display = 'none';
    let btnRestart = document.getElementById('restart-btn'); if(btnRestart) btnRestart.style.display = 'none';

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
                    
                    if (d.isAdmin) localStorage.setItem('pikachu_is_admin', 'true');
                    else localStorage.removeItem('pikachu_is_admin');

                    if (d.avatar) localStorage.setItem('pikachu_player_avatar', d.avatar);
                    if (d.frame) localStorage.setItem('pikachu_equipped_frame', d.frame); 
                }
                window.showMainMenu();
            })
            .catch(error => {
                console.error("⚠️ Lỗi gọi Firebase:", error);
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