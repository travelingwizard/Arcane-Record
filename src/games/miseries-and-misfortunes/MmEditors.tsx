import {
  SheetCard,
  SheetEmptyState,
  SheetField,
  SheetFieldGrid,
  SheetNotice,
  SheetToolbar,
} from '../../components/layout/SheetPrimitives';
import type { GameCharacterEditorProps } from '../game-system';
import { LocalSheet, TextField, useLocalSheet } from '../shared/LocalSheet';
import {
  abilities,
  equipment,
  lifepaths,
  lifestyles,
  practices,
} from './catalog';
import {
  campaignGroups,
  campaignSections,
  characterGroups,
  characterSections,
} from './definitions';
import { MmCampaignLinkService } from './link-service';
import { creationIssues, rollDice } from './rules';
import {
  mmCampaignSchema,
  mmCharacterSchema,
  type MmCampaign,
  type MmCharacter,
} from './schema';
import { mmSources } from './sources';
const Num = ({
  label,
  value,
  onChange,
  max = 999,
  locked = false,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max?: number;
  locked?: boolean;
}) => (
  <SheetField label={label}>
    <input
      type="number"
      min={0}
      max={max}
      value={value}
      disabled={locked}
      onChange={(e) => onChange(Number(e.target.value))}
    />
  </SheetField>
);
const Select = ({
  label,
  value,
  onChange,
  options,
  locked = false,
}: {
  label: string;
  value: string;
  onChange: (x: string) => void;
  options: { id: string; name: string }[];
  locked?: boolean;
}) => (
  <SheetField label={label}>
    <select
      value={value}
      disabled={locked}
      onChange={(e) => onChange(e.target.value)}
    >
      <option value="">Choose…</option>
      {options.map((x) => (
        <option key={x.id} value={x.id}>
          {x.name}
        </option>
      ))}
    </select>
  </SheetField>
);
function Creator({ c, u }: { c: MmCharacter; u: (x: MmCharacter) => void }) {
  const issues = creationIssues(c);
  const roll = (
    label: string,
    count: number,
    sides: number,
    apply: (n: number) => MmCharacter,
  ) => {
    const dice = rollDice(count, sides),
      total = dice.reduce((a, b) => a + b, 0);
    u({
      ...apply(total),
      rollHistory: [
        {
          id: crypto.randomUUID(),
          label,
          method: 'rolled',
          dice,
          modifier: 0,
          total,
          resultId: '',
          createdAt: new Date().toISOString(),
        },
        ...c.rollHistory,
      ],
    });
  };
  return (
    <SheetCard selected>
      <h3>Guided creation · Step {c.creation.step} of 12</h3>
      <p>
        Generate birth and wealth, mentalities, governing abilities, languages,
        lifepaths, age, measures, reputation, possessions, and formative
        experiences.
      </p>
      <SheetToolbar>
        <button
          className="secondary-button"
          onClick={() =>
            roll('Quality of Birth', 3, 6, (n) => ({
              ...c,
              birth: {
                ...c.birth,
                quality:
                  n <= 5
                    ? 'Marginaux'
                    : n <= 10
                      ? 'Peasant'
                      : n <= 13
                        ? 'Commoner'
                        : n === 14
                          ? 'Artisan'
                          : n === 15
                            ? 'Bourgeoisie'
                            : n === 17
                              ? 'Noblesse de robe'
                              : 'Noblesse d’épée',
              },
            }))
          }
        >
          Roll quality of birth
        </button>
        <button
          className="secondary-button"
          onClick={() => {
            const vals = Object.fromEntries(
              abilities.map((a) => [
                a.name,
                rollDice(3, 6).reduce((x, y) => x + y, 0),
              ]),
            );
            u({
              ...c,
              abilities: vals,
              rollHistory: [
                {
                  id: crypto.randomUUID(),
                  label: 'Governing abilities',
                  method: 'rolled',
                  dice: Object.values(vals),
                  modifier: 0,
                  total: Object.values(vals).reduce((a, b) => a + b, 0),
                  resultId: 'abilities',
                  createdAt: new Date().toISOString(),
                },
                ...c.rollHistory,
              ],
            });
          }}
        >
          Roll abilities in order
        </button>
      </SheetToolbar>
      {issues.length ? (
        <SheetNotice tone="warning">{issues.join(' ')}</SheetNotice>
      ) : (
        <button
          className="primary-button"
          onClick={() =>
            u({
              ...c,
              mode: 'play',
              creation: {
                ...c.creation,
                status: 'finalized',
                baseline: structuredClone(c),
                finalizedAt: new Date().toISOString(),
              },
            })
          }
        >
          Finalize protagonist
        </button>
      )}
    </SheetCard>
  );
}
export function MmCharacterEditor(p: GameCharacterEditorProps<MmCharacter>) {
  const s = useLocalSheet(p, mmCharacterSchema, (c) =>
      new MmCampaignLinkService(p.repository).prepareExport(c),
    ),
    c = s.draft,
    u = s.update,
    locked = c.mode === 'play';
  const content: Record<string, React.ReactNode> = {
    character: (
      <>
        {c.creation.status === 'draft' && <Creator c={c} u={u} />}
        <SheetFieldGrid columns={3}>
          <TextField
            label="Name"
            value={c.name}
            onChange={(name) => u({ ...c, name })}
            locked={locked}
            multiline={false}
          />
          <TextField
            label="Player"
            value={c.player}
            onChange={(player) => u({ ...c, player })}
            multiline={false}
          />
          <TextField
            label="Appearance"
            value={c.appearance}
            onChange={(appearance) => u({ ...c, appearance })}
            locked={locked}
          />
        </SheetFieldGrid>
      </>
    ),
    birth: (
      <SheetFieldGrid columns={3}>
        <TextField
          label="Quality of birth"
          value={c.birth.quality}
          onChange={(quality) => u({ ...c, birth: { ...c.birth, quality } })}
          locked={locked}
        />
        <TextField
          label="Income source"
          value={c.birth.incomeSource}
          onChange={(incomeSource) =>
            u({ ...c, birth: { ...c.birth, incomeSource } })
          }
          locked={locked}
        />
        <TextField
          label="Property"
          value={c.birth.property}
          onChange={(property) => u({ ...c, birth: { ...c.birth, property } })}
          locked={locked}
        />
        <Select
          label="Lifestyle"
          value={c.birth.lifestyle}
          onChange={(lifestyle) =>
            u({ ...c, birth: { ...c.birth, lifestyle } })
          }
          options={lifestyles}
        />
        <Num
          label="Obligations"
          value={c.birth.obligations}
          onChange={(obligations) =>
            u({ ...c, birth: { ...c.birth, obligations } })
          }
        />
      </SheetFieldGrid>
    ),
    abilities: (
      <SheetFieldGrid columns={3}>
        {Object.entries(c.abilities).map(([k, v]) => (
          <Num
            key={k}
            label={k}
            value={v}
            max={19}
            locked={locked}
            onChange={(n) => u({ ...c, abilities: { ...c.abilities, [k]: n } })}
          />
        ))}
      </SheetFieldGrid>
    ),
    skills: (
      <SheetFieldGrid columns={3}>
        {c.skills.map((x, i) => (
          <SheetCard density="compact" key={x.id}>
            <strong>{x.name}</strong>
            <SheetFieldGrid columns={2}>
              <Num
                label="Rating"
                value={x.rating?.numerator ?? 0}
                max={19}
                locked={locked}
                onChange={(numerator) =>
                  u({
                    ...c,
                    skills: c.skills.map((v, j) =>
                      j === i
                        ? {
                            ...v,
                            rating: { numerator, die: v.rating?.die ?? '6' },
                          }
                        : v,
                    ),
                  })
                }
              />
              <SheetField label="Die">
                <select
                  value={x.rating?.die ?? '6'}
                  disabled={locked}
                  onChange={(e) =>
                    u({
                      ...c,
                      skills: c.skills.map((v, j) =>
                        j === i
                          ? {
                              ...v,
                              rating: {
                                numerator: v.rating?.numerator ?? 0,
                                die: e.target.value as
                                  '6' | '8' | '10' | '12' | '20',
                              },
                            }
                          : v,
                      ),
                    })
                  }
                >
                  {['6', '8', '10', '12', '20'].map((d) => (
                    <option key={d}>{d}</option>
                  ))}
                </select>
              </SheetField>
            </SheetFieldGrid>
          </SheetCard>
        ))}
      </SheetFieldGrid>
    ),
    lifepaths: (
      <>
        <Select
          label="Add lifepath"
          value=""
          onChange={(id) => {
            const x = lifepaths.find((v) => v.id === id);
            if (x)
              u({
                ...c,
                lifepaths: [
                  ...c.lifepaths,
                  {
                    id: crypto.randomUUID(),
                    definitionId: x.id,
                    name: x.name,
                    rating: null,
                    sourceId: x.sourceId,
                    page: x.page,
                    notes: x.summary,
                    level: 1,
                    completedConditions: [],
                  },
                ],
              });
          }}
          options={lifepaths}
        />
        {c.lifepaths.length ? (
          c.lifepaths.map((x) => (
            <SheetCard key={x.id}>
              <strong>
                {x.name} · Level {x.level}
              </strong>
              <p>{x.notes}</p>
            </SheetCard>
          ))
        ) : (
          <SheetEmptyState>No lifepaths selected.</SheetEmptyState>
        )}
      </>
    ),
    mentalities: (
      <>
        {[...c.mentalities, ...c.languages].map((x) => (
          <SheetCard density="compact" key={x.id}>
            <strong>{x.name}</strong> {x.rating?.numerator}/{x.rating?.die}
          </SheetCard>
        ))}
        <button
          className="secondary-button"
          disabled={locked}
          onClick={() =>
            u({
              ...c,
              languages: [
                ...c.languages,
                {
                  id: crypto.randomUUID(),
                  definitionId: null,
                  name: 'French',
                  rating: { numerator: 3, die: '6' },
                  sourceId: 'mm.book2',
                  page: 11,
                  notes: '',
                  native: true,
                  literate: true,
                },
              ],
            })
          }
        >
          Add native French
        </button>
      </>
    ),
    reputation: (
      <SheetFieldGrid columns={2}>
        <Num
          label="Reputation"
          value={c.reputation}
          onChange={(reputation) => u({ ...c, reputation })}
        />
        <Num
          label="Precedence"
          value={c.precedence}
          max={10}
          locked={locked}
          onChange={(precedence) => u({ ...c, precedence })}
        />
      </SheetFieldGrid>
    ),
    fortune: (
      <SheetFieldGrid columns={3}>
        <Num
          label="Fortune"
          value={c.fortune}
          onChange={(fortune) => u({ ...c, fortune })}
        />
        <Num
          label="Mortal Coil"
          value={c.mortalCoil}
          onChange={(mortalCoil) => u({ ...c, mortalCoil })}
        />
        <Num
          label="Will"
          value={c.will}
          onChange={(will) => u({ ...c, will })}
        />
      </SheetFieldGrid>
    ),
    virtues: (
      <SheetNotice>
        Virtues and Flaws are recorded with their embodiment and play history;
        interpretation remains with the table.
      </SheetNotice>
    ),
    sacred: (
      <>
        <Num
          label="Gnosis"
          value={c.gnosis}
          onChange={(gnosis) => u({ ...c, gnosis })}
        />
        {practices.map((x) => (
          <SheetCard density="compact" key={x.id}>
            <strong>{x.name}</strong>
            <p>{x.summary}</p>
          </SheetCard>
        ))}
      </>
    ),
    equipment: (
      <>
        {equipment.map((x) => (
          <button
            className="secondary-button"
            key={x.id}
            disabled={locked}
            onClick={() =>
              u({
                ...c,
                equipment: [
                  ...c.equipment,
                  {
                    id: crypto.randomUUID(),
                    definitionId: x.id,
                    name: x.name,
                    rating: null,
                    sourceId: x.sourceId,
                    page: x.page,
                    notes: x.summary,
                    quantity: 1,
                    state: 'carried',
                  },
                ],
              })
            }
          >
            Add {x.name}
          </button>
        ))}
      </>
    ),
    combat: (
      <SheetFieldGrid columns={3}>
        <Num
          label="Hit points"
          value={c.hitPoints.current}
          onChange={(current) =>
            u({ ...c, hitPoints: { ...c.hitPoints, current } })
          }
        />
        <Num
          label="Defense"
          value={c.defense}
          locked={locked}
          onChange={(defense) => u({ ...c, defense })}
        />
        <Num
          label="Dodge"
          value={c.dodge}
          locked={locked}
          onChange={(dodge) => u({ ...c, dodge })}
        />
        <Num
          label="Morale"
          value={c.morale}
          onChange={(morale) => u({ ...c, morale })}
        />
      </SheetFieldGrid>
    ),
    advancement: (
      <>
        <button
          className="secondary-button"
          onClick={() =>
            u({
              ...c,
              advancement: [
                {
                  id: crypto.randomUUID(),
                  kind: 'experience',
                  title: 'Experience condition',
                  description: '',
                  createdAt: new Date().toISOString(),
                },
                ...c.advancement,
              ],
            })
          }
        >
          Record experience condition
        </button>
        {c.advancement.map((x) => (
          <SheetCard key={x.id}>
            <strong>{x.title}</strong>
          </SheetCard>
        ))}
      </>
    ),
    records: (
      <>
        <TextField
          label="Experiences"
          value={c.experiences}
          onChange={(experiences) => u({ ...c, experiences })}
        />
        <TextField
          label="Notes"
          value={c.notes}
          onChange={(notes) => u({ ...c, notes })}
        />
      </>
    ),
  };
  return (
    <LocalSheet
      title="Miseries & Misfortunes"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => u({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) => u({ ...c, layout: { ...c.layout, [c.mode]: order } })}
      sections={characterSections}
      groups={characterGroups}
      content={content}
      status={s.status}
      onBack={() => void p.onBack()}
      onSave={() => void s.save()}
      settings={
        <>
          <h3>Sources</h3>
          {mmSources.map((x) => (
            <label key={x.id}>
              <input
                type="checkbox"
                checked={c.enabledSources.includes(x.id)}
                disabled={x.required}
                onChange={(e) =>
                  u({
                    ...c,
                    enabledSources: e.target.checked
                      ? [...c.enabledSources, x.id]
                      : c.enabledSources.filter((id) => id !== x.id),
                  })
                }
              />{' '}
              {x.title}
            </label>
          ))}
        </>
      }
    />
  );
}
export function MmCampaignEditor(p: GameCharacterEditorProps<MmCampaign>) {
  const s = useLocalSheet(p, mmCampaignSchema),
    c = s.draft,
    u = s.update;
  const add = (kind: string, title: string) => ({
    id: crypto.randomUUID(),
    kind,
    title,
    description: '',
    createdAt: new Date().toISOString(),
  });
  const content: Record<string, React.ReactNode> = {
    campaign: (
      <SheetFieldGrid columns={3}>
        <TextField
          label="Campaign"
          value={c.name}
          onChange={(name) => u({ ...c, name })}
          multiline={false}
        />
        <TextField
          label="GM"
          value={c.gm}
          onChange={(gm) => u({ ...c, gm })}
          multiline={false}
        />
        <Num
          label="Year"
          value={c.year}
          onChange={(year) => u({ ...c, year })}
        />
        <TextField
          label="Location"
          value={c.location}
          onChange={(location) => u({ ...c, location })}
        />
      </SheetFieldGrid>
    ),
    motif: (
      <SheetFieldGrid columns={3}>
        <TextField
          label="Motif"
          value={c.motif.name}
          onChange={(name) => u({ ...c, motif: { ...c.motif, name } })}
        />
        <TextField
          label="Greater purpose"
          value={c.motif.purpose}
          onChange={(purpose) => u({ ...c, motif: { ...c.motif, purpose } })}
        />
        <TextField
          label="Shared values"
          value={c.motif.values}
          onChange={(values) => u({ ...c, motif: { ...c.motif, values } })}
        />
      </SheetFieldGrid>
    ),
    protagonists: (
      <SheetNotice>
        Linked protagonists retain reviewed snapshots. Life expectancy is
        private campaign data and is not shown on the protagonist sheet.
      </SheetNotice>
    ),
    moments: (
      <>
        <button
          className="secondary-button"
          onClick={() =>
            u({ ...c, moments: [add('moment', 'New moment'), ...c.moments] })
          }
        >
          Add moment
        </button>
        {c.moments.map((x) => (
          <SheetCard key={x.id}>
            <strong>{x.title}</strong>
          </SheetCard>
        ))}
      </>
    ),
    factions: <SheetEmptyState>No factions recorded.</SheetEmptyState>,
    favor: <SheetEmptyState>No favors or patrons recorded.</SheetEmptyState>,
    history: c.history.length ? (
      c.history.map((x) => (
        <SheetCard key={x.id}>
          <strong>{x.title}</strong>
        </SheetCard>
      ))
    ) : (
      <SheetEmptyState>No campaign history.</SheetEmptyState>
    ),
    records: (
      <TextField
        label="Notes"
        value={c.notes}
        onChange={(notes) => u({ ...c, notes })}
      />
    ),
  };
  return (
    <LocalSheet
      title="Miseries & Misfortunes Campaign"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => u({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) => u({ ...c, layout: { ...c.layout, [c.mode]: order } })}
      sections={campaignSections}
      groups={campaignGroups}
      content={content}
      status={s.status}
      onBack={() => void p.onBack()}
      onSave={() => void s.save()}
    />
  );
}
