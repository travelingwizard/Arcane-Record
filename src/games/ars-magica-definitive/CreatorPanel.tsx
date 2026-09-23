import {
  SheetCard,
  SheetField,
  SheetFieldGrid,
  SheetNotice,
  SheetToolbar,
} from '../../components/layout/SheetPrimitives';
import {
  artIdForCode,
  houseCatalog,
  spellCatalog,
  virtueFlawCatalog,
} from './catalog';
import {
  creationBudgets,
  characteristicCost,
  houseBenefit,
  startingSpellLimit,
} from './creation-rules';
import { scoreFromExperience } from './experience';
import { canFinalize, validateCharacter } from './validation';
import { isCharacterCreationCertified } from './certification';
import type { ArsCharacter } from './schema';

const stages = [
  'Role & concept',
  'Identity & House',
  'Characteristics',
  'Virtues & Flaws',
  'Childhood & later life',
  'Apprenticeship',
  'Arts, Abilities & spells',
  'Personality & Covenant',
  'Older character',
  'Review',
];
export function CreatorPanel({
  character,
  onChange,
}: {
  character: ArsCharacter;
  onChange: (c: ArsCharacter) => void;
}) {
  const certified = isCharacterCreationCertified();
  const c = character.definition;
  const issues = validateCharacter(character);
  const budgets = creationBudgets(c.role, c.age, c.apprenticeshipAge);
  const cost = Object.values(c.characteristics).reduce(
    (n, x) => n + characteristicCost(x),
    0,
  );
  const step = Math.min(10, Math.max(1, character.creation.step || 1));
  const setDefinition = (patch: Partial<typeof c>) =>
    onChange({
      ...character,
      name: patch.name ?? character.name,
      definition: { ...c, ...patch },
    });
  const finalizable = canFinalize(character);
  const allocations = character.creation.experienceAllocations;
  const allocationTotal = (phase: (typeof allocations)[number]['phase']) =>
    allocations
      .filter((allocation) => allocation.phase === phase)
      .reduce((sum, allocation) => sum + allocation.experience, 0);
  const addExperience = (
    phase: (typeof allocations)[number]['phase'],
    traitId: string,
    experience: number,
    year: number | null = null,
  ) => {
    if (!Number.isSafeInteger(experience) || experience <= 0) return;
    const trait = c.traits.find((entry) => entry.id === traitId);
    if (!trait) return;
    onChange({
      ...character,
      definition: {
        ...c,
        traits: c.traits.map((entry) =>
          entry.id === traitId
            ? { ...entry, experience: entry.experience + experience }
            : entry,
        ),
      },
      creation: {
        ...character.creation,
        experienceAllocations: [
          ...allocations,
          { id: crypto.randomUUID(), phase, traitId, experience, year },
        ],
      },
    });
  };
  const removeExperience = (allocationId: string) => {
    const allocation = allocations.find((entry) => entry.id === allocationId);
    if (!allocation) return;
    onChange({
      ...character,
      definition: {
        ...c,
        traits: c.traits.map((entry) =>
          entry.id === allocation.traitId
            ? {
                ...entry,
                experience: Math.max(
                  0,
                  entry.experience - allocation.experience,
                ),
              }
            : entry,
        ),
      },
      creation: {
        ...character.creation,
        experienceAllocations: allocations.filter(
          (entry) => entry.id !== allocationId,
        ),
      },
    });
  };
  return (
    <>
      <SheetNotice tone={certified ? 'info' : 'warning'}>
        {certified
          ? 'Creation is checked against the certified source inventory.'
          : 'Source certification is incomplete. Drafts remain editable, but finalization is blocked.'}
      </SheetNotice>
      <nav aria-label="Creation stages">
        <ol>
          {stages.map((name, index) => (
            <li key={name}>
              <button
                className={
                  index + 1 === step ? 'primary-button' : 'secondary-button'
                }
                onClick={() =>
                  onChange({
                    ...character,
                    creation: { ...character.creation, step: index + 1 },
                  })
                }
              >
                {index + 1}. {name}
              </button>
            </li>
          ))}
        </ol>
      </nav>
      <SheetCard>
        <h3>{stages[step - 1]}</h3>
        {step === 1 && (
          <SheetFieldGrid columns={3}>
            <SheetField label="Role">
              <input value={c.role} readOnly />
            </SheetField>
            <SheetField label="Concept">
              <input
                value={c.concept}
                onChange={(e) => setDefinition({ concept: e.target.value })}
              />
            </SheetField>
            <SheetField label="Saga">
              <input
                value={c.saga}
                onChange={(e) => setDefinition({ saga: e.target.value })}
              />
            </SheetField>
            {c.role === 'companion' && (
              <SheetField label="Wealth rate">
                <select
                  value={character.creation.wealth}
                  onChange={(event) =>
                    onChange({
                      ...character,
                      creation: {
                        ...character.creation,
                        wealth: event.target
                          .value as typeof character.creation.wealth,
                      },
                    })
                  }
                >
                  <option value="normal">Normal (15 XP/year)</option>
                  <option value="wealthy">Wealthy (20 XP/year)</option>
                  <option value="poor">Poor (10 XP/year)</option>
                </select>
              </SheetField>
            )}
          </SheetFieldGrid>
        )}
        {step === 2 && (
          <>
            <SheetFieldGrid columns={3}>
              <SheetField label="Name">
                <input
                  value={c.name}
                  onChange={(e) => setDefinition({ name: e.target.value })}
                />
              </SheetField>
              <SheetField label="Player">
                <input
                  value={c.player}
                  onChange={(e) => setDefinition({ player: e.target.value })}
                />
              </SheetField>
              <SheetField label="Social Status">
                <input
                  value={c.socialStatus}
                  onChange={(event) =>
                    setDefinition({ socialStatus: event.target.value })
                  }
                />
              </SheetField>
              {c.role === 'magus' && (
                <SheetField label="House">
                  <select
                    value={c.houseId ?? ''}
                    onChange={(e) =>
                      setDefinition({ houseId: e.target.value || null })
                    }
                  >
                    <option value="">Choose House</option>
                    {houseCatalog.map((h) => (
                      <option key={h.id} value={h.id}>
                        {h.name}
                      </option>
                    ))}
                  </select>
                </SheetField>
              )}
            </SheetFieldGrid>
            {c.role === 'magus' && c.houseId && (
              <SheetNotice tone="info">
                House benefit:{' '}
                {houseBenefit(c.houseId).required.join(', ') ||
                  houseBenefit(c.houseId).choice}
                . Add the resulting Virtues, Flaws, or Ability score in the next
                stages.
              </SheetNotice>
            )}
          </>
        )}
        {step === 3 && (
          <>
            <p>Spent {cost} of 7 Characteristic points.</p>
            <SheetFieldGrid columns={4}>
              {Object.entries(c.characteristics).map(([key, value]) => (
                <SheetField key={key} label={key}>
                  <input
                    type="number"
                    min={-3}
                    max={3}
                    value={value}
                    onChange={(e) => {
                      const value = e.target.valueAsNumber;
                      if (Number.isInteger(value) && value >= -3 && value <= 3)
                        setDefinition({
                          characteristics: {
                            ...c.characteristics,
                            [key]: value,
                          },
                        });
                    }}
                  />
                </SheetField>
              ))}
            </SheetFieldGrid>
          </>
        )}
        {step === 4 && (
          <VirtueFlawCreator character={character} onChange={onChange} />
        )}
        {step === 5 && (
          <>
            <p>
              Native language: {budgets.nativeLanguage} XP. Childhood:{' '}
              {budgets.childhood} XP. Later life: {budgets.laterLife} XP.
            </p>
            <SheetFieldGrid columns={2}>
              <SheetField label="Age">
                <input
                  type="number"
                  min={6}
                  value={c.age}
                  onChange={(e) =>
                    Number.isInteger(e.target.valueAsNumber) &&
                    setDefinition({ age: e.target.valueAsNumber })
                  }
                />
              </SheetField>
              {c.role === 'magus' && (
                <SheetField label="Apprenticeship began">
                  <input
                    type="number"
                    min={5}
                    value={c.apprenticeshipAge}
                    onChange={(e) =>
                      Number.isInteger(e.target.valueAsNumber) &&
                      setDefinition({
                        apprenticeshipAge: e.target.valueAsNumber,
                      })
                    }
                  />
                </SheetField>
              )}
            </SheetFieldGrid>
            <AllocationEditor
              title="Native language"
              phase="native-language"
              budget={budgets.nativeLanguage}
              spent={allocationTotal('native-language')}
              traits={c.traits.filter(
                (trait) => trait.definitionId === 'ars.ability.living-language',
              )}
              allocations={allocations}
              onAdd={addExperience}
              onRemove={removeExperience}
            />
            <AllocationEditor
              title="Early childhood"
              phase="childhood"
              budget={budgets.childhood}
              spent={allocationTotal('childhood')}
              traits={c.traits.filter(
                (trait) =>
                  trait.definitionId &&
                  [
                    'ars.ability.area-lore',
                    'ars.ability.athletics',
                    'ars.ability.awareness',
                    'ars.ability.brawl',
                    'ars.ability.charm',
                    'ars.ability.folk-ken',
                    'ars.ability.guile',
                    'ars.ability.living-language',
                    'ars.ability.stealth',
                    'ars.ability.survival',
                    'ars.ability.swim',
                  ].includes(trait.definitionId),
              )}
              allocations={allocations}
              onAdd={addExperience}
              onRemove={removeExperience}
            />
            <AllocationEditor
              title="Later life"
              phase="later-life"
              budget={budgets.laterLife}
              spent={allocationTotal('later-life')}
              traits={c.traits.filter((trait) => trait.scale === 'ability')}
              allocations={allocations}
              onAdd={addExperience}
              onRemove={removeExperience}
            />
          </>
        )}
        {step === 6 && (
          <>
            <p>
              {c.role === 'magus'
                ? `Apprenticeship provides ${budgets.apprenticeship} XP and ${budgets.spellLevels} spell levels. Mandatory minimums are checked on Review.`
                : 'This role does not receive Hermetic apprenticeship allocations.'}
            </p>
            {c.role === 'magus' && (
              <AllocationEditor
                title="Apprenticeship experience"
                phase="apprenticeship"
                budget={budgets.apprenticeship}
                spent={allocationTotal('apprenticeship')}
                traits={c.traits}
                allocations={allocations}
                onAdd={addExperience}
                onRemove={removeExperience}
              />
            )}
          </>
        )}
        {step === 7 && (
          <>
            <SpecialtyEditor character={character} onChange={onChange} />
            {c.role === 'magus' ? (
              <SpellCreator character={character} onChange={onChange} />
            ) : (
              <SheetNotice tone="info">
                Companions and Grogs do not receive Hermetic Arts or starting
                spells without a specific Storyguide-approved supernatural
                framework.
              </SheetNotice>
            )}
          </>
        )}
        {step === 8 && (
          <>
            <SheetFieldGrid columns={3}>
              <SheetField label="Appearance">
                <textarea
                  value={c.appearance}
                  onChange={(event) =>
                    setDefinition({ appearance: event.target.value })
                  }
                />
              </SheetField>
              <SheetField label="Title or profession">
                <input
                  value={c.titleProfession}
                  onChange={(event) =>
                    setDefinition({ titleProfession: event.target.value })
                  }
                />
              </SheetField>
              <SheetField label="Place of origin">
                <input
                  value={c.placeOfOrigin}
                  onChange={(event) =>
                    setDefinition({ placeOfOrigin: event.target.value })
                  }
                />
              </SheetField>
              <SheetField label="Nationality">
                <input
                  value={c.nationality}
                  onChange={(event) =>
                    setDefinition({ nationality: event.target.value })
                  }
                />
              </SheetField>
              <SheetField label="Religion">
                <input
                  value={c.religion}
                  onChange={(event) =>
                    setDefinition({ religion: event.target.value })
                  }
                />
              </SheetField>
              {c.role === 'magus' && (
                <>
                  <SheetField label="Parens">
                    <input
                      value={c.hermeticIdentity.parens}
                      onChange={(event) =>
                        setDefinition({
                          hermeticIdentity: {
                            ...c.hermeticIdentity,
                            parens: event.target.value,
                          },
                        })
                      }
                    />
                  </SheetField>
                  <SheetField label="Apprenticeship Covenant">
                    <input
                      value={c.hermeticIdentity.apprenticeshipCovenant}
                      onChange={(event) =>
                        setDefinition({
                          hermeticIdentity: {
                            ...c.hermeticIdentity,
                            apprenticeshipCovenant: event.target.value,
                          },
                        })
                      }
                    />
                  </SheetField>
                  <SheetField label="Wizard's sigil">
                    <input
                      value={c.hermeticIdentity.wizardsSigil}
                      onChange={(event) =>
                        setDefinition({
                          hermeticIdentity: {
                            ...c.hermeticIdentity,
                            wizardsSigil: event.target.value,
                          },
                        })
                      }
                    />
                  </SheetField>
                </>
              )}
            </SheetFieldGrid>
            <SheetNotice tone="info">
              Personality Traits, reputations, possessions, and the current
              Covenant link remain editable in their structured sheet panels.
            </SheetNotice>
          </>
        )}
        {step === 9 && (
          <>
            <p>
              {c.role === 'magus'
                ? `${budgets.postApprenticeshipYears} post-apprenticeship years are currently requested. Each must receive a reviewed annual study/laboratory record before finalization.`
                : 'Older non-magi use later-life experience and applicable aging records.'}
            </p>
            {c.role === 'magus' &&
              Array.from(
                { length: budgets.postApprenticeshipYears },
                (_, index) => c.apprenticeshipAge + 15 + index,
              ).map((year) => (
                <OlderYearEditor
                  key={year}
                  year={year}
                  character={character}
                  onChange={onChange}
                />
              ))}
          </>
        )}
        {step === 10 && (
          <>
            <ul>
              {issues.map((i) => (
                <li key={i.id}>
                  {i.kind === 'error' ? 'Required' : 'Guidance'}: {i.message} (
                  {i.citation})
                  {i.kind === 'error' && (
                    <ApprovalEditor
                      issueId={i.id}
                      character={character}
                      onChange={onChange}
                    />
                  )}
                </li>
              ))}
            </ul>
            {!issues.length && <p>No character validation issues remain.</p>}
            <SheetToolbar>
              <button
                className="primary-button"
                disabled={!finalizable}
                onClick={() =>
                  onChange({
                    ...character,
                    mode: 'play',
                    creation: {
                      ...character.creation,
                      status: 'complete',
                      baseline: structuredClone(character.definition),
                      draft: null,
                      finalizedAt: new Date().toISOString(),
                    },
                  })
                }
              >
                Finalize character
              </button>
            </SheetToolbar>
          </>
        )}
      </SheetCard>
      <SheetToolbar>
        <button
          className="secondary-button"
          disabled={step === 1}
          onClick={() =>
            onChange({
              ...character,
              creation: { ...character.creation, step: step - 1 },
            })
          }
        >
          Previous
        </button>
        <button
          className="secondary-button"
          disabled={step === 10}
          onClick={() =>
            onChange({
              ...character,
              creation: { ...character.creation, step: step + 1 },
            })
          }
        >
          Next
        </button>
      </SheetToolbar>
    </>
  );
}

