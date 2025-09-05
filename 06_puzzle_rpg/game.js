// ゲーム状態管理
const GameState = {
    TITLE: 'title',
    MENU: 'menu',
    BATTLE: 'battle',
    DUNGEON_SELECT: 'dungeon_select',
    MONSTER_LIST: 'monster_list',
    TEAM_EDIT: 'team_edit',
    EVOLUTION: 'evolution',
    SHOP: 'shop',
    GACHA: 'gacha'
};

// 要素定数
const ELEMENTS = {
    FIRE: 'fire',
    WATER: 'water',
    WOOD: 'wood',
    LIGHT: 'light',
    DARK: 'dark',
    HEART: 'heart'
};

// 要素の色
const ELEMENT_COLORS = {
    [ELEMENTS.FIRE]: '#ff4444',
    [ELEMENTS.WATER]: '#4444ff',
    [ELEMENTS.WOOD]: '#44ff44',
    [ELEMENTS.LIGHT]: '#ffff44',
    [ELEMENTS.DARK]: '#aa44aa',
    [ELEMENTS.HEART]: '#ff88ff'
};

// 要素アイコン
const ELEMENT_ICONS = {
    [ELEMENTS.FIRE]: '🔥',
    [ELEMENTS.WATER]: '💧',
    [ELEMENTS.WOOD]: '🌿',
    [ELEMENTS.LIGHT]: '✨',
    [ELEMENTS.DARK]: '🌙',
    [ELEMENTS.HEART]: '❤️'
};

// ゲームクラス
class PuzzleRPGGame {
    constructor() {
        this.currentState = GameState.TITLE;
        this.playerData = this.loadPlayerData();
        this.currentTeam = [];
        this.currentDungeon = null;
        this.currentFloor = 0;
        this.battleState = null;
        this.puzzleBoard = null;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initMonsterDatabase();
        this.initDungeons();
        this.showScreen('titleScreen');
    }

    loadPlayerData() {
        const saved = localStorage.getItem('puzzleRPGSave');
        if (saved) {
            return JSON.parse(saved);
        }
        return {
            level: 1,
            exp: 0,
            stamina: 50,
            maxStamina: 50,
            gold: 0,
            gems: 5,
            monsters: [
                {
                    id: 1,
                    monsterId: 1,
                    level: 1,
                    exp: 0,
                    plusHp: 0,
                    plusAtk: 0,
                    plusRcv: 0
                }
            ],
            teams: [[1, null, null, null, null]],
            currentTeamIndex: 0,
            clearedDungeons: [],
            unlockedDungeons: ['dungeon1']
        };
    }

    savePlayerData() {
        localStorage.setItem('puzzleRPGSave', JSON.stringify(this.playerData));
    }

    initMonsterDatabase() {
        this.monsterDB = {
            1: {
                name: '火竜',
                icon: '🐲',
                element: ELEMENTS.FIRE,
                rarity: 3,
                maxLevel: 50,
                hp: 500,
                atk: 200,
                rcv: 100,
                skill: {
                    name: 'ファイアブレス',
                    description: '敵全体に火属性ダメージ',
                    cooldown: 5
                },
                leaderSkill: {
                    name: '火の加護',
                    description: '火属性の攻撃力2倍'
                },
                evolution: {
                    to: 2,
                    materials: [101, 102]
                }
            },
            2: {
                name: '業火竜',
                icon: '🔥',
                element: ELEMENTS.FIRE,
                rarity: 4,
                maxLevel: 70,
                hp: 1000,
                atk: 400,
                rcv: 150,
                skill: {
                    name: 'インフェルノ',
                    description: '敵全体に特大火属性ダメージ',
                    cooldown: 6
                },
                leaderSkill: {
                    name: '業火の加護',
                    description: '火属性の攻撃力2.5倍'
                }
            },
            3: {
                name: '水精',
                icon: '🧊',
                element: ELEMENTS.WATER,
                rarity: 3,
                maxLevel: 50,
                hp: 600,
                atk: 180,
                rcv: 120,
                skill: {
                    name: 'アクアヒール',
                    description: 'HPを30%回復',
                    cooldown: 4
                },
                leaderSkill: {
                    name: '水の加護',
                    description: '水属性のHP1.5倍'
                }
            },
            4: {
                name: '森の精霊',
                icon: '🧚',
                element: ELEMENTS.WOOD,
                rarity: 3,
                maxLevel: 50,
                hp: 550,
                atk: 190,
                rcv: 110,
                skill: {
                    name: 'リーフストーム',
                    description: '木ドロップを増やす',
                    cooldown: 3
                },
                leaderSkill: {
                    name: '森の加護',
                    description: '木属性の回復力2倍'
                }
            },
            5: {
                name: '光の天使',
                icon: '👼',
                element: ELEMENTS.LIGHT,
                rarity: 4,
                maxLevel: 60,
                hp: 700,
                atk: 250,
                rcv: 150,
                skill: {
                    name: 'ホーリーライト',
                    description: '闇ドロップを光ドロップに変換',
                    cooldown: 5
                },
                leaderSkill: {
                    name: '光の加護',
                    description: '光属性の攻撃力とHP1.5倍'
                }
            },
            6: {
                name: '闇の魔王',
                icon: '😈',
                element: ELEMENTS.DARK,
                rarity: 5,
                maxLevel: 80,
                hp: 1200,
                atk: 450,
                rcv: 80,
                skill: {
                    name: 'ダークネスゾーン',
                    description: '3ターンの間、闇属性攻撃力3倍',
                    cooldown: 8
                },
                leaderSkill: {
                    name: '闇の支配',
                    description: '闇属性の攻撃力3倍、HP0.5倍'
                }
            },
            // 進化素材
            101: {
                name: '火の宝玉',
                icon: '🔴',
                element: ELEMENTS.FIRE,
                rarity: 2,
                maxLevel: 1,
                hp: 100,
                atk: 10,
                rcv: 10,
                isMaterial: true
            },
            102: {
                name: '竜の鱗',
                icon: '🦴',
                element: ELEMENTS.FIRE,
                rarity: 2,
                maxLevel: 1,
                hp: 100,
                atk: 10,
                rcv: 10,
                isMaterial: true
            }
        };
    }

