import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Scene, ScenarioData } from '@/types/novel';
import {
  Download,
  Eye,
  FileJson,
  Plus,
  Trash2,
  Upload,
  RefreshCw,
  Save,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { useLocation } from 'wouter';
import { SceneEditForm } from '@/components/SceneEditForm';
import { ApiSettingsDialog } from '@/components/ApiSettingsDialog';
import { AiScenarioGeneratorDialog } from '@/components/AiScenarioGeneratorDialog';
import { Settings, Sparkles } from 'lucide-react';
import {
  createScenario,
  fetchScenario,
  saveScenario,
} from '@/lib/scenarioApi';
import { isApiError } from '@/lib/apiClient';

const DEFAULT_SCENARIO_SLUG =
  import.meta.env.VITE_DEFAULT_SCENARIO_SLUG || 'default';

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

  const [scenarioId, setScenarioId] = useState<string | null>(null);
  const [isLoadingRemote, setIsLoadingRemote] = useState(false);
  const [isSavingRemote, setIsSavingRemote] = useState(false);
  const [selectedSceneIndex, setSelectedSceneIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [apiSettingsOpen, setApiSettingsOpen] = useState(false);
  const [aiScenarioGeneratorOpen, setAiScenarioGeneratorOpen] = useState(false);

  const updateMetadata = (field: string, value: string) => {
    setScenario((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

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

  const deleteScene = (index: number) => {
    setScenario((prev) => {
      const newScenes = prev.scenes.filter((_, i) => i !== index);
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

  const importJSON = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        setScenario(json);
        setScenarioId(null);
        setSelectedSceneIndex(null);
        toast.success('JSONファイルを読み込みました');
      } catch (error) {
        console.error('Failed to parse JSON:', error);
        toast.error('JSONファイルの読み込みに失敗しました');
      }
    };
    reader.readAsText(file);
  };

  const preview = () => {
    localStorage.setItem('preview_scenario', JSON.stringify(scenario));
    setLocation('/preview');
  };

  const loadScenarioFromServer = useCallback(async () => {
    setIsLoadingRemote(true);
    try {
      const record = await fetchScenario(DEFAULT_SCENARIO_SLUG);
      setScenario(record.data);
      setScenarioId(record.id);
      setSelectedSceneIndex(null);
      toast.success('サーバーからシナリオを読み込みました');
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        toast.info('サーバーに既存データがないため新規シナリオを使用します');
        setScenarioId(null);
      } else {
        console.error('Failed to fetch scenario from API:', error);
        toast.error('サーバーからの読み込みに失敗しました');
      }
    } finally {
      setIsLoadingRemote(false);
    }
  }, []);

  const handleSaveToServer = useCallback(async () => {
    setIsSavingRemote(true);
    try {
      // Clean up scenario data to prevent undefined values
      const cleanedScenario = {
        ...scenario,
        title: scenario.title ?? "",
        author: scenario.author ?? "",
        version: scenario.version ?? "",
        description: scenario.description ?? "",
        metadata: {
          ...scenario.metadata,
          tags: scenario.metadata?.tags ?? [],
          rating: scenario.metadata?.rating ?? "",
          totalScenes: scenario.metadata?.totalScenes ?? scenario.scenes.length,
          estimatedDuration: scenario.metadata?.estimatedDuration ?? 0,
        },
      };

      // Debug logging to check for undefined values
      if (import.meta.env.DEV) {
        console.log("[ScenarioEditor] Saving scenario data:", JSON.stringify(cleanedScenario, null, 2));
      }

      const record = await saveScenario(DEFAULT_SCENARIO_SLUG, cleanedScenario);
      setScenarioId(record.id);
      toast.success('サーバーに保存しました');
    } catch (error) {
      if (isApiError(error) && error.status === 404) {
        try {
          // Clean up scenario data for creation as well
          const cleanedScenario = {
            ...scenario,
            title: scenario.title ?? "",
            author: scenario.author ?? "",
            version: scenario.version ?? "",
            description: scenario.description ?? "",
            metadata: {
              ...scenario.metadata,
              tags: scenario.metadata?.tags ?? [],
              rating: scenario.metadata?.rating ?? "",
              totalScenes: scenario.metadata?.totalScenes ?? scenario.scenes.length,
              estimatedDuration: scenario.metadata?.estimatedDuration ?? 0,
            },
          };
          
          const record = await createScenario(cleanedScenario, DEFAULT_SCENARIO_SLUG);
          setScenarioId(record.id);
          toast.success('サーバーに新規保存しました');
        } catch (createError) {
          console.error('Failed to create scenario via API:', createError);
          toast.error('サーバー保存に失敗しました');
        }
      } else {
        console.error('Failed to save scenario via API:', error);
        toast.error('サーバー保存に失敗しました');
      }
    } finally {
      setIsSavingRemote(false);
    }
  }, [scenario]);

  useEffect(() => {
    loadScenarioFromServer();
  }, [loadScenarioFromServer]);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="container flex items-center justify-between py-4">
          <div className="flex items-center gap-2">
            <FileJson className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold">シナリオエディタ</h1>
          </div>
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <Button variant="outline" onClick={() => setAiScenarioGeneratorOpen(true)}>
              <Sparkles className="mr-2 h-4 w-4" />
              AI生成
            </Button>
            <Button
              variant="outline"
              onClick={loadScenarioFromServer}
              disabled={isLoadingRemote}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              サーバー再読込
            </Button>
            <Button onClick={handleSaveToServer} disabled={isSavingRemote}>
              <Save className="mr-2 h-4 w-4" />
              サーバー保存
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

      <div className="container py-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between text-xs text-muted-foreground gap-2">
          <span>サーバースラッグ: {DEFAULT_SCENARIO_SLUG}</span>
          <span>
            {isLoadingRemote
              ? 'サーバーと同期中...'
              : scenarioId
                ? `ID: ${scenarioId}`
                : '未保存'}
          </span>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="space-y-6 lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>作品メタ情報</CardTitle>
                <CardDescription>作品全体の基本情報を設定してください</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">タイトル</Label>
                  <Input
                    id="title"
                    value={scenario.title ?? ""}
                    onChange={(e) => updateMetadata('title', e.target.value)}
                    placeholder="作品タイトル"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="author">作者</Label>
                  <Input
                    id="author"
                    value={scenario.author ?? ""}
                    onChange={(e) => updateMetadata('author', e.target.value)}
                    placeholder="作者名"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">説明</Label>
                  <Textarea
                    id="description"
                    value={scenario.description ?? ""}
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
                          {scene.type === 'image' ? '画像' : '動画'} • {scene.subtitles.length} 字幕
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

          <div className="lg:col-span-2">
            {selectedSceneIndex !== null ? (
              <Card>
                <CardHeader>
                  <CardTitle>
                    シーン {scenario.scenes[selectedSceneIndex].id} の編集
                  </CardTitle>
                  <CardDescription>シーンの詳細を設定してください</CardDescription>
                </CardHeader>
                <CardContent>
                  <SceneEditForm
                    scene={scenario.scenes[selectedSceneIndex]}
                    onUpdate={(updatedScene) => {
                      setScenario((prev) => ({
                        ...prev,
                        scenes: prev.scenes.map((s, i) =>
                          i === selectedSceneIndex ? updatedScene : s,
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
                    <p>左のシーン一覧から選択するか、右上のボタンで新規作成してください。</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>

      <ApiSettingsDialog open={apiSettingsOpen} onOpenChange={setApiSettingsOpen} />

      <AiScenarioGeneratorDialog
        open={aiScenarioGeneratorOpen}
        onOpenChange={setAiScenarioGeneratorOpen}
        onGenerated={(generatedScenario) => {
          setScenario(generatedScenario);
          setScenarioId(null);
          setSelectedSceneIndex(null);
          toast.success('シナリオを読み込みました');
        }}
      />
    </div>
  );
}

