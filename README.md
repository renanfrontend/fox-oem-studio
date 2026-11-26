# Fox OEM+ Studio

Aplicação web (mobile-first, dark mode) para gerenciar a **aquisição**, a **manutenção preventiva** e a
**customização OEM+ por etapas** de um VW Fox 1.6 I-Motion 2011/2012 prata.

Tudo roda no navegador: dados no `localStorage` (Zustand + persist), fotos no IndexedDB e backup em JSON.
A IA (Gemini) é opcional.

## Stack

| Camada | Tecnologia |
| --- | --- |
| UI | React 19, TypeScript (strict + `noUncheckedIndexedAccess`), Vite 8 |
| Estilo | Tailwind CSS v4 (`@tailwindcss/vite`, tema em `src/index.css`), shadcn/ui (new-york, Radix), Lucide |
| Estado | Zustand 5 com `persist` (validação Zod na hidratação), IndexedDB (`idb-keyval`) para as fotos |
| Animação | Framer Motion (troca de abas, comparador, kanban, medidores) |
| IA (opcional) | `@google/genai`, carregado sob demanda |
| Qualidade | ESLint 10 (typescript-eslint type-checked + react-hooks 7), Vitest |

## Como rodar

Requisitos: Node 20.19+ ou 22.12+ (exigência do Vite 8).

```bash
npm install
cp .env.example .env.local   # opcional: só para a integração com o Gemini
npm run dev
```

| Script | O que faz |
| --- | --- |
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | `tsc -b` + build de produção (com code splitting por tela) |
| `npm run preview` | Serve o build |
| `npm run typecheck` | Só a checagem de tipos |
| `npm run lint` | ESLint com regras type-checked |
| `npm test` | Testes de domínio (finanças, manutenção, varredura de laudos) |

Para adicionar componentes shadcn: `npx shadcn@latest add <componente>` (o `components.json` já aponta para
Tailwind v4 e para os aliases `@/`).

## Módulos

1. **Painel financeiro (Cofrinho CDI).** Valor base, custo do carro e reserva mínima configuráveis
   (padrões: R$ 35.000, R$ 27.000 e R$ 4.500). Barra segmentada com gasto, saldo livre para upgrades e
   reserva intacta (vermelho quando a reserva é consumida), marcador do roadmap previsto, aporte necessário
   para fazer tudo sem tocar na reserva e rendimento estimado do saldo a X% do CDI.
2. **Antes e depois.** Slider com `clip-path` (arraste, toque, teclado e leitor de tela) nas visões frente,
   traseira, lateral e interior. Cada visão tem 6 slots: original, etapas 0 a 3 e projeto OEM+. Sem foto,
   entra uma ilustração vetorial de referência (versão original e versão OEM+).
3. **Roadmap por etapas.** Kanban (arrastar no desktop, select no celular) e checklist por etapa. Status
   `Pendente`, `Cotando`, `Agendado`, `Concluído`; custo estimado e pago, fornecedor, data, referência OEM e
   observações técnicas. Concluir sempre passa por um diálogo de pagamento que mostra o impacto na verba antes
   de lançar.
4. **Oficina.** Hodômetro com média de uso, itens preventivos com alerta por km e/ou tempo (óleo 5W-40
   VW 502.00 a cada 7.000 km, G12/G13, correia dentada 50.000 km, fluido do I-Motion 30.000 km, fluido de
   freio) e o guia de bolso do I-Motion.
5. **Estúdio de IA.** Gerador de prompts de render (edição da foto real e geração do zero, com prompt
   negativo) que funciona offline; refino por ferramenta e análise de laudo cautelar ou orçamento (texto,
   foto ou PDF) via Gemini, com resposta em JSON validada. A varredura rápida offline marca termos de risco
   e ignora itens verificados sem problema ("sem avarias", "nada consta").

## Arquitetura