    initDungeons() {
        this.dungeons = {
            dungeon1: {
                name: '初心者の森',
                stamina: 5,
                floors: 3,
                enemies: [
                    { id: 'slime', name: 'スライム', icon: '🟢', hp: 100, atk: 50, def: 10, element: ELEMENTS.WOOD, turnTimer: 2 },
                    { id: 'goblin', name: 'ゴブリン', icon: '👺', hp: 150, atk: 80, def: 20, element: ELEMENTS.DARK, turnTimer: 1 }
                ],
                boss: { id: 'ogre', name: 'オーガ', icon: '👹', hp: 500, atk: 150, def: 50, element: ELEMENTS.FIRE, turnTimer: 1 },
                rewards: { exp: 100, gold: 500, drops: [101] }
            },
            dungeon2: {
                name: '水の神殿',
                stamina: 10,
                floors: 5,
                enemies: [
                    { id: 'mermaid', name: 'マーメイド', icon: '🧜‍♀️', hp: 200, atk: 100, def: 30, element: ELEMENTS.WATER, turnTimer: 2 },
                    { id: 'kraken', name: 'クラーケン', icon: '🐙', hp: 300, atk: 120, def: 40, element: ELEMENTS.WATER, turnTimer: 1 }
                ],
                boss: { id: 'leviathan', name: 'リヴァイアサン', icon: '🐳', hp: 1000, atk: 300, def: 100, element: ELEMENTS.WATER, turnTimer: 1 },
                rewards: { exp: 300, gold: 1500, drops: [3, 101] }
            },
            dungeon3: {
                name: '天空の城',
                stamina: 15,
                floors: 7,
                enemies: [
                    { id: 'angel', name: '天使', icon: '👼', hp: 400, atk: 200, def: 50, element: ELEMENTS.LIGHT, turnTimer: 2 },
                    { id: 'valkyrie', name: 'ヴァルキリー', icon: '⚔️', hp: 500, atk: 250, def: 80, element: ELEMENTS.LIGHT, turnTimer: 1 }
                ],
                boss: { id: 'zeus', name: 'ゼウス', icon: '⚡', hp: 2000, atk: 500, def: 200, element: ELEMENTS.LIGHT, turnTimer: 1 },
                rewards: { exp: 500, gold: 3000, drops: [5, 102] }
            }
        };
    }

    setupEventListeners() {
        // タイトル画面
        document.getElementById('startBtn').addEventListener('click', () => this.startNewGame());
        document.getElementById('continueBtn').addEventListener('click', () => this.continueGame());

        // メインメニュー
        document.getElementById('dungeonBtn').addEventListener('click', () => this.showDungeonSelect());
        document.getElementById('monsterBtn').addEventListener('click', () => this.showMonsterList());
        document.getElementById('teamBtn').addEventListener('click', () => this.showTeamEdit());
        document.getElementById('evolveBtn').addEventListener('click', () => this.showEvolution());
        document.getElementById('shopBtn').addEventListener('click', () => this.showShop());
        document.getElementById('gachaBtn').addEventListener('click', () => this.showGacha());

        // 戻るボタン
        document.getElementById('dungeonBackBtn').addEventListener('click', () => this.showMainMenu());
        document.getElementById('monsterBackBtn').addEventListener('click', () => this.showMainMenu());
        document.getElementById('teamBackBtn').addEventListener('click', () => this.showMainMenu());
        document.getElementById('evolveBackBtn').addEventListener('click', () => this.showMainMenu());
        document.getElementById('shopBackBtn').addEventListener('click', () => this.showMainMenu());
        document.getElementById('gachaBackBtn').addEventListener('click', () => this.showMainMenu());

        // チーム編成
        document.getElementById('saveTeamBtn').addEventListener('click', () => this.saveTeam());

        // ガチャ
        document.getElementById('singleGachaBtn').addEventListener('click', () => this.doGacha(1));
        document.getElementById('multiGachaBtn').addEventListener('click', () => this.doGacha(11));
        document.getElementById('gachaOkBtn').addEventListener('click', () => this.closeGachaResult());

        // バトル関連
        document.getElementById('nextFloorBtn').addEventListener('click', () => this.nextFloor());
        document.getElementById('returnMenuBtn').addEventListener('click', () => this.returnToMenu());
        document.getElementById('retryBtn').addEventListener('click', () => this.retryDungeon());
        document.getElementById('giveupBtn').addEventListener('click', () => this.giveUpDungeon());
    }

