import { currentUser } from '../data/authStore.js';
import { reply } from '../data/concierge.js';
import { needsLabel } from '../data/insights.js';
import { findPlace } from '../data/places.js';
import { applyPrefs, loadPrefs, resetPrefs } from './a11y.js';
import { scorePill } from './components.js';
import { $, html, render } from './dom.js';
import { hydrateIcons, icon } from './icons.js';

/**
 * Partes comuns a todas as páginas: cabeçalho, rodapé, menu de acessibilidade, assistente
 * e animação de entrada. Cada página importa este módulo; ele se monta sozinho.
 * <body data-page="mapa"> diz qual página é, para marcar o menu e esconder o que não cabe.
 */

const page = document.body.dataset.page;
const user = currentUser();

// Logo com fundo transparente e letras brancas: só funciona sobre o azul-marinho
// do cabeçalho e do rodapé.
const logo = () => html`<img class="logo" src="assets/img/logo-inclui.png" width="441" height="120" alt="Inclui+" />`;

/* ---------- Cabeçalho ---------- */

const LINKS = [
  { href: 'index.html', label: 'Início', page: 'inicio' },
  { href: 'index.html#diferenciais', label: 'Diferenciais' },
  { href: 'mapa.html', label: 'Mapa', page: 'mapa' },
  { href: 'sobre.html', label: 'Sobre', page: 'sobre' },
  { href: 'empresas.html', label: 'Para empresas', page: 'empresas' },
];

const navItems = () =>
  LINKS.map(
    (link) =>
      html`<li><a class="nav-link" href="${link.href}" ${link.page === page ? html`aria-current="page"` : ''}>${link.label}</a></li>`,
  );

function accountButtons(mobile) {
  if (user) {
    return html`<a class="btn btn-secondary ${mobile ? 'btn-block' : ''}" href="perfil.html">${icon('user-round', 18)} Minha conta</a>`;
  }
  return mobile
    ? html`<a class="btn btn-primary btn-block" href="cadastro.html">Criar conta</a>
        <a class="btn btn-secondary btn-block" href="entrar.html">Entrar</a>`
    : html`<a class="btn btn-ghost" href="entrar.html">Entrar</a>
        <a class="btn btn-primary" href="cadastro.html">Criar conta</a>`;
}

const SIZES = [
  { id: 'normal', label: 'A', name: 'Texto normal', scale: 0.9375 },
  { id: 'large', label: 'A+', name: 'Texto grande', scale: 1.0625 },
  { id: 'xlarge', label: 'A++', name: 'Texto muito grande', scale: 1.1875 },
];

function a11yPanel(prefs) {
  return html`<h2>Ajuste o site para você</h2>
    <p>A escolha fica salva neste navegador.</p>
    <fieldset class="a11y-group">
      <legend>${icon('type', 16)} Tamanho do texto</legend>
      <div class="a11y-sizes">
        ${SIZES.map(
          (size) =>
            html`<button type="button" class="a11y-size" data-size="${size.id}" data-key="size-${size.id}" style="font-size:${size.scale}rem" aria-label="${size.name}" aria-pressed="${String(prefs.text === size.id)}">${size.label}</button>`,
        )}
      </div>
    </fieldset>
    <label class="a11y-toggle">${icon('contrast', 18)}<span>Alto contraste</span><input type="checkbox" data-pref="contrast" data-key="contrast" ${prefs.contrast ? 'checked' : ''} /></label>
    <label class="a11y-toggle">${icon('waves', 18)}<span>Reduzir animações</span><input type="checkbox" data-pref="reducedMotion" data-key="motion" ${prefs.reducedMotion ? 'checked' : ''} /></label>
    <button type="button" class="a11y-reset" data-reset data-key="reset">${icon('rotate-ccw', 14)} Restaurar padrão</button>`;
}

