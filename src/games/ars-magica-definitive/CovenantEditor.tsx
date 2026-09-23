import type {
  GameCharacterEditorProps,
  GameSectionDefinition,
} from '../game-system';
import type { ReactNode } from 'react';
import { LocalSheet, TextField, useLocalSheet } from '../shared/LocalSheet';
import {
  SheetField,
  SheetFieldGrid,
  SheetNotice,
} from '../../components/layout/SheetPrimitives';
import { covenantSchema, type ArsCovenant } from './schema';

export const covenantSections: GameSectionDefinition[] = [
  ['covenant', 'Covenant'],
  ['members', 'Members'],
  ['boons', 'Boons & Hooks'],
  ['library', 'Library'],
  ['vis', 'Vis'],
  ['laboratories', 'Laboratories'],
  ['projects', 'Laboratory Projects'],
  ['records', 'Records'],
].map(([id, label]) => ({ id, label, group: id }));
const ref = (name: string) => ({
  id: crypto.randomUUID(),
  definitionId: null,
  name,
  status: 'custom' as const,
  citation: null,
  notes: '',
});

export function CovenantEditor(props: GameCharacterEditorProps<ArsCovenant>) {
  const {
    draft: c,
    update,
    status,
    save,
    download,
  } = useLocalSheet(props, covenantSchema);
  const content: Record<string, ReactNode> = {
    covenant: (
      <>
        <SheetFieldGrid columns={3}>
          <TextField
            label="Name"
            value={c.name}
            onChange={(name) => update({ ...c, name })}
            locked={c.mode === 'play'}
            multiline={false}
          />
          <TextField
            label="Saga"
            value={c.saga}
            onChange={(saga) => update({ ...c, saga })}
            multiline={false}
          />
          <TextField
            label="Location"
            value={c.location}
            onChange={(location) => update({ ...c, location })}
            multiline={false}
          />
          <SheetField label="Aura">
            <input
              type="number"
              value={c.aura}
              onChange={(e) =>
                Number.isSafeInteger(e.target.valueAsNumber) &&
                update({ ...c, aura: e.target.valueAsNumber })
              }
            />
          </SheetField>
          <SheetField label="Covenant season">
            <select
              value={c.covenantSeason}
              onChange={(e) =>
                update({
                  ...c,
                  covenantSeason: e.target
                    .value as ArsCovenant['covenantSeason'],
                })
              }
            >
              {['spring', 'summer', 'autumn', 'winter'].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </SheetField>
          <SheetField label="Build-point budget">
            <input
              type="number"
              min={0}
              value={c.buildPointBudget}
              readOnly={c.mode === 'play'}
              onChange={(e) =>
                Number.isSafeInteger(e.target.valueAsNumber) &&
                e.target.valueAsNumber >= 0 &&
                update({ ...c, buildPointBudget: e.target.valueAsNumber })
              }
            />
          </SheetField>
        </SheetFieldGrid>
        <p>
          Covenant season describes institutional maturity and is separate from
          the calendar season.
        </p>
      </>
    ),
    members: (
      <>
        <p>{c.memberIds.length} linked character records.</p>
        <SheetNotice tone="info">
          Links are browser-local. Imported snapshots require review before
          relinking.
        </SheetNotice>
      </>
    ),
    boons: (
      <>
        <ul>
          {c.boonsHooks.map((x) => (
            <li key={x.id}>
              {x.kind}: {x.name} ({x.points})
            </li>
          ))}
        </ul>
        {c.mode === 'build' && (
          <button
            className="secondary-button"
            onClick={() =>
              update({
                ...c,
                boonsHooks: [
                  ...c.boonsHooks,
                  { ...ref(''), kind: 'boon', points: 1 },
                ],
              })
            }
          >
            Add custom Boon
          </button>
        )}
      </>
    ),
    library: (
      <>
        <ul>
          {c.library.map((x) => (
            <li key={x.id}>
              {x.name}: {x.type}, level {x.level}, quality {x.quality}
            </li>
          ))}
        </ul>
        <button
          className="secondary-button"
          onClick={() =>
            update({
              ...c,
              library: [
                ...c.library,
                {
                  ...ref(''),
                  type: 'tractatus',
                  subjectId: 'custom',
                  quality: 0,
                  level: 0,
                  language: 'Latin',
                  authorId: null,
                },
              ],
            })
          }
        >
          Add library work
        </button>
      </>
    ),
    vis: (
      <>
        <ul>
          {c.vis.map((x, index) => (
            <li key={`${x.artId}-${index}`}>
              {x.artId}: {x.pawns} pawns; {x.annualIncome}/year
            </li>
          ))}
        </ul>
        <button
          className="secondary-button"
          onClick={() =>
            update({
              ...c,
              vis: [
                ...c.vis,
                { artId: 'ars.art.vim', pawns: 0, annualIncome: 0 },
              ],
            })
          }
        >
          Add vis stock
        </button>
      </>
    ),
    laboratories: (
      <>
        <ul>
          {c.laboratories.map((x) => (
            <li key={x.id}>
              {x.name || 'Unnamed laboratory'}: quality {x.quality}, size{' '}
              {x.size}, upkeep {x.upkeep}
            </li>
          ))}
        </ul>
        <button
          className="secondary-button"
          onClick={() =>
            update({
              ...c,
              laboratories: [
                ...c.laboratories,
                { ...ref(''), ownerId: null, quality: 0, size: 0, upkeep: 0 },
              ],
            })
          }
        >
          Add laboratory
        </button>
      </>
    ),
    projects: (
      <>
        <SheetNotice tone="warning">
          Project records are structured, but confirmation must use the atomic
          character/Covenant workflow when a character result or vis stock
          changes.
        </SheetNotice>
        <ul>
          {c.projects.map((x) => (
            <li key={x.id}>
              {x.kind}: {x.status}; {x.progress}/{x.effectLevel}; vis{' '}
              {x.visSpent}/{x.visCost}
            </li>
          ))}
        </ul>
        <button
          className="secondary-button"
          onClick={() =>
            update({
              ...c,
              projects: [
                ...c.projects,
                {
                  id: crypto.randomUUID(),
                  kind: 'invent-spell',
                  ownerId: 'unlinked',
                  status: 'planned',
                  labTotal: 0,
                  effectLevel: 0,
                  progress: 0,
                  visCost: 0,
                  visSpent: 0,
                  seasons: [],
                  notes: '',
                  citation: {
                    sourceId: 'ars.definitive',
                    book: 'Ars Magica Definitive Edition',
                    printedPage: 253,
                    pdfPage: 261,
                  },
                },
              ],
            })
          }
        >
          Plan laboratory project
        </button>
      </>
    ),
    records: (
      <>
        <TextField
          label="Covenant notes"
          value={c.notes}
          onChange={(notes) => update({ ...c, notes })}
        />
        <p>{c.history.length} immutable history records.</p>
      </>
    ),
  };
  return (
    <LocalSheet
      title="Ars Magica Covenant"
      name={c.name}
      mode={c.mode}
      onMode={(mode) => update({ ...c, mode })}
      order={c.layout[c.mode]}
      onOrder={(order) =>
        update({ ...c, layout: { ...c.layout, [c.mode]: order } })
      }
      sections={covenantSections}
      content={content}
      status={status}
      onBack={() =>
        void save()
          .then(props.onBack)
          .catch(() => undefined)
      }
      onSave={() => void save().catch(() => undefined)}
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
