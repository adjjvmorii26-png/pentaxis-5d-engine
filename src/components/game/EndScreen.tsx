import type { Ending } from "@/game/core/types";

const COPY: Record<Ending, { title: string; body: string }> = {
  stabilize: {
    title: "The projection holds",
    body: "Five axes seated. The engine sleeps. Euclid is a local courtesy again, for now. You remain a player.",
  },
  collapse: {
    title: "The slice tore",
    body: "Coherence reached zero. You are a rumour in Ω. The next cycle will remember only that someone tried.",
  },
  ascend: {
    title: "You are a rule now",
    body: "Widdershins attunement accepted. Your voice is written into the meta-layer. The next Cognitor will hear you and think it is the engine.",
  },
};

export function EndScreen({
  ending,
  onAgain,
  onCodex,
}: {
  ending: Ending;
  onAgain: () => void;
  onCodex: () => void;
}) {
  const c = COPY[ending];
  return (
    <div className="absolute inset-0 z-30 flex flex-col items-start justify-end bg-bg/70 p-6 sm:p-12">
      <div className="stagger-in max-w-lg">
        <p className="font-mono text-[10px] tracking-[0.24em] text-accent uppercase">Endgame · {ending}</p>
        <h2 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-5xl">{c.title}</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted sm:text-base">{c.body}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <button
            type="button"
            onClick={onAgain}
            className="min-h-11 rounded-md bg-accent px-5 font-medium text-accent-fg"
          >
            New cycle
          </button>
          <button
            type="button"
            onClick={onCodex}
            className="min-h-11 rounded-md border border-border bg-surface px-5 text-fg"
          >
            Read the specification
          </button>
        </div>
      </div>
    </div>
  );
}
