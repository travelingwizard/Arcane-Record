import type { ReactNode } from 'react';
import {
  SheetCard,
  SheetFieldGrid,
  SheetNotice,
} from '../../components/layout/SheetPrimitives';
import type { GameCharacterEditorProps } from '../game-system';
import { LocalSheet, TextField, useLocalSheet } from '../shared/LocalSheet';
import { wrongnessStages } from './catalog';
import { townGroups, townSections } from './definitions';
import { ConflictList, DiceEditor, NumberField } from './DitvControls';
import { addDice, generateProtoBatch, formatDice, sumRatedDice } from './rules';
import { ditvTownSchema, type DitvNpc, type DitvTown } from './schema';

export function DitvTownEditor(props: GameCharacterEditorProps<DitvTown>) {
  const sheet = useLocalSheet(props, ditvTownSchema),
    town = sheet.draft;
  const set = <K extends keyof DitvTown>(key: K, value: DitvTown[K]) =>
    sheet.update({ ...town, [key]: value, revision: town.revision + 1 });
  const setNpc = (index: number, npc: DitvNpc) =>
    set(
      'npcs',
      town.npcs.map((x, i) => (i === index ? npc : x)),
    );
  const content: Record<string, ReactNode> = {
    town: (
      <SheetFieldGrid columns={3}>
        <TextField
          label="Town"
          value={town.name}
          multiline={false}
          onChange={(v) => set('name', v)}
        />
        <TextField
          label="GM"
          value={town.gm}
          multiline={false}
          onChange={(v) => set('gm', v)}
        />
        <TextField
          label="Player-safe assignment"
          value={town.assignment}
          onChange={(v) => set('assignment', v)}
        />
      </SheetFieldGrid>
    ),
    wrongness: (
      <div className="sheet-stack">
        <button
          className="secondary-button"
          onClick={() =>
            set('problems', [
              ...town.problems,
              {
                id: crypto.randomUUID(),
                label: 'Additional problem',
                pride: '',
                injustice: '',
                sin: '',
                demonicAttacks: '',
                falseDoctrine: '',
                corruptWorship: '',
                falsePriesthood: '',
                sorcery: '',
                hateMurder: '',
              },
            ])
          }
        >
          Add problem chain
        </button>
        {town.problems.map((problem, index) => (
          <SheetCard key={problem.id}>
            <TextField
              label="Problem label"
              value={problem.label}
              multiline={false}
              onChange={(label) =>
                set(
                  'problems',
                  town.problems.map((x, i) =>
                    i === index ? { ...x, label } : x,
                  ),
                )
              }
            />
            {wrongnessStages.map(([id, label]) => {
              const field = id.replace(/-([a-z])/g, (_, letter: string) =>
                letter.toUpperCase(),
              ) as Exclude<keyof typeof problem, 'id' | 'label'>;
              return (
                <TextField
                  key={id}
                  label={label}
                  value={problem[field]}
                  onChange={(value) =>
                    set(
                      'problems',
                      town.problems.map((x, i) =>
                        i === index ? { ...x, [field]: value } : x,
                      ),
                    )
                  }
                />
              );
            })}
          </SheetCard>
        ))}
      </div>
    ),
    wants: (
      <>
        <TextField
          label="What do the demons want?"
          value={town.demonWants}
          onChange={(v) => set('demonWants', v)}
        />
        <TextField
          label="What do they want the Dogs to do?"
          value={town.demonWantsFromDogs}
          onChange={(v) => set('demonWantsFromDogs', v)}
        />
        <TextField
          label="What happens if the Dogs never come?"
          value={town.withoutDogs}
          onChange={(v) => set('withoutDogs', v)}
        />
      </>
    ),
    townspeople: (
      <div className="sheet-stack">
        <button
          className="secondary-button"
          onClick={() =>
            set('townspeople', [
              ...town.townspeople,
              {
                id: crypto.randomUUID(),
                name: '',
                role: '',
                wants: '',
                npcId: null,
                notes: '',
              },
            ])
          }
        >
          Add townsperson
        </button>
        {town.townspeople.map((person, index) => (
          <SheetCard key={person.id}>
            <SheetFieldGrid columns={3}>
              <TextField
                label="Name"
                value={person.name}
                multiline={false}
                onChange={(name) =>
                  set(
                    'townspeople',
                    town.townspeople.map((x, i) =>
                      i === index ? { ...x, name } : x,
                    ),
                  )
                }
              />
              <TextField
                label="Role"
                value={person.role}
                multiline={false}
                onChange={(role) =>
                  set(
                    'townspeople',
                    town.townspeople.map((x, i) =>
                      i === index ? { ...x, role } : x,
                    ),
                  )
                }
              />
              <label className="sheet-field field">
                <span>NPC dice</span>
                <select
                  value={person.npcId ?? ''}
                  onChange={(e) =>
                    set(
                      'townspeople',
                      town.townspeople.map((x, i) =>
                        i === index
                          ? { ...x, npcId: e.target.value || null }
                          : x,
                      ),
                    )
                  }
                >
                  <option value="">Not assigned</option>
                  {town.npcs.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.name || 'Proto-NPC'}
                    </option>
                  ))}
                </select>
              </label>
            </SheetFieldGrid>
            <TextField
              label="What do they want from the Dogs?"
              value={person.wants}
              onChange={(wants) =>
                set(
                  'townspeople',
                  town.townspeople.map((x, i) =>
                    i === index ? { ...x, wants } : x,
                  ),
                )
              }
            />
            <TextField
              label="Notes"
              value={person.notes}
              onChange={(notes) =>
                set(
                  'townspeople',
                  town.townspeople.map((x, i) =>
                    i === index ? { ...x, notes } : x,
                  ),
                )
              }
            />
          </SheetCard>
        ))}
      </div>
    ),
    npcs: (
      <div className="sheet-stack">
        <button
          className="primary-button"
          onClick={() => {
            const batch = generateProtoBatch();
            sheet.update({
              ...town,
              npcs: [...town.npcs, ...batch.npcs],
              freeDice: addDice(town.freeDice, batch.freeDice),
              revision: town.revision + 1,
            });
          }}
        >
          Generate six proto-NPCs
        </button>
        <DiceEditor
          label="Shared Free Dice"
          value={town.freeDice}
          onChange={(v) => set('freeDice', v)}
        />
        {town.npcs.map((npc, index) => (
          <SheetCard key={npc.id} density="compact">
            <SheetFieldGrid columns={3}>
              <TextField
                label="Name"
                value={npc.name}
                multiline={false}
                onChange={(name) =>
                  setNpc(index, {
                    ...npc,
                    name,
                    status: name ? 'assigned' : 'proto',
                  })
                }
              />
              <label className="sheet-field field">
                <span>Type</span>
                <select
                  value={npc.kind}
                  onChange={(e) =>
                    setNpc(index, {
                      ...npc,
                      kind: e.target.value as DitvNpc['kind'],
                    })
                  }
                >
                  {['ordinary', 'group', 'possessed', 'sorcerer'].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </label>
              <NumberField
                label="Group size"
                min={1}
                value={npc.groupSize}
                onChange={(groupSize) => setNpc(index, { ...npc, groupSize })}
              />
            </SheetFieldGrid>
            <p>
              Acuity {npc.stats.acuity}d6 · Body {npc.stats.body}d6 · Heart{' '}
              {npc.stats.heart}d6 · Will {npc.stats.will}d6
            </p>
            <p>
              Traits {formatDice(sumRatedDice(npc.traits))} · Relationships{' '}
              {formatDice(sumRatedDice(npc.relationships))}
            </p>
            <TextField
              label="Wants"
              value={npc.wants}
              onChange={(wants) => setNpc(index, { ...npc, wants })}
            />
            <TextField
              label="Manifestations (one per line)"
              value={npc.manifestations.join('\n')}
              onChange={(v) =>
                setNpc(index, {
                  ...npc,
                  manifestations: v.split('\n').filter(Boolean),
                })
              }
            />
            <TextField
              label="Notes"
              value={npc.notes}
              onChange={(notes) => setNpc(index, { ...npc, notes })}
            />
          </SheetCard>
        ))}
      </div>
    ),
    influence: (
      <>
        <DiceEditor
          label="Demonic Influence"
          value={town.demonicInfluence}
          onChange={(v) => set('demonicInfluence', v)}
        />
        <SheetNotice>
          Demons have no separate Stats. Their influence enters conflicts only
          through the verified opposition and relationship rules.
        </SheetNotice>
      </>
    ),
    conflicts: (
      <ConflictList
        conflicts={town.conflicts}
        onChange={(v) => set('conflicts', v)}
      />
    ),
    records: (
      <>
        <TextField
          label="Private GM notes"
          value={town.privateNotes}
          onChange={(v) => set('privateNotes', v)}
        />
        <TextField
          label="General notes"
          value={town.notes}
          onChange={(v) => set('notes', v)}
        />
        <SheetNotice>
          Character snapshots contain only Town name, revision, and player-safe
          assignment. Problems, NPC secrets, and private notes stay here.
        </SheetNotice>
      </>
    ),
  };
  return (
    <LocalSheet
      title="Dogs in the Vineyard Town"
      name={town.name}
      mode={town.mode}
      onMode={(v) => set('mode', v)}
      order={town.layout[town.mode]}
      onOrder={(order) =>
        sheet.update({
          ...town,
          layout: { ...town.layout, [town.mode]: order },
        })
      }
      sections={townSections}
      groups={townGroups}
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
