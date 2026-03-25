(function() {
    function createAdminUI() {
        if (document.getElementById('admin-overlay')) return;
        const adminHTML = `
        <div id="admin-overlay" class="modal-overlay hidden" style="z-index: 100000000; backdrop-filter: blur(10px); display: flex; justify-content: center; align-items: center; position: fixed; top: 0; left: 0; width: 100%; height: 100%;">
            <div class="modal-content" style="max-width: 800px; width: 95%; background: #1a1a2e; border: 4px solid #9c27b0; border-radius: 15px; padding: 25px; box-shadow: 0 0 50px rgba(156, 39, 176, 0.8);">
                <div style="display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #9c27b0; padding-bottom: 15px; margin-bottom: 20px;">
                    <h2 style="color: #e1bee7; text-shadow: 0 0 10px #9c27b0; margin: 0; font-size: 2rem;">⚙️ TRUNG TÂM QUẢN TRỊ ADMIN</h2>
                    <button id="close-admin-btn" style="background: #f44336; color: white; border: 2px solid #fff; padding: 5px 15px; border-radius: 8px; cursor: pointer; font-weight: bold;">ĐÓNG CỬA SỔ</button>
                </div>
                
                <div id="admin-users-list" style="max-height: 400px; overflow-y: auto; background: #0f0f1a; border-radius: 10px; padding: 10px; border: 1px solid #4a148c;">
                    <p style="text-align:center; color:#00ffff;">Đang tải dữ liệu người chơi...</p>
                </div>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', adminHTML);

        document.getElementById('close-admin-btn').addEventListener('click', () => {
            if(window.playSoundInternal) window.playSoundInternal('select');
            document.getElementById('admin-overlay').classList.add('hidden');
        });
    }

    window.openAdminPanel = function() {
        if(window.playSoundInternal) window.playSoundInternal('select');
        let isAdmin = localStorage.getItem('pikachu_is_admin') === 'true';
        
        if (!isAdmin) {
            alert("❌ CẢNH BÁO BẢO MẬT: Bạn không có quyền truy cập khu vực này!");
            return;
        }

        document.getElementById('admin-overlay').classList.remove('hidden');
        loadUsersData();
    };

    function loadUsersData() {
        let listEl = document.getElementById('admin-users-list');
        listEl.innerHTML = '<p style="text-align:center; color:#00ffff;">Đang tải danh sách từ máy chủ...</p>';

        if (typeof window.firebase === 'undefined' || !window.firebase.database) {
            listEl.innerHTML = '<p style="text-align:center; color:red;">Lỗi kết nối Firebase!</p>';
            return;
        }

        window.firebase.database().ref('users').once('value')
        .then((snapshot) => {
            if (!snapshot.exists()) {
                listEl.innerHTML = '<p style="text-align:center; color:#ccc;">Chưa có người chơi nào đăng ký.</p>';
                return;
            }

            let html = `
            <table style="width:100%; border-collapse: collapse; font-size: 1rem; color: #fff; text-align: center;">
                <tr style="background: #4a148c; color: #e1bee7; border-bottom: 2px solid #9c27b0;">
                    <th style="padding: 10px;">ID Tài Khoản</th>
                    <th>Tên Nhân Vật</th>
                    <th>Tài Sản</th>
                    <th>Hành Động Quản Trị</th>
                </tr>`;

            snapshot.forEach((childSnapshot) => {
                let accId = childSnapshot.key;
                let data = childSnapshot.val();
                let dName = data.displayName || "<Chưa đặt tên>";
                let coins = data.coins || 0;
                let vipPoints = data.vipPoints || 0;
                let userIsAdmin = data.isAdmin === true;
                let idColor = userIsAdmin ? '#ff0000' : '#00ffff';
                let idText = userIsAdmin ? `${accId} (Admin)` : accId;

                html += `
                <tr style="border-bottom: 1px solid #333; line-height: 2.5;">
                    <td style="color: ${idColor}; font-weight: bold;">${idText}</td>
                    <td style="color: #fff;">${dName}</td>
                    <td>
                        <span style="color:#ffd700; margin-right: 10px;">💰 ${coins} Xu</span> 
                        <span style="color:#ff4081;">💎 ${vipPoints} VIP</span>
                    </td>
                    <td>
                        <button onclick="adminAddCoins('${accId}', ${coins})" style="background:#ffd700; color:#000; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; font-weight:bold; margin-right:5px;">+ Xu</button>
                        <button onclick="adminAddVip('${accId}', ${vipPoints})" style="background:#ff4081; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; font-weight:bold; margin-right:5px;">+ VIP</button>
                        <button onclick="adminDeleteUser('${accId}')" style="background:#f44336; color:#fff; border:none; padding:5px 10px; border-radius:5px; cursor:pointer; font-weight:bold;">🗑️ Xoá</button>
                    </td>
                </tr>`;
            });
            html += '</table>';
            listEl.innerHTML = html;
        }).catch((err) => {
            listEl.innerHTML = '<p style="text-align:center; color:red;">Lỗi: ' + err.message + '</p>';
        });
    }
    window.adminAddCoins = function(accId, currentCoins) {
        if(window.playSoundInternal) window.playSoundInternal('select');
        let amount = prompt(`Nhập số lượng 💰 XU muốn cộng cho tài khoản [${accId}]:\n(Ghi số âm nếu muốn trừ)`, "100");
        if (amount && !isNaN(amount)) {
            let newVal = parseInt(currentCoins) + parseInt(amount);
            window.firebase.database().ref('users/' + accId).update({ coins: newVal })
            .then(() => { alert("✅ Đã cập nhật Xu thành công!"); loadUsersData(); })
            .catch(err => alert("❌ Lỗi: " + err.message));
        }
    };

    window.adminAddVip = function(accId, currentVip) {
        if(window.playSoundInternal) window.playSoundInternal('select');
        let amount = prompt(`Nhập số lượng 💎 ĐIỂM VIP muốn cộng cho tài khoản [${accId}]:\n(Ghi số âm nếu muốn trừ)`, "10");
        if (amount && !isNaN(amount)) {
            let newVal = parseInt(currentVip) + parseInt(amount);
            window.firebase.database().ref('users/' + accId).update({ vipPoints: newVal })
            .then(() => { alert("✅ Đã cập nhật Điểm VIP thành công!"); loadUsersData(); })
            .catch(err => alert("❌ Lỗi: " + err.message));
        }
    };

    window.adminDeleteUser = function(accId) {
        if(window.playSoundInternal) window.playSoundInternal('error');
        let confirmDelete = confirm(`⚠️ CẢNH BÁO NGUY HIỂM!\n\nBạn có chắc chắn muốn XOÁ VĨNH VIỄN tài khoản [${accId}] không?\nHành động này không thể hoàn tác!`);
        if (confirmDelete) {
            window.firebase.database().ref('users/' + accId).remove()
            .then(() => { alert("🗑️ Đã xoá tài khoản thành công!"); loadUsersData(); })
            .catch(err => alert("❌ Lỗi xoá: " + err.message));
        }
    };
    window.addEventListener('load', () => {
        setTimeout(createAdminUI, 500);
    });
})();