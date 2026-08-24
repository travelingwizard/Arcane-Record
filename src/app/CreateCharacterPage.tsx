import { useState } from 'react';
import type { GameSystemRegistry } from '../games/game-system-registry';
import type { StoredCharacterRepository } from '../storage/stored-character-repository';
import type { ModuleRegistry } from '../modules/registry/module-registry';
import { ARCANE_MODULE_SYSTEM_ID } from '../storage/stored-character';
import { MAGE20_MODULE_ID } from '../games/mage20/module/id-map';
import { EXALTED1E_MODULE_ID } from '../games/exalted1e/module/id-map';

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
  const system = systemId ? registry.get(systemId) : undefined;
  const localModules =
    moduleRegistry
      ?.list()
      .filter(
        ({ moduleId }) =>
          moduleId !== MAGE20_MODULE_ID && moduleId !== EXALTED1E_MODULE_ID,
      ) ?? [];

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
        <div className="game-system-grid">
          {registry.list().map((definition) => (
            <article className="game-system-card" key={definition.id}>
              <p className="eyebrow">Available game</p>
              <h2>{definition.name}</h2>
              <p>{definition.description}</p>
              <button
                className="primary-button"
                onClick={() => onNavigate(`/create/${definition.id}`)}
              >
                Choose {definition.shortName}
              </button>
            </article>
          ))}
          {localModules.flatMap((module) =>
            module.sheetTemplates.map((template) => {
              const node = module.gameNodes.find(
                ({ id }) => id === template.gameNodeId,
              );
              return (
                <article
                  className="game-system-card"
                  key={`${module.moduleId}-${template.id}`}
                >
                  <p className="eyebrow">Installed local module</p>
                  <h2>{node?.name ?? module.name}</h2>
                  <p>{template.description ?? module.description}</p>
                  <button
                    className="primary-button"
                    onClick={() =>
                      onNavigate(
                        `/create-module/${encodeURIComponent(module.moduleId)}/${encodeURIComponent(template.gameNodeId)}/${encodeURIComponent(template.id)}`,
                      )
                    }
                  >
                    Choose {node?.name ?? module.name}
                  </button>
                </article>
              );
            }),
          )}
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

  const create = async (variantId?: string) => {
    const selectedVariant = variantId
      ? system.variants?.find((variant) => variant.id === variantId)
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
      const data = system.characterSchema.parse(
        selectedVariant
          ? selectedVariant.createInitialCharacter()
          : system.createInitialCharacter(),
      );
      const record = await repository.create({
        id: crypto.randomUUID(),
        systemId: system.id,
        systemVersion: system.currentSchemaVersion,
        name: system.getDisplayName(data),
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

  if (system.variants?.length) {
    return (
      <main className="app-shell neutral-shell creation-shell">
        <button className="text-button" onClick={() => onNavigate('/create')}>
          ← Choose another game
        </button>
        <p className="eyebrow">Create character · Step 2 of 2</p>
        <h1>Choose an {system.shortName} character type</h1>
        <p>Each option uses its own sheet structure and labels.</p>
        {error ? (
          <p className="notice notice--error" role="alert">
            {error}
          </p>
        ) : null}
        <div className="game-system-grid">
          {system.variants.map((variant) => (
            <article className="game-system-card" key={variant.id}>
              <p className="eyebrow">Character sheet</p>
              <h2>{variant.name}</h2>
              <p>{variant.description}</p>
              <button
                className="primary-button"
                disabled={creating}
                onClick={() => void create(variant.id)}
              >
                {creatingVariantId === variant.id
                  ? 'Opening sheet…'
                  : `Choose ${variant.shortName}`}
              </button>
            </article>
          ))}
        </div>
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
