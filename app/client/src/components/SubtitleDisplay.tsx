import type { Subtitle } from '@/types/novel';
import { useEffect, useState } from 'react';

interface SubtitleDisplayProps {
  subtitles: Subtitle[];
  currentTime: number;
  enabled: boolean;
}

export function SubtitleDisplay({ subtitles, currentTime, enabled }: SubtitleDisplayProps) {
  const [currentSubtitle, setCurrentSubtitle] = useState<Subtitle | null>(null);

  useEffect(() => {
    if (!enabled || subtitles.length === 0) {
      setCurrentSubtitle(null);
      return;
    }

    // 現在時刻に対応する字幕を検索
    const subtitle = subtitles.find(
      (sub) => currentTime >= sub.start && currentTime <= sub.end
    );

    setCurrentSubtitle(subtitle || null);
  }, [subtitles, currentTime, enabled]);

  if (!enabled || !currentSubtitle) {
    return null;
  }

  return (
    <div className="absolute bottom-24 left-1/2 -translate-x-1/2 w-[90%] max-w-3xl bg-black/70 backdrop-blur-sm rounded-lg p-6 animate-in fade-in duration-200">
      <div className="text-primary text-sm font-semibold mb-2">
        {currentSubtitle.speaker}
      </div>
      <div className="text-foreground text-lg leading-relaxed">
        {currentSubtitle.text}
      </div>
    </div>
  );
}
