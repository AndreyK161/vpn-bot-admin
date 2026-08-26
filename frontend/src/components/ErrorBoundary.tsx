import { Component, type ReactNode } from "react";

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: unknown) {
    console.error("Необработанная ошибка UI:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-full flex-col items-center justify-center gap-3 bg-[var(--bg)] px-4 text-center">
          <p className="text-sm font-medium text-[var(--text)]">Что-то пошло не так</p>
          <p className="max-w-xs text-xs text-[var(--text-muted)]">
            Страница столкнулась с ошибкой. Попробуйте перезагрузить.
          </p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="mt-1 rounded-lg bg-[var(--accent)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
          >
            Перезагрузить
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
