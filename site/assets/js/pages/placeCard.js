import { CONTACT_LABEL, FEATURES, KINDS, NEED_IDS, NEEDS } from '../data/catalog.js';
import {
  beforeYouGo,
  daysAgoLabel,
  describePlace,
  formatDistance,
  hoursLabel,
  isOpenAt,
  missingFor,
  needsLabel,
  presentFor,
  SENSORY_LABEL,
  verdict,
} from '../data/insights.js';
import { combinedScore } from '../data/score.js';
import { accessibilityScore, scorePill } from '../ui/components.js';
import { html, render } from '../ui/dom.js';
import { icon } from '../ui/icons.js';

/**
 * Cartão de detalhes de um local, aberto no mapa. Não é modal: o mapa continua usável.
 *
 * openPlaceCard(root, { place, needs, now, distance, isSaved, myReports,
 *   onToggleSave, onAddReport, onClose }) devolve { update(props), destroy() }.
 */

const TABS = [
  { id: 'resumo', label: 'Resumo' },
  { id: 'chegada', label: 'Chegada' },
  { id: 'ambiente', label: 'Ambiente' },
  { id: 'relatos', label: 'Relatos' },
];

const canSpeak = 'speechSynthesis' in window;

export function openPlaceCard(root, initialProps) {
  let props = initialProps;
  const { place } = props;
  const state = {
    tab: 'resumo',
    speaking: false,
    status: '',
    reportNeed: props.needs[0] ?? 'mobility',
    reportText: '',
    reportError: '',
    reportSent: false,
  };

  render(root, html`<div class="place-card" role="dialog" aria-labelledby="place-card-title" data-surface="light">
      <header class="pc-head" id="pc-head"></header>
      <div class="pc-tabs" id="pc-tabs" role="tablist" aria-label="Informações do local"></div>
      <div class="pc-panel" id="place-panel" role="tabpanel" tabindex="0"></div>
      <p class="pc-foot">Local fictício, para demonstração</p>
    </div>`);

  const card = root.firstElementChild;
  const head = card.querySelector('#pc-head');
  const tabs = card.querySelector('#pc-tabs');
  const panel = card.querySelector('#place-panel');

  /* ---------- Partes ---------- */

  const paintHead = () => {
    const open = isOpenAt(place, props.now);
    render(
      head,
      html`<div class="pc-head-row">
          <h2 id="place-card-title" tabindex="-1">${place.name}</h2>
          <button type="button" class="pc-close" data-action="close" data-key="close" aria-label="Fechar detalhes">${icon('x', 20)}</button>
        </div>
        <p class="pc-sub">${icon(KINDS[place.kind].icon, 14)}${KINDS[place.kind].label} · ${place.neighborhood}${props.distance !== null ? ` · a ${formatDistance(props.distance)}` : ''}</p>
        <p class="pc-sub"><span class="pc-open ${open ? 'is-open' : ''}">${hoursLabel(place, props.now)}</span> · ${place.hours.open} às ${place.hours.close}</p>
        <div class="pc-actions">
          <button type="button" class="pc-action" data-action="save" data-key="save" aria-pressed="${String(props.isSaved)}">
            ${icon(props.isSaved ? 'bookmark-check' : 'bookmark', 20)} ${props.isSaved ? 'Salvo' : 'Salvar'}
          </button>
          ${canSpeak &&
          html`<button type="button" class="pc-action" data-action="speak" data-key="speak" aria-pressed="${String(state.speaking)}">
            ${icon(state.speaking ? 'square' : 'volume-2', 20)} ${state.speaking ? 'Parar' : 'Ouvir'}
          </button>`}
          <a class="pc-action" href="https://www.openstreetmap.org/directions?to=${place.lat}%2C${place.lng}" target="_blank" rel="noreferrer">${icon('navigation', 20)} Como chegar</a>
          <button type="button" class="pc-action" data-action="share" data-key="share">${icon('share-2', 20)} Compartilhar</button>
        </div>
        <p class="pc-status" role="status">${state.status}</p>`,
    );
  };

  const reportCount = () => place.reports.length + props.myReports.length;

  const paintTabs = () => {
    render(
      tabs,
      TABS.map(
        (tab) => html`<button type="button" class="pc-tab" role="tab" id="tab-${tab.id}" data-tab="${tab.id}" data-key="tab-${tab.id}"
          aria-selected="${String(state.tab === tab.id)}" aria-controls="place-panel" tabindex="${state.tab === tab.id ? '0' : '-1'}">
          ${tab.id === 'relatos' ? `Relatos (${reportCount()})` : tab.label}
        </button>`,
      ),
    );
    panel.setAttribute('aria-labelledby', `tab-${state.tab}`);
  };

  const summaryPanel = () => {
    const { needs } = props;
    const result = verdict(place, needs);
    const tips = beforeYouGo(place, needs);
    const present = presentFor(place, needs);
    const missing = missingFor(place, needs);
    return html`
      <div class="pc-verdict" ${result.level ? html`data-level="${result.level}"` : ''}>
        <div><strong>${result.title}</strong><span>${result.detail}</span></div>
        ${result.level && scorePill(combinedScore(place, needs), needsLabel(needs))}
      </div>
      ${place.alert &&
      html`<p class="pc-alert">${icon('triangle-alert', 18)}<span>${place.alert.text}<small>Relatado ${daysAgoLabel(place.alert.daysAgo)}</small></span></p>`}
      <p>${place.description}</p>
      ${needs.length > 0 &&
      tips.length > 0 &&
      html`<div><h3>Bom saber antes de ir</h3><ul class="pc-tips">${tips.map((tip) => html`<li>${icon('circle-alert', 16)} ${tip}</li>`)}</ul></div>`}
      <div><h3>Notas por necessidade</h3>${accessibilityScore(place, needs.length === 1 ? needs[0] : undefined)}</div>
      ${present.length > 0 &&
      html`<div>
        <h3>${needs.length > 0 ? `O que tem para ${needsLabel(needs)}` : 'O que o local tem'}</h3>
        <ul class="pc-features">${present.map((id) => html`<li>${icon('circle-check', 16, 'is-good')} ${FEATURES[id].label}</li>`)}</ul>
      </div>`}
      ${missing.length > 0 &&
      html`<div>
        <h3>O que falta</h3>
        <ul class="pc-features">${missing.map((id) => html`<li>${icon('circle-minus', 16, 'is-low')} ${FEATURES[id].label}</li>`)}</ul>
      </div>`}
      <div class="pc-meta">
        <span class="badge badge-accent">${icon('camera', 13)} ${place.photoVerifications} fotos · verificado ${daysAgoLabel(place.verifiedDaysAgo)}</span>
        ${place.discount && html`<span class="badge badge-accent">${icon('tag', 13)} ${place.discount}</span>`}
      </div>`;
  };

  const arrivalPanel = () => html`
    <div>
      <h3>Na entrada</h3>
      <dl class="pc-facts">
        <div><dt>${icon('footprints', 16)} Degraus</dt><dd>${place.entrance.steps === 0 ? 'Nenhum: entrada no nível da rua ou com rampa' : `${place.entrance.steps} degraus`}</dd></div>
        <div><dt>${icon('door-open', 16)} Largura da porta</dt><dd>${place.entrance.doorWidthCm} cm</dd></div>
        <div><dt>${icon('bus', 16)} Transporte</dt><dd>${place.transit}</dd></div>
        <div><dt>${icon('message-square', 16)} Como falar com o local</dt><dd>${place.contact.map((channel) => CONTACT_LABEL[channel]).join(', ')}</dd></div>
      </dl>
    </div>
    <div>
      <h3>O que esperar, passo a passo</h3>
      <ol class="pc-steps">${place.expect.map((step) => html`<li><span>${step}</span></li>`)}</ol>
    </div>`;

  const sensory = (label, value) => html`<div>
    <dt>${label}</dt>
    <div class="pc-dots" aria-hidden="true">${[1, 2, 3].map((level) => html`<span class="${level <= value ? 'is-on' : ''}"></span>`)}</div>
    <dd>${SENSORY_LABEL[value]}</dd>
  </div>`;

  const environmentPanel = () => html`
    <div>
      <h3>Como costuma ser</h3>
      <dl class="pc-sensory">
        ${sensory('Barulho', place.sensory.noise)}
        ${sensory('Luz', place.sensory.light)}
        ${sensory('Movimento', place.sensory.crowd)}
      </dl>
    </div>
    ${place.sensory.quietTime &&
    html`<p class="pc-quiet">${icon('clock', 18)}<span><strong>Horário mais tranquilo:</strong> ${place.sensory.quietTime}</span></p>`}
    <p class="note">Informações úteis para pessoas com sensibilidade sensorial e para quem prefere lugares mais calmos.</p>`;

  const reportsPanel = () => html`
    ${reportCount() > 0
      ? html`<ul>
          ${props.myReports.map(
            (report) => html`<li class="pc-report"><p>${report.text}</p><small>Seu relato · ${NEEDS[report.need]?.label ?? ''} · só neste navegador</small></li>`,
          )}
          ${place.reports.map((report) => html`<li class="pc-report"><p>${report.text}</p><small>${report.author} · ${daysAgoLabel(report.daysAgo)}</small></li>`)}
        </ul>`
      : html`<p class="note">Ainda não há relatos. O seu pode ser o primeiro.</p>`}
    <form class="pc-report-form" id="report-form" novalidate>
      <h3>${icon('accessibility', 16)}Esteve aqui? Conte como foi</h3>
      <label>Sobre qual necessidade?
        <select id="report-need" data-key="report-need">
          ${NEED_IDS.map((id) => html`<option value="${id}" ${state.reportNeed === id ? 'selected' : ''}>${NEEDS[id].label}</option>`)}
        </select>
      </label>
      <label>O que você encontrou?
        <textarea id="report-text" data-key="report-text" maxlength="400" aria-invalid="${String(Boolean(state.reportError))}">${state.reportText}</textarea>
      </label>
      ${state.reportError && html`<p class="error-note" role="alert">${state.reportError}</p>`}
      ${state.reportSent && html`<p class="note" role="status">Obrigado! Seu relato foi salvo.</p>`}
      <button type="submit" class="btn btn-primary btn-block" data-key="report-submit">Enviar relato</button>
      <p class="note">Nesta demonstração, seu relato fica só neste navegador e não muda a nota.</p>
    </form>`;

  const PANELS = { resumo: summaryPanel, chegada: arrivalPanel, ambiente: environmentPanel, relatos: reportsPanel };

  const paintPanel = ({ keepScroll = false } = {}) => {
    const scroll = panel.scrollTop;
    render(panel, PANELS[state.tab]());
    panel.scrollTop = keepScroll ? scroll : 0;
  };

  const paintAll = (options) => {
    paintHead();
    paintTabs();
    paintPanel(options);
  };

  /* ---------- Ações ---------- */

  const stopSpeech = () => {
    if (canSpeak) window.speechSynthesis.cancel();
    state.speaking = false;
  };

  const toggleSpeech = () => {
    if (state.speaking) {
      stopSpeech();
    } else {
      const utterance = new SpeechSynthesisUtterance(describePlace(place, props.needs, props.now));
      utterance.lang = 'pt-BR';
      utterance.onend = utterance.onerror = () => {
        state.speaking = false;
        paintHead();
      };
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
      state.speaking = true;
    }
    paintHead();
  };

  const share = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      state.status = 'Link do local copiado.';
    } catch {
      state.status = `Não foi possível copiar. Link: ${url}`;
    }
    paintHead();
  };

  head.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'close') props.onClose();
    if (action === 'save') props.onToggleSave();
    if (action === 'speak') toggleSpeech();
    if (action === 'share') share();
  });

  const selectTab = (id, focus) => {
    state.tab = id;
    paintTabs();
    paintPanel();
    if (focus) tabs.querySelector(`[data-tab="${id}"]`).focus();
  };

  tabs.addEventListener('click', (event) => {
    const tab = event.target.closest('[data-tab]');
    if (tab) selectTab(tab.dataset.tab, false);
  });
  tabs.addEventListener('keydown', (event) => {
    const step = event.key === 'ArrowRight' ? 1 : event.key === 'ArrowLeft' ? -1 : 0;
    if (!step) return;
    event.preventDefault();
    const index = TABS.findIndex((tab) => tab.id === state.tab);
    selectTab(TABS[(index + step + TABS.length) % TABS.length].id, true);
  });

  panel.addEventListener('input', (event) => {
    if (event.target.id === 'report-text') {
      state.reportText = event.target.value;
      if (state.reportSent) {
        state.reportSent = false;
        event.target.closest('form').querySelector('[role="status"]')?.remove();
      }
    }
  });
  panel.addEventListener('change', (event) => {
    if (event.target.id === 'report-need') state.reportNeed = event.target.value;
  });
  panel.addEventListener('submit', (event) => {
    event.preventDefault();
    if (state.reportText.trim().length < 5) {
      state.reportError = 'Conte um pouco mais sobre o que você encontrou.';
      paintPanel({ keepScroll: true });
      panel.querySelector('#report-text').focus();
      return;
    }
    props.onAddReport(state.reportNeed, state.reportText.trim());
    state.reportText = '';
    state.reportError = '';
    state.reportSent = true;
    // onAddReport chama update(), que redesenha o painel com o relato novo.
  });

  card.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') props.onClose();
  });

  paintAll();
  // O foco entra no cartão quando ele abre: é assim que o leitor de tela encontra o local.
  head.querySelector('h2').focus();

  return {
    update(next) {
      props = { ...props, ...next };
      paintAll({ keepScroll: true });
    },
    destroy() {
      stopSpeech();
      render(root, '');
    },
  };
}
