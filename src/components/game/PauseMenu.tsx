import { audio } from "@/game/core/audio";
import { writeSettings } from "@/game/core/save";
import { useGame } from "@/game/store";

export function PauseMenu({
  onResume,
  onCodex,
  onTitle,
}: {
  onResume: () => void;
  onCodex: () => void;
  onTitle: () => void;
}) {
  const volume = useGame((s) => s.volume);
  const muted = useGame((s) => s.muted);
  const sensitivity = useGame((s) => s.sensitivity);
  const invertY = useGame((s) => s.invertY);
  const shake = useGame((s) => s.shake);
  const queries = useGame((s) => s.queries);
  const set = useGame((s) => s.set);

  const patchSettings = (partial: {
    volume?: number;
    muted?: boolean;
    sensitivity?: number;
    invertY?: boolean;
    shake?: boolean;
  }) => {
    const next = { volume, muted, invertY, shake, sensitivity, ...partial };
    set(next);
    audio.setVolume(next.volume);
    audio.setMuted(next.muted);
    const engine = window.__pentaxis;
    if (engine) {
      engine.settings.volume = next.volume;
      engine.settings.muted = next.muted;
      engine.settings.sensitivity = next.sensitivity;
      engine.settings.invertY = next.invertY;
      engine.settings.shake = next.shake;
      engine.juice.enabled = next.shake;
      engine.input.lookSensitivity = next.sensitivity;
      engine.input.invertY = next.invertY;
    }
    writeSettings({ version: 1, ...next });
  };

  return (
    <div className="absolute inset-0 z-30 grid place-items-center bg-bg/80 p-4">
      <div className="panel-enter w-full max-w-md rounded-xl border border-border bg-surface p-6">
        <p className="font-mono text-[10px] tracking-[0.22em] text-faint uppercase">Projection held</p>
        <h2 className="mt-1 font-display text-2xl font-semibold">Paused</h2>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onResume}
            className="min-h-11 rounded-md bg-accent px-4 font-medium text-accent-fg"
          >
            Resume
          </button>
          <button
            type="button"
            onClick={onCodex}
            className="min-h-11 rounded-md border border-border px-4 text-fg"
          >
            Open Codex
          </button>
          <button type="button" onClick={onTitle} className="min-h-11 rounded-md px-4 text-muted">
            {queries >= 5 ? "Become the engine" : "Abandon cycle"}
          </button>
        </div>

        <div className="mt-6 space-y-4 border-t border-border pt-5">
          <label className="block text-sm text-muted">
            Look sensitivity
            <input
              type="range"
              min={0.4}
              max={2}
              step={0.05}
              value={sensitivity}
              onChange={(e) => patchSettings({ sensitivity: Number(e.target.value) })}
              className="mt-2 w-full accent-accent"
            />
          </label>
          <label className="block text-sm text-muted">
            Volume
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(e) => patchSettings({ volume: Number(e.target.value) })}
              className="mt-2 w-full accent-accent"
            />
          </label>
          <label className="flex min-h-11 items-center justify-between text-sm text-fg">
            Mute
            <input type="checkbox" checked={muted} onChange={(e) => patchSettings({ muted: e.target.checked })} />
          </label>
          <label className="flex min-h-11 items-center justify-between text-sm text-fg">
            Invert look Y
            <input type="checkbox" checked={invertY} onChange={(e) => patchSettings({ invertY: e.target.checked })} />
          </label>
          <label className="flex min-h-11 items-center justify-between text-sm text-fg">
            Screen shake
            <input type="checkbox" checked={shake} onChange={(e) => patchSettings({ shake: e.target.checked })} />
          </label>
        </div>
      </div>
    </div>
  );
}
