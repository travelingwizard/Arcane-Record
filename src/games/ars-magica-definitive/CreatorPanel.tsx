import {
  SheetCard,
  SheetField,
  SheetFieldGrid,
  SheetNotice,
  SheetToolbar,
} from '../../components/layout/SheetPrimitives';
import { houseCatalog } from './catalog';
import { creationBudgets, characteristicCost } from './creation-rules';
import { canFinalize, validateCharacter } from './validation';
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
  certified,
}: {
  character: ArsCharacter;
  onChange: (c: ArsCharacter) => void;
  certified: boolean;
}) {
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
  const finalizable = canFinalize(character, certified);
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
              <select
                value={c.role}
                onChange={(e) => {
                  const role = e.target.value as typeof c.role;
                  const fresh = {
                    ...character,
                    definition: {
                      ...c,
                      role,
                      houseId: role === 'magus' ? c.houseId : null,
                      socialStatus:
                        role === 'magus' ? 'Hermetic Magus' : c.socialStatus,
                    },
                    play: {
                      ...character.play,
                      confidenceScore: role === 'grog' ? 0 : 1,
                      confidencePoints: role === 'grog' ? 0 : 3,
                    },
                  };
                  onChange(fresh);
                }}
              >
                <option value="magus">Magus</option>
                <option value="companion">Companion</option>
                <option value="grog">Grog</option>
              </select>
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
          </SheetFieldGrid>
        )}
        {step === 2 && (
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
          <p>
            Record verified Virtues and Flaws on the sheet. Magi and Companions
            may take up to 10 Flaw points; Grogs up to three Minor Flaws.
            Ability access and House packages are validated during review.
          </p>
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
          </>
        )}
        {step === 6 && (
          <p>
            {c.role === 'magus'
              ? `Apprenticeship provides ${budgets.apprenticeship} XP and ${budgets.spellLevels} spell levels. Mandatory minimums are checked on Review.`
              : 'This role does not receive Hermetic apprenticeship allocations.'}
          </p>
        )}
        {step === 7 && (
          <p>
            Allocate earned XP in the Abilities and Arts sections. Spell
            selection is limited to verified selectable entries; reference-only
            spells cannot be finalized automatically.
          </p>
        )}
        {step === 8 && (
          <p>
            Complete personality, equipment, relationships, and Covenant details
            in their sheet sections.
          </p>
        )}
        {step === 9 && (
          <p>
            {c.role === 'magus'
              ? `${budgets.postApprenticeshipYears} post-apprenticeship years are currently requested. Each must receive a reviewed annual study/laboratory record before finalization.`
              : 'Older non-magi use later-life experience and applicable aging records.'}
          </p>
        )}
        {step === 10 && (
          <>
            <ul>
              {issues.map((i) => (
                <li key={i.id}>
                  {i.kind === 'error' ? 'Required' : 'Guidance'}: {i.message} (
                  {i.citation})
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
