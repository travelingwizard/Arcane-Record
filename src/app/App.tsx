import { useEffect, useState } from 'react';
import { ArcaneRecordLibrary } from '../features/character-library/ArcaneRecordLibrary';
import { gameSystemRegistry } from '../games/registry';
import type { StoredCharacterRepository } from '../storage/stored-character-repository';
import { storedCharacterRepository } from '../storage/repository-instance';
import { CharacterPage } from './CharacterPage';
import { CreateCharacterPage } from './CreateCharacterPage';
import { navigate, parseRoute } from './routing';
import { SettingsPage } from './SettingsPage';
import { useAppearance } from '../features/settings/appearance-context';
import { ModuleRegistry } from '../modules/registry/module-registry';
import { moduleRepository } from '../storage/repository-instance';
import { calculateModuleChecksum } from '../modules/interchange/module-files';
import { getBundledMage20ModuleRecords } from '../games/mage20/module/bundled-module';
import { getBundledExalted1eModuleRecords } from '../games/exalted1e/module/bundled-module';
import { ModuleBuilderPage } from '../features/module-builder/ModuleBuilderPage';

export function App({
  repository = storedCharacterRepository,
}: {
  repository?: StoredCharacterRepository;
}) {
  const [route, setRoute] = useState(() =>
    parseRoute(window.location.pathname),
  );
  const { setActiveCharacterId } = useAppearance();
  const [moduleRegistry] = useState(() => new ModuleRegistry());
  const [, setModuleRevision] = useState(0);

  useEffect(() => {
    const update = () => setRoute(parseRoute(window.location.pathname));
    window.addEventListener('popstate', update);
    return () => window.removeEventListener('popstate', update);
  }, []);

  useEffect(() => {
    const gameScope = route.name === 'character';
    document.documentElement.dataset.appScope = gameScope ? 'game' : 'global';
    setActiveCharacterId(route.name === 'character' ? route.id : null);
  }, [route, setActiveCharacterId]);

  useEffect(() => {
    let active = true;
    void Promise.all([
      moduleRepository.listPackages(),
      moduleRepository.listLocks(),
      getBundledMage20ModuleRecords(),
      getBundledExalted1eModuleRecords(),
    ])
      .then(async ([packages, locks, mageBundled, exaltedBundled]) => {
        if (!active) return;
        const verifiedPackages = (
          await Promise.all(
            packages.map(async (record) => ({
              record,
              valid:
                (await calculateModuleChecksum(record.envelope)) ===
                record.checksum,
            })),
          )
        )
          .filter(({ valid }) => valid)
          .map(({ record }) => record);
        if (!active) return;
        const bundled = [mageBundled, exaltedBundled];
        const withoutBundledVersion = verifiedPackages.filter(
          ({ moduleId, moduleVersion }) =>
            !bundled.some(
              ({ packageRecord }) =>
                moduleId === packageRecord.moduleId &&
                moduleVersion === packageRecord.moduleVersion,
            ),
        );
        moduleRegistry.replaceInstalled(
          [
            ...withoutBundledVersion,
            ...bundled.map(({ packageRecord }) => packageRecord),
          ],
          [
            ...locks.filter(
              ({ id }) => !bundled.some(({ lock }) => id === lock.id),
            ),
            ...bundled.map(({ lock }) => lock),
          ],
        );
        setModuleRevision((value) => value + 1);
      })
      .catch(() => {
        // Existing legacy sheets remain available if the module library fails.
      });
    return () => {
      active = false;
    };
  }, [moduleRegistry]);

  const go = (path: string) => navigate(path);

  if (route.name === 'home') {
    return (
      <ArcaneRecordLibrary
        repository={repository}
        moduleRegistry={moduleRegistry}
        onNavigate={go}
      />
    );
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
        moduleRegistry={moduleRegistry}
        repository={repository}
        onNavigate={go}
      />
    );
  }
  if (route.name === 'settings') {
    return <SettingsPage onBack={() => go('/')} />;
  }
  if (route.name === 'module-builder') {
    return (
      <ModuleBuilderPage
        draftId={route.draftId}
        repository={moduleRepository}
        onNavigate={go}
      />
    );
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
