import type { Scene } from '@/types/novel';
import { FileLoader } from '@/lib/FileLoader';
import { useEffect, useRef, useState } from 'react';

interface MediaPlayerProps {
  scene: Scene | null;
  onMediaEnd?: () => void;
  isPaused: boolean;
  onTimeUpdate?: (time: number) => void;
}

export function MediaPlayer({ scene, onMediaEnd, isPaused, onTimeUpdate }: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRefs = useRef<{
    voice?: HTMLAudioElement;
    bgm?: HTMLAudioElement;
    se?: HTMLAudioElement;
  }>({});
  const [currentTime, setCurrentTime] = useState(0);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const sceneIdRef = useRef<string>('');

  // シーンが変更されたときの処理
  useEffect(() => {
    if (!scene) return;

    // 同じシーンの場合は何もしない
    const sceneId = `${scene.id}-${scene.source}`;
    if (sceneIdRef.current === sceneId) return;
    sceneIdRef.current = sceneId;

    // すべてのオーディオを停止してクリーンアップ
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.src = ''; // ソースをクリア
        audio.load(); // リセット
      }
    });
    audioRefs.current = {};

    // 新しいオーディオを読み込み
    if (scene.audio?.voice) {
      const voiceSource = FileLoader.getSource(scene.audio.voice);
      const voiceAudio = new Audio(voiceSource);
      voiceAudio.loop = false;
      voiceAudio.preload = 'auto';
      audioRefs.current.voice = voiceAudio;
      
      // 自動再生しない（isPausedの変更で制御）
    }

    if (scene.audio?.bgm) {
      const bgmSource = FileLoader.getSource(scene.audio.bgm);
      const bgmAudio = new Audio(bgmSource);
      bgmAudio.loop = true;
      bgmAudio.preload = 'auto';
      audioRefs.current.bgm = bgmAudio;
    }

    if (scene.audio?.se) {
      const seSource = FileLoader.getSource(scene.audio.se);
      const seAudio = new Audio(seSource);
      seAudio.preload = 'auto';
      audioRefs.current.se = seAudio;
    }

    // タイマーをリセット
    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    setCurrentTime(0);

    // タイマーを開始
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
    }

    const updateTime = () => {
      if (!isPaused) {
        const elapsed = Date.now() - startTimeRef.current - pausedTimeRef.current;
        setCurrentTime(elapsed);
        if (onTimeUpdate) onTimeUpdate(elapsed);
      }
      timerRef.current = requestAnimationFrame(updateTime);
    };

    timerRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
      // クリーンアップ時に音声を停止
      Object.values(audioRefs.current).forEach(audio => {
        if (audio) {
          audio.pause();
          audio.src = '';
        }
      });
    };
  }, [scene, onMediaEnd, onTimeUpdate]);

  // 一時停止/再開の処理
  const pauseStartRef = useRef<number>(0);
  
  useEffect(() => {
    if (isPaused) {
      pauseStartRef.current = Date.now();
      // すべての音声を一時停止
      Object.values(audioRefs.current).forEach(audio => {
        if (audio && !audio.paused) {
          audio.pause();
        }
      });
    } else {
      // 一時停止時間を累積
      if (pauseStartRef.current > 0) {
        pausedTimeRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = 0;
      }

      // すべての音声を再生
      Object.entries(audioRefs.current).forEach(([key, audio]) => {
        if (audio && audio.paused) {
          const playPromise = audio.play();
          if (playPromise !== undefined) {
            playPromise.catch(err => {
              // AbortErrorは無視（ユーザー操作による中断）
              if (err.name !== 'AbortError') {
                console.error(`${key} audio play error:`, err);
              }
            });
          }
        }
      });
    }
  }, [isPaused]);

  if (!scene) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

  // 背景メディアの表示
  const mediaSource = FileLoader.getSource(scene.source);
  const isVideo = scene.type === 'video';

  return (
    <div className="relative w-full h-full">
      {isVideo ? (
        <video
          ref={videoRef}
          src={mediaSource}
          className="w-full h-full object-cover"
          autoPlay
          loop
          muted
        />
      ) : (
        <img
          src={mediaSource}
          alt="Scene background"
          className="w-full h-full object-cover"
        />
      )}
    </div>
  );
}
