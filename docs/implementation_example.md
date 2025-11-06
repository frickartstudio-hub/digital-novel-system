# デジタルノベルシステム 実装例

本文書では、デジタルノベルシステムの主要なコンポーネントの実装例を示します。

---

## 1. シーンマネージャーの実装例（TypeScript）

```typescript
// SceneManager.ts
import { Scene, ScenarioData } from './types';

export class SceneManager {
  private scenarioData: ScenarioData | null = null;
  private currentSceneId: number = 1;
  private playMode: 'auto' | 'manual' = 'auto';
  private isPaused: boolean = false;

  constructor(
    private mediaPlayer: MediaPlayer,
    private subtitleEngine: SubtitleEngine,
    private onSceneChange: (scene: Scene) => void
  ) {}

  /**
   * シナリオデータを読み込む
   */
  async loadScenario(scenarioPath: string): Promise<void> {
    try {
      const response = await fetch(scenarioPath);
      this.scenarioData = await response.json();
      console.log('Scenario loaded:', this.scenarioData.title);
    } catch (error) {
      console.error('Failed to load scenario:', error);
      throw error;
    }
  }

  /**
   * 指定されたIDのシーンを読み込む
   */
  async loadScene(sceneId: number): Promise<void> {
    if (!this.scenarioData) {
      throw new Error('Scenario data not loaded');
    }

    const scene = this.scenarioData.scenes.find(s => s.id === sceneId);
    if (!scene) {
      throw new Error(`Scene ${sceneId} not found`);
    }

    this.currentSceneId = sceneId;
    
    // メディアプレイヤーにメディアを設定
    await this.mediaPlayer.loadMedia(scene);
    
    // 字幕エンジンに字幕を設定
    this.subtitleEngine.loadSubtitles(scene.subtitles);
    
    // コールバックを実行
    this.onSceneChange(scene);
    
    // 自動再生モードの場合、音声終了時に次のシーンへ
    if (this.playMode === 'auto' && scene.audio.voice) {
      this.setupAutoAdvance(scene);
    }
  }

  /**
   * 次のシーンに進む
   */
  async nextScene(): Promise<void> {
    const currentScene = this.getCurrentScene();
    if (!currentScene) return;

    const nextSceneId = currentScene.transitions.nextSceneId;
    if (nextSceneId) {
      await this.loadScene(nextSceneId);
    } else {
      console.log('End of story');
      // ストーリー終了処理
    }
  }

  /**
   * 前のシーンに戻る
   */
  async previousScene(): Promise<void> {
    if (this.currentSceneId > 1) {
      await this.loadScene(this.currentSceneId - 1);
    }
  }

  /**
   * 再生モードを切り替える
   */
  togglePlayMode(): void {
    this.playMode = this.playMode === 'auto' ? 'manual' : 'auto';
    console.log('Play mode changed to:', this.playMode);
  }

  /**
   * 一時停止/再開
   */
  togglePause(): void {
    this.isPaused = !this.isPaused;
    if (this.isPaused) {
      this.mediaPlayer.pause();
    } else {
      this.mediaPlayer.resume();
    }
  }

  /**
   * 現在のシーンを取得
   */
  private getCurrentScene(): Scene | undefined {
    return this.scenarioData?.scenes.find(s => s.id === this.currentSceneId);
  }

  /**
   * 自動再生モード用のタイマー設定
   */
  private setupAutoAdvance(scene: Scene): void {
    // 音声の長さを取得して、終了時に次のシーンへ
    this.mediaPlayer.onVoiceEnd(() => {
      if (this.playMode === 'auto' && !this.isPaused) {
        this.nextScene();
      }
    });
  }

  /**
   * 進行状況を取得（パーセンテージ）
   */
  getProgress(): number {
    if (!this.scenarioData) return 0;
    return (this.currentSceneId / this.scenarioData.scenes.length) * 100;
  }
}
```

---

## 2. メディアプレイヤーの実装例（TypeScript）

