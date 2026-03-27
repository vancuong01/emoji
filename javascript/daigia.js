/* ========================================================
 * TÁC GIẢ: BỞI VĂN CƯỜNG (CODE BY VANCUONG)
 * BẢN QUYỀN: ĐỘC QUYỀN SERVER TU TIÊN PIKACHU
 * CẢNH BÁO: Mọi hành vi sao chép không xin phép đều là vi phạm!
 ======================================================== */
(function() {
    // 1. BƠM SẴN CSS 7 MÀU VÀO WEB ĐỂ MỌI FILE ĐỀU THẤY
    if (!document.getElementById('daigia-name-styles')) {
        let style = document.createElement('style'); style.id = 'daigia-name-styles';
        style.innerHTML = `
            .rank-1-name { animation: rainbow-text 2s linear infinite !important; font-family: 'Arial Black', sans-serif; font-weight: bold; text-shadow: 0 0 5px rgba(255,255,255,0.8), 0 0 10px rgba(255, 215, 0, 0.8) !important; }
            @keyframes rainbow-text { 0% { color: #ff0000; } 15% { color: #ff7f00; } 30% { color: #ffff00; } 45% { color: #00ff00; } 60% { color: #00ffff; } 75% { color: #ff00ff; } 100% { color: #ff0000; } }
            .rank-2-name { color: #ff3333 !important; text-shadow: 0 0 10px #ff3333, 0 0 20px #ff0000 !important; font-family: 'Arial Black', sans-serif; font-weight: bold; }
            .rank-3-name { color: #cc33ff !important; text-shadow: 0 0 10px #cc33ff, 0 0 20px #9c27b0 !important; font-family: 'Arial Black', sans-serif; font-weight: bold; }
        `;
        document.head.appendChild(style);
    }

    // 2. BIẾN TOÀN CỤC CHỨA TOP 3 ĐẠI GIA VÀ HÀM TÔ MÀU (CÁC FILE KHÁC SẼ GỌI HÀM NÀY)
    window.TopWealthIds = {}; 

    window.getColoredNameHTML = function(accountId, rawName, defaultColor = "#fff") {
        let rank = window.TopWealthIds[accountId];
        if (rank === 1) return `<span class="rank-1-name">${rawName}</span>`;
        if (rank === 2) return `<span class="rank-2-name">${rawName}</span>`;
        if (rank === 3) return `<span class="rank-3-name">${rawName}</span>`;
        
        return `<span style="color: ${defaultColor}; font-weight: bold; text-shadow: 1px 1px 2px #000;">${rawName}</span>`;
    };

    // 3. THEO DÕI NGẦM TOP 3 NGAY TỪ LÚC VÀO GAME
    setTimeout(() => {
        if (typeof window.firebase !== 'undefined' && window.firebase.database) {
            window.firebase.database().ref('users').orderByChild('coins').limitToLast(10).on('value', snapshot => { 
                let daigiaList = []; 
                snapshot.forEach(child => { 
                    let u = child.val();
                    if (!u.isAdmin) {
                        daigiaList.push({ id: child.key, coins: parseInt(u.coins) || 0 }); 
                    }
                });
                
                daigiaList.sort((a, b) => b.coins - a.coins); 
                
                // Ghi nhớ Top 3 vào biến toàn cục
                window.TopWealthIds = {};
                if(daigiaList[0]) window.TopWealthIds[daigiaList[0].id] = 1;
                if(daigiaList[1]) window.TopWealthIds[daigiaList[1].id] = 2;
                if(daigiaList[2]) window.TopWealthIds[list[2].id] = 3;
            });
        }
    }, 1500);

    // 4. VÒNG LẶP TỰ ĐỘNG ÉP MÀU CHO SẢNH VÀ HỒ SƠ (KHÔNG CẦN F5)
    setInterval(() => {
        let myId = localStorage.getItem('pikachu_account_id');
        let myName = localStorage.getItem('pikachu_player_name');
        if (!myId || !myName) return;
        
        // Quét màu tên ở Sảnh
        let lobbyNameEls = document.querySelectorAll('.name-txt'); 
        lobbyNameEls.forEach(el => {
            let defaultColor = el.dataset.defaultColor || el.style.color || '#fff';
            if (!el.dataset.defaultColor) el.dataset.defaultColor = defaultColor;
            
            let newHtml = window.getColoredNameHTML(myId, myName, defaultColor);
            if (el.innerHTML !== newHtml) el.innerHTML = newHtml;
        });
        
        // Quét màu tên ở Hồ Sơ
        let profileNameEl = document.getElementById('profile-colored-name-display');
        if (profileNameEl) {
            let defaultColor = profileNameEl.dataset.defaultColor || '#fff';
            let newHtml = window.getColoredNameHTML(myId, myName, defaultColor);
            if (profileNameEl.innerHTML !== newHtml) profileNameEl.innerHTML = newHtml;
        }
    }, 500);

    // 5. GIAO DIỆN BẢNG ĐẠI GIA
    function createWealthLBUI() {
        if (document.getElementById('wealth-overlay')) return;
        const wealthHTML = `
        <div id="wealth-overlay" class="modal-overlay hidden" style="z-index: 9999999; backdrop-filter: blur(8px);">
            <div class="modal-content" style="max-width: 600px; width: 95%; background: linear-gradient(to bottom, #1a237e, #000000); border: 4px solid #00ffff; border-radius: 15px; padding: 25px; box-shadow: 0 0 40px rgba(0, 255, 255, 0.6);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #00ffff; padding-bottom: 10px; margin-bottom: 15px;">
                    <h2 style="color: #00ffff; text-shadow: 0 0 10px #00ffff; margin: 0; font-size: 2rem;">💰 PHONG THẦN BẢNG</h2>
                    <button id="close-wealth-btn" style="background: #f44336; color: white; border: 2px solid #fff; padding: 5px 15px; border-radius: 8px; cursor: pointer; font-weight: bold;">ĐÓNG</button>
                </div>
                <div style="text-align: center; margin-bottom: 15px; font-size: 1rem; color: #fff; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 8px; border: 1px dashed #00ffff;">
                    Vinh danh <b style="color: #00ffff;">Top 10</b> Tu Tiên Giả sở hữu nhiều <b style="color: #ffd700;">💎 Linh Thạch</b> nhất.
                </div>
                <div id="wealth-list" style="max-height: 50dvh; overflow-y: auto; padding-right: 5px;"></div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', wealthHTML);
        document.getElementById('close-wealth-btn').addEventListener('click', () => {
            if(window.playSoundInternal) window.playSoundInternal('select');
            document.getElementById('wealth-overlay').classList.add('hidden');
        });
    }

    function renderWealthLBHTML(lb, listEl) {
        if (!lb || lb.length === 0) {
            listEl.innerHTML = '<p style="text-align:center; color:#ccc; font-size:1.1rem; padding: 20px;">Thế giới chưa có Đại Gia nào lộ diện!</p>'; return;
        }
        
        let html = '<table style="width:100%; border-collapse: collapse; font-size:1rem; text-align:center;"><tr style="border-bottom: 2px solid #00ffff; color: #00ffff; height: 40px;"><th>Hạng</th><th>Đại Hiệp</th><th>Danh Hiệu</th><th style="text-align: right;">💎 Linh Thạch</th></tr>';
        
        let myLocalId = localStorage.getItem('pikachu_account_id');

        lb.forEach((item, idx) => {
            let formattedCoins = (item.coins || 0).toLocaleString('vi-VN');
            let vInfo = window.getVipLevelInfo ? window.getVipLevelInfo(item.vipPoints || 0) : { level: 0, name: "Phàm Nhân", color: "#888888" };
            let playerName = item.displayName || item.name || 'Vô Danh';

            let displayAvatar = item.avatar;
            let playerFrame = item.frame || 'none';

            if (item.accountId === myLocalId) {
                displayAvatar = localStorage.getItem('pikachu_player_avatar') || displayAvatar;
                playerFrame = localStorage.getItem('pikachu_equipped_frame') || playerFrame;
            }

            let avatarHtml = window.renderAvatarWithFrame ? window.renderAvatarWithFrame(displayAvatar, playerFrame, vInfo.color, 45) : `<img src="${displayAvatar || 'https://i.imgur.com/7HnLKEg.png'}" style="width:45px; height:45px; border-radius:50%; border:2px solid ${vInfo.color};">`;

            let rankHtml = `<span style="font-size: 1.1rem; color: #fff;">${idx + 1}</span>`;
            let coinColor = '#00ffff';

            if (idx === 0) { rankHtml = `<span style="font-size: 1.6rem; font-weight: bold; color: #ffd700; text-shadow: 2px 2px 2px #000;">1</span>`; coinColor = '#ffd700'; } 
            else if (idx === 1) { rankHtml = `<span style="font-size: 1.5rem; font-weight: bold; color: #e0e0e0; text-shadow: 2px 2px 2px #000;">2</span>`; coinColor = '#e0e0e0'; } 
            else if (idx === 2) { rankHtml = `<span style="font-size: 1.5rem; font-weight: bold; color: #cd7f32; text-shadow: 2px 2px 2px #000;">3</span>`; coinColor = '#cd7f32'; }

            let onlineDot = item.isOnline ? ' <span style="font-size:0.8rem; text-shadow:0 0 5px #00ff00;" title="Đang Online">🟢</span>' : '';
            
            // Gọi hàm tô màu chính nó
            let coloredNameHtml = window.getColoredNameHTML(item.accountId, playerName, vInfo.color) + onlineDot;

            html += `<tr style="border-bottom: 1px solid rgba(0,255,255,0.1); height: 75px;">
                <td>${rankHtml}</td>
                <td>
                    <div style="display:flex; align-items:center; justify-content:start; gap:15px; text-align:left;">
                        ${avatarHtml}
                        <div style="max-width: 140px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${coloredNameHtml}</div>
                    </div>
                </td>
                <td><span style="font-size:0.75rem; background: ${vInfo.color}; color:#000; padding:4px 8px; border-radius:4px; font-weight:bold; box-shadow: 0 0 5px ${vInfo.color};">${vInfo.name}</span></td>
                <td style="font-weight:bold; color: ${coinColor}; text-align: right; font-size: 1.15rem;">${formattedCoins}</td>
            </tr>`;
        }); 
        html += '</table>'; listEl.innerHTML = html;
    }

    window.showWealthLeaderboard = function() {
        createWealthLBUI(); 
        document.getElementById('wealth-overlay').classList.remove('hidden'); 
        
        const listEl = document.getElementById('wealth-list');
        if (!listEl) return;
        listEl.innerHTML = '<p style="text-align: center; color: #ccc;">Đang triệu hồi Dữ Liệu Đại Gia...</p>';
        
        if (typeof window.firebase === 'undefined' || !window.firebase.database) {
            listEl.innerHTML = '<p style="text-align: center; color: #ff5252;">Mất kết nối Thiên Đạo!</p>';
            return;
        }

        window.firebase.database().ref('users').orderByChild('coins').limitToLast(10).once('value').then(snapshot => { 
            let daigiaList = []; 
            snapshot.forEach(userSnapshot => { 
                let u = userSnapshot.val();
                let accId = userSnapshot.key;
                if (!u.isAdmin) {
                    u.accountId = accId;
                    daigiaList.push(u); 
                }
            });
            
            daigiaList.sort((a, b) => (b.coins || 0) - (a.coins || 0)); 
            renderWealthLBHTML(daigiaList, listEl);
        }).catch(err => {
            listEl.innerHTML = '<p style="text-align: center; color: #ff5252;">Lỗi truy xuất: ' + err.message + '</p>';
        });
    }
})();