

(function() {
    document.addEventListener('click', function(e) {
        if (e.target && (e.target.id === 'btn-menu-pvp' || e.target.closest('#btn-menu-pvp'))) {
            if (window.playSoundInternal) window.playSoundInternal('select');
            if (window.PvP) window.PvP.openLobby();
        }
    });

    const PVP_EMOJIS = [
        { type: 'attack', icon: '⚔️', name: 'Kiếm Điện', value: 2 },  
        { type: 'attack', icon: '💣', name: 'Bom Nổ', value: 3 },    
        { type: 'heal', icon: '💖', name: 'Hồi Máu', value: 1 },      
        { type: 'defense', icon: '🛡️', name: 'Giáp Xanh', value: 3 }, 
        { type: 'freeze', icon: '❄️', name: 'Băng❄️', value: 0 }      
    ];
    const CONFIG = { ROWS: 7, COLS: 7 }; 

    const pvpStyles = `
        .pvp-room-list { max-height: 350px; overflow-y: auto; display: flex; flex-direction: column; gap: 10px; padding: 5px; }
        .pvp-room-item { background: rgba(0,0,0,0.6); border: 2px solid #d4af37; border-radius: 8px; padding: 10px; display: flex; justify-content: space-between; align-items: center; color: #fff; transition: 0.2s; }
        .pvp-room-item:hover { background: rgba(212, 175, 55, 0.2); transform: scale(1.02); }
        .pvp-btn-join { background: linear-gradient(to bottom, #4CAF50, #2E7D32); border: 1px solid #fff; color: white; padding: 5px 15px; border-radius: 5px; font-weight: bold; cursor: pointer; }
        .pvp-btn-join:disabled { background: #555; cursor: not-allowed; opacity: 0.7; }
        
        /* BÀN CỜ MẶC ĐỊNH (MOBILE CẦM DỌC) */
        .pvp-arena-container { display: flex; flex-direction: column; justify-content: center; align-items: center; width: 100%; height: 100%; max-width: 800px; margin: 0 auto; padding: 10px; box-sizing: border-box; overflow-y: auto; gap: 15px; overflow-x: hidden; }
        .pvp-info-panel { width: 100%; max-width: 500px; background: rgba(0,0,0,0.7); padding: 10px 15px; border-radius: 15px; display: flex; align-items: center; gap: 15px; box-sizing: border-box; height: fit-content; box-shadow: 0 4px 10px rgba(0,0,0,0.5); }
        .pvp-opp-panel { border: 2px solid #ff5252; }
        .pvp-my-panel { border: 2px solid #00e676; flex-direction: row-reverse; }
        
        .pvp-avatar-img { width: 60px; height: 60px; border-radius: 50%; border: 3px solid #555; object-fit: cover; background: #000; transition: 0.3s; flex-shrink: 0; }
        .pvp-name-col { flex: 1; display: flex; flex-direction: column; justify-content: center; width: 100%; }
        .pvp-name-row { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 8px; }
        .pvp-name-row.reverse { flex-direction: row-reverse; }
        .pvp-badge-wrap { display: flex; flex-direction: column; align-items: flex-end; gap: 4px; }
        .pvp-badge-wrap.reverse { align-items: flex-start; }
        
        .pvp-match3-board { display: grid; grid-template-columns: repeat(${CONFIG.COLS}, 1fr); gap: 2px; width: min(95vw, 60vh); aspect-ratio: 1; background: #2c1a0c; padding: 5px; border: 3px solid #3e2723; border-radius: 12px; margin: 0 auto; box-shadow: inset 0 0 20px #000; transition: opacity 0.3s; }
        .pvp-center-col { width: 100%; display: flex; flex-direction: column; align-items: center; gap: 10px; }
        
        .pvp-tile-m3 { background: #3e2723; border-radius: 8px; border: 1px solid #6f4e2a; display: flex; justify-content: center; align-items: center; font-size: min(8vw, 5.5vh, 2.5rem); cursor: pointer; transition: transform 0.1s, background 0.2s; box-shadow: inset 0 -3px 0 rgba(0,0,0,0.3); user-select: none; }
        .pvp-tile-m3:active { transform: scale(0.9); box-shadow: inset 0 0 0 rgba(0,0,0,0); }
        .pvp-tile-m3.selected { background: #ffeb3b; border: 2px solid red; box-shadow: 0 0 15px red; transform: scale(1.1); z-index: 10; }
        .pvp-tile-m3.explode { animation: explode-anim 0.3s forwards; }
        @keyframes explode-anim { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.5); opacity: 0.8; filter: brightness(2); } 100% { transform: scale(0); opacity: 0; } }
        
        .hp-text-display { position: absolute; width: 100%; top: 0; left: 0; text-align: center; color: white; font-weight: bold; font-size: 0.9rem; line-height: 20px; z-index: 10; text-shadow: 1px 1px 2px #000; }
        .hp-bar-fill { transition: width 0.3s ease-out; }
        .shield-bar-fill { height: 100%; background: linear-gradient(90deg, #0091ea, #00e5ff); position: absolute; top: 0; left: 0; z-index: 5; transition: width 0.3s ease-out; }
        .dmg-text { position: absolute; font-size: 3rem; font-weight: bold; text-shadow: 2px 2px 0 #000, 0 0 10px #000; pointer-events: none; z-index: 99999; animation: floatM3 1s forwards; }
        @keyframes floatM3 { 0% { transform: translateY(0) scale(0.5); opacity: 1; } 50% { transform: translateY(-40px) scale(1.2); opacity: 1; } 100% { transform: translateY(-80px) scale(1); opacity: 0; } }

        /* KHI XOAY NGANG ĐIỆN THOẠI HOẶC TRÊN PC (LANDSCAPE) */
        @media screen and (orientation: landscape) and (max-height: 800px), screen and (min-width: 800px) {
            .pvp-arena-container { flex-direction: row; max-width: 1400px; justify-content: center; align-items: center; overflow: hidden; padding: 15px; gap: 30px; }
            .pvp-info-panel { flex-direction: column; width: 260px; max-width: 260px; justify-content: center; padding: 25px 20px; text-align: center; }
            .pvp-my-panel { flex-direction: column; } 
            .pvp-avatar-img { width: 90px; height: 90px; margin-bottom: 10px; border-width: 4px; margin-left: 0; margin-right: 0; }
            .pvp-name-row, .pvp-name-row.reverse { flex-direction: column; align-items: center; text-align: center; gap: 10px; margin-bottom: 15px; width: 100%; }
            .pvp-badge-wrap, .pvp-badge-wrap.reverse { align-items: center !important; flex-direction: row; flex-wrap: wrap; justify-content: center; }
            .pvp-center-col { justify-content: center; width: auto; flex: unset; }
            .pvp-match3-board { width: 65vh !important; height: 65vh !important; margin: 0 auto; }
        }
    `;
    if (!document.getElementById('pvp-match3-styles')) {
        let style = document.createElement('style'); style.id = 'pvp-match3-styles';
        style.innerHTML = pvpStyles; document.head.appendChild(style);
    }
    window.showCustomConfirmInternal = function(message, onYes, onNo) {
        if (!document.getElementById('custom-confirm-overlay')) {
            const html = `
            <div id="custom-confirm-overlay" class="modal-overlay hidden" style="z-index: 9999999999; backdrop-filter: blur(4px);">
                <div class="modal-content" style="max-width: 400px; border: 3px solid #ff9800; box-shadow: 0 0 25px rgba(255, 152, 0, 0.6); padding: 30px;">
                    <h2 style="color: #ff9800; margin-bottom: 15px; text-shadow: 0 0 10px #ff9800; font-size: 1.8rem;">XÁC NHẬN</h2>
                    <p id="custom-confirm-message" style="font-size: 1.2rem; margin-bottom: 25px; color: #fff; white-space: pre-wrap; line-height: 1.4;"></p>
                    <div style="display: flex; gap: 10px;">
                        <button id="custom-confirm-btn-no" style="flex: 1; background: #555; border: 2px solid #fff; color: #fff; font-weight: bold; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 1.1rem;">HỦY BỎ</button>
                        <button id="custom-confirm-btn-yes" style="flex: 1; background: linear-gradient(to bottom, #4CAF50, #2E7D32); border: 2px solid #fff; color: #fff; font-weight: bold; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 1.1rem; box-shadow: 0 0 10px rgba(76,175,80,0.5);">ĐỒNG Ý</button>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
        }
        let overlay = document.getElementById('custom-confirm-overlay'); document.getElementById('custom-confirm-message').innerText = message;
        let btnYes = document.getElementById('custom-confirm-btn-yes'); let btnNo = document.getElementById('custom-confirm-btn-no');
        let newBtnYes = btnYes.cloneNode(true); btnYes.parentNode.replaceChild(newBtnYes, btnYes); let newBtnNo = btnNo.cloneNode(true); btnNo.parentNode.replaceChild(newBtnNo, btnNo);
        newBtnYes.addEventListener('click', () => { if(window.playSoundInternal) window.playSoundInternal('select'); overlay.classList.add('hidden'); if(onYes) onYes(); });
        newBtnNo.addEventListener('click', () => { if(window.playSoundInternal) window.playSoundInternal('select'); overlay.classList.add('hidden'); if(onNo) onNo(); });
        overlay.classList.remove('hidden');
    };

    window.showCustomPromptInternal = function(message, onConfirm) {
        if (!document.getElementById('custom-prompt-overlay')) {
            const html = `
            <div id="custom-prompt-overlay" class="modal-overlay hidden" style="z-index: 9999999999; backdrop-filter: blur(4px);">
                <div class="modal-content" style="max-width: 400px; border: 3px solid #ffeb3b; box-shadow: 0 0 25px rgba(255, 235, 59, 0.6); padding: 30px;">
                    <h2 style="color: #ffeb3b; margin-bottom: 15px; text-shadow: 0 0 10px #ffeb3b; font-size: 1.8rem;">🔒 NHẬP MẬT KHẨU</h2>
                    <p id="custom-prompt-message" style="font-size: 1.1rem; margin-bottom: 15px; color: #fff;"></p>
                    <input type="text" id="custom-prompt-input" style="width: 100%; padding: 10px; margin-bottom: 25px; border-radius: 5px; border: 1px solid #ccc; font-size: 1.1rem; box-sizing: border-box;" placeholder="Mật khẩu phòng...">
                    <div style="display: flex; gap: 10px;">
                        <button id="custom-prompt-btn-no" style="flex: 1; background: #555; border: 2px solid #fff; color: #fff; font-weight: bold; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 1.1rem;">HỦY BỎ</button>
                        <button id="custom-prompt-btn-yes" style="flex: 1; background: linear-gradient(to bottom, #4CAF50, #2E7D32); border: 2px solid #fff; color: #fff; font-weight: bold; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 1.1rem; box-shadow: 0 0 10px rgba(76,175,80,0.5);">XÁC NHẬN</button>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
        }
        let overlay = document.getElementById('custom-prompt-overlay'); let input = document.getElementById('custom-prompt-input');
        document.getElementById('custom-prompt-message').innerText = message; input.value = ''; 
        let btnYes = document.getElementById('custom-prompt-btn-yes'); let btnNo = document.getElementById('custom-prompt-btn-no');
        let newBtnYes = btnYes.cloneNode(true); btnYes.parentNode.replaceChild(newBtnYes, btnYes); let newBtnNo = btnNo.cloneNode(true); btnNo.parentNode.replaceChild(newBtnNo, btnNo);
        newBtnYes.addEventListener('click', () => { if(window.playSoundInternal) window.playSoundInternal('select'); overlay.classList.add('hidden'); if(onConfirm) onConfirm(input.value); });
        newBtnNo.addEventListener('click', () => { if(window.playSoundInternal) window.playSoundInternal('select'); overlay.classList.add('hidden'); });
        overlay.classList.remove('hidden'); input.focus();
    };
    window.PvP = {
        roomId: null, playerRole: null, 
        hp: 100, maxHp: 100, shield: 0,
        oppHp: 100, oppShield: 0,
        board: [], selectedTile: null, isProcessing: false,
        comboCount: 0, roomRef: null, lobbyRef: null,
        
        currentTurn: null, extraTurn: false,
        turnTimer: null, turnTimeRemaining: 15,
        roomBet: 0, isGameOver: false, 

        openLobby: function() {
            let accId = localStorage.getItem('pikachu_account_id');
            if (!accId) { window.showCustomAlertInternal("Vui lòng đăng nhập để vào Võ Đài!"); return; }
            if (typeof window.firebase === 'undefined' || !window.firebase.database) { window.showCustomAlertInternal("Mất kết nối mạng!"); return; }
            if (this.lobbyRef) this.lobbyRef.off();
            if (this.roomRef) this.roomRef.off();
            if (this.turnTimer) clearInterval(this.turnTimer);
            this.roomId = null; 
            this.playerRole = null; 
            this.isGameOver = false;
            this.board = []; 
            this.hp = this.maxHp; 
            this.oppHp = this.maxHp;
            this.shield = 0; 
            this.oppShield = 0; 
            this.comboCount = 0; 
            this.isProcessing = false;
            this.extraTurn = false;

            let mMenu = document.getElementById('main-menu-overlay'); if (mMenu) mMenu.classList.add('hidden');
            this.renderLobbyUI(); this.listenToRooms();
        },

        renderLobbyUI: function() {
            let wrap = document.getElementById('pvp-overlay-wrap'); if (wrap) wrap.remove();
            let myCoins = parseInt(localStorage.getItem('pikachu_coins')) || 0;

            const html = `
            <div id="pvp-overlay-wrap" class="modal-overlay" style="z-index: 10000000; backdrop-filter: blur(10px); background: rgba(0,0,0,0.9);">
                <div class="modal-content" style="max-width: 600px; width: 95%; border: 4px solid #d4af37; padding: 20px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; border-bottom: 2px solid #555; padding-bottom: 10px;">
                        <h2 style="color: #ffd700; margin: 0; text-shadow: 2px 2px 0 #000;">⚔️ SẢNH VÕ ĐÀI</h2>
                        <div style="color: #00ffff; font-weight: bold; font-size: 1.1rem;">Túi: ${myCoins} 💎</div>
                    </div>
                    <div id="pvp-room-list" class="pvp-room-list"><div style="text-align: center; color: #aaa; padding: 20px;">Đang tải danh sách phòng...</div></div>
                    <div style="display: flex; gap: 10px; margin-top: 20px;">
                        <button onclick="PvP.closeLobby()" style="flex: 1; background: #555; color: #fff; border: 2px solid #fff; padding: 12px; border-radius: 8px; cursor: pointer; font-weight: bold;">⬅️ QUAY LẠI</button>
                        <button onclick="PvP.showCreateRoomModal()" style="flex: 1; background: linear-gradient(to bottom, #ff9800, #e65100); border: 2px solid #fff; color: #fff; font-weight: bold; padding: 12px; border-radius: 8px; cursor: pointer; box-shadow: 0 0 10px rgba(255,152,0,0.5);">➕ TẠO PHÒNG</button>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
        },

        closeLobby: function() {
            if (this.lobbyRef) this.lobbyRef.off();
            let wrap = document.getElementById('pvp-overlay-wrap'); if(wrap) wrap.remove();
            let mMenu = document.getElementById('main-menu-overlay'); if (mMenu) mMenu.classList.remove('hidden');
        },

        listenToRooms: function() {
            let db = window.firebase.database(); let myAccId = localStorage.getItem('pikachu_account_id');
            this.lobbyRef = db.ref('pvp_rooms');
            
            this.lobbyRef.on('value', snap => {
                let listEl = document.getElementById('pvp-room-list'); if (!listEl) return; listEl.innerHTML = '';
                let hasRoom = false;

                if (snap.exists()) {
                    snap.forEach(child => {
                        let room = child.val(); let rKey = child.key;
                        if (this.roomId === null) {
                            if (room.host && room.host.id === myAccId) { db.ref('pvp_rooms/' + rKey).remove(); return; }
                            if (room.guest && room.guest.id === myAccId) { db.ref('pvp_rooms/' + rKey + '/guest').remove(); }
                        }

                        if (room.status === 'waiting' || room.status === 'ready') {
                            hasRoom = true; let hasPass = room.password && room.password !== ''; let playerCount = room.guest ? '2/2' : '1/2';
                            let btnHtml = room.guest ? `<button class="pvp-btn-join" disabled>Đã Đầy</button>` : `<button class="pvp-btn-join" onclick="PvP.joinRoom('${rKey}', ${room.bet}, ${hasPass})">THAM GIA</button>`;
                            listEl.innerHTML += `
                            <div class="pvp-room-item">
                                <div>
                                    <div style="font-weight: bold; font-size: 1.1rem;">Phòng của ${room.host.name} ${hasPass ? '🔒' : '🔓'}</div>
                                    <div style="font-size: 0.9rem; color: #00ffff;">Cược: ${room.bet} 💎 | Người: ${playerCount}</div>
                                </div>
                                <div>${btnHtml}</div>
                            </div>`;
                        }
                    });
                }
                if (!hasRoom) { listEl.innerHTML = `<div style="text-align: center; color: #aaa; padding: 20px;">Hiện tại không có phòng nào. Hãy tự tạo phòng!</div>`; }
            });
        },

        showCreateRoomModal: function() {
            let myCoins = parseInt(localStorage.getItem('pikachu_coins')) || 0;
            const html = `
            <div id="pvp-create-overlay" class="modal-overlay" style="z-index: 100000000; backdrop-filter: blur(5px);">
                <div class="modal-content" style="border: 3px solid #ff9800; max-width: 350px;">
                    <h2 style="color: #ff9800; margin-bottom: 15px;">TẠO PHÒNG</h2>
                    <div style="text-align: left; margin-bottom: 10px; color: #00ffff;">Linh thạch hiện có: ${myCoins}</div>
                    <input type="number" id="pvp-create-bet" placeholder="Mức cược (Linh thạch)..." min="0" max="${myCoins}" style="margin-bottom: 15px; width: 100%; padding: 8px; box-sizing: border-box;">
                    <div style="text-align: left; margin-bottom: 10px; color: #fff;">Mật khẩu (Bỏ trống nếu mở cửa):</div>
                    <input type="text" id="pvp-create-pass" placeholder="Nhập mật khẩu..." style="margin-bottom: 25px; width: 100%; padding: 8px; box-sizing: border-box;">
                    <div style="display: flex; gap: 10px;">
                        <button onclick="document.getElementById('pvp-create-overlay').remove()" style="flex: 1; background: #555; border: 2px solid #fff; font-size: 1rem; color: #fff; padding: 10px; border-radius: 5px;">HỦY</button>
                        <button onclick="PvP.confirmCreateRoom()" style="flex: 1; background: #4CAF50; border: 2px solid #fff; font-size: 1rem; color: #fff; padding: 10px; border-radius: 5px;">TẠO NGAY</button>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
        },

        confirmCreateRoom: function() {
            let myCoins = parseInt(localStorage.getItem('pikachu_coins')) || 0;
            let betInput = document.getElementById('pvp-create-bet').value;
            let passInput = document.getElementById('pvp-create-pass').value.trim();
            let bet = parseInt(betInput);
            if (isNaN(bet) || bet < 0) { window.showCustomAlertInternal("Mức cược không hợp lệ!"); return; }
            if (bet > myCoins) { window.showCustomAlertInternal("Ngươi không đủ Linh thạch để cược mức này!"); return; }

            if (window.playSoundInternal) window.playSoundInternal('select');
            document.getElementById('pvp-create-overlay').remove();
            
            let accId = localStorage.getItem('pikachu_account_id'); let myName = localStorage.getItem('pikachu_player_name') || "Đại Hiệp";
            let savedAvt = localStorage.getItem('pikachu_player_avatar'); let myAvatar = (savedAvt && !savedAvt.includes("imgur")) ? savedAvt : `https://ui-avatars.com/api/?name=${encodeURIComponent(myName)}&background=random&color=fff&size=100&bold=true`;
            let myVipPts = parseInt(localStorage.getItem('pikachu_vip_points')) || 0;

            let db = window.firebase.database(); let newRoom = db.ref('pvp_rooms').push();
            this.roomId = newRoom.key; this.playerRole = 'host'; this.roomBet = bet;

            newRoom.onDisconnect().remove();

            newRoom.set({
                status: 'waiting', createdAt: window.firebase.database.ServerValue.TIMESTAMP, bet: bet, password: passInput,
                host: { id: accId, name: myName, avatar: myAvatar, vipPts: myVipPts, coins: myCoins, hp: this.maxHp, shield: 0, ready: true }, guest: null
            }).then(() => {
                if (this.lobbyRef) this.lobbyRef.off(); this.enterWaitingRoom();
            });
        },

        joinRoom: function(rId, reqBet, hasPass) {
            let myCoins = parseInt(localStorage.getItem('pikachu_coins')) || 0;
            if (myCoins < reqBet) { window.showCustomAlertInternal(`Phòng này cược ${reqBet} Linh thạch. Ngươi không đủ tiền!`); return; }

            if (hasPass) {
                window.showCustomPromptInternal("Phòng này đã khóa. Vui lòng nhập mật khẩu:", (val) => {
                    window.firebase.database().ref('pvp_rooms/' + rId + '/password').once('value').then(snap => {
                        if (snap.val() === val.trim()) this.executeJoin(rId, reqBet);
                        else window.showCustomAlertInternal("Mật khẩu không chính xác!");
                    });
                });
            } else { this.executeJoin(rId, reqBet); }
        },

        executeJoin: function(rId, reqBet) {
            let accId = localStorage.getItem('pikachu_account_id'); let myName = localStorage.getItem('pikachu_player_name') || "Đại Hiệp";
            let savedAvt = localStorage.getItem('pikachu_player_avatar'); let myAvatar = (savedAvt && !savedAvt.includes("imgur")) ? savedAvt : `https://ui-avatars.com/api/?name=${encodeURIComponent(myName)}&background=random&color=fff&size=100&bold=true`;
            let myVipPts = parseInt(localStorage.getItem('pikachu_vip_points')) || 0; let myCoins = parseInt(localStorage.getItem('pikachu_coins')) || 0;

            this.roomId = rId; this.playerRole = 'guest'; this.roomBet = reqBet;
            let db = window.firebase.database(); let roomRef = db.ref('pvp_rooms/' + rId);

            roomRef.once('value').then(snap => {
                let room = snap.val();
                if (room && !room.guest) {
                    let guestRef = db.ref(`pvp_rooms/${rId}/guest`);
                    guestRef.onDisconnect().remove();
                    roomRef.update({
                        guest: { id: accId, name: myName, avatar: myAvatar, vipPts: myVipPts, coins: myCoins, hp: this.maxHp, shield: 0, ready: false },
                        status: 'ready'
                    }).then(() => {
                        if (this.lobbyRef) this.lobbyRef.off(); this.enterWaitingRoom();
                    });
                } else { window.showCustomAlertInternal("Phòng đã đầy hoặc không tồn tại!"); }
            });
        },

        changeBet: function() {
            let myCoins = parseInt(localStorage.getItem('pikachu_coins')) || 0;
            window.showCustomPromptInternal(`Nhập mức cược mới (Tối đa ${myCoins} 💎):`, (val) => {
                let newBet = parseInt(val);
                if (isNaN(newBet) || newBet < 0) { window.showCustomAlertInternal("Mức cược không hợp lệ!"); return; }
                if (newBet > myCoins) { window.showCustomAlertInternal("Ngươi không đủ Linh thạch để cược mức này!"); return; }
                
                let db = window.firebase.database(); let updates = { bet: newBet };
                db.ref('pvp_rooms/' + this.roomId).once('value').then(snap => {
                    let roomData = snap.val();
                    if (roomData && roomData.guest) { updates['guest/ready'] = false; }
                    db.ref('pvp_rooms/' + this.roomId).update(updates);
                    this.roomBet = newBet;
                });
            });
        },
        changePassword: function() {
            window.showCustomPromptInternal("Nhập mật khẩu mới (Để trống nếu muốn Mở khóa):", (val) => {
                window.firebase.database().ref('pvp_rooms/' + this.roomId).update({ password: val.trim() });
            });
        },
        enterWaitingRoom: function() {
            let db = window.firebase.database(); this.roomRef = db.ref('pvp_rooms/' + this.roomId);
            let wrap = document.getElementById('pvp-overlay-wrap'); if(!wrap) return;

            this.roomRef.on('value', snap => {
                if (!snap.exists()) { this.roomRef.off(); window.showCustomAlertInternal("Phòng đã bị giải tán!", () => { this.openLobby(); }); return; }
                let data = snap.val();
                this.roomBet = data.bet;
                
                if (data.status === 'playing') {
                    this.roomRef.off();
                    let myCoins = parseInt(localStorage.getItem('pikachu_coins')) || 0;
                    myCoins -= this.roomBet; localStorage.setItem('pikachu_coins', myCoins);
                    let accId = localStorage.getItem('pikachu_account_id'); db.ref('users/' + accId).update({ coins: myCoins });
                    this.buildArena(data);
                    return;
                }

                let hostHtml = this.renderWaitingPlayer(data.host, "CHỦ PHÒNG");
                let guestHtml = data.guest ? this.renderWaitingPlayer(data.guest, "KHÁCH") : `<div style="flex:1; border: 2px dashed #555; border-radius: 10px; display: flex; justify-content: center; align-items: center; color: #aaa; min-height: 150px;">Đang chờ đối thủ...</div>`;

                let actionBtnHtml = '';
                let hostControls = '';
                if (this.playerRole === 'host') {
                    hostControls = `
                    <div style="display: flex; justify-content: center; gap: 10px; margin-top: 10px;">
                        <button onclick="PvP.changeBet()" style="background: #1976D2; color: #fff; border: 1px solid #fff; border-radius: 5px; padding: 5px 15px; cursor: pointer; font-size: 0.9rem; font-weight: bold;">💰 Đổi Cược</button>
                        <button onclick="PvP.changePassword()" style="background: #9C27B0; color: #fff; border: 1px solid #fff; border-radius: 5px; padding: 5px 15px; cursor: pointer; font-size: 0.9rem; font-weight: bold;">🔑 Đổi Pass</button>
                    </div>`;
                    
                    let isGuestReady = data.guest && data.guest.ready;
                    actionBtnHtml = `<button onclick="PvP.startGame()" style="width: 100%; padding: 15px; font-size: 1.2rem; font-weight: bold; background: ${isGuestReady ? '#4CAF50' : '#555'}; color: #fff; border: 2px solid #fff; border-radius: 8px; cursor: ${isGuestReady ? 'pointer' : 'not-allowed'}; box-shadow: 0 0 10px rgba(0,0,0,0.5);">⚔️ BẮT ĐẦU TRẬN CHIẾN</button>`;
                } else {
                    let amIReady = data.guest && data.guest.ready;
                    actionBtnHtml = `<button onclick="PvP.toggleReady()" style="width: 100%; padding: 15px; font-size: 1.2rem; font-weight: bold; background: ${amIReady ? '#ff9800' : '#2196F3'}; color: #fff; border: 2px solid #fff; border-radius: 8px; cursor: pointer; box-shadow: 0 0 10px rgba(0,0,0,0.5);">${amIReady ? 'HỦY SẴN SÀNG' : '✅ SẴN SÀNG'}</button>`;
                }

                let passStatus = (data.password && data.password !== '') ? '🔒 Đã Khóa' : '🔓 Mở Cửa';

                wrap.innerHTML = `
                <div class="modal-content" style="max-width: 600px; width: 95%; border: 4px solid #ff5252; padding: 20px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <h2 style="color: #ff5252; margin: 0; text-shadow: 2px 2px 0 #000;">PHÒNG CHỜ VÕ ĐÀI</h2>
                        <div style="color: #00ffff; font-size: 1.1rem; margin-top: 5px;">Mức cược: ${data.bet} 💎 | ${passStatus}</div>
                        ${hostControls}
                    </div>
                    <div style="display: flex; gap: 15px; margin-bottom: 25px;">
                        ${hostHtml}
                        <div style="display: flex; align-items: center; font-size: 2rem; font-weight: bold; color: #ffd700; font-style: italic;">VS</div>
                        ${guestHtml}
                    </div>
                    ${actionBtnHtml}
                    <button onclick="PvP.leaveWaitingRoom()" style="width: 100%; padding: 10px; margin-top: 10px; font-size: 1rem; font-weight: bold; background: transparent; color: #ff5252; border: 2px solid #ff5252; border-radius: 8px; cursor: pointer;">RỜI PHÒNG</button>
                </div>`;
            });
        },
        renderWaitingPlayer: function(pData, title) {
            let readyBadge = pData.ready ? `<span style="background: #4CAF50; color: #fff; padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: bold; display: inline-block; width: 100px; box-sizing: border-box;">ĐÃ SẴN SÀNG</span>` : `<span style="background: #555; color: #fff; padding: 4px 10px; border-radius: 12px; font-size: 0.85rem; font-weight: bold; display: inline-block; width: 100px; box-sizing: border-box;">ĐANG CHỜ...</span>`;
            return `
            <div style="flex: 1; background: rgba(0,0,0,0.5); border: 2px solid #d4af37; border-radius: 12px; padding: 20px 10px; display: flex; flex-direction: column; justify-content: space-between; align-items: center; min-height: 220px; box-sizing: border-box;">
                <div style="color: #d4af37; font-size: 0.9rem; margin-bottom: 10px; font-weight: bold; text-transform: uppercase; letter-spacing: 1px;">${title}</div>
                <img src="${pData.avatar}" style="width: 85px; height: 85px; border-radius: 50%; border: 3px solid #fff; object-fit: cover; margin-bottom: 10px; background: #000; box-shadow: 0 0 15px rgba(255,255,255,0.2);">
                <div style="display: flex; flex-direction: column; align-items: center; gap: 5px; width: 100%;">
                    <div style="color: #fff; font-weight: bold; font-size: 1.2rem; max-width: 90%; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; text-shadow: 1px 1px 2px #000;">${pData.name}</div>
                    <div style="color: #00ffff; font-size: 0.95rem; font-weight: bold; margin-bottom: 5px;">Túi: ${pData.coins || 0} 💎</div>
                    <div style="margin-top: 5px;">${readyBadge}</div>
                </div>
            </div>`;
        },

        toggleReady: function() {
            if (window.playSoundInternal) window.playSoundInternal('select');
            let db = window.firebase.database();
            this.roomRef.once('value').then(snap => {
                let data = snap.val();
                if (data && data.guest) { db.ref(`pvp_rooms/${this.roomId}/guest`).update({ ready: !data.guest.ready }); }
            });
        },

        startGame: function() {
            let db = window.firebase.database();
            this.roomRef.once('value').then(snap => {
                let data = snap.val();
                if (data && data.guest && data.guest.ready) {
                    if (window.playSoundInternal) window.playSoundInternal('select');
                    let initialBoard = this.generateRandomBoard();
                    db.ref(`pvp_rooms/${this.roomId}`).update({ status: 'playing', currentTurn: 'host', board: initialBoard });
                } else { window.showCustomAlertInternal("Đối thủ chưa sẵn sàng!"); }
            });
        },

        leaveWaitingRoom: function() {
            if (window.playSoundInternal) window.playSoundInternal('select');
            window.showCustomConfirmInternal("Bạn có chắc chắn muốn rời phòng?", () => {
                let db = window.firebase.database();
                
                if (this.playerRole === 'host') { 
                    db.ref('pvp_rooms/' + this.roomId).onDisconnect().cancel(); 
                    db.ref('pvp_rooms/' + this.roomId).remove().then(() => this.openLobby()); 
                } 
                else { 
                    db.ref(`pvp_rooms/${this.roomId}/guest`).onDisconnect().cancel(); 
                    db.ref('pvp_rooms/' + this.roomId).update({ 
                        guest: null, 
                        status: 'waiting', 
                        board: null, 
                        currentTurn: null 
                    }).then(() => this.openLobby()); 
                }
                this.roomRef.off();
            });
        },

        generateRandomBoard: function() {
            let newBoard = [];
            for (let r = 0; r < CONFIG.ROWS; r++) {
                newBoard[r] = [];
                for (let c = 0; c < CONFIG.COLS; c++) {
                    let randomItem;
                    do { randomItem = PVP_EMOJIS[Math.floor(Math.random() * PVP_EMOJIS.length)]; } 
                    while ( (c >= 2 && newBoard[r][c-1].icon === randomItem.icon && newBoard[r][c-2].icon === randomItem.icon) || (r >= 2 && newBoard[r-1][c].icon === randomItem.icon && newBoard[r-2][c].icon === randomItem.icon) );
                    newBoard[r][c] = { ...randomItem };
                }
            }
            return newBoard;
        },

        buildArena: function(roomData) {
            let db = window.firebase.database();
            let myRoomRef = db.ref(`pvp_rooms/${this.roomId}`);
            if (this.playerRole === 'host') { myRoomRef.onDisconnect().cancel(); } else { myRoomRef.child('guest').onDisconnect().cancel(); }
            
            myRoomRef.child(this.playerRole).onDisconnect().update({ hp: 0 }); 

            let wrap = document.getElementById('pvp-overlay-wrap'); if(!wrap) return;
            this.hp = this.maxHp; this.shield = 0; this.oppHp = this.maxHp; this.oppShield = 0;
            this.comboCount = 0; this.isProcessing = false; this.extraTurn = false; this.isGameOver = false;
            this.board = roomData.board; 

            let oppData = this.playerRole === 'host' ? roomData.guest : roomData.host;
            let myData = this.playerRole === 'host' ? roomData.host : roomData.guest;

            let oppVipHtml = ''; let myVipHtml = '';
            if (window.getVipLevelInfo) {
                let oVip = window.getVipLevelInfo(oppData.vipPts || 0); oppVipHtml = `<span style="font-size:0.65rem; padding:2px 4px; border-radius:3px; font-weight:bold; background: ${oVip.color}; color: #000;">${oVip.name}</span>`;
                let mVip = window.getVipLevelInfo(myData.vipPts || 0); myVipHtml = `<span style="font-size:0.65rem; padding:2px 4px; border-radius:3px; font-weight:bold; background: ${mVip.color}; color: #000;">${mVip.name}</span>`;
            }

            wrap.innerHTML = `
            <div class="pvp-arena-container">
                <div class="pvp-info-panel pvp-opp-panel">
                    <img id="pvp-opp-avatar" src="${oppData.avatar}" class="pvp-avatar-img">
                    <div class="pvp-name-col">
                        <div class="pvp-name-row">
                            <div style="color: #fff; font-weight: bold; font-size: 1.1rem; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                ${oppData.name} <span id="pvp-opp-timer" style="color: #ffeb3b; text-shadow: 0 0 5px #ffeb3b;"></span>
                            </div>
                            <div class="pvp-badge-wrap">
                                ${oppVipHtml}
                                <span style="font-size:0.75rem; padding:2px 4px; border-radius:3px; font-weight:bold; background: rgba(0,255,255,0.2); border: 1px solid #00ffff; color: #00ffff;">${oppData.coins || 0} 💎</span>
                            </div>
                        </div>
                        <div style="width: 100%; height: 20px; background: #000; border-radius: 10px; border: 1px solid #fff; position: relative; overflow: hidden;">
                            <div id="pvp-opp-hp-text" class="hp-text-display">100 / 100</div>
                            <div id="pvp-opp-hp-bar" class="hp-bar-fill" style="width: 100%; height: 100%; background: linear-gradient(90deg, #b71c1c, #ff5252); position: absolute; top:0; left:0; z-index: 1;"></div>
                            <div id="pvp-opp-shield-bar" class="shield-bar-fill" style="width: 0%; z-index: 5;"></div>
                        </div>
                    </div>
                </div>

                <div class="pvp-center-col">
                    <div id="pvp-board" class="pvp-match3-board"></div>
                </div>

                <div class="pvp-info-panel pvp-my-panel">
                    <img id="pvp-my-avatar" src="${myData.avatar}" class="pvp-avatar-img">
                    <div class="pvp-name-col">
                        <div class="pvp-name-row reverse">
                            <div style="color: #fff; font-weight: bold; font-size: 1.1rem; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">
                                Bản thân <span id="pvp-my-timer" style="color: #ffeb3b; text-shadow: 0 0 5px #ffeb3b;"></span>
                            </div>
                            <div class="pvp-badge-wrap reverse">
                                ${myVipHtml}
                                <span style="font-size:0.75rem; padding:2px 4px; border-radius:3px; font-weight:bold; background: rgba(0,255,255,0.2); border: 1px solid #00ffff; color: #00ffff;">${myData.coins || 0} 💎</span>
                            </div>
                        </div>
                        <div style="width: 100%; height: 20px; background: #000; border-radius: 10px; border: 1px solid #fff; position: relative; overflow: hidden; margin-bottom: 5px;">
                            <div id="pvp-my-hp-text" class="hp-text-display">100 / 100</div>
                            <div id="pvp-my-hp-bar" class="hp-bar-fill" style="width: 100%; height: 100%; background: linear-gradient(90deg, #1b5e20, #4caf50); position: absolute; top:0; left:0; z-index: 1;"></div>
                            <div id="pvp-my-shield-bar" class="shield-bar-fill" style="width: 0%; z-index: 5;"></div>
                        </div>
                        <button onclick="PvP.surrender()" style="background: linear-gradient(to right, #b71c1c, #d32f2f); border: 2px solid #fff; color: #fff; font-weight: bold; padding: 5px; border-radius: 8px; cursor: pointer; width: 100%; font-size: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.5);">🏳️ ĐẦU HÀNG</button>
                    </div>
                </div>

            </div>`;

            this.drawGrid(); this.setupSync();
        },

        surrender: function() {
            window.showCustomConfirmInternal("Đại hiệp có chắc chắn muốn bỏ chạy? Bạn sẽ mất toàn bộ tiền cược!", () => {
                if (this.roomId && this.playerRole) { window.firebase.database().ref(`pvp_rooms/${this.roomId}/${this.playerRole}`).update({ hp: 0 }); }
            });
        },

        startTurnTimer: function() {
            if (this.turnTimer) clearInterval(this.turnTimer); this.turnTimeRemaining = 15; this.updateTimerUI();
            this.turnTimer = setInterval(() => {
                if (this.isProcessing) return; this.turnTimeRemaining--; this.updateTimerUI();
                if (this.turnTimeRemaining <= 0) { clearInterval(this.turnTimer); if (this.currentTurn === this.playerRole) { this.popText("HẾT GIỜ!", "#ff5252"); this.passTurn(); } }
            }, 1000);
        },

        updateTimerUI: function() {
            let myTimer = document.getElementById('pvp-my-timer'); let oppTimer = document.getElementById('pvp-opp-timer');
            let myAvt = document.getElementById('pvp-my-avatar'); let oppAvt = document.getElementById('pvp-opp-avatar');

            if (this.currentTurn === this.playerRole) {
                if (myTimer) myTimer.innerText = `(${this.turnTimeRemaining}s)`; if (oppTimer) oppTimer.innerText = '';
                if (myAvt) { myAvt.style.borderColor = '#ffeb3b'; myAvt.style.boxShadow = '0 0 15px #ffeb3b'; }
                if (oppAvt) { oppAvt.style.borderColor = '#555'; oppAvt.style.boxShadow = 'none'; }
            } else {
                if (myTimer) myTimer.innerText = ''; if (oppTimer) oppTimer.innerText = `(${this.turnTimeRemaining}s)`;
                if (oppAvt) { oppAvt.style.borderColor = '#ffeb3b'; oppAvt.style.boxShadow = '0 0 15px #ffeb3b'; }
                if (myAvt) { myAvt.style.borderColor = '#555'; myAvt.style.boxShadow = 'none'; }
            }
        },

        passTurn: function() {
            let nextTurn = this.playerRole === 'host' ? 'guest' : 'host';
            window.firebase.database().ref('pvp_rooms/' + this.roomId).update({ currentTurn: nextTurn, board: this.board });
        },

        drawGrid: function() {
            const boardEl = document.getElementById('pvp-board'); if(!boardEl) return; boardEl.innerHTML = '';
            for (let r = 0; r < CONFIG.ROWS; r++) {
                for (let c = 0; c < CONFIG.COLS; c++) {
                    let tile = document.createElement('div');
                    tile.className = 'pvp-tile-m3'; tile.dataset.r = r; tile.dataset.c = c;
                    tile.innerText = this.board[r] && this.board[r][c] ? this.board[r][c].icon : '';
                    tile.onclick = () => this.handleTileSelect(r, c, tile); boardEl.appendChild(tile);
                }
            }
        },

        handleTileSelect: function(r, c, tileEl) {
            if (this.currentTurn !== this.playerRole || this.isProcessing || this.turnTimeRemaining <= 0) return;
            if (window.playSoundInternal) window.playSoundInternal('select');

            if (!this.selectedTile) { this.selectedTile = { r, c, el: tileEl }; tileEl.classList.add('selected'); } 
            else {
                let sr = this.selectedTile.r, sc = this.selectedTile.c; this.selectedTile.el.classList.remove('selected');
                let isAdjacent = (Math.abs(sr - r) + Math.abs(sc - c) === 1);

                if (isAdjacent) {
                    this.isProcessing = true; let temp = this.board[sr][sc]; this.board[sr][sc] = this.board[r][c]; this.board[r][c] = temp; this.drawGrid();
                    let matches = this.findMatches();
                    if (matches.length > 0) { this.comboCount = 0; this.processMatches(matches); } 
                    else {
                        if (window.playSoundInternal) window.playSoundInternal('error');
                        setTimeout(() => { let tempBack = this.board[sr][sc]; this.board[sr][sc] = this.board[r][c]; this.board[r][c] = tempBack; this.drawGrid(); this.isProcessing = false; }, 300);
                    }
                } else { this.selectedTile = { r, c, el: tileEl }; tileEl.classList.add('selected'); return; }
                this.selectedTile = null;
            }
        },

        findMatches: function() {
            let matchedCoords = new Set();
            for (let r = 0; r < CONFIG.ROWS; r++) {
                for (let c = 0; c < CONFIG.COLS - 2; c++) {
                    if (!this.board[r] || !this.board[r][c] || !this.board[r][c+1] || !this.board[r][c+2]) continue;
                    let type = this.board[r][c].icon;
                    if (type && type === this.board[r][c+1].icon && type === this.board[r][c+2].icon) {
                        matchedCoords.add(`${r},${c}`); matchedCoords.add(`${r},${c+1}`); matchedCoords.add(`${r},${c+2}`);
                        let k = c + 3; while(k < CONFIG.COLS && this.board[r][k] && this.board[r][k].icon === type) { matchedCoords.add(`${r},${k}`); k++; }
                    }
                }
            }
            for (let c = 0; c < CONFIG.COLS; c++) {
                for (let r = 0; r < CONFIG.ROWS - 2; r++) {
                    if (!this.board[r] || !this.board[r+1] || !this.board[r+2] || !this.board[r][c] || !this.board[r+1][c] || !this.board[r+2][c]) continue;
                    let type = this.board[r][c].icon;
                    if (type && type === this.board[r+1][c].icon && type === this.board[r+2][c].icon) {
                        matchedCoords.add(`${r},${c}`); matchedCoords.add(`${r+1},${c}`); matchedCoords.add(`${r+2},${c}`);
                        let k = r + 3; while(k < CONFIG.ROWS && this.board[k] && this.board[k][c] && this.board[k][c].icon === type) { matchedCoords.add(`${k},${c}`); k++; }
                    }
                }
            }
            return Array.from(matchedCoords).map(str => { let parts = str.split(','); return { r: parseInt(parts[0]), c: parseInt(parts[1]) }; });
        },

        processMatches: function(matches) {
            if (window.playSoundInternal) window.playSoundInternal('match'); this.comboCount++;
            
            let dictCount = {};
            matches.forEach(m => { 
                let item = this.board[m.r] && this.board[m.r][m.c]; 
                if (!item) return;
                if (!dictCount[item.icon]) dictCount[item.icon] = { count: 0, item: item }; 
                dictCount[item.icon].count++; 
            });

            let totalDmg = 0; let totalHeal = 0; let totalShield = 0; let isFrozen = false;

            for (let icon in dictCount) {
                let data = dictCount[icon]; let totalValue = data.count * data.item.value; 
                if (this.comboCount > 1) { totalValue = Math.floor(totalValue * (1 + (this.comboCount - 1) * 0.1)); }
                if (data.item.type === 'attack') totalDmg += totalValue; else if (data.item.type === 'defense') totalShield += totalValue; else if (data.item.type === 'heal') totalHeal += totalValue; else if (data.item.type === 'freeze') isFrozen = true;
            }

            this.applySkills(totalDmg, totalHeal, totalShield, isFrozen);
            let boardEl = document.getElementById('pvp-board');
            matches.forEach(m => { let tile = boardEl.children[m.r * CONFIG.COLS + m.c]; if (tile) tile.classList.add('explode'); });

            setTimeout(() => { matches.forEach(m => { if (this.board[m.r]) this.board[m.r][m.c] = null; }); this.applyGravity(); }, 300);
        },

        applySkills: function(dmg, heal, shield, freeze) {
            let db = window.firebase.database(); let oppRole = this.playerRole === 'host' ? 'guest' : 'host'; let updateSelf = false;

            if (heal > 0) { this.hp = Math.min(this.maxHp, this.hp + heal); this.popText(`+${heal} HP`, '#00e676'); updateSelf = true; }
            if (shield > 0) {
                let oldShield = this.shield; this.shield = Math.min(100, this.shield + shield);
                let added = this.shield - oldShield; if (added > 0) { this.popText(`+${added} Giáp`, '#00e5ff'); updateSelf = true; }
            }
            if (updateSelf) db.ref(`pvp_rooms/${this.roomId}/${this.playerRole}`).update({ hp: this.hp, shield: this.shield });
            if (freeze) { this.extraTurn = true; this.popText(`Băng❄️! Thêm Lượt!`, '#00ffff'); }

            if (dmg > 0) {
                this.popText(`-${dmg} DMG!`, '#ff5252');
                let currentOppShield = this.oppShield; let currentOppHp = this.oppHp;
                if (currentOppShield > 0) {
                    if (currentOppShield >= dmg) currentOppShield -= dmg;
                    else { dmg -= currentOppShield; currentOppShield = 0; currentOppHp -= dmg; }
                } else { currentOppHp -= dmg; }

                this.oppHp = currentOppHp; this.oppShield = currentOppShield;
                db.ref(`pvp_rooms/${this.roomId}/${oppRole}`).update({ hp: currentOppHp, shield: currentOppShield });
            }
        },

        applyGravity: function() {
            for (let c = 0; c < CONFIG.COLS; c++) {
                let colData = []; 
                for (let r = 0; r < CONFIG.ROWS; r++) { if (this.board[r] && this.board[r][c]) colData.push(this.board[r][c]); }
                while (colData.length < CONFIG.ROWS) { colData.unshift({ ...PVP_EMOJIS[Math.floor(Math.random() * PVP_EMOJIS.length)] }); }
                for (let r = 0; r < CONFIG.ROWS; r++) { this.board[r][c] = colData[r]; }
            }
            this.drawGrid(); window.firebase.database().ref('pvp_rooms/' + this.roomId).update({ board: this.board });

            setTimeout(() => {
                let newMatches = this.findMatches();
                if (newMatches.length > 0) { if (this.comboCount > 0) this.popText(`COMBO x${this.comboCount + 1}!`, '#ffeb3b'); this.processMatches(newMatches); } 
                else {
                    this.isProcessing = false;
                    if (this.currentTurn === this.playerRole) {
                        if (this.extraTurn) { this.popText("THÊM LƯỢT!", "#00ffff"); this.extraTurn = false; this.startTurnTimer(); } 
                        else { this.passTurn(); }
                    }
                }
            }, 300);
        },

        setupSync: function() {
            let db = window.firebase.database(); let oppRole = this.playerRole === 'host' ? 'guest' : 'host';
            this.roomRef = db.ref('pvp_rooms/' + this.roomId);
            
            this.roomRef.on('value', snap => {
                if(!snap.exists()) { this.closeArena("Phòng đã bị giải tán!"); return; }
                let data = snap.val();

                if (data.board) { if (this.currentTurn !== this.playerRole || this.board.length === 0) { this.board = data.board; this.drawGrid(); } }

                if (data.currentTurn) {
                    let isTurnChanged = (this.currentTurn !== data.currentTurn);
                    this.currentTurn = data.currentTurn;
                    let board = document.getElementById('pvp-board');
                    if (board) { if (this.currentTurn === this.playerRole) { board.style.opacity = "1"; board.style.pointerEvents = "auto"; } else { board.style.opacity = "0.5"; board.style.pointerEvents = "none"; } }
                    if (isTurnChanged || !this.turnTimer) { this.startTurnTimer(); }
                }

                if (data[oppRole]) {
                    this.oppHp = data[oppRole].hp; this.oppShield = data[oppRole].shield || 0;
                    let txt = document.getElementById('pvp-opp-hp-text'); if(txt) txt.innerText = `${this.oppHp} / ${this.maxHp}`;
                    let bar = document.getElementById('pvp-opp-hp-bar'); if(bar) bar.style.width = (this.oppHp / this.maxHp * 100) + '%';
                    let sbar = document.getElementById('pvp-opp-shield-bar'); if(sbar) sbar.style.width = Math.min(100, (this.oppShield / this.maxHp * 100)) + '%';
                    
                    if(this.oppHp <= 0) { this.declareWin(); return; }
                }

                if (data[this.playerRole]) {
                    this.hp = data[this.playerRole].hp; this.shield = data[this.playerRole].shield || 0;
                    let txt = document.getElementById('pvp-my-hp-text'); if(txt) txt.innerText = `${this.hp} / ${this.maxHp}`;
                    let bar = document.getElementById('pvp-my-hp-bar'); if(bar) bar.style.width = (this.hp / this.maxHp * 100) + '%';
                    let sbar = document.getElementById('pvp-my-shield-bar'); if(sbar) sbar.style.width = Math.min(100, (this.shield / this.maxHp * 100)) + '%';
                    
                    if(this.hp <= 0) { this.declareLose(); return; }
                }
            });
        },

        popText: function(text, color) {
            let floatEl = document.createElement('div'); floatEl.className = 'dmg-text'; floatEl.innerText = text; floatEl.style.color = color;
            floatEl.style.top = '40%'; floatEl.style.left = '50%'; floatEl.style.transform = 'translate(-50%, -50%)';
            let wrap = document.getElementById('pvp-overlay-wrap'); if (wrap) wrap.appendChild(floatEl);
            setTimeout(() => { if (floatEl) floatEl.remove(); }, 1000);
        },

        declareWin: function() {
            if (this.isGameOver) return; this.isGameOver = true;
            this.roomRef.off(); if (this.turnTimer) clearInterval(this.turnTimer);
            if(window.playSoundInternal) window.playSoundInternal('win');
            let myCoins = parseInt(localStorage.getItem('pikachu_coins')) || 0;
            let winAmount = this.roomBet * 2; myCoins += winAmount;
            localStorage.setItem('pikachu_coins', myCoins);
            let accId = localStorage.getItem('pikachu_account_id');
            let db = window.firebase.database();
            db.ref('users/' + accId).update({ coins: myCoins });

            window.showCustomAlertInternal(`🏆 TUYỆT VỜI! Đối thủ đã gục ngã.\nBạn nhận được ${winAmount} 💎 Linh Thạch!`, () => {
                let myName = localStorage.getItem('pikachu_player_name') || "Đại Hiệp";
                let savedAvt = localStorage.getItem('pikachu_player_avatar');
                let myAvatar = (savedAvt && !savedAvt.includes("imgur")) ? savedAvt : `https://ui-avatars.com/api/?name=${encodeURIComponent(myName)}&background=random&color=fff&size=100&bold=true`;
                let myVipPts = parseInt(localStorage.getItem('pikachu_vip_points')) || 0;

                let wrap = document.getElementById('pvp-overlay-wrap'); if(wrap) wrap.innerHTML = '';
                
                this.playerRole = 'host'; 
                this.hp = this.maxHp; this.shield = 0;
                
                let newRoomRef = db.ref('pvp_rooms/' + this.roomId);
                newRoomRef.onDisconnect().cancel(); 
                newRoomRef.onDisconnect().remove(); 
                
                newRoomRef.set({
                    status: 'waiting', createdAt: window.firebase.database.ServerValue.TIMESTAMP, bet: this.roomBet, password: '', 
                    host: { id: accId, name: myName, avatar: myAvatar, vipPts: myVipPts, coins: myCoins, hp: this.maxHp, shield: 0, ready: true }, guest: null
                }).then(() => { this.enterWaitingRoom(); });
            });
        },

        declareLose: function() {
            if (this.isGameOver) return; this.isGameOver = true;
            this.roomRef.off(); if (this.turnTimer) clearInterval(this.turnTimer);
            if(window.playSoundInternal) window.playSoundInternal('lose');
            
            window.firebase.database().ref(`pvp_rooms/${this.roomId}/${this.playerRole}`).onDisconnect().cancel();
            window.showCustomAlertInternal(`💀 THẤT BẠI!\nBạn đã mất ${this.roomBet} 💎 Linh Thạch cược.`, () => { this.closeArena(); });
        },

      closeArena: function(msg) {
            if(msg) window.showCustomAlertInternal(msg);
            if (this.turnTimer) clearInterval(this.turnTimer);
            
           
            if (this.roomId) {
                try { 
                    window.firebase.database().ref('pvp_rooms/' + this.roomId + '/board').remove(); 
                    window.firebase.database().ref('pvp_rooms/' + this.roomId + '/currentTurn').remove();
                } catch(e){}
            }

           
            let boardEl = document.getElementById('pvp-board');
            if (boardEl) boardEl.innerHTML = '';

          
            this.board = [];
            this.roomId = null;
            this.playerRole = null;

           
            let wrap = document.getElementById('pvp-overlay-wrap'); if(wrap) wrap.remove();
            let mMenu = document.getElementById('main-menu-overlay'); if (mMenu) mMenu.classList.remove('hidden');
        }
    };
})();