    showScreen(screenId) {
        const screens = [
            'titleScreen', 'mainMenu', 'dungeonSelect', 'battleScreen',
            'monsterListScreen', 'teamEditScreen', 'evolutionScreen',
            'shopScreen', 'gachaScreen'
        ];
        screens.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.style.display = id === screenId ? 'block' : 'none';
            }
        });
    }

    startNewGame() {
        this.playerData = {
            level: 1,
            exp: 0,
            stamina: 50,
            maxStamina: 50,
            gold: 0,
            gems: 5,
            monsters: [
                {
                    id: 1,
                    monsterId: 1,
                    level: 1,
                    exp: 0,
                    plusHp: 0,
                    plusAtk: 0,
                    plusRcv: 0
                }
            ],
            teams: [[1, null, null, null, null]],
            currentTeamIndex: 0,
            clearedDungeons: [],
            unlockedDungeons: ['dungeon1']
        };
        this.savePlayerData();
        this.showMainMenu();
    }

    continueGame() {
        this.showMainMenu();
    }

    showMainMenu() {
        this.currentState = GameState.MENU;
        this.showScreen('mainMenu');
        this.updateMainMenuUI();
    }

    updateMainMenuUI() {
        document.getElementById('playerLevel').textContent = this.playerData.level;
        const expNeeded = this.playerData.level * 100;
        const expPercent = (this.playerData.exp / expNeeded) * 100;
        document.getElementById('expFill').style.width = `${expPercent}%`;
        document.getElementById('expText').textContent = `${this.playerData.exp} / ${expNeeded}`;
        document.getElementById('stamina').textContent = this.playerData.stamina;
        document.getElementById('maxStamina').textContent = this.playerData.maxStamina;
        document.getElementById('gold').textContent = this.playerData.gold;
        document.getElementById('gems').textContent = this.playerData.gems;
    }

    showDungeonSelect() {
        this.currentState = GameState.DUNGEON_SELECT;
        this.showScreen('dungeonSelect');
        this.renderDungeonList();
    }

    renderDungeonList() {
        const container = document.getElementById('dungeonList');
        container.innerHTML = '';

        Object.entries(this.dungeons).forEach(([id, dungeon]) => {
            if (!this.playerData.unlockedDungeons.includes(id)) return;

            const item = document.createElement('div');
            item.className = 'dungeon-item';
            
            const cleared = this.playerData.clearedDungeons.includes(id);
            
            item.innerHTML = `
                <div class="dungeon-info">
                    <div class="dungeon-name">${dungeon.name}</div>
                    <div class="dungeon-stamina">スタミナ: ${dungeon.stamina}</div>
                </div>
                <div class="dungeon-status">
                    <div class="clear-stars">${cleared ? '⭐⭐⭐' : '☆☆☆'}</div>
                </div>
            `;

            item.addEventListener('click', () => this.startDungeon(id));
            container.appendChild(item);
        });
    }

    startDungeon(dungeonId) {
        const dungeon = this.dungeons[dungeonId];
        if (this.playerData.stamina < dungeon.stamina) {
            alert('スタミナが不足しています！');
            return;
        }

        this.playerData.stamina -= dungeon.stamina;
        this.savePlayerData();

        this.currentDungeon = dungeonId;
        this.currentFloor = 0;
        this.prepareTeam();
        this.startBattle();
    }

    prepareTeam() {
        this.currentTeam = [];
        const teamData = this.playerData.teams[this.playerData.currentTeamIndex];
        
        teamData.forEach(monsterId => {
            if (monsterId) {
                const monster = this.playerData.monsters.find(m => m.id === monsterId);
                if (monster) {
                    const baseMonster = this.monsterDB[monster.monsterId];
                    this.currentTeam.push({
                        ...monster,
                        ...baseMonster,
                        currentHp: this.calculateStat(baseMonster.hp, monster.level, monster.plusHp),
                        maxHp: this.calculateStat(baseMonster.hp, monster.level, monster.plusHp),
                        attack: this.calculateStat(baseMonster.atk, monster.level, monster.plusAtk),
                        recovery: this.calculateStat(baseMonster.rcv, monster.level, monster.plusRcv),
                        skillCooldown: 0
                    });
                }
            }
        });
    }

    calculateStat(base, level, plus) {
        return Math.floor(base * (1 + (level - 1) * 0.1) + plus * 10);
    }

    startBattle() {
        this.currentState = GameState.BATTLE;
        this.showScreen('battleScreen');
        
        this.battleState = {
            turn: 1,
            enemies: this.generateEnemies(),
            teamHp: this.currentTeam.reduce((sum, m) => sum + (m ? m.maxHp : 0), 0),
            teamMaxHp: this.currentTeam.reduce((sum, m) => sum + (m ? m.maxHp : 0), 0),
            combo: 0,
            maxCombo: 0
        };

        this.initPuzzleBoard();
        this.updateBattleUI();
    }

    generateEnemies() {
        const dungeon = this.dungeons[this.currentDungeon];
        const enemies = [];
        
        if (this.currentFloor === dungeon.floors - 1) {
            // ボスフロア
            enemies.push({
                ...dungeon.boss,
                currentHp: dungeon.boss.hp,
                maxHp: dungeon.boss.hp,
                currentTurn: dungeon.boss.turnTimer,
                isBoss: true
            });
        } else {
            // 通常フロア
            const enemyCount = Math.floor(Math.random() * 3) + 1;
            for (let i = 0; i < enemyCount; i++) {
                const enemyTemplate = dungeon.enemies[Math.floor(Math.random() * dungeon.enemies.length)];
                enemies.push({
                    ...enemyTemplate,
                    currentHp: enemyTemplate.hp,
                    maxHp: enemyTemplate.hp,
                    currentTurn: enemyTemplate.turnTimer
                });
            }
        }
        
        return enemies;
    }

    updateBattleUI() {
        // ターン表示
        document.getElementById('turnCount').textContent = this.battleState.turn;

        // 敵表示
        const enemiesContainer = document.getElementById('enemies');
        enemiesContainer.innerHTML = '';
        this.battleState.enemies.forEach((enemy, index) => {
            const enemyDiv = document.createElement('div');
            enemyDiv.className = enemy.isBoss ? 'enemy boss' : 'enemy';
            enemyDiv.innerHTML = `
                <div class="enemy-sprite">${enemy.icon}</div>
                <div class="enemy-hp-bar">
                    <div class="enemy-hp-fill" style="width: ${(enemy.currentHp / enemy.maxHp) * 100}%"></div>
                </div>
                <div class="enemy-turn-counter">${enemy.currentTurn}</div>
            `;
            enemiesContainer.appendChild(enemyDiv);
        });

        // チームHP表示
        const hpPercent = (this.battleState.teamHp / this.battleState.teamMaxHp) * 100;
        document.getElementById('teamHpFill').style.width = `${hpPercent}%`;
        document.getElementById('teamHpText').textContent = `${this.battleState.teamHp} / ${this.battleState.teamMaxHp}`;

        // チームメンバー表示
        const membersContainer = document.getElementById('teamMembers');
        membersContainer.innerHTML = '';
        this.currentTeam.forEach((member, index) => {
            if (member) {
                const memberDiv = document.createElement('div');
                memberDiv.className = 'team-member';
                memberDiv.innerHTML = `
                    <div class="member-sprite">${member.icon}</div>
                    <div class="member-hp">${member.currentHp}/${member.maxHp}</div>
                    ${member.skillCooldown === 0 ? '<div class="skill-ready">✨</div>' : ''}
                `;
                membersContainer.appendChild(memberDiv);
            }
        });

        // スキルボタン表示
        this.updateSkillButtons();
    }

    updateSkillButtons() {
        const container = document.getElementById('skillButtons');
        container.innerHTML = '';
        
        this.currentTeam.forEach((member, index) => {
            if (member && member.skill) {
                const btn = document.createElement('button');
                btn.className = 'skill-btn';
                btn.disabled = member.skillCooldown > 0;
                btn.innerHTML = `
                    ${member.icon}
                    ${member.skillCooldown > 0 ? `<div class="skill-cooldown">${member.skillCooldown}</div>` : ''}
                `;
                btn.addEventListener('click', () => this.useSkill(index));
                container.appendChild(btn);
            }
        });
    }

    useSkill(memberIndex) {
        const member = this.currentTeam[memberIndex];
        if (!member || member.skillCooldown > 0) return;

        // スキル効果を適用
        this.applySkillEffect(member.skill);
        member.skillCooldown = member.skill.cooldown;
        
        this.updateBattleUI();
    }

    applySkillEffect(skill) {
        // スキル効果の実装（簡略版）
        switch (skill.name) {
            case 'ファイアブレス':
            case 'インフェルノ':
                this.battleState.enemies.forEach(enemy => {
                    const damage = skill.name === 'インフェルノ' ? 1000 : 500;
                    this.damageEnemy(enemy, damage);
                });
                break;
            case 'アクアヒール':
                const healAmount = Math.floor(this.battleState.teamMaxHp * 0.3);
                this.battleState.teamHp = Math.min(this.battleState.teamHp + healAmount, this.battleState.teamMaxHp);
                this.showDamage(healAmount, 300, 200, true);
                break;
            // 他のスキルも同様に実装
        }
    }

    initPuzzleBoard() {
        const canvas = document.getElementById('puzzleCanvas');
        const ctx = canvas.getContext('2d');
        
        this.puzzleBoard = new PuzzleBoard(canvas, ctx, this);
        this.puzzleBoard.init();
    }

    processTurn(matches) {
        // ダメージ計算
        let totalDamage = this.calculateDamage(matches);
        
        // 敵にダメージを与える
        this.battleState.enemies.forEach(enemy => {
            this.damageEnemy(enemy, totalDamage);
        });

        // 死んだ敵を除去
        this.battleState.enemies = this.battleState.enemies.filter(e => e.currentHp > 0);

        // 戦闘終了チェック
        if (this.battleState.enemies.length === 0) {
            this.onFloorClear();
            return;
        }

        // 敵のターン処理
        this.processEnemyTurn();
        
        // ゲームオーバーチェック
        if (this.battleState.teamHp <= 0) {
            this.onGameOver();
            return;
        }

        // ターンを進める
        this.battleState.turn++;
        this.updateBattleUI();
    }

    calculateDamage(matches) {
        let baseDamage = 0;
        let comboMultiplier = 1 + (matches.combo - 1) * 0.25;
        
        matches.matches.forEach(match => {
            const element = match.element;
            const count = match.orbs.length;
            
            // 該当属性のモンスターの攻撃力を合計
            let elementDamage = 0;
            this.currentTeam.forEach(member => {
                if (member && member.element === element) {
                    elementDamage += member.attack;
                }
            });
            
            // マッチ数によるボーナス
            let matchBonus = 1;
            if (count === 4) matchBonus = 1.25;
            else if (count === 5) matchBonus = 1.5;
            else if (count >= 6) matchBonus = 2;
            
            baseDamage += elementDamage * matchBonus;
        });

        return Math.floor(baseDamage * comboMultiplier);
    }

    damageEnemy(enemy, damage) {
        enemy.currentHp = Math.max(0, enemy.currentHp - damage);
        this.showDamage(damage, 400, 200);
    }

    showDamage(damage, x, y, isHeal = false) {
        const overlay = document.getElementById('damageOverlay');
        const damageText = document.createElement('div');
        damageText.className = isHeal ? 'damage-text heal' : 'damage-text';
        damageText.textContent = damage;
        damageText.style.left = `${x}px`;
        damageText.style.top = `${y}px`;
        overlay.appendChild(damageText);
        
        setTimeout(() => damageText.remove(), 1000);
    }

    processEnemyTurn() {
        this.battleState.enemies.forEach(enemy => {
            enemy.currentTurn--;
            if (enemy.currentTurn <= 0) {
                // 敵の攻撃
                this.battleState.teamHp = Math.max(0, this.battleState.teamHp - enemy.atk);
                this.showDamage(enemy.atk, 300, 400);
                enemy.currentTurn = enemy.turnTimer;
            }
        });
    }

    onFloorClear() {
        const dungeon = this.dungeons[this.currentDungeon];
        
        if (this.currentFloor >= dungeon.floors - 1) {
            // ダンジョンクリア
            this.onDungeonClear();
        } else {
            // 次のフロアへ
            document.getElementById('maxCombo').textContent = this.battleState.maxCombo;
            document.getElementById('clearTurns').textContent = this.battleState.turn;
            document.getElementById('gainedExp').textContent = 50;
            
            document.getElementById('stageClear').style.display = 'flex';
        }
    }

    nextFloor() {
        document.getElementById('stageClear').style.display = 'none';
        this.currentFloor++;
        this.startBattle();
    }

    onDungeonClear() {
        const dungeon = this.dungeons[this.currentDungeon];
        
        // 報酬を付与
        this.playerData.exp += dungeon.rewards.exp;
        this.playerData.gold += dungeon.rewards.gold;
        
        // レベルアップチェック
        const expNeeded = this.playerData.level * 100;
        if (this.playerData.exp >= expNeeded) {
            this.playerData.level++;
            this.playerData.exp -= expNeeded;
            this.playerData.maxStamina += 5;
            this.playerData.stamina = this.playerData.maxStamina;
        }
        
        // クリア済みダンジョンに追加
        if (!this.playerData.clearedDungeons.includes(this.currentDungeon)) {
            this.playerData.clearedDungeons.push(this.currentDungeon);
            
            // 次のダンジョンをアンロック
            const dungeonKeys = Object.keys(this.dungeons);
            const currentIndex = dungeonKeys.indexOf(this.currentDungeon);
            if (currentIndex < dungeonKeys.length - 1) {
                const nextDungeon = dungeonKeys[currentIndex + 1];
                if (!this.playerData.unlockedDungeons.includes(nextDungeon)) {
                    this.playerData.unlockedDungeons.push(nextDungeon);
                }
            }
        }
        
        // ドロップ処理
        dungeon.rewards.drops.forEach(dropId => {
            if (Math.random() < 0.5) { // 50%の確率でドロップ
                this.addMonster(dropId);
            }
        });
        
        this.savePlayerData();
        
        // クリア画面表示
        document.getElementById('maxCombo').textContent = this.battleState.maxCombo;
        document.getElementById('clearTurns').textContent = this.battleState.turn;
        document.getElementById('gainedExp').textContent = dungeon.rewards.exp;
        
        document.getElementById('stageClear').style.display = 'flex';
    }

    addMonster(monsterId) {
        const newMonster = {
            id: Date.now(),
            monsterId: monsterId,
            level: 1,
            exp: 0,
            plusHp: 0,
            plusAtk: 0,
            plusRcv: 0
        };
        this.playerData.monsters.push(newMonster);
    }

    returnToMenu() {
        document.getElementById('stageClear').style.display = 'none';
        document.getElementById('gameOver').style.display = 'none';
        this.showMainMenu();
    }

    onGameOver() {
        document.getElementById('gameOver').style.display = 'flex';
    }

    retryDungeon() {
        if (this.playerData.gems >= 1) {
            this.playerData.gems--;
            this.savePlayerData();
            document.getElementById('gameOver').style.display = 'none';
            
            // HP全回復して再開
            this.battleState.teamHp = this.battleState.teamMaxHp;
            this.updateBattleUI();
        } else {
            alert('ジェムが不足しています！');
        }
    }

    giveUpDungeon() {
        document.getElementById('gameOver').style.display = 'none';
        this.showMainMenu();
    }

    showMonsterList() {
        this.currentState = GameState.MONSTER_LIST;
        this.showScreen('monsterListScreen');
        this.renderMonsterGrid();
    }

    renderMonsterGrid() {
        const container = document.getElementById('monsterGrid');
        container.innerHTML = '';
        
        this.playerData.monsters.forEach(monster => {
            const baseMonster = this.monsterDB[monster.monsterId];
            const card = document.createElement('div');
            card.className = 'monster-card';
            card.innerHTML = `
                <div class="monster-rarity">${'★'.repeat(baseMonster.rarity)}</div>
                <div class="monster-icon">${baseMonster.icon}</div>
                <div class="monster-level">Lv.${monster.level}</div>
            `;
            container.appendChild(card);
        });
    }

    showTeamEdit() {
        this.currentState = GameState.TEAM_EDIT;
        this.showScreen('teamEditScreen');
        this.renderTeamEdit();
    }

    renderTeamEdit() {
        // 現在のチーム表示
        const teamSlots = document.querySelectorAll('.team-slot');
        const currentTeam = this.playerData.teams[this.playerData.currentTeamIndex];
        
        teamSlots.forEach((slot, index) => {
            const monsterId = currentTeam[index];
            const monsterDiv = slot.querySelector('.slot-monster');
            
            if (monsterId) {
                const monster = this.playerData.monsters.find(m => m.id === monsterId);
                if (monster) {
                    const baseMonster = this.monsterDB[monster.monsterId];
                    monsterDiv.innerHTML = baseMonster.icon;
                }
            } else {
                monsterDiv.innerHTML = '';
            }
        });
        
        // チームステータス計算
        this.updateTeamStats();
        
        // モンスターリスト表示
        const listContainer = document.getElementById('teamMonsterList');
        listContainer.innerHTML = '';
        
        this.playerData.monsters.forEach(monster => {
            const baseMonster = this.monsterDB[monster.monsterId];
            const card = document.createElement('div');
            card.className = 'monster-card';
            card.innerHTML = `
                <div class="monster-icon">${baseMonster.icon}</div>
                <div class="monster-level">Lv.${monster.level}</div>
            `;
            card.addEventListener('click', () => this.selectMonsterForTeam(monster.id));
            listContainer.appendChild(card);
        });
    }

    selectMonsterForTeam(monsterId) {
        // 簡略版：最初の空きスロットに配置
        const currentTeam = this.playerData.teams[this.playerData.currentTeamIndex];
        for (let i = 0; i < 5; i++) {
            if (!currentTeam[i]) {
                currentTeam[i] = monsterId;
                this.renderTeamEdit();
                break;
            }
        }
    }

    updateTeamStats() {
        const currentTeam = this.playerData.teams[this.playerData.currentTeamIndex];
        let totalHp = 0, totalAtk = 0, totalRcv = 0;
        
        currentTeam.forEach(monsterId => {
            if (monsterId) {
                const monster = this.playerData.monsters.find(m => m.id === monsterId);
                if (monster) {
                    const baseMonster = this.monsterDB[monster.monsterId];
                    totalHp += this.calculateStat(baseMonster.hp, monster.level, monster.plusHp);
                    totalAtk += this.calculateStat(baseMonster.atk, monster.level, monster.plusAtk);
                    totalRcv += this.calculateStat(baseMonster.rcv, monster.level, monster.plusRcv);
                }
            }
        });
        
        document.getElementById('totalHp').textContent = totalHp;
        document.getElementById('totalAtk').textContent = totalAtk;
        document.getElementById('totalRcv').textContent = totalRcv;
    }

    saveTeam() {
        this.savePlayerData();
        alert('チームを保存しました！');
    }

    showEvolution() {
        this.currentState = GameState.EVOLUTION;
        this.showScreen('evolutionScreen');
        // 進化画面の実装
    }

    showShop() {
        this.currentState = GameState.SHOP;
        this.showScreen('shopScreen');
        this.renderShop();
    }

    renderShop() {
        const container = document.getElementById('shopContent');
        container.innerHTML = `
            <div class="shop-item">
                <div class="item-info">
                    <div class="item-name">スタミナ回復</div>
                    <div class="item-description">スタミナを全回復します</div>
                </div>
                <div class="item-price">
                    <span>💎1</span>
                    <button class="buy-btn" onclick="game.buyStamina()">購入</button>
                </div>
            </div>
        `;
    }

    buyStamina() {
        if (this.playerData.gems >= 1) {
            this.playerData.gems--;
            this.playerData.stamina = this.playerData.maxStamina;
            this.savePlayerData();
            alert('スタミナを回復しました！');
            this.updateMainMenuUI();
        } else {
            alert('ジェムが不足しています！');
        }
    }

    showGacha() {
        this.currentState = GameState.GACHA;
        this.showScreen('gachaScreen');
    }

    doGacha(count) {
        const cost = count === 1 ? 5 : 50;
        if (this.playerData.gems < cost) {
            alert('ジェムが不足しています！');
            return;
        }
        
        this.playerData.gems -= cost;
        const results = [];
        
        for (let i = 0; i < count; i++) {
            const roll = Math.random();
            let rarity;
            if (roll < 0.03) rarity = 6;
            else if (roll < 0.15) rarity = 5;
            else if (roll < 0.50) rarity = 4;
            else rarity = 3;
            
            // 該当レアリティのモンスターをランダムに選択
            const candidates = Object.entries(this.monsterDB)
                .filter(([id, m]) => m.rarity === rarity && !m.isMaterial)
                .map(([id]) => parseInt(id));
            
            if (candidates.length > 0) {
                const monsterId = candidates[Math.floor(Math.random() * candidates.length)];
                this.addMonster(monsterId);
                results.push(monsterId);
            }
        }
        
        this.savePlayerData();
        this.showGachaResult(results);
    }

    showGachaResult(results) {
        const container = document.getElementById('resultMonsters');
        container.innerHTML = '';
        
        results.forEach(monsterId => {
            const monster = this.monsterDB[monsterId];
            const div = document.createElement('div');
            div.className = monster.rarity >= 5 ? 'result-monster new' : 'result-monster';
            div.innerHTML = `
                <div style="font-size: 40px">${monster.icon}</div>
                <div style="color: #FFD700">${'★'.repeat(monster.rarity)}</div>
                <div>${monster.name}</div>
            `;
            container.appendChild(div);
        });
        
        document.getElementById('gachaResult').style.display = 'flex';
    }

    closeGachaResult() {
        document.getElementById('gachaResult').style.display = 'none';
    }
}

