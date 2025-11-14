import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Sparkles } from 'lucide-react';
import { AiImageGeneratorDialog } from './AiImageGeneratorDialog';
import { AiVoiceGeneratorDialog } from './AiVoiceGeneratorDialog';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { uploadMedia } from '@/lib/mediaApi';
import { getApiAssetUrl } from '@/lib/apiClient';

interface FileUploadProps {
  label: string;
  accept: string;
  value: string;
  onChange: (path: string) => void;
  type: 'image' | 'video' | 'audio';
}

export function FileUpload({
  label,
  accept,
  value,
  onChange,
  type,
}: FileUploadProps) {
  const [preview, setPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [aiGeneratorOpen, setAiGeneratorOpen] = useState(false);
  const [aiVoiceGeneratorOpen, setAiVoiceGeneratorOpen] = useState(false);
  const tempObjectUrlRef = useRef<string | null>(null);

  const getDirectory = useCallback(() => {
    switch (type) {
      case 'image':
        return 'images';
      case 'video':
        return 'videos';
      case 'audio':
        return 'audio';
    }
  }, [type]);

  const isRemotePath = (path: string) => {
    return /^https?:\/\//.test(path) || path.startsWith('/uploads/');
  };

  const updatePreviewFromFile = (file: File) => {
    if (tempObjectUrlRef.current) {
      URL.revokeObjectURL(tempObjectUrlRef.current);
    }
    const objectUrl = URL.createObjectURL(file);
    tempObjectUrlRef.current = objectUrl;
    setPreview(objectUrl);
  };

  const saveToLocalFallback = async (file: File) => {
    const sanitizedName = file.name
      .replace(/\s+/g, '_')
      .replace(/[^\w\-\.]/g, '')
      .toLowerCase();
    const timestamp = Date.now();
    const extension = sanitizedName.split('.').pop();
    const nameWithoutExt = sanitizedName.replace(`.${extension}`, '');
    const directory = getDirectory();
    const uniqueName = `${nameWithoutExt}_${timestamp}.${extension}`;
    const filePath = `/${directory}/${uniqueName}`;

    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target?.result as string;
      try {
        localStorage.setItem(`file_${filePath}`, dataUrl);
        setPreview(dataUrl);
        onChange(filePath);
        toast.success('ローカルに保存しました。シナリオの参照パスを更新しました。');
      } catch (error) {
        console.error('Failed to save file locally:', error);
        toast.error('ローカル保存に失敗しました。');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('ファイルサイズが 10MB を超えています。');
      return;
    }

    try {
      const response = await uploadMedia({
        file,
        mediaType: type,
      });

      updatePreviewFromFile(file);
      onChange(response.mediaUrl);
      toast.success('アップロードが完了しました。');
    } catch (error) {
      console.error(
        'Failed to upload via API, falling back to localStorage:',
        error,
      );
      toast.error('アップロードに失敗したためローカル保存へ切り替えました。');
      await saveToLocalFallback(file);
    }
  };

  const handleClear = () => {
    onChange('');
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (!value) {
      setPreview(null);
      return;
    }

    if (isRemotePath(value)) {
      setPreview(getApiAssetUrl(value));
      return;
    }

    const stored = localStorage.getItem(`file_${value}`);
    if (stored) {
      setPreview(stored);
      return;
    }

    setPreview(value.startsWith('/') ? value : `/${value}`);
  }, [value]);

  useEffect(() => {
    return () => {
      if (tempObjectUrlRef.current) {
        URL.revokeObjectURL(tempObjectUrlRef.current);
      }
    };
  }, []);

  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex gap-2">
        <Input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={`/${getDirectory()}/example.${
            type === 'image' ? 'jpg' : type === 'video' ? 'mp4' : 'mp3'
          }`}
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
          ファイル選択
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
      {preview && (
        <div className="mt-2 space-y-2">
          {type === 'image' && (
            <img
              src={preview}
              alt="Preview"
              className="max-w-full h-auto max-h-40 rounded-lg border"
            />
          )}
          {type === 'video' && (
            <video
              controls
              className="w-full max-h-60 rounded-lg border bg-black"
              src={preview}
            />
          )}
          {type === 'audio' && (
            <audio controls className="w-full" src={preview}>
              ブラウザが音声プレビューをサポートしていません。
            </audio>
          )}
        </div>
      )}
      <p className="text-xs text-muted-foreground">
        {type === 'image' && '推奨: JPEG/PNG, 1920x1080, 500KB 程度'}
        {type === 'video' && '推奨: MP4 (H.264), 1920x1080, 5Mbps 程度'}
        {type === 'audio' && '推奨: MP3, 128kbps'}
      </p>
    </div>
  );
}

