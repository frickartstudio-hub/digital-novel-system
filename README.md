# デジタルノベルシステム

Webブラウザで動作する、画像・動画・音声・字幕で進行するデジタルノベルシステムの技術仕様書とサンプル実装です。

## 概要

本プロジェクトは、アドベンチャーゲームではなく、画像や動画を背景として表示しながら、音声とそれに同期した字幕を組み合わせて物語を進行させるWebアプリケーションの仕様を定義しています。

### 主な特徴

- 📱 **レスポンシブデザイン**: PC、タブレット、スマートフォンに対応
- 🎬 **マルチメディア対応**: 画像、動画、音声、字幕を統合管理
- ⚙️ **モード切替**: 自動再生/手動進行のモードを自由に切り替え可能
- 💾 **セーブ/ロード**: 進行状況の保存と読み込み
- 🎨 **カスタマイズ可能**: モジュール化された設計で拡張が容易

## ドキュメント

### 📋 技術仕様書

詳細な技術仕様は以下のドキュメントをご覧ください:

- **[デジタルノベルシステム技術仕様書](docs/デジタルノベルシステム技術仕様書.md)** - システム全体の詳細な仕様
- **[実装例](docs/implementation_example.md)** - TypeScriptによるコードサンプル

### 📊 システム構成図

システムのアーキテクチャを視覚的に理解するための図:

- **[システム構成図](diagrams/system_architecture.png)** - アーキテクチャの全体像
- **[シーケンス図](diagrams/sequence_diagram.png)** - 処理フローの詳細
- **[クラス図](diagrams/class_diagram.png)** - データ構造とクラスの関係

### 📝 サンプルデータ

- **[シナリオサンプル](data/scenario_sample.json)** - JSONフォーマットのシナリオデータ例

## システム要件

### 対応ブラウザ

- Google Chrome (最新版)
- Mozilla Firefox (最新版)
- Apple Safari (最新版)
- Microsoft Edge (最新版)

### 推奨環境

- インターネット接続速度: 5Mbps以上
- 画面解像度: 1280×720以上 (PC)、375×667以上 (スマートフォン)

## 技術スタック

### フロントエンド

- **言語**: TypeScript
- **フレームワーク**: React / Vue.js / Vanilla JS
- **音声管理**: Howler.js
- **アニメーション**: GSAP / CSS Animations

### ビルドツール

- Vite / Webpack
- ESLint
- Prettier

## ディレクトリ構成

```
digital-novel-system/
├── docs/                           # ドキュメント
│   ├── デジタルノベルシステム技術仕様書.md
│   └── implementation_example.md
├── diagrams/                       # システム構成図
│   ├── system_architecture.png
│   ├── sequence_diagram.png
│   ├── class_diagram.png
│   └── *.mmd                      # Mermaid形式の図
├── data/                          # サンプルデータ
│   └── scenario_sample.json
├── examples/                      # 実装例（今後追加予定）
├── LICENSE
└── README.md
```

## 主な機能

### 1. メディア表示機能

- 画像表示（背景、キャラクター立ち絵など）
- 動画再生（フルスクリーン、ウィンドウ内）

### 2. 音声再生機能

- BGM（背景音楽）のループ再生
- ボイス（キャラクターのセリフ）の再生
- 効果音（SE）の再生
- 各音声の個別音量調整

### 3. 字幕表示機能

- 音声に同期した字幕表示
- 話者名の表示
- 字幕の表示/非表示切り替え

### 4. 再生制御機能

- **自動再生モード**: 音声の長さに合わせて自動進行
- **手動進行モード**: クリック/タップで次のシーンへ
- モード切替ボタン
- 一時停止/再開
- シーンスキップ
- バックログ（既読シーンの閲覧）

### 5. セーブ/ロード機能

- 複数スロットへの進行状況保存
- セーブデータからの再開
- LocalStorage/IndexedDBを使用

## データ構造

シナリオはJSON形式で定義します。詳細は[シナリオサンプル](data/scenario_sample.json)をご覧ください。

```json
{
  "title": "作品タイトル",
  "scenes": [
    {
      "id": 1,
      "type": "image",
      "source": "/media/images/scene1_bg.jpg",
      "duration": 5000,
      "audio": {
        "voice": "/media/audio/voice/scene1_voice.mp3",
        "bgm": "/media/audio/bgm/theme1.mp3",
        "se": "/media/audio/se/door_open.mp3"
      },
      "subtitles": [
        {
          "speaker": "キャラクターA",
          "text": "こんにちは。",
          "start": 0,
          "end": 3000
        }
      ],
      "transitions": {
        "nextSceneId": 2,
        "effect": "fade"
      }
    }
  ]
}
```

## 今後の拡張案

- 多言語対応（字幕とUIの多言語化）
- 選択肢分岐システム
- 実績システム
- ギャラリーモード
- 音声認識による操作
- VR対応

## ライセンス

MIT License - 詳細は[LICENSE](LICENSE)ファイルをご覧ください。

## 作成者

**Manus AI**

---

本仕様書は、デジタルノベルシステムの開発に携わるエンジニア、デザイナー、およびプロジェクトマネージャーを対象としています。
