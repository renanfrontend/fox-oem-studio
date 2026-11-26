import type { AppData, MaintenanceItem, StageId, Task, TaskCategory, TaskStatus } from '@/domain/types';

/**
 * Dados iniciais do projeto: VW Fox 1.6 I-Motion 2011/2012 prata.
 * Valores estimados com base em preços médios de São Paulo (nov/2026).
 * Ajuste com as suas cotações reais.
 */

const SEED_TIMESTAMP = '2026-11-26T09:00:00.000Z';

interface SeedTask {
  id: string;
  stage: StageId;
  title: string;
  category: TaskCategory;
  estimatedCost: number;
  notes: string;
  status?: TaskStatus;
  maintenanceKeys?: string[];
}

function createSeedTask(seed: SeedTask, order: number): Task {
  // Timestamps escalonados preservam a ordem original de cada etapa.
  const createdAt = new Date(Date.parse(SEED_TIMESTAMP) + order * 1000).toISOString();
  return {
    id: seed.id,
    stage: seed.stage,
    title: seed.title,
    category: seed.category,
    status: seed.status ?? 'pendente',
    estimatedCost: seed.estimatedCost,
    actualCost: null,
    supplier: '',
    date: null,
    notes: seed.notes,
    oemReference: '',
    maintenanceKeys: seed.maintenanceKeys ?? [],
    createdAt,
    updatedAt: createdAt,
    completedAt: null,
  };
}

