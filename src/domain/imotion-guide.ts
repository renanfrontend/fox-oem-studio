/**
 * Guia de bolso do câmbio automatizado I-Motion (ASG).
 * Baseado no manual de instruções VW do Fox com transmissão automatizada.
 * A nomenclatura da alavanca pode variar por ano-modelo: confira o manual do seu carro.
 */
export interface GuideItem {
  id: string;
  title: string;
  steps: readonly string[];
  avoid: string;
}

export const IMOTION_GUIDE: readonly GuideItem[] = [
  {
    id: 'partida',
    title: 'Dar partida',
    steps: [
      'Pé firme no freio e alavanca em N.',
      'Gire a chave e solte assim que o motor pegar.',
      'Para sair: ainda no freio, engate D ou R e só então solte o pedal.',
    ],
    avoid: 'Não existe partida no tranco nem empurrando. Com bateria fraca, use cabos auxiliares.',
  },
  {
    id: 'semaforo-curto',
    title: 'Semáforo e paradas curtas',
    steps: [
      'Fique em D segurando no freio.',
      'Não precisa ir para N: parado e sem acelerador, o sistema já desacopla a embreagem.',
    ],
    avoid: 'Não alivie o freio esperando o verde: em D o Fox anda sozinho em marcha lenta.',
  },
  {
    id: 'semaforo-longo',
    title: 'Semáforo longo e trânsito parado',
    steps: [
      'Parada de vários minutos com motor ligado: N e freio de mão para descansar o pé.',
      'Para sair: pé no freio, alavanca em D, solte o freio de mão e acelere.',
    ],
    avoid: 'De N para D ou R só com o carro parado e o freio pressionado. Nunca use N em movimento.',
  },
  {
    id: 'subida',
    title: 'Ladeira: parar e arrancar na subida',
    steps: [
      'Para segurar o carro parado, use o freio ou o freio de mão.',
      'Arrancada: freio de mão puxado, marcha engatada, acelere com suavidade e solte o freio de mão quando o carro puxar.',
      'Em subidas longas e íngremes, use o modo manual e segure 1ª ou 2ª para evitar trocas no meio da rampa.',
    ],
    avoid: 'Nunca segure o carro na rampa com o acelerador: a embreagem patina, aquece e se desgasta.',
  },
  {
    id: 'descida',
    title: 'Ladeira: descida',
    steps: ['Passe para o modo manual e reduza (toque em −) para usar o freio-motor.'],
    avoid: 'Nunca desça em N: sem freio-motor, os freios superaquecem.',
  },
  {
    id: 'estacionar',
    title: 'Estacionar sem a posição P',
    steps: [
      'Pare totalmente com o pé no freio.',
      'Deixe a alavanca engatada em D ou R: o câmbio fica engrenado como num manual.',
      'Puxe o freio de mão com firmeza e desligue o motor ainda com o pé no freio.',
      'Em rampa, esterce as rodas para o meio-fio.',
    ],
    avoid: 'Não estacione em N: o carro fica preso só pelo freio de mão.',
  },
  {
    id: 'manobras',
    title: 'Manobras e garagem',
    steps: [
      'Solte o freio aos poucos e controle a velocidade só no pedal do freio.',
      'Para engatar R, carro parado e pé no freio.',
      'Terminou a manobra: freio de mão.',
    ],
    avoid: 'Evite manobrar “no acelerador” em rampa de garagem: aquece a embreagem.',
  },
  {
    id: 'retomadas',
    title: 'Retomadas e ultrapassagens',
    steps: [
      'Pisando fundo (kick-down), o câmbio reduz até três marchas, se a rotação permitir.',
      'Para mais previsibilidade, reduza antes no modo manual e só então inicie a ultrapassagem.',
      'Nas trocas em D, aliviar levemente o acelerador deixa a passagem de marcha mais suave.',
    ],
    avoid: 'Kick-down em piso molhado pode fazer as rodas patinarem.',
  },
  {
    id: 'sobreaquecimento',
    title: 'Alerta “Câmbio sobreaquecido”',
    steps: [
      'Pare em local seguro assim que a mensagem aparecer.',
      'Freio de mão puxado; espere a mensagem apagar antes de seguir.',
    ],
    avoid: 'Insistir com a embreagem quente acelera o desgaste do disco e do atuador.',
  },
];
