import { useRef } from "react";
import type { PointerEvent as PE } from "react";

function Stick({
  onChange,
  look,
}: {
  onChange: (x: number, y: number) => void;
  look?: boolean;
}) {
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);

  const down = (e: PE<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    origin.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
  };
  const move = (e: PE<HTMLDivElement>) => {
    if (!origin.current || origin.current.id !== e.pointerId) return;
    const dx = e.clientX - origin.current.x;
    const dy = e.clientY - origin.current.y;
    const max = 46;
    const x = Math.max(-1, Math.min(1, dx / max));
    const y = Math.max(-1, Math.min(1, dy / max));
    if (look) onChange(x, y);
    else onChange(x, -y);
  };
  const up = () => {
    origin.current = null;
    onChange(0, 0);
  };

  return (
    <div
      className="size-24 rounded-full border border-border bg-surface/70"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
    />
  );
}

function Pad({
  label,
  onDown,
  onUp,
}: {
  label: string;
  onDown: () => void;
  onUp?: () => void;
}) {
  return (
    <button
      type="button"
      className="min-h-11 min-w-11 rounded-md border border-border bg-surface/80 px-2 font-mono text-[10px] text-fg"
      onPointerDown={(e) => {
        e.preventDefault();
        onDown();
      }}
      onPointerUp={onUp}
      onPointerCancel={onUp}
    >
      {label}
    </button>
  );
}

export function MobileControls() {
  const engine = () => window.__pentaxis;

  const hold = (code: string, on: boolean) => {
    const input = engine()?.input;
    if (!input) return;
    if (on) input.keys.add(code);
    else input.keys.delete(code);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 md:hidden">
      <div className="pointer-events-auto absolute bottom-4 left-4">
        <Stick
          onChange={(x, y) => {
            const input = engine()?.input;
            if (!input) return;
            input.touchMoveX = x;
            input.touchMoveY = y;
          }}
        />
      </div>
      <div className="pointer-events-auto absolute right-4 bottom-4">
        <Stick
          look
          onChange={(x, y) => {
            const input = engine()?.input;
            if (!input) return;
            input.touchLookX = x * 14;
            input.touchLookY = y * 10;
          }}
        />
      </div>
      <div className="pointer-events-auto absolute right-4 bottom-32 flex flex-wrap justify-end gap-1.5">
        <Pad label="JMP" onDown={() => hold("Space", true)} onUp={() => hold("Space", false)} />
        <Pad label="E" onDown={() => hold("KeyE", true)} onUp={() => hold("KeyE", false)} />
        <Pad label="F" onDown={() => hold("KeyF", true)} onUp={() => hold("KeyF", false)} />
        <Pad label="Q" onDown={() => hold("KeyQ", true)} onUp={() => hold("KeyQ", false)} />
        <Pad label="R" onDown={() => hold("KeyR", true)} onUp={() => hold("KeyR", false)} />
        <Pad label="1" onDown={() => hold("Digit1", true)} onUp={() => hold("Digit1", false)} />
        <Pad label="2" onDown={() => hold("Digit2", true)} onUp={() => hold("Digit2", false)} />
        <Pad label="3" onDown={() => hold("Digit3", true)} onUp={() => hold("Digit3", false)} />
      </div>
    </div>
  );
}