function ApprovalEditor({
  issueId,
  character,
  onChange,
}: {
  issueId: string;
  character: ArsCharacter;
  onChange: (character: ArsCharacter) => void;
}) {
  const [reason, setReason] = useState('');
  const [approvedBy, setApprovedBy] = useState('');
  return (
    <SheetCard density="compact">
      <SheetFieldGrid columns={2}>
        <SheetField label="Storyguide-approved reason">
          <input
            value={reason}
            onChange={(event) => setReason(event.target.value)}
          />
        </SheetField>
        <SheetField label="Approved by">
          <input
            value={approvedBy}
            onChange={(event) => setApprovedBy(event.target.value)}
          />
        </SheetField>
      </SheetFieldGrid>
      <button
        className="secondary-button"
        disabled={!reason.trim() || !approvedBy.trim()}
        onClick={() =>
          onChange({
            ...character,
            creation: {
              ...character.creation,
              approvals: [
                ...character.creation.approvals.filter(
                  (approval) => approval.ruleId !== issueId,
                ),
                {
                  id: crypto.randomUUID(),
                  ruleId: issueId,
                  reason: reason.trim(),
                  approvedBy: approvedBy.trim(),
                  at: new Date().toISOString(),
                },
              ],
            },
          })
        }
      >
        Record Storyguide approval
      </button>
    </SheetCard>
  );
}

