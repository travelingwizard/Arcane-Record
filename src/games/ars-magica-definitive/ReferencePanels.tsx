import {
  SheetCard,
  SheetField,
  SheetFieldGrid,
  SheetToolbar,
} from '../../components/layout/SheetPrimitives';
import { TextField } from '../shared/LocalSheet';
import { artCatalog } from './catalog';
import { scoreFromExperience } from './experience';
import type { ArsCharacter } from './schema';

type Props = {
  character: ArsCharacter;
  onChange: (character: ArsCharacter) => void;
};

const title = (value: string) =>
  value
    .replace(/([A-Z])/g, ' $1')
    .replace(/^./, (letter) => letter.toUpperCase());

const traitScore = (character: ArsCharacter, definitionId: string) => {
  const trait = character.definition.traits.find(
    (candidate) => candidate.definitionId === definitionId,
  );
  return trait ? scoreFromExperience(trait.experience, trait.scale) : 0;
};

export function MagicTotalsPanel({ character: c }: Pick<Props, 'character'>) {
  const technique = artCatalog.find((art) => art.id === 'ars.art.creo')!;
  const form = artCatalog.find((art) => art.id === 'ars.art.vim')!;
  const techniqueScore = traitScore(c, technique.id);
  const formScore = traitScore(c, form.id);
  const aura = c.covenantSnapshot?.aura ?? 0;
  const { stamina, intelligence, quickness, perception } =
    c.definition.characteristics;
  const finesse = traitScore(c, 'ars.ability.finesse');
  const awareness = traitScore(c, 'ars.ability.awareness');
  const concentration = traitScore(c, 'ars.ability.concentration');
  const magicTheory = traitScore(c, 'ars.ability.magic-theory');
  const parma = traitScore(c, 'ars.ability.parma-magica');
  const castingBase = techniqueScore + formScore + stamina + aura;
  return (
    <>
      <p>
        Reference pair: Creo + Vim. Situational modifiers, requisites, words,
        gestures, fatigue, vis, and dice belong to the reviewed casting
        workflow.
      </p>
      <SheetFieldGrid columns={3}>
        <SheetField label="Formulaic casting base">
          <output>{castingBase}</output>
        </SheetField>
        <SheetField label="Ritual casting base">
          <output>
            {castingBase +
              traitScore(c, 'ars.ability.artes-liberales') +
              traitScore(c, 'ars.ability.philosophiae')}
          </output>
        </SheetField>
        <SheetField label="Spontaneous no-fatigue level">
          <output>{Math.floor(castingBase / 5)}</output>
        </SheetField>
        <SheetField label="Basic lab total">
          <output>
            {techniqueScore + formScore + intelligence + magicTheory + aura}
          </output>
        </SheetField>
        <SheetField label="Fast-casting speed base">
          <output>{quickness + finesse}</output>
        </SheetField>
        <SheetField label="Determine effect base">
          <output>{perception + awareness}</output>
        </SheetField>
        <SheetField label="Targeting base">
          <output>{perception + finesse}</output>
        </SheetField>
        <SheetField label="Concentration base">
          <output>{stamina + concentration}</output>
        </SheetField>
        <SheetField label="Magic resistance base">
          <output>{parma * 5 + formScore}</output>
        </SheetField>
      </SheetFieldGrid>
    </>
  );
}

