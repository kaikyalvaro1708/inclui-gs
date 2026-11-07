import { FEATURE_IDS, FEATURES, KINDS, NEEDS } from './catalog.js';
import { combinedScore, computeNeedScore, formatScore, scoreLevel } from './score.js';

/** Transforma dados em respostas às perguntas que a pessoa faz antes de sair de casa. */

export const needsLabel = (needs) => {
  const names = needs.map((need) => NEEDS[need].label.toLowerCase());
  return names.length > 1 ? `${names.slice(0, -1).join(', ')} e ${names[names.length - 1]}` : (names[0] ?? '');
};

export function verdict(place, needs) {
  if (needs.length === 0) {
    return { level: null, title: 'Funciona para você?', detail: 'Escolha sua necessidade na lista para ver a resposta.' };
  }
  const label = needsLabel(needs);
  const level = scoreLevel(combinedScore(place, needs));
  if (level === 'good') return { level, title: 'Deve funcionar bem para você', detail: `Boa estrutura para ${label}.` };
  if (level === 'mid') return { level, title: 'Funciona em parte', detail: `Vale conferir o que falta para ${label}.` };
  return { level, title: 'Você pode encontrar barreiras', detail: `Faltam recursos importantes para ${label}.` };
}

export function missingFor(place, needs) {
  const ids = needs.flatMap((need) => computeNeedScore(place, need).missing);
  return ids.sort((a, b) => FEATURES[b].weight - FEATURES[a].weight);
}

export function presentFor(place, needs) {
  if (needs.length === 0) return FEATURE_IDS.filter((id) => place.features.includes(id));
  return needs.flatMap((need) => computeNeedScore(place, need).present);
}

/** Linha curta da lista: resolve a dúvida sem precisar abrir o cartão. */
export function listSummary(place, needs) {
  if (needs.length === 0) return null;
  const missing = missingFor(place, needs);
  if (missing.length === 0) return `Tem tudo para ${needsLabel(needs)}`;
  const shown = missing.slice(0, 2).map((id) => FEATURES[id].label);
  return `Falta: ${shown.join(', ')}${missing.length > 2 ? ` e mais ${missing.length - 2}` : ''}`;
}

const FEATURE_TIP = {
  ramp: 'Sem rampa confirmada na entrada.',
  elevator: 'Sem elevador: confira se o que você quer fica no térreo.',
  restroom: 'Sem banheiro adaptado: planeje o tempo da visita.',
  parking: 'Sem vaga reservada: considere chegar de outra forma.',
  braille: 'Sem material em braile: peça que leiam para você.',
  tactileFloor: 'Sem piso tátil até a entrada.',
  guideDog: 'A entrada do cão-guia é garantida por lei, mas a equipe pode não estar preparada.',
  audioGuide: 'Sem audiodescrição.',
  libras: 'Sem atendimento em Libras: leve o pedido por escrito.',
  visualAlerts: 'Sem avisos visuais: combine com a equipe como será chamado.',
  captions: 'Sem legendas ou informações por escrito.',
  quietSpace: 'Sem espaço tranquilo para fazer uma pausa.',
  clearSignage: 'Sinalização pouco clara: vale olhar as fotos antes.',
  plainLanguage: 'As informações não estão em linguagem simples.',
};

export function beforeYouGo(place, needs) {
  const tips = [];
  if (needs.includes('mobility')) {
    if (place.entrance.steps > 0) tips.push(`A entrada tem ${place.entrance.steps} ${place.entrance.steps === 1 ? 'degrau' : 'degraus'}.`);
    if (place.entrance.doorWidthCm < 80) tips.push(`A porta tem ${place.entrance.doorWidthCm} cm, estreita para muitas cadeiras de rodas.`);
  }
  if (needs.includes('cognitive')) {
    if (place.sensory.noise === 3) tips.push('O ambiente costuma ser barulhento.');
    if (place.sensory.crowd === 3) tips.push('Costuma ficar cheio.');
    if (place.sensory.quietTime) tips.push(`Melhor horário: ${place.sensory.quietTime.toLowerCase()}.`);
  }
  if (needs.includes('hearing') && place.contact.every((channel) => channel === 'telefone')) {
    tips.push('O único contato é por telefone.');
  }
  const stepsCovered = tips.length > 0 && place.entrance.steps > 0;
  for (const id of missingFor(place, needs)) {
    if (id === 'ramp' && stepsCovered) continue;
    tips.push(FEATURE_TIP[id]);
  }
  return tips.slice(0, 4);
}

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

export function isOpenAt(place, date) {
  if (place.hours.closedDays?.includes(date.getDay())) return false;
  const minutes = date.getHours() * 60 + date.getMinutes();
  return minutes >= toMinutes(place.hours.open) && minutes < toMinutes(place.hours.close);
}

export function hoursLabel(place, date) {
  if (isOpenAt(place, date)) return `Aberto até ${place.hours.close}`;
  const closedToday = place.hours.closedDays?.includes(date.getDay());
  const beforeOpening = date.getHours() * 60 + date.getMinutes() < toMinutes(place.hours.open);
  return closedToday || !beforeOpening ? 'Fechado agora' : `Abre às ${place.hours.open}`;
}

export const SENSORY_LABEL = { 1: 'Baixo', 2: 'Médio', 3: 'Alto' };

export function daysAgoLabel(days) {
  if (days === 0) return 'hoje';
  if (days === 1) return 'ontem';
  if (days < 30) return `há ${days} dias`;
  const months = Math.round(days / 30);
  return months === 1 ? 'há 1 mês' : `há ${months} meses`;
}

export function distanceKm(a, b) {
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 6371 * 2 * Math.asin(Math.sqrt(h));
}

export function formatDistance(km) {
  if (km < 1) return `${Math.round(km * 100) * 10} m`;
  return `${km.toFixed(km < 10 ? 1 : 0).replace('.', ',')} km`;
}

/** Texto corrido para o botão "Ouvir". */
export function describePlace(place, needs, date) {
  const parts = [`${place.name}. ${KINDS[place.kind].label} em ${place.neighborhood}. ${hoursLabel(place, date)}.`];
  if (needs.length > 0) {
    const result = verdict(place, needs);
    parts.push(`${result.title}. Nota ${formatScore(combinedScore(place, needs))} de 5 para ${needsLabel(needs)}.`);
  }
  if (place.alert) parts.push(`Atenção: ${place.alert.text}`);
  parts.push(place.description);
  const tips = beforeYouGo(place, needs);
  if (tips.length > 0) parts.push(`Bom saber antes de ir: ${tips.join(' ')}`);
  parts.push(`Como é a visita: ${place.expect.join(' ')}`);
  parts.push(`Como chegar: ${place.transit}`);
  return parts.join(' ');
}
