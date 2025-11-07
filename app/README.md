# デジタルノベルシステム

画像・動画・音声・字幕で進行するWebベースのデジタルノベルシステムです。

## 概要

本プロジェクトは、アドベンチャーゲームではなく、画像や動画を背景として表示しながら、音声とそれに同期した字幕を組み合わせて物語を進行させるWebアプリケーションです。

## 主な機能

### コア機能
- **シーンマネージャー**: シーンの進行状態を管理
- **メディアプレイヤー**: 画像・動画・音声の統合再生
- **字幕エンジン**: 音声に同期した字幕表示
- **再生制御**: 自動再生/手動進行モードの切り替え
- **セーブ/ロード**: 進行状況の保存と読み込み

### エディター機能
- シナリオメタデータ編集
- シーン管理（追加、削除、編集）
- 字幕編集
- メディアファイル設定
- JSONインポート/エクスポート
- プレビュー機能

### ファイルアップロード機能
- 画像・動画・音声ファイルのアップロード
- ファイルプレビュー
- localStorageによる管理

### AI生成機能（OpenRouter連携）
- **シナリオ自動生成**: Claude、GPT-4、Geminiを使用
- **背景画像生成**: Flux、DALL-E、Stable Diffusionを使用
- **音声生成（TTS）**: Gemini 2.5 Pro Preview TTSを使用
- APIキー管理システム

### UI/UX
- レスポンシブデザイン（PC/タブレット/スマートフォン対応）
- ダークテーマ
- スムーズなアニメーション効果
- 直感的なコントロールパネル

## 技術スタック

- **フレームワーク**: React 19
- **言語**: TypeScript
- **スタイリング**: Tailwind CSS 4
- **UIコンポーネント**: shadcn/ui
- **ルーティング**: Wouter
- **ビルドツール**: Vite

## プロジェクト構造

```
digital-novel-app/
├── client/
│   ├── public/
│   │   ├── images/          # シーン画像
│   │   ├── audio/           # 音声ファイル
│   │   └── scenario.json    # シナリオデータ
│   └── src/
│       ├── components/      # UIコンポーネント
│       │   ├── MediaPlayer.tsx
│       │   ├── SubtitleDisplay.tsx
│       │   ├── ControlPanel.tsx
│       │   └── ProgressBar.tsx
│       ├── lib/            # コアシステム
│       │   ├── SceneManager.ts
│       │   └── SaveManager.ts
│       ├── types/          # TypeScript型定義
│       │   └── novel.ts
│       └── pages/          # ページコンポーネント
│           └── NovelPlayer.tsx
└── README.md
```

## セットアップ

### 必要な環境
- Node.js 22.x
- pnpm

### インストール

```bash
# 依存関係のインストール
pnpm install

# 開発サーバーの起動
pnpm dev
```

開発サーバーが起動したら、ブラウザで `http://localhost:3000` にアクセスしてください。

## シナリオデータの形式

シナリオは `client/public/scenario.json` に JSON 形式で定義します。

```json
{
  "title": "作品タイトル",
  "scenes": [
    {
      "id": 1,
      "type": "image",
      "source": "/images/scene1.jpg",
      "duration": 5000,
      "audio": {
        "voice": "/audio/voice/scene1.mp3",
        "bgm": "/audio/bgm/theme.mp3"
      },
      "subtitles": [
        {
          "speaker": "キャラクター名",
          "text": "セリフのテキスト",
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

## 操作方法

### コントロール
- **一時停止/再生**: 画面下部のコントロールパネルから操作
- **次のシーンへ**: 
  - 手動モード: 画面をクリック/タップ
  - 自動モード: 音声終了後に自動で進行
- **モード切り替え**: コントロールパネルの「自動/手動」ボタン

## AI生成機能の使用方法

### API設定
1. エディターの「API設定」ボタンをクリック
2. OpenRouter APIキーを入力（[https://openrouter.ai/keys](https://openrouter.ai/keys)から取得）
3. 保存

### シナリオ生成
1. エディターの「AI生成」ボタンをクリック
2. テーマ、ジャンル、シーン数を入力
3. 「シナリオを生成」ボタンをクリック

### 画像生成
1. シーン編集フォームのメディアファイル欄で「AI生成」ボタンをクリック
2. プロンプトを入力（英語推奨）
3. 「生成」ボタンをクリック
4. 生成された画像を確認して「この画像を使用」をクリック

### 音声生成
1. シーン編集フォームの音声欄で「AI生成」ボタンをクリック
2. テキストを入力
3. 「生成」ボタンをクリック
4. 再生して確認後、「この音声を使用」をクリック

## 今後の拡張予定

- 設定画面（音量調整、字幕サイズ変更など）
- バックログ機能
- 選択肢分岐システム
- 多言語対応
- 実績システム
- BGM・SEのAI生成（外部サービス連携）

## ライセンス

MIT License

## 関連リポジトリ

技術仕様書とドキュメント: [digital-novel-system](https://github.com/frickartstudio-hub/digital-novel-system)
