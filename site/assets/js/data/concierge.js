import { CATEGORIES, KINDS } from './catalog.js';
import { needsLabel } from './insights.js';
import { PLACES } from './places.js';
import { filterPlaces, NO_FILTERS } from './placeFilters.js';
import { hasAny, interpret, normalize } from './query.js';
import { combinedScore, formatScore, rankByNeeds } from './score.js';

/** Motor do assistente: regras e palavras-chave, sem modelo de linguagem. */

export { normalize };

const GREETING_TERMS = ['oi', 'ola', 'bom dia', 'boa tarde', 'boa noite', 'e ai'];
const HELP_TERMS = ['ajuda', 'o que voce faz', 'como funciona', 'quem e voce'];
const THANKS_TERMS = ['obrigado', 'obrigada', 'valeu'];
const NEIGHBORHOODS = [...new Set(PLACES.map((place) => normalize(place.neighborhood)))];

const MAX_RESULTS = 3;

const HELP_TEXT =
  'Me diga o que você quer fazer e o que precisa, com as suas palavras. Por exemplo: "restaurante para cadeirante", "cinema tranquilo para autista" ou "museu com Libras e desconto".';

/**
 * @returns {{ text: string, results: { place, need: string, needs: string[], score: number }[] }}
 *   `need` é a primeira necessidade considerada: define a etiqueta ao lado da nota.
 */
export function reply(message, profileNeed = null, now = new Date()) {
  const text = normalize(message);
  const intent = interpret(message);
  const isSearch =
    intent.needs.length > 0 ||
    intent.kinds.length > 0 ||
    intent.categories.length > 0 ||
    intent.features.length > 0 ||
    intent.wantsDiscount;

  if (!isSearch) {
    if (hasAny(text, THANKS_TERMS)) return { text: 'Por nada! Quando quiser procurar outro lugar, é só falar.', results: [] };
    if (hasAny(text, GREETING_TERMS) || hasAny(text, HELP_TERMS)) return { text: `Oi! ${HELP_TEXT}`, results: [] };
    return { text: `Não entendi o que você procura. ${HELP_TEXT}`, results: [] };
  }

  const needs = intent.needs.length > 0 ? intent.needs : [profileNeed ?? 'mobility'];
  const usedProfile = intent.needs.length === 0 && profileNeed !== null;
  const assumed = intent.needs.length === 0 && profileNeed === null;

  // Numa conversa, só o bairro restringe a busca: "cinema legal" não pode zerar os resultados.
  const hood = intent.rest.join(' ');
  const inHood = NEIGHBORHOODS.filter((name) => hood.includes(name));
  const candidates = PLACES.filter((place) => inHood.length === 0 || inHood.includes(normalize(place.neighborhood)));
  const matches = filterPlaces(candidates, { ...NO_FILTERS, query: stripRest(message, intent.rest) }, { now, saved: [] });

  const subject =
    intent.kinds.length === 1
      ? KINDS[intent.kinds[0]].label.toLowerCase()
      : intent.categories.length === 1
        ? CATEGORIES[intent.categories[0]].label.toLowerCase()
        : 'locais';

  if (matches.length === 0) {
    return { text: `Ainda não encontrei ${subject} com tudo isso. Tente pedir menos filtros de uma vez.`, results: [] };
  }

  const results = rankByNeeds(matches, needs)
    .slice(0, MAX_RESULTS)
    .map((place) => ({ place, need: needs[0], needs, score: combinedScore(place, needs) }));
  const best = results[0];
  const label = needsLabel(needs);

  const intro =
    best.score === 0
      ? `Encontrei ${subject}, mas nenhum tem recursos confirmados para ${label}.`
      : `${best.place.name} é a melhor opção para ${label}, com nota ${formatScore(best.score)} de 5.`;
  const alert = best.score > 0 && best.place.alert ? ` Atenção: ${best.place.alert.text}` : '';
  const note = usedProfile
    ? ' Usei a necessidade do seu perfil.'
    : assumed
      ? ' Como você não disse sua necessidade, ordenei por mobilidade. Me conte qual é a sua para ajustar.'
      : '';

  return { text: intro + alert + note, results };
}

/** Tira da frase o que não virou filtro, para sobrar só o que a busca entende. */
function stripRest(message, rest) {
  return normalize(message)
    .split(' ')
    .filter((word) => !rest.includes(word))
    .join(' ');
}
