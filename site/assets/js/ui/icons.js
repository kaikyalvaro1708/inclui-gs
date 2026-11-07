import { render, trusted } from './dom.js';
import { ICONS } from './icon-data.js';

/** Desenha um ícone do Lucide. Decorativo por padrão: o texto ao lado é que dá o sentido. */
export function icon(name, size = 20, className = '') {
  const body = ICONS[name];
  if (!body) throw new Error(`Ícone desconhecido: ${name}`);
  return trusted(
    `<svg class="icon${className ? ` ${className}` : ''}" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${body}</svg>`,
  );
}

/** Troca, nos HTMLs estáticos, cada <i data-icon="nome" data-size="20"> pelo SVG. */
export function hydrateIcons(root = document) {
  for (const el of root.querySelectorAll('i[data-icon]')) {
    const holder = document.createElement('span');
    render(holder, icon(el.dataset.icon, Number(el.dataset.size) || 20, el.className));
    el.replaceWith(holder.firstChild);
  }
}
