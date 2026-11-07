import { RIGHT_TOPICS, RIGHTS } from '../data/rights.js';
import { $, html, render } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import '../ui/layout.js';

const OPTIONS = [['todos', 'Todos'], ...Object.entries(RIGHT_TOPICS)];
let topic = 'todos';

function paint() {
  render(
    $('#topic-filters'),
    OPTIONS.map(
      ([id, label]) =>
        html`<button type="button" class="topic-chip" data-topic="${id}" data-key="topic-${id}" aria-pressed="${String(topic === id)}">${label}</button>`,
    ),
  );
  render(
    $('#rights'),
    RIGHTS.filter((right) => topic === 'todos' || right.topic === topic).map(
      (right) => html`<li class="info-card">
        ${icon(right.icon, 24)}
        <h2>${right.title}</h2>
        <p>${right.summary}</p>
        <small class="law">${right.law}</small>
      </li>`,
    ),
  );
}

$('#topic-filters').addEventListener('click', (event) => {
  const chip = event.target.closest('[data-topic]');
  if (!chip) return;
  topic = chip.dataset.topic;
  paint();
});

paint();
