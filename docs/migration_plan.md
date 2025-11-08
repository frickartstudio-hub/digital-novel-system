# localStorage → PostgreSQL 移行ガイド

## 1. 目的
- 既存のフロント単体実装（localStorage 保存）から、バックエンド＋PostgreSQL による永続化へ安全に移行する。
- シナリオ／メディア／セーブデータ／APIキーを段階的にサーバーへ集約し、チーム開発・運用を容易にする。

## 2. 前提
- 新アーキテクチャ仕様: `docs/fullstack_system_spec.md`
- バックエンド API と PostgreSQL がステージング環境で稼働していること。
- 既存作品の `scenario.json` と localStorage 内のメディアがアクセス可能であること。

## 3. 移行フェーズ
### Phase 0: 準備
1. リポジトリを最新化し、`docs/fullstack_system_spec.md` を参照して API/DB 構成を把握。
2. バックエンド環境変数（DB URI、ストレージ先、AI API キー）を設定。
3. ステージング用 PostgreSQL を初期化し、マイグレーションを適用。

### Phase 1: シナリオデータの移行
1. 各作品の `app/client/public/scenario.json` をエクスポート。
2. エディタの「JSON エクスポート」機能を利用して最新版を取得（localStorage に未保存の変更を取りこぼさないため）。
3. 新 API `POST /api/scenarios`（または専用インポートツール）にアップロード。
4. 成功したらレスポンスで得た `scenarioId` / `slug` を記録。

### Phase 2: メディアアセットの移行
1. ブラウザ開発者ツールの Console で以下を実行し、localStorage 内の Base64 を回収:
   ```js
   Object.keys(localStorage)
     .filter(key => key.startsWith('file_/'))
     .forEach(key => {
       const dataUrl = localStorage.getItem(key);
       // ダウンロード処理（例: fetch(dataUrl).then(r => r.blob()) ...）
     });
   ```
2. ダウンロードしたファイルをフォルダ整理（images / audio / video 等）。
3. バックエンドの `POST /api/media` へアップロードし、`mediaId` と `mediaUrl` を受け取る。
4. エディタ上で該当シーンの `source` や `scene.audio.*` に新しい `mediaUrl` を設定、`PUT /api/scenes/:id` で保存。

### Phase 3: セーブデータと API キー
1. SaveManager の localStorage キー `digital_novel_saves` を JSON として回収。
2. `POST /api/users/:id/saves` にインポートするスクリプトを用意し、スロットごとに登録。
3. API キーは `novel_api_keys` から読み出し、新しい API キー管理画面（またはサーバー側秘密ストア）へ移す。

### Phase 4: フロントエンド切り替え
1. Vite クライアントを新 API に向ける（`.env` の `VITE_API_BASE_URL` 等）。
2. `FileUpload`, `FileLoader`, `ScenarioEditor`, `AiVoiceGeneratorDialog` で localStorage 分岐を削除し、API 経由のみのフローに。
3. フィールドテスト（シナリオ再生、AI 生成、アップロード、セーブ／ロード）を実施。

## 4. ロールバック計画
- 移行前の `scenario.json` や localStorage ダンプを必ずバックアップする。
- PostgreSQL はスナップショット／ダンプを取得してから移行を行う。
- 問題発生時は旧クライアントをそのまま CDN から配信し、localStorage バージョンに戻せるよう保持しておく。

## 5. 移行チェックリスト
- [ ] PostgreSQL に主要テーブルを作成し、インデックス／制約を確認。
- [ ] API 認証情報をステージング・本番で分離。
- [ ] すべてのシナリオで `mediaUrl` がサーバー配信に置き換わっている。
- [ ] プレイヤーがサーバー配信のアセットを再生できる。
- [ ] セーブデータ／API キーがバックエンド側に保管されている。
- [ ] localStorage エントリ削除してもアプリが正常動作する。

## 6. 運用 Tips
- 新旧システムの併用期間を設け、作品ごとに段階的に移行する。
- TTS や AI 生成はサーバー経由にすることで API キー漏えいリスクを軽減できる。
- バックアップ／監査ログの運用手順を別途整備し、障害時に迅速に復旧できるようにする。

---
このガイドは、既存フロント資産を活かしながらサーバーサイド永続化へ移行するための手順書です。実際の環境や開発体制に合わせてカスタマイズしてください。
