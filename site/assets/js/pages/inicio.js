import { CATEGORIES, NEEDS } from '../data/catalog.js';
import { findPlace, PLACES } from '../data/places.js';
import { computeNeedScore, rankByNeed } from '../data/score.js';
import { accessibilityScore, needPicker, scoreBar, scorePill } from '../ui/components.js';
import { $, html, render } from '../ui/dom.js';
import { openConcierge, user } from '../ui/layout.js';

/* Demonstração do hero: o ranking muda conforme a necessidade escolhida. */

let need = user?.role === 'client' && user.need ? user.need : 'mobility';

function paintDemo() {
  render($('#demo-picker'), needPicker([need], 'Escolha a necessidade'));
  const rank = $('#demo-rank');
  rank.setAttribute('aria-label', `Melhores locais para ${NEEDS[need].label.toLowerCase()}`);
  render(rank, html`${rankByNeed(PLACES, need)
    .slice(0, 3)
    .map((place, index) => {
      const { score } = computeNeedScore(place, need);
      return html`<li class="rank-row">
        <b aria-hidden="true">${index + 1}</b>
        <div><strong>${place.name}</strong><small>${CATEGORIES[place.category].label} · ${place.neighborhood}</small></div>
        ${scorePill(score)}
        ${scoreBar(score)}
      </li>`;
    })}`);
  $('#demo-link').href = `mapa.html?necessidade=${need}`;
}

$('#demo-picker').addEventListener('click', (event) => {
  const option = event.target.closest('[data-need]');
  if (!option) return;
  need = option.dataset.need;
  paintDemo();
});

paintDemo();

/* O mesmo local, quatro respostas. */
const museum = findPlace('museu-horizonte');
$('#example-name').textContent = museum.name;
render($('#example-scores'), accessibilityScore(museum));

$('#open-concierge').addEventListener('click', () => openConcierge());
