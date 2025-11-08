import { ControlPanel } from '@/components/ControlPanel';
import { MediaPlayer } from '@/components/MediaPlayer';
import { ProgressBar } from '@/components/ProgressBar';
import { SubtitleDisplay } from '@/components/SubtitleDisplay';
import { SceneManager } from '@/lib/SceneManager';
import { fetchScenario } from '@/lib/scenarioApi';
import type { PlayMode, Scene } from '@/types/novel';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Navigation } from '@/components/Navigation';

const DEFAULT_SCENARIO_SLUG =
  import.meta.env.VITE_DEFAULT_SCENARIO_SLUG || 'default';

export default function NovelPlayer() {
  const [currentScene, setCurrentScene] = useState<Scene | null>(null);
  const [playMode, setPlayMode] = useState<PlayMode>('auto');
  const [isPaused, setIsPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [subtitlesEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(true);
  const sceneManagerRef = useRef<SceneManager | null>(null);

  useEffect(() => {
    const manager = new SceneManager();
    sceneManagerRef.current = manager;

    manager.onSceneChange((scene) => {
      setCurrentScene(scene);
      setProgress(manager.getProgress());
      setCurrentTime(0);
    });

    manager.onEnd(() => {
      toast.success('ストーリーが終了しました');
    });

    const bootstrap = async () => {
      try {
        const record = await fetchScenario(DEFAULT_SCENARIO_SLUG);
        manager.setScenarioData(record.data);
        manager.loadScene(1);
        setIsLoading(false);
      } catch (error) {
        console.warn(
          'APIでシナリオ取得に失敗。ローカル /scenario.json を使用します。',
          error,
        );
        manager
          .loadScenario('/scenario.json')
          .then(() => {
            manager.loadScene(1);
            setIsLoading(false);
          })
          .catch((fallbackError) => {
            console.error('Failed to load scenario:', fallbackError);
            toast.error('シナリオの読み込みに失敗しました');
            setIsLoading(false);
          });
      }
    };

    bootstrap();
  }, []);

  const handleNext = () => {
    if (!sceneManagerRef.current) return;
    sceneManagerRef.current.nextScene();
  };

  const handleMediaEnd = () => {
    if (playMode === 'auto' && !isPaused) {
      handleNext();
    }
  };

  const handleTogglePlayMode = () => {
    if (!sceneManagerRef.current) return;
    const newMode = sceneManagerRef.current.togglePlayMode();
    setPlayMode(newMode);
    toast.info(
      `${newMode === 'auto' ? '自動再生' : '手動進行'}モードに切り替えました`,
    );
  };

  const handleTogglePause = () => {
    if (!sceneManagerRef.current) return;
    const paused = sceneManagerRef.current.togglePause();
    setIsPaused(paused);
  };

  const handleOpenSettings = () => {
    toast.info('設定機能は開発中です');
  };

  const handleScreenClick = () => {
    if (playMode === 'manual' && !isPaused) {
      handleNext();
    }
  };

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
      <Navigation />
      <ProgressBar progress={progress} />

      <div className="w-full h-full cursor-pointer" onClick={handleScreenClick}>
        <MediaPlayer
          scene={currentScene}
          onMediaEnd={handleMediaEnd}
          isPaused={isPaused}
          onTimeUpdate={handleTimeUpdate}
        />
      </div>

      <SubtitleDisplay
        subtitles={currentScene?.subtitles || []}
        currentTime={currentTime}
        enabled={subtitlesEnabled}
      />

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

