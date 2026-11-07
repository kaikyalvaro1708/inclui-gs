import { AuthError, currentUser, register } from '../data/authStore.js';
import { CATEGORIES, CATEGORY_IDS, PLAN_IDS, PLANS } from '../data/catalog.js';
import { forgetChosenNeeds } from '../data/localStore.js';
import { $, $$, html, render } from '../ui/dom.js';
import { applyErrors, isEmail, needOptions, showFormAlert, wirePasswordToggles } from '../ui/forms.js';
import '../ui/layout.js';

if (currentUser()) location.replace('perfil.html');

const params = new URLSearchParams(location.search);
const planParam = params.get('plano');
let role = params.get('tipo') === 'parceiro' ? 'partner' : 'client';

render($('#need'), needOptions());
render($('#category'), html`${CATEGORY_IDS.map((id) => html`<option value="${id}">${CATEGORIES[id].label}</option>`)}`);
render($('#plan'), html`${PLAN_IDS.map((id) => html`<option value="${id}">${PLANS[id].name} (${PLANS[id].price})</option>`)}`);
if (PLAN_IDS.includes(planParam)) $('#plan').value = planParam;

wirePasswordToggles();

function paintRole() {
  for (const el of $$('[data-role]')) el.hidden = el.dataset.role !== role;
  for (const tab of $$('[data-set-role]')) tab.setAttribute('aria-pressed', String(tab.dataset.setRole === role));
  $('#name-label').textContent = role === 'client' ? 'Nome' : 'Nome do responsável';
}

for (const tab of $$('[data-set-role]')) {
  tab.addEventListener('click', () => {
    role = tab.dataset.setRole;
    paintRole();
  });
}
paintRole();

const onlyDigits = (value) => value.replace(/\D/g, '');
const formatCnpj = (value) =>
  onlyDigits(value)
    .slice(0, 14)
    .replace(/^(\d{2})(\d)/, '$1.$2')
    .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
    .replace(/\.(\d{3})(\d)/, '.$1/$2')
    .replace(/(\d{4})(\d)/, '$1-$2');

$('#cnpj').addEventListener('input', (event) => {
  event.target.value = formatCnpj(event.target.value);
});

const form = $('#register-form');
const submit = $('#submit');
const value = (id) => $(`#${id}`).value;

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const partner = role === 'partner';
  showFormAlert($('#form-alert'), '');
  const hasErrors = applyErrors(form, {
    companyName: partner && !value('companyName').trim() ? 'Informe o nome da empresa.' : '',
    cnpj: partner && onlyDigits(value('cnpj')).length !== 14 ? 'O CNPJ precisa ter 14 números.' : '',
    name: value('name').trim() ? '' : partner ? 'Informe o nome do responsável.' : 'Informe seu nome.',
    email: isEmail(value('email')) ? '' : 'Informe um e-mail válido, como nome@exemplo.com.',
    password: value('password').length >= 8 ? '' : 'A senha precisa ter pelo menos 8 caracteres.',
    consent: $('#consent').checked ? '' : 'Para criar a conta, é preciso concordar.',
  });
  if (hasErrors) return;

  submit.disabled = true;
  submit.textContent = 'Criando…';
  try {
    if (partner) {
      await register(
        {
          role,
          name: value('name').trim(),
          email: value('email'),
          companyName: value('companyName').trim(),
          cnpj: value('cnpj'),
          category: value('category'),
          plan: value('plan'),
        },
        value('password'),
      );
    } else {
      await register({ role, name: value('name').trim(), email: value('email'), city: value('city').trim(), need: value('need') || null }, value('password'));
      forgetChosenNeeds();
    }
    location.replace('perfil.html');
  } catch (error) {
    showFormAlert($('#form-alert'), error instanceof AuthError ? error.message : 'Não foi possível criar a conta. Tente de novo.');
    submit.disabled = false;
    submit.textContent = 'Criar conta';
  }
});
