import { useEffect, useState } from 'react';
import { ArcaneRecordLibrary } from '../features/character-library/ArcaneRecordLibrary';
import { gameSystemRegistry } from '../games/registry';
import type { StoredCharacterRepository } from '../storage/stored-character-repository';
import { storedCharacterRepository } from '../storage/repository-instance';
import { CharacterPage } from './CharacterPage';
import { CreateCharacterPage } from './CreateCharacterPage';
import { navigate, parseRoute } from './routing';
import { SettingsPage } from './SettingsPage';

export function App({
  repository = storedCharacterRepository,
}: {
  repository?: StoredCharacterRepository;
}) {
  const [route, setRoute] = useState(() =>
    parseRoute(window.location.pathname),
  );

  useEffect(() => {
    const update = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);

  useEffect(() => {
    const gameScope = route.name === 'character';
    document.documentElement.dataset.appScope = gameScope ? 'game' : 'global';
  }, [route.name]);

  const go = (path: string) => navigate(path);

  if (route.name === 'home') {
    return <ArcaneRecordLibrary repository={repository} onNavigate={go} />;
  }
  if (route.name === 'create') {
    return (
      <CreateCharacterPage
        systemId={route.systemId}
        registry={gameSystemRegistry}
        repository={repository}
        onNavigate={go}
      />
    );
  }
  if (route.name === 'character') {
    return (
      <CharacterPage
        id={route.id}
        registry={gameSystemRegistry}
        repository={repository}
        onNavigate={go}
      />
    );
  }
  if (route.name === 'settings') {
    return <SettingsPage onBack={() => go('/')} />;
  }
  return (
    <main className="app-shell neutral-shell error-shell">
      <h1>Page not found</h1>
      <button className="secondary-button" onClick={() => go('/')}>
        Return to library
      </button>
    </main>
  );
}
