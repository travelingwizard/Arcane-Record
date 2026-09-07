import { useState, type ReactNode } from 'react';
import type { GameCharacterEditorProps } from '../game-system';
import { CatalogSourceSettings } from '../shared/CatalogSourceSettings';
import { LocalSheet, TextField, useLocalSheet } from '../shared/LocalSheet';
import {
  SheetCard,
  SheetField,
  SheetFieldGrid,
  SheetNotice,
  SheetToolbar,
} from '../../components/layout/SheetPrimitives';
import { ExperienceTotalsFields } from '../../components/character/ExperienceTotalsFields';
import { shadowrun1eSectionGroups, shadowrun1eSections } from './definitions';
import { priorityBudget, priorityIssues, type Priority } from './rules';
import {
  shadowrun1eCharacterSchema,
  type Shadowrun1eCharacter,
} from './schema';
import { shadowrun1eSources } from './sources';

type RatedRecord = Shadowrun1eCharacter['skills'][number];

function numeric(value: string, minimum = 0, maximum = 20) {
  return Math.max(minimum, Math.min(maximum, Math.trunc(Number(value) || 0)));
}

function NumberField({
  label,
  value,
  onChange,
  locked,
  min = 0,
  max = 20,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  locked?: boolean;
  min?: number;
  max?: number;
  step?: number;
}) {
  return (
    <SheetField label={label}>
      <input
        aria-label={label}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        readOnly={locked}
        onChange={(event) =>
          onChange(
            step === 1
              ? numeric(event.target.value, min, max)
              : Math.max(min, Math.min(max, Number(event.target.value) || 0)),
          )
        }
      />
    </SheetField>
  );
}

function RatedList({
  title,
  records,
  locked,
  onChange,
}: {
  title: string;
  records: RatedRecord[];
  locked: boolean;
  onChange: (records: RatedRecord[]) => void;
}) {
  const add = () =>
    onChange([
      ...records,
      {
        id: crypto.randomUUID(),
        definitionId: null,
        sourceId: 'sr1.core',
        page: null,
        unresolved: true,
        name: '',
        rating: 0,
        specialization: '',
        notes: '',
      },
    ]);
  return (
    <div className="sheet-card-list">
      <SheetToolbar>
        <strong>{title}</strong>
        <button className="secondary-button" disabled={locked} onClick={add}>
          Add {title.replace(/s$/, '')}
        </button>
      </SheetToolbar>
      {records.length === 0 && <p>No {title.toLowerCase()} recorded.</p>}
      {records.map((record) => (
        <SheetCard key={record.id} density="compact">
          <SheetFieldGrid columns={3}>
            <SheetField label="Name">
              <input
                aria-label={`${title} name`}
                value={record.name}
                readOnly={locked}
                onChange={(event) =>
                  onChange(
                    records.map((item) =>
                      item.id === record.id
                        ? { ...item, name: event.target.value }
                        : item,
                    ),
                  )
                }
              />
            </SheetField>
            <NumberField
              label="Rating"
              value={record.rating}
              locked={locked}
              onChange={(rating) =>
                onChange(
                  records.map((item) =>
                    item.id === record.id ? { ...item, rating } : item,
                  ),
                )
              }
            />
            <SheetField label="Concentration / Specialization">
              <input
                value={record.specialization}
                readOnly={locked}
                onChange={(event) =>
                  onChange(
                    records.map((item) =>
                      item.id === record.id
                        ? { ...item, specialization: event.target.value }
                        : item,
                    ),
                  )
                }
              />
            </SheetField>
          </SheetFieldGrid>
          <TextField
            label="Notes"
            value={record.notes}
            locked={false}
            onChange={(notes) =>
              onChange(
                records.map((item) =>
                  item.id === record.id ? { ...item, notes } : item,
                ),
              )
            }
          />
          <button
            className="small-button small-button--quiet"
            disabled={locked}
            onClick={() =>
              onChange(records.filter((item) => item.id !== record.id))
            }
          >
            Remove
          </button>
        </SheetCard>
      ))}
    </div>
  );
}

