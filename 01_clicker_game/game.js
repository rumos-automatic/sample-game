// ゲーム状態の管理
class Game {
    constructor() {
        this.cookies = 0;
        this.cookiesPerClick = 1;
        this.cookiesPerSecond = 0;
        this.totalCookies = 0;
        this.totalClicks = 0;
        
        // ショップアイテムの定義
        this.shopItems = [
            { id: 'cursor', name: 'カーソル', emoji: '👆', baseCost: 15, baseCps: 1, cps: 1, clickPower: 1, owned: 0, level: 1, maxLevel: 5, category: 'basic' },
            { id: 'grandma', name: 'おばあちゃん', emoji: '👵', baseCost: 100, baseCps: 5, cps: 5, clickPower: 2, owned: 0, level: 1, maxLevel: 5, category: 'basic' },
            { id: 'farm', name: '農場', emoji: '🌾', baseCost: 500, baseCps: 20, cps: 20, clickPower: 5, owned: 0, level: 1, maxLevel: 5, category: 'basic' },
            { id: 'mine', name: '鉱山', emoji: '⛏️', baseCost: 2000, baseCps: 100, cps: 100, clickPower: 10, owned: 0, level: 1, maxLevel: 5, category: 'industry' },
            { id: 'factory', name: '工場', emoji: '🏭', baseCost: 10000, baseCps: 500, cps: 500, clickPower: 25, owned: 0, level: 1, maxLevel: 5, category: 'industry' },
            { id: 'bank', name: '銀行', emoji: '🏦', baseCost: 50000, baseCps: 2000, cps: 2000, clickPower: 50, owned: 0, level: 1, maxLevel: 5, category: 'industry' },
            { id: 'temple', name: '寺院', emoji: '🛕', baseCost: 200000, baseCps: 10000, cps: 10000, clickPower: 100, owned: 0, level: 1, maxLevel: 5, category: 'magic' },
            { id: 'wizard', name: '魔法使い', emoji: '🧙', baseCost: 1000000, baseCps: 50000, cps: 50000, clickPower: 250, owned: 0, level: 1, maxLevel: 5, category: 'magic' },
            { id: 'shipment', name: '宇宙船', emoji: '🚀', baseCost: 10000000, baseCps: 300000, cps: 300000, clickPower: 500, owned: 0, level: 1, maxLevel: 5, category: 'magic' },
            { id: 'alchemy', name: '錬金術', emoji: '⚗️', baseCost: 100000000, baseCps: 2000000, cps: 2000000, clickPower: 1000, owned: 0, level: 1, maxLevel: 5, category: 'magic' }
        ];
        
        this.currentTab = 'basic';
        
        // 実績の定義
        this.achievements = [
            { id: 'firstCookie', name: '最初の一歩', desc: '初めてクリック', icon: '🎯', condition: () => this.totalClicks >= 1, unlocked: false },
            { id: 'baker', name: 'パン職人', desc: '100個のクッキー', icon: '👨‍🍳', condition: () => this.totalCookies >= 100, unlocked: false },
            { id: 'cookieMonster', name: 'クッキーモンスター', desc: '10,000個のクッキー', icon: '👹', condition: () => this.totalCookies >= 10000, unlocked: false },
            { id: 'clickMaster', name: 'クリックマスター', desc: '1000回クリック', icon: '👆', condition: () => this.totalClicks >= 1000, unlocked: false },
            { id: 'entrepreneur', name: '起業家', desc: '全種類の施設を所有', icon: '💼', condition: () => this.shopItems.every(item => item.owned > 0), unlocked: false },
            { id: 'millionaire', name: '百万長者', desc: '100万個のクッキー', icon: '💰', condition: () => this.totalCookies >= 1000000, unlocked: false },
            { id: 'billionaire', name: '億万長者', desc: '10億個のクッキー', icon: '🤑', condition: () => this.totalCookies >= 1000000000, unlocked: false },
            { id: 'speedDemon', name: 'スピード狂', desc: '秒間100個生産', icon: '⚡', condition: () => this.cookiesPerSecond >= 100, unlocked: false }
        ];
        
        this.lastSave = Date.now();
        this.init();
    }
    
