import { useState } from 'react';
import {
  SheetBadge,
  SheetCard,
  SheetField,
  SheetFieldGrid,
  SheetNotice,
} from '../../components/layout/SheetPrimitives';
import { exaltedVirtues } from './definitions';
import type { Exalted1eCharacter } from './schema';
import greatCurseData from './reference/lunar-great-curse.json';
import shapechangingRulesData from './reference/lunar-shapechanging-rules.json';

type LunarFamilyState = Extract<
  Exalted1eCharacter['familyState'],
  { type: 'lunar' }
>;

interface GreatCurseEntry {
  id: string;
  name: string;
  virtueId: string | null;
  summary: string;
  mechanics: string;
  compatibility: string;
  citation: { bookId: string; printedPage: number; pdfPage: number };
}

interface ShapechangingRuleEntry {
  id: string;
  name: string;
  summary: string;
  mechanics: string;
  compatibility: string;
  citation: { bookId: string; printedPage: number; pdfPage: number };
}

const greatCurseEntries = greatCurseData as GreatCurseEntry[];
const shapechangingRules = shapechangingRulesData as ShapechangingRuleEntry[];

interface Props {
  state: LunarFamilyState;
  buildMode: boolean;
  onChange: (state: LunarFamilyState) => void;
}

/**
 * Lunar's own Great Curse (the Limit-Trait analog -- see
 * `./reference/lunar-great-curse.json`) and innate Shapechanging power
 * (the Heart's Blood Background's known animal forms -- see
 * `./reference/lunar-shapechanging-rules.json`). Matches
 * `SiderealAstrologyPanel`'s own split: the generic Limit dots/notes stay
 * in `Exalted1eEditor.tsx`'s existing Traits section (relabeled "Great
 * Curse" for Lunar, reusing `character.limit` exactly like Abyssal reuses
 * it for Resonance), while this panel owns Lunar-specific state
 * (`familyState.lunar`) plus browsable reference text. This app has no
 * dice-rolling engine anywhere, so the Great Curse's Willpower-roll-vs-
 * full-moon trigger and the Shapechanging rules below are reference text
 * applied by hand, not automated.
 */
