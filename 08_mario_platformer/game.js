class PlatformerGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Canvas設定
        this.canvas.width = 800;
        this.canvas.height = 400;
        
        // ゲーム状態
        this.gameState = 'menu'; // menu, playing, paused, gameover
        this.lives = 3;
        this.coins = 0;
        this.score = 0;
        this.time = 300;
        this.currentLevel = '1-1';
        this.difficulty = 'normal';
        
        // カメラ
        this.camera = {
            x: 0,
            y: 0,
            width: this.canvas.width,
            height: this.canvas.height
        };
        
        // タイルサイズ
        this.tileSize = 32;
        
        // プレイヤー
        this.player = {
            x: 100,
            y: 200,
            width: 24,
            height: 32,
            vx: 0,
            vy: 0,
            speed: 4,
            jumpPower: 12,
            onGround: false,
            facing: 'right',
            isDashing: false,
            isPowerUp: false,
            invincible: false,
            invincibleTime: 0
        };
        
        // 物理定数
        this.gravity = 0.5;
        this.friction = 0.8;
        this.maxSpeed = 8;
        
        // 入力状態
        this.keys = {};
        
        // レベルデータ（簡易版）
        this.levels = {
            '1-1': {
                width: 50,
                height: 15,
                spawn: { x: 2, y: 10 },
                goal: { x: 48, y: 10 },
                tiles: this.generateLevel1(),
                enemies: [
                    { type: 'goomba', x: 10, y: 10 },
                    { type: 'goomba', x: 15, y: 10 },
                    { type: 'koopa', x: 20, y: 10 },
                    { type: 'goomba', x: 25, y: 10 },
                    { type: 'koopa', x: 35, y: 10 }
                ],
                coins: [
                    { x: 5, y: 8 },
                    { x: 6, y: 8 },
                    { x: 7, y: 8 },
                    { x: 12, y: 6 },
                    { x: 13, y: 6 },
                    { x: 18, y: 9 },
                    { x: 22, y: 7 },
                    { x: 30, y: 8 },
                    { x: 31, y: 8 },
                    { x: 32, y: 8 }
                ],
                powerups: [
                    { type: 'mushroom', x: 8, y: 8 },
                    { type: 'star', x: 28, y: 8 }
                ]
            }
        };
        
        // 現在のレベル
        this.currentLevelData = null;
        this.enemies = [];
        this.coins = [];
        this.powerups = [];
        this.particles = [];
        
        // タイマー
        this.gameTimer = null;
        this.frameCount = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.showStartScreen();
    }
    
    setupEventListeners() {
        // キーボード入力
        document.addEventListener('keydown', (e) => {
            this.keys[e.key] = true;
            
            if (e.key === 'p' || e.key === 'P') {
                this.togglePause();
            }
        });
        
        document.addEventListener('keyup', (e) => {
            this.keys[e.key] = false;
        });
        
        // スタート画面のボタン
        document.getElementById('startBtn').addEventListener('click', () => {
            this.difficulty = document.getElementById('difficulty').value;
            this.startGame();
        });
        
        // ゲームオーバー画面のボタン
        document.getElementById('retryBtn').addEventListener('click', () => {
            this.startGame();
        });
        
        document.getElementById('menuBtn').addEventListener('click', () => {
            this.showStartScreen();
        });
    }
    
    generateLevel1() {
        const tiles = [];
        const width = 50;
        const height = 15;
        
        // 空のマップを初期化
        for (let y = 0; y < height; y++) {
            tiles[y] = [];
            for (let x = 0; x < width; x++) {
                tiles[y][x] = 0; // 0 = 空
            }
        }
        
        // 地面を生成
        for (let x = 0; x < width; x++) {
            tiles[12][x] = 1; // 地面
            tiles[13][x] = 2; // 地面（下層）
            tiles[14][x] = 2; // 地面（下層）
        }
        
        // 穴を作る
        for (let x = 17; x <= 19; x++) {
            tiles[12][x] = 0;
            tiles[13][x] = 0;
            tiles[14][x] = 0;
        }
        
        // プラットフォーム
        for (let x = 5; x <= 8; x++) {
            tiles[9][x] = 3; // ブロック
        }
        
        for (let x = 12; x <= 14; x++) {
            tiles[7][x] = 3; // ブロック
        }
        
        for (let x = 22; x <= 24; x++) {
            tiles[8][x] = 3; // ブロック
        }
        
        for (let x = 30; x <= 33; x++) {
            tiles[9][x] = 3; // ブロック
        }
        
        // 階段
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j <= i; j++) {
                tiles[11 - i][40 + j] = 1;
            }
        }
        
        // ゴールの旗
        tiles[11][48] = 4; // 旗
        
        return tiles;
    }
    
    showStartScreen() {
        this.gameState = 'menu';
        document.getElementById('startScreen').style.display = 'flex';
        document.getElementById('gameOver').style.display = 'none';
    }
    
    startGame() {
        this.gameState = 'playing';
        document.getElementById('startScreen').style.display = 'none';
        document.getElementById('gameOver').style.display = 'none';
        
        // ゲーム状態をリセット
        this.lives = this.difficulty === 'easy' ? 5 : this.difficulty === 'hard' ? 1 : 3;
        this.coins = 0;
        this.score = 0;
        this.time = 300;
        this.currentLevel = '1-1';
        
        // レベルを読み込み
        this.loadLevel(this.currentLevel);
        
        // ゲームループを開始
        this.startGameLoop();
        
        // タイマーを開始
        this.startTimer();
    }
    
    loadLevel(levelName) {
        const level = this.levels[levelName];
        if (!level) return;
        
        this.currentLevelData = level;
        
        // プレイヤーをスポーン位置に配置
        this.player.x = level.spawn.x * this.tileSize;
        this.player.y = level.spawn.y * this.tileSize;
        this.player.vx = 0;
        this.player.vy = 0;
        
        // 敵を配置
        this.enemies = level.enemies.map(e => ({
            ...e,
            x: e.x * this.tileSize,
            y: e.y * this.tileSize,
            vx: -1,
            vy: 0,
            width: 24,
            height: 24,
            alive: true
        }));
        
        // コインを配置
        this.coins = level.coins.map(c => ({
            x: c.x * this.tileSize + 8,
            y: c.y * this.tileSize + 8,
            collected: false,
            animation: 0
        }));
        
        // パワーアップを配置
        this.powerups = level.powerups.map(p => ({
            ...p,
            x: p.x * this.tileSize + 8,
            y: p.y * this.tileSize + 8,
            collected: false
        }));
        
        // カメラをリセット
        this.camera.x = 0;
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
    
    startTimer() {
        if (this.gameTimer) {
            clearInterval(this.gameTimer);
        }
        
        this.gameTimer = setInterval(() => {
            if (this.gameState === 'playing') {
                this.time--;
                document.getElementById('time').textContent = this.time;
                
                if (this.time <= 0) {
                    this.gameOver('時間切れ！');
                }
            }
        }, 1000);
    }
    
    update() {
        // プレイヤーの更新
        this.updatePlayer();
        
        // 敵の更新
        this.updateEnemies();
        
        // アイテムの更新
        this.updateItems();
        
        // パーティクルの更新
        this.updateParticles();
        
        // カメラの更新
        this.updateCamera();
        
        // 衝突判定
        this.checkCollisions();
        
        // UI更新
        this.updateUI();
    }
    
    updatePlayer() {
        // 横移動
        if (this.keys['ArrowLeft']) {
            this.player.vx -= this.player.speed * 0.3;
            this.player.facing = 'left';
        }
        if (this.keys['ArrowRight']) {
            this.player.vx += this.player.speed * 0.3;
            this.player.facing = 'right';
        }
        
        // ダッシュ
        this.player.isDashing = this.keys['Shift'];
        const speedMultiplier = this.player.isDashing ? 1.5 : 1;
        
        // ジャンプ
        if ((this.keys[' '] || this.keys['ArrowUp']) && this.player.onGround) {
            this.player.vy = -this.player.jumpPower;
            this.player.onGround = false;
        }
        
        // 可変ジャンプ（ボタンを離すと上昇が止まる）
        if (this.player.vy < -3 && !(this.keys[' '] || this.keys['ArrowUp'])) {
            this.player.vy = -3;
        }
        
        // 重力を適用
        this.player.vy += this.gravity;
        
        // 速度制限
        this.player.vx = Math.max(-this.maxSpeed * speedMultiplier, 
                                  Math.min(this.maxSpeed * speedMultiplier, this.player.vx));
        this.player.vy = Math.min(15, this.player.vy); // 落下速度制限
        
        // 摩擦を適用
        if (!this.keys['ArrowLeft'] && !this.keys['ArrowRight']) {
            this.player.vx *= this.friction;
        }
        
        // 位置を更新
        this.player.x += this.player.vx;
        this.player.y += this.player.vy;
        
        // 無敵時間の更新
        if (this.player.invincible) {
            this.player.invincibleTime--;
            if (this.player.invincibleTime <= 0) {
                this.player.invincible = false;
            }
        }
        
        // 落下死判定
        if (this.player.y > this.canvas.height + 100) {
            this.playerDeath();
        }
    }
    
    updateEnemies() {
        this.enemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            // 重力
            enemy.vy += this.gravity;
            
            // 移動
            enemy.x += enemy.vx;
            enemy.y += enemy.vy;
            
            // 地形との衝突判定（簡易版）
            const tileX = Math.floor(enemy.x / this.tileSize);
            const tileY = Math.floor((enemy.y + enemy.height) / this.tileSize);
            
            if (this.currentLevelData.tiles[tileY] && 
                this.currentLevelData.tiles[tileY][tileX] > 0) {
                enemy.y = tileY * this.tileSize - enemy.height;
                enemy.vy = 0;
            }
            
            // 壁での方向転換
            const nextTileX = Math.floor((enemy.x + enemy.vx * 2) / this.tileSize);
            if (this.currentLevelData.tiles[tileY - 1] &&
                this.currentLevelData.tiles[tileY - 1][nextTileX] > 0) {
                enemy.vx *= -1;
            }
            
            // 崖での方向転換
            const edgeTileX = Math.floor((enemy.x + (enemy.vx > 0 ? enemy.width : 0)) / this.tileSize);
            if (!this.currentLevelData.tiles[tileY] || 
                !this.currentLevelData.tiles[tileY][edgeTileX] ||
                this.currentLevelData.tiles[tileY][edgeTileX] === 0) {
                enemy.vx *= -1;
            }
        });
    }
    
    updateItems() {
        // コインのアニメーション
        this.coins.forEach(coin => {
            if (!coin.collected) {
                coin.animation = (coin.animation + 0.1) % (Math.PI * 2);
            }
        });
    }
    
    updateParticles() {
        this.particles = this.particles.filter(particle => {
            particle.x += particle.vx;
            particle.y += particle.vy;
            particle.vy += 0.3;
            particle.life--;
            return particle.life > 0;
        });
    }
    
    updateCamera() {
        // プレイヤーを中心に保つ（線形補間でスムーズに）
        const targetX = this.player.x - this.camera.width / 2;
        this.camera.x += (targetX - this.camera.x) * 0.1;
        
        // カメラの範囲制限
        const maxCameraX = this.currentLevelData.width * this.tileSize - this.camera.width;
        this.camera.x = Math.max(0, Math.min(maxCameraX, this.camera.x));
    }
    
    checkCollisions() {
        // タイルとの衝突判定
        this.checkTileCollisions();
        
        // 敵との衝突判定
        this.enemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            if (this.isColliding(this.player, enemy)) {
                if (this.player.vy > 0 && this.player.y < enemy.y) {
                    // 敵を踏んだ
                    enemy.alive = false;
                    this.player.vy = -8;
                    this.score += 100;
                    this.createParticles(enemy.x + enemy.width/2, enemy.y, 'defeat');
                } else if (!this.player.invincible) {
                    // ダメージ
                    this.playerHit();
                }
            }
        });
        
        // コインとの衝突判定
        this.coins.forEach(coin => {
            if (!coin.collected && this.isCollidingPoint(this.player, coin.x, coin.y, 16)) {
                coin.collected = true;
                this.coins++;
                this.score += 10;
                this.createParticles(coin.x, coin.y, 'coin');
            }
        });
        
        // パワーアップとの衝突判定
        this.powerups.forEach(powerup => {
            if (!powerup.collected && this.isCollidingPoint(this.player, powerup.x, powerup.y, 16)) {
                powerup.collected = true;
                
                if (powerup.type === 'mushroom') {
                    this.player.isPowerUp = true;
                    this.player.height = 48;
                    this.score += 1000;
                } else if (powerup.type === 'star') {
                    this.player.invincible = true;
                    this.player.invincibleTime = 300;
                    this.score += 1000;
                }
                
                this.createParticles(powerup.x, powerup.y, 'powerup');
            }
        });
        
        // ゴール判定
        const goalX = this.currentLevelData.goal.x * this.tileSize;
        const goalY = this.currentLevelData.goal.y * this.tileSize;
        
        if (Math.abs(this.player.x - goalX) < 32 && Math.abs(this.player.y - goalY) < 64) {
            this.levelComplete();
        }
    }
    
    checkTileCollisions() {
        const playerLeft = Math.floor(this.player.x / this.tileSize);
        const playerRight = Math.floor((this.player.x + this.player.width) / this.tileSize);
        const playerTop = Math.floor(this.player.y / this.tileSize);
        const playerBottom = Math.floor((this.player.y + this.player.height) / this.tileSize);
        
        this.player.onGround = false;
        
        // 下方向の衝突
        for (let x = playerLeft; x <= playerRight; x++) {
            if (this.currentLevelData.tiles[playerBottom] && 
                this.currentLevelData.tiles[playerBottom][x] > 0) {
                if (this.player.vy > 0) {
                    this.player.y = playerBottom * this.tileSize - this.player.height;
                    this.player.vy = 0;
                    this.player.onGround = true;
                }
            }
        }
        
        // 上方向の衝突
        for (let x = playerLeft; x <= playerRight; x++) {
            if (this.currentLevelData.tiles[playerTop] && 
                this.currentLevelData.tiles[playerTop][x] > 0) {
                if (this.player.vy < 0) {
                    this.player.y = (playerTop + 1) * this.tileSize;
                    this.player.vy = 0;
                }
            }
        }
        
        // 左右の衝突
        const playerMiddle = Math.floor((this.player.y + this.player.height/2) / this.tileSize);
        
        // 右方向
        if (this.currentLevelData.tiles[playerMiddle] && 
            this.currentLevelData.tiles[playerMiddle][playerRight] > 0) {
            if (this.player.vx > 0) {
                this.player.x = playerRight * this.tileSize - this.player.width - 1;
                this.player.vx = 0;
            }
        }
        
        // 左方向
        if (this.currentLevelData.tiles[playerMiddle] && 
            this.currentLevelData.tiles[playerMiddle][playerLeft] > 0) {
            if (this.player.vx < 0) {
                this.player.x = (playerLeft + 1) * this.tileSize + 1;
                this.player.vx = 0;
            }
        }
    }
    
    isColliding(a, b) {
        return a.x < b.x + b.width &&
               a.x + a.width > b.x &&
               a.y < b.y + b.height &&
               a.y + a.height > b.y;
    }
    
    isCollidingPoint(rect, x, y, radius) {
        return x > rect.x - radius &&
               x < rect.x + rect.width + radius &&
               y > rect.y - radius &&
               y < rect.y + rect.height + radius;
    }
    
    playerHit() {
        if (this.player.isPowerUp) {
            this.player.isPowerUp = false;
            this.player.height = 32;
            this.player.invincible = true;
            this.player.invincibleTime = 120;
        } else {
            this.playerDeath();
        }
    }
    
    playerDeath() {
        this.lives--;
        
        if (this.lives <= 0) {
            this.gameOver('ゲームオーバー！');
        } else {
            // リスポーン
            this.loadLevel(this.currentLevel);
        }
    }
    
    levelComplete() {
        this.score += this.time * 10;
        this.gameOver('クリア！');
    }
    
    gameOver(message) {
        this.gameState = 'gameover';
        clearInterval(this.gameTimer);
        
        const isVictory = message === 'クリア！';
        document.getElementById('gameOverTitle').textContent = isVictory ? 'CLEAR!' : 'GAME OVER';
        document.getElementById('gameOverTitle').className = isVictory ? 'victory' : '';
        document.getElementById('gameOverMessage').textContent = message;
        document.getElementById('finalScore').textContent = this.score;
        document.getElementById('finalCoins').textContent = this.coins;
        document.getElementById('gameOver').style.display = 'flex';
    }
    
    createParticles(x, y, type) {
        const colors = {
            coin: ['#FFD700', '#FFA500'],
            defeat: ['#FF0000', '#800000'],
            powerup: ['#00FF00', '#00AA00']
        };
        
        const particleColors = colors[type] || ['#FFFFFF'];
        
        for (let i = 0; i < 10; i++) {
            this.particles.push({
                x: x,
                y: y,
                vx: (Math.random() - 0.5) * 5,
                vy: -Math.random() * 5 - 2,
                color: particleColors[Math.floor(Math.random() * particleColors.length)],
                life: 30
            });
        }
    }
    
    togglePause() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
        } else if (this.gameState === 'paused') {
            this.gameState = 'playing';
        }
    }
    
    updateUI() {
        document.getElementById('lives').textContent = this.lives;
        document.getElementById('coins').textContent = this.coins;
        document.getElementById('score').textContent = this.score;
        document.getElementById('level').textContent = this.currentLevel;
    }
    
    render() {
        // クリア
        this.ctx.fillStyle = '#87CEEB';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // 背景の雲（パララックス効果）
        this.drawClouds();
        
        // タイルマップを描画
        this.drawTiles();
        
        // アイテムを描画
        this.drawItems();
        
        // 敵を描画
        this.drawEnemies();
        
        // プレイヤーを描画
        this.drawPlayer();
        
        // パーティクルを描画
        this.drawParticles();
        
        // ポーズ表示
        if (this.gameState === 'paused') {
            this.ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
            
            this.ctx.fillStyle = 'white';
            this.ctx.font = '48px Arial';
            this.ctx.textAlign = 'center';
            this.ctx.fillText('PAUSED', this.canvas.width / 2, this.canvas.height / 2);
        }
    }
    
    drawClouds() {
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        
        // パララックス効果で雲を描画
        const cloudX1 = 100 - (this.camera.x * 0.3) % (this.canvas.width + 200);
        const cloudX2 = 400 - (this.camera.x * 0.3) % (this.canvas.width + 200);
        const cloudX3 = 700 - (this.camera.x * 0.3) % (this.canvas.width + 200);
        
        this.drawCloud(cloudX1, 50);
        this.drawCloud(cloudX2, 100);
        this.drawCloud(cloudX3, 80);
    }
    
    drawCloud(x, y) {
        this.ctx.beginPath();
        this.ctx.arc(x, y, 25, 0, Math.PI * 2);
        this.ctx.arc(x + 25, y, 35, 0, Math.PI * 2);
        this.ctx.arc(x + 50, y, 25, 0, Math.PI * 2);
        this.ctx.fill();
    }
    
    drawTiles() {
        const startX = Math.floor(this.camera.x / this.tileSize);
        const endX = Math.ceil((this.camera.x + this.camera.width) / this.tileSize);
        
        for (let y = 0; y < this.currentLevelData.height; y++) {
            for (let x = startX; x <= endX && x < this.currentLevelData.width; x++) {
                const tile = this.currentLevelData.tiles[y][x];
                
                if (tile > 0) {
                    const drawX = x * this.tileSize - this.camera.x;
                    const drawY = y * this.tileSize;
                    
                    switch(tile) {
                        case 1: // 地面（上部）
                            this.ctx.fillStyle = '#8B4513';
                            this.ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
                            this.ctx.fillStyle = '#228B22';
                            this.ctx.fillRect(drawX, drawY, this.tileSize, 4);
                            break;
                        case 2: // 地面（下部）
                            this.ctx.fillStyle = '#654321';
                            this.ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
                            break;
                        case 3: // ブロック
                            this.ctx.fillStyle = '#D2691E';
                            this.ctx.fillRect(drawX, drawY, this.tileSize, this.tileSize);
                            this.ctx.strokeStyle = '#8B4513';
                            this.ctx.strokeRect(drawX, drawY, this.tileSize, this.tileSize);
                            break;
                        case 4: // ゴール旗
                            this.ctx.fillStyle = '#FFD700';
                            this.ctx.fillRect(drawX + 14, drawY - 64, 4, 96);
                            this.ctx.fillStyle = '#FF0000';
                            this.ctx.beginPath();
                            this.ctx.moveTo(drawX + 18, drawY - 64);
                            this.ctx.lineTo(drawX + 48, drawY - 48);
                            this.ctx.lineTo(drawX + 18, drawY - 32);
                            this.ctx.fill();
                            break;
                    }
                }
            }
        }
    }
    
    drawItems() {
        // コインを描画
        this.coins.forEach(coin => {
            if (!coin.collected) {
                const drawX = coin.x - this.camera.x;
                const drawY = coin.y + Math.sin(coin.animation) * 3;
                
                this.ctx.fillStyle = '#FFD700';
                this.ctx.beginPath();
                this.ctx.arc(drawX, drawY, 8, 0, Math.PI * 2);
                this.ctx.fill();
                
                this.ctx.fillStyle = '#FFA500';
                this.ctx.font = '12px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText('¢', drawX, drawY + 4);
            }
        });
        
        // パワーアップを描画
        this.powerups.forEach(powerup => {
            if (!powerup.collected) {
                const drawX = powerup.x - this.camera.x;
                const drawY = powerup.y;
                
                if (powerup.type === 'mushroom') {
                    // キノコ
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.beginPath();
                    this.ctx.arc(drawX, drawY - 4, 8, Math.PI, 0);
                    this.ctx.fill();
                    
                    this.ctx.fillStyle = '#FFFFFF';
                    this.ctx.fillRect(drawX - 4, drawY - 4, 8, 8);
                } else if (powerup.type === 'star') {
                    // スター
                    this.ctx.fillStyle = '#FFD700';
                    this.drawStar(drawX, drawY, 10);
                }
            }
        });
    }
    
    drawStar(x, y, radius) {
        this.ctx.beginPath();
        for (let i = 0; i < 5; i++) {
            const angle = (Math.PI * 2 / 5) * i - Math.PI / 2;
            const innerAngle = angle + Math.PI / 5;
            
            if (i === 0) {
                this.ctx.moveTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
            } else {
                this.ctx.lineTo(x + Math.cos(angle) * radius, y + Math.sin(angle) * radius);
            }
            
            this.ctx.lineTo(x + Math.cos(innerAngle) * radius * 0.5, y + Math.sin(innerAngle) * radius * 0.5);
        }
        this.ctx.closePath();
        this.ctx.fill();
    }
    
    drawEnemies() {
        this.enemies.forEach(enemy => {
            if (!enemy.alive) return;
            
            const drawX = enemy.x - this.camera.x;
            const drawY = enemy.y;
            
            if (enemy.type === 'goomba') {
                // クリボー
                this.ctx.fillStyle = '#8B4513';
                this.ctx.fillRect(drawX, drawY + 8, enemy.width, enemy.height - 8);
                this.ctx.fillStyle = '#654321';
                this.ctx.fillRect(drawX + 4, drawY + 16, 4, 8);
                this.ctx.fillRect(drawX + 16, drawY + 16, 4, 8);
            } else if (enemy.type === 'koopa') {
                // ノコノコ
                this.ctx.fillStyle = '#00FF00';
                this.ctx.fillRect(drawX + 4, drawY + 4, enemy.width - 8, enemy.height - 8);
                this.ctx.fillStyle = '#008000';
                this.ctx.fillRect(drawX, drawY + 12, enemy.width, 8);
            }
        });
    }
    
    drawPlayer() {
        const drawX = this.player.x - this.camera.x;
        const drawY = this.player.y;
        
        // 無敵時は点滅
        if (this.player.invincible && this.frameCount % 10 < 5) {
            return;
        }
        
        // プレイヤーの色
        const bodyColor = this.player.isPowerUp ? '#FF0000' : '#0000FF';
        const skinColor = '#FFDBAC';
        
        // 体
        this.ctx.fillStyle = bodyColor;
        this.ctx.fillRect(drawX + 4, drawY + 12, 16, 20);
        
        // 頭
        this.ctx.fillStyle = skinColor;
        this.ctx.fillRect(drawX + 6, drawY, 12, 12);
        
        // 帽子
        this.ctx.fillStyle = '#FF0000';
        this.ctx.fillRect(drawX + 4, drawY - 4, 16, 6);
        
        // 足
        this.ctx.fillStyle = '#8B4513';
        const legOffset = Math.abs(Math.sin(this.frameCount * 0.2)) * 4;
        if (Math.abs(this.player.vx) > 0.5) {
            this.ctx.fillRect(drawX + 4, drawY + 28, 6, 4);
            this.ctx.fillRect(drawX + 14, drawY + 28 - legOffset, 6, 4);
        } else {
            this.ctx.fillRect(drawX + 4, drawY + 28, 6, 4);
            this.ctx.fillRect(drawX + 14, drawY + 28, 6, 4);
        }
    }
    
    drawParticles() {
        this.particles.forEach(particle => {
            const alpha = particle.life / 30;
            this.ctx.fillStyle = particle.color;
            this.ctx.globalAlpha = alpha;
            this.ctx.fillRect(
                particle.x - this.camera.x - 2,
                particle.y - 2,
                4,
                4
            );
        });
        this.ctx.globalAlpha = 1;
    }
}

// ゲーム開始
window.addEventListener('DOMContentLoaded', () => {
    new PlatformerGame();
});