(function() {
    const DIFF_CONFIG = { easy: { timeMultiplier: 1.0, emojiCount: 15, tickRate: 1000 }, medium: { timeMultiplier: 0.75, emojiCount: 22, tickRate: 1000 }, hard: { timeMultiplier: 0.5, emojiCount: 30, tickRate: 850 } };
    const CONFIG = { ROWS: 9, COLS: 16, EMOJIS: ['🐶','🐱','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🐒','🐔','🐧','🐦','🐤','🦆','🦅','🦉','🦇','🐺','🐗','🦄','🐝','🐛','🦋','🐌'], POINTS_PER_MATCH: 10, INITIAL_SHUFFLES: 5, INITIAL_HINTS: 5 };
    const LEVELS = [ { level: 1, time: 600, gravity: 'none' }, { level: 2, time: 560, gravity: 'down' }, { level: 3, time: 520, gravity: 'left' }, { level: 4, time: 480, gravity: 'up' }, { level: 5, time: 440, gravity: 'right' }, { level: 6, time: 400, gravity: 'center' }, { level: 7, time: 380, gravity: 'split_h' }, { level: 8, time: 360, gravity: 'split_v' }, { level: 9, time: 340, gravity: 'alt_v' }, { level: 10, time: 320, gravity: 'alt_h' } ];

    let gameState = window.gameStateGlobal || { isMuted: false };
    Object.assign(gameState, { board: [], selectedTile: null, score: 0, level: 1, timeRemaining: 0, shufflesRemaining: CONFIG.INITIAL_SHUFFLES, hintsRemaining: CONFIG.INITIAL_HINTS, timerInterval: null, playerName: "", accountId: "", isVip: false, isProcessing: false, hintTimeoutId: null, currentDifficulty: 'easy' });
    window.gameStateGlobal = gameState;
    
    let highScore = 0; let audioCtx = null;

    window.playSoundInternal = function playSound(type) {
        if (gameState.isMuted) return;
        try {
            const AudioContext = window.AudioContext || window.webkitAudioContext; if (!AudioContext) return; 
            if (!audioCtx) audioCtx = new AudioContext(); if (audioCtx.state === 'suspended') audioCtx.resume().catch(() => {});
            const osc = audioCtx.createOscillator(); const gain = audioCtx.createGain();
            osc.connect(gain); gain.connect(audioCtx.destination); const now = audioCtx.currentTime;
            
            if (type === 'select') { osc.type = 'sine'; osc.frequency.setValueAtTime(800, now); gain.gain.setValueAtTime(0.1, now); gain.gain.exponentialRampToValueAtTime(0.01, now + 0.1); osc.start(now); osc.stop(now + 0.1); } 
            else if (type === 'match') { osc.type = 'square'; osc.frequency.setValueAtTime(400, now); osc.frequency.setValueAtTime(800, now + 0.1); gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now + 0.2); osc.start(now); osc.stop(now + 0.2); } 
            else if (type === 'error') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(200, now); osc.frequency.linearRampToValueAtTime(150, now + 0.2); gain.gain.setValueAtTime(0.05, now); gain.gain.linearRampToValueAtTime(0, now + 0.2); osc.start(now); osc.stop(now + 0.2); } 
            else if (type === 'win') { osc.type = 'square'; osc.frequency.setValueAtTime(400, now); osc.frequency.setValueAtTime(500, now + 0.1); osc.frequency.setValueAtTime(600, now + 0.2); osc.frequency.setValueAtTime(800, now + 0.3); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.5); osc.start(now); osc.stop(now + 0.5); } 
            else if (type === 'lose') { osc.type = 'sawtooth'; osc.frequency.setValueAtTime(300, now); osc.frequency.linearRampToValueAtTime(100, now + 0.5); gain.gain.setValueAtTime(0.1, now); gain.gain.linearRampToValueAtTime(0, now + 0.5); osc.start(now); osc.stop(now + 0.5); }
            setTimeout(() => { try { osc.disconnect(); gain.disconnect(); } catch(e){} }, 1000);
        } catch(err) {}
    };

    function createPauseUI() {
        if (document.getElementById('pause-overlay')) return;
        const pauseHTML = `<div id="pause-overlay" class="modal-overlay hidden" style="z-index: 999998; backdrop-filter: blur(8px);"><div class="modal-content" style="max-width: 400px; border: 3px solid #ffeb3b; box-shadow: 0 0 25px rgba(255, 235, 59, 0.6); padding: 30px; text-align: center;"><div style="font-size: 4rem; margin-bottom: 10px; animation: hint-pulse 2s infinite;">⏸️</div><h2 style="color: #ffeb3b; margin-bottom: 15px; text-shadow: 0 0 10px #ffeb3b; font-size: 1.8rem;">ĐÃ TẠM DỪNG</h2><p style="font-size: 1.1rem; margin-bottom: 25px; color: #fff;">Trò chơi đang chờ bạn quay lại!</p><button id="resume-btn" style="background: linear-gradient(to bottom, #ffeb3b, #cddc39); border: 2px solid #fff; color: #000; font-weight: bold; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 1.2rem; width: 100%; box-shadow: 0 0 10px rgba(255,235,59,0.5); margin-bottom: 15px;">TIẾP TỤC CHƠI</button><button id="quit-game-btn" style="background: linear-gradient(to bottom, #f44336, #b71c1c); border: 2px solid #fff; color: #fff; font-weight: bold; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 1.2rem; width: 100%; box-shadow: 0 0 10px rgba(244,67,54,0.5);">🚪 THOÁT VÀ LƯU ĐIỂM</button></div></div>`;
        document.body.insertAdjacentHTML('beforeend', pauseHTML);
    }

    function pauseGame() { 
        let diffModal = document.getElementById('difficulty-modal'); 
        let customAlert = document.getElementById('global-alert-overlay'); 
        let leaderboardModal = document.getElementById('leaderboard-overlay'); 
        let mainMenu = document.getElementById('main-menu-overlay'); 
        let authOverlay = document.getElementById('auth-overlay'); 
        let nameOverlay = document.getElementById('char-name-overlay'); 
        let shopOverlay = document.getElementById('shop-overlay'); 
        let wealthOverlay = document.getElementById('wealth-overlay'); 
        
        if ((diffModal && !diffModal.classList.contains('hidden')) || (customAlert && !customAlert.classList.contains('hidden')) || (mainMenu && !mainMenu.classList.contains('hidden')) || (authOverlay && !authOverlay.classList.contains('hidden')) || (nameOverlay && !nameOverlay.classList.contains('hidden')) || (shopOverlay && !shopOverlay.classList.contains('hidden')) || (wealthOverlay && !wealthOverlay.classList.contains('hidden')) || (leaderboardModal && !leaderboardModal.classList.contains('hidden'))) return; 
        
        createPauseUI(); 
        
        if (gameState.timeRemaining > 0 && gameState.timerInterval) { 
            clearInterval(gameState.timerInterval); 
            gameState.timerInterval = null; 
            document.getElementById('pause-overlay').classList.remove('hidden'); 
        } 
    }

    function createLeaderboardUI() {
        if (document.getElementById('leaderboard-overlay')) return;
        const lbHTML = `<div id="leaderboard-overlay" class="modal-overlay hidden" style="z-index: 99999999; backdrop-filter: blur(5px);"><div class="modal-content" style="max-width: 650px; width: 95%; background: linear-gradient(135deg, #6f4e2a, #4b2e1b); border: 4px solid #d4af37; border-radius: 15px; padding: 20px; box-shadow: 0 0 40px rgba(0,0,0,0.9);"><h2 style="color: #ffd700; margin-bottom: 10px; text-shadow: 2px 2px 4px #000; font-size: 1.8rem; text-align: center;">🏆 BẢNG PHONG THẦN</h2><div style="display: flex; justify-content: center; gap: 10px; margin-bottom: 15px;"><button class="lb-tab-btn active" data-diff="easy" style="flex:1; padding: 8px; background: linear-gradient(to bottom, #4CAF50, #2E7D32); border: 2px solid #ffd700; color: #fff; font-weight: bold; border-radius: 8px; cursor: pointer; text-shadow: 1px 1px 2px #000; box-shadow: 0 4px 6px rgba(0,0,0,0.5);">DỄ</button><button class="lb-tab-btn" data-diff="medium" style="flex:1; padding: 8px; background: #3e2723; border: 2px solid #8b5a2b; color: #fff; font-weight: bold; border-radius: 8px; cursor: pointer; text-shadow: 1px 1px 2px #000; box-shadow: 0 4px 6px rgba(0,0,0,0.5);">T.BÌNH</button><button class="lb-tab-btn" data-diff="hard" style="flex:1; padding: 8px; background: #3e2723; border: 2px solid #8b5a2b; color: #fff; font-weight: bold; border-radius: 8px; cursor: pointer; text-shadow: 1px 1px 2px #000; box-shadow: 0 4px 6px rgba(0,0,0,0.5);">KHÓ</button></div><div id="leaderboard-list" style="max-height: 350px; min-height: 150px; overflow-y: auto; margin-bottom: 20px; color: white; background: rgba(0,0,0,0.4); border-radius: 10px; padding: 5px; border: 1px solid #8b5a2b;"></div><button id="close-leaderboard-btn" style="background: linear-gradient(to bottom, #d4af37, #aa8000); border: 2px solid #fff; color: #000; font-weight: bold; padding: 10px 20px; border-radius: 8px; cursor: pointer; width: 100%; font-size: 1.1rem;">ĐÓNG</button></div></div>`;
        document.body.insertAdjacentHTML('beforeend', lbHTML);
        document.querySelectorAll('.lb-tab-btn').forEach(btn => { btn.addEventListener('click', function() { window.playSoundInternal('select'); document.querySelectorAll('.lb-tab-btn').forEach(b => { b.classList.remove('active'); b.style.background = '#3e2723'; b.style.border = '2px solid #8b5a2b'; }); this.classList.add('active'); if (this.dataset.diff === 'easy') this.style.background = 'linear-gradient(to bottom, #4CAF50, #2E7D32)'; if (this.dataset.diff === 'medium') this.style.background = 'linear-gradient(to bottom, #ff9800, #e65100)'; if (this.dataset.diff === 'hard') this.style.background = 'linear-gradient(to bottom, #f44336, #b71c1c)'; this.style.border = '2px solid #ffd700'; window.showLeaderboardInternal(); }); });
    }

    function saveScoreToLeaderboard() {
        if (gameState.score <= 0 || !gameState.playerName || gameState.isVip) return; 
        let avt = localStorage.getItem('pikachu_player_avatar') || ''; let vp = localStorage.getItem('pikachu_vip_points') || 0; let lbOffline = JSON.parse(localStorage.getItem('pikachu_leaderboard_offline')) || [];
        lbOffline.push({ accountId: gameState.accountId, name: gameState.playerName, score: gameState.score, level: gameState.level, diff: gameState.currentDifficulty, avatar: avt, vipPoints: vp });
        lbOffline.sort((a, b) => b.score - a.score); lbOffline = lbOffline.slice(0, 50); localStorage.setItem('pikachu_leaderboard_offline', JSON.stringify(lbOffline));
        if (window.db) { try { window.db.ref('leaderboard').push({ accountId: gameState.accountId, name: gameState.playerName, score: gameState.score, level: gameState.level, diff: gameState.currentDifficulty, avatar: avt, vipPoints: vp, timestamp: window.firebase.database.ServerValue.TIMESTAMP }).catch(() => {}); } catch(e) {} }
    }

    window.showLeaderboardInternal = function() {
        createLeaderboardUI();
        if (gameState.timerInterval) { clearInterval(gameState.timerInterval); gameState.timerInterval = null; }
        let pauseOverlay = document.getElementById('pause-overlay'); if (pauseOverlay) pauseOverlay.classList.add('hidden');
        let lbOverlay = document.getElementById('leaderboard-overlay'); if (lbOverlay) lbOverlay.classList.remove('hidden');
        let listEl = document.getElementById('leaderboard-list'); listEl.innerHTML = '<p style="text-align:center; color:#00ffff; font-size:1.2rem; padding: 20px;">Đang tải dữ liệu từ máy chủ ⏳...</p>';
        let activeTab = document.querySelector('.lb-tab-btn.active'); let diffType = activeTab ? activeTab.dataset.diff : 'easy';
        
        if (window.db) {
            let isLoaded = false; let fallbackTimeout = setTimeout(() => { if (!isLoaded) { isLoaded = true; listEl.innerHTML = '<p style="text-align:center; color:#ffeb3b; padding: 10px;">Máy chủ phản hồi chậm. Đang mở Kỷ lục Offline!</p>'; setTimeout(() => { let offlineData = JSON.parse(localStorage.getItem('pikachu_leaderboard_offline')) || []; processLeaderboardData(offlineData, diffType, listEl); }, 500); } }, 4000); 
            window.db.ref('users').once('value').then(userSnap => {
                let userDictByAcc = {}; let userDictByName = {};
                userSnap.forEach(u => { 
                    let d = u.val(); 
                    let vip = parseInt(d.vipPoints) || 0; 
                    userDictByAcc[u.key] = { avatar: d.avatar, vipPoints: vip, isAdmin: d.isAdmin }; 
                    if (d.displayName) { 
                        userDictByName[d.displayName.trim().toLowerCase()] = { avatar: d.avatar, vipPoints: vip, isAdmin: d.isAdmin }; 
                    } 
                });
                window.db.ref('leaderboard').orderByChild('score').limitToLast(100).once('value').then((snapshot) => {
                    if (isLoaded) return; isLoaded = true; clearTimeout(fallbackTimeout);
                    let lb = []; 
                    snapshot.forEach((child) => { 
                        let item = child.val(); let matched = null;
                        if (item.accountId && userDictByAcc[item.accountId]) { matched = userDictByAcc[item.accountId]; } 
                        else if (item.name && userDictByName[item.name.trim().toLowerCase()]) { matched = userDictByName[item.name.trim().toLowerCase()]; }
                        if (matched) { 
                            if (matched.avatar) item.avatar = matched.avatar; 
                            if (matched.vipPoints !== undefined) item.vipPoints = matched.vipPoints; 
                           
                            item.isAdmin = matched.isAdmin;
                        }
                        lb.push(item); 
                    }); processLeaderboardData(lb, diffType, listEl);
                }).catch(() => { if (isLoaded) return; isLoaded = true; clearTimeout(fallbackTimeout); let offlineData = JSON.parse(localStorage.getItem('pikachu_leaderboard_offline')) || []; processLeaderboardData(offlineData, diffType, listEl); });
            }).catch(() => { if (isLoaded) return; isLoaded = true; clearTimeout(fallbackTimeout); let offlineData = JSON.parse(localStorage.getItem('pikachu_leaderboard_offline')) || []; processLeaderboardData(offlineData, diffType, listEl); });
        } else { let offlineData = JSON.parse(localStorage.getItem('pikachu_leaderboard_offline')) || []; processLeaderboardData(offlineData, diffType, listEl); }
    };

    function processLeaderboardData(lbData, diffType, listEl) { let filteredData = lbData.filter(item => { let itemDiff = item.diff ? item.diff : 'easy'; return itemDiff === diffType; }); let uniquePlayers = {}; filteredData.forEach(item => { let name = item.name.trim(); if (!uniquePlayers[name] || item.score > uniquePlayers[name].score) { uniquePlayers[name] = item; } }); let finalData = Object.values(uniquePlayers); finalData.sort((a, b) => { let scoreA = a.score || 0; let scoreB = b.score || 0; return scoreB - scoreA; }); finalData = finalData.slice(0, 20); renderLBHTML(finalData, listEl); }
    function renderLBHTML(lb, listEl) {
        if (!lb || lb.length === 0) { listEl.innerHTML = '<p style="text-align:center; color:#ccc; font-size:1.1rem; padding: 20px;">Bảng này chưa có ai! Nhanh tay đoạt Top 1 đi bạn ơi!</p>'; } else {
            let html = '<table style="width:100%; border-collapse: collapse; font-size:1rem; text-align:center;"><tr style="border-bottom: 2px solid #ffd700; color: #ffd700;"><th>Hạng</th><th style="text-align:left; padding-left: 10px;">Đại Hiệp</th><th>Màn</th><th>Điểm</th></tr>';
            
            lb.forEach((item, idx) => {
                let color = idx === 0 ? '#ffeb3b' : (idx === 1 ? '#e0e0e0' : (idx === 2 ? '#cd7f32' : '#fff')); 
                let medal = idx === 0 ? '🥇' : (idx === 1 ? '🥈' : (idx === 2 ? '🥉' : idx + 1)); 
                let levelText = item.level ? item.level : 1; 
                let avt = item.avatar ? item.avatar : 'https://i.imgur.com/7HnLKEg.png'; 
                let vInfo = window.getVipLevelInfo(item.vipPoints || 0);
                
                if (item.isAdmin || (item.name && item.name.includes("Boss Văn Cường"))) { 
                    vInfo = { level: 10, name: "Tiên Nhân", color: "#ff0000", glow: "0 0 15px #ff0000, 0 0 30px #ff0000, inset 0 0 10px #ff0000" }; 
                }
                
                let glowClass = vInfo.level > 0 ? 'vip-glow-frame' : ''; 
                let textGlowClass = vInfo.level > 0 ? 'vip-glow-text' : '';
                
                let nameHtml = `
                <div style="display:flex; align-items:center; justify-content:start; gap:8px; --vip-color:${vInfo.color}; text-align:left;">
                    <img src="${avt}" class="${glowClass}" style="width: 32px; height: 32px; border-radius: 50%; border: 2px solid ${vInfo.color}; object-fit: cover; background: #000;">
                    <span style="background: ${vInfo.color}; color: #000; font-size: 0.65rem; padding: 3px 6px; border-radius: 4px; font-weight: bold; box-shadow: 0 0 5px ${vInfo.color}; display:inline-block; white-space: nowrap; text-transform: uppercase;">${vInfo.name}</span>
                    <span class="${textGlowClass}" style="max-width: 120px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: ${vInfo.color}; font-weight: bold; text-shadow: 0 0 3px #000;">${item.name}</span>
                </div>`;
                
                html += `<tr style="border-bottom:1px solid rgba(255,255,255,0.1); line-height:3;">
                    <td>${medal}</td>
                    <td style="padding: 6px 0 6px 10px;">${nameHtml}</td>
                    <td style="font-weight:bold; color: #ffeb3b;">${levelText}</td>
                    <td style="font-weight:bold; color: #00ffff;">${item.score}</td>
                </tr>`;
            }); 
            html += '</table>'; listEl.innerHTML = html;
        }
    }

    function syncPlayerProfile() {
        highScore = parseInt(localStorage.getItem('pikachu_high_score')) || 0;
        
       let avatarSrc = localStorage.getItem('pikachu_player_avatar');
        if (!avatarSrc || avatarSrc === 'undefined' || avatarSrc === 'null' || avatarSrc === '') {
            avatarSrc = 'https://i.imgur.com/7HnLKEg.png';
        }
        let pName = localStorage.getItem('pikachu_player_name') || 'Người chơi'; 
        let vInfo = window.getVipLevelInfo(localStorage.getItem('pikachu_vip_points'));
        
        if (localStorage.getItem('pikachu_is_admin') === 'true') { 
            vInfo = { level: 10, name: "Tiên Nhân", color: "#ff0000", glow: "0 0 15px #ff0000, 0 0 30px #ff0000, inset 0 0 10px #ff0000" }; 
        }
        
        let hsEl = document.getElementById('high-score'); 
        if (hsEl) hsEl.innerText = highScore;

        let box = document.getElementById('player-profile-box');
        if (box) box.style.setProperty('--vip-color', vInfo.color);
        
        let avtImg = document.getElementById('avatar-img');
        if (avtImg) {
            avtImg.src = avatarSrc;
            avtImg.style.borderColor = vInfo.color;
            if(vInfo.level > 0) avtImg.classList.add('vip-glow-frame'); else avtImg.classList.remove('vip-glow-frame');
        }

        let nameTxt = document.getElementById('player-name-txt');
        if (nameTxt) {
            nameTxt.innerText = pName;
            nameTxt.style.color = vInfo.color;
            if(vInfo.level > 0) nameTxt.classList.add('vip-glow-text'); else nameTxt.classList.remove('vip-glow-text');
        }

        let vipBadge = document.getElementById('player-vip-badge');
        if (vipBadge) {
            vipBadge.innerText = vInfo.name;
            vipBadge.style.backgroundColor = vInfo.color;
            vipBadge.style.color = "#000";
        }
    }

    function updateHighScore() { if (gameState.score > highScore) { highScore = gameState.score; localStorage.setItem('pikachu_high_score', highScore); let hsEl = document.getElementById('high-score'); if (hsEl) hsEl.innerText = highScore; } }

    window.checkVipAndInit = function(accId, displayName, isF5 = false) {
        gameState.playerName = displayName; gameState.accountId = accId;
        
        if (localStorage.getItem('pikachu_is_admin') === 'true') {
            gameState.isVip = true;
            if (!isF5) { 
                let adminOverlay = document.getElementById('custom-admin-overlay');
                if (!adminOverlay) {
                    const adminHTML = `
                    <div id="custom-admin-overlay" class="modal-overlay" style="z-index: 9999999999; backdrop-filter: blur(5px);">
                        <div class="modal-content" style="max-width: 420px; border: 3px solid #ff00ff; box-shadow: 0 0 30px rgba(255, 0, 255, 0.6); padding: 30px;">
                            <div style="font-size: 4rem; margin-bottom: 10px; animation: pvp-pulse 1.5s infinite;">🔥</div>
                            <h2 style="color: #ff00ff; margin-bottom: 15px; text-shadow: 0 0 10px #ff00ff; font-size: 1.8rem;">QUYỀN NĂNG ADMIN</h2>
                            <p style="font-size: 1.1rem; margin-bottom: 25px; color: #fff; line-height: 1.5;">Đăng nhập thành công!<br><br>Đã kích hoạt <b style="color:#ffeb3b; text-shadow: 0 0 5px #ffeb3b;">God Mode</b><br>(Vô hạn Gợi ý & Đổi vị trí)</p>
                            <button id="custom-admin-ok-btn" style="background: linear-gradient(to bottom, #9c27b0, #4a148c); border: 2px solid #fff; color: #fff; font-weight: bold; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 1.2rem; width: 100%; box-shadow: 0 0 15px rgba(156, 39, 176, 0.6);">TIẾN VÀO TRẬN ĐỊA</button>
                        </div>
                    </div>`;
                    document.body.insertAdjacentHTML('beforeend', adminHTML);
                    adminOverlay = document.getElementById('custom-admin-overlay');
                }
                
                adminOverlay.classList.remove('hidden');
                if(window.playSoundInternal) window.playSoundInternal('win'); 
                
                let btnOk = document.getElementById('custom-admin-ok-btn');
                let newBtnOk = btnOk.cloneNode(true);
                btnOk.parentNode.replaceChild(newBtnOk, btnOk);
                
                newBtnOk.addEventListener('click', () => {
                    if(window.playSoundInternal) window.playSoundInternal('select');
                    adminOverlay.classList.add('hidden');
                    init(); 
                });
                
            } else { 
                init(); 
            }
        } else { 
            gameState.isVip = false; 
            init(); 
        }
    };

    function init() {
        document.body.classList.add('is-playing');
       
    let gc = document.getElementById('main-game-ui');
    if (gc) {
        gc.style.display = ''; 
        gc.classList.add('active'); 
    }

        syncPlayerProfile();
        const diffConfig = DIFF_CONFIG[gameState.currentDifficulty]; let currentLevelConfig = LEVELS[gameState.level - 1] || LEVELS[LEVELS.length - 1];
        gameState.board = []; gameState.selectedTile = null; gameState.timeRemaining = Math.floor(currentLevelConfig.time * diffConfig.timeMultiplier); gameState.isProcessing = false; 
        
        let extraHints = parseInt(localStorage.getItem('pikachu_inv_hints')) || 0; let extraShuffles = parseInt(localStorage.getItem('pikachu_inv_shuffles')) || 0;
        gameState.hintsRemaining = CONFIG.INITIAL_HINTS + extraHints; gameState.shufflesRemaining = CONFIG.INITIAL_SHUFFLES + extraShuffles;

        if (gameState.hintTimeoutId) clearTimeout(gameState.hintTimeoutId);
        let emojisToUse = diffConfig.emojiCount; let gameEmojis = [...CONFIG.EMOJIS].sort(() => 0.5 - Math.random()).slice(0, emojisToUse);
        let tiles = []; let totalTiles = CONFIG.ROWS * CONFIG.COLS;
        for (let i = 0; i < totalTiles / 2; i++) { let emoji = gameEmojis[i % gameEmojis.length]; tiles.push(emoji, emoji); } tiles.sort(() => 0.5 - Math.random());
        for (let r = 0; r <= CONFIG.ROWS + 1; r++) { gameState.board[r] = new Array(CONFIG.COLS + 2).fill(0); } let index = 0;
        for (let r = 1; r <= CONFIG.ROWS; r++) { for (let c = 1; c <= CONFIG.COLS; c++) { gameState.board[r][c] = tiles[index++]; } }
        renderBoard(); updateUI(); startTimer();
    }

    function renderBoard() {
        const boardEl = document.getElementById('board'); if(!boardEl) return; boardEl.innerHTML = ''; gameState.selectedTile = null;
        for (let r = 1; r <= CONFIG.ROWS; r++) {
            for (let c = 1; c <= CONFIG.COLS; c++) {
                let tileEl = document.createElement('div'); tileEl.classList.add('tile'); tileEl.dataset.r = r; tileEl.dataset.c = c;
                if (gameState.board[r][c] === 0) { tileEl.classList.add('matched'); } else { tileEl.innerText = gameState.board[r][c]; tileEl.onclick = () => { handleTileClick(r, c, tileEl); }; }
                boardEl.appendChild(tileEl);
            }
        }
    }

    function handleTileClick(r, c, tileEl) {
        if (gameState.isProcessing || gameState.board[r][c] === 0) return;
        if (!gameState.selectedTile) { window.playSoundInternal('select'); gameState.selectedTile = { r: r, c: c, el: tileEl }; tileEl.classList.add('selected'); } else {
            if (gameState.selectedTile.r === r && gameState.selectedTile.c === c) { window.playSoundInternal('select'); gameState.selectedTile.el.classList.remove('selected'); gameState.selectedTile = null; return; }
            if (gameState.board[gameState.selectedTile.r][gameState.selectedTile.c] === gameState.board[r][c]) {
                let path = checkPath({r: gameState.selectedTile.r, c: gameState.selectedTile.c}, {r: r, c: c});
                if (path) {
                    window.playSoundInternal('match'); gameState.isProcessing = true; if (gameState.hintTimeoutId) clearTimeout(gameState.hintTimeoutId);
                    const tile1 = gameState.selectedTile; const tile2 = { r: r, c: c, el: tileEl };
                    document.querySelectorAll('.tile.hint').forEach(t => { t.classList.remove('hint'); }); clearHintLine();
                    drawHintLine(path); tile2.el.classList.add('selected');
                    setTimeout(() => {
                        clearHintLine(); removeTiles(tile1, tile2); gameState.selectedTile = null; gameState.isProcessing = false; 
                        if (checkWin()) {
                            window.playSoundInternal('win'); clearInterval(gameState.timerInterval);
                            setTimeout(() => { window.showCustomAlertInternal(`🏆 Tuyệt vời!\n\nBạn đã vượt qua Bàn ${gameState.level}. Chuẩn bị sang bàn tiếp theo nhé!`, () => { gameState.level++; init(); }); }, 200);
                        } else { if (!findHint()) { setTimeout(() => { window.showCustomAlertInternal('Đã bí đường!\nHãy sử dụng lượt Đổi Vị Trí để tiếp tục.'); }, 300); } }
                    }, 250); return;
                } else { handleWrongClick(); }
            } else { handleWrongClick(); }
            gameState.selectedTile.el.classList.remove('selected'); gameState.selectedTile = { r: r, c: c, el: tileEl }; tileEl.classList.add('selected'); window.playSoundInternal('select');
        }
    }

    function handleWrongClick() { window.playSoundInternal('error'); if (gameState.level >= 5) { gameState.score -= 10; if (gameState.score < 0) gameState.score = 0; updateUI(); } }

    function checkPathFree(r1, c1, r2, c2) { if (r1 === r2) { for (let c = Math.min(c1, c2) + 1; c < Math.max(c1, c2); c++) { if (gameState.board[r1][c] !== 0) return false; } return true; } else if (c1 === c2) { for (let r = Math.min(r1, r2) + 1; r < Math.max(r1, r2); r++) { if (gameState.board[r][c1] !== 0) return false; } return true; } return false; }
    function checkLine(p1, p2) { if (p1.r !== p2.r && p1.c !== p2.c) return null; if (checkPathFree(p1.r, p1.c, p2.r, p2.c)) return [p1, p2]; return null; }
    function checkL(p1, p2) { let corner1 = { r: p1.r, c: p2.c }; if (gameState.board[corner1.r][corner1.c] === 0 && checkPathFree(p1.r, p1.c, corner1.r, corner1.c) && checkPathFree(corner1.r, corner1.c, p2.r, p2.c)) return [p1, corner1, p2]; let corner2 = { r: p2.r, c: p1.c }; if (gameState.board[corner2.r][corner2.c] === 0 && checkPathFree(p1.r, p1.c, corner2.r, corner2.c) && checkPathFree(corner2.r, corner2.c, p2.r, p2.c)) return [p1, corner2, p2]; return null; }
    function checkPath(p1, p2) {
        let path = checkLine(p1, p2); if (path) return path; path = checkL(p1, p2); if (path) return path;
        let validPaths = [];
        for (let c = 0; c <= CONFIG.COLS + 1; c++) { if (c !== p1.c && gameState.board[p1.r][c] === 0 && checkPathFree(p1.r, p1.c, p1.r, c)) { let lPath = checkL({r: p1.r, c: c}, p2); if (lPath) validPaths.push([p1, ...lPath]); } }
        for (let r = 0; r <= CONFIG.ROWS + 1; r++) { if (r !== p1.r && gameState.board[r][p1.c] === 0 && checkPathFree(p1.r, p1.c, r, p1.c)) { let lPath = checkL({r: r, c: p1.c}, p2); if (lPath) validPaths.push([p1, ...lPath]); } }
        if (validPaths.length > 0) { validPaths.sort((a, b) => { let lenA = 0, lenB = 0; for(let i = 0; i < a.length - 1; i++) { lenA += Math.abs(a[i].r - a[i+1].r) + Math.abs(a[i].c - a[i+1].c); } for(let i = 0; i < b.length - 1; i++) { lenB += Math.abs(b[i].r - b[i+1].r) + Math.abs(b[i].c - b[i+1].c); } return lenA - lenB; }); return validPaths[0]; } return null;
    }

    function applyGravity() {
        let type = (LEVELS[gameState.level - 1] || LEVELS[LEVELS.length - 1]).gravity; if (type === 'none') return;
        if (type === 'down') { for (let c = 1; c <= CONFIG.COLS; c++) { let colData = []; for (let r = 1; r <= CONFIG.ROWS; r++) { if (gameState.board[r][c] !== 0) colData.push(gameState.board[r][c]); } while (colData.length < CONFIG.ROWS) { colData.unshift(0); } for (let r = 1; r <= CONFIG.ROWS; r++) { gameState.board[r][c] = colData[r - 1]; } } } 
        else if (type === 'up') { for (let c = 1; c <= CONFIG.COLS; c++) { let colData = []; for (let r = 1; r <= CONFIG.ROWS; r++) { if (gameState.board[r][c] !== 0) colData.push(gameState.board[r][c]); } while (colData.length < CONFIG.ROWS) { colData.push(0); } for (let r = 1; r <= CONFIG.ROWS; r++) { gameState.board[r][c] = colData[r - 1]; } } } 
        else if (type === 'left') { for (let r = 1; r <= CONFIG.ROWS; r++) { let rowData = []; for (let c = 1; c <= CONFIG.COLS; c++) { if (gameState.board[r][c] !== 0) rowData.push(gameState.board[r][c]); } while (rowData.length < CONFIG.COLS) { rowData.push(0); } for (let c = 1; c <= CONFIG.COLS; c++) { gameState.board[r][c] = rowData[c - 1]; } } } 
        else if (type === 'right') { for (let r = 1; r <= CONFIG.ROWS; r++) { let rowData = []; for (let c = 1; c <= CONFIG.COLS; c++) { if (gameState.board[r][c] !== 0) rowData.push(gameState.board[r][c]); } while (rowData.length < CONFIG.COLS) { rowData.unshift(0); } for (let c = 1; c <= CONFIG.COLS; c++) { gameState.board[r][c] = rowData[c - 1]; } } } 
        else if (type === 'center') { let mid = Math.floor(CONFIG.COLS / 2); for (let r = 1; r <= CONFIG.ROWS; r++) { let leftPart = []; for(let c = 1; c <= mid; c++) { if(gameState.board[r][c] !== 0) leftPart.push(gameState.board[r][c]); } while(leftPart.length < mid) { leftPart.unshift(0); } let rightPart = []; for(let c = mid + 1; c <= CONFIG.COLS; c++) { if(gameState.board[r][c] !== 0) rightPart.push(gameState.board[r][c]); } while(rightPart.length < CONFIG.COLS - mid) { rightPart.push(0); } for(let c = 1; c <= mid; c++) { gameState.board[r][c] = leftPart[c - 1]; } for(let c = mid + 1; c <= CONFIG.COLS; c++) { gameState.board[r][c] = rightPart[c - mid - 1]; } } }
        else if (type === 'split_h') { for (let c = 1; c <= CONFIG.COLS; c++) { let colData = []; for (let r = 1; r <= CONFIG.ROWS; r++) if (gameState.board[r][c] !== 0) colData.push(gameState.board[r][c]); let mid = Math.floor(CONFIG.ROWS / 2); let top = colData.slice(0, Math.floor(colData.length/2)); let bot = colData.slice(Math.floor(colData.length/2)); while(top.length < mid) top.push(0); while(bot.length < CONFIG.ROWS - mid) bot.unshift(0); for (let r = 1; r <= mid; r++) gameState.board[r][c] = top[r-1]; for (let r = mid + 1; r <= CONFIG.ROWS; r++) gameState.board[r][c] = bot[r - mid - 1]; } }
        else if (type === 'split_v') { for (let r = 1; r <= CONFIG.ROWS; r++) { let rowData = []; for (let c = 1; c <= CONFIG.COLS; c++) if (gameState.board[r][c] !== 0) rowData.push(gameState.board[r][c]); let mid = Math.floor(CONFIG.COLS / 2); let left = rowData.slice(0, Math.floor(rowData.length/2)); let right = rowData.slice(Math.floor(rowData.length/2)); while(left.length < mid) left.push(0); while(right.length < CONFIG.COLS - mid) right.unshift(0); for (let c = 1; c <= mid; c++) gameState.board[r][c] = left[c-1]; for (let c = mid + 1; c <= CONFIG.COLS; c++) gameState.board[r][c] = right[c - mid - 1]; } }
        else if (type === 'alt_v') { for (let c = 1; c <= CONFIG.COLS; c++) { let colData = []; for (let r = 1; r <= CONFIG.ROWS; r++) if (gameState.board[r][c] !== 0) colData.push(gameState.board[r][c]); if (c % 2 !== 0) { while (colData.length < CONFIG.ROWS) colData.push(0); } else { while (colData.length < CONFIG.ROWS) colData.unshift(0); } for (let r = 1; r <= CONFIG.ROWS; r++) gameState.board[r][c] = colData[r - 1]; } }
        else if (type === 'alt_h') { for (let r = 1; r <= CONFIG.ROWS; r++) { let rowData = []; for (let c = 1; c <= CONFIG.COLS; c++) if (gameState.board[r][c] !== 0) rowData.push(gameState.board[r][c]); if (r % 2 !== 0) { while (rowData.length < CONFIG.COLS) rowData.push(0); } else { while (rowData.length < CONFIG.COLS) rowData.unshift(0); } for (let c = 1; c <= CONFIG.COLS; c++) gameState.board[r][c] = rowData[c - 1]; } }
    }

    function removeTiles(tile1, tile2) { gameState.score += CONFIG.POINTS_PER_MATCH; updateHighScore(); gameState.board[tile1.r][tile1.c] = 0; gameState.board[tile2.r][tile2.c] = 0; applyGravity(); updateUI(); renderBoard(); }

    function checkWin() { for (let r = 1; r <= CONFIG.ROWS; r++) { for (let c = 1; c <= CONFIG.COLS; c++) { if (gameState.board[r][c] !== 0) return false; } } return true; }

    function findHint() { let availableTiles = []; for (let r = 1; r <= CONFIG.ROWS; r++) { for (let c = 1; c <= CONFIG.COLS; c++) { if (gameState.board[r][c] !== 0) availableTiles.push({ r: r, c: c, type: gameState.board[r][c] }); } } for (let i = 0; i < availableTiles.length; i++) { for (let j = i + 1; j < availableTiles.length; j++) { let p1 = availableTiles[i]; let p2 = availableTiles[j]; if (p1.type === p2.type) { let path = checkPath({r: p1.r, c: p1.c}, {r: p2.r, c: p2.c}); if (path) return path; } } } return null; }

    function performHint() {
        if (!gameState.isVip && gameState.hintsRemaining <= 0) { window.showCustomAlertInternal('Bạn đã hết lượt gợi ý rồi! Vào Cửa hàng để mua thêm nhé.'); return; }
        document.querySelectorAll('.tile.hint').forEach(t => { t.classList.remove('hint'); }); clearHintLine();
        const hintPath = findHint();
        if (hintPath) {
            if (!gameState.isVip) { 
                gameState.hintsRemaining--; updateUI(); 
                let baseHints = CONFIG.INITIAL_HINTS;
                if (gameState.hintsRemaining < baseHints) {
                    let invHints = parseInt(localStorage.getItem('pikachu_inv_hints')) || 0;
                    if (invHints > 0) { invHints--; localStorage.setItem('pikachu_inv_hints', invHints); if (window.db && localStorage.getItem('pikachu_is_admin') !== 'true') window.db.ref('users/' + gameState.accountId).update({ invHints: invHints }); }
                }
            }
            let p1 = hintPath[0]; let p2 = hintPath[hintPath.length - 1]; const t1 = document.querySelector(`.tile[data-r="${p1.r}"][data-c="${p1.c}"]`); const t2 = document.querySelector(`.tile[data-r="${p2.r}"][data-c="${p2.c}"]`);
            if (t1 && t2) { t1.classList.add('hint'); t2.classList.add('hint'); drawHintLine(hintPath); if (gameState.hintTimeoutId) clearTimeout(gameState.hintTimeoutId); gameState.hintTimeoutId = setTimeout(() => { t1.classList.remove('hint'); t2.classList.remove('hint'); clearHintLine(); }, 3000); }
        } else { window.showCustomAlertInternal('Đã bí đường!\nHãy sử dụng lượt Đổi vị trí nhé.'); }
    }

    function drawHintLine(pathArray) {
        const svgEl = document.getElementById('connection-line-layer'); if(!svgEl) return;
        svgEl.style.position = 'fixed'; svgEl.style.top = '0'; svgEl.style.left = '0'; svgEl.style.width = '100vw'; svgEl.style.height = '100vh'; svgEl.style.zIndex = '9999'; svgEl.style.pointerEvents = 'none'; 
        const refTile1 = document.querySelector('.tile[data-r="1"][data-c="1"]').getBoundingClientRect(); const refTile2X = document.querySelector('.tile[data-r="1"][data-c="2"]').getBoundingClientRect(); const refTile2Y = document.querySelector('.tile[data-r="2"][data-c="1"]').getBoundingClientRect();
        const gapX = refTile2X.left - refTile1.left; const gapY = refTile2Y.top - refTile1.top; const startX = refTile1.left + refTile1.width / 2; const startY = refTile1.top + refTile1.height / 2;
        function getPixel(r, c) { return { x: startX + (c - 1) * gapX, y: startY + (r - 1) * gapY }; }
        let pointsString = pathArray.map(p => { let px = getPixel(p.r, p.c); return `${px.x},${px.y}`; }).join(' ');
        const polyline = document.createElementNS('http://www.w3.org/2000/svg', 'polyline'); polyline.setAttribute('points', pointsString); polyline.setAttribute('stroke', '#00ffff'); polyline.setAttribute('stroke-width', '6'); polyline.setAttribute('fill', 'none'); polyline.setAttribute('stroke-linejoin', 'round'); polyline.setAttribute('stroke-linecap', 'round'); polyline.setAttribute('filter', 'drop-shadow(0 0 5px rgba(0, 255, 255, 0.8))'); polyline.setAttribute('pointer-events', 'none'); 
        svgEl.innerHTML = ''; svgEl.appendChild(polyline); svgEl.classList.remove('hidden');
    }

    function clearHintLine() { const svgEl = document.getElementById('connection-line-layer'); if(svgEl){svgEl.innerHTML = ''; svgEl.classList.add('hidden');} }

    function performShuffle() {
        if (!gameState.isVip && gameState.shufflesRemaining <= 0) { window.showCustomAlertInternal('Bạn đã hết lượt đổi vị trí! Vào Cửa hàng để mua thêm nhé.'); return; }
        if (!gameState.isVip) {
            gameState.shufflesRemaining--; let baseShuffles = CONFIG.INITIAL_SHUFFLES;
            if (gameState.shufflesRemaining < baseShuffles) {
                let invShuf = parseInt(localStorage.getItem('pikachu_inv_shuffles')) || 0;
                if (invShuf > 0) { invShuf--; localStorage.setItem('pikachu_inv_shuffles', invShuf); if (window.db && localStorage.getItem('pikachu_is_admin') !== 'true') window.db.ref('users/' + gameState.accountId).update({ invShuffles: invShuf }); }
            }
        }
        forceShuffle();
    }

    function forceShuffle() {
        let currentEmojis = []; for (let r = 1; r <= CONFIG.ROWS; r++) { for (let c = 1; c <= CONFIG.COLS; c++) { if (gameState.board[r][c] !== 0) currentEmojis.push(gameState.board[r][c]); } }
        let attempts = 0; while (attempts < 100) { currentEmojis.sort(() => 0.5 - Math.random()); let index = 0; for (let r = 1; r <= CONFIG.ROWS; r++) { for (let c = 1; c <= CONFIG.COLS; c++) { if (gameState.board[r][c] !== 0) gameState.board[r][c] = currentEmojis[index++]; } } if (findHint()) break; attempts++; }
        renderBoard(); updateUI();
    }

    function updateUI() {
        let elScore = document.getElementById('score'); if (elScore) elScore.innerText = gameState.score; 
        let elLevel = document.getElementById('level'); if (elLevel) elLevel.innerText = gameState.level; 
        let elShuff = document.getElementById('shuffle-count'); if (elShuff) elShuff.innerText = gameState.isVip ? '∞' : gameState.shufflesRemaining; 
        let elHint = document.getElementById('hint-count'); if (elHint) elHint.innerText = gameState.isVip ? '∞' : gameState.hintsRemaining; 
        updateTimeDisplay();
    }
    window.updateUIGlobal = updateUI;

    function startTimer() {
        if (gameState.timerInterval) clearInterval(gameState.timerInterval); updateTimeDisplay();
        const diffConfig = DIFF_CONFIG[gameState.currentDifficulty]; let timeTickRate = gameState.isVip ? 2000 : diffConfig.tickRate;
        gameState.timerInterval = setInterval(() => {
            if (gameState.timeRemaining > 0) { gameState.timeRemaining--; updateTimeDisplay(); } 
            else { clearInterval(gameState.timerInterval); saveScoreToLeaderboard(); window.playSoundInternal('lose'); window.showCustomAlertInternal(`⌛ HẾT GIỜ! GAME OVER.\n\nĐiểm của bạn: ${gameState.score}\nKỷ lục hiện tại: ${highScore}`, () => { resetGame(); }); }
        }, timeTickRate);
    }

    function updateTimeDisplay() {
        let currentLevelConfig = LEVELS[gameState.level - 1] || LEVELS[LEVELS.length - 1]; const diffConfig = DIFF_CONFIG[gameState.currentDifficulty]; let maxTime = Math.floor(currentLevelConfig.time * diffConfig.timeMultiplier); const timePercentage = (gameState.timeRemaining / maxTime) * 100; 
        const timerBarHor = document.getElementById('timer-bar'); const timerBarVer = document.getElementById('timer-bar-vertical');
        let color = '#00ff00'; if (timePercentage <= 50 && timePercentage > 20) color = 'yellow'; else if (timePercentage <= 20) color = 'red';
        if(timerBarHor){ timerBarHor.style.setProperty('--progress', `${timePercentage}%`); timerBarHor.style.backgroundColor = color; }
        if(timerBarVer){ timerBarVer.style.setProperty('--progress', `${timePercentage}%`); timerBarVer.style.backgroundColor = color; }
    }

    function toggleMute() { gameState.isMuted = !gameState.isMuted; let icon = document.querySelector('#sound-btn i'); if (icon) icon.innerText = gameState.isMuted ? '🔊' : '🔇'; if (!gameState.isMuted) window.playSoundInternal('select'); }

    function resetGame() {
        if (gameState.timerInterval) clearInterval(gameState.timerInterval); if (gameState.hintTimeoutId) clearTimeout(gameState.hintTimeoutId);
        gameState.score = 0; gameState.level = 1; gameState.shufflesRemaining = CONFIG.INITIAL_SHUFFLES; gameState.hintsRemaining = CONFIG.INITIAL_HINTS; updateUI();
        let pauseOverlay = document.getElementById('pause-overlay'); if (pauseOverlay) pauseOverlay.classList.add('hidden');
        if(window.showMainMenu) window.showMainMenu();
    }
    document.addEventListener('click', function(e) {
        let target = e.target;
        if (target.id === 'cancel-diff-btn' || target.closest('#cancel-diff-btn')) { 
            e.preventDefault(); 
            window.playSoundInternal('select'); 
            document.getElementById('difficulty-modal').classList.add('hidden'); 
            return; 
        }
        
        if (target.closest('#sound-btn')) { e.preventDefault(); toggleMute(); return; }
        if (target.closest('#pause-btn')) { e.preventDefault(); window.playSoundInternal('select'); pauseGame(); return; }
        if (target.closest('#hint-btn')) { e.preventDefault(); window.playSoundInternal('select'); performHint(); return; }
        if (target.closest('#shuffle-btn')) { e.preventDefault(); window.playSoundInternal('select'); performShuffle(); return; }
        
        if (target.id === 'close-leaderboard-btn') {
            window.playSoundInternal('select');
            let lbOverlay = document.getElementById('leaderboard-overlay'); if (lbOverlay) lbOverlay.classList.add('hidden');
            let diffModal = document.getElementById('difficulty-modal'); let isDiffHidden = diffModal ? diffModal.classList.contains('hidden') : true;
            let mainMenu = document.getElementById('main-menu-overlay'); let isMenuHidden = mainMenu ? mainMenu.classList.contains('hidden') : true;
            let shopOvl = document.getElementById('shop-overlay'); let isShopHidden = shopOvl ? shopOvl.classList.contains('hidden') : true;
            let wOvl = document.getElementById('wealth-overlay'); let isWHidden = wOvl ? wOvl.classList.contains('hidden') : true;
            if (gameState.timeRemaining > 0 && isDiffHidden && isMenuHidden && isShopHidden && isWHidden) { startTimer(); }
        }
        if (target.id === 'resume-btn') { window.playSoundInternal('select'); let pauseOverlay = document.getElementById('pause-overlay'); if (pauseOverlay) pauseOverlay.classList.add('hidden'); startTimer(); }
      
        let footerQuitBtn = target.closest('#footer-quit-btn');
        let pauseQuitBtn = target.closest('#quit-game-btn');

        if (footerQuitBtn || pauseQuitBtn) {
            e.preventDefault();
            window.playSoundInternal('select'); 
            
            let pauseOverlay = document.getElementById('pause-overlay'); 
            if (pauseOverlay) pauseOverlay.classList.add('hidden'); 
            
            if (gameState.score > 0) saveScoreToLeaderboard(); 
            
            let quitOverlay = document.getElementById('custom-quit-overlay');
            if (!quitOverlay) {
                const quitHTML = `
                <div id="custom-quit-overlay" class="modal-overlay" style="z-index: 9999999999; backdrop-filter: blur(4px);">
                    <div class="modal-content" style="max-width: 400px; border: 3px solid #ff5252; box-shadow: 0 0 25px rgba(255, 82, 82, 0.6); padding: 30px;">
                        <div style="font-size: 3.5rem; margin-bottom: 10px;">🚪</div>
                        <h2 style="color: #ff5252; margin-bottom: 15px; text-shadow: 0 0 10px #ff5252; font-size: 1.6rem;">ĐÃ THOÁT TRÒ CHƠI</h2>
                        <p id="custom-quit-msg" style="font-size: 1.1rem; margin-bottom: 25px; color: #fff; line-height: 1.5;"></p>
                        <button id="custom-quit-ok-btn" style="background: linear-gradient(to bottom, #d32f2f, #b71c1c); border: 2px solid #fff; color: #fff; font-weight: bold; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 1.2rem; width: 100%; box-shadow: 0 0 10px rgba(244,67,54,0.5);">VỀ SẢNH CHÍNH</button>
                    </div>
                </div>`;
                document.body.insertAdjacentHTML('beforeend', quitHTML);
                quitOverlay = document.getElementById('custom-quit-overlay');
            }
            
          
            document.getElementById('custom-quit-msg').innerHTML = `Số điểm <b style="color:#ffeb3b; font-size:1.4rem;">${gameState.score}</b> của bạn đã được ghi nhận vào Bảng Phong Thần!`;
            quitOverlay.classList.remove('hidden');
            
            
            let btnOk = document.getElementById('custom-quit-ok-btn');
            let newBtnOk = btnOk.cloneNode(true); 
            btnOk.parentNode.replaceChild(newBtnOk, btnOk);
            
            newBtnOk.addEventListener('click', () => {
                if(window.playSoundInternal) window.playSoundInternal('select');
                quitOverlay.classList.add('hidden');
                resetGame(); 
            });
            
            return; 
        }});

    document.addEventListener('DOMContentLoaded', () => {
        let btnStart = document.getElementById('start-game-btn'); 
        if(btnStart) btnStart.addEventListener('click', () => {
            window.playSoundInternal('select'); 
            let diffModal = document.getElementById('difficulty-modal'); if (diffModal) diffModal.classList.add('hidden');
            let mMenu = document.getElementById('main-menu-overlay'); if(mMenu) mMenu.classList.add('hidden');
            let elem = document.documentElement; if (elem.requestFullscreen) elem.requestFullscreen().catch(() => {});
            let savedAcc = localStorage.getItem('pikachu_account_id'); let savedName = localStorage.getItem('pikachu_player_name');
            window.checkVipAndInit(savedAcc, savedName, false); 
        });

        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', function() { window.playSoundInternal('select'); document.querySelectorAll('.diff-btn').forEach(b => b.classList.remove('active')); this.classList.add('active'); gameState.currentDifficulty = this.dataset.diff; });
        });

        let savedDiff = localStorage.getItem('pikachu_difficulty');
        if (savedDiff && DIFF_CONFIG[savedDiff]) { gameState.currentDifficulty = savedDiff; document.querySelectorAll('.diff-btn').forEach(b => { b.classList.remove('active'); if(b.dataset.diff === savedDiff) b.classList.add('active'); }); }
    });
})()
window.showCustomAlertInternal = function(message, callback) {
    if(window.playSoundInternal) window.playSoundInternal('error');
    
    let overlay = document.getElementById('global-alert-overlay');
    if (!overlay) {
        const alertHTML = `
        <div id="global-alert-overlay" class="modal-overlay hidden" style="z-index: 9999999999; backdrop-filter: blur(4px);">
            <div class="modal-content" style="max-width: 400px; border: 3px solid #00ffff; box-shadow: 0 0 25px rgba(0, 255, 255, 0.6); padding: 30px;">
                <h2 style="color: #00ffff; margin-bottom: 15px; text-shadow: 0 0 10px #00ffff; font-size: 1.6rem;">THIÊN ĐẠO TRUYỀN ÂM</h2>
                <p id="global-alert-message" style="font-size: 1.1rem; margin-bottom: 25px; color: #fff; white-space: pre-wrap; line-height: 1.5;"></p>
                <button id="global-alert-btn" style="background: linear-gradient(to bottom, #00ffff, #008888); border: 2px solid #fff; color: #000; font-weight: bold; padding: 12px 30px; border-radius: 8px; cursor: pointer; font-size: 1.2rem; width: 100%; box-shadow: 0 0 10px rgba(0,255,255,0.5);">ĐÃ RÕ</button>
            </div>
        </div>`;
        document.body.insertAdjacentHTML('beforeend', alertHTML);
        overlay = document.getElementById('global-alert-overlay');
    }
    
    document.getElementById('global-alert-message').innerHTML = message;
    overlay.classList.remove('hidden');
    
    let btn = document.getElementById('global-alert-btn');
    let newBtn = btn.cloneNode(true);
    btn.parentNode.replaceChild(newBtn, btn);
    
    newBtn.addEventListener('click', () => {
        if(window.playSoundInternal) window.playSoundInternal('select');
        overlay.classList.add('hidden');
        if (callback) callback();
    });
};
window.alert = window.showCustomAlertInternal;