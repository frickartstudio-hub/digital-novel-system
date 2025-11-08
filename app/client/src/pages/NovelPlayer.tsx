import { ControlPanel } from '@/components/ControlPanel';
import { MediaPlayer } from '@/components/MediaPlayer';
import { ProgressBar } from '@/components/ProgressBar';
import { SubtitleDisplay } from '@/components/SubtitleDisplay';
import { SceneManager } from '@/lib/SceneManager';
import type { PlayMode, Scene } from '@/types/novel';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Navigation } from '@/components/Navigation';

export default function NovelPlayer() {
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [playMode, setPlayMode] = useState<PlayMode>('auto');
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [subtitlesEnabled, setSubtitlesEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  // 初期匁E
  useEffect(() => {
    const manager = new SceneManager();
    sceneManagerRef.current = manager;

    // シーン変更時�Eコールバック
    manager.onSceneChange((scene) => {
      setCurrentScene(scene);
      setProgress(manager.getProgress());
      setCurrentTime(0);
    });

    // スト�Eリー終亁E��のコールバック
    manager.onEnd(() => {
      toast.success('スト�Eリーが終亁E��ました');
    });

    // シナリオを読み込んで最初�Eシーンを開姁E
    manager
      .loadScenario('/scenario.json')
      .then(() => {
        manager.loadScene(1);
        setIsLoading(false);
      })
      .catch((error) => {
        console.error('Failed to load scenario:', error);
        toast.error('シナリオの読み込みに失敗しました');
        setIsLoading(false);
      });
  }, []);

  // 次のシーンへ進む
  const handleNext = () => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.nextScene();
  };

  // 自動�E生モードでメチE��ア終亁E��に次へ進む
  const handleMediaEnd = () => {
    if (playMode === 'auto' && !isPaused) {
      handleNext();
    }
  };

  // 再生モード�E刁E��替ぁE
  const handleTogglePlayMode = () => {
    if (!sceneManagerRef.current) return;
    const newMode = sceneManagerRef.current.togglePlayMode();
    setPlayMode(newMode);
    toast.info(`${newMode === 'auto' ? '自動�E甁E : '手動進衁E}モードに刁E��替えました`);
  };

  // 一時停止/再開
  const handleTogglePause = () => {
    if (!sceneManagerRef.current) return;
    const paused = sceneManagerRef.current.togglePause();
    setIsPaused(paused);
  };

  // 設定画面を開く（�Eレースホルダー�E�E
  const handleOpenSettings = () => {
    toast.info('設定機�Eは準備中でぁE);
  };

  // 画面クリチE��で次へ進む�E�手動モード時�E�E
  const handleScreenClick = () => {
    if (playMode === 'manual' && !isPaused) {
      handleNext();
    }
  };

  // 時間更新
  const handleTimeUpdate = (time: number) => {
    setCurrentTime(time);
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
      {/* ナビゲーション */}
      <Navigation />
      {/* プログレスバ�E */}
      <ProgressBar progress={progress} />

      {/* メチE��ア表示エリア */}
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

