import { useEffect, useMemo, useRef, useState } from 'react';
import type { ModuleRepository } from '../../modules/repository/module-repository';
import type {
  ModulePackageRecord,
  ModuleInstallationRecord,
} from '../../modules/repository/module-records';
import type { ModuleRegistry } from '../../modules/registry/module-registry';
import {
  installStagedModule,
  serializeModule,
  stageModuleFile,
  type StagedModule,
} from '../../modules/interchange/module-files';
import {
  compareModules,
  createModuleFork,
} from '../../modules/homebrew/module-homebrew';

function download(text: string, name: string) {
  const url = URL.createObjectURL(
    new Blob([text], { type: 'application/json' }),
  );
  const link = document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
}

export function ModuleLibraryPage({
  repository,
  registry,
  onNavigate,
}: {
  repository: ModuleRepository;
  registry: ModuleRegistry;
  onNavigate: (path: string) => void;
}) {
  const [packages, setPackages] = useState<ModulePackageRecord[]>([]);
  const [installations, setInstallations] = useState<
    ModuleInstallationRecord[]
  >([]);
  const [staged, setStaged] = useState<StagedModule | null>(null);
  const [message, setMessage] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const refresh = async () => {
    setPackages(await repository.listPackages());
    setInstallations(await repository.listInstallations());
  };
  useEffect(() => {
    void refresh();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const grouped = useMemo(() => {
    const result = new Map<string, ModulePackageRecord[]>();
    packages.forEach((item) =>
      result.set(item.moduleId, [...(result.get(item.moduleId) ?? []), item]),
    );
    return result;
  }, [packages]);
  const bundled = registry
    .list()
    .filter(
      (module) =>
        !packages.some(
          (item) =>
            item.moduleId === module.moduleId &&
            item.moduleVersion === module.moduleVersion,
        ),
    );
  const stage = async (file: File) => {
    const result = await stageModuleFile(
      await file.text(),
      file.name,
      registry,
    );
    setStaged(result);
    setMessage('');
  };
  const install = async () => {
    if (!staged) return;
    try {
      await installStagedModule(staged, repository, 'local');
      window.location.reload();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Install failed.');
    }
  };
  const fork = async (item: ModulePackageRecord) => {
    const module = createModuleFork(
      item.envelope,
      `local.fork.${crypto.randomUUID().slice(0, 8)}`,
    );
    const id = crypto.randomUUID();
    await repository.saveDraft({
      id,
      moduleId: module.moduleId,
      name: module.name,
      updatedAt: new Date().toISOString(),
      draft: module,
      diagnostics: [],
    });
    onNavigate(`/module-builder/${id}`);
  };
  return (
    <main className="app-shell neutral-shell module-library-shell">
      <header className="library-hero">
        <p className="eyebrow">Local packages</p>
        <h1>Module Library</h1>
        <p>
          Review immutable packages, local drafts, forks, overlays, and active
          versions. Nothing is downloaded automatically.
        </p>
        <div className="library-hero__actions">
          <label className="primary-button file-picker-inline">
            Import module
            <input
              ref={inputRef}
              type="file"
              accept=".json,.yaml,.yml,.arcane-module.json,.arcane-module.yaml"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) void stage(file);
              }}
            />
          </label>
          <button
            className="secondary-button"
            onClick={() => onNavigate('/module-builder')}
          >
            Module Builder
          </button>
          <button className="text-button" onClick={() => onNavigate('/')}>
            Character library
          </button>
        </div>
      </header>
      {message ? (
        <p className="notice" role="status">
          {message}
        </p>
      ) : null}
      {staged ? (
        <section className="library-section">
          <h2>Staged import</h2>
          {staged.summary ? (
            <>
              <dl className="module-summary">
                <div>
                  <dt>Module</dt>
                  <dd>{staged.summary.name}</dd>
                </div>
                <div>
                  <dt>Identity</dt>
                  <dd>
                    {staged.summary.moduleId}@{staged.summary.moduleVersion}
                  </dd>
                </div>
                <div>
                  <dt>License</dt>
                  <dd>{staged.summary.license}</dd>
                </div>
                <div>
                  <dt>Capabilities</dt>
                  <dd>{staged.summary.permissions.join(' · ')}</dd>
                </div>
              </dl>
              <p>
                Checksum: <code>{staged.checksum}</code>
              </p>
            </>
          ) : null}
          {staged.diagnostics.map((item) => (
            <p
              className={`notice ${item.severity === 'error' ? 'notice--error' : ''}`}
              key={`${item.code}-${item.path}`}
            >
              {item.message}
            </p>
          ))}
          <div className="compact-actions">
            <button
              className="primary-button"
              disabled={!staged.canInstall}
              onClick={() => void install()}
            >
              Approve local install
            </button>
            <button onClick={() => setStaged(null)}>Cancel staging</button>
          </div>
        </section>
      ) : null}
      <section className="library-section">
        <h2>Bundled modules</h2>
        <div className="module-package-grid">
          {bundled.map((module) => (
            <article
              className="builder-catalog"
              key={`${module.moduleId}@${module.moduleVersion}`}
            >
              <strong>{module.name}</strong>
              <small>
                Bundled · {module.moduleId}@{module.moduleVersion}
              </small>
              <p>{module.description}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="library-section">
        <h2>Installed modules</h2>
        {packages.length === 0 ? (
          <p>No imported modules.</p>
        ) : (
          [...grouped].map(([moduleId, versions]) => {
            const installation = installations.find(
              (item) => item.moduleId === moduleId,
            );
            const sorted = [...versions].sort((a, b) =>
              b.moduleVersion.localeCompare(a.moduleVersion),
            );
            const comparison =
              sorted.length > 1
                ? compareModules(sorted[1]!.envelope, sorted[0]!.envelope)
                : [];
            return (
              <article className="module-installation" key={moduleId}>
                <h3>{sorted[0]!.envelope.name}</h3>
                <p>
                  {installation?.enabled ? 'Enabled' : 'Disabled'} · active{' '}
                  {installation?.activeVersion ?? 'none'} · {sorted.length}{' '}
                  immutable version(s)
                </p>
                {comparison.length ? (
                  <p>
                    {comparison.length} semantic changes between the newest two
                    versions.
                  </p>
                ) : null}
                {sorted.map((item) => (
                  <div className="module-version" key={item.moduleVersion}>
                    <span>
                      <strong>{item.moduleVersion}</strong> · {item.origin} ·{' '}
                      <code>{item.checksum.slice(0, 12)}…</code>
                    </span>
                    <div className="compact-actions">
                      <button
                        onClick={() =>
                          void repository
                            .activateVersion(moduleId, item.moduleVersion)
                            .then(() => window.location.reload())
                        }
                      >
                        Activate / rollback
                      </button>
                      <button
                        onClick={() =>
                          download(
                            serializeModule(item.envelope, 'json'),
                            `${item.moduleId}-${item.moduleVersion}.arcane-module.json`,
                          )
                        }
                      >
                        Export
                      </button>
                      <button onClick={() => void fork(item)}>
                        Create fork
                      </button>
                    </div>
                  </div>
                ))}
                <button
                  onClick={() =>
                    void repository
                      .setInstallationEnabled(moduleId, !installation?.enabled)
                      .then(() => window.location.reload())
                  }
                >
                  {installation?.enabled ? 'Disable' : 'Enable'} module
                </button>
              </article>
            );
          })
        )}
      </section>
      <section className="library-section">
        <h2>Publishing status</h2>
        <p className="notice">
          Hosted publishing is unavailable. Project policy permits local
          staging, checksum review, immutable versions, disable, and rollback
          only. No account, namespace authorization, or public registry is
          connected.
        </p>
      </section>
    </main>
  );
}
