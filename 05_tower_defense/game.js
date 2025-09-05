// loadSettings関数はsettings.jsで定義されているため、ここでは削除

class TowerDefenseGame {
    constructor(settings = {}) {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Canvas設定
        this.canvas.width = 960;
        this.canvas.height = 640;
        
        // ゲーム状態
        this.gameState = 'ready'; // ready, waveInProgress, paused, gameOver, victory
        this.gold = parseInt(settings['初期ゴールド']) || 500;
        this.lives = parseInt(settings['初期ライフ']) || 20;
        this.wave = 1;
        this.score = 0;
        this.enemiesKilled = 0;
        this.gameSpeed = 1;
        
        // グリッド設定
        this.gridSize = 32;
        this.cols = Math.floor(this.canvas.width / this.gridSize);
        this.rows = Math.floor(this.canvas.height / this.gridSize);
        
        // マップデータ
        this.map = this.generateMap();
        this.path = this.generatePath();
        
        // ゲームオブジェクト
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.effects = [];
        
        // 選択状態
        this.selectedTower = null;
        this.selectedTowerType = null;
        this.hoveredCell = null;
        
        // タワー定義
        this.towerTypes = {
            arrow: {
                name: settings['アローシューター名'] || 'アローシューター',
                cost: 100,
                damage: 10,
                range: 100,
                fireRate: 1000,
                projectileSpeed: 10,
                color: '#8B4513',
                icon: '🏹',
                upgrades: {
                    damage: [15, 25, 40],
                    range: [120, 140, 160],
                    fireRate: [800, 600, 400]
                }
            },
            cannon: {
                name: settings['キャノンタワー名'] || 'キャノンタワー',
                cost: 200,
                damage: 30,
                range: 80,
                fireRate: 2000,
                projectileSpeed: 8,
                splash: 40,
                color: '#696969',
                icon: '💣',
                upgrades: {
                    damage: [45, 70, 100],
                    splash: [50, 60, 70],
                    fireRate: [1800, 1500, 1200]
                }
            },
            magic: {
                name: settings['マジックタワー名'] || 'マジックタワー',
                cost: 300,
                damage: 20,
                range: 120,
                fireRate: 1500,
                projectileSpeed: 12,
                slowEffect: 0.5,
                slowDuration: 2000,
                color: '#9932CC',
                icon: '🔮',
                upgrades: {
                    damage: [30, 45, 65],
                    slowEffect: [0.4, 0.3, 0.2],
                    range: [140, 160, 180]
                }
            },
            ice: {
                name: settings['フリーズタワー名'] || 'フリーズタワー',
                cost: 250,
                damage: 5,
                range: 90,
                fireRate: 2500,
                projectileSpeed: 6,
                freezeDuration: 1500,
                color: '#00CED1',
                icon: '❄️',
                upgrades: {
                    damage: [10, 15, 25],
                    freezeDuration: [2000, 2500, 3000],
                    fireRate: [2200, 1900, 1600]
                }
            },
            laser: {
                name: settings['レーザータワー名'] || 'レーザータワー',
                cost: 500,
                damage: 50,
                range: 150,
                fireRate: 100,
                instant: true,
                piercing: true,
                color: '#FFD700',
                icon: '⚡',
                upgrades: {
                    damage: [75, 110, 150],
                    range: [170, 190, 210],
                    fireRate: [90, 80, 70]
                }
            },
            poison: {
                name: settings['ポイズンタワー名'] || 'ポイズンタワー',
                cost: 350,
                damage: 15,
                range: 100,
                fireRate: 1800,
                projectileSpeed: 9,
                poisonDamage: 5,
                poisonDuration: 3000,
                color: '#32CD32',
                icon: '☠️',
                upgrades: {
                    damage: [22, 32, 45],
                    poisonDamage: [8, 12, 18],
                    poisonDuration: [3500, 4000, 4500]
                }
            }
        };
        
        // 敵の種類
        this.enemyTypes = {
            normal: {
                health: 100,
                speed: 1,
                reward: 10,
                color: '#8B4513',
                size: 12
            },
            fast: {
                health: 60,
                speed: 2,
                reward: 15,
                color: '#FFD700',
                size: 10
            },
            tank: {
                health: 300,
                speed: 0.5,
                reward: 30,
                color: '#696969',
                size: 16
            },
            flying: {
                health: 80,
                speed: 1.5,
                reward: 20,
                color: '#87CEEB',
                size: 14,
                flying: true
            },
            boss: {
                health: 1000,
                speed: 0.3,
                reward: 100,
                color: '#8B0000',
                size: 24
            }
        };
        
        // ウェーブ設定
        this.waves = this.generateWaves();
        this.currentWaveEnemies = [];
        this.waveSpawnIndex = 0;
        this.waveSpawnTimer = 0;
        
        // アニメーション
        this.animationFrame = 0;
        this.lastTime = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.startGameLoop();
        this.updateUI();
        this.updateTowerNames();
    }
    
