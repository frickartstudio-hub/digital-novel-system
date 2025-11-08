import type { Scene, ScenarioData, PlayMode } from '@/types/novel';

/**
 * シーンマネージャー
 * シーンの進行状態を管理し、各コンポーネントを統括
 */
export class SceneManager {
  private scenarioData: ScenarioData | null = null;
  private currentSceneId: number = 1;
  private playMode: PlayMode = 'auto';
  private isPaused: boolean = false;
  private onSceneChangeCallback?: (scene: Scene) => void;
  private onEndCallback?: () => void;

  /**
   * シナリオデータを読み込む
   */
  async loadScenario(scenarioPath: string): Promise<void> {
    try {
      const response = await fetch(scenarioPath);
      if (!response.ok) {
        throw new Error(`Failed to load scenario: ${response.statusText}`);
      }
      const data = await response.json();
      this.setScenarioData(data);
      console.log('Scenario loaded:', this.scenarioData?.title);
    } catch (error) {
      console.error('Failed to load scenario:', error);
      throw error;
    }
  }

  setScenarioData(data: ScenarioData) {
    this.scenarioData = data;
    this.currentSceneId = 1;
  }

  /**
   * 指定されたIDのシーンを読み込む
   */
  loadScene(sceneId: number): Scene | null {
    if (!this.scenarioData) {
      throw new Error('Scenario data not loaded');
    }

    const scene = this.scenarioData.scenes.find(s => s.id === sceneId);
    if (!scene) {
      console.error(`Scene ${sceneId} not found`);
      return null;
    }

    this.currentSceneId = sceneId;
    
    // コールバックを実行
    if (this.onSceneChangeCallback) {
      this.onSceneChangeCallback(scene);
    }

    return scene;
  }

  /**
   * 次のシーンに進む
   */
  nextScene(): Scene | null {
    const currentScene = this.getCurrentScene();
    if (!currentScene) return null;

    const nextSceneId = currentScene.transitions.nextSceneId;
    if (nextSceneId) {
      return this.loadScene(nextSceneId);
    } else {
      console.log('End of story');
      if (this.onEndCallback) {
        this.onEndCallback();
      }
      return null;
    }
  }

  /**
   * 前のシーンに戻る
   */
  previousScene(): Scene | null {
    if (this.currentSceneId > 1) {
      return this.loadScene(this.currentSceneId - 1);
    }
    return null;
  }

  /**
   * 再生モードを切り替える
   */
  togglePlayMode(): PlayMode {
    this.playMode = this.playMode === 'auto' ? 'manual' : 'auto';
    console.log('Play mode changed to:', this.playMode);
    return this.playMode;
  }

  /**
   * 一時停止/再開
   */
  togglePause(): boolean {
    this.isPaused = !this.isPaused;
    return this.isPaused;
  }

  /**
   * 現在のシーンを取得
   */
  getCurrentScene(): Scene | undefined {
    return this.scenarioData?.scenes.find(s => s.id === this.currentSceneId);
  }

  /**
   * 進行状況を取得（パーセンテージ）
   */
  getProgress(): number {
    if (!this.scenarioData) return 0;
    return (this.currentSceneId / this.scenarioData.scenes.length) * 100;
  }

  /**
   * シーン変更時のコールバックを設定
   */
  onSceneChange(callback: (scene: Scene) => void): void {
    this.onSceneChangeCallback = callback;
  }

  /**
   * ストーリー終了時のコールバックを設定
   */
  onEnd(callback: () => void): void {
    this.onEndCallback = callback;
  }

  /**
   * 現在の再生モードを取得
   */
  getPlayMode(): PlayMode {
    return this.playMode;
  }

  /**
   * 一時停止状態を取得
   */
  getIsPaused(): boolean {
    return this.isPaused;
  }

  /**
   * シナリオデータを取得
   */
  getScenarioData(): ScenarioData | null {
    return this.scenarioData;
  }
}