// パズルボードクラス
class PuzzleBoard {
    constructor(canvas, ctx, game) {
        this.canvas = canvas;
        this.ctx = ctx;
        this.game = game;
        this.cols = 6;
        this.rows = 5;
        this.orbSize = 60;
        this.board = [];
        this.selectedOrb = null;
        this.isDragging = false;
        this.dragPath = [];
        this.moveTimer = null;
        this.moveTime = 4000; // 4秒
    }

    init() {
        this.canvas.width = this.cols * this.orbSize;
        this.canvas.height = this.rows * this.orbSize;
        
        this.generateBoard();
        this.draw();
        this.setupEventListeners();
    }

    generateBoard() {
        this.board = [];
        const elements = [ELEMENTS.FIRE, ELEMENTS.WATER, ELEMENTS.WOOD, ELEMENTS.LIGHT, ELEMENTS.DARK, ELEMENTS.HEART];
        
        for (let row = 0; row < this.rows; row++) {
            this.board[row] = [];
            for (let col = 0; col < this.cols; col++) {
                this.board[row][col] = {
                    element: elements[Math.floor(Math.random() * elements.length)],
                    x: col * this.orbSize,
                    y: row * this.orbSize,
                    row: row,
                    col: col
                };
            }
        }
    }

    setupEventListeners() {
        this.canvas.addEventListener('mousedown', (e) => this.onMouseDown(e));
        this.canvas.addEventListener('mousemove', (e) => this.onMouseMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.onMouseUp(e));
        
        this.canvas.addEventListener('touchstart', (e) => this.onTouchStart(e));
        this.canvas.addEventListener('touchmove', (e) => this.onTouchMove(e));
        this.canvas.addEventListener('touchend', (e) => this.onTouchEnd(e));
    }

