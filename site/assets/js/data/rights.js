export const RIGHT_TOPICS = {
  cultura: 'Cultura e lazer',
  transporte: 'Transporte',
  atendimento: 'Atendimento',
};

/** Direitos reais, com a lei citada. Texto informativo, não substitui orientação jurídica. */
export const RIGHTS = [
  {
    id: 'meia-entrada',
    title: 'Meia-entrada',
    summary: 'Pessoa com deficiência paga metade do ingresso em eventos culturais e esportivos. O acompanhante também, quando necessário.',
    law: 'Lei 12.933/2013',
    topic: 'cultura',
    icon: 'ticket',
  },
  {
    id: 'passe-livre',
    title: 'Passe Livre interestadual',
    summary: 'Viagem gratuita em ônibus, trem e barco entre estados para pessoas com deficiência comprovadamente carentes.',
    law: 'Lei 8.899/1994',
    topic: 'transporte',
    icon: 'bus',
  },
  {
    id: 'vagas',
    title: 'Vagas reservadas',
    summary: 'Ao menos 2% das vagas de estacionamentos de uso público são reservadas, com um mínimo de uma vaga.',
    law: 'Lei 13.146/2015, art. 47',
    topic: 'transporte',
    icon: 'car',
  },
  {
    id: 'prioridade',
    title: 'Atendimento prioritário',
    summary: 'Repartições públicas, bancos e concessionárias devem dar atendimento prioritário à pessoa com deficiência.',
    law: 'Lei 10.048/2000',
    topic: 'atendimento',
    icon: 'clock',
  },
  {
    id: 'cao-guia',
    title: 'Cão-guia em qualquer lugar',
    summary: 'Pessoa com deficiência visual pode entrar e permanecer com o cão-guia em locais públicos e de uso coletivo.',
    law: 'Lei 11.126/2005',
    topic: 'atendimento',
    icon: 'dog',
  },
];
