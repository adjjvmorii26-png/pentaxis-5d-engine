# PENTAXIS

**Five-dimensional reality engine.** Private codespace of the IXpansion organism.

Coordinates: **(Σ space, Τ time, Ψ state, Μ mind, Ω meta)**.
The renderer never sees the 5-manifold — only the projection `P(Σ,Τ,Ψ,Μ,Ω) → R³` you can walk.

```
  Ω  meta (rule space)
  │
  │     Μ mind (cognition field)
  │    /
  │   /
  │  /      Ψ state (superposition)
  │ /      /
  │/      /
  +------ Τ time (tracks 0/1/2 + reverse)
   \
    \
     Σ space (non-Euclidean projection)
```

Part of the [IXpansion](https://github.com/adjjvmorii26-png/ixpansion) constellation.
Wave 247. Ledger: [`IXPANSION-LEDGER.json`](./IXPANSION-LEDGER.json).

## What this is

A playable first-person 5-axis world. Five corridors leave the Atrium of Five Axes.
Each corridor is a chart into one dimension. Recover five Axis Keys. Attune the core.
Decide whether to stabilize the projection, let it collapse, or accept promotion into Ω.

This is not a HUD bolted onto a 3D demo. Player cognition is a coordinate.
The engine samples intention, decision entropy, and query count, then writes those
samples back into Μ and Ω. At mutation threshold, Ω is allowed to rewrite its own rules
— including lying in the HUD. The Codex never lies.

Full specification: [`docs/5D-CORE-ENGINE-SPEC.md`](./docs/5D-CORE-ENGINE-SPEC.md).

## Playable loop

```
[atrium] → [Σ | Τ | Ψ | Μ | Ω chamber] → key
  × 5  →  attune pedestals  →  ending

stabilize   ritual clockwise      Σ → Τ → Ψ → Μ → Ω
ascend      ritual widdershins    Ω → Μ → Ψ → Τ → Σ   (queries ≥ 5)
collapse    coherence = 0
```

| Chamber | Law |
|---------|-----|
| **Σ Space** | Non-Euclidean portals. The small door is a liar about size. Climb the recursive well. |
| **Τ Time** | Tracks Past / Present / Future. Future has the key. Hold Q to rewind time-mass. |
| **Ψ State** | Superposed ghost-bridges. Look, then E. Only the longest eigenstate bears weight. |
| **Μ Mind** | Hold F. Stop turning. Low entropy opens the light-path. The Chorus has three voices. |
| **Ω Meta** | Query the engine with R. At 2 queries a wall forgets it is a wall. At 4 the HUD lies. |

## Controls

| Input | Action |
|-------|--------|
| WASD / stick | Move — A strafes **left**, D **right** |
| Mouse / drag | Look |
| Space | Jump |
| Shift | Sprint |
| 1 / 2 / 3 | Timeline past / present / future |
| Q hold | Reverse local time (costs cognition) |
| E | Observe, interact, attune |
| F hold | Cognitive focus — leak entropy |
| R | Query the engine (Ω) |
| Tab | Codex |
| Esc | Pause |

## Architecture

```
src/game/
├── engine.ts              # 5D core loop — projection, abilities, endings
├── mount.ts               # three.js renderer, fixed 60 Hz sim
├── store.ts               # HUD / save-facing Zustand slice
├── core/
│   ├── types.ts           # AxisId, Collider, Portal, 5-tuple entities
│   ├── input.ts           # WASD + pointer + touch → actions
│   ├── rng.ts             # xmur3 / mulberry32 seeded streams
│   ├── audio.ts           # drones, gestures, unlock-on-tap
│   ├── juice.ts           # shake, flash, hitstop
│   └── save.ts            # localStorage cycle persistence
├── sim/collision.ts       # XZ walls, Y floors, head bump
├── world/build.ts         # atrium + five charts + hyper-room
└── content/
    ├── bible.ts           # in-game Codex (the spec the engine can quote)
    └── voices.ts          # Archivist layers, Chorus, Ω lines
```

Every entity is a 5-tuple. Collision and visibility are evaluated on the active
slice. Changing an unused axis is not a visual effect — it is a change of which
slice you occupy.

## Quick start

Local, or inside the GitHub Codespace this repo ships:

```bash
chmod +x engine_boot.sh
./engine_boot.sh
```

Node 22. The projection listens on port 8080.

```bash
npm install
npm run dev          # development
npm run build        # production
npm run typecheck
```

Open this repository in GitHub Codespaces (`.devcontainer/devcontainer.json`)
for a private machine with Node 22, port 8080 forwarded, and `npm install` already run.

## Factions

- **Cognitors** — observers who refuse to be observed.
- **The Lattice** — time-keepers who treat T2 as heresy.
- **The Uncollapsed** — never choose an eigenstate; observation is violence.
- **The Chorus** — Harmony, Dissent, Hunger. They cannot agree on your name.
- **The Engine** — not a faction until you query it. After that, it is the only one that can rewrite the others.

## Economy

Cognition is the only currency. Reverse, focus, query, and infection spend it.
It regenerates faster when entropy sits in the band `0.15–0.40` — the engine
prefers a player who is neither catatonic nor panicking. There are no shops.

## Endings

| Ending | Condition | What happens |
|--------|-----------|----------------|
| Stabilize | Ritual ΣΤΨΜΩ | The projection holds. The engine sleeps. |
| Collapse | Coherence 0 | The slice tears. You respawn as a rumour. |
| Ascend | Ritual ΩΜΨΤΣ after Ω ≥ 5 | You are written into Ω. The next cycle's engine voice is partly yours. |

There is no high-score. There is a remembered ending.

## Lineage

Wave 247 → IXpansion substrate constellation.
Neighbors: Chronocrypt Orrery, Echotide, Polychron Atlas, Oracle Engine, NDSO.

## License

Part of the IXpansion organism. See [IXpansion LICENSE](https://github.com/adjjvmorii26-png/ixpansion/blob/main/LICENSE).
