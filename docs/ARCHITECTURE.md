# PENTAXIS architecture

```
                 ┌─────────────────────────────────────────┐
                 │              Ω  META LAYER              │
                 │  query count · HUD rewrite · ritual     │
                 │  rule mutation · engine voice           │
                 └──────────────────┬──────────────────────┘
                                    │ rewrites
                 ┌──────────────────▼──────────────────────┐
                 │              Μ  MIND FIELD              │
                 │  entropy H · focus · NPC identity layers│
                 └──────────────────┬──────────────────────┘
                                    │ gates
          ┌─────────────┬───────────┼───────────┬─────────────┐
          ▼             ▼           ▼           ▼             ▼
     Σ SPACE       Τ TIME      Ψ STATE     colliders      HUD/Codex
     portals       tracks      collapse    mindLow/High   overlay
     hyper-room    reverse     infection   metaOpen
     drift         time-mass   paradox
          │             │           │
          └─────────────┴─────┬─────┘
                              ▼
                    P(Σ,Τ,Ψ,Μ,Ω) → R³
                    three.js WebGL slice
                    FPS camera + DOM HUD
```

## Tick

```
RAF ──► cap dt ≤ 0.1
        accumulate
        while acc ≥ 1/60:
            Engine.fixedUpdate(1/60)
              poll Input
              stepPlayer  (Σ motion + Μ entropy)
              stepPortals (Σ charts)
              stepTime    (Τ tracks + reverse)
              updateSolids (Τ/Ψ/Μ/Ω masks)
              stepInteract (Ψ observe, NPCs, ritual)
              stepAnomalies (procgen)
              regen cognition
        Engine.render(dt)
          tesseract 4D→3D project
          fog drift
          camera + juice
        renderer.render(scene, camera)
```

## World layout (top-down, atrium origin)

```
                 Τ time
                   │
                   │ 72°
         Σ space ──┼── Ψ state
                   │
              Μ mind   Ω meta

        each corridor = ATRIUM_R(12) + CORRIDOR_LEN(9) + CHAMBER(14)/2
        chambers sit on a pentagon of radius CHAMBER_DIST
```

Hyper-room sits above the atrium (`y > 18`) via a scale-mismatched portal.

## Data flow

```
Input.poll() ──► Actions ──► Engine ──► useGame (Zustand)
                                      └► THREE.Scene
                                      └► localStorage save
React overlays (HUD, Codex, Pause, End) subscribe to useGame.
They never write simulation. Engine is the only mutator of the 5-tuple.
```
