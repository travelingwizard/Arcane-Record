import { earthdawnDisciplines, earthdawnRaces } from './catalog';
import { attributeModifierCosts, deriveCharacter } from './engine';
import type { Earthdawn4eCharacter } from './schema';

type Update = (
  fn: (value: Earthdawn4eCharacter) => Earthdawn4eCharacter,
) => void;
const labels = {
  dexterity: 'Dexterity',
  strength: 'Strength',
  toughness: 'Toughness',
  perception: 'Perception',
  willpower: 'Willpower',
  charisma: 'Charisma',
} as const;
export function EarthdawnCreator({
  character,
  update,
}: {
  character: Earthdawn4eCharacter;
  update: Update;
}) {
  const step = character.creation.currentStep;
  const race = earthdawnRaces.find(
    ({ id }) => id === character.identity.raceId,
  );
  const discipline = earthdawnDisciplines.find(
    ({ id }) => id === character.disciplines[0]?.disciplineId,
  );
  const spent = Object.values(character.attributes).reduce(
    (sum, a) => sum + (attributeModifierCosts[a.purchased] ?? 99),
    0,
  );
  const values = Object.fromEntries(
    Object.entries(character.attributes).map(([id, a]) => [
      id,
      a.racial + a.purchased + a.increases,
    ]),
  ) as Record<keyof typeof labels, number>;
  const derived = deriveCharacter(values, 1);
  const issues = [
    !discipline && 'Choose a Discipline.',
    !race && 'Choose a race.',
    spent > 25 && `Attribute allocation exceeds 25 points by ${spent - 25}.`,
    !character.identity.name.trim() && 'Give the character a name.',
  ].filter(Boolean) as string[];
  const patchCreation = (patch: Partial<Earthdawn4eCharacter['creation']>) =>
    update((c) => ({ ...c, creation: { ...c.creation, ...patch } }));
  const screens = [
    <>
      <h2>Choose a Discipline</h2>
      <div className="tb2-choice-grid">
        {earthdawnDisciplines.map((d) => (
          <button
            type="button"
            aria-pressed={discipline?.id === d.id}
            key={d.id}
            onClick={() =>
              update((c) => ({
                ...c,
                disciplines: [
                  {
                    id: crypto.randomUUID(),
                    definitionId: d.id,
                    sourceId: d.sourceId,
                    source: d.source,
                    page: d.page,
                    unresolved: false,
                    disciplineId: d.id,
                    name: d.name,
                    circle: 1,
                    startedAtCircle: 1,
                    questor: false,
                  },
                ],
              }))
            }
          >
            <strong>{d.name}</strong>
            <small>{d.summary}</small>
          </button>
        ))}
      </div>
    </>,
    <>
      <h2>Choose a Race</h2>
      <div className="tb2-choice-grid">
        {earthdawnRaces.map((r) => (
          <button
            type="button"
            aria-pressed={race?.id === r.id}
            key={r.id}
            onClick={() =>
              update((c) => ({
                ...c,
                identity: { ...c.identity, raceId: r.id, raceName: r.name },
                attributes: Object.fromEntries(
                  Object.entries(c.attributes).map(([id, a]) => [
                    id,
                    {
                      ...a,
                      racial: r.attributes[id as keyof typeof r.attributes],
                    },
                  ]),
                ) as typeof c.attributes,
                health: { ...c.health, karmaMaximum: r.karmaModifier },
              }))
            }
          >
            <strong>{r.name}</strong>
            <small>{r.summary}</small>
          </button>
        ))}
      </div>
    </>,
    <>
      <h2>Generate Attributes</h2>
      <p>
        Spend up to 25 points. Remaining points increase maximum Karma after
        final review.
      </p>
      <div className="tb2-field-grid">
        {Object.entries(character.attributes).map(([id, a]) => (
          <label key={id}>
            <span>
              {labels[id as keyof typeof labels]} — racial {a.racial}
            </span>
            <select
              value={a.purchased}
              onChange={(e) =>
                update((c) => ({
                  ...c,
                  attributes: {
                    ...c.attributes,
                    [id]: {
                      ...c.attributes[id as keyof typeof c.attributes],
                      purchased: Number(e.target.value),
                    },
                  },
                }))
              }
            >
              {Object.entries(attributeModifierCosts).map(
                ([modifier, cost]) => (
                  <option key={modifier} value={modifier}>
                    {Number(modifier) >= 0 ? '+' : ''}
                    {modifier} ({cost >= 0 ? cost : `gain ${-cost}`} points)
                  </option>
                ),
              )}
            </select>
          </label>
        ))}
      </div>
      <p className={spent > 25 ? 'warning-message' : 'success-message'}>
        {25 - spent} Attribute Points remaining
      </p>
    </>,
    <>
      <h2>Review Characteristics</h2>
      <div className="tb2-derived-grid">
        <span>
          Physical Defense <strong>{derived.physicalDefense}</strong>
        </span>
        <span>
          Mystic Defense <strong>{derived.mysticDefense}</strong>
        </span>
        <span>
          Social Defense <strong>{derived.socialDefense}</strong>
        </span>
        <span>
          Initiative <strong>{derived.initiative}</strong>
        </span>
        <span>
          Unconsciousness <strong>{derived.unconsciousness}</strong>
        </span>
        <span>
          Death <strong>{derived.death}</strong>
        </span>
      </div>
    </>,
    <>
      <h2>Racial Abilities</h2>
      <p>{race?.abilities.join(' · ') || 'Choose a race first.'}</p>
    </>,
    <>
      <h2>Talent Ranks and Spells</h2>
      <p>
        {discipline
          ? `${discipline.name} begins with ${discipline.noviceTalents.join(', ')}. Assign the eight free Talent ranks on the finalized sheet.`
          : 'Choose a Discipline first.'}
      </p>
    </>,
    <>
      <h2>Skill Ranks</h2>
      <p>
        Beginning characters receive 8 General, 2 Knowledge, and 1 Artisan Skill
        ranks. Custom Knowledge and Artisan names remain supported.
      </p>
    </>,
    <>
      <h2>Starting Equipment</h2>
      <p>
        Select official equipment on the finalized sheet. Disabled source books
        stay hidden unless explicitly revealed.
      </p>
    </>,
    <>
      <h2>Flesh Out the Character</h2>
      <div className="tb2-text-grid">
        <label>
          <span>Name</span>
          <input
            value={character.identity.name}
            onChange={(e) =>
              update((c) => ({
                ...c,
                identity: { ...c.identity, name: e.target.value },
              }))
            }
          />
        </label>
        <label>
          <span>Player</span>
          <input
            value={character.identity.player}
            onChange={(e) =>
              update((c) => ({
                ...c,
                identity: { ...c.identity, player: e.target.value },
              }))
            }
          />
        </label>
        <label>
          <span>Description</span>
          <textarea
            value={character.identity.description}
            onChange={(e) =>
              update((c) => ({
                ...c,
                identity: { ...c.identity, description: e.target.value },
              }))
            }
          />
        </label>
      </div>
    </>,
    <>
      <h2>Review and Finalize</h2>
      {issues.length ? (
        <>
          <ul className="warning-message">
            {issues.map((i) => (
              <li key={i}>{i}</li>
            ))}
          </ul>
          {character.creation.enforceRules ? (
            <label className="toggle-row">
              <input
                type="checkbox"
                checked={character.creation.overrides.some(
                  ({ code }) => code === 'creation-review',
                )}
                onChange={(event) =>
                  update((c) => ({
                    ...c,
                    creation: {
                      ...c.creation,
                      overrides: event.target.checked
                        ? [
                            ...c.creation.overrides.filter(
                              ({ code }) => code !== 'creation-review',
                            ),
                            {
                              id: crypto.randomUUID(),
                              code: 'creation-review',
                              reason:
                                'GM Approved the listed First Circle creation exceptions.',
                              createdAt: new Date().toISOString(),
                            },
                          ]
                        : c.creation.overrides.filter(
                            ({ code }) => code !== 'creation-review',
                          ),
                    },
                  }))
                }
              />
              <span>GM Approved these creation exceptions</span>
            </label>
          ) : null}
        </>
      ) : (
        <p className="success-message">Character is ready for play.</p>
      )}
      <button
        type="button"
        className="primary-button"
        disabled={
          issues.length > 0 &&
          character.creation.enforceRules &&
          !character.creation.overrides.some(
            ({ code }) => code === 'creation-review',
          )
        }
        onClick={() =>
          update((c) => ({
            ...c,
            creation: {
              ...c.creation,
              status: 'finalized',
              finalizedAt: new Date().toISOString(),
            },
            health: {
              ...c.health,
              karmaCurrent: c.health.karmaMaximum + (25 - spent),
            },
          }))
        }
      >
        Finalize Character
      </button>
    </>,
  ];
  return (
    <section
      className="tb2-creator character-creator"
      aria-label="Earthdawn character creator"
    >
      <p className="eyebrow">Earthdawn creation · Step {step + 1} of 10</p>
      {screens[step]}
      <div className="button-row">
        <button
          type="button"
          className="secondary-button"
          disabled={step === 0}
          onClick={() => patchCreation({ currentStep: Math.max(0, step - 1) })}
        >
          Previous
        </button>
        <button
          type="button"
          className="primary-button"
          disabled={step === 9}
          onClick={() => patchCreation({ currentStep: Math.min(9, step + 1) })}
        >
          Next
        </button>
      </div>
    </section>
  );
}
