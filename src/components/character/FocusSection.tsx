import { useState } from 'react';
import { MageReferenceCatalog as ReferenceCatalog } from '../../games/mage20/supplements/MageReferenceCatalog';
import { SheetSection } from '../layout/SheetSection';
import { useEditorStore } from '../../state/editor-store';
import {
  focusCatalogs,
  type FocusKind,
} from '../../systems/mage-m20/reference/focus';
import { FocusSelectionList } from './focus/FocusSelectionList';

const kindLabels: Record<FocusKind, string> = {
  paradigm: 'Paradigm',
  practice: 'Practice',
  instrument: 'Instrument',
};

export function FocusSection() {
  const character = useEditorStore((state) => state.character);
  const addFocusSelection = useEditorStore((state) => state.addFocusSelection);
  const updateFocusSelection = useEditorStore(
    (state) => state.updateFocusSelection,
  );
  const removeFocusSelection = useEditorStore(
    (state) => state.removeFocusSelection,
  );
  const updateFocusText = useEditorStore((state) => state.updateFocusText);
  const lastRemoval = useEditorStore((state) => state.lastMagickRemoval);
  const undoMagickRemoval = useEditorStore((state) => state.undoMagickRemoval);
  const [catalogKind, setCatalogKind] = useState<FocusKind | null>(null);
  const [customKind, setCustomKind] = useState<FocusKind>('paradigm');
  const [customName, setCustomName] = useState('');

  if (!character) {
    return null;
  }

  const focus = character.repeatableEntries.focus;
  const allSelections = [
    ...focus.paradigms,
    ...focus.practices,
    ...focus.instruments,
  ];
  const selectedDefinitionIds = new Set(
    allSelections.flatMap((selection) =>
      selection.definitionId ? [selection.definitionId] : [],
    ),
  );
  const activeCatalog = catalogKind ? focusCatalogs[catalogKind] : [];

  return (
    <SheetSection
      id="focus"
      eyebrow="Paradigm · Practice · Instruments"
      title="Focus"
      description="Record what your mage believes, how they work, and the instruments through which they shape reality."
      actions={
        <button
          type="button"
          className="secondary-button"
          aria-expanded={catalogKind !== null}
          aria-controls="focus-reference-catalog"
          onClick={() =>
            setCatalogKind((current) => (current ? null : 'paradigm'))
          }
        >
          {catalogKind ? 'Close references' : 'Browse references'}
        </button>
      }
    >
      <div className="focus-equation" aria-label="Focus equation">
        <span>Paradigm</span>
        <b aria-hidden="true">+</b>
        <span>Practice</span>
        <b aria-hidden="true">+</b>
        <span>Instruments</span>
        <b aria-hidden="true">=</b>
        <strong>Focus</strong>
      </div>

      <div className="magick-custom-adder">
        <label>
          <span>Custom Focus entry type</span>
          <select
            value={customKind}
            onChange={(event) => setCustomKind(event.target.value as FocusKind)}
          >
            {Object.entries(kindLabels).map(([value, label]) => (
              <option value={value} key={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>Custom name</span>
          <input
            value={customName}
            placeholder={`Custom ${kindLabels[customKind].toLocaleLowerCase()}`}
            onChange={(event) => setCustomName(event.target.value)}
          />
        </label>
        <button
          type="button"
          className="primary-button"
          disabled={!customName.trim()}
          onClick={() => {
            const id = addFocusSelection(customKind, undefined, customName);
            if (id) {
              setCustomName('');
            }
          }}
        >
          Add custom
        </button>
        {lastRemoval?.type === 'focus' ? (
          <button
            type="button"
            className="small-button small-button--quiet"
            onClick={undoMagickRemoval}
          >
            Undo removal
          </button>
        ) : null}
      </div>

      <div className="focus-selected-grid">
        <FocusSelectionList
          kind="paradigm"
          selections={focus.paradigms}
          onUpdate={(id, update) =>
            updateFocusSelection('paradigm', id, update)
          }
          onRemove={(id) => removeFocusSelection('paradigm', id)}
        />
        <FocusSelectionList
          kind="practice"
          selections={focus.practices}
          onUpdate={(id, update) =>
            updateFocusSelection('practice', id, update)
          }
          onRemove={(id) => removeFocusSelection('practice', id)}
        />
        <FocusSelectionList
          kind="instrument"
          selections={focus.instruments}
          onUpdate={(id, update) =>
            updateFocusSelection('instrument', id, update)
          }
          onRemove={(id) => removeFocusSelection('instrument', id)}
        />
      </div>

      <p
        className={`magick-advisory ${
          focus.instruments.length < 7 ? 'magick-advisory--notice' : ''
        }`}
      >
        <strong>{focus.instruments.length} instruments recorded.</strong>{' '}
        Starting characters commonly begin with at least seven; this sheet
        records the choice without enforcing it.
      </p>

      <div className="focus-context-grid">
        <label>
          <span>Personal need</span>
          <textarea
            rows={3}
            value={focus.need}
            placeholder="What need does magick answer for this character?"
            onChange={(event) => updateFocusText('need', event.target.value)}
          />
        </label>
        <label>
          <span>Culture and community</span>
          <textarea
            rows={3}
            value={focus.culture}
            placeholder="How do culture, mentors, or affiliation shape this Focus?"
            onChange={(event) => updateFocusText('culture', event.target.value)}
          />
        </label>
        <label className="focus-context-grid__notes">
          <span>General Focus notes</span>
          <textarea
            rows={3}
            value={focus.notes}
            onChange={(event) => updateFocusText('notes', event.target.value)}
          />
        </label>
      </div>

      {catalogKind ? (
        <div id="focus-reference-catalog">
          <div
            className="magick-catalog-tabs"
            role="group"
            aria-label="Focus reference type"
          >
            {(Object.keys(kindLabels) as FocusKind[]).map((kind) => (
              <button
                type="button"
                className={
                  catalogKind === kind ? 'primary-button' : 'secondary-button'
                }
                aria-pressed={catalogKind === kind}
                onClick={() => setCatalogKind(kind)}
                key={kind}
              >
                {kindLabels[kind]}s
              </button>
            ))}
          </div>
          <p className="reference-preview-note">
            Reference preview: supplied citations and wording remain marked for
            source verification.
          </p>
          <ReferenceCatalog
            label={`${kindLabels[catalogKind]}s`}
            entries={activeCatalog}
            selectedDefinitionIds={selectedDefinitionIds}
            onAdd={(definition) =>
              addFocusSelection(catalogKind, definition.id)
            }
          />
        </div>
      ) : null}
    </SheetSection>
  );
}
