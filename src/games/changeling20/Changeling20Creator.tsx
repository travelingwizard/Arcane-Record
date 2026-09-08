import { useState } from 'react';
import {
  SheetCard,
  SheetField,
  SheetFieldGrid,
  SheetNotice,
  SheetToolbar,
} from '../../components/layout/SheetPrimitives';
import {
  catalogEntry,
  c20Houses,
  c20Kiths,
  c20Legacies,
  c20Thresholds,
} from './catalog';
import { C20_CREATION_BUDGETS, c20CreationIssues, sumRatings } from './rules';
import type { Changeling20Character } from './schema';

export function Changeling20Creator({
  character: c,
  onChange,
  locked,
}: {
  character: Changeling20Character;
  onChange: (c: Changeling20Character) => void;
  locked: boolean;
}) {
  const [approvalReason, setApprovalReason] = useState('');
  const issues = c20CreationIssues(c);
  const choose = (
    key:
      | 'kithId'
      | 'houseId'
      | 'seelieLegacyId'
      | 'unseelieLegacyId'
      | 'thresholdId',
    value: string,
  ) => onChange({ ...c, [key]: value || null });
  const profileNeedsApproval =
    c.profile === 'dauntain' || c.profile === 'thallain';
  return (
    <div className="character-creator">
      <SheetNotice tone="info">
        This adaptive creator uses the selected character family’s verified
        procedure. Objective exceptions are recorded; fictional suitability
        remains the Storyteller’s decision. C20, pp. 139–150.
      </SheetNotice>
      <SheetFieldGrid columns={3}>
        <SheetField label="Character family">
          <select
            value={c.profile}
            disabled={locked}
            onChange={(event) =>
              onChange({
                ...c,
                profile: event.target.value as Changeling20Character['profile'],
              })
            }
          >
            <option value="kithain">Standard Kithain</option>
            <option value="other-kith">C20 Other Kith</option>
            <option value="nunnehi">Nunnehi</option>
            <option value="menehune">Menehune</option>
            <option value="hsien">Hsien</option>
            <option value="inanimae">Inanimae</option>
            <option value="adhene">Adhene / Denizen</option>
            <option value="kinain">Kinain</option>
            <option value="enchanted">Permanently Enchanted mortal</option>
            <option value="dauntain">Dauntain — mature / approval</option>
            <option value="thallain">Thallain — mature / approval</option>
          </select>
        </SheetField>
        <SheetField label="Kith / heritage">
          <select
            value={c.kithId ?? ''}
            disabled={locked || c.profile === 'enchanted'}
            onChange={(event) => choose('kithId', event.target.value)}
          >
            <option value="">Choose…</option>
            {c20Kiths.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Seeming">
          <select
            value={c.seeming}
            disabled={
              locked || c.profile === 'kinain' || c.profile === 'enchanted'
            }
            onChange={(event) =>
              onChange({
                ...c,
                seeming: event.target.value as Changeling20Character['seeming'],
              })
            }
          >
            <option value="childling">Childling</option>
            <option value="wilder">Wilder</option>
            <option value="grump">Grump</option>
          </select>
        </SheetField>
        <SheetField label="Seelie Legacy">
          <select
            value={c.seelieLegacyId ?? ''}
            disabled={locked}
            onChange={(event) => choose('seelieLegacyId', event.target.value)}
          >
            <option value="">Choose…</option>
            {c20Legacies.slice(0, 14).map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Unseelie Legacy">
          <select
            value={c.unseelieLegacyId ?? ''}
            disabled={locked}
            onChange={(event) => choose('unseelieLegacyId', event.target.value)}
          >
            <option value="">Choose…</option>
            {c20Legacies.slice(14).map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="House">
          <select
            value={c.houseId ?? ''}
            disabled={locked}
            onChange={(event) => choose('houseId', event.target.value)}
          >
            <option value="">Unaffiliated</option>
            {c20Houses.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Threshold">
          <select
            value={c.thresholdId ?? ''}
            disabled={locked}
            onChange={(event) => choose('thresholdId', event.target.value)}
          >
            <option value="">Choose…</option>
            {c20Thresholds.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Antithesis">
          <input
            value={c.antithesis}
            readOnly={locked}
            onChange={(event) =>
              onChange({ ...c, antithesis: event.target.value })
            }
          />
        </SheetField>
      </SheetFieldGrid>
      <SheetCard density="compact">
        <strong>Creation budgets</strong>
        <p>
          Attributes {C20_CREATION_BUDGETS.attributes.join('/')} · Abilities{' '}
          {C20_CREATION_BUDGETS.abilities.join('/')} · Backgrounds{' '}
          {sumRatings(c.backgrounds)}/5 · Arts {sumRatings(c.arts)}/3 · Realms{' '}
          {sumRatings(c.realms)}/5 · Freebies {c.creation.freebieSpent}/
          {C20_CREATION_BUDGETS.freebies + Math.min(7, c.creation.flawCredit)}
        </p>
        <small>
          {catalogEntry(c.kithId)?.summary ??
            'Choose a Kith or record the alternate family details in Notes.'}
        </small>
      </SheetCard>
      {profileNeedsApproval && (
        <label>
          <input
            type="checkbox"
            disabled={locked}
            checked={c.creation.matureContent}
            onChange={(event) =>
              onChange({
                ...c,
                creation: {
                  ...c.creation,
                  matureContent: event.target.checked,
                },
              })
            }
          />{' '}
          Mature-content source enabled
        </label>
      )}
      {issues.map((issue) => (
        <SheetNotice key={issue} tone="warning">
          {issue}
        </SheetNotice>
      ))}
      {issues.length > 0 && (
        <SheetCard density="compact">
          <SheetField label="Storyteller approval reason">
            <textarea
              value={approvalReason}
              disabled={locked}
              onChange={(event) => setApprovalReason(event.target.value)}
            />
          </SheetField>
          <button
            className="secondary-button"
            disabled={locked || !approvalReason.trim()}
            onClick={() => {
              const approvedAt = new Date().toISOString();
              onChange({
                ...c,
                creation: {
                  ...c.creation,
                  approvals: [
                    ...c.creation.approvals,
                    ...issues.map((ruleId) => ({
                      id: crypto.randomUUID(),
                      ruleId,
                      reason: approvalReason.trim(),
                      approvedAt,
                    })),
                  ],
                },
              });
              setApprovalReason('');
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
            onChange({
              ...c,
              mode: 'play',
              creation: {
                ...c.creation,
                status: 'finalized',
                finalizedAt: new Date().toISOString(),
                baseline: {
                  attributes: c.attributes,
                  abilities: c.abilities,
                  backgrounds: c.backgrounds,
                  arts: c.arts,
                  realms: c.realms,
                },
              },
            })
          }
        >
          Finalize character
        </button>
        <small>Finalization records a baseline and enters Play mode.</small>
      </SheetToolbar>
    </div>
  );
}
