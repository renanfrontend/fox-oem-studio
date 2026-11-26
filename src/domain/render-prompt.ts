import type { PhotoView, StageId, VehicleProfile } from './types';

export interface RenderUpgrade {
  id: string;
  label: string;
  stage: StageId;
  views: readonly PhotoView[];
  prompt: string;
}

export interface RenderChoice {
  id: string;
  label: string;
  prompt: string;
}

export const RENDER_UPGRADES: readonly RenderUpgrade[] = [
  {
    id: 'vitrificacao',
    label: 'Pintura prata vitrificada',
    stage: 1,
    views: ['frente', 'traseira', 'lateral'],
    prompt: 'deep-gloss ceramic-coated silver metallic paint with crisp, clean reflections',
  },
  {
    id: 'farois',
    label: 'Faróis restaurados com máscara negra',
    stage: 1,
    views: ['frente', 'lateral'],
    prompt: 'crystal-clear restored headlight lenses with black-masked housings',
  },
  {
    id: 'pelicula',
    label: 'Película leve nos vidros',
    stage: 1,
    views: ['frente', 'traseira', 'lateral'],
    prompt: 'light smoked window tint, slightly darker on the rear glass',
  },
  {
    id: 'acabamentos',
    label: 'Grade e emblemas originais novos',
    stage: 1,
    views: ['frente', 'traseira'],
    prompt: 'brand-new factory grille, fresh black trims and crisp original badges',
  },
  {
    id: 'lanternas',
    label: 'Lanternas originais renovadas',
    stage: 1,
    views: ['traseira', 'lateral'],
    prompt: 'clean factory tail lights with deep red lenses',
  },
  {
    id: 'rodas',
    label: 'Rodas originais VW aro 15',
    stage: 2,
    views: ['frente', 'traseira', 'lateral'],
    prompt: '15-inch factory-style multi-spoke alloy wheels in graphite silver with 195/55 R15 tires',
  },
  {
    id: 'altura',
    label: 'Rebaixamento leve (cerca de 30 mm)',
    stage: 2,
    views: ['frente', 'traseira', 'lateral'],
    prompt: 'subtle 30 mm lowered stance with tight, even wheel gaps and factory-correct alignment',
  },
  {
    id: 'volante',
    label: 'Volante revestido em couro',
    stage: 3,
    views: ['interior'],
    prompt: 'leather-wrapped three-spoke steering wheel with discreet contrast stitching',
  },
  {
    id: 'multimidia',
    label: 'Multimídia 2DIN integrada',
    stage: 3,
    views: ['interior'],
    prompt: 'integrated 2-DIN touchscreen head unit in a factory-style bezel',
  },
  {
    id: 'manopla',
    label: 'Manopla e coifa em couro',
    stage: 3,
    views: ['interior'],
    prompt: 'leather gear selector knob and gaiter for the automated gearbox',
  },
  {
    id: 'tapetes',
    label: 'Tapetes originais e LED interno',
    stage: 3,
    views: ['interior'],
    prompt: 'fitted OEM carpet mats and soft white LED interior lighting',
  },
];

export const RENDER_SCENES: readonly RenderChoice[] = [
  {
    id: 'estudio',
    label: 'Estúdio',
    prompt: 'seamless dark-gray studio cyclorama, large softbox key light, subtle floor reflection',
  },
  {
    id: 'rua-sp',
    label: 'Rua de São Paulo ao entardecer',
    prompt: 'quiet São Paulo residential street at golden hour, warm low sun, shallow depth of field',
  },
  {
    id: 'garagem',
    label: 'Garagem subterrânea',
    prompt: 'clean underground parking garage, cool fluorescent light, polished concrete floor',
  },
  {
    id: 'posto-noite',
    label: 'Posto de combustível à noite',
    prompt: 'gas station canopy at night, soft LED light, wet asphalt reflections',
  },
];

