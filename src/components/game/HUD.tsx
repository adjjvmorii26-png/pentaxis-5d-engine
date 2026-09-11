import { AXES } from "@/game/core/types";
import { useGame } from "@/game/store";

const TRACK = ["Past", "Present", "Future"];

export function HUD() {
  const objective = useGame((s) => s.objective);
  const location = useGame((s) => s.location);
  const coherence = useGame((s) => s.coherence);
  const cognition = useGame((s) => s.cognition);
  const entropy = useGame((s) => s.entropy);
  const timeline = useGame((s) => s.timeline);
  const reversing = useGame((s) => s.reversing);
  const keys = useGame((s) => s.keys);
  const attuned = useGame((s) => s.attuned);
  const logs = useGame((s) => s.logs);
  const prompt = useGame((s) => s.prompt);
  const flash = useGame((s) => s.flash);
  const metaAlert = useGame((s) => s.metaAlert);
  const isTouch = useGame((s) => s.isTouch);

  return (
    <div className="pointer-events-none absolute inset-0 z-10">
      {flash > 0.02 && (
        <div
          className="absolute inset-0 bg-fg"
          style={{ opacity: flash * 0.22 }}
        />
      )}

      <div className="absolute top-0 right-0 left-0 flex items-start justify-between gap-3 p-3 sm:p-5">
        <div>
          <p className="font-mono text-[10px] tracking-[0.2em] text-faint uppercase">{location}</p>
          <p className="mt-1 max-w-[220px] text-sm text-fg sm:max-w-sm">{objective}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-[10px] tracking-[0.2em] text-faint uppercase">Coherence</p>
          <p className="hud-num text-lg text-fg">{Math.round(coherence)}</p>
          <div className="mt-1 h-1 w-24 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full bg-accent"
              style={{ width: `${Math.max(0, Math.min(100, coherence))}%` }}
            />
          </div>
        </div>
      </div>

      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
        <div className="crosshair" />
      </div>

      {prompt && (
        <div className="absolute bottom-[28%] left-1/2 w-[min(92vw,360px)] -translate-x-1/2 rounded-md border border-border bg-surface/90 px-4 py-2 text-center">
          <p className="font-mono text-[10px] tracking-[0.18em] text-accent uppercase">{prompt.label}</p>
          <p className="text-sm text-fg">{prompt.detail}</p>
        </div>
      )}

      <div className="absolute bottom-24 left-1/2 flex w-[min(92vw,520px)] -translate-x-1/2 flex-col items-center gap-1 sm:bottom-10">
        {logs.slice(-3).map((l) => (
          <p
            key={l.id}
            className={`log-line max-w-full text-center text-xs leading-snug ${
              l.kind === "engine" ? "text-accent" : l.kind === "npc" ? "text-axis-mind" : "text-muted"
            }`}
          >
            {l.text}
          </p>
        ))}
      </div>

      <div className={`absolute left-3 flex flex-col gap-3 sm:left-5 ${isTouch ? "bottom-36" : "bottom-4"}`}>
        <div className="flex gap-1.5">
          {AXES.map((a) => (
            <span
              key={a.id}
              title={a.name}
              className="grid size-8 place-items-center rounded-sm border font-mono text-xs"
              style={{
                color: `var(--color-${a.token})`,
                borderColor: keys[a.id] ? `var(--color-${a.token})` : "var(--color-border)",
                background: keys[a.id] ? "var(--color-surface)" : "transparent",
                opacity: keys[a.id] ? 1 : 0.4,
              }}
            >
              {a.glyph}
            </span>
          ))}
        </div>
        {attuned.length > 0 && (
          <p className="font-mono text-[10px] text-faint">
            Attuned {attuned.map((id) => AXES.find((a) => a.id === id)?.glyph).join(" ")}
          </p>
        )}
      </div>

      <div className={`absolute right-3 text-right sm:right-5 ${isTouch ? "bottom-36" : "bottom-4"}`}>
        <p className="font-mono text-[10px] tracking-[0.18em] text-faint uppercase">
          Τ {TRACK[timeline]} {reversing ? "· reverse" : ""}
        </p>
        <p className="hud-num mt-1 text-sm text-fg">{Math.round(cognition)}</p>
        <p className="text-[10px] text-muted">cognition</p>
        <div className="mt-2 ml-auto h-16 w-1.5 overflow-hidden rounded-full bg-surface-2">
          <div
            className="w-full bg-axis-mind"
            style={{ height: `${Math.round(entropy * 100)}%`, marginTop: `${Math.round((1 - entropy) * 100)}%` }}
          />
        </div>
        <p className="mt-1 font-mono text-[10px] text-faint">H</p>
      </div>

      {metaAlert && (
        <p className="absolute top-20 left-1/2 w-[min(92vw,420px)] -translate-x-1/2 text-center font-mono text-[11px] text-axis-meta">
          {metaAlert}
        </p>
      )}
    </div>
  );
}
