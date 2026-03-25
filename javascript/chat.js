/* ========================================================
 * TÁC GIẢ: BỞI VĂN CƯỜNG (CODE BY VANCUONG)
 * BẢN QUYỀN: ĐỘC QUYỀN SERVER TU TIÊN PIKACHU
 * CẢNH BÁO: Mọi hành vi sao chép không xin phép đều là vi phạm!
 ======================================================== */
(function() {
    setInterval(() => {
        let actionWrap = document.querySelector('.mm-actions'); 
        if (actionWrap && !document.getElementById('btn-menu-chat')) {
            let chatBtn = document.createElement('button');
            chatBtn.id = 'btn-menu-chat';
            chatBtn.innerHTML = '🎐 Truyền Âm';
            chatBtn.style.cssText = "background: linear-gradient(to bottom, #004d40, #00251a); border: 1px solid #00ffff; color: #00ffff; padding: 4px 10px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.85rem; box-shadow: 0 0 8px rgba(0, 255, 255, 0.5); transition: all 0.2s; text-shadow: 1px 1px 2px #000; display: flex; align-items: center; gap: 3px;";
            
            chatBtn.onmouseover = () => { chatBtn.style.transform = "scale(1.05)"; chatBtn.style.boxShadow = "0 0 15px rgba(0, 255, 255, 0.8)"; chatBtn.style.background = "linear-gradient(to bottom, #00695c, #003324)"; };
            chatBtn.onmouseleave = () => { chatBtn.style.transform = "scale(1)"; chatBtn.style.boxShadow = "0 0 8px rgba(0, 255, 255, 0.5)"; chatBtn.style.background = "linear-gradient(to bottom, #004d40, #00251a)"; };

            chatBtn.onclick = () => { 
                if(window.playSoundInternal) window.playSoundInternal('select'); 
                ChatSystem.openLobby(); 
            };
            
            actionWrap.insertBefore(chatBtn, actionWrap.firstChild);
        }
    }, 1000);

    if (!document.getElementById('chat-system-styles')) {
        let style = document.createElement('style'); style.id = 'chat-system-styles';
        style.innerHTML = `
            .chat-modal-content { width: 95%; max-width: 550px; max-height: 95dvh; margin: auto; padding: clamp(15px, 3vw, 25px); box-sizing: border-box; background: linear-gradient(135deg, #1f140e 0%, #0a0604 100%); border: 4px solid #d4af37; border-radius: 15px; box-shadow: 0 0 30px rgba(212, 175, 55, 0.3), inset 0 0 20px rgba(0,0,0,0.9); display: flex; flex-direction: column; position: relative; overflow: hidden; }
            .chat-modal-content::before { content: ''; position: absolute; top: 0; left: 0; right: 0; bottom: 0; background: radial-gradient(circle at center, rgba(212, 175, 55, 0.05) 0%, transparent 70%); pointer-events: none; z-index: 0; }
            .chat-main-title { flex: 0 0 auto; color: #ffd700; margin-bottom: clamp(10px, 2vh, 20px); font-size: clamp(1.5rem, 5vw, 2.2rem); text-align: center; text-shadow: 0 0 15px rgba(212, 175, 55, 0.8), 2px 2px 4px #000; font-family: 'Courier New', Courier, monospace; letter-spacing: 3px; z-index: 1; }
            .chat-tabs-wrap { flex: 0 0 auto; display: flex; width: 100%; border-bottom: 2px solid #d4af37; z-index: 1; }
            .chat-tab-btn { flex: 1; padding: clamp(8px, 1.5vh, 12px); background: linear-gradient(to bottom, #2b1f1a, #160e0a); color: #8d6e63; border: 2px solid #5d4037; cursor: pointer; font-weight: bold; border-radius: 12px 12px 0 0; transition: 0.3s; border-bottom: none; font-size: clamp(0.85rem, 3vw, 1rem); font-family: 'Times New Roman', serif; text-shadow: 1px 1px 2px #000; }
            .chat-tab-btn:hover:not(.active) { color: #d4af37; background: linear-gradient(to bottom, #3e2723, #1f140e); }
            .chat-tab-btn.active { background: linear-gradient(to bottom, #004d40, #00251a); color: #00ffff; border-color: #00e5ff; box-shadow: 0 -5px 15px rgba(0, 229, 255, 0.3); text-shadow: 0 0 10px #00ffff; }
            
            .chat-msg-box { height: 360px; max-height: 45vh; display: flex; flex-direction: column; gap: 15px; overflow-y: auto; background: rgba(0, 0, 0, 0.75); padding: 15px; border-radius: 0 0 12px 12px; border: 2px solid #8b6b22; box-shadow: inset 0 0 20px rgba(0,0,0,0.9); z-index: 1; }
            .chat-msg-box::-webkit-scrollbar { width: 8px; }
            .chat-msg-box::-webkit-scrollbar-track { background: #1a100b; border-radius: 4px; }
            .chat-msg-box::-webkit-scrollbar-thumb { background: #8b6b22; border-radius: 4px; border: 1px solid #d4af37; }
            
            .chat-item { display: flex; gap: 12px; margin-bottom: 5px; align-items: flex-start; }
            .chat-item.me { flex-direction: row-reverse; }
            .chat-bubble { max-width: 75%; padding: 10px 15px; border-radius: 12px; color: #fff; font-size: clamp(0.85rem, 3vw, 0.95rem); word-break: break-word; text-align: left; line-height: 1.5; box-shadow: 0 4px 6px rgba(0,0,0,0.6); position: relative; }
            .chat-item.me .chat-bubble { background: linear-gradient(135deg, #00695c 0%, #00332a 100%); border: 1px solid #00e5ff; box-shadow: 0 0 12px rgba(0, 229, 255, 0.3); border-top-right-radius: 2px; }
            .chat-item.other .chat-bubble { background: linear-gradient(135deg, #4e342e 0%, #261713 100%); border: 1px solid #d4af37; box-shadow: 0 0 10px rgba(212, 175, 55, 0.2); border-top-left-radius: 2px; }
            
            .chat-sys-msg { text-align: center; color: #ffd700; font-size: 0.85rem; width: 100%; margin: 10px 0; text-shadow: 0 0 5px #ffd700; padding: 8px; background: rgba(212, 175, 55, 0.1); border-radius: 20px; border: 1px dashed #d4af37; box-sizing: border-box; }
            
            .chat-input-area { flex: 0 0 auto; display: flex; width: 100%; gap: 10px; margin-top: clamp(10px, 2vh, 15px); box-sizing: border-box; z-index: 1; }
            .chat-inp { flex: 1; min-width: 0; padding: 10px; border-radius: 8px; border: 2px solid #8b6b22; background: rgba(0,0,0,0.8); color: #00ffff; outline: none; font-size: clamp(0.9rem, 3vw, 1.05rem); box-sizing: border-box; transition: 0.3s; font-family: 'Times New Roman', serif; }
            .chat-inp::placeholder { color: #666; font-style: italic; }
            .chat-inp:focus { border-color: #00e5ff; box-shadow: 0 0 12px rgba(0, 229, 255, 0.6); background: rgba(0, 30, 30, 0.9); }
            .chat-inp:disabled { border-color: #444; background: #111; color: #555; cursor: not-allowed; }
            
            .chat-send-btn { flex: 0 0 clamp(80px, 20vw, 120px); background: linear-gradient(to bottom, #d4af37, #8b6b22); color: #000; border: 2px solid #fff; font-weight: bold; border-radius: 8px; cursor: pointer; transition: 0.2s; box-sizing: border-box; font-family: 'Times New Roman', serif; font-size: clamp(0.9rem, 3vw, 1.1rem); text-shadow: 1px 1px 0 rgba(255,255,255,0.6); box-shadow: 0 4px 6px rgba(0,0,0,0.5); }
            .chat-send-btn:hover:not(:disabled) { filter: brightness(1.2); box-shadow: 0 0 20px rgba(212, 175, 55, 0.8); transform: translateY(-2px); }
            .chat-send-btn:active:not(:disabled) { transform: translateY(1px); }
            .chat-send-btn:disabled { background: #3e2723; border-color: #555; cursor: not-allowed; color: #888; text-shadow: none; box-shadow: none; }
            
            .friend-chat-item { display: flex; align-items: center; justify-content: space-between; background: linear-gradient(90deg, rgba(26, 15, 7, 0.9), rgba(0,0,0,0.6)); padding: 10px; border: 1px solid #8b6b22; border-left: 4px solid #8b6b22; border-radius: 8px; cursor: pointer; transition: all 0.2s; margin-bottom: 10px; box-shadow: 0 2px 5px rgba(0,0,0,0.6); }
            .friend-chat-item:hover { background: linear-gradient(90deg, rgba(62, 39, 35, 0.9), rgba(26,15,7,0.8)); border-color: #d4af37; border-left-color: #ffd700; transform: translateX(5px); box-shadow: 0 0 15px rgba(212, 175, 55, 0.3); }
            .friend-avt { width: clamp(35px, 10vw, 45px); height: clamp(35px, 10vw, 45px); border-radius: 50%; border: 2px solid #d4af37; object-fit: cover; box-shadow: 0 0 8px rgba(212, 175, 55, 0.5); background: #000; }
            .friend-name { color: #ffd700; font-weight: bold; font-size: clamp(0.95rem, 4vw, 1.15rem); text-shadow: 1px 1px 2px #000; }
            .talisman-btn { background: linear-gradient(to right, #004d40, #00695c); border: 1px solid #00e5ff; padding: 4px 8px; border-radius: 8px; color: #00ffff; font-size: clamp(0.7rem, 2.5vw, 0.85rem); font-weight: bold; box-shadow: 0 0 10px rgba(0, 229, 255, 0.3); pointer-events: none; white-space: nowrap; }

            .chat-close-btn { flex: 0 0 auto; margin-top: clamp(10px, 2vh, 20px); background: linear-gradient(to bottom, #8b0000, #4a0000); border: 2px solid #ff5252; color: #fff; font-weight: bold; padding: clamp(8px, 1.5vh, 12px); border-radius: 8px; cursor: pointer; font-size: clamp(1rem, 4vw, 1.2rem); width: 100%; text-shadow: 1px 1px 2px #000; box-shadow: 0 5px 10px rgba(0,0,0,0.5); transition: 0.2s; z-index: 1; }
            .chat-x-btn { position: absolute; top: 12px; right: 15px; background: transparent; border: none; color: #ff5252; font-size: 2.2rem; font-weight: bold; font-family: sans-serif; cursor: pointer; z-index: 10; transition: all 0.3s ease; text-shadow: 2px 2px 4px #000; padding: 0; line-height: 1; }
            .chat-x-btn:hover { color: #ff1744; transform: scale(1.2) rotate(90deg); text-shadow: 0 0 15px #ff5252; }

            /* CHÓP SÁNG TÊN CỰC ĐẸP */
            @keyframes text-glow-anim { 0% { text-shadow: 0 0 5px var(--vip-color), 1px 1px 2px #000; } 100% { text-shadow: 0 0 20px var(--vip-color), 0 0 30px #fff, 1px 1px 2px #000; } }
            .vip-glow-text { animation: text-glow-anim 0.8s alternate infinite ease-in-out; }
        `;
        document.head.appendChild(style);
    }

    window.ChatSystem = {
        myId: null, myName: null, myAvt: null, myVipLevel: 0, myVipName: '', myVipColor: '', 
        isAdmin: false, currentTab: 'world', currentPrivateRoom: null, activeRef: null,

        openLobby: function() {
            this.myId = localStorage.getItem('pikachu_account_id');
            if (!this.myId) { if(window.showCustomAlertInternal) window.showCustomAlertInternal("Vui lòng đăng nhập!"); return; }
            if (typeof window.firebase === 'undefined' || !window.firebase.database) { if(window.showCustomAlertInternal) window.showCustomAlertInternal("Lỗi kết nối mạng!"); return; }

            this.myName = localStorage.getItem('pikachu_player_name') || "Đại Hiệp";
            this.myAvt = localStorage.getItem('pikachu_player_avatar') || 'https://i.imgur.com/7HnLKEg.png';
            
            let vipPts = localStorage.getItem('pikachu_vip_points') || 0;
            let vipInfo = window.getVipLevelInfo ? window.getVipLevelInfo(vipPts) : { level: 0, name: "Phàm Nhân", color: "#ccc" };
            
            this.isAdmin = (this.myId.toLowerCase() === window.ADMIN_ACCOUNT?.toLowerCase() || this.myName.includes("Boss"));
            if (this.isAdmin) vipInfo = { level: 10, name: "Tiên Nhân", color: "#ff0000" };
            
            this.myVipLevel = vipInfo.level; this.myVipName = vipInfo.name; this.myVipColor = vipInfo.color;

            this.renderModal('world');
        },

        renderModal: function(tab = 'world') {
            this.currentTab = tab; this.currentPrivateRoom = null; 
            if (this.activeRef) { this.activeRef.off(); this.activeRef = null; } 

            let oldModal = document.getElementById('chat-overlay');
            if (oldModal) oldModal.remove();

            const html = `
            <div id="chat-overlay" class="modal-overlay" style="z-index: 9999999; backdrop-filter: blur(8px);" onclick="if(event.target.id === 'chat-overlay') ChatSystem.closeModal();">
                <div class="chat-modal-content">
                    <button class="chat-x-btn" onclick="ChatSystem.closeModal(); if(window.playSoundInternal) window.playSoundInternal('select');">&times;</button>
                    <h2 class="chat-main-title">📜 VẠN GIỚI TRUYỀN ÂM</h2>
                    <div class="chat-tabs-wrap">
                        <button class="chat-tab-btn ${tab === 'world' ? 'active' : ''}" onclick="ChatSystem.renderModal('world'); if(window.playSoundInternal) window.playSoundInternal('select');">🌍 Kênh Thế Giới</button>
                        <button class="chat-tab-btn ${tab === 'private' ? 'active' : ''}" onclick="ChatSystem.renderModal('private'); if(window.playSoundInternal) window.playSoundInternal('select');">✉️ Mật Âm Hảo Hữu</button>
                    </div>
                    <div id="chat-content-area" style="flex: 1 1 auto; display: flex; flex-direction: column; text-align: left; margin-top: 15px; z-index: 1; overflow: hidden;"></div>
                    <button class="chat-close-btn" onclick="ChatSystem.closeModal(); if(window.playSoundInternal) window.playSoundInternal('select');">THU PHÙ (ĐÓNG)</button>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
            if (tab === 'world') this.buildWorldChat(); else if (tab === 'private') this.buildPrivateList();
        },

        closeModal: function() {
            if (this.activeRef) { this.activeRef.off(); this.activeRef = null; }
            let modal = document.getElementById('chat-overlay'); if (modal) modal.remove();
        },

        buildWorldChat: function() {
            let area = document.getElementById('chat-content-area');
            let canChat = this.isAdmin || this.myVipLevel >= 8; 
            
            let inputHTML = canChat ? 
                `<input type="text" id="world-chat-inp" class="chat-inp" placeholder="Dùng thần thức nhập thông điệp..." maxlength="100" onkeypress="if(event.key === 'Enter') ChatSystem.sendWorldChat();">
                 <button id="world-send-btn" class="chat-send-btn" onclick="ChatSystem.sendWorldChat()">Phát Tín</button>` : 
                `<input type="text" class="chat-inp" placeholder="Cảnh giới chưa đủ, yêu cầu Đại Thừa (VIP 8)!" disabled>
                 <button class="chat-send-btn" disabled>Phát Tín</button>`;

            area.innerHTML = `<div id="chat-messages" class="chat-msg-box"><div class="chat-sys-msg">✨ Tụ linh trận đang kết nối Vạn Giới Truyền Âm...</div></div><div class="chat-input-area">${inputHTML}</div>`;

            let db = window.firebase.database();
            this.activeRef = db.ref('world_chat');
            this.activeRef.limitToLast(30).on('child_added', snap => {
                let d = snap.val(); this.appendMessage('chat-messages', d);
            });
        },

        sendWorldChat: function() {
            let inp = document.getElementById('world-chat-inp');
            let btn = document.getElementById('world-send-btn');
            if (!inp || !inp.value.trim()) return;

            let text = inp.value.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;"); 
            inp.value = '';
            if(window.playSoundInternal) window.playSoundInternal('select');
            
            btn.disabled = true; setTimeout(() => { btn.disabled = false; inp.focus(); }, 2000);

            // BẮT CHUẨN KHUNG TỪ LOCALSTORAGE (KHÔNG XÉT THÊM ĐẠI GIA ĐẠI GIẾC GÌ HẾT)
            let equippedFrame = localStorage.getItem('pikachu_equipped_frame');
            if (!equippedFrame || equippedFrame === 'null' || equippedFrame === 'undefined' || equippedFrame === 'none') {
                equippedFrame = ''; 
            }

            window.firebase.database().ref('world_chat').push({ 
                senderId: this.myId, 
                name: this.myName, 
                avatar: this.myAvt, 
                vipName: this.myVipName, 
                vipColor: this.myVipColor, 
                frame: equippedFrame, // Chân ái là đây
                text: text, 
                timestamp: window.firebase.database.ServerValue.TIMESTAMP 
            });
        },

        buildPrivateList: function() {
            let area = document.getElementById('chat-content-area');
            area.innerHTML = `<div id="private-list-box" class="chat-msg-box" style="height: 400px;"><div class="chat-sys-msg">Đang dò tìm tọa độ của các Hảo hữu...</div></div>`;
            
            let db = window.firebase.database();
            db.ref(`users/${this.myId}/friends`).once('value').then(snap => {
                let box = document.getElementById('private-list-box');
                if (!snap.exists()) { box.innerHTML = `<div class="chat-sys-msg" style="margin-top: 50px;">Ngài hiện chưa kết giao đồng đạo nào.<br>Đạt Nguyên Anh (VIP 4) để gửi lời mời kết bạn!</div>`; return; }
                
                box.innerHTML = '';
                Object.keys(snap.val()).forEach(fId => {
                    db.ref('users/' + fId).once('value').then(fSnap => {
                        if(fSnap.exists()) {
                            let d = fSnap.val();
                            let avt = d.avatar || 'https://i.imgur.com/7HnLKEg.png';
                            let name = d.displayName || "Ẩn Danh";
                            let html = `<div class="friend-chat-item" onclick="ChatSystem.openPrivateRoom('${fId}', '${name}', '${avt}')"><div style="display:flex; align-items:center; gap:12px;"><img src="${avt}" class="friend-avt"><span class="friend-name">${name}</span></div><button class="talisman-btn">Truyền Phù 🎐</button></div>`;
                            box.insertAdjacentHTML('beforeend', html);
                        }
                    });
                });
            });
        },

        openPrivateRoom: function(fId, fName, fAvt) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            let roomId = [this.myId, fId].sort().join('_');
            this.currentPrivateRoom = roomId;

            let area = document.getElementById('chat-content-area');
            area.innerHTML = `
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 15px; background: linear-gradient(to right, rgba(0, 77, 64, 0.8), rgba(0,0,0,0.5)); padding: 8px 15px; border-radius: 8px; border-left: 4px solid #00e5ff; box-shadow: 0 2px 10px rgba(0,0,0,0.5);">
                    <span style="color: #00ffff; font-weight: bold; font-size: 1.05rem; text-shadow: 1px 1px 0 #000;">🎐 Đang Mật Âm cùng: <span style="color: #fff;">${fName}</span></span>
                    <button onclick="ChatSystem.renderModal('private')" style="background: #3e2723; color: #d4af37; border: 1px solid #8b6b22; border-radius: 5px; cursor:pointer; padding: 6px 12px; font-weight: bold; transition: 0.2s;">🔙 Trở Lại</button>
                </div>
                <div id="private-messages" class="chat-msg-box" style="height: 310px;">
                    <div class="chat-sys-msg">⚠️ THIÊN ĐẠO CHÚ Ý: Mật âm không lưu giữ vết tích.<br>Vừa đóng web, thông điệp lập tức tan thành mây khói.</div>
                </div>
                <div class="chat-input-area">
                    <input type="text" id="private-chat-inp" class="chat-inp" placeholder="Nhập mật ngữ..." maxlength="150" onkeypress="if(event.key === 'Enter') ChatSystem.sendPrivateChat('${fId}');">
                    <button id="private-send-btn" class="chat-send-btn" onclick="ChatSystem.sendPrivateChat('${fId}')">Phát Tín</button>
                </div>`;

            let db = window.firebase.database();
            db.ref('ephemeral_chats/' + roomId).onDisconnect().remove();

            this.activeRef = db.ref('ephemeral_chats/' + roomId);
            this.activeRef.on('child_added', snap => {
                let d = snap.val(); this.appendMessage('private-messages', d, true);
            });
        },

        sendPrivateChat: function(fId) {
            let inp = document.getElementById('private-chat-inp');
            if (!inp || !inp.value.trim() || !this.currentPrivateRoom) return;

            let text = inp.value.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
            inp.value = '';
            if(window.playSoundInternal) window.playSoundInternal('select');

            let equippedFrame = localStorage.getItem('pikachu_equipped_frame');
            if (!equippedFrame || equippedFrame === 'null' || equippedFrame === 'undefined' || equippedFrame === 'none') {
                equippedFrame = ''; 
            }

            window.firebase.database().ref('ephemeral_chats/' + this.currentPrivateRoom).push({ 
                senderId: this.myId, 
                name: this.myName, 
                avatar: this.myAvt, 
                vipColor: this.myVipColor, 
                frame: equippedFrame,
                text: text, 
                timestamp: window.firebase.database.ServerValue.TIMESTAMP 
            });
        },

        // --- CƠ CHẾ RENDER CHUẨN XÁC, BO TRÒN, FIX ẢNH RÁCH ---
        appendMessage: function(containerId, data, isPrivate = false) {
            let box = document.getElementById(containerId);
            if (!box) return;

            let isMe = (data.senderId === this.myId);
            let playerName = data.displayName || data.name || "Vô Danh";
            let rawFrame = data.frame;

            // KIỂM TRA KHUNG (Chống ảnh rách)
            let hasFrame = (rawFrame && typeof rawFrame === 'string' && rawFrame.trim() !== '' && rawFrame !== 'none' && rawFrame !== 'null' && rawFrame !== 'undefined');

            // XÁC ĐỊNH MÀU SẮC ĐẠI GIA NẾU DÙNG KHUNG TOP (Tích hợp lại cực gọn)
            let nameColor = data.vipColor || '#ccc';
            if (hasFrame) {
                if (rawFrame.includes('top1')) nameColor = '#ffd700';
                else if (rawFrame.includes('top2')) nameColor = '#e0e0e0';
                else if (rawFrame.includes('top3')) nameColor = '#cd7f32';
            }

            // MÀU GLOW LÀ MÀU TÊN
            let isGlow = (nameColor !== '#ccc' && nameColor !== '#888888' && nameColor !== '#fff');
            let textGlowClass = isGlow ? 'vip-glow-text' : '';

            // KHỐI AVATAR INLINE STYLE (Tròn xoe hoàn hảo, kích thước rộng rãi y hệt profile)
            let avatarHTML = `
            <div style="position: relative; width: 45px; height: 45px; flex-shrink: 0; margin-right: 12px; display: flex; justify-content: center; align-items: center;">
                <img src="${data.avatar || 'https://i.imgur.com/7HnLKEg.png'}" style="width: 36px; height: 36px; border-radius: 50%; object-fit: cover; border: 2px solid ${nameColor}; box-shadow: 0 0 10px ${nameColor}; background: #000; z-index: 1;">
                ${hasFrame ? `<img src="${rawFrame}" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); width: 70px; height: 70px; object-fit: contain; z-index: 2; pointer-events: none;" onerror="this.style.display='none'">` : ''}
            </div>`;

            // KHỐI TÊN NGƯỜI CHƠI (Bật Glow nhấp nháy)
            let headerHTML = '';
            if (!isPrivate) {
                headerHTML = `
                <div style="display: flex; gap: 8px; align-items: center; margin-bottom: 5px; ${isMe ? 'flex-direction: row-reverse;' : ''}">
                    <span style="background: ${data.vipColor || '#ccc'}; color: #000; font-size: 0.65rem; padding: 3px 6px; border-radius: 4px; font-weight: bold; box-shadow: 0 0 5px ${data.vipColor || '#ccc'}; white-space: nowrap; text-transform: uppercase;">${data.vipName || 'Phàm Nhân'}</span>
                    <span class="${textGlowClass}" style="font-weight: bold; color: ${nameColor}; font-size: 1.15rem; --vip-color: ${nameColor}; text-shadow: 1px 1px 1px #000;">${playerName}</span>
                </div>`;
            } else {
                headerHTML = `<div class="${textGlowClass}" style="font-weight: bold; color: ${nameColor}; font-size: 1rem; margin-bottom: 5px; ${isMe ? 'text-align: right;' : ''} --vip-color: ${nameColor}; text-shadow: 1px 1px 1px #000;">${playerName}</div>`;
            }

            let html = `
            <div class="chat-item ${isMe ? 'me' : 'other'}">
                ${avatarHTML}
                <div style="display: flex; flex-direction: column; width: 100%;">
                    ${headerHTML}
                    <div class="chat-bubble" style="${isMe ? 'margin-left: auto;' : ''}">${data.text}</div>
                </div>
            </div>`;
            
            box.insertAdjacentHTML('beforeend', html);
            box.scrollTop = box.scrollHeight; 
        }
    };

    // 4. DỌN RÁC FIREBASE
    setInterval(() => {
        if (typeof window.firebase === 'undefined' || !window.firebase.database) return;
        
        let db = window.firebase.database();
        let tenMins = 10 * 60 * 1000;       
        let oneDay = 24 * 60 * 60 * 1000;   

        db.ref('.info/serverTimeOffset').once('value').then(offsetSnap => {
            let serverNow = Date.now() + (offsetSnap.val() || 0);

            db.ref('world_chat').orderByChild('timestamp').limitToLast(1).once('value').then(snap => {
                if (!snap.exists()) return;
                let latestMsg = null;
                snap.forEach(child => { latestMsg = child.val(); });
                
                if (latestMsg && latestMsg.timestamp && (serverNow - latestMsg.timestamp > tenMins)) {
                    db.ref('world_chat').remove();
                } else {
                    db.ref('world_chat').orderByChild('timestamp').endAt(serverNow - oneDay).once('value').then(oldSnap => {
                        if (oldSnap.exists()) {
                            let updates = {};
                            oldSnap.forEach(child => { updates[child.key] = null; });
                            db.ref('world_chat').update(updates);
                        }
                    });
                }
            });

            db.ref('ephemeral_chats').once('value').then(snap => {
                if (!snap.exists()) return;
                let rooms = snap.val();
                Object.keys(rooms).forEach(roomId => {
                    let roomData = rooms[roomId];
                    let latestTime = 0;
                    Object.keys(roomData).forEach(k => { if (roomData[k].timestamp > latestTime) latestTime = roomData[k].timestamp; });
                    
                    if (latestTime > 0 && (serverNow - latestTime > tenMins)) {
                        db.ref('ephemeral_chats/' + roomId).remove();
                    }
                });
            });

        });
    }, 60000); 
})();