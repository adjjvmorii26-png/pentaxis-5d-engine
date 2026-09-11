import { useState } from "react";
import { CODEX } from "@/game/content/bible";
import { cn } from "@/lib/utils";

export function Codex({ onClose }: { onClose: () => void }) {
  const [id, setId] = useState(CODEX[0]!.id);
  const page = CODEX.find((p) => p.id === id) ?? CODEX[0]!;

  return (
    <div className="absolute inset-0 z-30 flex bg-bg/92">
      <div className="panel-enter mx-auto flex h-full w-full max-w-5xl flex-col md:flex-row">
        <aside className="flex shrink-0 gap-1 overflow-x-auto border-b border-border p-3 md:w-56 md:flex-col md:overflow-y-auto md:border-r md:border-b-0 md:p-5">
          {CODEX.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setId(p.id)}
              className={cn(
                "min-h-11 shrink-0 rounded-md px-3 py-2 text-left text-sm transition-colors",
                p.id === id ? "bg-surface text-fg" : "text-muted hover:text-fg",
              )}
            >
              {p.title.split("—")[0]!.trim()}
            </button>
          ))}
        </aside>
        <div className="min-h-0 flex-1 overflow-y-auto p-5 sm:p-8">
          <p className="font-mono text-[10px] tracking-[0.22em] text-accent uppercase">{page.kicker}</p>
          <h2 className="mt-2 font-display text-2xl font-semibold tracking-tight text-fg sm:text-3xl">
            {page.title}
          </h2>
          <div className="mt-6 max-w-2xl space-y-4 text-sm leading-relaxed text-muted">
            {page.body.map((para) => (
              <p key={para.slice(0, 24)}>{para}</p>
            ))}
          </div>
          {page.diagram && (
            <pre className="mt-6 overflow-x-auto rounded-lg border border-border bg-surface p-4 font-mono text-[11px] leading-5 text-accent">
              {page.diagram}
            </pre>
          )}
          <button
            type="button"
            onClick={onClose}
            className="mt-8 min-h-11 rounded-md border border-border bg-surface px-4 text-sm text-fg"
          >
            Close Codex
          </button>
        </div>
      </div>
    </div>
  );
}
