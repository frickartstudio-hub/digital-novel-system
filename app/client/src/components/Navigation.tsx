import { Button } from '@/components/ui/button';
import { FileJson, Play } from 'lucide-react';
import { useLocation } from 'wouter';

export function Navigation() {
  const [, setLocation] = useLocation();

  return (
    <div className="fixed top-4 right-4 z-50 flex gap-2">
      <Button
        variant="default"
        size="sm"
        onClick={() => setLocation('/')}
        className="bg-primary/90 hover:bg-primary"
      >
        <Play className="mr-2 h-4 w-4" />
        プレイヤー
      </Button>
      <Button
        variant="default"
        size="sm"
        onClick={() => setLocation('/editor')}
        className="bg-primary/90 hover:bg-primary"
      >
        <FileJson className="mr-2 h-4 w-4" />
        エディター
      </Button>
    </div>
  );
}