export function BiographyPanel({ character: c, onChange }: Props) {
  const locked = c.mode === 'play';
  const keys = [
    'birthName',
    'nationality',
    'placeOfOrigin',
    'religion',
    'titleProfession',
    'height',
    'weight',
    'hair',
    'eyes',
    'handedness',
    'gender',
    'setting',
  ] as const;
  return (
    <>
      <SheetFieldGrid columns={3}>
        <SheetField label="Current year">
          <input
            type="number"
            value={c.definition.currentYear}
            readOnly={locked}
            onChange={(event) =>
              Number.isInteger(event.target.valueAsNumber) &&
              onChange({
                ...c,
                definition: {
                  ...c.definition,
                  currentYear: event.target.valueAsNumber,
                },
              })
            }
          />
        </SheetField>
        <SheetField label="Year born">
          <input
            type="number"
            value={c.definition.yearBorn ?? ''}
            readOnly={locked}
            onChange={(event) =>
              onChange({
                ...c,
                definition: {
                  ...c.definition,
                  yearBorn:
                    event.target.value === ''
                      ? null
                      : event.target.valueAsNumber,
                },
              })
            }
          />
        </SheetField>
        <SheetField label="Size">
          <input
            type="number"
            value={c.definition.size}
            readOnly={locked}
            onChange={(event) =>
              Number.isInteger(event.target.valueAsNumber) &&
              onChange({
                ...c,
                definition: {
                  ...c.definition,
                  size: event.target.valueAsNumber,
                },
              })
            }
          />
        </SheetField>
        {keys.map((key) => (
          <TextField
            key={key}
            label={title(key)}
            value={c.definition[key]}
            locked={locked}
            multiline={false}
            onChange={(value) =>
              onChange({ ...c, definition: { ...c.definition, [key]: value } })
            }
          />
        ))}
      </SheetFieldGrid>
      <h3>Personality traits</h3>
      {c.definition.personality.map((record) => (
        <SheetFieldGrid key={record.id} columns={2}>
          <TextField
            label="Trait"
            value={record.name}
            locked={locked}
            multiline={false}
            onChange={(name) =>
              onChange({
                ...c,
                definition: {
                  ...c.definition,
                  personality: c.definition.personality.map((x) =>
                    x.id === record.id ? { ...x, name } : x,
                  ),
                },
              })
            }
          />
          <SheetField label="Score">
            <input
              type="number"
              value={record.rating}
              readOnly={locked}
              onChange={(event) =>
                Number.isInteger(event.target.valueAsNumber) &&
                onChange({
                  ...c,
                  definition: {
                    ...c.definition,
                    personality: c.definition.personality.map((x) =>
                      x.id === record.id
                        ? { ...x, rating: event.target.valueAsNumber }
                        : x,
                    ),
                  },
                })
              }
            />
          </SheetField>
        </SheetFieldGrid>
      ))}
      {!locked && (
        <button
          className="secondary-button"
          onClick={() =>
            onChange({
              ...c,
              definition: {
                ...c.definition,
                personality: [
                  ...c.definition.personality,
                  { id: crypto.randomUUID(), name: '', rating: 0 },
                ],
              },
            })
          }
        >
          Add personality trait
        </button>
      )}
      <h3>Reputations</h3>
      {c.definition.reputations.map((record) => (
        <SheetCard key={record.id} density="compact">
          <SheetFieldGrid columns={3}>
            {(['name', 'type', 'notes'] as const).map((key) => (
              <TextField
                key={key}
                label={title(key)}
                value={record[key]}
                multiline={key === 'notes'}
                onChange={(value) =>
                  onChange({
                    ...c,
                    definition: {
                      ...c.definition,
                      reputations: c.definition.reputations.map((x) =>
                        x.id === record.id ? { ...x, [key]: value } : x,
                      ),
                    },
                  })
                }
              />
            ))}
            <SheetField label="Score">
              <input
                type="number"
                value={record.score}
                onChange={(event) =>
                  Number.isInteger(event.target.valueAsNumber) &&
                  onChange({
                    ...c,
                    definition: {
                      ...c.definition,
                      reputations: c.definition.reputations.map((x) =>
                        x.id === record.id
                          ? { ...x, score: event.target.valueAsNumber }
                          : x,
                      ),
                    },
                  })
                }
              />
            </SheetField>
          </SheetFieldGrid>
        </SheetCard>
      ))}
      <button
        className="secondary-button"
        onClick={() =>
          onChange({
            ...c,
            definition: {
              ...c.definition,
              reputations: [
                ...c.definition.reputations,
                {
                  id: crypto.randomUUID(),
                  name: '',
                  type: '',
                  score: 0,
                  notes: '',
                },
              ],
            },
          })
        }
      >
        Add reputation
      </button>
    </>
  );
}

