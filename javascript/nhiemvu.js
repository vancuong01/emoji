/* ========================================================
 * TÁC GIẢ: BỞI VĂN CƯỜNG (CODE BY VANCUONG)
 * BẢN QUYỀN: ĐỘC QUYỀN SERVER TU TIÊN PIKACHU
 * CẢNH BÁO: Mọi hành vi sao chép không xin phép đều là vi phạm!
 ======================================================== */
(function() {
    // 1. NHÚNG CSS GIAO DIỆN NHIỆM VỤ
    if (!document.getElementById('nhiemvu-styles')) {
        let style = document.createElement('style'); style.id = 'nhiemvu-styles';
        style.innerHTML = `
            .quest-item { background: rgba(0,0,0,0.6); border: 2px solid #8b6b22; border-radius: 12px; padding: 15px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; transition: 0.3s; }
            .quest-item:hover { border-color: #00ffff; background: rgba(0, 40, 40, 0.4); }
            .quest-info { text-align: left; }
            .quest-title { color: #ffd700; font-weight: bold; font-size: 1rem; margin-bottom: 4px; text-shadow: 1px 1px 2px #000; }
            .quest-reward { color: #00e676; font-size: 0.85rem; font-weight: bold; }
            .quest-status { font-size: 0.8rem; padding: 4px 10px; border-radius: 6px; font-weight: bold; min-width: 85px; text-align: center; }
            .status-todo { background: #555; color: #ccc; cursor: not-allowed; }
            .status-claim { background: linear-gradient(to bottom, #ffeb3b, #f57f17); color: #000; cursor: pointer; animation: pulse-gold 1.5s infinite; }
            .status-done { background: rgba(0, 255, 0, 0.2); color: #00ff00; border: 1px solid #00ff00; cursor: default; }
            @keyframes pulse-gold { 0% { box-shadow: 0 0 5px #ffd700; } 50% { box-shadow: 0 0 15px #ffd700; } 100% { box-shadow: 0 0 5px #ffd700; } }
        `;
        document.head.appendChild(style);
    }

    // Tự động thêm nút NHIỆM VỤ vào sảnh chính

    window.DailyQuest = {
        questData: [
            { id: 'q1', title: 'Đăng nhập hằng ngày', vip: 1, coin: 5, target: 1 },
            { id: 'q2', title: 'Hoàn thành Màn 7 (Dễ)', vip: 1, coin: 10, target: 1 },
            { id: 'q3', title: 'Hoàn thành Màn 7 (Trung bình)', vip: 2, coin: 15, target: 1 },
            { id: 'q4', title: 'Hoàn thành Màn 7 (Khó)', vip: 3, coin: 20, target: 1 },
            { id: 'q5', title: 'Đại Viên Mãn (Xong hết 4 NV)', vip: 10, coin: 100, target: 1 }
        ],

        open: function() {
            const accId = localStorage.getItem('pikachu_account_id');
            if (!accId) return;

            let today = new Date().toLocaleDateString('vi-VN'); // Tạo key theo ngày
            let db = window.firebase.database();

            // Lấy trạng thái nhiệm vụ từ Firebase
            db.ref(`quests/${accId}/${today.replace(/\//g, '-')}`).once('value').then(snap => {
                let userQuests = snap.val() || {};
                
                // Mặc định NV1 (Đăng nhập) sẽ là "Chờ nhận" nếu chưa hoàn thành
                if (!userQuests['q1']) {
                    db.ref(`quests/${accId}/${today.replace(/\//g, '-')}/q1`).set('claimable');
                    userQuests['q1'] = 'claimable';
                }

                this.renderModal(userQuests);
            });
        },

        renderModal: function(userQuests) {
            let old = document.getElementById('quest-overlay'); if (old) old.remove();

            // Tính toán Đại Viên Mãn
            let completedCount = 0;
            this.questData.slice(0, 4).forEach(q => { if(userQuests[q.id] === 'done') completedCount++; });
            if (completedCount >= 4 && !userQuests['q5']) {
                window.firebase.database().ref(`quests/${localStorage.getItem('pikachu_account_id')}/${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}/q5`).set('claimable');
                userQuests['q5'] = 'claimable';
            }

            let listHtml = this.questData.map(q => {
                let status = userQuests[q.id] || 'todo';
                let btnHtml = '';
                if (status === 'todo') btnHtml = `<div class="quest-status status-todo">CHƯA XONG</div>`;
                else if (status === 'claimable') btnHtml = `<div class="quest-status status-claim" onclick="DailyQuest.claim('${q.id}', ${q.vip}, ${q.coin})">NHẬN THƯỞNG</div>`;
                else btnHtml = `<div class="quest-status status-done">ĐÃ NHẬN</div>`;

                return `
                <div class="quest-item">
                    <div class="quest-info">
                        <div class="quest-title">${q.title}</div>
                        <div class="quest-reward">🎁 Thưởng: +${q.vip} VIP, +${q.coin} Linh Thạch</div>
                    </div>
                    ${btnHtml}
                </div>`;
            }).join('');

            const html = `
            <div id="quest-overlay" class="modal-overlay" style="z-index: 9999999; backdrop-filter: blur(8px);">
                <div class="modal-content" style="max-width: 450px; background: linear-gradient(135deg, #2c1a0c 0%, #000 100%); border: 3px solid #ffd700;">
                    <h2 style="color: #ffd700; text-shadow: 0 0 10px #ffd700;">📜 NHIỆM VỤ HẰNG NGÀY</h2>
                    <p style="color: #aaa; font-size: 0.8rem; margin-bottom: 20px;">Làm mới vào 00:00 hằng ngày</p>
                    <div style="max-height: 400px; overflow-y: auto;">${listHtml}</div>
                    <button onclick="document.getElementById('quest-overlay').remove()" style="margin-top: 20px; background: #555; color: #fff; border: 1px solid #fff; padding: 10px; width: 100%; border-radius: 8px; cursor: pointer; font-weight: bold;">ĐÓNG</button>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
        },

        claim: function(qId, vip, coin) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            const accId = localStorage.getItem('pikachu_account_id');
            let today = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
            let db = window.firebase.database();

            // 1. Đánh dấu đã nhận
            db.ref(`quests/${accId}/${today}/${qId}`).set('done');

            // 2. Cộng thưởng vào User
            db.ref(`users/${accId}`).once('value').then(snap => {
                if (snap.exists()) {
                    let d = snap.val();
                    let newVip = (d.vipPoints || 0) + vip;
                    let newCoin = (d.coins || 0) + coin;
                    
                    db.ref(`users/${accId}`).update({
                        vipPoints: newVip,
                        coins: newCoin
                    }).then(() => {
                        // Cập nhật LocalStorage
                        localStorage.setItem('pikachu_coins', newCoin);
                        localStorage.setItem('pikachu_vip_points', newVip);
                        
                        // Thông báo & Load lại bảng
                        let alertFn = window.showCustomAlertInternal ? window.showCustomAlertInternal : alert;
                        alertFn(`✅ Nhận thưởng thành công!\n+${vip} điểm VIP\n+${coin} Linh thạch`);
                        this.open();
                        if(window.showMainMenu) window.showMainMenu(); // Cập nhật sảnh chờ
                    });
                }
            });
        },

        // HÀM QUAN TRỌNG: Gọi hàm này khi người chơi thắng màn 7
        completeLevel7: function(difficulty) {
            const accId = localStorage.getItem('pikachu_account_id');
            if (!accId) return;
            let today = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
            let qId = '';
            if (difficulty === 'Dễ') qId = 'q2';
            else if (difficulty === 'Vừa') qId = 'q3';
            else if (difficulty === 'Khó') qId = 'q4';

            if (qId) {
                // Chỉ set thành 'claimable' nếu chưa 'done'
                window.firebase.database().ref(`quests/${accId}/${today}/${qId}`).once('value').then(snap => {
                    if (snap.val() !== 'done') {
                        window.firebase.database().ref(`quests/${accId}/${today}/${qId}`).set('claimable');
                    }
                });
            }
        }
    };
})();