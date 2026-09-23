import type { GameCharacterEditorProps } from '../game-system';
import { LocalSheet, TextField, useLocalSheet } from '../shared/LocalSheet';
import {
  SheetCard,
  SheetField,
  SheetFieldGrid,
  SheetNotice,
} from '../../components/layout/SheetPrimitives';
import { arsCharacterSchema, type ArsCharacter } from './schema';
import { TraitsPanel } from './TraitsPanel';
import { DicePanel } from './DicePanel';
import { CreatorPanel } from './CreatorPanel';
import { spellCatalog } from './catalog';
import {
  BiographyPanel,
  CombatEquipmentPanel,
  HermeticReferencePanel,
  MagicTotalsPanel,
  SpellsReferencePanel,
} from './ReferencePanels';

export const arsSections = [
  ['character', 'Character'],
  ['creator', 'Character Creator'],
  ['characteristics', 'Characteristics'],
  ['virtues', 'Virtues & Flaws'],
  ['abilities', 'Abilities'],
  ['arts', 'Arts'],
  ['spells', 'Spells & Mastery'],
  ['equipment', 'Combat & Equipment'],
  ['resources', 'Confidence, Warping & Aging'],
  ['wounds', 'Fatigue & Wounds'],
  ['covenant', 'Relationships & Covenant'],
  ['laboratory', 'Laboratory'],
  ['seasons', 'Seasons & Advancement'],
  ['records', 'Records'],
].map(([id, label]) => ({ id, label, group: id }));

