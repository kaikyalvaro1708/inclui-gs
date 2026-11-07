/**
 * Catálogo do produto: tipos de local, necessidades, recursos, categorias e planos.
 * Os ícones são nomes do Lucide, desenhados por ui/icons.js. Assim este arquivo não
 * depende do navegador e pode ser testado no Node.
 */

export const KINDS = {
  cinema: { id: 'cinema', label: 'Cinema', icon: 'clapperboard' },
  restaurante: { id: 'restaurante', label: 'Restaurante', icon: 'utensils' },
  museu: { id: 'museu', label: 'Museu', icon: 'landmark' },
  clinica: { id: 'clinica', label: 'Clínica', icon: 'stethoscope' },
  parque: { id: 'parque', label: 'Parque', icon: 'trees' },
  mercado: { id: 'mercado', label: 'Mercado', icon: 'shopping-cart' },
  cafe: { id: 'cafe', label: 'Café', icon: 'coffee' },
  teatro: { id: 'teatro', label: 'Teatro', icon: 'drama' },
  academia: { id: 'academia', label: 'Academia', icon: 'dumbbell' },
  farmacia: { id: 'farmacia', label: 'Farmácia', icon: 'pill' },
  escola: { id: 'escola', label: 'Escola', icon: 'school' },
  biblioteca: { id: 'biblioteca', label: 'Biblioteca', icon: 'library' },
  livraria: { id: 'livraria', label: 'Livraria', icon: 'book-marked' },
};

export const KIND_IDS = Object.keys(KINDS);

export const CONTACT_LABEL = {
  whatsapp: 'WhatsApp por texto',
  email: 'E-mail',
  videoLibras: 'Vídeo em Libras',
  telefone: 'Telefone',
};

export const NEEDS = {
  mobility: {
    id: 'mobility',
    label: 'Mobilidade',
    short: 'Cadeira de rodas, muletas, andador',
    description: 'Entrar, circular e usar o banheiro sem barreiras físicas.',
    icon: 'accessibility',
  },
  vision: {
    id: 'vision',
    label: 'Visão',
    short: 'Cegueira e baixa visão',
    description: 'Orientar-se com piso tátil, braile, áudio e cão-guia.',
    icon: 'eye',
  },
  hearing: {
    id: 'hearing',
    label: 'Audição',
    short: 'Surdez e deficiência auditiva',
    description: 'Ser atendido em Libras e receber avisos de forma visual.',
    icon: 'ear',
  },
  cognitive: {
    id: 'cognitive',
    label: 'Cognição',
    short: 'Autismo, TDAH, deficiência intelectual',
    description: 'Ambiente previsível, sinalização clara e menos sobrecarga.',
    icon: 'brain',
  },
};

export const NEED_IDS = Object.keys(NEEDS);

/** weight: peso na nota da necessidade. O que mais pesa é o que mais impede o acesso. */
export const FEATURES = {
  ramp: { id: 'ramp', label: 'Rampa de acesso', icon: 'footprints', need: 'mobility', weight: 3 },
  elevator: { id: 'elevator', label: 'Elevador', icon: 'arrow-up-down', need: 'mobility', weight: 2 },
  restroom: { id: 'restroom', label: 'Banheiro adaptado', icon: 'bath', need: 'mobility', weight: 3 },
  parking: { id: 'parking', label: 'Vaga reservada', icon: 'car', need: 'mobility', weight: 2 },
  braille: { id: 'braille', label: 'Braile', icon: 'book-open', need: 'vision', weight: 3 },
  tactileFloor: { id: 'tactileFloor', label: 'Piso tátil', icon: 'signpost', need: 'vision', weight: 3 },
  guideDog: { id: 'guideDog', label: 'Cão-guia bem recebido', icon: 'dog', need: 'vision', weight: 2 },
  audioGuide: { id: 'audioGuide', label: 'Audiodescrição', icon: 'audio-lines', need: 'vision', weight: 2 },
  libras: { id: 'libras', label: 'Atendimento em Libras', icon: 'hand', need: 'hearing', weight: 4 },
  visualAlerts: { id: 'visualAlerts', label: 'Avisos visuais', icon: 'lightbulb', need: 'hearing', weight: 3 },
  captions: { id: 'captions', label: 'Legendas e texto', icon: 'captions', need: 'hearing', weight: 3 },
  quietSpace: { id: 'quietSpace', label: 'Espaço tranquilo', icon: 'armchair', need: 'cognitive', weight: 3 },
  clearSignage: { id: 'clearSignage', label: 'Sinalização clara', icon: 'signpost', need: 'cognitive', weight: 4 },
  plainLanguage: { id: 'plainLanguage', label: 'Linguagem simples', icon: 'message-square-text', need: 'cognitive', weight: 3 },
};

export const FEATURE_IDS = Object.keys(FEATURES);

export const CATEGORIES = {
  alimentacao: { id: 'alimentacao', label: 'Alimentação', description: 'Restaurantes, cafés e padarias', icon: 'utensils' },
  cultura: { id: 'cultura', label: 'Cultura', description: 'Museus, teatros e cinemas', icon: 'landmark' },
  saude: { id: 'saude', label: 'Saúde', description: 'Clínicas, academias e bem-estar', icon: 'heart-pulse' },
  educacao: { id: 'educacao', label: 'Educação', description: 'Escolas, cursos e bibliotecas', icon: 'graduation-cap' },
  lazer: { id: 'lazer', label: 'Lazer', description: 'Parques e espaços ao ar livre', icon: 'tree-pine' },
  compras: { id: 'compras', label: 'Compras', description: 'Mercados, livrarias e lojas', icon: 'shopping-bag' },
};

export const CATEGORY_IDS = Object.keys(CATEGORIES);

export const PLANS = {
  basico: {
    id: 'basico',
    name: 'Básico',
    price: 'R$ 0',
    period: 'para sempre',
    pitch: 'Para o seu negócio aparecer e receber as primeiras avaliações.',
    perks: ['Perfil do local no mapa', 'Nota pública por necessidade', 'Resposta a verificações da comunidade'],
  },
  plus: {
    id: 'plus',
    name: 'Plus',
    price: 'R$ 149',
    period: 'por mês, por unidade',
    pitch: 'Para quem quer saber o que melhorar e atrair esse público.',
    perks: ['Tudo do Básico', 'Relatório do que falta em cada necessidade', 'Divulgação de descontos e benefícios', 'Selo de local verificado'],
    featured: true,
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 'Sob consulta',
    period: 'redes e grupos',
    pitch: 'Para redes com muitas unidades e metas de inclusão a reportar.',
    perks: ['Tudo do Plus', 'Painel com todas as unidades', 'Dados para relatórios ESG', 'Treinamento de equipe em atendimento'],
  },
};

export const PLAN_IDS = Object.keys(PLANS);
