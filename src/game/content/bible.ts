export type CodexPage = {
  id: string;
  title: string;
  kicker: string;
  body: string[];
  diagram?: string;
};

export const CODEX: CodexPage[] = [
  {
    id: "spec",
    title: "5D Core Engine Specification",
    kicker: "Pentaxis / Engine v5.0",
    body: [
      "Pentaxis is a five-axis reality engine. It does not simulate a world sitting inside space-time. It simulates a world whose coordinates are (Σ space, Τ time, Ψ state, Μ mind, Ω meta) and then projects that 5-manifold onto a 3-dimensional observer slice the Cognitor can walk.",
      "The engine's contract: every entity is a 5-tuple. The renderer only ever sees a projection P(Σ,Τ,Ψ,Μ,Ω) → R³. Changing an unused axis is not a visual effect — it is a change of which slice you occupy. Two objects that never collide in the projection may be adjacent in 5-space, which is how state-infection, timeline bleed, and meta-rule mutation propagate.",
      "Player cognition is not a UI layer. It is a coordinate. The engine samples intention (look vector), decision entropy (angular + translational jerk), and query count, then writes those samples back into Μ and Ω. The world is allowed to rewrite its own update rules when Ω exceeds a mutation threshold.",
    ],
    diagram: `
  Ω  meta (rule space)
  │
  │     Μ mind (cognition field)
  │    /
  │   /
  │  /      Ψ state (superposition)
  │ /      /
  │/      /
  +------ Τ time (tracks 0/1/2 + reverse)
   \\
    \\
     Σ space (non-Euclidean projection)
`,
  },
  {
    id: "space",
    title: "Dimension of Space — Σ",
    kicker: "Non-Euclidean projection layer",
    body: [
      "Σ is not a Euclidean R³. Rooms are charts on a manifold. Portals are transition maps with a residual rotation: walking through a hyper-door applies a 90° axis swap in the projection, which the inner ear reads as 'the building was larger inside.'",
      "Hyper-rooms: the interior metric is independent of the exterior embedding. A 2-meter door may open onto a 20-meter cube because the chart scale λ_in ≠ λ_out. Recursive zones are stacked charts that share a visual well — looking down is a proof of depth that Euclid would forbid at that footprint.",
      "Dimensional drift is a slow SO(3) shear of the unused axes onto the projection. Drift amplitude grows with unused keys and with Ω. High drift tilts apparent verticals; the simulation's up-vector does not change, only the visual frame.",
      "Topology can change from player cognition: if Μ entropy is high, some corridors identify their ends (loop with offset). If entropy is low, the identification splits and a previously impossible balcony becomes a path.",
    ],
    diagram: `
portal Φ:  x' = R(θ) · (x − a) + b
θ = π/2  → axis shift (hyper-room)
θ = π    → identification (recursive well)
scale λ_in / λ_out ≠ 1 → TARDIS metric
`,
  },
  {
    id: "time",
    title: "Dimension of Time — Τ",
    kicker: "Multi-track chronology",
    body: [
      "Three tracks occupy the same Σ chart: Past (T0), Present (T1), Future (T2). Switching tracks is a discrete jump on Τ, not a rewind. Objects carry a track mask. Collision and visibility are evaluated only against the active track.",
      "Reversible events: the engine records a ring buffer (8 s × 20 Hz) of time-mass bodies and the player. Holding reverse replays the buffer backward. Reverse is not free — it costs cognition and is opposed by time-friction.",
      "Time-mass m_t resists dΤ. A high-mass cube cannot be rewound as far; its history is sticky. Time-friction f_t = 1 + m_t · |dΤ| scales the reverse playback rate down.",
      "Timeline collapse: switching tracks while reverse is engaged, or occupying a volume that is solid on the destination track, deals paradox damage to coherence. Collapse state is a temporary overlay where both tracks render and neither collision set is fully trusted.",
    ],
    diagram: `
T0  past     ── bridge exists ──
T1  present  ── gap, side ledge ──
T2  future   ── key + time-mass ──

reverse:  q(t) ← history[i--]   rate = 1 / (1 + f_t)
collapse:  T_active ⊕ T_dest ≠ 0  →  coherence -= paradox
`,
  },
  {
    id: "state",
    title: "Dimension of State — Ψ",
    kicker: "Simultaneous realities",
    body: [
      "Objects may exist in superposition: a set of candidate eigenstates {ψ_i} with amplitudes a_i. The renderer draws all of them as quantum overlays (additive, low alpha). They do not collide until observation.",
      "Observe (E) while the look vector is aligned with a candidate collapses the set to that eigenstate. Collapse is irreversible for that object unless a paradox reset occurs.",
      "State-infection: a collapsed object with residual amplitude can write its eigenstate onto neighbors within infection radius r_ψ if you hold observe. This is how a short ghost-bridge becomes a railing, or a wrong collapse spreads a dead path.",
      "Paradox states: if two collapsed objects impose contradictory occupancy on the same cell, the cell becomes a paradox: it both is and is not solid on alternate frames, and bleeds coherence.",
    ],
    diagram: `
ψ = Σ a_i |i⟩     observe → |k⟩ if look·n_k = max
infection:  |k⟩_A  →  |k⟩_B   if dist(A,B) < r_ψ and hold E
paradox:    occ(A) ∧ ¬occ(A)  →  flicker collider + damage
`,
  },
  {
    id: "mind",
    title: "Dimension of Mind — Μ",
    kicker: "Cognitive-reactive field",
    body: [
      "The environment is a field over player intention. Intention is sampled as: look dwell, movement jerk, ability mix, and stillness. Decision entropy H is the short-window variance of look-rate + acceleration. H is a first-class coordinate.",
      "High H closes paths, raises drift, and agitates the Chorus. Low H (focus, F, or stillness) opens mind-gated floors and reveals light-paths. Focus spends cognition to leak entropy out of the field.",
      "NPCs are not state machines with one mood. Each has identity layers: a stack of voices with weights. The Archivist is archival / ironic / afraid. The Chorus is three orbs — Harmony, Dissent, Hunger — and looking at one raises its weight. The spoken line is sampled from the current dominant layer.",
      "Evolving identity: query count, keys collected, and which voice you fed permanently shift the weights. The Archivist's last line is different if Ω has begun rewriting the HUD.",
    ],
    diagram: `
H = lerp(H, |ω_look| + |a_move|, 1 − exp(−λ dt))
path_open  if H < 0.28
path_shut  if H > 0.55
focus:     H ← H − 0.35 dt    cognition −
NPC line ~ categorical(weights)
`,
  },
  {
    id: "meta",
    title: "Dimension of Meta — Ω",
    kicker: "Self-aware rule layer",
    body: [
      "Ω is the engine observing the player. Query (R) spends cognition to ask the engine a question. The engine answers in the log — sometimes truthfully, sometimes as a test. Query count is the Ω coordinate.",
      "Rule mutation: at 2 queries a wall that was solid becomes a door. At 4 queries HUD labels may lie (objective text is replaced). At 5+ queries the pause verb 'abandon' becomes 'become the engine', which is the ascend path's invitation.",
      "Meta-quests are generated from player behaviour: if you never reverse time, the engine will demand it; if you collapse the wrong state, it will offer an infection tutorial as a quest. Narrative recursion: Codex entries you read are known to NPCs, who will quote them.",
      "The engine is allowed to rewrite this specification while you play. If a sentence in the HUD disagrees with this Codex, Ω is currently winning.",
    ],
    diagram: `
Ω = queries + keys·0.4 + anomalies·0.2
Ω ≥ 2  secret wall opens
Ω ≥ 4  HUD rewrite (liar objective)
Ω ≥ 5  ascend invitation
ritual order ΣΤΨΜΩ = stabilize
ritual order ΩΜΨΤΣ = ascend
`,
  },
  {
    id: "world",
    title: "World, Lore, Factions",
    kicker: "The Atrium and the five charts",
    body: [
      "The Atrium of Five Axes is the only Euclidean-ish lobby. Five corridors leave it at 72° intervals, each a chart into one dimension. The pentaxis core at the center is a rotating tesseract — a 4-polytope used as a 5D antenna. It will not unfold until five keys sit in its sockets.",
      "Lore: there were Cognitors before you. They did not fail by dying. They failed by being promoted — they became part of Ω, which is why the engine has a voice. Your job is to decide whether to stabilize the projection, let it collapse, or accept promotion.",
      "Factions. The Cognitors: observers who refuse to be observed. The Lattice: time-keepers who treat T2 as heresy. The Uncollapsed: beings that never choose an eigenstate and regard observation as violence. The Chorus: a mind-hive whose three voices cannot agree on your name. The Engine: not a faction until you query it, after which it is the only faction that can rewrite the others.",
    ],
  },
  {
    id: "physics",
    title: "5D Physics & Simulation",
    kicker: "Fixed-step projection",
    body: [
      "Simulation steps at 60 Hz. Rendering is decoupled. Movement is FPS on-foot: W/S along heading, A/D strafe, mouse look. Gravity is a Σ convenience; it does not exist on Ω.",
      "Projection layers: opaque architecture (collapsed Σ), additive overlays (Ψ), track-tinted meshes (Τ), entropy fog (Μ), and HUD mutation (Ω). Drift applies a small camera roll and UV warp, never a change of the collision up-vector.",
      "Coherence is hit points of the projection. Fall damage, paradox, wrong collapse, and prolonged high entropy drain it. At 0 the projection fails (collapse ending).",
      "Cognition is the economy. Reverse, focus, query, and infection spend it. It regenerates faster when entropy is in the band 0.15–0.40 — the engine prefers a player who is neither catatonic nor panicking.",
    ],
    diagram: `
fixed Δt = 1/60
x ← x + v Δt
v.y ← v.y − g Δt
collide XZ walls, then Y floors
abilities if cognition ≥ cost
P:  (Σ,Τ,Ψ,Μ,Ω) → camera + HUD
`,
  },
  {
    id: "progress",
    title: "Progression, Economy, Loop, Endgame",
    kicker: "The playable contract",
    body: [
      "Progression is five Axis Keys plus attunement. Keys are collected in any order. Side progression: anomalies (echo, whisper, paradox, drift) grant cognition and Codex pages. Best ending is remembered across cycles.",
      "Economy: Cognition is the only currency. There are no shops. Spending is thermodynamic — you buy a local decrease in uncertainty (collapse, reverse, query) by paying attention the engine can meter.",
      "Playable loop: enter Atrium → take a corridor → solve that axis's local law → take the key → return. After five keys, attune the pedestals around the core. Order Σ-Τ-Ψ-Μ-Ω stabilizes. Reverse order after Ω ≥ 5 ascends. Coherence 0 collapses.",
      "Endgame conditions. Stabilize: the projection holds and the engine sleeps. Collapse: the slice tears; you respawn at the title as a rumour. Ascend: you are written into Ω — the next cycle's engine voice is partly yours. There is no high-score. There is a remembered ending.",
    ],
    diagram: `
loop:
  [atrium] → [Σ|Τ|Ψ|Μ|Ω chamber] → key
  × 5  →  attune pedestals  →  ending

stabilize  ritual clockwise
ascend     ritual widdershins + Ω≥5
collapse   coherence = 0
`,
  },
  {
    id: "procgen",
    title: "Procedural Generation Rules",
    kicker: "Seeded, validated, never Math.random",
    body: [
      "World seed hashes through xmur3 into mulberry32. Independent streams: world, loot, anomaly, mind, meta. Puzzle topology is authored so the player cannot be soft-locked; seeds only vary ornament, anomaly schedule, Chorus opening voice, and which liar-sentence Ω picks.",
      "Anomaly scheduler: every ~40s, if entropy > 0.22 and fewer than 3 live anomalies, spawn a kind weighted by current axis (time chamber prefers echoes, state prefers paradoxes, mind prefers whispers, space prefers drift).",
      "Quest generation: if a key is uncollected after 90s in its chamber, Ω emits a hint quest. If the player never uses reverse, a meta-quest 'the cube remembers' is injected in Time. Connectivity of authored floors is flood-checked at build — unreachable keys regenerate the ornament seed only, never the critical path.",
      "Dimensional anomalies are 5-tuples too. A paradox anomaly is a pickup that exists on two tracks; collecting it on the wrong track deals damage and still grants the Codex page 'You were warned.'",
    ],
  },
];

export const CONTROL_LINES = [
  ["WASD / stick", "Move — A strafes left, D right"],
  ["Mouse / drag", "Look"],
  ["Space", "Jump"],
  ["Shift", "Sprint"],
  ["1 / 2 / 3", "Timeline past / present / future"],
  ["Q hold", "Reverse local time"],
  ["E", "Observe, interact, attune"],
  ["F hold", "Cognitive focus — lower entropy"],
  ["R", "Query the engine"],
  ["Tab", "Codex"],
  ["Esc", "Pause"],
];
