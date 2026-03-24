// ========================================================
// PHẦN 1: CẤU HÌNH ADMIN VIP & FIREBASE ONLINE
// ========================================================
const ADMIN_ACCOUNT = "vancuong140904";
const ADMIN_PASSWORD = "Thom270801!";

const firebaseConfig = {
    apiKey: "AIzaSyBrbaiECPkErRotePLyNop594s-em6WO_c",
    authDomain: "pikachu-vancuong-6d602.firebaseapp.com",
    databaseURL: "https://pikachu-vancuong-6d602-default-rtdb.firebaseio.com",
    projectId: "pikachu-vancuong-6d602",
    storageBucket: "pikachu-vancuong-6d602.firebasestorage.app",
    messagingSenderId: "452927813810",
    appId: "1:452927813810:web:9ef3a40c37f022f094b1ab"
};

let db = null;
try {
    if (typeof window.firebase !== 'undefined') {
        if (!window.firebase.apps.length) window.firebase.initializeApp(firebaseConfig);
        db = window.firebase.database();
    } else {
        console.warn("⚠️ Firebase bị chặn hoặc tải chậm. Game sẽ chạy chế độ Offline.");
    }
} catch(e) { console.error("❌ Lỗi hệ thống Firebase:", e); }

// Nạp hiệu ứng nhấp nháy Glow cho VIP Tu Tiên (Chỉ chèn keyframe cần thiết)
if (!document.getElementById('vip-glow-styles')) {
    const style = document.createElement('style');
    style.id = 'vip-glow-styles';
    style.innerHTML = `
        @keyframes vip-glow-anim { 0% { box-shadow: 0 0 5px var(--vip-color), inset 0 0 5px var(--vip-color); } 100% { box-shadow: 0 0 20px var(--vip-color), 0 0 35px var(--vip-color), inset 0 0 15px var(--vip-color); } }
        @keyframes vip-text-anim { 0% { text-shadow: 0 0 5px var(--vip-color); opacity: 0.8; } 100% { text-shadow: 0 0 20px var(--vip-color), 0 0 30px #fff; opacity: 1; filter: brightness(1.2); } }
        .vip-glow-frame { animation: vip-glow-anim 0.8s alternate infinite ease-in-out; }
        .vip-glow-text { animation: vip-text-anim 0.8s alternate infinite ease-in-out; }
    `;
    document.head.appendChild(style);
}

// ========================================================
// PHẦN 1.5: HỆ THỐNG AUTH, AVATAR & CẢNH GIỚI TU TIÊN
// ========================================================
let isLoginMode = true;
window.gameStateGlobal = { isMuted: false };

function playSoundGlobal(type) { if (window.playSoundInternal) window.playSoundInternal(type); }
function showCustomAlertGlobal(message, callback) {
    if (window.showCustomAlertInternal) window.showCustomAlertInternal(message, callback);
    else { alert(message); if (callback) callback(); }
}

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

window.resizeAndSaveAvatar = function(file) {
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_SIZE = 80; 
            let width = img.width; let height = img.height;
            let minDim = Math.min(width, height);
            let sx = (width - minDim) / 2; let sy = (height - minDim) / 2;
            
            canvas.width = MAX_SIZE; canvas.height = MAX_SIZE;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, sx, sy, minDim, minDim, 0, 0, MAX_SIZE, MAX_SIZE);
            const base64Avatar = canvas.toDataURL('image/jpeg', 0.8);
            
            localStorage.setItem('pikachu_player_avatar', base64Avatar);
            let accId = localStorage.getItem('pikachu_account_id');
            if (db && accId) db.ref('users/' + accId).update({ avatar: base64Avatar });
            
            document.querySelectorAll('.player-avatar-img').forEach(el => el.src = base64Avatar);
            showCustomAlertGlobal("✅ Đổi Avatar thành công!");
        };
        img.src = e.target.result;
    };
    reader.readAsDataURL(file);
};

// --- AUTH UI ---
function showAuthScreen() {
    let authOverlay = document.getElementById('auth-overlay'); if (authOverlay) authOverlay.classList.remove('hidden');
    let nameEl = document.getElementById('auth-name'); let passEl = document.getElementById('auth-pass'); let dNameEl = document.getElementById('auth-display-name');
    if(nameEl) nameEl.value = ''; if(passEl) passEl.value = ''; if(dNameEl) dNameEl.style.display = 'none';
}

function toggleAuthMode() {
    playSoundGlobal('select'); isLoginMode = !isLoginMode;
    let title = document.getElementById('auth-title'); let desc = document.getElementById('auth-desc');
    let btn = document.getElementById('auth-action-btn'); let switchText = document.getElementById('auth-switch-text');
    let switchBtn = document.getElementById('auth-switch-btn'); let displayNameInput = document.getElementById('auth-display-name');

    if (isLoginMode) {
        if(title) title.innerText = "ĐĂNG NHẬP"; if(desc) desc.innerText = "Chào mừng trở lại! Vui lòng đăng nhập.";
        if(btn) btn.innerText = "ĐĂNG NHẬP"; if(switchText) switchText.innerText = "Chưa có tài khoản?";
        if(switchBtn) switchBtn.innerText = "Đăng ký ngay";
    } else {
        if(title) title.innerText = "ĐĂNG KÝ MỚI"; if(desc) desc.innerText = "Chỉ cần nhập Tài khoản và Mật khẩu!";
        if(btn) btn.innerText = "TẠO TÀI KHOẢN"; if(switchText) switchText.innerText = "Đã có tài khoản?";
        if(switchBtn) switchBtn.innerText = "Đăng nhập ngay";
    }
    if(displayNameInput) displayNameInput.style.display = 'none'; 
}

