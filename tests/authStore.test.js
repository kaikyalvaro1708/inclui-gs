import assert from 'node:assert/strict';
import { beforeEach, describe, it } from 'node:test';
import { AuthError, currentUser, deleteUser, login, logout, register, updateUser } from '../site/assets/js/data/authStore.js';

const client = { role: 'client', name: 'Ana', email: ' Ana@Exemplo.com ', city: 'São Paulo', need: 'vision' };

beforeEach(() => {
  const store = new Map();
  globalThis.localStorage = {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => void store.set(key, String(value)),
    removeItem: (key) => void store.delete(key),
  };
});

describe('authStore', () => {
  it('cadastra, abre sessão e normaliza o e-mail', async () => {
    const user = await register(client, 'senha-segura');
    assert.equal(user.email, 'ana@exemplo.com');
    assert.equal(currentUser()?.id, user.id);
  });

  it('nunca grava a senha em texto puro', async () => {
    await register(client, 'senha-segura');
    assert.ok(!localStorage.getItem('inclui:users').includes('senha-segura'));
  });

  it('recusa e-mail repetido', async () => {
    await register(client, 'senha-segura');
    await assert.rejects(register(client, 'outra-senha'), AuthError);
  });

  it('dá a mesma mensagem para senha errada e e-mail inexistente', async () => {
    await register(client, 'senha-segura');
    const wrongPassword = await login('ana@exemplo.com', 'errada').catch((e) => e.message);
    const noAccount = await login('ninguem@exemplo.com', 'errada').catch((e) => e.message);
    assert.equal(wrongPassword, noAccount);
  });

  it('entra de novo depois de sair', async () => {
    const user = await register(client, 'senha-segura');
    logout();
    assert.equal(currentUser(), null);
    assert.equal((await login('ANA@exemplo.com', 'senha-segura')).id, user.id);
  });

  it('não deixa o perfil alterar identidade nem tipo de conta', async () => {
    const user = await register(client, 'senha-segura');
    const updated = updateUser(user.id, { name: 'Ana Maria', email: 'x@y.com', id: 'outro', role: 'partner' });
    assert.equal(updated.name, 'Ana Maria');
    assert.equal(updated.email, 'ana@exemplo.com');
    assert.equal(updated.id, user.id);
    assert.equal(updated.role, 'client');
  });

  it('apaga a conta e encerra a sessão', async () => {
    const user = await register(client, 'senha-segura');
    deleteUser(user.id);
    assert.equal(currentUser(), null);
    await assert.rejects(login('ana@exemplo.com', 'senha-segura'), AuthError);
  });
});