    updateTowerNames() {
        // HTMLのタワーカードの名前を更新
        const towerCards = document.querySelectorAll('.tower-card');
        towerCards.forEach(card => {
            const towerType = card.getAttribute('data-tower');
            const nameElement = card.querySelector('.tower-name');
            if (nameElement && this.towerTypes[towerType]) {
                nameElement.textContent = this.towerTypes[towerType].name;
            }
        });
    }
    
    setupEventListeners() {
        // キャンバスイベント
        this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.canvas.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.cancelPlacement();
        });
        
        // タワーカード
        document.querySelectorAll('.tower-card').forEach(card => {
            card.addEventListener('click', () => {
                const towerType = card.dataset.tower;
                if (this.gold >= this.towerTypes[towerType].cost) {
                    this.selectTowerType(towerType);
                }
            });
        });
        
        // コントロールボタン
        document.getElementById('startWaveBtn').addEventListener('click', () => this.startWave());
        document.getElementById('speedBtn').addEventListener('click', () => this.toggleSpeed());
        document.getElementById('pauseBtn').addEventListener('click', () => this.togglePause());
        document.getElementById('resetBtn').addEventListener('click', () => this.resetGame());
        
        // アップグレード＆売却
        document.getElementById('upgradeBtn').addEventListener('click', () => this.upgradeTower());
        document.getElementById('sellBtn').addEventListener('click', () => this.sellTower());
        
        // リスタート
        document.getElementById('restartBtn').addEventListener('click', () => this.resetGame());
        document.getElementById('victoryRestartBtn').addEventListener('click', () => this.resetGame());
    }
    
    generateMap() {
        const map = [];
        for (let y = 0; y < this.rows; y++) {
            map[y] = [];
            for (let x = 0; x < this.cols; x++) {
                map[y][x] = 0; // 0: 空き地, 1: 道, 2: タワー設置不可
            }
        }
        return map;
    }
    
    generatePath() {
        const path = [];
        const startY = Math.floor(this.rows / 2);
        
        // S字型のパスを生成
        path.push({ x: 0, y: startY });
        
        // 右へ
        for (let x = 1; x <= 8; x++) {
            path.push({ x, y: startY });
        }
        
        // 上へ
        for (let y = startY - 1; y >= 3; y--) {
            path.push({ x: 8, y });
        }
        
        // 右へ
        for (let x = 9; x <= 16; x++) {
            path.push({ x, y: 3 });
        }
        
        // 下へ
        for (let y = 4; y <= 16; y++) {
            path.push({ x: 16, y });
        }
        
        // 右へ（ゴールまで）
        for (let x = 17; x < this.cols; x++) {
            path.push({ x, y: 16 });
        }
        
        // マップに道を設定
        path.forEach(point => {
            if (this.map[point.y] && this.map[point.y][point.x] !== undefined) {
                this.map[point.y][point.x] = 1;
                
                // 道の周囲も設置不可にする（道幅を広げる）
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const ny = point.y + dy;
                        const nx = point.x + dx;
                        if (this.map[ny] && this.map[ny][nx] !== undefined && this.map[ny][nx] === 0) {
                            this.map[ny][nx] = 2;
                        }
                    }
                }
            }
        });
        
        return path;
    }
    
    generateWaves() {
        const waves = [];
        
        for (let i = 1; i <= 20; i++) {
            const wave = [];
            const enemyCount = 5 + i * 2;
            
            // 通常の敵
            for (let j = 0; j < enemyCount; j++) {
                wave.push('normal');
            }
            
            // Wave 3以降、速い敵を追加
            if (i >= 3) {
                for (let j = 0; j < Math.floor(i / 3); j++) {
                    wave.push('fast');
                }
            }
            
            // Wave 5以降、タンクを追加
            if (i >= 5) {
                for (let j = 0; j < Math.floor(i / 5); j++) {
                    wave.push('tank');
                }
            }
            
            // Wave 7以降、飛行敵を追加
            if (i >= 7) {
                for (let j = 0; j < Math.floor(i / 7); j++) {
                    wave.push('flying');
                }
            }
            
            // Wave 10, 15, 20でボス
            if (i === 10 || i === 15 || i === 20) {
                wave.push('boss');
            }
            
            waves.push(wave);
        }
        
        return waves;
    }
    
    handleMouseMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const gridX = Math.floor(x / this.gridSize);
        const gridY = Math.floor(y / this.gridSize);
        
        this.hoveredCell = { x: gridX, y: gridY };
    }
    
    handleClick(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        const gridX = Math.floor(x / this.gridSize);
        const gridY = Math.floor(y / this.gridSize);
        
        if (this.selectedTowerType) {
            // タワー設置
            this.placeTower(gridX, gridY);
        } else {
            // タワー選択
            this.selectTowerAt(gridX, gridY);
        }
    }
    
    selectTowerType(type) {
        this.selectedTowerType = type;
        this.selectedTower = null;
        
        // UIを更新
        document.querySelectorAll('.tower-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`[data-tower="${type}"]`).classList.add('selected');
        
        document.getElementById('selectedTowerInfo').style.display = 'none';
    }
    
    cancelPlacement() {
        this.selectedTowerType = null;
        document.querySelectorAll('.tower-card').forEach(card => {
            card.classList.remove('selected');
        });
    }
    
    placeTower(x, y) {
        if (!this.selectedTowerType) return;
        
        // 設置可能かチェック
        if (!this.canPlaceTower(x, y)) return;
        
        const towerType = this.towerTypes[this.selectedTowerType];
        
        // ゴールドチェック
        if (this.gold < towerType.cost) return;
        
        // タワー作成
        const tower = {
            x: x * this.gridSize + this.gridSize / 2,
            y: y * this.gridSize + this.gridSize / 2,
            gridX: x,
            gridY: y,
            type: this.selectedTowerType,
            level: 1,
            damage: towerType.damage,
            range: towerType.range,
            fireRate: towerType.fireRate,
            lastShot: 0,
            target: null,
            angle: 0
        };
        
        // 特殊属性をコピー
        if (towerType.splash) tower.splash = towerType.splash;
        if (towerType.slowEffect) {
            tower.slowEffect = towerType.slowEffect;
            tower.slowDuration = towerType.slowDuration;
        }
        if (towerType.freezeDuration) tower.freezeDuration = towerType.freezeDuration;
        if (towerType.instant) tower.instant = towerType.instant;
        if (towerType.piercing) tower.piercing = towerType.piercing;
        if (towerType.poisonDamage) {
            tower.poisonDamage = towerType.poisonDamage;
            tower.poisonDuration = towerType.poisonDuration;
        }
        
        this.towers.push(tower);
        this.map[y][x] = 2;
        this.gold -= towerType.cost;
        
        this.selectedTowerType = null;
        this.cancelPlacement();
        this.updateUI();
    }
    
    canPlaceTower(x, y) {
        // 範囲外チェック
        if (x < 0 || x >= this.cols || y < 0 || y >= this.rows) return false;
        
        // 設置可能な場所かチェック
        if (this.map[y][x] !== 0) return false;
        
        // 既にタワーがあるかチェック
        const existingTower = this.towers.find(t => t.gridX === x && t.gridY === y);
        if (existingTower) return false;
        
        return true;
    }
    
    selectTowerAt(x, y) {
        const tower = this.towers.find(t => t.gridX === x && t.gridY === y);
        
        if (tower) {
            this.selectedTower = tower;
            this.selectedTowerType = null;
            this.showTowerInfo(tower);
        } else {
            this.selectedTower = null;
            document.getElementById('selectedTowerInfo').style.display = 'none';
        }
    }
    
    showTowerInfo(tower) {
        const towerType = this.towerTypes[tower.type];
        const info = document.getElementById('selectedTowerInfo');
        const details = document.getElementById('towerDetails');
        
        details.innerHTML = `
            <div>${towerType.icon} ${towerType.name} Lv.${tower.level}</div>
            <div>攻撃力: <span>${tower.damage}</span></div>
            <div>射程: <span>${tower.range}</span></div>
            <div>攻撃速度: <span>${(1000 / tower.fireRate).toFixed(1)}/秒</span></div>
        `;
        
        // アップグレードコスト
        const upgradeCost = this.getUpgradeCost(tower);
        document.getElementById('upgradeCost').textContent = `💰 ${upgradeCost}`;
        document.getElementById('upgradeBtn').disabled = this.gold < upgradeCost || tower.level >= 4;
        
        // 売却価格
        const sellValue = this.getSellValue(tower);
        document.getElementById('sellValue').textContent = `💰 ${sellValue}`;
        
        info.style.display = 'block';
    }
    
    getUpgradeCost(tower) {
        return Math.floor(this.towerTypes[tower.type].cost * tower.level * 0.75);
    }
    
    getSellValue(tower) {
        let totalCost = this.towerTypes[tower.type].cost;
        for (let i = 2; i <= tower.level; i++) {
            totalCost += this.getUpgradeCost({ ...tower, level: i - 1 });
        }
        return Math.floor(totalCost * 0.6);
    }
    
    upgradeTower() {
        if (!this.selectedTower) return;
        
        const cost = this.getUpgradeCost(this.selectedTower);
        if (this.gold < cost || this.selectedTower.level >= 4) return;
        
        const tower = this.selectedTower;
        const towerType = this.towerTypes[tower.type];
        
        tower.level++;
        
        // ステータスアップグレード
        if (towerType.upgrades.damage) {
            tower.damage = towerType.upgrades.damage[tower.level - 2];
        }
        if (towerType.upgrades.range) {
            tower.range = towerType.upgrades.range[tower.level - 2];
        }
        if (towerType.upgrades.fireRate) {
            tower.fireRate = towerType.upgrades.fireRate[tower.level - 2];
        }
        if (towerType.upgrades.splash) {
            tower.splash = towerType.upgrades.splash[tower.level - 2];
        }
        if (towerType.upgrades.slowEffect) {
            tower.slowEffect = towerType.upgrades.slowEffect[tower.level - 2];
        }
        if (towerType.upgrades.freezeDuration) {
            tower.freezeDuration = towerType.upgrades.freezeDuration[tower.level - 2];
        }
        if (towerType.upgrades.poisonDamage) {
            tower.poisonDamage = towerType.upgrades.poisonDamage[tower.level - 2];
        }
        if (towerType.upgrades.poisonDuration) {
            tower.poisonDuration = towerType.upgrades.poisonDuration[tower.level - 2];
        }
        
        this.gold -= cost;
        this.showTowerInfo(tower);
        this.updateUI();
        
        // アップグレードエフェクト
        this.createUpgradeEffect(tower.x, tower.y);
    }
    
    sellTower() {
        if (!this.selectedTower) return;
        
        const tower = this.selectedTower;
        const value = this.getSellValue(tower);
        
        // マップから削除
        this.map[tower.gridY][tower.gridX] = 0;
        
        // タワー配列から削除
        this.towers = this.towers.filter(t => t !== tower);
        
        this.gold += value;
        this.selectedTower = null;
        
        document.getElementById('selectedTowerInfo').style.display = 'none';
        this.updateUI();
        
        // 売却エフェクト
        this.createSellEffect(tower.x, tower.y);
    }
    
    startWave() {
        if (this.gameState !== 'ready' || this.wave > this.waves.length) return;
        
        this.gameState = 'waveInProgress';
        this.currentWaveEnemies = [...this.waves[this.wave - 1]];
        this.waveSpawnIndex = 0;
        this.waveSpawnTimer = 0;
        
        document.getElementById('startWaveBtn').disabled = true;
    }
    
    spawnEnemy() {
        if (this.waveSpawnIndex >= this.currentWaveEnemies.length) return;
        
        const enemyType = this.currentWaveEnemies[this.waveSpawnIndex];
        const enemyData = this.enemyTypes[enemyType];
        
        const enemy = {
            type: enemyType,
            x: this.path[0].x * this.gridSize + this.gridSize / 2,
            y: this.path[0].y * this.gridSize + this.gridSize / 2,
            health: enemyData.health,
            maxHealth: enemyData.health,
            speed: enemyData.speed,
            reward: enemyData.reward,
            pathIndex: 0,
            slowedUntil: 0,
            frozenUntil: 0,
            poisonedUntil: 0,
            poisonDamage: 0,
            lastPoisonTick: 0
        };
        
        if (enemyData.flying) enemy.flying = true;
        
        this.enemies.push(enemy);
        this.waveSpawnIndex++;
    }
    
    updateEnemies(deltaTime) {
        const currentTime = Date.now();
        
        this.enemies = this.enemies.filter(enemy => {
            // 毒ダメージ
            if (enemy.poisonedUntil > currentTime) {
                if (currentTime - enemy.lastPoisonTick > 500) {
                    enemy.health -= enemy.poisonDamage;
                    enemy.lastPoisonTick = currentTime;
                    this.createDamageText(enemy.x, enemy.y, enemy.poisonDamage, '#32CD32');
                }
            }
            
            // 凍結チェック
            if (enemy.frozenUntil > currentTime) {
                return enemy.health > 0;
            }
            
            // 移動
            if (enemy.pathIndex < this.path.length - 1) {
                const target = this.path[enemy.pathIndex + 1];
                const targetX = target.x * this.gridSize + this.gridSize / 2;
                const targetY = target.y * this.gridSize + this.gridSize / 2;
                
                const dx = targetX - enemy.x;
                const dy = targetY - enemy.y;
                const distance = Math.sqrt(dx * dx + dy * dy);
                
                if (distance < 2) {
                    enemy.pathIndex++;
                } else {
                    // 速度計算（スロー効果を適用）
                    let speed = enemy.speed * this.gameSpeed;
                    if (enemy.slowedUntil > currentTime) {
                        speed *= 0.5;
                    }
                    
                    enemy.x += (dx / distance) * speed;
                    enemy.y += (dy / distance) * speed;
                }
            } else {
                // ゴールに到達
                this.lives--;
                this.updateUI();
                
                if (this.lives <= 0) {
                    this.gameOver();
                }
                
                return false;
            }
            
            // 死亡チェック
            if (enemy.health <= 0) {
                this.gold += enemy.reward;
                this.score += enemy.reward * 10;
                this.enemiesKilled++;
                this.createDeathEffect(enemy.x, enemy.y);
                this.updateUI();
                return false;
            }
            
            return true;
        });
    }
    
    updateTowers(deltaTime) {
        const currentTime = Date.now();
        
        this.towers.forEach(tower => {
            // ターゲット選択
            if (!tower.target || !this.isInRange(tower, tower.target)) {
                tower.target = this.findTarget(tower);
            }
            
            // 攻撃
            if (tower.target && currentTime - tower.lastShot > tower.fireRate / this.gameSpeed) {
                this.towerShoot(tower);
                tower.lastShot = currentTime;
            }
            
            // タワーの向きを更新
            if (tower.target) {
                const dx = tower.target.x - tower.x;
                const dy = tower.target.y - tower.y;
                tower.angle = Math.atan2(dy, dx);
            }
        });
    }
    
    findTarget(tower) {
        let bestTarget = null;
        let bestProgress = -1;
        
        this.enemies.forEach(enemy => {
            // 飛行敵は特定のタワーのみ攻撃可能
            if (enemy.flying && tower.type !== 'arrow' && tower.type !== 'magic' && tower.type !== 'laser') {
                return;
            }
            
            if (this.isInRange(tower, enemy)) {
                if (enemy.pathIndex > bestProgress) {
                    bestProgress = enemy.pathIndex;
                    bestTarget = enemy;
                }
            }
        });
        
        return bestTarget;
    }
    
    isInRange(tower, enemy) {
        const dx = tower.x - enemy.x;
        const dy = tower.y - enemy.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        return distance <= tower.range;
    }
    
    towerShoot(tower) {
        const towerType = this.towerTypes[tower.type];
        
        if (towerType.instant) {
            // レーザータワー（即座にダメージ）
            this.dealDamage(tower.target, tower.damage);
            
            // レーザーエフェクト
            this.createLaserEffect(tower.x, tower.y, tower.target.x, tower.target.y);
            
            // 貫通
            if (tower.piercing) {
                const angle = tower.angle;
                this.enemies.forEach(enemy => {
                    if (enemy !== tower.target && this.isOnLaserPath(tower, enemy, angle)) {
                        this.dealDamage(enemy, Math.floor(tower.damage * 0.5));
                    }
                });
            }
        } else {
            // 通常の弾丸
            const projectile = {
                x: tower.x,
                y: tower.y,
                targetX: tower.target.x,
                targetY: tower.target.y,
                target: tower.target,
                damage: tower.damage,
                speed: towerType.projectileSpeed || 10,
                type: tower.type,
                color: towerType.color
            };
            
            // 特殊効果をコピー
            if (tower.splash) projectile.splash = tower.splash;
            if (tower.slowEffect) {
                projectile.slowEffect = tower.slowEffect;
                projectile.slowDuration = tower.slowDuration;
            }
            if (tower.freezeDuration) projectile.freezeDuration = tower.freezeDuration;
            if (tower.poisonDamage) {
                projectile.poisonDamage = tower.poisonDamage;
                projectile.poisonDuration = tower.poisonDuration;
            }
            
            this.projectiles.push(projectile);
        }
    }
    
    isOnLaserPath(tower, enemy, angle) {
        const dx = enemy.x - tower.x;
        const dy = enemy.y - tower.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance > tower.range) return false;
        
        const enemyAngle = Math.atan2(dy, dx);
        const angleDiff = Math.abs(enemyAngle - angle);
        
        return angleDiff < 0.1; // 約5.7度の範囲
    }
    
    updateProjectiles(deltaTime) {
        const currentTime = Date.now();
        
        this.projectiles = this.projectiles.filter(projectile => {
            // ターゲットが存在しない場合は削除
            if (projectile.target && !this.enemies.includes(projectile.target)) {
                return false;
            }
            
            // ホーミング
            if (projectile.target) {
                projectile.targetX = projectile.target.x;
                projectile.targetY = projectile.target.y;
            }
            
            const dx = projectile.targetX - projectile.x;
            const dy = projectile.targetY - projectile.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 10) {
                // 着弾
                if (projectile.target) {
                    this.dealDamage(projectile.target, projectile.damage);
                    
                    // 特殊効果
                    if (projectile.slowEffect) {
                        projectile.target.slowedUntil = currentTime + projectile.slowDuration;
                    }
                    if (projectile.freezeDuration) {
                        projectile.target.frozenUntil = currentTime + projectile.freezeDuration;
                    }
                    if (projectile.poisonDamage) {
                        projectile.target.poisonedUntil = currentTime + projectile.poisonDuration;
                        projectile.target.poisonDamage = projectile.poisonDamage;
                        projectile.target.lastPoisonTick = currentTime;
                    }
                    
                    // スプラッシュダメージ
                    if (projectile.splash) {
                        this.enemies.forEach(enemy => {
                            if (enemy !== projectile.target) {
                                const edx = enemy.x - projectile.x;
                                const edy = enemy.y - projectile.y;
                                const edist = Math.sqrt(edx * edx + edy * edy);
                                
                                if (edist <= projectile.splash) {
                                    this.dealDamage(enemy, Math.floor(projectile.damage * 0.5));
                                }
                            }
                        });
                        this.createExplosionEffect(projectile.x, projectile.y, projectile.splash);
                    }
                }
                
                return false;
            }
            
            // 移動
            projectile.x += (dx / distance) * projectile.speed * this.gameSpeed;
            projectile.y += (dy / distance) * projectile.speed * this.gameSpeed;
            
            return true;
        });
    }
    
    dealDamage(enemy, damage) {
        enemy.health -= damage;
        this.createDamageText(enemy.x, enemy.y, damage);
    }
    
    updateEffects(deltaTime) {
        this.effects = this.effects.filter(effect => {
            effect.life -= deltaTime * this.gameSpeed;
            
            if (effect.type === 'damage') {
                effect.y -= 1;
                effect.alpha = effect.life / effect.maxLife;
            } else if (effect.type === 'explosion') {
                effect.radius += 2;
                effect.alpha = effect.life / effect.maxLife;
            } else if (effect.type === 'laser') {
                effect.alpha = effect.life / effect.maxLife;
            }
            
            return effect.life > 0;
        });
    }
    
    createDamageText(x, y, damage, color = '#FFFF00') {
        this.effects.push({
            type: 'damage',
            x: x + Math.random() * 20 - 10,
            y: y - 10,
            text: damage.toString(),
            color: color,
            life: 1000,
            maxLife: 1000,
            alpha: 1
        });
    }
    
    createDeathEffect(x, y) {
        for (let i = 0; i < 10; i++) {
            this.effects.push({
                type: 'particle',
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 4,
                vy: (Math.random() - 0.5) * 4,
                color: '#FF0000',
                size: Math.random() * 3 + 2,
                life: 500,
                maxLife: 500,
                alpha: 1
            });
        }
    }
    
    createExplosionEffect(x, y, radius) {
        this.effects.push({
            type: 'explosion',
            x: x,
            y: y,
            radius: radius / 2,
            maxRadius: radius,
            color: '#FFA500',
            life: 300,
            maxLife: 300,
            alpha: 1
        });
    }
    
    createLaserEffect(x1, y1, x2, y2) {
        this.effects.push({
            type: 'laser',
            x1: x1,
            y1: y1,
            x2: x2,
            y2: y2,
            color: '#FFD700',
            life: 200,
            maxLife: 200,
            alpha: 1
        });
    }
    
    createUpgradeEffect(x, y) {
        for (let i = 0; i < 20; i++) {
            const angle = (Math.PI * 2 / 20) * i;
            this.effects.push({
                type: 'particle',
                x: x,
                y: y,
                vx: Math.cos(angle) * 3,
                vy: Math.sin(angle) * 3,
                color: '#00FF00',
                size: 3,
                life: 1000,
                maxLife: 1000,
                alpha: 1
            });
        }
    }
    
    createSellEffect(x, y) {
        for (let i = 0; i < 15; i++) {
            this.effects.push({
                type: 'particle',
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: -Math.random() * 3 - 2,
                color: '#FFD700',
                size: 4,
                life: 800,
                maxLife: 800,
                alpha: 1
            });
        }
    }
    
    checkWaveComplete() {
        if (this.gameState === 'waveInProgress' && 
            this.enemies.length === 0 && 
            this.waveSpawnIndex >= this.currentWaveEnemies.length) {
            
            // ウェーブクリア
            this.gameState = 'ready';
            
            // ボーナス
            const waveBonus = this.wave * 50;
            this.gold += waveBonus;
            this.score += waveBonus;
            
            this.wave++;
            
            if (this.wave > this.waves.length) {
                this.victory();
            } else {
                document.getElementById('startWaveBtn').disabled = false;
            }
            
            this.updateUI();
        }
    }
    
    toggleSpeed() {
        const speeds = [1, 2, 3];
        const currentIndex = speeds.indexOf(this.gameSpeed);
        this.gameSpeed = speeds[(currentIndex + 1) % speeds.length];
        
        document.getElementById('speedBtn').innerHTML = `<span>⏩ 速度: ${this.gameSpeed}x</span>`;
    }
    
    togglePause() {
        if (this.gameState === 'paused') {
            this.gameState = this.previousState;
            document.getElementById('pauseBtn').innerHTML = '<span>⏸️ ポーズ</span>';
        } else if (this.gameState !== 'gameOver' && this.gameState !== 'victory') {
            this.previousState = this.gameState;
            this.gameState = 'paused';
            document.getElementById('pauseBtn').innerHTML = '<span>▶️ 再開</span>';
        }
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        document.getElementById('finalWave').textContent = this.wave;
        document.getElementById('enemiesKilled').textContent = this.enemiesKilled;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('gameOverScreen').style.display = 'flex';
    }
    
    victory() {
        this.gameState = 'victory';
        
        document.getElementById('remainingLives').textContent = this.lives;
        document.getElementById('victoryScore').textContent = this.score + this.lives * 100;
        document.getElementById('victoryScreen').style.display = 'flex';
    }
    
    resetGame() {
        // ゲーム状態をリセット
        this.gameState = 'ready';
        this.gold = 500;
        this.lives = 20;
        this.wave = 1;
        this.score = 0;
        this.enemiesKilled = 0;
        this.gameSpeed = 1;
        
        // オブジェクトをクリア
        this.towers = [];
        this.enemies = [];
        this.projectiles = [];
        this.effects = [];
        
        // マップをリセット
        this.map = this.generateMap();
        this.path = this.generatePath();
        
        // 選択状態をリセット
        this.selectedTower = null;
        this.selectedTowerType = null;
        
        // UIをリセット
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('victoryScreen').style.display = 'none';
        document.getElementById('selectedTowerInfo').style.display = 'none';
        document.getElementById('startWaveBtn').disabled = false;
        document.getElementById('speedBtn').innerHTML = '<span>⏩ 速度: 1x</span>';
        
        this.updateUI();
    }
    
    updateUI() {
        document.getElementById('gold').textContent = this.gold;
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('wave').textContent = this.wave;
        document.getElementById('score').textContent = this.score;
        
        // タワーカードの有効/無効
        document.querySelectorAll('.tower-card').forEach(card => {
            const towerType = card.dataset.tower;
            const cost = this.towerTypes[towerType].cost;
            
            if (this.gold < cost) {
                card.classList.add('disabled');
            } else {
                card.classList.remove('disabled');
            }
        });
    }
    
    startGameLoop() {
        const gameLoop = (currentTime) => {
            const deltaTime = currentTime - this.lastTime;
            this.lastTime = currentTime;
            
            if (this.gameState !== 'paused' && this.gameState !== 'gameOver' && this.gameState !== 'victory') {
                this.update(deltaTime);
            }
            
            this.render();
            this.animationFrame++;
            
            requestAnimationFrame(gameLoop);
        };
        
        requestAnimationFrame(gameLoop);
    }
    
    update(deltaTime) {
        // ウェーブ中の敵スポーン
        if (this.gameState === 'waveInProgress') {
            this.waveSpawnTimer += deltaTime * this.gameSpeed;
            
            if (this.waveSpawnTimer > 1000 && this.waveSpawnIndex < this.currentWaveEnemies.length) {
                this.spawnEnemy();
                this.waveSpawnTimer = 0;
            }
        }
        
        // 更新
        this.updateEnemies(deltaTime);
        this.updateTowers(deltaTime);
        this.updateProjectiles(deltaTime);
        this.updateEffects(deltaTime);
        
        // ウェーブ完了チェック
        this.checkWaveComplete();
    }
    
    render() {
        // クリア
        this.ctx.fillStyle = '#2ecc71';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // グリッドとパスを描画
        this.drawGrid();
        this.drawPath();
        
        // 設置プレビュー
        if (this.selectedTowerType && this.hoveredCell) {
            this.drawPlacementPreview();
        }
        
        // ゲームオブジェクト
        this.drawTowers();
        this.drawEnemies();
        this.drawProjectiles();
        this.drawEffects();
        
        // 選択中のタワーの範囲表示
        if (this.selectedTower) {
            this.drawTowerRange(this.selectedTower);
        }
    }
    
    drawGrid() {
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let x = 0; x <= this.cols; x++) {
            this.ctx.beginPath();
            this.ctx.moveTo(x * this.gridSize, 0);
            this.ctx.lineTo(x * this.gridSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let y = 0; y <= this.rows; y++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, y * this.gridSize);
            this.ctx.lineTo(this.canvas.width, y * this.gridSize);
            this.ctx.stroke();
        }
    }
    
    drawPath() {
        // パスの背景
        this.ctx.fillStyle = '#D2691E';
        this.path.forEach(point => {
            this.ctx.fillRect(
                point.x * this.gridSize,
                point.y * this.gridSize,
                this.gridSize,
                this.gridSize
            );
        });
        
        // パスの線
        this.ctx.strokeStyle = '#8B4513';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        
        this.path.forEach((point, index) => {
            const x = point.x * this.gridSize + this.gridSize / 2;
            const y = point.y * this.gridSize + this.gridSize / 2;
            
            if (index === 0) {
                this.ctx.moveTo(x, y);
            } else {
                this.ctx.lineTo(x, y);
            }
        });
        
        this.ctx.stroke();
        
        // スタートとゴール
        const start = this.path[0];
        const end = this.path[this.path.length - 1];
        
        // スタート
        this.ctx.fillStyle = '#00FF00';
        this.ctx.font = '24px Arial';
        this.ctx.fillText('START', start.x * this.gridSize, start.y * this.gridSize + 25);
        
        // ゴール
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillText('GOAL', end.x * this.gridSize - 10, end.y * this.gridSize + 25);
    }
    
    drawPlacementPreview() {
        const x = this.hoveredCell.x;
        const y = this.hoveredCell.y;
        
        if (this.canPlaceTower(x, y)) {
            this.ctx.fillStyle = 'rgba(0, 255, 0, 0.3)';
        } else {
            this.ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        }
        
        this.ctx.fillRect(x * this.gridSize, y * this.gridSize, this.gridSize, this.gridSize);
        
        // 範囲表示
        if (this.canPlaceTower(x, y)) {
            const towerType = this.towerTypes[this.selectedTowerType];
            const centerX = x * this.gridSize + this.gridSize / 2;
            const centerY = y * this.gridSize + this.gridSize / 2;
            
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.arc(centerX, centerY, towerType.range, 0, Math.PI * 2);
            this.ctx.stroke();
        }
    }
    
    drawTowers() {
        this.towers.forEach(tower => {
            const towerType = this.towerTypes[tower.type];
            
            // タワー本体
            this.ctx.fillStyle = towerType.color;
            this.ctx.fillRect(
                tower.x - this.gridSize / 2 + 4,
                tower.y - this.gridSize / 2 + 4,
                this.gridSize - 8,
                this.gridSize - 8
            );
            
            // レベル表示
            if (tower.level > 1) {
                this.ctx.fillStyle = '#FFD700';
                this.ctx.font = '10px Arial';
                this.ctx.fillText(`Lv${tower.level}`, tower.x - 10, tower.y - 10);
            }
            
            // 砲塔
            this.ctx.save();
            this.ctx.translate(tower.x, tower.y);
            this.ctx.rotate(tower.angle);
            
            this.ctx.fillStyle = '#333333';
            this.ctx.fillRect(0, -3, 20, 6);
            
            this.ctx.restore();
            
            // アイコン
            this.ctx.font = '20px Arial';
            this.ctx.fillText(towerType.icon, tower.x - 10, tower.y + 5);
        });
    }
    
    drawTowerRange(tower) {
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        this.ctx.lineWidth = 2;
        this.ctx.beginPath();
        this.ctx.arc(tower.x, tower.y, tower.range, 0, Math.PI * 2);
        this.ctx.stroke();
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            const enemyType = this.enemyTypes[enemy.type];
            
            // 凍結エフェクト
            if (enemy.frozenUntil > Date.now()) {
                this.ctx.fillStyle = 'rgba(0, 206, 209, 0.5)';
                this.ctx.beginPath();
                this.ctx.arc(enemy.x, enemy.y, enemyType.size + 4, 0, Math.PI * 2);
                this.ctx.fill();
            }
            
            // 敵本体
            this.ctx.fillStyle = enemyType.color;
            this.ctx.beginPath();
            this.ctx.arc(enemy.x, enemy.y, enemyType.size, 0, Math.PI * 2);
            this.ctx.fill();
            
            // 毒エフェクト
            if (enemy.poisonedUntil > Date.now()) {
                this.ctx.strokeStyle = '#32CD32';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(enemy.x, enemy.y, enemyType.size + 2, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            // スローエフェクト
            if (enemy.slowedUntil > Date.now()) {
                this.ctx.strokeStyle = '#9932CC';
                this.ctx.lineWidth = 2;
                this.ctx.setLineDash([5, 5]);
                this.ctx.beginPath();
                this.ctx.arc(enemy.x, enemy.y, enemyType.size + 2, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.setLineDash([]);
            }
            
            // 飛行マーク
            if (enemy.flying) {
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.font = '12px Arial';
                this.ctx.fillText('✈', enemy.x - 6, enemy.y - enemyType.size - 5);
            }
            
            // HPバー
            const barWidth = 30;
            const barHeight = 4;
            const healthPercent = enemy.health / enemy.maxHealth;
            
            this.ctx.fillStyle = '#000000';
            this.ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemyType.size - 10, barWidth, barHeight);
            
            this.ctx.fillStyle = healthPercent > 0.5 ? '#00FF00' : healthPercent > 0.25 ? '#FFD700' : '#FF0000';
            this.ctx.fillRect(enemy.x - barWidth / 2, enemy.y - enemyType.size - 10, barWidth * healthPercent, barHeight);
        });
    }
    
    drawProjectiles() {
        this.projectiles.forEach(projectile => {
            this.ctx.fillStyle = projectile.color;
            this.ctx.beginPath();
            this.ctx.arc(projectile.x, projectile.y, 4, 0, Math.PI * 2);
            this.ctx.fill();
            
            // トレイル効果
            this.ctx.strokeStyle = projectile.color;
            this.ctx.globalAlpha = 0.5;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(projectile.x, projectile.y);
            const trailLength = 20;
            const dx = projectile.targetX - projectile.x;
            const dy = projectile.targetY - projectile.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            this.ctx.lineTo(
                projectile.x - (dx / dist) * trailLength,
                projectile.y - (dy / dist) * trailLength
            );
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
        });
    }
    
    drawEffects() {
        this.effects.forEach(effect => {
            this.ctx.globalAlpha = effect.alpha;
            
            if (effect.type === 'damage') {
                this.ctx.fillStyle = effect.color;
                this.ctx.font = 'bold 16px Arial';
                this.ctx.fillText(effect.text, effect.x, effect.y);
            } else if (effect.type === 'explosion') {
                this.ctx.strokeStyle = effect.color;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(effect.x, effect.y, effect.radius, 0, Math.PI * 2);
                this.ctx.stroke();
            } else if (effect.type === 'laser') {
                this.ctx.strokeStyle = effect.color;
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.moveTo(effect.x1, effect.y1);
                this.ctx.lineTo(effect.x2, effect.y2);
                this.ctx.stroke();
                
                // レーザーの光
                this.ctx.strokeStyle = '#FFFFFF';
                this.ctx.lineWidth = 1;
                this.ctx.stroke();
            } else if (effect.type === 'particle') {
                effect.x += effect.vx;
                effect.y += effect.vy;
                effect.vy += 0.2;
                
                this.ctx.fillStyle = effect.color;
                this.ctx.fillRect(effect.x - effect.size / 2, effect.y - effect.size / 2, effect.size, effect.size);
            }
        });
        
        this.ctx.globalAlpha = 1;
    }
}

// ゲーム開始
window.addEventListener('DOMContentLoaded', async () => {
    // CSV設定を読み込む
    const settings = await loadSettings();
    // 設定を渡してゲームを初期化
    new TowerDefenseGame(settings);
});