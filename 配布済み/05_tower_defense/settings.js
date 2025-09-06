// 設定データ（CSVファイルの内容をJavaScriptオブジェクトとして定義）
// CSVファイルを編集する代わりに、このファイルの値を変更してください
const gameSettings = {
    'ゲームタイトル': 'Tower Defense - Fortress Guard',
    'ステージ名': '子宮防衛戦 ～精子侵略を撃退せよ～',
    '初期ゴールド': '50000',
    '初期ライフ': '20',
    'ゲームオーバータイトル': 'GAME OVER',
    'ビクトリータイトル': 'VICTORY!',
    'アローシューター名': 'クリ〇リス・アロー',
    'キャノンタワー名': 'オーガズム・ボム',
    'マジックタワー名': '媚薬マジック',
    'フリーズタワー名': 'フリーズローション',
    'レーザータワー名': '電撃バイブ・ショック',
    'ポイズンタワー名': 'ドクドクコンドーム'
};

// CSV読み込み関数（互換性のため残す）
async function loadSettings() {
    // 設定を適用
    if (gameSettings['ゲームタイトル']) {
        document.title = gameSettings['ゲームタイトル'];
    }
    if (gameSettings['ステージ名']) {
        const stageNameElement = document.getElementById('stageName');
        if (stageNameElement) {
            stageNameElement.textContent = gameSettings['ステージ名'];
        }
    }
    if (gameSettings['ゲームオーバータイトル']) {
        const gameOverTitleElement = document.getElementById('gameOverTitle');
        if (gameOverTitleElement) {
            gameOverTitleElement.textContent = gameSettings['ゲームオーバータイトル'];
        }
    }
    if (gameSettings['ビクトリータイトル']) {
        const victoryTitle = document.querySelector('.victory-content h2');
        if (victoryTitle && gameSettings['ビクトリータイトル']) {
            victoryTitle.textContent = `🎉 ${gameSettings['ビクトリータイトル']} 🎉`;
        }
    }
    
    return gameSettings;
}