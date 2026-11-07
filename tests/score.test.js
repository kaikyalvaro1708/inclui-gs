import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { FEATURE_IDS } from '../site/assets/js/data/catalog.js';
import { PLACES } from '../site/assets/js/data/places.js';
import { computeAccessibilityScore, computeNeedScore, formatScore, rankByNeed, scoreLevel } from '../site/assets/js/data/score.js';

const base = { features: [], photoVerifications: 0 };

describe('computeNeedScore', () => {
  it('dá zero para quem não tem recursos, mesmo com muitas fotos', () => {
    assert.equal(computeNeedScore({ ...base, photoVerifications: 500 }, 'mobility').score, 0);
  });

  it('limita recursos sem foto a 4,5 e só chega a 5 com evidência completa', () => {
    const all = { ...base, features: FEATURE_IDS };
    assert.equal(computeNeedScore(all, 'vision').score, 4.5);
    assert.equal(computeNeedScore({ ...all, photoVerifications: 20 }, 'vision').score, 5);
    assert.equal(computeNeedScore({ ...all, photoVerifications: 500 }, 'vision').score, 5);
  });

  it('pondera pelo peso do recurso', () => {
    const ramp = computeNeedScore({ ...base, features: ['ramp'] }, 'mobility').score;
    const parking = computeNeedScore({ ...base, features: ['parking'] }, 'mobility').score;
    assert.ok(ramp > parking);
  });

  it('separa o que existe do que falta', () => {
    const result = computeNeedScore({ ...base, features: ['libras', 'ramp'] }, 'hearing');
    assert.deepEqual(result.present, ['libras']);
    assert.deepEqual(result.missing, ['visualAlerts', 'captions']);
  });
});

describe('dados de demonstração', () => {
  it('têm notas válidas e ids únicos', () => {
    assert.equal(new Set(PLACES.map((p) => p.id)).size, PLACES.length);
    for (const place of PLACES) {
      for (const { score } of Object.values(computeAccessibilityScore(place))) {
        assert.ok(score >= 0 && score <= 5, `${place.id}: ${score}`);
      }
    }
  });

  it('mudam de líder conforme a necessidade: é a tese do produto', () => {
    const leaders = new Set(['mobility', 'vision', 'hearing', 'cognitive'].map((need) => rankByNeed(PLACES, need)[0].id));
    assert.ok(leaders.size > 1);
  });
});

describe('apresentação da nota', () => {
  it('classifica os limites das faixas', () => {
    assert.equal(scoreLevel(4), 'good');
    assert.equal(scoreLevel(3.9), 'mid');
    assert.equal(scoreLevel(2.5), 'mid');
    assert.equal(scoreLevel(2.4), 'low');
  });

  it('formata no padrão brasileiro', () => {
    assert.equal(formatScore(4.5), '4,5');
    assert.equal(formatScore(3), '3,0');
  });
});
