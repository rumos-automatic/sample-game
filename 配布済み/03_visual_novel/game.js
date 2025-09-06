class VisualNovel {
    constructor() {
        this.currentScenario = 'start';
        this.currentIndex = 0;
        this.textSpeed = 50;
        this.autoSpeed = 3000;
        this.isAuto = false;
        this.isSkipping = false;
        this.isTextAnimating = false;
        this.messageLog = [];
        this.saveSlots = Array(10).fill(null);
        this.currentText = '';
        this.currentSpeaker = '';
        this.gameStarted = false;
        
        this.backgrounds = {
            school_gate: 'linear-gradient(135deg, #87CEEB 0%, #98FB98 100%)',
            classroom: 'linear-gradient(135deg, #FFE4B5 0%, #FFDEAD 100%)',
            hallway: 'linear-gradient(135deg, #D3D3D3 0%, #A9A9A9 100%)',
            rooftop: 'linear-gradient(135deg, #87CEEB 0%, #4169E1 100%)'
        };
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.loadSettings();
        this.loadSaveData();
    }
    
    setupEventListeners() {
        // タイトル画面のボタン
        document.getElementById('start-btn').addEventListener('click', () => this.startNewGame());
        document.getElementById('continue-btn').addEventListener('click', () => this.showSaveLoadScreen('load'));
        document.getElementById('gallery-btn').addEventListener('click', () => this.showGallery());
        document.getElementById('credits-btn').addEventListener('click', () => this.showCredits());
        
        // UIボタン
        document.getElementById('btn-auto').addEventListener('click', () => this.toggleAuto());
        document.getElementById('btn-skip').addEventListener('click', () => this.toggleSkip());
        document.getElementById('btn-log').addEventListener('click', () => this.showLog());
        document.getElementById('btn-save').addEventListener('click', () => this.showSaveLoadScreen('save'));
        document.getElementById('btn-load').addEventListener('click', () => this.showSaveLoadScreen('load'));
        document.getElementById('btn-config').addEventListener('click', () => this.showConfig());
        
        // テキストボックスクリック
        document.getElementById('text-box').addEventListener('click', () => this.handleTextBoxClick());
        
        // 閉じるボタン
        document.getElementById('close-log').addEventListener('click', () => this.hideLog());
        document.getElementById('close-save-load').addEventListener('click', () => this.hideSaveLoadScreen());
        document.getElementById('close-config').addEventListener('click', () => this.hideConfig());
        
        // 設定画面
        document.getElementById('text-speed').addEventListener('input', (e) => {
            this.textSpeed = 101 - parseInt(e.target.value);
            document.getElementById('text-speed-value').textContent = e.target.value;
            this.saveSettings();
        });
        
        document.getElementById('auto-speed').addEventListener('input', (e) => {
            this.autoSpeed = parseInt(e.target.value) * 1000;
            document.getElementById('auto-speed-value').textContent = e.target.value;
            this.saveSettings();
        });
        
        document.getElementById('master-volume').addEventListener('input', (e) => {
            document.getElementById('volume-value').textContent = e.target.value;
            this.saveSettings();
        });
        
        document.getElementById('fullscreen-btn').addEventListener('click', () => this.toggleFullscreen());
        
        // キーボードショートカット
        document.addEventListener('keydown', (e) => {
            if (!this.gameStarted) return;
            
            switch(e.key) {
                case ' ':
                case 'Enter':
                    e.preventDefault();
                    this.handleTextBoxClick();
                    break;
                case 'a':
                case 'A':
                    this.toggleAuto();
                    break;
                case 's':
                case 'S':
                    this.toggleSkip();
                    break;
                case 'l':
                case 'L':
                    this.showLog();
                    break;
                case 'Escape':
                    this.hideAllWindows();
                    break;
            }
        });
    }
    
    startNewGame() {
        this.gameStarted = true;
        this.currentScenario = 'start';
        this.currentIndex = 0;
        this.messageLog = [];
        
        document.getElementById('title-screen').style.display = 'none';
        this.processScenario();
    }
    
    processScenario() {
        if (!scenarios[this.currentScenario]) {
            console.error('シナリオが見つかりません:', this.currentScenario);
            return;
        }
        
        const currentScene = scenarios[this.currentScenario][this.currentIndex];
        
        if (!currentScene) {
            console.log('シナリオ終了');
            return;
        }
        
        switch (currentScene.type) {
            case 'bg':
                this.changeBackground(currentScene);
                this.currentIndex++;
                this.processScenario();
                break;
            
            case 'char':
                this.showCharacter(currentScene);
                this.currentIndex++;
                this.processScenario();
                break;
            
            case 'text':
                this.showText(currentScene);
                break;
            
            case 'choice':
                this.showChoices(currentScene);
                break;
            
            case 'effect':
                this.showEffect(currentScene);
                this.currentIndex++;
                this.processScenario();
                break;
            
            case 'end':
                this.showEnding(currentScene);
                break;
        }
    }
    
    changeBackground(scene) {
        const bgElement = document.querySelector('.background-image');
        const bgStyle = this.backgrounds[scene.image] || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
        
        if (scene.effect === 'fade') {
            bgElement.style.opacity = '0';
            setTimeout(() => {
                bgElement.style.background = bgStyle;
                bgElement.style.opacity = '1';
            }, 500);
        } else {
            bgElement.style.background = bgStyle;
        }
    }
    
    showCharacter(scene) {
        const slot = document.getElementById(`char-${scene.position}`);
        
        if (scene.effect === 'fadeIn') {
            const charEl = document.createElement('div');
            charEl.className = 'character-sprite character-enter';
            charEl.textContent = scene.character;
            charEl.dataset.name = scene.name;
            
            slot.innerHTML = '';
            slot.appendChild(charEl);
        } else if (scene.effect === 'fadeOut') {
            const charEl = slot.querySelector('.character-sprite');
            if (charEl) {
                charEl.classList.add('character-exit');
                setTimeout(() => {
                    slot.innerHTML = '';
                }, 500);
            }
        } else {
            slot.innerHTML = `<div class="character-sprite" data-name="${scene.name}">${scene.character}</div>`;
        }
    }
    
    showText(scene) {
        this.currentSpeaker = scene.speaker;
        this.currentText = scene.text;
        
        document.getElementById('speaker').textContent = scene.speaker;
        document.getElementById('text-content').textContent = '';
        document.getElementById('next-indicator').style.display = 'none';
        document.getElementById('choices').style.display = 'none';
        
        this.isTextAnimating = true;
        this.animateText(scene.text);
        
        // ログに追加
        this.messageLog.push({
            speaker: scene.speaker,
            text: scene.text
        });
    }
    
    animateText(text) {
        const textElement = document.getElementById('text-content');
        let charIndex = 0;
        
        const typeWriter = () => {
            if (!this.isTextAnimating) {
                textElement.textContent = text;
                this.onTextComplete();
                return;
            }
            
            if (charIndex < text.length) {
                if (text[charIndex] === '\n') {
                    textElement.innerHTML += '<br>';
                } else {
                    textElement.textContent += text[charIndex];
                }
                charIndex++;
                
                if (this.isSkipping) {
                    setTimeout(typeWriter, 1);
                } else {
                    setTimeout(typeWriter, this.textSpeed);
                }
            } else {
                this.onTextComplete();
            }
        };
        
        typeWriter();
    }
    
    onTextComplete() {
        this.isTextAnimating = false;
        document.getElementById('next-indicator').style.display = 'block';
        
        if (this.isAuto) {
            setTimeout(() => {
                if (this.isAuto && !this.isTextAnimating) {
                    this.nextScene();
                }
            }, this.autoSpeed);
        }
    }
    
    showChoices(scene) {
        const choicesContainer = document.getElementById('choices');
        choicesContainer.innerHTML = '';
        choicesContainer.style.display = 'flex';
        
        scene.choices.forEach(choice => {
            const button = document.createElement('button');
            button.className = 'choice-btn';
            button.textContent = choice.text;
            button.addEventListener('click', () => {
                this.selectChoice(choice.next);
            });
            choicesContainer.appendChild(button);
        });
    }
    
    selectChoice(nextScenario) {
        document.getElementById('choices').style.display = 'none';
        this.currentScenario = nextScenario;
        this.currentIndex = 0;
        this.processScenario();
    }
    
    showEffect(scene) {
        const effectLayer = document.getElementById('effects');
        
        if (scene.name === 'blush') {
            effectLayer.style.background = 'radial-gradient(circle, rgba(255,192,203,0.3) 0%, transparent 70%)';
            setTimeout(() => {
                effectLayer.style.background = 'none';
            }, 1000);
        }
    }
    
    showEnding(scene) {
        const textBox = document.getElementById('text-box');
        textBox.innerHTML = `
            <div style="text-align: center; padding: 40px;">
                <h2 style="color: #ffd700; font-size: 30px; margin-bottom: 20px;">${scene.text}</h2>
                <button class="choice-btn" onclick="location.reload()">タイトルに戻る</button>
            </div>
        `;
    }
    
    handleTextBoxClick() {
        if (this.isTextAnimating) {
            // テキストアニメーションをスキップ
            this.isTextAnimating = false;
        } else {
            // 次のシーンへ
            this.nextScene();
        }
    }
    
    nextScene() {
        const choicesVisible = document.getElementById('choices').style.display !== 'none';
        if (!choicesVisible) {
            this.currentIndex++;
            this.processScenario();
        }
    }
    
    toggleAuto() {
        this.isAuto = !this.isAuto;
        const btn = document.getElementById('btn-auto');
        if (this.isAuto) {
            btn.classList.add('active');
            if (!this.isTextAnimating) {
                this.nextScene();
            }
        } else {
            btn.classList.remove('active');
        }
    }
    
    toggleSkip() {
        this.isSkipping = !this.isSkipping;
        const btn = document.getElementById('btn-skip');
        if (this.isSkipping) {
            btn.classList.add('active');
        } else {
            btn.classList.remove('active');
        }
    }
    
    showLog() {
        const logWindow = document.getElementById('log-window');
        const logContent = document.getElementById('log-content');
        
        logContent.innerHTML = '';
        this.messageLog.forEach(entry => {
            const logEntry = document.createElement('div');
            logEntry.className = 'log-entry';
            logEntry.innerHTML = `
                <div class="log-speaker">${entry.speaker}</div>
                <div class="log-text">${entry.text.replace(/\n/g, '<br>')}</div>
            `;
            logContent.appendChild(logEntry);
        });
        
        logWindow.style.display = 'block';
        logContent.scrollTop = logContent.scrollHeight;
    }
    
    hideLog() {
        document.getElementById('log-window').style.display = 'none';
    }
    
    showSaveLoadScreen(mode) {
        const screen = document.getElementById('save-load-screen');
        const title = document.getElementById('save-load-title');
        const slotsContainer = document.getElementById('save-slots');
        
        title.textContent = mode === 'save' ? 'セーブ' : 'ロード';
        slotsContainer.innerHTML = '';
        
        for (let i = 0; i < 10; i++) {
            const slot = document.createElement('div');
            slot.className = 'save-slot';
            
            if (this.saveSlots[i]) {
                const date = new Date(this.saveSlots[i].timestamp);
                slot.innerHTML = `
                    <div class="slot-number">スロット ${i + 1}</div>
                    <div class="slot-date">${date.toLocaleString()}</div>
                    <div class="slot-preview">${this.saveSlots[i].speaker}: ${this.saveSlots[i].text}</div>
                `;
            } else {
                slot.className += ' empty';
                slot.innerHTML = `
                    <div class="slot-number">スロット ${i + 1}</div>
                    <div class="slot-preview">空きスロット</div>
                `;
            }
            
            slot.addEventListener('click', () => {
                if (mode === 'save') {
                    this.saveGame(i);
                } else {
                    this.loadGame(i);
                }
            });
            
            slotsContainer.appendChild(slot);
        }
        
        screen.style.display = 'block';
    }
    
    hideSaveLoadScreen() {
        document.getElementById('save-load-screen').style.display = 'none';
    }
    
    saveGame(slotIndex) {
        const saveData = {
            currentScenario: this.currentScenario,
            currentIndex: this.currentIndex,
            messageLog: this.messageLog,
            speaker: this.currentSpeaker,
            text: this.currentText,
            timestamp: Date.now()
        };
        
        this.saveSlots[slotIndex] = saveData;
        localStorage.setItem('vnSaveSlots', JSON.stringify(this.saveSlots));
        
        alert(`スロット ${slotIndex + 1} にセーブしました`);
        this.hideSaveLoadScreen();
    }
    
    loadGame(slotIndex) {
        const saveData = this.saveSlots[slotIndex];
        if (!saveData) {
            alert('セーブデータがありません');
            return;
        }
        
        this.currentScenario = saveData.currentScenario;
        this.currentIndex = saveData.currentIndex;
        this.messageLog = saveData.messageLog;
        this.gameStarted = true;
        
        document.getElementById('title-screen').style.display = 'none';
        this.hideSaveLoadScreen();
        this.processScenario();
    }
    
    loadSaveData() {
        const savedSlots = localStorage.getItem('vnSaveSlots');
        if (savedSlots) {
            this.saveSlots = JSON.parse(savedSlots);
        }
    }
    
    showConfig() {
        document.getElementById('config-screen').style.display = 'block';
    }
    
    hideConfig() {
        document.getElementById('config-screen').style.display = 'none';
    }
    
    saveSettings() {
        const settings = {
            textSpeed: this.textSpeed,
            autoSpeed: this.autoSpeed,
            volume: document.getElementById('master-volume').value
        };
        localStorage.setItem('vnSettings', JSON.stringify(settings));
    }
    
    loadSettings() {
        const settings = localStorage.getItem('vnSettings');
        if (settings) {
            const parsed = JSON.parse(settings);
            this.textSpeed = parsed.textSpeed;
            this.autoSpeed = parsed.autoSpeed;
            
            document.getElementById('text-speed').value = 101 - this.textSpeed;
            document.getElementById('text-speed-value').textContent = 101 - this.textSpeed;
            document.getElementById('auto-speed').value = this.autoSpeed / 1000;
            document.getElementById('auto-speed-value').textContent = this.autoSpeed / 1000;
            document.getElementById('master-volume').value = parsed.volume;
            document.getElementById('volume-value').textContent = parsed.volume;
        }
    }
    
    toggleFullscreen() {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen();
        } else {
            document.exitFullscreen();
        }
    }
    
    hideAllWindows() {
        this.hideLog();
        this.hideSaveLoadScreen();
        this.hideConfig();
    }
    
    showGallery() {
        alert('ギャラリー機能は準備中です');
    }
    
    showCredits() {
        alert('制作: Claude AI\n素材: 絵文字\nBGM: なし\n\nご利用ありがとうございます！');
    }
}

// ゲーム開始
window.addEventListener('DOMContentLoaded', () => {
    new VisualNovel();
});