export function LunarShapechangingPanel({ state, buildMode, onChange }: Props) {
  const [newFormName, setNewFormName] = useState('');

  const addForm = () => {
    if (!newFormName.trim()) return;
    onChange({
      ...state,
      heartBloodForms: [
        ...state.heartBloodForms,
        { id: crypto.randomUUID(), name: newFormName.trim(), notes: '' },
      ],
    });
    setNewFormName('');
  };

  const removeForm = (formId: string) => {
    onChange({
      ...state,
      heartBloodForms: state.heartBloodForms.filter(
        (form) => form.id !== formId,
      ),
      activeFormId: state.activeFormId === formId ? null : state.activeFormId,
    });
  };

  const activeThrall = state.primaryVirtueId
    ? greatCurseEntries.find(
        (entry) => entry.virtueId === state.primaryVirtueId,
      )
    : undefined;
  const overview = greatCurseEntries.find((entry) => entry.virtueId === null);

  return (
    <>
      <SheetCard density="compact">
        <h3>Heart&rsquo;s Blood forms</h3>
        <p className="section-note">
          Every animal (or human) form this Lunar has drunk the heart&rsquo;s
          blood of, per the Heart&rsquo;s Blood Background (Exalted: The Lunars,
          Chapter Four). The known-form count here should track that
          Background&rsquo;s rating, though a character may add further forms
          during play regardless of her starting rating.
        </p>
        <div className="exalted-background-add">
          <label>
            <span>New form name</span>
            <input
              value={newFormName}
              disabled={!buildMode}
              onChange={(event) => setNewFormName(event.target.value)}
            />
          </label>
          <button
            className="secondary-button"
            type="button"
            disabled={!buildMode || !newFormName.trim()}
            onClick={addForm}
          >
            Add form
          </button>
        </div>
        {state.heartBloodForms.length === 0 ? (
          <p className="empty-inline">No Heart&rsquo;s Blood forms recorded.</p>
        ) : (
          state.heartBloodForms.map((form) => (
            <details className="exalted-compact-record" key={form.id}>
              <summary>
                <strong>{form.name || 'Unnamed form'}</strong>
                <span>
                  {state.activeFormId === form.id ? 'Active' : 'Known'}
                </span>
              </summary>
              <div className="exalted-record-fields">
                <label>
                  <span>Form name</span>
                  <input
                    value={form.name}
                    disabled={!buildMode}
                    onChange={(event) =>
                      onChange({
                        ...state,
                        heartBloodForms: state.heartBloodForms.map((entry) =>
                          entry.id === form.id
                            ? { ...entry, name: event.target.value }
                            : entry,
                        ),
                      })
                    }
                  />
                </label>
                <label>
                  <span>Notes (species, size, traits gained)</span>
                  <textarea
                    value={form.notes}
                    onChange={(event) =>
                      onChange({
                        ...state,
                        heartBloodForms: state.heartBloodForms.map((entry) =>
                          entry.id === form.id
                            ? { ...entry, notes: event.target.value }
                            : entry,
                        ),
                      })
                    }
                  />
                </label>
                <label className="choice-row">
                  <input
                    type="radio"
                    name="lunar-active-form"
                    checked={state.activeFormId === form.id}
                    onChange={() =>
                      onChange({ ...state, activeFormId: form.id })
                    }
                  />
                  <span>Currently assumed</span>
                </label>
                <button
                  className="small-button small-button--quiet"
                  type="button"
                  disabled={!buildMode}
                  onClick={() => removeForm(form.id)}
                >
                  Remove
                </button>
              </div>
            </details>
          ))
        )}
        <label className="choice-row">
          <input
            type="radio"
            name="lunar-active-form"
            checked={state.activeFormId === null}
            onChange={() => onChange({ ...state, activeFormId: null })}
          />
          <span>Natural (true) form</span>
        </label>
        <SheetNotice>
          Form Traits (Strength/Stamina/natural attacks gained per form) remain
          player-recorded in each form&rsquo;s notes until a complete,
          source-checked per-species stat catalog has passed verification.
        </SheetNotice>
      </SheetCard>

      <SheetCard density="compact">
        <h3>The Great Curse</h3>
        <p className="section-note">
          The Lunar analog of the Limit Trait: track the Limit rating (0-10) and
          Great Curse notes above in Traits. Declaring a primary Virtue here
          determines which inner beast takes over during Limit Break.
        </p>
        <SheetFieldGrid columns={2}>
          <SheetField label="Primary Virtue">
            <select
              value={state.primaryVirtueId ?? ''}
              disabled={!buildMode}
              onChange={(event) =>
                onChange({
                  ...state,
                  primaryVirtueId:
                    (event.target
                      .value as LunarFamilyState['primaryVirtueId']) || null,
                })
              }
            >
              <option value="">Undeclared</option>
              {exaltedVirtues.map((virtue) => (
                <option key={virtue.id} value={virtue.id}>
                  {virtue.label}
                </option>
              ))}
            </select>
          </SheetField>
        </SheetFieldGrid>
        {activeThrall ? (
          <SheetNotice tone="warning">
            <strong>{activeThrall.name}</strong>: {activeThrall.summary}
          </SheetNotice>
        ) : (
          <p className="empty-inline">
            Declare a primary Virtue to see this character&rsquo;s inner beast.
          </p>
        )}
        {overview ? (
          <details className="exalted-compact-record">
            <summary>
              <strong>{overview.name}</strong>
            </summary>
            <div className="exalted-record-fields">
              <p>{overview.summary}</p>
              <p className="section-note">{overview.mechanics}</p>
            </div>
          </details>
        ) : null}
        {greatCurseEntries
          .filter((entry) => entry.virtueId !== null)
          .map((entry) => (
            <details className="exalted-compact-record" key={entry.id}>
              <summary>
                <strong>{entry.name}</strong>{' '}
                <SheetBadge
                  tone={
                    entry.virtueId === state.primaryVirtueId
                      ? 'accent'
                      : 'neutral'
                  }
                >
                  {exaltedVirtues.find((v) => v.id === entry.virtueId)?.label ??
                    entry.virtueId}
                </SheetBadge>
              </summary>
              <div className="exalted-record-fields">
                <p>{entry.summary}</p>
                <p className="section-note">{entry.mechanics}</p>
              </div>
            </details>
          ))}
      </SheetCard>

      <SheetCard density="compact">
        <h3>Shapechanging rules reference</h3>
        <SheetNotice>
          Reference text only -- Arcane Record has no dice-rolling engine
          anywhere, so the 3-mote shapechanging action and the Tell&rsquo;s
          cosmetic manifestation below are applied by hand at the table.
        </SheetNotice>
        {shapechangingRules.map((rule) => (
          <details className="exalted-compact-record" key={rule.id}>
            <summary>
              <strong>{rule.name}</strong>
            </summary>
            <div className="exalted-record-fields">
              <p>{rule.summary}</p>
              <p className="section-note">{rule.mechanics}</p>
              <p className="section-note">
                Compatibility: {rule.compatibility}
              </p>
            </div>
          </details>
        ))}
      </SheetCard>
    </>
  );
}
