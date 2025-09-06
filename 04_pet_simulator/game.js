class PetSimulator {
    constructor() {
        // ペットの基本情報
        this.petName = 'ペット';
        this.age = 0;
        this.stage = 'egg'; // egg, baby, child, teen, adult
        this.species = null;
        this.gameStartTime = Date.now(); // ゲーム開始時刻
        
        // ステータス
        this.stats = {
            health: 100,
            hunger: 100,
            happiness: 100,
            cleanliness: 100,
            energy: 100,
            discipline: 50,
            intelligence: 0,
            strength: 0
        };
        
        // 状態フラグ
        this.isSleeping = false;
        this.isSick = false;
        this.isDead = false;
        
        // アイテムと通貨
        this.coins = 100;
        this.inventory = {
            food: 5,
            toy: 3,
            medicine: 2,
            soap: 3,
            treat: 1
        };
        
        // 進化形態
        this.evolutionPaths = {
            egg: { sprite: '🥚', next: 'baby', requiredAge: 1 },
            baby: { sprite: '🐣', next: 'child', requiredAge: 3 },
            child: [
                { sprite: '🐥', next: 'teen_happy', condition: 'happiness', requiredAge: 7 },
                { sprite: '🐤', next: 'teen_smart', condition: 'intelligence', requiredAge: 7 },
                { sprite: '🦆', next: 'teen_strong', condition: 'strength', requiredAge: 7 }
            ],
            teen_happy: { sprite: '🦜', next: 'adult_parrot', requiredAge: 14 },
            teen_smart: { sprite: '🦉', next: 'adult_owl', requiredAge: 14 },
            teen_strong: { sprite: '🦅', next: 'adult_eagle', requiredAge: 14 },
            adult_parrot: { sprite: '🦜', next: null },
            adult_owl: { sprite: '🦉', next: null },
            adult_eagle: { sprite: '🦅', next: null }
        };
        
        // ショップアイテム
        this.shopItems = [
            { id: 'food', name: 'ごはん', icon: '🍖', price: 10, effect: 'hunger' },
            { id: 'toy', name: 'おもちゃ', icon: '⚽', price: 15, effect: 'happiness' },
            { id: 'medicine', name: 'くすり', icon: '💊', price: 30, effect: 'health' },
            { id: 'soap', name: 'せっけん', icon: '🧼', price: 5, effect: 'cleanliness' },
            { id: 'treat', name: 'おやつ', icon: '🍰', price: 25, effect: 'special' }
        ];
        
        // タイマー
        this.gameTimer = null;
        this.autoSaveTimer = null;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadGame();
        this.startGameLoop();
        this.updateDisplay();
    }
    
    setupEventListeners() {
        // アクションボタン
        document.getElementById('feed-btn').addEventListener('click', () => this.feed());
        document.getElementById('play-btn').addEventListener('click', () => this.play());
        document.getElementById('clean-btn').addEventListener('click', () => this.clean());
        document.getElementById('sleep-btn').addEventListener('click', () => this.sleep());
        document.getElementById('medicine-btn').addEventListener('click', () => this.giveMedicine());
        document.getElementById('train-btn').addEventListener('click', () => this.train());
        
        // メニュータブ
        document.querySelectorAll('.menu-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('.menu-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.showMenu(btn.dataset.menu);
            });
        });
        
        // ポップアップ閉じるボタン
        document.getElementById('menu-popup-close').addEventListener('click', () => {
            document.getElementById('menu-popup-overlay').style.display = 'none';
        });
        
        // オーバーレイクリックでも閉じる
        document.getElementById('menu-popup-overlay').addEventListener('click', (e) => {
            if (e.target.id === 'menu-popup-overlay') {
                document.getElementById('menu-popup-overlay').style.display = 'none';
            }
        });
        
        // リスタートボタン
        document.getElementById('restart-btn').addEventListener('click', () => this.restart());
        
        // 進化画面の続けるボタン
        document.getElementById('continue-evolution').addEventListener('click', () => {
            document.getElementById('evolution-screen').style.display = 'none';
        });
        
        // ペット名の変更
        document.getElementById('pet-name').addEventListener('click', () => {
            const newName = prompt('ペットの名前を入力してください:', this.petName);
            if (newName && newName.trim()) {
                this.petName = newName.trim();
                this.updateDisplay();
                this.saveGame();
            }
        });
        
        // ミニゲーム初期化
        this.initMinigame();
    }
    
    startGameLoop() {
        // メインゲームループ（1秒ごと）
        this.gameTimer = setInterval(() => {
            this.updateStats();
            this.checkEvolution();
            this.checkHealth();
            this.updateDisplay();
        }, 1000);
        
        // 自動セーブ（30秒ごと）
        this.autoSaveTimer = setInterval(() => {
            this.saveGame();
        }, 30000);
    }
    
    updateStats() {
        if (this.isDead) return;
        
        // 時間経過でステータス減少
        const decreaseRate = this.isSleeping ? 0.05 : 0.1;
        
        if (!this.isSleeping) {
            this.stats.hunger = Math.max(0, this.stats.hunger - decreaseRate * 2);
            this.stats.energy = Math.max(0, this.stats.energy - decreaseRate);
        } else {
            this.stats.energy = Math.min(100, this.stats.energy + 0.5);
        }
        
        this.stats.happiness = Math.max(0, this.stats.happiness - decreaseRate);
        this.stats.cleanliness = Math.max(0, this.stats.cleanliness - decreaseRate * 0.5);
        
        // 空腹や不潔で健康が減少
        if (this.stats.hunger < 30 || this.stats.cleanliness < 30) {
            this.stats.health = Math.max(0, this.stats.health - 0.2);
        }
        
        // 幸福度が高いと健康回復
        if (this.stats.happiness > 80 && this.stats.health < 100) {
            this.stats.health = Math.min(100, this.stats.health + 0.1);
        }
        
        // 病気の判定
        if (this.stats.health < 30 && !this.isSick) {
            this.isSick = true;
            this.showNotification('ペットが病気になりました！', 'warning');
        }
        
        // 年齢の増加（60秒で1日）
        const currentAge = Math.floor((Date.now() - this.gameStartTime) / 60000);
        if (currentAge > this.age) {
            const ageDifference = currentAge - this.age;
            this.age = currentAge;
            const dailyReward = 10 + Math.floor(this.stats.happiness / 10); // 幸福度ボーナス
            this.coins += dailyReward * ageDifference; // 日給（複数日分）
            this.showNotification(`日給獲得！ +💰${dailyReward * ageDifference}`, 'info');
        }
    }
    
    checkEvolution() {
        const evolution = this.evolutionPaths[this.stage];
        if (!evolution) return;
        
        if (Array.isArray(evolution)) {
            // 分岐進化
            const bestPath = evolution.reduce((best, path) => {
                const conditionValue = this.stats[path.condition] || 0;
                const bestValue = this.stats[best.condition] || 0;
                return conditionValue > bestValue ? path : best;
            }, evolution[0]);
            
            if (this.age >= bestPath.requiredAge) {
                this.evolve(bestPath);
            }
        } else if (evolution.next && this.age >= evolution.requiredAge) {
            this.evolve(evolution);
        }
    }
    
    evolve(evolution) {
        const oldSprite = this.getCurrentSprite();
        this.stage = evolution.next;
        const newSprite = this.getCurrentSprite();
        
        // 進化画面を表示
        document.getElementById('old-form').textContent = oldSprite;
        document.getElementById('new-form').textContent = newSprite;
        document.getElementById('evolution-message').textContent = `${this.petName}が進化しました！`;
        document.getElementById('evolution-screen').style.display = 'flex';
        
        // ステータスボーナス
        this.stats.health = 100;
        this.stats.happiness = Math.min(100, this.stats.happiness + 20);
        
        this.showNotification('進化しました！', 'success');
        this.updateDisplay();
    }
    
    getCurrentSprite() {
        const evolution = this.evolutionPaths[this.stage];
        if (Array.isArray(evolution)) {
            return evolution[0].sprite;
        }
        return evolution ? evolution.sprite : '🥚';
    }
    
    checkHealth() {
        if (this.stats.health <= 0 && !this.isDead) {
            this.gameOver('health');
        } else if (this.stats.hunger <= 0 && !this.isDead) {
            this.gameOver('hunger');
        }
    }
    
    feed() {
        if (this.isDead) {
            this.showNotification('ペットが死んでいます', 'error');
            return;
        }
        
        if (this.isSleeping) {
            this.showNotification('ペットが寝ています（起こしてから餌をあげてください）', 'warning');
            return;
        }
        
        if (this.inventory.food <= 0) {
            this.showNotification('食べ物がありません！（ショップで購入してください）', 'error');
            return;
        }
        
        if (this.stats.hunger >= 90) {
            this.showNotification('お腹がいっぱいです', 'info');
            return;
        }
        
        // 餌をあげる処理
        this.inventory.food--;
        this.stats.hunger = Math.min(100, this.stats.hunger + 30);
        this.stats.happiness = Math.min(100, this.stats.happiness + 10);
        
        this.showPetAnimation('eating');
        this.showEffect('🍖');
        
        // アクション成功でコイン獲得
        const reward = Math.floor(Math.random() * 5) + 3; // 3-7コイン
        this.coins += reward;
        this.showNotification(`おいしい！ +💰${reward}`, 'success');
        this.updateDisplay();
    }
    
    play() {
        if (this.isDead) {
            this.showNotification('ペットが死んでいます', 'error');
            return;
        }
        
        if (this.isSleeping) {
            this.showNotification('ペットが寝ています（起こしてから遊んでください）', 'warning');
            return;
        }
        
        if (this.stats.energy < 20) {
            this.showNotification('疲れすぎています（エネルギー20以上必要）', 'warning');
            return;
        }
        
        if (this.inventory.toy <= 0) {
            this.showNotification('おもちゃがありません！（ショップで購入してください）', 'error');
            return;
        }
        
        if (this.stats.happiness >= 90) {
            this.showNotification('もう十分楽しんでいます', 'info');
            return;
        }
        
        // 遊ぶ処理
        this.inventory.toy--;
        this.stats.happiness = Math.min(100, this.stats.happiness + 40);
        this.stats.energy = Math.max(0, this.stats.energy - 20);
        this.stats.strength += 1;
        
        this.showPetAnimation('happy');
        this.showEffect('⚽');
        
        // アクション成功でコイン獲得
        const reward = Math.floor(Math.random() * 8) + 5; // 5-12コイン
        this.coins += reward;
        this.showNotification(`楽しい！ +💰${reward}`, 'success');
        this.updateDisplay();
    }
    
    clean() {
        if (this.isDead) {
            this.showNotification('ペットが死んでいます', 'error');
            return;
        }
        
        if (this.inventory.soap <= 0) {
            this.showNotification('せっけんがありません！（ショップで購入してください）', 'error');
            return;
        }
        
        if (this.stats.cleanliness >= 90) {
            this.showNotification('もう十分きれいです', 'info');
            return;
        }
        
        // 掃除処理
        this.inventory.soap--;
        this.stats.cleanliness = 100;
        this.stats.happiness = Math.min(100, this.stats.happiness + 15);
        
        this.showEffect('🫧');
        
        // アクション成功でコイン獲得
        const reward = Math.floor(Math.random() * 5) + 2; // 2-6コイン
        this.coins += reward;
        this.showNotification(`きれいになった！ +💰${reward}`, 'success');
        this.updateDisplay();
    }
    
    sleep() {
        if (this.isDead) {
            this.showNotification('ペットが死んでいます', 'error');
            return;
        }
        
        this.isSleeping = !this.isSleeping;
        
        if (this.isSleeping) {
            if (this.stats.energy >= 80) {
                this.showNotification('まだ眠くないようです（エネルギーが高すぎます）', 'info');
                this.isSleeping = false;
                return;
            }
            document.getElementById('pet').classList.add('sleeping');
            document.getElementById('environment').classList.add('night');
            this.showEffect('💤');
            this.showNotification('おやすみなさい...', 'info');
        } else {
            document.getElementById('pet').classList.remove('sleeping');
            document.getElementById('environment').classList.remove('night');
            this.showNotification('おはよう！', 'info');
        }
        
        this.updateDisplay();
    }
    
    giveMedicine() {
        if (this.isDead) {
            this.showNotification('ペットが死んでいます', 'error');
            return;
        }
        
        if (this.isSleeping) {
            this.showNotification('ペットが寝ています（起こしてから薬をあげてください）', 'warning');
            return;
        }
        
        if (this.inventory.medicine <= 0) {
            this.showNotification('薬がありません！（ショップで購入してください）', 'error');
            return;
        }
        
        if (this.stats.health >= 90 && !this.isSick) {
            this.showNotification('健康なので薬は必要ありません', 'info');
            return;
        }
        
        // 薬を与える処理
        this.inventory.medicine--;
        this.stats.health = Math.min(100, this.stats.health + 50);
        this.isSick = false;
        
        document.getElementById('environment').classList.remove('sick');
        this.showEffect('💊');
        
        // 病気を治したボーナス
        const reward = 20;
        this.coins += reward;
        this.showNotification(`元気になった！ +💰${reward}`, 'success');
        this.updateDisplay();
    }
    
    train() {
        if (this.isDead) {
            this.showNotification('ペットが死んでいます', 'error');
            return;
        }
        
        if (this.isSleeping) {
            this.showNotification('ペットが寝ています（起こしてからしつけをしてください）', 'warning');
            return;
        }
        
        if (this.stats.energy < 30) {
            this.showNotification('疲れすぎています（エネルギー30以上必要）', 'warning');
            return;
        }
        
        if (this.stats.discipline >= 90 && this.stats.intelligence >= 50) {
            this.showNotification('もう十分賢くなっています', 'info');
            return;
        }
        
        // しつけ処理
        this.stats.discipline = Math.min(100, this.stats.discipline + 10);
        this.stats.intelligence += 2;
        this.stats.energy = Math.max(0, this.stats.energy - 30);
        this.stats.happiness = Math.max(0, this.stats.happiness - 10);
        
        this.showEffect('📚');
        
        // しつけ成功でコイン獲得
        const reward = Math.floor(Math.random() * 10) + 8; // 8-17コイン
        this.coins += reward;
        this.showNotification(`賢くなった！ +💰${reward}`, 'success');
        this.updateDisplay();
    }
    
    showPetAnimation(type) {
        const pet = document.getElementById('pet');
        pet.classList.add(type);
        setTimeout(() => {
            pet.classList.remove(type);
        }, 1000);
    }
    
    showEffect(emoji) {
        const effectsLayer = document.getElementById('effects');
        const effect = document.createElement('div');
        effect.className = 'effect-particle';
        effect.textContent = emoji;
        effect.style.left = `${Math.random() * 80 + 10}%`;
        effect.style.top = '50%';
        
        effectsLayer.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 2000);
    }
    
    showNotification(message, type) {
        const emotion = document.getElementById('pet-emotion');
        const actionStatus = document.getElementById('action-status');
        const statusMessage = document.getElementById('status-message');
        let emoji = '';
        
        switch(type) {
            case 'success': emoji = '😊'; break;
            case 'warning': emoji = '😟'; break;
            case 'error': emoji = '😢'; break;
            case 'info': emoji = '💭'; break;
        }
        
        emotion.textContent = emoji;
        emotion.style.animation = 'none';
        void emotion.offsetWidth; // リフローを強制
        emotion.style.animation = 'fadeInOut 2s ease-in-out';
        
        // メッセージテキストも表示
        if (statusMessage) {
            statusMessage.textContent = message;
            statusMessage.className = `status-message ${type}`;
            actionStatus.style.display = 'block';
            
            // 3秒後に非表示
            setTimeout(() => {
                actionStatus.style.display = 'none';
            }, 3000);
        }
    }
    
    showMenu(menuType) {
        const overlay = document.getElementById('menu-popup-overlay');
        const body = document.getElementById('menu-popup-body');
        overlay.style.display = 'flex';
        
        // タイトルを含むHTMLを生成
        let content = '';
        switch(menuType) {
            case 'status':
                content = '<h2 style="color: #2c3e50; margin-bottom: 20px;">📊 ステータス詳細</h2>' + this.getStatusHTML();
                break;
            case 'items':
                content = '<h2 style="color: #2c3e50; margin-bottom: 20px;">🎒 インベントリ</h2>' + this.getInventoryHTML();
                break;
            case 'shop':
                content = '<h2 style="color: #2c3e50; margin-bottom: 20px;">🛍️ ショップ</h2>' + this.getShopHTML();
                body.innerHTML = content;
                this.setupShopListeners();
                return;
            case 'settings':
                content = '<h2 style="color: #2c3e50; margin-bottom: 20px;">⚙️ 設定</h2>' + this.getSettingsHTML();
                body.innerHTML = content;
                this.setupSettingsListeners();
                return;
        }
        body.innerHTML = content;
    }
    
    getStatusHTML() {
        return `
            <div class="status-details">
                <div class="status-item">
                    <div class="status-label">名前</div>
                    <div class="status-value">${this.petName}</div>
                </div>
                <div class="status-item">
                    <div class="status-label">年齢</div>
                    <div class="status-value">${this.age}日</div>
                </div>
                <div class="status-item">
                    <div class="status-label">成長段階</div>
                    <div class="status-value">${this.stage}</div>
                </div>
                <div class="status-item">
                    <div class="status-label">コイン</div>
                    <div class="status-value">💰 ${this.coins}</div>
                </div>
                <div class="status-item">
                    <div class="status-label">しつけ</div>
                    <div class="status-value">${Math.floor(this.stats.discipline)}%</div>
                </div>
                <div class="status-item">
                    <div class="status-label">知能</div>
                    <div class="status-value">${Math.floor(this.stats.intelligence)}</div>
                </div>
                <div class="status-item">
                    <div class="status-label">体力</div>
                    <div class="status-value">${Math.floor(this.stats.strength)}</div>
                </div>
                <div class="status-item">
                    <div class="status-label">状態</div>
                    <div class="status-value">${this.isSick ? '病気' : this.isSleeping ? '睡眠中' : '元気'}</div>
                </div>
            </div>
        `;
    }
    
    getInventoryHTML() {
        return `
            <div class="inventory-grid">
                ${Object.entries(this.inventory).map(([item, count]) => {
                    const itemData = this.shopItems.find(i => i.id === item);
                    return `
                        <div class="inventory-item">
                            <span class="item-icon">${itemData ? itemData.icon : '❓'}</span>
                            <span class="item-count">${count}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;
    }
    
    getShopHTML() {
        return `
            <div class="shop-grid">
                ${this.shopItems.map(item => `
                    <div class="shop-item">
                        <div class="shop-item-info">
                            <span class="shop-item-icon">${item.icon}</span>
                            <div class="shop-item-details">
                                <div class="shop-item-name">${item.name}</div>
                                <div class="shop-item-price">💰 ${item.price}</div>
                            </div>
                        </div>
                        <button class="buy-btn" data-item="${item.id}" ${this.coins < item.price ? 'disabled' : ''}>
                            購入
                        </button>
                    </div>
                `).join('')}
            </div>
            <div style="margin-top: 20px; text-align: center;">
                <strong>所持金: 💰 ${this.coins}</strong>
            </div>
        `;
    }
    
    getSettingsHTML() {
        return `
            <div style="padding: 20px;">
                <button class="buy-btn" id="save-game-btn" style="width: 100%; margin-bottom: 10px;">
                    💾 ゲームをセーブ
                </button>
                <button class="buy-btn" id="reset-game-btn" style="width: 100%; background: #e74c3c;">
                    🔄 ゲームをリセット
                </button>
            </div>
        `;
    }
    
    setupShopListeners() {
        document.querySelectorAll('.buy-btn[data-item]').forEach(btn => {
            btn.addEventListener('click', () => {
                const itemId = btn.dataset.item;
                const item = this.shopItems.find(i => i.id === itemId);
                
                if (item && this.coins >= item.price) {
                    this.coins -= item.price;
                    this.inventory[itemId] = (this.inventory[itemId] || 0) + 1;
                    this.showNotification(`${item.name}を購入しました！`, 'success');
                    this.showMenu('shop'); // ショップを更新
                    this.updateDisplay();
                }
            });
        });
    }
    
    setupSettingsListeners() {
        document.getElementById('save-game-btn')?.addEventListener('click', () => {
            this.saveGame();
            this.showNotification('セーブしました！', 'success');
        });
        
        document.getElementById('reset-game-btn')?.addEventListener('click', () => {
            if (confirm('本当にリセットしますか？')) {
                this.restart();
            }
        });
    }
    
    updateDisplay() {
        // ペット表示
        document.getElementById('pet-sprite').textContent = this.getCurrentSprite();
        document.getElementById('pet-name').textContent = this.petName;
        document.getElementById('age').textContent = this.age;
        
        // ステータスバー
        Object.keys(this.stats).forEach(stat => {
            const bar = document.getElementById(`${stat}-bar`);
            const value = document.getElementById(`${stat}-value`);
            
            if (bar && value) {
                const percentage = Math.min(100, Math.max(0, this.stats[stat]));
                bar.style.width = `${percentage}%`;
                value.textContent = Math.floor(percentage);
            }
        });
        
        // 環境の更新
        if (this.isSick) {
            document.getElementById('environment').classList.add('sick');
        } else {
            document.getElementById('environment').classList.remove('sick');
        }
        
        // ボタンの有効/無効
        document.getElementById('sleep-btn').querySelector('.btn-label').textContent = 
            this.isSleeping ? 'おきる' : 'ねる';
    }
    
    gameOver(reason) {
        this.isDead = true;
        clearInterval(this.gameTimer);
        clearInterval(this.autoSaveTimer);
        
        let message = '';
        switch(reason) {
            case 'health':
                message = `${this.petName}は病気で天国へ旅立ちました...`;
                break;
            case 'hunger':
                message = `${this.petName}は空腹で天国へ旅立ちました...`;
                break;
            default:
                message = `${this.petName}は天国へ旅立ちました...`;
        }
        
        document.getElementById('game-over-title').textContent = 'さようなら...';
        document.getElementById('game-over-message').textContent = message;
        document.getElementById('final-stats').innerHTML = `
            <p>名前: ${this.petName}</p>
            <p>年齢: ${this.age}日</p>
            <p>成長段階: ${this.stage}</p>
            <p>知能: ${Math.floor(this.stats.intelligence)}</p>
            <p>体力: ${Math.floor(this.stats.strength)}</p>
        `;
        document.getElementById('game-over').style.display = 'flex';
    }
    
    restart() {
        localStorage.removeItem('petSimulatorSave');
        location.reload();
    }
    
    saveGame() {
        const saveData = {
            petName: this.petName,
            age: this.age,
            stage: this.stage,
            stats: this.stats,
            isSleeping: this.isSleeping,
            isSick: this.isSick,
            coins: this.coins,
            inventory: this.inventory,
            gameStartTime: this.gameStartTime,
            timestamp: Date.now()
        };
        
        localStorage.setItem('petSimulatorSave', JSON.stringify(saveData));
    }
    
    loadGame() {
        const saveData = localStorage.getItem('petSimulatorSave');
        
        if (saveData) {
            const data = JSON.parse(saveData);
            
            this.petName = data.petName || 'ペット';
            this.age = data.age || 0;
            this.stage = data.stage || 'egg';
            this.stats = data.stats || this.stats;
            this.isSleeping = data.isSleeping || false;
            this.isSick = data.isSick || false;
            this.coins = data.coins || 100;
            this.inventory = data.inventory || this.inventory;
            this.gameStartTime = data.gameStartTime || Date.now();
            
            // オフライン報酬
            if (data.timestamp) {
                const offlineTime = (Date.now() - data.timestamp) / 1000 / 60; // 分単位
                const offlineCoins = Math.floor(offlineTime * 0.5);
                this.coins += offlineCoins;
                
                if (offlineCoins > 0) {
                    setTimeout(() => {
                        this.showNotification(`オフライン報酬: 💰${offlineCoins}`, 'success');
                    }, 1000);
                }
            }
        }
    }
    
    // ミニゲーム機能
    initMinigame() {
        const minigameBtn = document.getElementById('minigame-btn');
        const minigameScreen = document.getElementById('minigame-screen');
        const startBtn = document.getElementById('start-minigame');
        const closeBtn = document.getElementById('close-minigame');
        const minigameArea = document.getElementById('minigame-area');
        const timerDisplay = document.getElementById('minigame-timer');
        const scoreDisplay = document.getElementById('minigame-score');
        const instructions = document.getElementById('minigame-instructions');
        
        let gameActive = false;
        let gameTimer = null;
        let coinInterval = null;
        let timeLeft = 30;
        let score = 0;
        
        minigameBtn.addEventListener('click', () => {
            if (this.isDead) {
                this.showNotification('ペットが死んでいます', 'error');
                return;
            }
            if (this.isSleeping) {
                this.showNotification('ペットが寝ています', 'warning');
                return;
            }
            minigameScreen.style.display = 'flex';
        });
        
        closeBtn.addEventListener('click', () => {
            if (gameActive) {
                this.endMinigame(false);
            }
            minigameScreen.style.display = 'none';
        });
        
        startBtn.addEventListener('click', () => {
            this.startMinigame();
        });
        
        this.startMinigame = () => {
            gameActive = true;
            timeLeft = 30;
            score = 0;
            scoreDisplay.textContent = score;
            timerDisplay.textContent = timeLeft;
            instructions.style.display = 'none';
            
            // タイマー開始
            gameTimer = setInterval(() => {
                timeLeft--;
                timerDisplay.textContent = timeLeft;
                
                if (timeLeft <= 0) {
                    this.endMinigame(true);
                }
            }, 1000);
            
            // コイン生成
            coinInterval = setInterval(() => {
                if (gameActive) {
                    this.spawnCoin();
                }
            }, 800);
            
            // 最初のコインを即座に生成
            this.spawnCoin();
        };
        
        this.spawnCoin = () => {
            const coin = document.createElement('div');
            coin.className = 'coin-target';
            const isGolden = Math.random() < 0.15; // 15%の確率で金色
            
            if (isGolden) {
                coin.classList.add('golden');
                coin.textContent = '🌟';
            } else {
                coin.textContent = '💰';
            }
            
            // ランダムな位置に配置
            const maxX = minigameArea.offsetWidth - 50;
            const maxY = minigameArea.offsetHeight - 50;
            coin.style.left = Math.random() * maxX + 'px';
            coin.style.top = Math.random() * maxY + 'px';
            
            // クリックイベント
            coin.addEventListener('click', () => {
                const points = isGolden ? 5 : 1;
                score += points;
                scoreDisplay.textContent = score;
                
                // エフェクト表示
                const effect = document.createElement('div');
                effect.textContent = `+${points}`;
                effect.style.position = 'absolute';
                effect.style.left = coin.style.left;
                effect.style.top = coin.style.top;
                effect.style.color = isGolden ? 'gold' : 'white';
                effect.style.fontSize = '24px';
                effect.style.fontWeight = 'bold';
                effect.style.animation = 'floatUp 1s ease-out forwards';
                effect.style.pointerEvents = 'none';
                minigameArea.appendChild(effect);
                
                setTimeout(() => effect.remove(), 1000);
                coin.remove();
            });
            
            minigameArea.appendChild(coin);
            
            // 3秒後に自動削除
            setTimeout(() => {
                if (coin.parentNode) {
                    coin.remove();
                }
            }, 3000);
        };
        
        this.endMinigame = (complete) => {
            gameActive = false;
            clearInterval(gameTimer);
            clearInterval(coinInterval);
            
            // 全てのコインを削除
            const coins = minigameArea.querySelectorAll('.coin-target');
            coins.forEach(coin => coin.remove());
            
            instructions.style.display = 'flex';
            
            if (complete && score > 0) {
                this.coins += score;
                this.showNotification(`ミニゲーム終了！ 💰${score}獲得！`, 'success');
                this.updateDisplay();
                
                // ペットのステータスにも少し影響
                this.stats.happiness = Math.min(100, this.stats.happiness + 10);
                this.stats.energy = Math.max(0, this.stats.energy - 10);
            }
        };
    }
}

// ゲーム開始
window.addEventListener('DOMContentLoaded', () => {
    new PetSimulator();
});