import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { FileUpload } from '@/components/FileUpload';
import type { Scene, Subtitle } from '@/types/novel';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

interface SceneEditFormProps {
  scene: Scene;
  onUpdate: (scene: Scene) => void;
}

export function SceneEditForm({ scene, onUpdate }: SceneEditFormProps) {
  const updateField = (field: keyof Scene, value: any) => {
    onUpdate({
      ...scene,
      [field]: value,
    });
  };

  const updateAudio = (field: 'voice' | 'bgm' | 'se', value: string) => {
    onUpdate({
      ...scene,
      audio: {
        ...scene.audio,
        [field]: value || undefined,
      },
    });
  };

  const addSubtitle = () => {
    const newSubtitle: Subtitle = {
      speaker: '',
      text: '',
      start: 0,
      end: 3000,
    };

    onUpdate({
      ...scene,
      subtitles: [...scene.subtitles, newSubtitle],
    });

    toast.success('字幕を追加しました');
  };

  const updateSubtitle = (index: number, field: keyof Subtitle, value: any) => {
    const newSubtitles = [...scene.subtitles];
    newSubtitles[index] = {
      ...newSubtitles[index],
      [field]: value,
    };

    onUpdate({
      ...scene,
      subtitles: newSubtitles,
    });
  };

  const deleteSubtitle = (index: number) => {
    onUpdate({
      ...scene,
      subtitles: scene.subtitles.filter((_, i) => i !== index),
    });

    toast.success('字幕を削除しました');
  };

  return (
    <div className="space-y-6">
      {/* 基本設定 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">基本設定</h3>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="type">メディアタイプ</Label>
            <Select
              value={scene.type}
              onValueChange={(value) => updateField('type', value as 'image' | 'video')}
            >
              <SelectTrigger id="type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="image">画像</SelectItem>
                <SelectItem value="video">動画</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="duration">表示時間（ミリ秒）</Label>
            <Input
              id="duration"
              type="number"
              value={scene.duration}
              onChange={(e) => updateField('duration', parseInt(e.target.value))}
              placeholder="5000"
            />
          </div>
        </div>

        <FileUpload
          label="メディアファイル"
          accept={scene.type === 'image' ? 'image/*' : 'video/*'}
          value={scene.source}
          onChange={(path) => updateField('source', path)}
          type={scene.type === 'image' ? 'image' : 'video'}
        />
      </div>

      {/* 音声設定 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">音声設定</h3>

        <FileUpload
          label="ボイス"
          accept="audio/*"
          value={scene.audio.voice || ''}
          onChange={(path) => updateAudio('voice', path)}
          type="audio"
        />

        <FileUpload
          label="BGM"
          accept="audio/*"
          value={scene.audio.bgm || ''}
          onChange={(path) => updateAudio('bgm', path)}
          type="audio"
        />

        <FileUpload
          label="効果音"
          accept="audio/*"
          value={scene.audio.se || ''}
          onChange={(path) => updateAudio('se', path)}
          type="audio"
        />
      </div>

      {/* 字幕設定 */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">字幕設定</h3>
          <Button onClick={addSubtitle} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            字幕を追加
          </Button>
        </div>

        {scene.subtitles.length === 0 ? (
          <p className="text-sm text-muted-foreground">字幕がありません。追加してください。</p>
        ) : (
          <div className="space-y-4">
            {scene.subtitles.map((subtitle, index) => (
              <div key={index} className="rounded-lg border p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">字幕 {index + 1}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteSubtitle(index)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`speaker-${index}`}>話者名</Label>
                  <Input
                    id={`speaker-${index}`}
                    value={subtitle.speaker}
                    onChange={(e) => updateSubtitle(index, 'speaker', e.target.value)}
                    placeholder="キャラクター名"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor={`text-${index}`}>テキスト</Label>
                  <Textarea
                    id={`text-${index}`}
                    value={subtitle.text}
                    onChange={(e) => updateSubtitle(index, 'text', e.target.value)}
                    placeholder="字幕のテキスト"
                    rows={2}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor={`start-${index}`}>開始時刻（ms）</Label>
                    <Input
                      id={`start-${index}`}
                      type="number"
                      value={subtitle.start}
                      onChange={(e) => updateSubtitle(index, 'start', parseInt(e.target.value))}
                      placeholder="0"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor={`end-${index}`}>終了時刻（ms）</Label>
                    <Input
                      id={`end-${index}`}
                      type="number"
                      value={subtitle.end}
                      onChange={(e) => updateSubtitle(index, 'end', parseInt(e.target.value))}
                      placeholder="3000"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* トランジション設定 */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">トランジション設定</h3>

        <div className="space-y-2">
          <Label htmlFor="effect">トランジション効果</Label>
          <Select
            value={scene.transitions.effect || 'fade'}
            onValueChange={(value) =>
              updateField('transitions', {
                ...scene.transitions,
                effect: value as 'fade' | 'slide' | 'none',
              })
            }
          >
            <SelectTrigger id="effect">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fade">フェード</SelectItem>
              <SelectItem value="slide">スライド</SelectItem>
              <SelectItem value="none">なし</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
    </div>
  );
}