export function CombatEquipmentPanel({ character: c, onChange }: Props) {
  const armor = c.play.armor;
  return (
    <>
      <h3>Armor and combat</h3>
      <SheetFieldGrid columns={3}>
        <TextField
          label="Armor worn"
          value={armor.name}
          multiline={false}
          onChange={(name) =>
            onChange({ ...c, play: { ...c.play, armor: { ...armor, name } } })
          }
        />
        <SheetField label="Soak">
          <input
            type="number"
            value={armor.soak}
            onChange={(e) =>
              Number.isInteger(e.target.valueAsNumber) &&
              onChange({
                ...c,
                play: {
                  ...c.play,
                  armor: { ...armor, soak: e.target.valueAsNumber },
                },
              })
            }
          />
        </SheetField>
        <SheetField label="Armor load">
          <input
            type="number"
            min={0}
            value={armor.load}
            onChange={(e) =>
              Number.isInteger(e.target.valueAsNumber) &&
              e.target.valueAsNumber >= 0 &&
              onChange({
                ...c,
                play: {
                  ...c.play,
                  armor: { ...armor, load: e.target.valueAsNumber },
                },
              })
            }
          />
        </SheetField>
        <TextField
          label="Combat modifiers"
          value={c.play.combatModifiers}
          onChange={(combatModifiers) =>
            onChange({ ...c, play: { ...c.play, combatModifiers } })
          }
        />
      </SheetFieldGrid>
      <h3>Weapons</h3>
      {c.play.weapons.map((weapon) => (
        <SheetCard key={weapon.id} density="compact">
          <SheetFieldGrid columns={3}>
            <TextField
              label="Weapon"
              value={weapon.name}
              multiline={false}
              onChange={(name) =>
                onChange({
                  ...c,
                  play: {
                    ...c.play,
                    weapons: c.play.weapons.map((x) =>
                      x.id === weapon.id ? { ...x, name } : x,
                    ),
                  },
                })
              }
            />
            {(
              ['initiative', 'attack', 'defense', 'damage', 'load'] as const
            ).map((key) => (
              <SheetField key={key} label={title(key)}>
                <input
                  type="number"
                  value={weapon[key]}
                  onChange={(e) =>
                    Number.isInteger(e.target.valueAsNumber) &&
                    onChange({
                      ...c,
                      play: {
                        ...c.play,
                        weapons: c.play.weapons.map((x) =>
                          x.id === weapon.id
                            ? { ...x, [key]: e.target.valueAsNumber }
                            : x,
                        ),
                      },
                    })
                  }
                />
              </SheetField>
            ))}
            <TextField
              label="Range"
              value={weapon.range}
              multiline={false}
              onChange={(range) =>
                onChange({
                  ...c,
                  play: {
                    ...c.play,
                    weapons: c.play.weapons.map((x) =>
                      x.id === weapon.id ? { ...x, range } : x,
                    ),
                  },
                })
              }
            />
            <TextField
              label="Notes"
              value={weapon.notes}
              onChange={(notes) =>
                onChange({
                  ...c,
                  play: {
                    ...c.play,
                    weapons: c.play.weapons.map((x) =>
                      x.id === weapon.id ? { ...x, notes } : x,
                    ),
                  },
                })
              }
            />
          </SheetFieldGrid>
        </SheetCard>
      ))}
      <SheetToolbar>
        <button
          className="secondary-button"
          onClick={() =>
            onChange({
              ...c,
              play: {
                ...c.play,
                weapons: [
                  ...c.play.weapons,
                  {
                    id: crypto.randomUUID(),
                    name: '',
                    abilityId: null,
                    initiative: 0,
                    attack: 0,
                    defense: 0,
                    damage: 0,
                    load: 0,
                    range: '',
                    notes: '',
                    readied: false,
                  },
                ],
              },
            })
          }
        >
          Add weapon
        </button>
      </SheetToolbar>
      <h3>Equipment</h3>
      {c.inventory.map((item) => (
        <SheetCard key={item.id} density="compact">
          <SheetFieldGrid columns={3}>
            <TextField
              label="Item"
              value={item.name}
              multiline={false}
              onChange={(name) =>
                onChange({
                  ...c,
                  inventory: c.inventory.map((x) =>
                    x.id === item.id ? { ...x, name } : x,
                  ),
                })
              }
            />
            <SheetField label="Quantity">
              <input
                type="number"
                min={0}
                value={item.quantity}
                onChange={(e) =>
                  Number.isInteger(e.target.valueAsNumber) &&
                  e.target.valueAsNumber >= 0 &&
                  onChange({
                    ...c,
                    inventory: c.inventory.map((x) =>
                      x.id === item.id
                        ? { ...x, quantity: e.target.valueAsNumber }
                        : x,
                    ),
                  })
                }
              />
            </SheetField>
            <SheetField label="Load">
              <input
                type="number"
                min={0}
                value={item.load}
                onChange={(e) =>
                  Number.isInteger(e.target.valueAsNumber) &&
                  e.target.valueAsNumber >= 0 &&
                  onChange({
                    ...c,
                    inventory: c.inventory.map((x) =>
                      x.id === item.id
                        ? { ...x, load: e.target.valueAsNumber }
                        : x,
                    ),
                  })
                }
              />
            </SheetField>
            <TextField
              label="Notes"
              value={item.notes}
              onChange={(notes) =>
                onChange({
                  ...c,
                  inventory: c.inventory.map((x) =>
                    x.id === item.id ? { ...x, notes } : x,
                  ),
                })
              }
            />
          </SheetFieldGrid>
        </SheetCard>
      ))}
      <button
        className="secondary-button"
        onClick={() =>
          onChange({
            ...c,
            inventory: [
              ...c.inventory,
              {
                id: crypto.randomUUID(),
                definitionId: null,
                name: '',
                status: 'custom',
                citation: null,
                notes: '',
                quantity: 1,
                equipped: false,
                load: 0,
                carried: true,
              },
            ],
          })
        }
      >
        Add equipment
      </button>
    </>
  );
}

