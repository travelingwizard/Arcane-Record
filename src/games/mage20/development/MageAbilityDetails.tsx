import { useState } from 'react';
import { useEditorStore } from '../../../state/editor-store';
import { developmentFor, mageTraits } from './rules';

const secondaryAbilities = {
  talents: [
    'Animal Kinship',
    'Blatancy',
    'Carousing',
    'Flying',
    'High Ritual',
    'Lucid Dreaming',
    'Seduction',
  ],
  skills: [
    'Acrobatics',
    'Archery',
    'Biotech',
    'Energy Weapons',
    'Hypertech',
    'Jetpack',
    'Riding',
    'Torture',
  ],
  knowledges: [
    'Area Knowledge',
    'Belief Systems',
    'Cultural Savvy',
    'Cryptography',
    'Demolitions',
    'Finance',
    'Lore / RD Data',
    'Media',
    'Pharmacopeia / Poisons',
  ],
};
export function MageAbilityDetails() {
  const c = useEditorStore((s) => s.character)!;
  const update = useEditorStore((s) => s.updateMage);
  const [group, setGroup] = useState<'talents' | 'skills' | 'knowledges'>(
    'talents',
  );
  const [name, setName] = useState('');
  const dev = developmentFor(c),
    play = c.sheetLayout.mode === 'play';
  return (
    <details>
      <summary>Secondary Abilities and specialties</summary>
      <p>
        M20, p. 252 (secondary Ability index), pp. 289–300 (individual rules).
        Custom entries are not official definitions. Do retains its existing
        sheet location under Skills for compatibility; creation counts it as a
        Talent.
      </p>
      <div className="mage-creator-grid">
        <label>
          <span>Secondary Ability category</span>
          <select
            disabled={play}
            value={group}
            onChange={(e) => setGroup(e.target.value as typeof group)}
          >
            {Object.keys(secondaryAbilities).map((g) => (
              <option key={g}>{g}</option>
            ))}
          </select>
        </label>
        <label>
          <span>Secondary or custom Ability name</span>
          <input
            disabled={play}
            list="mage-secondary-abilities"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <datalist id="mage-secondary-abilities">
            {secondaryAbilities[group].map((n) => (
              <option key={n}>{n}</option>
            ))}
          </datalist>
        </label>
      </div>
      <button
        disabled={
          play ||
          !name.trim() ||
          dev.extraAbilities.some(
            (a) => a.name.toLowerCase() === name.trim().toLowerCase(),
          )
        }
        onClick={() => {
          update((current) => {
            const development = developmentFor(current),
              official = secondaryAbilities[group].includes(name.trim());
            return {
              ...current,
              development: {
                ...development,
                extraAbilities: [
                  ...development.extraAbilities,
                  {
                    id: crypto.randomUUID(),
                    name: name.trim(),
                    group,
                    rating: 0,
                    definitionId: official
                      ? `m20.secondary.${group}.${name
                          .trim()
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, '-')}`
                      : null,
                    source: official ? 'Mage 20, p. 252' : 'Custom',
                    notes: '',
                  },
                ],
              },
            };
          });
          setName('');
        }}
      >
        Add secondary Ability
      </button>
      {dev.extraAbilities.map((a) => (
        <div className="mage-creator-rating" key={a.id}>
          <strong>{a.name}</strong>
          <small>
            {a.group} · {a.source}
          </small>
          <label>
            <span>{a.name} rating</span>
            <input
              disabled={play || !!dev.draft}
              type="number"
              min="0"
              max="5"
              value={a.rating}
              onChange={(e) =>
                update((current) => ({
                  ...current,
                  development: {
                    ...developmentFor(current),
                    extraAbilities: developmentFor(current).extraAbilities.map(
                      (v) =>
                        v.id === a.id
                          ? {
                              ...v,
                              rating: Math.max(
                                0,
                                Math.min(5, Math.trunc(Number(e.target.value))),
                              ),
                            }
                          : v,
                    ),
                  },
                }))
              }
            />
          </label>
        </div>
      ))}
      <h4>Specialties</h4>
      <p>
        Record the area of expertise; a specialty does not automatically add a
        dot.
      </p>
      <div className="mage-creator-grid">
        {mageTraits(c)
          .filter((t) => t.kind === 'attribute' || t.kind === 'ability')
          .map((t) => (
            <label key={t.key}>
              <span>{t.label} specialty</span>
              <input
                readOnly={play}
                value={dev.specialties[t.key] ?? ''}
                onChange={(e) =>
                  update((current) => ({
                    ...current,
                    development: {
                      ...developmentFor(current),
                      specialties: {
                        ...developmentFor(current).specialties,
                        [t.key]: e.target.value,
                      },
                    },
                  }))
                }
              />
            </label>
          ))}
      </div>
    </details>
  );
}
