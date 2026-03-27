/* ========================================================
 * TÁC GIẢ: BỞI VĂN CƯỜNG (CODE BY VANCUONG)
 * BẢN QUYỀN: ĐỘC QUYỀN SERVER TU TIÊN PIKACHU
 * ======================================================== */
(function() {
    // TỶ GIÁ QUY ĐỔI HAI CHIỀU CỦA SẾP ĐÂY
    const RATE_COIN_TO_VIP = 200; // 200 Linh thạch = 1 VIP
    const RATE_VIP_TO_COIN = 150; // 1 VIP = 150 Linh thạch
    
    // GIÁ VẬT PHẨM
    const ITEM_PRICES = {
        hint: 30,     // 30 Linh thạch / 1 Gợi ý
        shuffle: 30,  // 30 Linh thạch / 1 Đổi vị trí
        autowin: 500   // 500 Linh thạch / 1 Auto Win (Thiên Lôi)
    };

    if (!document.getElementById('shop-system-styles')) {
        let style = document.createElement('style'); style.id = 'shop-system-styles';
        style.innerHTML = `
            .shop-modal-content { max-width: 500px; width: 95%; background: linear-gradient(135deg, #1f140e 0%, #0a0604 100%); border: 4px solid #4CAF50; border-radius: 15px; padding: 25px; box-shadow: 0 0 30px rgba(76, 175, 80, 0.5), inset 0 0 20px rgba(0,0,0,0.9); text-align: center; color: #fff; position: relative; max-height: 90vh; overflow-y: auto; }
            .shop-tab-wrap { display: flex; border-bottom: 2px solid #4CAF50; margin-bottom: 20px; }
            .shop-tab-btn { flex: 1; padding: 10px; background: #222; color: #aaa; font-weight: bold; cursor: pointer; border: 2px solid #333; border-bottom: none; border-radius: 10px 10px 0 0; transition: 0.3s; font-size: 1.1rem; }
            .shop-tab-btn.active { background: linear-gradient(to bottom, #4CAF50, #2E7D32); color: #fff; border-color: #4CAF50; text-shadow: 0 0 5px #fff; box-shadow: 0 -5px 15px rgba(76, 175, 80, 0.4); }
            
            .shop-item-box { background: rgba(0,0,0,0.6); border: 1px solid #4CAF50; border-radius: 10px; padding: 15px; margin-bottom: 15px; display: flex; align-items: center; justify-content: space-between; box-shadow: inset 0 0 10px #000; }
            .shop-item-icon { font-size: 2.5rem; text-shadow: 0 0 10px #4CAF50; margin-right: 15px; }
            .shop-buy-btn { background: linear-gradient(to bottom, #ff9800, #e65100); border: 2px solid #fff; color: #fff; font-weight: bold; padding: 8px 15px; border-radius: 8px; cursor: pointer; box-shadow: 0 0 10px rgba(255,152,0,0.5); transition: 0.2s; }
            .shop-buy-btn:hover { transform: scale(1.05); filter: brightness(1.2); }
            
            .shop-exchange-inp { width: 100%; padding: 10px; border-radius: 8px; border: 2px solid #555; background: #111; color: #00ffff; font-size: 1.1rem; text-align: center; box-sizing: border-box; font-weight: bold; outline: none; transition: 0.3s; }
            .shop-exchange-inp:focus { box-shadow: 0 0 10px rgba(0,229,255,0.6); background: #222; border-color: #00ffff; }
            .shop-exchange-inp::placeholder { color: #666; font-weight: normal; font-size: 0.9rem; }
        `;
        document.head.appendChild(style);
    }

    window.ShopSystem = {
        open: function() {
            let accId = localStorage.getItem('pikachu_account_id');
            if (!accId) { window.showCustomAlertInternal("Vui lòng đăng nhập!"); return; }

            let oldOverlay = document.getElementById('shop-overlay');
            if (oldOverlay) oldOverlay.remove();

            let myCoins = parseInt(localStorage.getItem('pikachu_coins')) || 0;
            let myVipPts = parseInt(localStorage.getItem('pikachu_vip_points')) || 0;
            let hints = parseInt(localStorage.getItem('pikachu_inv_hints')) || 0;
            let shuffles = parseInt(localStorage.getItem('pikachu_inv_shuffles')) || 0;
            let autowins = parseInt(localStorage.getItem('pikachu_inv_autowins')) || 0;

            const html = `
            <div id="shop-overlay" class="modal-overlay" style="z-index: 9999999; backdrop-filter: blur(8px);">
                <div class="shop-modal-content">
                    <h2 style="color: #4CAF50; margin-bottom: 10px; font-size: 2rem; text-shadow: 0 0 10px #4CAF50;">TÔNG MÔN BẢO CÁC</h2>
                    
                    <div style="background: rgba(0,0,0,0.8); border: 1px dashed #4CAF50; border-radius: 8px; padding: 10px; margin-bottom: 15px; display: flex; justify-content: space-around; color: #fff;">
                        <div><span style="color:#00ffff; font-size:1.2rem;">💎</span> <b id="shop-display-coins">${myCoins.toLocaleString('vi-VN')}</b></div>
                        <div><span style="color:#ff00ff; font-size:1.2rem;">🏅</span> <b id="shop-display-vip">${myVipPts.toLocaleString('vi-VN')}</b></div>
                    </div>

                    <div class="shop-tab-wrap">
                        <button id="shop-tab-items" class="shop-tab-btn active" onclick="ShopSystem.switchTab('items')">VẬT PHẨM</button>
                        <button id="shop-tab-exchange" class="shop-tab-btn" onclick="ShopSystem.switchTab('exchange')">QUY ĐỔI VIP</button>
                    </div>

                    <div id="shop-sec-items">
                        <div class="shop-item-box">
                            <div style="display: flex; align-items: center;">
                                <div class="shop-item-icon">💡</div>
                                <div style="text-align: left;">
                                    <div style="font-size: 1.1rem; font-weight: bold; color: #ffeb3b;">Gợi Ý (Nhãn Lực)</div>
                                    <div style="font-size: 0.85rem; color: #ccc;">Sở hữu: <b id="shop-display-hints" style="color:#fff;">${hints}</b></div>
                                    <div style="color: #00ffff; font-size: 0.9rem; margin-top: 3px;">Giá: ${ITEM_PRICES.hint} 💎</div>
                                </div>
                            </div>
                            <button class="shop-buy-btn" onclick="ShopSystem.buyItem('hint')">MUA 1</button>
                        </div>
                        
                        <div class="shop-item-box">
                            <div style="display: flex; align-items: center;">
                                <div class="shop-item-icon">🔄</div>
                                <div style="text-align: left;">
                                    <div style="font-size: 1.1rem; font-weight: bold; color: #ffeb3b;">Đổi Vị Trí (Na Di)</div>
                                    <div style="font-size: 0.85rem; color: #ccc;">Sở hữu: <b id="shop-display-shuffles" style="color:#fff;">${shuffles}</b></div>
                                    <div style="color: #00ffff; font-size: 0.9rem; margin-top: 3px;">Giá: ${ITEM_PRICES.shuffle} 💎</div>
                                </div>
                            </div>
                            <button class="shop-buy-btn" onclick="ShopSystem.buyItem('shuffle')">MUA 1</button>
                        </div>

                        <div class="shop-item-box">
                            <div style="display: flex; align-items: center;">
                                <div class="shop-item-icon">⚡</div>
                                <div style="text-align: left;">
                                    <div style="font-size: 1.1rem; font-weight: bold; color: #ffeb3b;">Qua Màn (Thiên Lôi)</div>
                                    <div style="font-size: 0.85rem; color: #ccc;">Sở hữu: <b id="shop-display-autowins" style="color:#fff;">${autowins}</b></div>
                                    <div style="color: #00ffff; font-size: 0.9rem; margin-top: 3px;">Giá: ${ITEM_PRICES.autowin} 💎</div>
                                </div>
                            </div>
                            <button class="shop-buy-btn" onclick="ShopSystem.buyItem('autowin')">MUA 1</button>
                        </div>
                    </div>

                    <div id="shop-sec-exchange" class="hidden">
                        
                        <div style="background: rgba(0,0,0,0.5); border: 1px solid #ff9800; border-radius: 8px; padding: 15px; margin-bottom: 15px;">
                            <p style="color: #ff9800; margin-bottom: 10px; font-weight: bold; font-size: 1.1rem;">DÙNG LINH THẠCH ĐỔI VIP</p>
                            <p style="color: #ccc; font-size: 0.9rem; margin-bottom: 15px;">Tỷ giá: <span style="color:#fff;">${RATE_COIN_TO_VIP} 💎 = 1 🏅</span></p>
                            
                            <input type="number" id="shop-ex-coin-inp" class="shop-exchange-inp" placeholder="Nhập số Linh Thạch..." oninput="ShopSystem.calcCoinToVip()">
                            
                            <div style="margin-top: 10px; font-size: 1rem;">
                                Nhận được: <b id="shop-res-vip" style="color: #ff00ff; font-size: 1.3rem;">0</b> <b style="color: #ff00ff;">🏅 VIP</b>
                            </div>
                            <button onclick="ShopSystem.doCoinToVip()" style="width: 100%; margin-top: 15px; background: linear-gradient(to right, #d32f2f, #b71c1c); border: 2px solid #fff; color: #fff; font-weight: bold; padding: 10px; border-radius: 8px; cursor: pointer; box-shadow: 0 0 10px rgba(244, 67, 54, 0.5); transition: 0.2s;">⚡ ĐỔI LẤY VIP</button>
                        </div>

                        <div style="background: rgba(0,0,0,0.5); border: 1px solid #00e5ff; border-radius: 8px; padding: 15px;">
                            <p style="color: #00e5ff; margin-bottom: 10px; font-weight: bold; font-size: 1.1rem;">DÙNG VIP ĐỔI LINH THẠCH</p>
                            <p style="color: #ccc; font-size: 0.9rem; margin-bottom: 15px;">Tỷ giá: <span style="color:#fff;">1 🏅 = ${RATE_VIP_TO_COIN} 💎</span></p>
                            
                            <input type="number" id="shop-ex-vip-inp" class="shop-exchange-inp" placeholder="Nhập số điểm VIP..." oninput="ShopSystem.calcVipToCoin()">
                            
                            <div style="margin-top: 10px; font-size: 1rem;">
                                Nhận được: <b id="shop-res-coin" style="color: #00ffff; font-size: 1.3rem;">0</b> <b style="color: #00ffff;">💎 Linh Thạch</b>
                            </div>
                            <button onclick="ShopSystem.doVipToCoin()" style="width: 100%; margin-top: 15px; background: linear-gradient(to right, #0091ea, #00b0ff); border: 2px solid #fff; color: #fff; font-weight: bold; padding: 10px; border-radius: 8px; cursor: pointer; box-shadow: 0 0 10px rgba(0, 145, 234, 0.5); transition: 0.2s;">💰 ĐỔI LẤY LINH THẠCH</button>
                        </div>

                    </div>

                    <button onclick="document.getElementById('shop-overlay').remove(); if(window.playSoundInternal) window.playSoundInternal('select');" style="margin-top: 20px; background: transparent; border: 2px solid #aaa; color: #ddd; font-weight: bold; padding: 10px 30px; border-radius: 8px; cursor: pointer; font-size: 1.1rem; width: 100%; transition: 0.2s;">ĐÓNG CỬA HÀNG</button>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
        },

        switchTab: function(tabName) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            let tabItems = document.getElementById('shop-tab-items');
            let tabEx = document.getElementById('shop-tab-exchange');
            let secItems = document.getElementById('shop-sec-items');
            let secEx = document.getElementById('shop-sec-exchange');

            if (tabName === 'items') {
                tabItems.classList.add('active'); tabEx.classList.remove('active');
                secItems.classList.remove('hidden'); secEx.classList.add('hidden');
            } else {
                tabEx.classList.add('active'); tabItems.classList.remove('active');
                secEx.classList.remove('hidden'); secItems.classList.add('hidden');
            }
        },

        calcCoinToVip: function() {
            let val = parseInt(document.getElementById('shop-ex-coin-inp').value) || 0;
            let receivedVip = Math.floor(val / RATE_COIN_TO_VIP);
            if (receivedVip < 0) receivedVip = 0;
            document.getElementById('shop-res-vip').innerText = receivedVip.toLocaleString('vi-VN');
        },

        doCoinToVip: function() {
            if(window.playSoundInternal) window.playSoundInternal('select');
            let accId = localStorage.getItem('pikachu_account_id');
            if (!accId || typeof window.firebase === 'undefined') return;

            let inputEl = document.getElementById('shop-ex-coin-inp');
            let val = parseInt(inputEl.value);
            
            if (isNaN(val) || val < RATE_COIN_TO_VIP) {
                window.showCustomAlertInternal(`Phải đổi tối thiểu ${RATE_COIN_TO_VIP} Linh Thạch!`); return;
            }

            let myCoins = parseInt(localStorage.getItem('pikachu_coins')) || 0;
            let receivedVip = Math.floor(val / RATE_COIN_TO_VIP);
            let costCoins = receivedVip * RATE_COIN_TO_VIP;

            if (myCoins < costCoins) {
                window.showCustomAlertInternal("Linh Thạch trong túi không đủ!"); return;
            }

            window.showCustomConfirmInternal(`Chắc chắn tiêu hao ${costCoins.toLocaleString('vi-VN')} 💎 để đổi lấy ${receivedVip.toLocaleString('vi-VN')} 🏅 VIP chứ?`, () => {
                let newCoins = myCoins - costCoins;
                let myVipPts = parseInt(localStorage.getItem('pikachu_vip_points')) || 0;
                let newVipPts = myVipPts + receivedVip;

                localStorage.setItem('pikachu_coins', newCoins);
                localStorage.setItem('pikachu_vip_points', newVipPts);

                window.firebase.database().ref('users/' + accId).update({ coins: newCoins, vipPoints: newVipPts }).then(() => {
                    if(window.playSoundInternal) window.playSoundInternal('win');
                    window.showCustomAlertInternal(`✅ Quy đổi thành công!\nNhận được ${receivedVip.toLocaleString('vi-VN')} Điểm VIP.`);
                    document.getElementById('shop-display-coins').innerText = newCoins.toLocaleString('vi-VN');
                    document.getElementById('shop-display-vip').innerText = newVipPts.toLocaleString('vi-VN');
                    inputEl.value = ''; this.calcCoinToVip();
                });
            });
        },

        calcVipToCoin: function() {
            let val = parseInt(document.getElementById('shop-ex-vip-inp').value) || 0;
            let receivedCoins = val * RATE_VIP_TO_COIN;
            if (receivedCoins < 0) receivedCoins = 0;
            document.getElementById('shop-res-coin').innerText = receivedCoins.toLocaleString('vi-VN');
        },

        doVipToCoin: function() {
            if(window.playSoundInternal) window.playSoundInternal('select');
            let accId = localStorage.getItem('pikachu_account_id');
            if (!accId || typeof window.firebase === 'undefined') return;

            let inputEl = document.getElementById('shop-ex-vip-inp');
            let val = parseInt(inputEl.value);
            
            if (isNaN(val) || val < 1) {
                window.showCustomAlertInternal(`Phải đổi tối thiểu 1 điểm VIP!`); return;
            }

            let myVipPts = parseInt(localStorage.getItem('pikachu_vip_points')) || 0;
            if (myVipPts < val) {
                window.showCustomAlertInternal("Điểm VIP hiện tại không đủ để bán!"); return;
            }

            let receivedCoins = val * RATE_VIP_TO_COIN;

            window.showCustomConfirmInternal(`Chắc chắn khấu trừ ${val.toLocaleString('vi-VN')} 🏅 VIP để thu về ${receivedCoins.toLocaleString('vi-VN')} 💎 chứ?`, () => {
                let myCoins = parseInt(localStorage.getItem('pikachu_coins')) || 0;
                let newCoins = myCoins + receivedCoins;
                let newVipPts = myVipPts - val;

                localStorage.setItem('pikachu_coins', newCoins);
                localStorage.setItem('pikachu_vip_points', newVipPts);

                window.firebase.database().ref('users/' + accId).update({ coins: newCoins, vipPoints: newVipPts }).then(() => {
                    if(window.playSoundInternal) window.playSoundInternal('win');
                    window.showCustomAlertInternal(`✅ Bán VIP thành công!\nThu về ${receivedCoins.toLocaleString('vi-VN')} Linh Thạch.`);
                    document.getElementById('shop-display-coins').innerText = newCoins.toLocaleString('vi-VN');
                    document.getElementById('shop-display-vip').innerText = newVipPts.toLocaleString('vi-VN');
                    inputEl.value = ''; this.calcVipToCoin();
                });
            });
        },

        buyItem: function(type) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            
            let accId = localStorage.getItem('pikachu_account_id');
            if (!accId || typeof window.firebase === 'undefined') return;

            let myCoins = parseInt(localStorage.getItem('pikachu_coins')) || 0;
            let cost = ITEM_PRICES[type];

            if (myCoins < cost) {
                window.showCustomAlertInternal("Linh Thạch trong túi không đủ!"); return;
            }

            window.showCustomConfirmInternal(`Xác nhận mua vật phẩm này với giá ${cost} 💎?`, () => {
                let newCoins = myCoins - cost;
                let updates = { coins: newCoins };
                
                if (type === 'hint') {
                    let hints = parseInt(localStorage.getItem('pikachu_inv_hints')) || 0;
                    hints += 1;
                    localStorage.setItem('pikachu_inv_hints', hints);
                    updates.invHints = hints;
                    document.getElementById('shop-display-hints').innerText = hints;
                } else if (type === 'shuffle') {
                    let shuffles = parseInt(localStorage.getItem('pikachu_inv_shuffles')) || 0;
                    shuffles += 1;
                    localStorage.setItem('pikachu_inv_shuffles', shuffles);
                    updates.invShuffles = shuffles;
                    document.getElementById('shop-display-shuffles').innerText = shuffles;
                } else if (type === 'autowin') {
                    // LOGIC CHO VẬT PHẨM MỚI
                    let autowins = parseInt(localStorage.getItem('pikachu_inv_autowins')) || 0;
                    autowins += 1;
                    localStorage.setItem('pikachu_inv_autowins', autowins);
                    updates.invAutowins = autowins;
                    document.getElementById('shop-display-autowins').innerText = autowins;
                }

                localStorage.setItem('pikachu_coins', newCoins);
                document.getElementById('shop-display-coins').innerText = newCoins.toLocaleString('vi-VN');

                window.firebase.database().ref('users/' + accId).update(updates)
                .then(() => {
                    if(window.playSoundInternal) window.playSoundInternal('match');
                });
            });
        }
    };

    window.openShopPanel = function() {
        if(window.playSoundInternal) window.playSoundInternal('select');
        window.ShopSystem.open();
    };
})();