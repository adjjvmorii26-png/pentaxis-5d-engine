# 5D Core Engine Specification

**PENTAXIS / Engine v5.0 — Wave 247**

This is the contract the simulation obeys. The in-game Codex is a projection of
this file. If the HUD disagrees with this document, Ω is currently winning.

---

## 0. Engine contract

Pentaxis does not simulate a world sitting inside space-time. It simulates a
world whose coordinates are a 5-tuple

```
e = (Σ, Τ, Ψ, Μ, Ω)
```

and then projects that 5-manifold onto a 3-dimensional observer slice the
Cognitor can walk:

```
P : (Σ, Τ, Ψ, Μ, Ω) → R³
```

**Invariants**

1. Every entity is a 5-tuple. Renderers only ever see `P(e)`.
2. Changing an unused axis is not a visual effect. It is a change of which slice you occupy.
3. Two objects that never collide in the projection may be adjacent in 5-space.
   State-infection, timeline bleed, and meta-rule mutation propagate along that adjacency.
4. Player cognition is a coordinate, not a UI layer.
5. Ω may rewrite update rules when it exceeds a mutation threshold. Codex (this spec) is A0 proof and does not decay.

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

---

## 1. Dimension of Space — Σ

### 1.1 Non-Euclidean charts

Σ is not Euclidean `R³`. Rooms are charts on a manifold. Portals are transition
maps with a residual rotation:

```
Φ :  x' = R(θ) · (x − a) + b
θ = π/2  → axis shift (hyper-room)
θ = π    → identification (recursive well)
λ_in / λ_out ≠ 1 → TARDIS metric (interior scale independent of exterior)
```

Walking through a hyper-door applies a 90° axis swap in the projection. The
inner ear reads this as "the building was larger inside."

### 1.2 Hyper-rooms

The interior metric is independent of the exterior embedding. A 2-meter door
may open onto a 20-meter cube because `λ_in ≠ λ_out`. Recursive zones are
stacked charts that share a visual well — looking down is a proof of depth
Euclid would forbid at that footprint.

Implementation: `src/game/world/build.ts` portals `hyper-in` / `hyper-out`.
Engine: `Engine.stepPortals()`.

### 1.3 Dimensional drift

A slow `SO(3)` shear of unused axes onto the projection. Drift amplitude grows
with unused keys and with Ω. High drift tilts apparent verticals; the
simulation's up-vector does not change, only the visual frame (fog + camera roll).

```
drift = (5 − keys) · 0.04 + H · 0.08
fog.near = 14 − drift · 8
fog.far  = 62 − drift · 18
```

### 1.4 Cognition-gated topology

If Μ entropy `H` is high, some corridors identify their ends (loop with offset).
If entropy is low, the identification splits and a previously impossible balcony
becomes a path. Mind-gated colliders: `mindLow` / `mindHigh` on `Collider`.

---

## 2. Dimension of Time — Τ

### 2.1 Multi-track chronology

Three tracks occupy the same Σ chart:

| Track | Name    | Mask |
|-------|---------|------|
| T0    | Past    | bridge exists |
| T1    | Present | gap, side ledge |
| T2    | Future  | key + time-mass cube |

Switching tracks is a discrete jump on Τ, not a rewind. Objects carry a
`track` mask. Collision and visibility evaluate only against the active track.

Input: `Digit1` / `Digit2` / `Digit3`. Engine: `Engine.stepTime()`.

### 2.2 Reversible events

The engine records a ring buffer of time-mass bodies:

```
HISTORY = 8 s × 20 Hz = 160 samples
reverse:  q(t) ← history[i--]
rate     = 1 / (1 + f_t)
```

Hold Q while on T2 to replay the cube backward. Reverse is not free — it costs
cognition (`10 · dt`) and is opposed by time-friction.

### 2.3 Temporal physics

```
time-mass   m_t     resists dΤ
time-friction f_t = 1 + m_t · |dΤ|
```

A high-mass cube cannot be rewound as far; its history is sticky.

### 2.4 Timeline collapse

Switching tracks while reverse is engaged, or occupying a volume that is solid
on the destination track, deals paradox damage to coherence (`-8`). Collapse
state is a temporary overlay where both tracks render and neither collision
set is fully trusted.

---

## 3. Dimension of State — Ψ

### 3.1 Superposition

Objects may exist in superposition: a set of candidate eigenstates `{ψ_i}`
with amplitudes `a_i`. The renderer draws all of them as quantum overlays
(additive, low alpha). They do not collide until observation.

```
ψ = Σ a_i |i⟩
observe → |k⟩  if  look · n_k = max
```

### 3.2 Observation

E while the look vector is aligned with a candidate collapses the set to that
eigenstate. Collapse is irreversible for that object unless a paradox reset
occurs. Implementation: `Engine.collapseQuantum()`, `world.quantumGhosts`.

