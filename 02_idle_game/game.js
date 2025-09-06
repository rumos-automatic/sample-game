class IdleRPG {
    constructor() {
        // ゲームの基本状態
        this.gold = 0;
        this.gems = 0;
        this.level = 1;
        this.exp = 0;
        this.expToNext = 100;
        
        // ヒーローのステータス
        this.hero = {
            maxHp: 100,
            currentHp: 100,
            attack: 10,
            defense: 5,
            speed: 1.0,
            critChance: 0.1,
            critDamage: 2.0
        };
        
        // 装備レベル
        this.equipment = {
            weapon: 1,
            armor: 1,
            accessory: 1,
            boots: 1
        };
        
        // スキル
        this.skills = {
            powerStrike: { level: 1, cooldown: 0, maxCooldown: 10 },
            heal: { level: 1, cooldown: 0, maxCooldown: 15 },
            berserk: { level: 1, cooldown: 0, maxCooldown: 30 },
            goldRush: { level: 1, cooldown: 0, maxCooldown: 60 }
        };
        
        // ステージ情報
        this.currentStage = 1;
        this.currentWave = 1;
        this.enemiesDefeated = 0;
        this.enemiesPerWave = 10;
        
        // 現在の敵
        this.currentEnemy = null;
        
        // インベントリ
        this.inventory = [];
        
        // ゲーム設定
        this.gameSpeed = 1;
        this.isPaused = false;
        this.autoSkills = true;
        this.currentUpgradeTab = 'equipment';
        
        // ステータスアップグレードのコスト管理
        this.statUpgradeCosts = {
            maxHp: 500,
            attack: 300,
            defense: 250,
            critChance: 1000
        };
        
        // 敵の種類
        this.enemyTypes = [
            { name: 'ゴブリン', sprite: '👺', hp: 50, attack: 5, defense: 2, gold: 10, exp: 5 },
            { name: 'スライム', sprite: '🟢', hp: 30, attack: 3, defense: 1, gold: 5, exp: 3 },
            { name: 'オーク', sprite: '👹', hp: 100, attack: 12, defense: 5, gold: 25, exp: 10 },
            { name: 'ドラゴン', sprite: '🐲', hp: 500, attack: 50, defense: 20, gold: 200, exp: 50, isBoss: true },
            { name: 'スケルトン', sprite: '💀', hp: 75, attack: 8, defense: 3, gold: 15, exp: 7 },
            { name: 'ゴースト', sprite: '👻', hp: 60, attack: 10, defense: 1, gold: 20, exp: 8 },
            { name: 'デーモン', sprite: '👿', hp: 300, attack: 30, defense: 15, gold: 100, exp: 30, isBoss: true }
        ];
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.spawnEnemy();
        this.startGameLoop();
        this.loadGame();
        this.updateDisplay();
        
        // 初期タブ表示（DOM読み込み完了後）
        setTimeout(() => {
            this.showUpgradeTab(this.currentUpgradeTab);
        }, 100);
    }
    
    setupEventListeners() {
        // スキルボタン
        document.querySelectorAll('.skill').forEach(skill => {
            skill.addEventListener('click', () => {
                const skillName = skill.dataset.skill;
                this.useSkill(skillName);
            });
        });
        
        // 装備アップグレード
        document.querySelectorAll('.equipment-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                const slotType = slot.dataset.slot;
                this.upgradeEquipment(slotType);
            });
        });
        
        // タブ切り替え
        document.querySelectorAll('.tab-button').forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.tab-button').forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.currentUpgradeTab = tab.dataset.tab;
                this.showUpgradeTab(this.currentUpgradeTab);
            });
        });
        
        // ボス戦ボタン
        document.getElementById('boss-button').addEventListener('click', () => {
            this.startBossBattle();
        });
        
        // ゲーム速度
        document.getElementById('speed-select').addEventListener('change', (e) => {
            this.gameSpeed = parseFloat(e.target.value);
        });
        
        // セーブ/ロード/リセット
        document.getElementById('save-button').addEventListener('click', () => this.saveGame());
        document.getElementById('load-button').addEventListener('click', () => this.loadGame());
        document.getElementById('reset-button').addEventListener('click', () => this.resetGame());
        document.getElementById('pause-button').addEventListener('click', () => this.togglePause());
    }
    
    startGameLoop() {
        // バトルループ
        setInterval(() => {
            if (!this.isPaused) {
                this.battleTick();
            }
        }, 1000 / this.gameSpeed);
        
        // スキルクールダウン
        setInterval(() => {
            if (!this.isPaused) {
                this.updateSkillCooldowns();
            }
        }, 1000);
        
        // オートセーブ
        setInterval(() => {
            this.saveGame(true);
        }, 30000);
    }
    
    battleTick() {
        if (!this.currentEnemy) {
            this.spawnEnemy();
            return;
        }
        
        // ヒーローの攻撃
        const damage = this.calculateDamage(this.hero.attack, this.currentEnemy.defense);
        this.dealDamageToEnemy(damage);
        
        // 敵が生きていれば反撃
        if (this.currentEnemy && this.currentEnemy.currentHp > 0) {
            const enemyDamage = this.calculateDamage(this.currentEnemy.attack, this.hero.defense);
            this.dealDamageToHero(enemyDamage);
        }
        
        // オートスキル
        if (this.autoSkills) {
            this.useAutoSkills();
        }
    }
    
    calculateDamage(attack, defense) {
        const baseDamage = Math.max(1, attack - defense);
        const variance = 0.8 + Math.random() * 0.4; // 80% ~ 120%
        
        // クリティカル判定
        const isCrit = Math.random() < this.hero.critChance;
        const critMultiplier = isCrit ? this.hero.critDamage : 1;
        
        return Math.floor(baseDamage * variance * critMultiplier);
    }
    
    dealDamageToEnemy(damage) {
        if (!this.currentEnemy) return;
        
        this.currentEnemy.currentHp -= damage;
        this.showDamageNumber(damage, false);
        
        if (this.currentEnemy.currentHp <= 0) {
            this.defeatEnemy();
        }
        
        this.updateEnemyDisplay();
    }
    
    dealDamageToHero(damage) {
        this.hero.currentHp = Math.max(0, this.hero.currentHp - damage);
        
        if (this.hero.currentHp <= 0) {
            this.heroDeath();
        }
        
        this.updateHeroDisplay();
    }
    
    defeatEnemy() {
        if (!this.currentEnemy) return;
        
        // 報酬を獲得
        this.gold += this.currentEnemy.gold;
        this.gainExp(this.currentEnemy.exp);
        
        // ドロップ判定
        if (Math.random() < 0.3) {
            this.addItemToInventory(this.generateRandomItem());
        }
        
        // 進行状況を更新
        this.enemiesDefeated++;
        
        if (this.enemiesDefeated >= this.enemiesPerWave) {
            this.completeWave();
        } else {
            this.currentEnemy = null;
            setTimeout(() => this.spawnEnemy(), 500);
        }
        
        this.updateDisplay();
        this.updateStageProgress();
    }
    
    completeWave() {
        this.currentWave++;
        this.enemiesDefeated = 0;
        
        if (this.currentWave > 10) {
            this.currentStage++;
            this.currentWave = 1;
            this.enemiesPerWave = Math.min(20, 10 + Math.floor(this.currentStage / 5));
        }
        
        // ボーナス報酬
        this.gold += this.currentStage * 50;
        this.gems += Math.floor(this.currentStage / 5);
        
        this.currentEnemy = null;
        setTimeout(() => this.spawnEnemy(), 1000);
    }
    
    spawnEnemy() {
        const stageMultiplier = 1 + (this.currentStage - 1) * 0.2;
        let enemyTemplate;
        
        // ボス出現判定
        if (this.currentWave === 10) {
            const bosses = this.enemyTypes.filter(e => e.isBoss);
            enemyTemplate = bosses[Math.floor(Math.random() * bosses.length)];
        } else {
            const normalEnemies = this.enemyTypes.filter(e => !e.isBoss);
            enemyTemplate = normalEnemies[Math.floor(Math.random() * normalEnemies.length)];
        }
        
        this.currentEnemy = {
            ...enemyTemplate,
            maxHp: Math.floor(enemyTemplate.hp * stageMultiplier),
            currentHp: Math.floor(enemyTemplate.hp * stageMultiplier),
            attack: Math.floor(enemyTemplate.attack * stageMultiplier),
            defense: Math.floor(enemyTemplate.defense * stageMultiplier),
            gold: Math.floor(enemyTemplate.gold * stageMultiplier),
            exp: Math.floor(enemyTemplate.exp * stageMultiplier)
        };
        
        this.updateEnemyDisplay();
    }
    
    useSkill(skillName) {
        const skill = this.skills[skillName];
        if (!skill || skill.cooldown > 0) return;
        
        switch (skillName) {
            case 'powerStrike':
                const damage = this.hero.attack * 3 * skill.level;
                this.dealDamageToEnemy(damage);
                break;
            
            case 'heal':
                const healAmount = this.hero.maxHp * 0.3 * skill.level;
                this.hero.currentHp = Math.min(this.hero.maxHp, this.hero.currentHp + healAmount);
                this.showDamageNumber(healAmount, true);
                this.updateHeroDisplay();
                break;
            
            case 'berserk':
                // 一時的に攻撃力を上昇
                const originalAttack = this.hero.attack;
                this.hero.attack *= 2 * skill.level;
                setTimeout(() => {
                    this.hero.attack = originalAttack;
                }, 5000);
                break;
            
            case 'goldRush':
                // 次の10体の敵からのゴールド2倍
                // 簡略化のため即座にボーナスゴールドを付与
                this.gold += this.currentStage * 100 * skill.level;
                this.updateDisplay();
                break;
        }
        
        skill.cooldown = skill.maxCooldown;
        this.updateSkillDisplay();
    }
    
    useAutoSkills() {
        // HPが50%以下なら回復
        if (this.hero.currentHp < this.hero.maxHp * 0.5 && this.skills.heal.cooldown === 0) {
            this.useSkill('heal');
        }
        
        // パワーストライクを使用可能なら使う
        if (this.skills.powerStrike.cooldown === 0) {
            this.useSkill('powerStrike');
        }
    }
    
    updateSkillCooldowns() {
        Object.keys(this.skills).forEach(skillName => {
            const skill = this.skills[skillName];
            if (skill.cooldown > 0) {
                skill.cooldown--;
            }
        });
        this.updateSkillDisplay();
    }
    
    upgradeEquipment(type) {
        const cost = this.getUpgradeCost(type, this.equipment[type]);
        
        if (this.gold >= cost) {
            this.gold -= cost;
            this.equipment[type]++;
            
            // ステータスを更新
            switch (type) {
                case 'weapon':
                    this.hero.attack += 5;
                    break;
                case 'armor':
                    this.hero.defense += 3;
                    this.hero.maxHp += 20;
                    this.hero.currentHp += 20;
                    break;
                case 'accessory':
                    this.hero.critChance += 0.02;
                    this.hero.critDamage += 0.1;
                    break;
                case 'boots':
                    this.hero.speed += 0.1;
                    break;
            }
            
            this.updateDisplay();
            this.updateEquipmentDisplay();
            
            // アップグレードタブが装備タブの場合、表示を更新
            if (this.currentUpgradeTab === 'equipment') {
                this.showUpgradeTab('equipment');
            }
        }
    }
    
    getUpgradeCost(type, level) {
        const baseCosts = {
            weapon: 100,
            armor: 150,
            accessory: 200,
            boots: 120
        };
        return Math.floor(baseCosts[type] * Math.pow(1.5, level - 1));
    }
    
    gainExp(amount) {
        this.exp += amount;
        
        while (this.exp >= this.expToNext) {
            this.exp -= this.expToNext;
            this.levelUp();
        }
        
        this.updateDisplay();
    }
    
    levelUp() {
        this.level++;
        this.expToNext = Math.floor(100 * Math.pow(1.5, this.level - 1));
        
        // ステータス上昇
        this.hero.maxHp += 10;
        this.hero.currentHp = this.hero.maxHp;
        this.hero.attack += 2;
        this.hero.defense += 1;
        
        // レベルアップボーナス
        this.gems += this.level;
        
        this.updateDisplay();
    }
    
    heroDeath() {
        // 死亡ペナルティ（ゴールドの10%を失う）
        this.gold = Math.floor(this.gold * 0.9);
        
        // 復活
        this.hero.currentHp = this.hero.maxHp;
        
        // 敵をリセット
        this.currentEnemy = null;
        
        this.updateDisplay();
    }
    
    startBossBattle() {
        if (this.currentWave !== 10) {
            this.currentWave = 10;
            this.enemiesDefeated = this.enemiesPerWave - 1;
            this.currentEnemy = null;
            this.spawnEnemy();
        }
    }
    
    showUpgradeTab(tabName) {
        const content = document.getElementById('upgrade-content');
        content.innerHTML = '';
        
        switch (tabName) {
            case 'equipment':
                Object.keys(this.equipment).forEach(type => {
                    const cost = this.getUpgradeCost(type, this.equipment[type]);
                    const item = document.createElement('div');
                    item.className = `upgrade-item ${this.gold < cost ? 'disabled' : ''}`;
                    item.innerHTML = `
                        <span class="upgrade-name">${this.getEquipmentName(type)} Lv.${this.equipment[type]}</span>
                        <span class="upgrade-cost">💰 ${this.formatNumber(cost)}</span>
                    `;
                    item.addEventListener('click', () => this.upgradeEquipment(type));
                    content.appendChild(item);
                });
                break;
            
            case 'skills':
                Object.keys(this.skills).forEach(skillName => {
                    const skill = this.skills[skillName];
                    const cost = skill.level * 1000;
                    const item = document.createElement('div');
                    item.className = `upgrade-item ${this.gems < cost / 100 ? 'disabled' : ''}`;
                    item.innerHTML = `
                        <span class="upgrade-name">${this.getSkillDisplayName(skillName)} Lv.${skill.level}</span>
                        <span class="upgrade-cost">💎 ${cost / 100}</span>
                    `;
                    item.addEventListener('click', () => {
                        if (this.gems >= cost / 100) {
                            this.gems -= cost / 100;
                            skill.level++;
                            this.updateDisplay();
                            // スキルタブを再表示して最新情報を反映
                            if (this.currentUpgradeTab === 'skills') {
                                this.showUpgradeTab('skills');
                            }
                        }
                    });
                    content.appendChild(item);
                });
                break;
            
            case 'stats':
                const stats = [
                    { name: 'HP強化', stat: 'maxHp', value: 50 },
                    { name: '攻撃力強化', stat: 'attack', value: 5 },
                    { name: '防御力強化', stat: 'defense', value: 3 },
                    { name: 'クリティカル率', stat: 'critChance', value: 0.05 }
                ];
                
                stats.forEach(stat => {
                    const currentCost = this.statUpgradeCosts[stat.stat];
                    const item = document.createElement('div');
                    item.className = `upgrade-item ${this.gold < currentCost ? 'disabled' : ''}`;
                    item.innerHTML = `
                        <span class="upgrade-name">${stat.name} +${stat.value}</span>
                        <span class="upgrade-cost">💰 ${this.formatNumber(currentCost)}</span>
                    `;
                    item.addEventListener('click', () => {
                        if (this.gold >= currentCost) {
                            this.gold -= currentCost;
                            this.hero[stat.stat] += stat.value;
                            this.statUpgradeCosts[stat.stat] = Math.floor(currentCost * 1.3);
                            this.updateDisplay();
                            // ステータスタブを再表示して最新情報を反映
                            if (this.currentUpgradeTab === 'stats') {
                                this.showUpgradeTab('stats');
                            }
                        }
                    });
                    content.appendChild(item);
                });
                break;
        }
    }
    
    getEquipmentName(type) {
        const names = {
            weapon: '⚔️ 武器',
            armor: '🛡️ 防具',
            accessory: '💍 アクセサリ',
            boots: '👢 ブーツ'
        };
        return names[type];
    }
    
    getSkillDisplayName(skillName) {
        const names = {
            powerStrike: '💥 パワーストライク',
            heal: '💚 回復',
            berserk: '🔥 バーサーク',
            goldRush: '💰 ゴールドラッシュ'
        };
        return names[skillName];
    }
    
    generateRandomItem() {
        const items = ['⚔️', '🛡️', '💍', '👢', '🧪', '📜', '💎', '🔮'];
        return items[Math.floor(Math.random() * items.length)];
    }
    
    addItemToInventory(item) {
        this.inventory.push(item);
        this.updateInventoryDisplay();
    }
    
    showDamageNumber(damage, isHeal = false) {
        const container = document.getElementById('damage-numbers');
        const damageEl = document.createElement('div');
        damageEl.className = `damage-number ${isHeal ? 'heal' : ''}`;
        damageEl.textContent = isHeal ? `+${Math.floor(damage)}` : `-${damage}`;
        damageEl.style.left = `${50 + (Math.random() - 0.5) * 100}%`;
        damageEl.style.top = '50%';
        
        container.appendChild(damageEl);
        
        setTimeout(() => {
            damageEl.remove();
        }, 1000);
    }
    
    updateDisplay() {
        document.getElementById('gold').textContent = this.formatNumber(this.gold);
        document.getElementById('gems').textContent = this.formatNumber(this.gems);
        document.getElementById('level').textContent = this.level;
        document.getElementById('exp').textContent = `${Math.floor(this.exp)}/${this.expToNext}`;
        
        this.updateHeroDisplay();
        this.updateStageProgress();
    }
    
    updateHeroDisplay() {
        document.getElementById('hero-hp').style.width = `${(this.hero.currentHp / this.hero.maxHp) * 100}%`;
        document.getElementById('hero-hp-text').textContent = `${Math.floor(this.hero.currentHp)}/${this.hero.maxHp}`;
        document.getElementById('hero-attack').textContent = this.hero.attack;
        document.getElementById('hero-defense').textContent = this.hero.defense;
        document.getElementById('hero-speed').textContent = this.hero.speed.toFixed(1);
    }
    
    updateEnemyDisplay() {
        if (!this.currentEnemy) {
            document.getElementById('enemy').style.display = 'none';
            return;
        }
        
        document.getElementById('enemy').style.display = 'block';
        document.getElementById('enemy-sprite').textContent = this.currentEnemy.sprite;
        document.getElementById('enemy-name').textContent = this.currentEnemy.name;
        document.getElementById('enemy-hp').style.width = `${(this.currentEnemy.currentHp / this.currentEnemy.maxHp) * 100}%`;
        document.getElementById('enemy-hp-text').textContent = `${Math.floor(this.currentEnemy.currentHp)}/${this.currentEnemy.maxHp}`;
    }
    
    updateEquipmentDisplay() {
        Object.keys(this.equipment).forEach(type => {
            document.getElementById(`${type}-level`).textContent = `Lv.${this.equipment[type]}`;
        });
    }
    
    updateSkillDisplay() {
        let index = 1;
        Object.keys(this.skills).forEach(skillName => {
            const skill = this.skills[skillName];
            const cdElement = document.getElementById(`skill-${index}-cd`);
            const skillElement = cdElement.parentElement;
            
            if (skill.cooldown > 0) {
                cdElement.textContent = skill.cooldown;
                skillElement.classList.add('on-cooldown');
            } else {
                cdElement.textContent = '';
                skillElement.classList.remove('on-cooldown');
            }
            index++;
        });
    }
    
    updateStageProgress() {
        document.getElementById('current-stage').textContent = `${this.currentStage}-${this.currentWave}`;
        const progress = (this.enemiesDefeated / this.enemiesPerWave) * 100;
        document.getElementById('stage-progress').style.width = `${progress}%`;
        document.getElementById('stage-progress-text').textContent = `${this.enemiesDefeated}/${this.enemiesPerWave}`;
        
        // ボスボタンの有効/無効
        const bossButton = document.getElementById('boss-button');
        bossButton.disabled = this.currentWave === 10;
    }
    
    updateInventoryDisplay() {
        const container = document.getElementById('inventory');
        container.innerHTML = '';
        
        const itemCounts = {};
        this.inventory.forEach(item => {
            itemCounts[item] = (itemCounts[item] || 0) + 1;
        });
        
        Object.entries(itemCounts).forEach(([item, count]) => {
            const itemEl = document.createElement('div');
            itemEl.className = 'inventory-item';
            itemEl.innerHTML = `
                ${item}
                ${count > 1 ? `<span class="item-count">${count}</span>` : ''}
            `;
            container.appendChild(itemEl);
        });
    }
    
    formatNumber(num) {
        if (num >= 1e9) return (num / 1e9).toFixed(2) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(2) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return Math.floor(num).toString();
    }
    
    togglePause() {
        this.isPaused = !this.isPaused;
        document.getElementById('pause-button').textContent = this.isPaused ? '▶️ 再開' : '⏸️ ポーズ';
    }
    
    saveGame(auto = false) {
        const saveData = {
            gold: this.gold,
            gems: this.gems,
            level: this.level,
            exp: this.exp,
            expToNext: this.expToNext,
            hero: this.hero,
            equipment: this.equipment,
            skills: this.skills,
            currentStage: this.currentStage,
            currentWave: this.currentWave,
            enemiesDefeated: this.enemiesDefeated,
            inventory: this.inventory,
            statUpgradeCosts: this.statUpgradeCosts,
            timestamp: Date.now()
        };
        
        localStorage.setItem('idleRPGSave', JSON.stringify(saveData));
        
        if (!auto) {
            alert('セーブ完了！');
        }
    }
    
    loadGame() {
        const saveData = localStorage.getItem('idleRPGSave');
        if (saveData) {
            const data = JSON.parse(saveData);
            
            this.gold = data.gold || 0;
            this.gems = data.gems || 0;
            this.level = data.level || 1;
            this.exp = data.exp || 0;
            this.expToNext = data.expToNext || 100;
            this.hero = data.hero || this.hero;
            this.equipment = data.equipment || this.equipment;
            this.skills = data.skills || this.skills;
            this.currentStage = data.currentStage || 1;
            this.currentWave = data.currentWave || 1;
            this.enemiesDefeated = data.enemiesDefeated || 0;
            this.inventory = data.inventory || [];
            this.statUpgradeCosts = data.statUpgradeCosts || this.statUpgradeCosts;
            
            // オフライン報酬の計算
            if (data.timestamp) {
                const offlineTime = (Date.now() - data.timestamp) / 1000;
                const offlineGold = Math.floor(offlineTime * this.currentStage * 0.1);
                const offlineExp = Math.floor(offlineTime * this.currentStage * 0.05);
                
                this.gold += offlineGold;
                this.gainExp(offlineExp);
                
                if (offlineGold > 0) {
                    console.log(`オフライン報酬: 💰${offlineGold} ⭐${offlineExp}`);
                }
            }
            
            this.updateDisplay();
            this.updateEquipmentDisplay();
            this.updateInventoryDisplay();
        }
    }
    
    resetGame() {
        if (confirm('本当にリセットしますか？すべての進行状況が失われます。')) {
            localStorage.removeItem('idleRPGSave');
            location.reload();
        }
    }
}

// ゲーム開始
window.addEventListener('DOMContentLoaded', () => {
    new IdleRPG();
});