// リズムゲーム

// ゲーム定数
const LANES = 4;
const NOTE_SPEED = 5; // デフォルトスピード
const JUDGMENT_Y = 500; // 判定ラインのY座標
const PERFECT_RANGE = 30;
const GREAT_RANGE = 60;
const GOOD_RANGE = 90;

// キーマッピング
const KEY_MAP = {
    'd': 0,
    'f': 1,
    'j': 2,
    'k': 3,
    'D': 0,
    'F': 1,
    'J': 2,
    'K': 3
};

// 曲データ
const SONGS = {
    1: {
        title: 'Electric Dreams',
        artist: 'DJ Thunder',
        bpm: 140,
        duration: 150, // 秒
        jacket: '🎸',
        difficulties: {
            easy: {
                notes: generateNotes(140, 150, 1)
            },
            normal: {
                notes: generateNotes(140, 150, 2)
            },
            hard: {
                notes: generateNotes(140, 150, 3)
            }
        }
    },
    2: {
        title: 'Piano Fantasia',
        artist: 'Classical Master',
        bpm: 120,
        duration: 180,
        jacket: '🎹',
        difficulties: {
            easy: {
                notes: generateNotes(120, 180, 1)
            },
            normal: {
                notes: generateNotes(120, 180, 2)
            },
            hard: {
                notes: generateNotes(120, 180, 3)
            }
        }
    },
    3: {
        title: 'Drum & Bass Rush',
        artist: 'Beat Maker',
        bpm: 174,
        duration: 120,
        jacket: '🥁',
        difficulties: {
            easy: {
                notes: generateNotes(174, 120, 1)
            },
            normal: {
                notes: generateNotes(174, 120, 2)
            },
            hard: {
                notes: generateNotes(174, 120, 3)
            }
        }
    }
};

// ノート生成関数（仮のノートパターン生成）
function generateNotes(bpm, duration, difficulty) {
    const notes = [];
    const beatInterval = 60000 / bpm; // ミリ秒/ビート
    const totalBeats = Math.floor((duration * 1000) / beatInterval);
    
    // 難易度に応じたノート密度
    const density = difficulty === 1 ? 0.3 : difficulty === 2 ? 0.5 : 0.7;
    
    for (let beat = 0; beat < totalBeats; beat++) {
        if (Math.random() < density) {
            const time = beat * beatInterval;
            const lane = Math.floor(Math.random() * LANES);
            
            notes.push({
                time: time,
                lane: lane,
                type: 'normal'
            });
            
            // ロングノート
            if (difficulty > 1 && Math.random() < 0.2) {
                notes.push({
                    time: time,
                    lane: (lane + 2) % LANES,
                    type: 'long',
                    duration: beatInterval * (1 + Math.floor(Math.random() * 3))
                });
            }
        }
    }
    
    return notes.sort((a, b) => a.time - b.time);
}

// ゲームクラス
class RhythmGame {
    constructor() {
        this.canvas = null;
        this.ctx = null;
        this.visualizerCanvas = null;
        this.visualizerCtx = null;
        
        this.gameState = 'title';
        this.selectedSong = null;
        this.selectedDifficulty = 'easy';
        this.currentSong = null;
        
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.life = 100;
        
        this.judgments = {
            perfect: 0,
            great: 0,
            good: 0,
            miss: 0
        };
        
        this.notes = [];
        this.activeNotes = [];
        this.startTime = 0;
        this.currentTime = 0;
        this.songDuration = 0;
        
        this.noteSpeed = NOTE_SPEED;
        this.soundVolume = 70;
        this.seVolume = 80;
        this.timingOffset = 0;
        this.visualEffects = true;
        
        this.animationId = null;
        this.isPaused = false;
        
        this.highScores = this.loadHighScores();
        this.stats = this.loadStats();
        
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.showTitleScreen();
    }

