import { useCallback, useEffect, useMemo, useState } from 'react';
import { OrderedSheetSections } from '../../components/layout/OrderedSheetSections';
import { SheetSection } from '../../components/layout/SheetSection';
import { SheetFieldGrid } from '../../components/layout/SheetPrimitives';
import { SheetEditorShell } from '../../components/layout/SheetEditorShell';
import { CharacterSectionNav } from '../../components/navigation/CharacterSectionNav';
import { CharacterSectionProvider } from '../../components/navigation/CharacterSectionProvider';
import { MobileSectionNavigator } from '../../components/navigation/MobileSectionNavigator';
import { moveOrderedId } from '../../components/navigation/sheet-navigation';
import { SheetLayoutModeToggle } from '../../components/navigation/SheetLayoutModeToggle';
import { useActiveSheetSection } from '../../features/character-editor/use-active-sheet-section';
import { useMediaQuery } from '../../features/character-editor/use-media-query';
import { useSheetSectionNavigation } from '../../features/character-editor/use-sheet-section-navigation';
import { AppearanceSettings } from '../../features/settings/AppearanceSettings';
import { MageSheetSettingsPanel } from '../../games/mage20/MageSheetSettingsPanel';
import { MAGE20_MODULE_ID } from '../../games/mage20/module/id-map';
import {
  createCharacterFileName,
  serializeCharacter,
} from '../../features/import-export/character-files';
import type { SaveStatus } from '../../state/editor-store';
import type { StoredCharacter } from '../../storage/stored-character';
import type { StoredCharacterRepository } from '../../storage/stored-character-repository';
import type { ModuleDiagnostic } from '../diagnostics/module-diagnostic';
import type { ResolvedModuleSheet } from '../registry/module-registry';
import { readDataPath, writeDataPath } from '../schema/data-path';
import { coreModuleComponentRegistry } from './component-registry';
import { evaluateModuleCondition } from './module-conditions';
import { resolveSectionSummary } from './section-summary';

const AUTOSAVE_DELAY_MS = 550;

function useModuleSectionPreferences(
  characterId: string,
  sectionIds: readonly string[],
) {
  const key = `arcane-ledger:section-preferences:${characterId}`;
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    try {
      const parsed = JSON.parse(localStorage.getItem(key) ?? 'null') as {
        characterId?: string;
        expandedSections?: unknown[];
      } | null;
      const valid = parsed?.expandedSections?.filter(
        (value): value is string =>
          typeof value === 'string' && sectionIds.includes(value),
      );
      if (parsed?.characterId === characterId && valid?.length) {
        return new Set(valid);
      }
    } catch {
      // Local view preferences never block character editing.
    }
    return new Set(sectionIds.slice(0, 1));
  });
  const persist = useCallback(
    (next: Set<string>) => {
      localStorage.setItem(
        key,
        JSON.stringify({
          characterId,
          expandedSections: sectionIds.filter((id) => next.has(id)),
        }),
      );
    },
    [characterId, key, sectionIds],
  );
  const setSectionExpanded = useCallback(
    (id: string, value: boolean) => {
      setExpanded((current) => {
        const next = new Set(current);
        if (value) next.add(id);
        else next.delete(id);
        persist(next);
        return next;
      });
    },
    [persist],
  );
  return {
    expanded,
    setSectionExpanded,
    expandAll: () => {
      const next = new Set(sectionIds);
      setExpanded(next);
      persist(next);
    },
    collapseAll: (keep: string) => {
      const next = new Set([keep]);
      setExpanded(next);
      persist(next);
    },
  };
}

