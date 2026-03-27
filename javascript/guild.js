/* ========================================================
 * TÁC GIẢ: BỞI VĂN CƯỜNG (CODE BY VANCUONG)
 * BẢN QUYỀN: ĐỘC QUYỀN SERVER TU TIÊN PIKACHU
 * MÔ TẢ: HỆ THỐNG TÔNG MÔN HOÀN CHỈNH V2.1 (FIX LỖI 2 TÔNG MÔN)
 * ======================================================== */
(function() {
    if (!document.getElementById('guild-styles')) {
        let style = document.createElement('style'); style.id = 'guild-styles';
        style.innerHTML = `
            .guild-modal { max-width: 650px; width: 95%; max-height: 90vh; overflow-y: auto; }
            .guild-tab-btn { flex: 1; padding: 10px; background: #2c1a0c; color: #ccc; border: 2px solid #8b5a2b; cursor: pointer; font-weight: bold; border-radius: 8px 8px 0 0; transition: 0.2s; font-size: 0.9rem; }
            .guild-tab-btn.active { background: linear-gradient(to bottom, #9c27b0, #6a1b9a); color: #fff; border-color: #e1bee7; box-shadow: 0 -2px 10px rgba(156, 39, 176, 0.5); }
            .member-item { display: flex; align-items: center; justify-content: space-between; background: rgba(0,0,0,0.6); padding: 12px; border-radius: 8px; margin-bottom: 8px; border: 1px solid #555; }
            .guild-chat-box { height: 380px; overflow-y: auto; background: rgba(0,0,0,0.75); padding: 15px; border-radius: 8px; border: 2px solid #8b5a2b; }
            .guild-inventory { background: rgba(0,0,0,0.6); padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px dashed #d4af37; }
            .role-leader { color: #ffd700; font-weight: bold; text-shadow: 0 0 5px #ffd700; }
            .role-vice { color: #00ffff; font-weight: bold; text-shadow: 0 0 5px #00ffff; }
            .role-elite { color: #ff00ff; font-weight: bold; }
            .role-inner { color: #00ff00; }
            .role-outer { color: #ccc; }
            .guild-chat-message { display: flex; margin-bottom: 12px; align-items: flex-start; }
            .guild-chat-message.me { flex-direction: row-reverse; }
            .g-btn { border: 1px solid #fff; padding: 6px 12px; border-radius: 6px; cursor: pointer; font-weight: bold; transition: 0.2s; color: #fff; font-size: 0.85rem; }
            .g-btn:hover { filter: brightness(1.2); }
        `;
        document.head.appendChild(style);
    }

    let alertMsg = window.showCustomAlertInternal || window.alert;

    window.GuildSystem = {
        myId: null,
        currentGuildId: null,
        chatRef: null,

        showAlert: function(msg) {
            if(window.showCustomAlertInternal) window.showCustomAlertInternal(msg);
            else alert(msg);
        },

        showConfirm: function(msg, callback) {
            if(window.showCustomConfirmInternal) window.showCustomConfirmInternal(msg, callback);
            else if(confirm(msg)) callback();
        },

        openGuildLobby: function() {
            this.myId = localStorage.getItem('pikachu_account_id');
            if (!this.myId) return this.showAlert("Vui lòng đăng nhập!");
            this.renderModal();
        },

        renderModal: function(tab = 'myguild') {
            let old = document.getElementById('guild-overlay');
            if (old) old.remove();

            const html = `
            <div id="guild-overlay" class="modal-overlay" style="z-index:9999999" onclick="if(event.target.id==='guild-overlay')GuildSystem.closeModal()">
                <div class="modal-content guild-modal" style="background:linear-gradient(#1a0f07,#0f0805);border:4px solid #d4af37;padding:20px; box-shadow: 0 0 30px rgba(212, 175, 55, 0.4);">
                    <h2 style="color:#ffd700;text-align:center;margin-bottom:15px; text-shadow: 2px 2px 0 #000;">🏛️ TÔNG MÔN</h2>
                    
                    <div style="display:flex;border-bottom:3px solid #d4af37;margin-bottom:15px; flex-wrap: wrap;">
                        <button class="guild-tab-btn ${tab==='myguild'?'active':''}" onclick="GuildSystem.switchTab('myguild')">Tông Của Ta</button>
                        <button class="guild-tab-btn ${tab==='create'?'active':''}" onclick="GuildSystem.switchTab('create')">Tạo Tông</button>
                        <button class="guild-tab-btn ${tab==='join'?'active':''}" onclick="GuildSystem.switchTab('join')">Tìm Kiếm</button>
                        <button class="guild-tab-btn ${tab==='chat'?'active':''}" onclick="GuildSystem.switchTab('chat')">💬 Chat</button>
                        <button class="guild-tab-btn ${tab==='members'?'active':''}" onclick="GuildSystem.switchTab('members')">👥 Thành Viên</button>
                        <button class="guild-tab-btn ${tab==='rank'?'active':''}" onclick="GuildSystem.switchTab('rank')">🏆 Xếp Hạng</button>
                    </div>

                    <div id="guild-main-content" style="min-height:400px; text-align: left;"></div>

                    <button onclick="GuildSystem.closeModal();if(window.playSoundInternal)window.playSoundInternal('select')" 
                            style="margin-top:20px;background:linear-gradient(#d4af37,#aa8000);border:2px solid #fff;color:#000;font-weight:bold;padding:12px;border-radius:8px;width:100%;cursor:pointer;font-size:1.1rem;">
                        ĐÓNG TÔNG MÔN
                    </button>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
            this.switchTab(tab);
        },

        closeModal: function() {
            if (this.chatRef) { this.chatRef.off(); this.chatRef = null; }
            let modal = document.getElementById('guild-overlay');
            if (modal) modal.remove();
        },

        switchTab: function(tab) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            let content = document.getElementById('guild-main-content');
            
            document.querySelectorAll('.guild-tab-btn').forEach(btn => btn.classList.remove('active'));
            let activeBtn = document.querySelector(`.guild-tab-btn[onclick*="'${tab}'"]`);
            if(activeBtn) activeBtn.classList.add('active');

            if (tab === 'myguild') this.showMyGuild(content);
            else if (tab === 'create') this.showCreateGuild(content);
            else if (tab === 'join') this.showJoinGuild(content);
            else if (tab === 'chat') this.showGuildChat(content);
            else if (tab === 'members') this.showMemberList(content);
            else if (tab === 'rank') this.showGuildRanking(content);
        },

        showResourceDialog: function(title, coinDesc, expDesc, confirmCallback) {
            let old = document.getElementById('guild-res-dialog');
            if (old) old.remove();

            const html = `
            <div id="guild-res-dialog" class="modal-overlay" style="z-index: 99999999; backdrop-filter: blur(5px);">
                <div class="modal-content" style="max-width: 350px; background: linear-gradient(135deg, #1f140e 0%, #0a0604 100%); border: 3px solid #d4af37; padding: 25px; border-radius: 12px; box-shadow: 0 0 30px rgba(212, 175, 55, 0.6); text-align: center;">
                    <h3 style="color:#ffd700; margin-bottom: 20px; font-size: 1.4rem; text-shadow: 1px 1px 2px #000;">${title}</h3>
                    <div style="text-align: left; margin-bottom: 15px;">
                        <label style="color:#00e676; font-weight:bold; font-size:1rem;">${coinDesc}</label>
                        <input type="number" id="g-res-coin" placeholder="Nhập số Linh Thạch..." style="width:100%; padding:12px; border-radius:8px; border:2px solid #00e676; background:#111; color:#fff; margin-top:8px; outline:none; box-sizing:border-box; font-size:1.1rem;" min="0">
                    </div>
                    <div style="text-align: left; margin-bottom: 25px;">
                        <label style="color:#00ffff; font-weight:bold; font-size:1rem;">${expDesc}</label>
                        <input type="number" id="g-res-exp" placeholder="Nhập số Tu Vi..." style="width:100%; padding:12px; border-radius:8px; border:2px solid #00ffff; background:#111; color:#fff; margin-top:8px; outline:none; box-sizing:border-box; font-size:1.1rem;" min="0">
                    </div>
                    <div style="display: flex; gap: 15px;">
                        <button id="g-res-cancel" style="flex:1; background:#444; border:2px solid #777; color:#fff; padding:12px; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s;">HỦY</button>
                        <button id="g-res-confirm" style="flex:1; background:linear-gradient(to bottom, #d4af37, #aa8000); border:2px solid #fff; color:#000; padding:12px; border-radius:8px; cursor:pointer; font-weight:bold; transition:0.2s; box-shadow: 0 0 10px rgba(212,175,55,0.5);">XÁC NHẬN</button>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
            document.getElementById('g-res-cancel').onclick = () => { if(window.playSoundInternal) window.playSoundInternal('select'); document.getElementById('guild-res-dialog').remove(); };
            document.getElementById('g-res-confirm').onclick = () => {
                if(window.playSoundInternal) window.playSoundInternal('select');
                let coins = parseInt(document.getElementById('g-res-coin').value) || 0;
                let exp = parseInt(document.getElementById('g-res-exp').value) || 0;
                document.getElementById('guild-res-dialog').remove();
                confirmCallback(coins, exp);
            };
        },

        showPromoteDialog: function(uid, name, currentRole, viceCount) {
            let old = document.getElementById('guild-promote-dialog');
            if (old) old.remove();

            const html = `
            <div id="guild-promote-dialog" class="modal-overlay" style="z-index: 99999999; backdrop-filter: blur(5px);">
                <div class="modal-content" style="max-width: 350px; background: linear-gradient(135deg, #1f140e 0%, #0a0604 100%); border: 3px solid #ff9800; padding: 25px; border-radius: 12px; text-align: center; box-shadow: 0 0 30px rgba(255, 152, 0, 0.6);">
                    <h3 style="color:#ff9800; margin-bottom: 15px; font-size: 1.4rem; text-shadow: 1px 1px 2px #000;">SẮC PHONG CHỨC VỤ</h3>
                    <p style="color:#ccc; margin-bottom: 20px;">Định đoạt tiền đồ của <b style="color:#fff">${name}</b>:</p>
                    
                    <div style="display:flex; flex-direction:column; gap:10px; margin-bottom: 20px;">
                        <button id="btn-prom-vice" class="g-btn" style="background:linear-gradient(to right, #0083B0, #00B4DB); color:#fff; padding: 12px; font-size:1rem;">👑 Phó Tông Chủ (${viceCount}/2)</button>
                        <button id="btn-prom-elite" class="g-btn" style="background:linear-gradient(to right, #8e44ad, #c0392b); color:#fff; padding: 12px; font-size:1rem;">⚔️ Đệ Tử Tinh Anh</button>
                        <button id="btn-prom-inner" class="g-btn" style="background:linear-gradient(to right, #11998e, #38ef7d); color:#fff; padding: 12px; font-size:1rem;">🔥 Đệ Tử Nội Môn</button>
                        <button id="btn-prom-outer" class="g-btn" style="background:#555; color:#fff; padding: 12px; font-size:1rem;">🍂 Giáng xuống Ngoại Môn</button>
                    </div>

                    <button id="btn-prom-cancel" class="g-btn" style="background:#444; width:100%; padding: 12px;">HỦY BỎ</button>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);

            document.getElementById('btn-prom-cancel').onclick = () => { if(window.playSoundInternal) window.playSoundInternal('select'); document.getElementById('guild-promote-dialog').remove(); };
            
            document.getElementById('btn-prom-vice').onclick = () => {
                if(window.playSoundInternal) window.playSoundInternal('select');
                if (currentRole !== 'vice' && viceCount >= 2) {
                    GuildSystem.showAlert("Tông Môn đã có đủ 2 Phó Tông Chủ! Khâm thử.");
                } else {
                    document.getElementById('guild-promote-dialog').remove();
                    GuildSystem.executePromote(uid, name, 'vice');
                }
            };
            document.getElementById('btn-prom-elite').onclick = () => { if(window.playSoundInternal) window.playSoundInternal('select'); document.getElementById('guild-promote-dialog').remove(); GuildSystem.executePromote(uid, name, 'elite'); };
            document.getElementById('btn-prom-inner').onclick = () => { if(window.playSoundInternal) window.playSoundInternal('select'); document.getElementById('guild-promote-dialog').remove(); GuildSystem.executePromote(uid, name, 'inner'); };
            document.getElementById('btn-prom-outer').onclick = () => { if(window.playSoundInternal) window.playSoundInternal('select'); document.getElementById('guild-promote-dialog').remove(); GuildSystem.executePromote(uid, name, 'outer'); };
        },

        executePromote: function(uid, name, newRole) {
            let db = window.firebase.database();
            db.ref('users/' + uid).update({ guildRole: newRole }).then(() => {
                this.showAlert(`Đã sắc phong [${name}] chức vụ mới!`);
                this.showMemberList(document.getElementById('guild-main-content'));
            });
        },

        // ====================== TAB 1: TÔNG CỦA TÔI ======================
        showMyGuild: function(el) {
            let db = window.firebase.database();
            el.innerHTML = `<div style="text-align:center; padding: 50px; color:#aaa;">Đang tải thông tin Tông Môn...</div>`;
            
            db.ref('users/' + this.myId).once('value').then(snap => {
                let uData = snap.val() || {};
                let guildId = uData.guildId;
                
                if (!guildId) {
                    el.innerHTML = `<div style="text-align:center;padding:60px;color:#aaa;font-size:1.1rem;">Bạn chưa gia nhập Tông Môn nào.<br><br><button onclick="GuildSystem.switchTab('create')" class="g-btn" style="background:#4caf50;padding:10px 20px;">Sáng Lập Tông Môn (500 💎)</button></div>`;
                    return;
                }
                this.currentGuildId = guildId;
                
                db.ref('guilds/' + guildId).once('value').then(gSnap => {
                    let g = gSnap.val();
                    if(!g) {
                        // Kẹt Tông môn ảo -> Xóa
                        db.ref('users/' + this.myId).update({ guildId: null });
                        this.switchTab('myguild');
                        return;
                    }
                    let myRole = uData.guildRole || 'outer';
                    let isManager = (myRole === 'leader' || myRole === 'vice');

                    let invCoins = g.inventory?.coins || 0;
                    let invExp = g.inventory?.exp || 0;

                    let html = `
                    <div style="text-align:center;">
                        <h2 style="color:#ffd700; margin-bottom: 5px; text-shadow: 1px 1px 2px #000;">${g.name}</h2>
                        <p style="color:#00ffff; font-style: italic; margin-bottom: 15px;">"${g.slogan || 'Chưa có khẩu hiệu'}"</p>
                    </div>
                    <div class="guild-inventory">
                        <h4 style="color:#ffd700; margin-bottom: 10px; text-align: center; font-size: 1.2rem;">KHO TÔNG MÔN</h4>
                        <div style="display:flex; justify-content:space-around; color:#fff; font-size:1.1rem; font-weight:bold;">
                            <div title="Linh Thạch">💎 ${invCoins.toLocaleString('vi-VN')}</div>
                            <div title="Tu Vi">✨ ${invExp.toLocaleString('vi-VN')}</div>
                        </div>
                    </div>
                    <div style="display:flex; gap: 10px; margin-bottom: 15px;">
                        <button onclick="GuildSystem.contributeToGuild()" class="g-btn" style="flex:1; background:linear-gradient(#00bfff,#0088cc); padding: 12px; font-size: 1rem;">Phụng Hiến</button>
                        ${isManager ? `<button onclick="GuildSystem.withdrawFromGuild()" class="g-btn" style="flex:1; background:linear-gradient(#ff9800,#e65100); padding: 12px; font-size: 1rem;">Rút Quỹ</button>` : ''}
                    </div>

                    <div style="text-align:center; border-top: 1px solid #555; padding-top: 15px; margin-top: 10px;">
                        ${isManager && g.requireApproval ? `<button onclick="GuildSystem.manageRequests()" class="g-btn" style="background:#9c27b0; padding: 10px 20px; margin-bottom: 10px;">Duyệt Đệ Tử Xin Vào</button><br>` : ''}
                        
                        ${myRole === 'leader' ? 
                            `<button onclick="GuildSystem.leaveGuild(true)" class="g-btn" style="background:#f44336; padding: 8px 20px;">Giải Tán Tông Môn</button>` : 
                            `<button onclick="GuildSystem.leaveGuild(false)" class="g-btn" style="background:#f44336; padding: 8px 20px;">Phản Tông (Rời Đi)</button>`
                        }
                    </div>
                    `;
                    el.innerHTML = html;
                });
            });
        },

        // NÚT MỚI: GIẢI TÁN / RỜI TÔNG
        leaveGuild: function(isLeader) {
            let db = window.firebase.database();
            if (isLeader) {
                this.showConfirm("Sếp là Tông Chủ! Nếu rời đi, Tông Môn sẽ bị GIẢI TÁN và xóa sổ khỏi Vạn Giới. Chắc chắn chứ?", () => {
                    db.ref('guilds/' + this.currentGuildId).remove();
                    db.ref('guild_chat/' + this.currentGuildId).remove();
                    db.ref('guild_requests/' + this.currentGuildId).remove();
                    db.ref('users/' + this.myId).update({ guildId: null, guildRole: "outer", contribution: 0 });
                    
                    // Xóa guildId của tất cả member khác
                    db.ref('users').orderByChild('guildId').equalTo(this.currentGuildId).once('value').then(snap => {
                        snap.forEach(u => { db.ref('users/' + u.key).update({ guildId: null, guildRole: "outer", contribution: 0 }); });
                    });

                    localStorage.removeItem('pikachu_guild_role');
                    this.currentGuildId = null;
                    this.showAlert("Đã giải tán Tông Môn!");
                    this.switchTab('join');
                });
            } else {
                this.showConfirm("Chắc chắn muốn phản xuất Tông Môn? Mọi cống hiến từ trước đến nay sẽ mất trắng!", () => {
                    db.ref('users/' + this.myId).update({ guildId: null, guildRole: "outer", contribution: 0 });
                    db.ref('guilds/' + this.currentGuildId).transaction(g => {
                        if (g) g.memberCount = Math.max(0, (g.memberCount || 1) - 1);
                        return g;
                    });
                    localStorage.removeItem('pikachu_guild_role');
                    this.currentGuildId = null;
                    this.showAlert("Đã rời khỏi Tông Môn!");
                    this.switchTab('join');
                });
            }
        },

        contributeToGuild: function() {
            if(window.playSoundInternal) window.playSoundInternal('select');
            let myCoins = parseInt(localStorage.getItem('pikachu_coins')) || 0;
            let myExp = parseInt(localStorage.getItem('pikachu_exp')) || 0;

            this.showResourceDialog("ĐÓNG GÓP TÔNG MÔN", `Túi đang có: 💎 ${myCoins.toLocaleString('vi-VN')}`, `Tu vi hiện tại: ✨ ${myExp.toLocaleString('vi-VN')}`, (addCoins, addExp) => {
                if (addCoins <= 0 && addExp <= 0) return;
                if (myCoins < addCoins) return this.showAlert("Linh Thạch trong túi không đủ!");
                if (myExp < addExp) return this.showAlert("Tu Vi bản thân không đủ!");

                let db = window.firebase.database();
                let newCoins = myCoins - addCoins; let newExp = myExp - addExp;
                localStorage.setItem('pikachu_coins', newCoins); localStorage.setItem('pikachu_exp', newExp);
                
                db.ref('users/' + this.myId).transaction(u => {
                    if (u) { u.coins = newCoins; u.exp = newExp; u.contribution = (u.contribution || 0) + addCoins + Math.floor(addExp / 2); } return u;
                });
                db.ref('guilds/' + this.currentGuildId).transaction(g => {
                    if (g) { g.inventory = g.inventory || { coins: 0, exp: 0 }; g.inventory.coins = (g.inventory.coins || 0) + addCoins; g.inventory.exp = (g.inventory.exp || 0) + addExp; g.totalPoints = (g.totalPoints || 0) + addCoins + Math.floor(addExp / 2); } return g;
                });
                this.showAlert(`✅ Đã cống hiến ${addCoins} 💎 và ${addExp} ✨ cho Tông Môn!`);
                this.showMyGuild(document.getElementById('guild-main-content'));
            });
        },

        withdrawFromGuild: function() {
            if(window.playSoundInternal) window.playSoundInternal('select');
            let db = window.firebase.database();
            db.ref('guilds/' + this.currentGuildId).once('value').then(snap => {
                let g = snap.val();
                let maxCoins = g.inventory?.coins || 0; let maxExp = g.inventory?.exp || 0;

                this.showResourceDialog("RÚT QUỸ TÔNG MÔN", `Kho hiện có: 💎 ${maxCoins.toLocaleString('vi-VN')}`, `Kho hiện có: ✨ ${maxExp.toLocaleString('vi-VN')}`, (takeCoins, takeExp) => {
                    if (takeCoins <= 0 && takeExp <= 0) return;
                    if (maxCoins < takeCoins) return this.showAlert("Quỹ Linh Thạch Tông Môn không đủ!");
                    if (maxExp < takeExp) return this.showAlert("Quỹ Tu Vi Tông Môn không đủ!");

                    db.ref('guilds/' + this.currentGuildId).transaction(guild => {
                        if (guild && guild.inventory) { guild.inventory.coins -= takeCoins; guild.inventory.exp -= takeExp; } return guild;
                    });

                    let myCoins = parseInt(localStorage.getItem('pikachu_coins')) || 0; let myExp = parseInt(localStorage.getItem('pikachu_exp')) || 0;
                    let newCoins = myCoins + takeCoins; let newExp = myExp + takeExp;
                    localStorage.setItem('pikachu_coins', newCoins); localStorage.setItem('pikachu_exp', newExp);
                    db.ref('users/' + this.myId).update({ coins: newCoins, exp: newExp });
                    this.showAlert(`💰 Đã rút thành công ${takeCoins} 💎 và ${takeExp} ✨ về túi riêng!`);
                    this.showMyGuild(document.getElementById('guild-main-content'));
                });
            });
        },

        manageRequests: function() {
            let el = document.getElementById('guild-main-content');
            el.innerHTML = `<h3 style="color:#00ffff; text-align:center;">Danh sách Đệ Tử Khảo Hạch</h3><div id="guild-req-list">Đang tải...</div>`;
            let db = window.firebase.database();
            db.ref('guild_requests/' + this.currentGuildId).once('value').then(snap => {
                let reqList = document.getElementById('guild-req-list');
                if (!snap.exists()) { reqList.innerHTML = `<p style="text-align:center; color:#ccc; margin-top:20px;">Hiện không có ai xin gia nhập.</p>`; return; }
                let html = '';
                snap.forEach(child => {
                    let uid = child.key; let d = child.val();
                    html += `
                    <div class="member-item">
                        <div style="display:flex; align-items:center; gap:10px;">
                            <img src="${d.avatar || 'https://i.imgur.com/7HnLKEg.png'}" style="width:40px;height:40px;border-radius:50%;object-fit:cover;">
                            <div>
                                <div style="color:#fff; font-weight:bold;">${d.name}</div>
                                <div style="font-size:0.8rem; color:#aaa;">ID: ${uid}</div>
                            </div>
                        </div>
                        <div style="display:flex; gap:5px;">
                            <button onclick="GuildSystem.approveRequest('${uid}', '${d.name}')" class="g-btn" style="background:#4caf50;">Duyệt</button>
                            <button onclick="GuildSystem.rejectRequest('${uid}')" class="g-btn" style="background:#f44336;">Xóa</button>
                        </div>
                    </div>`;
                });
                reqList.innerHTML = html;
            });
        },

        approveRequest: function(uid, name) {
            let db = window.firebase.database();
            
            // ĐÃ FIX LỖI: Kiểm tra xem nó đã lén vào tông khác chưa trước khi duyệt
            db.ref('users/' + uid + '/guildId').once('value').then(snap => {
                if (snap.val()) {
                    this.showAlert(`Đệ tử [${name}] đã bái nhập môn phái khác mất rồi!`);
                    db.ref('guild_requests/' + this.currentGuildId + '/' + uid).remove();
                    this.manageRequests();
                    return;
                }

                db.ref('guild_requests/' + this.currentGuildId + '/' + uid).remove();
                db.ref('users/' + uid).update({ guildId: this.currentGuildId, guildRole: "outer" });
                db.ref('guilds/' + this.currentGuildId).transaction(g => { if(g) g.memberCount = (g.memberCount || 0) + 1; return g; });
                this.showAlert(`Đã thu nhận đệ tử ${name}!`); 
                this.manageRequests();
            });
        },

        rejectRequest: function(uid) {
            window.firebase.database().ref('guild_requests/' + this.currentGuildId + '/' + uid).remove();
            this.manageRequests();
        },

        // ====================== TAB 2 & 3: TẠO VÀ TÌM KIẾM (ĐÃ FIX LỖI 2 TÔNG MÔN) ======================
        showCreateGuild: function(el) {
            let coins = parseInt(localStorage.getItem('pikachu_coins')) || 0;
            el.innerHTML = `
                <div style="padding:10px;text-align:center;">
                    <p style="color:#ffd700;font-size:1.2rem; font-weight:bold;">Khai Tông Lập Phái</p>
                    <p style="color:#aaa;">Phí thành lập: <b style="color:#00ffff;">500 Linh Thạch</b></p>
                    <input id="guild-name-input" type="text" placeholder="Tên Tông Môn (Tối đa 20 ký tự)" maxlength="20" style="width:100%;padding:12px;margin:15px 0;border-radius:8px;border:2px solid #d4af37;background:#111;color:#fff;font-size:1.1rem;box-sizing:border-box;">
                    <input id="guild-slogan-input" type="text" placeholder="Khẩu hiệu Tông Môn (Tùy chọn)" maxlength="40" style="width:100%;padding:12px;margin-bottom:15px;border-radius:8px;border:2px solid #d4af37;background:#111;color:#fff;font-size:1rem;box-sizing:border-box;">
                    <div style="text-align:left; margin-bottom: 20px;">
                        <label style="color:#fff; font-weight:bold; margin-bottom:5px; display:block;">Quy tắc tuyển đệ tử:</label>
                        <select id="guild-approval-select" style="width:100%;padding:12px;border-radius:8px;background:#222;color:#fff;border:1px solid #555;font-size:1rem;">
                            <option value="true">Khảo Hạch (Phải được Tông Chủ duyệt)</option>
                            <option value="false">Cửa Mở (Ai vào cũng được)</option>
                        </select>
                    </div>
                    <button onclick="GuildSystem.createNewGuild()" class="g-btn" style="background:linear-gradient(#4caf50,#2e7d32);font-size:1.2rem;width:100%;padding:15px;">THIẾT LẬP TÔNG MÔN</button>
                    <p style="color:#aaa;margin-top:15px;">Ngài đang có: ${coins.toLocaleString('vi-VN')} 💎</p>
                </div>`;
        },

        createNewGuild: function() {
            let name = document.getElementById('guild-name-input').value.trim();
            if (!name) return this.showAlert("Vui lòng đặt tên cho Tông Môn!");
            let coins = parseInt(localStorage.getItem('pikachu_coins')) || 0;
            if (coins < 500) return this.showAlert("Linh thạch không đủ để xây dựng cơ đồ!");

            let db = window.firebase.database();
            
            // ĐÃ FIX LỖI: Kiểm tra xem đã có tông môn chưa
            db.ref('users/' + this.myId + '/guildId').once('value').then(snap => {
                if (snap.val()) return this.showAlert("Ngài đang ở trong một Tông Môn, không thể lập thêm môn phái! Hãy rời Tông Môn hiện tại trước.");

                let slogan = document.getElementById('guild-slogan-input').value.trim();
                let requireApproval = document.getElementById('guild-approval-select').value === 'true';
                let guildId = "guild_" + Date.now();

                db.ref('guilds/' + guildId).set({
                    name: name, slogan: slogan, leader: this.myId, leaderName: localStorage.getItem('pikachu_player_name') || "Tông Chủ",
                    createdAt: window.firebase.database.ServerValue.TIMESTAMP, totalPoints: 0, memberCount: 1, requireApproval: requireApproval,
                    inventory: { coins: 0, exp: 0 }
                }).then(() => {
                    db.ref('users/' + this.myId).update({ guildId: guildId, guildRole: "leader" });
                    localStorage.setItem('pikachu_coins', coins - 500);
                    localStorage.setItem('pikachu_guild_role', 'leader');
                    this.showAlert(`✅ Khai tông lập phái "${name}" thành công!`);
                    this.switchTab('myguild');
                });
            });
        },

        showJoinGuild: function(el) {
            el.innerHTML = `
                <div style="padding:10px;">
                    <input id="guild-search-input" type="text" placeholder="Nhập Tên Tông Môn hoặc ID..." style="width:100%;padding:12px;border-radius:8px;border:2px solid #00bfff;background:#111;color:#fff;box-sizing:border-box;font-size:1.1rem;">
                    <button onclick="GuildSystem.searchGuild()" class="g-btn" style="width:100%;margin-top:10px;padding:12px;background:linear-gradient(#00bfff,#0088cc);font-size:1.1rem;">🔍 Dò Tìm Tông Môn</button>
                    <div id="guild-search-result" style="margin-top:20px;min-height:200px;"></div>
                </div>`;
        },

        searchGuild: function() {
            let keyword = document.getElementById('guild-search-input').value.trim().toLowerCase();
            let resultEl = document.getElementById('guild-search-result');
            resultEl.innerHTML = `<p style="color:#aaa;text-align:center;">Đang dùng thần thức dò tìm...</p>`;

            window.firebase.database().ref('guilds').once('value').then(snap => {
                let html = ''; let found = false;
                snap.forEach(child => {
                    let g = child.val(); let gId = child.key;
                    if (g.name.toLowerCase().includes(keyword) || gId.includes(keyword)) {
                        found = true;
                        html += `
                        <div class="member-item">
                            <div>
                                <div style="color:#ffd700; font-weight:bold; font-size:1.1rem;">${g.name}</div>
                                <div style="color:#00ffff; font-size:0.85rem;">${g.slogan || 'Bí ẩn'}</div>
                                <div style="color:#aaa; font-size:0.8rem; margin-top:5px;">Thành viên: ${g.memberCount||1} | Quy tắc: ${g.requireApproval ? 'Khảo Hạch' : 'Tự Do'}</div>
                            </div>
                            <button onclick="GuildSystem.joinGuild('${gId}', '${g.name}', ${g.requireApproval})" class="g-btn" style="background:#4caf50;">Gia Nhập</button>
                        </div>`;
                    }
                });
                resultEl.innerHTML = found ? html : `<p style="color:#ff5252;text-align:center;">Không tìm thấy Tông Môn phù hợp.</p>`;
            });
        },

        joinGuild: function(guildId, guildName, requireApproval) {
            let db = window.firebase.database();
            
            // ĐÃ FIX LỖI: Kiểm tra xem đã có tông môn chưa
            db.ref('users/' + this.myId + '/guildId').once('value').then(snap => {
                let currentGuildId = snap.val();
                if (currentGuildId) {
                    if (currentGuildId === guildId) return this.showAlert("Ngài đã là người của Tông Môn này rồi!");
                    else return this.showAlert("Ngài đang ở trong một Tông Môn khác! Phải phản tông môn hiện tại mới có thể bái nhập nơi mới.");
                }

                if (requireApproval) {
                    this.showConfirm(`Tông Môn "${guildName}" yêu cầu khảo hạch.\nGửi đơn bái sư?`, () => {
                        db.ref('guild_requests/' + guildId + '/' + this.myId).set({ name: localStorage.getItem('pikachu_player_name'), avatar: localStorage.getItem('pikachu_player_avatar'), timestamp: window.firebase.database.ServerValue.TIMESTAMP });
                        this.showAlert("✅ Đã gửi đơn bái sư! Chờ Tông Chủ phê duyệt.");
                    });
                } else {
                    this.showConfirm(`Bước vào "${guildName}" ngay lập tức?`, () => {
                        db.ref('users/' + this.myId).update({ guildId: guildId, guildRole: "outer" }).then(() => {
                            db.ref('guilds/' + guildId).transaction(g => { if(g) g.memberCount = (g.memberCount||0)+1; return g; });
                            localStorage.setItem('pikachu_guild_role', 'outer');
                            this.showAlert(`✅ Ngài đã là đệ tử của "${guildName}"!`);
                            this.switchTab('myguild');
                        });
                    });
                }
            });
        },

        // ====================== TAB 4: CHAT TÔNG MÔN ======================
        showGuildChat: function(el) {
            let db = window.firebase.database();
            db.ref('users/' + this.myId + '/guildId').once('value').then(snap => {
                let guildId = snap.val();
                if (!guildId) return el.innerHTML = `<p style="color:#aaa;text-align:center;padding:60px;">Chưa gia nhập Tông Môn, lấy ai mà truyền âm?</p>`;
                this.currentGuildId = guildId;

                el.innerHTML = `
                <div style="height:420px;display:flex;flex-direction:column;">
                    <div id="guild-chat-box" class="guild-chat-box"></div>
                    <div style="margin-top:10px;display:flex;gap:8px;">
                        <input id="guild-chat-input" type="text" placeholder="Nhập Mật Âm Tông Môn..." maxlength="120" style="flex:1; padding:10px; border-radius:8px; border:2px solid #8b5a2b; background:#111; color:#00ffff; font-size:1rem; outline:none;">
                        <button onclick="GuildSystem.sendGuildChat()" class="g-btn" style="background:#00bfff; padding:10px 20px; font-size:1rem;">Phát</button>
                    </div>
                </div>`;

                if (this.chatRef) this.chatRef.off();
                this.chatRef = db.ref('guild_chat/' + guildId);
                this.chatRef.limitToLast(50).on('child_added', snap => { this.appendGuildMessage(snap.val()); });
            });
        },

        sendGuildChat: function() {
            let inp = document.getElementById('guild-chat-input');
            let text = inp.value.trim().replace(/</g, "&lt;").replace(/>/g, "&gt;");
            if (!text || !this.currentGuildId) return;
            inp.value = '';

            let db = window.firebase.database();
            db.ref('users/' + this.myId + '/guildRole').once('value').then(roleSnap => {
                let myRole = roleSnap.val() || 'outer';
                db.ref('guild_chat/' + this.currentGuildId).push({
                    senderId: this.myId, name: localStorage.getItem('pikachu_player_name') || "Đệ Tử", avatar: localStorage.getItem('pikachu_player_avatar'),
                    frame: localStorage.getItem('pikachu_equipped_frame') || 'none', role: myRole, text: text, timestamp: window.firebase.database.ServerValue.TIMESTAMP
                });
            });
        },

        appendGuildMessage: function(msg) {
            let box = document.getElementById('guild-chat-box');
            if (!box) return;
            let isMe = msg.senderId === this.myId;
            let roleTag = ''; let nameColor = '#fff';
            if (msg.role === 'leader') { roleTag = '[Tông Chủ]'; nameColor = '#ffd700'; }
            else if (msg.role === 'vice') { roleTag = '[Phó Tông]'; nameColor = '#00ffff'; }
            else if (msg.role === 'elite') { roleTag = '[Tinh Anh]'; nameColor = '#ff00ff'; }
            else if (msg.role === 'inner') { roleTag = '[Nội Môn]'; nameColor = '#00ff00'; }
            else { roleTag = '[Ngoại Môn]'; nameColor = '#ccc'; }

            let coloredName = window.getColoredNameHTML ? window.getColoredNameHTML(msg.senderId, msg.name, nameColor) : `<span style="color:${nameColor}; font-weight:bold;">${msg.name}</span>`;
            let avatarHtml = window.renderAvatarWithFrame ? window.renderAvatarWithFrame(msg.avatar || 'https://i.imgur.com/7HnLKEg.png', msg.frame || 'none', nameColor, 36) : `<img src="${msg.avatar || 'https://i.imgur.com/7HnLKEg.png'}" style="width:36px;height:36px;border-radius:50%;border:2px solid ${nameColor};">`;

            let html = `
            <div class="guild-chat-message ${isMe ? 'me' : ''}">
                <div style="margin: 0 ${isMe ? '0' : '10px'} 0 ${isMe ? '10px' : '0'}; flex-shrink: 0;">${avatarHtml}</div>
                <div style="display: flex; flex-direction: column; align-items: ${isMe ? 'flex-end' : 'flex-start'}; max-width: 75%;">
                    <div style="margin-bottom: 3px; font-size: 0.85rem;">
                        <span style="color:${nameColor}; font-weight:bold; font-size:0.7rem; background:rgba(0,0,0,0.5); padding:2px 5px; border-radius:3px;">${roleTag}</span> 
                        ${coloredName}
                    </div>
                    <div style="background:${isMe?'linear-gradient(135deg, #00695c, #00332a)':'linear-gradient(135deg, #4e342e, #261713)'}; color:#fff; padding:10px 14px; border-radius:12px; border-top-${isMe?'right':'left'}-radius:2px; box-shadow: 0 2px 5px rgba(0,0,0,0.5); word-break: break-word;">
                        ${msg.text}
                    </div>
                </div>
            </div>`;
            box.insertAdjacentHTML('beforeend', html);
            box.scrollTop = box.scrollHeight;
        },

        // ====================== TAB 5: THÀNH VIÊN ======================
        showMemberList: function(el) {
            let db = window.firebase.database();
            el.innerHTML = `<p style="color:#aaa;text-align:center;padding:30px;">Đang triệu tập danh sách đệ tử...</p>`;

            db.ref('users/' + this.myId + '/guildId').once('value').then(snap => {
                let guildId = snap.val();
                if (!guildId) return el.innerHTML = `<p style="color:#aaa;text-align:center">Bạn chưa thuộc Tông Môn</p>`;

                db.ref('users').orderByChild('guildId').equalTo(guildId).once('value').then(usersSnap => {
                    let members = [];
                    let myRole = 'outer';
                    
                    usersSnap.forEach(u => {
                        let data = u.val();
                        let r = data.guildRole || 'outer';
                        if (u.key === this.myId) myRole = r; 
                        members.push({ id: u.key, name: data.displayName || "Ẩn Danh", avatar: data.avatar, role: r, contribution: data.contribution || 0 });
                    });
                    
                    let isManager = (myRole === 'leader' || myRole === 'vice');
                    let roleWeight = { 'leader': 5, 'vice': 4, 'elite': 3, 'inner': 2, 'outer': 1 };
                    members.sort((a,b) => {
                        if (roleWeight[a.role] !== roleWeight[b.role]) return roleWeight[b.role] - roleWeight[a.role];
                        return b.contribution - a.contribution;
                    });

                    let htmlList = '';
                    let viceCount = 0;
                    members.forEach(m => { if (m.role === 'vice') viceCount++; });

                    members.forEach(m => {
                        let roleText = '';
                        if (m.role === 'leader') roleText = `<span class="role-leader">👑 Tông Chủ</span>`;
                        else if (m.role === 'vice') roleText = `<span class="role-vice">🛡️ Phó Tông Chủ</span>`;
                        else if (m.role === 'elite') roleText = `<span class="role-elite">⚔️ Đệ Tử Tinh Anh</span>`;
                        else if (m.role === 'inner') roleText = `<span class="role-inner">🔥 Đệ Tử Nội Môn</span>`;
                        else roleText = `<span class="role-outer">🍂 Đệ Tử Ngoại Môn</span>`;

                        let coloredName = window.getColoredNameHTML ? window.getColoredNameHTML(m.id, m.name, '#fff') : m.name;

                        let actionBtns = '';
                        if (myRole === 'leader' && m.role !== 'leader') {
                            actionBtns += `<button onclick="GuildSystem.showPromoteDialog('${m.id}', '${m.name}', '${m.role}', ${viceCount})" class="g-btn" style="background:#ff9800; padding:6px 10px; font-size:0.8rem; box-shadow: 0 0 5px rgba(255,152,0,0.5);">Phong Chức</button>`;
                        }
                        if (isManager && m.role !== 'leader' && m.id !== this.myId) {
                            if (myRole === 'leader' || (myRole === 'vice' && m.role !== 'vice')) {
                                actionBtns += `<button onclick="GuildSystem.kickMember('${m.id}','${m.name}')" class="g-btn" style="background:#f44336; padding:6px 10px; font-size:0.8rem; margin-left:5px;">Trục Xuất</button>`;
                            }
                        }

                        htmlList += `
                        <div class="member-item">
                            <div style="display:flex;align-items:center;gap:12px">
                                <img src="${m.avatar || 'https://i.imgur.com/7HnLKEg.png'}" style="width:45px;height:45px;border-radius:50%;object-fit:cover;border:1px solid #777;">
                                <div>
                                    <div style="font-size:1.15rem;">${coloredName}</div>
                                    <div style="font-size:0.85rem; margin-top:3px;">${roleText}</div>
                                </div>
                            </div>
                            <div style="text-align:right">
                                <div style="color:#00e676; font-size:0.9rem; margin-bottom:8px;">Cống hiến: <b style="font-size:1.1rem">${m.contribution.toLocaleString('vi-VN')}</b></div>
                                <div>${actionBtns}</div>
                            </div>
                        </div>`;
                    });
                    
                    el.innerHTML = `<h3 style="color:#00ffff; margin-bottom: 15px; border-bottom: 1px dashed #00ffff; padding-bottom: 10px;">Thành viên: ${members.length}</h3><div style="max-height:350px; overflow-y:auto; padding-right:5px;">${htmlList}</div>`;
                });
            });
        },

        // ====================== TAB 6: XẾP HẠNG TÔNG MÔN ======================
        showGuildRanking: function(el) {
            el.innerHTML = `<p style="text-align:center;color:#00ffff;padding:30px;">Đang dò tìm Xếp Hạng Vạn Giới...</p>`;
            let db = window.firebase.database();
            db.ref('guilds').orderByChild('totalPoints').limitToLast(20).once('value').then(snap => {
                let html = `<table style="width:100%; border-collapse:collapse; text-align:center;">
                            <tr style="background:rgba(212,175,55,0.2); color:#ffd700; border-bottom: 2px solid #d4af37;">
                                <th style="padding:10px;">Hạng</th><th style="text-align:left;">Tông Môn</th><th>Thực Lực</th><th>Nhân Lực</th>
                            </tr>`;
                
                let list = [];
                snap.forEach(child => { list.push(child.val()); });
                list.sort((a,b) => (b.totalPoints || 0) - (a.totalPoints || 0)); 
                
                let rank = 1;
                list.forEach(g => {
                    let rankHtml = rank;
                    let nameColor = '#fff';
                    if (rank === 1) { rankHtml = '🥇'; nameColor = '#ffd700'; }
                    else if (rank === 2) { rankHtml = '🥈'; nameColor = '#e0e0e0'; }
                    else if (rank === 3) { rankHtml = '🥉'; nameColor = '#cd7f32'; }

                    html += `
                    <tr style="border-bottom:1px solid #555; background:rgba(0,0,0,0.4);">
                        <td style="padding:12px; font-size:1.2rem;">${rankHtml}</td>
                        <td style="text-align:left;">
                            <strong style="color:${nameColor}; font-size:1.1rem;">${g.name}</strong><br>
                            <span style="font-size:0.8rem; color:#aaa;">Tông chủ: ${g.leaderName}</span>
                        </td>
                        <td style="color:#00e676; font-weight:bold; font-size:1.1rem;">${(g.totalPoints || 0).toLocaleString('vi-VN')}</td>
                        <td style="color:#00ffff;">${g.memberCount || 1} đệ tử</td>
                    </tr>`;
                    rank++;
                });
                html += `</table>`;
                el.innerHTML = `<div style="max-height:380px; overflow-y:auto; border: 1px solid #8b5a2b; border-radius: 8px;">${html}</div>`;
            });
        }
    };

    // ==================== THÊM NÚT VÀO MENU ====================
    setInterval(() => {
        let actions = document.querySelector('.mm-actions');
        if (actions && !document.getElementById('btn-guild')) {
            let btn = document.createElement('button');
            btn.id = 'btn-guild';
            btn.innerHTML = '🏛️ Tông Môn';
            btn.style.cssText = "background: linear-gradient(to bottom, #8b4513, #5c2e0b); color:#ffd700; padding:6px 12px; border-radius:5px; margin-left:5px; border:2px solid #d4af37; cursor:pointer; font-weight:bold; box-shadow: 0 0 10px rgba(212, 175, 55, 0.4); transition: 0.2s;";
            btn.onmouseover = () => btn.style.transform = "scale(1.05)";
            btn.onmouseleave = () => btn.style.transform = "scale(1)";
            btn.onclick = () => {
                if(window.playSoundInternal) window.playSoundInternal('select');
                window.GuildSystem.openGuildLobby();
            };
            actions.appendChild(btn);
        }
    }, 800);
})();