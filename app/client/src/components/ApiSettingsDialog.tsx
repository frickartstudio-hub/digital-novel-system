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
  const [showKey, setShowKey] = useState(false);

  // 初期化時にAPIキーを読み込む
  useEffect(() => {
    if (open) {
      const key = ApiKeyManager.get('openrouter');
      setOpenrouterKey(key || '');
    }
  }, [open]);

  // 保存
  const handleSave = () => {
    if (openrouterKey.trim()) {
      ApiKeyManager.set('openrouter', openrouterKey.trim());
      toast.success('APIキーを保存しました');
      onOpenChange(false);
    } else {
      toast.error('APIキーを入力してください');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>API設定</DialogTitle>
          <DialogDescription>
            AI生成機能を使用するためのAPIキーを設定してください
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
                  type={showKey ? 'text' : 'password'}
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
                  onClick={() => setShowKey(!showKey)}
                >
                  {showKey ? (
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
                こちら
              </a>
              から取得できます
            </p>
          </div>

          {/* 使用可能な機能の説明 */}
          <div className="rounded-lg border p-4 space-y-2">
            <h4 className="font-semibold text-sm">使用可能な機能</h4>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• シナリオ自動生成（GPT-4、Claude、Geminiなど）</li>
              <li>• 背景画像生成（Flux、DALL-E、Stable Diffusionなど）</li>
              <li>• 音声生成（TTS対応モデル）</li>
            </ul>
          </div>

          {/* セキュリティに関する注意 */}
          <div className="rounded-lg bg-muted p-4">
            <p className="text-xs text-muted-foreground">
              <strong>セキュリティについて:</strong> APIキーはブラウザのlocalStorageに保存されます。
              共有PCでは使用後にAPIキーを削除することを推奨します。
            </p>
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            保存
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
