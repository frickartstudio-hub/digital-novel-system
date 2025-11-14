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
import { OpenRouterClient, GEMINI_TTS_DEFAULT_MODEL } from '@/lib/OpenRouterClient';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Loader2, Play, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';

const GEMINI_VOICE_OPTIONS = [
  { value: 'Zephyr', label: 'Zephyr', description: 'Bright' },
  { value: 'Puck', label: 'Puck', description: 'Upbeat' },
  { value: 'Charon', label: 'Charon', description: '情報が豊富' },
  { value: 'Kore', label: 'Kore', description: 'Firm' },
  { value: 'Fenrir', label: 'Fenrir', description: 'Excitable' },
  { value: 'Leda', label: 'Leda', description: 'Youthful' },
  { value: 'Orus', label: 'Orus', description: 'Firm' },
  { value: 'Aoede', label: 'Aoede', description: 'Breezy' },
  { value: 'Callirrhoe', label: 'Callirrhoe', description: 'おおらか' },
  { value: 'Autonoe', label: 'Autonoe', description: 'Bright' },
  { value: 'Enceladus', label: 'Enceladus', description: 'Breathy' },
  { value: 'Iapetus', label: 'Iapetus', description: 'クリア' },
  { value: 'Umbriel', label: 'Umbriel', description: 'Easy-going' },
  { value: 'Algieba', label: 'Algieba', description: 'Smooth' },
  { value: 'Despina', label: 'Despina', description: 'Smooth' },
  { value: 'Erinome', label: 'Erinome', description: 'クリア' },
  { value: 'Algenib', label: 'Algenib', description: 'Gravelly' },
  { value: 'Rasalgethi', label: 'Rasalgethi', description: '情報が豊富' },
  { value: 'Laomedeia', label: 'Laomedeia', description: 'アップビート' },
  { value: 'Achernar', label: 'Achernar', description: 'Soft' },
  { value: 'Alnilam', label: 'Alnilam', description: 'Firm' },
  { value: 'Schedar', label: 'Schedar', description: 'Even' },
  { value: 'Gacrux', label: 'Gacrux', description: '成人向け' },
  { value: 'Pulcherrima', label: 'Pulcherrima', description: 'Forward' },
  { value: 'Achird', label: 'Achird', description: 'フレンドリー' },
  { value: 'Zubenelgenubi', label: 'Zubenelgenubi', description: 'Casual' },
  { value: 'Vindemiatrix', label: 'Vindemiatrix', description: 'Gentle' },
  { value: 'Sadachbia', label: 'Sadachbia', description: 'Lively' },
  { value: 'Sadaltager', label: 'Sadaltager', description: '知識が豊富' },
  { value: 'Sulafat', label: 'Sulafat', description: 'Warm' },
];

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
  const [voice, setVoice] = useState(GEMINI_VOICE_OPTIONS[0].value);

  // 初期テキストを反映
  useState(() => {
    if (initialText) {
      setText(initialText);
    }
  });

  useEffect(() => {
    if (audioRef.current && generatedAudio) {
      audioRef.current.load();
    }
  }, [generatedAudio]);

  // 生成
  const handleGenerate = async () => {
    if (!text.trim()) {
      toast.error('テキストを入力してください');
      return;
    }

    if (!ApiKeyManager.has('gemini')) {
      toast.error('Gemini APIキーが設定されていません');
      return;
    }

    setIsGenerating(true);
    setGeneratedAudio(null);

    try {
      const audioDataUrl = await OpenRouterClient.generateSpeech(
        text,
        GEMINI_TTS_DEFAULT_MODEL,
        voice,
      );
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
  const handlePlay = async () => {
    if (!audioRef.current || !generatedAudio) return;

    try {
      await audioRef.current.play();
    } catch (error) {
      console.error('Failed to play generated audio:', error);
      toast.error('音声の再生に失敗しました: ' + (error as Error).message);
    }
  };

  // 使用
  const handleUse = () => {
    if (!generatedAudio) return;

    const timestamp = Date.now();
    const filePath = `/audio/ai_generated_${timestamp}.mp3`;
    localStorage.setItem(`file_${filePath}`, generatedAudio);

    onGenerated(filePath);
    toast.success('音声を追加しました');
    onOpenChange(false);

    setText('');
    setGeneratedAudio(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>AI音声生成（TTS）</DialogTitle>
          <DialogDescription>
            Gemini 2.5 Pro Preview TTS（Gemini APIキー必須）でテキストを音声化します。
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
              placeholder="これは、ある小さな町で起きた物語です..."
              rows={6}
            />
            <p className="text-xs text-muted-foreground">
              日本語・英語どちらでも入力できます。
            </p>
          </div>

          {/* 音声モデル選択 */}
          <div className="space-y-2">
            <Label htmlFor="voice">ボイスモデル</Label>
            <Select value={voice} onValueChange={setVoice}>
              <SelectTrigger id="voice">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {GEMINI_VOICE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex flex-col">
                      <span className="font-medium">{option.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