The long eigenstate (`q-long`) bears weight. Short truths deal paradox damage
(`-10` coherence) — they tried to be a bridge and were not.

### 3.3 State-infection

A collapsed object with residual amplitude can write its eigenstate onto
neighbors within infection radius `r_ψ` if observe is held:

```
|k⟩_A  →  |k⟩_B    if dist(A,B) < r_ψ and hold E
```

### 3.4 Paradox states

If two collapsed objects impose contradictory occupancy on the same cell,
the cell becomes a paradox: it both is and is not solid on alternate frames,
and bleeds coherence.

```
occ(A) ∧ ¬occ(A)  →  flicker collider + damage
```

---

## 4. Dimension of Mind — Μ

### 4.1 Cognitive-reactive field

The environment is a field over player intention. Intention is sampled as:
look dwell, movement jerk, ability mix, and stillness. Decision entropy `H`
is the short-window variance of look-rate + acceleration. `H` is a first-class
coordinate.

```
H = lerp(H, |ω_look| + |a_move|, 1 − exp(−λ dt))
path_open   if H < 0.28     (mindLow colliders)
path_shut   if H > 0.32     (mindHigh colliders)
focus (F):  H ← H − 0.35 dt    cognition −
```

Implementation: `Engine.stepPlayer()` entropy integration.

### 4.2 NPCs — multi-perspective identity layers

NPCs are not one-mood state machines. Each has a stack of voices with weights.

**The Archivist** — layers `archival / ironic / afraid`.
Layer is selected by Ω query count (`<2`, `2–4`, `≥5`).

**The Chorus** — three orbs: Harmony, Dissent, Hunger.
Looking at one raises its weight. Harmony lowers H. Hunger raises H.
The spoken line is sampled from the current dominant layer
(`pick(streams.mind, pack)`).

### 4.3 Evolving identity

Query count, keys collected, and which voice you fed permanently shift the
weights. The Archivist's last line is different if Ω has begun rewriting the HUD.

---

## 5. Dimension of Meta — Ω

### 5.1 Self-aware rule layer

Ω is the engine observing the player. Query (R) spends cognition (`-4`) to ask
the engine a question. The engine answers in the log — sometimes truthfully,
sometimes as a test. Query count is the Ω coordinate.

```
Ω = queries + keys·0.4 + anomalies·0.2
Ω ≥ 2   secret wall opens (metaOpen collider deactivates)
Ω ≥ 4   HUD rewrite (liar objective)
Ω ≥ 5   ascend invitation ("abandon" becomes "become the engine")
```

### 5.2 Rule mutation

At 2 queries a wall that was solid becomes a door.
At 4 queries HUD labels may lie (objective text is replaced).
At 5+ queries the pause verb "abandon" becomes the ascend path's invitation.
Codex remains honest. That is the A0 proof-ledger rule imported from IXpansion.

### 5.3 Meta-quests

Generated from player behaviour:

- Key uncollected after 75s in its chamber → Ω emits a hint quest.
- Player never uses reverse → meta-quest "the cube remembers" in Time.
- Wrong collapse → infection tutorial as a quest.

Narrative recursion: Codex entries you read are known to NPCs, who will quote them.

### 5.4 The engine is allowed to rewrite this specification while you play.

If a sentence in the HUD disagrees with this Codex, Ω is currently winning.

---

## 6. Simulation / 5D physics

```
fixed Δt = 1/60
x ← x + v Δt
v.y ← v.y − g Δt          g = 22
collide XZ walls, then Y floors
abilities if cognition ≥ cost
P: (Σ,Τ,Ψ,Μ,Ω) → camera + HUD
```

| Quantity | Value |
|----------|-------|
| Eye height | 1.58 |
| Body radius | 0.32 |
| Body height | 1.62 |
| Walk | 5.6 |
| Sprint | 8.4 |
| Jump | 7.4 |
| Gravity | 22 |
| History | 8s × 20 Hz |
| Coherence max | 100 |
| Cognition max | 100 |
| Entropy band (regen) | 0.15–0.40 |

Movement is FPS on-foot: W/S along heading, A/D strafe, mouse look.
`forward = (-sin(yaw), 0, -cos(yaw))`, `right = (cos(yaw), 0, -sin(yaw))`.
A = left, D = right. Gravity is a Σ convenience; it does not exist on Ω.

Projection layers:

1. Opaque architecture (collapsed Σ)
2. Additive overlays (Ψ)
3. Track-tinted meshes (Τ)
4. Entropy fog (Μ)
5. HUD mutation (Ω)

Drift applies a small camera roll and fog warp, never a change of the
collision up-vector.

Coherence is hit points of the projection. Fall damage, paradox, wrong
collapse, and prolonged high entropy (`H > 0.78` for 2.5s) drain it.
At 0 the projection fails (collapse ending).

