class MegaActionX {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Canvas設定
        this.canvas.width = 960;
        this.canvas.height = 540;
        
        // ゲーム状態
        this.gameState = 'stageSelect'; // stageSelect, playing, paused, gameOver, stageClear
        this.currentStage = null;
        this.defeatedBosses = [];
        this.acquiredWeapons = ['normal'];
        this.currentWeapon = 'normal';
        
        // プレイヤー
        this.player = {
            x: 100,
            y: 300,
            width: 32,
            height: 40,
            vx: 0,
            vy: 0,
            facing: 'right',
            health: 28,
            maxHealth: 28,
            weaponEnergy: 28,
            maxWeaponEnergy: 28,
            lives: 3,
            
            // 状態フラグ
            onGround: false,
            onWall: false,
            wallDirection: null,
            isJumping: false,
            isSliding: false,
            isShooting: false,
            isCharging: false,
            chargeLevel: 0,
            chargeTime: 0,
            invincible: false,
            invincibleTime: 0,
            isDamaged: false,
            knockbackTime: 0,
            
            // アビリティ
            canWallJump: true,
            canSlide: true,
            canCharge: true
        };
        
        // 物理定数
        this.gravity = 0.5;
        this.maxFallSpeed = 12;
        this.walkSpeed = 4;
        this.jumpPower = 11;
        this.wallJumpPowerX = 6;
        this.wallJumpPowerY = 9;
        this.slideSpeed = 8;
        this.slideDuration = 20;
        
        // 入力
        this.keys = {};
        this.previousKeys = {};
        
        // 弾丸管理
        this.playerBullets = [];
        this.enemyBullets = [];
        this.maxBullets = 3;
        
        // 敵管理
        this.enemies = [];
        this.boss = null;
        
        // アイテム管理
        this.items = [];
        this.energyTanks = 0;
        this.weaponTanks = 0;
        
        // エフェクト
        this.particles = [];
        this.explosions = [];
        
        // スコア
        this.score = 0;
        
        // カメラ
        this.camera = {
            x: 0,
            y: 0,
            width: this.canvas.width,
            height: this.canvas.height
        };
        
        // レベルデータ
        this.currentLevel = null;
        this.tileSize = 32;
        
        // 武器データ
        this.weapons = {
            normal: { name: 'ロックバスター', color: '#00FFFF', damage: 1, energyCost: 0, speed: 8, icon: 'P' },
            fire: { name: 'ファイアストーム', color: '#FF4500', damage: 3, energyCost: 2, speed: 6, icon: 'F' },
            ice: { name: 'アイススラッシャー', color: '#00CED1', damage: 2, energyCost: 1, speed: 7, icon: 'I' },
            elec: { name: 'サンダービーム', color: '#FFD700', damage: 4, energyCost: 3, speed: 10, icon: 'E' },
            wind: { name: 'ウィンドカッター', color: '#98FB98', damage: 2, energyCost: 1, speed: 9, icon: 'W' },
            metal: { name: 'メタルブレード', color: '#C0C0C0', damage: 3, energyCost: 2, speed: 5, icon: 'M' },
            wood: { name: 'リーフシールド', color: '#228B22', damage: 2, energyCost: 4, speed: 0, icon: 'L' },
            bubble: { name: 'バブルリード', color: '#4169E1', damage: 2, energyCost: 1, speed: 4, icon: 'B' },
            shadow: { name: 'シャドーブレード', color: '#4B0082', damage: 3, energyCost: 2, speed: 7, icon: 'S' }
        };
        
