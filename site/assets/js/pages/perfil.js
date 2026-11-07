import { deleteUser, logout, updateUser } from '../data/authStore.js';
import { CATEGORIES, CATEGORY_IDS, PLAN_IDS, PLANS } from '../data/catalog.js';
import { clearActivity, forgetChosenNeeds, readStored, REPORTS_KEY, SAVED_KEY } from '../data/localStore.js';
import { findPlace } from '../data/places.js';
import { $, html, render, trusted } from '../ui/dom.js';
import { applyErrors, needOptions, showFormAlert } from '../ui/forms.js';
import { icon } from '../ui/icons.js';
import { user as signedIn } from '../ui/layout.js';

function field(id, label, control, hint) {
  return html`<div class="field">
    <label for="${id}">${label}</label>
    ${control}
    ${hint && html`<p class="field-hint" id="${id}-hint">${hint}</p>`}
  </div>`;
}

const input = (id, value, attrs = '') => html`<input class="control" id="${id}" value="${value ?? ''}" ${trusted(attrs)} />`;
const locked = (id, value, hint) =>
  field(id, id === 'email' ? 'E-mail' : 'CNPJ', html`<input class="control" id="${id}" value="${value}" disabled ${hint ? html`aria-describedby="${id}-hint"` : ''} />`, hint);
const EMAIL_HINT = 'O e-mail identifica a sua conta e não pode ser alterado.';

function clientForm(user) {
  return html`
    ${field('name', 'Nome', input('name', user.name, 'autocomplete="name"'))}
    ${locked('email', user.email, EMAIL_HINT)}
    ${field('city', 'Cidade (opcional)', input('city', user.city, 'autocomplete="address-level2"'))}
    ${field('need', 'Necessidade principal (opcional)', html`<select class="control" id="need" aria-describedby="need-hint">${needOptions(user.need ?? '')}</select>`, 'Usada para ordenar o mapa e as respostas do assistente.')}`;
}

function partnerForm(user) {
  return html`
    ${field('companyName', 'Nome da empresa', input('companyName', user.companyName, 'autocomplete="organization"'))}
    ${locked('cnpj', user.cnpj)}
    ${field('name', 'Nome do responsável', input('name', user.name, 'autocomplete="name"'))}
    ${locked('email', user.email, EMAIL_HINT)}
    ${field('category', 'Categoria do negócio', html`<select class="control" id="category">${CATEGORY_IDS.map((id) => html`<option value="${id}" ${user.category === id ? 'selected' : ''}>${CATEGORIES[id].label}</option>`)}</select>`)}
    ${field('plan', 'Plano', html`<select class="control" id="plan">${PLAN_IDS.map((id) => html`<option value="${id}" ${user.plan === id ? 'selected' : ''}>${PLANS[id].name} (${PLANS[id].price})</option>`)}</select>`)}`;
}

