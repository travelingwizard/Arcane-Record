import { actionNames, playbookAbilities } from './catalog';
import type { BitdCharacter } from './schema';
const starts: Record<string, Record<string, number>> = {
  Cutter: { Skirmish: 2, Command: 1 },
  Hound: { Hunt: 2, Survey: 1 },
  Leech: { Tinker: 2, Wreck: 1 },
  Lurk: { Prowl: 2, Finesse: 1 },
  Slide: { Sway: 2, Consort: 1 },
  Spider: { Consort: 2, Study: 1 },
  Whisper: { Attune: 2, Study: 1 },
};
export function applyPlaybook(
  character: BitdCharacter,
  name: string,
): BitdCharacter {
  const base = starts[name] ?? {};
  return {
    ...character,
    playbookId: `bitd.core.playbook.${name.toLowerCase()}`,
    actions: character.actions.map((a) => ({
      ...a,
      rating: base[a.name] ?? 0,
    })),
    abilities: [],
    creation: { ...character.creation, step: 2 },
  };
}
export function creationIssues(c: BitdCharacter) {
  const out: string[] = [];
  if (!c.playbookId) out.push('Choose a playbook.');
  if (!c.name.trim()) out.push('Enter a name.');
  if (!c.vice.typeId) out.push('Choose a vice.');
  if (c.abilities.length !== 1) out.push('Choose one special ability.');
  const base = Object.values(
    starts[
      c.playbookId
        .split('.')
        .at(-1)
        ?.replace(/^./, (x) => x.toUpperCase()) ?? ''
    ] ?? {},
  ).reduce((a, b) => a + b, 0);
  const total = c.actions.reduce((n, a) => n + a.rating, 0);
  if (total - base !== 4)
    out.push('Allocate exactly four additional action dots.');
  if (c.actions.some((a) => a.rating > 2))
    out.push('Starting action ratings cannot exceed 2.');
  if (!c.friend.trim() || !c.rival.trim())
    out.push('Choose a close friend and a rival.');
  return out;
}
export function availableAbilities(playbook: string) {
  return playbookAbilities[playbook] ?? [];
}
export function evaluateRoll(
  dice: number[],
  pool: number,
  kind: BitdCharacter['rollHistory'][number]['kind'],
) {
  const kept = pool <= 0 ? [Math.min(...dice)] : dice;
  const highest = Math.max(...kept);
  const sixes = kept.filter((x) => x === 6).length;
  const outcome =
    sixes >= 2
      ? 'critical'
      : highest === 6
        ? 'full'
        : highest >= 4
          ? 'partial'
          : 'bad';
  return {
    kept,
    highest,
    outcome: outcome as 'critical' | 'full' | 'partial' | 'bad',
    stressCost:
      kind === 'resistance'
        ? Math.max(0, 6 - highest - (outcome === 'critical' ? 1 : 0))
        : null,
  };
}
export function rollFitd(
  pool: number,
  kind: BitdCharacter['rollHistory'][number]['kind'],
) {
  const count = pool <= 0 ? 2 : pool;
  const dice = Array.from(
    { length: count },
    () => (crypto.getRandomValues(new Uint32Array(1))[0]! % 6) + 1,
  );
  return { ...evaluateRoll(dice, pool, kind), dice };
}
export const actionNamesInOrder = actionNames;
