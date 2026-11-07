import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { normalize, reply } from '../site/assets/js/data/concierge.js';

describe('normalize', () => {
  it('tira acentos, pontuação e caixa', () => {
    assert.equal(normalize('  Cão-guia, É ÓTIMO! '), 'cao-guia e otimo');
  });
});

describe('reply', () => {
  it('cruza categoria e necessidade', () => {
    const { results } = reply('restaurante para cadeirante');
    assert.ok(results.length > 0);
    assert.ok(results.every((r) => r.place.category === 'alimentacao'));
    assert.ok(results.every((r) => r.need === 'mobility'));
  });

  it('ordena pela nota da necessidade pedida', () => {
    const scores = reply('museu ou cinema para surdo').results.map((r) => r.score);
    assert.deepEqual(scores, [...scores].sort((a, b) => b - a));
  });

  it('entende frase com acento e maiúscula', () => {
    assert.equal(reply('Quero um Café com BRAILE').results[0].place.id, 'cafe-aurora');
  });

  it('não confunde "tea" com "teatro"', () => {
    const { results } = reply('teatro');
    assert.ok(results.every((r) => r.place.category === 'cultura'));
    assert.equal(results[0].need, 'mobility');
  });

  it('filtra por desconto', () => {
    const { results } = reply('desconto para surdo');
    assert.ok(results.length > 0);
    assert.ok(results.every((r) => r.place.discount));
  });

  it('exige o recurso pedido pelo nome', () => {
    const { results } = reply('lugar com piso tatil');
    assert.ok(results.length > 0);
    assert.ok(results.every((r) => r.place.features.includes('tactileFloor')));
  });

  it('usa a necessidade do perfil e avisa', () => {
    const answer = reply('quero ir ao parque', 'vision');
    assert.equal(answer.results[0].need, 'vision');
    assert.match(answer.text, /perfil/);
  });

  it('avisa quando assume a necessidade', () => {
    assert.match(reply('quero ir ao parque').text, /não disse/);
  });

  it('a necessidade da mensagem vence a do perfil', () => {
    assert.equal(reply('cinema com libras', 'mobility').results[0].need, 'hearing');
  });

  it('admite quando não encontra nada', () => {
    const answer = reply('parque com braile e desconto');
    assert.deepEqual(answer.results, []);
    assert.match(answer.text, /não encontrei/);
  });

  it('responde saudação sem inventar locais', () => {
    assert.deepEqual(reply('oi').results, []);
  });

  it('admite quando não entende', () => {
    const answer = reply('qual a capital da França');
    assert.deepEqual(answer.results, []);
    assert.match(answer.text, /Não entendi/);
  });
});