```typescript
// MediaPlayer.ts
import { Scene } from './types';
import Howl from 'howler';

export class MediaPlayer {
  private videoElement: HTMLVideoElement | null = null;
  private imageElement: HTMLImageElement | null = null;
  private voiceSound: Howl | null = null;
  private bgmSound: Howl | null = null;
  private seSound: Howl | null = null;

  constructor(private container: HTMLElement) {
    this.setupElements();
  }

  /**
   * DOM要素を初期化
   */
  private setupElements(): void {
    this.videoElement = document.createElement('video');
    this.videoElement.style.width = '100%';
    this.videoElement.style.height = '100%';
    this.videoElement.style.objectFit = 'cover';
    this.videoElement.style.display = 'none';

    this.imageElement = document.createElement('img');
    this.imageElement.style.width = '100%';
    this.imageElement.style.height = '100%';
    this.imageElement.style.objectFit = 'cover';
    this.imageElement.style.display = 'none';

    this.container.appendChild(this.videoElement);
    this.container.appendChild(this.imageElement);
  }

  /**
   * シーンのメディアを読み込んで再生
   */
  async loadMedia(scene: Scene): Promise<void> {
    // 既存のメディアを停止
    this.stopAll();

    // 画像または動画を表示
    if (scene.type === 'image') {
      await this.playImage(scene.source);
    } else if (scene.type === 'video') {
      await this.playVideo(scene.source);
    }

    // 音声を再生
    if (scene.audio.bgm) {
      this.playBGM(scene.audio.bgm);
    }
    if (scene.audio.voice) {
      this.playVoice(scene.audio.voice);
    }
    if (scene.audio.se) {
      this.playSE(scene.audio.se);
    }
  }

  /**
   * 画像を表示
   */
  private async playImage(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.imageElement) return reject();

      this.imageElement.onload = () => {
        if (this.imageElement && this.videoElement) {
          this.videoElement.style.display = 'none';
          this.imageElement.style.display = 'block';
          resolve();
        }
      };
      this.imageElement.onerror = reject;
      this.imageElement.src = src;
    });
  }

  /**
   * 動画を再生
   */
  private async playVideo(src: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.videoElement) return reject();

      this.videoElement.onloadeddata = () => {
        if (this.videoElement && this.imageElement) {
          this.imageElement.style.display = 'none';
          this.videoElement.style.display = 'block';
          this.videoElement.play();
          resolve();
        }
      };
      this.videoElement.onerror = reject;
      this.videoElement.src = src;
    });
  }

  /**
   * ボイスを再生
   */
  private playVoice(src: string): void {
    this.voiceSound = new Howl({
      src: [src],
      volume: 1.0,
      onend: () => {
        console.log('Voice ended');
      }
    });
    this.voiceSound.play();
  }

  /**
   * BGMを再生（ループ）
   */
  private playBGM(src: string): void {
    this.bgmSound = new Howl({
      src: [src],
      volume: 0.5,
      loop: true
    });
    this.bgmSound.play();
  }

  /**
   * 効果音を再生
   */
  private playSE(src: string): void {
    this.seSound = new Howl({
      src: [src],
      volume: 0.7
    });
    this.seSound.play();
  }

  /**
   * すべてのメディアを停止
   */
  stopAll(): void {
    if (this.videoElement) {
      this.videoElement.pause();
      this.videoElement.src = '';
    }
    if (this.voiceSound) {
      this.voiceSound.stop();
    }
    if (this.bgmSound) {
      this.bgmSound.stop();
    }
    if (this.seSound) {
      this.seSound.stop();
    }
  }

  /**
   * 一時停止
   */
  pause(): void {
    if (this.videoElement) {
      this.videoElement.pause();
    }
    if (this.voiceSound) {
      this.voiceSound.pause();
    }
    if (this.bgmSound) {
      this.bgmSound.pause();
    }
  }

  /**
   * 再開
   */
  resume(): void {
    if (this.videoElement && !this.videoElement.paused) {
      this.videoElement.play();
    }
    if (this.voiceSound) {
      this.voiceSound.play();
    }
    if (this.bgmSound) {
      this.bgmSound.play();
    }
  }

  /**
   * ボイス終了時のコールバックを設定
   */
  onVoiceEnd(callback: () => void): void {
    if (this.voiceSound) {
      this.voiceSound.on('end', callback);
    }
  }

  /**
   * 音量を設定
   */
  setVolume(type: 'voice' | 'bgm' | 'se', volume: number): void {
    const normalizedVolume = Math.max(0, Math.min(1, volume / 100));
    
    switch (type) {
      case 'voice':
        if (this.voiceSound) this.voiceSound.volume(normalizedVolume);
        break;
      case 'bgm':
        if (this.bgmSound) this.bgmSound.volume(normalizedVolume);
        break;
      case 'se':
        if (this.seSound) this.seSound.volume(normalizedVolume);
        break;
    }
  }
}
```

---

## 3. 字幕エンジンの実装例（TypeScript）

