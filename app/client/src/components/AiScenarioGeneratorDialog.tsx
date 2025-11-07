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
import { OpenRouterClient, RECOMMENDED_MODELS } from '@/lib/OpenRouterClient';
import type { ScenarioData } from '@/types/novel';
import { Loader2, Sparkles } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface AiScenarioGeneratorDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerated: (scenario: ScenarioData) => void;
}

export function AiScenarioGeneratorDialog({
  open,
  onOpenChange,
  onGenerated,
}: AiScenarioGeneratorDialogProps) {
  const [theme, setTheme] = useState('');
  const [genre, setGenre] = useState('ファンタジー');
  const [sceneCount, setSceneCount] = useState(5);
  const [model, setModel] = useState('anthropic/claude-3.5-sonnet');
  const [isGenerating, setIsGenerating] = useState(false);

  // 生成
  const handleGenerate = async () => {
    if (!theme.trim()) {
      toast.error('テーマを入力してください');
      return;
    }

    if (!ApiKeyManager.has('openrouter')) {
      toast.error('OpenRouter APIキーが設定されていません');
      return;
    }

    setIsGenerating(true);

    try {
      const prompt = `あなたはデジタルノベルのシナリオライターです。以下の条件でシナリオを作成してください。

テーマ: ${theme}
ジャンル: ${genre}
シーン数: ${sceneCount}

以下のJSON形式で出力してください:

\`\`\`json
{
  "metadata": {
    "title": "作品タイトル",
    "author": "AI Generated",
    "description": "作品の説明",
    "genre": "${genre}",
    "rating": "全年齢"
  },
  "scenes": [
    {
      "id": 1,
      "type": "image",
      "source": "/images/scene1.jpg",
      "duration": 5000,
      "audio": {
        "voice": "/audio/voice/scene1.mp3",
        "bgm": "/audio/bgm/theme.mp3"
      },
      "subtitles": [
        {
          "speaker": "ナレーター",
          "text": "字幕テキスト",
          "start": 0,
          "end": 3000
        }
      ],
      "backgroundPrompt": "Detailed description of the background image in English",
      "transition": {
        "type": "fade",
        "duration": 500
      }
    }
  ]
}
\`\`\`

  重要な注意事項:
  - 各シーンの背景描写は "backgroundPrompt" フィールドに英語で記載してください
  - 字幕は日本語で、自然な会話や説明文にしてください
  - シーンの長さ（duration）は字幕の内容に応じて適切に設定してください
  - JSON形式のみを出力し、余計な説明は不要です`;

      const response = await OpenRouterClient.chat(
        [
          {
            role: 'system',
            content: 'あなたは優秀なデジタルノベルのシナリオライターです。JSON形式でシナリオを出力してください。',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        model,
        {
          temperature: 0.8,
          max_tokens: 4000,
        }
      );

      // JSONを抽出
      const jsonMatch = response.match(/```json\n([\s\S]+?)\n```/) || response.match(/```\n([\s\S]+?)\n```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : response;

      const scenario: ScenarioData = JSON.parse(jsonStr);

      // 生成されたシナリオを親コンポーネントに渡す
      onGenerated(scenario);
      toast.success('シナリオを生成しました');
      onOpenChange(false);

      // リセット
      setTheme('');
    } catch (error) {
      console.error('Failed to generate scenario:', error);
      toast.error('シナリオの生成に失敗しました: ' + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>AIシナリオ生成</DialogTitle>
          <DialogDescription>
            AIを使用してデジタルノベルのシナリオを自動生成します
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* テーマ */}
          <div className="space-y-2">
            <Label htmlFor="theme">テーマ・ストーリー概要</Label>
            <Textarea
              id="theme"
              value={theme}
              onChange={(e) => setTheme(e.target.value)}
              placeholder="例: 小さな町で起きた不思議な出来事を巡る少年の冒険"
              rows={3}
            />
          </div>

          {/* ジャンル */}
          <div className="space-y-2">
            <Label htmlFor="genre">ジャンル</Label>
            <Select value={genre} onValueChange={setGenre}>
              <SelectTrigger id="genre">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ファンタジー">ファンタジー</SelectItem>
                <SelectItem value="SF">SF</SelectItem>
                <SelectItem value="ミステリー">ミステリー</SelectItem>
                <SelectItem value="恋愛">恋愛</SelectItem>
                <SelectItem value="ホラー">ホラー</SelectItem>
                <SelectItem value="日常">日常</SelectItem>
                <SelectItem value="歴史">歴史</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* シーン数 */}
          <div className="space-y-2">
            <Label htmlFor="sceneCount">シーン数</Label>
            <Input
              id="sceneCount"
              type="number"
              value={sceneCount}
              onChange={(e) => setSceneCount(parseInt(e.target.value))}
              min={3}
              max={20}
            />
            <p className="text-xs text-muted-foreground">
              3〜20シーンの範囲で設定してください
            </p>
          </div>

          {/* モデル選択 */}
          <div className="space-y-2">
            <Label htmlFor="model">AIモデル</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(RECOMMENDED_MODELS.text).map(([name, value]) => (
                  <SelectItem key={value} value={value}>
                    {name}
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
                シナリオを生成
              </>
            )}
          </Button>

          {/* 注意事項 */}
          <div className="rounded-lg bg-muted p-4">
            <p className="text-xs text-muted-foreground">
              <strong>注意:</strong> 生成されたシナリオには画像や音声ファイルのパスが含まれますが、
              実際のファイルは別途用意する必要があります。AI生成機能を使用して画像や音声を作成できます。
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
