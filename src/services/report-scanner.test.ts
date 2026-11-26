import { describe, expect, it } from 'vitest';
import { scanReport } from './report-scanner';

const LAUDO = `LAUDO CAUTELAR - VW FOX 1.6 2011/2012
Resultado: APROVADO COM APONTAMENTO
Estrutura: longarinas, colunas e assoalho sem avarias.
Histórico: nada consta para leilão.
Pintura: repintura no para-choque dianteiro e na porta traseira direita.
Motor: exsudação leve na tampa de válvulas.
Câmbio I-Motion: trocas lentas da 1ª para a 2ª marcha.`;

const ORCAMENTO = `Orçamento Oficina Alfa Motors
Kit correia dentada + tensor - R$ 389,90
Bomba d'água - R$ 214,00
Óleo 5W30 sintético (4 L) - R$ 196,00
Mão de obra: R$ 320,00
Total: R$ 1.119,90`;

describe('scanReport (laudo)', () => {
  const result = scanReport(LAUDO, 'laudo');
  const byId = new Map(result.findings.map((finding) => [finding.id, finding]));

  it('sinaliza apontamentos reais', () => {
    expect(byId.get('apontamento')?.severidade).toBe('atencao');
    expect(byId.get('repintura')?.severidade).toBe('atencao');
    expect(byId.get('vazamento')?.severidade).toBe('atencao');
    expect(byId.get('imotion')?.severidade).toBe('atencao');
  });

  it('não acusa itens verificados sem problema', () => {
    expect(byId.get('estrutura')?.severidade).toBe('info');
    expect(byId.get('leilao')?.severidade).toBe('info');
    expect(byId.has('reprovado')).toBe(false);
  });

  it('ordena críticos e atenções antes das informações', () => {
    const severities = result.findings.map((finding) => finding.severidade);
    expect(severities.indexOf('info')).toBeGreaterThan(severities.lastIndexOf('atencao'));
  });
});

describe('scanReport (orçamento)', () => {
  const result = scanReport(ORCAMENTO, 'orcamento');

  it('extrai linhas de preço e o total informado', () => {
    expect(result.prices.map((line) => line.valor)).toEqual([389.9, 214, 196, 320]);
    expect(result.prices[2]?.descricao).toBe('Óleo 5W30 sintético (4 L)');
    expect(result.computedTotal).toBe(1119.9);
    expect(result.statedTotal).toBe(1119.9);
  });

  it('alerta óleo fora da especificação do projeto', () => {
    expect(result.findings.some((finding) => finding.id === 'viscosidade')).toBe(true);
    expect(result.findings.some((finding) => finding.id === 'correia')).toBe(true);
  });
});
