# デジタルノベルシステム 技術仕様（フロント／バックエンド分離版）

## 1. 目的とスコープ
- 画像・動画・音声・字幕で構成されるデジタルノベル体験を Web 上で提供する。
- 既存のフロント単体実装を見直し、**フロントエンド（React/Vite）** と **バックエンド（Node.js + Express + PostgreSQL）** を明確に分離する。
- 生成・アップロードされたすべてのアセットとシナリオデータを PostgreSQL へ永続化する。
- 既存機能（プレイヤー、シナリオエディタ、AI 連携、セーブ／ロード、API キー管理）を維持したまま、ストレージ基盤のみを DB 化する。

## 2. 利用者像
- **シナリオライター／コンテンツ制作者**: エディタからシナリオ・メディア・AI 生成を実行する。
- **視聴ユーザー**: プレイヤー UI を通じて作品を鑑賞し、進行モードや字幕を切り替える。
- **システム管理者**: API キー、アクセス制御、作品管理、データバックアップを担う。

## 3. 全体アーキテクチャ
```
┌────────────────────────────┐
│            Frontend (Vite + React)          │
│ - Player UI / Scenario Editor / AI dialogs  │
│ - Auth + API Key UI                          │
│ - Fetches data via REST/GraphQL (HTTPS)      │
└───────────────▲────────────────────────────┘
                │JSON/Multipart
┌───────────────┴────────────────────────────┐
│             Backend (Express)               │
│ - API Gateway / Auth / Validation           │
│ - Media ingestion (Base64 or streaming)     │
│ - AI proxy (optional)                       │
│ - Orchestrates DB transactions              │
└───────────────▲────────────────────────────┘
                │SQL
┌───────────────┴────────────────────────────┐
│               PostgreSQL                   │
│ - Users / Sessions                         │
│ - Scenarios / Scenes / Subtitles           │
│ - Media Assets (metadata + blob pointer)   │
│ - Save Slots / Progress                    │
│ - API Keys (encrypted at rest)             │
└────────────────────────────────────────────┘
```

### 3.1 技術選定
- **Frontend**: React 18+, Vite, TypeScript, Tailwind, shadcn/ui, Wouter。
- **Backend**: Node.js 22+, Express 4+, `multer`（ファイルアップロード）、`pg`（PostgreSQL ドライバ）、`zod`（バリデーション）。
- **Database**: PostgreSQL 15+（JSONB, BYTEA 利用）。
- **ストレージ戦略**: 3 つの選択肢から要件に応じて選択。
  1. PostgreSQL の `BYTEA` カラムへ直接バイナリ保存（少数作品向け）。
  2. DB にはメタデータのみ、実体はオブジェクトストレージ（S3 等）に委譲。
  3. PG Large Object + CDN 連携。
- **AI 連携**: OpenRouter（シナリオ/画像）、Gemini 2.5 Pro Preview TTS（音声）。

## 4. フロントエンド要件
### 4.1 プレイヤー
- `/` : NovelPlayer。`GET /api/scenarios/:slug` で作品全体を取得。
- 進行モード（自動・手動）、一時停止、シーンスキップ、字幕表示切替。
- メディアのロード先は `mediaUrl`（サーバー提供 URL）を直接参照。`FileLoader` は localStorage ではなく、事前取得した URL を返すだけの軽量化を行う。
- セーブ機能: `POST /api/users/:userId/saves` でスロット保存、`GET` で一覧取得。

### 4.2 シナリオエディタ
- `/editor`: 作品メタ、シーン追加、字幕編集、AI 生成、ファイルアップロード。
- JSON のインポート／エクスポートは維持。ただし「エクスポート」時はサーバー上の正式 ID を含む。
- メディアアップロード時: `POST /api/media` へ `multipart/form-data` 送信。レスポンスで `mediaId` と `mediaUrl` を受け取り、シーンに紐付け。
- AI 生成結果はクライアント側で JSON を整形し、そのまま `/api/scenarios` へ保存できる。

### 4.3 AI ダイアログ
- **シナリオ生成**: OpenRouter API をフロントから直接呼ばず、バックエンド経由でプロキシしてもよい（APIキー秘匿のため）。暫定は現行通りクライアント保持も可。
- **画像生成**: 同上。
- **音声生成**: Gemini TTS API へアクセスするバックエンドエンドポイントを追加し、フロントは `POST /api/tts` を呼び出す。レスポンスで生成済み `mediaId` を返却すればエディタへの組み込みがスムーズ。

### 4.4 API キー UI
- UI は現行（`ApiSettingsDialog`）のまま。ただしキーを localStorage ではなくバックエンドへ暗号化保存するオプションも検討。
- 最低限、localStorage + HTTPS 通信を継続してもよい。

## 5. バックエンド仕様
### 5.1 認証／認可
- シンプルなセッション Cookie もしくは JWT を採用。
- シナリオ編集系 API は認証必須。閲覧系（プレイヤー）は公開／限定公開の設定を持たせる。

### 5.2 REST API（例）
| Method | Path | 説明 |
|--------|------|------|
| GET | `/api/scenarios` | シナリオ一覧（ページネーション） |
| POST | `/api/scenarios` | シナリオ作成（タイトル・概要等） |
| GET | `/api/scenarios/:id` | 単一シナリオ詳細（全シーン含む or lazy load） |
| PUT | `/api/scenarios/:id` | 更新 |
| POST | `/api/scenarios/:id/scenes` | シーン追加 |
| PUT | `/api/scenes/:sceneId` | シーン更新 |
| DELETE | `/api/scenes/:sceneId` | シーン削除 |
| POST | `/api/media` | メディアアップロード（multipart） |
| GET | `/api/media/:id` | メディアダウンロード（署名付き URL でも可） |
| POST | `/api/tts` | テキストから音声生成（Gemini TTS を呼び出し、生成物を DB/ストレージへ保存） |
| GET/POST | `/api/users/:id/saves` | セーブデータ取得／保存 |
| POST | `/api/auth/login` | 認証（必要に応じ OAuth 連携） |

