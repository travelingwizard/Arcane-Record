import { earthdawnSources } from './catalog';

const key = 'arcane-record:earthdawn4e:source-defaults';
const required = earthdawnSources
  .filter(({ required }) => required)
  .map(({ id }) => id);

export function readEarthdawnSourceDefaults() {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(key) ?? '[]');
    const saved = Array.isArray(parsed)
      ? parsed.filter((id): id is string => typeof id === 'string')
      : [];
    return [...new Set([...required, ...saved])];
  } catch {
    return required;
  }
}

export function writeEarthdawnSourceDefaults(ids: string[]) {
  localStorage.setItem(
    key,
    JSON.stringify([...new Set([...required, ...ids])]),
  );
}