    init() {
        // イベントリスナーの設定
        document.getElementById('cookie-btn').addEventListener('click', (e) => this.clickCookie(e));
        document.getElementById('save-btn').addEventListener('click', () => this.saveGame());
        document.getElementById('reset-btn').addEventListener('click', () => this.resetGame());
        
        // メインタブのイベントリスナー
        document.querySelectorAll('.main-tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.main-tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                
                // すべてのタブコンテンツを非表示
                document.querySelectorAll('.tab-content').forEach(content => {
                    content.style.display = 'none';
                });
                
                // 選択されたタブを表示
                const tabName = btn.dataset.tab;
                document.getElementById(`${tabName}-content`).style.display = 'flex';
                
                // 実績タブが選択された時は実績を更新
                if (tabName === 'achievements') {
                    this.updateAchievements();
                }
            });
        });
        
        // ショップタブのイベントリスナー
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                this.currentTab = btn.dataset.tab;
                this.updateShop();
            });
        });
        
        // ゲームループの開始
        this.gameLoop();
        
        // 自動セーブの設定（30秒ごと）
        setInterval(() => this.saveGame(true), 30000);
        
        // UIの初期化
        this.calculateClickPower();
        this.updateShop();
        this.updateAchievements();
        
        // セーブデータの読み込み
        this.loadGame();
    }
    
    clickCookie(e) {
        this.cookies += this.cookiesPerClick;
        this.totalCookies += this.cookiesPerClick;
        this.totalClicks++;
        
        console.log(`クリック: 総クリック=${this.totalClicks}, 総クッキー=${this.totalCookies}`);
        
        // クリックエフェクトの表示
        this.showClickEffect(e);
        
        // UIの更新
        this.updateDisplay();
        this.checkAchievements();
    }
    
    showClickEffect(e) {
        const effect = document.getElementById('click-effect');
        const button = document.getElementById('cookie-btn');
        
        effect.textContent = `+${this.formatNumber(this.cookiesPerClick)}`;
        effect.classList.remove('show');
        button.classList.remove('clicked');
        
        void effect.offsetWidth; // リフローを強制
        
        effect.classList.add('show');
        button.classList.add('clicked');
        
        setTimeout(() => {
            effect.classList.remove('show');
            button.classList.remove('clicked');
        }, 500);
    }
    
    buyShopItem(itemId) {
        const item = this.shopItems.find(i => i.id === itemId);
        if (!item) return;
        
        const cost = this.getItemCost(item);
        console.log(`購入試行: ${item.name}, コスト: ${cost}, 所持: ${this.cookies}, 購入可能: ${this.cookies >= cost}`);
        
        if (this.cookies >= cost) {
            this.cookies -= cost;
            item.owned++;
            this.calculateCPS();
            this.calculateClickPower();
            this.updateDisplay();
            this.updateShop();
            this.checkAchievements();
            console.log(`購入成功: ${item.name}, 残り: ${this.cookies}`);
        } else {
            console.log(`購入失敗: 資金不足`);
        }
    }
    
    upgradeShopItem(itemId) {
        const item = this.shopItems.find(i => i.id === itemId);
        if (!item || item.level >= item.maxLevel) return;
        
        const cost = this.getUpgradeCost(item);
        if (this.cookies >= cost) {
            this.cookies -= cost;
            item.level++;
            // レベルアップでCPSを2倍にする（整数のみ）
            item.cps = item.baseCps * (1 << (item.level - 1)); // ビットシフトで2のべき乗
            this.calculateCPS();
            this.calculateClickPower();
            this.updateDisplay();
            this.updateShop();
            this.checkAchievements();
        }
    }
    
    
    getItemCost(item) {
        // コスト上昇率を単純化: 1.15の代わりに所有数*15%を加算
        return item.baseCost + Math.floor(item.baseCost * item.owned * 0.15);
    }
    
    getUpgradeCost(item) {
        // アップグレードコスト：基本コスト × 10 × レベル × レベル
        return item.baseCost * 10 * item.level * item.level;
    }
    
    calculateCPS() {
        let cps = 0;
        for (const item of this.shopItems) {
            cps += item.cps * item.owned;
        }
        
        this.cookiesPerSecond = cps;
    }
    
    calculateClickPower() {
        let clickPower = 1;
        for (const item of this.shopItems) {
            if (item.clickPower) {
                // レベルボーナス: レベル1=1倍, レベル2=2倍, レベル3=3倍...
                clickPower += item.clickPower * item.owned * item.level;
            }
        }
        this.cookiesPerClick = clickPower;
    }
    
    gameLoop() {
        setInterval(() => {
            if (this.cookiesPerSecond > 0) {
                // 1秒ごとに更新
                this.cookies += this.cookiesPerSecond;
                this.totalCookies += this.cookiesPerSecond;
                this.updateDisplay();
                this.checkAchievements();
            }
        }, 1000);
    }
    
    updateDisplay() {
        document.getElementById('cookies').textContent = this.formatNumber(Math.floor(this.cookies));
        document.getElementById('cps').textContent = this.formatNumber(this.cookiesPerSecond);
    }
    
    updateShop() {
        const shopContainer = document.getElementById('shop-items');
        shopContainer.innerHTML = '';
        
        // 現在のタブでアイテムをフィルタリング
        const filteredItems = this.shopItems.filter(item => item.category === this.currentTab);
        
        for (const item of filteredItems) {
            const cost = this.getItemCost(item);
            const upgradeCost = this.getUpgradeCost(item);
            const canAfford = this.cookies >= cost;
            const canUpgrade = this.cookies >= upgradeCost && item.level < item.maxLevel;
            
            const shopItemEl = document.createElement('div');
            shopItemEl.className = 'shop-item-container';
            
            // レベル表示用の星
            const stars = '⭐'.repeat(item.level) + '☆'.repeat(item.maxLevel - item.level);
            
            shopItemEl.innerHTML = `
                <div class="shop-item ${canAfford ? '' : 'disabled'}">
                    <div class="item-info">
                        <div class="item-name">${item.emoji} ${item.name} <span class="item-level">${stars}</span></div>
                        <div class="item-cost">💰 コスト: ${this.formatNumber(cost)}</div>
                        <div class="item-production">📈 生産: +${this.formatNumber(item.cps)}/秒</div>
                        <div class="item-click-power">👆 クリック: +${this.formatNumber(item.clickPower * item.level)}</div>
                    </div>
                    <div class="item-owned">${item.owned}</div>
                </div>
                ${item.level < item.maxLevel ? `
                    <button class="upgrade-btn ${canUpgrade ? '' : 'disabled'}">
                        <span class="upgrade-icon">⬆️</span>
                        <span class="upgrade-text">レベル${item.level + 1}へ</span>
                        <span class="upgrade-cost">💰 ${this.formatNumber(upgradeCost)}</span>
                    </button>
                ` : `
                    <div class="max-level">MAX LEVEL!</div>
                `}
            `;
            
            const shopItem = shopItemEl.querySelector('.shop-item');
            shopItem.addEventListener('click', () => this.buyShopItem(item.id));
            
            const upgradeBtn = shopItemEl.querySelector('.upgrade-btn');
            if (upgradeBtn) {
                upgradeBtn.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.upgradeShopItem(item.id);
                });
            }
            
            shopContainer.appendChild(shopItemEl);
        }
    }
    
    
    updateAchievements() {
        const achievementsContainer = document.getElementById('achievements');
        if (!achievementsContainer) {
            console.warn('実績コンテナが見つかりません');
            return;
        }
        
        achievementsContainer.innerHTML = '';
        console.log('実績更新中:', this.achievements.map(a => ({name: a.name, unlocked: a.unlocked})));
        
        for (const achievement of this.achievements) {
            const achievementEl = document.createElement('div');
            achievementEl.className = `achievement ${achievement.unlocked ? 'unlocked' : ''}`;
            achievementEl.innerHTML = `
                <div class="achievement-icon">${achievement.unlocked ? achievement.icon : '❓'}</div>
                <div class="achievement-name">${achievement.unlocked ? achievement.name : '???'}</div>
                <div class="achievement-desc">${achievement.unlocked ? achievement.desc : '未解放'}</div>
            `;
            
            achievementsContainer.appendChild(achievementEl);
        }
    }
    
    checkAchievements() {
        let newUnlock = false;
        
        for (const achievement of this.achievements) {
            if (!achievement.unlocked && achievement.condition()) {
                achievement.unlocked = true;
                newUnlock = true;
                this.showAchievementNotification(achievement);
                console.log(`✅ 実績解除: ${achievement.name}`);
            }
        }
        
        if (newUnlock) {
            this.updateAchievements();
        }
    }
    
    showAchievementNotification(achievement) {
        // 実績解除の通知（簡易版）
        console.log(`🎉 実績解除: ${achievement.name} - ${achievement.desc}`);
    }
    
    formatNumber(num) {
        num = Math.floor(parseFloat(num));
        // すべてカンマ区切りで表示（動きが見える）
        return num.toLocaleString('ja-JP');
    }
    
    saveGame(auto = false) {
        const saveData = {
            cookies: this.cookies,
            cookiesPerClick: this.cookiesPerClick,
            cookiesPerSecond: this.cookiesPerSecond,
            totalCookies: this.totalCookies,
            totalClicks: this.totalClicks,
            shopItems: this.shopItems,
            achievements: this.achievements,
            lastSave: Date.now()
        };
        
        localStorage.setItem('cookieClickerSave', JSON.stringify(saveData));
        
        if (!auto) {
            const status = document.getElementById('save-status');
            status.textContent = '✅ セーブ完了！';
            status.style.color = '#28a745';
            status.style.fontSize = '1.2em';
            status.style.fontWeight = 'bold';
            setTimeout(() => {
                status.textContent = '';
            }, 2000);
        }
    }
    
    loadGame() {
        const saveData = localStorage.getItem('cookieClickerSave');
        if (saveData) {
            const data = JSON.parse(saveData);
            
            this.cookies = data.cookies || 0;
            this.cookiesPerClick = data.cookiesPerClick || 1;
            this.cookiesPerSecond = data.cookiesPerSecond || 0;
            this.totalCookies = data.totalCookies || 0;
            this.totalClicks = data.totalClicks || 0;
            
            if (data.shopItems) {
                // 古いセーブデータとの互換性を保つ
                for (let i = 0; i < this.shopItems.length; i++) {
                    if (data.shopItems[i]) {
                        this.shopItems[i].owned = data.shopItems[i].owned || 0;
                        this.shopItems[i].level = data.shopItems[i].level || 1;
                        // CPSをレベルに応じて再計算（整数のみ）
                        this.shopItems[i].cps = this.shopItems[i].baseCps * (1 << (this.shopItems[i].level - 1));
                    }
                }
            }
            
            // クリック力を再計算
            this.calculateClickPower();
            
            if (data.achievements) {
                // 実績のunlocked状態のみを復元（condition関数は保持）
                for (let i = 0; i < this.achievements.length; i++) {
                    if (data.achievements[i] && typeof data.achievements[i] === 'object') {
                        // セーブデータから安全にunlocked状態のみを復元
                        this.achievements[i].unlocked = Boolean(data.achievements[i].unlocked);
                    }
                }
                console.log('実績データ復元完了:', this.achievements.map(a => ({name: a.name, unlocked: a.unlocked, hasCondition: typeof a.condition === 'function'})));
            }
            
            // オフライン時の生産を計算
            if (data.lastSave) {
                const offlineTime = Math.floor((Date.now() - data.lastSave) / 1000); // 秒単位
                const offlineProduction = Math.floor(this.cookiesPerSecond * offlineTime / 10); // オフライン時は10%の効率
                this.cookies += offlineProduction;
                this.totalCookies += offlineProduction;
            }
            
            this.calculateCPS();
            this.updateDisplay();
            this.updateShop();
            this.updateAchievements();
        }
    }
    
    resetGame() {
        if (confirm('本当にリセットしますか？すべての進行状況が失われます。')) {
            localStorage.removeItem('cookieClickerSave');
            location.reload();
        }
    }
}

// ゲームの開始
window.addEventListener('DOMContentLoaded', () => {
    new Game();
});