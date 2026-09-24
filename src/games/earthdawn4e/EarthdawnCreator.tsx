import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  SheetBadge,
  SheetCard,
  SheetEmptyState,
  SheetField,
  SheetFieldGrid,
  SheetNotice,
  SheetToolbar,
} from '../../components/layout/SheetPrimitives';
import {
  earthdawnCatalog,
  earthdawnDisciplines,
  earthdawnPassions,
  earthdawnRaces,
  type EarthdawnAttributeId,
  type EarthdawnDefinition,
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

type SkillCategory = 'general' | 'knowledge' | 'artisan' | 'language';
type EquipmentCategory = 'equipment' | 'weapon' | 'armor' | 'shield';
const skillCategoryLabels: Record<SkillCategory, string> = {
  general: 'General',
  knowledge: 'Knowledge',
  artisan: 'Artisan',
  language: 'Language',
};
const parseMechanics = (definition: EarthdawnDefinition) => {
  try {
    return JSON.parse(definition.mechanics) as Record<string, unknown>;
  } catch {
    return {};
  }
};
const numericMechanic = (mechanics: Record<string, unknown>, key: string) =>
  typeof mechanics[key] === 'number' ? (mechanics[key] as number) : 0;
const equipmentCategory = (
  definition: EarthdawnDefinition,
): EquipmentCategory => {
  if (definition.kind === 'weapon') return 'weapon';
  const mechanics = parseMechanics(definition);
  if (
    typeof mechanics.physicalDefense === 'number' ||
    typeof mechanics.mysticDefense === 'number'
  )
    return 'shield';
  if (
    typeof mechanics.physicalArmor === 'number' ||
    typeof mechanics.mysticArmor === 'number'
  )
    return 'armor';
  return 'equipment';
};

function CreatorDialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;
  useEffect(() => {
    returnFocusRef.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    window.setTimeout(
      () => dialogRef.current?.querySelector<HTMLElement>('input')?.focus(),
      0,
    );
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
        return;
      }
      if (event.key !== 'Tab') return;
      const focusable = [
        ...(dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])',
        ) ?? []),
      ];
      if (!focusable.length) return;
      const first = focusable[0]!;
      const last = focusable.at(-1)!;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => {
      window.removeEventListener('keydown', handleKey);
      window.setTimeout(() => returnFocusRef.current?.focus(), 0);
    };
  }, []);
  return (
    <div className="earthdawn-creator-dialog-backdrop">
      <div
        ref={dialogRef}
        className="earthdawn-creator-dialog"
        role="dialog"
        aria-modal="true"
        aria-label={title}
      >
        <header>
          <h3>{title}</h3>
          <button type="button" className="secondary-button" onClick={onClose}>
            Close
          </button>
        </header>
        {children}
      </div>
    </div>
  );
}

