import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Scene, ScenarioData } from '@/types/novel';
import { Download, Eye, FileJson, Plus, Trash2, Upload } from 'lucide-react';
import { useRef, useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { SceneEditForm } from '@/components/SceneEditForm';
import { ApiSettingsDialog } from '@/components/ApiSettingsDialog';
import { AiScenarioGeneratorDialog } from '@/components/AiScenarioGeneratorDialog';
import { Settings, Sparkles } from 'lucide-react';

export default function ScenarioEditor() {
  const [, setLocation] = useLocation();
  const [scenario, setScenario] = useState<ScenarioData>({
    title: '新しいシナリオ',
    author: '',
    version: '1.0',
    description: '',
    scenes: [],
    metadata: {
      totalScenes: 0,
      estimatedDuration: 0,
      tags: [],
      rating: '全年齢',
    },
  });

  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [apiSettingsOpen, setApiSettingsOpen] = useState(false);
  const [aiScenarioGeneratorOpen, setAiScenarioGeneratorOpen] = useState(false);

  // メタデータの更新
  const updateMetadata = (field: string, value: string) => {
    setScenario((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // シーンの追加
  const addScene = () => {
    const newScene: Scene = {
      id: scenario.scenes.length + 1,
      type: 'image',
      source: '',
      duration: 5000,
      audio: {},
      subtitles: [],
      transitions: {
        nextSceneId: null,
        effect: 'fade',
      },
    };

    setScenario((prev) => ({
      ...prev,
      scenes: [...prev.scenes, newScene],
      metadata: {
        ...prev.metadata!,
        totalScenes: prev.scenes.length + 1,
      },
    }));

    setSelectedSceneIndex(scenario.scenes.length);
    toast.success('新しいシーンを追加しました');
  };

  // シーンの削除
  const deleteScene = (index: number) => {
    setScenario((prev) => {
      const newScenes = prev.scenes.filter((_, i) => i !== index);
      // IDを再割り当て
      const reindexedScenes = newScenes.map((scene, i) => ({
        ...scene,
        id: i + 1,
        transitions: {
          ...scene.transitions,
          nextSceneId: i < newScenes.length - 1 ? i + 2 : null,
        },
      }));

      return {
        ...prev,
        scenes: reindexedScenes,
        metadata: {
          ...prev.metadata!,
          totalScenes: reindexedScenes.length,
        },
      };
    });

    setSelectedSceneIndex(null);
    toast.success('シーンを削除しました');
  };

  // JSONエクスポート
  const exportJSON = () => {
    const json = JSON.stringify(scenario, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'scenario.json';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('JSONファイルをダウンロードしました');
  };

  // JSONインポート
  const importJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setScenario(json);
        setSelectedSceneIndex(null);
        toast.success('JSONファイルを読み込みました');
      } catch (error) {
        console.error('Failed to parse JSON:', error);
        toast.error('JSONファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
  };

  // プレビュー
  const preview = () => {
    // シナリオをlocalStorageに保存
    localStorage.setItem('preview_scenario', JSON.stringify(scenario));
    // プレビューページに遷移
    setLocation('/preview');
  };

  return (
    <div className="min-h-screen bg-background">
      {/* ヘッダー */}
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <FileJson className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">シナリオエディター</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setAiScenarioGeneratorOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              AI生成
            </Button>
            <Button variant="outline" onClick={() => setApiSettingsOpen(true)}>
              <Settings className="mr-2 h-4 w-4" />
              API設定
            </Button>
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="mr-2 h-4 w-4" />
              インポート
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={importJSON}
            />
            <Button variant="outline" onClick={exportJSON}>
              <Download className="mr-2 h-4 w-4" />
              エクスポート
            </Button>
            <Button onClick={preview}>
              <Eye className="mr-2 h-4 w-4" />
              プレビュー
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* 左側: メタデータとシーン一覧 */}
          <div className="space-y-6 lg:col-span-1">
            {/* メタデータ編集 */}
            <Card>
              <CardHeader>
                <CardTitle>作品情報</CardTitle>
                <CardDescription>シナリオの基本情報を入力してください</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">タイトル</Label>
                  <Input
                    id="title"
                    value={scenario.title}
                    onChange={(e) => updateMetadata('title', e.target.value)}
                    placeholder="作品のタイトル"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">作者名</Label>
                  <Input
                    id="author"
                    value={scenario.author || ''}
                    onChange={(e) => updateMetadata('author', e.target.value)}
                    placeholder="作者名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">説明</Label>
                  <Textarea
                    id="description"
                    value={scenario.description || ''}
                    onChange={(e) => updateMetadata('description', e.target.value)}
                    placeholder="作品の説明"
                    rows={3}
                  />
                </div>
                <div className="text-sm text-muted-foreground">
                  総シーン数: {scenario.scenes.length}
                </div>
              </CardContent>
            </Card>

            {/* シーン一覧 */}
            <Card>
              <CardHeader>
                <CardTitle>シーン一覧</CardTitle>
                <CardDescription>シーンをクリックして編集</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {scenario.scenes.map((scene, index) => (
                    <div
                      key={scene.id}
                      className={`flex items-center justify-between rounded-lg border p-3 cursor-pointer transition-colors ${
                        selectedSceneIndex === index
                          ? 'border-primary bg-primary/5'
                          : 'hover:bg-accent'
                      }`}
                      onClick={() => setSelectedSceneIndex(index)}
                    >
                      <div>
                        <div className="font-medium">シーン {scene.id}</div>
                        <div className="text-xs text-muted-foreground">
                          {scene.type === 'image' ? '画像' : '動画'} • {scene.subtitles.length}字幕
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteScene(index);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  ))}
                  <Button onClick={addScene} className="w-full" variant="outline">
                    <Plus className="mr-2 h-4 w-4" />
                    シーンを追加
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 右側: シーン編集エリア */}
          <div className="lg:col-span-2">
            {selectedSceneIndex !== null ? (
              <Card>
                <CardHeader>
                  <CardTitle>シーン {scenario.scenes[selectedSceneIndex].id} の編集</CardTitle>
                  <CardDescription>シーンの詳細を設定してください</CardDescription>
                </CardHeader>
                <CardContent>
                  <SceneEditForm
                    scene={scenario.scenes[selectedSceneIndex]}
                    onUpdate={(updatedScene) => {
                      setScenario((prev) => ({
                        ...prev,
                        scenes: prev.scenes.map((s, i) =>
                          i === selectedSceneIndex ? updatedScene : s
                        ),
                      }));
                    }}
                  />
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="flex min-h-[400px] items-center justify-center">
                  <div className="text-center text-muted-foreground">
                    <FileJson className="mx-auto mb-4 h-12 w-12 opacity-50" />
                    <p>左側のシーン一覧からシーンを選択するか、</p>
                    <p>新しいシーンを追加してください</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      {/* API設定ダイアログ */}
      <ApiSettingsDialog open={apiSettingsOpen} onOpenChange={setApiSettingsOpen} />
      
      {/* AIシナリオ生成ダイアログ */}
      <AiScenarioGeneratorDialog
        open={aiScenarioGeneratorOpen}
        onOpenChange={setAiScenarioGeneratorOpen}
        onGenerated={(generatedScenario) => {
          setScenario(generatedScenario);
          setSelectedSceneIndex(null);
          toast.success('シナリオを読み込みました');
        }}
      />
    </div>
  );
}
