import { AuthError, currentUser, login } from '../data/authStore.js';
import { $ } from '../ui/dom.js';
import { applyErrors, isEmail, showFormAlert, wirePasswordToggles } from '../ui/forms.js';
import '../ui/layout.js';

if (currentUser()) location.replace('perfil.html');

wirePasswordToggles();

const form = $('#login-form');
const submit = $('#submit');

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const email = $('#email').value;
  const password = $('#password').value;
  showFormAlert($('#form-alert'), '');
  const hasErrors = applyErrors(form, {
    email: isEmail(email) ? '' : 'Informe um e-mail válido, como nome@exemplo.com.',
    password: password ? '' : 'Informe sua senha.',
  });
  if (hasErrors) return;

  submit.disabled = true;
  submit.textContent = 'Entrando…';
  try {
    await login(email, password);
    location.replace('perfil.html');
  } catch (error) {
    showFormAlert($('#form-alert'), error instanceof AuthError ? error.message : 'Não foi possível entrar. Tente de novo.');
    submit.disabled = false;
    submit.textContent = 'Entrar';
  }
});