type Allocation = ArsCharacter['creation']['experienceAllocations'][number];
type Trait = ArsCharacter['definition']['traits'][number];

function AllocationEditor({
  title,
  phase,
  budget,
  spent,
  traits,
  allocations,
  onAdd,
  onRemove,
}: {
  title: string;
  phase: Allocation['phase'];
  budget: number;
  spent: number;
  traits: Trait[];
  allocations: Allocation[];
  onAdd: (phase: Allocation['phase'], traitId: string, xp: number) => void;
  onRemove: (id: string) => void;
}) {
  const [traitId, setTraitId] = useState(traits[0]?.id ?? '');
  const [experience, setExperience] = useState(1);
  const phaseRows = allocations.filter((entry) => entry.phase === phase);
  return (
    <SheetCard density="compact">
      <h4>{title}</h4>
      <p>
        {spent} / {budget} experience allocated.
      </p>
      <SheetFieldGrid columns={3}>
        <SheetField label="Ability or Art">
          <select
            value={traitId}
            onChange={(event) => setTraitId(event.target.value)}
          >
            <option value="">Choose a Trait</option>
            {traits.map((trait) => (
              <option key={trait.id} value={trait.id}>
                {trait.name} (score{' '}
                {scoreFromExperience(trait.experience, trait.scale)})
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Experience">
          <input
            type="number"
            min={1}
            max={Math.max(1, budget - spent)}
            value={experience}
            onChange={(event) => setExperience(event.target.valueAsNumber)}
          />
        </SheetField>
        <button
          className="secondary-button"
          disabled={!traitId || experience < 1 || spent + experience > budget}
          onClick={() => onAdd(phase, traitId, experience)}
        >
          Allocate experience
        </button>
      </SheetFieldGrid>
      {phaseRows.map((allocation) => {
        const trait = traits.find((entry) => entry.id === allocation.traitId);
        return (
          <SheetToolbar key={allocation.id}>
            <span>
              {trait?.name ?? 'Unresolved Trait'}: {allocation.experience} XP
            </span>
            <button
              className="secondary-button"
              onClick={() => onRemove(allocation.id)}
            >
              Undo allocation
            </button>
          </SheetToolbar>
        );
      })}
    </SheetCard>
  );
}

function VirtueFlawCreator({
  character,
  onChange,
}: {
  character: ArsCharacter;
  onChange: (character: ArsCharacter) => void;
}) {
  const [name, setName] = useState('');
  const [definitionId, setDefinitionId] = useState('');
  const [kind, setKind] = useState<'virtue' | 'flaw'>('virtue');
  const [points, setPoints] = useState(1);
  const [choice, setChoice] = useState('');
  const [houseGrant, setHouseGrant] = useState(false);
  const [showUnavailable, setShowUnavailable] = useState(false);
  const entries = character.definition.virtuesFlaws;
  const hasGift = entries.some(
    (entry) => entry.name.toLowerCase() === 'the gift',
  );
  const unavailableReason = (entry: (typeof virtueFlawCatalog)[number]) => {
    if (character.definition.role === 'grog')
      if (
        entry.points > 1 ||
        entry.category === 'story' ||
        entry.category === 'hermetic' ||
        entry.category === 'mythic-companion' ||
        entry.name === 'The Gift'
      )
        return 'Standard Grogs take only eligible Minor options.';
    if (
      character.definition.role === 'companion' &&
      entry.category === 'hermetic' &&
      !hasGift
    )
      return 'Hermetic options require the Gift or a specific framework.';
    if (
      character.definition.role === 'magus' &&
      entry.category === 'mythic-companion'
    )
      return 'Mythic Companion options do not combine with standard Magus creation.';
    return null;
  };
  const available = virtueFlawCatalog.filter(
    (entry) =>
      !entries.some((selected) => selected.definitionId === entry.id) &&
      (showUnavailable || !unavailableReason(entry)),
  );
  const selectedDefinition = available.find(
    (entry) => entry.id === definitionId,
  );
  const total = (target: 'virtue' | 'flaw') =>
    entries
      .filter((entry) => entry.kind === target)
      .reduce((sum, entry) => sum + entry.points, 0);
  return (
    <>
      <p>
        Virtues {total('virtue')} points; Flaws {total('flaw')} points. Major
        entries cost 3 and Minor entries cost 1. The Gift, required Social
        Status, and House package must be recorded explicitly.
      </p>
      <label className="sheet-field">
        <span>Show unavailable options</span>
        <input
          type="checkbox"
          checked={showUnavailable}
          onChange={(event) => setShowUnavailable(event.target.checked)}
        />
      </label>
      <SheetFieldGrid columns={3}>
        <SheetField label="Published option">
          <select
            value={definitionId}
            onChange={(event) => {
              const id = event.target.value;
              setDefinitionId(id);
              const option = virtueFlawCatalog.find((entry) => entry.id === id);
              if (option) {
                setName(option.name);
                setKind(option.kind);
                setPoints(option.points);
              }
            }}
          >
            <option value="">Custom entry</option>
            {available.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name} - {entry.category}, {entry.magnitude}
                {unavailableReason(entry)
                  ? ` — unavailable: ${unavailableReason(entry)}`
                  : ''}
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Virtue or Flaw">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            readOnly={Boolean(selectedDefinition)}
          />
        </SheetField>
        <SheetField label="Kind">
          <select
            value={kind}
            onChange={(event) => setKind(event.target.value as typeof kind)}
            disabled={Boolean(selectedDefinition)}
          >
            <option value="virtue">Virtue</option>
            <option value="flaw">Flaw</option>
          </select>
        </SheetField>
        <SheetField label="Magnitude">
          <select
            value={points}
            onChange={(event) => setPoints(Number(event.target.value))}
            disabled={
              Boolean(selectedDefinition) &&
              selectedDefinition?.magnitude !== 'variable' &&
              !houseGrant
            }
          >
            <option value={0}>Free (0)</option>
            <option value={1}>Minor (1)</option>
            <option value={3}>Major (3)</option>
          </select>
        </SheetField>
        <SheetField label="Required choice or specialty">
          <input
            value={choice}
            onChange={(event) => setChoice(event.target.value)}
          />
        </SheetField>
        {character.definition.role === 'magus' && (
          <label className="sheet-field">
            <span>House benefit</span>
            <input
              type="checkbox"
              checked={houseGrant}
              onChange={(event) => setHouseGrant(event.target.checked)}
            />
          </label>
        )}
      </SheetFieldGrid>
      <button
        className="secondary-button"
        disabled={!name.trim()}
        onClick={() => {
          onChange({
            ...character,
            definition: {
              ...character.definition,
              virtuesFlaws: [
                ...entries,
                {
                  id: crypto.randomUUID(),
                  definitionId: selectedDefinition?.id ?? null,
                  name: name.trim(),
                  status: selectedDefinition ? 'verified' : 'custom',
                  citation: selectedDefinition
                    ? {
                        sourceId: selectedDefinition.sourceId,
                        book: 'Ars Magica Definitive Edition',
                        printedPage: selectedDefinition.printedPage,
                        pdfPage: selectedDefinition.pdfPage,
                      }
                    : null,
                  notes: '',
                  kind,
                  points: houseGrant ? 0 : points,
                  choice: choice.trim(),
                },
              ],
            },
          });
          setName('');
          setDefinitionId('');
          setChoice('');
          setHouseGrant(false);
        }}
      >
        Add entry
      </button>
      {entries.map((entry) => (
        <SheetToolbar key={entry.id}>
          <span>
            {entry.name} - {entry.kind},{' '}
            {entry.points === 3 ? 'Major' : 'Minor'}
          </span>
          <button
            className="secondary-button"
            onClick={() =>
              onChange({
                ...character,
                definition: {
                  ...character.definition,
                  virtuesFlaws: entries.filter((item) => item.id !== entry.id),
                },
              })
            }
          >
            Remove
          </button>
        </SheetToolbar>
      ))}
    </>
  );
}

function SpecialtyEditor({
  character,
  onChange,
}: {
  character: ArsCharacter;
  onChange: (character: ArsCharacter) => void;
}) {
  const usedAbilities = character.definition.traits.filter(
    (trait) => trait.scale === 'ability' && trait.experience > 0,
  );
  return (
    <SheetCard density="compact">
      <h4>Ability specialties</h4>
      <p>Every Ability with experience needs a recorded specialty.</p>
      <SheetFieldGrid columns={3}>
        {usedAbilities.map((trait) => (
          <SheetField key={trait.id} label={trait.name}>
            <input
              value={trait.specialty}
              onChange={(event) =>
                onChange({
                  ...character,
                  definition: {
                    ...character.definition,
                    traits: character.definition.traits.map((entry) =>
                      entry.id === trait.id
                        ? { ...entry, specialty: event.target.value }
                        : entry,
                    ),
                  },
                })
              }
            />
          </SheetField>
        ))}
      </SheetFieldGrid>
      {!usedAbilities.length && <p>No trained Abilities yet.</p>}
    </SheetCard>
  );
}

function SpellCreator({
  character,
  onChange,
}: {
  character: ArsCharacter;
  onChange: (character: ArsCharacter) => void;
}) {
  const [definitionId, setDefinitionId] = useState('');
  const known = character.definition.spells;
  const spent = character.creation.spellAllocations
    .filter((entry) => entry.phase === 'apprenticeship')
    .reduce((sum, entry) => sum + entry.levels, 0);
  const selected = spellCatalog.find((spell) => spell.id === definitionId);
  const artScore = (id: string) =>
    scoreFromExperience(
      character.definition.traits.find((trait) => trait.definitionId === id)
        ?.experience ?? 0,
      'art',
    );
  const abilityScore = (id: string) =>
    scoreFromExperience(
      character.definition.traits.find((trait) => trait.definitionId === id)
        ?.experience ?? 0,
      'ability',
    );
  const limit = selected
    ? startingSpellLimit({
        technique: artScore(artIdForCode(selected.technique)),
        form: artScore(artIdForCode(selected.form)),
        intelligence: character.definition.characteristics.intelligence,
        magicTheory: abilityScore('ars.ability.magic-theory'),
      })
    : 0;
  return (
    <>
      <p>
        Starting spell levels: {spent} / 120. The current selected-spell
        learning limit is {limit}. Add any known requisites on the normal sheet
        and review their effect before finalization.
      </p>
      <SheetField label="Verified core spell">
        <select
          value={definitionId}
          onChange={(event) => setDefinitionId(event.target.value)}
        >
          <option value="">Choose a spell</option>
          {spellCatalog
            .filter(
              (spell) =>
                spell.verification === 'verified' &&
                !known.some((entry) => entry.definitionId === spell.id),
            )
            .map((spell) => (
              <option key={spell.id} value={spell.id}>
                {spell.name} ({spell.technique}
                {spell.form} {spell.general ? 'General' : spell.level})
              </option>
            ))}
        </select>
      </SheetField>
      <button
        className="secondary-button"
        disabled={
          !selected ||
          selected.general ||
          selected.level === null ||
          selected.level > limit ||
          spent + selected.level > 120
        }
        onClick={() => {
          if (!selected || selected.level === null) return;
          const spellId = crypto.randomUUID();
          onChange({
            ...character,
            definition: {
              ...character.definition,
              spells: [
                ...known,
                {
                  id: spellId,
                  definitionId: selected.id,
                  name: selected.name,
                  status: 'verified',
                  citation: {
                    sourceId: selected.sourceId,
                    book: 'Ars Magica Definitive Edition',
                    printedPage: selected.printedPage,
                    pdfPage: selected.pdfPage,
                  },
                  notes: '',
                  techniqueId: artIdForCode(selected.technique),
                  formId: artIdForCode(selected.form),
                  level: selected.level,
                  castingBonus: 0,
                  range: '',
                  duration: '',
                  target: '',
                  masteryExperience: 0,
                  masteryOptions: [],
                  requisiteIds: [],
                },
              ],
            },
            creation: {
              ...character.creation,
              spellAllocations: [
                ...character.creation.spellAllocations,
                {
                  id: crypto.randomUUID(),
                  spellId,
                  phase: 'apprenticeship',
                  levels: selected.level,
                  year: null,
                },
              ],
            },
          });
          setDefinitionId('');
        }}
      >
        Learn starting spell
      </button>
      {known.map((spell) => (
        <SheetToolbar key={spell.id}>
          <span>
            {spell.name} ({spell.level})
          </span>
          <button
            className="secondary-button"
            onClick={() =>
              onChange({
                ...character,
                definition: {
                  ...character.definition,
                  spells: known.filter((entry) => entry.id !== spell.id),
                },
                creation: {
                  ...character.creation,
                  spellAllocations: character.creation.spellAllocations.filter(
                    (entry) => entry.spellId !== spell.id,
                  ),
                },
              })
            }
          >
            Remove
          </button>
        </SheetToolbar>
      ))}
    </>
  );
}

function OlderYearEditor({
  year,
  character,
  onChange,
}: {
  year: number;
  character: ArsCharacter;
  onChange: (character: ArsCharacter) => void;
}) {
  const [traitId, setTraitId] = useState(
    character.definition.traits[0]?.id ?? '',
  );
  const [experience, setExperience] = useState(1);
  const [spellDefinitionId, setSpellDefinitionId] = useState('');
  const yearAllocations = character.creation.experienceAllocations.filter(
    (entry) => entry.phase === 'post-apprenticeship' && entry.year === year,
  );
  const studyPointsSpent = yearAllocations.reduce(
    (sum, entry) => sum + entry.experience,
    0,
  );
  const spellLevelsSpent = character.creation.spellAllocations
    .filter(
      (entry) => entry.phase === 'post-apprenticeship' && entry.year === year,
    )
    .reduce((sum, entry) => sum + entry.levels, 0);
  const selectedSpell = spellCatalog.find(
    (spell) => spell.id === spellDefinitionId,
  );
  const record = character.creation.allocations.postApprenticeshipYears.find(
    (entry) => entry.year === year,
  ) ?? {
    year,
    studyPointsSpent,
    spellLevelsSpent,
    laboratorySeasons: 0,
    agingResolved: year < 35,
  };
  const setRecord = (patch: Partial<typeof record>) =>
    onChange({
      ...character,
      creation: {
        ...character.creation,
        allocations: {
          ...character.creation.allocations,
          postApprenticeshipYears: [
            ...character.creation.allocations.postApprenticeshipYears.filter(
              (entry) => entry.year !== year,
            ),
            { ...record, ...patch },
          ].sort((a, b) => a.year - b.year),
        },
      },
    });
  return (
    <SheetCard density="compact">
      <h4>Age {year}</h4>
      <SheetFieldGrid columns={4}>
        <SheetField label="Study XP recorded">
          <input type="number" value={studyPointsSpent} readOnly />
        </SheetField>
        <SheetField label="Spell levels">
          <input type="number" value={spellLevelsSpent} readOnly />
        </SheetField>
        <SheetField label="Laboratory seasons">
          <input
            type="number"
            min={0}
            max={4}
            value={record.laboratorySeasons}
            onChange={(event) =>
              setRecord({ laboratorySeasons: event.target.valueAsNumber })
            }
          />
        </SheetField>
        <label className="sheet-field">
          <span>Aging resolved</span>
          <input
            type="checkbox"
            checked={record.agingResolved}
            onChange={(event) =>
              setRecord({ agingResolved: event.target.checked })
            }
          />
        </label>
      </SheetFieldGrid>
      <SheetFieldGrid columns={3}>
        <SheetField label="Studied Ability or Art">
          <select
            value={traitId}
            onChange={(event) => setTraitId(event.target.value)}
          >
            {character.definition.traits.map((trait) => (
              <option key={trait.id} value={trait.id}>
                {trait.name}
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Experience awarded">
          <input
            type="number"
            min={1}
            value={experience}
            onChange={(event) => setExperience(event.target.valueAsNumber)}
          />
        </SheetField>
        <button
          className="secondary-button"
          disabled={
            !traitId ||
            !Number.isSafeInteger(experience) ||
            experience < 1 ||
            studyPointsSpent + record.spellLevelsSpent + experience >
              Math.max(0, 30 - 10 * record.laboratorySeasons)
          }
          onClick={() => {
            const allocation = {
              id: crypto.randomUUID(),
              phase: 'post-apprenticeship' as const,
              traitId,
              experience,
              year,
            };
            onChange({
              ...character,
              definition: {
                ...character.definition,
                traits: character.definition.traits.map((trait) =>
                  trait.id === traitId
                    ? { ...trait, experience: trait.experience + experience }
                    : trait,
                ),
              },
              creation: {
                ...character.creation,
                experienceAllocations: [
                  ...character.creation.experienceAllocations,
                  allocation,
                ],
                allocations: {
                  ...character.creation.allocations,
                  postApprenticeshipYears: [
                    ...character.creation.allocations.postApprenticeshipYears.filter(
                      (entry) => entry.year !== year,
                    ),
                    {
                      ...record,
                      studyPointsSpent: studyPointsSpent + experience,
                    },
                  ].sort((a, b) => a.year - b.year),
                },
              },
            });
          }}
        >
          Record study
        </button>
      </SheetFieldGrid>
      {yearAllocations.map((allocation) => (
        <SheetToolbar key={allocation.id}>
          <span>
            {character.definition.traits.find(
              (trait) => trait.id === allocation.traitId,
            )?.name ?? 'Unresolved Trait'}
            : {allocation.experience} XP
          </span>
          <button
            className="secondary-button"
            onClick={() =>
              onChange({
                ...character,
                definition: {
                  ...character.definition,
                  traits: character.definition.traits.map((trait) =>
                    trait.id === allocation.traitId
                      ? {
                          ...trait,
                          experience: Math.max(
                            0,
                            trait.experience - allocation.experience,
                          ),
                        }
                      : trait,
                  ),
                },
                creation: {
                  ...character.creation,
                  experienceAllocations:
                    character.creation.experienceAllocations.filter(
                      (entry) => entry.id !== allocation.id,
                    ),
                  allocations: {
                    ...character.creation.allocations,
                    postApprenticeshipYears:
                      character.creation.allocations.postApprenticeshipYears.map(
                        (entry) =>
                          entry.year === year
                            ? {
                                ...entry,
                                studyPointsSpent: Math.max(
                                  0,
                                  entry.studyPointsSpent -
                                    allocation.experience,
                                ),
                              }
                            : entry,
                      ),
                  },
                },
              })
            }
          >
            Undo study
          </button>
        </SheetToolbar>
      ))}
      <SheetFieldGrid columns={2}>
        <SheetField label="Spell learned or invented">
          <select
            value={spellDefinitionId}
            onChange={(event) => setSpellDefinitionId(event.target.value)}
          >
            <option value="">Choose a verified fixed-level spell</option>
            {spellCatalog
              .filter(
                (spell) =>
                  spell.verification === 'verified' &&
                  !spell.general &&
                  spell.level !== null,
              )
              .map((spell) => (
                <option key={spell.id} value={spell.id}>
                  {spell.name} ({spell.level})
                </option>
              ))}
          </select>
        </SheetField>
        <button
          className="secondary-button"
          disabled={
            !selectedSpell ||
            selectedSpell.level === null ||
            studyPointsSpent +
              record.spellLevelsSpent +
              (selectedSpell?.level ?? 0) >
              Math.max(0, 30 - 10 * record.laboratorySeasons)
          }
          onClick={() => {
            if (!selectedSpell || selectedSpell.level === null) return;
            const spellId = crypto.randomUUID();
            onChange({
              ...character,
              definition: {
                ...character.definition,
                spells: [
                  ...character.definition.spells,
                  {
                    id: spellId,
                    definitionId: selectedSpell.id,
                    name: selectedSpell.name,
                    status: 'verified',
                    citation: {
                      sourceId: selectedSpell.sourceId,
                      book: 'Ars Magica Definitive Edition',
                      printedPage: selectedSpell.printedPage,
                      pdfPage: selectedSpell.pdfPage,
                    },
                    notes: '',
                    techniqueId: artIdForCode(selectedSpell.technique),
                    formId: artIdForCode(selectedSpell.form),
                    level: selectedSpell.level,
                    castingBonus: 0,
                    range: '',
                    duration: '',
                    target: '',
                    masteryExperience: 0,
                    masteryOptions: [],
                    requisiteIds: [],
                  },
                ],
              },
              creation: {
                ...character.creation,
                spellAllocations: [
                  ...character.creation.spellAllocations,
                  {
                    id: crypto.randomUUID(),
                    spellId,
                    phase: 'post-apprenticeship',
                    levels: selectedSpell.level,
                    year,
                  },
                ],
                allocations: {
                  ...character.creation.allocations,
                  postApprenticeshipYears: [
                    ...character.creation.allocations.postApprenticeshipYears.filter(
                      (entry) => entry.year !== year,
                    ),
                    {
                      ...record,
                      spellLevelsSpent:
                        record.spellLevelsSpent + selectedSpell.level,
                    },
                  ].sort((a, b) => a.year - b.year),
                },
              },
            });
            setSpellDefinitionId('');
          }}
        >
          Record spell levels
        </button>
      </SheetFieldGrid>
    </SheetCard>
  );
}
import { useState } from 'react';
