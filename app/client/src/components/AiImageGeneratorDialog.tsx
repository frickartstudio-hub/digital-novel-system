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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ApiKeyManager } from '@/lib/ApiKeyManager';
import { FileLoader } from '@/lib/FileLoader';
import { OpenRouterClient, RECOMMENDED_MODELS } from '@/lib/OpenRouterClient';
import { Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AiImageGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (path: string) => void;
}

export function AiImageGeneratorDialog({
  open,
  onOpenChange,
  onGenerated,
}: AiImageGeneratorDialogProps) {
  const [prompt, setPrompt] = useState('');
  const [model, setModel] = useState('black-forest-labs/flux-schnell-free');
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);

  // 生成
  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error('プロンプトを入力してください');
      return;
    }

    if (!ApiKeyManager.has('openrouter')) {
      toast.error('OpenRouter APIキーが設定されていません');
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      const imageUrl = await OpenRouterClient.generateImage(prompt, model, {
        width,
        height,
      });

      // 画像をダウンロードしてBase64に変換
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const reader = new FileReader();

      reader.onload = () => {
        const dataUrl = reader.result as string;
        setGeneratedImage(dataUrl);
        toast.success('画像を生成しました');
      };

      reader.readAsDataURL(blob);
    } catch (error) {
      console.error('Failed to generate image:', error);
      toast.error('画像の生成に失敗しました: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 使用
  const handleUse = () => {
    if (!generatedImage) return;

    // ファイルパスを生成
    const timestamp = Date.now();
    const filePath = `/images/ai_generated_${timestamp}.png`;

    // localStorageに保存
    localStorage.setItem(`file_${filePath}`, generatedImage);

    // 親コンポーネントに通知
    onGenerated(filePath);
    toast.success('画像を追加しました');
    onOpenChange(false);

    // リセット
    setPrompt('');
    setGeneratedImage(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI画像生成</DialogTitle>
          <DialogDescription>
            OpenRouterを使用して背景画像を生成します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* プロンプト */}
          <div className="space-y-2">
            <Label htmlFor="prompt">プロンプト</Label>
            <Textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="例: A peaceful morning scene in a small Japanese town, anime style, detailed background"
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              英語で記述すると高品質な画像が生成されます
            </p>
          </div>

          {/* モデル選択 */}
          <div className="space-y-2">
            <Label htmlFor="model">モデル</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RECOMMENDED_MODELS.image).map(([name, value]) => (
                  <SelectItem key={value} value={value}>
                    {name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* サイズ設定 */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">幅</Label>
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value))}
                min={512}
                max={2048}
                step={64}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="height">高さ</Label>
              <Input
                id="height"
                type="number"
                value={height}
                onChange={(e) => setHeight(parseInt(e.target.value))}
                min={512}
                max={2048}
                step={64}
              />
            </div>
          </div>

          {/* 生成ボタン */}
          <Button
            onClick={handleGenerate}
            disabled={isGenerating}
            className="w-full"
          >
            {isGenerating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                生成中...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-4 w-4" />
                生成
              </>
            )}
          </Button>

          {/* プレビュー */}
          {generatedImage && (
            <div className="space-y-2">
              <Label>生成された画像</Label>
              <div className="rounded-lg border overflow-hidden">
                <img
                  src={generatedImage}
                  alt="Generated"
                  className="w-full h-auto"
                />
              </div>
              <Button onClick={handleUse} className="w-full">
                この画像を使用
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
