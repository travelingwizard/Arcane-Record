import {
  useCallback,
  useEffect,
  useRef,
  useId,
  useState,
  type ReactNode,
} from 'react';
import type { z } from 'zod';
import type {
  GameCharacterEditorProps,
  GameSectionDefinition,
} from '../game-system';
import { SaveStatusBadge } from '../../components/character/SaveStatusBadge';
import type { SaveStatus } from '../../state/editor-store';
import { AppearanceSettings } from '../../features/settings/AppearanceSettings';
import { SheetLayoutModeToggle } from '../../components/navigation/SheetLayoutModeToggle';
import { CharacterSectionProvider } from '../../components/navigation/CharacterSectionProvider';
import { CharacterSectionNav } from '../../components/navigation/CharacterSectionNav';
import { MobileSectionNavigator } from '../../components/navigation/MobileSectionNavigator';
import { OrderedSheetSections } from '../../components/layout/OrderedSheetSections';
import { moveOrderedId } from '../../components/navigation/sheet-navigation';
import { useActiveSheetSection } from '../../features/character-editor/use-active-sheet-section';
import { useSheetSectionNavigation } from '../../features/character-editor/use-sheet-section-navigation';
import { useMediaQuery } from '../../features/character-editor/use-media-query';
import {
  serializeCharacter,
  createCharacterFileName,
  type CharacterFileFormat,
} from '../../features/import-export/character-files';

export function useLocalSheet<
  T extends { name: string; schemaVersion: number },
