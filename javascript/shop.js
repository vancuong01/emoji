/* ========================================================
 * TÁC GIẢ: BỞI VĂN CƯỜNG (CODE BY VANCUONG)
 * BẢN QUYỀN: ĐỘC QUYỀN SERVER TU TIÊN PIKACHU
 * CẢNH BÁO: Mọi hành vi sao chép không xin phép đều là vi phạm!
 ======================================================== */
(function() {
    function createShopUI() {
        if (document.getElementById('shop-overlay')) return;
        const shopHTML = `
        <div id="shop-overlay" class="modal-overlay hidden" style="z-index: 100000000; backdrop-filter: blur(8px);">
            <div class="modal-content" style="max-width: 600px; width: 95%; background: linear-gradient(to bottom, #1b5e20, #000000); border: 4px solid #4caf50; border-radius: 15px; padding: 25px; box-shadow: 0 0 40px rgba(76, 175, 80, 0.8);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #4caf50; padding-bottom: 10px; margin-bottom: 15px;">
                    <h2 style="color: #69f0ae; text-shadow: 0 0 10px #4caf50; margin: 0; font-size: 2rem;">🛒 CỬA HÀNG BẢO VẬT</h2>
                    <button id="close-shop-btn" style="background: #f44336; color: white; border: 2px solid #fff; padding: 5px 15px; border-radius: 8px; cursor: pointer; font-weight: bold;">ĐÓNG</button>
                </div>
                
                <div id="shop-greeting" style="text-align: center; margin-bottom: 15px; font-size: 1.3rem; color: #fff; background: rgba(255,255,255,0.1); padding: 10px; border-radius: 8px; border: 1px dashed #4caf50;"></div>

                <div style="display: flex; justify-content: space-around; margin-bottom: 20px; font-size: 1.2rem; font-weight: bold; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 10px;">
                    <div style="color: #ffd700;">Tài sản: <span id="shop-user-coins">0</span> 💎 Linh Thạch</div>
                    <div style="color: #ff4081;"><span id="shop-user-vip">0</span> Điểm Cảnh Giới</div>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px;">
                    <div style="background: #333; padding: 15px; border-radius: 10px; border: 2px solid #00ffff; text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 10px;">💡</div>
                        <h3 style="color: #00ffff; margin-bottom: 5px;">+5 Gợi Ý</h3>
                        <p style="color: #ccc; font-size: 0.9rem; margin-bottom: 15px;">Tăng thêm 5 lượt tìm kiếm đường đi nhanh.</p>
                        <button onclick="buyItem('hint', 100)" style="background: #ffd700; color: #000; border: none; padding: 10px 20px; font-weight: bold; border-radius: 5px; cursor: pointer; width: 100%; font-size: 1.1rem;">Mua: 100 LT</button>
                    </div>
                    
                    <div style="background: #333; padding: 15px; border-radius: 10px; border: 2px solid #ff9800; text-align: center;">
                        <div style="font-size: 3rem; margin-bottom: 10px;">🔀</div>
                        <h3 style="color: #ff9800; margin-bottom: 5px;">+5 Đổi Vị Trí</h3>
                        <p style="color: #ccc; font-size: 0.9rem; margin-bottom: 15px;">Xáo trộn lại toàn bộ bàn cờ khi bí đường.</p>
                        <button onclick="buyItem('shuffle', 100)" style="background: #ffd700; color: #000; border: none; padding: 10px 20px; font-weight: bold; border-radius: 5px; cursor: pointer; width: 100%; font-size: 1.1rem;">Mua: 100 LT</button>
                    </div>

                    <div style="grid-column: span 2; background: #2a0845; padding: 15px; border-radius: 10px; border: 2px solid #e040fb; text-align: center; display: flex; justify-content: space-between; align-items: center;">
                        <div style="text-align: left;">
                            <h3 style="color: #e040fb; margin-bottom: 5px;">💎 Đổi Linh Thạch</h3>
                            <p style="color: #ccc; font-size: 0.9rem; margin: 0;">Đổi 1 lần để đổi 1 Điểm = 10 LT.</p>
                        </div>
                        <button onclick="exchangeVip()" style="background: #e040fb; color: #fff; border: 2px solid #fff; padding: 10px 20px; font-weight: bold; border-radius: 5px; cursor: pointer; font-size: 1.1rem;">Quy đổi ngay</button>
                    </div>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', shopHTML);

        document.getElementById('close-shop-btn').addEventListener('click', () => {
            if(window.playSoundInternal) window.playSoundInternal('select');
            document.getElementById('shop-overlay').classList.add('hidden');
        });
    }

    window.openShopPanel = function() {
        if(window.playSoundInternal) window.playSoundInternal('select');
        let accId = localStorage.getItem('pikachu_account_id');
        if (!accId) { 
            window.showCustomAlertInternal("Vui lòng đăng nhập để vào Cửa Hàng!");
            return; 
        }

        document.getElementById('shop-overlay').classList.remove('hidden');
        
        let playerName = localStorage.getItem('pikachu_player_name') || "Đại Hiệp";
        let vipPts = localStorage.getItem('pikachu_vip_points') || 0;
        let vInfo = window.getVipLevelInfo ? window.getVipLevelInfo(vipPts) : { level: 0, name: "Phàm Nhân", color: "#888888", glow: "none" };
        if (accId === "vancuong140904") { vInfo = { level: 10, name: "Tiên Nhân", color: "#ff0000", glow: "0 0 15px #ff0000" }; }

        let textGlowClass = vInfo.level > 0 ? 'vip-glow-text' : '';
        document.getElementById('shop-greeting').innerHTML = `Xin chào, <span class="${textGlowClass}" style="color: ${vInfo.color}; font-weight: bold; --vip-color: ${vInfo.color};">[${vInfo.name}] ${playerName}</span>!`;

        refreshShopData(accId);
    };

    function refreshShopData(accId) {
        document.getElementById('shop-user-coins').innerText = localStorage.getItem('pikachu_coins') || 0;
        document.getElementById('shop-user-vip').innerText = localStorage.getItem('pikachu_vip_points') || 0;

        if (typeof window.firebase === 'undefined' || !window.firebase.database) return;
        window.firebase.database().ref('users/' + accId).once('value').then(snapshot => {
            if (snapshot.exists()) {
                let data = snapshot.val();
                localStorage.setItem('pikachu_coins', data.coins || 0);
                localStorage.setItem('pikachu_vip_points', data.vipPoints || 0);
                localStorage.setItem('pikachu_inv_hints', data.invHints || 0);
                localStorage.setItem('pikachu_inv_shuffles', data.invShuffles || 0);
                
                document.getElementById('shop-user-coins').innerText = data.coins || 0;
                document.getElementById('shop-user-vip').innerText = data.vipPoints || 0;
            }
        });
    }

    window.buyItem = function(type, price) {
        if(window.playSoundInternal) window.playSoundInternal('select');
        let accId = localStorage.getItem('pikachu_account_id');
        if (!accId || typeof window.firebase === 'undefined') return;

        window.firebase.database().ref('users/' + accId).once('value').then(snapshot => {
            let data = snapshot.val();
            let currentCoins = data.coins || 0;

            if (currentCoins < price) {
                window.showCustomAlertInternal("❌ Bạn không đủ Linh Thạch!");
                return;
            }

            let updates = { coins: currentCoins - price };
            if (type === 'hint') updates.invHints = (data.invHints || 0) + 5;
            if (type === 'shuffle') updates.invShuffles = (data.invShuffles || 0) + 5;

            window.firebase.database().ref('users/' + accId).update(updates).then(() => {
                window.showCustomAlertInternal(`✅ Mua thành công 5 Lượt ${type === 'hint' ? 'Gợi Ý' : 'Đổi Vị Trí'}!`);
                
                // CẬP NHẬT TRỰC TIẾP VÀO GAME
                if (window.gameStateGlobal) {
                    if (type === 'hint') window.gameStateGlobal.hintsRemaining += 5;
                    if (type === 'shuffle') window.gameStateGlobal.shufflesRemaining += 5;
                    if (window.updateUIGlobal) window.updateUIGlobal(); 
                }

                localStorage.setItem('pikachu_coins', updates.coins);
                if (type === 'hint') localStorage.setItem('pikachu_inv_hints', updates.invHints);
                if (type === 'shuffle') localStorage.setItem('pikachu_inv_shuffles', updates.invShuffles);

                refreshShopData(accId); 
            });
        });
    };

    window.exchangeVip = function() {
        if(window.playSoundInternal) window.playSoundInternal('select');
        let accId = localStorage.getItem('pikachu_account_id');
        if (!accId || typeof window.firebase === 'undefined') return;

        window.firebase.database().ref('users/' + accId).once('value').then(snapshot => {
            let data = snapshot.val();
            let currentVip = data.vipPoints || 0; let currentCoins = data.coins || 0;

            if (currentVip < 1) {
                window.showCustomAlertInternal("❌ Không đủ Điểm Cảnh Giới!");
                return;
            }

            // Xóa prompt mặc định, bấm 1 phát đổi 1 điểm luôn!
            let updates = { vipPoints: currentVip - 1, coins: currentCoins + 10 };
            window.firebase.database().ref('users/' + accId).update(updates).then(() => {
                window.showCustomAlertInternal(`✅ Đã dùng 1 Điểm đổi lấy 10 Linh Thạch!`);
                localStorage.setItem('pikachu_coins', updates.coins);
                localStorage.setItem('pikachu_vip_points', updates.vipPoints);
                refreshShopData(accId);
            });
        });
    };

    window.addEventListener('load', () => { setTimeout(createShopUI, 800); });
})();