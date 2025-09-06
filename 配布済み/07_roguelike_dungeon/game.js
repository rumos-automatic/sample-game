// ローグライクダンジョンゲーム

// ゲーム定数
const TILE_SIZE = 36;
const MAP_WIDTH = 32;
const MAP_HEIGHT = 20;
const VISIBILITY_RADIUS = 7;
const MAX_FLOOR = 10;

// タイルタイプ
const TILES = {
    WALL: '#',
    FLOOR: '.',
    DOOR: '+',
    STAIRS: '>',
    PLAYER: '@',
    ENEMY: 'E',
    ITEM: 'I',
    CHEST: 'C'
};

// 職業定義 - ネオンカラースキーム追加
const CLASSES = {
    warrior: {
        name: '戦士',
        icon: '⚔️',
        colors: {
            primary: '#FF6B6B',
            secondary: '#FF3333',
            glow: '#FF0000',
            trail: 'rgba(255, 107, 107, 0.3)'
        },
        hp: 120,
        mp: 30,
        atk: 15,
        def: 12,
        mag: 5,
        spd: 8,
        skills: [
            { name: '強撃', cost: 5, damage: 2.0, cooldown: 0 },
            { name: '防御態勢', cost: 10, effect: 'defense', cooldown: 0 }
        ]
    },
    mage: {
        name: '魔法使い',
        icon: '🔮',
        colors: {
            primary: '#6B9FFF',
            secondary: '#4080FF',
            glow: '#0066FF',
            trail: 'rgba(107, 159, 255, 0.3)'
        },
        hp: 70,
        mp: 100,
        atk: 8,
        def: 5,
        mag: 20,
        spd: 10,
        skills: [
            { name: 'ファイアボール', cost: 10, damage: 3.0, cooldown: 0 },
            { name: 'アイスシャード', cost: 8, damage: 2.0, freeze: true, cooldown: 0 }
        ]
    },
    rogue: {
        name: '盗賊',
        icon: '🗡️',
        colors: {
            primary: '#B76BFF',
            secondary: '#9933FF',
            glow: '#7700FF',
            trail: 'rgba(183, 107, 255, 0.3)'
        },
        hp: 90,
        mp: 50,
        atk: 12,
        def: 8,
        mag: 8,
        spd: 15,
        skills: [
            { name: '急所攻撃', cost: 8, damage: 2.5, critical: true, cooldown: 0 },
            { name: '隠れ身', cost: 15, effect: 'stealth', cooldown: 0 }
        ]
    },
    priest: {
        name: '僧侶',
        icon: '✨',
        colors: {
            primary: '#FFE66B',
            secondary: '#FFD700',
            glow: '#FFC000',
            trail: 'rgba(255, 230, 107, 0.3)'
        },
        hp: 100,
        mp: 80,
        atk: 10,
        def: 10,
        mag: 15,
        spd: 9,
        skills: [
            { name: 'ヒール', cost: 10, heal: 0.5, cooldown: 0 },
            { name: 'ホーリーライト', cost: 15, damage: 2.5, holy: true, cooldown: 0 }
        ]
    }
};

// 敵タイプ - ネオンカラースキーム追加
const ENEMY_TYPES = {
    slime: {
        name: 'スライム',
        icon: '🟢',
        colors: {
            primary: '#00FF88',
            secondary: '#00CC66',
            glow: '#00FF00',
            pulse: true
        },
        hp: 30,
        atk: 8,
        def: 3,
        exp: 10,
        gold: 5
    },
    goblin: {
        name: 'ゴブリン',
        icon: '👺',
        colors: {
            primary: '#FF8800',
            secondary: '#CC6600',
            glow: '#FF6600',
            pulse: false
        },
        hp: 50,
        atk: 12,
        def: 5,
        exp: 20,
        gold: 15
    },
    skeleton: {
        name: 'スケルトン',
        icon: '💀',
        colors: {
            primary: '#AAAAAA',
            secondary: '#888888',
            glow: '#FFFFFF',
            pulse: false
        },
        hp: 60,
        atk: 15,
        def: 8,
        exp: 30,
        gold: 25
    },
    orc: {
        name: 'オーク',
        icon: '👹',
        colors: {
            primary: '#CC0066',
            secondary: '#990044',
            glow: '#FF0088',
            pulse: false
        },
        hp: 80,
        atk: 20,
        def: 10,
        exp: 50,
        gold: 40
    },
    dragon: {
        name: 'ドラゴン',
        icon: '🐲',
        colors: {
            primary: '#FF00FF',
            secondary: '#CC00CC',
            glow: '#FF00FF',
            pulse: true
        },
        hp: 200,
        atk: 35,
        def: 20,
        exp: 200,
        gold: 200
    }
};

// アイテムタイプ
const ITEM_TYPES = {
    potion: {
        name: 'ポーション',
        icon: '🧪',
        type: 'consumable',
        effect: { heal: 50 }
    },
    manaPotion: {
        name: 'マナポーション',
        icon: '💙',
        type: 'consumable',
        effect: { mana: 30 }
    },
    sword: {
        name: '鉄の剣',
        icon: '⚔️',
        type: 'weapon',
        stats: { atk: 5 }
    },
    staff: {
        name: '魔法の杖',
        icon: '🪄',
        type: 'weapon',
        stats: { mag: 8 }
    },
    armor: {
        name: '鉄の鎧',
        icon: '🛡️',
        type: 'armor',
        stats: { def: 5 }
    },
    ring: {
        name: '力の指輪',
        icon: '💍',
        type: 'accessory',
        stats: { atk: 3, spd: 2 }
    },
    key: {
        name: '鍵',
        icon: '🔑',
        type: 'key'
    }
};

