const USERS_KEY = 'inclui:users';
const SESSION_KEY = 'inclui:session';
const PBKDF2_ITERATIONS = 310_000;

export class AuthError extends Error {}

const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
const fromHex = (hex) => Uint8Array.from(hex.match(/.{2}/g) ?? [], (h) => parseInt(h, 16));

/**
 * Sem backend no MVP, as contas ficam no navegador da própria pessoa. Mesmo assim a
 * senha nunca é gravada em texto puro: fica só o hash PBKDF2 com salt individual.
 */
async function hashPassword(password, salt) {
  // crypto.subtle só existe em contexto seguro: HTTPS ou localhost.
  if (!globalThis.crypto?.subtle) {
    throw new AuthError('Por segurança, o login só funciona em uma conexão HTTPS.');
  }
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt, iterations: PBKDF2_ITERATIONS }, key, 256);
  return toHex(new Uint8Array(bits));
}

function readUsers() {
  try {
    const parsed = JSON.parse(localStorage.getItem(USERS_KEY) ?? '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeUsers(users) {
  try {
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  } catch {
    throw new AuthError('Não foi possível salvar neste navegador. Verifique se o armazenamento local está ativo.');
  }
}

function setSession(id) {
  try {
    if (id) localStorage.setItem(SESSION_KEY, id);
    else localStorage.removeItem(SESSION_KEY);
  } catch {
    // Sem armazenamento a sessão só dura até recarregar a página.
  }
}

export const normalizeEmail = (email) => email.trim().toLowerCase();

/**
 * Pessoa: { role: 'client', name, email, city, need }
 * Empresa: { role: 'partner', name, email, companyName, cnpj, category, plan }
 * Toda conta ganha também id e createdAt.
 */
export function currentUser() {
  try {
    const id = localStorage.getItem(SESSION_KEY);
    return readUsers().find((entry) => entry.user.id === id)?.user ?? null;
  } catch {
    return null;
  }
}

export async function register(data, password) {
  const email = normalizeEmail(data.email);
  const users = readUsers();
  if (users.some((entry) => entry.user.email === email)) {
    throw new AuthError('Este e-mail já tem uma conta. Tente entrar.');
  }
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await hashPassword(password, salt);
  const user = { ...data, email, id: crypto.randomUUID(), createdAt: new Date().toISOString() };
  writeUsers([...users, { user, salt: toHex(salt), hash }]);
  setSession(user.id);
  return user;
}

export async function login(email, password) {
  const normalized = normalizeEmail(email);
  const entry = readUsers().find((candidate) => candidate.user.email === normalized);
  // A mesma mensagem nos dois casos, para não revelar quais e-mails têm conta.
  const invalid = new AuthError('E-mail ou senha incorretos.');
  if (!entry) throw invalid;
  const hash = await hashPassword(password, fromHex(entry.salt));
  if (hash !== entry.hash) throw invalid;
  setSession(entry.user.id);
  return entry.user;
}

export function logout() {
  setSession(null);
}

export function updateUser(id, patch) {
  const users = readUsers();
  const entry = users.find((candidate) => candidate.user.id === id);
  if (!entry) throw new AuthError('Conta não encontrada.');
  // id, e-mail, tipo de conta e data de criação não são editáveis pelo perfil.
  entry.user = { ...entry.user, ...patch, id: entry.user.id, email: entry.user.email, role: entry.user.role, createdAt: entry.user.createdAt };
  writeUsers(users);
  return entry.user;
}

export function deleteUser(id) {
  writeUsers(readUsers().filter((entry) => entry.user.id !== id));
  setSession(null);
}
