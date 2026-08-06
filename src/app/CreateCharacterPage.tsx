import { useState } from 'react';
import type { GameSystemRegistry } from '../games/game-system-registry';
import type { StoredCharacterRepository } from '../storage/stored-character-repository';

export function CreateCharacterPage({
  systemId,
  variantId,
  registry,
  repository,
  onNavigate,
}: {
  systemId?: string;
  variantId?: string;
  registry: GameSystemRegistry;
  repository: StoredCharacterRepository;
  onNavigate: (path: string) => void;
}) {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState('');
  const system = systemId ? registry.get(systemId) : undefined;
  const selectedVariant = variantId
    ? system?.variants?.find((variant) => variant.id === variantId)
    : undefined;

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

  if (system.variants?.length && !variantId) {
    return (
      <main className="app-shell neutral-shell creation-shell">
        <button className="text-button" onClick={() => onNavigate('/create')}>
          ← Choose another game
        </button>
        <p className="eyebrow">Create character · Step 2 of 3</p>
        <h1>Choose an {system.shortName} character type</h1>
        <p>Each option uses its own sheet structure and labels.</p>
        <div className="game-system-grid">
          {system.variants.map((variant) => (
            <article className="game-system-card" key={variant.id}>
              <p className="eyebrow">Character sheet</p>
              <h2>{variant.name}</h2>
              <p>{variant.description}</p>
              <button
                className="primary-button"
                onClick={() => onNavigate(`/create/${system.id}/${variant.id}`)}
              >
                Choose {variant.shortName}
              </button>
            </article>
          ))}
        </div>
      </main>
    );
  }

  if (variantId && !selectedVariant) {
    return (
      <main className="app-shell neutral-shell error-shell">
        <h1>Character type unavailable</h1>
        <p>That character sheet is not registered for {system.shortName}.</p>
        <button
          className="secondary-button"
          onClick={() => onNavigate(`/create/${system.id}`)}
        >
          Choose another type
        </button>
      </main>
    );
  }

  const create = async () => {
    setCreating(true);
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
    }
  };

  return (
    <main className="app-shell neutral-shell creation-shell">
      <button
        className="text-button"
        onClick={() =>
          onNavigate(
            system.variants?.length ? `/create/${system.id}` : '/create',
          )
        }
      >
        ←{' '}
        {system.variants?.length
          ? 'Choose another type'
          : 'Choose another game'}
      </button>
      <p className="eyebrow">
        Create character · Step {system.variants?.length ? '3 of 3' : '2 of 2'}
      </p>
      <h1>
        Create a {selectedVariant?.shortName ?? system.shortName} character
      </h1>
      <p>{selectedVariant?.description ?? system.description}</p>
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
