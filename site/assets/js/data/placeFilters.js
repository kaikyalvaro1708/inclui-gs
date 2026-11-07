import { FEATURES, KINDS } from './catalog.js';
import { isOpenAt } from './insights.js';
import { interpret, normalize } from './query.js';

export const NO_FILTERS = Object.freeze({
  query: '',
  kind: null,
  features: [],
  onlyDiscount: false,
  openNow: false,
  quiet: false,
  savedOnly: false,
});

/** context: { now: Date, saved: string[] } */
export function filterPlaces(places, filters, { now, saved }) {
  const intent = interpret(filters.query);
  const features = [...new Set([...filters.features, ...intent.features])];

  return places.filter((place) => {
    const hay = normalize(`${place.name} ${place.neighborhood} ${KINDS[place.kind].label}`);
    return (
      (!filters.kind || place.kind === filters.kind) &&
      (intent.kinds.length === 0 || intent.kinds.includes(place.kind)) &&
      (intent.categories.length === 0 || intent.categories.includes(place.category)) &&
      features.every((feature) => place.features.includes(feature)) &&
      (!(filters.onlyDiscount || intent.wantsDiscount) || Boolean(place.discount)) &&
      (!(filters.openNow || intent.wantsOpen) || isOpenAt(place, now)) &&
      (!filters.quiet || place.sensory.noise === 1) &&
      (!filters.savedOnly || saved.includes(place.id)) &&
      intent.rest.every((word) => hay.includes(word))
    );
  });
}

export function countActive(filters) {
  return (
    filters.features.length +
    (filters.kind ? 1 : 0) +
    (filters.onlyDiscount ? 1 : 0) +
    (filters.openNow ? 1 : 0) +
    (filters.quiet ? 1 : 0) +
    (filters.savedOnly ? 1 : 0)
  );
}

/** Em vez de um beco sem saída: qual filtro, se retirado, traz mais resultados? */
export function suggestRelax(places, filters, context) {
  const options = filters.features.map((id) => ({
    label: FEATURES[id].label,
    filters: { ...filters, features: filters.features.filter((item) => item !== id) },
  }));
  if (filters.query) options.push({ label: `a busca “${filters.query}”`, filters: { ...filters, query: '' } });
  if (filters.kind) options.push({ label: KINDS[filters.kind].label, filters: { ...filters, kind: null } });
  if (filters.onlyDiscount) options.push({ label: 'Com desconto', filters: { ...filters, onlyDiscount: false } });
  if (filters.openNow) options.push({ label: 'Aberto agora', filters: { ...filters, openNow: false } });
  if (filters.quiet) options.push({ label: 'Silencioso', filters: { ...filters, quiet: false } });
  if (filters.savedOnly) options.push({ label: 'Salvos', filters: { ...filters, savedOnly: false } });

  return options
    .map((option) => ({ ...option, count: filterPlaces(places, option.filters, context).length }))
    .filter((option) => option.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 2);
}