// ゲームクラス
class RoguelikeGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.minimapCanvas = null;
        this.minimapCtx = null;
        this.gameState = 'title';
        this.selectedClass = null;
        this.player = null;
        this.dungeon = null;
        this.currentFloor = 1;
        this.turn = 0;
        this.enemies = [];
        this.items = [];
        this.inventory = [];
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };
        this.messageLog = [];
        this.visibility = [];
        this.discovered = [];
        this.records = this.loadRecords();
        this.effects = [];  // ビジュアルエフェクト用
        this.animationFrame = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showTitleScreen();
    }

    setupEventListeners() {
        // タイトル画面
        document.getElementById('newGameBtn').addEventListener('click', () => this.showCharacterSelect());
        document.getElementById('continueBtn').addEventListener('click', () => this.continueGame());
        document.getElementById('recordsBtn').addEventListener('click', () => this.showRecords());
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());

        // キャラクター選択
        document.querySelectorAll('.class-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const className = e.currentTarget.dataset.class;
                this.selectClass(className);
            });
        });
        document.getElementById('classBackBtn').addEventListener('click', () => this.showTitleScreen());

        // ゲーム画面の移動ボタン
        document.getElementById('moveUpLeft').addEventListener('click', () => this.movePlayer(-1, -1));
        document.getElementById('moveUp').addEventListener('click', () => this.movePlayer(0, -1));
        document.getElementById('moveUpRight').addEventListener('click', () => this.movePlayer(1, -1));
        document.getElementById('moveLeft').addEventListener('click', () => this.movePlayer(-1, 0));
        document.getElementById('moveWait').addEventListener('click', () => this.waitTurn());
        document.getElementById('moveRight').addEventListener('click', () => this.movePlayer(1, 0));
        document.getElementById('moveDownLeft').addEventListener('click', () => this.movePlayer(-1, 1));
        document.getElementById('moveDown').addEventListener('click', () => this.movePlayer(0, 1));
        document.getElementById('moveDownRight').addEventListener('click', () => this.movePlayer(1, 1));

        // アクションボタン
        document.getElementById('attackBtn').addEventListener('click', () => this.toggleAttackMode());
        document.getElementById('skillBtn').addEventListener('click', () => this.showSkillMenu());
        document.getElementById('itemBtn').addEventListener('click', () => this.showInventory());
        document.getElementById('menuBtn').addEventListener('click', () => this.showGameMenu());

        // ポップアップボタン
        document.getElementById('cancelItemBtn').addEventListener('click', () => this.closeItemPopup());
        document.getElementById('cancelSkillBtn').addEventListener('click', () => this.closeSkillPopup());

        // レベルアップ
        document.getElementById('levelupOkBtn').addEventListener('click', () => this.closeLevelupScreen());

        // 階段
        document.getElementById('goDownBtn').addEventListener('click', () => this.goDownStairs());
        document.getElementById('stayBtn').addEventListener('click', () => this.closeStairsScreen());

        // ゲームオーバー/ビクトリー
        document.getElementById('restartBtn').addEventListener('click', () => this.returnToTitle());
        document.getElementById('victoryBtn').addEventListener('click', () => this.returnToTitle());

        // ヘルプ/記録
        document.getElementById('helpCloseBtn').addEventListener('click', () => this.closeHelp());
        document.getElementById('recordsCloseBtn').addEventListener('click', () => this.closeRecords());

        // キーボード操作
        document.addEventListener('keydown', (e) => this.handleKeyPress(e));
    }

    handleKeyPress(e) {
        if (this.gameState !== 'playing') return;

        switch(e.key) {
            case 'ArrowUp':
            case 'w':
                this.movePlayer(0, -1);
                break;
            case 'ArrowDown':
            case 's':
                this.movePlayer(0, 1);
                break;
            case 'ArrowLeft':
            case 'a':
                this.movePlayer(-1, 0);
                break;
            case 'ArrowRight':
            case 'd':
                this.movePlayer(1, 0);
                break;
            case ' ':
                this.waitTurn();
                break;
            case 'q':
                this.movePlayer(-1, -1);
                break;
            case 'e':
                this.movePlayer(1, -1);
                break;
            case 'z':
                this.movePlayer(-1, 1);
                break;
            case 'c':
                this.movePlayer(1, 1);
                break;
        }
    }

    showTitleScreen() {
        document.getElementById('titleScreen').style.display = 'flex';
        document.getElementById('characterSelect').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'none';
        this.gameState = 'title';
    }

    showCharacterSelect() {
        document.getElementById('titleScreen').style.display = 'none';
        document.getElementById('characterSelect').style.display = 'block';
        this.gameState = 'character_select';
    }

    selectClass(className) {
        this.selectedClass = className;
        this.startNewGame();
    }

    startNewGame() {
        // プレイヤー初期化
        const classData = CLASSES[this.selectedClass];
        this.player = {
            class: this.selectedClass,
            name: classData.name,
            icon: classData.icon,
            colors: classData.colors,
            hp: classData.hp,
            mp: classData.mp,
            atk: classData.atk,
            def: classData.def,
            mag: classData.mag,
            spd: classData.spd,
            skills: classData.skills,
            level: 1,
            exp: 0,
            expNext: 100,
            currentHp: classData.hp,
            currentMp: classData.mp,
            maxHp: classData.hp,
            maxMp: classData.mp,
            x: 0,
            y: 0,
            gold: 0,
            keys: 0
        };

        // ゲーム初期化
        this.currentFloor = 1;
        this.turn = 0;
        this.inventory = [];
        this.equipment = {
            weapon: null,
            armor: null,
            accessory: null
        };
        this.messageLog = [];
        
        // 初期アイテム
        this.inventory.push({ ...ITEM_TYPES.potion, id: Date.now() });
        this.inventory.push({ ...ITEM_TYPES.potion, id: Date.now() + 1 });

        // ダンジョン生成
        this.generateDungeon();
        
        // ゲーム画面表示
        document.getElementById('characterSelect').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'grid';
        this.gameState = 'playing';

        // Canvas初期化
        this.initCanvas();
        
        // 初期メッセージ
        this.addMessage(`${this.player.name}は深淵の迷宮に足を踏み入れた...`, 'system');
        
        // 画面更新
        this.updateUI();
        
        // 初回描画（少し遅延させて確実に描画）
        setTimeout(() => {
            this.updateVisibility();
            this.render();
        }, 100);
    }

    initCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.canvas.width = MAP_WIDTH * TILE_SIZE;
        this.canvas.height = MAP_HEIGHT * TILE_SIZE;

        this.minimapCanvas = document.getElementById('minimapCanvas');
        this.minimapCtx = this.minimapCanvas.getContext('2d');
        this.minimapCanvas.width = 200;
        this.minimapCanvas.height = 200;
    }

    generateDungeon() {
        // 簡単なダンジョン生成アルゴリズム
        this.dungeon = Array(MAP_HEIGHT).fill().map(() => Array(MAP_WIDTH).fill(TILES.WALL));
        this.visibility = Array(MAP_HEIGHT).fill().map(() => Array(MAP_WIDTH).fill(false));
        this.discovered = Array(MAP_HEIGHT).fill().map(() => Array(MAP_WIDTH).fill(false));
        
        const rooms = [];
        const numRooms = 5 + Math.floor(Math.random() * 5);
        
        for (let i = 0; i < numRooms; i++) {
            const w = 4 + Math.floor(Math.random() * 6);
            const h = 4 + Math.floor(Math.random() * 6);
            const x = 1 + Math.floor(Math.random() * (MAP_WIDTH - w - 2));
            const y = 1 + Math.floor(Math.random() * (MAP_HEIGHT - h - 2));
            
            // 部屋を配置
            let canPlace = true;
            for (let ry = y; ry < y + h; ry++) {
                for (let rx = x; rx < x + w; rx++) {
                    if (this.dungeon[ry][rx] === TILES.FLOOR) {
                        canPlace = false;
                        break;
                    }
                }
            }
            
            if (canPlace) {
                for (let ry = y; ry < y + h; ry++) {
                    for (let rx = x; rx < x + w; rx++) {
                        this.dungeon[ry][rx] = TILES.FLOOR;
                    }
                }
                rooms.push({ x: x + Math.floor(w/2), y: y + Math.floor(h/2), w, h });
            }
        }
        
        // 部屋を通路で接続
        for (let i = 0; i < rooms.length - 1; i++) {
            this.createCorridor(rooms[i], rooms[i + 1]);
        }
        
        // プレイヤーを最初の部屋に配置
        if (rooms.length > 0) {
            this.player.x = rooms[0].x;
            this.player.y = rooms[0].y;
        }
        
        // 階段を最後の部屋に配置
        if (rooms.length > 1) {
            const lastRoom = rooms[rooms.length - 1];
            this.dungeon[lastRoom.y][lastRoom.x] = TILES.STAIRS;
        }
        
        // 敵を配置
        this.enemies = [];
        const enemyCount = 5 + this.currentFloor * 2;
        for (let i = 0; i < enemyCount; i++) {
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            const x = room.x - Math.floor(room.w/2) + Math.floor(Math.random() * room.w);
            const y = room.y - Math.floor(room.h/2) + Math.floor(Math.random() * room.h);
            
            if (this.dungeon[y][x] === TILES.FLOOR && (x !== this.player.x || y !== this.player.y)) {
                const enemyTypes = Object.keys(ENEMY_TYPES);
                const enemyType = enemyTypes[Math.min(Math.floor(Math.random() * enemyTypes.length), Math.floor(this.currentFloor / 2))];
                const enemy = {
                    ...ENEMY_TYPES[enemyType],
                    type: enemyType,
                    x,
                    y,
                    currentHp: ENEMY_TYPES[enemyType].hp,
                    id: Date.now() + i
                };
                this.enemies.push(enemy);
            }
        }
        
        // アイテムを配置
        this.items = [];
        const itemCount = 3 + Math.floor(Math.random() * 5);
        for (let i = 0; i < itemCount; i++) {
            const room = rooms[Math.floor(Math.random() * rooms.length)];
            const x = room.x - Math.floor(room.w/2) + Math.floor(Math.random() * room.w);
            const y = room.y - Math.floor(room.h/2) + Math.floor(Math.random() * room.h);
            
            if (this.dungeon[y][x] === TILES.FLOOR) {
                const itemTypes = Object.keys(ITEM_TYPES);
                const itemType = itemTypes[Math.floor(Math.random() * itemTypes.length)];
                const item = {
                    ...ITEM_TYPES[itemType],
                    type: itemType,
                    x,
                    y,
                    id: Date.now() + i
                };
                this.items.push(item);
            }
        }
    }

    createCorridor(room1, room2) {
        let x = room1.x;
        let y = room1.y;
        
        // 横方向に移動
        while (x !== room2.x) {
            x += x < room2.x ? 1 : -1;
            this.dungeon[y][x] = TILES.FLOOR;
        }
        
        // 縦方向に移動
        while (y !== room2.y) {
            y += y < room2.y ? 1 : -1;
            this.dungeon[y][x] = TILES.FLOOR;
        }
    }

    movePlayer(dx, dy) {
        if (this.gameState !== 'playing') return;
        
        // プレイヤーの存在確認
        if (!this.player || this.player.x === undefined || this.player.y === undefined) return;
        
        const newX = this.player.x + dx;
        const newY = this.player.y + dy;
        
        // 範囲チェック
        if (newX < 0 || newX >= MAP_WIDTH || newY < 0 || newY >= MAP_HEIGHT) return;
        
        // 壁チェック
        if (this.dungeon[newY][newX] === TILES.WALL) return;
        
        // 敵チェック
        const enemy = this.enemies.find(e => e.x === newX && e.y === newY);
        if (enemy) {
            this.attackEnemy(enemy);
            this.endTurn();
            return;
        }
        
        // 移動
        this.player.x = newX;
        this.player.y = newY;
        
        // colorsプロパティを保持
        if (!this.player.colors && this.selectedClass) {
            this.player.colors = CLASSES[this.selectedClass].colors;
        }
        
        // アイテム取得チェック
        const itemIndex = this.items.findIndex(item => item.x === newX && item.y === newY);
        if (itemIndex !== -1) {
            const item = this.items[itemIndex];
            this.pickupItem(item);
            this.items.splice(itemIndex, 1);
        }
        
        // 階段チェック
        if (this.dungeon[newY][newX] === TILES.STAIRS) {
            this.showStairsScreen();
        }
        
        this.endTurn();
    }

    waitTurn() {
        if (this.gameState !== 'playing') return;
        this.addMessage('その場で待機した', 'system');
        this.endTurn();
    }

    attackEnemy(enemy) {
        const damage = Math.max(1, this.getPlayerAttack() - enemy.def);
        enemy.currentHp -= damage;
        
        // 攻撃エフェクトを追加
        this.addCombatEffect(enemy.x, enemy.y, 'slash', CLASSES[this.selectedClass].colors);
        
        this.addMessage(`${enemy.name}に${damage}のダメージを与えた！`, 'combat');
        
        if (enemy.currentHp <= 0) {
            this.defeatEnemy(enemy);
        }
    }
    
    // 戦闘エフェクトシステム
    addCombatEffect(x, y, type, colors) {
        this.effects.push({
            x,
            y,
            type,
            colors,
            startTime: Date.now(),
            duration: 500  // ミリ秒
        });
        
        // エフェクト開始時にアニメーションループを開始
        if (!this.animationFrame) {
            this.startAnimationLoop();
        }
    }
    
    startAnimationLoop() {
        const animate = () => {
            this.render();
            this.updateEffects();
            
            // エフェクトがまだある場合は継続
            if (this.effects.length > 0) {
                this.animationFrame = requestAnimationFrame(animate);
            } else {
                this.animationFrame = null;
            }
        };
        
        this.animationFrame = requestAnimationFrame(animate);
    }
    
    updateEffects() {
        const now = Date.now();
        this.effects = this.effects.filter(effect => {
            return now - effect.startTime < effect.duration;
        });
    }
    
    drawEffects() {
        const now = Date.now();
        this.effects.forEach(effect => {
            const progress = (now - effect.startTime) / effect.duration;
            const alpha = 1 - progress;
            
            this.ctx.save();
            this.ctx.globalAlpha = alpha;
            
            const centerX = effect.x * TILE_SIZE + TILE_SIZE / 2;
            const centerY = effect.y * TILE_SIZE + TILE_SIZE / 2;
            
            if (effect.type === 'slash') {
                // スラッシュエフェクト
                this.ctx.strokeStyle = effect.colors.glow;
                this.ctx.lineWidth = 3 * (1 - progress);
                this.ctx.shadowColor = effect.colors.glow;
                this.ctx.shadowBlur = 20 * (1 - progress);
                
                this.ctx.beginPath();
                const offset = TILE_SIZE * 0.3 * (1 + progress);
                this.ctx.moveTo(centerX - offset, centerY - offset);
                this.ctx.lineTo(centerX + offset, centerY + offset);
                this.ctx.stroke();
                
                this.ctx.beginPath();
                this.ctx.moveTo(centerX + offset, centerY - offset);
                this.ctx.lineTo(centerX - offset, centerY + offset);
                this.ctx.stroke();
            } else if (effect.type === 'explosion') {
                // 爆発エフェクト
                const radius = TILE_SIZE * progress * 1.5;
                const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
                gradient.addColorStop(0, effect.colors.glow + '80');
                gradient.addColorStop(0.5, effect.colors.primary + '40');
                gradient.addColorStop(1, 'transparent');
                
                this.ctx.fillStyle = gradient;
                this.ctx.beginPath();
                this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
                this.ctx.fill();
            } else if (effect.type === 'heal') {
                // 回復エフェクト
                for (let i = 0; i < 3; i++) {
                    const particleY = centerY - progress * TILE_SIZE * 2;
                    const particleX = centerX + Math.sin(progress * Math.PI * 4 + i * 2) * TILE_SIZE * 0.3;
                    
                    this.ctx.fillStyle = '#00FF00';
                    this.ctx.shadowColor = '#00FF00';
                    this.ctx.shadowBlur = 10;
                    this.ctx.beginPath();
                    this.ctx.arc(particleX, particleY, 3 * (1 - progress), 0, Math.PI * 2);
                    this.ctx.fill();
                }
            }
            
            this.ctx.restore();
        });
    }

    defeatEnemy(enemy) {
        this.addMessage(`${enemy.name}を倒した！`, 'combat');
        
        // 経験値とゴールド獲得
        this.player.exp += enemy.exp;
        this.player.gold += enemy.gold;
        this.addMessage(`${enemy.exp}の経験値と${enemy.gold}ゴールドを獲得した`, 'item');
        
        // レベルアップチェック
        if (this.player.exp >= this.player.expNext) {
            this.levelUp();
        }
        
        // 敵を除去
        const index = this.enemies.findIndex(e => e.id === enemy.id);
        if (index !== -1) {
            this.enemies.splice(index, 1);
        }
    }

    levelUp() {
        this.player.level++;
        this.player.exp -= this.player.expNext;
        this.player.expNext = this.player.level * 100;
        
        // ステータス上昇
        const hpIncrease = 10 + Math.floor(Math.random() * 10);
        const mpIncrease = 5 + Math.floor(Math.random() * 5);
        const atkIncrease = 2 + Math.floor(Math.random() * 2);
        const defIncrease = 1 + Math.floor(Math.random() * 2);
        
        this.player.maxHp += hpIncrease;
        this.player.maxMp += mpIncrease;
        this.player.atk += atkIncrease;
        this.player.def += defIncrease;
        
        // colorsプロパティを保持
        if (!this.player.colors && this.selectedClass) {
            this.player.colors = CLASSES[this.selectedClass].colors;
        }
        
        // 全回復
        this.player.currentHp = this.player.maxHp;
        this.player.currentMp = this.player.maxMp;
        
        // レベルアップ画面表示
        document.getElementById('oldLevel').textContent = this.player.level - 1;
        document.getElementById('newLevel').textContent = this.player.level;
        document.getElementById('hpIncrease').textContent = hpIncrease;
        document.getElementById('mpIncrease').textContent = mpIncrease;
        document.getElementById('atkIncrease').textContent = atkIncrease;
        document.getElementById('defIncrease').textContent = defIncrease;
        
        document.getElementById('levelupScreen').style.display = 'flex';
    }

    closeLevelupScreen() {
        document.getElementById('levelupScreen').style.display = 'none';
    }

    pickupItem(item) {
        if (this.inventory.length >= 24) {
            this.addMessage('持ち物がいっぱいです！', 'system');
            return;
        }
        
        this.inventory.push(item);
        this.addMessage(`${item.name}を拾った`, 'item');
    }

    endTurn() {
        this.turn++;
        
        // 敵のターン
        this.enemies.forEach(enemy => {
            if (Math.abs(enemy.x - this.player.x) <= 1 && Math.abs(enemy.y - this.player.y) <= 1) {
                // プレイヤーに隣接している場合、攻撃
                const damage = Math.max(1, enemy.atk - this.getPlayerDefense());
                this.player.currentHp -= damage;
                this.addMessage(`${enemy.name}から${damage}のダメージを受けた！`, 'combat');
                
                if (this.player.currentHp <= 0) {
                    this.gameOver();
                    return;
                }
            } else {
                // プレイヤーに向かって移動
                const dx = Math.sign(this.player.x - enemy.x);
                const dy = Math.sign(this.player.y - enemy.y);
                const newX = enemy.x + dx;
                const newY = enemy.y + dy;
                
                // 移動可能チェック
                if (this.dungeon[newY][newX] === TILES.FLOOR &&
                    !this.enemies.some(e => e.x === newX && e.y === newY && e.id !== enemy.id) &&
                    !(this.player.x === newX && this.player.y === newY)) {
                    enemy.x = newX;
                    enemy.y = newY;
                }
            }
        });
        
        // 視界更新
        this.updateVisibility();
        
        // UI更新
        this.updateUI();
        
        // 再描画（エフェクトがある場合はアニメーションを開始）
        this.render();
        if (this.effects.length > 0 && !this.animationFrame) {
            this.startAnimationLoop();
        }
    }

    updateVisibility() {
        // 視界をリセット
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                this.visibility[y][x] = false;
            }
        }
        
        // プレイヤーが存在する場合のみ視界を計算
        if (this.player && this.player.x !== undefined && this.player.y !== undefined) {
            // レイキャスティングで視界を計算
            for (let angle = 0; angle < 360; angle += 1) {
                const rad = angle * Math.PI / 180;
                const dx = Math.cos(rad);
                const dy = Math.sin(rad);
                
                for (let dist = 0; dist < VISIBILITY_RADIUS; dist++) {
                    const x = Math.round(this.player.x + dx * dist);
                    const y = Math.round(this.player.y + dy * dist);
                    
                    if (x >= 0 && x < MAP_WIDTH && y >= 0 && y < MAP_HEIGHT) {
                        this.visibility[y][x] = true;
                        this.discovered[y][x] = true;
                        
                        if (this.dungeon[y][x] === TILES.WALL) {
                            break;
                        }
                    }
                }
            }
        }
    }

    getPlayerAttack() {
        let atk = this.player.atk;
        if (this.equipment.weapon) {
            atk += this.equipment.weapon.stats.atk || 0;
        }
        if (this.equipment.accessory) {
            atk += this.equipment.accessory.stats.atk || 0;
        }
        return atk;
    }

    getPlayerDefense() {
        let def = this.player.def;
        if (this.equipment.armor) {
            def += this.equipment.armor.stats.def || 0;
        }
        return def;
    }

    getPlayerMagic() {
        let mag = this.player.mag;
        if (this.equipment.weapon) {
            mag += this.equipment.weapon.stats.mag || 0;
        }
        return mag;
    }

    getPlayerSpeed() {
        let spd = this.player.spd;
        if (this.equipment.accessory) {
            spd += this.equipment.accessory.stats.spd || 0;
        }
        return spd;
    }

    updateUI() {
        // プレイヤーステータス
        document.getElementById('playerLevel').textContent = this.player.level;
        document.getElementById('hpText').textContent = `${this.player.currentHp}/${this.player.maxHp}`;
        document.getElementById('hpFill').style.width = `${(this.player.currentHp / this.player.maxHp) * 100}%`;
        document.getElementById('mpText').textContent = `${this.player.currentMp}/${this.player.maxMp}`;
        document.getElementById('mpFill').style.width = `${(this.player.currentMp / this.player.maxMp) * 100}%`;
        document.getElementById('expText').textContent = `${this.player.exp}/${this.player.expNext}`;
        document.getElementById('expFill').style.width = `${(this.player.exp / this.player.expNext) * 100}%`;
        
        // フロアとターン
        document.getElementById('floorNumber').textContent = this.currentFloor;
        document.getElementById('turnNumber').textContent = this.turn;
        
        // ステータス
        document.getElementById('atkStat').textContent = this.getPlayerAttack();
        document.getElementById('defStat').textContent = this.getPlayerDefense();
        document.getElementById('magStat').textContent = this.getPlayerMagic();
        document.getElementById('spdStat').textContent = this.getPlayerSpeed();
        
        // 装備
        document.getElementById('weaponSlot').textContent = this.equipment.weapon ? this.equipment.weapon.name : '-';
        document.getElementById('armorSlot').textContent = this.equipment.armor ? this.equipment.armor.name : '-';
        document.getElementById('accessorySlot').textContent = this.equipment.accessory ? this.equipment.accessory.name : '-';
        
        // インベントリ
        const inventoryGrid = document.getElementById('inventoryGrid');
        inventoryGrid.innerHTML = '';
        for (let i = 0; i < 24; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            
            if (this.inventory[i]) {
                slot.className += ' has-item';
                slot.textContent = this.inventory[i].icon;
                slot.addEventListener('click', () => this.showItemDetails(this.inventory[i]));
            }
            
            inventoryGrid.appendChild(slot);
        }
        
        // スキルリスト
        const skillList = document.getElementById('skillList');
        skillList.innerHTML = '';
        this.player.skills.forEach(skill => {
            const skillDiv = document.createElement('div');
            skillDiv.className = 'skill-item';
            skillDiv.innerHTML = `
                <div class="skill-name">${skill.name}</div>
                <div class="skill-cost">MP: ${skill.cost}</div>
            `;
            skillList.appendChild(skillDiv);
        });
        
        // メッセージログ
        const logContent = document.getElementById('logContent');
        logContent.innerHTML = '';
        this.messageLog.slice(-10).forEach(msg => {
            const msgDiv = document.createElement('div');
            msgDiv.className = `log-message ${msg.type}`;
            msgDiv.textContent = msg.text;
            logContent.appendChild(msgDiv);
        });
        logContent.scrollTop = logContent.scrollHeight;
    }

    // ネオンスタイル描画関数（強固なフォールバック付き）
    drawNeonEntity(x, y, colors, shape = 'diamond', size = 0.8) {
        const centerX = x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = y * TILE_SIZE + TILE_SIZE / 2;
        const radius = (TILE_SIZE * size) / 2;
        
        // デフォルトカラーを設定
        const defaultColors = {
            primary: '#FFD700',
            secondary: '#FFA500',
            glow: '#FFFF00',
            trail: 'rgba(255, 215, 0, 0.3)'
        };
        
        // colorsが無い場合はデフォルトを使用
        const useColors = colors && colors.primary ? colors : defaultColors;
        
        this.ctx.save();
        
        // 外側のグロー効果
        try {
            const glowColor = useColors.glow || '#FFFF00';
            const cleanGlowColor = glowColor.startsWith('#') ? glowColor : '#' + glowColor;
            
            const glowGradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius * 1.5);
            glowGradient.addColorStop(0, cleanGlowColor + '40');
            glowGradient.addColorStop(1, 'transparent');
            this.ctx.fillStyle = glowGradient;
            this.ctx.fillRect(centerX - radius * 1.5, centerY - radius * 1.5, radius * 3, radius * 3);
        } catch (e) {
            console.warn('Glow effect failed:', e);
        }
        
        // メインボディ
        try {
            const gradient = this.ctx.createRadialGradient(centerX, centerY, 0, centerX, centerY, radius);
            gradient.addColorStop(0, useColors.primary || '#FFD700');
            gradient.addColorStop(0.7, useColors.secondary || '#FFA500');
            gradient.addColorStop(1, (useColors.glow || '#FFFF00') + '60');
            
            this.ctx.fillStyle = gradient;
            this.ctx.strokeStyle = useColors.glow || '#FFFF00';
            this.ctx.lineWidth = 2;
        } catch (e) {
            // グラデーション失敗時は単色で描画
            this.ctx.fillStyle = useColors.primary || '#FFD700';
            this.ctx.strokeStyle = useColors.glow || '#FFFF00';
            this.ctx.lineWidth = 2;
        }
        
        this.ctx.beginPath();
        if (shape === 'diamond') {
            // ダイヤモンド形状
            this.ctx.moveTo(centerX, centerY - radius);
            this.ctx.lineTo(centerX + radius * 0.7, centerY);
            this.ctx.lineTo(centerX, centerY + radius);
            this.ctx.lineTo(centerX - radius * 0.7, centerY);
        } else if (shape === 'circle') {
            // 円形
            this.ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
        } else if (shape === 'triangle') {
            // 三角形
            this.ctx.moveTo(centerX, centerY - radius);
            this.ctx.lineTo(centerX + radius * 0.866, centerY + radius * 0.5);
            this.ctx.lineTo(centerX - radius * 0.866, centerY + radius * 0.5);
        } else if (shape === 'hexagon') {
            // 六角形
            for (let i = 0; i < 6; i++) {
                const angle = (Math.PI / 3) * i;
                const px = centerX + radius * Math.cos(angle);
                const py = centerY + radius * Math.sin(angle);
                if (i === 0) {
                    this.ctx.moveTo(px, py);
                } else {
                    this.ctx.lineTo(px, py);
                }
            }
        }
        this.ctx.closePath();
        this.ctx.fill();
        this.ctx.stroke();
        
        // 内側の光
        const innerGlow = this.ctx.createRadialGradient(centerX, centerY - radius * 0.3, 0, centerX, centerY, radius);
        innerGlow.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
        innerGlow.addColorStop(0.3, 'rgba(255, 255, 255, 0.2)');
        innerGlow.addColorStop(1, 'transparent');
        this.ctx.fillStyle = innerGlow;
        this.ctx.fill();
        
        this.ctx.restore();
    }
    
    drawNeonTile(x, y, type) {
        const tileX = x * TILE_SIZE;
        const tileY = y * TILE_SIZE;
        
        if (type === TILES.WALL) {
            // 壁タイル - ネオンボーダー
            const gradient = this.ctx.createLinearGradient(tileX, tileY, tileX, tileY + TILE_SIZE);
            gradient.addColorStop(0, '#1a0033');
            gradient.addColorStop(1, '#0a0022');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
            
            // ネオンボーダー
            this.ctx.strokeStyle = '#4400AA20';
            this.ctx.lineWidth = 1;
            this.ctx.strokeRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
        } else if (type === TILES.FLOOR) {
            // 床タイル - グリッドパターン
            const gradient = this.ctx.createRadialGradient(
                tileX + TILE_SIZE/2, tileY + TILE_SIZE/2, 0,
                tileX + TILE_SIZE/2, tileY + TILE_SIZE/2, TILE_SIZE
            );
            gradient.addColorStop(0, '#0a0a1a');
            gradient.addColorStop(1, '#050510');
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
            
            // グリッドライン
            this.ctx.strokeStyle = '#00FFFF10';
            this.ctx.lineWidth = 0.5;
            this.ctx.strokeRect(tileX, tileY, TILE_SIZE, TILE_SIZE);
        } else if (type === TILES.STAIRS) {
            // 階段 - パルス効果
            this.drawNeonTile(x, y, TILES.FLOOR);
            
            const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
            const colors = {
                primary: '#00FF00',
                secondary: '#00AA00',
                glow: `rgba(0, 255, 0, ${pulse})`
            };
            
            this.ctx.save();
            this.ctx.shadowColor = colors.glow;
            this.ctx.shadowBlur = 10 + pulse * 10;
            
            // 階段シンボル
            this.ctx.strokeStyle = colors.primary;
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(tileX + TILE_SIZE * 0.3, tileY + TILE_SIZE * 0.3);
            this.ctx.lineTo(tileX + TILE_SIZE * 0.7, tileY + TILE_SIZE * 0.3);
            this.ctx.lineTo(tileX + TILE_SIZE * 0.7, tileY + TILE_SIZE * 0.5);
            this.ctx.moveTo(tileX + TILE_SIZE * 0.3, tileY + TILE_SIZE * 0.5);
            this.ctx.lineTo(tileX + TILE_SIZE * 0.7, tileY + TILE_SIZE * 0.5);
            this.ctx.lineTo(tileX + TILE_SIZE * 0.7, tileY + TILE_SIZE * 0.7);
            this.ctx.stroke();
            
            // 矢印
            this.ctx.beginPath();
            this.ctx.moveTo(tileX + TILE_SIZE * 0.5, tileY + TILE_SIZE * 0.6);
            this.ctx.lineTo(tileX + TILE_SIZE * 0.4, tileY + TILE_SIZE * 0.7);
            this.ctx.moveTo(tileX + TILE_SIZE * 0.5, tileY + TILE_SIZE * 0.6);
            this.ctx.lineTo(tileX + TILE_SIZE * 0.6, tileY + TILE_SIZE * 0.7);
            this.ctx.stroke();
            
            this.ctx.restore();
        }
    }
    
    drawNeonItem(x, y, item) {
        const centerX = x * TILE_SIZE + TILE_SIZE / 2;
        const centerY = y * TILE_SIZE + TILE_SIZE / 2;
        
        // アイテムのグロー
        const pulse = Math.sin(Date.now() * 0.002) * 0.3 + 0.7;
        
        this.ctx.save();
        this.ctx.shadowColor = '#FFD700';
        this.ctx.shadowBlur = 5 + pulse * 5;
        
        // アイテムアイコン（暫定的に絵文字を使用、後でカスタム描画に置き換え可能）
        this.ctx.font = `${20 * pulse}px Arial`;
        this.ctx.textAlign = 'center';
        this.ctx.textBaseline = 'middle';
        this.ctx.fillStyle = '#FFD700';
        this.ctx.fillText(item.icon, centerX, centerY);
        
        this.ctx.restore();
    }

    render() {
        if (!this.ctx || !this.canvas) {
            console.error('Canvas or context not initialized');
            return;
        }
        
        // Canvas サイズ確認
        if (this.canvas.width === 0 || this.canvas.height === 0) {
            this.initCanvas();
        }
        
        // デバッグ情報（初回のみ）
        if (!this.debugLogged) {
            console.log('Initial render - Player:', this.player ? `(${this.player.x}, ${this.player.y})` : 'null', 
                        'Enemies:', this.enemies.length);
            this.debugLogged = true;
        }
        
        // 背景をダークグラデーションに
        const bgGradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
        bgGradient.addColorStop(0, '#000011');
        bgGradient.addColorStop(1, '#000022');
        this.ctx.fillStyle = bgGradient;
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // ダンジョン描画
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (!this.visibility[y][x] && !this.discovered[y][x]) continue;
                
                const alpha = this.visibility[y][x] ? 1.0 : 0.3;
                this.ctx.globalAlpha = alpha;
                
                // ネオンタイル描画
                this.drawNeonTile(x, y, this.dungeon[y][x]);
            }
        }
        
        this.ctx.globalAlpha = 1.0;
        
        // アイテム描画
        this.items.forEach(item => {
            if (this.visibility[item.y][item.x]) {
                this.drawNeonItem(item.x, item.y, item);
            }
        });
        
        // 敵描画
        this.enemies.forEach(enemy => {
            if (this.visibility[enemy.y][enemy.x]) {
                const enemyData = ENEMY_TYPES[enemy.type];
                let colors = null;
                
                // カラー情報の取得
                if (enemyData && enemyData.colors) {
                    colors = {...enemyData.colors};
                    // パルス効果の追加
                    if (enemyData.colors.pulse) {
                        const pulse = Math.sin(Date.now() * 0.003) * 0.3 + 0.7;
                        // glowカラーが#で始まることを確認
                        const baseGlow = colors.glow.startsWith('#') ? colors.glow.substring(1) : colors.glow;
                        colors.glow = '#' + baseGlow;
                    }
                } else {
                    // カラーが無い場合のフォールバック
                    colors = {
                        primary: '#FF6666',
                        secondary: '#CC4444',
                        glow: '#FF0000'
                    };
                }
                
                // 敵を描画（常に描画される）
                this.drawNeonEntity(enemy.x, enemy.y, colors, 'hexagon', 0.7);
                
                // HPバー表示
                if (enemy.currentHp < enemy.hp) {
                    const barWidth = TILE_SIZE * 0.8;
                    const barHeight = 3;
                    const barX = enemy.x * TILE_SIZE + (TILE_SIZE - barWidth) / 2;
                    const barY = enemy.y * TILE_SIZE - 5;
                    
                    this.ctx.fillStyle = '#FF000080';
                    this.ctx.fillRect(barX, barY, barWidth, barHeight);
                    
                    const hpPercent = enemy.currentHp / enemy.hp;
                    this.ctx.fillStyle = '#FF0000';
                    this.ctx.fillRect(barX, barY, barWidth * hpPercent, barHeight);
                }
            }
        });
        
        // プレイヤー描画（常に描画）
        if (this.player && this.player.x !== undefined && this.player.y !== undefined) {
            this.ctx.save();
            this.ctx.globalAlpha = 1.0;  // プレイヤーは常に完全不透明
            
            // プレイヤーのカラー情報を取得
            let colors = this.player.colors || (CLASSES[this.selectedClass] && CLASSES[this.selectedClass].colors);
            
            // カラーが無い場合のフォールバック
            if (!colors || !colors.primary) {
                colors = {
                    primary: '#00FFFF',
                    secondary: '#0099FF',
                    glow: '#00FFFF',
                    trail: 'rgba(0, 255, 255, 0.3)'
                };
            }
            
            // プレイヤーの移動トレイル効果
            this.ctx.globalAlpha = 0.3;
            this.ctx.fillStyle = colors.trail || 'rgba(0, 255, 255, 0.3)';
            this.ctx.fillRect(
                this.player.x * TILE_SIZE - 2,
                this.player.y * TILE_SIZE - 2,
                TILE_SIZE + 4,
                TILE_SIZE + 4
            );
            
            // プレイヤー本体を描画（常に描画）
            this.ctx.globalAlpha = 1.0;
            this.drawNeonEntity(this.player.x, this.player.y, colors, 'diamond', 0.9);
            
            this.ctx.restore();
        }
        
        // エフェクト描画
        this.drawEffects();
        
        // ミニマップ描画
        this.renderMinimap();
    }

    renderMinimap() {
        if (!this.minimapCtx) return;
        
        const minimapSize = 120; // 小さくする
        const scale = minimapSize / MAP_WIDTH;
        
        // キャンバスサイズ調整
        if (this.minimapCanvas.width !== minimapSize) {
            this.minimapCanvas.width = minimapSize;
            this.minimapCanvas.height = minimapSize;
        }
        
        // 背景をネオンスタイルに
        const bgGradient = this.minimapCtx.createLinearGradient(0, 0, minimapSize, minimapSize);
        bgGradient.addColorStop(0, '#000033');
        bgGradient.addColorStop(1, '#000066');
        this.minimapCtx.fillStyle = bgGradient;
        this.minimapCtx.fillRect(0, 0, minimapSize, minimapSize);
        
        // 外枠
        this.minimapCtx.strokeStyle = '#00FFFF60';
        this.minimapCtx.lineWidth = 2;
        this.minimapCtx.strokeRect(0, 0, minimapSize, minimapSize);
        
        // グリッドライン（薄く）
        this.minimapCtx.strokeStyle = '#00FFFF08';
        this.minimapCtx.lineWidth = 0.5;
        for (let i = 1; i < 5; i++) {
            const pos = i * (minimapSize / 5);
            this.minimapCtx.beginPath();
            this.minimapCtx.moveTo(pos, 0);
            this.minimapCtx.lineTo(pos, minimapSize);
            this.minimapCtx.moveTo(0, pos);
            this.minimapCtx.lineTo(minimapSize, pos);
            this.minimapCtx.stroke();
        }
        
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (!this.discovered[y][x]) continue;
                
                if (this.dungeon[y][x] === TILES.WALL) {
                    this.minimapCtx.fillStyle = '#1a3366';
                } else {
                    this.minimapCtx.fillStyle = '#0a1a33';
                }
                
                this.minimapCtx.fillRect(x * scale, y * scale, scale, scale);
            }
        }
        
        // 敵の位置（視界内のみ）
        this.enemies.forEach(enemy => {
            if (this.visibility[enemy.y][enemy.x]) {
                this.minimapCtx.fillStyle = '#FF00FF60';
                this.minimapCtx.fillRect(enemy.x * scale, enemy.y * scale, scale * 2, scale * 2);
            }
        });
        
        // 階段位置（パルス効果）
        const pulse = Math.sin(Date.now() * 0.003) * 0.5 + 0.5;
        for (let y = 0; y < MAP_HEIGHT; y++) {
            for (let x = 0; x < MAP_WIDTH; x++) {
                if (this.dungeon[y][x] === TILES.STAIRS && this.discovered[y][x]) {
                    this.minimapCtx.fillStyle = `rgba(0, 255, 0, ${0.5 + pulse * 0.5})`;
                    this.minimapCtx.fillRect(x * scale - 1, y * scale - 1, scale * 3, scale * 3);
                }
            }
        }
        
        // プレイヤー位置（ネオングロー）
        if (this.player && this.player.x !== undefined && this.player.y !== undefined) {
            const colors = this.player.colors || (CLASSES[this.selectedClass]?.colors);
            if (colors) {
                // グロー効果
                const glowGradient = this.minimapCtx.createRadialGradient(
                    this.player.x * scale, this.player.y * scale, 0,
                    this.player.x * scale, this.player.y * scale, 5
                );
                glowGradient.addColorStop(0, colors.primary);
                glowGradient.addColorStop(1, 'transparent');
                this.minimapCtx.fillStyle = glowGradient;
                this.minimapCtx.fillRect(this.player.x * scale - 5, this.player.y * scale - 5, 10, 10);
            }
            
            // コア（カラーがなくても表示）
            this.minimapCtx.fillStyle = '#FFFFFF';
            this.minimapCtx.fillRect(this.player.x * scale - 1, this.player.y * scale - 1, 2, 2);
        }
    }

    addMessage(text, type = 'normal') {
        this.messageLog.push({ text, type, turn: this.turn });
        if (this.messageLog.length > 100) {
            this.messageLog.shift();
        }
    }

    showStairsScreen() {
        document.getElementById('stairsScreen').style.display = 'flex';
    }

    closeStairsScreen() {
        document.getElementById('stairsScreen').style.display = 'none';
    }

    goDownStairs() {
        this.closeStairsScreen();
        
        if (this.currentFloor >= MAX_FLOOR) {
            this.victory();
            return;
        }
        
        this.currentFloor++;
        
        // colorsプロパティを保持
        if (!this.player.colors && this.selectedClass) {
            this.player.colors = CLASSES[this.selectedClass].colors;
        }
        
        this.generateDungeon();
        this.addMessage(`地下${this.currentFloor}階に降りた`, 'system');
        
        // 視界更新と描画
        this.updateVisibility();
        this.updateUI();
        this.render();
    }

    gameOver() {
        this.gameState = 'gameover';
        
        // 記録を保存
        const record = {
            class: this.selectedClass,
            floor: this.currentFloor,
            level: this.player.level,
            turns: this.turn,
            date: new Date().toLocaleDateString()
        };
        this.saveRecord(record);
        
        // ゲームオーバー画面表示
        document.getElementById('finalFloor').textContent = this.currentFloor;
        document.getElementById('finalLevel').textContent = this.player.level;
        document.getElementById('survivalTurns').textContent = this.turn;
        document.getElementById('gameoverScreen').style.display = 'flex';
    }

    victory() {
        this.gameState = 'victory';
        
        // 記録を保存
        const record = {
            class: this.selectedClass,
            floor: MAX_FLOOR,
            level: this.player.level,
            turns: this.turn,
            cleared: true,
            date: new Date().toLocaleDateString()
        };
        this.saveRecord(record);
        
        // ビクトリー画面表示
        document.getElementById('victoryLevel').textContent = this.player.level;
        document.getElementById('victoryTurns').textContent = this.turn;
        document.getElementById('victoryScreen').style.display = 'flex';
    }

    returnToTitle() {
        document.getElementById('gameoverScreen').style.display = 'none';
        document.getElementById('victoryScreen').style.display = 'none';
        document.getElementById('gameScreen').style.display = 'none';
        this.showTitleScreen();
    }

    showHelp() {
        document.getElementById('helpScreen').style.display = 'flex';
    }

    closeHelp() {
        document.getElementById('helpScreen').style.display = 'none';
    }

    showRecords() {
        const recordsList = document.getElementById('recordsList');
        recordsList.innerHTML = '';
        
        this.records.sort((a, b) => {
            if (a.cleared && !b.cleared) return -1;
            if (!a.cleared && b.cleared) return 1;
            return b.floor - a.floor;
        });
        
        this.records.slice(0, 10).forEach((record, index) => {
            const recordDiv = document.createElement('div');
            recordDiv.className = 'record-item';
            recordDiv.innerHTML = `
                <div class="record-rank">#${index + 1}</div>
                <div class="record-details">
                    <p>職業: ${CLASSES[record.class].name}</p>
                    <p>到達階: ${record.cleared ? 'クリア！' : `地下${record.floor}階`}</p>
                    <p>レベル: ${record.level}</p>
                    <p>ターン数: ${record.turns}</p>
                    <p>日付: ${record.date}</p>
                </div>
            `;
            recordsList.appendChild(recordDiv);
        });
        
        document.getElementById('recordsScreen').style.display = 'flex';
    }

    closeRecords() {
        document.getElementById('recordsScreen').style.display = 'none';
    }

    loadRecords() {
        const saved = localStorage.getItem('roguelikeRecords');
        return saved ? JSON.parse(saved) : [];
    }

    saveRecord(record) {
        this.records.push(record);
        localStorage.setItem('roguelikeRecords', JSON.stringify(this.records));
    }

    continueGame() {
        // セーブデータがあれば続きから
        const saved = localStorage.getItem('roguelikeSave');
        if (saved) {
            const saveData = JSON.parse(saved);
            // セーブデータから復元
            this.player = saveData.player;
            this.selectedClass = saveData.player.class;  // クラスも復元
            this.currentFloor = saveData.currentFloor;
            this.turn = saveData.turn;
            
            // colors プロパティを確実に復元
            if (!this.player.colors && this.selectedClass) {
                this.player.colors = CLASSES[this.selectedClass].colors;
            }
            
            // ゲーム再開
            this.startNewGame();
        } else {
            alert('セーブデータがありません');
        }
    }

    showItemDetails(item) {
        // アイテム詳細ポップアップ表示
        document.getElementById('itemName').textContent = item.name;
        document.getElementById('itemIcon').textContent = item.icon;
        document.getElementById('itemDescription').textContent = item.effect ? 
            `HP回復: ${item.effect.heal || 0} / MP回復: ${item.effect.mana || 0}` : 
            `攻撃: +${item.stats?.atk || 0} / 防御: +${item.stats?.def || 0}`;
        
        document.getElementById('itemPopup').style.display = 'flex';
        
        // ボタンイベント設定
        const useBtn = document.getElementById('useItemBtn');
        const equipBtn = document.getElementById('equipItemBtn');
        const dropBtn = document.getElementById('dropItemBtn');
        
        useBtn.onclick = () => {
            if (item.type === 'consumable') {
                this.useItem(item);
            }
            this.closeItemPopup();
        };
        
        equipBtn.onclick = () => {
            if (item.type === 'weapon' || item.type === 'armor' || item.type === 'accessory') {
                this.equipItem(item);
            }
            this.closeItemPopup();
        };
        
        dropBtn.onclick = () => {
            this.dropItem(item);
            this.closeItemPopup();
        };
    }

    closeItemPopup() {
        document.getElementById('itemPopup').style.display = 'none';
    }

    useItem(item) {
        if (item.effect) {
            if (item.effect.heal) {
                this.player.currentHp = Math.min(this.player.maxHp, this.player.currentHp + item.effect.heal);
                this.addMessage(`HPが${item.effect.heal}回復した`, 'item');
            }
            if (item.effect.mana) {
                this.player.currentMp = Math.min(this.player.maxMp, this.player.currentMp + item.effect.mana);
                this.addMessage(`MPが${item.effect.mana}回復した`, 'item');
            }
            
            // アイテムを消費
            const index = this.inventory.indexOf(item);
            if (index !== -1) {
                this.inventory.splice(index, 1);
            }
            
            this.updateUI();
        }
    }

    equipItem(item) {
        if (item.type === 'weapon') {
            if (this.equipment.weapon) {
                this.inventory.push(this.equipment.weapon);
            }
            this.equipment.weapon = item;
        } else if (item.type === 'armor') {
            if (this.equipment.armor) {
                this.inventory.push(this.equipment.armor);
            }
            this.equipment.armor = item;
        } else if (item.type === 'accessory') {
            if (this.equipment.accessory) {
                this.inventory.push(this.equipment.accessory);
            }
            this.equipment.accessory = item;
        }
        
        // インベントリから削除
        const index = this.inventory.indexOf(item);
        if (index !== -1) {
            this.inventory.splice(index, 1);
        }
        
        this.addMessage(`${item.name}を装備した`, 'item');
        this.updateUI();
    }

    dropItem(item) {
        const index = this.inventory.indexOf(item);
        if (index !== -1) {
            this.inventory.splice(index, 1);
            this.items.push({
                ...item,
                x: this.player.x,
                y: this.player.y
            });
            this.addMessage(`${item.name}を捨てた`, 'system');
            this.updateUI();
        }
    }

    showSkillMenu() {
        const skillSelection = document.getElementById('skillSelection');
        skillSelection.innerHTML = '';
        
        this.player.skills.forEach((skill, index) => {
            const skillOption = document.createElement('div');
            skillOption.className = 'skill-option';
            skillOption.innerHTML = `
                <strong>${skill.name}</strong> (MP: ${skill.cost})
                <br>効果: ${skill.damage ? `ダメージ${skill.damage}倍` : skill.heal ? `HP回復${skill.heal * 100}%` : skill.effect}
            `;
            
            if (this.player.currentMp >= skill.cost) {
                skillOption.addEventListener('click', () => this.useSkill(skill));
            } else {
                skillOption.style.opacity = '0.5';
                skillOption.style.cursor = 'not-allowed';
            }
            
            skillSelection.appendChild(skillOption);
        });
        
        document.getElementById('skillPopup').style.display = 'flex';
    }

    closeSkillPopup() {
        document.getElementById('skillPopup').style.display = 'none';
    }

    useSkill(skill) {
        if (this.player.currentMp < skill.cost) return;
        
        this.player.currentMp -= skill.cost;
        
        if (skill.damage) {
            // 範囲攻撃
            const damage = Math.floor(this.getPlayerMagic() * skill.damage);
            this.enemies.forEach(enemy => {
                if (Math.abs(enemy.x - this.player.x) <= 2 && Math.abs(enemy.y - this.player.y) <= 2) {
                    enemy.currentHp -= damage;
                    this.addMessage(`${enemy.name}に${damage}のダメージ！`, 'combat');
                    
                    // 魔法エフェクト
                    const colors = skill.freeze ? 
                        {primary: '#00CCFF', glow: '#0099FF'} : 
                        {primary: '#FF6600', glow: '#FF0000'};
                    this.addCombatEffect(enemy.x, enemy.y, 'explosion', colors);
                    
                    if (enemy.currentHp <= 0) {
                        this.defeatEnemy(enemy);
                    }
                }
            });
        } else if (skill.heal) {
            const healAmount = Math.floor(this.player.maxHp * skill.heal);
            this.player.currentHp = Math.min(this.player.maxHp, this.player.currentHp + healAmount);
            this.addMessage(`HPが${healAmount}回復した`, 'item');
            
            // 回復エフェクト
            this.addCombatEffect(this.player.x, this.player.y, 'heal', {primary: '#00FF00', glow: '#00FF00'});
        }
        
        this.closeSkillPopup();
        this.endTurn();
    }

    toggleAttackMode() {
        // 攻撃モード切り替え（未実装）
        this.addMessage('攻撃モードは現在開発中です', 'system');
    }

    showInventory() {
        // インベントリ詳細表示（未実装）
        this.addMessage('インベントリ画面は現在開発中です', 'system');
    }

    showGameMenu() {
        // ゲームメニュー表示（未実装）
        this.addMessage('メニュー画面は現在開発中です', 'system');
    }
}

// ゲーム開始
window.addEventListener('DOMContentLoaded', () => {
    const game = new RoguelikeGame();
});