function start(initialUser) {
  let user = initialUser;
  const client = user.role === 'client';
  const savedPlaces = readStored(SAVED_KEY, []).flatMap((id) => findPlace(id) ?? []);

  render($('#conteudo'), html`
    <section class="profile-head" data-surface="dark">
      <div class="container profile-head-row">
        <div>
          <span class="badge badge-accent">${client ? 'Conta pessoal' : `Parceiro · plano ${PLANS[user.plan].name}`}</span>
          <h1>Olá, <span class="highlight" id="first-name">${user.name.split(' ')[0]}</span></h1>
        </div>
        <div class="actions">
          <a class="btn btn-primary" href="mapa.html">${icon('compass', 18)} Abrir o mapa</a>
          <button type="button" class="btn btn-secondary" id="logout">${icon('log-out', 18)} Sair</button>
        </div>
      </div>
    </section>
    <div class="profile-body">
      <div class="container profile-columns">
        <div class="card panel">
          <h2>Seus dados</h2>
          <div id="saved-alert"></div>
          <form class="form-stack" id="profile-form" novalidate>
            ${client ? clientForm(user) : partnerForm(user)}
            <button type="submit" class="btn btn-primary btn-l">Salvar alterações</button>
          </form>
        </div>
        <div class="panel-stack">
          <div class="card panel">
            <h2>${icon('bookmark', 20)} Locais salvos</h2>
            ${savedPlaces.length > 0
              ? html`<ul class="saved-list">${savedPlaces.map((place) => html`<li><a href="mapa.html?local=${encodeURIComponent(place.id)}">${place.name}</a></li>`)}</ul>`
              : html`<p>Salve lugares pelo cartão de detalhes, no mapa, para voltar a eles depois.</p>`}
          </div>
          <div class="card panel">
            <h2>${icon('shield-check', 20)} Sua privacidade</h2>
            <p>Neste MVP, seus dados ficam só neste navegador. Nada é enviado a um servidor, e sua senha é guardada como hash, nunca em texto puro.</p>
            <div class="panel-actions">
              <button type="button" class="btn btn-secondary" id="export">${icon('download', 18)} Baixar meus dados</button>
            </div>
          </div>
          <div class="card panel">
            <h2>Apagar conta</h2>
            <p>Remove sua conta e seus dados deste navegador. Não dá para desfazer.</p>
            <div id="delete-zone"></div>
          </div>
        </div>
      </div>
    </div>`);

  /* Salvar */
  const form = $('#profile-form');
  const value = (id) => $(`#${id}`).value;
  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const hasErrors = applyErrors(
      form,
      client
        ? { name: value('name').trim() ? '' : 'Informe seu nome.' }
        : {
            companyName: value('companyName').trim() ? '' : 'Informe o nome da empresa.',
            name: value('name').trim() ? '' : 'Informe o nome do responsável.',
          },
    );
    if (hasErrors) return;
    if (client) {
      user = updateUser(user.id, { name: value('name').trim(), city: value('city').trim(), need: value('need') || null });
      forgetChosenNeeds();
    } else {
      user = updateUser(user.id, { name: value('name').trim(), companyName: value('companyName').trim(), category: value('category'), plan: value('plan') });
    }
    $('#first-name').textContent = user.name.split(' ')[0];
    showFormAlert($('#saved-alert'), 'Alterações salvas.', 'success');
  });

  /* Sair: quem saiu de propósito volta ao início. */
  $('#logout').addEventListener('click', () => {
    logout();
    location.replace('index.html');
  });

  /* Exportar */
  $('#export').addEventListener('click', () => {
    const data = {
      conta: user,
      locaisSalvos: savedPlaces.map((place) => place.name),
      relatos: readStored(REPORTS_KEY, []),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'meus-dados-inclui.json';
    link.click();
    URL.revokeObjectURL(url);
  });

  /* Apagar, com confirmação */
  const zone = $('#delete-zone');
  const paintDelete = (confirming) => {
    render(zone, (
      confirming
        ? html`<p class="confirm-text" role="alert">Tem certeza de que quer apagar sua conta?</p>
            <div class="panel-actions">
              <button type="button" class="btn btn-danger" data-action="confirm">${icon('trash-2', 18)} Sim, apagar conta</button>
              <button type="button" class="btn btn-ghost" data-action="cancel">Cancelar</button>
            </div>`
        : html`<div class="panel-actions"><button type="button" class="btn btn-danger" data-action="ask">${icon('trash-2', 18)} Apagar minha conta</button></div>`
    ));
    zone.querySelector('button').focus({ preventScroll: true });
  };
  zone.addEventListener('click', (event) => {
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'ask') paintDelete(true);
    if (action === 'cancel') paintDelete(false);
    if (action === 'confirm') {
      clearActivity();
      deleteUser(user.id);
      location.replace('index.html');
    }
  });
  render(zone, html`<div class="panel-actions"><button type="button" class="btn btn-danger" data-action="ask">${icon('trash-2', 18)} Apagar minha conta</button></div>`);
}

// Quem nunca entrou vai para o login.
if (!signedIn) location.replace('entrar.html');
else start(signedIn);