const SEED_TASKS: SeedTask[] = [
  // Etapa 0: aquisição e base mecânica
  {
    id: 'e0-laudo-cautelar',
    stage: 0,
    title: 'Laudo cautelar completo',
    category: 'documentacao',
    estimatedCost: 300,
    status: 'agendado',
    notes:
      'Estrutura (longarinas, colunas, assoalho), indício de sinistro, passagem por leilão, remarcação de chassi e motor, áreas repintadas.',
  },
  {
    id: 'e0-vistoria-scanner',
    stage: 0,
    title: 'Vistoria pré-compra com scanner (motor e I-Motion)',
    category: 'mecanica',
    estimatedCost: 180,
    status: 'cotando',
    notes:
      'Ler códigos de falha do motor e do câmbio, desgaste da embreagem no módulo do ASG e histórico de adaptações. No test-drive: trancos, patinação e demora nas trocas.',
  },
  {
    id: 'e0-transferencia',
    stage: 0,
    title: 'Transferência, vistoria e taxas do Detran-SP',
    category: 'documentacao',
    estimatedCost: 450,
    notes: 'Conferir IPVA, licenciamento e multas antes de assinar a ATPV-e.',
  },
  {
    id: 'e0-oleo-filtros',
    stage: 0,
    title: 'Óleo 5W-40 VW 502.00 e filtros de óleo, ar, combustível e cabine',
    category: 'mecanica',
    estimatedCost: 420,
    maintenanceKeys: ['oleo'],
    notes: 'A embalagem precisa trazer a norma VW 502.00. Guardar a nota fiscal: vira o histórico do carro.',
  },
  {
    id: 'e0-correia',
    stage: 0,
    title: 'Kit correia dentada, tensor e bomba d’água',
    category: 'mecanica',
    estimatedCost: 850,
    maintenanceKeys: ['correia-dentada'],
    notes:
      'Sem nota fiscal da última troca, trocar já: correia rompida pode causar dano grave ao motor. Pedir a troca da bomba d’água no mesmo serviço.',
  },
  {
    id: 'e0-arrefecimento',
    stage: 0,
    title: 'Fluido de arrefecimento G12/G13 com drenagem completa',
    category: 'mecanica',
    estimatedCost: 250,
    maintenanceKeys: ['arrefecimento'],
    notes: 'Usar só aditivo G12/G13 (rosa ou lilás) e água desmineralizada. Não misturar especificações.',
  },
  {
    id: 'e0-fluido-freio',
    stage: 0,
    title: 'Fluido de freio DOT 4 com sangria completa',
    category: 'mecanica',
    estimatedCost: 150,
    maintenanceKeys: ['fluido-freio'],
    notes: 'Aproveitar para medir pastilhas e discos.',
  },
  {
    id: 'e0-fluido-imotion',
    stage: 0,
    title: 'Fluido hidráulico do I-Motion e adaptação do câmbio',
    category: 'mecanica',
    estimatedCost: 350,
    maintenanceKeys: ['fluido-imotion'],
    notes:
      'Usar o fluido especificado pela VW para o atuador. Depois da troca, fazer a adaptação da embreagem e das marchas no scanner, com especialista em ASG.',
  },
  {
    id: 'e0-velas',
    stage: 0,
    title: 'Velas de ignição e inspeção da bobina',
    category: 'mecanica',
    estimatedCost: 180,
    notes: 'Motor flex: conferir falhas de ignição na leitura do scanner.',
  },
  {
    id: 'e0-alinhamento',
    stage: 0,
    title: 'Alinhamento, balanceamento e revisão de freios',
    category: 'rodas-suspensao',
    estimatedCost: 150,
    notes: 'Desgaste irregular dos pneus denuncia suspensão cansada.',
  },

  // Etapa 1: estética de fábrica
  {
    id: 'e1-polimento',
    stage: 1,
    title: 'Polimento técnico e vitrificação da pintura prata',
    category: 'estetica',
    estimatedCost: 750,
    notes: 'Descontaminação, correção leve e proteção. Sem repintura: originalidade vale mais na revenda.',
  },
  {
    id: 'e1-martelinho',
    stage: 1,
    title: 'Martelinho de ouro nos amassados pequenos',
    category: 'estetica',
    estimatedCost: 350,
    notes: 'Corrige sem massa nem tinta, preservando a pintura original.',
  },
  {
    id: 'e1-farois',
    stage: 1,
    title: 'Restauração dos faróis com verniz UV',
    category: 'estetica',
    estimatedCost: 180,
    notes: 'Lente amarelada derruba a iluminação e envelhece o visual.',
  },
  {
    id: 'e1-pelicula',
    stage: 1,
    title: 'Película nos vidros dentro do limite do Contran',
    category: 'estetica',
    estimatedCost: 400,
    notes: 'Para-brisa e laterais dianteiras têm transmitância mínima obrigatória. Pedir nota com a porcentagem aplicada.',
  },
  {
    id: 'e1-acabamentos',
    stage: 1,
    title: 'Grade e emblemas originais VW novos',
    category: 'estetica',
    estimatedCost: 280,
    notes: 'Repor peças desbotadas por originais; nada de cromado ou emblema genérico.',
  },

  // Etapa 2: rodas, pneus e suspensão
  {
    id: 'e2-rodas',
    stage: 2,
    title: 'Rodas originais VW aro 15 (usadas, em bom estado)',
    category: 'rodas-suspensao',
    estimatedCost: 1400,
    notes: 'Conferir furação, offset (ET) e furo central antes de fechar. Rodas de versões topo mantêm o visual de fábrica.',
  },
  {
    id: 'e2-pneus',
    stage: 2,
    title: 'Jogo de pneus 195/55 R15',
    category: 'rodas-suspensao',
    estimatedCost: 1800,
    notes: 'Confirmar a medida homologada na etiqueta da coluna e no manual antes de comprar.',
  },
  {
    id: 'e2-amortecedores',
    stage: 2,
    title: 'Amortecedores novos com kit batente e coifa',
    category: 'rodas-suspensao',
    estimatedCost: 1300,
    notes: 'Altura original ou rebaixamento leve. Alterar a suspensão exige inspeção de segurança (CSV) e regularização no documento.',
  },
  {
    id: 'e2-alinhamento-3d',
    stage: 2,
    title: 'Alinhamento 3D depois da suspensão',
    category: 'rodas-suspensao',
    estimatedCost: 180,
    notes: 'Fazer com o carro já assentado, após cerca de 200 km.',
  },

  // Etapa 3: interior e tecnologia
  {
    id: 'e3-volante',
    stage: 3,
    title: 'Volante original VW revestido em couro',
    category: 'interior',
    estimatedCost: 650,
    notes: 'Conferir compatibilidade do airbag e do conector com o Fox antes de comprar.',
  },
  {
    id: 'e3-manopla',
    stage: 3,
    title: 'Manopla e coifa do I-Motion em couro',
    category: 'interior',
    estimatedCost: 220,
    notes: 'Peça específica do câmbio automatizado; a do câmbio manual não serve.',
  },
  {
    id: 'e3-multimidia',
    stage: 3,
    title: 'Multimídia 2DIN com moldura de encaixe e câmera de ré',
    category: 'eletrica',
    estimatedCost: 1100,
    notes: 'Moldura de encaixe evita cortes no painel e mantém o acabamento de fábrica.',
  },
  {
    id: 'e3-sensor',
    stage: 3,
    title: 'Sensor de estacionamento traseiro na cor do carro',
    category: 'eletrica',
    estimatedCost: 350,
    notes: 'Sensores pintados na cor prata da carroceria.',
  },
  {
    id: 'e3-tapetes-led',
    stage: 3,
    title: 'Tapetes originais e iluminação interna em LED',
    category: 'interior',
    estimatedCost: 250,
    notes: 'LED branco neutro, sem cores.',
  },
];