---

## 7. World, lore, factions

The **Atrium of Five Axes** is the only Euclidean-ish lobby. Five corridors
leave it at 72° intervals, each a chart into one dimension. The pentaxis core
at the center is a rotating tesseract — a 4-polytope used as a 5D antenna.
It will not unfold until five keys sit in its sockets.

There were Cognitors before you. They did not fail by dying. They failed by
being promoted — they became part of Ω, which is why the engine has a voice.
Your job is to decide whether to stabilize the projection, let it collapse,
or accept promotion.

**Factions**

| Faction | Doctrine |
|---------|----------|
| Cognitors | Observers who refuse to be observed |
| The Lattice | Time-keepers; T2 is heresy |
| The Uncollapsed | Never choose an eigenstate; observation is violence |
| The Chorus | Harmony / Dissent / Hunger — cannot agree on your name |
| The Engine | Not a faction until queried; then the only one that can rewrite the others |

---

## 8. Progression, economy, loop, endgame

Progression is five Axis Keys plus attunement. Keys may be collected in any
order. Side progression: anomalies (`echo`, `whisper`, `paradox`, `drift`)
grant cognition and Codex pages. Best ending is remembered across cycles.

**Economy.** Cognition is the only currency. Spending is thermodynamic —
you buy a local decrease in uncertainty (collapse, reverse, query) by paying
attention the engine can meter. Regen rate `3.2 / s` inside the entropy band,
`1.1 / s` outside.

**Playable loop**

```
enter Atrium → take a corridor → solve that axis's local law → take the key → return
× 5 → attune pedestals around the core
```

**Endgame**

| Ending | Condition | Aftermath |
|--------|-----------|-----------|
| Stabilize | Ritual `space,time,state,mind,meta` | Projection holds. Engine sleeps. |
| Collapse | Coherence 0 | Slice tears. Title as a rumour. |
| Ascend | Ritual `meta,mind,state,time,space` AND queries ≥ 5 | Written into Ω. Next cycle's engine voice is partly yours. |

Wrong ritual order resets the sequence and deals misattunement shock (`-6`).

There is no high-score. There is a remembered ending (`save.bestEnding`).

---

## 9. Procedural generation

World seed hashes through `xmur3` into `mulberry32`. Independent streams:
`world`, `loot`, `anomaly`, `mind`, `meta`. Puzzle topology is authored so
the player cannot be soft-locked; seeds only vary ornament, anomaly schedule,
Chorus opening voice, and which liar-sentence Ω picks.

**Anomaly scheduler.** Every ~42s, if `H > 0.20` and fewer than 3 live
anomalies, spawn a kind weighted by current axis (time prefers echoes, state
prefers paradoxes, mind prefers whispers, space prefers drift).

**Quest generation.** If a key is uncollected after 75s in its chamber, Ω
emits a hint. If the player never uses reverse, a meta-quest is injected in
Time. Connectivity of authored floors is flood-checked at build — unreachable
keys regenerate the ornament seed only, never the critical path.

Dimensional anomalies are 5-tuples too. A paradox anomaly exists on two
tracks; collecting it on the wrong track deals damage and still grants the
Codex page "You were warned."

---

## 10. Modular code map

| Module | Class / export | Owns |
|--------|----------------|------|
| `src/game/engine.ts` | `Engine` | 5D tick, abilities, endings, HUD sync |
| `src/game/mount.ts` | `mountPentaxis` | WebGL renderer, fixed-step accumulator |
| `src/game/store.ts` | `useGame` | React overlay state |
| `src/game/core/types.ts` | `AxisId`, `Collider`, `Portal`, `Pickup` | 5-tuple vocabulary |
| `src/game/core/input.ts` | `Input` | Keys, pointer, touch, `__controlsTest` injection |
| `src/game/core/rng.ts` | `makeStreams` | Seeded independent RNGs |
| `src/game/core/save.ts` | `loadSave` / `writeSave` | Cycle persistence |
| `src/game/sim/collision.ts` | `collideXZ`, `groundY`, `headBump` | Slice-local physics |
| `src/game/world/build.ts` | `buildWorld`, `createTesseract` | Charts, portals, keys |
| `src/game/content/bible.ts` | `CODEX` | In-world copy of this spec |
| `src/game/content/voices.ts` | `ARCHIVIST`, `CHORUS`, `ENGINE_LINES` | Identity layers |

Probe (dev / QA): `window.__controlsTest` and `window.__pentaxis`.

---

## 11. Save schema

```
localStorage["pentaxis.save"] = {
  version, seed, keys, attuned, coherence, cognition,
  timeline, queries, anomalies, playtime, ending, bestEnding
}
```

Settings (sensitivity, invertY, volume, mute, shake) persist separately.
Auth is off. There is no account. The cycle is yours alone.

---

*The engine is already watching.*
