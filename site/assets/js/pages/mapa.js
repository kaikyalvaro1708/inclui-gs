import { FEATURE_IDS, FEATURES, KIND_IDS, KINDS, NEED_IDS, NEEDS } from '../data/catalog.js';
import { distanceKm, formatDistance, hoursLabel, isOpenAt, listSummary, needsLabel } from '../data/insights.js';
import { NEEDS_KEY, readStored, REPORTS_KEY, SAVED_KEY, writeStored } from '../data/localStore.js';
import { countActive, filterPlaces, NO_FILTERS, suggestRelax } from '../data/placeFilters.js';
import { findPlace, PLACES } from '../data/places.js';
import { interpret } from '../data/query.js';
import { combinedScore, formatScore, rankByNeeds, scoreLevel } from '../data/score.js';
import { needPicker, scorePill } from '../ui/components.js';
import { $, $$, html, prefersReducedMotion, render } from '../ui/dom.js';
import { icon } from '../ui/icons.js';
import { user } from '../ui/layout.js';
import { openPlaceCard } from './placeCard.js';

/* ---------- Constantes ---------- */

/** Os tipos que as pessoas mais procuram ficam à vista; os outros, nos filtros. */
const TOP_KINDS = ['cinema', 'restaurante', 'museu', 'clinica', 'parque', 'mercado'];
const NONE_PARAM = 'todas';
const SP_CENTER = [-23.5613, -46.6565];
const SP_ZOOM = 13;
/** Largura do cartão de detalhes no desktop, em rem. */
const CARD_WIDTH_REM = 24;

const isMobile = () => window.matchMedia('(max-width: 900px)').matches;

/** Os dois recursos mais decisivos de cada necessidade escolhida viram atalhos. */
const essentialsFor = (needs) =>
  needs.flatMap((need) =>
    FEATURE_IDS.filter((id) => FEATURES[id].need === need)
      .sort((a, b) => FEATURES[b].weight - FEATURES[a].weight)
      .slice(0, 2),
  );

/* ---------- Estado ---------- */

const now = new Date();
const params = new URLSearchParams(location.search);
const profileNeed = user?.role === 'client' ? user.need : null;

let filters = { ...NO_FILTERS, features: [] };
let view = 'list';
let userLocation = null;
let locationNote = '';
let storedNeeds = readStored(NEEDS_KEY, []);
let saved = readStored(SAVED_KEY, []);
let reports = readStored(REPORTS_KEY, []);
let card = null;
let cardPlaceId = null;
let returnFocus = null;

// A URL manda: o assistente, a Início e um link compartilhado abrem o mapa já ajustado.
function selectedNeeds() {
  const param = params.get('necessidade');
  if (param !== null) return param.split(',').filter((need) => NEED_IDS.includes(need));
  if (storedNeeds.length > 0) return storedNeeds;
  return profileNeed ? [profileNeed] : [];
}

const activeFilters = () => {
  const kind = params.get('tipo');
  return { ...filters, kind: KIND_IDS.includes(kind) ? kind : null };
};

function patchParams(patch) {
  for (const [key, value] of Object.entries(patch)) {
    if (value) params.set(key, value);
    else params.delete(key);
  }
  const query = params.toString();
  history.replaceState(null, '', `${location.pathname}${query ? `?${query}` : ''}`);
}

/* ---------- Mapa (Leaflet) ---------- */

const mapEl = $('#map');
render(mapEl, '');
const map = L.map(mapEl, { center: SP_CENTER, zoom: SP_ZOOM, zoomControl: false, attributionControl: false });
L.control.attribution({ position: 'bottomleft', prefix: false }).addTo(map);
L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 19,
  attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
}).addTo(map);
L.control.zoom({ position: 'topright' }).addTo(map);
const markerLayer = L.layerGroup().addTo(map);
let youMarker = null;
let centeredOn = null;

function pinIcon(score, isSelected) {
  const size = isSelected ? 46 : 38;
  return L.divIcon({
    className: 'inclui-pin',
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    // Só a nota formatada, que é um número, entra neste HTML.
    html: `<span class="pin${isSelected ? ' is-selected' : ''}" data-level="${scoreLevel(score)}"><b>${formatScore(score)}</b></span>`,
  });
}