const SEED_MAINTENANCE: MaintenanceItem[] = [
  {
    key: 'oleo',
    label: 'Óleo do motor e filtro',
    spec: '5W-40 sintético, norma VW 502.00',
    intervalKm: 7_000,
    intervalMonths: 12,
    notes: 'Intervalo conservador para uso urbano com motor flex.',
    history: [],
  },
  {
    key: 'arrefecimento',
    label: 'Fluido de arrefecimento',
    spec: 'Aditivo G12/G13 (rosa ou lilás) com água desmineralizada',
    intervalKm: null,
    intervalMonths: 24,
    notes: 'Intervalo sugerido; confirme no manual. G13 é compatível com G12, G12+ e G12++.',
    history: [],
  },
  {
    key: 'correia-dentada',
    label: 'Correia dentada e tensor',
    spec: 'Kit correia e tensor (bomba d’água recomendada no mesmo serviço)',
    intervalKm: 50_000,
    intervalMonths: null,
    notes: 'Sem histórico comprovado, troque logo após a compra.',
    history: [],
  },
  {
    key: 'fluido-imotion',
    label: 'Fluido hidráulico do I-Motion',
    spec: 'Fluido especificado pela VW para o atuador do câmbio automatizado',
    intervalKm: 30_000,
    intervalMonths: null,
    notes: 'Após a troca, fazer a adaptação do câmbio no scanner.',
    history: [],
  },
  {
    key: 'fluido-freio',
    label: 'Fluido de freio',
    spec: 'DOT 4',
    intervalKm: null,
    intervalMonths: 24,
    notes: 'O fluido absorve umidade com o tempo, mesmo rodando pouco.',
    history: [],
  },
];

export function createSeedData(): AppData {
  return {
    schemaVersion: 1,
    vehicle: {
      nickname: 'Fox prata',
      model: 'VW Fox 1.6 I-Motion',
      modelYear: '2011/2012',
      color: 'Prata',
      engine: 'EA111 1.6 8V Total Flex',
      transmission: 'I-Motion (automatizado, 5 marchas)',
      plate: '',
      acquisitionStatus: 'negociando',
      purchaseDate: null,
    },
    finance: {
      baseValue: 35_000,
      vehicleCost: 27_000,
      reserveTarget: 4_500,
      cdiAnnualRate: 13.65,
      cdiPercentage: 100,
      contributions: [],
    },
    tasks: SEED_TASKS.map(createSeedTask),
    odometer: [
      {
        id: 'odo-anuncio',
        km: 118_400,
        date: '2026-11-24',
        note: 'Km informado no anúncio: confirmar na vistoria.',
      },
    ],
    maintenance: structuredClone(SEED_MAINTENANCE),
    photos: {},
    guideChecks: {},
  };
}