```
src/
├── app/navigation.ts        # Abas via hash (#roadmap), sem router
├── domain/                  # Regras puras e tipos: finanças, manutenção, etapas, fotos, prompts, schema Zod
├── data/seed.ts             # Dados iniciais do Fox 2011/2012
├── store/                   # Zustand (ações) + seletores memoizados
├── services/                # IndexedDB, compressão de imagem, backup, Gemini, varredura offline
├── hooks/                   # usePhotoUrl, useToday, useElementWidth
├── components/
│   ├── ui/                  # shadcn/ui
│   ├── shared/              # Campos numéricos pt-BR, medidores, badges de status
│   └── layout/              # Shell, navegação inferior (mobile) e lateral (desktop)
└── features/                # dashboard, comparator, roadmap, technical, ai, settings
```

O domínio não conhece React nem o store; as features consomem o store por seletores que devolvem fatias
estáveis e calculam os derivados com `useMemo` (evita o loop de re-render do Zustand 5 com objetos novos).

### Decisões que valem registrar

- **Fotos fora do `localStorage`.** Base64 de 20+ fotos estoura os ~5 MB do `localStorage`. As fotos são
  reduzidas para 1920 px (WebP, ou JPEG no Safari antigo), gravadas como Blob no IndexedDB e exibidas por
  Blob URL. O backup converte para Base64 com `FileReader` (opcional, com estimativa de tamanho).
- **Dados persistidos validados.** O `merge` do `persist` passa pelo schema Zod; dado corrompido volta para
  o seed em vez de quebrar a tela. O mesmo schema valida backups importados.
- **Um só caminho para lançar gasto.** Só tarefas concluídas abatem da verba, sempre pelo diálogo de
  pagamento. Tarefas vinculadas a itens preventivos registram a troca e atualizam o hodômetro; reabrir ou
  excluir a tarefa desfaz o registro.
- **Fórmulas.** `verba = base + aportes − carro`; `livre = verba − reserva`; o gasto consome primeiro o livre
  e depois a reserva. O rendimento aplica o percentual do CDI sobre a taxa diária (base 252).
- **Paleta.** Grafite e prata na interface; cor saturada só para estado. Cores de status e do fluxo do
  kanban foram validadas para daltonismo e contraste no fundo do card, sempre acompanhadas de ícone e rótulo.

## Integração com o Gemini

Defina no `.env.local`:

```bash
VITE_GEMINI_API_KEY=sua-chave
VITE_GEMINI_MODEL=gemini-3.8-flash   # padrão; gemini-3.5-flash-lite é a opção mais barata
```

Variáveis `VITE_*` vão para o bundle do navegador: use a chave só localmente. Para publicar, mova as chamadas
de `src/services/gemini.ts` para uma função serverless. Sem chave, o SDK nem entra no build.

## Notas sobre os dados iniciais

- Os custos das tarefas são estimativas de São Paulo (nov/2026). Ajuste com suas cotações.
- O roadmap completo soma R$ 12.490 contra R$ 3.500 livres: a Etapa 0 cabe na verba, as Etapas 1 a 3
  dependem de aportes (registre em Ajustes > Finanças).
- O CDI padrão é 13,65% a.a. (Selic em 13,75% após o Copom de 04/11/2026). Atualize em Ajustes.
- O hodômetro começa com 118.400 km como km de anúncio: confirme na vistoria.

## Guia do I-Motion: o que mudou em relação ao briefing

O guia segue o manual VW do Fox com câmbio automatizado:

- **Semáforo curto:** fique em D com o pé no freio; o manual diz que não é preciso ir para N (o sistema já
  desacopla a embreagem). N com freio de mão ficou para paradas longas, com o motor ligado.
- **Estacionar sem P:** a alavanca fica engatada em D ou R, com freio de mão; o manual pede para **nunca**
  estacionar em N.
- **Partida:** pé no freio e alavanca em N. Não existe partida no tranco.
