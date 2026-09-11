import { useEffect, useRef } from "react";
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
  const phase = useGame((s) => s.phase);
  const ending = useGame((s) => s.ending);
  const isTouch = useGame((s) => s.isTouch);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const handle = mountPentaxis(canvas);
    const onTouch = () => useGame.getState().set({ isTouch: true });
    window.addEventListener("touchstart", onTouch, { once: true, passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouch);
      handle.dispose();
    };
  }, []);

  const engine = () => window.__pentaxis;

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-bg" style={{ touchAction: "none" }}>
      <canvas ref={canvasRef} className="absolute inset-0 h-full w-full touch-none" />

      {phase === "title" && (
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
