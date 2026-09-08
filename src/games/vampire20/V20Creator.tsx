import { useState } from 'react';
import {
  SheetCard,
  SheetField,
  SheetFieldGrid,
  SheetNotice,
  SheetToolbar,
} from '../../components/layout/SheetPrimitives';
import {
  v20Archetypes,
  v20Bloodlines,
  v20Clans,
  v20Roads,
  v20RevenantFamilies,
  findV20Entry,
} from './catalog';
import {
  bloodLimits,
  v20CreationIssues,
  v20CreationBudgets,
  generationFromBackground,
  startingBlood,
  sumV20Ratings,
} from './rules';
import type { V20Character } from './schema';

export function V20Creator({
  character: c,
  onChange,
  locked,
}: {
  character: V20Character;
  onChange: (value: V20Character) => void;
  locked: boolean;
}) {
  const [approvalReason, setApprovalReason] = useState('');
  const issues = v20CreationIssues(c);
  const budgets = v20CreationBudgets(c);
  const options = [...v20Clans, ...v20Bloodlines].filter(
    (entry) =>
      !entry.restricted || c.showUnavailableSources || c.lineageId === entry.id,
  );
  const selectLineage = (lineageId: string) => {
    const selected = findV20Entry(lineageId);
    const nosferatu = selected?.name === 'Nosferatu';
    onChange({
      ...c,
      lineageId: lineageId || null,
      creation: {
        ...c.creation,
        restrictedSelection: Boolean(selected?.restricted),
      },
      attributes: c.attributes.map((trait) =>
        trait.name === 'Appearance'
          ? { ...trait, rating: nosferatu ? 0 : Math.max(1, trait.rating) }
          : trait,
      ),
      clanWeakness: selected
        ? `Record the verified ${selected.name} weakness and its table-specific details.`
        : '',
    });
  };
  const updateGeneration = (rating: number) => {
    const generation = generationFromBackground(rating),
      limits = bloodLimits(generation);
    onChange({
      ...c,
      generation,
      blood: {
        current: Math.min(c.blood.current, limits.maximum),
        maximum: limits.maximum,
        perTurn: limits.perTurn,
      },
      backgrounds: c.backgrounds.map((trait) =>
        trait.name === 'Generation' ? { ...trait, rating } : trait,
      ),
    });
  };
  const rollBlood = () => {
    const die = (crypto.getRandomValues(new Uint32Array(1))[0]! % 10) + 1;
    const domain =
      c.backgrounds.find(({ name }) => name === 'Domain')?.rating ?? 0;
    const herd = c.backgrounds.find(({ name }) => name === 'Herd')?.rating ?? 0;
    const total = startingBlood(die, domain, herd, c.blood.maximum);
    onChange({
      ...c,
      blood: { ...c.blood, current: total },
      creation: {
        ...c.creation,
        rolls: [
          ...c.creation.rolls,
          {
            id: crypto.randomUUID(),
            kind: 'starting-blood',
            method: 'rolled',
            dice: [die],
            modifier: domain + herd,
            total,
            resultId: null,
            createdAt: new Date().toISOString(),
          },
        ],
      },
    });
  };
  return (
    <div className="character-creator">
      <SheetNotice tone="info">
        Build a {c.characterType} with the published five-step process. V20, pp.
        79–86; Ghouls &amp; Revenants, pp. 115–121.
      </SheetNotice>
      <SheetFieldGrid columns={3}>
        {c.characterType === 'vampire' && (
          <SheetField label="Clan or bloodline">
            <select
              value={c.lineageId ?? ''}
              disabled={locked}
              onChange={(e) => selectLineage(e.target.value)}
            >
              <option value="">Choose…</option>
              {options.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                  {entry.restricted ? ' — restricted' : ''}
                </option>
              ))}
            </select>
          </SheetField>
        )}
        {c.characterType === 'ghoul' && (
          <SheetField label="Ghoul type">
            <select
              value={c.ghoulType ?? 'vassal'}
              disabled={locked}
              onChange={(e) =>
                onChange({
                  ...c,
                  ghoulType: e.target.value as 'vassal' | 'independent',
                })
              }
            >
              <option value="vassal">Vassal ghoul</option>
              <option value="independent">Independent ghoul</option>
            </select>
          </SheetField>
        )}
        {c.characterType === 'revenant' && (
          <SheetField label="Revenant family">
            <select
              value={c.revenantFamilyId ?? ''}
              disabled={locked}
              onChange={(e) =>
                onChange({ ...c, revenantFamilyId: e.target.value || null })
              }
            >
              <option value="">Choose…</option>
              {v20RevenantFamilies.map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
            </select>
          </SheetField>
        )}
        <SheetField label="Humanity or Path">
          <select
            value={c.roadId ?? ''}
            disabled={locked}
            onChange={(e) => onChange({ ...c, roadId: e.target.value || null })}
          >
            <option value="">Choose…</option>
            {v20Roads
              .filter(
                (entry) =>
                  !entry.restricted ||
                  c.showUnavailableSources ||
                  c.roadId === entry.id,
              )
              .map((entry) => (
                <option key={entry.id} value={entry.id}>
                  {entry.name}
                </option>
              ))}
          </select>
        </SheetField>
        <SheetField label="Nature">
          <select
            value={c.natureId ?? ''}
            disabled={locked}
            onChange={(e) =>
              onChange({ ...c, natureId: e.target.value || null })
            }
          >
            <option value="">Choose…</option>
            {v20Archetypes.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Demeanor">
          <select
            value={c.demeanorId ?? ''}
            disabled={locked}
            onChange={(e) =>
              onChange({ ...c, demeanorId: e.target.value || null })
            }
          >
            <option value="">Choose…</option>
            {v20Archetypes.map((entry) => (
              <option key={entry.id} value={entry.id}>
                {entry.name}
              </option>
            ))}
          </select>
        </SheetField>
        {c.characterType === 'vampire' && (
          <SheetField label="Generation Background">
            <input
              type="number"
              min="0"
              max="5"
              value={
                c.backgrounds.find(({ name }) => name === 'Generation')
                  ?.rating ?? 0
              }
              disabled={locked}
              onChange={(e) =>
                updateGeneration(
                  Math.max(0, Math.min(5, Number(e.target.value) || 0)),
                )
              }
            />
          </SheetField>
        )}
        <SheetField label="Starting Blood Pool">
          <input
            type="number"
            min="0"
            max={c.blood.maximum}
            value={c.blood.current}
            disabled={locked}
            onChange={(e) =>
              onChange({
                ...c,
                blood: {
                  ...c.blood,
                  current: Math.max(
                    0,
                    Math.min(c.blood.maximum, Number(e.target.value) || 0),
                  ),
                },
                creation: {
                  ...c.creation,
                  rolls: [
                    ...c.creation.rolls,
                    {
                      id: crypto.randomUUID(),
                      kind: 'starting-blood',
                      method: 'manual',
                      dice: [],
                      modifier: 0,
                      total: Number(e.target.value) || 0,
                      resultId: null,
                      createdAt: new Date().toISOString(),
                    },
                  ],
                },
              })
            }
          />
        </SheetField>
      </SheetFieldGrid>
      <SheetToolbar>
        {c.characterType === 'vampire' && (
          <button
            className="secondary-button"
            disabled={locked}
            onClick={rollBlood}
          >
            Roll starting Blood Pool (d10 + Domain + Herd)
          </button>
        )}
        <span>
          {c.characterType === 'vampire'
            ? `Generation ${c.generation}`
            : 'Starts with one Blood Point'}{' '}
          · maximum {c.blood.maximum} · {c.blood.perTurn}/turn
        </span>
      </SheetToolbar>
      <SheetCard density="compact">
        <strong>Creation budgets</strong>
        <p>
          Attributes {budgets.attributes.join('/')} · Abilities{' '}
          {budgets.abilities.join('/')} · Disciplines{' '}
          {sumV20Ratings(c.disciplines)}/{budgets.disciplines} · Backgrounds{' '}
          {sumV20Ratings(c.backgrounds)}/5 · Virtue additions{' '}
          {sumV20Ratings(c.virtues) - 3}/{budgets.virtues} · Freebies{' '}
          {c.creation.freebieSpent}/
          {budgets.freebies + Math.min(7, c.creation.flawCredit)}
        </p>
      </SheetCard>
      <label>
        <input
          type="checkbox"
          checked={c.showUnavailableSources}
          disabled={locked}
          onChange={(e) =>
            onChange({ ...c, showUnavailableSources: e.target.checked })
          }
        />{' '}
        Show unavailable options
      </label>
      {c.creation.restrictedSelection && (
        <label>
          <input
            type="checkbox"
            checked={c.creation.matureContent}
            disabled={locked}
            onChange={(e) =>
              onChange({
                ...c,
                creation: { ...c.creation, matureContent: e.target.checked },
              })
            }
          />{' '}
          Enable mature content
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
              onChange={(e) => setApprovalReason(e.target.value)}
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
      <button
        className="primary-button"
        disabled={locked || issues.length > 0}
        onClick={() =>
          onChange({
            ...c,
            mode: 'play',
            willpower: {
              permanent: c.virtues[2]?.rating ?? 1,
              current: c.virtues[2]?.rating ?? 1,
            },
            roadRating:
              (c.virtues[0]?.rating ?? 1) + (c.virtues[1]?.rating ?? 1),
            creation: {
              ...c.creation,
              status: 'finalized',
              finalizedAt: new Date().toISOString(),
              baseline: {
                attributes: c.attributes,
                abilities: c.abilities,
                disciplines: c.disciplines,
                backgrounds: c.backgrounds,
                virtues: c.virtues,
              },
            },
          })
        }
      >
        Finalize {c.characterType}
      </button>
    </div>
  );
}