export function EarthdawnCreator({
  character,
  update,
}: {
  character: Earthdawn4eCharacter;
  update: Update;
}) {
  const [skillDialogOpen, setSkillDialogOpen] = useState(false);
  const [skillCategory, setSkillCategory] = useState<SkillCategory>('general');
  const [skillSearch, setSkillSearch] = useState('');
  const [equipmentDialogOpen, setEquipmentDialogOpen] = useState(false);
  const [equipmentFilter, setEquipmentFilter] =
    useState<EquipmentCategory>('equipment');
  const [equipmentSearch, setEquipmentSearch] = useState('');
  const [talentSearch, setTalentSearch] = useState('');
  const [spellSearch, setSpellSearch] = useState('');
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
  const globalOverride = character.creation.overrides.find(
    ({ code }) => code === 'creator-global-override',
  );
  const overrideActive =
    !character.creation.enforceRules && Boolean(globalOverride?.reason.trim());
  const skillDefinitions = useMemo(
    () =>
      earthdawnCatalog.filter(
        (entry) =>
          entry.kind === 'skill' &&
          entry.skillCategory === skillCategory &&
          entry.verification === 'verified' &&
          character.sources.enabledSourceIds.includes(entry.sourceId) &&
          entry.name
            .toLocaleLowerCase()
            .includes(skillSearch.toLocaleLowerCase()),
      ),
    [character.sources.enabledSourceIds, skillCategory, skillSearch],
  );
  const equipmentDefinitions = useMemo(
    () =>
      earthdawnCatalog.filter(
        (entry) =>
          (entry.kind === 'equipment' || entry.kind === 'weapon') &&
          entry.verification === 'verified' &&
          character.sources.enabledSourceIds.includes(entry.sourceId) &&
          equipmentCategory(entry) === equipmentFilter &&
          entry.name
            .toLocaleLowerCase()
            .includes(equipmentSearch.toLocaleLowerCase()),
      ),
    [character.sources.enabledSourceIds, equipmentFilter, equipmentSearch],
  );
  const nonAdeptIssue = 'Record a GM-approved non-Adept Questor skill profile.';
  const violations = [
    spent > 25 && `Attribute allocation exceeds 25 points by ${spent - 25}.`,
    character.creation.profile !== 'questor' &&
      talentRanks > 8 &&
      `Talent allocation exceeds 8 free ranks by ${talentRanks - 8}.`,
    character.creation.profile !== 'questor' &&
      discipline &&
      optionalTalentCount > (selected?.circle ?? 1) &&
      `Talent Options exceed the Circle limit by ${optionalTalentCount - (selected?.circle ?? 1)}.`,
    character.creation.profile !== 'questor' &&
      skillRanks.general > character.creation.skillPoints.general &&
      `General skills exceed the ${character.creation.skillPoints.general}-rank allocation by ${skillRanks.general - character.creation.skillPoints.general}.`,
    character.creation.profile !== 'questor' &&
      skillRanks.knowledge > character.creation.skillPoints.knowledge &&
      `Knowledge skills exceed the ${character.creation.skillPoints.knowledge}-rank allocation by ${skillRanks.knowledge - character.creation.skillPoints.knowledge}.`,
    character.creation.profile !== 'questor' &&
      skillRanks.artisan > character.creation.skillPoints.artisan &&
      `Artisan skills exceed the ${character.creation.skillPoints.artisan}-rank allocation by ${skillRanks.artisan - character.creation.skillPoints.artisan}.`,
    equipmentSpent > character.wealth.startingSilver &&
      `Equipment spending exceeds starting wealth by ${equipmentSpent - character.wealth.startingSilver} silver.`,
    character.creation.profile === 'questor' &&
      character.questor.patronId &&
      !character.creation.overrides.some(
        ({ code }) => code === nonAdeptIssue,
      ) &&
      nonAdeptIssue,
  ].filter(Boolean) as string[];
  const advisories = [
    !discipline &&
      character.creation.profile !== 'questor' &&
      'No Discipline selected.',
    !race && 'No race selected.',
    !character.identity.name.trim() && 'Name is blank.',
    talentRanks < 8 && `${8 - talentRanks} free Talent ranks remain unspent.`,
    optionalTalentCount < (selected?.circle ?? 0) &&
      `${(selected?.circle ?? 0) - optionalTalentCount} Talent Option slot(s) remain unused.`,
    ...(['general', 'knowledge', 'artisan'] as const)
      .filter(
        (category) =>
          skillRanks[category] < character.creation.skillPoints[category],
      )
      .map(
        (category) =>
          `${character.creation.skillPoints[category] - skillRanks[category]} ${skillCategoryLabels[category]} skill rank(s) remain unspent.`,
      ),
  ].filter(Boolean) as string[];
  const patchCreation = (patch: Partial<Earthdawn4eCharacter['creation']>) =>
    update((current) => ({
      ...current,
      creation: { ...current.creation, ...patch },
    }));
  const setOverrideReason = (reason: string) =>
    update((current) => {
      const existing = current.creation.overrides.find(
        ({ code }) => code === 'creator-global-override',
      );
      const overrides = reason
        ? [
            ...current.creation.overrides.filter(
              ({ code }) => code !== 'creator-global-override',
            ),
            {
              id: existing?.id ?? crypto.randomUUID(),
              code: 'creator-global-override',
              reason,
              createdAt: existing?.createdAt ?? new Date().toISOString(),
            },
          ]
        : current.creation.overrides.filter(
            ({ code }) => code !== 'creator-global-override',
          );
      return {
        ...current,
        creation: {
          ...current.creation,
          enforceRules: reason ? current.creation.enforceRules : true,
          overrides,
        },
      };
    });
  const toggleOverride = (enabled: boolean) =>
    update((current) => ({
      ...current,
      creation: {
        ...current.creation,
        enforceRules: !enabled,
      },
    }));
  const addSkill = (
    definition: EarthdawnDefinition | null,
    category: SkillCategory,
  ) =>
    update((current) => ({
      ...current,
      skills: [
        ...current.skills,
        {
          id: crypto.randomUUID(),
          definitionId: definition?.id ?? null,
          sourceId: definition?.sourceId ?? null,
          source: definition?.source ?? null,
          page: definition?.page ?? null,
          unresolved: !definition,
          name: definition?.name ?? '',
          rank: 0,
          freeRank: 0,
          attribute: definition?.defaultAttribute ?? 'perception',
          bonus: 0,
          notes: '',
          category,
          action: '',
          strain: 0,
          creationOwned: true,
        },
      ],
    }));
  const addEquipment = (definition: EarthdawnDefinition) =>
    update((current) => {
      const mechanics = parseMechanics(definition);
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
              strengthMinimum: numericMechanic(mechanics, 'strengthMinimum'),
              damageStep: numericMechanic(mechanics, 'damageStep'),
              range: typeof mechanics.range === 'string' ? mechanics.range : '',
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
            type: equipmentCategory(definition),
            description: definition.summary,
            quantity: 1,
            value: `${definition.costSilver ?? 0} sp`,
            costSilver: definition.costSilver ?? 0,
            weight: numericMechanic(mechanics, 'weight'),
            inUse: false,
            physicalArmor: numericMechanic(mechanics, 'physicalArmor'),
            mysticArmor: numericMechanic(mechanics, 'mysticArmor'),
            physicalDefense: numericMechanic(mechanics, 'physicalDefense'),
            mysticDefense: numericMechanic(mechanics, 'mysticDefense'),
            initiativePenalty: numericMechanic(mechanics, 'initiativePenalty'),
            shatterThreshold: numericMechanic(mechanics, 'shatterThreshold'),
            forgedBonus: 0,
          },
        ],
      };
    });
  const completionBlocked = character.creation.enforceRules
    ? violations.length > 0
    : !globalOverride?.reason.trim();
  const finalize = () => {
    if (completionBlocked) return;
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
        karmaCurrent: current.health.karmaMaximum + Math.max(0, 25 - spent),
      },
    }));
  };
  const overridePanel = (
    <SheetCard density="compact" className="earthdawn-override-card">
      <SheetField label="GM Override reason">
        <input
          value={globalOverride?.reason ?? ''}
          placeholder="Record the GM’s reason before enabling"
          onChange={(event) => setOverrideReason(event.target.value)}
        />
      </SheetField>
      <label className="appearance-switch">
        <input
          type="checkbox"
          role="switch"
          aria-label="GM Override"
          checked={overrideActive}
          disabled={!globalOverride?.reason.trim()}
          onChange={(event) => toggleOverride(event.target.checked)}
        />
        <span>
          <strong>GM Override</strong>
          <small>
            Permit over-allocation and overspending. Warnings remain visible and
            the reason is retained with this character.
          </small>
        </span>
      </label>
    </SheetCard>
  );
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
            className="earthdawn-creator-choice-card"
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
                className="earthdawn-creator-choice-card"
                aria-pressed={discipline?.id === entry.id}
                onClick={() => chooseDiscipline(entry.id)}
              >
                <strong>{entry.name}</strong>
                <small>{entry.summary}</small>
              </button>
            ))}
            <button
              type="button"
              className="earthdawn-creator-choice-card"
              aria-pressed={selected?.custom === true}
              onClick={() => chooseDiscipline(null)}
            >
              <strong>Custom Discipline</strong>
              <small>Adds no talents or calculated benefits.</small>
            </button>
          </div>
          {selected ? (
            <SheetFieldGrid columns={3} className="earthdawn-starting-circle">
              <SheetField label="Starting Circle">
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
              </SheetField>
            </SheetFieldGrid>
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
                className="earthdawn-creator-choice-card"
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
            <details
              className="sheet-card sheet-card--compact earthdawn-tier-card"
              key={tier}
              open={start === 1}
            >
              <summary>
                {tier} · Circles {start}–{end}
              </summary>
              <div className="earthdawn-progression-list">
                {discipline.circles
                  .filter(({ circle }) => circle >= start && circle <= end)
                  .map((entry) => (
                    <div
                      className="earthdawn-progression-row"
                      key={entry.circle}
                    >
                      <strong>Circle {entry.circle}</strong>
                      <span>
                        {entry.requiredTalents.join(', ') ||
                          'No new required Talent'}
                      </span>
                      <small>
                        {entry.ability || 'No separate Circle ability'} · p.{' '}
                        {entry.page}
                      </small>
                    </div>
                  ))}
              </div>
              <h4>Talent options</h4>
              <div className="earthdawn-chip-list">
                {(discipline.talentOptions[
                  tier.toLocaleLowerCase() as keyof typeof discipline.talentOptions
                ].length
                  ? discipline.talentOptions[
                      tier.toLocaleLowerCase() as keyof typeof discipline.talentOptions
                    ]
                  : ['Source inventory pending for this tier.']
                ).map((name) => (
                  <span className="sheet-badge sheet-badge--neutral" key={name}>
                    {name}
                  </span>
                ))}
              </div>
              {discipline.spellcaster ? (
                <>
                  <h4>Spell access</h4>
                  <div className="earthdawn-chip-list">
                    {earthdawnCatalog
                      .filter((entry) => {
                        if (entry.kind !== 'spell') return false;
                        const circle = Number(
                          entry.requirements[0]?.match(/Circle (\d+)/)?.[1] ??
                            99,
                        );
                        return (
                          entry.requirements.some((requirement) =>
                            requirement.startsWith(discipline.name),
                          ) &&
                          circle >= start &&
                          circle <= end
                        );
                      })
                      .map((spell) => (
                        <span
                          className="sheet-badge sheet-badge--neutral"
                          key={spell.id}
                        >
                          {spell.name}
                        </span>
                      ))}
                  </div>
                </>
              ) : null}
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
            className="earthdawn-creator-choice-card"
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
            <small className="earthdawn-choice-card__meta">
              <b>Racial abilities</b>
              {entry.abilities.join(', ')}
            </small>
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
      {overridePanel}
      <div className="earthdawn-compact-allocation-grid">
        {character.talents.map((talent) => (
          <SheetCard key={talent.id} density="compact">
            <div className="earthdawn-compact-record-heading">
              <strong>{talent.name}</strong>
              <span>
                <SheetBadge tone={talent.optional ? 'accent' : 'neutral'}>
                  {talent.optional ? 'Optional' : 'Required'}
                </SheetBadge>
                <small>Circle {talent.originCircle ?? 'custom'}</small>
              </span>
            </div>
            <SheetField label="Free ranks">
              <input
                aria-label={`${talent.name} free ranks`}
                type="number"
                min="0"
                max={character.creation.enforceRules ? 3 : 15}
                value={talent.freeRank}
                onChange={(event) => {
                  const maximum = character.creation.enforceRules ? 3 : 15;
                  const rank = Math.min(
                    maximum,
                    Math.max(0, Number(event.target.value)),
                  );
                  update((current) => ({
                    ...current,
                    talents: current.talents.map((item) =>
                      item.id === talent.id
                        ? {
                            ...item,
                            freeRank: rank,
                            rank,
                          }
                        : item,
                    ),
                  }));
                }}
              />
            </SheetField>
          </SheetCard>
        ))}
      </div>
      <SheetNotice tone={talentRanks > 8 ? 'warning' : 'success'}>
        {talentRanks > 8
          ? `${talentRanks - 8} free Talent ranks over the official allocation`
          : `${8 - talentRanks} free Talent ranks remaining`}
      </SheetNotice>
      {discipline ? (
        <>
          <h3>
            Talent Options · {optionalTalentCount}/{selected?.circle ?? 1}
          </h3>
          <SheetField label="Search Talent Options">
            <input
              type="search"
              value={talentSearch}
              onChange={(event) => setTalentSearch(event.target.value)}
            />
          </SheetField>
          {(
            [
              ['novice', 1],
              ['journeyman', 5],
              ['warden', 9],
              ['master', 13],
            ] as const
          ).map(([tier, minimumCircle]) =>
            (selected?.circle ?? 1) >= minimumCircle ? (
              <SheetCard key={tier} density="compact">
                <h4>{tier[0]!.toUpperCase() + tier.slice(1)}</h4>
                <div className="earthdawn-compact-choice-grid">
                  {discipline.talentOptions[tier]
                    .filter((name) =>
                      name
                        .toLocaleLowerCase()
                        .includes(talentSearch.toLocaleLowerCase()),
                    )
                    .map((name) => {
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
                            character.creation.enforceRules &&
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
                                  entry.kind === 'talent' &&
                                  entry.name === name,
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
                                    attributeText:
                                      definition?.talentMetadata
                                        ?.attributeText ?? '',
                                    effectText:
                                      definition?.talentMetadata?.effectText ??
                                      '',
                                    actionText:
                                      definition?.talentMetadata?.actionText ??
                                      '',
                                    strainText:
                                      definition?.talentMetadata?.strainText ??
                                      '',
                                    citationText:
                                      definition?.talentMetadata
                                        ?.citationText ?? '',
                                    metadataOverrides: [],
                                    disciplineSources: [discipline.id],
                                    optional: true,
                                    originCircle: minimumCircle,
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
              </SheetCard>
            ) : null,
          )}
        </>
      ) : null}
      {discipline?.spellcaster ? (
        <SheetCard density="compact">
          <h3>Eligible Spells</h3>
          <SheetField label="Search spells">
            <input
              type="search"
              value={spellSearch}
              onChange={(event) => setSpellSearch(event.target.value)}
            />
          </SheetField>
          <div className="earthdawn-compact-choice-grid">
            {earthdawnCatalog
              .filter(
                (entry) =>
                  entry.kind === 'spell' &&
                  entry.requirements.some((requirement) =>
                    requirement.startsWith(discipline.name),
                  ) &&
                  Number(
                    entry.requirements[0]?.match(/Circle (\d+)/)?.[1] ?? 99,
                  ) <= (selected?.circle ?? 1) &&
                  entry.name
                    .toLocaleLowerCase()
                    .includes(spellSearch.toLocaleLowerCase()),
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
                      Circle{' '}
                      {spell.requirements[0]?.match(/Circle (\d+)/)?.[1] ?? 1} ·
                      p. {spell.page}
                    </small>
                  </button>
                );
              })}
          </div>
        </SheetCard>
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
      <SheetToolbar>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setSkillDialogOpen(true)}
        >
          Add Specific Skill
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => addSkill(null, 'knowledge')}
        >
          Add Custom Skill
        </button>
      </SheetToolbar>
      {character.skills.length === 0 ? (
        <SheetEmptyState>No skills selected yet.</SheetEmptyState>
      ) : null}
      <div className="earthdawn-compact-record-stack">
        {character.skills.map((skill) => (
          <SheetCard key={skill.id} density="compact">
            <SheetFieldGrid columns={4}>
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
              <SheetField label="Attribute">
                <select
                  value={skill.attribute}
                  onChange={(event) =>
                    update((current) => ({
                      ...current,
                      skills: current.skills.map((item) =>
                        item.id === skill.id
                          ? {
                              ...item,
                              attribute: event.target
                                .value as EarthdawnAttributeId,
                            }
                          : item,
                      ),
                    }))
                  }
                >
                  {Object.entries(labels).map(([id, label]) => (
                    <option value={id} key={id}>
                      {label}
                    </option>
                  ))}
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
            <SheetToolbar>
              {skill.source && skill.page ? (
                <small>
                  {skill.source}, p. {skill.page}
                </small>
              ) : (
                <SheetBadge tone="warning">Custom</SheetBadge>
              )}
              <button
                type="button"
                className="secondary-button compact-button"
                onClick={() =>
                  update((current) => ({
                    ...current,
                    skills: current.skills.filter(({ id }) => id !== skill.id),
                  }))
                }
              >
                Remove
              </button>
            </SheetToolbar>
          </SheetCard>
        ))}
      </div>
    </section>,
    <section key="equipment">
      <h2>Equipment and Wealth</h2>
      <p>
        Starting equipment is retained separately from purchases. A recorded GM
        Override is required to complete a character with a negative balance.
      </p>
      <SheetFieldGrid columns={3}>
        <SheetField label="Starting silver">
          <input
            type="number"
            value={character.wealth.startingSilver}
            onChange={(event) =>
              update((current) => ({
                ...current,
                wealth: {
                  ...current.wealth,
                  startingSilver: Number(event.target.value),
                },
              }))
            }
          />
        </SheetField>
      </SheetFieldGrid>
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
      {overridePanel}
      <SheetToolbar>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setEquipmentDialogOpen(true)}
        >
          Browse Equipment and Weapons
        </button>
      </SheetToolbar>
      {character.equipment.length === 0 && character.weapons.length === 0 ? (
        <SheetEmptyState>No purchases selected yet.</SheetEmptyState>
      ) : null}
      <div className="earthdawn-compact-record-stack">
        {character.equipment.map((item) => (
          <SheetCard key={item.id} density="compact">
            <div className="earthdawn-purchase-row">
              <div>
                <strong>{item.name}</strong>
                <small>
                  {item.type} · {item.costSilver} sp each · p.{' '}
                  {item.page ?? '—'}
                </small>
                <small>
                  Weight {item.weight} · PA {item.physicalArmor} · MA{' '}
                  {item.mysticArmor} · PD +{item.physicalDefense} · MD +
                  {item.mysticDefense} · IP {item.initiativePenalty}
                  {item.shatterThreshold
                    ? ` · Shatter ${item.shatterThreshold}`
                    : ''}
                </small>
              </div>
              <SheetField label="Quantity">
                <input
                  type="number"
                  min="1"
                  value={item.quantity}
                  onChange={(event) =>
                    update((current) => ({
                      ...current,
                      equipment: current.equipment.map((entry) =>
                        entry.id === item.id
                          ? {
                              ...entry,
                              quantity: Math.max(1, Number(event.target.value)),
                            }
                          : entry,
                      ),
                    }))
                  }
                />
              </SheetField>
              <strong>{item.costSilver * item.quantity} sp</strong>
              <button
                type="button"
                className="secondary-button compact-button"
                onClick={() =>
                  update((current) => ({
                    ...current,
                    equipment: current.equipment.filter(
                      ({ id }) => id !== item.id,
                    ),
                  }))
                }
              >
                Remove
              </button>
            </div>
          </SheetCard>
        ))}
        {character.weapons.map((item) => {
          const definition = earthdawnCatalog.find(
            ({ id }) => id === item.definitionId,
          );
          const mechanics = definition ? parseMechanics(definition) : {};
          return (
            <SheetCard key={item.id} density="compact">
              <div className="earthdawn-purchase-row">
                <div>
                  <strong>{item.name}</strong>
                  <small>
                    Weapon · {item.costSilver} sp each · p. {item.page ?? '—'}
                  </small>
                  <small>
                    Damage {item.damageStep} · STR {item.strengthMinimum} · Size{' '}
                    {numericMechanic(mechanics, 'size')} · Range{' '}
                    {item.range || 'melee'} · Weight{' '}
                    {numericMechanic(mechanics, 'weight')}
                  </small>
                </div>
                <SheetField label="Quantity">
                  <input
                    type="number"
                    min="1"
                    value={item.quantity}
                    onChange={(event) =>
                      update((current) => ({
                        ...current,
                        weapons: current.weapons.map((entry) =>
                          entry.id === item.id
                            ? {
                                ...entry,
                                quantity: Math.max(
                                  1,
                                  Number(event.target.value),
                                ),
                              }
                            : entry,
                        ),
                      }))
                    }
                  />
                </SheetField>
                <strong>{item.costSilver * item.quantity} sp</strong>
                <button
                  type="button"
                  className="secondary-button compact-button"
                  onClick={() =>
                    update((current) => ({
                      ...current,
                      weapons: current.weapons.filter(
                        ({ id }) => id !== item.id,
                      ),
                    }))
                  }
                >
                  Remove
                </button>
              </div>
            </SheetCard>
          );
        })}
      </div>
      {equipmentSpent > character.wealth.startingSilver ? (
        <SheetNotice tone="warning">
          Starting funds are negative. Enable GM Override to complete this
          character while overspent.
        </SheetNotice>
      ) : null}
    </section>,
    <section key="identity">
      <h2>Identity and Complete Character</h2>
      <p>
        Every field is optional. Complete Character transfers everything entered
        here to the normal sheet and opens it in Play mode.
      </p>
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
      <h3>Creation Summary</h3>
      <div className="sheet-stat-grid earthdawn-derived-grid">
        <span>
          Path <strong>{character.creation.profile}</strong>
        </span>
        <span>
          Discipline <strong>{selected?.name || 'Not selected'}</strong>
        </span>
        <span>
          Race <strong>{race?.name || 'Not selected'}</strong>
        </span>
        <span>
          Talent ranks <strong>{talentRanks} / 8</strong>
        </span>
        <span>
          Selected Skills <strong>{character.skills.length}</strong>
        </span>
        <span>
          Wealth balance{' '}
          <strong>{character.wealth.startingSilver - equipmentSpent} sp</strong>
        </span>
      </div>
      {violations.length ? (
        <SheetNotice tone={overrideActive ? 'warning' : 'danger'}>
          <strong>Official-rule violations:</strong> {violations.join(' ')}
          {overrideActive ? ' GM Override permits completion.' : ''}
        </SheetNotice>
      ) : (
        <SheetNotice tone="success">
          No official allocation limits are exceeded.
        </SheetNotice>
      )}
      {advisories.length ? (
        <SheetNotice tone="info">
          <strong>Optional items left open:</strong> {advisories.join(' ')}
        </SheetNotice>
      ) : null}
      {overrideActive ? (
        <SheetNotice tone="warning">
          GM Override active: {globalOverride?.reason}
        </SheetNotice>
      ) : null}
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
          disabled={step === 7 && completionBlocked}
          onClick={() =>
            step === 7
              ? finalize()
              : patchCreation({ currentStep: Math.min(7, step + 1) })
          }
        >
          {step === 7 ? 'Complete Character' : 'Next'}
        </button>
      </div>
      {skillDialogOpen ? (
        <CreatorDialog
          title="Add Specific Skill"
          onClose={() => setSkillDialogOpen(false)}
        >
          <SheetToolbar className="earthdawn-dialog-filters">
            {(Object.keys(skillCategoryLabels) as SkillCategory[]).map(
              (category) => (
                <button
                  type="button"
                  className="secondary-button"
                  aria-pressed={skillCategory === category}
                  onClick={() => setSkillCategory(category)}
                  key={category}
                >
                  {skillCategoryLabels[category]}
                </button>
              ),
            )}
          </SheetToolbar>
          <SheetField
            label={`Search ${skillCategoryLabels[skillCategory]} skills`}
          >
            <input
              type="search"
              value={skillSearch}
              onChange={(event) => setSkillSearch(event.target.value)}
            />
          </SheetField>
          <button
            type="button"
            className="secondary-button"
            onClick={() => addSkill(null, skillCategory)}
          >
            Add Custom {skillCategoryLabels[skillCategory]} Skill
          </button>
          <div className="earthdawn-dialog-results">
            {skillDefinitions.map((definition) => {
              const chosen = character.skills.some(
                ({ definitionId }) => definitionId === definition.id,
              );
              return (
                <SheetCard key={definition.id} density="compact">
                  <div>
                    <strong>{definition.name}</strong>
                    <small>{definition.summary}</small>
                    <small>
                      {labels[definition.defaultAttribute ?? 'perception']} ·{' '}
                      {definition.source}, p. {definition.page}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="secondary-button compact-button"
                    disabled={chosen}
                    onClick={() => addSkill(definition, skillCategory)}
                  >
                    {chosen ? 'Added' : 'Add'}
                  </button>
                </SheetCard>
              );
            })}
          </div>
        </CreatorDialog>
      ) : null}
      {equipmentDialogOpen ? (
        <CreatorDialog
          title="Browse Equipment and Weapons"
          onClose={() => setEquipmentDialogOpen(false)}
        >
          <SheetToolbar className="earthdawn-dialog-filters">
            {(
              [
                ['equipment', 'Equipment'],
                ['weapon', 'Weapons'],
                ['armor', 'Armor'],
                ['shield', 'Shields'],
              ] as const
            ).map(([category, label]) => (
              <button
                type="button"
                className="secondary-button"
                aria-pressed={equipmentFilter === category}
                onClick={() => setEquipmentFilter(category)}
                key={category}
              >
                {label}
              </button>
            ))}
          </SheetToolbar>
          <SheetField label="Search equipment">
            <input
              type="search"
              value={equipmentSearch}
              onChange={(event) => setEquipmentSearch(event.target.value)}
            />
          </SheetField>
          <div className="earthdawn-dialog-results">
            {equipmentDefinitions.map((definition) => {
              const mechanics = parseMechanics(definition);
              const category = equipmentCategory(definition);
              return (
                <SheetCard key={definition.id} density="compact">
                  <div>
                    <strong>{definition.name}</strong>
                    <small>
                      {definition.costSilver ?? 0} sp · Weight{' '}
                      {numericMechanic(mechanics, 'weight')} · p.{' '}
                      {definition.page}
                    </small>
                    <small>
                      {category === 'weapon'
                        ? `Damage ${numericMechanic(mechanics, 'damageStep')} · STR ${numericMechanic(mechanics, 'strengthMinimum')} · Size ${numericMechanic(mechanics, 'size')} · Range ${String(mechanics.range || 'melee')}`
                        : category === 'armor'
                          ? `PA ${numericMechanic(mechanics, 'physicalArmor')} · MA ${numericMechanic(mechanics, 'mysticArmor')} · IP ${numericMechanic(mechanics, 'initiativePenalty')}`
                          : category === 'shield'
                            ? `PD +${numericMechanic(mechanics, 'physicalDefense')} · MD +${numericMechanic(mechanics, 'mysticDefense')} · IP ${numericMechanic(mechanics, 'initiativePenalty')} · Shatter ${numericMechanic(mechanics, 'shatterThreshold')}`
                            : definition.summary}
                    </small>
                  </div>
                  <button
                    type="button"
                    className="secondary-button compact-button"
                    onClick={() => addEquipment(definition)}
                  >
                    Add
                  </button>
                </SheetCard>
              );
            })}
          </div>
        </CreatorDialog>
      ) : null}
    </section>
  );
}
