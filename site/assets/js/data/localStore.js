/** O que a pessoa guarda no mapa fica só neste navegador, com ou sem conta. */

export const SAVED_KEY = 'inclui:saved';
export const NEEDS_KEY = 'inclui:needs';
export const REPORTS_KEY = 'inclui:reports';

export function readStored(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw === null ? fallback : JSON.parse(raw);
  } catch {
    return fallback;
  }
}

export function writeStored(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Sem armazenamento, o dado vale só nesta visita.
  }
}

/** Ao informar a necessidade na conta, ela passa a valer no lugar da escolha anterior no mapa. */
export function forgetChosenNeeds() {
  try {
    localStorage.removeItem(NEEDS_KEY);
  } catch {
    // Nada a limpar se o armazenamento está bloqueado.
  }
}

export function clearActivity() {
  try {
    for (const key of [SAVED_KEY, NEEDS_KEY, REPORTS_KEY]) localStorage.removeItem(key);
  } catch {
    // Nada a limpar se o armazenamento está bloqueado.
  }
}
