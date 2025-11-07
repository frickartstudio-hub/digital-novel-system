import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ApiKeyManager } from '@/lib/ApiKeyManager';
import { OpenRouterClient } from '@/lib/OpenRouterClient';
import { Loader2, Play, Sparkles } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface AiVoiceGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (path: string) => void;
  initialText?: string;
}

export function AiVoiceGeneratorDialog({
  open,
  onOpenChange,
  onGenerated,
  initialText = '',
}: AiVoiceGeneratorDialogProps) {
  const [text, setText] = useState(initialText);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedAudio, setGeneratedAudio] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);

  // テキストを初期化
  useState(() => {
    if (initialText) {
      setText(initialText);
    }
  });

  // 生成
  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('テキストを入力してください');
      return;
    }

    if (!ApiKeyManager.has('openrouter')) {
      toast.error('OpenRouter APIキーが設定されていません');
      return;
    }

    setIsGenerating(true);
    setGeneratedAudio(null);

    try {
      const audioDataUrl = await OpenRouterClient.generateSpeech(text);
      setGeneratedAudio(audioDataUrl);
      toast.success('音声を生成しました');
    } catch (error) {
      console.error('Failed to generate voice:', error);
      toast.error('音声の生成に失敗しました: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  // 再生
  const handlePlay = () => {
    if (audioRef.current && generatedAudio) {
      audioRef.current.play();
    }
  };

  // 使用
  const handleUse = () => {
    if (!generatedAudio) return;

    // ファイルパスを生成
    const timestamp = Date.now();
    const filePath = `/audio/ai_generated_${timestamp}.mp3`;

    // localStorageに保存
    localStorage.setItem(`file_${filePath}`, generatedAudio);

    // 親コンポーネントに通知
    onGenerated(filePath);
    toast.success('音声を追加しました');
    onOpenChange(false);

    // リセット
    setText('');
    setGeneratedAudio(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>AI音声生成（TTS）</DialogTitle>
          <DialogDescription>
            Gemini 2.5 Pro Preview TTSを使用して音声を生成します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* テキスト入力 */}
          <div className="space-y-2">
            <Label htmlFor="text">テキスト</Label>
            <Textarea
              id="text"
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder="これは、ある小さな町で起きた物語です。"
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              日本語・英語に対応しています
            </p>
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
          {generatedAudio && (
            <div className="space-y-2">
              <Label>生成された音声</Label>
              <div className="flex gap-2">
                <Button onClick={handlePlay} variant="outline" className="flex-1">
                  <Play className="mr-2 h-4 w-4" />
                  再生
                </Button>
                <Button onClick={handleUse} className="flex-1">
                  この音声を使用
                </Button>
              </div>
              <audio ref={audioRef} src={generatedAudio} className="hidden" />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