    onMouseDown(e) {
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.startDrag(x, y);
    }

    onTouchStart(e) {
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        this.startDrag(x, y);
    }

    startDrag(x, y) {
        const col = Math.floor(x / this.orbSize);
        const row = Math.floor(y / this.orbSize);
        
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            this.selectedOrb = this.board[row][col];
            this.isDragging = true;
            this.dragPath = [{row, col}];
            
            // タイマー開始
            this.startMoveTimer();
        }
    }

    onMouseMove(e) {
        if (!this.isDragging) return;
        const rect = this.canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.processDrag(x, y);
    }

    onTouchMove(e) {
        if (!this.isDragging) return;
        e.preventDefault();
        const rect = this.canvas.getBoundingClientRect();
        const touch = e.touches[0];
        const x = touch.clientX - rect.left;
        const y = touch.clientY - rect.top;
        this.processDrag(x, y);
    }

    processDrag(x, y) {
        const col = Math.floor(x / this.orbSize);
        const row = Math.floor(y / this.orbSize);
        
        if (row >= 0 && row < this.rows && col >= 0 && col < this.cols) {
            const targetOrb = this.board[row][col];
            
            if (targetOrb !== this.selectedOrb) {
                // オーブを入れ替え
                const tempElement = this.selectedOrb.element;
                this.selectedOrb.element = targetOrb.element;
                targetOrb.element = tempElement;
                
                this.selectedOrb = targetOrb;
                this.dragPath.push({row, col});
                
                this.draw();
            }
        }
    }

    onMouseUp(e) {
        this.endDrag();
    }

    onTouchEnd(e) {
        e.preventDefault();
        this.endDrag();
    }

    endDrag() {
        if (!this.isDragging) return;
        
        this.isDragging = false;
        this.selectedOrb = null;
        
        // タイマー停止
        this.stopMoveTimer();
        
        // マッチ判定
        const matches = this.findMatches();
        if (matches.length > 0) {
            this.eliminateMatches(matches);
            this.dropOrbs();
            
            // コンボ計算
            let combo = 0;
            let allMatches = [];
            
            const processMatches = () => {
                const newMatches = this.findMatches();
                if (newMatches.length > 0) {
                    combo++;
                    allMatches = allMatches.concat(newMatches);
                    this.eliminateMatches(newMatches);
                    this.dropOrbs();
                    setTimeout(processMatches, 300);
                } else {
                    // コンボ終了
                    if (combo > 0) {
                        this.showCombo(combo);
                        this.game.battleState.maxCombo = Math.max(this.game.battleState.maxCombo, combo);
                        this.game.processTurn({combo, matches: allMatches});
                    }
                    this.generateNewOrbs();
                    this.draw();
                }
            };
            
            setTimeout(processMatches, 300);
        } else {
            this.draw();
        }
    }

    startMoveTimer() {
        const timerBar = document.getElementById('moveTimer');
        const timerFill = document.getElementById('timerFill');
        
        timerBar.style.display = 'block';
        timerFill.style.width = '100%';
        timerFill.style.transition = `width ${this.moveTime}ms linear`;
        
        setTimeout(() => {
            timerFill.style.width = '0%';
        }, 10);
        
        this.moveTimer = setTimeout(() => {
            this.endDrag();
        }, this.moveTime);
    }

    stopMoveTimer() {
        if (this.moveTimer) {
            clearTimeout(this.moveTimer);
            this.moveTimer = null;
        }
        
        const timerBar = document.getElementById('moveTimer');
        timerBar.style.display = 'none';
    }

    findMatches() {
        const matches = [];
        const visited = Array(this.rows).fill().map(() => Array(this.cols).fill(false));
        
        // 横方向のマッチ
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols - 2; col++) {
                const element = this.board[row][col].element;
                if (element === ELEMENTS.HEART) continue; // ハートは回復なので除外
                
                let matchLength = 1;
                while (col + matchLength < this.cols && 
                       this.board[row][col + matchLength].element === element) {
                    matchLength++;
                }
                
                if (matchLength >= 3) {
                    const orbs = [];
                    for (let i = 0; i < matchLength; i++) {
                        orbs.push({row, col: col + i});
                        visited[row][col + i] = true;
                    }
                    matches.push({element, orbs});
                    col += matchLength - 1;
                }
            }
        }
        
        // 縦方向のマッチ
        for (let col = 0; col < this.cols; col++) {
            for (let row = 0; row < this.rows - 2; row++) {
                if (visited[row][col]) continue;
                
                const element = this.board[row][col].element;
                if (element === ELEMENTS.HEART) continue;
                
                let matchLength = 1;
                while (row + matchLength < this.rows && 
                       this.board[row + matchLength][col].element === element &&
                       !visited[row + matchLength][col]) {
                    matchLength++;
                }
                
                if (matchLength >= 3) {
                    const orbs = [];
                    for (let i = 0; i < matchLength; i++) {
                        orbs.push({row: row + i, col});
                    }
                    matches.push({element, orbs});
                    row += matchLength - 1;
                }
            }
        }
        
        return matches;
    }

    eliminateMatches(matches) {
        matches.forEach(match => {
            match.orbs.forEach(orb => {
                this.board[orb.row][orb.col] = null;
            });
        });
    }

    dropOrbs() {
        for (let col = 0; col < this.cols; col++) {
            let emptyRow = this.rows - 1;
            for (let row = this.rows - 1; row >= 0; row--) {
                if (this.board[row][col] !== null) {
                    if (row !== emptyRow) {
                        this.board[emptyRow][col] = this.board[row][col];
                        this.board[emptyRow][col].row = emptyRow;
                        this.board[row][col] = null;
                    }
                    emptyRow--;
                }
            }
        }
    }

    generateNewOrbs() {
        const elements = [ELEMENTS.FIRE, ELEMENTS.WATER, ELEMENTS.WOOD, ELEMENTS.LIGHT, ELEMENTS.DARK, ELEMENTS.HEART];
        
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (this.board[row][col] === null) {
                    this.board[row][col] = {
                        element: elements[Math.floor(Math.random() * elements.length)],
                        x: col * this.orbSize,
                        y: row * this.orbSize,
                        row: row,
                        col: col
                    };
                }
            }
        }
    }

    showCombo(count) {
        const display = document.getElementById('comboDisplay');
        const countSpan = display.querySelector('.combo-count');
        countSpan.textContent = count;
        display.style.display = 'block';
        
        setTimeout(() => {
            display.style.display = 'none';
        }, 1000);
    }

    draw() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // グリッド描画
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;
        
        for (let i = 0; i <= this.cols; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(i * this.orbSize, 0);
            this.ctx.lineTo(i * this.orbSize, this.canvas.height);
            this.ctx.stroke();
        }
        
        for (let i = 0; i <= this.rows; i++) {
            this.ctx.beginPath();
            this.ctx.moveTo(0, i * this.orbSize);
            this.ctx.lineTo(this.canvas.width, i * this.orbSize);
            this.ctx.stroke();
        }
        
        // オーブ描画
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                const orb = this.board[row][col];
                if (orb) {
                    const x = col * this.orbSize + this.orbSize / 2;
                    const y = row * this.orbSize + this.orbSize / 2;
                    
                    // オーブの背景
                    this.ctx.beginPath();
                    this.ctx.arc(x, y, this.orbSize / 2 - 5, 0, Math.PI * 2);
                    this.ctx.fillStyle = ELEMENT_COLORS[orb.element];
                    this.ctx.fill();
                    
                    // オーブのアイコン
                    this.ctx.font = '30px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.textBaseline = 'middle';
                    this.ctx.fillText(ELEMENT_ICONS[orb.element], x, y);
                    
                    // 選択中のオーブをハイライト
                    if (orb === this.selectedOrb) {
                        this.ctx.strokeStyle = '#FFD700';
                        this.ctx.lineWidth = 3;
                        this.ctx.stroke();
                    }
                }
            }
        }
    }
}

// ゲーム開始
let game;
window.addEventListener('DOMContentLoaded', () => {
    game = new PuzzleRPGGame();
});