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
            { id: 'cursor', name: 'カーソル', emoji: '👆', baseCost: 15, cps: 0.1, owned: 0 },
            { id: 'grandma', name: 'おばあちゃん', emoji: '👵', baseCost: 100, cps: 1, owned: 0 },
            { id: 'farm', name: '農場', emoji: '🌾', baseCost: 1100, cps: 8, owned: 0 },
            { id: 'mine', name: '鉱山', emoji: '⛏️', baseCost: 12000, cps: 47, owned: 0 },
            { id: 'factory', name: '工場', emoji: '🏭', baseCost: 130000, cps: 260, owned: 0 },
            { id: 'bank', name: '銀行', emoji: '🏦', baseCost: 1400000, cps: 1400, owned: 0 },
            { id: 'temple', name: '寺院', emoji: '🛕', baseCost: 20000000, cps: 7800, owned: 0 },
            { id: 'wizard', name: '魔法使い', emoji: '🧙', baseCost: 330000000, cps: 44000, owned: 0 },
            { id: 'shipment', name: '宇宙船', emoji: '🚀', baseCost: 5100000000, cps: 260000, owned: 0 },
            { id: 'alchemy', name: '錬金術', emoji: '⚗️', baseCost: 75000000000, cps: 1600000, owned: 0 }
        ];
        
        // アップグレードの定義
        this.upgrades = [
            { id: 'doubleClick', name: 'ダブルクリック', desc: 'クリックの効果2倍', cost: 100, multiplier: 2, type: 'click', purchased: false },
            { id: 'reinforcedCursor', name: '強化カーソル', desc: 'カーソルの効率2倍', cost: 500, multiplier: 2, type: 'cursor', purchased: false },
            { id: 'goldenCookie', name: 'ゴールデンクッキー', desc: '全体生産力+10%', cost: 10000, multiplier: 1.1, type: 'global', purchased: false },
            { id: 'sugarRush', name: 'シュガーラッシュ', desc: 'クリックの効果5倍', cost: 50000, multiplier: 5, type: 'click', purchased: false },
            { id: 'cookieFactory', name: 'クッキー工場', desc: '工場の効率3倍', cost: 500000, multiplier: 3, type: 'factory', purchased: false },
            { id: 'timeMachine', name: 'タイムマシン', desc: '全体生産力+20%', cost: 10000000, multiplier: 1.2, type: 'global', purchased: false }
        ];
        
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
        
        // ゲームループの開始
        this.gameLoop();
        
        // 自動セーブの設定（30秒ごと）
        setInterval(() => this.saveGame(true), 30000);
        
        // UIの初期化
        this.updateShop();
        this.updateUpgrades();
        this.updateAchievements();
        
        // セーブデータの読み込み
        this.loadGame();
    }
    
    clickCookie(e) {
        this.cookies += this.cookiesPerClick;
        this.totalCookies += this.cookiesPerClick;
        this.totalClicks++;
        
        // クリックエフェクトの表示
        this.showClickEffect(e);
        
        // UIの更新
        this.updateDisplay();
        this.checkAchievements();
    }
    
    showClickEffect(e) {
        const effect = document.getElementById('click-effect');
        effect.textContent = `+${this.formatNumber(this.cookiesPerClick)}`;
        effect.classList.remove('show');
        void effect.offsetWidth; // リフローを強制
        effect.classList.add('show');
        
        setTimeout(() => {
            effect.classList.remove('show');
        }, 1000);
    }
    
    buyShopItem(itemId) {
        const item = this.shopItems.find(i => i.id === itemId);
        if (!item) return;
        
        const cost = this.getItemCost(item);
        if (this.cookies >= cost) {
            this.cookies -= cost;
            item.owned++;
            this.calculateCPS();
            this.updateDisplay();
            this.updateShop();
            this.checkAchievements();
        }
    }
    
    buyUpgrade(upgradeId) {
        const upgrade = this.upgrades.find(u => u.id === upgradeId);
        if (!upgrade || upgrade.purchased) return;
        
        if (this.cookies >= upgrade.cost) {
            this.cookies -= upgrade.cost;
            upgrade.purchased = true;
            
            // アップグレード効果の適用
            this.applyUpgrade(upgrade);
            
            this.updateDisplay();
            this.updateUpgrades();
            this.checkAchievements();
        }
    }
    
    applyUpgrade(upgrade) {
        switch (upgrade.type) {
            case 'click':
                this.cookiesPerClick *= upgrade.multiplier;
                break;
            case 'global':
                this.calculateCPS();
                break;
            default:
                // 特定アイテムの効率アップ
                const item = this.shopItems.find(i => i.id === upgrade.type);
                if (item) {
                    item.cps *= upgrade.multiplier;
                    this.calculateCPS();
                }
                break;
        }
    }
    
    getItemCost(item) {
        return Math.floor(item.baseCost * Math.pow(1.15, item.owned));
    }
    
    calculateCPS() {
        let cps = 0;
        for (const item of this.shopItems) {
            cps += item.cps * item.owned;
        }
        
        // グローバルアップグレードの適用
        const globalUpgrades = this.upgrades.filter(u => u.type === 'global' && u.purchased);
        for (const upgrade of globalUpgrades) {
            cps *= upgrade.multiplier;
        }
        
        this.cookiesPerSecond = cps;
    }
    
    gameLoop() {
        setInterval(() => {
            if (this.cookiesPerSecond > 0) {
                const production = this.cookiesPerSecond / 10; // 100ms = 0.1秒
                this.cookies += production;
                this.totalCookies += production;
                this.updateDisplay();
                this.checkAchievements();
            }
        }, 100);
    }
    
    updateDisplay() {
        document.getElementById('cookies').textContent = this.formatNumber(Math.floor(this.cookies));
        document.getElementById('cps').textContent = this.formatNumber(this.cookiesPerSecond.toFixed(1));
    }
    
    updateShop() {
        const shopContainer = document.getElementById('shop-items');
        shopContainer.innerHTML = '';
        
        for (const item of this.shopItems) {
            const cost = this.getItemCost(item);
            const canAfford = this.cookies >= cost;
            
            const shopItemEl = document.createElement('div');
            shopItemEl.className = `shop-item ${canAfford ? '' : 'disabled'}`;
            shopItemEl.innerHTML = `
                <div class="item-info">
                    <div class="item-name">${item.emoji} ${item.name}</div>
                    <div class="item-cost">💰 ${this.formatNumber(cost)}</div>
                    <div class="item-production">📈 +${this.formatNumber(item.cps)}/秒</div>
                </div>
                <div class="item-owned">${item.owned}</div>
            `;
            
            if (canAfford) {
                shopItemEl.addEventListener('click', () => this.buyShopItem(item.id));
            }
            
            shopContainer.appendChild(shopItemEl);
        }
    }
    
    updateUpgrades() {
        const upgradesContainer = document.getElementById('upgrades');
        upgradesContainer.innerHTML = '';
        
        const availableUpgrades = this.upgrades.filter(u => !u.purchased);
        
        for (const upgrade of availableUpgrades) {
            const canAfford = this.cookies >= upgrade.cost;
            
            const upgradeEl = document.createElement('div');
            upgradeEl.className = `upgrade-item ${canAfford ? '' : 'disabled'}`;
            upgradeEl.innerHTML = `
                <div class="item-info">
                    <div class="item-name">⚡ ${upgrade.name}</div>
                    <div class="item-desc">${upgrade.desc}</div>
                    <div class="item-cost">💰 ${this.formatNumber(upgrade.cost)}</div>
                </div>
            `;
            
            if (canAfford) {
                upgradeEl.addEventListener('click', () => this.buyUpgrade(upgrade.id));
            }
            
            upgradesContainer.appendChild(upgradeEl);
        }
    }
    
    updateAchievements() {
        const achievementsContainer = document.getElementById('achievements');
        achievementsContainer.innerHTML = '';
        
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
        num = parseFloat(num);
        if (num >= 1e12) return (num / 1e12).toFixed(2) + '兆';
        if (num >= 1e8) return (num / 1e8).toFixed(2) + '億';
        if (num >= 1e4) return (num / 1e4).toFixed(2) + '万';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
        return Math.floor(num).toString();
    }
    
    saveGame(auto = false) {
        const saveData = {
            cookies: this.cookies,
            cookiesPerClick: this.cookiesPerClick,
            cookiesPerSecond: this.cookiesPerSecond,
            totalCookies: this.totalCookies,
            totalClicks: this.totalClicks,
            shopItems: this.shopItems,
            upgrades: this.upgrades,
            achievements: this.achievements,
            lastSave: Date.now()
        };
        
        localStorage.setItem('cookieClickerSave', JSON.stringify(saveData));
        
        if (!auto) {
            const status = document.getElementById('save-status');
            status.textContent = 'セーブ完了！';
            status.classList.add('show');
            setTimeout(() => {
                status.classList.remove('show');
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
                this.shopItems = data.shopItems;
            }
            
            if (data.upgrades) {
                this.upgrades = data.upgrades;
            }
            
            if (data.achievements) {
                this.achievements = data.achievements;
            }
            
            // オフライン時の生産を計算
            if (data.lastSave) {
                const offlineTime = (Date.now() - data.lastSave) / 1000; // 秒単位
                const offlineProduction = this.cookiesPerSecond * offlineTime * 0.1; // オフライン時は10%の効率
                this.cookies += offlineProduction;
                this.totalCookies += offlineProduction;
            }
            
            this.calculateCPS();
            this.updateDisplay();
            this.updateShop();
            this.updateUpgrades();
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