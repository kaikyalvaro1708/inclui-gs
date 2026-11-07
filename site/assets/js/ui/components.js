import { NEED_IDS, NEEDS } from '../data/catalog.js';
import { computeAccessibilityScore, formatScore, LEVEL_LABEL, scoreLevel } from '../data/score.js';
import { html } from './dom.js';
import { icon } from './icons.js';

/** Nota compacta, com texto completo para leitor de tela: a cor nunca é a única pista. */
export function scorePill(score, label) {
  const level = scoreLevel(score);
  const text = `${label ? `${label}: ` : ''}nota ${formatScore(score)} de 5, ${LEVEL_LABEL[level].toLowerCase()}`;
  return html`<span class="score-pill" data-level="${level}" role="img" aria-label="${text}" title="${text}">${formatScore(score)}</span>`;
}

export function scoreBar(score) {
  return html`<div class="score-track" aria-hidden="true"><div class="score-fill" data-level="${scoreLevel(score)}" style="width:${(score / 5) * 100}%"></div></div>`;
}

/** As quatro notas de um local, uma por linha. place precisa de features e photoVerifications. */
export function accessibilityScore(place, highlight) {
  const scores = computeAccessibilityScore(place);
  return html`<ul class="score-list">
    ${NEED_IDS.map((need) => {
      const { score } = scores[need];
      const level = scoreLevel(score);
      return html`<li class="${highlight === need ? 'is-active' : ''}">
        ${icon(NEEDS[need].icon, 18)}
        <span>${NEEDS[need].label}</span>
        ${scoreBar(score)}
        <span class="score-value" data-level="${level}"><span class="sr-only">nota </span>${formatScore(score)}<span class="sr-only"> de 5, ${LEVEL_LABEL[level].toLowerCase()}</span></span>
      </li>`;
    })}
  </ul>`;
}

/** Seletor das quatro necessidades. Cada botão leva data-need; quem usa trata o clique. */
export function needPicker(selected, label) {
  return html`<div class="need-picker" role="group" aria-label="${label}">
    ${NEED_IDS.map(
      (id) => html`<button type="button" class="need-option" data-need="${id}" data-key="need-${id}" aria-pressed="${String(selected.includes(id))}">
        ${icon(NEEDS[id].icon, 18)} ${NEEDS[id].label}
      </button>`,
    )}
  </div>`;
}
