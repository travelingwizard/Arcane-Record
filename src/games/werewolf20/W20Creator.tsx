import { useState } from 'react';
import {
  SheetCard,
  SheetField,
  SheetFieldGrid,
  SheetNotice,
  SheetToolbar,
} from '../../components/layout/SheetPrimitives';
import {
  w20Archetypes,
  w20Auspices,
  w20Breeds,
  w20ChangingBreeds,
  w20Tribes,
  w20WyrmTribes,
  w20WyrmTypes,
} from './catalog';
import { w20CreationBudgets, w20CreationIssues } from './rules';
import type { W20Character } from './schema';
const Select = ({
  label,
  value,
  entries,
  locked,
  onChange,
}: {
  label: string;
  value: string | null;
  entries: { id: string; name: string; restricted: boolean }[];
  locked: boolean;
  onChange: (id: string | null) => void;
}) => (
  <SheetField label={label}>
    <select
      value={value ?? ''}
      disabled={locked}
      onChange={(e) => onChange(e.target.value || null)}
    >
      <option value="">Choose…</option>
      {entries.map((x) => (
        <option key={x.id} value={x.id}>
          {x.name}
          {x.restricted ? ' — restricted' : ''}
        </option>
      ))}
    </select>
  </SheetField>
);
export function W20Creator({
  character: c,
  onChange,
  locked,
}: {
  character: W20Character;
  onChange: (c: W20Character) => void;
  locked: boolean;
}) {
  const [reason, setReason] = useState(''),
    issues = w20CreationIssues(c),
    budgets = w20CreationBudgets(c);
  const patch = (value: Partial<W20Character>) => onChange({ ...c, ...value });
  return (
    <div className="character-creator">
      <SheetNotice tone="info">
        Build a {c.characterType.replace('-', ' ')} using source-cited W20
        choices. Allocations are edited in the corresponding sheet sections and
        summarized here.
      </SheetNotice>
      <SheetFieldGrid columns={3}>
        {c.characterType === 'garou' && (
          <>
            <Select
              label="Breed"
              value={c.breedId}
              entries={w20Breeds}
              locked={locked}
              onChange={(breedId) => patch({ breedId })}
            />
            <Select
              label="Auspice"
              value={c.auspiceId}
              entries={w20Auspices}
              locked={locked}
              onChange={(auspiceId) => patch({ auspiceId })}
            />
            <Select
              label="Tribe"
              value={c.tribeId}
              entries={[
                ...w20Tribes,
                ...(c.showUnavailableSources ? w20WyrmTribes : []),
              ]}
              locked={locked}
              onChange={(tribeId) =>
                patch({
                  tribeId,
                  creation: {
                    ...c.creation,
                    restrictedSelection: w20WyrmTribes.some(
                      (x) => x.id === tribeId,
                    ),
                  },
                })
              }
            />
          </>
        )}
        {c.characterType === 'changing-breed' && (
          <Select
            label="Changing Breed"
            value={c.changingBreedId}
            entries={w20ChangingBreeds}
            locked={locked}
            onChange={(changingBreedId) => patch({ changingBreedId })}
          />
        )}
        {c.characterType === 'kinfolk' && (
          <SheetField label="Kinfolk type">
            <select
              value={c.kinfolkType ?? 'human'}
              disabled={locked}
              onChange={(e) =>
                patch({ kinfolkType: e.target.value as 'human' | 'wolf' })
              }
            >
              <option value="human">Human Kinfolk</option>
              <option value="wolf">Wolf Kinfolk</option>
            </select>
          </SheetField>
        )}
        {c.characterType === 'wyrm-aligned' && (
          <Select
            label="Wyrm framework"
            value={c.wyrmTypeId}
            entries={w20WyrmTypes}
            locked={locked}
            onChange={(wyrmTypeId) => patch({ wyrmTypeId })}
          />
        )}
        <Select
          label="Nature"
          value={c.natureId}
          entries={w20Archetypes}
          locked={locked}
          onChange={(natureId) => patch({ natureId })}
        />
        <Select
          label="Demeanor"
          value={c.demeanorId}
          entries={w20Archetypes}
          locked={locked}
          onChange={(demeanorId) => patch({ demeanorId })}
        />
      </SheetFieldGrid>
      <SheetCard density="compact">
        <strong>Creation budgets</strong>
        <p>
          Attributes {budgets.attributes.join('/')} · Abilities{' '}
          {budgets.abilities.join('/')} · Backgrounds {budgets.backgrounds} ·
          Gifts {budgets.gifts} · Freebies {c.creation.freebieSpent}/
          {budgets.freebies +
            Math.min(budgets.flawCredit, c.creation.flawCredit)}
        </p>
      </SheetCard>
      <label>
        <input
          type="checkbox"
          checked={c.showUnavailableSources}
          disabled={locked}
          onChange={(e) => patch({ showUnavailableSources: e.target.checked })}
        />{' '}
        Show unavailable options
      </label>
      {(c.characterType === 'wyrm-aligned' ||
        c.creation.restrictedSelection) && (
        <label>
          <input
            type="checkbox"
            checked={c.creation.matureContent}
            disabled={locked}
            onChange={(e) =>
              patch({
                creation: { ...c.creation, matureContent: e.target.checked },
              })
            }
          />{' '}
          Enable mature content
        </label>
      )}
      {issues.map((x) => (
        <SheetNotice key={x} tone="warning">
          {x}
        </SheetNotice>
      ))}
      {issues.length > 0 && (
        <SheetCard density="compact">
          <SheetField label="Storyteller approval reason">
            <textarea
              value={reason}
              disabled={locked}
              onChange={(e) => setReason(e.target.value)}
            />
          </SheetField>
          <button
            className="secondary-button"
            disabled={locked || !reason.trim()}
            onClick={() => {
              const approvedAt = new Date().toISOString();
              patch({
                creation: {
                  ...c.creation,
                  approvals: [
                    ...c.creation.approvals,
                    ...issues.map((ruleId) => ({
                      id: crypto.randomUUID(),
                      ruleId,
                      reason: reason.trim(),
                      approvedAt,
                    })),
                  ],
                },
              });
              setReason('');
            }}
          >
            Storyteller Approve listed exceptions
          </button>
        </SheetCard>
      )}
      <SheetToolbar>
        <button
          className="primary-button"
          disabled={locked || issues.length > 0}
          onClick={() =>
            patch({
              mode: 'play',
              creation: {
                ...c.creation,
                status: 'finalized',
                finalizedAt: new Date().toISOString(),
                baseline: {
                  attributes: c.attributes,
                  abilities: c.abilities,
                  backgrounds: c.backgrounds,
                  gifts: c.gifts,
                },
              },
            })
          }
        >
          Finalize {c.characterType.replace('-', ' ')}
        </button>
      </SheetToolbar>
    </div>
  );
}