export function ModuleCharacterEditor({
  record,
  resolved,
  repository,
  onBack,
  onRecordChanged,
}: {
  record: StoredCharacter;
  resolved: ResolvedModuleSheet;
  repository: StoredCharacterRepository;
  onBack: () => Promise<void>;
  onRecordChanged: (record: StoredCharacter) => void;
}) {
  const [data, setData] = useState<Record<string, unknown>>(
    () =>
      structuredClone(resolved.characterSchema.parse(record.data)) as Record<
        string,
        unknown
      >,
  );
  const [revision, setRevision] = useState(0);
  const [savedRevision, setSavedRevision] = useState(0);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [diagnostics, setDiagnostics] = useState<ModuleDiagnostic[]>([]);
  const template = resolved.template;
  const orderedTemplateSections = useMemo(
    () =>
      [...template.sections].sort((left, right) => left.order - right.order),
    [template.sections],
  );
  const sections = useMemo(
    () =>
      orderedTemplateSections.map((section) => ({
        id: section.id,
        label: section.label,
        group: section.groupId,
      })),
    [orderedTemplateSections],
  );
  const groups = useMemo(
    () =>
      [...template.navigationGroups]
        .sort((left, right) => left.order - right.order)
        .map(({ id, label }) => ({ id, label })),
    [template.navigationGroups],
  );
  const defaultGroupOrder = useMemo(() => groups.map(({ id }) => id), [groups]);
  const savedMode = template.modePath
    ? readDataPath(data, template.modePath)
    : undefined;
  const mode =
    typeof savedMode === 'string' &&
    template.modes.some(({ id }) => id === savedMode)
      ? savedMode
      : template.defaultModeId;
  const activeGroupOrderPath =
    template.groupOrderPaths[mode] ?? template.groupOrderPath;
  const savedGroupOrder = activeGroupOrderPath
    ? readDataPath(data, activeGroupOrderPath)
    : undefined;
  const groupOrder =
    Array.isArray(savedGroupOrder) &&
    savedGroupOrder.length === defaultGroupOrder.length &&
    savedGroupOrder.every(
      (value) => typeof value === 'string' && defaultGroupOrder.includes(value),
    )
      ? (savedGroupOrder as string[])
      : defaultGroupOrder;
  const isNarrowLayout = useMediaQuery('(max-width: 69.999rem)');
  const { activeSection, setActiveSection } = useActiveSheetSection(
    sections,
    sections[0]!.id,
  );
  const { navigateToSection } = useSheetSectionNavigation({
    sections,
    setActiveSection,
  });
  const preferences = useModuleSectionPreferences(
    record.id,
    sections.map(({ id }) => id),
  );
  const components = useMemo(
    () =>
      new Map(
        resolved.module.reusableComponents.map((entry) => [entry.id, entry]),
      ),
    [resolved.module.reusableComponents],
  );
  const catalogs = useMemo(
    () => new Map(resolved.module.catalogs.map((entry) => [entry.id, entry])),
    [resolved.module.catalogs],
  );
  const download = (format: 'json' | 'yaml') => {
    const current = { ...record, data };
    const blob = new Blob([serializeCharacter(current, format)], {
      type:
        format === 'json'
          ? 'application/json;charset=utf-8'
          : 'application/yaml;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = createCharacterFileName(current, format);
    link.click();
    URL.revokeObjectURL(url);
  };

  const updateData = useCallback(
    (mutate: (draft: Record<string, unknown>) => void) => {
      const next = structuredClone(data);
      try {
        mutate(next);
        const validated = resolved.characterSchema.parse(next) as Record<
          string,
          unknown
        >;
        setData(validated);
        setRevision((value) => value + 1);
        setSaveStatus('unsaved');
        setDiagnostics([]);
      } catch (error) {
        setDiagnostics([
          {
            code: 'invalid-character-command',
            severity: 'error',
            path: '/',
            message:
              error instanceof Error
                ? error.message
                : 'The proposed value is invalid.',
          },
        ]);
      }
    },
    [data, resolved.characterSchema],
  );

  useEffect(() => {
    if (
      revision === savedRevision ||
      saveStatus === 'saving' ||
      saveStatus === 'error'
    )
      return;
    const timer = window.setTimeout(() => {
      const savingRevision = revision;
      setSaveStatus('saving');
      void repository
        .save({
          ...record,
          name: (() => {
            const nextName = template.displayNamePath
              ? readDataPath(data, template.displayNamePath)
              : undefined;
            return typeof nextName === 'string' && nextName.trim()
              ? nextName
              : record.name;
          })(),
          data,
        })
        .then((saved) => {
          setSavedRevision(savingRevision);
          setSaveStatus('saved');
          onRecordChanged(saved);
        })
        .catch(() => setSaveStatus('error'));
    }, AUTOSAVE_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [
    data,
    onRecordChanged,
    record,
    repository,
    revision,
    saveStatus,
    savedRevision,
    template.displayNamePath,
  ]);

  const summaries = useMemo(
    () =>
      Object.fromEntries(
        orderedTemplateSections.map((section) => [
          section.id,
          {
            primary: resolveSectionSummary(
              section.summary,
              data,
              section.label,
            ),
          },
        ]),
      ),
    [data, orderedTemplateSections],
  );
  const moveGroup = useCallback(
    (groupId: string, direction: 'earlier' | 'later') => {
      if (!activeGroupOrderPath) return;
      updateData((draft) =>
        writeDataPath(
          draft,
          activeGroupOrderPath,
          moveOrderedId(groupOrder, groupId, direction),
        ),
      );
    },
    [activeGroupOrderPath, groupOrder, updateData],
  );
  const sectionContext = useMemo(
    () => ({
      activeSection,
      expandedSections: preferences.expanded,
      isNarrowLayout,
      summaries,
      sections,
      groups,
      groupOrder,
      canCollapseSections: true,
      setSectionExpanded: preferences.setSectionExpanded,
      navigateToSection,
      expandAllSections: preferences.expandAll,
      collapseAllSections: preferences.collapseAll,
      moveGroup,
    }),
    [
      activeSection,
      groupOrder,
      groups,
      isNarrowLayout,
      moveGroup,
      navigateToSection,
      preferences,
      sections,
      summaries,
    ],
  );

  return (
    <CharacterSectionProvider value={sectionContext}>
      <SheetEditorShell
        gameLabel={resolved.gameNode.name}
        title={record.name || `Untitled ${resolved.gameNode.name} character`}
        subtitle={`${template.name} · Declarative module`}
        saveStatus={saveStatus}
        onBack={onBack}
        className="local-sheet-editor-shell module-character-editor"
        headerClassName="local-sheet-editor-header"
        headerActions={
          <>
            <button
              type="button"
              className="secondary-button"
              onClick={() => download('json')}
            >
              Save JSON
            </button>
            <button
              type="button"
              className="secondary-button"
              onClick={() => download('yaml')}
            >
              Save YAML
            </button>
            <AppearanceSettings gameLabel={resolved.gameNode.name}>
              {record.moduleRef?.moduleId === MAGE20_MODULE_ID ? (
                <MageSheetSettingsPanel />
              ) : null}
            </AppearanceSettings>
          </>
        }
      >
        {template.modes.length > 1 && template.modePath ? (
          template.modes.length === 2 &&
          template.modes[0]?.id === 'build' &&
          template.modes[1]?.id === 'play' ? (
            <SheetLayoutModeToggle
              mode={mode as 'build' | 'play'}
              playModeNote={template.playModeNote}
              onModeChange={(nextMode) =>
                updateData((draft) =>
                  writeDataPath(draft, template.modePath!, nextMode),
                )
              }
            />
          ) : (
            <div className="sheet-layout-mode-control">
              <label className="line-field">
                <span>Sheet mode</span>
                <select
                  value={mode}
                  onChange={(event) =>
                    updateData((draft) =>
                      writeDataPath(
                        draft,
                        template.modePath!,
                        event.target.value,
                      ),
                    )
                  }
                >
                  {template.modes.map((entry) => (
                    <option value={entry.id} key={entry.id}>
                      {entry.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          )
        ) : null}

        <MobileSectionNavigator />
        <div className="character-editor-layout">
          <CharacterSectionNav />
          <OrderedSheetSections
            groupOrder={groupOrder}
            className="character-sheet local-character-sheet"
          >
            {orderedTemplateSections.map((section) => (
              <SheetSection
                id={section.id}
                key={section.id}
                title={section.label}
                description={section.description}
                data-section-group={section.groupId}
              >
                <SheetFieldGrid columns={3} className="identity-grid">
                  {section.componentIds.map((componentId) => {
                    const component = components.get(componentId);
                    if (!component) return null;
                    const behavior = component.modes[mode] ?? 'view';
                    if (
                      behavior === 'hidden' ||
                      !evaluateModuleCondition(component.visibleWhen, data)
                    )
                      return null;
                    const entry = coreModuleComponentRegistry.get(
                      component.type,
                    );
                    if (!entry) return null;
                    const value =
                      'dataPath' in component
                        ? readDataPath(data, component.dataPath)
                        : undefined;
                    return (
                      <div
                        key={component.id}
                        className={`module-component module-component--${component.layout.width}`}
                      >
                        {entry.render({
                          component,
                          value,
                          data,
                          readOnly:
                            behavior !== 'edit' ||
                            !evaluateModuleCondition(
                              component.editableWhen,
                              data,
                            ),
                          diagnostics,
                          catalogEntries:
                            'catalogId' in component && component.catalogId
                              ? (catalogs
                                  .get(component.catalogId)
                                  ?.entries.map(
                                    (entry) => entry.data ?? entry,
                                  ) ?? [])
                              : [],
                          onChange: (nextValue) => {
                            if (!('dataPath' in component)) return;
                            updateData((draft) =>
                              writeDataPath(
                                draft,
                                component.dataPath,
                                nextValue,
                              ),
                            );
                          },
                          onPathChange: (path, nextValue) =>
                            updateData((draft) =>
                              writeDataPath(draft, path, nextValue),
                            ),
                          onPathsChange: (changes) =>
                            updateData((draft) => {
                              changes.forEach(({ path, value }) =>
                                writeDataPath(draft, path, value),
                              );
                            }),
                        })}
                      </div>
                    );
                  })}
                </SheetFieldGrid>
              </SheetSection>
            ))}
          </OrderedSheetSections>
        </div>
      </SheetEditorShell>
    </CharacterSectionProvider>
  );
}
