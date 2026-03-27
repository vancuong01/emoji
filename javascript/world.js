/* ========================================================
 * TÁC GIẢ: BỞI VĂN CƯỜNG (CODE BY VANCUONG)
 * MÔ TẢ: THẾ GIỚI TU TIÊN - MMO (HỆ THỐNG DROP ĐỒ THEO PHÁI & CẤP ĐỘ)
 * ======================================================== */
(function() {
    const MAPS = [
        { id: 'map1', name: 'Rừng Tiên', minLevel: 1, bg: '#1b5e20', enemies: ['🐉', '🌲', '🐍'], hp: 200, atk: 15, coin: [1, 3], exp: [5, 10], speed: 0.6 },
        { id: 'map2', name: 'Núi Lửa', minLevel: 10, bg: '#bf360c', enemies: ['🔥', '🐲', '⚡'], hp: 1000, atk: 80, coin: [3, 8], exp: [15, 25], speed: 0.9 },
        { id: 'map3', name: 'Hồ Băng', minLevel: 20, bg: '#01579b', enemies: ['❄️', '🧊', '🐟'], hp: 4000, atk: 250, coin: [8, 18], exp: [30, 50], speed: 1.2 },
        { id: 'map4', name: 'Thành Cổ', minLevel: 30, bg: '#3e2723', enemies: ['👻', '🏛️', '🗡️'], hp: 15000, atk: 800, coin: [20, 40], exp: [80, 120], speed: 1.6 },
        { id: 'map5', name: 'Thiên Giới', minLevel: 45, bg: '#f57f17', enemies: ['🌟', '☁️', '🐦'], hp: 50000, atk: 2500, coin: [50, 100], exp: [200, 300], speed: 2.2 }
    ];

    if (!document.getElementById('world-system-styles')) {
        let style = document.createElement('style'); style.id = 'world-system-styles';
        style.innerHTML = `
            .world-card { background: rgba(0,0,0,0.6); border: 2px solid #555; padding: 15px; border-radius: 10px; margin-bottom: 12px; display: flex; justify-content: space-between; align-items: center; transition: 0.3s; text-align: left; }
            .world-card:hover { transform: scale(1.02); filter: brightness(1.2); border-color: #00e676; }
            .world-card.locked { opacity: 0.5; filter: grayscale(1); pointer-events: none; }
            .world-canvas-container { width: 100%; display: flex; justify-content: center; align-items: center; margin-top: 10px; position: relative; overflow: hidden; }
            canvas#world-canvas { background-color: #222; border: 4px solid #d4af37; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.8); max-width: 100%; cursor: crosshair; }
            .map-instructions { color: #aaa; font-size: 0.85rem; margin-top: 10px; font-weight: bold; }
            .session-loot-box { display: flex; justify-content: center; gap: 20px; background: #111; border: 2px solid #4caf50; padding: 10px; border-radius: 8px; margin-top: 10px; font-size: 1.2rem; font-weight: bold; }
            .health-hud { position: absolute; top: 15px; left: 15px; background: rgba(0,0,0,0.7); padding: 10px; border-radius: 8px; border: 2px solid #fff; display: flex; flex-direction: column; gap: 8px; pointer-events: none; z-index: 10; width: 180px; }
            .ult-btn-ui { position: absolute; bottom: 20px; right: 20px; width: 70px; height: 70px; border-radius: 50%; font-size: 2rem; background: #555; border: 3px solid #777; color: #fff; cursor: not-allowed; transition: 0.3s; display:flex; justify-content:center; align-items:center; box-shadow: 0 0 10px #000; z-index: 10; padding:0;}
            .ult-btn-ui.ready { background: linear-gradient(135deg, #ff9800, #ff5252); border-color: #fff; cursor: pointer; animation: ultGlow 1s infinite alternate; pointer-events: auto; }
            @keyframes ultGlow { 0% { transform: scale(1); box-shadow: 0 0 10px #ff9800; } 100% { transform: scale(1.1); box-shadow: 0 0 30px #ff5252; } }
            .screen-flash { position: absolute; top:0; left:0; width:100%; height:100%; background:#fff; z-index:9; pointer-events:none; opacity:0; }
            @keyframes screenFlashAnim { 0% { opacity: 1; } 100% { opacity: 0; } }
        `;
        document.head.appendChild(style);
    }

    let alertMsg = window.showCustomAlertInternal || window.alert;

    window.WorldSystem = {
        myId: null, myName: "Đạo Hữu", myAvatar: "", myLevel: 1, myClass: 'kiemtu', 
        myMaxHp: 100, myHp: 100, myAtk: 10, myDef: 0, mySpd: 4,
        myColor: "#00ffff", myTitle: "Phàm Nhân", myFrame: "none",
        sessionCoins: 0, sessionExp: 0,
        
        canvas: null, ctx: null, animFrame: null, keys: {}, targetPos: null, 
        player: { x: 0, y: 0, size: 20, img: new Image() },
        camera: { x: 0, y: 0, width: 640, height: 400 },
        
        otherPlayers: {}, sharedEnemies: {}, items: [], floatingTexts: [], imageCache: {},
        
        currentMap: null, isFighting: false,
        lastHitTime: 0, ultCharge: 0, maxUltCharge: 100, atkBuffTimer: 0, baseAtk: 10, 
        lastDamageTakenTime: 0, lastAutoHealTime: 0,
        syncInterval: null, mapRef: null, playersRef: null, enemiesRef: null,

        getCalculatedStats: function() {
            let exp = parseInt(localStorage.getItem('pikachu_exp')) || 0;
            let level = Math.floor(Math.sqrt(exp / 50)) + 1;
            let buildStr = localStorage.getItem('pikachu_stats_build');
            let build = buildStr ? JSON.parse(buildStr) : {};
            let equipStr = localStorage.getItem('pikachu_equipment');
            let equips = equipStr ? JSON.parse(equipStr) : {};
            
            let eHp = 0, eAtk = 0, eDef = 0, eSpd = 0;
            for (let key in equips) {
                let item = equips[key];
                if (item && item.stats) {
                    eHp += parseInt(item.stats.hp) || 0; eAtk += parseInt(item.stats.atk) || 0;
                    eDef += parseInt(item.stats.def) || 0; eSpd += parseFloat(item.stats.spd) || 0;
                }
            }
            let baseHp = 100 + ((parseInt(build.hp) || 0) * 10); let baseAtk = 10 + ((parseInt(build.atk) || 0) * 1);
            let baseDef = 0 + ((parseInt(build.def) || 0) * 1); let baseSpd = 4.0 + ((parseFloat(build.spd) || 0) * 0.1);

            return { level: level, hp: baseHp + eHp, atk: baseAtk + eAtk, def: baseDef + eDef, spd: baseSpd + eSpd };
        },

        // HÀM TỰ ĐỘNG SINH TRANG BỊ
        generateEquipment: function(pLevel, pClass) {
            // Cấp độ bội số của 5 (Tối đa 100)
            let itemLevel = Math.max(1, Math.min(100, Math.floor(pLevel / 5) * 5));
            if (pLevel < 5) itemLevel = 1;

            const types = ['weapon', 'head', 'armor', 'boots', 'accessory', 'artifact'];
            const type = types[Math.floor(Math.random() * types.length)];

            // Thông số từng phái
            const classThemes = {
                'kiemtu': { pre: 'Kiếm', wp: '🗡️', atkM: 1.5, hpM: 0.8, defM: 0.5 },
                'phaptu': { pre: 'Pháp', wp: '🪄', atkM: 1.8, hpM: 0.6, defM: 0.4 },
                'hophap': { pre: 'Thiết', wp: '🛡️', atkM: 0.7, hpM: 1.5, defM: 1.5 },
                'thetu': { pre: 'Võ', wp: '🥊', atkM: 1.1, hpM: 1.2, defM: 1.0 },
                'phuthuy': { pre: 'Ma', wp: '🔮', atkM: 1.4, hpM: 0.7, defM: 0.6 }
            };
            const theme = classThemes[pClass] || classThemes['kiemtu'];

            const rarities = [
                { name: 'Thường', color: '#ffffff', mult: 1 },
                { name: 'Hảo', color: '#00e676', mult: 1.5 },
                { name: 'Hiếm', color: '#00bfff', mult: 2.5 },
                { name: 'Cực Phẩm', color: '#9c27b0', mult: 4 },
                { name: 'Thần Khí', color: '#ffd700', mult: 8 }
            ];

            let r = Math.random(); let rarity = rarities[0];
            if (r < 0.05) rarity = rarities[4]; // 5% Thần Khí
            else if (r < 0.15) rarity = rarities[3];
            else if (r < 0.35) rarity = rarities[2];
            else if (r < 0.60) rarity = rarities[1];

            // CÔNG THỨC CHỈ SỐ CẤP SỐ NHÂN MẠNH DẦN
            let baseStat = itemLevel * 20 + Math.pow(itemLevel, 1.8);

            let stats = {}; let itemName = ""; let icon = "";
            if (type === 'weapon') {
                stats.atk = Math.floor(baseStat * 0.5 * theme.atkM * rarity.mult);
                itemName = `${theme.pre} Khí [Lv.${itemLevel}]`; icon = theme.wp;
            } else if (type === 'head') {
                stats.hp = Math.floor(baseStat * 2 * theme.hpM * rarity.mult);
                stats.def = Math.floor(baseStat * 0.1 * theme.defM * rarity.mult);
                itemName = `Mũ ${theme.pre} Tu [Lv.${itemLevel}]`; icon = '👒';
            } else if (type === 'armor') {
                stats.hp = Math.floor(baseStat * 4 * theme.hpM * rarity.mult);
                stats.def = Math.floor(baseStat * 0.3 * theme.defM * rarity.mult);
                itemName = `Giáp ${theme.pre} Tu [Lv.${itemLevel}]`; icon = '👘';
            } else if (type === 'boots') {
                stats.spd = +(0.1 + (itemLevel * 0.01) * rarity.mult).toFixed(1);
                stats.hp = Math.floor(baseStat * 1 * theme.hpM * rarity.mult);
                itemName = `Giày ${theme.pre} Tu [Lv.${itemLevel}]`; icon = '🥾';
            } else if (type === 'accessory') {
                stats.mp = Math.floor(baseStat * 3 * rarity.mult);
                stats.atk = Math.floor(baseStat * 0.1 * theme.atkM * rarity.mult);
                itemName = `Nhẫn ${theme.pre} Tu [Lv.${itemLevel}]`; icon = '💍';
            } else if (type === 'artifact') {
                stats.hp = Math.floor(baseStat * 2 * rarity.mult);
                stats.atk = Math.floor(baseStat * 0.2 * rarity.mult);
                stats.def = Math.floor(baseStat * 0.1 * rarity.mult);
                itemName = `Pháp Bảo ${theme.pre} Tu [Lv.${itemLevel}]`; icon = '📜';
            }

            return {
                id: 'item_' + Date.now() + Math.floor(Math.random()*1000),
                type: type, name: itemName, icon: icon, stats: stats,
                rarity: rarity.color, reqLevel: itemLevel,
                desc: `Trang bị ${rarity.name} chế tác riêng cho phái.`
            };
        },

        openLobby: function() {
            this.myId = localStorage.getItem('pikachu_account_id');
            this.myName = localStorage.getItem('pikachu_player_name') || "Đạo Hữu";
            this.myAvatar = localStorage.getItem('pikachu_player_avatar') || 'https://i.imgur.com/7HnLKEg.png';
            this.myClass = localStorage.getItem('pikachu_class') || 'kiemtu'; // Lấy hệ phái để rớt đồ

            if (!this.myId) return window.showCustomAlertInternal("Vui lòng đăng nhập!");
            
            let stats = this.getCalculatedStats();
            this.myLevel = stats.level; 
            this.myMaxHp = parseInt(stats.hp) || 100; this.myHp = this.myMaxHp; 
            this.baseAtk = parseInt(stats.atk) || 10; this.myAtk = this.baseAtk;
            this.myDef = parseInt(stats.def) || 0; 
            this.mySpd = parseFloat(stats.spd) || 4.0;

            let vipPts = parseInt(localStorage.getItem('pikachu_vip_points')) || 0;
            let vipInfo = window.getVipLevelInfo ? window.getVipLevelInfo(vipPts) : { color: '#00ffff', name: 'Phàm Nhân' };
            if (localStorage.getItem('pikachu_is_admin') === 'true') { vipInfo.color = '#ff0000'; vipInfo.name = 'Tiên Nhân'; }
            
            this.myColor = vipInfo.color; this.myTitle = vipInfo.name;
            this.myFrame = localStorage.getItem('pikachu_equipped_frame') || 'none';

            this.renderMapSelection();
        },

        renderMapSelection: function() {
            let old = document.getElementById('world-overlay'); if (old) old.remove();
            let mapListHtml = '';
            MAPS.forEach(m => {
                let isLocked = this.myLevel < m.minLevel;
                let btnHtml = isLocked ? `<button class="g-btn" style="background:#555;" disabled>🔒 Đóng</button>` : `<button onclick="WorldSystem.enterMap('${m.id}')" class="g-btn" style="background:linear-gradient(#4caf50, #2e7d32); padding: 10px 20px;">⚔️ ĐI SĂN</button>`;
                mapListHtml += `
                <div class="world-card ${isLocked ? 'locked' : ''}">
                    <div style="display:flex; align-items:center; gap:15px;">
                        <div style="font-size:2.5rem; filter:drop-shadow(2px 2px 2px #000);">${m.enemies[0]}</div>
                        <div>
                            <div style="color:${m.bg}; font-weight:bold; font-size:1.2rem; text-shadow: 1px 1px 0 #fff;">${m.name}</div>
                            <div style="font-size:0.85rem; color:#ccc;">HP: <b style="color:#4caf50">${m.hp.toLocaleString()}</b> | ATK: <b style="color:#ff5252">${m.atk.toLocaleString()}</b></div>
                        </div>
                    </div>
                    <div>${btnHtml}</div>
                </div>`;
            });

            const html = `
            <div id="world-overlay" class="modal-overlay" style="z-index: 9999999; backdrop-filter: blur(5px);">
                <div class="modal-content" style="max-width: 550px; width: 95%; background: #111; border: 3px solid #00e676; border-radius: 12px; padding: 20px; text-align: center;">
                    <h2 style="color: #00e676;">🌍 BẢN ĐỒ VẠN GIỚI</h2>
                    <div style="display:flex; justify-content:center; flex-wrap:wrap; gap:10px; color:#fff; background:#222; border-radius:8px; padding:10px; margin-bottom:15px; border:1px solid #555;">
                        <span style="color:#4caf50;">❤️ HP: ${this.myMaxHp}</span>
                        <span style="color:#ff5252;">⚔️ ATK: ${this.myAtk}</span>
                        <span style="color:#ff9800;">🛡️ DEF: ${this.myDef}</span>
                        <span style="color:#e040fb;">⚡ SPD: ${this.mySpd.toFixed(1)}</span>
                    </div>
                    <div style="max-height: 45vh; overflow-y: auto; margin-bottom: 20px;">${mapListHtml}</div>
                    <button onclick="document.getElementById('world-overlay').remove();" class="g-btn" style="background:#555; width:100%; padding:12px;">ĐÓNG</button>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);
        },

        enterMap: function(mapId) {
            this.currentMap = MAPS.find(m => m.id === mapId);
            this.isFighting = true; this.myHp = this.myMaxHp; 
            this.sessionCoins = 0; this.sessionExp = 0;
            this.ultCharge = 0; this.atkBuffTimer = 0; this.myAtk = this.baseAtk;
            this.items = []; this.floatingTexts = []; this.otherPlayers = {}; this.sharedEnemies = {};
            this.imageCache = {}; 
            
            this.lastDamageTakenTime = Date.now(); this.lastAutoHealTime = 0;
            this.player.x = 0; this.player.y = 0;
            
            let old = document.getElementById('world-overlay'); if (old) old.remove();

            const html = `
            <div id="canvas-overlay" class="modal-overlay" style="z-index: 9999999; backdrop-filter: blur(8px);">
                <div class="modal-content" style="max-width: 800px; width: 98%; background: #000; border: 4px solid ${this.currentMap.bg}; border-radius: 12px; padding: 20px; text-align: center; box-shadow: 0 0 30px ${this.currentMap.bg}; position:relative;">
                    <h2 style="color: ${this.currentMap.bg}; text-shadow: 1px 1px 0 #fff; margin-bottom: 5px; text-transform: uppercase;">🏕️ ${this.currentMap.name} (MMO)</h2>
                    <div class="session-loot-box">
                        <span style="color:#00ffff;">Túi đồ:</span>
                        <span style="color:#00e676;">💎 <span id="map-loot-coin">0</span></span>
                        <span style="color:#ffeb3b;">✨ <span id="map-loot-exp">0</span></span>
                    </div>
                    <div class="world-canvas-container">
                        <div class="health-hud">
                            <div style="display:flex; align-items:center; gap:5px; width:100%;">
                                <span>❤️</span>
                                <div style="flex:1; height: 12px; background: #333; border-radius: 6px; border: 1px solid #000;"><div id="hud-hp-bar" style="width: 100%; height: 100%; background: #4caf50;"></div></div>
                            </div>
                            <div id="hud-hp-txt" style="color:#fff; font-size:0.85rem; text-align:center;">${this.myHp}/${this.myMaxHp}</div>
                            <div style="display:flex; align-items:center; gap:5px; width:100%; margin-top:2px;">
                                <span>⚡</span>
                                <div style="flex:1; height: 8px; background: #333; border-radius: 4px; border: 1px solid #000;"><div id="hud-ult-bar" style="width: 0%; height: 100%; background: #ff9800;"></div></div>
                            </div>
                        </div>
                        <div id="flash-fx" class="screen-flash"></div>
                        <canvas id="world-canvas" width="640" height="400"></canvas>
                        <button id="btn-world-ult" class="ult-btn-ui" onclick="WorldSystem.castUltimate()">🔥</button>
                    </div>
                    <button onclick="WorldSystem.leaveMap(true)" class="g-btn" style="background:#2196f3; width:100%; padding:12px; margin-top:15px;">RÚT LUI AN TOÀN & NHẬN LỘC</button>
                </div>
            </div>`;
            document.body.insertAdjacentHTML('beforeend', html);

            this.initCanvas();
            this.connectFirebase(mapId);
        },

        connectFirebase: function(mapId) {
            if (!window.db) return;
            this.mapRef = window.db.ref('mmo_maps/' + mapId);
            this.playersRef = this.mapRef.child('players');
            this.enemiesRef = this.mapRef.child('enemies');

            let myRef = this.playersRef.child(this.myId);
            myRef.onDisconnect().remove();
            
            this.playersRef.on('value', snap => {
                if (snap.exists()) {
                    let players = snap.val(); delete players[this.myId];
                    this.otherPlayers = players;
                } else { this.otherPlayers = {}; }
            });

            this.enemiesRef.on('value', snap => {
                if (snap.exists()) {
                    let data = snap.val();
                    for (let eid in data) {
                        if (!this.sharedEnemies[eid]) {
                            this.sharedEnemies[eid] = data[eid];
                        } else {
                            this.sharedEnemies[eid].originX = data[eid].originX;
                            this.sharedEnemies[eid].originY = data[eid].originY;
                            if (data[eid].hp <= this.sharedEnemies[eid].hp || this.sharedEnemies[eid].hp <= 0) {
                                this.sharedEnemies[eid].hp = data[eid].hp;
                            }
                        }
                    }
                    for (let eid in this.sharedEnemies) { if (!data[eid]) delete this.sharedEnemies[eid]; }
                } else { this.sharedEnemies = {}; }
            });

            this.syncInterval = setInterval(() => {
                if (!this.isFighting) return;
                myRef.set({ 
                    name: this.myName, avatar: this.myAvatar, 
                    color: this.myColor, title: this.myTitle, frame: this.myFrame,
                    x: Math.round(this.player.x), y: Math.round(this.player.y), 
                    hp: this.myHp || 0, maxHp: this.myMaxHp || 100 
                });
                this.checkAndSpawnEnemies();
            }, 200);
        },

        checkAndSpawnEnemies: function() {
            let nearbyEnemies = 0;
            for (let eid in this.sharedEnemies) {
                if (Math.hypot(this.sharedEnemies[eid].x - this.player.x, this.sharedEnemies[eid].y - this.player.y) < 1000) nearbyEnemies++;
            }

            if (nearbyEnemies < 5 && Math.random() < 0.3) {
                let emoji = this.currentMap.enemies[Math.floor(Math.random() * this.currentMap.enemies.length)];
                let spawnX = this.player.x + (Math.random() > 0.5 ? 1 : -1) * (200 + Math.random() * 200);
                let spawnY = this.player.y + (Math.random() > 0.5 ? 1 : -1) * (150 + Math.random() * 150);

                if (this.enemiesRef) {
                    this.enemiesRef.push({ 
                        emoji: emoji, x: Math.round(spawnX), y: Math.round(spawnY), 
                        originX: Math.round(spawnX), originY: Math.round(spawnY),
                        hp: this.currentMap.hp, maxHp: this.currentMap.hp, 
                        atk: this.currentMap.atk, speed: this.currentMap.speed
                    });
                }
            }
        },

        initCanvas: function() {
            this.canvas = document.getElementById('world-canvas');
            this.ctx = this.canvas.getContext('2d');
            
            this.imageCache[this.myAvatar] = new Image();
            this.imageCache[this.myAvatar].src = this.myAvatar;
            
            this.targetPos = null;

            this.keys = {};
            this.handleKeyDown = (e) => { this.keys[e.key] = true; this.targetPos = null; if (e.code === 'Space') { e.preventDefault(); this.castUltimate(); } };
            this.handleKeyUp = (e) => { this.keys[e.key] = false; };
            window.addEventListener('keydown', this.handleKeyDown); window.addEventListener('keyup', this.handleKeyUp);

            this.handlePointer = (e) => {
                if(e.target.id === 'btn-world-ult') return;
                let rect = this.canvas.getBoundingClientRect();
                let clientX = e.clientX || (e.touches && e.touches[0].clientX);
                let clientY = e.clientY || (e.touches && e.touches[0].clientY);
                if(clientX !== undefined) {
                    let screenX = (clientX - rect.left) * (this.canvas.width / rect.width);
                    let screenY = (clientY - rect.top) * (this.canvas.height / rect.height);
                    this.targetPos = { x: screenX + this.camera.x, y: screenY + this.camera.y };
                }
            };
            this.canvas.addEventListener('pointerdown', this.handlePointer);
            this.canvas.addEventListener('touchmove', (e) => { e.preventDefault(); this.handlePointer(e); }, {passive: false});

            this.animFrame = requestAnimationFrame(() => this.gameLoop());
        },

        gameLoop: function() {
            if (!this.isFighting) return;
            this.animFrame = requestAnimationFrame(() => this.gameLoop());
            try { this.update(); this.draw(); } catch (err) { console.warn("Lỗi GameLoop:", err); }
        },

        addFloatText: function(text, x, y, color, scale = 1) {
            this.floatingTexts.push({ text: text, x: x, y: y, color: color, scale: scale, life: 40 });
        },

        update: function() {
            if (this.atkBuffTimer > 0) {
                this.atkBuffTimer--;
                if (this.atkBuffTimer === 0) { this.myAtk = this.baseAtk; this.addFloatText("HẾT NỘ LỰC!", this.player.x, this.player.y - 30, '#aaa', 1); }
            }

            let speed = Number(this.mySpd) || 4;
            if (this.targetPos) {
                let dx = this.targetPos.x - this.player.x; let dy = this.targetPos.y - this.player.y;
                let dist = Math.hypot(dx, dy);
                if (dist > speed) { this.player.x += (dx / dist) * speed; this.player.y += (dy / dist) * speed; } else { this.targetPos = null; }
            } else {
                if (this.keys['ArrowUp'] || this.keys['w'] || this.keys['W']) this.player.y -= speed;
                if (this.keys['ArrowDown'] || this.keys['s'] || this.keys['S']) this.player.y += speed;
                if (this.keys['ArrowLeft'] || this.keys['a'] || this.keys['A']) this.player.x -= speed;
                if (this.keys['ArrowRight'] || this.keys['d'] || this.keys['D']) this.player.x += speed;
            }

            this.camera.x = this.player.x - this.canvas.width / 2;
            this.camera.y = this.player.y - this.canvas.height / 2;

            // NHẶT ĐỒ TRÊN MẶT ĐẤT CHẠM VÀO LÀ LỤM
            for (let i = 0; i < this.items.length; i++) {
                let it = this.items[i]; it.life--;
                if (it.life <= 0) { this.items.splice(i, 1); i--; continue; }

                if (Math.hypot(this.player.x - it.x, this.player.y - it.y) < this.player.size + 25) {
                    
                    if (it.type === 'equip') {
                        // Nhặt Rương Đồ
                        let inv = JSON.parse(localStorage.getItem('pikachu_inventory') || "[]");
                        if (inv.length < 50) { // Giới hạn 50 ô
                            let newItem = this.generateEquipment(this.myLevel, this.myClass);
                            inv.push(newItem);
                            localStorage.setItem('pikachu_inventory', JSON.stringify(inv));
                            this.addFloatText(`Nhận: ${newItem.name}`, this.player.x, this.player.y - 40, newItem.rarity, 1.2);
                        } else {
                            this.addFloatText("Túi đầy!", this.player.x, this.player.y - 40, '#ff5252', 1.2);
                        }
                    } else if (it.type === 'heal') {
                        let heal = Math.floor(this.myMaxHp * 0.2); this.myHp = Math.min(this.myMaxHp, this.myHp + heal);
                        this.addFloatText(`+${heal} HP`, this.player.x, this.player.y, '#00e676', 1.2);
                        this.updateHUD();
                    } else if (it.type === 'buff') {
                        this.myAtk = this.baseAtk * 2; this.atkBuffTimer = 400; 
                        this.addFloatText("ATK x2!", this.player.x, this.player.y, '#ff5252', 1.2);
                    }
                    
                    if(window.playSoundInternal) window.playSoundInternal('select');
                    this.items.splice(i, 1); i--;
                }
            }

            let now = Date.now();
            if (this.myHp < this.myMaxHp && (now - this.lastDamageTakenTime > 4000)) {
                if (now - this.lastAutoHealTime > 1000) {
                    let healAmt = Math.max(1, Math.floor(this.myMaxHp * 0.05));
                    this.myHp = Math.min(this.myMaxHp, this.myHp + healAmt);
                    this.addFloatText(`+${healAmt}`, this.player.x, this.player.y - 20, '#00e676', 0.9);
                    this.updateHUD();
                    this.lastAutoHealTime = now;
                }
            }

            for (let eid in this.sharedEnemies) {
                let e = this.sharedEnemies[eid];
                if (!e || e.hp <= 0) continue; 
                
                let distToPlayer = Math.hypot(this.player.x - e.x, this.player.y - e.y);

                if (distToPlayer < 300) {
                    let angle = Math.atan2(this.player.y - e.y, this.player.x - e.x);
                    e.x += Math.cos(angle) * (e.speed || this.currentMap.speed); 
                    e.y += Math.sin(angle) * (e.speed || this.currentMap.speed);
                }

                if (distToPlayer < 60) { 
                    if (!e.lastAttackTime) e.lastAttackTime = 0;
                    if (now - e.lastAttackTime > 1000) {
                        let safeEnemyAtk = Number(e.atk) || this.currentMap.atk || 10;
                        let damageTaken = Math.max(1, safeEnemyAtk - (Number(this.myDef) || 0));

                        this.myHp -= damageTaken;
                        this.lastDamageTakenTime = now;

                        if(window.playSoundInternal) window.playSoundInternal('error');
                        let pAngle = Math.atan2(e.y - this.player.y, e.x - this.player.x);
                        this.player.x -= Math.cos(pAngle) * 15; this.player.y -= Math.sin(pAngle) * 15;
                        
                        this.addFloatText(`-${damageTaken}`, this.player.x, this.player.y - 30, '#ff5252', 1.5); 
                        this.updateHUD(); 
                        
                        e.lastAttackTime = now;
                        if (this.myHp <= 0) { this.die(); return; } 
                    }

                    if (!e.lastHitTime) e.lastHitTime = 0;
                    if (now - e.lastHitTime > 400) {
                        let safeMyAtk = Number(this.myAtk) || 10;
                        e.hp -= safeMyAtk;
                        
                        if(window.playSoundInternal) window.playSoundInternal('match');
                        this.addFloatText("💥", e.x, e.y, '#fff', 1.5); 
                        this.addFloatText(`-${safeMyAtk}`, e.x, e.y - 25, (this.atkBuffTimer > 0 ? '#ffeb3b' : '#fff'), 1.2); 
                        this.addUltCharge(2); 

                        let eAngle = Math.atan2(e.y - this.player.y, e.x - this.player.x);
                        e.x += Math.cos(eAngle) * 15; e.y += Math.sin(eAngle) * 15;

                        e.lastHitTime = now;

                        if (e.hp <= 0) {
                            this.killEnemy(e, eid); 
                        } else {
                            if(this.enemiesRef) this.enemiesRef.child(eid).update({ hp: e.hp });
                        }
                    }
                }
            }

            for (let i = 0; i < this.floatingTexts.length; i++) {
                let t = this.floatingTexts[i]; t.y -= 1.5; t.life--;
                if (t.life <= 0) { this.floatingTexts.splice(i, 1); i--; }
            }
        },

        addUltCharge: function(amt) {
            this.ultCharge = Math.min(this.maxUltCharge, this.ultCharge + amt);
            this.updateHUD();
        },

        castUltimate: function() {
            if (this.ultCharge < this.maxUltCharge || !this.isFighting) return;
            this.ultCharge = 0; this.updateHUD();

            let flash = document.getElementById('flash-fx');
            if (flash) { flash.style.animation = 'none'; flash.offsetHeight; flash.style.animation = 'screenFlashAnim 0.5s ease-out'; }
            if (window.playSoundInternal) window.playSoundInternal('win');
            
            this.addFloatText("TUYỆT KỸ TRẤN PHÁI!!!", this.player.x, this.player.y - 50, '#ffeb3b', 2.5);

            let safeMyAtk = Number(this.myAtk) || 10;
            let ultDmg = safeMyAtk * 10;
            
            for (let eid in this.sharedEnemies) {
                let e = this.sharedEnemies[eid];
                if (e.hp > 0 && e.x > this.camera.x && e.x < this.camera.x + this.canvas.width && e.y > this.camera.y && e.y < this.camera.y + this.canvas.height) {
                    e.hp -= ultDmg;
                    this.addFloatText(`-${ultDmg}`, e.x, e.y, '#ff9800', 1.8);
                    if (e.hp <= 0) { this.killEnemy(e, eid); }
                    else { if(this.enemiesRef) this.enemiesRef.child(eid).update({ hp: e.hp }); }
                }
            }
        },

        killEnemy: function(e, eid) {
            if(this.enemiesRef) this.enemiesRef.child(eid).remove();
            delete this.sharedEnemies[eid];

            let cDrop = Math.floor(Math.random() * (this.currentMap.coin[1] - this.currentMap.coin[0] + 1)) + this.currentMap.coin[0];
            let eDrop = Math.floor(Math.random() * (this.currentMap.exp[1] - this.currentMap.exp[0] + 1)) + this.currentMap.exp[0];

            this.sessionCoins += cDrop;
            this.sessionExp += eDrop;
            document.getElementById('map-loot-coin').innerText = this.sessionCoins.toLocaleString('vi-VN');
            document.getElementById('map-loot-exp').innerText = this.sessionExp.toLocaleString('vi-VN');

            this.addFloatText(`+${cDrop}💎`, e.x, e.y, '#00ffff', 1.5);
            this.addFloatText(`+${eDrop}✨`, e.x, e.y - 20, '#ffeb3b', 1.5);
            this.addUltCharge(5);
            
            // Tỷ lệ rớt Đồ Cực Phẩm (20%) hoặc máu/thuốc (30%)
            let rand = Math.random();
            if (rand < 0.20) {
                this.items.push({ x: e.x, y: e.y, type: 'equip', icon: '🎁', life: 1200 }); // Rớt rương trang bị
            } else if (rand < 0.35) {
                this.items.push({ x: e.x, y: e.y, type: 'heal', icon: '💊', life: 600 });
            } else if (rand < 0.50) {
                this.items.push({ x: e.x, y: e.y, type: 'buff', icon: '⚔️', life: 600 });
            }
        },

        die: function() {
            this.isFighting = false;
            cancelAnimationFrame(this.animFrame);
            window.removeEventListener('keydown', this.handleKeyDown); window.removeEventListener('keyup', this.handleKeyUp);
            if (this.syncInterval) clearInterval(this.syncInterval);
            if(window.playSoundInternal) window.playSoundInternal('lose');

            window.showCustomAlertInternal(`💀 ĐẠI HIỆP ĐẠI BẠI!\nYêu thú cắn quá đau. Rớt mất ${this.sessionCoins} 💎 và ${this.sessionExp} ✨`);
            
            try { if (this.playersRef) this.playersRef.child(this.myId).remove(); } catch(e){}
            let overlay = document.getElementById('canvas-overlay'); if (overlay) overlay.remove();
            this.openLobby();
        },

        updateHUD: function() {
            let hpBar = document.getElementById('hud-hp-bar'); let hpTxt = document.getElementById('hud-hp-txt');
            if(hpBar && hpTxt) {
                let perc = Math.max(0, (this.myHp / this.myMaxHp) * 100);
                if (isNaN(perc)) perc = 0;
                hpBar.style.width = `${perc}%`; hpTxt.innerText = `${Math.floor(this.myHp)}/${this.myMaxHp}`;
                if (perc < 30) hpBar.style.background = 'linear-gradient(90deg, #b71c1c, #ff5252)'; else hpBar.style.background = 'linear-gradient(90deg, #b71c1c, #4caf50)';
            }

            let ultBar = document.getElementById('hud-ult-bar'); let ultBtn = document.getElementById('btn-world-ult');
            if(ultBar && ultBtn) {
                let uPerc = Math.max(0, (this.ultCharge / this.maxUltCharge) * 100);
                ultBar.style.width = `${uPerc}%`;
                if (this.ultCharge >= this.maxUltCharge) ultBtn.classList.add('ready'); else ultBtn.classList.remove('ready');
            }
        },

        draw: function() {
            this.ctx.fillStyle = this.currentMap.bg;
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            this.ctx.strokeStyle = "rgba(255,255,255,0.05)"; this.ctx.lineWidth = 1;
            
            let offsetX = -(this.camera.x % 40); let offsetY = -(this.camera.y % 40);
            for (let i=offsetX; i<this.canvas.width; i+=40) { this.ctx.beginPath(); this.ctx.moveTo(i,0); this.ctx.lineTo(i,this.canvas.height); this.ctx.stroke(); }
            for (let i=offsetY; i<this.canvas.height; i+=40) { this.ctx.beginPath(); this.ctx.moveTo(0,i); this.ctx.lineTo(this.canvas.width, i); this.ctx.stroke(); }

            this.ctx.save();
            try {
                this.ctx.translate(-this.camera.x, -this.camera.y);
                this.ctx.textAlign = "center"; this.ctx.textBaseline = "middle";
                
                // Vẽ Vật phẩm rơi
                this.items.forEach(it => {
                    if (it.life < 100 && Math.floor(Date.now() / 100) % 2 === 0) return;
                    let bob = Math.sin(Date.now() / 200) * 5; 
                    this.ctx.beginPath(); this.ctx.arc(it.x, it.y + bob, 18, 0, Math.PI * 2);
                    
                    // Hiệu ứng màu cho rương đồ
                    if (it.type === 'equip') this.ctx.fillStyle = 'rgba(255, 215, 0, 0.6)';
                    else if (it.type === 'heal') this.ctx.fillStyle = 'rgba(0, 255, 0, 0.4)';
                    else this.ctx.fillStyle = 'rgba(255, 0, 0, 0.4)';
                    
                    this.ctx.fill();
                    this.ctx.font = "25px Arial"; this.ctx.fillText(it.icon, it.x, it.y + bob);
                });

                // Vẽ Quái
                for (let eid in this.sharedEnemies) {
                    let e = this.sharedEnemies[eid];
                    if (!e || typeof e.x === 'undefined' || e.hp <= 0) continue;
                    
                    if (Date.now() - (e.lastHitTime||0) < 100) this.ctx.filter = 'brightness(2) sepia(1) hue-rotate(-50deg)';
                    this.ctx.font = "35px Arial"; this.ctx.fillText(e.emoji, e.x, e.y); this.ctx.filter = 'none';

                    let hpPerc = Math.max(0, e.hp / (e.maxHp || this.currentMap.hp));
                    this.ctx.fillStyle = "#000"; this.ctx.fillRect(e.x - 20, e.y - 30, 40, 6);
                    this.ctx.fillStyle = hpPerc > 0.5 ? "#4caf50" : (hpPerc > 0.2 ? "#ff9800" : "#f44336");
                    this.ctx.fillRect(e.x - 20, e.y - 30, 40 * hpPerc, 6);
                    this.ctx.strokeStyle = "#fff"; this.ctx.lineWidth = 1; this.ctx.strokeRect(e.x - 20, e.y - 30, 40, 6);
                }

                // VẼ NGƯỜI CHƠI KHÁC
                for (let uid in this.otherPlayers) {
                    let op = this.otherPlayers[uid];
                    if (!op || typeof op.x === 'undefined') continue;
                    
                    let opColor = op.color || "#00ffff";
                    
                    this.ctx.font = "bold 12px Arial"; this.ctx.fillStyle = opColor; 
                    this.ctx.fillText(op.name || "Ẩn Danh", op.x, op.y - 48);
                    this.ctx.font = "10px Arial"; this.ctx.fillStyle = "#aaa"; 
                    this.ctx.fillText(`[${op.title || "Phàm Nhân"}]`, op.x, op.y - 36);
                    
                    let opHpPerc = Math.max(0, op.hp / op.maxHp);
                    this.ctx.fillStyle = "#000"; this.ctx.fillRect(op.x - 15, op.y - 25, 30, 4);
                    this.ctx.fillStyle = "#ffeb3b"; this.ctx.fillRect(op.x - 15, op.y - 25, 30 * opHpPerc, 4);

                    if (op.avatar) {
                        if (!this.imageCache[op.avatar]) { this.imageCache[op.avatar] = new Image(); this.imageCache[op.avatar].src = op.avatar; }
                        let img = this.imageCache[op.avatar];
                        if (img.complete) {
                            this.ctx.save(); this.ctx.beginPath(); this.ctx.arc(op.x, op.y, 20, 0, Math.PI * 2); this.ctx.closePath(); this.ctx.clip();
                            this.ctx.drawImage(img, op.x - 20, op.y - 20, 40, 40);
                            this.ctx.restore();
                        }
                    }
                    this.ctx.beginPath(); this.ctx.arc(op.x, op.y, 20, 0, Math.PI * 2); this.ctx.strokeStyle = opColor; this.ctx.lineWidth = 2; this.ctx.stroke();

                    if (op.frame && op.frame !== 'none') {
                        if (!this.imageCache[op.frame]) { this.imageCache[op.frame] = new Image(); this.imageCache[op.frame].src = op.frame; }
                        let frmImg = this.imageCache[op.frame];
                        if (frmImg.complete) {
                            this.ctx.drawImage(frmImg, op.x - 28, op.y - 28, 56, 56);
                        }
                    }
                }

                // VẼ BẢN THÂN
                this.ctx.font = "bold 12px Arial"; this.ctx.fillStyle = this.myColor; 
                this.ctx.fillText(this.myName, this.player.x, this.player.y - 48);
                this.ctx.font = "10px Arial"; this.ctx.fillStyle = "#aaa"; 
                this.ctx.fillText(`[${this.myTitle}]`, this.player.x, this.player.y - 36);

                this.ctx.save();
                if (this.atkBuffTimer > 0) {
                    this.ctx.beginPath(); this.ctx.arc(this.player.x, this.player.y, this.player.size + 10, 0, Math.PI * 2);
                    this.ctx.fillStyle = "rgba(255, 82, 82, 0.4)"; this.ctx.fill();
                }
                this.ctx.beginPath(); this.ctx.arc(this.player.x, this.player.y, this.player.size, 0, Math.PI * 2);
                this.ctx.closePath(); this.ctx.clip();
                let myImg = this.imageCache[this.myAvatar];
                if (myImg && myImg.complete) {
                    this.ctx.drawImage(myImg, this.player.x - this.player.size, this.player.y - this.player.size, this.player.size*2, this.player.size*2);
                }
                this.ctx.restore();
                
                this.ctx.beginPath(); this.ctx.arc(this.player.x, this.player.y, this.player.size, 0, Math.PI * 2);
                this.ctx.strokeStyle = this.myColor; this.ctx.lineWidth = 3; this.ctx.stroke();

                if (this.myFrame && this.myFrame !== 'none') {
                    if (!this.imageCache[this.myFrame]) { this.imageCache[this.myFrame] = new Image(); this.imageCache[this.myFrame].src = this.myFrame; }
                    let myFrmImg = this.imageCache[this.myFrame];
                    if (myFrmImg.complete) {
                        this.ctx.drawImage(myFrmImg, this.player.x - 28, this.player.y - 28, 56, 56);
                    }
                }

                this.floatingTexts.forEach(t => {
                    this.ctx.font = `bold ${16 * t.scale}px Arial`; this.ctx.fillStyle = t.color;
                    this.ctx.globalAlpha = t.life / 40; this.ctx.shadowColor = "#000"; this.ctx.shadowBlur = 4;
                    this.ctx.fillText(t.text, t.x, t.y); this.ctx.globalAlpha = 1.0; this.ctx.shadowBlur = 0;
                });
            } finally {
                this.ctx.restore(); 
            }
        },

        leaveMap: function(safeLeave = false) {
            this.isFighting = false;
            window.removeEventListener('keydown', this.handleKeyDown); window.removeEventListener('keyup', this.handleKeyUp);
            if (this.canvas) this.canvas.removeEventListener('pointerdown', this.handlePointer);
            cancelAnimationFrame(this.animFrame);

            if (this.syncInterval) clearInterval(this.syncInterval);
            try {
                if (this.playersRef) { this.playersRef.child(this.myId).remove(); this.playersRef.off(); }
                if (this.enemiesRef) this.enemiesRef.off();
            } catch(e){}

            if (safeLeave && (this.sessionCoins > 0 || this.sessionExp > 0)) {
                let currentCoins = parseInt(localStorage.getItem('pikachu_coins')) || 0;
                let currentExp = parseInt(localStorage.getItem('pikachu_exp')) || 0;
                
                try { if (window.db) window.db.ref('users/' + this.myId).update({ coins: currentCoins + this.sessionCoins, exp: currentExp + this.sessionExp }); } catch(e){}
                localStorage.setItem('pikachu_coins', currentCoins + this.sessionCoins); localStorage.setItem('pikachu_exp', currentExp + this.sessionExp);
                
                window.showCustomAlertInternal(`Đại hiệp rút lui an toàn!\nMang về:\n💎 ${this.sessionCoins} Linh Thạch\n✨ ${this.sessionExp} Tu Vi`);
            }

            let overlay = document.getElementById('canvas-overlay'); if (overlay) overlay.remove();
            this.openLobby();
        }
    };
})();