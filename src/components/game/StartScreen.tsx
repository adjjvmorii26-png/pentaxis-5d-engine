import { CONTROL_LINES } from "@/game/content/bible";
import { AXES } from "@/game/core/types";

export function StartScreen({ onEnter }: { onEnter: () => void }) {
  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-bg/80 px-5 py-6 sm:px-10 sm:py-8">
      <div className="stagger-in flex h-full flex-col">
        <header className="flex items-start justify-between gap-4">
          <p className="font-mono text-xs tracking-[0.22em] text-muted uppercase">
            Core engine v5.0
          </p>
          <p className="hidden max-w-xs text-right font-mono text-xs text-faint sm:block">
            Projection P(Σ,Τ,Ψ,Μ,Ω) → R³
          </p>
        </header>

        <div className="flex flex-1 flex-col items-start justify-center gap-6">
          <div>
            <p className="mb-3 font-mono text-xs tracking-[0.28em] text-accent uppercase">
              Five-dimensional reality engine
            </p>
            <h1 className="font-display text-4xl font-semibold tracking-[-0.04em] text-fg sm:text-6xl md:text-7xl">
              PENTAXIS
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed text-muted sm:text-base">
              A world whose coordinates are space, time, state, mind, and meta.
              You are the slice it can currently afford.
            </p>
          </div>

          <ul className="flex flex-wrap gap-2">
            {AXES.map((a) => (
              <li
                key={a.id}
                className={`rounded-sm border border-border bg-surface px-2.5 py-1 font-mono text-xs text-${a.token}`}
                style={{ color: `var(--color-${a.token})` }}
              >
                {a.glyph} {a.name}
              </li>
            ))}
          </ul>

          <button
            type="button"
            onClick={onEnter}
            className="min-h-11 rounded-lg bg-accent px-6 py-3 font-display text-sm font-semibold tracking-wide text-accent-fg transition-transform duration-150 hover:brightness-110 active:scale-[0.98]"
          >
            Enter the engine
          </button>
        </div>

        <footer className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
          <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-muted">
            {CONTROL_LINES.slice(0, 6).map(([k, v]) => (
              <p key={k}>
                <span className="font-mono text-fg">{k}</span>
                <span className="text-faint"> — {v}</span>
              </p>
            ))}
          </div>
          <p className="self-end text-xs leading-relaxed text-faint sm:text-right">
            The engine is already watching. Codex lives under Tab. Mobile uses
            the sticks after you enter.
          </p>
        </footer>
      </div>
    </div>
  );
}