>(
  props: GameCharacterEditorProps<T>,
  schema: z.ZodType<T>,
  prepareExport?: (data: T) => Promise<T>,
) {
  const [draft, setDraft] = useState(props.character);
  const [status, setStatus] = useState<SaveStatus>('saved');
  const latest = useRef(draft);
  const revision = useRef(0);
  const queue = useRef(Promise.resolve());
  const persisted = useRef(JSON.stringify(props.record.data));
  const update = (value: T) => {
    const valid = schema.parse(value);
    latest.current = valid;
    revision.current += 1;
    setDraft(valid);
    setStatus('unsaved');
  };
  const save = useCallback(() => {
    const snapshot = latest.current;
    const version = revision.current;
    setStatus('saving');
    queue.current = queue.current
      .catch(() => undefined)
      .then(async () => {
        try {
          const data = schema.parse(snapshot);
          const current = await props.repository.get(props.record.id);
          if (!current || JSON.stringify(current.data) !== persisted.current) {
            throw new Error(
              'This record changed in another editor. Save a file copy before reloading.',
            );
          }
          const nextRecord = {
            ...props.record,
            systemVersion: data.schemaVersion,
            data,
            name: data.name,
          };
          const stored = props.repository.saveIfUnchanged
            ? await props.repository.saveIfUnchanged(
                nextRecord,
                persisted.current,
              )
            : await props.repository.save(nextRecord);
          props.onRecordChanged(stored);
          persisted.current = JSON.stringify(stored.data);
          setStatus(revision.current === version ? 'saved' : 'unsaved');
        } catch {
          setStatus('error');
          throw new Error('Local save failed. Your draft is still open.');
        }
      });
    return queue.current;
  }, [props, schema]);
  useEffect(() => {
    if (status !== 'unsaved') return;
    const timer = window.setTimeout(
      () => void save().catch(() => undefined),
      400,
    );
    return () => window.clearTimeout(timer);
  }, [status, draft, save]);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (status !== 'saved') {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [status]);
  const download = async (format: CharacterFileFormat) => {
    const data = schema.parse(
      prepareExport ? await prepareExport(latest.current) : latest.current,
    );
    const record = {
      ...props.record,
      systemVersion: latest.current.schemaVersion,
      name: latest.current.name,
      data,
    };
    const url = URL.createObjectURL(
      new Blob([serializeCharacter(record, format)], {
        type: 'application/octet-stream',
      }),
    );
    const link = document.createElement('a');
    link.href = url;
    link.download = createCharacterFileName(record, format);
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  return { draft, update, status, save, download };
}

export function LocalSheet({
  title,
  name,
  mode,
  onMode,
  order,
  onOrder,
  sections,
  content,
  status,
  onBack,
  onSave,
  settings,
}: {
  title: string;
  name: string;
  mode: 'build' | 'play';
  onMode: (mode: 'build' | 'play') => void;
  order: string[];
  onOrder: (order: string[]) => void;
  sections: readonly GameSectionDefinition[];
  content: Record<string, ReactNode>;
  status: SaveStatus;
  onBack: () => void;
  onSave: () => void;
  settings?: ReactNode;
}) {
  const [closed, setClosed] = useState<Set<string>>(new Set());
  const { activeSection, setActiveSection } = useActiveSheetSection(
    sections,
    sections[0]!.id,
  );
  const nav = useSheetSectionNavigation({ sections, setActiveSection });
  const groups = sections.map((s) => ({ id: s.group, label: s.label }));
  const expand = (id: string, value: boolean) =>
    setClosed((previous) => {
      const next = new Set(previous);
      if (value) next.delete(id);
      else next.add(id);
      return next;
    });
  return (
    <CharacterSectionProvider
      value={{
        activeSection,
        expandedSections: new Set(
          sections.filter((s) => !closed.has(s.id)).map((s) => s.id),
        ),
        isNarrowLayout: useMediaQuery('(max-width: 69.999rem)'),
        summaries: Object.fromEntries(
          sections.map((s) => [s.id, { primary: s.label }]),
        ),
        sections,
        groups,
        groupOrder: order,
        canCollapseSections: true,
        setSectionExpanded: expand,
        navigateToSection: (id, options) => {
          expand(id, true);
          nav.navigateToSection(id, options);
        },
        expandAllSections: () => setClosed(new Set()),
        collapseAllSections: (keep) =>
          setClosed(
            new Set(sections.filter((s) => s.id !== keep).map((s) => s.id)),
          ),
        moveGroup: (id, direction) =>
          onOrder(moveOrderedId(order, id, direction)),
      }}
    >
      <main className="app-shell editor-shell local-sheet-editor-shell">
        <header className="editor-header local-sheet-editor-header">
          <button className="text-button editor-header__back" onClick={onBack}>
            <span aria-hidden="true">←</span> Character library
          </button>
          <div className="editor-header__title">
            <p className="eyebrow">Arcane Record · {title}</p>
            <h1>{name || `Untitled ${title}`}</h1>
            <p className="editor-header__subtitle">
              An editable record kept only on this device.
            </p>
          </div>
          <div className="editor-header__actions">
            <SaveStatusBadge status={status} />
            <button className="secondary-button" onClick={onSave}>
              Save now
            </button>
            <AppearanceSettings gameLabel={title}>
              {settings}
            </AppearanceSettings>
          </div>
        </header>
        <div className="ornament-rule" aria-hidden="true">
          <span>✦</span>
        </div>
        {status === 'error' && (
          <p role="alert">
            Save failed. Keep this page open. If another editor changed or
            deleted this record, save a file copy in Settings before reloading.
          </p>
        )}
        <SheetLayoutModeToggle
          mode={mode}
          onModeChange={onMode}
          playModeNote="Play mode protects permanent definitions while keeping session controls available."
        />
        <MobileSectionNavigator />
        <div className="character-editor-layout">
          <CharacterSectionNav />
          <OrderedSheetSections
            groupOrder={order}
            className="character-sheet local-character-sheet"
          >
            {sections.map((s) => (
              <section
                key={s.id}
                id={s.id}
                data-section-group={s.group}
                className={`sheet-section character-section character-section--desktop-collapsible local-sheet-section ${
                  closed.has(s.id)
                    ? 'character-section--collapsed'
                    : 'character-section--expanded'
                }`}
                aria-labelledby={`${s.id}-heading`}
              >
                <div className="sheet-section__heading">
                  <h2 id={`${s.id}-heading`} tabIndex={-1}>
                    <button
                      className="character-section-disclosure"
                      aria-expanded={!closed.has(s.id)}
                      aria-controls={`${s.id}-content`}
                      onClick={() => expand(s.id, closed.has(s.id))}
                    >
                      <span className="character-section-disclosure__label">
                        {s.label}
                      </span>
                      <span
                        className="character-section-disclosure__icon"
                        aria-hidden="true"
                      >
                        {closed.has(s.id) ? '+' : '−'}
                      </span>
                    </button>
                  </h2>
                </div>
                <div id={`${s.id}-content`} hidden={closed.has(s.id)}>
                  {content[s.id]}
                </div>
              </section>
            ))}
          </OrderedSheetSections>
        </div>
        <footer className="privacy-note">
          <strong>Private by design.</strong> Character data is stored in this
          browser profile and is not backed up online.
        </footer>
      </main>
    </CharacterSectionProvider>
  );
}

export function TextField({
  label,
  value,
  onChange,
  locked = false,
  multiline = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  locked?: boolean;
  multiline?: boolean;
}) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {multiline ? (
        <textarea
          id={id}
          rows={2}
          value={value}
          readOnly={locked}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <input
          id={id}
          value={value}
          readOnly={locked}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
    </div>
  );
}
