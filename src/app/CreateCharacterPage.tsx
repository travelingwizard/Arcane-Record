import { useRef, useState } from 'react';
import type {
  RegisteredGameSystem,
  UnavailableSheetChoice,
} from '../games/game-system';
import type { GameSystemRegistry } from '../games/game-system-registry';
import type { StoredCharacterRepository } from '../storage/stored-character-repository';
import type { ModuleRegistry } from '../modules/registry/module-registry';
import { ARCANE_MODULE_SYSTEM_ID } from '../storage/stored-character';
import { prepareImportedRecord } from '../features/import-export/character-files';
import { GameChooser } from '../features/game-chooser/GameChooser';

/** A locked sheet choice card: labeled "Unavailable", never implies it works. */
function UnavailableSheetChoiceCard({
  choice,
}: {
  choice: UnavailableSheetChoice;
}) {
  return (
    <article className="game-system-card">
      <p className="eyebrow">Unavailable</p>
      <h2>{choice.name}</h2>
      <p>{choice.description}</p>
      <p className="notice notice--warning">{choice.requirement}</p>
      <button className="secondary-button" disabled>
        Source required
      </button>
    </article>
  );
}

export function CreateCharacterPage({
  systemId,
  registry,
  repository,
  onNavigate,
  moduleRegistry,
  moduleSelection,
}: {
  systemId?: string;
  registry: GameSystemRegistry;
  repository: StoredCharacterRepository;
  onNavigate: (path: string) => void;
  moduleRegistry?: ModuleRegistry;
  moduleSelection?: {
    moduleId: string;
    gameNodeId: string;
    templateId: string;
  };
}) {
  const [creating, setCreating] = useState(false);
  const [creatingVariantId, setCreatingVariantId] = useState('');
  const [error, setError] = useState('');
  const [chosenSheet, setChosenSheet] = useState('');
  const importInputRef = useRef<HTMLInputElement>(null);
  const system = systemId ? registry.get(systemId) : undefined;
  const family = systemId ? registry.getFamily(systemId) : undefined;

  if (moduleSelection) {
    const module = moduleRegistry
      ?.list()
      .find(({ moduleId }) => moduleId === moduleSelection.moduleId);
    const template = module?.sheetTemplates.find(
      ({ id, gameNodeId }) =>
        id === moduleSelection.templateId &&
        gameNodeId === moduleSelection.gameNodeId,
    );
    const node = module?.gameNodes.find(
      ({ id }) => id === moduleSelection.gameNodeId,
    );
    const createModuleCharacter = async () => {
      if (!module || !template || !node || !moduleRegistry) return;
      setCreating(true);
      try {
        const resolved = moduleRegistry.resolve(
          module.moduleId,
          module.moduleVersion,
          node.id,
          template.id,
          template.templateVersion,
        );
        const data = resolved.characterSchema.parse(
          structuredClone(template.defaults),
        );
        const timestamp = new Date().toISOString();
        const lock = moduleRegistry.findCompatibleLock(
          module.moduleId,
          module.moduleVersion,
        );
        if (!lock) throw new Error('Dependency lock unavailable.');
        const record = await repository.create({
          id: crypto.randomUUID(),
          systemId: ARCANE_MODULE_SYSTEM_ID,
          systemVersion: template.templateVersion,
          name: `Untitled ${node.name} character`,
          createdAt: timestamp,
          updatedAt: timestamp,
          data,
          moduleRef: {
            moduleId: module.moduleId,
            moduleVersion: module.moduleVersion,
            gameNodeId: node.id,
            sheetTemplateId: template.id,
            sheetTemplateVersion: template.templateVersion,
            dependencyLockId: lock.id,
            enabledOverlayRefs: [],
          },
        });
        onNavigate(`/characters/${record.id}`);
      } catch {
        setError('The module character could not be created.');
        setCreating(false);
      }
    };
    return (
      <main className="app-shell neutral-shell creation-shell">
        <button className="text-button" onClick={() => onNavigate('/create')}>
          ← Choose another game
        </button>
        <p className="eyebrow">Create character · Step 2 of 2</p>
        <h1>{template?.name ?? 'Module sheet unavailable'}</h1>
        <p>{node?.description ?? module?.description}</p>
        {error ? <p className="notice notice--error">{error}</p> : null}
        <button
          className="primary-button"
          disabled={!template || creating}
          onClick={() => void createModuleCharacter()}
        >
          {creating ? 'Opening sheet…' : `Choose ${node?.name ?? 'sheet'}`}
        </button>
      </main>
    );
  }

  if (!systemId) {
    return (
      <main className="app-shell neutral-shell creation-shell">
        <button className="text-button" onClick={() => onNavigate('/')}>
          ← Character library
        </button>
        <p className="eyebrow">Create character · Step 1 of 2</p>
        <h1>Choose a game</h1>
        <p>Select the game system that defines this character’s sheet.</p>
        <GameChooser
          registry={registry}
          moduleRegistry={moduleRegistry}
          onNavigate={(path) => {
            setChosenSheet('');
            onNavigate(path);
          }}
        />
      </main>
    );
  }

  if (family) {
    const editions = registry
      .list()
      .filter(
        (definition) =>
          definition.familyId === family.id && !definition.parentSystemId,
      );
    return (
      <main className="app-shell neutral-shell creation-shell">
        <button className="text-button" onClick={() => onNavigate('/create')}>
          ← Choose another game
        </button>
        <p className="eyebrow">{family.name}</p>
        <h1>Choose an edition</h1>
        <p>Edition rules and saved records remain strictly separate.</p>
        <div className="game-system-grid">
          {editions.map((edition) => (
            <article className="game-system-card" key={edition.id}>
              <p className="eyebrow">Supported edition</p>
              <h2>{edition.editionChoiceLabel ?? edition.name}</h2>
              <p>{edition.description}</p>
              <button
                className="primary-button"
                onClick={() => onNavigate(`/create/${edition.id}`)}
              >
                Choose {edition.editionChoiceLabel ?? edition.shortName}
              </button>
            </article>
          ))}
        </div>
      </main>
    );
  }

  if (!system) {
    return (
      <main className="app-shell neutral-shell error-shell">
        <h1>Game unavailable</h1>
        <p>No installed game module uses the ID “{systemId}”.</p>
        <button
          className="secondary-button"
          onClick={() => onNavigate('/create')}
        >
          Choose another game
        </button>
      </main>
    );
  }

  const create = async (
    variantId?: string,
    creationActionId?: string,
    targetSystem: RegisteredGameSystem = system,
    manualVariant = false,
  ) => {
    const selectedVariant = variantId
      ? targetSystem.variants?.find((variant) => variant.id === variantId)
      : undefined;
    if (variantId && !selectedVariant) {
      setError('That character sheet is not available.');
      return;
    }
    setCreating(true);
    setCreatingVariantId(variantId ?? 'default');
    setError('');
    try {
      const timestamp = new Date().toISOString();
      const creationAction = creationActionId
        ? targetSystem.creationActions?.find(
            ({ id }) => id === creationActionId,
          )
        : undefined;
      const data = targetSystem.characterSchema.parse(
        selectedVariant
          ? manualVariant && selectedVariant.createManualInitialCharacter
            ? selectedVariant.createManualInitialCharacter()
            : selectedVariant.createInitialCharacter()
          : creationAction
            ? creationAction.createInitialCharacter()
            : targetSystem.createInitialCharacter(),
      );
      const record = await repository.create({
        id: crypto.randomUUID(),
        systemId: targetSystem.id,
        systemVersion: targetSystem.currentSchemaVersion,
        name: targetSystem.getDisplayName(data),
        createdAt: timestamp,
        updatedAt: timestamp,
        data,
      });
      onNavigate(`/characters/${encodeURIComponent(record.id)}`);
    } catch {
      setError('The browser-local character could not be created.');
      setCreating(false);
      setCreatingVariantId('');
    }
  };

  const importForSystem = async (file: File) => {
    setCreating(true);
    setError('');
    try {
      const imported = prepareImportedRecord(
        await file.text(),
        file.name,
        registry,
        undefined,
        undefined,
        moduleRegistry,
      );
      if (imported.systemId !== system.id) {
        throw new Error(
          `Choose a ${system.shortName} character file on this screen.`,
        );
      }
      await repository.create(imported);
      onNavigate(`/characters/${encodeURIComponent(imported.id)}`);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : 'The character file could not be imported.',
      );
      setCreating(false);
    } finally {
      if (importInputRef.current) importInputRef.current.value = '';
    }
  };

  const childSheets = registry
    .list()
    .filter(({ parentSystemId }) => parentSystemId === system.id);
  // A system with its own `variants` (e.g. Exalted 1e's Solar/Dragon-Blooded
  // step) already has a dedicated screen to show unavailable sheet choices
  // alongside real ones (see the `variants` block below) — it does not need
  // this separate gate first. Systems without variants (e.g. Call of
  // Cthulhu 7E, which uses `creationActions`) still need this screen so an
  // unavailable choice has anywhere to appear.
  const needsSheetChoiceGate =
    childSheets.length > 0 ||
    (Boolean(system.unavailableSheetChoices?.length) &&
      !system.variants?.length);
  if (needsSheetChoiceGate && chosenSheet !== system.id) {
    return (
      <main className="app-shell neutral-shell creation-shell">
        <button
          className="text-button"
          disabled={creating}
          onClick={() => onNavigate('/create')}
        >
          ← Choose another game
        </button>
        <p className="eyebrow">{system.name}</p>
        <h1>Choose a character or crew sheet</h1>
        {error ? (
          <p role="alert" className="notice notice--error">
            {error}
          </p>
        ) : null}
        <div className="game-system-grid">
          {[system, ...childSheets].map((choice) => (
            <article className="game-system-card" key={choice.id}>
              <h2>{choice.sheetChoiceLabel ?? choice.name}</h2>
              <p>{choice.description}</p>
              <button
                className="primary-button"
                disabled={creating}
                onClick={() => {
                  if (choice.id === system.id) setChosenSheet(system.id);
                  else void create(undefined, undefined, choice);
                }}
              >
                Choose {choice.sheetChoiceLabel ?? choice.name}
              </button>
            </article>
          ))}
          {system.unavailableSheetChoices?.map((choice) => (
            <UnavailableSheetChoiceCard key={choice.id} choice={choice} />
          ))}
        </div>
      </main>
    );
  }

  if (system.variants?.length) {
    return (
      <main className="app-shell neutral-shell creation-shell">
        <button
          className="text-button"
          onClick={() =>
            childSheets.length ? setChosenSheet('') : onNavigate('/create')
          }
        >
          {childSheets.length
            ? '← Choose another sheet'
            : '← Choose another game'}
        </button>
        <p className="eyebrow">Create character · Step 2 of 2</p>
        <h1>Choose a character type for {system.shortName}</h1>
        <p>Each option uses its own sheet structure and labels.</p>
        {error ? (
          <p className="notice notice--error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="game-system-grid">
          {system.variants.map((variant) => (
            <article className="game-system-card" key={variant.id}>
              <p className="eyebrow">
                {variant.unavailableRequirement
                  ? 'Unavailable'
                  : 'Character sheet'}
              </p>
              <h2>{variant.name}</h2>
              <p>{variant.description}</p>
              {variant.unavailableRequirement ? (
                <p className="notice notice--warning">
                  {variant.unavailableRequirement}
                </p>
              ) : null}
              <button
                className="primary-button"
                disabled={creating || Boolean(variant.unavailableRequirement)}
                onClick={() => void create(variant.id)}
              >
                {variant.unavailableRequirement
                  ? 'Source verification required'
                  : creatingVariantId === variant.id
                    ? 'Opening sheet…'
                    : `Choose ${variant.shortName}`}
              </button>
              {variant.createManualInitialCharacter &&
              !variant.unavailableRequirement ? (
                <button
                  className="secondary-button"
                  disabled={creating}
                  onClick={() =>
                    void create(variant.id, undefined, system, true)
                  }
                >
                  Open blank {variant.shortName} sheet
                </button>
              ) : null}
            </article>
          ))}
          {system.unavailableSheetChoices?.map((choice) => (
            <UnavailableSheetChoiceCard key={choice.id} choice={choice} />
          ))}
          <article className="game-system-card">
            <p className="eyebrow">Existing local file</p>
            <h2>Import Character</h2>
            <p>Open an Arcane Record JSON or YAML file for this game.</p>
            <button
              className="secondary-button"
              disabled={creating}
              onClick={() => importInputRef.current?.click()}
            >
              Import Character
            </button>
            <input
              ref={importInputRef}
              className="visually-hidden"
              type="file"
              accept=".json,.yaml,.yml,application/json,text/yaml"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void importForSystem(file);
              }}
            />
          </article>
        </div>
      </main>
    );
  }

  if (system.creationActions?.length) {
    return (
      <main className="app-shell neutral-shell creation-shell">
        <button
          className="text-button"
          onClick={() =>
            onNavigate(
              system.familyId ? `/create/${system.familyId}` : '/create',
            )
          }
        >
          ← Choose another {system.familyId ? 'edition' : 'game'}
        </button>
        <p className="eyebrow">Create character · Step 2 of 2</p>
        <h1>Choose how to use {system.shortName}</h1>
        <p>Build a new adventurer, open a manual play sheet, or import one.</p>
        {error ? (
          <p className="notice notice--error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="game-system-grid">
          {system.creationActions.map((action) => (
            <article className="game-system-card" key={action.id}>
              <p className="eyebrow">New local character</p>
              <h2>{action.name}</h2>
              <p>{action.description}</p>
              <button
                className="primary-button"
                disabled={creating}
                onClick={() => void create(undefined, action.id)}
              >
                {creatingVariantId === 'default'
                  ? 'Opening sheet…'
                  : action.name}
              </button>
            </article>
          ))}
          <article className="game-system-card">
            <p className="eyebrow">Existing local file</p>
            <h2>Import Character</h2>
            <p>
              Open an Arcane Record JSON or YAML {system.shortName} character
              file
              {system.importLegacyCharacter
                ? ', or a supported legacy JSON file'
                : ''}
              .
            </p>
            <label className="secondary-button file-picker-inline">
              Choose {system.shortName} file
              <input
                ref={importInputRef}
                type="file"
                aria-label={
                  system.id === 'torchbearer2e'
                    ? 'Choose Torchbearer file'
                    : `Choose ${system.shortName} file`
                }
                disabled={creating}
                accept=".json,.yaml,.yml,application/json,application/yaml,text/yaml"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) void importForSystem(file);
                }}
              />
            </label>
          </article>
        </div>
        <p className="local-promise">Saved in this browser</p>
      </main>
    );
  }

  return (
    <main className="app-shell neutral-shell creation-shell">
      <button className="text-button" onClick={() => onNavigate('/create')}>
        ← Choose another game
      </button>
      <p className="eyebrow">Create character · Step 2 of 2</p>
      <h1>Create a {system.shortName} character</h1>
      <p>{system.description}</p>
      {error ? (
        <p className="notice notice--error" role="alert">
          {error}
        </p>
      ) : null}
      <button
        className="primary-button"
        disabled={creating}
        onClick={() => void create()}
      >
        {creating ? 'Creating…' : 'Create Character'}
      </button>
      <p className="local-promise">Saved in this browser</p>
    </main>
  );
}
