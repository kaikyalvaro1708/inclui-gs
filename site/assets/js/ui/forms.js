import { NEED_IDS, NEEDS } from '../data/catalog.js';
import { html, render } from './dom.js';
import { icon } from './icons.js';

export const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

/**
 * Mostra ou limpa o erro de um campo. O campo precisa estar dentro de um .field;
 * a mensagem fica ligada a ele por aria-describedby, junto com a dica, se houver.
 */
export function setFieldError(input, message) {
  const field = input.closest('.field');
  let error = field.querySelector('.field-error');
  if (message) {
    if (!error) {
      error = document.createElement('p');
      error.className = 'field-error';
      error.id = `${input.id}-error`;
      field.append(error);
    }
    render(error, html`${icon('circle-alert', 15)} <span>${message}</span>`);
  } else {
    error?.remove();
  }
  input.setAttribute('aria-invalid', String(Boolean(message)));
  const hint = field.querySelector('.field-hint');
  const describedBy = [hint?.id, message ? `${input.id}-error` : null].filter(Boolean).join(' ');
  if (describedBy) input.setAttribute('aria-describedby', describedBy);
  else input.removeAttribute('aria-describedby');
}

/** Aplica um objeto { idDoCampo: mensagem } e devolve se houve algum erro. */
export function applyErrors(form, errors) {
  for (const input of form.querySelectorAll('input, select, textarea')) {
    if (input.closest('.field')) setFieldError(input, errors[input.id]);
  }
  const hasErrors = Object.values(errors).some(Boolean);
  // Depois de uma validação com erro, leva o foco ao primeiro campo inválido.
  if (hasErrors) requestAnimationFrame(() => form.querySelector('[aria-invalid="true"]')?.focus());
  return hasErrors;
}

export function showFormAlert(container, message, tone = 'error') {
  if (!message) {
    render(container, '');
    return;
  }
  render(container, html`<div class="form-alert" data-tone="${tone}" role="${tone === 'error' ? 'alert' : 'status'}">${message}</div>`);
}

/** Liga os botões "Mostrar senha" de .password-wrap. */
export function wirePasswordToggles(root = document) {
  for (const button of root.querySelectorAll('[data-password-toggle]')) {
    const input = button.parentElement.querySelector('input');
    const paint = () => {
      const visible = input.type === 'text';
      button.setAttribute('aria-label', visible ? 'Ocultar senha' : 'Mostrar senha');
      button.setAttribute('aria-pressed', String(visible));
      render(button, icon(visible ? 'eye-off' : 'eye', 20));
    };
    button.addEventListener('click', () => {
      input.type = input.type === 'password' ? 'text' : 'password';
      paint();
    });
    paint();
  }
}

export function needOptions(selected = '') {
  return html`<option value="">Prefiro não informar</option>
    ${NEED_IDS.map((id) => html`<option value="${id}" ${selected === id ? 'selected' : ''}>${NEEDS[id].label}: ${NEEDS[id].short}</option>`)}`;
}
