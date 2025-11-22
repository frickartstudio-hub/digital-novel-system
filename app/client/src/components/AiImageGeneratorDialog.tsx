import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ApiKeyManager } from "@/lib/ApiKeyManager";
import { NanobananaClient, NANOBANANA_MODELS } from "@/lib/NanobananaClient";
import { Loader2, Sparkles, Upload, X } from "lucide-react";
import { useMemo, useState, useRef } from "react";
import { toast } from "sonner";

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
  const [prompt, setPrompt] = useState("");
  const modelOptions = useMemo(() => Object.values(NANOBANANA_MODELS), []);
  const [model, setModel] = useState(modelOptions[0] ?? "");
  const [width, setWidth] = useState(1024);
  const [height, setHeight] = useState(1024);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReferenceImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("画像ファイルを選択してください");
      return;
    }

    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      toast.error("ファイルサイズが5MBを超えています");
      return;
    }

    setReferenceImage(file);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      setReferenceImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveReferenceImage = () => {
    setReferenceImage(null);
    setReferenceImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast.error("プロンプトを入力してください");
      return;
    }

    const hasKey =
      ApiKeyManager.has("nanobanana") || ApiKeyManager.has("gemini");
    if (!hasKey) {
      toast.error("Gemini APIキーを設定してください");
      return;
    }

    setIsGenerating(true);
    setGeneratedImage(null);

    try {
      let imageResult: string;
      
      if (referenceImage) {
        // リファレンス画像を使用して画像生成
        imageResult = await NanobananaClient.editImageWithPrompt(referenceImage, prompt);
      } else {
        // 通常の画像生成
        imageResult = await NanobananaClient.generateImage(prompt, {
          model: model || undefined,
          width,
          height,
        });
      }

      if (imageResult.startsWith("data:")) {
        setGeneratedImage(imageResult);
        toast.success("画像を生成しました");
        return;
      }

      const response = await fetch(imageResult);
      const blob = await response.blob();
      const reader = new FileReader();
      reader.onload = () => {
        setGeneratedImage(reader.result as string);
        toast.success("画像を生成しました");
      };
      reader.readAsDataURL(blob);
    } catch (error) {
      console.error("Failed to generate image:", error);
      toast.error("画像の生成に失敗しました: " + (error as Error).message);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleUse = () => {
    if (!generatedImage) return;

    const timestamp = Date.now();
    const filePath = `/images/ai_generated_${timestamp}.png`;
    try {
      localStorage.setItem(`file_${filePath}`, generatedImage);
    } catch (error) {
      console.error("Failed to store generated image:", error);
      toast.error("ストレージ容量が不足しています。ダウンロードして保存してください。");
      return;
    }

    onGenerated(filePath);
    toast.success("画像を追加しました");
    onOpenChange(false);

    setPrompt("");
    setGeneratedImage(null);
    setReferenceImage(null);
    setReferenceImagePreview(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>AI画像生成（Gemini）</DialogTitle>
          <DialogDescription>
            Gemini 画像エンドポイントで背景画像を生成します。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
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
              英語で記述すると高品質な画像が得やすくなります。
            </p>
          </div>

          <div className="space-y-2">
            <Label>リファレンス画像（オプション）</Label>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1"
              >
                <Upload className="mr-2 h-4 w-4" />
                画像を選択
              </Button>
              {referenceImage && (
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={handleRemoveReferenceImage}
                >
                  <X className="h-4 w-4" />
                </Button>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleReferenceImageChange}
            />
            {referenceImagePreview && (
              <div className="mt-2">
                <Label className="text-xs text-muted-foreground">プレビュー</Label>
                <div className="mt-1 rounded-lg border overflow-hidden">
                  <img
                    src={referenceImagePreview}
                    alt="Reference"
                    className="w-full h-auto max-h-32 object-cover"
                  />
                </div>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              リファレンス画像をアップロードすると、その画像を元に新しい画像を生成します。
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="model">モデル</Label>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger id="model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(NANOBANANA_MODELS).map(([label, value]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="width">幅</Label>
              <Input
                id="width"
                type="number"
                value={width}
                onChange={(e) => setWidth(parseInt(e.target.value, 10))}
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
                onChange={(e) => setHeight(parseInt(e.target.value, 10))}
                min={512}
                max={2048}
                step={64}
              />
            </div>
          </div>

          <Button onClick={handleGenerate} disabled={isGenerating} className="w-full">
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

          {generatedImage && (
            <div className="space-y-2">
              <Label>生成された画像</Label>
              <div className="rounded-lg border overflow-hidden">
                <img src={generatedImage} alt="Generated" className="w-full h-auto" />
              </div>
              <div className="flex flex-col gap-2 sm:flex-row">
                <Button onClick={handleUse} className="flex-1">
                  この画像を使用
                </Button>
                <a
                  href={generatedImage}
                  download="ai_generated_image.png"
                  className="flex-1"
                >
                  <Button type="button" variant="outline" className="w-full">
                    ダウンロード
                  </Button>
                </a>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
