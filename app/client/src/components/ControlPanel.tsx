import { Button } from '@/components/ui/button';
import type { PlayMode } from '@/types/novel';
import { Pause, Play, SkipForward, Settings } from 'lucide-react';

interface ControlPanelProps {
  playMode: PlayMode;
  isPaused: boolean;
  onTogglePlayMode: () => void;
  onTogglePause: () => void;
  onNext: () => void;
  onOpenSettings: () => void;
}

export function ControlPanel({
  playMode,
  isPaused,
  onTogglePlayMode,
  onTogglePause,
  onNext,
  onOpenSettings,
}: ControlPanelProps) {
  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/80 backdrop-blur-sm rounded-full px-6 py-3">
      <Button
        variant="ghost"
        size="icon"
        onClick={onTogglePause}
        className="text-white hover:text-primary"
      >
        {isPaused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onNext}
        className="text-white hover:text-primary"
      >
        <SkipForward className="h-5 w-5" />
      </Button>

      <div className="w-px h-6 bg-white/20 mx-2" />

      <Button
        variant={playMode === 'auto' ? 'default' : 'outline'}
        size="sm"
        onClick={onTogglePlayMode}
        className="text-xs"
      >
        {playMode === 'auto' ? '自動' : '手動'}
      </Button>

      <Button
        variant="ghost"
        size="icon"
        onClick={onOpenSettings}
        className="text-white hover:text-primary"
      >
        <Settings className="h-5 w-5" />
      </Button>
    </div>
  );
}