function paintMap(results, needs, selected) {
  const scoreName = needs.length > 0 ? `em ${needsLabel(needs)}` : 'na média geral';
  markerLayer.clearLayers();
  for (const place of results) {
    const score = combinedScore(place, needs);
    const isSelected = selected?.id === place.id;
    const marker = L.marker([place.lat, place.lng], {
      icon: pinIcon(score, isSelected),
      title: `${place.name}: nota ${formatScore(score)} de 5 ${scoreName}`,
      zIndexOffset: isSelected ? 1000 : 0,
      keyboard: true,
    })
      .on('click', () => selectPlace(place.id))
      .addTo(markerLayer);
    // O Leaflet só trata Enter sozinho quando há popup: sem isto, o pino ficaria
    // inacessível para quem navega pelo teclado.
    marker.getElement().addEventListener('keydown', (event) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        selectPlace(place.id);
      }
    });
  }

  if (youMarker) youMarker.remove();
  youMarker = userLocation
    ? L.circleMarker([userLocation.lat, userLocation.lng], { radius: 9, color: '#ffffff', weight: 3, fillColor: '#1f5fa6', fillOpacity: 1 })
        .bindTooltip('Você está aqui')
        .addTo(map)
    : null;

  const visible = view === 'map' || !isMobile();
  if (!visible) return;
  map.invalidateSize();
  // Leva o local escolhido para a parte do mapa que o cartão de detalhes não cobre.
  if (selected && centeredOn !== selected.id) {
    centeredOn = selected.id;
    const zoom = Math.max(map.getZoom(), 14);
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
    const offset = isMobile() ? L.point(0, window.innerHeight * 0.3) : L.point((-CARD_WIDTH_REM * rem) / 2, 0);
    const center = map.unproject(map.project([selected.lat, selected.lng], zoom).add(offset), zoom);
    map.setView(center, zoom, { animate: !prefersReducedMotion() });
  }
  if (!selected) centeredOn = null;
}

/* ---------- Barra lateral ---------- */

const chip = (key, pressed, iconName, label) =>
  html`<button type="button" class="chip" data-chip="${key}" data-key="chip-${key}" aria-pressed="${String(pressed)}">${icon(iconName, 15)} ${label}</button>`;

// "Todos os filtros": desenhado uma vez, depois só os estados mudam.
render($('#filter-body'), html`<label>
    <span class="field-label">Tipo de lugar</span>
    <select id="kind-select">
      <option value="">Todos</option>
      ${KIND_IDS.map((id) => html`<option value="${id}">${KINDS[id].label}</option>`)}
    </select>
  </label>
  ${NEED_IDS.map(
    (need) => html`<fieldset>
      <legend>${NEEDS[need].label}</legend>
      ${FEATURE_IDS.filter((id) => FEATURES[id].need === need).map(
        (id) => html`<label class="check"><input type="checkbox" data-feature="${id}" /> ${FEATURES[id].label}</label>`,
      )}
    </fieldset>`,
  )}`);

function paintControls(intent, needs) {
  const chosen = selectedNeeds();
  const active = activeFilters();

  const understood = [
    ...intent.kinds.map((kind) => KINDS[kind].label),
    ...intent.features.map((id) => FEATURES[id].label),
    ...(intent.wantsDiscount ? ['Com desconto'] : []),
    ...(intent.wantsOpen ? ['Aberto agora'] : []),
    ...(chosen.length === 0 && intent.needs.length > 0 ? [`nota de ${needsLabel(intent.needs)}`] : []),
  ];
  render($('#understood'), understood.length > 0 ? html`Entendi: <strong>${understood.join(' · ')}</strong>` : '');

  render($('#need-picker'), needPicker(chosen, 'Necessidades consideradas na nota'));
  render(
    $('#kind-chips'),
    TOP_KINDS.map((kind) => chip(`kind:${kind}`, active.kind === kind, KINDS[kind].icon, KINDS[kind].label)),
  );
  render($('#quick-chips'), [
    ...essentialsFor(chosen).map((id) => chip(`feature:${id}`, filters.features.includes(id), FEATURES[id].icon, FEATURES[id].label)),
    chip('openNow', filters.openNow, 'clock', 'Aberto agora'),
    chip('quiet', filters.quiet, 'volume-1', 'Silencioso'),
    chip('onlyDiscount', filters.onlyDiscount, 'tag', 'Com desconto'),
    saved.length > 0 ? chip('savedOnly', filters.savedOnly, 'bookmark-check', `Salvos (${saved.length})`) : '',
  ]);

  $('#kind-select').value = active.kind ?? '';
  for (const box of $$('[data-feature]')) box.checked = filters.features.includes(box.dataset.feature);
  const count = countActive(active);
  $('#filter-summary').textContent = `Todos os filtros${count > 0 ? ` (${count})` : ''}`;
  return count;
}

