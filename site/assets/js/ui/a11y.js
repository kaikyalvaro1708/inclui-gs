/** Preferências de acessibilidade. boot.js aplica a versão salva antes da página aparecer. */

const KEY = 'inclui:a11y';
const DEFAULTS = { text: 'normal', contrast: false, reducedMotion: false };

export function loadPrefs() {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') };
  } catch {
    return { ...DEFAULTS };
  }
}

export function applyPrefs(prefs) {
  const root = document.documentElement;
  root.dataset.text = prefs.text;
  root.dataset.contrast = prefs.contrast ? 'high' : 'normal';
  root.dataset.motion = prefs.reducedMotion ? 'reduced' : 'normal';
  try {
    localStorage.setItem(KEY, JSON.stringify(prefs));
  } catch {
    // Sem armazenamento a preferência vale só nesta visita.
  }
}

export const resetPrefs = () => applyPrefs({ ...DEFAULTS });
