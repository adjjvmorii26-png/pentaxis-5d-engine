# `src/game` — 5D core

Code-ready map of the Pentaxis engine. Spec: [`docs/5D-CORE-ENGINE-SPEC.md`](../../docs/5D-CORE-ENGINE-SPEC.md).

| File | Export | Role |
|------|--------|------|
| `engine.ts` | `Engine` | 5-axis tick, abilities, endings |
| `mount.ts` | `mountPentaxis` | WebGL + fixed 60 Hz |
| `store.ts` | `useGame`, `pushLog` | Overlay state |
| `core/types.ts` | `AxisId`, `AXES`, `Collider` | Vocabulary |
| `core/input.ts` | `Input` | WASD / look / touch |
| `core/rng.ts` | `makeStreams` | Seeded streams |
| `core/save.ts` | `loadSave` | Cycle persistence |
| `core/audio.ts` | `audio` | Drones + SFX |
| `core/juice.ts` | `Juice` | Shake / flash / hitstop |
| `sim/collision.ts` | `collideXZ` | Slice physics |
| `world/build.ts` | `buildWorld` | Atrium + five charts |
| `content/bible.ts` | `CODEX` | In-world spec |
| `content/voices.ts` | `ARCHIVIST`, `CHORUS` | Identity layers |

QA probes: `window.__pentaxis`, `window.__controlsTest`.
