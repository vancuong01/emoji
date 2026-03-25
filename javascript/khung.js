/* ========================================================
 * TÁC GIẢ: BỞI VĂN CƯỜNG (CODE BY VANCUONG)
 * BẢN QUYỀN: ĐỘC QUYỀN SERVER TU TIÊN PIKACHU
 * CẢNH BÁO: Mọi hành vi sao chép không xin phép đều là vi phạm!
 ======================================================== */

// ========================================================
// FILE: khung.js - HỆ THỐNG KHUNG AVATAR (CÓ KHÓA THEO VIP)
/* ========================================================
 * TÁC GIẢ: BỞI VĂN CƯỜNG (CODE BY VANCUONG)
 * BẢN QUYỀN: ĐỘC QUYỀN SERVER TU TIÊN PIKACHU
 * CẢNH BÁO: Mọi hành vi sao chép không xin phép đều là vi phạm!
 ======================================================== */
// ========================================================

(function() {
    if (!document.getElementById('frame-system-styles')) {
        let style = document.createElement('style'); style.id = 'frame-system-styles';
        style.innerHTML = `
            .frame-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(120px, 1fr)); gap: 15px; margin-top: 15px; }
            .frame-item { background: rgba(0,0,0,0.6); border: 2px solid #8b6b22; border-radius: 10px; padding: 15px; text-align: center; cursor: pointer; transition: 0.3s; position: relative; }
            .frame-item:hover { border-color: #00ffff; box-shadow: 0 0 15px rgba(0,255,255,0.4); transform: translateY(-3px); }
            .frame-item.equipped { border-color: #00ff00; box-shadow: 0 0 20px rgba(0,255,0,0.5); background: rgba(0, 50, 0, 0.4); }
            .frame-item-title { color: #fff; font-size: 0.9rem; margin-top: 10px; font-weight: bold; text-shadow: 1px 1px 2px #000; }
            .frame-preview-box { position: relative; width: 80px; height: 80px; margin: 0 auto; display: flex; justify-content: center; align-items: center; }
        `;
        document.head.appendChild(style);
    }

    window.renderAvatarWithFrame = function(avatarUrl, frameId, vipColor, size = 45) {
        let frameSrc = '';
        if (frameId === 'top1') frameSrc = 'picture/top1.png'; 
        else if (frameId === 'top2') frameSrc = 'picture/top2.png'; 
        else if (frameId === 'top3') frameSrc = 'picture/top3.png'; 

        let safeAvt = (avatarUrl && !avatarUrl.includes('imgur.com')) ? avatarUrl : `https://ui-avatars.com/api/?name=DH&background=random&color=fff&bold=true`;
        let fallback = `this.onerror=null; this.src='https://ui-avatars.com/api/?name=DH&background=random';`;

        // Tính toán kích thước Khung (Tỉ lệ 1.6 so với Avatar)
        let frameSize = size * 1.6; 

        if (!frameSrc || frameId === 'none') {
            // FIX LỖI LÙI TÊN: Dù KHÔNG CÓ KHUNG vẫn phải bọc trong cái hộp frameSize để giữ khoảng cách
            return `
            <div style="position: relative; width: ${frameSize}px; height: ${frameSize}px; display: flex; justify-content: center; align-items: center; flex-shrink: 0;">
                <img src="${safeAvt}" style="position: relative; z-index: 1; width: ${size}px; height: ${size}px; border-radius: 50%; object-fit: cover; border: 2px solid ${vipColor}; box-shadow: 0 0 5px #000;" onerror="${fallback}">
            </div>`;
        }

        // KHI CÓ KHUNG
        return `
        <div style="position: relative; width: ${frameSize}px; height: ${frameSize}px; display: flex; justify-content: center; align-items: center; flex-shrink: 0;">
            <img src="${frameSrc}" style="position: absolute; z-index: 5; width: 100%; height: 100%; pointer-events: none; object-fit: contain;" onerror="this.style.display='none'">
            <img src="${safeAvt}" style="position: relative; z-index: 1; width: ${size}px; height: ${size}px; border-radius: 50%; object-fit: cover; box-shadow: 0 0 5px #000;" onerror="${fallback}">
        </div>`;
    };

    window.FrameSystem = {
        frames: [
            { id: 'none', name: 'Không Đeo', src: '' },
            { id: 'top1', name: 'Hỏa Long Tôn Giả', src: 'picture/top1.png' },
            { id: 'top2', name: 'Thiên Thạch Dực', src: 'picture/top2.png' },
            { id: 'top3', name: 'Băng Tinh Huy', src: 'picture/top3.png' }
        ],
        myId: null, currentFrame: 'none',

        openInventory: function() {
            this.myId = localStorage.getItem('pikachu_account_id');
            if (!this.myId) return alert("Vui lòng đăng nhập!");
            
            this.currentFrame = localStorage.getItem('pikachu_equipped_frame') || 'none';

            let oldModal = document.getElementById('frame-inventory-overlay');
            if (oldModal) oldModal.remove();

            let gridHtml = this.frames.map(f => {
                let isEq = (f.id === this.currentFrame);
                let btnText = isEq ? 'Đang Trang Bị' : 'Sử Dụng';
                let btnColor = isEq ? '#00ff00' : '#d4af37';
                
                let myAvt = localStorage.getItem('pikachu_player_avatar');
                let demoAvatar = window.renderAvatarWithFrame(myAvt, f.id, '#ccc', 50);

                return `
                <div class="frame-item ${isEq ? 'equipped' : ''}" onclick="FrameSystem.equipFrame('${f.id}')">
                    <div class="frame-preview-box">${demoAvatar}</div>
                    <div class="frame-item-title">${f.name}</div>
                    <div style="margin-top: 10px; font-size: 0.8rem; color: ${btnColor}; font-weight: bold;">${btnText}</div>
                </div>`;
            }).join('');

            const html = `
            <div id="frame-inventory-overlay" class="modal-overlay" style="z-index: 99999999; backdrop-filter: blur(8px);" onclick="if(event.target.id === 'frame-inventory-overlay') this.remove();">
                <div class="modal-content" style="max-width: 500px; padding: 25px; border: 4px solid #00e5ff; background: linear-gradient(135deg, #1a2a22 0%, #080c0a 100%);">
                    <h2 style="color: #00ffff; text-shadow: 0 0 10px #00ffff; margin-bottom: 20px;">🎒 TỦ ĐỒ KHUNG BẢO</h2>
                    <div class="frame-grid">${gridHtml}</div>
                    <button onclick="document.getElementById('frame-inventory-overlay').remove(); if(window.playSoundInternal) window.playSoundInternal('select');" style="margin-top: 25px; background: #555; color: #fff; border: 2px solid #fff; padding: 10px; width: 100%; border-radius: 8px; font-weight: bold; cursor: pointer;">ĐÓNG TỦ ĐỒ</button>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
        },

        // --- ĐÃ TÍCH HỢP TRẬN PHÁP KIỂM TRA VIP VÀO ĐÂY ---
        // --- ĐÃ TÍCH HỢP TRẬN PHÁP KIỂM TRA VIP & QUYỀN ADMIN ---
        equipFrame: function(frameId) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            
            // 1. Kiểm tra quyền Admin tối cao
            let isAdmin = localStorage.getItem('pikachu_is_admin') === 'true';

            // 2. Lấy cấp độ VIP hiện tại của người chơi (nếu không phải Admin)
            let myVipPts = parseInt(localStorage.getItem('pikachu_vip_points')) || 0;
            let myVipLevel = 0;
            if (window.getVipLevelInfo) {
                let info = window.getVipLevelInfo(myVipPts);
                myVipLevel = info.level; // Lấy trực tiếp số level, không cần dùng Regex cắt chữ nữa!
            }

            // 3. Kiểm tra điều kiện VIP (Admin thì auto qua ải)
            let checkId = frameId.toLowerCase();
            let isAllowed = true;

            if (!isAdmin) {
                if (checkId === 'top1' && myVipLevel < 9) { // Cần VIP 9 (Độ Kiếp)
                    isAllowed = false;
                } else if (checkId === 'top2' && myVipLevel < 8) { // Cần VIP 8 (Đại Thừa)
                    isAllowed = false;
                } else if (checkId === 'top3' && myVipLevel < 7) { // Cần VIP 7 (Hợp Thể)
                    isAllowed = false;
                }
            }

            // 4. Nếu không đủ điều kiện -> Báo lỗi và dừng lại
            let alertFn = window.showCustomAlertInternal ? window.showCustomAlertInternal : alert;
            if (!isAllowed) {
                alertFn("⛔ Cảnh giới chưa đủ để dùng Huyết Ấn này!\nĐạt cảnh giới cao hơn để mở khóa.\nLiên hệ Zalo: 0865772851");
                return; // Dừng ngay, không cho đeo khung
            }

            // 5. Đủ điều kiện -> Lưu khung
            localStorage.setItem('pikachu_equipped_frame', frameId);
            this.currentFrame = frameId;
            if (typeof window.firebase !== 'undefined' && window.firebase.database) {
                window.firebase.database().ref('users/' + this.myId).update({ frame: frameId });
            }
            this.openInventory(); 
            alertFn("✅ Đã trang bị khung thành công! Khung sẽ hiển thị trên toàn server.");
        }
    };
})();