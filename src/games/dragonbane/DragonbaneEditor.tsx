import { useState } from 'react';
import {
  SheetCard,
  SheetField,
  SheetFieldGrid,
  SheetNotice,
  SheetToolbar,
} from '../../components/layout/SheetPrimitives';
import type { GameCharacterEditorProps } from '../game-system';
import { LocalSheet, TextField, useLocalSheet } from '../shared/LocalSheet';
import {
  dragonbaneEquipment,
  dragonbaneHeroicAbilities,
  dragonbaneKin,
  dragonbaneMagicSchools,
  dragonbaneProfessions,
  dragonbaneSkills,
  dragonbaneSpells,
  dragonbaneTricks,
  dragonbaneWeapons,
  type AttributeKey,
} from './catalog';
import { dragonbaneGroups, dragonbaneSections } from './definitions';
import {
  ageAdjustments,
  baseChance,
  creationIssues,
  derived,
  rollD20,
  syncSkills,
  trainedSkillCount,
} from './rules';
import { dragonbaneCharacterSchema, type DragonbaneCharacter } from './schema';
const now = () => new Date().toISOString();
const die = (sides: number) =>
  (crypto.getRandomValues(new Uint32Array(1))[0]! % sides) + 1;
const cited = (x: {
  id: string;
  name: string;
  sourceId: string;
  page: number;
}) => ({
  id: crypto.randomUUID(),
  definitionId: x.id,
  name: x.name,
  sourceId: x.sourceId,
  page: x.page,
  notes: '',
  custom: false,
});
function Num({
  label,
  value,
  onChange,
  max = 99,
  locked = false,
}: {
  label: string;
  value: number;
  onChange: (n: number) => void;
  max?: number;
  locked?: boolean;
}) {
  return (
    <SheetField label={label}>
      <input
        type="number"
        min={0}
        max={max}
        value={value}
        readOnly={locked}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </SheetField>
  );
}
function Creator({
  c,
  u,
}: {
  c: DragonbaneCharacter;
  u: (x: DragonbaneCharacter) => void;
}) {
  const [reason, setReason] = useState('');
  const profession = dragonbaneProfessions.find((x) => x.id === c.professionId);
  const issues = creationIssues(c);
  const unresolved = issues.filter(
    (x) => !c.creation.approvals.some((a) => a.ruleId === `creation:${x}`),
  );
  const update = (next: DragonbaneCharacter) => {
    const d = derived(next),
      skills = syncSkills(next);
    u({
      ...next,
      skills,
      resources: {
        ...next.resources,
        hpMaximum: d.hp,
        wpMaximum: d.wp,
        hpCurrent: Math.min(next.resources.hpCurrent, d.hp),
        wpCurrent: Math.min(next.resources.wpCurrent, d.wp),
      },
    });
  };
  const rollAttribute = (key: AttributeKey) => {
    const dice = [die(6), die(6), die(6), die(6)],
      kept = dice.reduce((a, b) => a + b, 0) - Math.min(...dice),
      adjust = ageAdjustments(c.age)[key] ?? 0;
    update({
      ...c,
      attributes: {
        ...c.attributes,
        [key]: Math.min(18, Math.max(3, kept + adjust)),
      },
      creation: {
        ...c.creation,
        attributeRolls: [
          ...c.creation.attributeRolls,
          {
            id: crypto.randomUUID(),
            dice,
            kept,
            assignedTo: key,
            createdAt: now(),
          },
        ],
      },
    });
  };
  const toggleSkill = (id: string, professional: boolean) => {
    const key = professional ? 'professionalSkillIds' : 'freeSkillIds',
      list = c.creation[key],
      next = list.includes(id) ? list.filter((x) => x !== id) : [...list, id];
    update({ ...c, creation: { ...c.creation, [key]: next } });
  };
  const finish = () =>
    u({
      ...c,
      mode: 'play',
      creation: {
        ...c.creation,
        status: 'finalized',
        baseline: structuredClone(c),
        finalizedAt: now(),
      },
    });
  return (
    <SheetCard selected>
      <h3>Guided adventurer creation · Step {c.creation.step} of 11</h3>
      <p>
        Build from the core rules. Citations remain visible so table rulings can
        be checked.
      </p>
      <SheetFieldGrid columns={3}>
        <SheetField label="Kin">
          <select
            value={c.kinId}
            onChange={(e) => update({ ...c, kinId: e.target.value })}
          >
            <option value="">Choose…</option>
            {dragonbaneKin.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} · p. {x.page}
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Profession">
          <select
            value={c.professionId}
            onChange={(e) => {
              const p = dragonbaneProfessions.find(
                (x) => x.id === e.target.value,
              );
              update({
                ...c,
                professionId: e.target.value,
                creation: {
                  ...c.creation,
                  professionalSkillIds: [],
                  freeSkillIds: [],
                  gearPackage: null,
                },
                abilities: p?.heroicAbility
                  ? [
                      {
                        ...cited(
                          dragonbaneHeroicAbilities.find(
                            (a) => a.name === p.heroicAbility,
                          ) ?? {
                            id: 'custom',
                            name: p.heroicAbility,
                            sourceId: 'dragonbane.core',
                            page: p.page,
                          },
                        ),
                        wpCost: null,
                        active: false,
                        origin: 'creation',
                      },
                    ]
                  : [],
              });
            }}
          >
            <option value="">Choose…</option>
            {dragonbaneProfessions.map((x) => (
              <option key={x.id} value={x.id}>
                {x.name} · p. {x.page}
              </option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Age">
          <select
            value={c.age}
            onChange={(e) =>
              update({
                ...c,
                age: e.target.value as DragonbaneCharacter['age'],
              })
            }
          >
            <option value="young">Young · 8 trained Skills</option>
            <option value="adult">Adult · 10 trained Skills</option>
            <option value="old">Old · 12 trained Skills</option>
          </select>
        </SheetField>
      </SheetFieldGrid>
      <SheetField label="Attribute method">
        <select
          value={c.creation.attributeMethod}
          onChange={(e) =>
            u({
              ...c,
              creation: {
                ...c.creation,
                attributeMethod: e.target
                  .value as DragonbaneCharacter['creation']['attributeMethod'],
              },
            })
          }
        >
          <option value="sequential">Sequential 4d6, drop lowest</option>
          <option value="assign-after">Roll all, then assign</option>
          <option value="pool">Combined pool (house rule)</option>
          <option value="manual">Manual entry</option>
        </select>
      </SheetField>
      <SheetFieldGrid columns={3}>
        {(Object.keys(c.attributes) as AttributeKey[]).map((key) => (
          <SheetCard density="compact" key={key}>
            <Num
              label={key.toUpperCase()}
              value={c.attributes[key]}
              max={18}
              onChange={(n) =>
                update({ ...c, attributes: { ...c.attributes, [key]: n } })
              }
            />
            <button
              className="secondary-button"
              onClick={() => rollAttribute(key)}
            >
              Roll 4d6
            </button>
          </SheetCard>
        ))}
      </SheetFieldGrid>
      {profession && (
        <>
          <h4>Professional Skills · choose six</h4>
          <div className="sheet-choice-grid">
            {profession.skills
              .filter((name) => dragonbaneSkills.some((x) => x.name === name))
              .map((name) => {
                const s = dragonbaneSkills.find((x) => x.name === name)!;
                return (
                  <label className="sheet-card sheet-card--compact" key={s.id}>
                    <input
                      type="checkbox"
                      checked={c.creation.professionalSkillIds.includes(s.id)}
                      onChange={() => toggleSkill(s.id, true)}
                    />
                    <strong>{s.name}</strong>
                    <small>
                      {s.attribute.toUpperCase()} · p. {s.page}
                    </small>
                  </label>
                );
              })}
          </div>
          <h4>Free trained Skills · total {trainedSkillCount(c.age) - 6}</h4>
          <div className="sheet-choice-grid">
            {dragonbaneSkills
              .filter((s) => !c.creation.professionalSkillIds.includes(s.id))
              .map((s) => (
                <label className="sheet-card sheet-card--compact" key={s.id}>
                  <input
                    type="checkbox"
                    checked={c.creation.freeSkillIds.includes(s.id)}
                    onChange={() => toggleSkill(s.id, false)}
                  />
                  <strong>{s.name}</strong>
                  <small>
                    {s.attribute.toUpperCase()} · rating{' '}
                    {baseChance(c.attributes[s.attribute]) * 2}
                  </small>
                </label>
              ))}
          </div>
          <h4>Starting gear</h4>
          <SheetFieldGrid columns={3}>
            {profession.gearPackages.map((text, index) => (
              <label className="sheet-card" key={text}>
                <input
                  type="radio"
                  name="gear"
                  checked={c.creation.gearPackage === index}
                  onChange={() =>
                    u({ ...c, creation: { ...c.creation, gearPackage: index } })
                  }
                />
                <strong>Package {index + 1}</strong>
                <span>{text}</span>
                <small>Dragonbane core, p. {profession.page}</small>
              </label>
            ))}
          </SheetFieldGrid>
        </>
      )}
      {profession?.name === 'Mage' && (
        <>
          <h4>Starting magic</h4>
          <SheetFieldGrid columns={3}>
            <SheetField label="School">
              <select
                value={c.magic.schoolId ?? ''}
                onChange={(e) =>
                  u({
                    ...c,
                    magic: {
                      ...c.magic,
                      schoolId: e.target.value || null,
                      grimoire: true,
                    },
                  })
                }
              >
                <option value="">Choose…</option>
                {dragonbaneMagicSchools.map((x) => (
                  <option key={x.id} value={x.id}>
                    {x.name}
                  </option>
                ))}
              </select>
            </SheetField>
            <SheetField label="Three rank-one spells">
              <select
                multiple
                value={c.magic.spells.map((x) => x.definitionId ?? '')}
                onChange={(e) =>
                  u({
                    ...c,
                    magic: {
                      ...c.magic,
                      spells: Array.from(e.target.selectedOptions)
                        .slice(0, 3)
                        .map((o) => {
                          const x = dragonbaneSpells.find(
                            (s) => s.id === o.value,
                          )!;
                          return { ...cited(x), rank: x.rank, used: false };
                        }),
                    },
                  })
                }
              >
                {dragonbaneSpells
                  .filter(
                    (x) =>
                      x.rank === 1 &&
                      (x.school === 'general' ||
                        c.magic.schoolId?.endsWith(`.${x.school}`)),
                  )
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
              </select>
            </SheetField>
            <SheetField label="Three magic tricks">
              <select
                multiple
                value={c.magic.tricks.map((x) => x.definitionId ?? '')}
                onChange={(e) =>
                  u({
                    ...c,
                    magic: {
                      ...c.magic,
                      tricks: Array.from(e.target.selectedOptions)
                        .slice(0, 3)
                        .map((o) =>
                          cited(
                            dragonbaneTricks.find((s) => s.id === o.value)!,
                          ),
                        ),
                    },
                  })
                }
              >
                {dragonbaneTricks
                  .filter(
                    (x) =>
                      x.school === 'general' ||
                      c.magic.schoolId?.endsWith(`.${x.school}`),
                  )
                  .map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name}
                    </option>
                  ))}
              </select>
            </SheetField>
          </SheetFieldGrid>
        </>
      )}
      <SheetFieldGrid columns={2}>
        <TextField
          label="Weakness"
          value={c.weakness}
          onChange={(weakness) => u({ ...c, weakness })}
        />
        <TextField
          label="Memento"
          value={c.memento}
          onChange={(memento) => u({ ...c, memento })}
        />
      </SheetFieldGrid>
      {issues.length > 0 && (
        <SheetNotice tone="warning">
          <strong>Review required</strong>
          <ul>
            {issues.map((x) => (
              <li key={x}>{x}</li>
            ))}
          </ul>
        </SheetNotice>
      )}
      <SheetToolbar>
        <button
          className="secondary-button"
          onClick={() =>
            u({
              ...c,
              creation: {
                ...c.creation,
                step: Math.max(1, c.creation.step - 1),
              },
            })
          }
        >
          Previous
        </button>
        <button
          className="secondary-button"
          onClick={() =>
            u({
              ...c,
              creation: {
                ...c.creation,
                step: Math.min(11, c.creation.step + 1),
              },
            })
          }
        >
          Next
        </button>
        <input
          aria-label="GM approval reason"
          placeholder="GM approval reason"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
        {issues.length > 0 && (
          <button
            className="secondary-button"
            disabled={!reason.trim()}
            onClick={() => {
              u({
                ...c,
                creation: {
                  ...c.creation,
                  approvals: [
                    ...c.creation.approvals,
                    ...issues.map((x) => ({
                      id: crypto.randomUUID(),
                      ruleId: `creation:${x}`,
                      reason,
                      approvedAt: now(),
                    })),
                  ],
                },
              });
              setReason('');
            }}
          >
            GM Approved
          </button>
        )}
        <button
          className="primary-button"
          disabled={unresolved.length > 0}
          onClick={finish}
        >
          Finalize adventurer
        </button>
      </SheetToolbar>
    </SheetCard>
  );
}
function Roller({
  c,
  u,
}: {
  c: DragonbaneCharacter;
  u: (x: DragonbaneCharacter) => void;
}) {
  const [kind, setKind] =
      useState<DragonbaneCharacter['rollHistory'][number]['kind']>('skill'),
    [name, setName] = useState('Custom test'),
    [target, setTarget] = useState(10),
    [boons, setBoons] = useState(0),
    [banes, setBanes] = useState(0),
    [context, setContext] = useState('');
  const roll = () => {
    const count = Math.max(1, 1 + Math.abs(boons - banes)),
      dice = Array.from({ length: count }, () => die(20)),
      result = rollD20(target, boons, banes, dice);
    u({
      ...c,
      rollHistory: [
        ...c.rollHistory,
        {
          id: crypto.randomUUID(),
          kind,
          name,
          target,
          dice,
          selected: result.selected,
          boons,
          banes,
          outcome: result.outcome,
          pushed: false,
          condition: null,
          context,
          createdAt: now(),
        },
      ],
    });
  };
  return (
    <SheetCard>
      <h3>Dragonbane dice helper</h3>
      <SheetFieldGrid columns={4}>
        <SheetField label="Roll type">
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value as typeof kind)}
          >
            {[
              'attribute',
              'skill',
              'opposed',
              'attack',
              'damage',
              'spell',
              'mishap',
              'death',
              'advancement',
            ].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        </SheetField>
        <SheetField label="Test">
          <input value={name} onChange={(e) => setName(e.target.value)} />
        </SheetField>
        <Num label="Target" value={target} max={18} onChange={setTarget} />
        <TextField
          label="Context"
          value={context}
          multiline={false}
          onChange={setContext}
        />
      </SheetFieldGrid>
      <SheetToolbar>
        <button
          className="secondary-button"
          onClick={() => setBoons(Math.max(0, boons - 1))}
        >
          − Boon
        </button>
        <span>Boons {boons}</span>
        <button
          className="secondary-button"
          onClick={() => setBoons(boons + 1)}
        >
          + Boon
        </button>
        <button
          className="secondary-button"
          onClick={() => setBanes(Math.max(0, banes - 1))}
        >
          − Bane
        </button>
        <span>Banes {banes}</span>
        <button
          className="secondary-button"
          onClick={() => setBanes(banes + 1)}
        >
          + Bane
        </button>
        <button className="primary-button" onClick={roll}>
          Roll d20
        </button>
      </SheetToolbar>
      {c.rollHistory
        .slice(-5)
        .reverse()
        .map((r) => (
          <SheetNotice
            key={r.id}
            tone={
              r.outcome === 'dragon'
                ? 'success'
                : r.outcome === 'demon'
                  ? 'warning'
                  : 'info'
            }
          >
            <strong>
              {r.name}: {r.selected} · {r.outcome}
            </strong>
            <span>
              {' '}
              Dice {r.dice.join(', ')} · target {r.target}
            </span>
          </SheetNotice>
        ))}
    </SheetCard>
  );
}
export function DragonbaneEditor(
  props: GameCharacterEditorProps<DragonbaneCharacter>,
) {
  const {
    draft: c,
    update: u,
    status,
    save,
    download,
  } = useLocalSheet(props, dragonbaneCharacterSchema);
  const locked = c.mode === 'play',
    d = derived(c);
  const content: Record<string, React.ReactNode> = {
    character: (
      <>
        <SheetFieldGrid columns={3}>
          <TextField
            label="Name"
            value={c.name}
            locked={locked}
            multiline={false}
            onChange={(name) => u({ ...c, name })}
          />
          <TextField
            label="Player"
            value={c.player}
            locked={locked}
            multiline={false}
            onChange={(player) => u({ ...c, player })}
          />
          <TextField
            label="Nickname"
            value={c.nickname}
            locked={locked}
            multiline={false}
            onChange={(nickname) => u({ ...c, nickname })}
          />
          <TextField
            label="Concept"
            value={c.concept}
            locked={locked}
            onChange={(concept) => u({ ...c, concept })}
          />
          <TextField
            label="Appearance"
            value={c.appearance}
            locked={locked}
            onChange={(appearance) => u({ ...c, appearance })}
          />
          <TextField
            label="Weakness"
            value={c.weakness}
            locked={locked}
            onChange={(weakness) => u({ ...c, weakness })}
          />
        </SheetFieldGrid>
        {c.creation.status === 'draft' && <Creator c={c} u={u} />}
      </>
    ),
    attributes: (
      <>
        <SheetFieldGrid columns={3}>
          {(Object.keys(c.attributes) as AttributeKey[]).map((key) => (
            <Num
              key={key}
              label={`${key.toUpperCase()} · base ${baseChance(c.attributes[key])}`}
              value={c.attributes[key]}
              max={18}
              locked={locked}
              onChange={(n) =>
                u({ ...c, attributes: { ...c.attributes, [key]: n } })
              }
            />
          ))}
        </SheetFieldGrid>
        <SheetNotice>
          Movement {d.movement} · STR damage {d.strDamage} · AGL damage{' '}
          {d.aglDamage} · Carry {d.inventoryWeight}/{d.encumbrance}
        </SheetNotice>
      </>
    ),
    skills: (
      <div className="sheet-choice-grid">
        {c.skills.map((s) => (
          <SheetCard density="compact" key={s.id}>
            <SheetToolbar>
              <strong>
                {s.name} ({s.attribute.toUpperCase()})
              </strong>
              <Num
                label="Rating"
                value={s.rating}
                max={18}
                locked={locked}
                onChange={(rating) =>
                  u({
                    ...c,
                    skills: c.skills.map((x) =>
                      x.id === s.id ? { ...x, rating } : x,
                    ),
                  })
                }
              />
              <label>
                <input
                  type="checkbox"
                  checked={s.advancementMarked}
                  onChange={(e) =>
                    u({
                      ...c,
                      skills: c.skills.map((x) =>
                        x.id === s.id
                          ? { ...x, advancementMarked: e.target.checked }
                          : x,
                      ),
                    })
                  }
                />{' '}
                Advancement
              </label>
            </SheetToolbar>
          </SheetCard>
        ))}
      </div>
    ),
    abilities: (
      <>
        <div className="sheet-choice-grid">
          {c.abilities.map((a) => (
            <SheetCard density="compact" key={a.id}>
              <strong>{a.name}</strong>
              <small>
                {a.sourceId} · p. {a.page}
              </small>
              <label>
                <input
                  type="checkbox"
                  checked={a.active}
                  onChange={(e) =>
                    u({
                      ...c,
                      abilities: c.abilities.map((x) =>
                        x.id === a.id ? { ...x, active: e.target.checked } : x,
                      ),
                    })
                  }
                />{' '}
                Active
              </label>
            </SheetCard>
          ))}
        </div>
        <h3>Spells & tricks</h3>
        {[...c.magic.tricks, ...c.magic.spells].map((x) => (
          <SheetNotice key={x.id}>
            {x.name} · p. {x.page}
          </SheetNotice>
        ))}
      </>
    ),
    equipment: (
      <>
        <SheetNotice tone={d.overEncumbered ? 'warning' : 'info'}>
          Inventory weight {d.inventoryWeight} / {d.encumbrance}
          {d.overEncumbered ? ' · Over-encumbered' : ''}
        </SheetNotice>
        <SheetToolbar>
          <button
            className="secondary-button"
            disabled={locked}
            onClick={() => {
              const x = dragonbaneEquipment[0]!;
              u({
                ...c,
                inventory: [
                  ...c.inventory,
                  {
                    ...cited(x),
                    quantity: 1,
                    weight: x.weight,
                    state: 'carried',
                    tiny: false,
                    usesCurrent: 0,
                    usesMaximum: 0,
                    origin: 'custom',
                  },
                ],
              });
            }}
          >
            Add item
          </button>
        </SheetToolbar>
        {c.inventory.map((item) => (
          <SheetCard density="compact" key={item.id}>
            <SheetFieldGrid columns={4}>
              <TextField
                label="Item"
                value={item.name}
                locked={locked && item.origin === 'creation'}
                multiline={false}
                onChange={(name) =>
                  u({
                    ...c,
                    inventory: c.inventory.map((x) =>
                      x.id === item.id ? { ...x, name } : x,
                    ),
                  })
                }
              />
              <Num
                label="Quantity"
                value={item.quantity}
                onChange={(quantity) =>
                  u({
                    ...c,
                    inventory: c.inventory.map((x) =>
                      x.id === item.id ? { ...x, quantity } : x,
                    ),
                  })
                }
              />
              <Num
                label="Weight"
                value={item.weight}
                onChange={(weight) =>
                  u({
                    ...c,
                    inventory: c.inventory.map((x) =>
                      x.id === item.id ? { ...x, weight } : x,
                    ),
                  })
                }
              />
              <SheetField label="State">
                <select
                  value={item.state}
                  onChange={(e) =>
                    u({
                      ...c,
                      inventory: c.inventory.map((x) =>
                        x.id === item.id
                          ? { ...x, state: e.target.value as typeof item.state }
                          : x,
                      ),
                    })
                  }
                >
                  {['carried', 'equipped', 'stored', 'lost', 'destroyed'].map(
                    (x) => (
                      <option key={x}>{x}</option>
                    ),
                  )}
                </select>
              </SheetField>
            </SheetFieldGrid>
          </SheetCard>
        ))}
      </>
    ),
    weapons: (
      <>
        <SheetFieldGrid columns={2}>
          <TextField
            label="Armor"
            value={c.armor.name}
            locked={locked}
            multiline={false}
            onChange={(name) => u({ ...c, armor: { ...c.armor, name } })}
          />
          <Num
            label="Armor rating"
            value={c.armor.rating}
            locked={locked}
            onChange={(rating) => u({ ...c, armor: { ...c.armor, rating } })}
          />
        </SheetFieldGrid>
        <SheetToolbar>
          <button
            className="secondary-button"
            disabled={locked}
            onClick={() => {
              const x = dragonbaneWeapons[0]!;
              u({
                ...c,
                weapons: [
                  ...c.weapons,
                  {
                    ...cited(x),
                    grip: '1H',
                    range: '2',
                    damage: x.damage,
                    durabilityCurrent: x.durability,
                    durabilityMaximum: x.durability,
                    features: [],
                    ammunition: 0,
                    ready: false,
                    origin: 'custom',
                  },
                ],
              });
            }}
          >
            Add weapon
          </button>
        </SheetToolbar>
        {c.weapons.map((w) => (
          <SheetCard density="compact" key={w.id}>
            <SheetFieldGrid columns={4}>
              <TextField
                label="Weapon"
                value={w.name}
                locked={locked}
                multiline={false}
                onChange={(name) =>
                  u({
                    ...c,
                    weapons: c.weapons.map((x) =>
                      x.id === w.id ? { ...x, name } : x,
                    ),
                  })
                }
              />
              <TextField
                label="Damage"
                value={w.damage}
                locked={locked}
                multiline={false}
                onChange={(damage) =>
                  u({
                    ...c,
                    weapons: c.weapons.map((x) =>
                      x.id === w.id ? { ...x, damage } : x,
                    ),
                  })
                }
              />
              <Num
                label="Durability"
                value={w.durabilityCurrent}
                onChange={(durabilityCurrent) =>
                  u({
                    ...c,
                    weapons: c.weapons.map((x) =>
                      x.id === w.id ? { ...x, durabilityCurrent } : x,
                    ),
                  })
                }
              />
              <label>
                <input
                  type="checkbox"
                  checked={w.ready}
                  onChange={(e) =>
                    u({
                      ...c,
                      weapons: c.weapons.map((x) =>
                        x.id === w.id ? { ...x, ready: e.target.checked } : x,
                      ),
                    })
                  }
                />{' '}
                Ready
              </label>
            </SheetFieldGrid>
          </SheetCard>
        ))}
      </>
    ),
    conditions: (
      <>
        <div className="sheet-choice-grid">
          {(
            [
              'exhausted',
              'sickly',
              'dazed',
              'angry',
              'scared',
              'disheartened',
            ] as const
          ).map((condition) => (
            <label className="sheet-card sheet-card--compact" key={condition}>
              <input
                type="checkbox"
                checked={c.conditions.includes(condition)}
                onChange={(e) =>
                  u({
                    ...c,
                    conditions: e.target.checked
                      ? [...c.conditions, condition]
                      : c.conditions.filter((x) => x !== condition),
                  })
                }
              />
              {condition}
            </label>
          ))}
        </div>
        <SheetFieldGrid columns={3}>
          <Num
            label="Death successes"
            value={c.death.successes}
            max={3}
            onChange={(successes) =>
              u({ ...c, death: { ...c.death, successes } })
            }
          />
          <Num
            label="Death failures"
            value={c.death.failures}
            max={3}
            onChange={(failures) =>
              u({ ...c, death: { ...c.death, failures } })
            }
          />
          <label>
            <input
              type="checkbox"
              checked={c.death.rallied}
              onChange={(e) =>
                u({ ...c, death: { ...c.death, rallied: e.target.checked } })
              }
            />{' '}
            Rallied
          </label>
        </SheetFieldGrid>
      </>
    ),
    health: (
      <SheetFieldGrid columns={4}>
        <Num
          label="Current HP"
          value={c.resources.hpCurrent}
          max={c.resources.hpMaximum}
          onChange={(hpCurrent) =>
            u({ ...c, resources: { ...c.resources, hpCurrent } })
          }
        />
        <Num
          label="Maximum HP"
          value={c.resources.hpMaximum}
          locked={locked}
          onChange={(hpMaximum) =>
            u({ ...c, resources: { ...c.resources, hpMaximum } })
          }
        />
        <Num
          label="Current WP"
          value={c.resources.wpCurrent}
          max={c.resources.wpMaximum}
          onChange={(wpCurrent) =>
            u({ ...c, resources: { ...c.resources, wpCurrent } })
          }
        />
        <Num
          label="Maximum WP"
          value={c.resources.wpMaximum}
          locked={locked}
          onChange={(wpMaximum) =>
            u({ ...c, resources: { ...c.resources, wpMaximum } })
          }
        />
      </SheetFieldGrid>
    ),
    adventure: (
      <>
        <SheetFieldGrid columns={3}>
          <TextField
            label="Adventure"
            value={c.adventure.title}
            multiline={false}
            onChange={(title) =>
              u({ ...c, adventure: { ...c.adventure, title } })
            }
          />
          <TextField
            label="Location"
            value={c.adventure.location}
            multiline={false}
            onChange={(location) =>
              u({ ...c, adventure: { ...c.adventure, location } })
            }
          />
          <TextField
            label="Objective"
            value={c.adventure.objective}
            onChange={(objective) =>
              u({ ...c, adventure: { ...c.adventure, objective } })
            }
          />
        </SheetFieldGrid>
        <TextField
          label="Session notes"
          value={c.adventure.notes}
          onChange={(notes) =>
            u({ ...c, adventure: { ...c.adventure, notes } })
          }
        />
        <Roller c={c} u={u} />
      </>
    ),
    advancement: (
      <>
        <SheetNotice>
          Advancement is driven by marked Skills and d20 improvement rolls, not
          experience spending.
        </SheetNotice>
        <SheetToolbar>
          <button
            className="primary-button"
            onClick={() => {
              const marked = c.skills.filter((x) => x.advancementMarked);
              let skills = [...c.skills];
              const history = [...c.advancement],
                rollHistory = [...c.rollHistory];
              for (const s of marked) {
                const value = die(20),
                  raised = value > s.rating && s.rating < 18;
                skills = skills.map((x) =>
                  x.id === s.id
                    ? {
                        ...x,
                        rating: raised ? x.rating + 1 : x.rating,
                        advancementMarked: false,
                      }
                    : x,
                );
                history.push({
                  id: crypto.randomUUID(),
                  kind: 'advancement',
                  title: s.name,
                  description: `Rolled ${value} against ${s.rating}${raised ? '; rating increased.' : '; no increase.'}`,
                  createdAt: now(),
                });
                rollHistory.push({
                  id: crypto.randomUUID(),
                  kind: 'advancement',
                  name: s.name,
                  target: s.rating,
                  dice: [value],
                  selected: value,
                  boons: 0,
                  banes: 0,
                  outcome: raised ? 'increased' : 'unchanged',
                  pushed: false,
                  condition: null,
                  context: 'Advancement roll',
                  createdAt: now(),
                });
              }
              u({ ...c, skills, advancement: history, rollHistory });
            }}
          >
            Resolve marked Skills
          </button>
        </SheetToolbar>
        {c.advancement
          .slice()
          .reverse()
          .map((x) => (
            <SheetNotice key={x.id}>
              {x.title}: {x.description}
            </SheetNotice>
          ))}
        <SheetFieldGrid columns={2}>
          <Num
            label="Total Experience (optional)"
            value={c.totalExperience}
            onChange={(totalExperience) => u({ ...c, totalExperience })}
          />
          <Num
            label="Current Experience (optional)"
            value={c.currentExperience}
            onChange={(currentExperience) => u({ ...c, currentExperience })}
          />
        </SheetFieldGrid>
      </>
    ),
    records: (
      <>
        <TextField
          label="General notes"
          value={c.notes}
          onChange={(notes) => u({ ...c, notes })}
        />
        <SheetNotice>
          {c.rollHistory.length} rolls · {c.history.length} history records ·
          local-only storage
        </SheetNotice>
      </>
    ),
  };
  return (
    <LocalSheet
      title="Dragonbane"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => u({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) => u({ ...c, layout: { ...c.layout, [c.mode]: order } })}
      sections={dragonbaneSections}
      groups={dragonbaneGroups}
      content={content}
      status={status}
      onBack={() => void props.onBack()}
      onSave={() => void save()}
      settings={
        <>
          <p>
            Core rules are required. Adventure and card PDFs are not runtime
            sources.
          </p>
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
          {c.creation.status === 'finalized' && (
            <button
              className="secondary-button"
              onClick={() =>
                u({
                  ...c,
                  mode: 'build',
                  creation: {
                    ...c.creation,
                    status: 'draft',
                    rebuildDraft: structuredClone(c),
                  },
                })
              }
            >
              Reopen creator
            </button>
          )}
        </>
      }
    />
  );
}
