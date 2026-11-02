import { useEffect, useRef, useState } from "react";
import type { PointerEvent as PE, ReactNode } from "react";

const STICK_MAX = 40;

function Stick({
  onChange,
  look,
}: {
  onChange: (x: number, y: number) => void;
  look?: boolean;
}) {
  const origin = useRef<{ x: number; y: number; id: number } | null>(null);
  const [pos, setPos] = useState({ x: 0, y: 0 });

  const down = (e: PE<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    origin.current = { x: e.clientX, y: e.clientY, id: e.pointerId };
    setPos({ x: 0, y: 0 });
  };
  const move = (e: PE<HTMLDivElement>) => {
    if (!origin.current || origin.current.id !== e.pointerId) return;
    const dx = e.clientX - origin.current.x;
    const dy = e.clientY - origin.current.y;
    const x = Math.max(-1, Math.min(1, dx / STICK_MAX));
    const y = Math.max(-1, Math.min(1, dy / STICK_MAX));
    setPos({ x: x * STICK_MAX, y: y * STICK_MAX });
    if (look) onChange(x, y);
    else onChange(x, -y);
  };
  const up = (e: PE<HTMLDivElement>) => {
    if (origin.current && origin.current.id !== e.pointerId) return;
    origin.current = null;
    setPos({ x: 0, y: 0 });
    onChange(0, 0);
  };

  return (
    <div
      className="relative grid size-24 touch-none select-none place-items-center rounded-full border border-border bg-surface/70"
      onPointerDown={down}
      onPointerMove={move}
      onPointerUp={up}
      onPointerCancel={up}
      role="presentation"
    >
      {/* base crosshair hint */}
      <span className="absolute h-6 w-px bg-border/70" />
      <span className="absolute h-px w-6 bg-border/70" />
      {/* thumb that follows the touch */}
      <div
        className="pointer-events-none absolute size-10 rounded-full bg-surface-2/80 ring-1 ring-border transition-transform duration-75"
        style={{ transform: `translate(${pos.x}px, ${pos.y}px)` }}
        aria-hidden="true"
      />
    </div>
  );
}

function Pad({
  label,
  onDown,
  onUp,
  icon,
  active,
}: {
  label: string;
  onDown: () => void;
  onUp?: () => void;
  icon?: ReactNode;
  active?: boolean;
}) {
  const [pressed, setPressed] = useState(false);

  const handleDown = (e: PE<HTMLButtonElement>) => {
    e.preventDefault();
    setPressed(true);
    onDown();
    // Haptic feedback for touch devices
    if (typeof navigator !== "undefined" && typeof navigator.vibrate === "function") {
      navigator.vibrate(10);
    }
  };

  const handleUp = () => {
    setPressed(false);
    onUp?.();
  };

  return (
    <button
      type="button"
      aria-label={label}
      className={`flex min-h-11 min-w-11 touch-none flex-col items-center justify-center gap-0.5 rounded-md border px-2 py-1 font-mono text-[9px] leading-none transition-all duration-100 active:scale-95 ${
        pressed || active ? "border-accent bg-accent/20 text-fg" : "border-border bg-surface/80 text-fg"
      }`}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onPointerLeave={handleUp}
      onContextMenu={(e) => e.preventDefault()}
    >
      {icon && <span className="text-sm leading-none">{icon}</span>}
      <span className="tracking-[0.08em]">{label}</span>
    </button>
  );
}


export function MobileControls() {
  const engine = () => window.__pentaxis;
  const heldCodes = useRef<Set<string>>(new Set());
  const [gyro, setGyro] = useState(false);

  const hold = (code: string, on: boolean) => {
    const input = engine()?.input;
    if (!input) return;
    if (on) {
      input.keys.add(code);
      heldCodes.current.add(code);
    } else {
      input.keys.delete(code);
      heldCodes.current.delete(code);
    }
  };

  // Release any held virtual buttons if this overlay unmounts (pause/codex/ending)
  // so keys can't get stuck "down" between screens.
  useEffect(() => {
    const held = heldCodes.current;
    return () => {
      const input = engine()?.input;
      if (!input) return;
      for (const code of held) input.keys.delete(code);
      held.clear();
      input.touchMoveX = 0;
      input.touchMoveY = 0;
      input.touchLookX = 0;
      input.touchLookY = 0;
    };
  }, []);

  const toggleGyro = async () => {
    const input = engine()?.input;
    if (!input) return;
    if (gyro) {
      input.disableGyro();
      setGyro(false);
      return;
    }
    const ok = await input.requestGyro();
    setGyro(ok);
  };

  return (
    <div className="pointer-events-none absolute inset-0 z-20 touch-none select-none md:hidden">
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
            input.touchLookX = x * 16;
            input.touchLookY = y * 12;
          }}
        />
      </div>

      {/* Action buttons */}
      <div className="pointer-events-auto absolute right-4 bottom-32 flex max-w-[52vw] flex-wrap justify-end gap-1.5">
        <Pad label="JUMP" icon="⤒" onDown={() => hold("Space", true)} onUp={() => hold("Space", false)} />
        <Pad label="USE" icon="◎" onDown={() => hold("KeyE", true)} onUp={() => hold("KeyE", false)} />
        <Pad label="FOCUS" icon="◇" onDown={() => hold("KeyF", true)} onUp={() => hold("KeyF", false)} />
        <Pad label="REWIND" icon="↶" onDown={() => hold("KeyQ", true)} onUp={() => hold("KeyQ", false)} />
        <Pad label="QUERY" icon="⟲" onDown={() => hold("KeyR", true)} onUp={() => hold("KeyR", false)} />
        <Pad label="RUN" icon="≋" onDown={() => hold("ShiftLeft", true)} onUp={() => hold("ShiftLeft", false)} />
        <Pad label="PAST" icon="¹" onDown={() => hold("Digit1", true)} onUp={() => hold("Digit1", false)} />
        <Pad label="NOW" icon="²" onDown={() => hold("Digit2", true)} onUp={() => hold("Digit2", false)} />
        <Pad label="FUTURE" icon="³" onDown={() => hold("Digit3", true)} onUp={() => hold("Digit3", false)} />
        <Pad label="GYRO" icon="⟳" active={gyro} onDown={toggleGyro} />
        <Pad label="CODEX" icon="☰" onDown={() => hold("Tab", true)} onUp={() => hold("Tab", false)} />
        <Pad label="PAUSE" icon="⏸" onDown={() => hold("Escape", true)} onUp={() => hold("Escape", false)} />
      </div>
    </div>
  );
}