export const RENDER_STYLES: readonly RenderChoice[] = [
  {
    id: 'fotorrealista',
    label: 'Fotorrealista',
    prompt: 'photorealistic photo, full-frame camera, 50mm lens, f/4, natural color grading',
  },
  {
    id: 'catalogo',
    label: 'Catálogo de fábrica',
    prompt: 'official manufacturer brochure photography, clean even lighting, ultra sharp detail',
  },
  {
    id: 'editorial',
    label: 'Editorial de revista',
    prompt: 'automotive magazine editorial photo, cinematic contrast, 85mm lens',
  },
];

const VIEW_PROMPTS: Record<PhotoView, string> = {
  frente: 'front three-quarter view from a slightly low camera height',
  traseira: 'rear three-quarter view from a slightly low camera height',
  lateral: 'clean side profile view with the camera at wheel-hub height',
  interior: 'interior view from the rear seat toward the dashboard, left-hand drive',
};

const COLOR_EN: Record<string, string> = {
  prata: 'silver',
  preto: 'black',
  branco: 'white',
  cinza: 'gray',
  vermelho: 'red',
  azul: 'blue',
};

const NEGATIVE_PROMPT =
  'cartoon, CGI look, toy car, distorted body, wrong proportions, extra wheels, widebody kit, ' +
  'oversized spoiler, racing stickers, neon underglow, chrome rims, stretched tires, text, watermark, logo artifacts';

export interface RenderPromptSpec {
  view: PhotoView;
  upgradeIds: readonly string[];
  sceneId: string;
  styleId: string;
  vehicle: Pick<VehicleProfile, 'color' | 'modelYear'>;
}

export interface RenderPrompts {
  edit: string;
  generate: string;
  negative: string;
  upgrades: RenderUpgrade[];
}

export function describeVehicle(vehicle: Pick<VehicleProfile, 'color' | 'modelYear'>): string {
  const color = COLOR_EN[vehicle.color.trim().toLowerCase()] ?? vehicle.color.trim().toLowerCase();
  const year = vehicle.modelYear.trim() || '2011/2012';
  return `${color} ${year} Volkswagen Fox 1.6 compact hatchback (Brazilian market)`;
}

export function upgradesForView(view: PhotoView): RenderUpgrade[] {
  return RENDER_UPGRADES.filter((upgrade) => upgrade.views.includes(view));
}

function findChoice(choices: readonly RenderChoice[], id: string): RenderChoice {
  const choice = choices.find((item) => item.id === id) ?? choices[0];
  if (!choice) throw new Error('Lista de opções vazia');
  return choice;
}

export function buildRenderPrompts(spec: RenderPromptSpec): RenderPrompts {
  const vehicle = describeVehicle(spec.vehicle);
  const upgrades = RENDER_UPGRADES.filter(
    (upgrade) => spec.upgradeIds.includes(upgrade.id) && upgrade.views.includes(spec.view),
  );
  const scene = findChoice(RENDER_SCENES, spec.sceneId);
  const style = findChoice(RENDER_STYLES, spec.styleId);
  const changeList =
    upgrades.length > 0
      ? upgrades.map((upgrade) => upgrade.prompt).join('; ')
      : 'keep everything stock, only make it look freshly detailed';

  const keep =
    spec.view === 'interior'
      ? 'Keep the exact same cabin, dashboard shape, seats, camera angle, framing and lighting.'
      : 'Keep the exact same car, body shape, panel gaps, paint color, camera angle, framing, background and lighting.';

  const edit = [
    `Edit the attached photo of my ${vehicle}.`,
    keep,
    `Change only these OEM+ upgrades, making them look like genuine factory parts: ${changeList}.`,
    'Photorealistic result, no text, no watermark, no extra badges, no aftermarket body kit.',
  ].join(' ');

  const generate = [
    `${style.prompt.charAt(0).toUpperCase()}${style.prompt.slice(1)}.`,
    `${VIEW_PROMPTS[spec.view]} of a ${vehicle} with a subtle OEM+ build: ${changeList}.`,
    `Scene: ${scene.prompt}.`,
    'Factory-correct proportions and panel gaps, blank license plate, no people.',
  ].join(' ');

  return { edit, generate, negative: NEGATIVE_PROMPT, upgrades };
}