```typescript
// SubtitleEngine.ts
import { Subtitle } from './types';

export class SubtitleEngine {
  private subtitles: Subtitle[] = [];
  private currentSubtitleIndex: number = -1;
  private intervalId: number | null = null;
  private startTime: number = 0;

  constructor(private subtitleContainer: HTMLElement) {}

  /**
   * 字幕データを読み込む
   */
  loadSubtitles(subtitles: Subtitle[]): void {
    this.subtitles = subtitles;
    this.currentSubtitleIndex = -1;
    this.clearSubtitle();
    this.startTracking();
  }

  /**
   * 字幕の追跡を開始
   */
  private startTracking(): void {
    this.startTime = Date.now();
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = window.setInterval(() => {
      this.updateSubtitle();
    }, 100); // 100msごとに更新
  }

  /**
   * 現在時刻に応じて字幕を更新
   */
  private updateSubtitle(): void {
    const currentTime = Date.now() - this.startTime;

    for (let i = 0; i < this.subtitles.length; i++) {
      const subtitle = this.subtitles[i];
      
      if (currentTime >= subtitle.start && currentTime <= subtitle.end) {
        if (this.currentSubtitleIndex !== i) {
          this.displaySubtitle(subtitle);
          this.currentSubtitleIndex = i;
        }
        return;
      }
    }

    // 表示すべき字幕がない場合はクリア
    if (this.currentSubtitleIndex !== -1) {
      this.clearSubtitle();
      this.currentSubtitleIndex = -1;
    }
  }

  /**
   * 字幕を表示
   */
  private displaySubtitle(subtitle: Subtitle): void {
    this.subtitleContainer.innerHTML = `
      <div class="subtitle-speaker">${subtitle.speaker}</div>
      <div class="subtitle-text">${subtitle.text}</div>
    `;
    this.subtitleContainer.style.opacity = '1';
  }

  /**
   * 字幕をクリア
   */
  clearSubtitle(): void {
    this.subtitleContainer.innerHTML = '';
    this.subtitleContainer.style.opacity = '0';
  }

  /**
   * 追跡を停止
   */
  stopTracking(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}
```

---

## 4. セーブマネージャーの実装例（TypeScript）

```typescript
// SaveManager.ts
export interface SaveData {
  sceneId: number;
  timestamp: string;
  thumbnail: string;
  settings: {
    bgmVolume: number;
    voiceVolume: number;
    seVolume: number;
    subtitlesEnabled: boolean;
    subtitleSize: string;
  };
}

export class SaveManager {
  private readonly STORAGE_KEY = 'digital_novel_saves';
  private readonly MAX_SLOTS = 5;

  /**
   * データを保存
   */
  save(slotId: number, data: SaveData): void {
    if (slotId < 1 || slotId > this.MAX_SLOTS) {
      throw new Error(`Invalid slot ID: ${slotId}`);
    }

    const saves = this.getAllSaves();
    saves[`slot${slotId}`] = data;
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saves));
      console.log(`Saved to slot ${slotId}`);
    } catch (error) {
      console.error('Failed to save:', error);
      throw error;
    }
  }

  /**
   * データを読み込む
   */
  load(slotId: number): SaveData | null {
    if (slotId < 1 || slotId > this.MAX_SLOTS) {
      throw new Error(`Invalid slot ID: ${slotId}`);
    }

    const saves = this.getAllSaves();
    return saves[`slot${slotId}`] || null;
  }

  /**
   * セーブデータを削除
   */
  deleteSave(slotId: number): void {
    if (slotId < 1 || slotId > this.MAX_SLOTS) {
      throw new Error(`Invalid slot ID: ${slotId}`);
    }

    const saves = this.getAllSaves();
    delete saves[`slot${slotId}`];
    
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(saves));
    console.log(`Deleted slot ${slotId}`);
  }

  /**
   * すべてのセーブデータを取得
   */
  getAllSaves(): Record<string, SaveData> {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      return data ? JSON.parse(data) : {};
    } catch (error) {
      console.error('Failed to load saves:', error);
      return {};
    }
  }

  /**
   * セーブスロットのリストを取得
   */
  getSaveList(): Array<{ slotId: number; data: SaveData | null }> {
    const saves = this.getAllSaves();
    const list = [];

    for (let i = 1; i <= this.MAX_SLOTS; i++) {
      list.push({
        slotId: i,
        data: saves[`slot${i}`] || null
      });
    }

    return list;
  }
}
```

---

## 5. メインアプリケーションの実装例（TypeScript + React）

