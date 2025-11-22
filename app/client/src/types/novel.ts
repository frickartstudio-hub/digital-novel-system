/**
 * デジタルノベルシステムの型定義
 */

/**
 * 字幕データ
 */
export interface Subtitle {
  /** 話者名 */
  speaker: string;
  /** 字幕テキスト */
  text: string;
  /** 表示開始時刻（ミリ秒） */
  start: number;
  /** 表示終了時刻（ミリ秒） */
  end: number;
  /** Optional voice clip path associated with this subtitle */
  voice?: string;
}

/**
 * 音声データ
 */
export interface Audio {
  /** ボイスファイルのパス */
  voice?: string;
  /** BGMファイルのパス */
  bgm?: string;
  /** 効果音ファイルのパス */
  se?: string;
}

/**
 * トランジション設定
 */
export interface Transition {
  /** 次のシーンID */
  nextSceneId: number | null;
  /** トランジション効果 */
  effect?: 'fade' | 'slide' | 'none';
}

/**
 * シーンデータ
 */
export interface Scene {
  /** シーンID */
  id: number;
  /** メディアタイプ */
  type: 'image' | 'video';
  /** メディアファイルのパス */
  source: string;
  /** 自動再生モード時の表示時間（ミリ秒） */
  duration: number;
  /** 音声データ */
  audio: Audio;
  /** 字幕データ */
  subtitles: Subtitle[];
  /** トランジション設定 */
  transitions: Transition;
}

/**
 * シナリオデータ
 */
export interface ScenarioData {
  /** 作品タイトル */
  title: string;
  /** 作者名 */
  author?: string;
  /** バージョン */
  version?: string;
  /** 説明 */
  description?: string;
  /** シーンの配列 */
  scenes: Scene[];
  /** メタデータ */
  metadata?: {
    totalScenes: number;
    estimatedDuration: number;
    tags?: string[];
    rating?: string;
  };
}

/**
 * 再生モード
 */
export type PlayMode = 'auto' | 'manual';

/**
 * セーブデータ
 */
export interface SaveData {
  /** シーンID */
  sceneId: number;
  /** 保存日時 */
  timestamp: string;
  /** サムネイル画像のパス */
  thumbnail: string;
  /** 設定情報 */
  settings: {
    bgmVolume: number;
    voiceVolume: number;
    seVolume: number;
    subtitlesEnabled: boolean;
    subtitleSize: 'small' | 'medium' | 'large';
  };
}

/**
 * セーブスロット
 */
export interface SaveSlot {
  /** スロットID */
  slotId: number;
  /** セーブデータ（nullの場合は空スロット） */
  data: SaveData | null;
}
