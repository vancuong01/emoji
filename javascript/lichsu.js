/* ========================================================
 * TÁC GIẢ: BỞI VĂN CƯỜNG (CODE BY VANCUONG)
 * BẢN QUYỀN: ĐỘC QUYỀN SERVER TU TIÊN PIKACHU
 * CẢNH BÁO: Mọi hành vi sao chép không xin phép đều là vi phạm!
 ======================================================== */

(function() {
    // 1. NHÚNG CSS GIAO DIỆN LỊCH SỬ
    if (!document.getElementById('lichsu-styles')) {
        let style = document.createElement('style'); style.id = 'lichsu-styles';
        style.innerHTML = `
            .history-item { background: rgba(20, 20, 20, 0.7); border-left: 5px solid #8b6b22; border-radius: 4px; padding: 12px; margin-bottom: 10px; display: flex; justify-content: space-between; align-items: center; transition: 0.3s; }
            .history-win { border-left-color: #00e676; background: rgba(0, 230, 118, 0.05); }
            .history-loss { border-left-color: #ff5252; background: rgba(255, 82, 82, 0.05); }
            .history-info { text-align: left; flex: 1; }
            .history-name { color: #00ffff; font-weight: bold; font-size: 1rem; }
            .history-time { color: #888; font-size: 0.75rem; margin-top: 2px; }
            .history-result { font-weight: bold; text-align: right; min-width: 100px; }
            .res-win { color: #00ff00; text-shadow: 0 0 5px #00ff00; }
            .res-loss { color: #ff5252; text-shadow: 0 0 5px #ff5252; }
            .history-empty { color: #aaa; padding: 40px 0; font-style: italic; }
        `;
        document.head.appendChild(style);
    }

    window.PvPHistory = {
        // HÀM GHI LẠI TRẬN ĐẤU (Gọi hàm này khi kết thúc trận PvP)
        record: function(opponentName, isWin, amount) {
            const accId = localStorage.getItem('pikachu_account_id');
            if (!accId || typeof window.firebase === 'undefined') return;

            let db = window.firebase.database();
            let newRecord = {
                opponent: opponentName,
                result: isWin ? 'Thắng' : 'Thua',
                change: amount,
                time: window.firebase.database.ServerValue.TIMESTAMP
            };

            // Lưu vào danh sách 20 trận gần nhất
            db.ref(`pvp_history/${accId}`).push(newRecord);
            
            // Giới hạn chỉ giữ 20 trận để nhẹ Database
            db.ref(`pvp_history/${accId}`).once('value', snap => {
                if (snap.numChildren() > 20) {
                    let firstChildKey = Object.keys(snap.val())[0];
                    db.ref(`pvp_history/${accId}/${firstChildKey}`).remove();
                }
            });
        },

        open: function() {
            const accId = localStorage.getItem('pikachu_account_id');
            if (!accId) return;

            let old = document.getElementById('history-overlay'); if (old) old.remove();

            const html = `
            <div id="history-overlay" class="modal-overlay" style="z-index: 9999999; backdrop-filter: blur(8px);" onclick="if(event.target.id==='history-overlay') this.remove()">
                <div class="modal-content" style="max-width: 500px; background: linear-gradient(135deg, #1a1a1a 0%, #000 100%); border: 3px solid #00e5ff; box-shadow: 0 0 30px rgba(0,229,255,0.3);">
                    <h2 style="color: #00e5ff; text-shadow: 0 0 10px #00e5ff; font-family: 'Times New Roman', serif;">📜 CHIẾN TÍCH TỈ THÍ</h2>
                    <div id="history-list" style="max-height: 450px; overflow-y: auto; margin-top: 20px; padding-right: 5px;">
                        <p style="color:#ccc;">Đang lật mở sổ sinh tử...</p>
                    </div>
                    <button onclick="document.getElementById('history-overlay').remove()" style="margin-top: 20px; background: #333; color: #fff; border: 1px solid #555; padding: 10px; width: 100%; border-radius: 8px; cursor: pointer; font-weight: bold;">ĐÓNG SỔ</button>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
            this.loadData(accId);
        },

        loadData: function(accId) {
            let listEl = document.getElementById('history-list');
            window.firebase.database().ref(`pvp_history/${accId}`).limitToLast(20).once('value').then(snap => {
                if (!snap.exists()) {
                    listEl.innerHTML = `<div class="history-empty">Chưa có ghi chép tỉ thí nào.<br>Hãy lên Võ Đài để lưu danh!</div>`;
                    return;
                }

                let records = [];
                snap.forEach(child => { records.unshift(child.val()); }); // Đưa trận mới nhất lên đầu

                listEl.innerHTML = records.map(r => {
                    let isWin = r.result === 'Thắng';
                    let date = new Date(r.time).toLocaleString('vi-VN', {hour:'2-digit', minute:'2-digit', day:'2-digit', month:'2-digit'});
                    let colorClass = isWin ? 'history-win' : 'history-loss';
                    let resClass = isWin ? 'res-win' : 'res-loss';
                    let sign = isWin ? '+' : '-';

                    return `
                    <div class="history-item ${colorClass}">
                        <div class="history-info">
                            <div class="history-name">⚔️ Đối thủ: ${r.opponent}</div>
                            <div class="history-time">🕒 ${date}</div>
                        </div>
                        <div class="history-result ${resClass}">
                            ${r.result.toUpperCase()}<br>
                            ${sign}${r.change} 💎
                        </div>
                    </div>`;
                }).join('');
            });
        }
    };
})();