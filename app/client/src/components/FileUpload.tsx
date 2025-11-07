import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Sparkles } from 'lucide-react';
import { AiImageGeneratorDialog } from './AiImageGeneratorDialog';
import { AiVoiceGeneratorDialog } from './AiVoiceGeneratorDialog';
import { useRef, useState } from 'react';
import { toast } from 'sonner';

interface FileUploadProps {
  label: string;
  accept: string;
  value: string;
  onChange: (path: string) => void;
  type: 'image' | 'video' | 'audio';
}

export function FileUpload({ label, accept, value, onChange, type }: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [aiVoiceGeneratorOpen, setAiVoiceGeneratorOpen] = useState(false);

  // ファイルタイプに応じたディレクトリを取得
  const getDirectory = () => {
    switch (type) {
      case 'image':
        return 'images';
      case 'video':
        return 'videos';
      case 'audio':
        return 'audio';
    }
  };

  // ファイルアップロード処理
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      // ファイルサイズチェック（10MB制限）
      const maxSize = 10 * 1024 * 1024; // 10MB
      if (file.size > maxSize) {
        toast.error('ファイルサイズが大きすぎます（最大10MB）');
        return;
      }

      // ファイル名をサニタイズ（スペースやマルチバイト文字を置換）
      const sanitizedName = file.name
        .replace(/\s+/g, '_')
        .replace(/[^\w\-\.]/g, '')
        .toLowerCase();

      // タイムスタンプを追加してユニークなファイル名を生成
      const timestamp = Date.now();
      const extension = sanitizedName.split('.').pop();
      const nameWithoutExt = sanitizedName.replace(`.${extension}`, '');
      const uniqueName = `${nameWithoutExt}_${timestamp}.${extension}`;

      // ファイルパスを生成
      const directory = getDirectory();
      const filePath = `/${directory}/${uniqueName}`;

      // FileReaderでファイルを読み込み、Base64に変換
      const reader = new FileReader();
      reader.onload = async (e) => {
        const dataUrl = e.target?.result as string;

        // localStorageに保存（実際のアプリケーションではサーバーにアップロード）
        // ここでは簡易的にlocalStorageを使用
        try {
          localStorage.setItem(`file_${filePath}`, dataUrl);
          
          // プレビュー用にデータURLを保存
          if (type === 'image') {
            setPreview(dataUrl);
          }

          // パスを親コンポーネントに通知
          onChange(filePath);
          toast.success('ファイルをアップロードしました');
        } catch (error) {
          console.error('Failed to save file:', error);
          toast.error('ファイルの保存に失敗しました（サイズが大きすぎる可能性があります）');
        }
      };

      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Failed to upload file:', error);
      toast.error('ファイルのアップロードに失敗しました');
    }
  };

  // パスのクリア
  const handleClear = () => {
    onChange('');
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // 既存のパスからプレビューを読み込む
  const loadPreview = () => {
    if (value && type === 'image') {
      const storedFile = localStorage.getItem(`file_${value}`);
      if (storedFile) {
        setPreview(storedFile);
      }
    }
  };

  // 初回レンダリング時にプレビューを読み込む
  useState(() => {
    loadPreview();
  });

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`/${getDirectory()}/example.${type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'mp3'}`}
          className="flex-1"
        />
        {type === 'image' && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setAiGeneratorOpen(true)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            AI生成
          </Button>
        )}
        {type === 'audio' && (
          <Button
            type="button"
            variant="outline"
            onClick={() => setAiVoiceGeneratorOpen(true)}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            AI生成
          </Button>
        )}
        <Button
          type="button"
          variant="outline"
          onClick={() => fileInputRef.current?.click()}
        >
          <Upload className="mr-2 h-4 w-4" />
          アップロード
        </Button>
        {value && (
          <Button type="button" variant="ghost" size="icon" onClick={handleClear}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={handleFileChange}
      />
      {type === 'image' && (
        <AiImageGeneratorDialog
          open={aiGeneratorOpen}
          onOpenChange={setAiGeneratorOpen}
          onGenerated={(path) => {
            onChange(path);
            const storedFile = localStorage.getItem(`file_${path}`);
            if (storedFile) {
              setPreview(storedFile);
            }
          }}
        />
      )}
      {type === 'audio' && (
        <AiVoiceGeneratorDialog
          open={aiVoiceGeneratorOpen}
          onOpenChange={setAiVoiceGeneratorOpen}
          onGenerated={(path) => {
            onChange(path);
          }}
        />
      )}
      {preview && type === 'image' && (
        <div className="mt-2">
          <img
            src={preview}
            alt="Preview"
            className="max-w-full h-auto max-h-40 rounded-lg border"
          />
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {type === 'image' && '推奨: JPEG/PNG、1920×1080、500KB以下'}
        {type === 'video' && '推奨: MP4（H.264）、1920×1080、5Mbps以下'}
        {type === 'audio' && '推奨: MP3、128kbps'}
      </p>
    </div>
  );
}