```typescript
// App.tsx
import React, { useEffect, useRef, useState } from 'react';
import { SceneManager } from './managers/SceneManager';
import { MediaPlayer } from './managers/MediaPlayer';
import { SubtitleEngine } from './managers/SubtitleEngine';
import { SaveManager } from './managers/SaveManager';
import { Scene } from './types';

const App: React.FC = () => {
  const mediaContainerRef = useRef<HTMLDivElement>(null);
  const subtitleContainerRef = useRef<HTMLDivElement>(null);
  const [sceneManager, setSceneManager] = useState<SceneManager | null>(null);
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [playMode, setPlayMode] = useState<'auto' | 'manual'>('auto');
  const [progress, setProgress] = useState<number>(0);

  useEffect(() => {
    if (!mediaContainerRef.current || !subtitleContainerRef.current) return;

    // 各マネージャーを初期化
    const mediaPlayer = new MediaPlayer(mediaContainerRef.current);
    const subtitleEngine = new SubtitleEngine(subtitleContainerRef.current);
    const saveManager = new SaveManager();

    const manager = new SceneManager(
      mediaPlayer,
      subtitleEngine,
      (scene) => {
        setCurrentScene(scene);
        setProgress(manager.getProgress());
      }
    );

    // シナリオを読み込んで最初のシーンを開始
    manager.loadScenario('/data/scenario.json').then(() => {
      manager.loadScene(1);
    });

    setSceneManager(manager);
  }, []);

  const handleNext = () => {
    sceneManager?.nextScene();
  };

  const handleToggleMode = () => {
    sceneManager?.togglePlayMode();
    setPlayMode(prev => prev === 'auto' ? 'manual' : 'auto');
  };

  const handleSave = () => {
    if (!sceneManager || !currentScene) return;
    
    const saveManager = new SaveManager();
    saveManager.save(1, {
      sceneId: currentScene.id,
      timestamp: new Date().toISOString(),
      thumbnail: currentScene.source,
      settings: {
        bgmVolume: 80,
        voiceVolume: 100,
        seVolume: 70,
        subtitlesEnabled: true,
        subtitleSize: 'medium'
      }
    });
    alert('セーブしました!');
  };

  return (
    <div className="app">
      {/* プログレスバー */}
      <div className="progress-bar">
        <div className="progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* メディア表示エリア */}
      <div ref={mediaContainerRef} className="media-container" onClick={handleNext} />

      {/* 字幕表示エリア */}
      <div ref={subtitleContainerRef} className="subtitle-container" />

      {/* コントロールパネル */}
      <div className="control-panel">
        <button onClick={handleNext}>次へ</button>
        <button onClick={handleToggleMode}>
          モード: {playMode === 'auto' ? '自動' : '手動'}
        </button>
        <button onClick={handleSave}>セーブ</button>
      </div>
    </div>
  );
};

export default App;
```

---

## 6. スタイルシートの例（CSS）

```css
/* styles/global.css */
* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans JP', -apple-system, BlinkMacSystemFont, sans-serif;
  background-color: #000;
  color: #fff;
  overflow: hidden;
}

.app {
  width: 100vw;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

/* プログレスバー */
.progress-bar {
  width: 100%;
  height: 4px;
  background-color: rgba(255, 255, 255, 0.2);
  position: relative;
}

.progress-fill {
  height: 100%;
  background-color: #ff6b6b;
  transition: width 0.3s ease;
}

/* メディア表示エリア */
.media-container {
  flex: 1;
  position: relative;
  background-color: #000;
  cursor: pointer;
}

/* 字幕表示エリア */
.subtitle-container {
  position: absolute;
  bottom: 100px;
  left: 50%;
  transform: translateX(-50%);
  width: 80%;
  max-width: 800px;
  background-color: rgba(0, 0, 0, 0.7);
  padding: 20px;
  border-radius: 8px;
  text-align: center;
  transition: opacity 0.2s ease;
}

.subtitle-speaker {
  font-size: 14px;
  color: #ff6b6b;
  margin-bottom: 8px;
  font-weight: bold;
}

.subtitle-text {
  font-size: 18px;
  line-height: 1.6;
}

/* コントロールパネル */
.control-panel {
  position: absolute;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  gap: 10px;
  background-color: rgba(30, 30, 30, 0.9);
  padding: 15px;
  border-radius: 8px;
}

.control-panel button {
  padding: 10px 20px;
  background-color: #ff6b6b;
  color: #fff;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: transform 0.15s ease;
}

.control-panel button:hover {
  transform: scale(1.05);
}

.control-panel button:active {
  transform: scale(0.95);
}

/* レスポンシブ対応 */
@media (max-width: 768px) {
  .subtitle-container {
    width: 90%;
    bottom: 80px;
    padding: 15px;
  }

  .subtitle-text {
    font-size: 16px;
  }

  .control-panel {
    flex-direction: column;
    width: 90%;
  }

  .control-panel button {
    width: 100%;
  }
}
```

---

以上が、デジタルノベルシステムの主要なコンポーネントの実装例です。これらをベースに、プロジェクトの要件に応じてカスタマイズしてください。