export function HermeticReferencePanel({ character: c, onChange }: Props) {
  const identity = c.definition.hermeticIdentity;
  const familiar = c.play.familiar;
  return (
    <>
      <SheetFieldGrid columns={3}>
        {(Object.keys(identity) as (keyof typeof identity)[]).map((key) => (
          <TextField
            key={key}
            label={title(key)}
            value={identity[key]}
            multiline={false}
            onChange={(value) =>
              onChange({
                ...c,
                definition: {
                  ...c.definition,
                  hermeticIdentity: { ...identity, [key]: value },
                },
              })
            }
          />
        ))}
      </SheetFieldGrid>
      <h3>Raw vis</h3>
      {c.play.rawVis.map((vis) => (
        <SheetFieldGrid key={vis.id} columns={3}>
          <TextField
            label="Art ID"
            value={vis.artId}
            multiline={false}
            onChange={(artId) =>
              onChange({
                ...c,
                play: {
                  ...c.play,
                  rawVis: c.play.rawVis.map((x) =>
                    x.id === vis.id ? { ...x, artId } : x,
                  ),
                },
              })
            }
          />
          <SheetField label="Pawns">
            <input
              type="number"
              min={0}
              value={vis.pawns}
              onChange={(e) =>
                Number.isInteger(e.target.valueAsNumber) &&
                e.target.valueAsNumber >= 0 &&
                onChange({
                  ...c,
                  play: {
                    ...c.play,
                    rawVis: c.play.rawVis.map((x) =>
                      x.id === vis.id
                        ? { ...x, pawns: e.target.valueAsNumber }
                        : x,
                    ),
                  },
                })
              }
            />
          </SheetField>
          <TextField
            label="Physical form"
            value={vis.physicalForm}
            multiline={false}
            onChange={(physicalForm) =>
              onChange({
                ...c,
                play: {
                  ...c.play,
                  rawVis: c.play.rawVis.map((x) =>
                    x.id === vis.id ? { ...x, physicalForm } : x,
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
          onChange({
            ...c,
            play: {
              ...c.play,
              rawVis: [
                ...c.play.rawVis,
                {
                  id: crypto.randomUUID(),
                  artId: 'ars.art.vim',
                  pawns: 0,
                  physicalForm: '',
                },
              ],
            },
          })
        }
      >
        Add raw vis
      </button>
      <h3>Familiar</h3>
      <SheetFieldGrid columns={3}>
        {(['name', 'description', 'qualities', 'notes'] as const).map((key) => (
          <TextField
            key={key}
            label={title(key)}
            value={familiar[key]}
            multiline={key !== 'name'}
            onChange={(value) =>
              onChange({
                ...c,
                play: { ...c.play, familiar: { ...familiar, [key]: value } },
              })
            }
          />
        ))}
        {(
          [
            'intelligenceCunning',
            'perception',
            'strength',
            'stamina',
            'presence',
            'communication',
            'dexterity',
            'quickness',
            'might',
            'size',
            'soak',
            'fatigue',
            'initiative',
            'attack',
            'defense',
            'damage',
            'bronzeCord',
            'silverCord',
            'goldCord',
          ] as const
        ).map((key) => (
          <SheetField key={key} label={title(key)}>
            <input
              type="number"
              value={familiar[key]}
              onChange={(e) =>
                Number.isInteger(e.target.valueAsNumber) &&
                onChange({
                  ...c,
                  play: {
                    ...c.play,
                    familiar: { ...familiar, [key]: e.target.valueAsNumber },
                  },
                })
              }
            />
          </SheetField>
        ))}
      </SheetFieldGrid>
    </>
  );
}

export function SpellsReferencePanel({ character: c, onChange }: Props) {
  const locked = c.mode === 'play';
  return (
    <>
      {c.definition.spells.map((spell) => (
        <SheetCard key={spell.id} density="compact">
          <SheetFieldGrid columns={3}>
            <TextField
              label="Spell"
              value={spell.name}
              locked={locked}
              multiline={false}
              onChange={(name) =>
                onChange({
                  ...c,
                  definition: {
                    ...c.definition,
                    spells: c.definition.spells.map((x) =>
                      x.id === spell.id ? { ...x, name } : x,
                    ),
                  },
                })
              }
            />
            {(
              ['techniqueId', 'formId', 'range', 'duration', 'target'] as const
            ).map((key) => (
              <TextField
                key={key}
                label={title(key)}
                value={spell[key]}
                locked={locked}
                multiline={false}
                onChange={(value) =>
                  onChange({
                    ...c,
                    definition: {
                      ...c.definition,
                      spells: c.definition.spells.map((x) =>
                        x.id === spell.id ? { ...x, [key]: value } : x,
                      ),
                    },
                  })
                }
              />
            ))}
            {(['level', 'castingBonus', 'masteryExperience'] as const).map(
              (key) => (
                <SheetField key={key} label={title(key)}>
                  <input
                    type="number"
                    value={spell[key]}
                    readOnly={locked && key !== 'masteryExperience'}
                    onChange={(e) =>
                      Number.isInteger(e.target.valueAsNumber) &&
                      onChange({
                        ...c,
                        definition: {
                          ...c.definition,
                          spells: c.definition.spells.map((x) =>
                            x.id === spell.id
                              ? { ...x, [key]: e.target.valueAsNumber }
                              : x,
                          ),
                        },
                      })
                    }
                  />
                </SheetField>
              ),
            )}
            <TextField
              label="Notes"
              value={spell.notes}
              onChange={(notes) =>
                onChange({
                  ...c,
                  definition: {
                    ...c.definition,
                    spells: c.definition.spells.map((x) =>
                      x.id === spell.id ? { ...x, notes } : x,
                    ),
                  },
                })
              }
            />
          </SheetFieldGrid>
        </SheetCard>
      ))}
      {!locked && (
        <button
          className="secondary-button"
          onClick={() =>
            onChange({
              ...c,
              definition: {
                ...c.definition,
                spells: [
                  ...c.definition.spells,
                  {
                    id: crypto.randomUUID(),
                    definitionId: null,
                    name: '',
                    status: 'custom',
                    citation: null,
                    notes: '',
                    techniqueId: 'ars.art.creo',
                    formId: 'ars.art.vim',
                    level: 0,
                    castingBonus: 0,
                    range: '',
                    duration: '',
                    target: '',
                    masteryExperience: 0,
                    masteryOptions: [],
                    requisiteIds: [],
                  },
                ],
              },
            })
          }
        >
          Add custom spell
        </button>
      )}
    </>
  );
}
