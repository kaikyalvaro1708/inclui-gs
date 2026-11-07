import { FEATURE_IDS, FEATURES, NEED_IDS, NEEDS, PLAN_IDS, PLANS } from '../data/catalog.js';
import { computeAccessibilityScore, formatScore } from '../data/score.js';
import { accessibilityScore } from '../ui/components.js';
import { $, html, render } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { mountReveal } from '../ui/layout.js';

/* ---------- Simulador: a mesma fórmula do mapa, sobre um local imaginário ---------- */

const INITIAL = ['ramp', 'clearSignage'];

render($('#sim-groups'), html`${NEED_IDS.map(
  (need) => html`<fieldset>
    <legend>${icon(NEEDS[need].icon, 18)} ${NEEDS[need].label}</legend>
    ${FEATURE_IDS.filter((id) => FEATURES[id].need === need).map(
      (id) => html`<label class="sim-option"><input type="checkbox" value="${id}" ${INITIAL.includes(id) ? 'checked' : ''} /> ${FEATURES[id].label}</label>`,
    )}
  </fieldset>`,
)}`);

function paintSimulator() {
  const features = [...document.querySelectorAll('#sim-groups input:checked')].map((input) => input.value);
  const place = { features, photoVerifications: 0 };
  const scores = computeAccessibilityScore(place);
  const best = NEED_IDS.reduce((a, b) => (scores[b].score > scores[a].score ? b : a));
  const worst = NEED_IDS.reduce((a, b) => (scores[b].score < scores[a].score ? b : a));

  render($('#sim-scores'), accessibilityScore(place));
  render($('#sim-total'), (
    scores[best].score === scores[worst].score
      ? html`${features.length === 0 ? 'Marque os recursos do seu local para ver a nota.' : 'Seu local atende as quatro necessidades por igual.'}`
      : html`Hoje seu ponto forte é <strong>${NEEDS[best].label.toLowerCase()}</strong> (${formatScore(scores[best].score)}). A maior oportunidade está em <strong>${NEEDS[worst].label.toLowerCase()}</strong> (${formatScore(scores[worst].score)}).`
  ));
}

$('#sim-groups').addEventListener('change', paintSimulator);
paintSimulator();

/* ---------- Planos ---------- */

render($('#plans'), html`${PLAN_IDS.map((id, index) => {
  const plan = PLANS[id];
  return html`<li>
    <div class="reveal" data-delay="${index}">
      <div class="plan ${plan.featured ? 'is-featured' : ''}">
        <div class="plan-head">
          <h3>${plan.name}</h3>
          ${plan.featured && html`<span class="badge badge-accent">Recomendado</span>`}
        </div>
        <p class="plan-price">${plan.price}</p>
        <p class="plan-period">${plan.period}</p>
        <p class="plan-pitch">${plan.pitch}</p>
        <ul class="plan-perks">${plan.perks.map((perk) => html`<li>${icon('check', 16)} ${perk}</li>`)}</ul>
        <a class="btn btn-block ${plan.featured ? 'btn-primary' : 'btn-secondary'}" href="cadastro.html?tipo=parceiro&amp;plano=${id}">Escolher ${plan.name}</a>
      </div>
    </div>
  </li>`;
})}`);
mountReveal($('#plans'));