        // アニメーション
        this.frameCount = 0;
        this.animationFrame = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.showStageSelect();
        this.startGameLoop();
    }
    
    setupEventListeners() {
        // キーボード入力
        document.addEventListener('keydown', (e) => {
            this.keys[e.key.toLowerCase()] = true;
            
            // ポーズ
            if (e.key.toLowerCase() === 'p' && this.gameState === 'playing') {
                this.togglePause();
            }
            
            // 武器切り替え
            if (this.gameState === 'playing') {
                if (e.key.toLowerCase() === 'a') this.switchWeapon(-1);
                if (e.key.toLowerCase() === 's') this.switchWeapon(1);
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key.toLowerCase()] = false;
        });
        
        // ステージ選択
        document.querySelectorAll('.stage-card').forEach(card => {
            card.addEventListener('click', () => {
                const stage = card.dataset.stage;
                if (stage === 'start' || !this.defeatedBosses.includes(stage)) {
                    this.startStage(stage);
                }
            });
        });
        
        // ポーズメニューボタン
        document.getElementById('resumeBtn').addEventListener('click', () => {
            this.togglePause();
        });
        
        document.getElementById('exitBtn').addEventListener('click', () => {
            this.exitToStageSelect();
        });
        
        // ゲームオーバー
        document.getElementById('continueBtn').addEventListener('click', () => {
            this.player.lives = 3;
            this.showStageSelect();
        });
        
        document.getElementById('titleBtn').addEventListener('click', () => {
            this.resetGame();
        });
        
        // ステージクリア
        document.getElementById('nextStageBtn').addEventListener('click', () => {
            this.showStageSelect();
        });
        
        // アイテム使用（ポーズメニュー）
        document.querySelectorAll('.item-slot').forEach(slot => {
            slot.addEventListener('click', () => {
                this.useItem(slot.dataset.item);
            });
        });
    }
    
    showStageSelect() {
        this.gameState = 'stageSelect';
        document.getElementById('stageSelectScreen').style.display = 'block';
        document.getElementById('gameContainer').style.display = 'none';
        document.getElementById('pauseMenu').style.display = 'none';
        document.getElementById('gameOverScreen').style.display = 'none';
        document.getElementById('stageClearScreen').style.display = 'none';
        
        this.updateStageSelect();
    }
    
    updateStageSelect() {
        // クリア済みステージの表示更新
        this.defeatedBosses.forEach(boss => {
            const card = document.querySelector(`[data-stage="${boss}"]`);
            if (card) {
                card.classList.add('cleared');
            }
        });
        
        // 取得武器の表示
        const weaponList = document.getElementById('weaponList');
        weaponList.innerHTML = '';
        this.acquiredWeapons.forEach(weapon => {
            if (weapon !== 'normal') {
                const weaponItem = document.createElement('div');
                weaponItem.className = 'weapon-item';
                weaponItem.textContent = this.weapons[weapon].name;
                weaponList.appendChild(weaponItem);
            }
        });
    }
    
    startStage(stageName) {
        this.currentStage = stageName;
        this.gameState = 'playing';
        
        document.getElementById('stageSelectScreen').style.display = 'none';
        document.getElementById('gameContainer').style.display = 'block';
        
        // ステージ読み込み
        this.loadStage(stageName);
        
        // プレイヤーリセット
        this.resetPlayer();
        
        // HUD更新
        this.updateHUD();
    }
    
    loadStage(stageName) {
        // ステージごとのレベルデータを生成
        this.currentLevel = this.generateLevel(stageName);
        
        // 敵配置
        this.enemies = this.generateEnemies(stageName);
        
        // ボス配置
        if (stageName !== 'start') {
            this.boss = this.generateBoss(stageName);
        }
        
        // アイテム配置
        this.items = this.generateItems(stageName);
    }
    
    generateLevel(stageName) {
        const width = 60;
        const height = 20;
        const tiles = [];
        
        // 空のマップ初期化
        for (let y = 0; y < height; y++) {
            tiles[y] = [];
            for (let x = 0; x < width; x++) {
                tiles[y][x] = 0;
            }
        }
        
        // 基本的な地形生成
        for (let x = 0; x < width; x++) {
            tiles[16][x] = 1; // 地面
            tiles[17][x] = 2;
            tiles[18][x] = 2;
            tiles[19][x] = 2;
        }
        
        // ステージ固有の地形
        switch(stageName) {
            case 'start':
                // チュートリアルステージ
                this.generateTutorialLevel(tiles);
                break;
            case 'fire':
                this.generateFireLevel(tiles);
                break;
            case 'ice':
                this.generateIceLevel(tiles);
                break;
            default:
                this.generateBasicLevel(tiles);
        }
        
        return { width, height, tiles };
    }
    
    generateTutorialLevel(tiles) {
        // プラットフォーム
        for (let x = 5; x <= 10; x++) tiles[13][x] = 1;
        for (let x = 15; x <= 20; x++) tiles[10][x] = 1;
        for (let x = 25; x <= 30; x++) tiles[12][x] = 1;
        
        // 壁（壁ジャンプ練習）
        for (let y = 10; y <= 15; y++) {
            tiles[y][35] = 1;
            tiles[y][40] = 1;
        }
        
        // スパイク（避ける練習）
        for (let x = 45; x <= 50; x++) {
            tiles[15][x] = 3; // スパイク
        }
    }
    
    generateFireLevel(tiles) {
        // 溶岩プール
        for (let x = 10; x <= 15; x++) {
            tiles[17][x] = 4; // 溶岩
            tiles[18][x] = 4;
            tiles[19][x] = 4;
        }
        
        // 浮遊プラットフォーム
        for (let i = 0; i < 5; i++) {
            for (let x = 20 + i * 8; x <= 23 + i * 8; x++) {
                tiles[14 - i][x] = 1;
            }
        }
    }
    
    generateIceLevel(tiles) {
        // 氷の床（滑る）
        for (let x = 0; x < 60; x++) {
            if (tiles[16][x] === 1) {
                tiles[16][x] = 5; // 氷
            }
        }
        
        // 氷柱
        for (let x = 10; x <= 40; x += 5) {
            for (let y = 0; y <= 5; y++) {
                tiles[y][x] = 1;
            }
        }
    }
    
    generateBasicLevel(tiles) {
        // 基本的なプラットフォームレベル
        for (let i = 0; i < 10; i++) {
            const x = 5 + i * 5;
            const y = 14 - Math.floor(Math.random() * 4);
            for (let j = 0; j < 3; j++) {
                tiles[y][x + j] = 1;
            }
        }
    }
    
    generateEnemies(stageName) {
        const enemies = [];
        const enemyCount = stageName === 'start' ? 5 : 10;
        
        for (let i = 0; i < enemyCount; i++) {
            enemies.push({
                x: 200 + i * 150,
                y: 400,
                width: 32,
                height: 32,
                vx: -1,
                vy: 0,
                health: 3,
                type: this.getEnemyType(stageName),
                behavior: 'patrol',
                shootTimer: 0
            });
        }
        
        return enemies;
    }
    
    getEnemyType(stageName) {
        const types = {
            start: 'metool',
            fire: 'fire_enemy',
            ice: 'ice_enemy',
            elec: 'elec_enemy',
            wind: 'wind_enemy',
            metal: 'metal_enemy',
            wood: 'wood_enemy',
            bubble: 'bubble_enemy',
            shadow: 'shadow_enemy'
        };
        return types[stageName] || 'metool';
    }
    
    generateBoss(stageName) {
        return {
            x: 1700,
            y: 300,
            width: 64,
            height: 80,
            vx: 0,
            vy: 0,
            health: 28,
            maxHealth: 28,
            type: stageName,
            phase: 1,
            actionTimer: 0,
            currentAction: 'idle',
            invincible: false
        };
    }
    
    generateItems(stageName) {
        const items = [];
        
        // エネルギー回復
        for (let i = 0; i < 3; i++) {
            items.push({
                x: 300 + i * 400,
                y: 350,
                type: 'energy_small',
                value: 2,
                collected: false
            });
        }
        
        // 大エネルギー
        items.push({
            x: 800,
            y: 200,
            type: 'energy_large',
            value: 8,
            collected: false
        });
        
        // 1UP
        if (Math.random() < 0.3) {
            items.push({
                x: 1200,
                y: 250,
                type: '1up',
                collected: false
            });
        }
        
        return items;
    }
    
    resetPlayer() {
        this.player.x = 100;
        this.player.y = 300;
        this.player.vx = 0;
        this.player.vy = 0;
        this.player.health = this.player.maxHealth;
        this.player.weaponEnergy = this.player.maxWeaponEnergy;
        this.player.invincible = false;
        this.player.invincibleTime = 0;
        this.player.isSliding = false;
        this.player.chargeLevel = 0;
        this.playerBullets = [];
        this.enemyBullets = [];
    }
    
    startGameLoop() {
        const gameLoop = () => {
            if (this.gameState === 'playing') {
                this.update();
                this.render();
            }
            
            this.frameCount++;
            requestAnimationFrame(gameLoop);
        };
        
        gameLoop();
    }
    
    update() {
        // プレイヤー更新
        this.updatePlayer();
        
        // 弾丸更新
        this.updateBullets();
        
        // 敵更新
        this.updateEnemies();
        
        // ボス更新
        if (this.boss) {
            this.updateBoss();
        }
        
        // アイテム更新
        this.updateItems();
        
        // パーティクル更新
        this.updateParticles();
        
        // カメラ更新
        this.updateCamera();
        
        // 衝突判定
        this.checkCollisions();
        
        // HUD更新
        this.updateHUD();
    }
    
    updatePlayer() {
        const p = this.player;
        
        // 無敵時間処理
        if (p.invincible) {
            p.invincibleTime--;
            if (p.invincibleTime <= 0) {
                p.invincible = false;
            }
        }
        
        // ノックバック処理
        if (p.knockbackTime > 0) {
            p.knockbackTime--;
            if (p.knockbackTime === 0) {
                p.isDamaged = false;
            }
            return; // ノックバック中は操作不可
        }
        
        // スライディング処理
        if (p.isSliding) {
            p.slideDuration--;
            if (p.slideDuration <= 0 || !this.keys['c']) {
                p.isSliding = false;
                p.height = 40;
            } else {
                p.vx = p.facing === 'right' ? this.slideSpeed : -this.slideSpeed;
            }
        } else {
            // 通常移動
            if (this.keys['arrowleft']) {
                p.vx = -this.walkSpeed;
                p.facing = 'left';
            } else if (this.keys['arrowright']) {
                p.vx = this.walkSpeed;
                p.facing = 'right';
            } else {
                p.vx *= 0.8; // 摩擦
            }
            
            // ジャンプ
            if (this.keys['z'] && !this.previousKeys['z']) {
                if (p.onGround) {
                    p.vy = -this.jumpPower;
                    p.isJumping = true;
                    p.onGround = false;
                } else if (p.onWall && p.canWallJump) {
                    // 壁ジャンプ
                    p.vy = -this.wallJumpPowerY;
                    p.vx = p.wallDirection === 'left' ? this.wallJumpPowerX : -this.wallJumpPowerX;
                    p.facing = p.wallDirection === 'left' ? 'right' : 'left';
                    p.onWall = false;
                }
            }
            
            // 可変ジャンプ
            if (!this.keys['z'] && p.vy < -3 && p.isJumping) {
                p.vy = -3;
            }
            
            // スライディング開始
            if (this.keys['c'] && !this.previousKeys['c'] && p.onGround && p.canSlide) {
                p.isSliding = true;
                p.height = 20;
                p.slideDuration = this.slideDuration;
            }
        }
        
        // ショット処理
        if (this.keys['x']) {
            if (!p.isCharging) {
                p.isCharging = true;
                p.chargeTime = 0;
            }
            p.chargeTime++;
            
            // チャージレベル判定
            if (p.chargeTime > 60 && p.chargeLevel < 2) {
                p.chargeLevel = 2;
                this.createChargeEffect();
            } else if (p.chargeTime > 30 && p.chargeLevel < 1) {
                p.chargeLevel = 1;
            }
        } else if (this.previousKeys['x'] && !this.keys['x']) {
            // ショット発射
            this.playerShoot();
            p.isCharging = false;
            p.chargeLevel = 0;
            p.chargeTime = 0;
        }
        
        // 重力適用
        p.vy += this.gravity;
        p.vy = Math.min(p.vy, this.maxFallSpeed);
        
        // 壁滑り
        if (p.onWall && p.vy > 2) {
            p.vy = 2;
        }
        
        // 位置更新
        p.x += p.vx;
        p.y += p.vy;
        
        // 画面外落下
        if (p.y > this.canvas.height + 100) {
            this.playerDeath();
        }
        
        // 前フレームのキー状態を保存
        this.previousKeys = {...this.keys};
    }
    
    playerShoot() {
        const p = this.player;
        
        if (this.playerBullets.length >= this.maxBullets && p.chargeLevel === 0) {
            return; // 通常弾の最大数制限
        }
        
        const weapon = this.weapons[this.currentWeapon];
        
        // 武器エネルギー消費
        if (this.currentWeapon !== 'normal') {
            const cost = weapon.energyCost * (p.chargeLevel + 1);
            if (p.weaponEnergy < cost) {
                return; // エネルギー不足
            }
            p.weaponEnergy -= cost;
        }
        
        // 弾生成
        const bullet = {
            x: p.x + (p.facing === 'right' ? p.width : 0),
            y: p.y + p.height / 2 - 4,
            vx: (p.facing === 'right' ? 1 : -1) * weapon.speed,
            vy: 0,
            width: p.chargeLevel === 2 ? 24 : p.chargeLevel === 1 ? 16 : 8,
            height: p.chargeLevel === 2 ? 24 : p.chargeLevel === 1 ? 16 : 8,
            damage: weapon.damage * (p.chargeLevel + 1),
            type: this.currentWeapon,
            chargeLevel: p.chargeLevel,
            color: weapon.color
        };
        
        // 特殊武器の挙動
        if (this.currentWeapon === 'metal') {
            // メタルブレード（8方向）
            const angle = this.getShootAngle();
            bullet.vx = Math.cos(angle) * weapon.speed;
            bullet.vy = Math.sin(angle) * weapon.speed;
        } else if (this.currentWeapon === 'wood') {
            // リーフシールド（周囲を回転）
            bullet.orbiting = true;
            bullet.angle = 0;
            bullet.radius = 40;
        }
        
        this.playerBullets.push(bullet);
        p.isShooting = true;
    }
    
    getShootAngle() {
        // 8方向ショットの角度計算
        let angle = 0;
        
        if (this.keys['arrowup']) {
            if (this.keys['arrowleft']) angle = -3 * Math.PI / 4;
            else if (this.keys['arrowright']) angle = -Math.PI / 4;
            else angle = -Math.PI / 2;
        } else if (this.keys['arrowdown']) {
            if (this.keys['arrowleft']) angle = 3 * Math.PI / 4;
            else if (this.keys['arrowright']) angle = Math.PI / 4;
            else angle = Math.PI / 2;
        } else {
            angle = this.player.facing === 'right' ? 0 : Math.PI;
        }
        
        return angle;
    }
    
    updateBullets() {
        // プレイヤーの弾
        this.playerBullets = this.playerBullets.filter(bullet => {
            if (bullet.orbiting) {
                // リーフシールドの回転
                bullet.angle += 0.1;
                bullet.x = this.player.x + this.player.width / 2 + Math.cos(bullet.angle) * bullet.radius;
                bullet.y = this.player.y + this.player.height / 2 + Math.sin(bullet.angle) * bullet.radius;
                return true;
            } else {
                bullet.x += bullet.vx;
                bullet.y += bullet.vy;
                
                // 画面外判定
                return bullet.x > -50 && bullet.x < this.currentLevel.width * this.tileSize + 50 &&
                       bullet.y > -50 && bullet.y < this.canvas.height + 50;
            }
        });
        
        // 敵の弾
        this.enemyBullets = this.enemyBullets.filter(bullet => {
            bullet.x += bullet.vx;
            bullet.y += bullet.vy;
            
            return bullet.x > -50 && bullet.x < this.currentLevel.width * this.tileSize + 50 &&
                   bullet.y > -50 && bullet.y < this.canvas.height + 50;
        });
    }
    
    updateEnemies() {
        this.enemies = this.enemies.filter(enemy => {
            if (enemy.health <= 0) {
                this.createExplosion(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                this.score += 100;
                return false;
            }
            
            // AI行動
            switch(enemy.behavior) {
                case 'patrol':
                    this.updatePatrolEnemy(enemy);
                    break;
                case 'shooter':
                    this.updateShooterEnemy(enemy);
                    break;
                case 'jumper':
                    this.updateJumperEnemy(enemy);
                    break;
            }
            
            // 重力
            enemy.vy += this.gravity;
            enemy.y += enemy.vy;
            
            // 地形衝突
            this.checkEnemyTileCollision(enemy);
            
            return true;
        });
    }
    
    updatePatrolEnemy(enemy) {
        enemy.x += enemy.vx;
        
        // 壁または崖で方向転換
        const tileX = Math.floor((enemy.x + (enemy.vx > 0 ? enemy.width : 0)) / this.tileSize);
        const tileY = Math.floor((enemy.y + enemy.height) / this.tileSize);
        
        if (this.currentLevel.tiles[tileY - 1] && this.currentLevel.tiles[tileY - 1][tileX] > 0) {
            enemy.vx *= -1;
        }
        
        if (!this.currentLevel.tiles[tileY] || !this.currentLevel.tiles[tileY][tileX] || 
            this.currentLevel.tiles[tileY][tileX] === 0) {
            enemy.vx *= -1;
        }
    }
    
    updateShooterEnemy(enemy) {
        enemy.shootTimer++;
        
        if (enemy.shootTimer > 120) {
            enemy.shootTimer = 0;
            
            // プレイヤーへの方向を計算
            const dx = this.player.x - enemy.x;
            const dy = this.player.y - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            
            if (distance < 400) {
                this.enemyBullets.push({
                    x: enemy.x + enemy.width / 2,
                    y: enemy.y + enemy.height / 2,
                    vx: (dx / distance) * 3,
                    vy: (dy / distance) * 3,
                    width: 8,
                    height: 8,
                    damage: 2
                });
            }
        }
    }
    
    updateJumperEnemy(enemy) {
        if (enemy.onGround && Math.random() < 0.02) {
            enemy.vy = -8;
            enemy.onGround = false;
        }
        
        enemy.x += enemy.vx;
    }
    
    updateBoss() {
        if (!this.boss || this.boss.health <= 0) {
            if (this.boss && this.boss.health <= 0) {
                this.defeatBoss();
            }
            return;
        }
        
        const boss = this.boss;
        
        // ボスAI
        boss.actionTimer++;
        
        switch(boss.currentAction) {
            case 'idle':
                if (boss.actionTimer > 60) {
                    boss.currentAction = this.chooseBossAction();
                    boss.actionTimer = 0;
                }
                break;
                
            case 'jump':
                if (boss.actionTimer === 1) {
                    boss.vy = -15;
                }
                boss.x += boss.vx;
                boss.vy += this.gravity;
                boss.y += boss.vy;
                
                if (boss.onGround && boss.actionTimer > 10) {
                    boss.currentAction = 'idle';
                    boss.actionTimer = 0;
                }
                break;
                
            case 'shoot':
                if (boss.actionTimer % 20 === 0 && boss.actionTimer <= 60) {
                    this.bossShoot();
                }
                if (boss.actionTimer > 80) {
                    boss.currentAction = 'idle';
                    boss.actionTimer = 0;
                }
                break;
                
            case 'special':
                this.bossSpecialAttack();
                if (boss.actionTimer > 120) {
                    boss.currentAction = 'idle';
                    boss.actionTimer = 0;
                }
                break;
        }
        
        // 地形衝突
        this.checkBossTileCollision();
        
        // 体力によるフェーズ変更
        if (boss.health < boss.maxHealth / 2 && boss.phase === 1) {
            boss.phase = 2;
            boss.invincible = true;
            setTimeout(() => { boss.invincible = false; }, 1000);
        }
    }
    
    chooseBossAction() {
        const actions = ['jump', 'shoot', 'special'];
        return actions[Math.floor(Math.random() * actions.length)];
    }
    
    bossShoot() {
        const boss = this.boss;
        
        // ボスタイプに応じた弾幕パターン
        switch(boss.type) {
            case 'fire':
                // 炎の弾を扇状に発射
                for (let i = -2; i <= 2; i++) {
                    this.enemyBullets.push({
                        x: boss.x + boss.width / 2,
                        y: boss.y + boss.height / 2,
                        vx: -5 + i * 2,
                        vy: -2 + Math.abs(i),
                        width: 12,
                        height: 12,
                        damage: 3,
                        color: '#FF4500'
                    });
                }
                break;
                
            case 'ice':
                // 氷の弾を直線発射
                this.enemyBullets.push({
                    x: boss.x,
                    y: boss.y + boss.height / 2,
                    vx: this.player.x < boss.x ? -6 : 6,
                    vy: 0,
                    width: 16,
                    height: 8,
                    damage: 4,
                    color: '#00CED1'
                });
                break;
                
            default:
                // 通常弾
                this.enemyBullets.push({
                    x: boss.x + boss.width / 2,
                    y: boss.y + boss.height / 2,
                    vx: this.player.x < boss.x ? -4 : 4,
                    vy: 0,
                    width: 10,
                    height: 10,
                    damage: 3
                });
        }
    }
    
    bossSpecialAttack() {
        // ボスの必殺技
        if (this.boss.actionTimer === 30) {
            const pattern = Math.floor(Math.random() * 3);
            
            switch(pattern) {
                case 0:
                    // 全方向弾幕
                    for (let angle = 0; angle < Math.PI * 2; angle += Math.PI / 8) {
                        this.enemyBullets.push({
                            x: this.boss.x + this.boss.width / 2,
                            y: this.boss.y + this.boss.height / 2,
                            vx: Math.cos(angle) * 4,
                            vy: Math.sin(angle) * 4,
                            width: 8,
                            height: 8,
                            damage: 2
                        });
                    }
                    break;
                    
                case 1:
                    // レーザー
                    this.enemyBullets.push({
                        x: this.boss.x,
                        y: this.boss.y + this.boss.height / 2,
                        vx: this.player.x < this.boss.x ? -10 : 10,
                        vy: 0,
                        width: 40,
                        height: 4,
                        damage: 5,
                        piercing: true
                    });
                    break;
                    
                case 2:
                    // 追尾弾
                    for (let i = 0; i < 3; i++) {
                        setTimeout(() => {
                            const dx = this.player.x - this.boss.x;
                            const dy = this.player.y - this.boss.y;
                            const dist = Math.sqrt(dx * dx + dy * dy);
                            
                            this.enemyBullets.push({
                                x: this.boss.x + this.boss.width / 2,
                                y: this.boss.y + this.boss.height / 2,
                                vx: (dx / dist) * 5,
                                vy: (dy / dist) * 5,
                                width: 12,
                                height: 12,
                                damage: 3,
                                homing: true
                            });
                        }, i * 500);
                    }
                    break;
            }
        }
    }
    
    updateItems() {
        this.items = this.items.filter(item => {
            if (item.collected) return false;
            
            // アイテムの浮遊アニメーション
            item.y += Math.sin(this.frameCount * 0.1) * 0.5;
            
            return true;
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.3;
            particle.life--;
            particle.alpha = particle.life / particle.maxLife;
            
            return particle.life > 0;
        });
        
        this.explosions = this.explosions.filter(explosion => {
            explosion.radius += 2;
            explosion.alpha -= 0.05;
            return explosion.alpha > 0;
        });
    }
    
    updateCamera() {
        // プレイヤーを中心に保ちつつ、スムーズに追従
        const targetX = this.player.x - this.camera.width / 2;
        const targetY = this.player.y - this.camera.height / 2;
        
        this.camera.x += (targetX - this.camera.x) * 0.1;
        this.camera.y += (targetY - this.camera.y) * 0.1;
        
        // カメラ範囲制限
        const maxX = this.currentLevel.width * this.tileSize - this.camera.width;
        const maxY = this.currentLevel.height * this.tileSize - this.camera.height;
        
        this.camera.x = Math.max(0, Math.min(maxX, this.camera.x));
        this.camera.y = Math.max(0, Math.min(maxY, this.camera.y));
    }
    
    checkCollisions() {
        // プレイヤーと地形
        this.checkPlayerTileCollision();
        
        // プレイヤーの弾と敵
        this.playerBullets.forEach(bullet => {
            this.enemies.forEach(enemy => {
                if (this.isColliding(bullet, enemy)) {
                    enemy.health -= bullet.damage;
                    if (!bullet.piercing) {
                        this.playerBullets = this.playerBullets.filter(b => b !== bullet);
                    }
                    this.createHitEffect(enemy.x + enemy.width / 2, enemy.y + enemy.height / 2);
                }
            });
            
            // ボスとの衝突
            if (this.boss && !this.boss.invincible && this.isColliding(bullet, this.boss)) {
                this.boss.health -= bullet.damage;
                if (!bullet.piercing) {
                    this.playerBullets = this.playerBullets.filter(b => b !== bullet);
                }
                this.createHitEffect(this.boss.x + this.boss.width / 2, this.boss.y + this.boss.height / 2);
            }
        });
        
        // 敵の弾とプレイヤー
        if (!this.player.invincible) {
            this.enemyBullets.forEach(bullet => {
                if (this.isColliding(bullet, this.player)) {
                    this.playerDamage(bullet.damage);
                    if (!bullet.piercing) {
                        this.enemyBullets = this.enemyBullets.filter(b => b !== bullet);
                    }
                }
            });
        }
        
        // プレイヤーと敵
        if (!this.player.invincible) {
            this.enemies.forEach(enemy => {
                if (this.isColliding(this.player, enemy)) {
                    this.playerDamage(3);
                }
            });
            
            // ボスとの衝突
            if (this.boss && this.isColliding(this.player, this.boss)) {
                this.playerDamage(4);
            }
        }
        
        // プレイヤーとアイテム
        this.items.forEach(item => {
            if (!item.collected && this.isColliding(this.player, {
                x: item.x - 16,
                y: item.y - 16,
                width: 32,
                height: 32
            })) {
                this.collectItem(item);
            }
        });
    }
    
    checkPlayerTileCollision() {
        const p = this.player;
        const tileSize = this.tileSize;
        
        // グリッド位置計算
        const leftTile = Math.floor(p.x / tileSize);
        const rightTile = Math.floor((p.x + p.width) / tileSize);
        const topTile = Math.floor(p.y / tileSize);
        const bottomTile = Math.floor((p.y + p.height) / tileSize);
        
        // リセット
        p.onGround = false;
        p.onWall = false;
        
        // 下方向の衝突
        for (let x = leftTile; x <= rightTile; x++) {
            if (this.isSolidTile(x, bottomTile)) {
                if (p.vy > 0) {
                    p.y = bottomTile * tileSize - p.height;
                    p.vy = 0;
                    p.onGround = true;
                    p.isJumping = false;
                }
            }
        }
        
        // 上方向の衝突
        for (let x = leftTile; x <= rightTile; x++) {
            if (this.isSolidTile(x, topTile)) {
                if (p.vy < 0) {
                    p.y = (topTile + 1) * tileSize;
                    p.vy = 0;
                }
            }
        }
        
        // 左右の衝突
        const middleTile = Math.floor((p.y + p.height / 2) / tileSize);
        
        // 右方向
        if (this.isSolidTile(rightTile, middleTile)) {
            if (p.vx > 0) {
                p.x = rightTile * tileSize - p.width - 1;
                p.vx = 0;
            }
            if (!p.onGround && p.vx > 0) {
                p.onWall = true;
                p.wallDirection = 'right';
            }
        }
        
        // 左方向
        if (this.isSolidTile(leftTile, middleTile)) {
            if (p.vx < 0) {
                p.x = (leftTile + 1) * tileSize + 1;
                p.vx = 0;
            }
            if (!p.onGround && p.vx < 0) {
                p.onWall = true;
                p.wallDirection = 'left';
            }
        }
        
        // 特殊タイル効果
        const currentTile = this.currentLevel.tiles[bottomTile] && this.currentLevel.tiles[bottomTile][Math.floor((p.x + p.width / 2) / tileSize)];
        
        if (currentTile === 3) {
            // スパイク
            this.playerDamage(1);
        } else if (currentTile === 4) {
            // 溶岩
            this.playerDamage(2);
        } else if (currentTile === 5 && p.onGround) {
            // 氷（滑る）
            p.vx *= 1.02;
        }
    }
    
    checkEnemyTileCollision(enemy) {
        const tileSize = this.tileSize;
        const bottomTile = Math.floor((enemy.y + enemy.height) / tileSize);
        const centerTileX = Math.floor((enemy.x + enemy.width / 2) / tileSize);
        
        if (this.isSolidTile(centerTileX, bottomTile)) {
            enemy.y = bottomTile * tileSize - enemy.height;
            enemy.vy = 0;
            enemy.onGround = true;
        } else {
            enemy.onGround = false;
        }
    }
    
    checkBossTileCollision() {
        if (!this.boss) return;
        
        const boss = this.boss;
        const tileSize = this.tileSize;
        const bottomTile = Math.floor((boss.y + boss.height) / tileSize);
        const centerTileX = Math.floor((boss.x + boss.width / 2) / tileSize);
        
        if (this.isSolidTile(centerTileX, bottomTile)) {
            boss.y = bottomTile * tileSize - boss.height;
            boss.vy = 0;
            boss.onGround = true;
        } else {
            boss.onGround = false;
        }
    }
    
    isSolidTile(x, y) {
        if (!this.currentLevel.tiles[y] || !this.currentLevel.tiles[y][x]) {
            return false;
        }
        return this.currentLevel.tiles[y][x] > 0 && this.currentLevel.tiles[y][x] !== 4; // 溶岩は通過可能
    }
    
    isColliding(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    playerDamage(damage) {
        if (this.player.invincible || this.player.isDamaged) return;
        
        this.player.health -= damage;
        this.player.invincible = true;
        this.player.invincibleTime = 120;
        this.player.isDamaged = true;
        this.player.knockbackTime = 20;
        
        // ノックバック
        this.player.vx = this.player.facing === 'right' ? -5 : 5;
        this.player.vy = -5;
        
        this.createDamageEffect();
        
        if (this.player.health <= 0) {
            this.playerDeath();
        }
    }
    
    playerDeath() {
        this.player.lives--;
        
        if (this.player.lives <= 0) {
            this.gameOver();
        } else {
            this.resetPlayer();
        }
    }
    
    collectItem(item) {
        item.collected = true;
        
        switch(item.type) {
            case 'energy_small':
                this.player.health = Math.min(this.player.maxHealth, this.player.health + item.value);
                break;
            case 'energy_large':
                this.player.health = Math.min(this.player.maxHealth, this.player.health + item.value);
                break;
            case 'weapon_energy':
                this.player.weaponEnergy = Math.min(this.player.maxWeaponEnergy, this.player.weaponEnergy + 8);
                break;
            case '1up':
                this.player.lives++;
                break;
            case 'etank':
                this.energyTanks++;
                break;
            case 'wtank':
                this.weaponTanks++;
                break;
        }
        
        this.createCollectEffect(item.x, item.y);
    }
    
    useItem(itemType) {
        if (this.gameState !== 'playing') return;
        
        switch(itemType) {
            case 'etank':
                if (this.energyTanks > 0 && this.player.health < this.player.maxHealth) {
                    this.energyTanks--;
                    this.player.health = this.player.maxHealth;
                    this.createHealEffect();
                }
                break;
            case 'wtank':
                if (this.weaponTanks > 0 && this.player.weaponEnergy < this.player.maxWeaponEnergy) {
                    this.weaponTanks--;
                    this.player.weaponEnergy = this.player.maxWeaponEnergy;
                }
                break;
        }
        
        this.updateHUD();
    }
    
    switchWeapon(direction) {
        const weapons = this.acquiredWeapons;
        const currentIndex = weapons.indexOf(this.currentWeapon);
        let newIndex = currentIndex + direction;
        
        if (newIndex < 0) newIndex = weapons.length - 1;
        if (newIndex >= weapons.length) newIndex = 0;
        
        this.currentWeapon = weapons[newIndex];
        
        // 武器変更時にエネルギー回復
        if (this.currentWeapon === 'normal') {
            this.player.weaponEnergy = this.player.maxWeaponEnergy;
        }
        
        this.updateHUD();
    }
    
    defeatBoss() {
        const bossType = this.boss.type;
        this.boss = null;
        
        // ボス撃破エフェクト
        for (let i = 0; i < 20; i++) {
            setTimeout(() => {
                this.createExplosion(
                    1700 + Math.random() * 64,
                    300 + Math.random() * 80
                );
            }, i * 100);
        }
        
        // ボス撃破後の処理
        setTimeout(() => {
            this.defeatedBosses.push(bossType);
            this.acquiredWeapons.push(bossType);
            this.stageClear();
        }, 2000);
    }
    
    stageClear() {
        this.gameState = 'stageClear';
        
        // スコア計算
        const timeBonus = this.player.health * 100;
        const noDamageBonus = this.player.health === this.player.maxHealth ? 5000 : 0;
        const totalScore = this.score + timeBonus + noDamageBonus;
        
        document.getElementById('timeBonus').textContent = timeBonus;
        document.getElementById('noDamageBonus').textContent = noDamageBonus;
        document.getElementById('totalScore').textContent = totalScore;
        
        // 武器獲得表示
        if (this.currentStage !== 'start') {
            const weapon = this.weapons[this.currentStage];
            document.getElementById('weaponGet').style.display = 'block';
            document.getElementById('newWeaponIcon').textContent = weapon.icon;
            document.getElementById('newWeaponName').textContent = weapon.name;
        }
        
        document.getElementById('stageClearScreen').style.display = 'flex';
        
        this.score = totalScore;
    }
    
    gameOver() {
        this.gameState = 'gameOver';
        
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('defeatedBosses').textContent = this.defeatedBosses.length;
        document.getElementById('gameOverScreen').style.display = 'flex';
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('pauseMenu').style.display = 'flex';
            
            // アイテム数更新
            document.getElementById('etank-count').textContent = this.energyTanks;
            document.getElementById('wtank-count').textContent = this.weaponTanks;
            document.getElementById('life-count').textContent = this.player.lives;
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
            document.getElementById('pauseMenu').style.display = 'none';
        }
    }
    
    exitToStageSelect() {
        this.gameState = 'stageSelect';
        document.getElementById('pauseMenu').style.display = 'none';
        this.showStageSelect();
    }
    
    resetGame() {
        this.defeatedBosses = [];
        this.acquiredWeapons = ['normal'];
        this.currentWeapon = 'normal';
        this.player.lives = 3;
        this.score = 0;
        this.energyTanks = 0;
        this.weaponTanks = 0;
        
        this.showStageSelect();
    }
    
    createChargeEffect() {
        // チャージエフェクト
        for (let i = 0; i < 5; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height / 2,
                vx: (Math.random() - 0.5) * 3,
                vy: (Math.random() - 0.5) * 3,
                color: '#00FFFF',
                size: 4,
                life: 20,
                maxLife: 20,
                alpha: 1
            });
        }
    }
    
    createHitEffect(x, y) {
        for (let i = 0; i < 8; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: (Math.random() - 0.5) * 5,
                color: '#FFFF00',
                size: 3,
                life: 15,
                maxLife: 15,
                alpha: 1
            });
        }
    }
    
    createDamageEffect() {
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height / 2,
                vx: (Math.random() - 0.5) * 6,
                vy: -Math.random() * 4 - 2,
                color: '#FF0000',
                size: 4,
                life: 25,
                maxLife: 25,
                alpha: 1
            });
        }
    }
    
    createCollectEffect(x, y) {
        for (let i = 0; i < 6; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: Math.cos(i * Math.PI / 3) * 3,
                vy: Math.sin(i * Math.PI / 3) * 3,
                color: '#00FF00',
                size: 3,
                life: 20,
                maxLife: 20,
                alpha: 1
            });
        }
    }
    
    createHealEffect() {
        for (let i = 0; i < 12; i++) {
            this.particles.push({
                x: this.player.x + this.player.width / 2,
                y: this.player.y + this.player.height,
                vx: (Math.random() - 0.5) * 2,
                vy: -Math.random() * 3 - 1,
                color: '#00FF00',
                size: 4,
                life: 30,
                maxLife: 30,
                alpha: 1
            });
        }
    }
    
    createExplosion(x, y) {
        this.explosions.push({
            x: x,
            y: y,
            radius: 10,
            alpha: 1,
            color: '#FFA500'
        });
        
        for (let i = 0; i < 15; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 8,
                vy: (Math.random() - 0.5) * 8,
                color: ['#FF0000', '#FFA500', '#FFFF00'][Math.floor(Math.random() * 3)],
                size: Math.random() * 4 + 2,
                life: Math.random() * 20 + 20,
                maxLife: 40,
                alpha: 1
            });
        }
    }
    
    updateHUD() {
        // 体力バー
        const healthPercent = (this.player.health / this.player.maxHealth) * 100;
        document.getElementById('playerHealthBar').style.width = healthPercent + '%';
        document.getElementById('playerHealthValue').textContent = this.player.health;
        
        // 武器エネルギー
        const weaponPercent = (this.player.weaponEnergy / this.player.maxWeaponEnergy) * 100;
        document.getElementById('weaponEnergyBar').style.width = weaponPercent + '%';
        document.getElementById('weaponEnergyValue').textContent = this.player.weaponEnergy;
        
        // ボス体力
        if (this.boss) {
            document.getElementById('bossHealthContainer').style.display = 'block';
            const bossPercent = (this.boss.health / this.boss.maxHealth) * 100;
            document.getElementById('bossHealthBar').style.width = bossPercent + '%';
            document.getElementById('bossHealthValue').textContent = this.boss.health;
        } else {
            document.getElementById('bossHealthContainer').style.display = 'none';
        }
        
        // その他
        document.getElementById('score').textContent = this.score;
        document.getElementById('lives').textContent = this.player.lives;
        document.getElementById('currentWeapon').textContent = this.weapons[this.currentWeapon].icon;
        document.getElementById('currentWeapon').style.color = this.weapons[this.currentWeapon].color;
    }
    
    render() {
        // クリア
        this.ctx.fillStyle = '#000033';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 背景
        this.drawBackground();
        
        // タイルマップ
        this.drawTiles();
        
        // アイテム
        this.drawItems();
        
        // 敵
        this.drawEnemies();
        
        // ボス
        if (this.boss) {
            this.drawBoss();
        }
        
        // プレイヤー
        this.drawPlayer();
        
        // 弾丸
        this.drawBullets();
        
        // エフェクト
        this.drawEffects();
        
        // デバッグ情報
        if (this.debug) {
            this.drawDebugInfo();
        }
    }
    
    drawBackground() {
        // 視差スクロール背景
        const parallaxX = -this.camera.x * 0.3;
        const parallaxY = -this.camera.y * 0.3;
        
        // グラデーション背景
        const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#000033');
        gradient.addColorStop(1, '#000066');
        this.ctx.fillStyle = gradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 星
        this.ctx.fillStyle = 'white';
        for (let i = 0; i < 50; i++) {
            const x = (i * 73 + parallaxX) % this.canvas.width;
            const y = (i * 37 + parallaxY) % this.canvas.height;
            const size = (i % 3) + 1;
            this.ctx.fillRect(x, y, size, size);
        }
    }
    
    drawTiles() {
        const tileSize = this.tileSize;
        const startX = Math.floor(this.camera.x / tileSize);
        const endX = Math.ceil((this.camera.x + this.camera.width) / tileSize);
        const startY = Math.floor(this.camera.y / tileSize);
        const endY = Math.ceil((this.camera.y + this.camera.height) / tileSize);
        
        for (let y = startY; y <= endY && y < this.currentLevel.height; y++) {
            for (let x = startX; x <= endX && x < this.currentLevel.width; x++) {
                const tile = this.currentLevel.tiles[y][x];
                if (tile === 0) continue;
                
                const drawX = x * tileSize - this.camera.x;
                const drawY = y * tileSize - this.camera.y;
                
                switch(tile) {
                    case 1: // 通常ブロック
                        this.ctx.fillStyle = '#4444AA';
                        this.ctx.fillRect(drawX, drawY, tileSize, tileSize);
                        this.ctx.strokeStyle = '#6666CC';
                        this.ctx.strokeRect(drawX, drawY, tileSize, tileSize);
                        break;
                        
                    case 2: // 地面
                        this.ctx.fillStyle = '#333388';
                        this.ctx.fillRect(drawX, drawY, tileSize, tileSize);
                        break;
                        
                    case 3: // スパイク
                        this.ctx.fillStyle = '#AA4444';
                        this.ctx.beginPath();
                        for (let i = 0; i < 4; i++) {
                            const spikeX = drawX + i * 8 + 4;
                            this.ctx.moveTo(spikeX - 4, drawY + tileSize);
                            this.ctx.lineTo(spikeX, drawY + tileSize - 8);
                            this.ctx.lineTo(spikeX + 4, drawY + tileSize);
                        }
                        this.ctx.fill();
                        break;
                        
                    case 4: // 溶岩
                        this.ctx.fillStyle = '#FF4500';
                        this.ctx.fillRect(drawX, drawY, tileSize, tileSize);
                        
                        // 溶岩のアニメーション
                        this.ctx.fillStyle = '#FF6500';
                        const bubbleY = drawY + Math.sin(this.frameCount * 0.1 + x) * 4;
                        this.ctx.fillRect(drawX, bubbleY, tileSize, 4);
                        break;
                        
                    case 5: // 氷
                        this.ctx.fillStyle = '#AAEEFF';
                        this.ctx.fillRect(drawX, drawY, tileSize, tileSize);
                        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.5)';
                        this.ctx.fillRect(drawX, drawY, tileSize, 4);
                        break;
                }
            }
        }
    }
    
    drawItems() {
        this.items.forEach(item => {
            if (item.collected) return;
            
            const drawX = item.x - this.camera.x;
            const drawY = item.y - this.camera.y;
            
            // アイテムの種類に応じて描画
            switch(item.type) {
                case 'energy_small':
                    this.ctx.fillStyle = '#FF6666';
                    this.ctx.fillRect(drawX - 4, drawY - 4, 8, 8);
                    break;
                    
                case 'energy_large':
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.fillRect(drawX - 8, drawY - 8, 16, 16);
                    break;
                    
                case 'weapon_energy':
                    this.ctx.fillStyle = '#0088FF';
                    this.ctx.fillRect(drawX - 4, drawY - 4, 8, 8);
                    break;
                    
                case '1up':
                    this.ctx.fillStyle = '#00FF00';
                    this.ctx.font = '16px Arial';
                    this.ctx.fillText('1UP', drawX - 12, drawY + 4);
                    break;
                    
                case 'etank':
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.fillRect(drawX - 8, drawY - 12, 16, 24);
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.fillText('E', drawX - 4, drawY + 2);
                    break;
            }
        });
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            const drawX = enemy.x - this.camera.x;
            const drawY = enemy.y - this.camera.y;
            
            // 敵タイプに応じた描画
            switch(enemy.type) {
                case 'metool':
                    // メットール（ヘルメット型）
                    this.ctx.fillStyle = '#FFD700';
                    this.ctx.beginPath();
                    this.ctx.arc(drawX + enemy.width / 2, drawY + enemy.height / 2, enemy.width / 2, Math.PI, 0);
                    this.ctx.fill();
                    
                    this.ctx.fillStyle = '#000';
                    this.ctx.fillRect(drawX + 8, drawY + 16, 4, 4);
                    this.ctx.fillRect(drawX + 20, drawY + 16, 4, 4);
                    break;
                    
                case 'fire_enemy':
                    this.ctx.fillStyle = '#FF4500';
                    this.ctx.fillRect(drawX, drawY, enemy.width, enemy.height);
                    
                    // 炎エフェクト
                    this.ctx.fillStyle = '#FFA500';
                    const flameHeight = Math.sin(this.frameCount * 0.2) * 4 + 4;
                    this.ctx.fillRect(drawX + 4, drawY - flameHeight, enemy.width - 8, flameHeight);
                    break;
                    
                default:
                    this.ctx.fillStyle = '#FF00FF';
                    this.ctx.fillRect(drawX, drawY, enemy.width, enemy.height);
            }
        });
    }
    
    drawBoss() {
        const drawX = this.boss.x - this.camera.x;
        const drawY = this.boss.y - this.camera.y;
        
        // ボスの点滅（ダメージ時）
        if (this.boss.invincible && this.frameCount % 10 < 5) {
            return;
        }
        
        // ボスタイプに応じた描画
        switch(this.boss.type) {
            case 'fire':
                // ファイアマン
                this.ctx.fillStyle = '#FF0000';
                this.ctx.fillRect(drawX, drawY, this.boss.width, this.boss.height);
                
                this.ctx.fillStyle = '#FF4500';
                this.ctx.fillRect(drawX + 8, drawY + 8, this.boss.width - 16, 20);
                
                // 炎の髪
                for (let i = 0; i < 5; i++) {
                    const flameX = drawX + 8 + i * 10;
                    const flameY = drawY - Math.abs(Math.sin(this.frameCount * 0.1 + i)) * 10;
                    this.ctx.fillStyle = '#FFA500';
                    this.ctx.fillRect(flameX, flameY, 8, 10);
                }
                break;
                
            case 'ice':
                // アイスマン
                this.ctx.fillStyle = '#00CED1';
                this.ctx.fillRect(drawX, drawY, this.boss.width, this.boss.height);
                
                this.ctx.fillStyle = '#FFFFFF';
                this.ctx.fillRect(drawX + 8, drawY + 8, this.boss.width - 16, 20);
                
                // 氷の結晶
                this.ctx.strokeStyle = '#00FFFF';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.moveTo(drawX + this.boss.width / 2, drawY - 10);
                this.ctx.lineTo(drawX + this.boss.width / 2, drawY + 10);
                this.ctx.moveTo(drawX + this.boss.width / 2 - 10, drawY);
                this.ctx.lineTo(drawX + this.boss.width / 2 + 10, drawY);
                this.ctx.stroke();
                break;
                
            default:
                this.ctx.fillStyle = '#8800FF';
                this.ctx.fillRect(drawX, drawY, this.boss.width, this.boss.height);
        }
        
        // ボスの目
        this.ctx.fillStyle = this.boss.phase === 2 ? '#FF0000' : '#FFFFFF';
        this.ctx.fillRect(drawX + 16, drawY + 24, 8, 8);
        this.ctx.fillRect(drawX + 40, drawY + 24, 8, 8);
    }
    
    drawPlayer() {
        const p = this.player;
        const drawX = p.x - this.camera.x;
        const drawY = p.y - this.camera.y;
        
        // 無敵時の点滅
        if (p.invincible && this.frameCount % 10 < 5) {
            return;
        }
        
        // プレイヤー本体
        this.ctx.fillStyle = '#0088FF';
        this.ctx.fillRect(drawX + 4, drawY + 8, p.width - 8, p.height - 8);
        
        // ヘルメット
        this.ctx.fillStyle = '#00BBFF';
        this.ctx.fillRect(drawX + 6, drawY, p.width - 12, 12);
        
        // 顔
        this.ctx.fillStyle = '#FFDDAA';
        this.ctx.fillRect(drawX + 8, drawY + 12, p.width - 16, 8);
        
        // 目
        this.ctx.fillStyle = '#000000';
        if (p.facing === 'right') {
            this.ctx.fillRect(drawX + 18, drawY + 14, 4, 4);
        } else {
            this.ctx.fillRect(drawX + 10, drawY + 14, 4, 4);
        }
        
        // アーム
        if (p.isShooting || p.isCharging) {
            this.ctx.fillStyle = '#00AAFF';
            if (p.facing === 'right') {
                this.ctx.fillRect(drawX + p.width - 4, drawY + 20, 12, 8);
            } else {
                this.ctx.fillRect(drawX - 8, drawY + 20, 12, 8);
            }
            
            // チャージエフェクト
            if (p.chargeLevel > 0) {
                const chargeSize = p.chargeLevel === 2 ? 12 : 8;
                const chargeColor = p.chargeLevel === 2 ? '#FFFF00' : '#00FFFF';
                this.ctx.fillStyle = chargeColor;
                this.ctx.globalAlpha = 0.5 + Math.sin(this.frameCount * 0.3) * 0.3;
                
                if (p.facing === 'right') {
                    this.ctx.beginPath();
                    this.ctx.arc(drawX + p.width + 8, drawY + 24, chargeSize, 0, Math.PI * 2);
                    this.ctx.fill();
                } else {
                    this.ctx.beginPath();
                    this.ctx.arc(drawX - 8, drawY + 24, chargeSize, 0, Math.PI * 2);
                    this.ctx.fill();
                }
                
                this.ctx.globalAlpha = 1;
            }
        }
        
        // 脚（スライディング時は描画しない）
        if (!p.isSliding) {
            this.ctx.fillStyle = '#0066CC';
            const legOffset = Math.abs(Math.sin(this.frameCount * 0.2)) * 4;
            
            if (Math.abs(p.vx) > 0.5) {
                // 走りアニメーション
                this.ctx.fillRect(drawX + 8, drawY + p.height - 8, 6, 8);
                this.ctx.fillRect(drawX + 18, drawY + p.height - 8 - legOffset, 6, 8);
            } else {
                // 立ち
                this.ctx.fillRect(drawX + 8, drawY + p.height - 8, 6, 8);
                this.ctx.fillRect(drawX + 18, drawY + p.height - 8, 6, 8);
            }
        }
    }
    
    drawBullets() {
        // プレイヤーの弾
        this.playerBullets.forEach(bullet => {
            const drawX = bullet.x - this.camera.x;
            const drawY = bullet.y - this.camera.y;
            
            this.ctx.fillStyle = bullet.color;
            
            if (bullet.chargeLevel === 2) {
                // 大チャージショット
                this.ctx.beginPath();
                this.ctx.arc(drawX + bullet.width / 2, drawY + bullet.height / 2, bullet.width / 2, 0, Math.PI * 2);
                this.ctx.fill();
                
                // 光輪エフェクト
                this.ctx.strokeStyle = bullet.color;
                this.ctx.globalAlpha = 0.5;
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(drawX + bullet.width / 2, drawY + bullet.height / 2, bullet.width, 0, Math.PI * 2);
                this.ctx.stroke();
                this.ctx.globalAlpha = 1;
            } else if (bullet.chargeLevel === 1) {
                // 中チャージショット
                this.ctx.fillRect(drawX, drawY, bullet.width, bullet.height);
            } else {
                // 通常弾
                this.ctx.fillRect(drawX, drawY, bullet.width, bullet.height);
            }
        });
        
        // 敵の弾
        this.enemyBullets.forEach(bullet => {
            const drawX = bullet.x - this.camera.x;
            const drawY = bullet.y - this.camera.y;
            
            this.ctx.fillStyle = bullet.color || '#FF00FF';
            this.ctx.fillRect(drawX, drawY, bullet.width, bullet.height);
        });
    }
    
    drawEffects() {
        // パーティクル
        this.particles.forEach(particle => {
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = particle.alpha;
            this.ctx.fillRect(
                particle.x - this.camera.x - particle.size / 2,
                particle.y - this.camera.y - particle.size / 2,
                particle.size,
                particle.size
            );
        });
        
        // 爆発
        this.explosions.forEach(explosion => {
            this.ctx.strokeStyle = explosion.color;
            this.ctx.globalAlpha = explosion.alpha;
            this.ctx.lineWidth = 3;
            this.ctx.beginPath();
            this.ctx.arc(
                explosion.x - this.camera.x,
                explosion.y - this.camera.y,
                explosion.radius,
                0,
                Math.PI * 2
            );
            this.ctx.stroke();
        });
        
        this.ctx.globalAlpha = 1;
    }
    
    drawDebugInfo() {
        this.ctx.fillStyle = 'white';
        this.ctx.font = '12px monospace';
        this.ctx.fillText(`FPS: ${Math.round(1000 / 16)}`, 10, 20);
        this.ctx.fillText(`Player: ${Math.floor(this.player.x)}, ${Math.floor(this.player.y)}`, 10, 35);
        this.ctx.fillText(`Camera: ${Math.floor(this.camera.x)}, ${Math.floor(this.camera.y)}`, 10, 50);
        this.ctx.fillText(`State: ${this.player.onGround ? 'Ground' : this.player.onWall ? 'Wall' : 'Air'}`, 10, 65);
    }
}

// ゲーム開始
window.addEventListener('DOMContentLoaded', () => {
    new MegaActionX();
});