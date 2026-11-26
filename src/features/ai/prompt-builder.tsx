import { useMemo, useState } from 'react';
import { LoaderCircle, WandSparkles } from 'lucide-react';
import { toast } from 'sonner';
import { CopyButton } from '@/components/shared/copy-button';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Toggle } from '@/components/ui/toggle';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { PHOTO_VIEWS } from '@/domain/photos';
import {
  RENDER_SCENES,
  RENDER_STYLES,
  buildRenderPrompts,
  upgradesForView,
} from '@/domain/render-prompt';
import { STAGES } from '@/domain/tasks';
import type { PhotoView } from '@/domain/types';
import { GeminiError, PROMPT_TARGETS, isGeminiConfigured, refineRenderPrompt, type PromptTarget } from '@/services/gemini';
import { useAppStore } from '@/store/app-store';

function isView(value: string): value is PhotoView {
  return PHOTO_VIEWS.some((view) => view.id === value);
}

function isTarget(value: string): value is PromptTarget {
  return PROMPT_TARGETS.some((target) => target.id === value);
}

function PromptBlock({ title, hint, text }: { title: string; hint: string; text: string }) {
  return (
    <div className="space-y-3 rounded-2xl border bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold">{title}</h3>
          <p className="text-xs text-muted-foreground">{hint}</p>
        </div>
        <CopyButton text={text} />
      </div>
      <p lang="en" className="rounded-lg bg-muted/60 p-3 text-sm leading-relaxed break-words select-all">
        {text}
      </p>
    </div>
  );
}

export function PromptBuilder() {
  const vehicle = useAppStore((state) => state.vehicle);
  const [view, setView] = useState<PhotoView>('lateral');
  const [upgradeIds, setUpgradeIds] = useState<string[]>(['vitrificacao', 'farois', 'rodas', 'altura', 'volante', 'multimidia']);
  const [sceneId, setSceneId] = useState('estudio');
  const [styleId, setStyleId] = useState('fotorrealista');
  const [target, setTarget] = useState<PromptTarget>('gemini-imagem');
  const [refined, setRefined] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const available = upgradesForView(view);
  const prompts = useMemo(
    () => buildRenderPrompts({ view, upgradeIds, sceneId, styleId, vehicle }),
    [view, upgradeIds, sceneId, styleId, vehicle],
  );

  function toggleUpgrade(id: string, pressed: boolean) {
    setRefined(null);
    setUpgradeIds((current) => (pressed ? [...current, id] : current.filter((item) => item !== id)));
  }

  async function handleRefine() {
    setLoading(true);
    try {
      const text = await refineRenderPrompt({
        target,
        basePrompt: target === 'gemini-imagem' ? prompts.edit : prompts.generate,
        negativePrompt: prompts.negative,
        upgradeLabels: prompts.upgrades.map((upgrade) => upgrade.label),
      });
      setRefined(text);
    } catch (error) {
      toast.error(error instanceof GeminiError ? error.message : 'Não foi possível refinar o prompt.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
        <div className="space-y-2">
          <Label>Visão</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={view}
            onValueChange={(value) => {
              if (isView(value)) {
                setView(value);
                setRefined(null);
              }
            }}
            className="grid w-full grid-cols-4 sm:w-fit"
          >
            {PHOTO_VIEWS.map((item) => (
              <ToggleGroupItem key={item.id} value={item.id} className="px-2 sm:px-4">
                {item.label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>

        <fieldset className="space-y-3">
          <legend className="text-sm font-medium">Upgrades no render</legend>
          {STAGES.filter((stage) => available.some((upgrade) => upgrade.stage === stage.id)).map((stage) => (
            <div key={stage.id} className="space-y-2">
              <p className="text-xs text-muted-foreground">
                {stage.label}: {stage.title}
              </p>
              <div className="flex flex-wrap gap-2">
                {available
                  .filter((upgrade) => upgrade.stage === stage.id)
                  .map((upgrade) => (
                    <Toggle
                      key={upgrade.id}
                      variant="outline"
                      size="sm"
                      pressed={upgradeIds.includes(upgrade.id)}
                      onPressedChange={(pressed) => toggleUpgrade(upgrade.id, pressed)}
                      className="h-auto min-h-9 py-1.5 whitespace-normal"
                    >
                      {upgrade.label}
                    </Toggle>
                  ))}
              </div>
            </div>
          ))}
        </fieldset>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor="render-scene">Cenário</Label>
            <Select
              value={sceneId}
              onValueChange={(value) => {
                setSceneId(value);
                setRefined(null);
              }}
            >
              <SelectTrigger id="render-scene">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RENDER_SCENES.map((scene) => (
                  <SelectItem key={scene.id} value={scene.id}>
                    {scene.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="render-style">Estilo</Label>
            <Select
              value={styleId}
              onValueChange={(value) => {
                setStyleId(value);
                setRefined(null);
              }}
            >
              <SelectTrigger id="render-style">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RENDER_STYLES.map((style) => (
                  <SelectItem key={style.id} value={style.id}>
                    {style.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <PromptBlock
        title="Editar a sua foto"
        hint="Para Gemini e outros editores de imagem: anexe a foto do comparador junto com este texto."
        text={prompts.edit}
      />
      <PromptBlock
        title="Gerar do zero"
        hint="Para Midjourney, Stable Diffusion e similares."
        text={prompts.generate}
      />
      <PromptBlock title="Prompt negativo" hint="Evita o visual de kit esportivo e deformações." text={prompts.negative} />

      <div className="space-y-4 rounded-2xl border bg-card p-4 sm:p-5">
        <div className="space-y-1">
          <h3 className="text-sm font-semibold">Refinar para uma ferramenta</h3>
          <p className="text-xs text-muted-foreground">
            O Gemini reescreve o prompt no formato que cada ferramenta entende melhor.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
          <div className="grid flex-1 gap-2">
            <Label htmlFor="render-target">Ferramenta</Label>
            <Select
              value={target}
              onValueChange={(value) => {
                if (isTarget(value)) {
                  setTarget(value);
                  setRefined(null);
                }
              }}
            >
              <SelectTrigger id="render-target">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROMPT_TARGETS.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={() => void handleRefine()} disabled={!isGeminiConfigured || loading}>
            {loading ? <LoaderCircle className="animate-spin" /> : <WandSparkles />}
            {loading ? 'Refinando' : 'Refinar com Gemini'}
          </Button>
        </div>
        {!isGeminiConfigured && (
          <p className="text-xs text-muted-foreground">Configure a chave do Gemini para usar o refino.</p>
        )}
        {refined && (
          <div className="space-y-3 border-t pt-4">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium">Prompt refinado</p>
              <CopyButton text={refined} />
            </div>
            <p lang="en" className="rounded-lg bg-muted/60 p-3 text-sm leading-relaxed whitespace-pre-wrap break-words select-all">
              {refined}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
