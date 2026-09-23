import { useState } from 'react';
import type { Exalted1eCharacter } from '../../schema';
import {
  getDragonBloodedEssenceExperienceCost,
  getExperienceTotals,
} from './rules';
import {
  getExaltedCreationRules,
  quoteExaltedAdvancement,
} from '../../family-rules';
import {
  exaltedAbilities,
  exaltedAttributeGroups,
  exaltedVirtues,
  type ExaltedAbilityId,
  type ExaltedAttributeGroupId,
  type ExaltedAttributeId,
  type ExaltedVirtueId,
} from '../../definitions';

interface Props {
  character: Exalted1eCharacter;
  onChange: (character: Exalted1eCharacter) => void;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

export function ExperienceSection({ character, onChange }: Props) {
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [entryType, setEntryType] = useState<'award' | 'refund' | 'adjustment'>(
    'award',
  );
  const [showSpend, setShowSpend] = useState(false);
  const [showDowntime, setShowDowntime] = useState(false);
  const [purchaseKind, setPurchaseKind] = useState<
    'attribute' | 'ability' | 'virtue' | 'willpower' | 'essence'
  >('essence');
  const [purchaseTargetId, setPurchaseTargetId] = useState('essence');
  const totals = getExperienceTotals(character.experienceLedger);
  const familyEssenceQuote = quoteExaltedAdvancement(
    character.sheetType,
    'essence',
    character.essence.rating,
  );
  const essenceCost =
    familyEssenceQuote?.cost ??
    getDragonBloodedEssenceExperienceCost(character.essence.rating);
  const essenceCitation = familyEssenceQuote
    ? `${familyEssenceQuote.citation.sourceId}, p. ${familyEssenceQuote.citation.printedPage} (PDF ${familyEssenceQuote.citation.pdfPage})`
    : 'Dragon-Blooded family table';

  const purchaseOptions =
    purchaseKind === 'attribute'
      ? exaltedAttributeGroups.flatMap((group) =>
          group.traits.map((trait) => ({
            id: trait.id,
            label: trait.label,
            groupId: group.id,
          })),
        )
      : purchaseKind === 'ability'
        ? exaltedAbilities.map(({ id, label }) => ({ id, label }))
        : purchaseKind === 'virtue'
          ? exaltedVirtues.map(({ id, label }) => ({ id, label }))
          : [
              {
                id: purchaseKind,
                label: purchaseKind === 'essence' ? 'Essence' : 'Willpower',
              },
            ];
  const selectedOption =
    purchaseOptions.find(({ id }) => id === purchaseTargetId) ??
    purchaseOptions[0];
  const selectedCaste = getExaltedCreationRules(
    character.sheetType,
    character.creation.rulesVariant,
  ).castes.find(({ id }) => id === character.identity.familyIdentity);
  const associatedPurchase =
    purchaseKind === 'ability'
      ? character.favoredAbilities.includes(
          selectedOption.id as ExaltedAbilityId,
        ) ||
        (selectedCaste?.associatedAbilityIds ?? []).includes(
          selectedOption.id as ExaltedAbilityId,
        )
      : purchaseKind === 'attribute'
        ? (selectedCaste?.associatedAttributeIds ?? []).includes(
            selectedOption.id,
          ) ||
          character.creation.favoredAttributeIds.includes(selectedOption.id)
        : false;
  const currentPurchaseRating = (() => {
    if (purchaseKind === 'ability')
      return character.abilities[selectedOption.id as ExaltedAbilityId];
    if (purchaseKind === 'virtue')
      return character.virtues[selectedOption.id as ExaltedVirtueId];
    if (purchaseKind === 'willpower') return character.willpower.permanent;
    if (purchaseKind === 'essence') return character.essence.rating;
    const attribute = selectedOption as {
      groupId?: ExaltedAttributeGroupId;
      id: string;
    };
    return attribute.groupId
      ? (character.attributes[attribute.groupId] as Record<string, number>)[
          attribute.id
        ]
      : 0;
  })();
  const familyPurchaseQuote = quoteExaltedAdvancement(
    character.sheetType,
    purchaseKind,
    currentPurchaseRating,
    associatedPurchase,
  );
  const purchaseQuote =
    purchaseKind === 'essence' && !familyPurchaseQuote
      ? { cost: essenceCost, citation: null }
      : familyPurchaseQuote;
  const purchaseMaximum =
    purchaseKind === 'attribute'
      ? character.sheetType === 'fair-folk'
        ? 7
        : 5
      : purchaseKind === 'ability' || purchaseKind === 'virtue'
        ? 5
        : 10;

  const appendLedger = (
    type: 'award' | 'purchase' | 'refund' | 'adjustment',
    signedAmount: number,
    details: Partial<Exalted1eCharacter['experienceLedger'][number]> = {},
  ) => {
    const entry: Exalted1eCharacter['experienceLedger'][number] = {
      id: crypto.randomUUID(),
      date: today(),
      session: '',
      type,
      amount: signedAmount,
      category: details.category ?? 'General',
      targetId: details.targetId ?? null,
      targetName: details.targetName ?? '',
      previousRating: details.previousRating ?? null,
      newRating: details.newRating ?? null,
      description: details.description ?? description.trim(),
      notes: details.notes ?? '',
      createdAt: new Date().toISOString(),
    };
    onChange({
      ...character,
      experienceLedger: [...character.experienceLedger, entry],
    });
  };

  const addManual = () => {
    const parsed = Number.parseInt(amount, 10);
    if (!Number.isInteger(parsed) || parsed === 0) return;
    const signed =
      entryType === 'award' || entryType === 'refund'
        ? Math.abs(parsed)
        : parsed;
    appendLedger(entryType, signed);
    setAmount('');
    setDescription('');
  };

  const confirmTraitPurchase = (spendXp: boolean) => {
    if (!selectedOption || !purchaseQuote) return;
    if (spendXp && totals.available < purchaseQuote.cost) return;
    const previous = currentPurchaseRating;
    const next = previous + 1;
    let updated: Exalted1eCharacter = character;
    if (purchaseKind === 'ability') {
      updated = {
        ...updated,
        abilities: {
          ...updated.abilities,
          [selectedOption.id]: next,
        },
      };
    } else if (purchaseKind === 'virtue') {
      updated = {
        ...updated,
        virtues: { ...updated.virtues, [selectedOption.id]: next },
      };
    } else if (purchaseKind === 'willpower') {
      updated = {
        ...updated,
        willpower: { ...updated.willpower, permanent: next },
      };
    } else if (purchaseKind === 'essence') {
      updated = { ...updated, essence: { ...updated.essence, rating: next } };
    } else {
      const attribute = selectedOption as {
        groupId?: ExaltedAttributeGroupId;
        id: ExaltedAttributeId;
      };
      if (!attribute.groupId) return;
      updated = {
        ...updated,
        attributes: {
          ...updated.attributes,
          [attribute.groupId]: {
            ...updated.attributes[attribute.groupId],
            [attribute.id]: next,
          },
        },
      };
    }
    const citation = purchaseQuote.citation
      ? `${purchaseQuote.citation.sourceId}, p. ${purchaseQuote.citation.printedPage} (PDF ${purchaseQuote.citation.pdfPage})`
      : essenceCitation;
    onChange({
      ...updated,
      experienceLedger: spendXp
        ? [
            ...updated.experienceLedger,
            {
              id: crypto.randomUUID(),
              date: today(),
              session: '',
              type: 'purchase',
              amount: -purchaseQuote.cost,
              category: purchaseKind,
              targetId: selectedOption.id,
              targetName: selectedOption.label,
              previousRating: previous,
              newRating: next,
              description: `Raised ${selectedOption.label} from ${previous} to ${next}`,
              notes: `${citation}; ${associatedPurchase ? 'associated/favored' : 'standard'} price preserved at purchase.`,
              createdAt: new Date().toISOString(),
            },
          ]
        : updated.experienceLedger,
    });
  };

  const addDowntime = () =>
    onChange({
      ...character,
      downtimeAdvancement: [
        ...character.downtimeAdvancement,
        {
          id: crypto.randomUUID(),
          startYear: '',
          endYear: '',
          yearsElapsed: 0,
          attributesWillpowerGained: '',
          abilitiesVirtuesGained: '',
          backgroundsGained: '',
          essenceIncrease: 0,
          charmsLearned: '',
          comboLearned: '',
          notes: '',
          createdAt: new Date().toISOString(),
        },
      ],
    });

  return (
    <>
      <div className="exalted-trait-totals" aria-label="Experience totals">
        <strong>Current Experience: {totals.available}</strong>
        <strong>Total Experience: {totals.lifetimeEarned}</strong>
        <strong>Lifetime spent: {totals.lifetimeSpent}</strong>
      </div>
      <div className="exalted-action-row">
        <button
          type="button"
          className="secondary-button"
          onClick={() => setShowSpend((value) => !value)}
        >
          Spend Experience
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={() => setShowDowntime((value) => !value)}
        >
          Downtime Advancement
        </button>
      </div>
      {showSpend ? (
        <div className="sheet-card exalted-workflow-card">
          <h3>One-dot Trait purchase</h3>
          <div className="sheet-field-grid" data-columns="2">
            <label>
              <span>Trait category</span>
              <select
                value={purchaseKind}
                onChange={(event) => {
                  const kind = event.target.value as typeof purchaseKind;
                  setPurchaseKind(kind);
                  setPurchaseTargetId(kind);
                }}
              >
                <option value="attribute">Attribute</option>
                <option value="ability">Ability</option>
                <option value="virtue">Virtue</option>
                <option value="willpower">Willpower</option>
                <option value="essence">Essence</option>
              </select>
            </label>
            <label>
              <span>Trait</span>
              <select
                value={selectedOption?.id ?? ''}
                onChange={(event) => setPurchaseTargetId(event.target.value)}
              >
                {purchaseOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>
          </div>
          <p>
            Current {currentPurchaseRating} · Proposed{' '}
            {currentPurchaseRating + 1} · Cost{' '}
            {purchaseQuote ? `${purchaseQuote.cost} XP` : 'not verified'}
          </p>
          <p className="section-note">
            {purchaseQuote
              ? `Verified ${character.sheetType} ${associatedPurchase ? 'associated/favored' : 'standard'} price.`
              : 'This category remains manual until its family price is verified.'}
          </p>
          {purchaseQuote && totals.available < purchaseQuote.cost ? (
            <p className="exalted-trait-warning">
              Insufficient XP. Add Without Spending XP remains available for
              awards and unusual cases.
            </p>
          ) : null}
          <div className="exalted-action-row">
            <button
              type="button"
              className="primary-button"
              disabled={
                !purchaseQuote ||
                totals.available < purchaseQuote.cost ||
                currentPurchaseRating >= purchaseMaximum
              }
              onClick={() => confirmTraitPurchase(true)}
            >
              Confirm purchase
            </button>
            <button
              type="button"
              className="secondary-button"
              disabled={currentPurchaseRating >= purchaseMaximum}
              onClick={() => confirmTraitPurchase(false)}
            >
              Add Without Spending XP
            </button>
          </div>
        </div>
      ) : null}
      <div className="sheet-card exalted-workflow-card">
        <h3>Add Award or Manual Adjustment</h3>
        <div className="exalted-background-add">
          <label>
            <span>Type</span>
            <select
              value={entryType}
              onChange={(event) =>
                setEntryType(event.target.value as typeof entryType)
              }
            >
              <option value="award">Award</option>
              <option value="refund">Refund</option>
              <option value="adjustment">Manual adjustment</option>
            </select>
          </label>
          <label>
            <span>Signed amount</span>
            <input
              type="number"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </label>
          <label>
            <span>Description</span>
            <input
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </label>
          <button
            type="button"
            className="secondary-button"
            onClick={addManual}
          >
            Add entry
          </button>
        </div>
      </div>
      {showDowntime ? (
        <div className="sheet-card exalted-workflow-card">
          <h3>Downtime Advancement</h3>
          <p className="section-note">
            Downtime records are shown in history but never converted into fake
            XP transactions.
          </p>
          <button
            type="button"
            className="secondary-button"
            onClick={addDowntime}
          >
            Add downtime record
          </button>
        </div>
      ) : null}
      <h3>Experience History</h3>
      <div className="exalted-record-list">
        {[...character.experienceLedger].reverse().map((entry) => (
          <details className="exalted-compact-record" key={entry.id}>
            <summary>
              <strong>
                {entry.description || entry.targetName || entry.type}
              </strong>
              <span>
                {entry.amount > 0 ? '+' : ''}
                {entry.amount} XP · {entry.date}
              </span>
            </summary>
            <p>
              {entry.category}
              {entry.notes ? ` · ${entry.notes}` : ''}
            </p>
          </details>
        ))}
        {[...character.downtimeAdvancement].reverse().map((entry) => (
          <details className="exalted-compact-record" key={entry.id}>
            <summary>
              <strong>Downtime advancement</strong>
              <span>
                {entry.startYear || 'Start'}–{entry.endYear || 'End'} ·{' '}
                {entry.yearsElapsed} years
              </span>
            </summary>
            <div className="exalted-record-fields">
              {(
                [
                  'startYear',
                  'endYear',
                  'attributesWillpowerGained',
                  'abilitiesVirtuesGained',
                  'backgroundsGained',
                  'charmsLearned',
                  'comboLearned',
                  'notes',
                ] as const
              ).map((field) => (
                <label key={field}>
                  <span>{field.replace(/([A-Z])/g, ' $1')}</span>
                  <textarea
                    value={entry[field]}
                    onChange={(event) =>
                      onChange({
                        ...character,
                        downtimeAdvancement: character.downtimeAdvancement.map(
                          (item) =>
                            item.id === entry.id
                              ? { ...item, [field]: event.target.value }
                              : item,
                        ),
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </details>
        ))}
        {!character.experienceLedger.length &&
        !character.downtimeAdvancement.length ? (
          <p className="empty-inline">No experience history recorded.</p>
        ) : null}
      </div>
    </>
  );
}
