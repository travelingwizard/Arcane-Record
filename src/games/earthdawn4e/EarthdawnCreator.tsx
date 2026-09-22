import {
  SheetCard,
  SheetField,
  SheetFieldGrid,
  SheetNotice,
} from '../../components/layout/SheetPrimitives';
import {
  earthdawnCatalog,
  earthdawnDisciplines,
  earthdawnPassions,
  earthdawnRaces,
} from './catalog';
import { attributeModifierCosts, deriveCharacter, stepDice } from './engine';
import {
  questorTier,
  reconcileDisciplineTalents,
  requiredTalents,
} from './rules';
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
const tierRanges = [
  ['Novice', 1, 4],
  ['Journeyman', 5, 8],
  ['Warden', 9, 12],
  ['Master', 13, 15],
] as const;

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
  const selected = character.disciplines[0];
  const discipline = earthdawnDisciplines.find(
    ({ id }) => id === selected?.disciplineId,
  );
  const spent = Object.values(character.attributes).reduce(
    (sum, attribute) =>
      sum + (attributeModifierCosts[attribute.purchased] ?? 99),
    0,
  );
  const values = Object.fromEntries(
    Object.entries(character.attributes).map(([id, attribute]) => [
      id,
      attribute.racial + attribute.purchased + attribute.increases,
    ]),
  ) as Record<keyof typeof labels, number>;
  const derived = deriveCharacter(values, selected?.circle ?? 1);
  const isQuestor = character.creation.profile !== 'adept';
  const purchasedSkills = character.skills.reduce(
    (sum, skill) => sum + skill.freeRank,
    0,
  );
  const talentRanks = character.talents.reduce(
    (sum, talent) => sum + talent.freeRank,
    0,
  );
  const optionalTalentCount = character.talents.filter(
    ({ optional, originDisciplineId }) =>
      optional && originDisciplineId === discipline?.id,
  ).length;
  const skillRanks = Object.fromEntries(
    (['general', 'knowledge', 'artisan', 'language'] as const).map(
      (category) => [
        category,
        character.skills
          .filter((skill) => skill.category === category)
          .reduce((sum, skill) => sum + skill.freeRank, 0),
      ],
    ),
  ) as Record<'general' | 'knowledge' | 'artisan' | 'language', number>;
  const equipmentSpent =
    character.equipment.reduce(
      (sum, item) => sum + item.costSilver * item.quantity,
      0,
    ) +
    character.weapons.reduce(
      (sum, item) => sum + item.costSilver * item.quantity,
      0,
    );
  const nonAdeptIssue = 'Record a GM-approved non-Adept Questor skill profile.';
  const issues = [
    character.creation.profile !== 'questor' &&
      !discipline &&
      'Choose a Discipline.',
    !race && 'Choose a race.',
    spent > 25 && `Attribute allocation exceeds 25 points by ${spent - 25}.`,
    character.creation.profile !== 'questor' &&
      talentRanks !== 8 &&
      `Assign exactly 8 free talent ranks (${talentRanks} assigned).`,
    character.creation.profile !== 'questor' &&
      discipline &&
      optionalTalentCount !== (selected?.circle ?? 1) &&
      `Choose one Talent Option for each Circle (${optionalTalentCount}/${selected?.circle ?? 1} chosen).`,
    character.creation.profile !== 'questor' &&
      skillRanks.general !== character.creation.skillPoints.general &&
      `Assign ${character.creation.skillPoints.general} General skill ranks (${skillRanks.general} assigned).`,
    character.creation.profile !== 'questor' &&
      skillRanks.knowledge !== character.creation.skillPoints.knowledge &&
      `Assign ${character.creation.skillPoints.knowledge} Knowledge skill ranks (${skillRanks.knowledge} assigned).`,
    character.creation.profile !== 'questor' &&
      skillRanks.artisan !== character.creation.skillPoints.artisan &&
      `Assign ${character.creation.skillPoints.artisan} Artisan skill rank (${skillRanks.artisan} assigned).`,
    isQuestor && !character.questor.patronId && 'Choose a patron Passion.',
    character.creation.profile === 'questor' &&
      !character.creation.overrides.some(
        ({ code }) => code === nonAdeptIssue,
      ) &&
      nonAdeptIssue,
    !character.identity.name.trim() && 'Give the character a name.',
  ].filter(Boolean) as string[];
  const patchCreation = (patch: Partial<Earthdawn4eCharacter['creation']>) =>
    update((current) => ({
      ...current,
      creation: { ...current.creation, ...patch },
    }));
  const chooseDiscipline = (id: string | null) =>
    update((current) => {
      if (!id)
        return {
          ...current,
          disciplines: [
            {
              id: crypto.randomUUID(),
              definitionId: null,
              sourceId: null,
              source: null,
              page: null,
              unresolved: true,
              disciplineId: null,
              name: '',
              circle: 1,
              startedAtCircle: 1,
              questor: false,
              custom: true,
            },
          ],
        };
      const definition = earthdawnDisciplines.find((entry) => entry.id === id)!;
      const record = {
        id: current.disciplines[0]?.id ?? crypto.randomUUID(),
        definitionId: definition.id,
        sourceId: definition.sourceId,
        source: definition.source,
        page: definition.page,
        unresolved: false,
        disciplineId: definition.id,
        name: definition.name,
        circle: current.disciplines[0]?.circle ?? 1,
        startedAtCircle: 1,
        questor: false,
        custom: false,
      };
      return {
        ...current,
        disciplines: [record],
        talents: reconcileDisciplineTalents(
          current.talents,
          definition,
          record.circle,
        ),
      };
    });
  const screens = [
    <section key="profile">
      <h2>Character Path</h2>
      <p>Questor devotion is stored separately from Discipline training.</p>
      <div className="sheet-choice-grid earthdawn-choice-grid">
        {(
          [
            ['adept', 'Adept', 'Follow a magical Discipline.'],
            [
              'adept-questor',
              'Adept + Questor',
              'Follow a Discipline and a patron Passion.',
            ],
            [
              'questor',
              'Non-Adept Questor',
              'Use a GM-approved skill profile without invented adept training.',
            ],
          ] as const
        ).map(([value, name, summary]) => (
          <button
            type="button"
            key={value}
            aria-pressed={character.creation.profile === value}
            onClick={() => patchCreation({ profile: value })}
          >
            <strong>{name}</strong>
            <small>{summary}</small>
          </button>
        ))}
      </div>
    </section>,
    <section key="discipline">
      <h2>Discipline and Passion</h2>
      {character.creation.profile !== 'questor' ? (
        <>
          <div className="sheet-choice-grid earthdawn-choice-grid">
            {earthdawnDisciplines.map((entry) => (
              <button
                type="button"
                key={entry.id}
                aria-pressed={discipline?.id === entry.id}
                onClick={() => chooseDiscipline(entry.id)}
              >
                <strong>{entry.name}</strong>
                <small>{entry.summary}</small>
              </button>
            ))}
            <button
              type="button"
              aria-pressed={selected?.custom === true}
              onClick={() => chooseDiscipline(null)}
            >
              <strong>Custom Discipline</strong>
              <small>Adds no talents or calculated benefits.</small>
            </button>
          </div>
          {selected ? (
            <label className="sheet-field">
              <span className="sheet-field__label">Starting Circle</span>
              <select
                value={selected.circle}
                onChange={(event) => {
                  const circle = Number(event.target.value);
                  update((current) => ({
                    ...current,
                    disciplines: current.disciplines.map((item, index) =>
                      index === 0 ? { ...item, circle } : item,
                    ),
                    talents: discipline
                      ? reconcileDisciplineTalents(
                          current.talents,
                          discipline,
                          circle,
                        )
                      : current.talents,
                  }));
                }}
              >
                {Array.from({ length: 15 }, (_, index) => (
                  <option key={index + 1}>{index + 1}</option>
                ))}
              </select>
            </label>
          ) : null}
          {selected?.custom ? (
            <label className="sheet-field">
              <span className="sheet-field__label">Custom Discipline name</span>
              <input
                value={selected.name}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    disciplines: current.disciplines.map((item) =>
                      item.id === selected.id
                        ? { ...item, name: event.target.value }
                        : item,
                    ),
                  }))
                }
              />
            </label>
          ) : null}
        </>
      ) : null}
      {isQuestor ? (
        <div className="sheet-choice-grid earthdawn-choice-grid">
          {earthdawnPassions.map(([name, page, mad, summary]) => {
            const id = `ed4.questors.devotion.${name.toLocaleLowerCase()}`;
            return (
              <button
                type="button"
                key={name}
                hidden={mad && !character.sources.showUnavailable}
                aria-pressed={character.questor.patronId === id}
                onClick={() =>
                  update((current) => ({
                    ...current,
                    identity: { ...current.identity, passion: name },
                    questor: {
                      ...current.questor,
                      patronId: id,
                      patronName: name,
                      rank: Math.max(1, current.questor.rank),
                      tier: questorTier(Math.max(1, current.questor.rank)),
                    },
                  }))
                }
              >
                <strong>{name}</strong>
                <small>
                  {summary} Questors p. {page}
                  {mad ? ' · GM approval required' : ''}
                </small>
              </button>
            );
          })}
        </div>
      ) : null}
      {discipline ? (
        <div className="earthdawn-tier-disclosures">
          {tierRanges.map(([tier, start, end]) => (
            <details key={tier} open={start === 1}>
              <summary>
                {tier} · Circles {start}–{end}
              </summary>
              {discipline.circles
                .filter(({ circle }) => circle >= start && circle <= end)
                .map((entry) => (
                  <p key={entry.circle}>
                    <strong>Circle {entry.circle}:</strong>{' '}
                    {entry.requiredTalents.join(', ')}
                    {entry.ability ? ` · ${entry.ability}` : ''}
                  </p>
                ))}
              <p>
                <strong>Talent options:</strong>{' '}
                {discipline.talentOptions[
                  tier.toLocaleLowerCase() as keyof typeof discipline.talentOptions
                ].join(', ') || 'Source inventory pending for this tier.'}
              </p>
            </details>
          ))}
        </div>
      ) : null}
    </section>,
    <section key="race">
      <h2>Race and Racial Abilities</h2>
      <div className="sheet-choice-grid earthdawn-choice-grid">
        {earthdawnRaces.map((entry) => (
          <button
            type="button"
            key={entry.id}
            aria-pressed={race?.id === entry.id}
            onClick={() =>
              update((current) => ({
                ...current,
                identity: {
                  ...current.identity,
                  raceId: entry.id,
                  raceName: entry.name,
                },
                attributes: Object.fromEntries(
                  Object.entries(current.attributes).map(([id, value]) => [
                    id,
                    {
                      ...value,
                      racial:
                        entry.attributes[id as keyof typeof entry.attributes],
                    },
                  ]),
                ) as typeof current.attributes,
                health: {
                  ...current.health,
                  karmaMaximum: entry.karmaModifier,
                },
              }))
            }
          >
            <strong>{entry.name}</strong>
            <small>{entry.summary}</small>
            <small>Racial abilities: {entry.abilities.join(', ')}</small>
          </button>
        ))}
      </div>
    </section>,
    <section key="attributes">
      <h2>Attributes and Characteristics</h2>
      <div
        className="earthdawn-attribute-table"
        role="table"
        aria-label="Attribute allocation"
      >
        {Object.entries(character.attributes).map(([id, attribute]) => {
          const value = values[id as keyof typeof labels];
          return (
            <div className="earthdawn-attribute-row" role="row" key={id}>
              <strong>{labels[id as keyof typeof labels]}</strong>
              <span>Race {attribute.racial}</span>
              <select
                aria-label={`${labels[id as keyof typeof labels]} modifier`}
                value={attribute.purchased}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    attributes: {
                      ...current.attributes,
                      [id]: {
                        ...current.attributes[
                          id as keyof typeof current.attributes
                        ],
                        purchased: Number(event.target.value),
                      },
                    },
                  }))
                }
              >
                {Object.entries(attributeModifierCosts).map(
                  ([modifier, cost]) => (
                    <option key={modifier} value={modifier}>
                      {Number(modifier) >= 0 ? '+' : ''}
                      {modifier} ({cost} points)
                    </option>
                  ),
                )}
              </select>
              <span>
                Value <strong>{value}</strong>
              </span>
              <span>Step {Math.floor((value - 1) / 3) + 2}</span>
              <span>{stepDice(Math.floor((value - 1) / 3) + 2)}</span>
            </div>
          );
        })}
      </div>
      <SheetNotice tone={spent > 25 ? 'warning' : 'success'}>
        {25 - spent} Attribute Points remaining
      </SheetNotice>
      <div className="sheet-stat-grid earthdawn-derived-grid">
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
        <span>
          Wound Threshold <strong>{derived.woundThreshold}</strong>
        </span>
        <span>
          Carrying <strong>{derived.carryingCapacity}</strong>
        </span>
      </div>
    </section>,
    <section key="talents">
      <h2>Talents, Options, and Spells</h2>
      {discipline ? (
        <p>
          {requiredTalents(discipline, selected?.circle ?? 1).length} required
          talents are present at rank 0. Assign eight free talent ranks before
          finalization.
        </p>
      ) : (
        <p>
          Custom and non-Adept profiles do not receive Discipline talents
          automatically.
        </p>
      )}
      <ul>
        {character.talents.map((talent) => (
          <li key={talent.id}>
            <label>
              <span>
                {talent.name} · Circle {talent.originCircle ?? 'custom'}
              </span>
              <input
                aria-label={`${talent.name} free ranks`}
                type="number"
                min="0"
                max="3"
                value={talent.freeRank}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    talents: current.talents.map((item) =>
                      item.id === talent.id
                        ? {
                            ...item,
                            freeRank: Math.min(
                              3,
                              Math.max(0, Number(event.target.value)),
                            ),
                            rank: Math.min(
                              3,
                              Math.max(0, Number(event.target.value)),
                            ),
                          }
                        : item,
                    ),
                  }))
                }
              />
            </label>
          </li>
        ))}
      </ul>
      <SheetNotice tone={talentRanks === 8 ? 'success' : 'warning'}>
        {8 - talentRanks} free talent ranks remaining
      </SheetNotice>
      {discipline ? (
        <>
          <h3>
            Talent Options · {optionalTalentCount}/{selected?.circle ?? 1}
          </h3>
          {(
            [
              ['novice', 1],
              ['journeyman', 5],
              ['warden', 9],
              ['master', 13],
            ] as const
          ).map(([tier, minimumCircle]) =>
            (selected?.circle ?? 1) >= minimumCircle ? (
              <div key={tier}>
                <h4>{tier[0]!.toUpperCase() + tier.slice(1)}</h4>
                <div className="sheet-choice-grid earthdawn-choice-grid">
                  {discipline.talentOptions[tier].map((name) => {
                    const chosen = character.talents.some(
                      (talent) =>
                        talent.optional &&
                        talent.originDisciplineId === discipline.id &&
                        talent.name === name,
                    );
                    return (
                      <button
                        type="button"
                        key={`${tier}-${name}`}
                        aria-pressed={chosen}
                        disabled={
                          !chosen &&
                          optionalTalentCount >= (selected?.circle ?? 1)
                        }
                        onClick={() =>
                          update((current) => {
                            if (chosen)
                              return {
                                ...current,
                                talents: current.talents.filter(
                                  (talent) =>
                                    !(
                                      talent.optional &&
                                      talent.originDisciplineId ===
                                        discipline.id &&
                                      talent.name === name
                                    ),
                                ),
                              };
                            const definition = earthdawnCatalog.find(
                              (entry) =>
                                entry.kind === 'talent' && entry.name === name,
                            );
                            return {
                              ...current,
                              talents: [
                                ...current.talents,
                                {
                                  id: crypto.randomUUID(),
                                  definitionId: definition?.id ?? null,
                                  sourceId:
                                    minimumCircle <= 8
                                      ? 'ed4.players-guide'
                                      : 'ed4.companion',
                                  source:
                                    minimumCircle <= 8
                                      ? 'Earthdawn Fourth Edition Player’s Guide'
                                      : 'Earthdawn Fourth Edition Companion',
                                  page:
                                    minimumCircle <= 8
                                      ? discipline.page
                                      : (discipline.circles.find(
                                          ({ circle }) =>
                                            circle === minimumCircle,
                                        )?.page ?? null),
                                  unresolved: false,
                                  name,
                                  rank: 0,
                                  freeRank: 0,
                                  attribute: 'dexterity',
                                  bonus: 0,
                                  notes: '',
                                  action: '',
                                  strain: 0,
                                  disciplineSources: [discipline.id],
                                  optional: true,
                                  originCircle: optionalTalentCount + 1,
                                  originDisciplineId: discipline.id,
                                  creationOwned: true,
                                },
                              ],
                            };
                          })
                        }
                      >
                        {name}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : null,
          )}
        </>
      ) : null}
      {discipline?.spellcaster ? (
        <div className="sheet-choice-grid earthdawn-choice-grid">
          {earthdawnCatalog
            .filter(
              (entry) =>
                entry.kind === 'spell' &&
                entry.requirements.some((requirement) =>
                  requirement.startsWith(discipline.name),
                ) &&
                Number(
                  entry.requirements[0]?.match(/Circle (\d+)/)?.[1] ?? 99,
                ) <= (selected?.circle ?? 1),
            )
            .map((spell) => {
              const chosen = character.magic.spells.some(
                ({ definitionId }) => definitionId === spell.id,
              );
              return (
                <button
                  type="button"
                  key={spell.id}
                  aria-pressed={chosen}
                  onClick={() =>
                    update((current) => ({
                      ...current,
                      magic: {
                        ...current.magic,
                        spells: chosen
                          ? current.magic.spells.filter(
                              ({ definitionId }) => definitionId !== spell.id,
                            )
                          : [
                              ...current.magic.spells,
                              {
                                id: crypto.randomUUID(),
                                definitionId: spell.id,
                                sourceId: spell.sourceId,
                                source: spell.source,
                                page: spell.page,
                                unresolved: false,
                                name: spell.name,
                                discipline: discipline.name,
                                circle: Number(
                                  spell.requirements[0]?.match(
                                    /Circle (\d+)/,
                                  )?.[1] ?? 1,
                                ),
                                threads: 0,
                                weaving: '',
                                casting: '',
                                range: '',
                                duration: '',
                                effect: '',
                                learned: true,
                                notes: '',
                              },
                            ],
                      },
                    }))
                  }
                >
                  <strong>{spell.name}</strong>
                  <small>
                    {spell.summary} {spell.source}, p. {spell.page}
                  </small>
                </button>
              );
            })}
        </div>
      ) : null}
    </section>,
    <section key="skills">
      <h2>Skills and Languages</h2>
      <p>
        Starting allocation: 8 General, 2 Knowledge, and 1 Artisan rank. Custom
        records remain clearly marked.
      </p>
      <p>{purchasedSkills} free ranks assigned.</p>
      <div className="sheet-stat-grid earthdawn-derived-grid">
        {(['general', 'knowledge', 'artisan', 'language'] as const).map(
          (category) => (
            <span key={category}>
              {category}{' '}
              <strong>
                {skillRanks[category]} /{' '}
                {character.creation.skillPoints[category]}
              </strong>
            </span>
          ),
        )}
      </div>
      <div className="sheet-choice-grid earthdawn-choice-grid">
        {earthdawnCatalog
          .filter((entry) => entry.kind === 'skill')
          .map((definition) => {
            const chosen = character.skills.some(
              ({ definitionId }) => definitionId === definition.id,
            );
            return (
              <button
                type="button"
                key={definition.id}
                aria-pressed={chosen}
                onClick={() => {
                  if (chosen) return;
                  update((current) => ({
                    ...current,
                    skills: [
                      ...current.skills,
                      {
                        id: crypto.randomUUID(),
                        definitionId: definition.id,
                        sourceId: definition.sourceId,
                        source: definition.source,
                        page: definition.page,
                        unresolved: false,
                        name: definition.name,
                        rank: 0,
                        freeRank: 0,
                        attribute: 'perception',
                        bonus: 0,
                        notes: '',
                        category: 'general',
                        action: '',
                        strain: 0,
                        creationOwned: true,
                      },
                    ],
                  }));
                }}
              >
                <strong>{definition.name}</strong>
                <small>
                  {definition.source}, p. {definition.page}
                </small>
              </button>
            );
          })}
      </div>
      {character.skills.map((skill) => (
        <SheetCard key={skill.id} density="compact">
          <SheetFieldGrid columns={3}>
            <SheetField label="Skill">
              <input
                value={skill.name}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    skills: current.skills.map((item) =>
                      item.id === skill.id
                        ? { ...item, name: event.target.value }
                        : item,
                    ),
                  }))
                }
              />
            </SheetField>
            <SheetField label="Category">
              <select
                value={skill.category}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    skills: current.skills.map((item) =>
                      item.id === skill.id
                        ? {
                            ...item,
                            category: event.target
                              .value as typeof skill.category,
                          }
                        : item,
                    ),
                  }))
                }
              >
                <option value="general">General</option>
                <option value="knowledge">Knowledge</option>
                <option value="artisan">Artisan</option>
                <option value="language">Language</option>
              </select>
            </SheetField>
            <SheetField label="Free ranks">
              <input
                type="number"
                min="0"
                value={skill.freeRank}
                onChange={(event) =>
                  update((current) => ({
                    ...current,
                    skills: current.skills.map((item) =>
                      item.id === skill.id
                        ? {
                            ...item,
                            freeRank: Math.max(0, Number(event.target.value)),
                            rank: Math.max(0, Number(event.target.value)),
                          }
                        : item,
                    ),
                  }))
                }
              />
            </SheetField>
          </SheetFieldGrid>
        </SheetCard>
      ))}
      <button
        type="button"
        className="secondary-button"
        onClick={() =>
          update((current) => ({
            ...current,
            skills: [
              ...current.skills,
              {
                id: crypto.randomUUID(),
                definitionId: null,
                sourceId: null,
                source: null,
                page: null,
                unresolved: true,
                name: '',
                rank: 0,
                freeRank: 0,
                attribute: 'perception',
                bonus: 0,
                notes: '',
                category: 'knowledge',
                action: '',
                strain: 0,
                creationOwned: true,
              },
            ],
          }))
        }
      >
        Add custom skill
      </button>
    </section>,
    <section key="equipment">
      <h2>Equipment and Wealth</h2>
      <p>
        Starting equipment is retained separately from purchases. Spending may
        exceed available silver.
      </p>
      <div className="sheet-stat-grid earthdawn-derived-grid">
        <span>
          Starting silver <strong>{character.wealth.startingSilver}</strong>
        </span>
        <span>
          Spent <strong>{equipmentSpent}</strong>
        </span>
        <span>
          Balance{' '}
          <strong>{character.wealth.startingSilver - equipmentSpent}</strong>
        </span>
      </div>
      <div className="sheet-choice-grid earthdawn-choice-grid">
        {earthdawnCatalog
          .filter(
            (entry) =>
              (entry.kind === 'equipment' || entry.kind === 'weapon') &&
              entry.verification === 'verified' &&
              character.sources.enabledSourceIds.includes(entry.sourceId),
          )
          .map((definition) => (
            <button
              type="button"
              key={definition.id}
              onClick={() =>
                update((current) => {
                  let mechanics: Record<string, unknown> = {};
                  try {
                    mechanics = JSON.parse(definition.mechanics) as Record<
                      string,
                      unknown
                    >;
                  } catch {
                    mechanics = {};
                  }
                  const numeric = (key: string) =>
                    typeof mechanics[key] === 'number'
                      ? (mechanics[key] as number)
                      : 0;
                  const base = {
                    id: crypto.randomUUID(),
                    definitionId: definition.id,
                    sourceId: definition.sourceId,
                    source: definition.source,
                    page: definition.page,
                    unresolved: false,
                    name: definition.name,
                    notes: '',
                  };
                  if (definition.kind === 'weapon')
                    return {
                      ...current,
                      weapons: [
                        ...current.weapons,
                        {
                          ...base,
                          strengthMinimum: numeric('strengthMinimum'),
                          damageStep: numeric('damageStep'),
                          range:
                            typeof mechanics.range === 'string'
                              ? mechanics.range
                              : '',
                          quantity: 1,
                          costSilver: definition.costSilver ?? 0,
                          inUse: false,
                        },
                      ],
                    };
                  return {
                    ...current,
                    equipment: [
                      ...current.equipment,
                      {
                        ...base,
                        type: definition.kind,
                        description: definition.summary,
                        quantity: 1,
                        value: `${definition.costSilver ?? 0} sp`,
                        costSilver: definition.costSilver ?? 0,
                        weight: numeric('weight'),
                        inUse: false,
                        physicalArmor: numeric('physicalArmor'),
                        mysticArmor: numeric('mysticArmor'),
                        physicalDefense: numeric('physicalDefense'),
                        mysticDefense: numeric('mysticDefense'),
                        initiativePenalty: numeric('initiativePenalty'),
                        shatterThreshold: numeric('shatterThreshold'),
                        forgedBonus: 0,
                      },
                    ],
                  };
                })
              }
            >
              <strong>{definition.name}</strong>
              <small>
                {definition.costSilver ?? 0} silver · {definition.source}, p.{' '}
                {definition.page}
              </small>
            </button>
          ))}
      </div>
      {equipmentSpent > character.wealth.startingSilver ? (
        <SheetNotice tone="warning">
          Starting funds are negative. This is allowed and remains visible for
          table review.
        </SheetNotice>
      ) : null}
    </section>,
    <section key="identity">
      <h2>Identity</h2>
      <div className="sheet-field-grid earthdawn-field-grid">
        {(
          [
            'name',
            'player',
            'gender',
            'age',
            'height',
            'weight',
            'hair',
            'eyes',
            'skin',
          ] as const
        ).map((field) => (
          <label key={field}>
            <span>{field}</span>
            <input
              value={character.identity[field]}
              onChange={(event) =>
                update((current) => ({
                  ...current,
                  identity: {
                    ...current.identity,
                    [field]: event.target.value,
                  },
                }))
              }
            />
          </label>
        ))}
      </div>
    </section>,
    <section key="review">
      <h2>Review and Finalize</h2>
      <SheetNotice tone={issues.length ? 'warning' : 'success'}>
        {issues.length ? issues.join(' ') : 'Character is ready for play.'}
      </SheetNotice>
      {issues.map((issue) => (
        <label className="sheet-card sheet-card--compact" key={issue}>
          <span>{issue}</span>
          <input
            placeholder="GM approval reason"
            aria-label={`Approval reason for ${issue}`}
            value={
              character.creation.overrides.find(({ code }) => code === issue)
                ?.reason ?? ''
            }
            onChange={(event) =>
              update((current) => ({
                ...current,
                creation: {
                  ...current.creation,
                  overrides: event.target.value
                    ? [
                        ...current.creation.overrides.filter(
                          ({ code }) => code !== issue,
                        ),
                        {
                          id: crypto.randomUUID(),
                          code: issue,
                          reason: event.target.value,
                          createdAt: new Date().toISOString(),
                        },
                      ]
                    : current.creation.overrides.filter(
                        ({ code }) => code !== issue,
                      ),
                },
              }))
            }
          />
        </label>
      ))}
      <button
        type="button"
        className="primary-button"
        disabled={issues.some(
          (issue) =>
            !character.creation.overrides.some(({ code }) => code === issue),
        )}
        onClick={() =>
          update((current) => ({
            ...current,
            creation: {
              ...current.creation,
              status: 'finalized',
              finalizedAt: new Date().toISOString(),
            },
            sheetLayout: { ...current.sheetLayout, mode: 'play' },
            health: {
              ...current.health,
              karmaCurrent:
                current.health.karmaMaximum + Math.max(0, 25 - spent),
            },
          }))
        }
      >
        Finalize Character
      </button>
    </section>,
  ];
  return (
    <section
      className="earthdawn-creator character-creator"
      aria-label="Earthdawn character creator"
    >
      <p className="eyebrow">Earthdawn creation · Step {step + 1} of 8</p>
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
          disabled={step === 7}
          onClick={() => patchCreation({ currentStep: Math.min(7, step + 1) })}
        >
          Next
        </button>
      </div>
    </section>
  );
}
