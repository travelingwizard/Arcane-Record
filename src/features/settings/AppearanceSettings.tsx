import { useEffect, useRef, useState } from 'react';
import {
  baseThemeOptions,
  identityOverlayOptions,
} from './appearance-preferences';
import { useAppearance } from './appearance-context';

const focusableSelector =
  'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex="-1"])';

export function AppearanceSettings() {
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
      {open ? (
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
            <AppearancePanel />
          </div>
        </div>
      ) : null}
    </>
  );
}

function AppearancePanel() {
  const {
    preferences,
    setBaseTheme,
    setIdentityOverlay,
    setReduceMotion,
    resetAppearance,
  } = useAppearance();
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
          Change the visual treatment of the entire app. Character data, layout,
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

        <div className="theme-card-grid">
          {baseThemeOptions.map((theme) => (
            <label
              className="theme-preview-card"
              data-preview-theme={theme.id}
              data-selected={preferences.baseTheme === theme.id}
              key={theme.id}
            >
              <input
                type="radio"
                name="base-theme"
                value={theme.id}
                checked={preferences.baseTheme === theme.id}
                onChange={() => setBaseTheme(theme.id)}
              />
              <span className="theme-preview-card__sample" aria-hidden="true">
                <span />
                <i />
                <b />
              </span>
              <span className="theme-preview-card__copy">
                <strong>{theme.name}</strong>
                <small>{theme.description}</small>
              </span>
              <span className="theme-preview-card__state">
                {preferences.baseTheme === theme.id ? 'Selected' : 'Select'}
              </span>
            </label>
          ))}
        </div>
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
                name="identity-overlay"
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

      <section className="appearance-reset" aria-labelledby="reset-title">
        <div>
          <h4 id="reset-title">Reset Appearance</h4>
          <p>Return to Arcane Ledger, Neutral overlay, and standard motion.</p>
        </div>
        <button
          type="button"
          className="secondary-button"
          onClick={resetAppearance}
        >
          Reset appearance settings
        </button>
      </section>
    </section>
  );
}
