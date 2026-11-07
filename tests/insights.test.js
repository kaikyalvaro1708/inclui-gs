import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import {
  beforeYouGo,
  describePlace,
  distanceKm,
  formatDistance,
  hoursLabel,
  isOpenAt,
  listSummary,
  needsLabel,
  verdict,
} from '../site/assets/js/data/insights.js';
import { findPlace, PLACES } from '../site/assets/js/data/places.js';
import { filterPlaces, NO_FILTERS, suggestRelax } from '../site/assets/js/data/placeFilters.js';
import { interpret } from '../site/assets/js/data/query.js';
import { combinedScore, computeNeedScore } from '../site/assets/js/data/score.js';

const museum = findPlace('museu-horizonte');
const bistro = findPlace('bistro-quintal');
// Quarta-feira, 7 de julho de 2027, às 15h.
const WEDNESDAY_3PM = new Date(2027, 6, 7, 15, 0);
const context = { now: WEDNESDAY_3PM, saved: [] };
const ids = (places) => places.map((p) => p.id);

describe('combinedScore', () => {
  it('vale a nota mais baixa: uma barreira já impede a visita', () => {
    const vision = computeNeedScore(museum, 'vision').score;
    const cognitive = computeNeedScore(museum, 'cognitive').score;
    assert.equal(combinedScore(museum, ['vision', 'cognitive']), Math.min(vision, cognitive));
  });
});

describe('verdict', () => {
  it('responde em linguagem simples para cada faixa', () => {
    assert.equal(verdict(museum, ['mobility']).title, 'Deve funcionar bem para você');
    assert.equal(verdict(bistro, ['mobility']).title, 'Você pode encontrar barreiras');
  });
  it('pede a necessidade antes de opinar', () => {
    assert.equal(verdict(museum, []).level, null);
  });
});

describe('listSummary', () => {
  it('avisa o que falta ou confirma que tem tudo', () => {
    assert.equal(listSummary(museum, ['mobility']), 'Tem tudo para mobilidade');
    assert.match(listSummary(bistro, ['mobility']), /Falta:/);
    assert.equal(listSummary(museum, []), null);
  });
});

describe('beforeYouGo', () => {
  it('fala de degraus e porta estreita para quem tem mobilidade reduzida', () => {
    const tips = beforeYouGo(bistro, ['mobility']).join(' ');
    assert.match(tips, /4 degraus/);
    assert.match(tips, /75 cm/);
  });
  it('fala de barulho e do melhor horário para quem precisa de previsibilidade', () => {
    assert.match(beforeYouGo(bistro, ['cognitive']).join(' '), /barulhento/);
    assert.match(beforeYouGo(museum, ['cognitive']).join(' '), /Melhor horário/);
  });
  it('não mostra dica de mobilidade para quem não pediu', () => {
    assert.doesNotMatch(beforeYouGo(bistro, ['vision']).join(' '), /degraus/);
  });
});

describe('horário', () => {
  it('respeita abertura, fechamento e dia fechado', () => {
    assert.equal(isOpenAt(museum, WEDNESDAY_3PM), true);
    assert.equal(isOpenAt(museum, new Date(2027, 6, 5, 15, 0)), false); // segunda
    assert.equal(isOpenAt(museum, new Date(2027, 6, 7, 18, 0)), false);
  });
  it('explica o estado atual', () => {
    assert.equal(hoursLabel(museum, WEDNESDAY_3PM), 'Aberto até 18:00');
    assert.equal(hoursLabel(museum, new Date(2027, 6, 7, 8, 0)), 'Abre às 10:00');
    assert.equal(hoursLabel(museum, new Date(2027, 6, 7, 20, 0)), 'Fechado agora');
  });
});

describe('distância', () => {
  it('calcula e formata', () => {
    const km = distanceKm({ lat: -23.55, lng: -46.65 }, { lat: -23.56, lng: -46.65 });
    assert.ok(km > 1 && km < 1.2);
    assert.equal(formatDistance(0.345), '350 m');
    assert.equal(formatDistance(1.26), '1,3 km');
  });
});

describe('interpret', () => {
  it('separa tipo, recurso, necessidade e o que sobra', () => {
    const intent = interpret('Quero um cinema com Libras em Pinheiros');
    assert.deepEqual(intent.kinds, ['cinema']);
    assert.deepEqual(intent.features, ['libras']);
    assert.deepEqual(intent.needs, ['hearing']);
    assert.deepEqual(intent.rest, ['pinheiros']);
  });
  it('entende "sem degrau" como rampa', () => {
    assert.deepEqual(interpret('lugar sem degrau').features, ['ramp']);
  });
});

describe('filterPlaces', () => {
  it('busca por tipo em palavras comuns', () => {
    const cinemas = filterPlaces(PLACES, { ...NO_FILTERS, query: 'cinema' }, context);
    assert.ok(cinemas.length >= 3);
    assert.ok(cinemas.every((place) => place.kind === 'cinema'));
  });
  it('busca por nome e por bairro', () => {
    assert.deepEqual(ids(filterPlaces(PLACES, { ...NO_FILTERS, query: 'lumiar' }, context)), ['cine-lumiar']);
    assert.ok(filterPlaces(PLACES, { ...NO_FILTERS, query: 'pinheiros' }, context).length > 1);
  });
  it('combina tudo na mesma frase', () => {
    assert.deepEqual(ids(filterPlaces(PLACES, { ...NO_FILTERS, query: 'cinema com libras' }, context)), ['cine-estacao']);
  });
  it('filtra silencioso, aberto e salvos', () => {
    assert.ok(filterPlaces(PLACES, { ...NO_FILTERS, quiet: true }, context).every((p) => p.sensory.noise === 1));
    assert.ok(filterPlaces(PLACES, { ...NO_FILTERS, openNow: true }, context).every((p) => isOpenAt(p, WEDNESDAY_3PM)));
    assert.deepEqual(ids(filterPlaces(PLACES, { ...NO_FILTERS, savedOnly: true }, { ...context, saved: ['cafe-aurora'] })), ['cafe-aurora']);
  });
});

describe('suggestRelax', () => {
  it('indica qual filtro retirar, e só quando isso traz resultado', () => {
    const filters = { ...NO_FILTERS, kind: 'parque', features: ['braille'] };
    assert.deepEqual(filterPlaces(PLACES, filters, context), []);
    const options = suggestRelax(PLACES, filters, context);
    assert.ok(options.length > 0);
    for (const option of options) {
      assert.equal(filterPlaces(PLACES, option.filters, context).length, option.count);
      assert.ok(option.count > 0);
    }
  });
});

describe('dados de demonstração', () => {
  it('são coerentes para quem confia neles', () => {
    for (const place of PLACES) {
      assert.ok(place.expect.length >= 3, place.id);
      assert.ok(place.contact.length > 0, place.id);
      // Local com degraus e sem rampa nunca pode parecer acessível para mobilidade.
      if (place.entrance.steps > 0 && !place.features.includes('ramp')) {
        assert.ok(computeNeedScore(place, 'mobility').score < 2.5, place.id);
      }
    }
  });
  it('geram uma descrição para ouvir', () => {
    const text = describePlace(museum, ['mobility'], WEDNESDAY_3PM);
    assert.match(text, /Museu Horizonte/);
    assert.match(text, /Atenção/);
    assert.equal(needsLabel(['mobility', 'vision', 'hearing']), 'mobilidade, visão e audição');
  });
});