function handleAuth() {
    try {
        playSoundGlobal('select');
        let nameEl = document.getElementById('auth-name'); let passEl = document.getElementById('auth-pass');
        const accInput = nameEl ? nameEl.value.trim() : ''; const passInput = passEl ? passEl.value.trim() : '';
        if (!accInput || !passInput) { showCustomAlertGlobal("Vui lòng nhập đầy đủ Tài khoản và Mật khẩu!"); return; }
        const safeAccKey = accInput.toLowerCase().replace(/[.#$\[\]]/g, "");

        if (safeAccKey === ADMIN_ACCOUNT.toLowerCase()) {
            if (isLoginMode) {
                if (passInput === ADMIN_PASSWORD) { proceedToMainMenu(ADMIN_ACCOUNT, "Boss Văn Cường"); return; } 
                else { showCustomAlertGlobal("❌ SAI MẬT KHẨU ADMIN!"); return; }
            } else { showCustomAlertGlobal("❌ Tài khoản này được hệ thống bảo vệ, không được phép đăng ký!"); return; }
        }

        if (!db) {
            showCustomAlertGlobal("⚠️ Mất kết nối mạng! Chuyển sang chế độ Offline.");
            if (isLoginMode) {
                let savedName = localStorage.getItem('pikachu_player_name'); let savedAcc = localStorage.getItem('pikachu_account_id');
                if (savedName && savedAcc === safeAccKey) proceedToMainMenu(safeAccKey, savedName);
                else showCharacterNamePrompt(safeAccKey, ""); 
            } else { showCustomAlertGlobal("✅ Đăng ký offline thành công!", () => { toggleAuthMode(); }); }
            return;
        }

        let btn = document.getElementById('auth-action-btn'); let oldText = btn ? btn.innerText : "ĐĂNG NHẬP";
        if (btn) { btn.innerText = "⏳ ĐANG XỬ LÝ..."; btn.disabled = true; }

        db.ref('users/' + safeAccKey).once('value').then((snapshot) => {
            if(btn) { btn.innerText = oldText; btn.disabled = false; }
            if (isLoginMode) {
                if (snapshot.exists()) {
                    let userData = snapshot.val();
                    if (userData.password === passInput) {
                        let existingName = userData.displayName || ""; 
                        if (userData.avatar) localStorage.setItem('pikachu_player_avatar', userData.avatar);
                        else localStorage.removeItem('pikachu_player_avatar');

                        localStorage.setItem('pikachu_coins', userData.coins || 0);
                        localStorage.setItem('pikachu_vip_points', userData.vipPoints || 0);
                        localStorage.setItem('pikachu_inv_hints', userData.invHints || 0);
                        localStorage.setItem('pikachu_inv_shuffles', userData.invShuffles || 0);

                        if (existingName !== "") proceedToMainMenu(safeAccKey, existingName);
                        else showCharacterNamePrompt(safeAccKey, ""); 
                    } else { showCustomAlertGlobal("❌ SAI MẬT KHẨU!"); }
                } else { showCustomAlertGlobal("❌ TÀI KHOẢN KHÔNG TỒN TẠI!\nVui lòng bấm 'Đăng ký ngay' ở bên dưới."); }
            } else {
                if (snapshot.exists()) { showCustomAlertGlobal("❌ TÀI KHOẢN NÀY ĐÃ TỒN TẠI!\nVui lòng chọn ID tài khoản khác."); } 
                else {
                    db.ref('users/' + safeAccKey).set({ password: passInput, coins: 0, vipPoints: 0, createdAt: window.firebase.database.ServerValue.TIMESTAMP }).then(() => {
                        showCustomAlertGlobal(`✅ ĐĂNG KÝ THÀNH CÔNG!\nVui lòng Đăng nhập để tạo nhân vật.`, () => { toggleAuthMode(); if(passEl) passEl.value = ''; });
                    }).catch(err => { showCustomAlertGlobal("Lỗi đăng ký: " + err.message); });
                }
            }
        }).catch(err => { if(btn) { btn.innerText = oldText; btn.disabled = false; } showCustomAlertGlobal("Lỗi kết nối Firebase: " + err.message); });
    } catch (error) { console.error(error); alert("Lỗi hệ thống đăng nhập: " + error.message); }
}

function createNamePromptUI() {
    if (document.getElementById('char-name-overlay')) return;
    const nameHTML = `
    <div id="char-name-overlay" class="modal-overlay hidden" style="z-index: 10000000; backdrop-filter: blur(8px);">
        <div class="modal-content">
            <h2 style="color: #ffd700;">TẠO NHÂN VẬT</h2>
            <p>Vui lòng nhập tên hiển thị trên Bảng Xếp Hạng!</p>
            <input type="text" id="char-name-input" placeholder="Ví dụ: Cường Đẹp Trai" autocomplete="off">
            <button id="confirm-name-btn">VÀO TRÒ CHƠI</button>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', nameHTML);
}

function showCharacterNamePrompt(accId, currentName) {
    let authOverlay = document.getElementById('auth-overlay'); if (authOverlay) authOverlay.classList.add('hidden'); 
    createNamePromptUI();
    let nameOverlay = document.getElementById('char-name-overlay'); let nameInput = document.getElementById('char-name-input');
    nameOverlay.dataset.accId = accId; nameInput.value = currentName; 
    nameOverlay.classList.remove('hidden'); nameInput.focus();
}

function handleConfirmName() {
    playSoundGlobal('select');
    let nameOverlay = document.getElementById('char-name-overlay'); let nameInput = document.getElementById('char-name-input');
    let newName = nameInput.value.trim(); let accId = nameOverlay.dataset.accId;
    if (!newName) { showCustomAlertGlobal("Đại hiệp chưa nhập tên nhân vật!"); return; }

    if (db) {
        db.ref('users/' + accId).update({ displayName: newName }).then(() => {
            nameOverlay.classList.add('hidden'); proceedToMainMenu(accId, newName);
        }).catch(err => { showCustomAlertGlobal("Lỗi lưu tên: " + err.message); });
    } else { nameOverlay.classList.add('hidden'); proceedToMainMenu(accId, newName); }
}

function proceedToMainMenu(accId, displayName) {
    localStorage.setItem('pikachu_account_id', accId); localStorage.setItem('pikachu_player_name', displayName);
    let authOverlay = document.getElementById('auth-overlay'); if (authOverlay) authOverlay.classList.add('hidden'); 
    
    // Đã gỡ bỏ lệnh chặn Admin, bắt buộc mọi tài khoản đều phải kéo dữ liệu từ Firebase về
    if (db) { 
        db.ref('users/' + accId).once('value').then(snapshot => {
            if(snapshot.exists()) {
                let d = snapshot.val();
                localStorage.setItem('pikachu_coins', d.coins || 0);
                localStorage.setItem('pikachu_vip_points', d.vipPoints || 0);
                localStorage.setItem('pikachu_inv_hints', d.invHints || 0);
                localStorage.setItem('pikachu_inv_shuffles', d.invShuffles || 0);
                // BỔ SUNG LỆNH LẤY AVATAR TỪ SERVER VỀ MÁY LÚC ĐĂNG NHẬP
                if (d.avatar) localStorage.setItem('pikachu_player_avatar', d.avatar); 
            }
            showMainMenu();
        });
    } else { showMainMenu(); }
}

function logout() {
    playSoundGlobal('select');
    localStorage.removeItem('pikachu_account_id'); localStorage.removeItem('pikachu_player_name'); localStorage.removeItem('pikachu_player_avatar');
    localStorage.removeItem('pikachu_coins'); localStorage.removeItem('pikachu_vip_points');
    let mainMenu = document.getElementById('main-menu-overlay'); if(mainMenu) mainMenu.remove(); 
    showAuthScreen(); 
}

// ==== THIẾT KẾ LẠI GIAO DIỆN CHÍNH THÀNH FLEXBOX GỌN GÀNG ====
function showMainMenu() {
    // Ẩn bảng Game đi để hiện Menu
    let gc = document.querySelector('.game-container');
    if (gc) gc.style.display = 'none';

    let accId = localStorage.getItem('pikachu_account_id'); let playerName = localStorage.getItem('pikachu_player_name');
    if (!accId || !playerName) { showAuthScreen(); return; }
    let existingMenu = document.getElementById('main-menu-overlay'); if (existingMenu) existingMenu.remove();
    
    // --- KHÁNG CÁC LINK IMGUR BỊ LỖI TỪ FIREBASE CŨ ---
    let avatarSrc = localStorage.getItem('pikachu_player_avatar');
    if (!avatarSrc || avatarSrc.includes('imgur.com')) {
        let safeName = encodeURIComponent(playerName || 'Boss');
        avatarSrc = `https://ui-avatars.com/api/?name=${safeName}&background=random&color=fff&size=100&bold=true`;
    }
    let vipPts = localStorage.getItem('pikachu_vip_points') || 0;
    
    let vipInfo = window.getVipLevelInfo(vipPts);
    if (accId === ADMIN_ACCOUNT.toLowerCase()) { vipInfo = { level: 10, name: "Tiên Nhân", color: "#ff0000", glow: "0 0 20px #ff0000" }; }

    let glowClass = vipInfo.level > 0 ? 'vip-glow-frame' : '';
    let textGlowClass = vipInfo.level > 0 ? 'vip-glow-text' : '';

    let adminBtnHTML = "";
    if (accId === ADMIN_ACCOUNT.toLowerCase()) {
        adminBtnHTML = `<button id="btn-admin-panel" style="background: #9c27b0; border: 1px solid #e1bee7; color: #fff; font-size: 0.8rem; padding: 5px 8px; border-radius: 5px; cursor: pointer; margin-top: 5px; width: 100%;">⚙️ Admin Panel</button>`;
    }

    const menuHTML = `
    <div id="main-menu-overlay" style="z-index: 999999; background: radial-gradient(circle, #8b5a2b, #3e2723); display: flex; flex-direction: column; align-items: center; position: fixed; top: 0; left: 0; width: 100vw; height: 100dvh; box-sizing: border-box; overflow-y: auto; padding: 20px;">
        
        <div style="display: flex; width: 100%; max-width: 1200px; justify-content: space-between; align-items: flex-start; flex-wrap: wrap; gap: 15px;">
            <div style="display: flex; gap: 10px; flex-wrap: wrap; z-index: 10;">
                <button id="btn-shop-open" style="background: linear-gradient(to bottom, #4caf50, #2e7d32); border: 3px solid #69f0ae; color: #fff; font-weight: bold; padding: 12px 25px; border-radius: 12px; cursor: pointer; font-size: 1.1rem; box-shadow: 0 0 15px rgba(76, 175, 80, 0.8);">🛒 CỬA HÀNG</button>
                <button id="btn-menu-wealth" style="background: linear-gradient(to bottom, #1a237e, #000000); border: 3px solid #00ffff; color: #00ffff; font-weight: bold; padding: 12px 25px; border-radius: 12px; cursor: pointer; font-size: 1.1rem; box-shadow: 0 0 15px rgba(0,255,255,0.6);">💰 ĐẠI GIA</button>
                <button id="btn-menu-chat" style="background: linear-gradient(to bottom, #e65100, #ef6c00); border: 3px solid #ffb74d; color: #fff; font-weight: bold; padding: 12px 25px; border-radius: 12px; cursor: pointer; font-size: 1.1rem; box-shadow: 0 0 15px rgba(230, 81, 0, 0.6);">💬 KÊNH CHAT</button>
                </div>

            <div class="${glowClass}" style="background: rgba(0,0,0,0.6); padding: 10px 15px; border-radius: 15px; border: 2px solid ${vipInfo.color}; display: flex; align-items: center; gap: 15px; box-shadow: ${vipInfo.glow}; --vip-color: ${vipInfo.color}; z-index: 10;">
                <div style="text-align: right; display: flex; flex-direction: column; align-items: flex-end;">
                    <div style="color: #00ffff; font-size: 0.9rem; margin-bottom: 3px;">ID: ${accId}</div>
                    <div class="${textGlowClass}" style="color: ${vipInfo.color}; font-size: 1.3rem; margin-bottom: 8px; font-weight: bold; font-family: 'Times New Roman', serif; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${playerName}</div>
                    <div style="display: flex; gap: 5px; justify-content: flex-end; align-items: center;">
                        <span style="font-size:0.75rem; background: ${vipInfo.color}; color:#000; padding:2px 6px; border-radius:4px; font-weight:bold; box-shadow: 0 0 5px ${vipInfo.color}; white-space: nowrap;">${vipInfo.name}</span>
                        <button id="btn-logout" style="background: #d32f2f; color: white; border: 1px solid #fff; padding: 3px 10px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.8rem;">Thoát</button>
                    </div>
                    ${adminBtnHTML}
                </div>
                <div style="position: relative;" id="btn-change-avatar-wrap">
                    <img src="${avatarSrc}" class="player-avatar-img ${glowClass}" id="btn-change-avatar" style="width: 60px; height: 60px; border-radius: 50%; border: 3px solid ${vipInfo.color}; cursor: pointer; object-fit: cover; --vip-color: ${vipInfo.color};" title="Bấm để đổi Avatar">
                    <div style="position: absolute; bottom: -5px; right: -5px; background: #00ffff; border-radius: 50%; width: 25px; height: 25px; display: flex; justify-content: center; align-items: center; font-size: 12px; border: 2px solid #000; pointer-events: none; box-shadow: 0 0 5px #000;">📷</div>
                </div>
            </div>
        </div>

        <div style="flex: 1; display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; padding-bottom: 20px; margin-top: 20px;">
            <div style="text-align: center; margin-bottom: 20px;">
                <div style="font-size: clamp(3rem, 8vw, 5rem); font-weight: bold; text-shadow: 5px 5px 0 #000; margin-bottom: 20px; letter-spacing: 5px; line-height: 1.1;">
                    <span style="color: #ffd700;">E</span><span style="color: #ffa500;">M</span><span style="color: #ffd700;">O</span><span style="color: #ffa500;">J</span><span style="color: #ffd700;">I</span>
                    <br><span style="font-size: clamp(1.5rem, 4vw, 2rem); color: #fff; text-shadow: 2px 2px 0 #000;">VĂN CƯỜNG</span>
                </div>
                <div style="animation: bounce 2s infinite;"><span style="font-size: clamp(4rem, 10vw, 8rem);">🎮</span></div>
            </div>

            
            <div style="display: flex; flex-direction: column; align-items: center; gap: 15px; width: 100%; max-width: 350px;">
                <button id="btn-menu-start" style="background: radial-gradient(circle, #ffd700, #ff8c00); border: 4px solid #fff; color: #000; font-weight: bold; padding: 20px 40px; border-radius: 50px; cursor: pointer; font-size: clamp(1.5rem, 5vw, 2.5rem); box-shadow: 0 10px 20px rgba(0,0,0,0.6); transition: transform 0.1s; text-shadow: 2px 2px 0 #fff; width: 100%;">CHƠI</button>
                <button id="btn-menu-pvp" class="pvp-btn">⚔️ VÕ ĐÀI PvP</button>
                <button id="btn-menu-ranking" style="background: linear-gradient(to bottom, #8b4513, #5c2e0b); border: 3px solid #d4af37; color: #ffd700; font-weight: bold; padding: 15px 40px; border-radius: 12px; cursor: pointer; font-size: clamp(1.2rem, 3vw, 1.5rem); box-shadow: 0 6px 10px rgba(0,0,0,0.5); transition: transform 0.1s; width: 100%;">🏆 BẢNG PHONG THẦN</button>
            </div>
        </div>
    </div>`;
    document.body.insertAdjacentHTML('beforeend', menuHTML);

    document.getElementById('btn-logout').addEventListener('click', logout);
    document.getElementById('btn-menu-ranking').addEventListener('click', () => { playSoundGlobal('select'); if(window.showLeaderboardInternal) window.showLeaderboardInternal(); });
    document.getElementById('btn-menu-start').addEventListener('click', () => { playSoundGlobal('select'); let diffModal = document.getElementById('difficulty-modal'); if (diffModal) diffModal.classList.remove('hidden'); });
    document.getElementById('btn-shop-open').addEventListener('click', () => { if(window.openShopPanel) window.openShopPanel(); else showCustomAlertGlobal("Lỗi Cửa hàng!"); });
    
    let btnWealth = document.getElementById('btn-menu-wealth');
    if(btnWealth) btnWealth.addEventListener('click', () => { playSoundGlobal('select'); if(window.showWealthLeaderboard) window.showWealthLeaderboard(); else showCustomAlertGlobal("Thiếu file daigia.js!"); });

    let btnAdmin = document.getElementById('btn-admin-panel');
    if (btnAdmin) btnAdmin.addEventListener('click', () => { playSoundGlobal('select'); if (window.openAdminPanel) window.openAdminPanel(); });
}

document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'auth-action-btn') { e.preventDefault(); handleAuth(); }
    if (e.target && e.target.id === 'auth-switch-btn') { e.preventDefault(); toggleAuthMode(); }
    if (e.target && e.target.id === 'confirm-name-btn') { e.preventDefault(); handleConfirmName(); }
    if (e.target && (e.target.id === 'btn-change-avatar' || e.target.closest('#btn-change-avatar-wrap'))) {
        playSoundGlobal('select'); 
        if (window.PlayerProfile) window.PlayerProfile.open(); // Gọi mở Hồ Sơ thay vì mở File
    }
    // Kích hoạt nút Kênh Chat
    let btnChat = document.getElementById('btn-menu-chat');
    if(btnChat) btnChat.addEventListener('click', () => { 
        playSoundGlobal('select'); 
        if(window.ChatSystem) window.ChatSystem.openLobby(); 
        else showCustomAlertGlobal("Chưa tải được hệ thống Chat!"); 
    });

    // Kích hoạt nút Hảo Hữu
    let btnFriends = document.getElementById('btn-menu-friends');
    if(btnFriends) btnFriends.addEventListener('click', () => { 
        playSoundGlobal('select'); 
        if(window.FriendSystem) window.FriendSystem.openLobby(); 
        else showCustomAlertGlobal("Chưa tải được hệ thống Bạn bè!"); 
    });
});

