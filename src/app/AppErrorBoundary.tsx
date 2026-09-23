import { Component, type ErrorInfo, type ReactNode } from 'react';

type State = { error: Error | null };

export class AppErrorBoundary extends Component<
  { children: ReactNode },
  State
> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(
      'Arcane Record recovered from a rendering error.',
      error,
      info,
    );
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <main className="app-error-recovery">
        <section className="sheet-card" role="alert">
          <p className="sheet-eyebrow">Arcane Record recovery</p>
          <h1>This view could not be displayed</h1>
          <p>
            Your saved browser record has not been deleted. Return to the
            character library, or retry this view after dismissing the error.
          </p>
          <div className="sheet-toolbar">
            <button
              className="primary-button"
              onClick={() => this.setState({ error: null })}
            >
              Retry view
            </button>
            <button
              className="secondary-button"
              onClick={() => window.location.assign('/')}
            >
              Character library
            </button>
          </div>
          <details>
            <summary>Technical detail</summary>
            <pre>{this.state.error.message}</pre>
          </details>
        </section>
      </main>
    );
  }
}