function mountHeader() {
  const header = $('#site-header');
  render(header, html`<div class="container nav-bar">
      <a class="brand" href="index.html">${logo()}<span class="sr-only">, página inicial</span></a>
      <nav aria-label="Principal"><ul class="nav-links">${navItems()}</ul></nav>
      <div class="nav-actions">
        <div class="a11y-wrap">
          <button type="button" class="icon-btn" id="a11y-trigger" aria-label="Opções de acessibilidade" title="Opções de acessibilidade" aria-expanded="false" aria-controls="a11y-panel">
            ${icon('person-standing', 22)}
          </button>
          <div class="a11y-panel" id="a11y-panel" data-surface="light" hidden></div>
        </div>
        <div class="nav-desktop">${accountButtons(false)}</div>
        <button type="button" class="icon-btn nav-burger" id="nav-burger" aria-label="Abrir menu" aria-expanded="false" aria-controls="nav-mobile">${icon('menu', 22)}</button>
      </div>
    </div>
    <nav class="nav-mobile" id="nav-mobile" aria-label="Menu" hidden>
      <ul>${navItems()}</ul>
      <div class="nav-mobile-cta">${accountButtons(true)}</div>
    </nav>`);

  // Menu do celular
  const burger = $('#nav-burger');
  const mobile = $('#nav-mobile');
  burger.addEventListener('click', () => {
    const open = mobile.hidden;
    mobile.hidden = !open;
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    render(burger, icon(open ? 'x' : 'menu', 22));
  });
  // O link "Diferenciais" fica na mesma página da Início: fecha o menu ao usar.
  mobile.addEventListener('click', (event) => {
    if (event.target.closest('a') && !mobile.hidden) burger.click();
  });

  // Menu de acessibilidade
  const trigger = $('#a11y-trigger');
  const panel = $('#a11y-panel');
  const wrap = trigger.parentElement;
  let prefs = loadPrefs();
  const paint = () => render(panel, a11yPanel(prefs));
  const setOpen = (open) => {
    panel.hidden = !open;
    trigger.setAttribute('aria-expanded', String(open));
    if (open) paint();
  };
  trigger.addEventListener('click', () => setOpen(panel.hidden));
  panel.addEventListener('click', (event) => {
    const size = event.target.closest('[data-size]');
    if (size) prefs = { ...prefs, text: size.dataset.size };
    else if (event.target.closest('[data-reset]')) {
      resetPrefs();
      prefs = loadPrefs();
    } else return;
    applyPrefs(prefs);
    paint();
  });
  panel.addEventListener('change', (event) => {
    const key = event.target.dataset.pref;
    if (!key) return;
    prefs = { ...prefs, [key]: event.target.checked };
    applyPrefs(prefs);
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !panel.hidden) {
      setOpen(false);
      trigger.focus();
    }
  });
  document.addEventListener('pointerdown', (event) => {
    if (!panel.hidden && !wrap.contains(event.target)) setOpen(false);
  });
}

/* ---------- Rodapé ---------- */

function mountFooter() {
  const footer = $('#site-footer');
  if (!footer) return;
  render(footer, html`<div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          ${logo()}
          <p>Acessibilidade verificada por necessidade, para que ninguém descubra a barreira só quando já chegou na porta.</p>
        </div>
        <div class="footer-col">
          <h2>Produto</h2>
          <ul>
            <li><a href="mapa.html">Mapa</a></li>
            <li><a href="index.html#diferenciais">Diferenciais</a></li>
            <li><a href="direitos.html">Seus direitos</a></li>
          </ul>
        </div>
        <div class="footer-col">
          <h2>Inclui+</h2>
          <ul>
            <li><a href="sobre.html">Sobre</a></li>
            <li><a href="empresas.html">Para empresas</a></li>
            <li><a href="cadastro.html">Criar conta</a></li>
          </ul>
        </div>
      </div>
      <p class="footer-legal">Projeto acadêmico da Global Solution FIAP 2026.2. Este MVP usa locais e descontos fictícios para demonstração.</p>
    </div>`);
}

/* ---------- Assistente ---------- */

const CHAT_KEY = 'inclui:chat';
const SUGGESTIONS = ['Restaurante para cadeirante', 'Cinema tranquilo para autista', 'Museu com Libras', 'Desconto para pessoa cega'];
const WELCOME = { mine: false, text: 'Oi! Sou o assistente do Inclui+. Conte aonde você quer ir e do que precisa, com as suas palavras.' };

// A conversa sobrevive à troca de página, já que cada página é um HTML separado.
function loadChat() {
  try {
    const stored = JSON.parse(sessionStorage.getItem(CHAT_KEY) ?? 'null');
    return Array.isArray(stored) && stored.length > 0 ? stored : [WELCOME];
  } catch {
    return [WELCOME];
  }
}

function saveChat(messages) {
  try {
    sessionStorage.setItem(CHAT_KEY, JSON.stringify(messages));
  } catch {
    // Sem armazenamento, a conversa vale só nesta página.
  }
}

let concierge = null;

