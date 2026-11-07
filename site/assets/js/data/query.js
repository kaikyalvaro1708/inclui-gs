/** Interpreta uma frase livre: é o que mapa e assistente têm em comum. */

const NEED_TERMS = {
  mobility: ['cadeirante', 'cadeira de rodas', 'rampa', 'elevador', 'muleta', 'andador', 'mobilidade', 'degrau', 'degraus', 'escada', 'deficiencia fisica'],
  vision: ['cego', 'cega', 'cegueira', 'baixa visao', 'visao', 'visual', 'braile', 'braille', 'cao-guia', 'cao guia', 'piso tatil', 'audiodescricao', 'enxergo'],
  hearing: ['surdo', 'surda', 'surdez', 'libras', 'audicao', 'auditiva', 'interprete', 'legenda', 'nao escuto', 'nao ouco'],
  cognitive: ['autista', 'autismo', 'tea', 'tdah', 'sensorial', 'tranquilo', 'tranquila', 'silencioso', 'silenciosa', 'calmo', 'calma', 'sem barulho', 'cognitiva', 'cognitivo', 'cognicao', 'intelectual', 'barulho'],
};

const KIND_TERMS = {
  cinema: ['cinema', 'cinemas', 'filme', 'filmes'],
  teatro: ['teatro', 'teatros', 'peca'],
  museu: ['museu', 'museus', 'exposicao'],
  restaurante: ['restaurante', 'restaurantes', 'pizzaria', 'pizza', 'bistro', 'almoco', 'almocar', 'jantar'],
  cafe: ['cafe', 'cafes', 'cafeteria'],
  clinica: ['clinica', 'clinicas', 'medico', 'medica', 'consulta', 'terapia', 'dentista', 'hospital'],
  academia: ['academia', 'academias', 'treino', 'treinar', 'musculacao'],
  farmacia: ['farmacia', 'farmacias', 'remedio', 'remedios'],
  escola: ['escola', 'escolas', 'curso', 'cursos', 'faculdade', 'aula', 'estudar'],
  biblioteca: ['biblioteca', 'bibliotecas', 'ler'],
  parque: ['parque', 'parques', 'praca', 'pracas', 'trilha', 'passear', 'passeio', 'ar livre', 'crianca', 'brincar'],
  mercado: ['mercado', 'mercados', 'supermercado'],
  livraria: ['livraria', 'livrarias', 'livro', 'livros'],
};

const CATEGORY_TERMS = {
  alimentacao: ['comer', 'comida', 'lanche', 'alimentacao'],
  cultura: ['cultura', 'show'],
  saude: ['saude'],
  educacao: ['educacao'],
  lazer: ['lazer'],
  compras: ['compras', 'comprar', 'loja', 'shopping'],
};

const FEATURE_TERMS = {
  ramp: ['rampa', 'sem degrau', 'sem degraus', 'sem escada'],
  elevator: ['elevador'],
  restroom: ['banheiro'],
  parking: ['estacionamento', 'vaga', 'estacionar'],
  braille: ['braile', 'braille'],
  tactileFloor: ['piso tatil'],
  guideDog: ['cao-guia', 'cao guia'],
  audioGuide: ['audiodescricao'],
  libras: ['libras', 'interprete'],
  captions: ['legenda', 'legendas'],
  quietSpace: ['tranquilo', 'tranquila', 'silencioso', 'silenciosa', 'calmo', 'calma', 'sem barulho'],
};

const DISCOUNT_TERMS = ['desconto', 'descontos', 'promocao', 'meia-entrada', 'meia entrada', 'barato', 'beneficio', 'gratis'];
const OPEN_TERMS = ['aberto', 'aberta', 'abertos', 'abertas', 'aberto agora', 'agora'];
const STOP_WORDS = new Set(
  'a ao aos as com da das de do dos e em eu ir lugar lugares local locais me meu minha na nas no nos o os ou para pela pelo perto por pra preciso procuro que quero sem tem um uma uns umas vou'.split(' '),
);

export const normalize = (text) =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

/** Compara palavras inteiras, para "tea" não casar com "teatro" nem "ler" com "galeria". */
export const hasTerm = (text, term) => ` ${text} `.includes(` ${term} `);
export const hasAny = (text, terms) => terms.some((term) => hasTerm(text, term));

const keysMatching = (text, table) => Object.keys(table).filter((key) => hasAny(text, table[key] ?? []));

/**
 * @returns {{ needs: string[], kinds: string[], categories: string[], features: string[],
 *   wantsDiscount: boolean, wantsOpen: boolean, rest: string[] }}
 *   `rest` guarda as palavras que não viraram filtro: nome do local ou bairro, por exemplo.
 */
export function interpret(message) {
  const text = normalize(message);
  const tables = [NEED_TERMS, KIND_TERMS, CATEGORY_TERMS, FEATURE_TERMS];
  const allTerms = [...tables.flatMap((table) => Object.values(table).flat()), ...DISCOUNT_TERMS, ...OPEN_TERMS];

  // Termos mais longos primeiro, para "cadeira de rodas" sair inteiro antes de qualquer pedaço.
  let remaining = ` ${text} `;
  for (const term of [...new Set(allTerms)].sort((a, b) => b.length - a.length)) {
    remaining = remaining.split(` ${term} `).join('  ');
  }

  return {
    needs: keysMatching(text, NEED_TERMS),
    kinds: keysMatching(text, KIND_TERMS),
    categories: keysMatching(text, CATEGORY_TERMS),
    features: keysMatching(text, FEATURE_TERMS),
    wantsDiscount: hasAny(text, DISCOUNT_TERMS),
    wantsOpen: hasAny(text, OPEN_TERMS),
    rest: remaining.split(' ').filter((word) => word && !STOP_WORDS.has(word)),
  };
}