export function Shadowrun1eEditor(
  props: GameCharacterEditorProps<Shadowrun1eCharacter>,
) {
  const {
    draft: c,
    update,
    status,
    save,
    download,
  } = useLocalSheet(props, shadowrun1eCharacterSchema);
  const [newGearName, setNewGearName] = useState('');
  const locked = c.mode === 'play';
  const budget = priorityBudget(c.creation.priorities);
  const issues = priorityIssues(c.creation.priorities, c.metatype);
  const reaction = Math.floor(
    (c.attributes.quickness + c.attributes.intelligence) / 2,
  );
  const setText = (key: keyof Shadowrun1eCharacter, value: string) =>
    update({ ...c, [key]: value });
  const identityField = (key: keyof Shadowrun1eCharacter, label: string) => (
    <TextField
      label={label}
      value={String(c[key])}
      locked={locked}
      multiline={false}
      onChange={(value) => setText(key, value)}
    />
  );
  const addGear = () => {
    if (!newGearName.trim()) return;
    update({
      ...c,
      gear: [
        ...c.gear,
        {
          id: crypto.randomUUID(),
          definitionId: null,
          sourceId: 'sr1.core',
          page: null,
          unresolved: true,
          name: newGearName.trim(),
          category: '',
          rating: 0,
          quantity: 1,
          cost: 0,
          active: false,
          notes: '',
        },
      ],
    });
    setNewGearName('');
  };

  const content: Record<string, ReactNode> = {
    'sr1-identity': (
      <SheetFieldGrid columns={3}>
        {identityField('name', 'Character name')}
        {identityField('streetName', 'Street name')}
        {identityField('player', 'Player')}
        <SheetField label="Metatype">
          <select
            aria-label="Metatype"
            disabled={locked}
            value={c.metatype}
            onChange={(event) =>
              update({
                ...c,
                metatype: event.target
                  .value as Shadowrun1eCharacter['metatype'],
              })
            }
          >
            <option value="human">Human</option>
            <option value="elf">Elf</option>
            <option value="dwarf">Dwarf</option>
            <option value="ork">Ork</option>
            <option value="troll">Troll</option>
            <option value="custom">Custom / GM approved</option>
          </select>
        </SheetField>
        {identityField('archetype', 'Archetype / concept')}
        {identityField('age', 'Age')}
        {identityField('sex', 'Sex / gender')}
        {identityField('height', 'Height')}
        {identityField('weight', 'Weight')}
      </SheetFieldGrid>
    ),
    'sr1-creation': (
      <div className="character-creator">
        <p>
          Assign priorities 0–4 exactly once across Magic, Attributes, Skills,
          Tech, and Race. The calculated budgets follow the Master Character
          Table in Shadowrun First Edition, p. 53.
        </p>
        <SheetFieldGrid columns="auto">
          {(
            Object.keys(c.creation.priorities) as Array<
              keyof typeof c.creation.priorities
            >
          ).map((key) => (
            <SheetField
              key={key}
              label={key === 'tech' ? 'Tech / resources' : key}
            >
              <select
                aria-label={`${key} priority`}
                disabled={locked}
                value={c.creation.priorities[key]}
                onChange={(event) =>
                  update({
                    ...c,
                    creation: {
                      ...c.creation,
                      priorities: {
                        ...c.creation.priorities,
                        [key]: Number(event.target.value) as Priority,
                      },
                    },
                  })
                }
              >
                {[0, 1, 2, 3, 4].map((value) => (
                  <option key={value} value={value}>
                    Priority {value}
                  </option>
                ))}
              </select>
            </SheetField>
          ))}
        </SheetFieldGrid>
        <SheetCard density="compact">
          <strong>Calculated starting budgets</strong>
          <p>
            Attributes {budget.attributePoints} · Skills {budget.skillPoints} ·
            Resources {budget.nuyen.toLocaleString()}¥ · Spell Force{' '}
            {budget.spellForce || '—'} ·{' '}
            {budget.magical ? 'Magician' : 'Mundane'} ·{' '}
            {budget.metahuman ? 'Metahuman' : 'Human'}
          </p>
        </SheetCard>
        {issues.map((issue) => (
          <SheetNotice key={issue} tone="warning">
            {issue}
          </SheetNotice>
        ))}
        <SheetField label="GM approval notes">
          <textarea
            value={c.creation.approvalNotes}
            readOnly={locked}
            onChange={(event) =>
              update({
                ...c,
                creation: { ...c.creation, approvalNotes: event.target.value },
              })
            }
          />
        </SheetField>
        <label>
          <input
            type="checkbox"
            disabled={locked}
            checked={c.creation.gmApproved}
            onChange={(event) =>
              update({
                ...c,
                creation: { ...c.creation, gmApproved: event.target.checked },
              })
            }
          />{' '}
          GM Approved exception
        </label>
        <button
          className="primary-button"
          disabled={locked || (issues.length > 0 && !c.creation.gmApproved)}
          onClick={() =>
            update({
              ...c,
              creation: {
                ...c.creation,
                status: 'finalized',
                finalizedAt: new Date().toISOString(),
              },
              mode: 'play',
            })
          }
        >
          Finalize priority build
        </button>
      </div>
    ),
    'sr1-attributes': (
      <>
        <SheetFieldGrid columns={3}>
          {(Object.keys(c.attributes) as Array<keyof typeof c.attributes>).map(
            (key) => (
              <NumberField
                key={key}
                label={key}
                value={c.attributes[key]}
                locked={locked}
                min={0}
                max={key === 'essence' ? 6 : 20}
                step={key === 'essence' ? 0.01 : 1}
                onChange={(value) =>
                  update({
                    ...c,
                    attributes: { ...c.attributes, [key]: value },
                  })
                }
              />
            ),
          )}
        </SheetFieldGrid>
        <SheetNotice tone="info">
          Reaction is {reaction}: Quickness plus Intelligence, divided by 2 and
          rounded down. Cyberware and other modifiers are recorded with combat
          initiative. Core pp. 30–31.
        </SheetNotice>
        <SheetFieldGrid columns={3}>
          {(Object.keys(c.pools) as Array<keyof typeof c.pools>).map((key) => (
            <NumberField
              key={key}
              label={`${key} pool`}
              value={c.pools[key]}
              locked={locked}
              onChange={(value) =>
                update({ ...c, pools: { ...c.pools, [key]: value } })
              }
            />
          ))}
        </SheetFieldGrid>
      </>
    ),
    'sr1-skills': (
      <RatedList
        title="Skills"
        records={c.skills}
        locked={locked}
        onChange={(skills) => update({ ...c, skills })}
      />
    ),
    'sr1-magic': (
      <>
        <SheetNotice tone="info">
          Spell, tradition, totem, and magical-item catalogs are the next
          source-verification milestone. Manual records remain fully portable.
        </SheetNotice>
        <RatedList
          title="Spells"
          records={c.spells.map((spell) => ({
            ...spell,
            specialization: spell.category,
          }))}
          locked={locked}
          onChange={(records) =>
            update({
              ...c,
              spells: records.map((record) => {
                const existing = c.spells.find(({ id }) => id === record.id);
                return {
                  ...record,
                  category: record.specialization,
                  force: record.rating,
                  drain: existing?.drain ?? '',
                };
              }),
            })
          }
        />
      </>
    ),
    'sr1-matrix': (
      <SheetFieldGrid columns={3}>
        <TextField
          label="Cyberdeck"
          value={c.matrix.deck}
          locked={locked}
          multiline={false}
          onChange={(deck) => update({ ...c, matrix: { ...c.matrix, deck } })}
        />
        {(
          Object.keys(c.matrix.persona) as Array<keyof typeof c.matrix.persona>
        ).map((key) => (
          <NumberField
            key={key}
            label={`Persona ${key}`}
            value={c.matrix.persona[key]}
            locked={locked}
            onChange={(value) =>
              update({
                ...c,
                matrix: {
                  ...c.matrix,
                  persona: { ...c.matrix.persona, [key]: value },
                },
              })
            }
          />
        ))}
        <TextField
          label="Matrix notes"
          value={c.matrix.notes}
          locked={false}
          onChange={(notes) => update({ ...c, matrix: { ...c.matrix, notes } })}
        />
      </SheetFieldGrid>
    ),
    'sr1-cyberware': (
      <SheetNotice tone="info">
        Structured cyberware and Essence-cost catalogs are reserved for the
        verified core and Shadowtech catalog milestone. Record interim items in
        Gear.
      </SheetNotice>
    ),
    'sr1-gear': (
      <>
        <SheetToolbar>
          <SheetField label="New gear or contact">
            <input
              value={newGearName}
              disabled={locked}
              onChange={(event) => setNewGearName(event.target.value)}
            />
          </SheetField>
          <button
            className="secondary-button"
            disabled={locked || !newGearName.trim()}
            onClick={addGear}
          >
            Add gear
          </button>
        </SheetToolbar>
        {c.gear.map((item) => (
          <SheetCard key={item.id} density="compact">
            <strong>{item.name || 'Unnamed gear'}</strong>
            <label>
              <input
                type="checkbox"
                checked={item.active}
                onChange={(event) =>
                  update({
                    ...c,
                    gear: c.gear.map((entry) =>
                      entry.id === item.id
                        ? { ...entry, active: event.target.checked }
                        : entry,
                    ),
                  })
                }
              />{' '}
              Carried / active
            </label>
          </SheetCard>
        ))}
      </>
    ),
    'sr1-combat': (
      <>
        <SheetFieldGrid columns={3}>
          <NumberField
            label="Ballistic armor"
            value={c.combat.armorBallistic}
            locked={locked}
            onChange={(armorBallistic) =>
              update({ ...c, combat: { ...c.combat, armorBallistic } })
            }
          />
          <NumberField
            label="Impact armor"
            value={c.combat.armorImpact}
            locked={locked}
            onChange={(armorImpact) =>
              update({ ...c, combat: { ...c.combat, armorImpact } })
            }
          />
          <NumberField
            label="Initiative dice"
            value={c.combat.initiativeDice}
            min={1}
            max={10}
            locked={locked}
            onChange={(initiativeDice) =>
              update({ ...c, combat: { ...c.combat, initiativeDice } })
            }
          />
          <NumberField
            label="Initiative modifier"
            value={c.combat.initiativeBonus}
            min={-20}
            max={50}
            onChange={(initiativeBonus) =>
              update({ ...c, combat: { ...c.combat, initiativeBonus } })
            }
          />
          <NumberField
            label="Current initiative"
            value={c.combat.currentInitiative}
            min={-100}
            max={200}
            onChange={(currentInitiative) =>
              update({ ...c, combat: { ...c.combat, currentInitiative } })
            }
          />
          <NumberField
            label="Physical damage"
            value={c.combat.damagePhysical}
            max={10}
            onChange={(damagePhysical) =>
              update({ ...c, combat: { ...c.combat, damagePhysical } })
            }
          />
          <NumberField
            label="Stun damage"
            value={c.combat.damageStun}
            max={10}
            onChange={(damageStun) =>
              update({ ...c, combat: { ...c.combat, damageStun } })
            }
          />
        </SheetFieldGrid>
        <TextField
          label="Conditions and modifiers"
          value={c.combat.conditions}
          locked={false}
          onChange={(conditions) =>
            update({ ...c, combat: { ...c.combat, conditions } })
          }
        />
      </>
    ),
    'sr1-experience': (
      <ExperienceTotalsFields
        idPrefix="sr1"
        total={c.experience.total}
        current={c.experience.current}
        onChange={(field, value) =>
          update({ ...c, experience: { ...c.experience, [field]: value } })
        }
      />
    ),
    'sr1-sources': (
      <>
        <CatalogSourceSettings
          gameId="shadowrun1e"
          sources={shadowrun1eSources}
          enabled={c.enabledSources}
          onChange={(enabledSources) => update({ ...c, enabledSources })}
        />
        <SheetNotice tone="info">
          Supplement switches are ready for verified catalogs. They do not yet
          add unreviewed equipment, cyberware, vehicles, Matrix utilities, or
          spells.
        </SheetNotice>
      </>
    ),
    'sr1-notes': (
      <SheetFieldGrid columns={2}>
        <TextField
          label="Description and history"
          value={c.description}
          locked={locked}
          onChange={(description) => update({ ...c, description })}
        />
        <TextField
          label="Notes"
          value={c.notes}
          locked={false}
          onChange={(notes) => update({ ...c, notes })}
        />
      </SheetFieldGrid>
    ),
  };

  return (
    <LocalSheet
      title="Shadowrun First Edition"
      name={c.name || c.streetName}
      mode={c.mode}
      onMode={(mode) => update({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) =>
        update({ ...c, layout: { ...c.layout, [c.mode]: order } })
      }
      sections={shadowrun1eSections}
      groups={shadowrun1eSectionGroups}
      content={content}
      status={status}
      onSave={() => void save().catch(() => undefined)}
      onBack={() =>
        void save()
          .then(props.onBack)
          .catch(() => undefined)
      }
      settings={
        <>
          <button
            className="secondary-button"
            onClick={() => void download('json')}
          >
            Save JSON file
          </button>
          <button
            className="secondary-button"
            onClick={() => void download('yaml')}
          >
            Save YAML file
          </button>
        </>
      }
    />
  );
}