function paintResults(results, needs, selected, filterCount) {
  const scoreLabel = needs.length > 0 ? `nota de ${needsLabel(needs)}` : 'nota média';
  const active = activeFilters();
  const hasAnyFilter = filterCount > 0 || Boolean(filters.query);

  $('#result-count').textContent = results.length === 1 ? '1 local' : `${results.length} locais`;
  $('#clear-filters').hidden = !(hasAnyFilter && results.length > 0);
  $('#near-me').setAttribute('aria-pressed', String(Boolean(userLocation)));
  $('#location-note').textContent = locationNote;
  $('#location-note').hidden = !locationNote;

  if (results.length === 0) {
    const relax = suggestRelax(PLACES, active, { now, saved });
    render(
      $('#results'),
      html`<div class="empty">
        <strong>Nenhum local com tudo isso.</strong>
        ${relax.length > 0 ? 'Mas estas opções podem ajudar:' : 'Tente mudar a busca.'}
        <div class="empty-actions">
          ${relax.map(
            (option, index) =>
              html`<button type="button" class="btn btn-secondary btn-block" data-relax="${index}" data-key="relax-${index}">Tirar ${option.label} (${option.count === 1 ? '1 local' : `${option.count} locais`})</button>`,
          )}
          <button type="button" class="btn btn-ghost btn-block" data-relax="all" data-key="relax-all">Limpar todos os filtros</button>
        </div>
      </div>`,
    );
    relaxOptions = relax;
    return;
  }

  render(
    $('#results'),
    html`<ul class="result-list" aria-label="Locais encontrados">
      ${results.map((place) => {
        const summary = listSummary(place, needs);
        const open = isOpenAt(place, now);
        return html`<li class="result-card ${selected?.id === place.id ? 'is-selected' : ''}" data-place="${place.id}">
          <button type="button" class="result-button" data-select="${place.id}" data-key="place-${place.id}" aria-haspopup="dialog">
            <span>
              <strong>${place.name}</strong>
              <span class="line">${icon('map-pin', 13)}<span>${KINDS[place.kind].label} · ${place.neighborhood}${userLocation ? ` · a ${formatDistance(distanceKm(userLocation, place))}` : ''}</span></span>
              <span class="line ${open ? 'is-open' : ''}">${icon('clock', 13)} ${hoursLabel(place, now)}</span>
              ${summary && html`<span class="line">${icon(summary.startsWith('Falta') ? 'circle-minus' : 'circle-check', 13)}<span>${summary}</span></span>`}
              ${place.alert && html`<span class="line is-alert">${icon('triangle-alert', 13)}<span>Aviso temporário neste local</span></span>`}
              ${saved.includes(place.id) && html`<span class="line">${icon('bookmark-check', 13)} Salvo</span>`}
            </span>
            ${scorePill(combinedScore(place, needs), scoreLabel)}
          </button>
        </li>`;
      })}
    </ul>`,
  );
  if (selected) $(`[data-place="${CSS.escape(selected.id)}"]`)?.scrollIntoView({ block: 'nearest' });
}

let relaxOptions = [];

/* ---------- Cartão de detalhes ---------- */

function cardProps(place, needs) {
  return {
    place,
    needs,
    now,
    isSaved: saved.includes(place.id),
    distance: userLocation ? distanceKm(userLocation, place) : null,
    myReports: reports.filter((report) => report.placeId === place.id),
    onToggleSave: () => {
      saved = saved.includes(place.id) ? saved.filter((id) => id !== place.id) : [...saved, place.id];
      writeStored(SAVED_KEY, saved);
      update();
    },
    onAddReport: (need, text) => {
      reports = [{ id: crypto.randomUUID(), placeId: place.id, need, text, createdAt: new Date().toISOString() }, ...reports];
      writeStored(REPORTS_KEY, reports);
      update();
    },
    onClose: closeCard,
  };
}

function paintCard(selected, needs) {
  if (!selected) {
    card?.destroy();
    card = null;
    cardPlaceId = null;
    return;
  }
  if (cardPlaceId === selected.id) {
    card.update(cardProps(selected, needs));
    return;
  }
  card?.destroy();
  cardPlaceId = selected.id;
  card = openPlaceCard($('#place-card-root'), cardProps(selected, needs));
}

function selectPlace(id) {
  if (!params.get('local') && document.activeElement instanceof HTMLElement && document.activeElement !== document.body) {
    returnFocus = document.activeElement;
  }
  patchParams({ local: id });
  update();
}

function closeCard() {
  const placeId = cardPlaceId;
  patchParams({ local: null });
  update();
  // Devolve o foco para onde a pessoa estava; o pino pode ter sido redesenhado.
  const previous = returnFocus;
  returnFocus = null;
  requestAnimationFrame(() => {
    if (previous?.isConnected) previous.focus();
    else $(`[data-select="${CSS.escape(placeId ?? '')}"]`)?.focus();
  });
}

/* ---------- Tudo junto ---------- */

