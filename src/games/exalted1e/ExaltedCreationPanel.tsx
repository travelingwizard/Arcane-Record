import { useState } from 'react';
import {
  SheetBadge,
  SheetCard,
  SheetField,
  SheetFieldGrid,
  SheetNotice,
  SheetToolbar,
} from '../../components/layout/SheetPrimitives';
import {
  getExaltedCreationRules,
  getExaltedDerivedValues,
  validateExaltedCreation,
} from './family-rules';
import type { Exalted1eCharacter } from './schema';
import { exaltedAttributeGroups } from './definitions';

const creationStages = [
  'Family and profile',
  'Concept and identity',
  'Attributes',
  'Abilities and specialties',
  'Backgrounds',
  'Virtues and resources',
  'Charms and powers',
  'Family magic and transformations',
  'Equipment and possessions',
  'Bonus-point review',
  'Final review',
] as const;

export function ExaltedCreationPanel({
  character,
  onChange,
}: {
  character: Exalted1eCharacter;
  onChange: (character: Exalted1eCharacter) => void;
}) {
  const [approvalReason, setApprovalReason] = useState('');
  if (character.creation.status === 'manual') return null;
  const rules = getExaltedCreationRules(
    character.sheetType,
    character.creation.rulesVariant,
  );
  const issues = validateExaltedCreation(character);
  const unresolved = issues.filter(({ approved }) => !approved);
  const derived = getExaltedDerivedValues(character);
  const citation = `${rules.citation.sourceId}, p. ${rules.citation.printedPage} (PDF ${rules.citation.pdfPage})`;
  const currentStep = Math.min(
    11,
    Math.max(1, character.creation.currentStep || 1),
  );

  const setStep = (nextStep: number) =>
    onChange({
      ...character,
      creation: {
        ...character.creation,
        currentStep: Math.min(11, Math.max(1, nextStep)),
      },
    });

  const selectFamilyIdentity = (familyIdentity: string) => {
    const identity = { ...character.identity, familyIdentity };
    if (character.sheetType === 'solar') identity.caste = familyIdentity;
    if (character.sheetType === 'dragon-blooded')
      identity.aspect = familyIdentity;
    onChange({ ...character, identity });
  };

  const applyDerivedValues = () =>
    onChange({
      ...character,
      willpower: {
        permanent: derived.willpower,
        temporary: derived.willpower,
      },
      essence: {
        ...character.essence,
        rating: rules.startingEssence,
        personal: derived.personalEssence,
        peripheral: derived.peripheralEssence,
      },
    });

  const initializeAttributeProfile = () => {
    const nextAttributes = Object.fromEntries(
      exaltedAttributeGroups.map((group) => [
        group.id,
        Object.fromEntries(
          group.traits.map((trait) => [trait.id, rules.attributeBase]),
        ),
      ]),
    ) as Exalted1eCharacter['attributes'];

    if (character.sheetType === 'alchemical') {
      const selectedCaste = rules.castes.find(
        ({ id }) => id === character.identity.familyIdentity,
      );
      const casteIds = new Set(selectedCaste?.associatedAttributeIds ?? []);
      const favoredIds = new Set(character.creation.favoredAttributeIds);
      const remainingIds = exaltedAttributeGroups
        .flatMap(({ traits }) => traits.map(({ id }) => id))
        .filter((id) => !casteIds.has(id) && !favoredIds.has(id));
      for (const group of exaltedAttributeGroups) {
        for (const trait of group.traits) {
          const ratings = nextAttributes[group.id] as Record<string, number>;
          if (casteIds.has(trait.id)) ratings[trait.id] = 3;
          else if (favoredIds.has(trait.id)) ratings[trait.id] = 2;
          else {
            const index = remainingIds.indexOf(trait.id);
            ratings[trait.id] = index === 0 ? 2 : 1;
          }
        }
      }
    }
    onChange({ ...character, attributes: nextAttributes });
  };

  const finalize = () => {
    if (unresolved.length > 0) return;
    const finalizedAt = new Date().toISOString();
    const baseline = {
      sheetType: character.sheetType,
      identity: character.identity,
      attributes: character.attributes,
      abilities: character.abilities,
      favoredAbilities: character.favoredAbilities,
      backgrounds: character.backgrounds,
      virtues: character.virtues,
      powers: character.powers,
    };
    onChange({
      ...character,
      creation: {
        ...character.creation,
        status: 'finalized',
        currentStep: 11,
        baselineJson: JSON.stringify(baseline),
        finalizedAt,
      },
      sheetLayout: { ...character.sheetLayout, mode: 'play' },
    });
  };

  const approveIssue = (ruleId: string) => {
    const reason = approvalReason.trim();
    if (!reason) return;
    onChange({
      ...character,
      creation: {
        ...character.creation,
        approvals: [
          ...character.creation.approvals.filter(
            (approval) => approval.ruleId !== ruleId,
          ),
          {
            id: crypto.randomUUID(),
            ruleId,
            reason,
            approvedAt: new Date().toISOString(),
          },
        ],
      },
    });
    setApprovalReason('');
  };

  return (
    <SheetCard className="exalted-creation-panel">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">Guided creation</p>
          <h3>
            {character.creation.status === 'finalized'
              ? 'Creation record'
              : 'Build character'}
          </h3>
        </div>
        <SheetBadge tone={unresolved.length === 0 ? 'success' : 'warning'}>
          {unresolved.length === 0
            ? 'Ready to finalize'
            : `${unresolved.length} requirement${unresolved.length === 1 ? '' : 's'} remaining`}
        </SheetBadge>
      </div>

      <SheetFieldGrid columns={2}>
        {character.sheetType === 'lunar' ||
        character.sheetType === 'abyssal' ||
        character.sheetType === 'sidereal' ||
        character.sheetType === 'fair-folk' ? (
          <SheetField label="Creation profile">
            <select
              value={character.creation.rulesVariant}
              disabled={character.creation.status === 'finalized'}
              onChange={(event) =>
                onChange({
                  ...character,
                  creation: {
                    ...character.creation,
                    rulesVariant: event.target
                      .value as typeof character.creation.rulesVariant,
                  },
                })
              }
            >
              <option value="standard">Standard</option>
              {character.sheetType === 'lunar' ? (
                <option value="casteless">Casteless</option>
              ) : null}
              {character.sheetType === 'abyssal' ? (
                <option value="fugitive">Fugitive</option>
              ) : null}
              {character.sheetType === 'sidereal' ? (
                <option value="ronin">Ronin</option>
              ) : null}
              {character.sheetType === 'fair-folk' ? (
                <>
                  <option value="common">Common raksha</option>
                  <option value="heroic-common">Heroic commoner</option>
                </>
              ) : null}
            </select>
          </SheetField>
        ) : null}
        <SheetField
          label={character.sheetType === 'dragon-blooded' ? 'Aspect' : 'Caste'}
        >
          <select
            value={character.identity.familyIdentity}
            onChange={(event) => selectFamilyIdentity(event.target.value)}
            disabled={character.creation.status === 'finalized'}
          >
            <option value="">Choose…</option>
            {rules.castes.map((caste) => (
              <option key={caste.id} value={caste.id}>
                {caste.name}
              </option>
            ))}
          </select>
        </SheetField>
        {character.sheetType === 'fair-folk' &&
        character.creation.rulesVariant === 'standard' ? (
          <SheetField label="Second Caste">
            <select
              value={character.identity.organization}
              onChange={(event) =>
                onChange({
                  ...character,
                  identity: {
                    ...character.identity,
                    organization: event.target.value,
                  },
                })
              }
              disabled={character.creation.status === 'finalized'}
            >
              <option value="">Choose…</option>
              {rules.castes.map((caste) => (
                <option key={caste.id} value={caste.id}>
                  {caste.name}
                </option>
              ))}
            </select>
          </SheetField>
        ) : null}
        <SheetField label="Creation source">
          <input value={citation} readOnly />
        </SheetField>
      </SheetFieldGrid>

      <nav
        className="sheet-card sheet-card--compact"
        aria-label="Creation steps"
      >
        <p className="eyebrow">
          Step {currentStep} of {creationStages.length}
        </p>
        <strong>{creationStages[currentStep - 1]}</strong>
        <div className="sheet-toolbar">
          <button
            type="button"
            disabled={
              currentStep === 1 || character.creation.status === 'finalized'
            }
            onClick={() => setStep(currentStep - 1)}
          >
            Previous step
          </button>
          <button
            type="button"
            disabled={
              currentStep === creationStages.length ||
              character.creation.status === 'finalized'
            }
            onClick={() => setStep(currentStep + 1)}
          >
            Continue
          </button>
        </div>
      </nav>

      {character.sheetType === 'alchemical' ? (
        <fieldset className="sheet-card sheet-card--compact">
          <legend>Favored Attributes (choose three outside Caste)</legend>
          <div className="sheet-field-grid" data-columns="3">
            {exaltedAttributeGroups.flatMap((group) =>
              group.traits.map((trait) => {
                const checked = character.creation.favoredAttributeIds.includes(
                  trait.id,
                );
                return (
                  <label key={trait.id} className="choice-row">
                    <input
                      type="checkbox"
                      checked={checked}
                      disabled={character.creation.status === 'finalized'}
                      onChange={() =>
                        onChange({
                          ...character,
                          creation: {
                            ...character.creation,
                            favoredAttributeIds: checked
                              ? character.creation.favoredAttributeIds.filter(
                                  (id) => id !== trait.id,
                                )
                              : [
                                  ...character.creation.favoredAttributeIds,
                                  trait.id,
                                ].slice(-3),
                          },
                        })
                      }
                    />
                    <span>{trait.label}</span>
                  </label>
                );
              }),
            )}
          </div>
        </fieldset>
      ) : null}

      <div className="sheet-card-grid">
        <SheetCard density="compact">
          <strong>Attributes</strong>
          <p>
            {character.sheetType === 'alchemical'
              ? 'Caste 9, Favored 6, remaining 4.'
              : `${rules.attributeBudgets.join('/')} by priority; base ${rules.attributeBase}.`}
          </p>
        </SheetCard>
        <SheetCard density="compact">
          <strong>Abilities</strong>
          <p>
            {rules.abilityDots} dots; initial cap {rules.abilityInitialCap};{' '}
            {rules.favoredCount} favored.
          </p>
        </SheetCard>
        <SheetCard density="compact">
          <strong>Advantages</strong>
          <p>
            Backgrounds {rules.backgrounds}; Virtues {rules.virtues}; powers{' '}
            {rules.charms}.
          </p>
        </SheetCard>
        <SheetCard density="compact">
          <strong>Finishing values</strong>
          <p>
            Essence {rules.startingEssence}; Willpower {derived.willpower};{' '}
            {rules.bonusPoints} bonus points.
          </p>
        </SheetCard>
      </div>

      {issues.length > 0 ? (
        <div className="sheet-card-list">
          {issues.map((issue) => (
            <SheetNotice
              key={issue.ruleId}
              tone={issue.approved ? 'success' : 'warning'}
            >
              <strong>{issue.approved ? 'Storyteller approved: ' : ''}</strong>
              {issue.message}
              {!issue.approved && character.creation.status !== 'finalized' ? (
                <button
                  type="button"
                  disabled={!approvalReason.trim()}
                  onClick={() => approveIssue(issue.ruleId)}
                >
                  Storyteller approve this rule
                </button>
              ) : null}
            </SheetNotice>
          ))}
        </div>
      ) : (
        <SheetNotice tone="success">
          All currently automated creation requirements pass.
        </SheetNotice>
      )}

      {unresolved.length > 0 && character.creation.status !== 'finalized' ? (
        <SheetField label="Storyteller approval reason">
          <textarea
            value={approvalReason}
            onChange={(event) => setApprovalReason(event.target.value)}
            placeholder="Explain the table ruling before approving a specific requirement."
          />
        </SheetField>
      ) : null}

      <SheetToolbar>
        <button
          type="button"
          disabled={character.creation.status === 'finalized'}
          onClick={initializeAttributeProfile}
        >
          Initialize verified Attribute profile
        </button>
        <button type="button" onClick={applyDerivedValues}>
          Apply derived values
        </button>
        {character.creation.status !== 'finalized' ? (
          <button
            type="button"
            className="primary-button"
            disabled={
              unresolved.length > 0 || currentStep !== creationStages.length
            }
            onClick={finalize}
          >
            Finalize character
          </button>
        ) : null}
      </SheetToolbar>
    </SheetCard>
  );
}
