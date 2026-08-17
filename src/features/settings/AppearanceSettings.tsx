import { useEffect, useId, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  baseThemeOptions,
  identityOverlayOptions,
  themeCategoryLabels,
  type ThemeCategory,
} from './appearance-preferences';
import { useAppearance } from './appearance-context';

const focusableSelector =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function AppearanceSettings({
  gameLabel = 'Character sheet',
  children,
}: {
  gameLabel?: string;
  children?: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    const appRoots = [...document.querySelectorAll<HTMLElement>('main')];
    document.body.style.overflow = 'hidden';
    appRoots.forEach((root) => {
      root.inert = true;
    });
    closeButtonRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !dialogRef.current) {
        return;
      }
      const focusable = [
        ...dialogRef.current.querySelectorAll<HTMLElement>(focusableSelector),
      ];
      if (focusable.length === 0) {
        return;
      }
      const first = focusable[0];
      const last = focusable.at(-1);
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
      appRoots.forEach((root) => {
        root.inert = false;
      });
      trigger?.focus();
    };
  }, [open]);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="settings-trigger"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-hidden={open}
        tabIndex={open ? -1 : undefined}
        onClick={() => setOpen(true)}
      >
        <span aria-hidden="true">⚙</span>
        Settings
      </button>
      {open
        ? createPortal(
            <div
              className="settings-backdrop"
              onMouseDown={(event) => {
                if (event.target === event.currentTarget) {
                  setOpen(false);
                }
              }}
            >
              <div
                ref={dialogRef}
                className="settings-dialog"
                role="dialog"
                aria-modal="true"
                aria-labelledby="settings-title"
              >
                <header className="settings-dialog__header">
                  <div>
                    <p className="eyebrow">Application preferences</p>
                    <h2 id="settings-title">Settings</h2>
                  </div>
                  <button
                    ref={closeButtonRef}
                    type="button"
                    className="icon-button"
                    aria-label="Close Settings"
                    onClick={() => setOpen(false)}
                  >
                    ×
                  </button>
                </header>
                <AppearancePanel gameLabel={gameLabel} />
                {children ? (
                  <section
                    className="sheet-specific-settings"
                    aria-labelledby="sheet-specific-settings-title"
                  >
                    <p className="settings-path">Settings / Sheet</p>
                    <h3 id="sheet-specific-settings-title">
                      {gameLabel} settings
                    </h3>
                    {children}
                  </section>
                ) : null}
              </div>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

export function AppearancePanel({
  gameLabel = 'character sheets',
}: {
  gameLabel?: string;
}) {
  const {
    activeCharacterId,
    preferences,
    setBaseTheme,
    setIdentityOverlay,
    setReduceMotion,
    setCustomBackground,
    setCurrentAsDefault,
    applyCurrentUniversally,
    resetAppearance,
  } = useAppearance();
  const [confirmUniversal, setConfirmUniversal] = useState(false);
  const radioGroupId = useId();
  const selectedTheme = baseThemeOptions.find(
    (theme) => theme.id === preferences.baseTheme,
  );
  const selectedOverlay = identityOverlayOptions.find(
    (overlay) => overlay.id === preferences.identityOverlay,
  );

  const chooseSystemAppearance = (useSystem: boolean) => {
    setBaseTheme(useSystem ? 'system' : 'arcane-ledger');
  };

  return (
    <section className="appearance-settings" aria-labelledby="appearance-title">
      <div className="appearance-settings__heading">
        <p className="settings-path">Settings / Appearance</p>
        <h3 id="appearance-title">Appearance</h3>
        <p>
          Change the visual treatment of {gameLabel}. Character data, layout,
          and rules remain unchanged.
        </p>
      </div>

      <fieldset className="appearance-group">
        <legend>Base Theme</legend>
        <label className="appearance-switch">
          <input
            type="checkbox"
            role="switch"
            checked={preferences.baseTheme === 'system'}
            onChange={(event) => chooseSystemAppearance(event.target.checked)}
          />
          <span>
            <strong>Use system appearance where applicable</strong>
            <small>Follow your device’s light or dark appearance.</small>
          </span>
        </label>

        {(['general', 'mage', 'exalted', 'simple'] as ThemeCategory[]).map(
          (category) => (
            <section className="theme-category" key={category}>
              <h4>{themeCategoryLabels[category]}</h4>
              <div className="theme-card-grid">
                {baseThemeOptions
                  .filter((theme) => theme.category === category)
                  .map((theme) => (
                    <label
                      className="theme-preview-card"
                      data-preview-theme={theme.id}
                      data-selected={preferences.baseTheme === theme.id}
                      key={theme.id}
                    >
                      <input
                        type="radio"
                        name={`${radioGroupId}-base-theme`}
                        value={theme.id}
                        checked={preferences.baseTheme === theme.id}
                        onChange={() => setBaseTheme(theme.id)}
                      />
                      <span
                        className="theme-preview-card__sample"
                        aria-hidden="true"
                      >
                        <span />
                        <i />
                        <b />
                      </span>
                      <span className="theme-preview-card__copy">
                        <strong>{theme.name}</strong>
                        <small>{theme.description}</small>
                      </span>
                      <span className="theme-preview-card__state">
                        {preferences.baseTheme === theme.id
                          ? 'Selected'
                          : 'Select'}
                      </span>
                    </label>
                  ))}
              </div>
            </section>
          ),
        )}
        {preferences.baseTheme === 'custom-background' ? (
          <label className="custom-background-control">
            <span>Custom background color</span>
            <span>
              <input
                type="color"
                value={preferences.customBackground ?? '#38506b'}
                onChange={(event) => setCustomBackground(event.target.value)}
              />
              <output>{preferences.customBackground ?? '#38506b'}</output>
            </span>
          </label>
        ) : null}
        <button
          type="button"
          className="small-button small-button--quiet"
          onClick={() => setBaseTheme('arcane-ledger')}
        >
          Reset to Default
        </button>
      </fieldset>

      <fieldset className="appearance-group">
        <legend>Identity Overlay</legend>
        <p className="appearance-group__description">
          Optional affiliation ornament changes accents, glyphs, borders, and
          selection styling only.
        </p>
        <div className="overlay-card-grid">
          {identityOverlayOptions.map((overlay) => (
            <label
              className="overlay-preview-card"
              data-preview-overlay={overlay.id}
              data-selected={preferences.identityOverlay === overlay.id}
              key={overlay.id}
            >
              <input
                type="radio"
                name={`${radioGroupId}-identity-overlay`}
                value={overlay.id}
                checked={preferences.identityOverlay === overlay.id}
                onChange={() => setIdentityOverlay(overlay.id)}
              />
              <span className="overlay-preview-card__glyph" aria-hidden="true">
                {overlay.glyph}
              </span>
              <span>
                <strong>{overlay.name}</strong>
                <small>{overlay.description}</small>
              </span>
              <span className="overlay-preview-card__state">
                {preferences.identityOverlay === overlay.id
                  ? 'Selected'
                  : 'Select'}
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="appearance-group">
        <legend>Motion</legend>
        <label className="appearance-switch">
          <input
            type="checkbox"
            role="switch"
            checked={preferences.reduceMotion}
            onChange={(event) => setReduceMotion(event.target.checked)}
          />
          <span>
            <strong>Reduce decorative motion</strong>
            <small>
              Disables nonessential transitions in addition to your system
              accessibility preference.
            </small>
          </span>
        </label>
      </fieldset>

      <section
        className="appearance-live-preview"
        aria-labelledby="preview-title"
      >
        <div className="appearance-live-preview__heading">
          <div>
            <p className="eyebrow">Live sample</p>
            <h4 id="preview-title">Section heading</h4>
          </div>
          <p aria-live="polite">
            {selectedTheme?.name} · {selectedOverlay?.name}
          </p>
        </div>
        <div className="appearance-live-preview__card">
          <div
            className="preview-dots"
            aria-label="Two filled and three empty dots"
          >
            <span className="preview-dot preview-dot--filled" />
            <span className="preview-dot preview-dot--filled" />
            <span className="preview-dot" />
            <span className="preview-dot" />
            <span className="preview-dot" />
          </div>
          <label>
            <span>Input field</span>
            <input defaultValue="Sample value" />
          </label>
          <button type="button" className="primary-button">
            Primary action
          </button>
          <p className="preview-warning" role="status">
            Warning message: review this value.
          </p>
          <div className="preview-indicators">
            <span className="preview-indicator preview-indicator--willpower">
              <strong>Willpower</strong> 6 / 10
            </span>
            <span className="preview-indicator preview-indicator--quintessence">
              <strong>Quintessence</strong> 4 / 10
            </span>
            <span className="preview-indicator preview-indicator--paradox">
              <strong>Paradox</strong> 2 / 10
            </span>
          </div>
        </div>
      </section>

      <section className="appearance-scope" aria-labelledby="scope-title">
        <div>
          <h4 id="scope-title">Apply appearance</h4>
          <p>
            {activeCharacterId
              ? 'This selection currently belongs only to the open character.'
              : 'Selections here become the default for new characters.'}
          </p>
        </div>
        <div className="compact-actions">
          {activeCharacterId ? (
            <button
              type="button"
              className="secondary-button"
              onClick={setCurrentAsDefault}
            >
              Set as Default
            </button>
          ) : null}
          {confirmUniversal ? (
            <>
              <button
                type="button"
                className="small-button small-button--danger"
                onClick={() => {
                  applyCurrentUniversally();
                  setConfirmUniversal(false);
                }}
              >
                Confirm Apply Universally
              </button>
              <button
                type="button"
                className="small-button small-button--quiet"
                onClick={() => setConfirmUniversal(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              className="secondary-button"
              onClick={() => setConfirmUniversal(true)}
            >
              Apply Universally
            </button>
          )}
        </div>
      </section>

      <section className="appearance-reset" aria-labelledby="reset-title">
        <div>
          <h4 id="reset-title">Reset Appearance</h4>
          <p>
            {activeCharacterId
              ? 'Remove this character’s override and use the current default.'
              : 'Return the default to Arcane Ledger, Neutral overlay, and standard motion.'}
          </p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={resetAppearance}
        >
          {activeCharacterId ? 'Use Default Appearance' : 'Reset Default'}
        </button>
      </section>
    </section>
  );
}
