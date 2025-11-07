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

  // シーンが変更されたときの処理
  useEffect(() => {
    if (!scene) return;

    // すべてのオーディオを停止
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        audio.pause();
        audio.currentTime = 0;
      }
    });

    // 新しいオーディオを読み込んで再生
    if (scene.audio.voice) {
      const voiceSource = FileLoader.getSource(scene.audio.voice);
      const voiceAudio = new Audio(voiceSource);
      voiceAudio.addEventListener('ended', () => {
        if (onMediaEnd) onMediaEnd();
      });
      audioRefs.current.voice = voiceAudio;
      voiceAudio.play().catch(console.error);
    }

    if (scene.audio.bgm) {
      const bgmSource = FileLoader.getSource(scene.audio.bgm);
      const bgmAudio = new Audio(bgmSource);
      bgmAudio.loop = true;
      bgmAudio.volume = 0.5;
      audioRefs.current.bgm = bgmAudio;
      bgmAudio.play().catch(console.error);
    }

    if (scene.audio.se) {
      const seSource = FileLoader.getSource(scene.audio.se);
      const seAudio = new Audio(seSource);
      audioRefs.current.se = seAudio;
      seAudio.play().catch(console.error);
    }

    // タイマーをリセット
    startTimeRef.current = Date.now();
    setCurrentTime(0);

    // タイマーを開始
    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
    }

    const updateTime = () => {
      const elapsed = Date.now() - startTimeRef.current;
      setCurrentTime(elapsed);
      if (onTimeUpdate) onTimeUpdate(elapsed);
      timerRef.current = requestAnimationFrame(updateTime);
    };

    timerRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
    };
  }, [scene, onMediaEnd, onTimeUpdate]);

  // 一時停止/再開の処理
  useEffect(() => {
    Object.values(audioRefs.current).forEach(audio => {
      if (audio) {
        if (isPaused) {
          audio.pause();
        } else {
          audio.play().catch(console.error);
        }
      }
    });

    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(console.error);
      }
    }
  }, [isPaused]);

  if (!scene) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <p className="text-muted-foreground">シーンを読み込んでいます...</p>
      </div>
    );
  }

  // ソースをFileLoader経由で取得
  const mediaSource = FileLoader.getSource(scene.source);

  if (scene.type === 'video') {
    return (
      <video
        ref={videoRef}
        src={mediaSource}
        className="w-full h-full object-cover"
        autoPlay
        onEnded={onMediaEnd}
      />
    );
  }

  return (
    <div
      className="w-full h-full bg-cover bg-center bg-no-repeat transition-all duration-500"
      style={{ backgroundImage: `url(${mediaSource})` }}
    />
  );
}
