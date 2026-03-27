/* ========================================================
 * TÁC GIẢ: BỞI VĂN CƯỜNG (CODE BY VANCUONG)
 * MÔ TẢ: HỆ THỐNG NHÂN VẬT & TRANG BỊ (CHỌN ĐỒ NHANH TẠI CHỖ)
 * ======================================================== */
(function() {
    const CLASS_DATA = {
        'kiemtu': { name: 'Kiếm Tu', icon: '⚔️', color: '#ff5252', desc: 'Bạo phát sát thương. Phù hợp build full ATK.' },
        'phaptu': { name: 'Pháp Tu', icon: '🔮', color: '#00bfff', desc: 'Ma pháp vô biên. Phù hợp build MP và ATK.' },
        'hophap': { name: 'Hộ Pháp', icon: '🛡️', color: '#ff9800', desc: 'Phòng thủ như núi. Phù hợp build HP và DEF.' },
        'thetu': { name: 'Thể Tu', icon: '💪', color: '#4caf50', desc: 'Linh hoạt, thể lực tốt. Đa dụng mọi chỉ số.' },
        'phuthuy': { name: 'Phù Thủy', icon: '🧙', color: '#9c27b0', desc: 'Kẻ nắm giữ vận mệnh. Biến ảo khôn lường.' }
    };

    if (!document.getElementById('class-system-styles')) {
        let style = document.createElement('style'); style.id = 'class-system-styles';
        style.innerHTML = `
            .class-card { background: rgba(0,0,0,0.6); border: 2px solid #555; padding: 15px; border-radius: 10px; margin-bottom: 10px; cursor: pointer; transition: 0.3s; text-align: left; display: flex; align-items: center; gap: 15px; }
            .class-card:hover { transform: translateX(5px); filter: brightness(1.2); }
            .class-card.selected { border-color: #ffd700; background: rgba(212, 175, 55, 0.2); box-shadow: 0 0 15px rgba(212, 175, 55, 0.5); }
            .stat-row { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; border-bottom: 1px dashed #444; padding-bottom: 8px; font-size: 1.05rem; }
            .btn-roleplay { background: linear-gradient(to bottom, #d4af37, #aa8000); border: 2px solid #fff; color: #000; font-weight: bold; padding: 12px; border-radius: 8px; cursor: pointer; font-size: 1.1rem; box-shadow: 0 0 10px rgba(212,175,55,0.5); transition: 0.2s; width: 100%; }
            .btn-roleplay:hover { filter: brightness(1.2); transform: scale(1.02); }
            .btn-add-stat { background: #4caf50; color: #fff; border: 1px solid #fff; width: 28px; height: 28px; border-radius: 5px; font-weight: bold; cursor: pointer; font-size: 1.2rem; display: flex; justify-content: center; align-items: center; }
            .btn-add-stat:hover { background: #00e676; transform: scale(1.1); }
            .btn-add-stat:disabled { background: #555; border-color: #777; cursor: not-allowed; transform: none; color: #888; }
            .equip-grid { display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px; }
            .equip-col { display: flex; flex-direction: column; gap: 12px; }
            .equip-slot { width: 55px; height: 55px; background: rgba(0,0,0,0.8); border: 2px solid #555; border-radius: 8px; display: flex; justify-content: center; align-items: center; font-size: 1.8rem; cursor: pointer; position: relative; transition: 0.2s; box-shadow: inset 0 0 15px #000; }
            .equip-slot:hover { border-color: #ffd700; transform: scale(1.05); }
            .equip-badge { position: absolute; bottom: -8px; background: #222; font-size: 0.65rem; padding: 2px 6px; border-radius: 4px; border: 1px solid #555; color: #ccc; white-space: nowrap; font-weight:bold; }
            .quick-equip-item { display:flex; justify-content:space-between; align-items:center; background:rgba(0,0,0,0.6); border:1px solid #555; padding:10px; border-radius:8px; margin-bottom:8px; text-align:left; transition:0.2s; }
            .quick-equip-item:hover { filter:brightness(1.2); border-color:#fff; }
        `;
        document.head.appendChild(style);
    }

    window.ClassSystem = {
        myId: null, myClass: null,

        init: function() {
            this.myId = localStorage.getItem('pikachu_account_id');
            this.myClass = localStorage.getItem('pikachu_class');
            if (this.myId && !this.myClass) { setTimeout(() => { this.showClassSelection(false); }, 3000); }
        },

        getLevel: function(exp) { return Math.floor(Math.sqrt(exp / 50)) + 1; },

        getCalculatedStats: function() {
            let exp = parseInt(localStorage.getItem('pikachu_exp')) || 0;
            let level = this.getLevel(exp);
            let buildStr = localStorage.getItem('pikachu_stats_build');
            let build = buildStr ? JSON.parse(buildStr) : {};

            let totalPoints = (level - 1) * 10;
            let usedPoints = (build.hp||0) + (build.mp||0) + (build.atk||0) + (build.def||0) + (build.spd||0);
            let freePoints = Math.max(0, totalPoints - usedPoints);

            let equipStr = localStorage.getItem('pikachu_equipment');
            let equips = equipStr ? JSON.parse(equipStr) : {};
            
            let eHp = 0, eMp = 0, eAtk = 0, eDef = 0, eSpd = 0;
            for (let key in equips) {
                let item = equips[key];
                if (item && item.stats) {
                    eHp += parseInt(item.stats.hp) || 0; eMp += parseInt(item.stats.mp) || 0;
                    eAtk += parseInt(item.stats.atk) || 0; eDef += parseInt(item.stats.def) || 0; eSpd += parseFloat(item.stats.spd) || 0;
                }
            }

            let baseHp = 100 + ((build.hp||0) * 10); let baseMp = 100 + ((build.mp||0) * 10);
            let baseAtk = 10 + ((build.atk||0) * 1); let baseDef = 0 + ((build.def||0) * 1);
            let baseSpd = 4.0 + ((build.spd||0) * 0.1);

            return {
                level: level, freePts: freePoints, build: build,
                baseHp: baseHp, baseMp: baseMp, baseAtk: baseAtk, baseDef: baseDef, baseSpd: baseSpd,
                equipHp: eHp, equipMp: eMp, equipAtk: eAtk, equipDef: eDef, equipSpd: eSpd,
                hp: baseHp + eHp, mp: baseMp + eMp, atk: baseAtk + eAtk, def: baseDef + eDef, spd: baseSpd + eSpd
            };
        },

        addStatPoint: function(statName) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            let stats = this.getCalculatedStats();
            if (stats.freePts <= 0) return;

            stats.build[statName] = (stats.build[statName] || 0) + 1;
            localStorage.setItem('pikachu_stats_build', JSON.stringify(stats.build));
            if (window.db) { window.db.ref('users/' + this.myId + '/statsBuild').set(stats.build); }
            this.showStatsPanel(); 
        },

        renderEquipSlot: function(type, label, equips) {
            let item = equips[type];
            let icon = item ? item.icon : '';
            let color = item ? item.rarity : '#555';
            let isEmpty = !item;
            
            // THAY ĐỔI: Bấm ô rỗng -> Hiện danh sách chọn đồ
            let clickAction = isEmpty ? `window.ClassSystem.showEquipSelection('${type}', '${label}')` : `window.ClassSystem.showEquipInfo('${type}')`;
            
            return `
            <div class="equip-slot" style="border-color:${color}" onclick="${clickAction}">
                <div style="font-size: ${isEmpty ? '0.8rem' : '2rem'}; color: #aaa;">${isEmpty ? 'Trống' : icon}</div>
                <div class="equip-badge">${label}</div>
            </div>`;
        },

        // BẢNG CHỌN NHANH TRANG BỊ (MỚI)
        showEquipSelection: function(type, label) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            
            let inv = JSON.parse(localStorage.getItem('pikachu_inventory') || "[]");
            let items = inv.filter(i => i.type === type); // Lọc đồ trong túi

            let itemsHtml = '';
            if (items.length === 0) {
                itemsHtml = `<div style="padding:30px; color:#aaa; text-align:center;">Trong túi đồ hiện không có [${label}] nào.<br>Hãy đi Vạn Giới để săn đồ!</div>`;
            } else {
                items.forEach((item) => {
                    let realIndex = inv.indexOf(item); // Lấy vị trí thật trong rương
                    
                    let sArr = [];
                    if(item.stats.hp) sArr.push(`❤️+${item.stats.hp}`);
                    if(item.stats.mp) sArr.push(`💧+${item.stats.mp}`);
                    if(item.stats.atk) sArr.push(`⚔️+${item.stats.atk}`);
                    if(item.stats.def) sArr.push(`🛡️+${item.stats.def}`);
                    if(item.stats.spd) sArr.push(`⚡+${item.stats.spd}`);

                    itemsHtml += `
                    <div class="quick-equip-item" style="border-left: 4px solid ${item.rarity || '#fff'};">
                        <div style="display:flex; gap:12px; align-items:center;">
                            <div style="font-size:2rem; background:#222; padding:5px; border-radius:8px; border:1px solid #444;">${item.icon}</div>
                            <div>
                                <div style="color:${item.rarity || '#fff'}; font-weight:bold; font-size:1.1rem;">${item.name}</div>
                                <div style="color:#00ffff; font-size:0.85rem; margin-top:2px;">${sArr.join(' ')}</div>
                            </div>
                        </div>
                        <button onclick="ClassSystem.equipItemFromSelection(${realIndex}, '${type}')" style="background:#4caf50; color:#fff; border:2px solid #fff; padding:8px 15px; border-radius:6px; font-weight:bold; cursor:pointer; box-shadow: 0 4px 6px rgba(0,0,0,0.3);">MẶC</button>
                    </div>`;
                });
            }

            let old = document.getElementById('equip-select-overlay'); if (old) old.remove();

            const html = `
            <div id="equip-select-overlay" class="modal-overlay" style="z-index: 999999999; backdrop-filter: blur(2px);" onclick="if(event.target.id==='equip-select-overlay') this.remove();">
                <div class="modal-content" style="max-width: 400px; width: 95%; background: #111; border: 3px solid #d4af37; border-radius: 12px; padding: 20px; text-align: center; max-height: 70vh; overflow-y: auto;">
                    <h3 style="color:#ffd700; margin:0 0 15px 0; border-bottom:1px dashed #555; padding-bottom:10px;">CHỌN [${label.toUpperCase()}]</h3>
                    
                    <div style="margin-bottom: 15px;">${itemsHtml}</div>
                    
                    <button onclick="document.getElementById('equip-select-overlay').remove();" class="btn-roleplay" style="background:#555; color:#fff; border-color:#777; width:100%;">ĐÓNG LẠI</button>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
        },

        // HÀM XỬ LÝ MẶC ĐỒ TỪ BẢNG CHỌN
        equipItemFromSelection: function(invIndex, type) {
            if(window.playSoundInternal) window.playSoundInternal('win');
            let inv = JSON.parse(localStorage.getItem('pikachu_inventory') || "[]");
            let equips = JSON.parse(localStorage.getItem('pikachu_equipment') || "{}");

            // Tách đồ từ túi ra
            let itemToEquip = inv.splice(invIndex, 1)[0];
            if (!itemToEquip) return;

            // Nếu slot đang có đồ, cất vào túi
            let oldEquip = equips[type];
            if (oldEquip) {
                inv.push(oldEquip);
            }

            // Gắn vào slot
            equips[type] = itemToEquip;

            // Lưu dữ liệu
            localStorage.setItem('pikachu_equipment', JSON.stringify(equips));
            localStorage.setItem('pikachu_inventory', JSON.stringify(inv));

            // Xóa bảng chọn và tải lại bảng Chỉ số
            let modal = document.getElementById('equip-select-overlay'); if (modal) modal.remove();
            this.showStatsPanel();
        },

        showEquipInfo: function(type) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            let equips = JSON.parse(localStorage.getItem('pikachu_equipment') || "{}");
            let item = equips[type];
            if (!item) return;

            let sArr = [];
            if(item.stats.hp) sArr.push(`❤️ +${item.stats.hp}`);
            if(item.stats.mp) sArr.push(`💧 +${item.stats.mp}`);
            if(item.stats.atk) sArr.push(`⚔️ +${item.stats.atk}`);
            if(item.stats.def) sArr.push(`🛡️ +${item.stats.def}`);
            if(item.stats.spd) sArr.push(`⚡ +${item.stats.spd}`);

            const html = `
            <div id="equip-info-overlay" class="modal-overlay" style="z-index: 999999999; backdrop-filter: blur(2px);" onclick="if(event.target.id==='equip-info-overlay') this.remove();">
                <div class="modal-content" style="max-width: 320px; background: #111; border: 3px solid ${item.rarity}; border-radius: 10px; padding: 20px; text-align: center;">
                    <div style="font-size:4rem; margin-bottom:10px;">${item.icon}</div>
                    <h3 style="color:${item.rarity}; margin:0 0 5px 0;">${item.name}</h3>
                    <div style="color:#00ffff; font-size:0.95rem; margin-bottom:15px; font-weight:bold;">${sArr.join(' | ')}</div>
                    <div style="display:flex; gap:10px;">
                        <button onclick="document.getElementById('equip-info-overlay').remove();" style="flex:1; background:#555; color:#fff; border:none; padding:10px; border-radius:6px; cursor:pointer;">ĐÓNG</button>
                        <button onclick="ClassSystem.unequipItem('${type}')" style="flex:1; background:#ff5252; color:#fff; border:none; padding:10px; border-radius:6px; cursor:pointer; font-weight:bold;">THÁO RA</button>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
        },

        unequipItem: function(type) {
            if(window.playSoundInternal) window.playSoundInternal('select');
            let equips = JSON.parse(localStorage.getItem('pikachu_equipment') || "{}");
            let inv = JSON.parse(localStorage.getItem('pikachu_inventory') || "[]");
            
            if (equips[type]) {
                inv.push(equips[type]); 
                delete equips[type]; 
                localStorage.setItem('pikachu_equipment', JSON.stringify(equips));
                localStorage.setItem('pikachu_inventory', JSON.stringify(inv));
            }
            
            let modal = document.getElementById('equip-info-overlay'); if (modal) modal.remove();
            this.showStatsPanel(); 
        },

        showClassSelection: function(isChanging = false) {
            if (document.getElementById('class-select-overlay')) return;
            let cardsHtml = '';
            for (let key in CLASS_DATA) {
                let c = CLASS_DATA[key];
                cardsHtml += `<div class="class-card" id="card-${key}" onclick="ClassSystem.selectClassCard('${key}')"><div style="font-size: 2.5rem; text-shadow: 0 0 10px ${c.color};">${c.icon}</div><div><div style="font-size: 1.3rem; font-weight: bold; color: ${c.color}; margin-bottom: 5px;">${c.name}</div><div style="font-size: 0.85rem; color: #ccc;">${c.desc}</div></div></div>`;
            }

            let closeBtnHtml = this.myClass ? `<button onclick="document.getElementById('class-select-overlay').remove();" class="btn-roleplay" style="background:#555; color:#fff; border-color:#777;">ĐÓNG</button>` : '';

            const html = `
            <div id="class-select-overlay" class="modal-overlay" style="z-index: 999999999; backdrop-filter: blur(8px);">
                <div class="modal-content" style="max-width: 500px; width: 95%; background: linear-gradient(135deg, #1f140e 0%, #0a0604 100%); border: 3px solid #d4af37; border-radius: 12px; padding: 20px; text-align: center; max-height: 90vh; overflow-y: auto;">
                    <h2 style="color: #ffd700; margin-bottom: 15px;">CHỌN HỆ PHÁI</h2>
                    <div id="class-cards-container" style="margin-bottom: 20px;">${cardsHtml}</div>
                    <div style="display:flex; gap:10px;">
                        ${closeBtnHtml}
                        <button onclick="ClassSystem.confirmClassSelection(${isChanging})" class="btn-roleplay" id="btn-confirm-class" style="opacity:0.5; pointer-events:none;">XÁC NHẬN</button>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
        },

        selectedClassTemp: null,
        selectClassCard: function(key) {
            this.selectedClassTemp = key;
            document.querySelectorAll('.class-card').forEach(el => el.classList.remove('selected'));
            document.getElementById('card-' + key).classList.add('selected');
            let btn = document.getElementById('btn-confirm-class'); btn.style.opacity = '1'; btn.style.pointerEvents = 'auto';
        },

        confirmClassSelection: function(isChanging) {
            let coins = parseInt(localStorage.getItem('pikachu_coins')) || 0;
            if (isChanging) {
                if (coins < 2000) {
                    if(window.showCustomAlertInternal) window.showCustomAlertInternal("Không đủ 2.000 Linh Thạch để Tẩy Tủy!"); else alert("Không đủ 2.000 Linh Thạch để Tẩy Tủy!");
                    return;
                }
                coins -= 2000; localStorage.setItem('pikachu_coins', coins);
            }

            this.myClass = this.selectedClassTemp;
            localStorage.setItem('pikachu_class', this.myClass);
            
            let db = window.firebase.database(); let updates = { class: this.myClass };
            if (isChanging) updates.coins = coins;
            db.ref('users/' + this.myId).update(updates);

            document.getElementById('class-select-overlay').remove();
            this.showStatsPanel();
        },

        showStatsPanel: function() {
            if(window.playSoundInternal && !document.getElementById('stats-panel-overlay')) window.playSoundInternal('select');
            this.myClass = localStorage.getItem('pikachu_class');
            if (!this.myClass || !CLASS_DATA[this.myClass]) { this.showClassSelection(false); return; }

            let oldStats = document.getElementById('stats-panel-overlay'); if (oldStats) oldStats.remove();
            let oldBag = document.getElementById('bag-panel-overlay'); if (oldBag) oldBag.remove();

            let exp = parseInt(localStorage.getItem('pikachu_exp')) || 0;
            let pName = localStorage.getItem('pikachu_player_name') || "Đại Hiệp";
            let avt = localStorage.getItem('pikachu_player_avatar') || 'https://i.imgur.com/7HnLKEg.png';
            let cData = CLASS_DATA[this.myClass];
            
            let stats = this.getCalculatedStats();
            let btnState = stats.freePts > 0 ? '' : 'disabled';

            let expForCurrentLvl = Math.pow(stats.level - 1, 2) * 50;
            let expForNextLvl = Math.pow(stats.level, 2) * 50;
            let expPercent = Math.min(100, Math.max(0, ((exp - expForCurrentLvl) / (expForNextLvl - expForCurrentLvl)) * 100)).toFixed(1);

            let equipStr = localStorage.getItem('pikachu_equipment');
            let equips = equipStr ? JSON.parse(equipStr) : {};

            const html = `
            <div id="stats-panel-overlay" class="modal-overlay" style="z-index: 99999998; backdrop-filter: blur(5px);" onclick="if(event.target.id==='stats-panel-overlay') this.remove();">
                <div class="modal-content" style="max-width: 450px; width: 95%; background: #1a0f07; border: 4px solid ${cData.color}; border-radius: 12px; padding: 20px; box-shadow: 0 0 30px ${cData.color}; max-height: 90vh; overflow-y: auto;">
                    
                    <div style="display: flex; justify-content: center; gap: 5px; margin-bottom: 15px; border-bottom: 2px solid #555; padding-bottom: 10px;">
                        <div style="padding: 8px 20px; font-weight: bold; border-radius: 8px 8px 0 0; cursor: pointer; border: 2px solid #00e676; border-bottom: none; background: linear-gradient(to bottom, #4caf50, #1b5e20); color: #fff; font-size: 1.1rem;">Bản Thân</div>
                        <div onclick="if(window.BagSystem) window.BagSystem.openBag(); else alert('Thiếu file bag.js');" style="padding: 8px 20px; font-weight: bold; border-radius: 8px 8px 0 0; cursor: pointer; border: 2px solid #555; border-bottom: none; background: #222; color: #aaa; transition: 0.2s; font-size: 1.1rem;">Hành Trang</div>
                    </div>

                    <div style="text-align:center; margin-bottom: 15px;">
                        <h2 style="color:#fff; margin:0;">${pName}</h2>
                        <div style="color:${cData.color}; font-size:1.1rem; margin-top:5px; font-weight:bold;">${cData.icon} ${cData.name} - <span style="color:#ffd700;">Lv.${stats.level}</span></div>
                    </div>

                    <div class="equip-grid">
                        <div class="equip-col">
                            ${this.renderEquipSlot('weapon', 'Vũ Khí', equips)}
                            ${this.renderEquipSlot('head', 'Mũ', equips)}
                            ${this.renderEquipSlot('armor', 'Y Phục', equips)}
                        </div>
                        <div style="position:relative;">
                            <img src="${avt}" style="width:110px; height:110px; border-radius:50%; border:3px solid ${cData.color}; object-fit:cover; background:#000; box-shadow: 0 0 20px ${cData.color};">
                        </div>
                        <div class="equip-col">
                            ${this.renderEquipSlot('boots', 'Hài', equips)}
                            ${this.renderEquipSlot('accessory', 'Trang Sức', equips)}
                            ${this.renderEquipSlot('artifact', 'Pháp Bảo', equips)}
                        </div>
                    </div>

                    <div style="text-align:left; margin-bottom:15px;">
                        <div style="display:flex; justify-content:space-between; font-size:0.9rem; color:#ccc; margin-bottom:5px; font-weight:bold;">
                            <span>✨ Tu Vi</span> <span style="color:#00ffff;">${exp.toLocaleString()} / ${expForNextLvl.toLocaleString()}</span>
                        </div>
                        <div style="width:100%; height:14px; background:#222; border-radius:7px; border:1px solid #555; overflow:hidden; position:relative;">
                            <div style="width:${expPercent}%; height:100%; background:linear-gradient(90deg, #00bfff, #00ff88);"></div>
                        </div>
                    </div>

                    <div style="background:rgba(0,0,0,0.6); border:1px solid #444; border-radius:8px; padding:15px; margin-bottom:20px;">
                        <h4 style="color:#fff; border-bottom:1px solid #555; padding-bottom:8px; margin-bottom:15px; text-align:center;">
                            BẢNG THUỘC TÍNH 
                            <br><span style="color:${stats.freePts > 0 ? '#00e676' : '#888'}; font-size: 0.9rem; font-weight:normal;">(Điểm tự do: ${stats.freePts})</span>
                        </h4>
                        
                        <div class="stat-row">
                            <div style="color:#4caf50;">❤️ HP</div>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div><b style="color:#fff;">${stats.hp.toLocaleString()}</b> <span style="color:#00e676; font-size:0.85rem;">(+${stats.equipHp})</span></div>
                                <button class="btn-add-stat" onclick="ClassSystem.addStatPoint('hp')" ${btnState}>+</button>
                            </div>
                        </div>
                        <div class="stat-row">
                            <div style="color:#00bfff;">💧 MP</div>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div><b style="color:#fff;">${stats.mp.toLocaleString()}</b> <span style="color:#00e676; font-size:0.85rem;">(+${stats.equipMp})</span></div>
                                <button class="btn-add-stat" onclick="ClassSystem.addStatPoint('mp')" ${btnState}>+</button>
                            </div>
                        </div>
                        <div class="stat-row">
                            <div style="color:#ff5252;">⚔️ ATK</div>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div><b style="color:#fff;">${stats.atk.toLocaleString()}</b> <span style="color:#00e676; font-size:0.85rem;">(+${stats.equipAtk})</span></div>
                                <button class="btn-add-stat" onclick="ClassSystem.addStatPoint('atk')" ${btnState}>+</button>
                            </div>
                        </div>
                        <div class="stat-row">
                            <div style="color:#ff9800;">🛡️ DEF</div>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div><b style="color:#fff;">${stats.def.toLocaleString()}</b> <span style="color:#00e676; font-size:0.85rem;">(+${stats.equipDef})</span></div>
                                <button class="btn-add-stat" onclick="ClassSystem.addStatPoint('def')" ${btnState}>+</button>
                            </div>
                        </div>
                        <div class="stat-row" style="border:none; padding-bottom:0;">
                            <div style="color:#e040fb;">⚡ SPD</div>
                            <div style="display:flex; align-items:center; gap:10px;">
                                <div><b style="color:#fff;">${stats.spd.toFixed(1)}</b> <span style="color:#00e676; font-size:0.85rem;">(+${stats.equipSpd.toFixed(1)})</span></div>
                                <button class="btn-add-stat" onclick="ClassSystem.addStatPoint('spd')" ${btnState}>+</button>
                            </div>
                        </div>
                    </div>

                    <div style="display:flex; gap:10px;">
                        <button onclick="ClassSystem.showClassSelection(true)" class="btn-roleplay" style="background:#555; color:#fff; border-color:#777; font-size:0.9rem;">🔄 TẨY TỦY (2K 💎)</button>
                        <button onclick="document.getElementById('stats-panel-overlay').remove();" class="btn-roleplay">ĐÓNG</button>
                    </div>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
        }
    };

    setTimeout(() => { window.ClassSystem.init(); }, 1000);
})();