import { useEffect, useState, type ReactNode } from 'react';
import {
  SheetCard,
  SheetFieldGrid,
  SheetNotice,
} from '../../components/layout/SheetPrimitives';
import type { GameCharacterEditorProps } from '../game-system';
import { LocalSheet, TextField, useLocalSheet } from '../shared/LocalSheet';
import { backgrounds } from './catalog';
import {
  characterGroups,
  characterSections,
  DITV_SOURCE_ID,
} from './definitions';
import {
  ConflictList,
  DiceEditor,
  NumberField,
  RatedList,
} from './DitvControls';
import { DitvTownLinkService } from './link-service';
import {
  addDice,
  creationIssues,
  emptyDice,
  falloutSummary,
  formatDice,
  rollPool,
  sumRatedDice,
} from './rules';
import { ditvCharacterSchema, type DitvCharacter } from './schema';

const now = () => new Date().toISOString();
export function DitvCharacterEditor(
  props: GameCharacterEditorProps<DitvCharacter>,
) {
  const sheet = useLocalSheet(props, ditvCharacterSchema, (c) =>
    new DitvTownLinkService(props.repository).prepareExport(c),
  );
  const c = sheet.draft,
    locked = c.mode === 'play',
    issues = creationIssues(c);
  const remainingIssues = issues.filter(
    (issue) =>
      !c.creation.approvals.some((approval) => approval.ruleId === issue),
  );
  const [approvalIssue, setApprovalIssue] = useState('');
  const [approvalReason, setApprovalReason] = useState('');
  const set = <K extends keyof DitvCharacter>(
    key: K,
    value: DitvCharacter[K],
  ) => sheet.update({ ...c, [key]: value });
  const [towns, setTowns] = useState<{ id: string; name: string }[]>([]);
  useEffect(() => {
    void new DitvTownLinkService(props.repository)
      .list()
      .then((records) =>
        setTowns(records.map((r) => ({ id: r.id, name: r.name }))),
      );
  }, [props.repository]);
  const changeBackground = (id: string) => {
    const b = backgrounds.find((x) => x.id === id);
    if (!b) return;
    sheet.update({
      ...c,
      creation: { ...c.creation, backgroundId: id },
      stats: { acuity: 2, body: 2, heart: 2, will: b.statD6 - 6 },
      traits: [],
      relationships: [],
      availableRelationshipDice: { ...b.relationships },
    });
  };
  const content: Record<string, ReactNode> = {
    character: (
      <>
        <SheetNotice
          tone={c.creation.status === 'finalized' ? 'success' : 'info'}
        >
          <strong>
            {c.creation.status === 'manual'
              ? 'Manual character sheet'
              : 'Guided character creation'}
          </strong>
          <p>
            {c.creation.status === 'draft'
              ? `Step ${c.creation.step} of 6. Complete the highlighted creation checks, then resolve initiation.`
              : c.creation.status === 'finalized'
                ? 'Creation finalized. Play changes remain separate from the stored baseline.'
                : 'No creation history is inferred for this sheet.'}
          </p>
          {c.creation.status === 'draft' && (
            <div className="sheet-toolbar">
              <button
                className="secondary-button"
                disabled={c.creation.step === 1}
                onClick={() =>
                  sheet.update({
                    ...c,
                    creation: { ...c.creation, step: c.creation.step - 1 },
                  })
                }
              >
                Previous step
              </button>
              <button
                className="secondary-button"
                disabled={c.creation.step === 6}
                onClick={() =>
                  sheet.update({
                    ...c,
                    creation: { ...c.creation, step: c.creation.step + 1 },
                  })
                }
              >
                Next step
              </button>
            </div>
          )}
        </SheetNotice>
        <SheetFieldGrid columns={3}>
          <TextField
            label="Name"
            value={c.name}
            multiline={false}
            locked={locked}
            onChange={(v) => set('name', v)}
          />
          <TextField
            label="Player"
            value={c.player}
            multiline={false}
            locked={locked}
            onChange={(v) => set('player', v)}
          />
          <TextField
            label="Pronouns"
            value={c.pronouns}
            multiline={false}
            locked={locked}
            onChange={(v) => set('pronouns', v)}
          />
          <TextField
            label="Home branch"
            value={c.homeBranch}
            locked={locked}
            onChange={(v) => set('homeBranch', v)}
          />
          <TextField
            label="Route"
            value={c.route}
            locked={locked}
            onChange={(v) => set('route', v)}
          />
        </SheetFieldGrid>
        <TextField
          label="Background narrative"
          value={c.background}
          locked={locked}
          onChange={(v) => set('background', v)}
        />
      </>
    ),
    stats: (
      <>
        <label className="sheet-field field">
          <span>Creation Background</span>
          <select
            disabled={locked}
            value={c.creation.backgroundId}
            onChange={(e) => changeBackground(e.target.value)}
          >
            <option value="">Manual</option>
            {backgrounds.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <div className="sheet-field-grid sheet-field-grid--four">
          {(Object.keys(c.stats) as (keyof typeof c.stats)[]).map((k) => (
            <NumberField
              key={k}
              label={`${k} (d6)`}
              value={c.stats[k]}
              locked={locked}
              max={30}
              onChange={(v) => set('stats', { ...c.stats, [k]: v })}
            />
          ))}
        </div>
      </>
    ),
    traits: (
      <RatedList
        title="Trait"
        records={c.traits}
        locked={locked}
        onChange={(v) => set('traits', v as DitvCharacter['traits'])}
      />
    ),
    relationships: (
      <RatedList
        title="Relationship"
        relationship
        records={c.relationships}
        locked={locked}
        onChange={(v) =>
          set('relationships', v as DitvCharacter['relationships'])
        }
      />
    ),
    available: (
      <>
        <DiceEditor
          label="Unassigned Relationship dice"
          value={c.availableRelationshipDice}
          locked={locked}
          onChange={(v) => set('availableRelationshipDice', v)}
        />
        <p>
          Assigned creation dice:{' '}
          {formatDice(
            sumRatedDice(
              c.relationships.filter(
                (x) => x.kind !== 'blood' && x.origin === 'creation',
              ),
            ),
          )}
        </p>
      </>
    ),
    belongings: (
      <div className="sheet-stack">
        <TextField
          label="Coat description"
          value={c.coatDescription}
          onChange={(v) => set('coatDescription', v)}
        />
        <button
          className="secondary-button"
          disabled={locked}
          onClick={() =>
            set('belongings', [
              ...c.belongings,
              {
                id: crypto.randomUUID(),
                name: '',
                dice: { d4: 0, d6: 1, d8: 0, d10: 0 },
                notes: '',
                origin: 'custom',
                temporaryUntilConflict: false,
                sourceId: DITV_SOURCE_ID,
                page: 27,
                kind: 'other',
                quality: 'normal',
                state: 'carried',
              },
            ])
          }
        >
          Add belonging
        </button>
        {c.belongings.map((b, i) => (
          <SheetCard key={b.id} density="compact">
            <SheetFieldGrid columns={3}>
              <TextField
                label="Belonging"
                value={b.name}
                multiline={false}
                locked={locked}
                onChange={(name) =>
                  set(
                    'belongings',
                    c.belongings.map((x, n) => (n === i ? { ...x, name } : x)),
                  )
                }
              />
              <label className="sheet-field field">
                <span>State</span>
                <select
                  value={b.state}
                  onChange={(e) =>
                    set(
                      'belongings',
                      c.belongings.map((x, n) =>
                        n === i
                          ? { ...x, state: e.target.value as typeof b.state }
                          : x,
                      ),
                    )
                  }
                >
                  {['carried', 'ready', 'damaged', 'lost'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <DiceEditor
                value={b.dice}
                locked={locked}
                onChange={(dice) =>
                  set(
                    'belongings',
                    c.belongings.map((x, n) => (n === i ? { ...x, dice } : x)),
                  )
                }
              />
            </SheetFieldGrid>
          </SheetCard>
        ))}
      </div>
    ),
    initiation: (
      <>
        <TextField
          label="I hope my character accomplished…"
          value={c.creation.hopedAccomplishment}
          locked={locked}
          onChange={(v) =>
            sheet.update({
              ...c,
              creation: { ...c.creation, hopedAccomplishment: v },
            })
          }
        />
        <button
          className="primary-button"
          disabled={
            locked ||
            !c.creation.hopedAccomplishment.trim() ||
            Boolean(c.creation.initiationTraitId)
          }
          onClick={() => {
            const trait = {
              id: crypto.randomUUID(),
              name: c.creation.hopedAccomplishment,
              dice: { d4: 0, d6: 1, d8: 0, d10: 0 },
              notes: 'Initiation outcome',
              origin: 'initiation' as const,
              temporaryUntilConflict: false,
              sourceId: DITV_SOURCE_ID,
              page: 30,
            };
            sheet.update({
              ...c,
              traits: [...c.traits, trait],
              creation: { ...c.creation, initiationTraitId: trait.id },
            });
          }}
        >
          Record resolved initiation as 1d6 Trait
        </button>
        <SheetNotice>
          Resolve the accomplishment through the conflict workspace. Winning or
          losing changes the wording, not the 1d6 result.
        </SheetNotice>
      </>
    ),
    conflicts: (
      <ConflictList
        conflicts={c.conflicts}
        onChange={(v) => set('conflicts', v)}
        character={c}
      />
    ),
    fallout: (
      <>
        <button
          className="secondary-button"
          disabled={!c.conflicts.length}
          onClick={() => {
            const latest = c.conflicts.at(-1)!;
            const pool = latest.participants.reduce(
                (a, p) => addDice(a, p.fallout),
                emptyDice(),
              ),
              results = rollPool(pool).map((x) => x.value),
              summary = falloutSummary(results);
            set('fallout', [
              ...c.fallout,
              {
                id: crypto.randomUUID(),
                conflictId: latest.id,
                dice: pool,
                results,
                sum: summary.sum,
                ones: summary.ones,
                consequence: '',
                experienceChoice: '',
                applied: false,
                createdAt: now(),
              },
            ]);
          }}
        >
          Roll latest Fallout
        </button>
        {c.fallout.map((f, i) => (
          <SheetCard key={f.id}>
            <h3>Fallout {f.sum}</h3>
            <p>
              {f.results.join(', ') || 'No dice'} ·{' '}
              {f.sum < 8
                ? 'short-term'
                : f.sum < 12
                  ? 'lasting'
                  : f.sum < 16
                    ? 'injured'
                    : f.sum < 20
                      ? 'badly injured'
                      : 'death'}{' '}
              · {f.ones} one(s)
            </p>
            <TextField
              label="Chosen consequence"
              value={f.consequence}
              onChange={(v) =>
                set(
                  'fallout',
                  c.fallout.map((x, n) =>
                    n === i ? { ...x, consequence: v } : x,
                  ),
                )
              }
            />
            {f.ones > 0 && (
              <TextField
                label="Experience choice"
                value={f.experienceChoice}
                onChange={(v) =>
                  set(
                    'fallout',
                    c.fallout.map((x, n) =>
                      n === i ? { ...x, experienceChoice: v } : x,
                    ),
                  )
                }
              />
            )}
          </SheetCard>
        ))}
      </>
    ),
    'between-towns': (
      <>
        <TextField
          label="Reflection"
          value={c.betweenTowns.reflection}
          onChange={(v) =>
            set('betweenTowns', { ...c.betweenTowns, reflection: v })
          }
        />
        <TextField
          label="Reflection / experience change"
          value={c.betweenTowns.falloutChoice}
          onChange={(v) =>
            set('betweenTowns', { ...c.betweenTowns, falloutChoice: v })
          }
        />
        <TextField
          label="Relationship dice or coat change"
          value={c.betweenTowns.relationshipChoice}
          onChange={(v) =>
            set('betweenTowns', { ...c.betweenTowns, relationshipChoice: v })
          }
        />
        <TextField
          label="Direction"
          value={c.betweenTowns.direction}
          onChange={(v) =>
            set('betweenTowns', { ...c.betweenTowns, direction: v })
          }
        />
        <button
          className="primary-button"
          disabled={c.betweenTowns.applied}
          onClick={() =>
            sheet.update({
              ...c,
              betweenTowns: { ...c.betweenTowns, applied: true },
              history: [
                ...c.history,
                {
                  id: crypto.randomUUID(),
                  kind: 'reflection',
                  title: 'Between-town reflection',
                  description: c.betweenTowns.reflection,
                  createdAt: now(),
                },
              ],
            })
          }
        >
          Record reflection
        </button>
      </>
    ),
    records: (
      <>
        <label className="sheet-field field">
          <span>Linked Town</span>
          <select
            value={c.town.kind === 'linked' ? c.town.townId : ''}
            onChange={(e) =>
              void (e.target.value
                ? new DitvTownLinkService(props.repository)
                    .link(c, e.target.value)
                    .then(sheet.update)
                : sheet.update({
                    ...c,
                    town: { kind: 'none', snapshot: c.town.snapshot },
                  }))
            }
          >
            <option value="">Unlinked</option>
            {towns.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name}
              </option>
            ))}
          </select>
        </label>
        <TextField
          label="Notes"
          value={c.notes}
          onChange={(v) => set('notes', v)}
        />
        {remainingIssues.length > 0 && (
          <SheetNotice tone="warning">
            <strong>Creation checks</strong>
            <ul>
              {remainingIssues.map((x) => (
                <li key={x}>{x}</li>
              ))}
            </ul>
            <label className="sheet-field field">
              <span>Group-approved exception</span>
              <select
                value={approvalIssue}
                onChange={(e) => setApprovalIssue(e.target.value)}
              >
                <option value="">Choose a check</option>
                {remainingIssues.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </label>
            <TextField
              label="Why the group approved this exception"
              value={approvalReason}
              onChange={setApprovalReason}
            />
            <button
              className="secondary-button"
              disabled={!approvalIssue || !approvalReason.trim()}
              onClick={() => {
                sheet.update({
                  ...c,
                  creation: {
                    ...c.creation,
                    approvals: [
                      ...c.creation.approvals,
                      {
                        id: crypto.randomUUID(),
                        ruleId: approvalIssue,
                        reason: approvalReason.trim(),
                        approvedAt: now(),
                      },
                    ],
                  },
                });
                setApprovalIssue('');
                setApprovalReason('');
              }}
            >
              Record approval
            </button>
          </SheetNotice>
        )}
        <button
          className="primary-button"
          disabled={locked || remainingIssues.length > 0}
          onClick={() =>
            sheet.update({
              ...c,
              mode: 'play',
              creation: {
                ...c.creation,
                status: 'finalized',
                baseline: structuredClone(c),
                finalizedAt: now(),
              },
            })
          }
        >
          Finalize character
        </button>
      </>
    ),
  };
  return (
    <LocalSheet
      title="Dogs in the Vineyard"
      name={c.name}
      mode={c.mode}
      onMode={(v) => set('mode', v)}
      order={c.layout[c.mode]}
      onOrder={(order) =>
        sheet.update({ ...c, layout: { ...c.layout, [c.mode]: order } })
      }
      sections={characterSections}
      groups={characterGroups}
      content={content}
      status={sheet.status}
      onBack={() => void props.onBack()}
      onSave={() => void sheet.save()}
      settings={
        <>
          <button
            className="secondary-button"
            onClick={() => void sheet.download('json')}
          >
            Save JSON
          </button>
          <button
            className="secondary-button"
            onClick={() => void sheet.download('yaml')}
          >
            Save YAML
          </button>
        </>
      }
    />
  );
}
