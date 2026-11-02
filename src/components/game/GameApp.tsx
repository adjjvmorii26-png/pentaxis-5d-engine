import { useEffect, useRef, useState } from "react";
import { mountPentaxis } from "@/game/mount";
import { audio } from "@/game/core/audio";
import { useGame } from "@/game/store";
import { Codex } from "./Codex";
import { EndScreen } from "./EndScreen";
import { HUD } from "./HUD";
import { MobileControls } from "./MobileControls";
import { PauseMenu } from "./PauseMenu";
import { StartScreen } from "./StartScreen";

export function GameApp() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [glError, setGlError] = useState(false);
  const phase = useGame((s) => s.phase);
  const ending = useGame((s) => s.ending);
  const isTouch = useGame((s) => s.isTouch);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let handle: ReturnType<typeof mountPentaxis> | null = null;
    try {
      handle = mountPentaxis(canvas);
    } catch (err) {
      // WebGL unavailable (old GPU, disabled context, headless): don't crash the shell.
      console.error("[pentaxis] renderer failed to start", err);
      setGlError(true);
      return;
    }
    const onTouch = () => useGame.getState().set({ isTouch: true });
    window.addEventListener("touchstart", onTouch, { once: true, passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouch);
      handle?.dispose();
    };
  }, []);

  const engine = () => window.__pentaxis;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg" style={{ touchAction: "none" }}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      {glError && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-bg/95 p-6 text-center">
          <div className="max-w-sm">
            <p className="font-mono text-xs tracking-[0.22em] text-accent uppercase">Projection unavailable</p>
            <h2 className="mt-2 font-display text-2xl font-semibold text-fg">WebGL could not start</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted">
              This device or browser blocked the 3D context. Try a current browser with hardware
              acceleration enabled, update your GPU drivers, or re-open the page.
            </p>
          </div>
        </div>
      )}

      {!glError && phase === "title" && (
        <StartScreen
          onEnter={() => {
            audio.unlock();
            engine()?.startPlay();
          }}
        />
      )}
      {phase === "playing" && <HUD />}
      {phase === "playing" && isTouch && <MobileControls />}
      {phase === "paused" && (
        <PauseMenu
          onResume={() => engine()?.resume()}
          onCodex={() => engine()?.openCodex()}
          onTitle={() => engine()?.restart()}
        />
      )}
      {phase === "codex" && (
        <Codex
          onClose={() => {
            useGame.setState({ phase: "playing" });
            engine()?.requestLock();
          }}
        />
      )}
      {phase === "ending" && ending && (
        <EndScreen
          ending={ending}
          onAgain={() => engine()?.restart()}
          onCodex={() => useGame.setState({ phase: "codex" })}
        />
      )}
    </div>
  );
}
