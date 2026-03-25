/* ========================================================
 * TÁC GIẢ: BỞI VĂN CƯỜNG (CODE BY VANCUONG)
 * BẢN QUYỀN: ĐỘC QUYỀN SERVER TU TIÊN PIKACHU
 * CẢNH BÁO: Mọi hành vi sao chép không xin phép đều là vi phạm!
 ======================================================== */
(function() {
    setInterval(() => {
        let leftActions = document.querySelector('.menu-left-actions');
        if (leftActions && !document.getElementById('btn-menu-profile')) {
            let profileBtn = document.createElement('button');
            profileBtn.id = 'btn-menu-profile';
            profileBtn.innerHTML = '👤 HỒ SƠ';
            profileBtn.style.cssText = "background: linear-gradient(to bottom, #1976d2, #0d47a1); border: 3px solid #64b5f6; color: #fff; font-weight: bold; padding: 12px 25px; border-radius: 12px; cursor: pointer; font-size: 1.1rem; box-shadow: 0 0 15px rgba(33, 150, 243, 0.6); transition: 0.2s;";
            profileBtn.onmouseover = () => profileBtn.style.transform = "scale(1.05)";
            profileBtn.onmouseleave = () => profileBtn.style.transform = "scale(1)";
            profileBtn.onclick = () => { if(window.playSoundInternal) window.playSoundInternal('select'); PlayerProfile.open(); };
            leftActions.appendChild(profileBtn);
        }
    }, 1000);

    window.PlayerProfile = {
        open: function() {
            let accId = localStorage.getItem('pikachu_account_id') || 'Chưa rõ';
            let pName = localStorage.getItem('pikachu_player_name') || 'Vô Danh';
            let coins = localStorage.getItem('pikachu_coins') || 0; 
            let avatarSrc = localStorage.getItem('pikachu_player_avatar');
            
            let safeName = encodeURIComponent(pName);
            let dynamicAvt = `https://ui-avatars.com/api/?name=${safeName}&background=random&color=fff&bold=true&size=100`;
            let finalAvt = (avatarSrc && !avatarSrc.includes('imgur.com')) ? avatarSrc : dynamicAvt;

            let vipPts = localStorage.getItem('pikachu_vip_points') || 0;
            let vipInfo = window.getVipLevelInfo ? window.getVipLevelInfo(vipPts) : { name: 'Phàm Nhân', color: '#888888' };
            if (accId.toLowerCase() === "vancuong140904" || pName.includes("Boss Văn Cường")) {
                vipInfo = { name: "Tiên Nhân", color: "#ff0000", glow: "0 0 20px #ff0000" };
            }

            let coloredNameHtml = window.getColoredNameHTML ? window.getColoredNameHTML(accId, pName, vipInfo.color) : `<span style="color: ${vipInfo.color}; font-weight: bold;">${pName}</span>`;

            let currentFrame = localStorage.getItem('pikachu_equipped_frame') || 'none';
            let avatarHtml = window.renderAvatarWithFrame ? window.renderAvatarWithFrame(finalAvt, currentFrame, vipInfo.color, 90) : `<img src="${finalAvt}" style="width: 90px; height: 90px; border-radius: 50%; border: 4px solid ${vipInfo.color}; object-fit: cover; box-shadow: 0 0 15px ${vipInfo.color};">`;

            // === TÍNH TOÁN EXP (TU VI) ===
            // Sếp có thể tự thay đổi key 'pikachu_exp' bằng biến mà server trả về nhé.
            let exp = parseInt(localStorage.getItem('pikachu_exp')) || parseInt(vipPts) || 0; 
            // Nếu không có max_exp, tự động cho level max là mốc 1000 tiếp theo (ví dụ: exp 1500 -> max 2000)
            let maxExp = parseInt(localStorage.getItem('pikachu_max_exp')) || (Math.floor(exp / 1000) + 1) * 1000;
            let expPercent = Math.min((exp / maxExp) * 100, 100).toFixed(1); // Giới hạn max 100%

            let oldOverlay = document.getElementById('profile-overlay');
            if (oldOverlay) oldOverlay.remove();

            const html = `
            <div id="profile-overlay" class="modal-overlay" style="z-index: 9999999; backdrop-filter: blur(5px);">
                <div class="modal-content" style="max-width: 400px; padding: 25px; text-align: center; border: 4px solid #64b5f6; background: #3e2723; box-shadow: 0 0 30px rgba(33, 150, 243, 0.5); overflow-y: auto; max-height: 90vh;">
                    
                    <h2 style="color: #64b5f6; margin-bottom: 15px; font-size: 2.2rem; text-shadow: 2px 2px 0 #000;">HỒ SƠ TU TIÊN</h2>
                    
                    <div style="margin-bottom: 10px; display: flex; justify-content: center;">${avatarHtml}</div>
                    
                    <span style="background: ${vipInfo.color}; color: #000; padding: 4px 15px; border-radius: 12px; font-weight: bold; font-size: 0.9rem; white-space: nowrap; box-shadow: 0 2px 5px rgba(0,0,0,0.8); display: inline-block; margin-bottom: 10px;">${vipInfo.name}</span>

                    <div style="margin: 0 auto 20px auto; width: 85%; text-align: left;">
                        <div style="display: flex; justify-content: space-between; font-size: 0.9rem; color: #ccc; margin-bottom: 5px; text-shadow: 1px 1px 2px #000;">
                            <strong>✨ Tu Vi</strong>
                            <span style="color: #00c6ff; font-weight: bold;">${exp.toLocaleString('vi-VN')} / ${maxExp.toLocaleString('vi-VN')}</span>
                        </div>
                        <div style="width: 100%; background: rgba(0,0,0,0.6); border-radius: 10px; border: 1px solid #555; overflow: hidden; height: 16px; position: relative; box-shadow: inset 0 0 8px #000;">
                            <div style="width: ${expPercent}%; background: linear-gradient(90deg, #00c6ff, #0072ff); height: 100%; border-radius: 10px; box-shadow: 0 0 10px #00c6ff; transition: width 0.5s ease-in-out;"></div>
                            <div style="position: absolute; top: 0; left: 0; width: 100%; text-align: center; font-size: 0.7rem; color: #fff; font-weight: bold; line-height: 16px; text-shadow: 1px 1px 2px #000;">${expPercent}%</div>
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px; justify-content: center; margin-bottom: 20px;">
                        <button onclick="document.getElementById('tutien-avatar-upload').click(); if(window.playSoundInternal) window.playSoundInternal('select');" style="flex: 1; background: #222; color: #00ffff; border: 1px solid #00ffff; padding: 8px 10px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 0.9rem; transition: 0.2s;">📷 Đổi Ảnh</button>
                        
                        <button onclick="PlayerProfile.openFrameInventory()" style="flex: 1; background: linear-gradient(to right, #004d40, #00695c); color: #00ffff; border: 1px solid #00ffff; padding: 8px 10px; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 0.9rem; transition: 0.2s; box-shadow: 0 0 10px rgba(0,255,255,0.3);">✨ Đổi Khung</button>
                    </div>

                    <input type="file" id="tutien-avatar-upload" accept="image/*" style="display: none;" onchange="PlayerProfile.handleAvatarUpload(this)">

                    <div style="background: rgba(0,0,0,0.6); border-radius: 10px; padding: 15px; margin-bottom: 15px; border: 1px solid #8b5a2b; text-align: left; box-shadow: inset 0 0 10px #000;">
                        <div style="margin-bottom: 12px; font-size: 1.05rem; color: #ccc; border-bottom: 1px dashed #555; padding-bottom: 8px;"><strong>🔑 ID:</strong> <span style="color: #00ffff; float: right;">${accId}</span></div>
                        <div style="margin-bottom: 12px; font-size: 1.05rem; color: #ccc; border-bottom: 1px dashed #555; padding-bottom: 8px;"><strong>👤 Biệt Danh:</strong> <span style="float: right;">${coloredNameHtml}</span></div>
                        <div style="margin-bottom: 12px; font-size: 1.05rem; color: #ccc; border-bottom: 1px dashed #555; padding-bottom: 8px;"><strong>🏅 Cảnh Giới:</strong> <span style="color: ${vipInfo.color}; float: right; font-weight: bold; text-shadow: 1px 1px 2px #000;">${vipInfo.name}</span></div>
                        <div style="margin-bottom: 5px; font-size: 1.05rem; color: #ccc;"><strong>💎 Linh Thạch:</strong> <span style="color: #00e676; float: right; font-weight: bold;">${coins.toLocaleString('vi-VN')}</span></div>
                    </div>

                    <div style="margin-bottom: 15px; text-align: right;">
                        <button onclick="PlayerProfile.togglePasswordForm(); if(window.playSoundInternal) window.playSoundInternal('select');" style="background: transparent; border: 1px solid #aaa; color: #ddd; padding: 5px 10px; border-radius: 5px; cursor: pointer; font-size: 0.9rem; transition: 0.2s;">🔐 Đổi Mật Khẩu</button>
                    </div>

                    <div id="prof-password-form" class="hidden" style="background: rgba(0,0,0,0.8); border: 2px solid #ff5252; padding: 15px; border-radius: 8px; margin-bottom: 20px;">
                        <p style="color: #ff5252; margin-bottom: 10px; font-weight: bold; font-size: 0.9rem;">THIẾT LẬP MẬT KHẨU MỚI</p>
                        <input type="password" id="prof-old-pass" placeholder="Nhập mật khẩu cũ..." style="width: 100%; padding: 10px; margin-bottom: 10px; border-radius: 4px; border: 1px solid #555; background: #222; color: #fff; text-align: center; font-size: 1rem; box-sizing: border-box;">
                        <input type="password" id="prof-new-pass" placeholder="Nhập mật khẩu mới..." style="width: 100%; padding: 10px; margin-bottom: 10px; border-radius: 4px; border: 1px solid #555; background: #222; color: #fff; text-align: center; font-size: 1rem; box-sizing: border-box;">
                        <input type="password" id="prof-confirm-pass" placeholder="Xác nhận mật khẩu mới..." style="width: 100%; padding: 10px; margin-bottom: 15px; border-radius: 4px; border: 1px solid #555; background: #222; color: #fff; text-align: center; font-size: 1rem; box-sizing: border-box;">
                        <button onclick="PlayerProfile.submitPasswordChange()" style="background: #ff5252; color: #fff; width: 100%; padding: 10px; border: none; border-radius: 4px; cursor: pointer; font-weight: bold; font-size: 1rem;">XÁC NHẬN ĐỔI</button>
                    </div>

                    <button onclick="document.getElementById('profile-overlay').remove(); if(window.playSoundInternal) window.playSoundInternal('select');" style="background: linear-gradient(to bottom, #d4af37, #aa8000); border: 2px solid #fff; color: #000; font-weight: bold; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 1.2rem; width: 100%; transition: 0.2s;">ĐÓNG HỒ SƠ</button>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
        },

        handleAvatarUpload: function(input) {
            if (!input.files || !input.files[0]) return;
            let file = input.files[0];

            let accId = localStorage.getItem('pikachu_account_id');
            if (!accId) return;

            let btn = document.querySelector('button[onclick*="tutien-avatar-upload"]');
            if(btn) {
                btn.innerHTML = "⏳ ĐANG LẬP TRẬN...";
                btn.disabled = true;
                btn.style.background = "#555";
            }

            let alertFn = window.showCustomAlertInternal ? window.showCustomAlertInternal : alert;

            let reader = new FileReader();
            reader.onload = function(e) {
                let img = new Image();
                img.onload = function() {
                    let canvas = document.createElement('canvas');
                    let ctx = canvas.getContext('2d');
                    
                    canvas.width = 150; 
                    canvas.height = 150;
                    
                    let size = Math.min(img.width, img.height);
                    let x = (img.width - size) / 2;
                    let y = (img.height - size) / 2;
                    ctx.drawImage(img, x, y, size, size, 0, 0, 150, 150);
                    
                    let base64Avatar = canvas.toDataURL('image/jpeg', 0.8);

                    if (typeof window.firebase !== 'undefined' && window.firebase.database) {
                        window.firebase.database().ref('users/' + accId).update({ avatar: base64Avatar })
                        .then(() => {
                            localStorage.setItem('pikachu_player_avatar', base64Avatar);
                            
                            let mainAvts = document.querySelectorAll('.player-avatar-img');
                            mainAvts.forEach(a => a.src = base64Avatar);

                            PlayerProfile.open();
                            
                            if(btn) {
                                btn.innerHTML = "✅ ĐÃ LƯU (F5 THOẢI MÁI)";
                                btn.disabled = false;
                                btn.style.background = "#222";
                                btn.style.color = "#00ff00";
                                btn.style.borderColor = "#00ff00";
                            }
                            alertFn("✅ Thay đổi dung nhan thành công! Thiên Đạo đã ghi nhận, ngài F5 thoải mái!");
                        })
                        .catch(err => {
                            alertFn("❌ Lỗi Firebase: " + err.message);
                            if(btn) { btn.innerHTML = "📷 Đổi Ảnh"; btn.disabled = false; }
                        });
                    } else {
                        alertFn("❌ Không kết nối được Thiên Đạo (Firebase)!");
                        if(btn) { btn.innerHTML = "📷 Đổi Ảnh"; btn.disabled = false; }
                    }
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        },

        openFrameInventory: function() {
            if(window.playSoundInternal) window.playSoundInternal('select');
            if(window.FrameSystem) {
                let prof = document.getElementById('profile-overlay');
                if(prof) prof.classList.add('hidden'); 
                window.FrameSystem.openInventory();
            } else { alert("Hệ thống Khung đang lỗi. Sếp hãy nhấn Ctrl+F5 để xóa bộ nhớ đệm trình duyệt!"); }
        },

        togglePasswordForm: function() {
            let form = document.getElementById('prof-password-form');
            if(form) {
                if(form.classList.contains('hidden')) form.classList.remove('hidden');
                else form.classList.add('hidden');
            }
        },

        submitPasswordChange: function() {
            if(window.playSoundInternal) window.playSoundInternal('select');
            let oldPass = document.getElementById('prof-old-pass').value;
            let newPass = document.getElementById('prof-new-pass').value;
            let confirmPass = document.getElementById('prof-confirm-pass').value;
            let accId = localStorage.getItem('pikachu_account_id');
            let alertFn = window.showCustomAlertInternal ? window.showCustomAlertInternal : alert;

            if (!oldPass || !newPass || !confirmPass) { alertFn("Vui lòng điền đầy đủ các ô mật khẩu!"); return; }
            if (newPass !== confirmPass) { alertFn("Mật khẩu mới và Xác nhận không khớp!"); return; }
            if (newPass.length < 6) { alertFn("Mật khẩu mới phải có ít nhất 6 ký tự!"); return; }
            if (newPass === oldPass) { alertFn("Mật khẩu mới phải khác mật khẩu cũ!"); return; }
            if (typeof window.firebase === 'undefined' || !window.firebase.database) { alertFn("Lỗi kết nối mạng!"); return; }

            let db = window.firebase.database();
            let btn = document.querySelector('#prof-password-form button');
            let oldBtnText = btn.innerText;
            btn.innerText = "⏳ ĐANG XỬ LÝ..."; btn.disabled = true;

            db.ref('users/' + accId).once('value').then(snap => {
                btn.innerText = oldBtnText; btn.disabled = false;
                if(snap.exists()) {
                    let data = snap.val();
                    if(data.password === oldPass) {
                        db.ref('users/' + accId).update({ password: newPass }).then(() => {
                            alertFn("✅ Đổi mật khẩu thành công!\nHãy ghi nhớ mật khẩu mới nhé.", () => {
                                PlayerProfile.togglePasswordForm(); 
                                document.getElementById('prof-old-pass').value = '';
                                document.getElementById('prof-new-pass').value = '';
                                document.getElementById('prof-confirm-pass').value = '';
                            });
                        }).catch(err => alertFn("Lỗi cập nhật mật khẩu: " + err.message));
                    } else { alertFn("❌ MẬT KHẨU CŨ KHÔNG CHÍNH XÁC!"); }
                } else { alertFn("Không tìm thấy tài khoản trên hệ thống!"); }
            }).catch(err => {
                btn.innerText = oldBtnText; btn.disabled = false;
                alertFn("Lỗi máy chủ: " + err.message);
            });
        }
    };
})();