function update() {
  const intent = interpret(filters.query);
  const chosen = selectedNeeds();
  // Quem digita "cinema para surdo" já disse a necessidade: a nota acompanha a frase.
  const needs = chosen.length > 0 ? chosen : intent.needs;
  const filtered = filterPlaces(PLACES, activeFilters(), { now, saved });
  const results = userLocation
    ? [...filtered].sort((a, b) => distanceKm(userLocation, a) - distanceKm(userLocation, b))
    : rankByNeeds(filtered, needs);
  const selected = findPlace(params.get('local'));

  const filterCount = paintControls(intent, needs);
  paintResults(results, needs, selected, filterCount);
  paintMap(results, needs, selected);
  const tag = $('#map-tag');
  tag.textContent = `Locais fictícios · ${needs.length > 0 ? `nota de ${needsLabel(needs)}` : 'nota média'}`;
  tag.classList.toggle('is-hidden', Boolean(selected));
  paintCard(selected, needs);
}

/* ---------- Eventos ---------- */

$('#query').addEventListener('input', (event) => {
  filters = { ...filters, query: event.target.value };
  update();
});

$('#need-picker').addEventListener('click', (event) => {
  const option = event.target.closest('[data-need]');
  if (!option) return;
  const need = option.dataset.need;
  const chosen = selectedNeeds();
  const next = chosen.includes(need) ? chosen.filter((item) => item !== need) : [...chosen, need];
  storedNeeds = next;
  writeStored(NEEDS_KEY, next);
  patchParams({ necessidade: next.length > 0 ? next.join(',') : NONE_PARAM });
  update();
});

function onChip(event) {
  const key = event.target.closest('[data-chip]')?.dataset.chip;
  if (!key) return;
  const [type, value] = key.split(':');
  if (type === 'kind') patchParams({ tipo: activeFilters().kind === value ? null : value });
  else if (type === 'feature') toggleFeature(value, !filters.features.includes(value));
  else filters = { ...filters, [type]: !filters[type] };
  update();
}
$('#kind-chips').addEventListener('click', onChip);
$('#quick-chips').addEventListener('click', onChip);

function toggleFeature(id, on) {
  filters = { ...filters, features: on ? [...filters.features, id] : filters.features.filter((item) => item !== id) };
}

$('#filter-body').addEventListener('change', (event) => {
  if (event.target.id === 'kind-select') patchParams({ tipo: event.target.value || null });
  else if (event.target.dataset.feature) toggleFeature(event.target.dataset.feature, event.target.checked);
  update();
});

function applyFilters(next) {
  filters = { ...next, kind: null };
  $('#query').value = next.query;
  patchParams({ tipo: next.kind });
  update();
}

$('#clear-filters').addEventListener('click', () => applyFilters({ ...NO_FILTERS, features: [] }));

$('#results').addEventListener('click', (event) => {
  const select = event.target.closest('[data-select]');
  if (select) {
    selectPlace(select.dataset.select);
    return;
  }
  const relax = event.target.closest('[data-relax]');
  if (!relax) return;
  applyFilters(relax.dataset.relax === 'all' ? { ...NO_FILTERS, features: [] } : relaxOptions[Number(relax.dataset.relax)].filters);
});

$('#near-me').addEventListener('click', () => {
  if (userLocation) {
    userLocation = null;
    locationNote = '';
    update();
    return;
  }
  if (!navigator.geolocation) {
    locationNote = 'Seu navegador não informa a localização.';
    update();
    return;
  }
  locationNote = 'Buscando sua localização…';
  update();
  navigator.geolocation.getCurrentPosition(
    ({ coords }) => {
      userLocation = { lat: coords.latitude, lng: coords.longitude };
      const nearest = Math.min(...PLACES.map((place) => distanceKm(userLocation, place)));
      locationNote =
        nearest > 100
          ? 'Você parece estar longe de São Paulo, onde ficam os locais desta demonstração.'
          : 'Ordenado do mais perto ao mais longe. Sua localização não sai do navegador.';
      update();
    },
    () => {
      locationNote = 'Não conseguimos sua localização. Verifique a permissão do navegador.';
      update();
    },
    { timeout: 8000 },
  );
});

for (const button of $$('[data-view]', $('.view-switch'))) {
  button.addEventListener('click', () => {
    view = button.dataset.view;
    $('#map-layout').dataset.view = view;
    for (const other of $$('[data-view]', $('.view-switch'))) other.setAttribute('aria-pressed', String(other === button));
    centeredOn = null;
    update();
  });
}

// Ao passar de celular para desktop (ou girar a tela), o mapa precisa recalcular o tamanho.
window.matchMedia('(max-width: 900px)').addEventListener('change', () => update());

update();
