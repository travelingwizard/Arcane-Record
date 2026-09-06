import type { ReactNode } from 'react';
import type { SaveStatus } from '../../state/editor-store';
import { SaveStatusBadge } from '../character/SaveStatusBadge';

const classes = (...values: Array<string | false | null | undefined>) =>
  values.filter(Boolean).join(' ');

export function SheetEditorShell({
  gameLabel,
  title,
  subtitle = 'An editable record kept only on this device.',
  saveStatus,
  onBack,
  headerActions,
  className,
  headerClassName,
  errorMessage,
  children,
}: {
  gameLabel: string;
  title: string;
  subtitle?: ReactNode;
  saveStatus: SaveStatus;
  onBack: () => void | Promise<void>;
  headerActions?: ReactNode;
  className?: string;
  headerClassName?: string;
  errorMessage?: ReactNode;
  children: ReactNode;
}) {
  return (
    <main className={classes('app-shell', 'editor-shell', className)}>
      <header className={classes('editor-header', headerClassName)}>
        <button
          type="button"
          className="text-button editor-header__back"
          onClick={() => void onBack()}
        >
          <span aria-hidden="true">←</span> Character library
        </button>
        <div className="editor-header__title">
          <p className="eyebrow">Arcane Record · {gameLabel}</p>
          <h1>{title}</h1>
          {subtitle ? (
            <p className="editor-header__subtitle">{subtitle}</p>
          ) : null}
        </div>
        <div className="editor-header__actions">
          <SaveStatusBadge status={saveStatus} />
          {headerActions}
        </div>
      </header>

      <div className="ornament-rule" aria-hidden="true">
        <span>✦</span>
      </div>

      {errorMessage ? <div role="alert">{errorMessage}</div> : null}
      {children}

      <footer className="privacy-note">
        <strong>Private by design.</strong> Character data is stored in this
        browser profile and is not backed up online.
      </footer>
    </main>
  );
}
