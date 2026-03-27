/* ========================================================
 * TÁC GIẢ: BỞI VĂN CƯỜNG (CODE BY VANCUONG)
 * TÊN FILE: afk.js (Hệ thống Bế Quan - Treo máy chuẩn 24H)
 * ======================================================== */
(function() {
    // --- CẤU HÌNH PHẦN THƯỞNG TỐI ĐA TRONG 1 NGÀY (24H) ---
    const MAX_AFK_MINUTES = 24 * 60; // 1440 phút (1 ngày)
    const MAX_COINS_PER_DAY = 5000;  // Tối đa 5000 Linh Thạch / ngày
    const MAX_VIP_PER_DAY = 10;      // Tối đa 10 VIP / ngày
    const VIP_BONUS_PERCENT = 0.5;   // VIP được cộng thêm 50% tài nguyên

    function initAFKSystem() {
        let accId = localStorage.getItem('pikachu_account_id');
        if (!accId) return; 

        let lastOnline = localStorage.getItem('pikachu_last_online');
        let now = Date.now();

        // Lần đầu vào game, lưu thời gian hiện tại
        if (!lastOnline) {
            localStorage.setItem('pikachu_last_online', now);
            lastOnline = now;
        }

        let diffMs = now - parseInt(lastOnline);
        
        // CHUẨN THỜI GIAN THỰC: Tính bằng PHÚT
        let diffMinutes = Math.floor(diffMs / 60000); 

        // Phải offline tối thiểu 1 phút mới tiến hành chia tài nguyên
        if (diffMinutes >= 1) {
            let actualMinutes = diffMinutes > MAX_AFK_MINUTES ? MAX_AFK_MINUTES : diffMinutes;
            
            // Công thức: (Số phút treo máy / Tổng phút 1 ngày) * Thưởng tối đa
            let earnedCoins = Math.floor((actualMinutes / MAX_AFK_MINUTES) * MAX_COINS_PER_DAY);
            let earnedVip = Math.floor((actualMinutes / MAX_AFK_MINUTES) * MAX_VIP_PER_DAY);

            // Kiểm tra xem có đang là VIP hay không
            let vipPts = parseInt(localStorage.getItem('pikachu_vip_points')) || 0;
            let isAdmin = localStorage.getItem('pikachu_is_admin') === 'true';
            let isVip = vipPts > 0 || isAdmin;
            
            let bonusMsg = "";
            if (isVip) {
                let coinBonus = Math.floor(earnedCoins * VIP_BONUS_PERCENT);
                let vipBonus = Math.floor(earnedVip * VIP_BONUS_PERCENT);
                
                earnedCoins += coinBonus;
                earnedVip += vipBonus;
                
                bonusMsg = `<div style="color: #ff00ff; font-weight: bold; margin-top: 10px; text-shadow: 0 0 5px #ff00ff; font-size: 1rem;">✨ Đặc quyền VIP/Admin: +50% Tài nguyên!</div>`;
            }

            // Chỉ hiển thị bảng nếu thực sự nhận được đồ (Ví dụ treo 1-2 phút không đủ điểm ra VIP)
            if (earnedCoins > 0 || earnedVip > 0) {
                showAFKPopup(actualMinutes, earnedCoins, earnedVip, bonusMsg, accId);
            } else {
                localStorage.setItem('pikachu_last_online', Date.now());
            }
        }

        // Lưu thời gian ngầm mỗi 10 giây
        setInterval(() => {
            if (localStorage.getItem('pikachu_account_id')) {
                localStorage.setItem('pikachu_last_online', Date.now());
            }
        }, 10000);
    }

    function showAFKPopup(minutes, coins, vip, bonusMsg, accId) {
        if(window.playSoundInternal) window.playSoundInternal('win');

        let oldPopup = document.getElementById('afk-reward-overlay');
        if (oldPopup) oldPopup.remove();

        const html = `
        <div id="afk-reward-overlay" class="modal-overlay" style="z-index: 99999999; backdrop-filter: blur(8px);">
            <div class="modal-content" style="max-width: 400px; background: linear-gradient(135deg, #0f2027 0%, #203a43 50%, #2c5364 100%); border: 4px solid #00e5ff; border-radius: 20px; padding: 30px; text-align: center; box-shadow: 0 0 40px rgba(0, 229, 255, 0.6), inset 0 0 20px #000;">
                <div style="font-size: 4rem; margin-bottom: 10px; animation: pvp-pulse 2s infinite;">🧘‍♂️</div>
                <h2 style="color: #00e5ff; margin-bottom: 15px; text-shadow: 0 0 15px #00e5ff; font-size: 1.8rem; letter-spacing: 2px;">BẾ QUAN HOÀN THÀNH</h2>
                
                <p style="color: #ccc; font-size: 1.1rem; margin-bottom: 20px;">Ngài đã tọa thiền trong khoảng <b style="color: #ffeb3b;">${minutes} phút</b>. Đây là những thiên địa linh khí thu thập được:</p>
                
                <div style="background: rgba(0,0,0,0.6); border: 1px dashed #00e5ff; border-radius: 10px; padding: 15px; margin-bottom: 20px;">
                    <div style="display: flex; justify-content: space-between; font-size: 1.2rem; margin-bottom: 10px;">
                        <span style="color: #fff;">💎 Linh Thạch:</span>
                        <span style="color: #00e676; font-weight: bold; text-shadow: 0 0 5px #00e676;">+${coins.toLocaleString('vi-VN')}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; font-size: 1.2rem;">
                        <span style="color: #fff;">🏅 Điểm VIP:</span>
                        <span style="color: #ff00ff; font-weight: bold; text-shadow: 0 0 5px #ff00ff;">+${vip.toLocaleString('vi-VN')}</span>
                    </div>
                    ${bonusMsg}
                </div>

                <button id="afk-claim-btn" style="background: linear-gradient(to right, #00e5ff, #00b0ff); border: 2px solid #fff; color: #000; font-weight: bold; padding: 12px 30px; border-radius: 10px; cursor: pointer; font-size: 1.2rem; width: 100%; box-shadow: 0 0 15px rgba(0,229,255,0.6); transition: 0.2s;">THU NẠP LINH KHÍ</button>
            </div>
        </div>`;
        
        document.body.insertAdjacentHTML('beforeend', html);

        document.getElementById('afk-claim-btn').addEventListener('click', () => {
            if(window.playSoundInternal) window.playSoundInternal('select');
            
            let btn = document.getElementById('afk-claim-btn');
            btn.innerText = "ĐANG LUYỆN HÓA...";
            btn.disabled = true;

            let myCoins = parseInt(localStorage.getItem('pikachu_coins')) || 0;
            let myVipPts = parseInt(localStorage.getItem('pikachu_vip_points')) || 0;

            let newCoins = myCoins + coins;
            let newVipPts = myVipPts + vip;

            localStorage.setItem('pikachu_coins', newCoins);
            localStorage.setItem('pikachu_vip_points', newVipPts);
            localStorage.setItem('pikachu_last_online', Date.now()); 

            if (typeof window.firebase !== 'undefined' && window.firebase.database) {
                window.firebase.database().ref('users/' + accId).update({
                    coins: newCoins,
                    vipPoints: newVipPts
                }).then(() => {
                    document.getElementById('afk-reward-overlay').remove();
                    // Cập nhật giao diện tiền nếu có
                    let coinEl = document.getElementById('player-coins-display');
                    if (coinEl) coinEl.innerText = newCoins.toLocaleString('vi-VN');
                }).catch(err => {
                    document.getElementById('afk-reward-overlay').remove();
                });
            } else {
                document.getElementById('afk-reward-overlay').remove();
            }
        });
    }

    // Chờ game khởi tạo xong mới kích hoạt AFK
    setTimeout(initAFKSystem, 2000);
})();