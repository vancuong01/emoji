/* ========================================================
 * TÁC GIẢ: BỞI VĂN CƯỜNG (CODE BY VANCUONG)
 * BẢN QUYỀN: ĐỘC QUYỀN SERVER TU TIÊN PIKACHU
 * CẢNH BÁO: Mọi hành vi sao chép không xin phép đều là vi phạm!
 ======================================================== */

(function() {
    // 1. Tự động chèn Nút HẢO HỮU vào cụm Tên nhân vật
    setInterval(() => {
        let logoutBtn = document.getElementById('btn-logout');
        if (logoutBtn && !document.getElementById('btn-menu-friends')) {
            let friendBtn = document.createElement('button');
            friendBtn.id = 'btn-menu-friends';
            friendBtn.innerHTML = '🤝 Bạn bè';
            friendBtn.style.cssText = "background: #9c27b0; color: white; border: 1px solid #fff; padding: 3px 10px; border-radius: 5px; cursor: pointer; font-weight: bold; font-size: 0.8rem; transition: 0.2s; margin-right: 5px;";
            
            friendBtn.onmouseover = () => friendBtn.style.filter = "brightness(1.2)";
            friendBtn.onmouseleave = () => friendBtn.style.filter = "brightness(1)";

            friendBtn.onclick = () => { 
                if(window.playSoundInternal) window.playSoundInternal('select'); 
                FriendSystem.openLobby(); 
            };
            
            logoutBtn.parentNode.insertBefore(friendBtn, logoutBtn);
        }
    }, 1000);

    // 2. Hệ thống CSS động
    if (!document.getElementById('friend-system-styles')) {
        let style = document.createElement('style'); style.id = 'friend-system-styles';
        style.innerHTML = `
            .fr-tab-btn { flex: 1; padding: 10px; background: #2c1a0c; color: #ccc; border: 2px solid #8b5a2b; cursor: pointer; font-weight: bold; border-radius: 8px 8px 0 0; transition: 0.2s; border-bottom: none; font-size: 1rem; }
            .fr-tab-btn.active { background: linear-gradient(to bottom, #9c27b0, #6a1b9a); color: #fff; border-color: #e1bee7; box-shadow: 0 -2px 10px rgba(156, 39, 176, 0.5); }
            .fr-list-item { display: flex; justify-content: space-between; align-items: center; background: rgba(0,0,0,0.5); padding: 12px; border-radius: 8px; border: 1px solid #555; margin-bottom: 8px; transition: 0.2s; cursor: pointer; }
            .fr-list-item:hover { background: rgba(156, 39, 176, 0.3); border-color: #e1bee7; }
            .fr-btn-action { padding: 8px 15px; border-radius: 5px; font-weight: bold; cursor: pointer; border: 1px solid #fff; transition: 0.2s; font-size: 0.9rem;}
            .fr-btn-add { background: linear-gradient(to bottom, #4caf50, #2e7d32); color: #fff; }
            .fr-btn-reject { background: linear-gradient(to bottom, #f44336, #b71c1c); color: #fff; }
        `;
        document.head.appendChild(style);
    }

    // 3. Lõi hệ thống Hảo Hữu
    window.FriendSystem = {
        myId: null,

        openLobby: function() {
            this.myId = localStorage.getItem('pikachu_account_id');
            if (!this.myId) { alert("Vui lòng đăng nhập!"); return; }
            if (typeof window.firebase === 'undefined' || !window.firebase.database) { alert("Lỗi kết nối mạng!"); return; }

            this.renderModal('list');
        },

        renderModal: function(tab = 'list') {
            let oldModal = document.getElementById('friends-overlay');
            if (oldModal) oldModal.remove();

            const html = `
            <div id="friends-overlay" class="modal-overlay" style="z-index: 9999998; backdrop-filter: blur(5px);" onclick="if(event.target.id === 'friends-overlay') FriendSystem.closeModal();">
                <div class="modal-content" style="max-width: 450px; padding: 25px; border: 4px solid #e1bee7; box-shadow: 0 0 30px rgba(156, 39, 176, 0.5); height: 80vh; display: flex; flex-direction: column;">
                    <h2 style="color: #e1bee7; margin-bottom: 15px; font-size: 1.8rem; text-shadow: 2px 2px 0 #000;">🤝 DANH SÁCH BẠN BÈ</h2>
                    
                    <div style="display: flex; width: 100%; border-bottom: 2px solid #e1bee7; margin-bottom: 15px;">
                        <button class="fr-tab-btn ${tab === 'list' ? 'active' : ''}" onclick="FriendSystem.renderModal('list'); if(window.playSoundInternal) window.playSoundInternal('select');">Bạn Bè</button>
                        <button class="fr-tab-btn ${tab === 'add' ? 'active' : ''}" onclick="FriendSystem.renderModal('add'); if(window.playSoundInternal) window.playSoundInternal('select');">Thêm Bạn</button>
                        <button class="fr-tab-btn ${tab === 'requests' ? 'active' : ''}" onclick="FriendSystem.renderModal('requests'); if(window.playSoundInternal) window.playSoundInternal('select');">Lời Mời</button>
                    </div>

                    <div id="fr-tab-content" style="flex: 1; overflow-y: auto; text-align: left; padding: 10px; background: rgba(0,0,0,0.3); border-radius: 0 0 8px 8px; border: 1px solid #555; margin-bottom: 15px;">
                        <div style="text-align: center; color: #aaa; margin-top: 20px;">Đang tải dữ liệu...</div>
                    </div>

                    <button onclick="FriendSystem.closeModal(); if(window.playSoundInternal) window.playSoundInternal('select');" style="background: linear-gradient(to bottom, #d4af37, #aa8000); border: 2px solid #fff; color: #000; font-weight: bold; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 1.1rem; width: 100%;">ĐÓNG</button>
                </div>
            </div>`;
            
            document.body.insertAdjacentHTML('beforeend', html);

            if (tab === 'list') this.loadFriendsList();
            else if (tab === 'add') this.renderAddFriendUI();
            else if (tab === 'requests') this.loadRequests();
        },

        closeModal: function() {
            let modal = document.getElementById('friends-overlay');
            if (modal) modal.remove();
        },

        // --- TAB 1: DANH SÁCH BẠN BÈ ---
        loadFriendsList: function() {
            let db = window.firebase.database();
            let contentEl = document.getElementById('fr-tab-content');
            
            db.ref('users/' + this.myId + '/friends').once('value').then(snap => {
                if (!snap.exists()) {
                    contentEl.innerHTML = `<div style="text-align: center; color: #aaa; margin-top: 50px;">Bạn chưa có hảo hữu nào.<br>Hãy sang mục "Thêm Bạn" để kết giao nhé!</div>`;
                    return;
                }
                
                let friendsData = snap.val();
                let friendIds = Object.keys(friendsData);
                contentEl.innerHTML = ''; 

                friendIds.forEach(fId => {
                    db.ref('users/' + fId).once('value').then(fSnap => {
                        if(fSnap.exists()) {
                            let d = fSnap.val();
                            let avt = d.avatar || 'https://i.imgur.com/7HnLKEg.png';
                            let name = d.displayName || "Đại Hiệp Ẩn Danh";
                            let vipInfo = window.getVipLevelInfo ? window.getVipLevelInfo(d.vipPoints || 0) : { name: "Phàm Nhân", color: "#e0e0e0" };
                            
                            if (fId.toLowerCase() === "vancuong140904") vipInfo = { name: "Tiên Nhân", color: "#ff0000" };

                            let itemHtml = `
                            <div class="fr-list-item" onclick="FriendSystem.showFriendProfile('${fId}', '${name}', '${avt}', ${d.vipPoints || 0}, ${d.coins || 0})">
                                <div style="display: flex; align-items: center; gap: 10px;">
                                    <img src="${avt}" style="width: 45px; height: 45px; border-radius: 50%; border: 2px solid ${vipInfo.color}; object-fit: cover;">
                                    <div>
                                        <div style="color: ${vipInfo.color}; font-weight: bold; font-size: 1.1rem; text-shadow: 1px 1px 1px #000;">${name}</div>
                                        <div style="font-size: 0.75rem; background: ${vipInfo.color}; color: #000; padding: 2px 6px; border-radius: 4px; display: inline-block; font-weight: bold;">${vipInfo.name}</div>
                                    </div>
                                </div>
                                <div style="color: #00ffff; font-size: 1.2rem;">🔍</div>
                            </div>`;
                            contentEl.insertAdjacentHTML('beforeend', itemHtml);
                        }
                    });
                });
            });
        },

        // --- XEM THÔNG TIN BẠN BÈ & HỦY KẾT BẠN ---
        showFriendProfile: function(fId, fName, fAvt, fVipPts, fCoins) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            
            let vipInfo = window.getVipLevelInfo ? window.getVipLevelInfo(fVipPts) : { name: "Phàm Nhân", color: "#e0e0e0" };
            if (fId.toLowerCase() === "vancuong140904") vipInfo = { name: "Tiên Nhân", color: "#ff0000", glow: "0 0 20px #ff0000" };
            let glowClass = vipInfo.level > 0 ? 'vip-glow-frame' : '';

            const html = `
            <div id="friend-profile-popup" class="modal-overlay" style="z-index: 9999999; backdrop-filter: blur(8px);" onclick="if(event.target.id === 'friend-profile-popup') this.remove();">
                <div class="modal-content" style="max-width: 350px; padding: 25px; text-align: center; border: 4px solid ${vipInfo.color}; box-shadow: 0 0 30px ${vipInfo.color}; background: #1a0f07;">
                    <h2 style="color: ${vipInfo.color}; margin-bottom: 20px; text-shadow: 2px 2px 0 #000;">THÔNG TIN HẢO HỮU</h2>
                    
                    <div style="position: relative; display: inline-block; margin-bottom: 20px;">
                        <img src="${fAvt}" class="${glowClass}" style="width: 90px; height: 90px; border-radius: 50%; border: 4px solid ${vipInfo.color}; object-fit: cover; background: #000; --vip-color: ${vipInfo.color};">
                    </div>

                    <div style="background: rgba(0,0,0,0.8); border-radius: 10px; padding: 15px; margin-bottom: 20px; border: 1px solid #555; text-align: left;">
                        <div style="margin-bottom: 12px; font-size: 1rem; color: #ccc; border-bottom: 1px dashed #555; padding-bottom: 8px;">
                            <strong>👤 Biệt Danh:</strong> <span style="color: ${vipInfo.color}; float: right; font-weight: bold; font-size: 1.1rem;">${fName}</span>
                        </div>
                        <div style="margin-bottom: 12px; font-size: 1rem; color: #ccc; border-bottom: 1px dashed #555; padding-bottom: 8px;">
                            <strong>🏅 Cảnh Giới:</strong> <span style="color: ${vipInfo.color}; float: right; font-weight: bold;">${vipInfo.name}</span>
                        </div>
                        <div style="font-size: 1rem; color: #ccc;">
                            <strong>💎 Linh Thạch:</strong> <span style="color: #00e676; float: right; font-weight: bold;">${fCoins}</span>
                        </div>
                    </div>

                    <div style="display: flex; gap: 10px; width: 100%;">
                        <button onclick="document.getElementById('friend-profile-popup').remove(); if(window.playSoundInternal) window.playSoundInternal('select');" style="background: #555; border: 2px solid #fff; color: #fff; font-weight: bold; padding: 10px; border-radius: 8px; cursor: pointer; flex: 1;">ĐÓNG</button>
                        <button onclick="FriendSystem.unfriend('${fId}', '${fName}')" style="background: linear-gradient(to bottom, #f44336, #b71c1c); border: 2px solid #fff; color: #fff; font-weight: bold; padding: 10px; border-radius: 8px; cursor: pointer; flex: 1;">HỦY BẠN</button>
                    </div>
                </div>
            </div>`;
            
            document.body.insertAdjacentHTML('beforeend', html);
        },

        // Chức năng Hủy kết bạn (Xóa khỏi DB của cả 2 bên)
        unfriend: function(fId, fName) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            
            if (confirm(`Sếp có chắc chắn muốn đoạn tuyệt quan hệ hảo hữu với [${fName}] không?`)) {
                let db = window.firebase.database();
                let updates = {};
                updates[`users/${this.myId}/friends/${fId}`] = null;
                updates[`users/${fId}/friends/${this.myId}`] = null;

                db.ref().update(updates).then(() => {
                    document.getElementById('friend-profile-popup').remove();
                    this.loadFriendsList(); // Tự động load lại danh sách bạn bè
                    // Báo thành công
                    if(window.showCustomAlertInternal) window.showCustomAlertInternal(`Đã cắt đứt quan hệ hảo hữu với ${fName}!`);
                    else alert(`Đã cắt đứt quan hệ hảo hữu với ${fName}!`);
                }).catch(() => {
                    alert("Lỗi truy xuất hệ thống khi hủy kết bạn!");
                });
            }
        },

        // --- TAB 2: TÌM & THÊM BẠN ---
        renderAddFriendUI: function() {
            let contentEl = document.getElementById('fr-tab-content');
            contentEl.innerHTML = `
                <div style="padding: 10px; text-align: center;">
                    <p style="color: #00ffff; margin-bottom: 15px; font-weight: bold; font-size: 1.1rem;">Nhập ID người chơi để kết giao:</p>
                    
                    <input type="text" id="fr-search-inp" placeholder="Ví dụ: vancuong14..." style="width: 90%; padding: 12px; border-radius: 8px; border: 2px solid #9c27b0; background: #222; color: #fff; font-size: 1.1rem; text-align: center; margin-bottom: 15px; outline: none; pointer-events: auto; user-select: text !important;">
                    
                    <br>
                    <button onclick="FriendSystem.searchUser()" class="fr-btn-action" style="background: linear-gradient(to bottom, #9c27b0, #6a1b9a); color: #fff; border: 2px solid #fff; padding: 12px 30px; font-size: 1.1rem; border-radius: 8px; width: 90%;">🔍 TÌM KIẾM</button>
                    
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
                // 1. Kiểm tra xem người này có tồn tại không
                let snap = await db.ref('users/' + inp).once('value');
                if (!snap.exists()) {
                    resEl.innerHTML = '<span style="color:#ff5252; font-weight: bold;">Không tìm thấy người chơi nào mang ID này!</span>';
                    return;
                }
                
                let d = snap.val();
                let avt = d.avatar || 'https://i.imgur.com/7HnLKEg.png';
                let name = d.displayName || "Đại Hiệp Ẩn Danh";
                let vip = window.getVipLevelInfo ? window.getVipLevelInfo(d.vipPoints || 0) : { name: "Phàm", color: "#ccc" };

                // 2. Kiểm tra xem đã là bạn bè chưa
                let frSnap = await db.ref(`users/${this.myId}/friends/${inp}`).once('value');
                if (frSnap.exists()) {
                    resEl.innerHTML = `
                        <div class="fr-list-item" style="background: #1a0f07; border: 2px solid #4caf50; padding: 15px; text-align: center;">
                            <span style="color:#ffeb3b; font-weight: bold; font-size: 1.1rem;">Người này đã là hảo hữu của bạn!</span>
                        </div>`;
                    return;
                }

                // 3. Kiểm tra xem mình ĐÃ GỬI lời mời cho họ chưa
                let reqSnap = await db.ref(`friend_requests/${inp}/${this.myId}`).once('value');
                if (reqSnap.exists()) {
                    resEl.innerHTML = `
                        <div class="fr-list-item" style="background: #1a0f07; border: 2px solid #9c27b0; display: flex; flex-direction: column; gap: 15px; padding: 15px;">
                            <div style="display: flex; align-items: center; gap: 15px; width: 100%;">
                                <img src="${avt}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid ${vip.color}; object-fit: cover;">
                                <div style="text-align: left;">
                                    <div style="color: ${vip.color}; font-weight: bold; font-size: 1.1rem;">${name}</div>
                                    <div style="font-size: 0.8rem; color: #aaa; margin-top: 3px;">ID: ${inp}</div>
                                </div>
                            </div>
                            <div style="display: flex; gap: 10px; width: 100%;">
                                <button disabled class="fr-btn-action" style="flex: 1; background: #555; color: #ccc; border-color: #777; cursor: not-allowed;">⏳ Đã Gửi Mời</button>
                                <button onclick="FriendSystem.cancelSentRequest('${inp}')" class="fr-btn-action fr-btn-reject" style="flex: 1;">Hủy Lời Mời</button>
                            </div>
                        </div>
                    `;
                    return;
                }

                // 4. Kiểm tra xem họ ĐÃ GỬI lời mời cho mình chưa
                let incomingReqSnap = await db.ref(`friend_requests/${this.myId}/${inp}`).once('value');
                if (incomingReqSnap.exists()) {
                     resEl.innerHTML = `
                        <div class="fr-list-item" style="background: #1a0f07; border: 2px solid #ff9800; display: flex; flex-direction: column; gap: 15px; padding: 15px;">
                            <div style="color: #ff9800; font-weight: bold;">Người này đang chờ bạn đồng ý kết bạn!</div>
                            <button onclick="FriendSystem.renderModal('requests')" class="fr-btn-action" style="background: #ff9800; color: #fff; width: 100%; padding: 10px;">Sang tab LỜI MỜI để duyệt</button>
                        </div>`;
                    return;
                }

                // 5. Nếu chưa có gì, hiển thị nút Gửi Lời Mời bình thường
                resEl.innerHTML = `
                    <div class="fr-list-item" style="background: #1a0f07; border: 2px solid #9c27b0; display: flex; flex-direction: column; gap: 15px; padding: 15px;">
                        <div style="display: flex; align-items: center; gap: 15px; width: 100%;">
                            <img src="${avt}" style="width: 50px; height: 50px; border-radius: 50%; border: 2px solid ${vip.color}; object-fit: cover;">
                            <div style="text-align: left;">
                                <div style="color: ${vip.color}; font-weight: bold; font-size: 1.1rem;">${name}</div>
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
            }).catch(() => {
                alert("Gửi lời mời thất bại!");
            });
        },

        cancelSentRequest: function(targetId) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            let db = window.firebase.database();
            
            db.ref(`friend_requests/${targetId}/${this.myId}`).remove().then(() => {
                FriendSystem.searchUser();
            });
        },

        // --- TAB 3: XỬ LÝ LỜI MỜI KẾT BẠN ---
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
                    let itemHtml = `
                    <div class="fr-list-item" id="req-${senderId}" style="flex-direction: column; gap: 10px; align-items: flex-start;">
                        <div style="display: flex; align-items: center; gap: 10px; width: 100%;">
                            <img src="${d.avatar}" style="width: 40px; height: 40px; border-radius: 50%; border: 1px solid #ccc; object-fit: cover;">
                            <div>
                                <div style="color: #fff; font-weight: bold; font-size: 1.1rem;">${d.name}</div>
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
                if(el) el.innerHTML = '<span style="color:#00e676; padding: 10px; width: 100%; text-align:center; font-weight: bold;">✅ Đã kết giao thành công!</span>';
            }).catch(()=> alert("Lỗi khi kết bạn!"));
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