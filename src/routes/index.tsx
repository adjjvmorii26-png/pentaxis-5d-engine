import { createFileRoute } from "@tanstack/react-router";
import { lazy, Suspense } from "react";
import { StartScreen } from "@/components/game/StartScreen";

const GameApp = lazy(() => import("@/components/game/GameApp").then((m) => ({ default: m.GameApp })));

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <Suspense
      fallback={
        <div className="relative h-dvh overflow-hidden bg-bg">
          <StartScreen onEnter={() => {}} />
        </div>
      }
    >
      <GameApp />
    </Suspense>
  );
}
