import type { Scene, Subtitle } from '@/types/novel';
import { FileLoader } from '@/lib/FileLoader';
import { useEffect, useRef, useState } from 'react';

interface MediaPlayerProps {
  scene: Scene | null;
  onMediaEnd?: () => void;
  isPaused: boolean;
  onTimeUpdate?: (time: number) => void;
}

type AudioRefs = {
  voice?: HTMLAudioElement;
  bgm?: HTMLAudioElement;
  se?: HTMLAudioElement;
  subtitleVoices: Record<string, HTMLAudioElement>;
};

export function MediaPlayer({ scene, onMediaEnd, isPaused, onTimeUpdate }: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRefs = useRef<AudioRefs>({ subtitleVoices: {} });
  const [currentTime, setCurrentTime] = useState(0);
  const startTimeRef = useRef<number>(0);
  const timerRef = useRef<number | null>(null);
  const pausedTimeRef = useRef<number>(0);
  const sceneIdRef = useRef<string>('');
  const activeSubtitleKeyRef = useRef<string | null>(null);

  const playAudio = async (audio: HTMLAudioElement, type: string) => {
    try {
      await audio.play();
      console.log(`${type} audio started playing`);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError' && err.name !== 'NotAllowedError') {
        console.error(`${type} audio play error:`, err);
      } else {
        console.log(`${type} audio blocked by autoplay policy - user interaction required`);
      }
    }
  };

  const cleanupAudioElement = (audio?: HTMLAudioElement) => {
    if (audio) {
      audio.pause();
      audio.src = '';
      audio.load();
    }
  };

  const stopActivePlayback = (resetPosition = false) => {
    const pauseAudio = (audio?: HTMLAudioElement) => {
      if (audio && !audio.paused) {
        audio.pause();
        if (resetPosition) {
          audio.currentTime = 0;
        }
      }
    };
    pauseAudio(audioRefs.current.voice);
    pauseAudio(audioRefs.current.bgm);
    pauseAudio(audioRefs.current.se);
    Object.values(audioRefs.current.subtitleVoices).forEach((audio) => pauseAudio(audio));
  };

  const stopAllAudio = () => {
    stopActivePlayback(true);
    audioRefs.current = { subtitleVoices: {} };
    activeSubtitleKeyRef.current = null;
  };

  const resumePlayback = () => {
    const resumeAudio = (audio?: HTMLAudioElement, key?: string) => {
      if (audio && audio.paused) {
        playAudio(audio, key ?? 'audio');
      }
    };

    resumeAudio(audioRefs.current.voice, 'voice');
    resumeAudio(audioRefs.current.bgm, 'bgm');
    resumeAudio(audioRefs.current.se, 'se');

    const activeSubtitleKey = activeSubtitleKeyRef.current;
    if (activeSubtitleKey) {
      resumeAudio(
        audioRefs.current.subtitleVoices[activeSubtitleKey],
        `subtitle:${activeSubtitleKey}`,
      );
    }
  };

  const getSubtitleKey = (subtitle: Subtitle, index: number) =>
    `${index}-${subtitle.start}-${subtitle.end}`;

  const findActiveSubtitle = (subtitles: Subtitle[], elapsed: number) => {
    const index = subtitles.findIndex(
      (subtitle) => elapsed >= subtitle.start && elapsed <= subtitle.end,
    );
    if (index === -1) {
      return null;
    }
    return { subtitle: subtitles[index], index };
  };

  const voiceDurationRef = useRef<number>(0);

  // Reset voiceDurationRef when scene changes
  useEffect(() => {
    voiceDurationRef.current = 0;
  }, [scene?.id]);

  useEffect(() => {
    if (!scene) return;

    const sceneId = `${scene.id}-${scene.source}`;
    if (sceneIdRef.current === sceneId) return;
    sceneIdRef.current = sceneId;

    stopAllAudio();

    if (scene.audio?.voice) {
      const voiceSource = FileLoader.getSource(scene.audio.voice);
      const voiceAudio = new Audio(voiceSource);
      voiceAudio.loop = false;
      voiceAudio.preload = 'auto';
      voiceAudio.volume = 1.0;
      voiceAudio.addEventListener('loadedmetadata', () => {
        voiceDurationRef.current = voiceAudio.duration * 1000;
      });
      voiceAudio.addEventListener('loadeddata', () => {
        if (!isPaused) {
          playAudio(voiceAudio, 'voice');
        }
      });
      voiceAudio.addEventListener('error', (e) => {
        console.error('Voice audio failed to load:', e);
      });
      audioRefs.current.voice = voiceAudio;
    }

    if (scene.audio?.bgm) {
      const bgmSource = FileLoader.getSource(scene.audio.bgm);
      const bgmAudio = new Audio(bgmSource);
      bgmAudio.loop = true;
      bgmAudio.preload = 'auto';
      bgmAudio.volume = 0.3;
      bgmAudio.addEventListener('loadeddata', () => {
        if (!isPaused) {
          playAudio(bgmAudio, 'bgm');
        }
      });
      bgmAudio.addEventListener('error', (e) => {
        console.error('BGM audio failed to load:', e);
      });
      audioRefs.current.bgm = bgmAudio;
    }

    if (scene.audio?.se) {
      const seSource = FileLoader.getSource(scene.audio.se);
      const seAudio = new Audio(seSource);
      seAudio.preload = 'auto';
      seAudio.volume = 0.7;
      seAudio.addEventListener('loadeddata', () => {
        if (!isPaused) {
          playAudio(seAudio, 'se');
        }
      });
      seAudio.addEventListener('error', (e) => {
        console.error('SE audio failed to load:', e);
      });
      audioRefs.current.se = seAudio;
    }

    const subtitleVoiceMap: Record<string, HTMLAudioElement> = {};
    scene.subtitles.forEach((subtitle, index) => {
      if (!subtitle.voice) return;
      const source = FileLoader.getSource(subtitle.voice);
      const subtitleAudio = new Audio(source);
      subtitleAudio.loop = false;
      subtitleAudio.preload = 'auto';
      subtitleAudio.volume = 1.0;
      subtitleAudio.addEventListener('error', (e) => {
        console.error(`Subtitle voice (${index}) failed to load:`, e);
      });
      subtitleVoiceMap[getSubtitleKey(subtitle, index)] = subtitleAudio;
    });
    audioRefs.current.subtitleVoices = subtitleVoiceMap;

    startTimeRef.current = Date.now();
    pausedTimeRef.current = 0;
    setCurrentTime(0);
    activeSubtitleKeyRef.current = null;

    if (timerRef.current) {
      cancelAnimationFrame(timerRef.current);
    }

    const handleSubtitleVoice = (elapsed: number) => {
      if (!scene.subtitles.some((subtitle) => subtitle.voice)) {
        return;
      }

      const active = findActiveSubtitle(scene.subtitles, elapsed);
      const key = active ? getSubtitleKey(active.subtitle, active.index) : null;

      if (key === activeSubtitleKeyRef.current) {
        return;
      }

      if (activeSubtitleKeyRef.current) {
        const prev = audioRefs.current.subtitleVoices[activeSubtitleKeyRef.current];
        if (prev) {
          prev.pause();
          prev.currentTime = 0;
        }
      }

      activeSubtitleKeyRef.current = key;

      if (key && !isPaused) {
        const nextAudio = audioRefs.current.subtitleVoices[key];
        if (nextAudio) {
          nextAudio.currentTime = 0;
          playAudio(nextAudio, `subtitle:${key}`);
        }
      }
    };

    let mediaEndCalled = false;

    const updateTime = () => {
      if (!isPaused) {
        const elapsed = Date.now() - startTimeRef.current - pausedTimeRef.current;
        setCurrentTime(elapsed);
        if (onTimeUpdate) {
          onTimeUpdate(elapsed);
        }
        handleSubtitleVoice(elapsed);

        // Check for scene duration (wait for voice if longer)
        const effectiveDuration = Math.max(scene.duration, voiceDurationRef.current);
        if (effectiveDuration > 0 && elapsed >= effectiveDuration && !mediaEndCalled) {
          mediaEndCalled = true;
          if (onMediaEnd) {
            onMediaEnd();
          }
        }
      }
      timerRef.current = requestAnimationFrame(updateTime);
    };

    timerRef.current = requestAnimationFrame(updateTime);

    return () => {
      if (timerRef.current) {
        cancelAnimationFrame(timerRef.current);
      }
      stopAllAudio();
    };
  }, [scene, onMediaEnd, onTimeUpdate, isPaused]);

  const pauseStartRef = useRef<number>(0);

  useEffect(() => {
    if (isPaused) {
      pauseStartRef.current = Date.now();
      stopActivePlayback(false);
    } else {
      if (pauseStartRef.current > 0) {
        pausedTimeRef.current += Date.now() - pauseStartRef.current;
        pauseStartRef.current = 0;
      }
      resumePlayback();
    }
  }, [isPaused]);

  if (!scene) {
    return (
      <div className="w-full h-full bg-black flex items-center justify-center">
        <p className="text-white">Loading...</p>
      </div>
    );
  }

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
        <img src={mediaSource} alt="Scene background" className="w-full h-full object-cover" />
      )}
    </div>
  );
}