    setupEventListeners() {
        // タイトル画面
        document.getElementById('playBtn').addEventListener('click', () => this.showSongSelect());
        document.getElementById('freePlayBtn').addEventListener('click', () => this.showFreePlay());
        document.getElementById('optionsBtn').addEventListener('click', () => this.showOptions());
        document.getElementById('recordsBtn').addEventListener('click', () => this.showRecords());

        // 曲選択
        document.getElementById('selectBackBtn').addEventListener('click', () => this.showTitleScreen());
        document.querySelectorAll('.song-card').forEach(card => {
            card.addEventListener('click', (e) => {
                const songId = parseInt(e.currentTarget.dataset.song);
                this.selectSong(songId);
            });
        });
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.selectDifficulty(e.currentTarget.dataset.diff);
            });
        });
        document.getElementById('startSongBtn').addEventListener('click', () => this.startGame());

        // ゲーム画面
        document.getElementById('pauseBtn').addEventListener('click', () => this.pauseGame());
        document.getElementById('retryBtn').addEventListener('click', () => this.retryGame());
        document.getElementById('quitBtn').addEventListener('click', () => this.quitGame());

        // ポーズメニュー
        document.getElementById('resumeBtn').addEventListener('click', () => this.resumeGame());
        document.getElementById('pauseRetryBtn').addEventListener('click', () => this.retryGame());
        document.getElementById('pauseQuitBtn').addEventListener('click', () => this.quitGame());

        // リザルト
        document.getElementById('resultRetryBtn').addEventListener('click', () => this.retryGame());
        document.getElementById('resultNextBtn').addEventListener('click', () => this.showSongSelect());
        document.getElementById('resultMenuBtn').addEventListener('click', () => this.showTitleScreen());

        // オプション
        document.getElementById('speedSlider').addEventListener('input', (e) => this.updateSpeed(e.target.value));
        document.getElementById('volumeSlider').addEventListener('input', (e) => this.updateVolume(e.target.value));
        document.getElementById('seSlider').addEventListener('input', (e) => this.updateSEVolume(e.target.value));
        document.getElementById('timingSlider').addEventListener('input', (e) => this.updateTiming(e.target.value));
        document.getElementById('effectsToggle').addEventListener('change', (e) => this.toggleEffects(e.target.checked));
        document.getElementById('calibrateBtn').addEventListener('click', () => this.showCalibration());
        document.getElementById('resetOptionsBtn').addEventListener('click', () => this.resetOptions());
        document.getElementById('optionsBackBtn').addEventListener('click', () => this.showTitleScreen());

        // 記録
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => this.switchRecordTab(e.currentTarget.dataset.tab));
        });
        document.getElementById('recordsBackBtn').addEventListener('click', () => this.showTitleScreen());

        // キャリブレーション
        document.getElementById('calibDoneBtn').addEventListener('click', () => this.closeCalibration());

        // キーボード入力
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
    }

    handleKeyDown(e) {
        if (this.gameState !== 'playing' || this.isPaused) return;

        const lane = KEY_MAP[e.key];
        if (lane !== undefined) {
            this.hitNote(lane);
            this.activateLane(lane);
        }

        if (e.key === 'Escape') {
            this.pauseGame();
        }
    }

    handleKeyUp(e) {
        const lane = KEY_MAP[e.key];
        if (lane !== undefined) {
            this.deactivateLane(lane);
        }
    }

    activateLane(lane) {
        const target = document.querySelector(`.lane-target[data-lane="${lane}"]`);
        if (target) {
            target.classList.add('active');
        }
    }

    deactivateLane(lane) {
        const target = document.querySelector(`.lane-target[data-lane="${lane}"]`);
        if (target) {
            target.classList.remove('active');
        }
    }

    showTitleScreen() {
        this.hideAllScreens();
        document.getElementById('titleScreen').style.display = 'flex';
        this.gameState = 'title';
    }

    showSongSelect() {
        this.hideAllScreens();
        document.getElementById('songSelectScreen').style.display = 'block';
        this.gameState = 'song_select';
        this.updateHighScores();
    }

    showFreePlay() {
        // フリープレイモード（未実装）
        alert('フリープレイモードは現在開発中です！');
    }

    showOptions() {
        this.hideAllScreens();
        document.getElementById('optionsScreen').style.display = 'flex';
        this.gameState = 'options';
    }

    showRecords() {
        this.hideAllScreens();
        document.getElementById('recordsScreen').style.display = 'flex';
        this.gameState = 'records';
        this.displayRecords('all');
        this.updateStats();
    }

    selectSong(songId) {
        this.selectedSong = songId;
        
        // 選択表示を更新
        document.querySelectorAll('.song-card').forEach(card => {
            card.classList.remove('selected');
        });
        document.querySelector(`.song-card[data-song="${songId}"]`).classList.add('selected');
        
        // プレビュー更新
        const song = SONGS[songId];
        document.querySelector('.preview-jacket').textContent = song.jacket;
        document.querySelector('.preview-title').textContent = song.title;
        document.querySelector('.preview-artist').textContent = song.artist;
        
        // スタートボタンを有効化
        document.getElementById('startSongBtn').disabled = false;
    }

    selectDifficulty(difficulty) {
        this.selectedDifficulty = difficulty;
        
        // ボタンの選択状態を更新
        document.querySelectorAll('.diff-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.diff-btn[data-diff="${difficulty}"]`).classList.add('active');
    }

    startGame() {
        if (!this.selectedSong) return;
        
        this.hideAllScreens();
        document.getElementById('gameScreen').style.display = 'flex';
        this.gameState = 'playing';
        
        // ゲーム初期化
        this.currentSong = SONGS[this.selectedSong];
        this.notes = [...this.currentSong.difficulties[this.selectedDifficulty].notes];
        this.activeNotes = [];
        this.score = 0;
        this.combo = 0;
        this.maxCombo = 0;
        this.life = 100;
        this.judgments = { perfect: 0, great: 0, good: 0, miss: 0 };
        
        // Canvas初期化
        this.initCanvas();
        
        // ゲーム開始
        this.startTime = Date.now();
        this.songDuration = this.currentSong.duration * 1000;
        this.isPaused = false;
        
        // UI更新
        this.updateGameUI();
        
        // ゲームループ開始
        this.gameLoop();
    }

    initCanvas() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        
        // Canvasサイズ設定
        const gameArea = document.querySelector('.game-area');
        this.canvas.width = gameArea.offsetWidth;
        this.canvas.height = gameArea.offsetHeight;
        
        // ビジュアライザー初期化
        this.visualizerCanvas = document.getElementById('visualizerCanvas');
        this.visualizerCtx = this.visualizerCanvas.getContext('2d');
        this.visualizerCanvas.width = window.innerWidth;
        this.visualizerCanvas.height = 100;
    }

    gameLoop() {
        if (this.gameState !== 'playing' || this.isPaused) {
            this.animationId = null;
            return;
        }
        
        this.currentTime = Date.now() - this.startTime;
        
        // ノート生成
        this.spawnNotes();
        
        // ノート更新
        this.updateNotes();
        
        // 描画
        this.render();
        
        // UI更新
        this.updateGameUI();
        
        // ビジュアライザー
        if (this.visualEffects) {
            this.renderVisualizer();
        }
        
        // 曲終了チェック
        if (this.currentTime >= this.songDuration && this.activeNotes.length === 0) {
            this.endGame();
            return;
        }
        
        this.animationId = requestAnimationFrame(() => this.gameLoop());
    }

    spawnNotes() {
        while (this.notes.length > 0) {
            const note = this.notes[0];
            const spawnTime = note.time - (JUDGMENT_Y / this.noteSpeed) * 10;
            
            if (this.currentTime >= spawnTime) {
                this.activeNotes.push({
                    ...note,
                    y: 0,
                    hit: false,
                    missed: false
                });
                this.notes.shift();
            } else {
                break;
            }
        }
    }

    updateNotes() {
        const speed = this.noteSpeed;
        
        for (let i = this.activeNotes.length - 1; i >= 0; i--) {
            const note = this.activeNotes[i];
            
            // ノート移動
            const targetTime = note.time;
            const currentOffset = this.currentTime - targetTime;
            note.y = JUDGMENT_Y - (currentOffset * speed / 10);
            
            // ミス判定
            if (!note.hit && !note.missed && note.y > JUDGMENT_Y + GOOD_RANGE) {
                note.missed = true;
                this.judgeNote('miss');
            }
            
            // 画面外のノートを削除
            if (note.y > this.canvas.height + 100) {
                this.activeNotes.splice(i, 1);
            }
        }
    }

    hitNote(lane) {
        // 判定ラインに最も近いノートを探す
        let closestNote = null;
        let closestDistance = Infinity;
        
        for (const note of this.activeNotes) {
            if (note.lane === lane && !note.hit && !note.missed) {
                const distance = Math.abs(note.y - JUDGMENT_Y);
                if (distance < closestDistance) {
                    closestDistance = distance;
                    closestNote = note;
                }
            }
        }
        
        if (closestNote) {
            const distance = Math.abs(closestNote.y - JUDGMENT_Y);
            
            if (distance <= PERFECT_RANGE) {
                this.judgeNote('perfect');
                closestNote.hit = true;
                this.createHitEffect(lane, 'perfect');
            } else if (distance <= GREAT_RANGE) {
                this.judgeNote('great');
                closestNote.hit = true;
                this.createHitEffect(lane, 'great');
            } else if (distance <= GOOD_RANGE) {
                this.judgeNote('good');
                closestNote.hit = true;
                this.createHitEffect(lane, 'good');
            }
        }
    }

    judgeNote(judgment) {
        this.judgments[judgment]++;
        
        // スコア計算
        switch (judgment) {
            case 'perfect':
                this.score += 1000 * (1 + this.combo / 100);
                this.combo++;
                this.life = Math.min(100, this.life + 1);
                break;
            case 'great':
                this.score += 500 * (1 + this.combo / 100);
                this.combo++;
                break;
            case 'good':
                this.score += 100 * (1 + this.combo / 100);
                this.combo++;
                this.life = Math.max(0, this.life - 2);
                break;
            case 'miss':
                this.combo = 0;
                this.life = Math.max(0, this.life - 5);
                break;
        }
        
        this.maxCombo = Math.max(this.maxCombo, this.combo);
        
        // 判定表示
        this.showJudgment(judgment);
        
        // ライフ0でゲームオーバー
        if (this.life <= 0) {
            this.endGame();
        }
    }

    showJudgment(judgment) {
        const display = document.getElementById('judgmentDisplay');
        display.className = `judgment-display judgment-${judgment}`;
        display.textContent = judgment.toUpperCase();
        display.style.display = 'block';
        
        setTimeout(() => {
            display.style.display = 'none';
        }, 500);
    }

    createHitEffect(lane, judgment) {
        if (!this.visualEffects) return;
        
        const effectLayer = document.getElementById('effectLayer');
        const effect = document.createElement('div');
        effect.className = 'hit-effect';
        
        const laneWidth = this.canvas.width / LANES;
        const x = (lane + 0.5) * laneWidth;
        
        effect.style.left = `${x}px`;
        effect.style.top = `${JUDGMENT_Y}px`;
        
        switch (judgment) {
            case 'perfect':
                effect.style.background = 'radial-gradient(circle, rgba(255, 215, 0, 0.8) 0%, transparent 70%)';
                break;
            case 'great':
                effect.style.background = 'radial-gradient(circle, rgba(0, 255, 0, 0.8) 0%, transparent 70%)';
                break;
            case 'good':
                effect.style.background = 'radial-gradient(circle, rgba(0, 153, 255, 0.8) 0%, transparent 70%)';
                break;
        }
        
        effectLayer.appendChild(effect);
        
        setTimeout(() => {
            effect.remove();
        }, 500);
    }

    render() {
        if (!this.ctx) return;
        
        // クリア
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        const laneWidth = this.canvas.width / LANES;
        
        // レーン描画
        for (let i = 0; i <= LANES; i++) {
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            this.ctx.lineWidth = 2;
            this.ctx.beginPath();
            this.ctx.moveTo(i * laneWidth, 0);
            this.ctx.lineTo(i * laneWidth, this.canvas.height);
            this.ctx.stroke();
        }
        
        // 判定ライン
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.5)';
        this.ctx.lineWidth = 3;
        this.ctx.beginPath();
        this.ctx.moveTo(0, JUDGMENT_Y);
        this.ctx.lineTo(this.canvas.width, JUDGMENT_Y);
        this.ctx.stroke();
        
        // ノート描画
        for (const note of this.activeNotes) {
            if (note.hit || note.missed) continue;
            
            const x = note.lane * laneWidth;
            const gradient = this.ctx.createLinearGradient(x, note.y, x + laneWidth, note.y + 40);
            
            if (note.type === 'long') {
                gradient.addColorStop(0, 'rgba(255, 255, 0, 0.8)');
                gradient.addColorStop(1, 'rgba(255, 165, 0, 0.8)');
            } else {
                gradient.addColorStop(0, 'rgba(255, 0, 255, 0.8)');
                gradient.addColorStop(1, 'rgba(0, 255, 255, 0.8)');
            }
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x + 10, note.y, laneWidth - 20, 40);
            
            // ノートの縁
            this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
            this.ctx.lineWidth = 2;
            this.ctx.strokeRect(x + 10, note.y, laneWidth - 20, 40);
        }
    }

    renderVisualizer() {
        if (!this.visualizerCtx) return;
        
        const ctx = this.visualizerCtx;
        const width = this.visualizerCanvas.width;
        const height = this.visualizerCanvas.height;
        
        // ビジュアライザーエフェクト（簡易版）
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.fillRect(0, 0, width, height);
        
        const barCount = 32;
        const barWidth = width / barCount;
        
        for (let i = 0; i < barCount; i++) {
            const barHeight = Math.random() * height * 0.8;
            const hue = (this.currentTime / 20 + i * 10) % 360;
            
            ctx.fillStyle = `hsl(${hue}, 100%, 50%)`;
            ctx.fillRect(i * barWidth, height - barHeight, barWidth - 2, barHeight);
        }
    }

    updateGameUI() {
        // スコア
        document.getElementById('currentScore').textContent = Math.floor(this.score);
        
        // コンボ
        document.getElementById('comboCount').textContent = this.combo;
        
        // ライフ
        document.getElementById('lifeFill').style.width = `${this.life}%`;
        
        // プログレス
        const progress = (this.currentTime / this.songDuration) * 100;
        document.getElementById('progressFill').style.width = `${progress}%`;
        
        // 時間
        const currentSeconds = Math.floor(this.currentTime / 1000);
        const totalSeconds = Math.floor(this.songDuration / 1000);
        document.getElementById('currentTime').textContent = this.formatTime(currentSeconds);
        document.getElementById('totalTime').textContent = this.formatTime(totalSeconds);
    }

    formatTime(seconds) {
        const min = Math.floor(seconds / 60);
        const sec = seconds % 60;
        return `${min}:${sec.toString().padStart(2, '0')}`;
    }

    pauseGame() {
        if (this.gameState !== 'playing') return;
        
        this.isPaused = true;
        document.getElementById('pauseMenu').style.display = 'flex';
    }

    resumeGame() {
        if (this.gameState !== 'playing') return;
        
        this.isPaused = false;
        document.getElementById('pauseMenu').style.display = 'none';
        
        // 時間調整
        this.startTime = Date.now() - this.currentTime;
        
        // ゲームループ再開
        this.gameLoop();
    }

    retryGame() {
        this.hideAllScreens();
        this.startGame();
    }

    quitGame() {
        this.gameState = 'menu';
        this.hideAllScreens();
        
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        this.showSongSelect();
    }

    endGame() {
        this.gameState = 'result';
        
        // アニメーション停止
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
            this.animationId = null;
        }
        
        // 精度計算
        const totalNotes = this.judgments.perfect + this.judgments.great + 
                          this.judgments.good + this.judgments.miss;
        const accuracy = totalNotes > 0 ? 
            ((this.judgments.perfect * 100 + this.judgments.great * 50 + this.judgments.good * 25) / 
            (totalNotes * 100)) * 100 : 0;
        
        // ランク判定
        let rank = 'D';
        if (accuracy >= 98) rank = 'S';
        else if (accuracy >= 95) rank = 'A';
        else if (accuracy >= 90) rank = 'B';
        else if (accuracy >= 80) rank = 'C';
        
        // ハイスコア更新
        const isNewRecord = this.updateHighScore(this.selectedSong, this.selectedDifficulty, this.score);
        
        // 統計更新
        this.updateStats();
        
        // リザルト表示
        this.showResult(rank, accuracy, isNewRecord);
    }

    showResult(rank, accuracy, isNewRecord) {
        document.getElementById('resultScreen').style.display = 'flex';
        
        // ランク表示
        document.querySelector('.rank-letter').textContent = rank;
        
        // スコア表示
        document.getElementById('finalScore').textContent = Math.floor(this.score);
        document.getElementById('accuracyValue').textContent = `${accuracy.toFixed(2)}%`;
        document.getElementById('maxCombo').textContent = this.maxCombo;
        
        // 判定内訳
        document.getElementById('perfectCount').textContent = this.judgments.perfect;
        document.getElementById('greatCount').textContent = this.judgments.great;
        document.getElementById('goodCount').textContent = this.judgments.good;
        document.getElementById('missCount').textContent = this.judgments.miss;
        
        // 新記録表示
        document.getElementById('newRecord').style.display = isNewRecord ? 'block' : 'none';
    }

    updateSpeed(value) {
        this.noteSpeed = parseInt(value);
        document.getElementById('speedValue').textContent = value;
    }

    updateVolume(value) {
        this.soundVolume = parseInt(value);
        document.getElementById('volumeValue').textContent = `${value}%`;
    }

    updateSEVolume(value) {
        this.seVolume = parseInt(value);
        document.getElementById('seValue').textContent = `${value}%`;
    }

    updateTiming(value) {
        this.timingOffset = parseInt(value);
        document.getElementById('timingValue').textContent = `${value}ms`;
    }

    toggleEffects(enabled) {
        this.visualEffects = enabled;
    }

    resetOptions() {
        document.getElementById('speedSlider').value = 5;
        document.getElementById('volumeSlider').value = 70;
        document.getElementById('seSlider').value = 80;
        document.getElementById('timingSlider').value = 0;
        document.getElementById('effectsToggle').checked = true;
        
        this.updateSpeed(5);
        this.updateVolume(70);
        this.updateSEVolume(80);
        this.updateTiming(0);
        this.toggleEffects(true);
    }

    showCalibration() {
        document.getElementById('calibrationScreen').style.display = 'flex';
        // キャリブレーション機能（簡易版）
    }

    closeCalibration() {
        document.getElementById('calibrationScreen').style.display = 'none';
    }

    switchRecordTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`.tab-btn[data-tab="${tab}"]`).classList.add('active');
        
        this.displayRecords(tab);
    }

    displayRecords(tab) {
        const recordsList = document.getElementById('recordsList');
        recordsList.innerHTML = '';
        
        let records = [];
        
        if (tab === 'all') {
            // 全曲のハイスコア
            for (const songId in this.highScores) {
                for (const diff in this.highScores[songId]) {
                    records.push({
                        song: SONGS[songId].title,
                        difficulty: diff,
                        score: this.highScores[songId][diff]
                    });
                }
            }
        } else {
            // 特定曲のハイスコア
            const songId = tab.replace('song', '');
            if (this.highScores[songId]) {
                for (const diff in this.highScores[songId]) {
                    records.push({
                        song: SONGS[songId].title,
                        difficulty: diff,
                        score: this.highScores[songId][diff]
                    });
                }
            }
        }
        
        // ソート
        records.sort((a, b) => b.score - a.score);
        
        // 表示
        records.slice(0, 10).forEach((record, index) => {
            const entry = document.createElement('div');
            entry.className = 'record-entry';
            entry.innerHTML = `
                <div class="record-rank">#${index + 1}</div>
                <div class="record-info">
                    <div class="record-song">${record.song} [${record.difficulty.toUpperCase()}]</div>
                    <div class="record-score">${record.score}</div>
                </div>
            `;
            recordsList.appendChild(entry);
        });
    }

    updateHighScores() {
        for (const songId in SONGS) {
            const scoreElement = document.getElementById(`score${songId}`);
            if (scoreElement) {
                const highScore = this.getHighScore(songId, this.selectedDifficulty);
                scoreElement.textContent = highScore;
            }
        }
    }

    getHighScore(songId, difficulty) {
        if (this.highScores[songId] && this.highScores[songId][difficulty]) {
            return this.highScores[songId][difficulty];
        }
        return 0;
    }

    updateHighScore(songId, difficulty, score) {
        if (!this.highScores[songId]) {
            this.highScores[songId] = {};
        }
        
        const currentHigh = this.highScores[songId][difficulty] || 0;
        if (score > currentHigh) {
            this.highScores[songId][difficulty] = score;
            this.saveHighScores();
            return true;
        }
        return false;
    }

    updateStats() {
        this.stats.totalPlays++;
        this.stats.totalScore += this.score;
        this.stats.totalPerfect += this.judgments.perfect;
        this.stats.totalNotes += this.judgments.perfect + this.judgments.great + 
                                 this.judgments.good + this.judgments.miss;
        
        this.saveStats();
        
        // 表示更新
        document.getElementById('totalPlays').textContent = this.stats.totalPlays;
        const perfectRate = this.stats.totalNotes > 0 ? 
            (this.stats.totalPerfect / this.stats.totalNotes * 100).toFixed(1) : 0;
        document.getElementById('perfectRate').textContent = `${perfectRate}%`;
        const avgScore = this.stats.totalPlays > 0 ? 
            Math.floor(this.stats.totalScore / this.stats.totalPlays) : 0;
        document.getElementById('avgScore').textContent = avgScore;
    }

    loadHighScores() {
        const saved = localStorage.getItem('rhythmHighScores');
        return saved ? JSON.parse(saved) : {};
    }

    saveHighScores() {
        localStorage.setItem('rhythmHighScores', JSON.stringify(this.highScores));
    }

    loadStats() {
        const saved = localStorage.getItem('rhythmStats');
        return saved ? JSON.parse(saved) : {
            totalPlays: 0,
            totalScore: 0,
            totalPerfect: 0,
            totalNotes: 0
        };
    }

    saveStats() {
        localStorage.setItem('rhythmStats', JSON.stringify(this.stats));
    }

    hideAllScreens() {
        const screens = [
            'titleScreen', 'songSelectScreen', 'gameScreen', 'pauseMenu',
            'resultScreen', 'optionsScreen', 'recordsScreen', 'calibrationScreen'
        ];
        screens.forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
    }
}

// ゲーム開始
window.addEventListener('DOMContentLoaded', () => {
    const game = new RhythmGame();
});