// ========================================================
// PHẦN 2: LÕI GAME CHÍNH 
// ========================================================
(function() {
    const DIFF_CONFIG = {
        easy: { timeMultiplier: 1.0, emojiCount: 15, tickRate: 1000 },
        medium: { timeMultiplier: 0.75, emojiCount: 22, tickRate: 1000 },
        hard: { timeMultiplier: 0.5, emojiCount: 30, tickRate: 850 }
    };
    const CONFIG = { ROWS: 9, COLS: 16, EMOJIS: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐒','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🦄','🐝','🐛','🦋','🐌'], POINTS_PER_MATCH: 10, INITIAL_SHUFFLES: 5, INITIAL_HINTS: 5 };
    
    const LEVELS = [ 
        { level: 1, time: 600, gravity: 'none' }, 
        { level: 2, time: 560, gravity: 'down' }, 
        { level: 3, time: 520, gravity: 'left' }, 
        { level: 4, time: 480, gravity: 'up' }, 
        { level: 5, time: 440, gravity: 'right' }, 
        { level: 6, time: 400, gravity: 'center' },
        { level: 7, time: 380, gravity: 'split_h' },  
        { level: 8, time: 360, gravity: 'split_v' },  
        { level: 9, time: 340, gravity: 'alt_v' },    
        { level: 10, time: 320, gravity: 'alt_h' }    
    ];

    let gameState = { board: [], selectedTile: null, score: 0, level: 1, timeRemaining: 0, shufflesRemaining: CONFIG.INITIAL_SHUFFLES, hintsRemaining: CONFIG.INITIAL_HINTS, timerInterval: null, isMuted: false, playerName: "", accountId: "", isVip: false, isProcessing: false, hintTimeoutId: null, currentDifficulty: 'easy' };
    window.gameStateGlobal = gameState;
    let highScore = 0; let audioCtx = null;

    window.playSoundInternal = function playSound(type) {
        if (gameState.isMuted) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext; if (!AudioContext) return; 
            if (!audioCtx) audioCtx = new AudioContext(); if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
            const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
            osc.connect(gain); gain.connect(audioCtx.destination); const now = audioCtx.currentTime;
            
            if (type === 'select') { osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1); } 
            else if (type === 'match') { osc.type = 'square'; osc.frequency.setValueAtTime(400, now); osc.frequency.setValueAtTime(800, now + 0.1); gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now + 0.2); osc.start(now); osc.stop(now + 0.2); } 
            else if (type === 'error') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(150, now + 0.2); gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now + 0.2); osc.start(now); osc.stop(now + 0.2); } 
            else if (type === 'win') { osc.type = 'square'; osc.frequency.setValueAtTime(400, now); osc.frequency.setValueAtTime(500, now + 0.1); osc.frequency.setValueAtTime(600, now + 0.2); osc.frequency.setValueAtTime(800, now + 0.3); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.5); osc.start(now); osc.stop(now + 0.5); } 
            else if (type === 'lose') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, now); osc.frequency.linearRampToValueAtTime(100, now + 0.5); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.5); osc.start(now); osc.stop(now + 0.5); }
            setTimeout(() => { try { osc.disconnect(); gain.disconnect(); } catch(e){} }, 1000);
        } catch(err) {}
    };

    function createCustomAlertUI() {
        if (document.getElementById('custom-alert-overlay')) return;
        const alertHTML = `
        <div id="custom-alert-overlay" class="modal-overlay hidden" style="z-index: 9999999999; backdrop-filter: blur(4px);">
            <div class="modal-content" style="max-width: 400px; border: 3px solid #00ffff; box-shadow: 0 0 25px rgba(0, 255, 255, 0.6); padding: 30px;">
                <h2 style="color: #00ffff; margin-bottom: 15px; text-shadow: 0 0 10px #00ffff; font-size: 1.8rem;">THÔNG BÁO</h2>
                <p id="custom-alert-message" style="font-size: 1.2rem; margin-bottom: 25px; color: #fff; white-space: pre-wrap; line-height: 1.4;"></p>
                <button id="custom-alert-btn" style="background: linear-gradient(to bottom, #00ffff, #008888); border: 2px solid #fff; color: #000; font-weight: bold; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 1.2rem; width: 100%; box-shadow: 0 0 10px rgba(0,255,255,0.5);">ĐỒNG Ý</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', alertHTML);
    }

    window.showCustomAlertInternal = function(message, callback) {
        createCustomAlertUI(); 
        const overlay = document.getElementById('custom-alert-overlay'); 
        overlay.style.zIndex = "999999999"; 
        const msgEl = document.getElementById('custom-alert-message'); const btn = document.getElementById('custom-alert-btn');
        msgEl.innerText = message; overlay.classList.remove('hidden'); const newBtn = btn.cloneNode(true); btn.parentNode.replaceChild(newBtn, btn);
        newBtn.addEventListener('click', () => { window.playSoundInternal('select'); overlay.classList.add('hidden'); if (callback) callback(); });
    };

    function createPauseUI() {
        if (document.getElementById('pause-overlay')) return;
        const pauseHTML = `
        <div id="pause-overlay" class="modal-overlay hidden" style="z-index: 999998; backdrop-filter: blur(8px);">
            <div class="modal-content" style="max-width: 400px; border: 3px solid #ffeb3b; box-shadow: 0 0 25px rgba(255, 235, 59, 0.6); padding: 30px; text-align: center;">
                <div style="font-size: 4rem; margin-bottom: 10px; animation: hint-pulse 2s infinite;">⏸️</div>
                <h2 style="color: #ffeb3b; margin-bottom: 15px; text-shadow: 0 0 10px #ffeb3b; font-size: 1.8rem;">ĐÃ TẠM DỪNG</h2>
                <p style="font-size: 1.1rem; margin-bottom: 25px; color: #fff;">Trò chơi đang chờ bạn quay lại!</p>
                <button id="resume-btn" style="background: linear-gradient(to bottom, #ffeb3b, #cddc39); border: 2px solid #fff; color: #000; font-weight: bold; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 1.2rem; width: 100%; box-shadow: 0 0 10px rgba(255,235,59,0.5); margin-bottom: 15px;">TIẾP TỤC CHƠI</button>
                <button id="quit-game-btn" style="background: linear-gradient(to bottom, #f44336, #b71c1c); border: 2px solid #fff; color: #fff; font-weight: bold; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 1.2rem; width: 100%; box-shadow: 0 0 10px rgba(244,67,54,0.5);">🚪 THOÁT VÀ LƯU ĐIỂM</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', pauseHTML);
    }

    function pauseGame() {
        let diffModal = document.getElementById('difficulty-modal'); let customAlert = document.getElementById('custom-alert-overlay'); let leaderboardModal = document.getElementById('leaderboard-overlay'); let mainMenu = document.getElementById('main-menu-overlay'); let authOverlay = document.getElementById('auth-overlay'); let nameOverlay = document.getElementById('char-name-overlay'); let shopOverlay = document.getElementById('shop-overlay'); let wealthOverlay = document.getElementById('wealth-overlay');
        if ((diffModal && !diffModal.classList.contains('hidden')) || (customAlert && !customAlert.classList.contains('hidden')) || (mainMenu && !mainMenu.classList.contains('hidden')) || (authOverlay && !authOverlay.classList.contains('hidden')) || (nameOverlay && !nameOverlay.classList.contains('hidden')) || (shopOverlay && !shopOverlay.classList.contains('hidden')) || (wealthOverlay && !wealthOverlay.classList.contains('hidden')) || (leaderboardModal && !leaderboardModal.classList.contains('hidden'))) return;
        if (gameState.timeRemaining > 0 && gameState.timerInterval) { clearInterval(gameState.timerInterval); gameState.timerInterval = null; document.getElementById('pause-overlay').classList.remove('hidden'); }
    }

    function createLeaderboardUI() {
        if (document.getElementById('leaderboard-overlay')) return;
        const lbHTML = `
        <div id="leaderboard-overlay" class="modal-overlay hidden" style="z-index: 99999999; backdrop-filter: blur(5px);">
            <div class="modal-content" style="max-width: 650px; width: 95%; background: linear-gradient(135deg, #6f4e2a, #4b2e1b); border: 4px solid #d4af37; border-radius: 15px; padding: 20px; box-shadow: 0 0 40px rgba(0,0,0,0.9);">
                <h2 style="color: #ffd700; margin-bottom: 10px; text-shadow: 2px 2px 4px #000; font-size: 1.8rem; text-align: center;">🏆 BẢNG PHONG THẦN</h2>
                <div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 15px;">
                    <button class="lb-tab-btn active" data-diff="easy" style="flex:1; padding: 8px; background: linear-gradient(to bottom, #4CAF50, #2E7D32); border: 2px solid #ffd700; color: #fff; font-weight: bold; border-radius: 8px; cursor: pointer; text-shadow: 1px 1px 2px #000; box-shadow: 0 4px 6px rgba(0,0,0,0.5);">DỄ</button>
                    <button class="lb-tab-btn" data-diff="medium" style="flex:1; padding: 8px; background: #3e2723; border: 2px solid #8b5a2b; color: #fff; font-weight: bold; border-radius: 8px; cursor: pointer; text-shadow: 1px 1px 2px #000; box-shadow: 0 4px 6px rgba(0,0,0,0.5);">T.BÌNH</button>
                    <button class="lb-tab-btn" data-diff="hard" style="flex:1; padding: 8px; background: #3e2723; border: 2px solid #8b5a2b; color: #fff; font-weight: bold; border-radius: 8px; cursor: pointer; text-shadow: 1px 1px 2px #000; box-shadow: 0 4px 6px rgba(0,0,0,0.5);">KHÓ</button>
                </div>
                <div id="leaderboard-list" style="max-height: 350px; min-height: 150px; overflow-y: auto; margin-bottom: 20px; color: white; background: rgba(0,0,0,0.4); border-radius: 10px; padding: 5px; border: 1px solid #8b5a2b;"></div>
                <button id="close-leaderboard-btn" style="background: linear-gradient(to bottom, #d4af37, #aa8000); border: 2px solid #fff; color: #000; font-weight: bold; padding: 10px 20px; border-radius: 8px; cursor: pointer; width: 100%; font-size: 1.1rem;">ĐÓNG</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', lbHTML);
        document.querySelectorAll('.lb-tab-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                window.playSoundInternal('select');
                document.querySelectorAll('.lb-tab-btn').forEach(b => { b.classList.remove('active'); b.style.background = '#3e2723'; b.style.border = '2px solid #8b5a2b'; });
                this.classList.add('active');
                if (this.dataset.diff === 'easy') this.style.background = 'linear-gradient(to bottom, #4CAF50, #2E7D32)';
                if (this.dataset.diff === 'medium') this.style.background = 'linear-gradient(to bottom, #ff9800, #e65100)';
                if (this.dataset.diff === 'hard') this.style.background = 'linear-gradient(to bottom, #f44336, #b71c1c)';
                this.style.border = '2px solid #ffd700'; window.showLeaderboardInternal(); 
            });
        });
    }

    function saveScoreToLeaderboard() {
        if (gameState.score <= 0 || !gameState.playerName || gameState.isVip) return; 
        let avt = localStorage.getItem('pikachu_player_avatar') || '';
        let vp = localStorage.getItem('pikachu_vip_points') || 0;
        let lbOffline = JSON.parse(localStorage.getItem('pikachu_leaderboard_offline')) || [];
        lbOffline.push({ accountId: gameState.accountId, name: gameState.playerName, score: gameState.score, level: gameState.level, diff: gameState.currentDifficulty, avatar: avt, vipPoints: vp });
        lbOffline.sort((a, b) => b.score - a.score); lbOffline = lbOffline.slice(0, 50); 
        localStorage.setItem('pikachu_leaderboard_offline', JSON.stringify(lbOffline));
        
        if (db) {
            try { db.ref('leaderboard').push({ accountId: gameState.accountId, name: gameState.playerName, score: gameState.score, level: gameState.level, diff: gameState.currentDifficulty, avatar: avt, vipPoints: vp, timestamp: window.firebase.database.ServerValue.TIMESTAMP }).catch(() => {}); } catch(e) {}
        }
    }

    window.showLeaderboardInternal = function() {
        if (gameState.timerInterval) { clearInterval(gameState.timerInterval); gameState.timerInterval = null; }
        let pauseOverlay = document.getElementById('pause-overlay'); if (pauseOverlay) pauseOverlay.classList.add('hidden');
        let lbOverlay = document.getElementById('leaderboard-overlay'); if (lbOverlay) lbOverlay.classList.remove('hidden');
        let listEl = document.getElementById('leaderboard-list'); listEl.innerHTML = '<p style="text-align:center; color:#00ffff; font-size:1.2rem; padding: 20px;">Đang tải dữ liệu từ máy chủ ⏳...</p>';
        let activeTab = document.querySelector('.lb-tab-btn.active'); let diffType = activeTab ? activeTab.dataset.diff : 'easy';
        
        if (db) {
            let isLoaded = false;
            let fallbackTimeout = setTimeout(() => {
                if (!isLoaded) { 
                    isLoaded = true; listEl.innerHTML = '<p style="text-align:center; color:#ffeb3b; padding: 10px;">Máy chủ phản hồi chậm. Đang mở Kỷ lục Offline!</p>'; 
                    setTimeout(() => { let offlineData = JSON.parse(localStorage.getItem('pikachu_leaderboard_offline')) || []; processLeaderboardData(offlineData, diffType, listEl); }, 500); 
                }
            }, 4000); 
            
            db.ref('users').once('value').then(userSnap => {
                let userDictByAcc = {};
                let userDictByName = {};
                userSnap.forEach(u => {
                    let d = u.val();
                    let vip = parseInt(d.vipPoints) || 0;
                    userDictByAcc[u.key] = { avatar: d.avatar, vipPoints: vip };
                    if (d.displayName) {
                        userDictByName[d.displayName.trim().toLowerCase()] = { avatar: d.avatar, vipPoints: vip };
                    }
                });

                db.ref('leaderboard').orderByChild('score').limitToLast(100).once('value').then((snapshot) => {
                    if (isLoaded) return; isLoaded = true; clearTimeout(fallbackTimeout);
                    let lb = []; 
                    snapshot.forEach((child) => { 
                        let item = child.val();
                        let matched = null;
                        
                        if (item.accountId && userDictByAcc[item.accountId]) {
                            matched = userDictByAcc[item.accountId];
                        } 
                        else if (item.name && userDictByName[item.name.trim().toLowerCase()]) {
                            matched = userDictByName[item.name.trim().toLowerCase()];
                        }
                        
                        if (matched) {
                            if (matched.avatar) item.avatar = matched.avatar;
                            if (matched.vipPoints !== undefined) item.vipPoints = matched.vipPoints;
                        }
                        
                        lb.push(item); 
                    }); 
                    processLeaderboardData(lb, diffType, listEl);
                }).catch(() => { if (isLoaded) return; isLoaded = true; clearTimeout(fallbackTimeout); let offlineData = JSON.parse(localStorage.getItem('pikachu_leaderboard_offline')) || []; processLeaderboardData(offlineData, diffType, listEl); });
            }).catch(() => { if (isLoaded) return; isLoaded = true; clearTimeout(fallbackTimeout); let offlineData = JSON.parse(localStorage.getItem('pikachu_leaderboard_offline')) || []; processLeaderboardData(offlineData, diffType, listEl); });
        } else { let offlineData = JSON.parse(localStorage.getItem('pikachu_leaderboard_offline')) || []; processLeaderboardData(offlineData, diffType, listEl); }
    };

    function processLeaderboardData(lbData, diffType, listEl) {
        let filteredData = lbData.filter(item => { let itemDiff = item.diff ? item.diff : 'easy'; return itemDiff === diffType; });
        let uniquePlayers = {};
        filteredData.forEach(item => { let name = item.name.trim(); if (!uniquePlayers[name] || item.score > uniquePlayers[name].score) { uniquePlayers[name] = item; } });
        let finalData = Object.values(uniquePlayers);
        finalData.sort((a, b) => { let scoreA = a.score || 0; let scoreB = b.score || 0; return scoreB - scoreA; });
        finalData = finalData.slice(0, 20); renderLBHTML(finalData, listEl);
    }

    function renderLBHTML(lb, listEl) {
        if (!lb || lb.length === 0) { listEl.innerHTML = '<p style="text-align:center; color:#ccc; font-size:1.1rem; padding: 20px;">Bảng này chưa có ai! Nhanh tay đoạt Top 1 đi bạn ơi!</p>'; } else {
            let html = '<table style="width:100%; border-collapse: collapse; font-size:1rem; text-align:center;">';
            html += '<tr style="border-bottom: 2px solid #ffd700; color: #ffd700;"><th>Hạng</th><th style="text-align:left; padding-left: 10px;">Đại Hiệp</th><th>Cảnh Giới</th><th>Màn</th><th>Điểm</th></tr>';
            lb.forEach((item, idx) => {
                let color = idx === 0 ? '#ffeb3b' : (idx === 1 ? '#e0e0e0' : (idx === 2 ? '#cd7f32' : '#fff'));
                let medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : idx + 1));
                let levelText = item.level ? item.level : 1;
                let avt = item.avatar ? item.avatar : 'https://i.imgur.com/7HnLKEg.png';
                let vInfo = window.getVipLevelInfo(item.vipPoints || 0);
                
                if ((item.accountId && item.accountId === ADMIN_ACCOUNT.toLowerCase()) || (item.name && item.name.includes("Boss Văn Cường"))) {
                    vInfo = { level: 10, name: "Tiên Nhân", color: "#ff0000", glow: "0 0 15px #ff0000, 0 0 30px #ff0000, inset 0 0 10px #ff0000" };
                }
                
                let glowClass = vInfo.level > 0 ? 'vip-glow-frame' : '';
                let textGlowClass = vInfo.level > 0 ? 'vip-glow-text' : '';

                let nameHtml = `
                <div style="display:flex; align-items:center; justify-content:start; gap:8px; --vip-color:${vInfo.color}; text-align:left;">
                    <img src="${avt}" class="${glowClass}" style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid ${vInfo.color}; object-fit: cover; background: #000;">
                    <span class="${textGlowClass}" style="max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: ${vInfo.color}; font-weight: bold; text-shadow: 0 0 3px #000;">${item.name}</span>
                </div>`;
                
                let vipHtml = `<span style="background: ${vInfo.color}; color: #000; font-size: 0.65rem; padding: 4px 6px; border-radius: 4px; font-weight: bold; box-shadow: 0 0 5px ${vInfo.color}; display:inline-block;">${vInfo.name}</span>`;

                html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.1); line-height:3;">
                    <td>${medal}</td><td style="padding: 6px 0 6px 10px;">${nameHtml}</td><td>${vipHtml}</td><td style="font-weight:bold; color: #ffeb3b;">${levelText}</td><td style="font-weight:bold; color: #00ffff;">${item.score}</td></tr>`;
            });
            html += '</table>'; listEl.innerHTML = html;
        }
    }

    function syncPlayerProfile() {
        highScore = parseInt(localStorage.getItem('pikachu_high_score')) || 0;
        let leftPanel = document.querySelector('.left-panel'); let profileBox = document.getElementById('player-profile-box');
        let avatarSrc = localStorage.getItem('pikachu_player_avatar') || 'https://i.imgur.com/7HnLKEg.png';
        let pName = localStorage.getItem('pikachu_player_name') || 'Người chơi';
        let vInfo = window.getVipLevelInfo(localStorage.getItem('pikachu_vip_points'));
        
        let accId = localStorage.getItem('pikachu_account_id');
        if (accId === ADMIN_ACCOUNT.toLowerCase()) {
            vInfo = { level: 10, name: "Tiên Nhân", color: "#ff0000", glow: "0 0 15px #ff0000, 0 0 30px #ff0000, inset 0 0 10px #ff0000" };
        }
        
        let glowClass = vInfo.level > 0 ? 'vip-glow-frame' : '';
        let textGlowClass = vInfo.level > 0 ? 'vip-glow-text' : '';

        if (leftPanel && !profileBox) {
            let pBox = document.createElement('div'); pBox.id = 'player-profile-box';
            pBox.style.cssText = `display:flex; flex-direction:column; align-items:center; border-bottom: 1px solid #555; padding-bottom: 10px; margin-bottom: 15px; width: 100%; --vip-color:${vInfo.color};`;
            pBox.innerHTML = `
                <img src="${avatarSrc}" class="player-avatar-img ${glowClass}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid ${vInfo.color}; object-fit: cover; margin-bottom: 5px;">
                <div style="display:flex; flex-direction:column; justify-content:center; align-items:center;">
                    <span class="${textGlowClass}" style="color: ${vInfo.color}; font-weight: bold; text-align: center; font-size: 0.95rem; max-width: 100%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${pName}</span>
                    <span style="background:${vInfo.color}; color:#000; font-size:0.7rem; padding:2px 6px; border-radius:4px; font-weight:bold; margin-top:4px;">${vInfo.name}</span>
                </div>
            `;
            let vcCr = document.getElementById('vc-cr');
            if (vcCr && vcCr.nextSibling) leftPanel.insertBefore(pBox, vcCr.nextSibling); else leftPanel.appendChild(pBox);
            
            let statBox = document.createElement('div'); statBox.className = 'stat-box'; statBox.id = 'high-score-box';
            statBox.innerHTML = `<span class="label" style="color: #ffeb3b; text-shadow: 0 0 5px red;">Kỷ lục</span><span class="value" id="high-score" style="color: #ffeb3b; text-shadow: 0 0 10px red;">${highScore}</span>`;
            leftPanel.appendChild(statBox);
        } else {
            let hsEl = document.getElementById('high-score'); if (hsEl) hsEl.innerText = highScore;
            document.querySelectorAll('.player-avatar-img').forEach(el => {
                el.src = avatarSrc; 
                el.style.border = `2px solid ${vInfo.color}`;
                if(vInfo.level > 0) el.classList.add('vip-glow-frame');
                else el.classList.remove('vip-glow-frame');
            });
            if(profileBox) profileBox.style.setProperty('--vip-color', vInfo.color);
            let pNameEl = profileBox.querySelector('span:first-of-type');
            if(pNameEl) { pNameEl.className = textGlowClass; pNameEl.style.color = vInfo.color; pNameEl.innerText = pName; }
            let vBadgeEl = profileBox.querySelector('span:last-of-type');
            if(vBadgeEl) { vBadgeEl.style.background = vInfo.color; vBadgeEl.innerText = vInfo.name; }
        }
    }

    function updateHighScore() {
        if (gameState.score > highScore) { highScore = gameState.score; localStorage.setItem('pikachu_high_score', highScore); let hsEl = document.getElementById('high-score'); if (hsEl) hsEl.innerText = highScore; }
    }

    function checkVipAndInit(accId, displayName, isF5 = false) {
        gameState.playerName = displayName; gameState.accountId = accId;
        if (accId === ADMIN_ACCOUNT.toLowerCase()) {
            gameState.isVip = true;
            if (!isF5) { window.showCustomAlertInternal("🔥 ĐĂNG NHẬP ADMIN THÀNH CÔNG!\n\nĐã bật God Mode (Gợi ý/Đổi vị trí vô hạn). Điểm số sẽ không lưu lên Xếp hạng online.", () => { init(); }); } else { init(); }
        } else { gameState.isVip = false; init(); }
    }

    function init() {
        // --- HIỂN THỊ GAME CONTAINER VÀ CHUYỂN TRẠNG THÁI IS-PLAYING ---
        document.body.classList.add('is-playing');
        let gc = document.querySelector('.game-container'); if(gc) gc.style.display = 'flex';

        syncPlayerProfile();
        const diffConfig = DIFF_CONFIG[gameState.currentDifficulty]; let currentLevelConfig = LEVELS[gameState.level - 1] || LEVELS[LEVELS.length - 1];
        gameState.board = []; gameState.selectedTile = null; gameState.timeRemaining = Math.floor(currentLevelConfig.time * diffConfig.timeMultiplier); gameState.isProcessing = false; 
        
        let extraHints = parseInt(localStorage.getItem('pikachu_inv_hints')) || 0;
        let extraShuffles = parseInt(localStorage.getItem('pikachu_inv_shuffles')) || 0;
        gameState.hintsRemaining = CONFIG.INITIAL_HINTS + extraHints;
        gameState.shufflesRemaining = CONFIG.INITIAL_SHUFFLES + extraShuffles;

        if (gameState.hintTimeoutId) clearTimeout(gameState.hintTimeoutId);
        let emojisToUse = diffConfig.emojiCount; let gameEmojis = [...CONFIG.EMOJIS].sort(() => 0.5 - Math.random()).slice(0, emojisToUse);
        let tiles = []; let totalTiles = CONFIG.ROWS * CONFIG.COLS;
        for (let i = 0; i < totalTiles / 2; i++) { let emoji = gameEmojis[i % gameEmojis.length]; tiles.push(emoji, emoji); } tiles.sort(() => 0.5 - Math.random());
        for (let r = 0; r <= CONFIG.ROWS + 1; r++) { gameState.board[r] = new Array(CONFIG.COLS + 2).fill(0); } let index = 0;
        for (let r = 1; r <= CONFIG.ROWS; r++) { for (let c = 1; c <= CONFIG.COLS; c++) { gameState.board[r][c] = tiles[index++]; } }
        renderBoard(); updateUI(); startTimer();
    }

    function renderBoard() {
        const boardEl = document.getElementById('board'); if(!boardEl) return;
        boardEl.innerHTML = ''; gameState.selectedTile = null;
        for (let r = 1; r <= CONFIG.ROWS; r++) {
            for (let c = 1; c <= CONFIG.COLS; c++) {
                let tileEl = document.createElement('div'); tileEl.classList.add('tile'); tileEl.dataset.r = r; tileEl.dataset.c = c;
                if (gameState.board[r][c] === 0) { tileEl.classList.add('matched'); } else { tileEl.innerText = gameState.board[r][c]; tileEl.onclick = () => { handleTileClick(r, c, tileEl); }; }
                boardEl.appendChild(tileEl);
            }
        }
    }

    function handleTileClick(r, c, tileEl) {
        if (gameState.isProcessing || gameState.board[r][c] === 0) return;
        if (!gameState.selectedTile) { window.playSoundInternal('select'); gameState.selectedTile = { r: r, c: c, el: tileEl }; tileEl.classList.add('selected'); } else {
            if (gameState.selectedTile.r === r && gameState.selectedTile.c === c) { window.playSoundInternal('select'); gameState.selectedTile.el.classList.remove('selected'); gameState.selectedTile = null; return; }
            if (gameState.board[gameState.selectedTile.r][gameState.selectedTile.c] === gameState.board[r][c]) {
                let path = checkPath({r: gameState.selectedTile.r, c: gameState.selectedTile.c}, {r: r, c: c});
                if (path) {
                    window.playSoundInternal('match'); gameState.isProcessing = true; if (gameState.hintTimeoutId) clearTimeout(gameState.hintTimeoutId);
                    const tile1 = gameState.selectedTile; const tile2 = { r: r, c: c, el: tileEl };
                    document.querySelectorAll('.tile.hint').forEach(t => { t.classList.remove('hint'); }); clearHintLine();
                    drawHintLine(path); tile2.el.classList.add('selected');
                    setTimeout(() => {
                        clearHintLine(); removeTiles(tile1, tile2); gameState.selectedTile = null; gameState.isProcessing = false; 
                        if (checkWin()) {
                            window.playSoundInternal('win'); clearInterval(gameState.timerInterval);
                           setTimeout(() => { 
    // 1. Tính tiền thưởng theo độ khó
    let earnedCoins = 30; // Mặc định Dễ
    if (gameState.currentDifficulty === 'medium') earnedCoins = 50;
    if (gameState.currentDifficulty === 'hard') earnedCoins = 100;

    // 2. Cộng tiền vào ví Local
    let currentCoins = parseInt(localStorage.getItem('pikachu_coins')) || 0;
    currentCoins += earnedCoins;
    localStorage.setItem('pikachu_coins', currentCoins);

    // 3. Đồng bộ tiền lên Firebase (Giấu không cho Admin cày tiền ảo)
    if (typeof db !== 'undefined' && db && gameState.accountId.toLowerCase() !== "vancuong140904") {
        db.ref('users/' + gameState.accountId).update({ coins: currentCoins });
    }

    // 4. Báo cáo chiến lợi phẩm cho người chơi
    window.showCustomAlertInternal(`🏆 TUYỆT VỜI!\n\nBạn đã vượt qua Bàn ${gameState.level}.\n💎 Nhận thưởng: +${earnedCoins} Linh Thạch!\n\nChuẩn bị sang bàn tiếp theo nhé!`, () => { 
        gameState.level++; 
        init(); 
    }); 
}, 200);
                        } else { if (!findHint()) { setTimeout(() => { window.showCustomAlertInternal('Đã bí đường!\nHãy sử dụng lượt Đổi Vị Trí để tiếp tục.'); }, 300); } }
                    }, 250); return;
                } else { handleWrongClick(); }
            } else { handleWrongClick(); }
            gameState.selectedTile.el.classList.remove('selected'); gameState.selectedTile = { r: r, c: c, el: tileEl }; tileEl.classList.add('selected'); window.playSoundInternal('select');
        }
    }

    function handleWrongClick() {
        window.playSoundInternal('error');
        if (gameState.level >= 5) {
            gameState.score -= 10;
            if (gameState.score < 0) gameState.score = 0;
            updateUI(); 
        }
    }

    function checkPathFree(r1, c1, r2, c2) { if (r1 === r2) { for (let c = Math.min(c1, c2) + 1; c < Math.max(c1, c2); c++) { if (gameState.board[r1][c] !== 0) return false; } return true; } else if (c1 === c2) { for (let r = Math.min(r1, r2) + 1; r < Math.max(r1, r2); r++) { if (gameState.board[r][c1] !== 0) return false; } return true; } return false; }
    function checkLine(p1, p2) { if (p1.r !== p2.r && p1.c !== p2.c) return null; if (checkPathFree(p1.r, p1.c, p2.r, p2.c)) return [p1, p2]; return null; }
    function checkL(p1, p2) { let corner1 = { r: p1.r, c: p2.c }; if (gameState.board[corner1.r][corner1.c] === 0 && checkPathFree(p1.r, p1.c, corner1.r, corner1.c) && checkPathFree(corner1.r, corner1.c, p2.r, p2.c)) return [p1, corner1, p2]; let corner2 = { r: p2.r, c: p1.c }; if (gameState.board[corner2.r][corner2.c] === 0 && checkPathFree(p1.r, p1.c, corner2.r, corner2.c) && checkPathFree(corner2.r, corner2.c, p2.r, p2.c)) return [p1, corner2, p2]; return null; }
    function checkPath(p1, p2) {
        let path = checkLine(p1, p2); if (path) return path; path = checkL(p1, p2); if (path) return path;
        let validPaths = [];
        for (let c = 0; c <= CONFIG.COLS + 1; c++) { if (c !== p1.c && gameState.board[p1.r][c] === 0 && checkPathFree(p1.r, p1.c, p1.r, c)) { let lPath = checkL({r: p1.r, c: c}, p2); if (lPath) validPaths.push([p1, ...lPath]); } }
        for (let r = 0; r <= CONFIG.ROWS + 1; r++) { if (r !== p1.r && gameState.board[r][p1.c] === 0 && checkPathFree(p1.r, p1.c, r, p1.c)) { let lPath = checkL({r: r, c: p1.c}, p2); if (lPath) validPaths.push([p1, ...lPath]); } }
        if (validPaths.length > 0) { validPaths.sort((a, b) => { let lenA = 0, lenB = 0; for(let i = 0; i < a.length - 1; i++) { lenA += Math.abs(a[i].r - a[i+1].r) + Math.abs(a[i].c - a[i+1].c); } for(let i = 0; i < b.length - 1; i++) { lenB += Math.abs(b[i].r - b[i+1].r) + Math.abs(b[i].c - b[i+1].c); } return lenA - lenB; }); return validPaths[0]; } return null;
    }

    function applyGravity() {
        let type = (LEVELS[gameState.level - 1] || LEVELS[LEVELS.length - 1]).gravity; if (type === 'none') return;
        
        if (type === 'down') { for (let c = 1; c <= CONFIG.COLS; c++) { let colData = []; for (let r = 1; r <= CONFIG.ROWS; r++) { if (gameState.board[r][c] !== 0) colData.push(gameState.board[r][c]); } while (colData.length < CONFIG.ROWS) { colData.unshift(0); } for (let r = 1; r <= CONFIG.ROWS; r++) { gameState.board[r][c] = colData[r - 1]; } } } 
        else if (type === 'up') { for (let c = 1; c <= CONFIG.COLS; c++) { let colData = []; for (let r = 1; r <= CONFIG.ROWS; r++) { if (gameState.board[r][c] !== 0) colData.push(gameState.board[r][c]); } while (colData.length < CONFIG.ROWS) { colData.push(0); } for (let r = 1; r <= CONFIG.ROWS; r++) { gameState.board[r][c] = colData[r - 1]; } } } 
        else if (type === 'left') { for (let r = 1; r <= CONFIG.ROWS; r++) { let rowData = []; for (let c = 1; c <= CONFIG.COLS; c++) { if (gameState.board[r][c] !== 0) rowData.push(gameState.board[r][c]); } while (rowData.length < CONFIG.COLS) { rowData.push(0); } for (let c = 1; c <= CONFIG.COLS; c++) { gameState.board[r][c] = rowData[c - 1]; } } } 
        else if (type === 'right') { for (let r = 1; r <= CONFIG.ROWS; r++) { let rowData = []; for (let c = 1; c <= CONFIG.COLS; c++) { if (gameState.board[r][c] !== 0) rowData.push(gameState.board[r][c]); } while (rowData.length < CONFIG.COLS) { rowData.unshift(0); } for (let c = 1; c <= CONFIG.COLS; c++) { gameState.board[r][c] = rowData[c - 1]; } } } 
        else if (type === 'center') { let mid = Math.floor(CONFIG.COLS / 2); for (let r = 1; r <= CONFIG.ROWS; r++) { let leftPart = []; for(let c = 1; c <= mid; c++) { if(gameState.board[r][c] !== 0) leftPart.push(gameState.board[r][c]); } while(leftPart.length < mid) { leftPart.unshift(0); } let rightPart = []; for(let c = mid + 1; c <= CONFIG.COLS; c++) { if(gameState.board[r][c] !== 0) rightPart.push(gameState.board[r][c]); } while(rightPart.length < CONFIG.COLS - mid) { rightPart.push(0); } for(let c = 1; c <= mid; c++) { gameState.board[r][c] = leftPart[c - 1]; } for(let c = mid + 1; c <= CONFIG.COLS; c++) { gameState.board[r][c] = rightPart[c - mid - 1]; } } }
        else if (type === 'split_h') {
            for (let c = 1; c <= CONFIG.COLS; c++) {
                let colData = []; for (let r = 1; r <= CONFIG.ROWS; r++) if (gameState.board[r][c] !== 0) colData.push(gameState.board[r][c]);
                let mid = Math.floor(CONFIG.ROWS / 2);
                let top = colData.slice(0, Math.floor(colData.length/2)); let bot = colData.slice(Math.floor(colData.length/2));
                while(top.length < mid) top.push(0); while(bot.length < CONFIG.ROWS - mid) bot.unshift(0);
                for (let r = 1; r <= mid; r++) gameState.board[r][c] = top[r-1];
                for (let r = mid + 1; r <= CONFIG.ROWS; r++) gameState.board[r][c] = bot[r - mid - 1];
            }
        }
        else if (type === 'split_v') {
            for (let r = 1; r <= CONFIG.ROWS; r++) {
                let rowData = []; for (let c = 1; c <= CONFIG.COLS; c++) if (gameState.board[r][c] !== 0) rowData.push(gameState.board[r][c]);
                let mid = Math.floor(CONFIG.COLS / 2);
                let left = rowData.slice(0, Math.floor(rowData.length/2)); let right = rowData.slice(Math.floor(rowData.length/2));
                while(left.length < mid) left.push(0); while(right.length < CONFIG.COLS - mid) right.unshift(0);
                for (let c = 1; c <= mid; c++) gameState.board[r][c] = left[c-1];
                for (let c = mid + 1; c <= CONFIG.COLS; c++) gameState.board[r][c] = right[c - mid - 1];
            }
        }
        else if (type === 'alt_v') {
            for (let c = 1; c <= CONFIG.COLS; c++) {
                let colData = []; for (let r = 1; r <= CONFIG.ROWS; r++) if (gameState.board[r][c] !== 0) colData.push(gameState.board[r][c]);
                if (c % 2 !== 0) { while (colData.length < CONFIG.ROWS) colData.push(0); } 
                else { while (colData.length < CONFIG.ROWS) colData.unshift(0); }
                for (let r = 1; r <= CONFIG.ROWS; r++) gameState.board[r][c] = colData[r - 1];
            }
        }
        else if (type === 'alt_h') {
            for (let r = 1; r <= CONFIG.ROWS; r++) {
                let rowData = []; for (let c = 1; c <= CONFIG.COLS; c++) if (gameState.board[r][c] !== 0) rowData.push(gameState.board[r][c]);
                if (r % 2 !== 0) { while (rowData.length < CONFIG.COLS) rowData.push(0); } 
                else { while (rowData.length < CONFIG.COLS) rowData.unshift(0); }
                for (let c = 1; c <= CONFIG.COLS; c++) gameState.board[r][c] = rowData[c - 1];
            }
        }
    }

    function removeTiles(tile1, tile2) {
        gameState.score += CONFIG.POINTS_PER_MATCH; updateHighScore(); 
        gameState.board[tile1.r][tile1.c] = 0; gameState.board[tile2.r][tile2.c] = 0; 
        applyGravity(); updateUI(); renderBoard(); 
    }

    function checkWin() { for (let r = 1; r <= CONFIG.ROWS; r++) { for (let c = 1; c <= CONFIG.COLS; c++) { if (gameState.board[r][c] !== 0) return false; } } return true; }

    function findHint() {
        let availableTiles = []; for (let r = 1; r <= CONFIG.ROWS; r++) { for (let c = 1; c <= CONFIG.COLS; c++) { if (gameState.board[r][c] !== 0) availableTiles.push({ r: r, c: c, type: gameState.board[r][c] }); } }
        for (let i = 0; i < availableTiles.length; i++) { for (let j = i + 1; j < availableTiles.length; j++) { let p1 = availableTiles[i]; let p2 = availableTiles[j]; if (p1.type === p2.type) { let path = checkPath({r: p1.r, c: p1.c}, {r: p2.r, c: p2.c}); if (path) return path; } } } return null; 
    }

    function performHint() {
        if (!gameState.isVip && gameState.hintsRemaining <= 0) { window.showCustomAlertInternal('Bạn đã hết lượt gợi ý rồi! Vào Cửa hàng để mua thêm nhé.'); return; }
        document.querySelectorAll('.tile.hint').forEach(t => { t.classList.remove('hint'); }); clearHintLine();
        const hintPath = findHint();
        if (hintPath) {
            if (!gameState.isVip) { 
                gameState.hintsRemaining--; updateUI(); 
                let baseHints = CONFIG.INITIAL_HINTS;
                if (gameState.hintsRemaining < baseHints) {
                    let invHints = parseInt(localStorage.getItem('pikachu_inv_hints')) || 0;
                    if (invHints > 0) {
                        invHints--; localStorage.setItem('pikachu_inv_hints', invHints);
                        if (db && gameState.accountId !== ADMIN_ACCOUNT.toLowerCase()) db.ref('users/' + gameState.accountId).update({ invHints: invHints });
                    }
                }
            }
            let p1 = hintPath[0]; let p2 = hintPath[hintPath.length - 1];
            const t1 = document.querySelector(`.tile[data-r="${p1.r}"][data-c="${p1.c}"]`); const t2 = document.querySelector(`.tile[data-r="${p2.r}"][data-c="${p2.c}"]`);
            if (t1 && t2) { t1.classList.add('hint'); t2.classList.add('hint'); drawHintLine(hintPath); if (gameState.hintTimeoutId) clearTimeout(gameState.hintTimeoutId); gameState.hintTimeoutId = setTimeout(() => { t1.classList.remove('hint'); t2.classList.remove('hint'); clearHintLine(); }, 3000); }
        } else { window.showCustomAlertInternal('Đã bí đường!\nHãy sử dụng lượt Đổi vị trí nhé.'); }
    }

    function drawHintLine(pathArray) {
        const svgEl = document.getElementById('connection-line-layer'); if(!svgEl) return;
        svgEl.style.position = 'fixed'; svgEl.style.top = '0'; svgEl.style.left = '0'; svgEl.style.width = '100vw'; svgEl.style.height = '100vh'; svgEl.style.zIndex = '9999'; svgEl.style.pointerEvents = 'none'; 
        const refTile1 = document.querySelector('.tile[data-r="1"][data-c="1"]').getBoundingClientRect(); const refTile2X = document.querySelector('.tile[data-r="1"][data-c="2"]').getBoundingClientRect(); const refTile2Y = document.querySelector('.tile[data-r="2"][data-c="1"]').getBoundingClientRect();
        const gapX = refTile2X.left - refTile1.left; const gapY = refTile2Y.top - refTile1.top; const startX = refTile1.left + refTile1.width / 2; const startY = refTile1.top + refTile1.height / 2;
        function getPixel(r, c) { return { x: startX + (c - 1) * gapX, y: startY + (r - 1) * gapY }; }
        let pointsString = pathArray.map(p => { let px = getPixel(p.r, p.c); return `${px.x},${px.y}`; }).join(' ');
        const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline'); polyline.setAttribute('points', pointsString); polyline.setAttribute('stroke', '#00ffff'); polyline.setAttribute('stroke-width', '6'); polyline.setAttribute('fill', 'none'); polyline.setAttribute('stroke-linejoin', 'round'); polyline.setAttribute('stroke-linecap', 'round'); polyline.setAttribute('filter', 'drop-shadow(0 0 5px rgba(0, 255, 255, 0.8))'); polyline.setAttribute('pointer-events', 'none'); 
        svgEl.innerHTML = ''; svgEl.appendChild(polyline); svgEl.classList.remove('hidden');
    }

    function clearHintLine() { const svgEl = document.getElementById('connection-line-layer'); if(svgEl){svgEl.innerHTML = ''; svgEl.classList.add('hidden');} }

    function performShuffle() {
        if (!gameState.isVip && gameState.shufflesRemaining <= 0) { window.showCustomAlertInternal('Bạn đã hết lượt đổi vị trí! Vào Cửa hàng để mua thêm nhé.'); return; }
        if (!gameState.isVip) {
            gameState.shufflesRemaining--; 
            let baseShuffles = CONFIG.INITIAL_SHUFFLES;
            if (gameState.shufflesRemaining < baseShuffles) {
                let invShuf = parseInt(localStorage.getItem('pikachu_inv_shuffles')) || 0;
                if (invShuf > 0) {
                    invShuf--; localStorage.setItem('pikachu_inv_shuffles', invShuf);
                    if (db && gameState.accountId !== ADMIN_ACCOUNT.toLowerCase()) db.ref('users/' + gameState.accountId).update({ invShuffles: invShuf });
                }
            }
        }
        forceShuffle();
    }

    function forceShuffle() {
        let currentEmojis = []; for (let r = 1; r <= CONFIG.ROWS; r++) { for (let c = 1; c <= CONFIG.COLS; c++) { if (gameState.board[r][c] !== 0) currentEmojis.push(gameState.board[r][c]); } }
        let attempts = 0; while (attempts < 100) { currentEmojis.sort(() => 0.5 - Math.random()); let index = 0; for (let r = 1; r <= CONFIG.ROWS; r++) { for (let c = 1; c <= CONFIG.COLS; c++) { if (gameState.board[r][c] !== 0) gameState.board[r][c] = currentEmojis[index++]; } } if (findHint()) break; attempts++; }
        renderBoard(); updateUI();
    }

    function updateUI() {
        let elScore = document.getElementById('score'); if (elScore) elScore.innerText = gameState.score; 
        let elLevel = document.getElementById('level'); if (elLevel) elLevel.innerText = gameState.level; 
        let elShuff = document.getElementById('shuffle-count'); if (elShuff) elShuff.innerText = gameState.isVip ? '∞' : gameState.shufflesRemaining; 
        let elHint = document.getElementById('hint-count'); if (elHint) elHint.innerText = gameState.isVip ? '∞' : gameState.hintsRemaining; 
        updateTimeDisplay();
    }
    window.updateUIGlobal = updateUI;

    function startTimer() {
        if (gameState.timerInterval) clearInterval(gameState.timerInterval); updateTimeDisplay();
        const diffConfig = DIFF_CONFIG[gameState.currentDifficulty]; let timeTickRate = gameState.isVip ? 2000 : diffConfig.tickRate;
        gameState.timerInterval = setInterval(() => {
            if (gameState.timeRemaining > 0) { gameState.timeRemaining--; updateTimeDisplay(); } 
            else { clearInterval(gameState.timerInterval); saveScoreToLeaderboard(); window.playSoundInternal('lose'); window.showCustomAlertInternal(`⌛ HẾT GIỜ! GAME OVER.\n\nĐiểm của bạn: ${gameState.score}\nKỷ lục hiện tại: ${highScore}`, () => { resetGame(); }); }
        }, timeTickRate);
    }

    function updateTimeDisplay() {
        let currentLevelConfig = LEVELS[gameState.level - 1] || LEVELS[LEVELS.length - 1]; const diffConfig = DIFF_CONFIG[gameState.currentDifficulty]; let maxTime = Math.floor(currentLevelConfig.time * diffConfig.timeMultiplier); const timePercentage = (gameState.timeRemaining / maxTime) * 100; const timerBar = document.getElementById('timer-bar');
        if(timerBar){ timerBar.style.setProperty('--progress', `${timePercentage}%`); if (timePercentage > 50) timerBar.style.backgroundColor = '#00ff00'; else if (timePercentage > 20) timerBar.style.backgroundColor = 'yellow'; else timerBar.style.backgroundColor = 'red'; }
    }

    function toggleMute() {
        gameState.isMuted = !gameState.isMuted; let icon = document.querySelector('#sound-btn i'); if (icon) icon.innerText = gameState.isMuted ? '🔊' : '🔇'; if (!gameState.isMuted) window.playSoundInternal('select'); 
    }

    function resetGame() {
        if (gameState.timerInterval) clearInterval(gameState.timerInterval); if (gameState.hintTimeoutId) clearTimeout(gameState.hintTimeoutId);
        gameState.score = 0; gameState.level = 1; gameState.shufflesRemaining = CONFIG.INITIAL_SHUFFLES; gameState.hintsRemaining = CONFIG.INITIAL_HINTS; updateUI();
        let pauseOverlay = document.getElementById('pause-overlay'); if (pauseOverlay) pauseOverlay.classList.add('hidden');
        showMainMenu();
    }

    document.addEventListener('click', function(e) {
        if (e.target && e.target.id === 'close-leaderboard-btn') {
            window.playSoundInternal('select');
            let lbOverlay = document.getElementById('leaderboard-overlay'); if (lbOverlay) lbOverlay.classList.add('hidden');
            let diffModal = document.getElementById('difficulty-modal'); let isDiffHidden = diffModal ? diffModal.classList.contains('hidden') : true;
            let mainMenu = document.getElementById('main-menu-overlay'); let isMenuHidden = mainMenu ? mainMenu.classList.contains('hidden') : true;
            let shopOvl = document.getElementById('shop-overlay'); let isShopHidden = shopOvl ? shopOvl.classList.contains('hidden') : true;
            let wOvl = document.getElementById('wealth-overlay'); let isWHidden = wOvl ? wOvl.classList.contains('hidden') : true;
            if (gameState.timeRemaining > 0 && isDiffHidden && isMenuHidden && isShopHidden && isWHidden) { startTimer(); }
        }
        if (e.target && e.target.id === 'resume-btn') {
            window.playSoundInternal('select'); let pauseOverlay = document.getElementById('pause-overlay'); if (pauseOverlay) pauseOverlay.classList.add('hidden'); startTimer();
        }
        let footerQuitBtn = e.target.closest('#footer-quit-btn');
        if (footerQuitBtn) {
            window.playSoundInternal('select'); if (gameState.score > 0) saveScoreToLeaderboard();
            window.showCustomAlertInternal(`🚪 Đã thoát trò chơi!\n\nSố điểm ${gameState.score} của bạn đã được ghi nhận.`, () => { resetGame(); });
        }
        if (e.target && e.target.id === 'quit-game-btn') {
            window.playSoundInternal('select'); let pauseOverlay = document.getElementById('pause-overlay'); if (pauseOverlay) pauseOverlay.classList.add('hidden');
            if (gameState.score > 0) saveScoreToLeaderboard();
            window.showCustomAlertInternal(`🚪 Đã thoát trò chơi!\n\nSố điểm ${gameState.score} của bạn đã được ghi nhận.`, () => { resetGame(); });
        }
    });

    window.onload = function() {
        // --- ẨN BÀN GAME LÚC VỪA LOAD, ẨN NÚT CHƠI LẠI TRÁNH LỖI ---
        let gc = document.querySelector('.game-container'); if(gc) gc.style.display = 'none';
        let btnRestart = document.getElementById('restart-btn'); 
        if(btnRestart) { btnRestart.style.display = 'none'; btnRestart.style.visibility = 'hidden'; btnRestart.style.opacity = '0'; btnRestart.style.pointerEvents = 'none'; }

        if (!document.getElementById('avatar-upload-input')) {
            let fileInput = document.createElement('input'); fileInput.type = 'file'; fileInput.id = 'avatar-upload-input'; fileInput.accept = 'image/*'; fileInput.style.display = 'none';
            fileInput.onchange = function(e) { if (e.target.files && e.target.files[0]) { window.resizeAndSaveAvatar(e.target.files[0]); } };
            document.body.appendChild(fileInput);
        }

        createCustomAlertUI(); createPauseUI(); createLeaderboardUI(); syncPlayerProfile(); 
        
        document.body.addEventListener('click', function() { try { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx && audioCtx.state === 'suspended') audioCtx.resume(); } catch(e){} }, { once: true });
        
        let btnLB = document.getElementById('leaderboard-btn'); 
        if (btnLB) { btnLB.id = 'footer-quit-btn'; btnLB.innerHTML = '<i>🚪</i> <span class="btn-txt">Thoát</span>'; }

        let btnSound = document.getElementById('sound-btn'); if(btnSound) btnSound.addEventListener('click', toggleMute);
        let btnPause = document.getElementById('pause-btn'); if (btnPause) { btnPause.addEventListener('click', function() { window.playSoundInternal('select'); pauseGame(); }); }
        let btnHint = document.getElementById('hint-btn'); if(btnHint) btnHint.addEventListener('click', function() { window.playSoundInternal('select'); performHint(); });
        let btnShuffle = document.getElementById('shuffle-btn'); if(btnShuffle) btnShuffle.addEventListener('click', function() { window.playSoundInternal('select'); performShuffle(); });

        let btnCancel = document.getElementById('cancel-diff-btn'); if(btnCancel) btnCancel.addEventListener('click', () => { window.playSoundInternal('select'); document.getElementById('difficulty-modal').classList.add('hidden'); });
        
        // --- XỬ LÝ NÚT VÀO GAME ĐỂ KHÔNG BỊ KẸT ---
        let btnStart = document.getElementById('start-game-btn'); 
        if(btnStart) btnStart.addEventListener('click', () => {
            window.playSoundInternal('select'); 
            
            // Ẩn tất cả các bảng menu
            document.getElementById('difficulty-modal').classList.add('hidden');
            let mMenu = document.getElementById('main-menu-overlay'); if(mMenu) mMenu.classList.add('hidden');
            
            // Bật chế độ Fullscreen nếu có thể
            let elem = document.documentElement; if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
            
            // Bắt đầu game
            let savedAcc = localStorage.getItem('pikachu_account_id'); let savedName = localStorage.getItem('pikachu_player_name');
            checkVipAndInit(savedAcc, savedName, false); 
        });

        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', function() { window.playSoundInternal('select'); document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active')); this.classList.add('active'); gameState.currentDifficulty = this.dataset.diff; });
        });

        let savedAcc = localStorage.getItem('pikachu_account_id'); let savedName = localStorage.getItem('pikachu_player_name');
        if (savedAcc && savedName) {
            let savedDiff = localStorage.getItem('pikachu_difficulty');
            if (savedDiff && DIFF_CONFIG[savedDiff]) { gameState.currentDifficulty = savedDiff; document.querySelectorAll('.diff-btn').forEach(b => { b.classList.remove('active'); if(b.dataset.diff === savedDiff) b.classList.add('active'); }); }
            
           // Đã gỡ bỏ lệnh chặn Admin lúc F5
            if (db) {
                db.ref('users/' + savedAcc).once('value').then(snap => {
                    if (snap.exists()) {
                        let d = snap.val();
                        localStorage.setItem('pikachu_coins', d.coins || 0);
                        localStorage.setItem('pikachu_vip_points', d.vipPoints || 0);
                        localStorage.setItem('pikachu_inv_hints', d.invHints || 0);
                        localStorage.setItem('pikachu_inv_shuffles', d.invShuffles || 0);
                        // BỔ SUNG LỆNH LẤY AVATAR TỪ SERVER VỀ MÁY LÚC F5
                        if (d.avatar) localStorage.setItem('pikachu_player_avatar', d.avatar);
                    }
                    showMainMenu();
                });
            } else {
                showMainMenu(); 
            }
        } else { showAuthScreen(); }
    };

    setInterval(function() {
        var _0x5c = document.getElementById('vc-cr'); var _0x7f = String.fromCharCode(67, 111, 100, 101, 32, 66, 121, 32, 86, 97, 110, 67, 117, 111, 110, 103);
        if (!_0x5c || _0x5c.innerText !== _0x7f) { if(gameState && gameState.timerInterval) clearInterval(gameState.timerInterval); document.body.innerHTML = `<div style="display:flex; flex-direction:column; justify-content:center; align-items:center; height:100vh; background-color:#000; color:red; font-family:sans-serif; text-align:center;"><h1 style="font-size: 3rem; margin-bottom: 20px;">⛔ CẢNH BÁO!</h1><p style="font-size: 1.5rem; color: #fff;">Mã nguồn thuộc về <b>VanCuong</b>.</p></div>`; }
    }, 1000);
})();