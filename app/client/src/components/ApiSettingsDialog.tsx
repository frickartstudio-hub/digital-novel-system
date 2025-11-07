import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { ApiKeyManager } from '@/lib/ApiKeyManager';
import { Eye, EyeOff, Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';

interface ApiSettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ApiSettingsDialog({ open, onOpenChange }: ApiSettingsDialogProps) {
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [showOpenrouterKey, setShowOpenrouterKey] = useState(false);
  const [geminiKey, setGeminiKey] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);

  // ダイアログを開いたときに保存済みのキーを読み込む
  useEffect(() => {
    if (open) {
      const openrouter = ApiKeyManager.get('openrouter');
      setOpenrouterKey(openrouter || '');
      const gemini = ApiKeyManager.get('gemini');
      setGeminiKey(gemini || '');
    }
  }, [open]);

  // 保存
  const handleSave = () => {
    const trimmedOpenrouter = openrouterKey.trim();
    const trimmedGemini = geminiKey.trim();

    if (trimmedOpenrouter) {
      ApiKeyManager.set('openrouter', trimmedOpenrouter);
    } else {
      ApiKeyManager.remove('openrouter');
    }

    if (trimmedGemini) {
      ApiKeyManager.set('gemini', trimmedGemini);
    } else {
      ApiKeyManager.remove('gemini');
    }

    toast.success('APIキーを保存しました');
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>API設定</DialogTitle>
          <DialogDescription>
            AI生成機能を利用するためのAPIキーを入力してください。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* OpenRouter APIキー */}
          <div className="space-y-2">
            <Label htmlFor="openrouter-key">OpenRouter APIキー</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="openrouter-key"
                  type={showOpenrouterKey ? 'text' : 'password'}
                  value={openrouterKey}
                  onChange={(e) => setOpenrouterKey(e.target.value)}
                  placeholder="sk-or-v1-..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowOpenrouterKey((prev) => !prev)}
                >
                  {showOpenrouterKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              OpenRouterのAPIキーは{' '}
              <a
                href="https://openrouter.ai/keys"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                https://openrouter.ai/keys
              </a>
              から取得できます。
            </p>
          </div>

          {/* Gemini APIキー */}
          <div className="space-y-2">
            <Label htmlFor="gemini-key">Gemini APIキー</Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="gemini-key"
                  type={showGeminiKey ? 'text' : 'password'}
                  value={geminiKey}
                  onChange={(e) => setGeminiKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full"
                  onClick={() => setShowGeminiKey((prev) => !prev)}
                >
                  {showGeminiKey ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
            <p className="text-xs text-muted-foreground">
              Gemini 2.5 Pro Preview TTS で音声生成を行う場合は{' '}
              <a
                href="https://aistudio.google.com/app/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Google AI Studio
              </a>
              から取得した API キーを入力してください。
            </p>
          </div>

          {/* 用途の説明 */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-semibold text-sm">利用範囲</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>・ OpenRouter: シナリオ生成や画像生成などマルチモーダルな AI モデル全般</li>
              <li>・ Gemini: Gemini 2.5 Pro Preview TTS による音声生成</li>
            </ul>
          </div>

          {/* セキュリティ注意 */}
          <div className="rounded-lg bg-muted p-4">
            <p className="text-xs text-muted-foreground">
              <strong>セキュリティに関する注意:</strong> APIキーはブラウザの localStorage に保存されます。
              共有PCでは利用後にキーを削除するか、localStorage をクリアしてください。
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            保存する
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