function mountConcierge() {
  // Em formulários de conta o botão flutuante só cobriria os campos.
  if (page === 'entrar' || page === 'cadastro') return;

  const profileNeed = user?.role === 'client' ? user.need : null;
  let messages = loadChat();
  const compact = page === 'mapa';

  const root = document.createElement('div');
  render(root, html`<button type="button" class="fab ${compact ? 'is-compact' : ''}" id="fab" aria-label="Abrir assistente" title="Abrir assistente">
      ${icon('message-circle', 22)}${compact ? '' : html`<span>Assistente</span>`}
    </button>
    <div class="chat" id="chat" role="dialog" aria-label="Assistente do Inclui+" data-surface="light" hidden>
      <header class="chat-head">
        <span class="chat-head-icon">${icon('sparkles', 18)}</span>
        <div><h2>Assistente Inclui+</h2><p>Busca em linguagem natural</p></div>
        <button type="button" class="chat-close" id="chat-close" aria-label="Fechar assistente">${icon('x', 20)}</button>
      </header>
      <div class="chat-log" id="chat-log" role="log" aria-live="polite" aria-label="Conversa" tabindex="0"></div>
      <form class="chat-composer" id="chat-form">
        <input id="chat-input" aria-label="Escreva sua mensagem" placeholder="Ex.: restaurante para cadeirante" autocomplete="off" maxlength="200" />
        <button type="submit" class="chat-send" aria-label="Enviar mensagem">${icon('arrow-up', 20)}</button>
      </form>
      <p class="chat-note">Demonstração: regras simples e locais fictícios.</p>
    </div>`);
  document.body.append(...root.children);

  const fab = $('#fab');
  const chat = $('#chat');
  const log = $('#chat-log');
  const input = $('#chat-input');

  const paint = () => {
    render(log, html`${messages.map(
      (message) => html`<div class="bubble ${message.mine ? 'is-mine' : ''}"><span class="sr-only">${message.mine ? 'Você: ' : 'Assistente: '}</span>${message.text}</div>
        ${message.results?.length
          ? html`<ul class="chat-results">${message.results.map(({ placeId, needs, score }) => {
              const place = findPlace(placeId);
              if (!place) return '';
              return html`<li><a class="chat-result" href="mapa.html?local=${encodeURIComponent(place.id)}&necessidade=${needs.join(',')}">
                <div><strong>${place.name}</strong><small>${icon('map-pin', 13)} ${place.neighborhood}</small></div>
                ${scorePill(score, needsLabel(needs))}
              </a></li>`;
            })}</ul>`
          : ''}`,
    )}
    ${messages.length === 1
      ? html`<div class="chat-chips">${SUGGESTIONS.map((text) => html`<button type="button" class="chat-chip" data-suggestion="${text}">${text}</button>`)}</div>`
      : ''}`);
    log.scrollTop = log.scrollHeight;
  };

  const send = (text) => {
    const clean = text.trim();
    if (!clean) return;
    const answer = reply(clean, profileNeed);
    messages = [
      ...messages,
      { mine: true, text: clean },
      { mine: false, text: answer.text, results: answer.results.map(({ place, needs, score }) => ({ placeId: place.id, needs, score })) },
    ];
    saveChat(messages);
    paint();
  };

  // O foco acompanha o painel: entra ao abrir e volta ao botão ao fechar.
  const open = (prompt) => {
    fab.hidden = true;
    chat.hidden = false;
    paint();
    if (prompt) send(prompt);
    input.focus();
  };
  const close = () => {
    chat.hidden = true;
    fab.hidden = false;
    fab.focus();
  };

  fab.addEventListener('click', () => open());
  $('#chat-close').addEventListener('click', close);
  chat.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
  });
  log.addEventListener('click', (event) => {
    const chip = event.target.closest('[data-suggestion]');
    if (chip) send(chip.dataset.suggestion);
  });
  $('#chat-form').addEventListener('submit', (event) => {
    event.preventDefault();
    send(input.value);
    input.value = '';
  });

  concierge = { open };
}

/** Abre o assistente a partir de um botão da página, opcionalmente já com uma pergunta. */
export function openConcierge(prompt) {
  concierge?.open(prompt);
}

/* ---------- Entrada suave ao rolar ---------- */

const revealObserver =
  'IntersectionObserver' in window
    ? new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (!entry.isIntersecting) continue;
            entry.target.classList.add('is-visible');
            revealObserver.unobserve(entry.target);
          }
        },
        { rootMargin: '0px 0px -8% 0px' },
      )
    : null;

/** Anima os .reveal dentro de root. A página chama de novo depois de criar conteúdo. */
export function mountReveal(root = document) {
  for (const item of root.querySelectorAll('.reveal:not(.is-visible)')) {
    if (revealObserver) revealObserver.observe(item);
    else item.classList.add('is-visible');
  }
}

// O link "Pular para o conteúdo" leva o foco ao <main>. Tratado aqui porque, na página 404,
// a tag <base> faria "#conteudo" apontar para a Início.
document.querySelector('.skip-link')?.addEventListener('click', (event) => {
  event.preventDefault();
  document.getElementById('conteudo')?.focus();
});

mountHeader();
mountFooter();
mountConcierge();
hydrateIcons();
mountReveal();

export { user };
