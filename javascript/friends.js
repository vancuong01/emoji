/* ========================================================
 * TÁC GIẢ: BỞI VĂN CƯỜNG (CODE BY VANCUONG)
 * BẢN QUYỀN: ĐỘC QUYỀN SERVER TU TIÊN PIKACHU
 * ======================================================== */
(function() {
    // 1. Tự động chèn Nút HẢO HỮU
    setInterval(() => {
        let logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn && !document.getElementById('btn-menu-friends')) {
            let friendBtn = document.createElement('button');
            friendBtn.id = 'btn-menu-friends';
            friendBtn.innerHTML = '🤝 Bạn bè';
            friendBtn.style.cssText = "background: #9c27b0; color: white; border: 1px solid #fff; padding: 3px 10px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.8rem; transition: 0.2s; margin-right: 5px; box-shadow: 0 0 5px rgba(156, 39, 176, 0.5);";
            
            friendBtn.onmouseover = () => friendBtn.style.filter = "brightness(1.2)";
            friendBtn.onmouseleave = () => friendBtn.style.filter = "brightness(1)";

            friendBtn.onclick = () => { 
                if(window.playSoundInternal) window.playSoundInternal('select'); 
                FriendSystem.openLobby(); 
            };
            
            logoutBtn.parentNode.insertBefore(friendBtn, logoutBtn);
        }
    }, 1000);

    // 2. CSS động
    if (!document.getElementById('friend-system-styles')) {
        let style = document.createElement('style'); style.id = 'friend-system-styles';
        style.innerHTML = `
            .fr-tab-btn { flex: 1; padding: 10px; background: #2c1a0c; color: #ccc; border: 2px solid #8b5a2b; cursor: pointer; font-weight: bold; border-radius: 8px 8px 0 0; transition: 0.2s; border-bottom: none; font-size: 1rem; }
            .fr-tab-btn.active { background: linear-gradient(to bottom, #9c27b0, #6a1b9a); color: #fff; border-color: #e1bee7; box-shadow: 0 -2px 10px rgba(156, 39, 176, 0.5); }
            .fr-list-item { display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.5); padding: 12px; border-radius: 8px; border: 1px solid #555; margin-bottom: 8px; transition: 0.2s; cursor: pointer; }
            .fr-list-item:hover { background: rgba(156, 39, 176, 0.3); border-color: #e1bee7; transform: translateX(5px); }
            .fr-status { font-size: 0.85rem; font-weight: bold; margin-top: 3px; display: block; }
            .fr-btn-action { padding: 8px 15px; border-radius: 5px; font-weight: bold; cursor: pointer; border: 1px solid #fff; transition: 0.2s; font-size: 0.9rem;}
            .fr-btn-add { background: linear-gradient(to bottom, #4caf50, #2e7d32); color: #fff; }
            .fr-btn-reject { background: linear-gradient(to bottom, #f44336, #b71c1c); color: #fff; }
            .fr-icon-btn { font-size: 1.4rem; padding: 5px; border-radius: 5px; transition: 0.2s; }
            .fr-icon-btn:hover { background: rgba(255,255,255,0.2); transform: scale(1.1); }
        `;
        document.head.appendChild(style);
    }

    // 3. Lõi hệ thống Hảo Hữu
    window.FriendSystem = {
        myId: null,
        currentListeners: [],
        onlineStatuses: {}, // Lưu trạng thái online để truyền vào Profile

        openLobby: function() {
            this.myId = localStorage.getItem('pikachu_account_id');
            if (!this.myId) { window.showCustomAlertInternal("Vui lòng đăng nhập!"); return; }
            if (typeof window.firebase === 'undefined' || !window.firebase.database) { window.showCustomAlertInternal("Lỗi kết nối mạng!"); return; }

            this.renderModal('list');
        },

        renderModal: function(tab = 'list') {
            let oldModal = document.getElementById('friends-overlay');
            if (oldModal) oldModal.remove();

            const html = `
            <div id="friends-overlay" class="modal-overlay" style="z-index: 9999998; backdrop-filter: blur(5px);" onclick="if(event.target.id === 'friends-overlay') FriendSystem.closeModal();">
                <div class="modal-content" style="max-width: 450px; padding: 25px; border: 4px solid #e1bee7; box-shadow: 0 0 30px rgba(156, 39, 176, 0.5); height: 80vh; display: flex; flex-direction: column; background: linear-gradient(135deg, #1f140e 0%, #0a0604 100%);">
                    <h2 style="color: #e1bee7; margin-bottom: 15px; font-size: 1.8rem; text-shadow: 2px 2px 0 #000;">🤝 DANH SÁCH BẠN BÈ</h2>
                    
                    <div style="display: flex; width: 100%; border-bottom: 2px solid #e1bee7; margin-bottom: 15px;">
                        <button class="fr-tab-btn ${tab === 'list' ? 'active' : ''}" onclick="FriendSystem.renderModal('list'); if(window.playSoundInternal) window.playSoundInternal('select');">Bạn Bè</button>
                        <button class="fr-tab-btn ${tab === 'add' ? 'active' : ''}" onclick="FriendSystem.renderModal('add'); if(window.playSoundInternal) window.playSoundInternal('select');">Thêm Bạn</button>
                        <button class="fr-tab-btn ${tab === 'requests' ? 'active' : ''}" onclick="FriendSystem.renderModal('requests'); if(window.playSoundInternal) window.playSoundInternal('select');">Lời Mời</button>
                    </div>

                    <div id="fr-tab-content" style="flex: 1; overflow-y: auto; text-align: left; padding: 10px; background: rgba(0,0,0,0.5); border-radius: 0 0 8px 8px; border: 1px solid #555; margin-bottom: 15px; box-shadow: inset 0 0 10px #000;">
                        <div style="text-align: center; color: #aaa; margin-top: 20px;">Đang tải dữ liệu...</div>
                    </div>

                    <button onclick="FriendSystem.closeModal(); if(window.playSoundInternal) window.playSoundInternal('select');" style="background: linear-gradient(to bottom, #d4af37, #aa8000); border: 2px solid #fff; color: #000; font-weight: bold; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 1.1rem; width: 100%; transition: 0.2s; box-shadow: 0 4px 6px rgba(0,0,0,0.5);">ĐÓNG KẾT GIAO</button>
                </div>
            </div>`;
            
            document.body.insertAdjacentHTML('beforeend', html);

            if (tab === 'list') this.loadFriendsList();
            else if (tab === 'add') this.renderAddFriendUI();
            else if (tab === 'requests') this.loadRequests();
        },

        closeModal: function() {
            this.currentListeners.forEach(ref => ref.off());
            this.currentListeners = [];
            let modal = document.getElementById('friends-overlay');
            if (modal) modal.remove();
        },

        // TAB DANH SÁCH BẠN BÈ + TRẠNG THÁI ONLINE REALTIME
        loadFriendsList: function() {
            let db = window.firebase.database();
            let contentEl = document.getElementById('fr-tab-content');
            
            this.currentListeners.forEach(ref => ref.off());
            this.currentListeners = [];
            contentEl.innerHTML = `<div style="text-align: center; color: #aaa; margin-top: 50px;">Đang tìm tọa độ hảo hữu... ⏳</div>`;

            db.ref('users/' + this.myId + '/friends').once('value').then(snap => {
                if (!snap.exists()) {
                    contentEl.innerHTML = `<div style="text-align: center; color: #aaa; margin-top: 50px;">Ngài chưa kết giao hảo hữu nào.<br>Hãy sang mục "Thêm Bạn" để mở rộng quan hệ!</div>`;
                    return;
                }
                
                let friendIds = Object.keys(snap.val());
                contentEl.innerHTML = '';

                friendIds.forEach(fId => {
                    const userRef = db.ref('users/' + fId);
                    const onlineRef = db.ref('users/' + fId + '/isOnline');

                    // Lắng nghe Online
                    const onlineListener = onlineRef.on('value', (onlineSnap) => {
                        const isOnline = !!onlineSnap.val();
                        this.onlineStatuses[fId] = isOnline; // Lưu lại để dùng cho profile
                        
                        let item = document.getElementById('friend-item-' + fId);
                        if (item) {
                            const statusHTML = isOnline 
                                ? `<span class="fr-status" style="color:#00e676; text-shadow: 0 0 5px #00e676;">🟢 Đang Online</span>` 
                                : `<span class="fr-status" style="color:#777;">⚪ Ngoại tuyến</span>`;
                            item.querySelector('.fr-status-container').innerHTML = statusHTML;
                        }
                    });
                    this.currentListeners.push(onlineRef);

                    // Tải thông tin
                    userRef.once('value').then(fSnap => {
                        if (!fSnap.exists()) return;
                        let d = fSnap.val();
                        let avt = d.avatar || 'https://i.imgur.com/7HnLKEg.png';
                        let name = d.displayName || "Ẩn Danh";
                        let vipInfo = window.getVipLevelInfo ? window.getVipLevelInfo(d.vipPoints || 0) : { name: "Phàm Nhân", color: "#e0e0e0" };
                        
                        if (fId.toLowerCase() === "vancuong140904" || d.isAdmin) vipInfo = { name: "Tiên Nhân", color: "#ff0000" };

                        let currentFrame = d.equippedFrame || 'none';
                        let avatarHtml = window.renderAvatarWithFrame ? window.renderAvatarWithFrame(avt, currentFrame, vipInfo.color, 45) : `<img src="${avt}" style="width: 45px; height: 45px; border-radius: 50%; border: 2px solid ${vipInfo.color}; object-fit: cover;">`;

                        // TÔ MÀU ĐẠI GIA CHO BẠN BÈ
                        let coloredName = window.getColoredNameHTML ? window.getColoredNameHTML(fId, name, vipInfo.color) : `<span style="color: ${vipInfo.color};">${name}</span>`;

                        const initialStatus = `<span class="fr-status" style="color:#888;">⏳ Đang dò...</span>`;

                        let itemHtml = `
                        <div id="friend-item-${fId}" class="fr-list-item" onclick="FriendSystem.showFriendProfile('${fId}', '${name}', '${avt}', ${d.vipPoints || 0}, ${d.coins || 0}, '${currentFrame}')">
                            <div style="display: flex; align-items: center; gap: 12px; flex: 1;">
                                ${avatarHtml}
                                <div style="display: flex; flex-direction: column; align-items: flex-start; text-align: left; overflow: hidden;">
                                    <div style="font-weight: bold; font-size: 1.1rem; max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${coloredName}</div>
                                    <div class="fr-status-container">${initialStatus}</div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 5px; align-items: center;">
                                <div class="fr-icon-btn" style="color: #ff9800;" title="Xem Hồ Sơ" onclick="event.stopImmediatePropagation(); FriendSystem.showFriendProfile('${fId}', '${name}', '${avt}', ${d.vipPoints || 0}, ${d.coins || 0}, '${currentFrame}');">🔍</div>
                                <div class="fr-icon-btn" style="color: #00ffff; text-shadow: 0 0 5px #00ffff;" title="Truyền Âm" onclick="event.stopImmediatePropagation(); FriendSystem.startPrivateChat('${fId}', '${name}');">💬</div>
                            </div>
                        </div>`;
                        contentEl.insertAdjacentHTML('beforeend', itemHtml);
                    });
                });
            });
        },

        // MỞ CHAT VÀ TỰ ĐỘNG ĐÓNG BẢNG BẠN BÈ
        startPrivateChat: function(fId, fName) {
            if(window.playSoundInternal) window.playSoundInternal('select');

            // Đóng bảng bạn bè để nhường chỗ cho Chat
            this.closeModal(); 
            let popup = document.getElementById('friend-profile-popup');
            if (popup) popup.remove();

            const tryOpenChat = () => {
                if (typeof window.ChatSystem !== 'undefined' && typeof window.ChatSystem.openPrivateRoom === 'function') {
                    // Nếu ChatSystem chưa mở Modal World, mở nó lên trước
                    if (!document.getElementById('chat-overlay')) {
                        window.ChatSystem.openLobby();
                    }
                    setTimeout(() => {
                        window.ChatSystem.renderModal('private');
                        window.ChatSystem.openPrivateRoom(fId, fName);
                    }, 100);
                    return true;
                }
                return false;
            };

            if (tryOpenChat()) return;

            setTimeout(() => {
                if (tryOpenChat()) return;
                setTimeout(() => {
                    if (tryOpenChat()) return;
                    if (window.showCustomAlertInternal) {
                        window.showCustomAlertInternal(`💬 Không mở được Mật Âm với <b>${fName}</b>.<br>Hệ thống Chat chưa sẵn sàng.`);
                    }
                }, 600);
            }, 300);
        },

        // HIỂN THỊ HỒ SƠ BẠN BÈ (CÓ TÊN MÀU VÀ ONLINE)
        showFriendProfile: function(fId, fName, fAvt, fVipPts, fCoins, fFrame) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            
            let popupOld = document.getElementById('friend-profile-popup');
            if (popupOld) popupOld.remove();

            let vipInfo = window.getVipLevelInfo ? window.getVipLevelInfo(fVipPts) : { name: "Phàm Nhân", color: "#e0e0e0" };
            if (fId.toLowerCase() === "vancuong140904") vipInfo = { name: "Tiên Nhân", color: "#ff0000", glow: "0 0 20px #ff0000" };
            
            let avatarHtml = window.renderAvatarWithFrame ? window.renderAvatarWithFrame(fAvt, fFrame, vipInfo.color, 90) : `<img src="${fAvt}" style="width: 90px; height: 90px; border-radius: 50%; border: 4px solid ${vipInfo.color}; object-fit: cover; background: #000;">`;
            
            let coloredName = window.getColoredNameHTML ? window.getColoredNameHTML(fId, fName, vipInfo.color) : fName;
            
            let isOnline = this.onlineStatuses[fId] || false;
            let onlineDot = isOnline 
                ? `<span style="color:#00e676; font-size: 0.9rem; text-shadow: 0 0 5px #00e676;">🟢 Online</span>` 
                : `<span style="color:#777; font-size: 0.9rem;">⚪ Offline</span>`;

            const html = `
            <div id="friend-profile-popup" class="modal-overlay" style="z-index: 9999999; backdrop-filter: blur(8px);" onclick="if(event.target.id === 'friend-profile-popup') this.remove();">
                <div class="modal-content" style="max-width: 350px; padding: 25px; text-align: center; border: 4px solid ${vipInfo.color}; box-shadow: 0 0 30px ${vipInfo.color}; background: linear-gradient(135deg, #1f140e 0%, #0a0604 100%); border-radius: 15px;">
                    <h2 style="color: ${vipInfo.color}; margin-bottom: 20px; text-shadow: 2px 2px 0 #000;">THÔNG TIN HẢO HỮU</h2>
                    
                    <div style="margin-bottom: 10px; display: flex; justify-content: center;">${avatarHtml}</div>
                    
                    <div style="margin-bottom: 20px;">${onlineDot}</div>

                    <div style="background: rgba(0,0,0,0.8); border-radius: 10px; padding: 15px; margin-bottom: 20px; border: 1px solid #555; text-align: left; box-shadow: inset 0 0 10px #000;">
                        <div style="margin-bottom: 12px; font-size: 1rem; color: #ccc; border-bottom: 1px dashed #555; padding-bottom: 8px; display: flex; justify-content: space-between; align-items: center;">
                            <strong>👤 Biệt Danh:</strong> <span style="font-size: 1.15rem;">${coloredName}</span>
                        </div>
                        <div style="margin-bottom: 12px; font-size: 1rem; color: #ccc; border-bottom: 1px dashed #555; padding-bottom: 8px;">
                            <strong>🏅 Cảnh Giới:</strong> <span style="color: ${vipInfo.color}; float: right; font-weight: bold; text-shadow: 1px 1px 2px #000;">${vipInfo.name}</span>
                        </div>
                        <div style="font-size: 1rem; color: #ccc;">
                            <strong>💎 Linh Thạch:</strong> <span style="color: #00e676; float: right; font-weight: bold;">${(fCoins || 0).toLocaleString('vi-VN')}</span>
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px; width: 100%;">
                        <button onclick="document.getElementById('friend-profile-popup').remove(); if(window.playSoundInternal) window.playSoundInternal('select');" style="background: #333; border: 2px solid #aaa; color: #fff; font-weight: bold; padding: 10px; border-radius: 8px; cursor: pointer; flex: 1; transition: 0.2s;">ĐÓNG</button>
                        <button onclick="FriendSystem.startPrivateChat('${fId}', '${fName}'); document.getElementById('friend-profile-popup').remove();" style="background: linear-gradient(to bottom, #00bfff, #0088cc); border: 2px solid #fff; color: #fff; font-weight: bold; padding: 10px; border-radius: 8px; cursor: pointer; flex: 1; box-shadow: 0 0 10px rgba(0, 191, 255, 0.5);">💬 TRUYỀN ÂM</button>
                        <button onclick="FriendSystem.unfriend('${fId}', '${fName}')" style="background: linear-gradient(to bottom, #f44336, #b71c1c); border: 2px solid #fff; color: #fff; font-weight: bold; padding: 10px; border-radius: 8px; cursor: pointer; flex: 1;">TUYỆT GIAO</button>
                    </div>
                </div>
            </div>`;
            
            document.body.insertAdjacentHTML('beforeend', html);
        },

        unfriend: function(fId, fName) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            
            window.showCustomConfirmInternal(`Sếp có chắc chắn muốn đoạn tuyệt quan hệ hảo hữu với [${fName}] không?`, () => {
                let db = window.firebase.database();
                let updates = {};
                updates[`users/${this.myId}/friends/${fId}`] = null;
                updates[`users/${fId}/friends/${this.myId}`] = null;

                db.ref().update(updates).then(() => {
                    let popup = document.getElementById('friend-profile-popup');
                    if(popup) popup.remove();
                    this.loadFriendsList();
                    window.showCustomAlertInternal(`Đã cắt đứt quan hệ hảo hữu với ${fName}!`);
                }).catch(() => {
                    window.showCustomAlertInternal("Lỗi truy xuất hệ thống khi hủy kết bạn!");
                });
            });
        },

        renderAddFriendUI: function() {
            let contentEl = document.getElementById('fr-tab-content');
            contentEl.innerHTML = `
                <div style="padding: 10px; text-align: center;">
                    <p style="color: #00ffff; margin-bottom: 15px; font-weight: bold; font-size: 1.1rem;">Nhập ID người chơi để kết giao:</p>
                    <input type="text" id="fr-search-inp" placeholder="Ví dụ: vancuong14..." style="width: 90%; padding: 12px; border-radius: 8px; border: 2px solid #9c27b0; background: #222; color: #fff; font-size: 1.1rem; text-align: center; margin-bottom: 15px; outline: none; pointer-events: auto; user-select: text !important;">
                    <br>
                    <button onclick="FriendSystem.searchUser()" class="fr-btn-action" style="background: linear-gradient(to bottom, #9c27b0, #6a1b9a); color: #fff; border: 2px solid #fff; padding: 12px 30px; font-size: 1.1rem; border-radius: 8px; width: 90%; box-shadow: 0 0 10px rgba(156, 39, 176, 0.5);">🔍 TÌM KIẾM</button>
                    <div id="fr-search-result" style="margin-top: 25px; border-top: 1px dashed #555; padding-top: 15px;"></div>
                </div>
            `;
        },

        searchUser: async function() {
            if(window.playSoundInternal) window.playSoundInternal('select');
            let inp = document.getElementById('fr-search-inp').value.trim().toLowerCase();
            let resEl = document.getElementById('fr-search-result');
            
            if (!inp) { resEl.innerHTML = '<span style="color:#ff5252; font-weight: bold;">Vui lòng nhập ID!</span>'; return; }
            if (inp === this.myId) { resEl.innerHTML = '<span style="color:#ff5252; font-weight: bold;">Không thể tự kết bạn với chính mình!</span>'; return; }

            resEl.innerHTML = '<span style="color:#00ffff;">Đang dò tìm tung tích... ⏳</span>';
            
            let db = window.firebase.database();
            
            try {
                let snap = await db.ref('users/' + inp).once('value');
                if (!snap.exists()) {
                    resEl.innerHTML = '<span style="color:#ff5252; font-weight: bold;">Không tìm thấy người chơi nào mang ID này!</span>';
                    return;
                }
                
                let d = snap.val();
                let avt = d.avatar || 'https://i.imgur.com/7HnLKEg.png';
                let name = d.displayName || "Đại Hiệp Ẩn Danh";
                let vip = window.getVipLevelInfo ? window.getVipLevelInfo(d.vipPoints || 0) : { name: "Phàm", color: "#ccc" };
                
                let coloredName = window.getColoredNameHTML ? window.getColoredNameHTML(inp, name, vip.color) : `<span style="color:${vip.color}">${name}</span>`;

                let frSnap = await db.ref(`users/${this.myId}/friends/${inp}`).once('value');
                if (frSnap.exists()) {
                    resEl.innerHTML = `
                        <div class="fr-list-item" style="background: rgba(0,0,0,0.8); border: 2px solid #4caf50; padding: 15px; text-align: center;">
                            <span style="color:#00e676; font-weight: bold; font-size: 1.1rem;">Người này đã là hảo hữu của bạn!</span>
                        </div>`;
                    return;
                }

                let reqSnap = await db.ref(`friend_requests/${inp}/${this.myId}`).once('value');
                if (reqSnap.exists()) {
                    resEl.innerHTML = `
                        <div class="fr-list-item" style="background: rgba(0,0,0,0.8); border: 2px solid #9c27b0; display: flex; flex-direction: column; gap: 15px; padding: 15px;">
                            <div style="display: flex; align-items: center; gap: 15px; width: 100%;">
                                <img src="${avt}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid ${vip.color}; object-fit: cover;">
                                <div style="text-align: left;">
                                    <div style="font-size: 1.1rem;">${coloredName}</div>
                                    <div style="font-size: 0.8rem; color: #aaa; margin-top: 3px;">ID: ${inp}</div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px; width: 100%;">
                                <button disabled class="fr-btn-action" style="flex: 1; background: #555; color: #ccc; border-color: #777; cursor: not-allowed;">⏳ Đã Gửi Mời</button>
                                <button onclick="FriendSystem.cancelSentRequest('${inp}')" class="fr-btn-action fr-btn-reject" style="flex: 1;">Hủy Lời Mời</button>
                            </div>
                        </div>`;
                    return;
                }

                let incomingReqSnap = await db.ref(`friend_requests/${this.myId}/${inp}`).once('value');
                if (incomingReqSnap.exists()) {
                     resEl.innerHTML = `
                        <div class="fr-list-item" style="background: rgba(0,0,0,0.8); border: 2px solid #ff9800; display: flex; flex-direction: column; gap: 15px; padding: 15px;">
                            <div style="color: #ff9800; font-weight: bold;">Người này đang chờ bạn đồng ý kết bạn!</div>
                            <button onclick="FriendSystem.renderModal('requests')" class="fr-btn-action" style="background: #ff9800; color: #fff; width: 100%; padding: 10px;">Sang tab LỜI MỜI để duyệt</button>
                        </div>`;
                    return;
                }

                resEl.innerHTML = `
                    <div class="fr-list-item" style="background: rgba(0,0,0,0.8); border: 2px solid #00ffff; display: flex; flex-direction: column; gap: 15px; padding: 15px;">
                        <div style="display: flex; align-items: center; gap: 15px; width: 100%;">
                            <img src="${avt}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid ${vip.color}; object-fit: cover;">
                            <div style="text-align: left;">
                                <div style="font-size: 1.1rem;">${coloredName}</div>
                                <div style="font-size: 0.8rem; color: #aaa; margin-top: 3px;">ID: ${inp}</div>
                            </div>
                        </div>
                        <button onclick="FriendSystem.sendRequest('${inp}')" class="fr-btn-action fr-btn-add" style="width: 100%; padding: 10px; font-size: 1rem;">➕ GỬI LỜI MỜI KẾT BẠN</button>
                    </div>
                `;
            } catch (error) {
                resEl.innerHTML = '<span style="color:#ff5252;">Lỗi truy xuất hệ thống!</span>';
            }
        },

        sendRequest: function(targetId) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            let db = window.firebase.database();
            let myName = localStorage.getItem('pikachu_player_name') || "Đại Hiệp";
            let myAvt = localStorage.getItem('pikachu_player_avatar') || 'https://i.imgur.com/7HnLKEg.png';

            db.ref(`friend_requests/${targetId}/${this.myId}`).set({
                name: myName,
                avatar: myAvt,
                timestamp: window.firebase.database.ServerValue.TIMESTAMP
            }).then(() => {
                FriendSystem.searchUser(); 
                if(window.showCustomAlertInternal) window.showCustomAlertInternal("Đã phóng bồ câu đưa thư thành công!");
            }).catch(() => {
                window.showCustomAlertInternal("Gửi lời mời thất bại!");
            });
        },

        cancelSentRequest: function(targetId) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            let db = window.firebase.database();
            
            db.ref(`friend_requests/${targetId}/${this.myId}`).remove().then(() => {
                FriendSystem.searchUser();
            });
        },

        loadRequests: function() {
            let db = window.firebase.database();
            let contentEl = document.getElementById('fr-tab-content');
            
            db.ref('friend_requests/' + this.myId).once('value').then(snap => {
                if (!snap.exists()) {
                    contentEl.innerHTML = `<div style="text-align: center; color: #aaa; margin-top: 50px;">Hòm thư trống rỗng.<br>Chưa có ai gửi lời mời kết bạn.</div>`;
                    return;
                }
                
                let reqs = snap.val();
                contentEl.innerHTML = '';
                
                Object.keys(reqs).forEach(senderId => {
                    let d = reqs[senderId];
                    let coloredName = window.getColoredNameHTML ? window.getColoredNameHTML(senderId, d.name) : d.name;

                    let itemHtml = `
                    <div class="fr-list-item" id="req-${senderId}" style="flex-direction: column; gap: 10px; align-items: flex-start; border: 1px solid #9c27b0;">
                        <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
                            <img src="${d.avatar}" style="width: 45px; height: 45px; border-radius: 50%; border: 2px solid #ccc; object-fit: cover;">
                            <div>
                                <div style="font-size: 1.1rem;">${coloredName}</div>
                                <div style="font-size: 0.8rem; color: #00ffff;">Muốn kết giao hảo hữu</div>
                            </div>
                        </div>
                        <div style="display: flex; gap: 10px; width: 100%;">
                            <button onclick="FriendSystem.acceptRequest('${senderId}')" class="fr-btn-action fr-btn-add" style="flex: 1;">Đồng Ý</button>
                            <button onclick="FriendSystem.rejectRequest('${senderId}')" class="fr-btn-action fr-btn-reject" style="flex: 1;">Từ Chối</button>
                        </div>
                    </div>`;
                    contentEl.insertAdjacentHTML('beforeend', itemHtml);
                });
            });
        },

        acceptRequest: function(senderId) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            let db = window.firebase.database();
            
            let updates = {};
            updates[`users/${this.myId}/friends/${senderId}`] = true;
            updates[`users/${senderId}/friends/${this.myId}`] = true;
            updates[`friend_requests/${this.myId}/${senderId}`] = null; 

            db.ref().update(updates).then(() => {
                let el = document.getElementById(`req-${senderId}`);
                if(el) el.innerHTML = '<span style="color:#00e676; padding: 10px; width: 100%; text-align:center; font-weight: bold; font-size: 1.1rem;">✅ Đã kết giao thành công!</span>';
            }).catch(()=> { if(window.showCustomAlertInternal) window.showCustomAlertInternal("Lỗi khi kết bạn!"); });
        },

        rejectRequest: function(senderId) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            let db = window.firebase.database();
            db.ref(`friend_requests/${this.myId}/${senderId}`).remove().then(() => {
                let el = document.getElementById(`req-${senderId}`);
                if(el) el.remove();
            });
        }
    };
})();