(function() {
    function createWealthUI() {
        if (document.getElementById('wealth-overlay')) return;
        const html = `
        <div id="wealth-overlay" class="modal-overlay hidden" style="z-index: 99999999; backdrop-filter: blur(8px);">
            <div class="modal-content" style="max-width: 600px; width: 95%; background: linear-gradient(135deg, #0d47a1, #000000); border: 4px solid #00e5ff; border-radius: 15px; padding: 25px; box-shadow: 0 0 40px rgba(0, 229, 255, 0.6);">
                <h2 style="color: #00e5ff; margin-bottom: 15px; text-shadow: 0 0 10px #00e5ff; font-size: 2rem; text-align: center;">💎 TOP ĐẠI GIA TIÊN GIỚI</h2>
                <div id="wealth-list" style="max-height: 350px; min-height: 150px; overflow-y: auto; margin-bottom: 20px; color: white; background: rgba(0,0,0,0.5); border-radius: 10px; padding: 10px; border: 1px solid #00e5ff;"></div>
                <button id="close-wealth-btn" style="background: linear-gradient(to bottom, #00b4db, #0083b0); border: 2px solid #fff; color: #fff; font-weight: bold; padding: 12px 20px; border-radius: 8px; cursor: pointer; width: 100%; font-size: 1.2rem; text-shadow: 1px 1px 2px #000;">ĐÓNG</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', html);
        document.getElementById('close-wealth-btn').addEventListener('click', () => {
            if(window.playSoundInternal) window.playSoundInternal('select');
            document.getElementById('wealth-overlay').classList.add('hidden');
        });
    }

    window.showWealthLeaderboard = function() {
        if(window.playSoundInternal) window.playSoundInternal('select');
        let wOverlay = document.getElementById('wealth-overlay');
        if (wOverlay) wOverlay.classList.remove('hidden');
        
        let listEl = document.getElementById('wealth-list');
        listEl.innerHTML = '<p style="text-align:center; color:#00e5ff; font-size:1.2rem; padding: 20px;">Đang dò xét khí tức Linh Thạch... ⏳</p>';
        
        if (typeof window.firebase !== 'undefined' && window.firebase.database) {
            window.firebase.database().ref('users').orderByChild('coins').limitToLast(20).once('value')
            .then(snapshot => {
                let users = [];
                snapshot.forEach(child => {
                    let data = child.val();
                    if (data.coins && data.coins > 0) {
                        users.push({
                            id: child.key,
                            name: data.displayName || "ADMIN",
                            coins: data.coins,
                            vipPoints: data.vipPoints || 0,
                            avatar: data.avatar || 'https://i.imgur.com/7HnLKEg.png'
                        });
                    }
                });
                users.reverse(); // Đảo ngược để người giàu nhất lên đầu
                renderWealthList(users, listEl);
            }).catch(err => {
                listEl.innerHTML = '<p style="text-align:center; color:red;">Lỗi truyền tin: ' + err.message + '</p>';
            });
        } else {
            listEl.innerHTML = '<p style="text-align:center; color:red;">Chưa kết nối Tiên Giới (Mất mạng)!</p>';
        }
    };

    function renderWealthList(users, listEl) {
        if (users.length === 0) {
            listEl.innerHTML = '<p style="text-align:center; color:#ccc;">Chưa có vị đại gia nào xuất hiện!</p>';
            return;
        }
        let html = '<table style="width:100%; border-collapse: collapse; font-size:1rem; text-align:center;">';
        html += '<tr style="border-bottom: 2px solid #00e5ff; color: #00e5ff;"><th>Hạng</th><th style="text-align:left; padding-left: 10px;">Đại Gia</th><th>Cảnh Giới</th><th>Gia Sản</th></tr>';
        
        users.forEach((item, idx) => {
            let color = idx === 0 ? '#ffeb3b' : (idx === 1 ? '#e0e0e0' : (idx === 2 ? '#cd7f32' : '#fff'));
            let medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : idx + 1));
            let vInfo = window.getVipLevelInfo ? window.getVipLevelInfo(item.vipPoints) : { name: "Phàm Nhân", color: "#888", glow: "" };
            let glowClass = vInfo.level > 0 ? 'vip-glow-frame' : '';
            let textGlowClass = vInfo.level > 0 ? 'vip-glow-text' : '';

            let nameHtml = `
            <div style="display:flex; align-items:center; justify-content:start; gap:10px; --vip-color:${vInfo.color};">
                <img src="${item.avatar}" class="${glowClass}" style="width: 35px; height: 35px; border-radius: 50%; border: 2px solid ${vInfo.color}; object-fit: cover; background: #000;">
                <span class="${textGlowClass}" style="color: ${color}; font-weight: bold; max-width: 100px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${item.name}</span>
            </div>`;

            let vipHtml = `<span style="background:${vInfo.color}; color:#000; font-size:0.65rem; padding:3px 6px; border-radius:4px; font-weight:bold; box-shadow: 0 0 5px ${vInfo.color};">${vInfo.name}</span>`;

            html += `
            <tr style="border-bottom:1px solid rgba(255,255,255,0.1); line-height:3;">
                <td>${medal}</td>
                <td style="text-align:left; padding-left: 10px;">${nameHtml}</td>
                <td>${vipHtml}</td>
                <td style="font-weight:bold; color: #ffd700;">${item.coins} <span style="font-size:0.75rem; color:#fff;">Linh Thạch</span></td>
            </tr>`;
        });
        html += '</table>';
        listEl.innerHTML = html;
    }

    window.addEventListener('load', () => { setTimeout(createWealthUI, 1000); });
})();