export function ArsMagicaEditor(props: GameCharacterEditorProps<ArsCharacter>) {
  const {
    draft: c,
    update,
    status,
    save,
    download,
  } = useLocalSheet(props, arsCharacterSchema);
  const locked = c.mode === 'play';
  const definition = (
    key: 'name' | 'player' | 'concept' | 'saga' | 'appearance',
    value: string,
  ) =>
    update({
      ...c,
      ...(key === 'name' ? { name: value } : {}),
      definition: { ...c.definition, [key]: value },
    });
  const sections = arsSections.filter(
    (s) =>
      c.definition.role === 'magus' ||
      !['arts', 'spells', 'laboratory'].includes(s.id),
  );
  const safeSave = () => void save().catch(() => undefined);
  const content = {
    character: (
      <>
        <SheetFieldGrid columns={3}>
          {(['name', 'player', 'concept', 'saga', 'appearance'] as const).map(
            (key) => (
              <TextField
                key={key}
                label={key[0].toUpperCase() + key.slice(1)}
                value={c.definition[key]}
                onChange={(v) => definition(key, v)}
                locked={locked}
                multiline={key === 'appearance'}
              />
            ),
          )}
        </SheetFieldGrid>
        <p>
          Role: {c.definition.role}. Role changes require a reviewed creator
          workflow.
        </p>
        <BiographyPanel character={c} onChange={update} />
      </>
    ),
    creator:
      c.creation.status === 'manual' ? (
        <SheetNotice tone="info">
          This is a manual character. No historical creation choices are
          inferred. Start a new guided character to use creator validation.
        </SheetNotice>
      ) : (
        <CreatorPanel character={c} onChange={update} />
      ),
    characteristics: (
      <SheetFieldGrid columns={3}>
        {Object.entries(c.definition.characteristics).map(([key, value]) => (
          <SheetField key={key} label={key[0].toUpperCase() + key.slice(1)}>
            <input
              type="number"
              step={1}
              value={value}
              readOnly={locked}
              onChange={(e) => {
                const n = e.target.valueAsNumber;
                if (Number.isSafeInteger(n))
                  update({
                    ...c,
                    definition: {
                      ...c.definition,
                      characteristics: {
                        ...c.definition.characteristics,
                        [key]: n,
                      },
                    },
                  });
              }}
            />
          </SheetField>
        ))}
      </SheetFieldGrid>
    ),
    virtues: (
      <>
        {c.definition.virtuesFlaws.map((trait) => (
          <SheetCard key={trait.id} density="compact">
            <SheetFieldGrid columns={3}>
              <TextField
                label="Name"
                value={trait.name}
                locked={locked}
                multiline={false}
                onChange={(name) =>
                  update({
                    ...c,
                    definition: {
                      ...c.definition,
                      virtuesFlaws: c.definition.virtuesFlaws.map((x) =>
                        x.id === trait.id ? { ...x, name } : x,
                      ),
                    },
                  })
                }
              />
              <SheetField label="Kind">
                <select
                  value={trait.kind}
                  disabled={locked}
                  onChange={(event) =>
                    update({
                      ...c,
                      definition: {
                        ...c.definition,
                        virtuesFlaws: c.definition.virtuesFlaws.map((x) =>
                          x.id === trait.id
                            ? {
                                ...x,
                                kind: event.target.value as typeof trait.kind,
                              }
                            : x,
                        ),
                      },
                    })
                  }
                >
                  <option value="virtue">Virtue</option>
                  <option value="flaw">Flaw</option>
                </select>
              </SheetField>
              <SheetField label="Points">
                <input
                  type="number"
                  min={0}
                  max={3}
                  value={trait.points}
                  readOnly={locked}
                  onChange={(event) => {
                    const points = event.target.valueAsNumber;
                    if (Number.isInteger(points) && points >= 0 && points <= 3)
                      update({
                        ...c,
                        definition: {
                          ...c.definition,
                          virtuesFlaws: c.definition.virtuesFlaws.map((x) =>
                            x.id === trait.id ? { ...x, points } : x,
                          ),
                        },
                      });
                  }}
                />
              </SheetField>
            </SheetFieldGrid>
            <p>
              {trait.status === 'verified'
                ? 'Verified source definition'
                : 'Custom or unresolved selection'}
            </p>
          </SheetCard>
        ))}
        {!locked && (
          <button
            className="secondary-button"
            onClick={() =>
              update({
                ...c,
                definition: {
                  ...c.definition,
                  virtuesFlaws: [
                    ...c.definition.virtuesFlaws,
                    {
                      id: crypto.randomUUID(),
                      definitionId: null,
                      name: '',
                      status: 'custom',
                      citation: null,
                      notes: '',
                      kind: 'virtue',
                      points: 1,
                      choice: '',
                    },
                  ],
                },
              })
            }
          >
            Add custom Virtue or Flaw
          </button>
        )}
      </>
    ),
    abilities: <TraitsPanel character={c} onChange={update} scale="ability" />,
    arts: (
      <>
        <TraitsPanel character={c} onChange={update} scale="art" />
        <h3>Base magic totals</h3>
        <MagicTotalsPanel character={c} />
      </>
    ),
    spells: (
      <>
        <SheetNotice tone="warning">
          The {spellCatalog.length} indexed spells retain exact source pages but
          are reference-only until their complete mechanics are reviewed.
          Reference-only spells block guided finalization.
        </SheetNotice>
        <SpellsReferencePanel character={c} onChange={update} />
      </>
    ),
    equipment: <CombatEquipmentPanel character={c} onChange={update} />,
    resources: (
      <>
        <SheetFieldGrid columns={3}>
          {(
            [
              'confidenceScore',
              'confidencePoints',
              'warpingPoints',
              'decrepitudePoints',
              'apparentAge',
            ] as const
          ).map((key) => (
            <SheetField key={key} label={key.replace(/([A-Z])/g, ' $1')}>
              <input
                type="number"
                min={0}
                value={c.play[key]}
                readOnly={locked && key === 'confidenceScore'}
                onChange={(e) => {
                  const n = e.target.valueAsNumber;
                  if (Number.isSafeInteger(n) && n >= 0)
                    update({ ...c, play: { ...c.play, [key]: n } });
                }}
              />
            </SheetField>
          ))}
          <SheetField label="Longevity ritual lab total">
            <input
              type="number"
              value={c.play.longevityRitual.labTotal}
              onChange={(e) =>
                Number.isInteger(e.target.valueAsNumber) &&
                update({
                  ...c,
                  play: {
                    ...c.play,
                    longevityRitual: {
                      ...c.play.longevityRitual,
                      labTotal: e.target.valueAsNumber,
                    },
                  },
                })
              }
            />
          </SheetField>
          <SheetField label="Aging roll modifier">
            <input
              type="number"
              value={c.play.longevityRitual.ageRollModifier}
              onChange={(e) =>
                Number.isInteger(e.target.valueAsNumber) &&
                update({
                  ...c,
                  play: {
                    ...c.play,
                    longevityRitual: {
                      ...c.play.longevityRitual,
                      ageRollModifier: e.target.valueAsNumber,
                    },
                  },
                })
              }
            />
          </SheetField>
        </SheetFieldGrid>
        <h3>Twilight scars and episodes</h3>
        <ol>
          {c.play.twilight.map((event) => (
            <li key={event.id}>
              {event.at}: {event.effect || 'No effect recorded'}; Warping +
              {event.warpingGained}; {event.duration || 'duration not recorded'}
            </li>
          ))}
        </ol>
      </>
    ),
    wounds: (
      <>
        <SheetFieldGrid columns={3}>
          <SheetField label="Current fatigue state">
            <output>
              {
                [
                  'Fresh',
                  'Winded (0)',
                  'Weary (-1)',
                  'Tired (-3)',
                  'Dazed (-5)',
                  'Unconscious',
                ][Math.min(c.play.fatigue, 5)]
              }
            </output>
          </SheetField>
          {(
            ['light', 'medium', 'heavy', 'incapacitating', 'dead'] as const
          ).map((severity) => (
            <SheetField key={severity} label={`${severity} wounds`}>
              <output>
                {c.play.wounds.filter((w) => w.severity === severity).length}
                {severity === 'light'
                  ? ' × -1'
                  : severity === 'medium'
                    ? ' × -3'
                    : severity === 'heavy'
                      ? ' × -5'
                      : ''}
              </output>
            </SheetField>
          ))}
        </SheetFieldGrid>
        <SheetField label="Fatigue levels lost">
          <input
            type="number"
            min={0}
            value={c.play.fatigue}
            onChange={(e) => {
              const n = e.target.valueAsNumber;
              if (Number.isSafeInteger(n) && n >= 0)
                update({ ...c, play: { ...c.play, fatigue: n } });
            }}
          />
        </SheetField>
        {c.play.wounds.map((w) => (
          <SheetFieldGrid key={w.id} columns={2}>
            <SheetField label="Wound severity">
              <select
                value={w.severity}
                onChange={(e) =>
                  update({
                    ...c,
                    play: {
                      ...c.play,
                      wounds: c.play.wounds.map((x) =>
                        x.id === w.id
                          ? {
                              ...x,
                              severity: e.target.value as typeof w.severity,
                            }
                          : x,
                      ),
                    },
                  })
                }
              >
                {['light', 'medium', 'heavy', 'incapacitating', 'dead'].map(
                  (x) => (
                    <option key={x}>{x}</option>
                  ),
                )}
              </select>
            </SheetField>
            <TextField
              label="Wound notes"
              value={w.notes}
              onChange={(v) =>
                update({
                  ...c,
                  play: {
                    ...c.play,
                    wounds: c.play.wounds.map((x) =>
                      x.id === w.id ? { ...x, notes: v } : x,
                    ),
                  },
                })
              }
            />
          </SheetFieldGrid>
        ))}
        <button
          className="secondary-button"
          onClick={() =>
            update({
              ...c,
              play: {
                ...c.play,
                wounds: [
                  ...c.play.wounds,
                  { id: crypto.randomUUID(), severity: 'light', notes: '' },
                ],
              },
            })
          }
        >
          Record wound
        </button>
      </>
    ),
    covenant: (
      <>
        <p>
          {c.covenantId
            ? `Linked Covenant record: ${c.covenantId}`
            : 'No Covenant linked.'}
        </p>
        {c.covenantSnapshot && (
          <p>
            Export snapshot: {c.covenantSnapshot.name}, aura{' '}
            {c.covenantSnapshot.aura}, updated {c.covenantSnapshot.updatedAt}
          </p>
        )}
        <SheetNotice tone="info">
          Covenant links are local to this browser. Imported snapshots never
          overwrite shared records automatically.
        </SheetNotice>
        {c.definition.role === 'magus' && (
          <HermeticReferencePanel character={c} onChange={update} />
        )}
      </>
    ),
    laboratory: (
      <SheetNotice tone="info">
        Laboratory projects are owned by the linked Covenant and confirmed with
        atomic linked-record saves.
      </SheetNotice>
    ),
    seasons: (
      <>
        <p>{c.seasons.length} completed seasonal activities.</p>
        <ol>
          {c.seasons.map((event) => (
            <li key={event.id}>
              {event.date.season} {event.date.year}: {event.activity} —{' '}
              {event.explanation}
            </li>
          ))}
        </ol>
      </>
    ),
    records: (
      <>
        <TextField
          label="Session notes"
          value={c.notes}
          onChange={(notes) => update({ ...c, notes })}
        />
        <DicePanel character={c} onChange={update} />
      </>
    ),
  };
  return (
    <LocalSheet
      title="Ars Magica Definitive Edition"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => update({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) =>
        update({ ...c, layout: { ...c.layout, [c.mode]: order } })
      }
      sections={sections}
      content={content}
      status={status}
      onBack={() =>
        void save()
          .then(props.onBack)
          .catch(() => undefined)
      }
      onSave={safeSave}
      settings={
        <>
          <button
            className="secondary-button"
            onClick={() => void download('json')}
          >
            Save JSON
          </button>
          <button
            className="secondary-button"
            onClick={() => void download('yaml')}
          >
            Save YAML
          </button>
        </>
      }
    />
  );
}
