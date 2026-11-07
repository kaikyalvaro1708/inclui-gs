/**
 * Monta HTML a partir de template strings, com escape automático.
 *
 *   html`<p>${texto}</p>`        → o texto é escapado (seguro para dados da pessoa)
 *   html`<ul>${itens.map(...)}</ul>` → listas são juntadas
 *   html`${outroHtml}`           → o que já é Html entra sem escape
 *
 * Nada que a pessoa digita entra no DOM sem passar por aqui.
 * false, null e undefined somem (para `${cond && html`...`}`). Em atributos como
 * aria-pressed, passe String(valor).
 */
class Html {
  constructor(value) {
    this.value = value;
  }
  toString() {
    return this.value;
  }
}

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const escape = (value) => String(value).replace(/[&<>"']/g, (char) => ESCAPES[char]);

function stringify(value) {
  if (value === null || value === undefined || value === false || value === true) return '';
  if (value instanceof Html) return value.value;
  if (Array.isArray(value)) return value.map(stringify).join('');
  return escape(value);
}

export function html(strings, ...values) {
  let out = strings[0];
  values.forEach((value, index) => {
    out += stringify(value) + strings[index + 1];
  });
  return new Html(out);
}

/** Para HTML confiável gerado pelo próprio código, como os desenhos dos ícones. */
export const trusted = (value) => new Html(value);

export const $ = (selector, root = document) => root.querySelector(selector);
export const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];

/**
 * Troca o conteúdo de um elemento sem perder o foco do teclado: se o foco estava num
 * elemento com data-key, ele volta para o elemento novo com a mesma chave.
 */
export function render(target, content) {
  const active = document.activeElement;
  const key = target.contains(active) ? active?.dataset?.key : undefined;
  // Único ponto do site que escreve HTML no DOM. `content` sai da função html acima,
  // que escapa todo valor interpolado; o resto do código chama render() em vez de innerHTML.
  // nosemgrep: javascript.browser.security.insecure-document-method.insecure-document-method
  target.innerHTML = stringify(content);
  if (key) target.querySelector(`[data-key="${CSS.escape(key)}"]`)?.focus();
}

export function setTitle(title) {
  document.title = `${title} | Inclui+`;
}

export const prefersReducedMotion = () =>
  document.documentElement.dataset.motion === 'reduced' || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
