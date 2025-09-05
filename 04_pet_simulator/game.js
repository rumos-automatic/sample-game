class PetSimulator {
    constructor() {
        // ペットの基本情報
        this.petName = 'ペット';
        this.age = 0;
        this.stage = 'egg'; // egg, baby, child, teen, adult
        this.species = null;
        
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
        
        // 年齢の増加（10秒で1日）
        if (Math.floor(Date.now() / 10000) > this.age) {
            this.age = Math.floor(Date.now() / 10000);
            this.coins += 10; // 日給
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
        if (this.isDead || this.isSleeping) return;
        
        if (this.inventory.food > 0) {
            this.inventory.food--;
            this.stats.hunger = Math.min(100, this.stats.hunger + 30);
            this.stats.happiness = Math.min(100, this.stats.happiness + 10);
            
            this.showPetAnimation('eating');
            this.showEffect('🍖');
            this.showNotification('おいしい！', 'success');
        } else {
            this.showNotification('食べ物がありません！', 'error');
        }
        
        this.updateDisplay();
    }
    
    play() {
        if (this.isDead || this.isSleeping || this.stats.energy < 20) {
            if (this.stats.energy < 20) {
                this.showNotification('疲れています...', 'warning');
            }
            return;
        }
        
        if (this.inventory.toy > 0) {
            this.inventory.toy--;
            this.stats.happiness = Math.min(100, this.stats.happiness + 40);
            this.stats.energy = Math.max(0, this.stats.energy - 20);
            this.stats.strength += 1;
            
            this.showPetAnimation('happy');
            this.showEffect('⚽');
            this.showNotification('楽しい！', 'success');
        } else {
            this.showNotification('おもちゃがありません！', 'error');
        }
        
        this.updateDisplay();
    }
    
    clean() {
        if (this.isDead) return;
        
        if (this.inventory.soap > 0) {
            this.inventory.soap--;
            this.stats.cleanliness = 100;
            this.stats.happiness = Math.min(100, this.stats.happiness + 15);
            
            this.showEffect('🫧');
            this.showNotification('きれいになった！', 'success');
        } else {
            this.showNotification('せっけんがありません！', 'error');
        }
        
        this.updateDisplay();
    }
    
    sleep() {
        if (this.isDead) return;
        
        this.isSleeping = !this.isSleeping;
        
        if (this.isSleeping) {
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
        if (this.isDead) return;
        
        if (this.inventory.medicine > 0) {
            this.inventory.medicine--;
            this.stats.health = Math.min(100, this.stats.health + 50);
            this.isSick = false;
            
            document.getElementById('environment').classList.remove('sick');
            this.showEffect('💊');
            this.showNotification('元気になった！', 'success');
        } else {
            this.showNotification('薬がありません！', 'error');
        }
        
        this.updateDisplay();
    }
    
    train() {
        if (this.isDead || this.isSleeping || this.stats.energy < 30) {
            if (this.stats.energy < 30) {
                this.showNotification('疲れています...', 'warning');
            }
            return;
        }
        
        this.stats.discipline = Math.min(100, this.stats.discipline + 10);
        this.stats.intelligence += 2;
        this.stats.energy = Math.max(0, this.stats.energy - 30);
        this.stats.happiness = Math.max(0, this.stats.happiness - 10);
        
        this.showEffect('📚');
        this.showNotification('賢くなった！', 'success');
        
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
    }
    
    showMenu(menuType) {
        const content = document.getElementById('menu-content');
        content.style.display = 'block';
        
        switch(menuType) {
            case 'status':
                content.innerHTML = this.getStatusHTML();
                break;
            case 'items':
                content.innerHTML = this.getInventoryHTML();
                break;
            case 'shop':
                content.innerHTML = this.getShopHTML();
                this.setupShopListeners();
                break;
            case 'settings':
                content.innerHTML = this.getSettingsHTML();
                this.setupSettingsListeners();
                break;
        }
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
}

// ゲーム開始
window.addEventListener('DOMContentLoaded', () => {
    new PetSimulator();
});