/* ========================================================
 * TÁC GIẢ: BỞI VĂN CƯỜNG (CODE BY VANCUONG)
 * MÔ TẢ: HỆ THỐNG HÀNH TRANG (TÚI ĐỒ NRO STYLE - FIX MẶC ĐỒ)
 * ======================================================== */
(function() {
    if (!document.getElementById('bag-system-styles')) {
        let style = document.createElement('style'); style.id = 'bag-system-styles';
        style.innerHTML = `
            .bag-tab-container { display: flex; justify-content: center; gap: 5px; margin-bottom: 15px; border-bottom: 2px solid #555; padding-bottom: 10px; }
            .bag-tab-btn { padding: 8px 20px; font-weight: bold; border-radius: 8px 8px 0 0; cursor: pointer; border: 2px solid #555; border-bottom: none; background: #222; color: #aaa; transition: 0.2s; font-size: 1.1rem; }
            .bag-tab-btn.active { background: linear-gradient(to bottom, #4caf50, #1b5e20); color: #fff; border-color: #00e676; box-shadow: 0 -2px 10px rgba(0,230,118,0.4); }
            .bag-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 4px; background: #8b5a2b; padding: 6px; border: 3px solid #5c2e0b; border-radius: 8px; max-height: 350px; overflow-y: auto; }
            .bag-slot { aspect-ratio: 1; background: #cba876; border: 1px solid #a07850; border-radius: 4px; display: flex; justify-content: center; align-items: center; font-size: 1.8rem; position: relative; cursor: pointer; transition: 0.1s; box-shadow: inset 0 0 8px rgba(0,0,0,0.2); }
            .bag-slot:hover { filter: brightness(1.1); transform: scale(1.05); z-index: 2; border-color: #fff; }
            .bag-slot.empty { background: #b08d60; box-shadow: inset 0 0 10px rgba(0,0,0,0.3); cursor: default; }
            .bag-slot.empty:hover { transform: none; border-color: #a07850; }
            .bag-item-count { position: absolute; bottom: 1px; right: 3px; font-size: 0.7rem; color: #fff; font-weight: bold; text-shadow: 1px 1px 1px #000, -1px -1px 1px #000; pointer-events: none; }
            .bag-footer { display: flex; justify-content: space-around; background: #111; padding: 10px; border-radius: 8px; margin-top: 15px; border: 1px solid #444; font-weight: bold; }
        `;
        document.head.appendChild(style);
    }

    const MAX_SLOTS = 50; 

    window.BagSystem = {
        openBag: function() {
            if(window.playSoundInternal) window.playSoundInternal('select');
            
            let oldStats = document.getElementById('stats-panel-overlay'); if (oldStats) oldStats.remove();
            let oldBag = document.getElementById('bag-panel-overlay'); if (oldBag) oldBag.remove();

            let invStr = localStorage.getItem('pikachu_inventory');
            let inventory = invStr ? JSON.parse(invStr) : [];
            
            let myCoins = parseInt(localStorage.getItem('pikachu_coins')) || 0;
            let myExp = parseInt(localStorage.getItem('pikachu_exp')) || 0;

            let gridHtml = '';
            for (let i = 0; i < MAX_SLOTS; i++) {
                let item = inventory[i];
                if (item) {
                    let countHtml = item.count && item.count > 1 ? `<div class="bag-item-count">${item.count}</div>` : '';
                    let typeColor = item.rarity || '#fff';
                    gridHtml += `
                    <div class="bag-slot" style="box-shadow: inset 0 0 10px ${typeColor}40;" onclick="BagSystem.showItemAction(${i})">
                        <span style="filter: drop-shadow(1px 1px 2px #000);">${item.icon}</span>
                        ${countHtml}
                    </div>`;
                } else {
                    gridHtml += `<div class="bag-slot empty"></div>`;
                }
            }

            const html = `
            <div id="bag-panel-overlay" class="modal-overlay" style="z-index: 99999998; backdrop-filter: blur(5px);" onclick="if(event.target.id==='bag-panel-overlay') this.remove();">
                <div class="modal-content" style="max-width: 450px; width: 95%; background: #1a0f07; border: 4px solid #4caf50; border-radius: 12px; padding: 20px; box-shadow: 0 0 30px #4caf50;">
                    
                    <div class="bag-tab-container">
                        <div class="bag-tab-btn" onclick="if(window.ClassSystem) window.ClassSystem.showStatsPanel();">Bản Thân</div>
                        <div class="bag-tab-btn active">Hành Trang</div>
                    </div>

                    <div class="bag-grid">${gridHtml}</div>

                    <div class="bag-footer">
                        <span style="color:#00ffff;">💎 ${myCoins.toLocaleString()}</span>
                        <span style="color:#ffeb3b;">✨ ${myExp.toLocaleString()}</span>
                    </div>

                    <button onclick="document.getElementById('bag-panel-overlay').remove();" class="g-btn" style="background:#555; width:100%; padding:10px; margin-top:15px; font-size:1.1rem;">ĐÓNG</button>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
        },

        showItemAction: function(index) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            
            let inv = JSON.parse(localStorage.getItem('pikachu_inventory') || "[]");
            let item = inv[index];
            if (!item) return;

            let sArr = [];
            if(item.stats) {
                if(item.stats.hp) sArr.push(`❤️ +${item.stats.hp} HP`);
                if(item.stats.mp) sArr.push(`💧 +${item.stats.mp} MP`);
                if(item.stats.atk) sArr.push(`⚔️ +${item.stats.atk} ATK`);
                if(item.stats.def) sArr.push(`🛡️ +${item.stats.def} DEF`);
                if(item.stats.spd) sArr.push(`⚡ +${item.stats.spd} SPD`);
            }
            let statsText = sArr.length > 0 ? sArr.join(' | ') : 'Không có chỉ số';

            let typeName = "Vật phẩm";
            if (item.type === 'weapon') typeName = "Vũ Khí";
            if (item.type === 'head') typeName = "Mũ";
            if (item.type === 'armor') typeName = "Y Phục";
            if (item.type === 'boots') typeName = "Hài";
            if (item.type === 'accessory') typeName = "Trang Sức";
            if (item.type === 'artifact') typeName = "Pháp Bảo";

            let isEquipable = ['weapon','head','armor','boots','accessory','artifact'].includes(item.type);
            let actionBtn = isEquipable 
                ? `<button onclick="BagSystem.equipItem(${index})" style="flex:1; background:#4caf50; color:#fff; border:2px solid #fff; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer;">MẶC VÀO</button>`
                : `<button onclick="BagSystem.useItem(${index})" style="flex:1; background:#ff9800; color:#fff; border:2px solid #fff; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer;">SỬ DỤNG</button>`;

            let old = document.getElementById('item-action-overlay'); if (old) old.remove();

            const html = `
            <div id="item-action-overlay" class="modal-overlay" style="z-index: 999999999; backdrop-filter: blur(2px);" onclick="if(event.target.id==='item-action-overlay') this.remove();">
                <div class="modal-content" style="max-width: 320px; background: #111; border: 3px solid ${item.rarity || '#fff'}; border-radius: 10px; padding: 20px; text-align: center;">
                    <div style="font-size:4rem; margin-bottom:10px; filter:drop-shadow(2px 2px 0 #000);">${item.icon}</div>
                    <h3 style="color:${item.rarity || '#fff'}; margin:0 0 5px 0;">${item.name}</h3>
                    <div style="color:#aaa; font-size:0.8rem; margin-bottom:15px; border-bottom:1px dashed #555; padding-bottom:10px;">[${typeName}]</div>
                    
                    <div style="color:#00ffff; font-size:0.95rem; margin-bottom:10px; font-weight:bold;">${statsText}</div>
                    <div style="color:#ccc; font-size:0.85rem; font-style:italic; margin-bottom:20px;">"${item.desc}"</div>
                    
                    <div style="display:flex; gap:10px;">
                        <button onclick="BagSystem.dropItem(${index})" style="flex:1; background:#f44336; color:#fff; border:2px solid #fff; padding:10px; border-radius:6px; font-weight:bold; cursor:pointer;">VỨT BỎ</button>
                        ${actionBtn}
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
        },

        equipItem: function(index) {
            if(window.playSoundInternal) window.playSoundInternal('win');
            let inv = JSON.parse(localStorage.getItem('pikachu_inventory') || "[]");
            let equips = JSON.parse(localStorage.getItem('pikachu_equipment') || "{}");
            
            // Tách đồ ra khỏi rương TRƯỚC TIÊN
            let itemToEquip = inv.splice(index, 1)[0]; 
            if (!itemToEquip) return;

            // Nếu đang mặc đồ cũ ở vị trí đó thì cất đồ cũ vào lại rương
            let oldEquip = equips[itemToEquip.type];
            if (oldEquip) {
                inv.push(oldEquip); 
            }

            // Gắn đồ mới lên người
            equips[itemToEquip.type] = itemToEquip;

            // Lưu lại
            localStorage.setItem('pikachu_equipment', JSON.stringify(equips));
            localStorage.setItem('pikachu_inventory', JSON.stringify(inv));
            
            document.getElementById('item-action-overlay').remove();
            
            // Nhảy sang Tab Bản Thân
            if(window.ClassSystem) window.ClassSystem.showStatsPanel();
        },

        useItem: function(index) {
            alert("Chức năng sử dụng vật phẩm đang được Tiên Nhân luyện chế!");
            document.getElementById('item-action-overlay').remove();
        },

        dropItem: function(index) {
            let doDrop = () => {
                if(window.playSoundInternal) window.playSoundInternal('select');
                let inv = JSON.parse(localStorage.getItem('pikachu_inventory') || "[]");
                inv.splice(index, 1);
                localStorage.setItem('pikachu_inventory', JSON.stringify(inv));
                
                document.getElementById('item-action-overlay').remove();
                this.openBag(); 
            };
            if (window.showCustomConfirmInternal) window.showCustomConfirmInternal("Ngài muốn vứt bỏ vật phẩm này?", doDrop, null);
            else if (confirm("Ngài muốn vứt bỏ vật phẩm này?")) doDrop();
        }
    };
})();