### 5.3 データベーススキーマ案

```sql
-- シナリオ
CREATE TABLE scenarios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  author TEXT,
  version TEXT DEFAULT '1.0',
  description TEXT,
  metadata JSONB DEFAULT '{}',
  visibility TEXT DEFAULT 'public', -- public / private / unlisted
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- シーン
CREATE TABLE scenes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES scenarios(id) ON DELETE CASCADE,
  order_index INTEGER NOT NULL,
  type TEXT CHECK (type IN ('image','video')),
  duration_ms INTEGER,
  transitions JSONB,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- メディア
CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scenario_id UUID REFERENCES scenarios(id) ON DELETE SET NULL,
  scene_id UUID REFERENCES scenes(id) ON DELETE SET NULL,
  media_type TEXT CHECK (media_type IN ('image','video','audio','subtitle')),
  storage_url TEXT,          -- S3/Signed URL など
  storage_key TEXT,          -- 実体ファイルキー
  mime_type TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 字幕
CREATE TABLE subtitles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scene_id UUID REFERENCES scenes(id) ON DELETE CASCADE,
  speaker TEXT,
  text TEXT NOT NULL,
  start_ms INTEGER NOT NULL,
  end_ms INTEGER NOT NULL,
  order_index INTEGER DEFAULT 0
);

-- セーブデータ
CREATE TABLE player_saves (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  scenario_id UUID REFERENCES scenarios(id),
  slot INTEGER CHECK (slot BETWEEN 1 AND 5),
  scene_id UUID,
  timestamp TIMESTAMPTZ DEFAULT now(),
  settings JSONB,
  UNIQUE (user_id, scenario_id, slot)
);

-- APIキー（任意で管理）
CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID,
  provider TEXT CHECK (provider IN ('openrouter','gemini')),
  encrypted_key BYTEA NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);
```

### 5.4 メディア保存フロー
1. フロントの FileUpload が `multipart/form-data` でファイルを送信。
2. バックエンドは `multer` 等で受理し、`media_assets` にレコードを挿入。
   - `storage_url` には `/media/<uuid>` の内部パス、あるいは S3 の署名付き URL。
   - 実際のバイナリはファイルシステム or S3 に保存する。
3. レスポンスで `mediaId`, `mediaUrl` を返し、フロントはその URL をシーンに設定。
4. Player/Editor は `mediaUrl` をそのまま `<img>` / `<video>` / `<audio>` に割り当てて再生。

### 5.5 TTS API フロー
1. フロントが `/api/tts` に `text`, `voiceName`, `scenarioId`, `sceneId` などを POST。
2. バックエンドが Gemini API を呼び出し、受け取った音声データを保存。
3. `media_assets` に `media_type='audio'` として登録し、生成された `mediaUrl` をレスポンスで返す。
4. エディタはその URL を該当シーンの `scene.audio.voice` にセットし、即プレビュー可能。

### 5.6 バリデーションとエラーハンドリング
- すべての API 入力は `zod` または `class-validator` で検証。
- ファイルサイズ上限、拡張子チェックを実施。
- AI API エラー時は詳細メッセージを保持しつつ、ユーザーには簡潔なメッセージを返す。

## 6. 移行戦略
1. **ステージング環境**で PostgreSQL + 新 API を構築。
2. 既存 localStorage データを移行したい場合は、エディタから `scenario.json` をエクスポート → 新 API へインポートする機能を提供。
3. メディアは 2 パターン：
   - 生成直後にリマイグレーションできないため、必要に応じて旧 UI でダウンロードし、新 API へ再アップロード。
   - もしくは localStorage にある `file_/...` Data URL を自動でサーバーへ送る移行ツールを作成。
4. 本番移行後は localStorage 保存を廃止し、バックエンド経由のみをサポート。

## 7. セキュリティ・運用
- **TLS**: すべての API は HTTPS 経由。
- **認証**: シナリオ編集系 API は要ログイン。JWT もしくは HttpOnly Cookie。
- **権限**: 作品単位で collaborator を設定できるようにし、API でチェックする。
- **監査ログ**: `scenarios`, `media_assets` の変更履歴を記録（`updated_by`, `audit_log` テーブルなど）。
- **バックアップ**: PostgreSQL スナップショット + メディアストレージの定期バックアップ。
- **レート制限**: アップロードと AI 呼び出しにレートリミットを設けて濫用を防ぐ。

## 8. フロント／バック間の契約
- **型共有**: `@/types/novel.ts` をサーバー側にも共有するか、`openapi` でスキーマ管理。
- **エラー形式**: `{ error: { code, message, details } }` に統一。
- **国際化**: クライアント表示メッセージは i18n 可能な形で受け渡し。

## 9. 将来拡張
- シナリオのバージョン管理、分岐シナリオ、共同編集、レビュー機能。
- 作品マーケットプレイス化、課金・アクセス制御。
- WebSocket を用いたリアルタイム編集／鑑賞同期。
- メディア処理キュー（FFmpeg 等）導入による自動トランスコード。

---
この仕様書は、現行フロントの UI や UX を維持しつつ、ストレージレイヤーのみを PostgreSQL + バックエンド API に置き換えるための基礎設計を示します。優先度の高い項目から段階的に実装を進めてください。
