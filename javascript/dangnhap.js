window.isLoginMode = true;

window.showAuthScreen = function() {
    let authOverlay = document.getElementById('auth-overlay'); if (authOverlay) authOverlay.classList.remove('hidden');
    let nameEl = document.getElementById('auth-name'); let passEl = document.getElementById('auth-pass'); let dNameEl = document.getElementById('auth-display-name');
    if(nameEl) nameEl.value = ''; if(passEl) passEl.value = ''; if(dNameEl) dNameEl.style.display = 'none';
}

window.toggleAuthMode = function() {
    if(window.playSoundInternal) window.playSoundInternal('select'); window.isLoginMode = !window.isLoginMode;
    let title = document.getElementById('auth-title'); let desc = document.getElementById('auth-desc');
    let btn = document.getElementById('auth-action-btn'); let switchText = document.getElementById('auth-switch-text');
    let switchBtn = document.getElementById('auth-switch-btn'); let displayNameInput = document.getElementById('auth-display-name');

    if (window.isLoginMode) {
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

window.handleAuth = function() {
    try {
        if(window.playSoundInternal) window.playSoundInternal('select');
        let nameEl = document.getElementById('auth-name'); let passEl = document.getElementById('auth-pass');
        const accInput = nameEl ? nameEl.value.trim() : ''; const passInput = passEl ? passEl.value.trim() : '';
        if (!accInput || !passInput) { window.showCustomAlertInternal("❌ Vui lòng nhập đầy đủ Tài khoản và Mật khẩu!"); return; }
        const safeAccKey = accInput.toLowerCase().replace(/[.#$\[\]]/g, "");

        if (!window.db) {
            window.showCustomAlertInternal("⚠️ Mất kết nối mạng! Chuyển sang chế độ Offline.");
            if (window.isLoginMode) {
                let savedName = localStorage.getItem('pikachu_player_name'); let savedAcc = localStorage.getItem('pikachu_account_id');
                if (savedName && savedAcc === safeAccKey) window.proceedToMainMenu(safeAccKey, savedName);
                else window.showCharacterNamePrompt(safeAccKey, ""); 
            } else { window.showCustomAlertInternal("✅ Đăng ký offline thành công!", () => { window.toggleAuthMode(); }); }
            return;
        }

        let btn = document.getElementById('auth-action-btn'); let oldText = btn ? btn.innerText : "ĐĂNG NHẬP";
        if (btn) { btn.innerText = "⏳ ĐANG XỬ LÝ..."; btn.disabled = true; }

        window.db.ref('users/' + safeAccKey).once('value').then((snapshot) => {
            if(btn) { btn.innerText = oldText; btn.disabled = false; }
            if (window.isLoginMode) {
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
                        
                        // --- ĐÃ THAY THẾ: Kiểm tra cờ Admin từ Database thay vì check cứng tên nick ---
                        if (userData.isAdmin === true) {
                            localStorage.setItem('pikachu_is_admin', 'true');
                        } else {
                            localStorage.removeItem('pikachu_is_admin');
                        }

                        if (existingName !== "") window.proceedToMainMenu(safeAccKey, existingName);
                        else window.showCharacterNamePrompt(safeAccKey, ""); 
                    } else { window.showCustomAlertInternal("❌ SAI MẬT KHẨU!"); }
                } else { window.showCustomAlertInternal("❌ TÀI KHOẢN KHÔNG TỒN TẠI!\nVui lòng bấm 'Đăng ký ngay' ở bên dưới."); }
            } else {
                if (snapshot.exists()) { window.showCustomAlertInternal("❌ TÀI KHOẢN NÀY ĐÃ TỒN TẠI!\nVui lòng chọn ID tài khoản khác."); } 
                else {
                    window.db.ref('users/' + safeAccKey).set({ password: passInput, coins: 0, vipPoints: 0, createdAt: window.firebase.database.ServerValue.TIMESTAMP }).then(() => {
                        window.showCustomAlertInternal(`✅ ĐĂNG KÝ THÀNH CÔNG!\nVui lòng Đăng nhập để tạo nhân vật.`, () => { window.toggleAuthMode(); if(passEl) passEl.value = ''; });
                    }).catch(err => { window.showCustomAlertInternal("Lỗi đăng ký: " + err.message); });
                }
            }
        }).catch(err => { 
            if(btn) { btn.innerText = oldText; btn.disabled = false; } 
            window.showCustomAlertInternal("Lỗi kết nối Firebase: " + err.message); 
        });
    } catch (error) { 
        console.error(error); 
        window.showCustomAlertInternal("❌ Lỗi hệ thống đăng nhập: " + error.message); 
    }
}

window.showCharacterNamePrompt = function(accId, currentName) {
    if (!document.getElementById('char-name-overlay')) {
        const nameHTML = `
        <div id="char-name-overlay" class="modal-overlay hidden" style="z-index: 10000000; backdrop-filter: blur(8px);">
            <div class="modal-content">
                <h2 style="color: #ffd700;">TẠO NHÂN VẬT</h2>
                <p style="margin-bottom: 20px; color: #ccc;">Vui lòng nhập tên hiển thị trên Bảng Xếp Hạng!</p>
                <input type="text" id="char-name-input" placeholder="Ví dụ: Cường Đẹp Trai" autocomplete="off">
                <button id="confirm-name-btn" class="gold-btn">VÀO TRÒ CHƠI</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', nameHTML);
    }
    let authOverlay = document.getElementById('auth-overlay'); if (authOverlay) authOverlay.classList.add('hidden'); 
    let nameOverlay = document.getElementById('char-name-overlay'); let nameInput = document.getElementById('char-name-input');
    nameOverlay.dataset.accId = accId; nameInput.value = currentName; 
    nameOverlay.classList.remove('hidden'); nameInput.focus();
}

window.handleConfirmName = function() {
    if(window.playSoundInternal) window.playSoundInternal('select');
    let nameOverlay = document.getElementById('char-name-overlay'); let nameInput = document.getElementById('char-name-input');
    let newName = nameInput.value.trim(); let accId = nameOverlay.dataset.accId;
    if (!newName) { window.showCustomAlertInternal("❌ Đại hiệp chưa nhập tên nhân vật!"); return; }

    if (window.db) {
        window.db.ref('users/' + accId).update({ displayName: newName }).then(() => {
            nameOverlay.classList.add('hidden'); window.proceedToMainMenu(accId, newName);
        }).catch(err => { window.showCustomAlertInternal("Lỗi lưu tên: " + err.message); });
    } else { nameOverlay.classList.add('hidden'); window.proceedToMainMenu(accId, newName); }
}

window.proceedToMainMenu = function(accId, displayName) {
    localStorage.setItem('pikachu_account_id', accId); localStorage.setItem('pikachu_player_name', displayName);
    let authOverlay = document.getElementById('auth-overlay'); if (authOverlay) authOverlay.classList.add('hidden'); 
    if (window.db) { 
        window.db.ref('users/' + accId).once('value').then(snapshot => {
            if(snapshot.exists()) {
                let d = snapshot.val();
                localStorage.setItem('pikachu_coins', d.coins || 0);
                localStorage.setItem('pikachu_vip_points', d.vipPoints || 0);
                localStorage.setItem('pikachu_inv_hints', d.invHints || 0);
                localStorage.setItem('pikachu_inv_shuffles', d.invShuffles || 0);
                if (d.avatar) localStorage.setItem('pikachu_player_avatar', d.avatar); 
                
                // Đồng bộ cờ admin
                if (d.isAdmin === true) {
                    localStorage.setItem('pikachu_is_admin', 'true');
                } else {
                    localStorage.removeItem('pikachu_is_admin');
                }
            }
            if(window.showMainMenu) window.showMainMenu(true); // Gửi true để bỏ qua việc reload lần 2
        });
    } else { if(window.showMainMenu) window.showMainMenu(); }
}

window.logout = function() {
    if(window.playSoundInternal) window.playSoundInternal('select');
    localStorage.removeItem('pikachu_account_id'); 
    localStorage.removeItem('pikachu_player_name'); 
    localStorage.removeItem('pikachu_player_avatar');
    localStorage.removeItem('pikachu_coins'); 
    localStorage.removeItem('pikachu_vip_points');
    localStorage.removeItem('pikachu_is_admin'); // Đã thêm xóa cờ admin khi đăng xuất
    
    let mainMenu = document.getElementById('main-menu-overlay'); if(mainMenu) mainMenu.remove(); 
    if(window.showAuthScreen) window.showAuthScreen(); 
}

// Bắt sự kiện Click Toàn Cục
document.addEventListener('click', function(e) {
    if (e.target && e.target.id === 'auth-action-btn') { e.preventDefault(); window.handleAuth(); }
    if (e.target && e.target.id === 'auth-switch-btn') { e.preventDefault(); window.toggleAuthMode(); }
    if (e.target && e.target.id === 'confirm-name-btn') { e.preventDefault(); window.handleConfirmName(); }
    
    if (e.target && (e.target.id === 'btn-change-avatar' || e.target.closest('#btn-change-avatar-wrap'))) {
        if(window.playSoundInternal) window.playSoundInternal('select'); 
        if (window.PlayerProfile && typeof window.PlayerProfile.open === 'function') {
            window.PlayerProfile.open(); 
        } else {
            console.log("File profile.js chưa nạp hoặc không tồn tại!");
        }
    }
});