import { FEATURE_IDS, FEATURES, NEED_IDS } from './catalog.js';

/** A partir de quantas fotos a evidência é considerada completa. */
const FULL_EVIDENCE_PHOTOS = 20;
/** Parte da nota que vem das fotos: recursos declarados sozinhos chegam a 4,5. */
const EVIDENCE_POINTS = 0.5;
const COVERAGE_POINTS = 5 - EVIDENCE_POINTS;

/**
 * Heurística determinística do MVP. A nota só depende de `features` e `photoVerifications`,
 * o que permite simular um local que ainda não existe. Para cada necessidade, combina:
 * - cobertura: soma dos pesos dos recursos presentes, sobre o total daquela necessidade;
 * - evidência: quantidade de fotos, proporcional à cobertura, para que muitas fotos
 *   nunca deem nota a um local que não tem nenhum recurso para aquela necessidade.
 */
export function computeNeedScore(place, need) {
  const ofNeed = FEATURE_IDS.filter((id) => FEATURES[id].need === need);
  const present = ofNeed.filter((id) => place.features.includes(id));
  const missing = ofNeed.filter((id) => !place.features.includes(id));

  const weightOf = (ids) => ids.reduce((sum, id) => sum + FEATURES[id].weight, 0);
  const coverage = weightOf(present) / weightOf(ofNeed);
  const evidence = Math.min(place.photoVerifications / FULL_EVIDENCE_PHOTOS, 1);

  const score = coverage * (COVERAGE_POINTS + evidence * EVIDENCE_POINTS);
  return { need, score: Math.round(score * 10) / 10, present, missing };
}

export function computeAccessibilityScore(place) {
  return Object.fromEntries(NEED_IDS.map((need) => [need, computeNeedScore(place, need)]));
}

export function rankByNeed(places, need) {
  return [...places].sort(
    (a, b) =>
      computeNeedScore(b, need).score - computeNeedScore(a, need).score ||
      b.photoVerifications - a.photoVerifications ||
      a.name.localeCompare(b.name, 'pt-BR'),
  );
}

/**
 * Nota de um grupo de necessidades: vale a mais baixa, porque uma única barreira já
 * impede a visita. Sem necessidade escolhida, mostra a média das quatro.
 */
export function combinedScore(place, needs) {
  if (needs.length === 0) return averageScore(place);
  return Math.min(...needs.map((need) => computeNeedScore(place, need).score));
}

export function rankByNeeds(places, needs) {
  return [...places].sort(
    (a, b) =>
      combinedScore(b, needs) - combinedScore(a, needs) ||
      b.photoVerifications - a.photoVerifications ||
      a.name.localeCompare(b.name, 'pt-BR'),
  );
}

export function averageScore(place) {
  const scores = NEED_IDS.map((need) => computeNeedScore(place, need).score);
  return Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 10) / 10;
}

/** @returns {'good' | 'mid' | 'low'} */
export function scoreLevel(score) {
  if (score >= 4) return 'good';
  if (score >= 2.5) return 'mid';
  return 'low';
}

export const LEVEL_LABEL = {
  good: 'Muito acessível',
  mid: 'Atende em parte',
  low: 'Muitas barreiras',
};

export function formatScore(score) {
  return score.toFixed(1).replace('.', ',');
}
