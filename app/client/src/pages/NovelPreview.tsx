import { ControlPanel } from '@/components/ControlPanel';
import { MediaPlayer } from '@/components/MediaPlayer';
import { ProgressBar } from '@/components/ProgressBar';
import { SubtitleDisplay } from '@/components/SubtitleDisplay';
import { Button } from '@/components/ui/button';
import { SceneManager } from '@/lib/SceneManager';
import type { PlayMode, Scene, ScenarioData } from '@/types/novel';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';

export default function NovelPreview() {
  const [, setLocation] = useLocation();
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [playMode, setPlayMode] = useState<PlayMode>('auto');
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [subtitlesEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  // 初期化
  useEffect(() => {
    const manager = new SceneManager();
    sceneManagerRef.current = manager;

    // localStorageからプレビュー用シナリオを読み込む
    const previewScenario = localStorage.getItem('preview_scenario');
    if (!previewScenario) {
      toast.error('プレビュー用のシナリオが見つかりません');
      setLocation('/editor');
      return;
    }

    try {
      const scenarioData: ScenarioData = JSON.parse(previewScenario);
      
      // シーン変更時のコールバック
      manager.onSceneChange((scene) => {
        setCurrentScene(scene);
        setProgress(manager.getProgress());
        setCurrentTime(0);
      });

      // ストーリー終了時のコールバック
      manager.onEnd(() => {
        toast.success('プレビューが終了しました');
      });

      // シナリオデータを直接設定（SceneManagerを拡張）
      (manager as any).scenarioData = scenarioData;
      
      if (scenarioData.scenes.length > 0) {
        manager.loadScene(1);
      } else {
        toast.error('シーンが存在しません');
      }
      
      setIsLoading(false);
    } catch (error) {
      console.error('Failed to load preview scenario:', error);
      toast.error('シナリオの読み込みに失敗しました');
      setLocation('/editor');
    }
  }, [setLocation]);

  // 次のシーンへ進む
  const handleNext = () => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.nextScene();
  };

  // 自動再生モードでメディア終了時に次へ進む
  const handleMediaEnd = () => {
    if (playMode === 'auto' && !isPaused) {
      handleNext();
    }
  };

  // 再生モードの切り替え
  const handleTogglePlayMode = () => {
    if (!sceneManagerRef.current) return;
    const newMode = sceneManagerRef.current.togglePlayMode();
    setPlayMode(newMode);
    toast.info(`${newMode === 'auto' ? '自動再生' : '手動進行'}モードに切り替えました`);
  };

  // 一時停止/再開
  const handleTogglePause = () => {
    if (!sceneManagerRef.current) return;
    const paused = sceneManagerRef.current.togglePause();
    setIsPaused(paused);
  };

  // 設定画面を開く（プレースホルダー）
  const handleOpenSettings = () => {
    toast.info('設定機能は準備中です');
  };

  // 画面クリックで次へ進む（手動モード時）
  const handleScreenClick = () => {
    if (playMode === 'manual' && !isPaused) {
      handleNext();
    }
  };

  // 時間更新
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
  };

  // エディターに戻る
  const backToEditor = () => {
    setLocation('/editor');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <p className="text-white text-lg">読み込み中...</p>
      </div>
    );
  }

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 戻るボタン */}
      <Button
        variant="ghost"
        size="sm"
        className="absolute top-4 left-4 z-50 bg-black/50 text-white hover:bg-black/70"
        onClick={backToEditor}
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        エディターに戻る
      </Button>

      {/* プログレスバー */}
      <ProgressBar progress={progress} />

      {/* メディア表示エリア */}
      <div
        className="w-full h-full cursor-pointer"
        onClick={handleScreenClick}
      >
        <MediaPlayer
          scene={currentScene}
          onMediaEnd={handleMediaEnd}
          isPaused={isPaused}
          onTimeUpdate={handleTimeUpdate}
        />
      </div>

      {/* 字幕表示 */}
      <SubtitleDisplay
        subtitles={currentScene?.subtitles || []}
        currentTime={currentTime}
        enabled={subtitlesEnabled}
      />

      {/* コントロールパネル */}
      <ControlPanel
        playMode={playMode}
        isPaused={isPaused}
        onTogglePlayMode={handleTogglePlayMode}
        onTogglePause={handleTogglePause}
        onNext={handleNext}
        onOpenSettings={handleOpenSettings}
      />
    </div>
  );
}
