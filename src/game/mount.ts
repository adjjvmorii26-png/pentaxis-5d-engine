import * as THREE from "three";
import { Engine } from "./engine";
import { audio } from "./core/audio";
import { useGame } from "./store";

export function mountPentaxis(canvas: HTMLCanvasElement) {
  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    powerPreference: "high-performance",
    alpha: false,
  });
  renderer.setClearColor(0x07080a, 1);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x07080a);
  scene.fog = new THREE.Fog(0x07080a, 16, 64);

  const camera = new THREE.PerspectiveCamera(72, 1, 0.06, 120);

  const engine = new Engine(scene, camera, canvas);
  engine.init();
  window.__pentaxis = engine;

  let acc = 0;
  let last = performance.now();
  const FIXED = 1 / 60;

  const resize = () => {
    const parent = canvas.parentElement ?? canvas;
    const w = parent.clientWidth || window.innerWidth;
    const h = parent.clientHeight || window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / Math.max(1, h);
    camera.updateProjectionMatrix();
  };
  resize();
  const ro = new ResizeObserver(resize);
  ro.observe(canvas.parentElement ?? canvas);
  window.addEventListener("resize", resize);

  const onFirst = () => audio.unlock();
  window.addEventListener("pointerdown", onFirst, { once: true });
  window.addEventListener("keydown", onFirst, { once: true });

  canvas.addEventListener("click", () => {
    if (useGame.getState().phase === "playing") engine.requestLock();
  });

  renderer.setAnimationLoop(() => {
    const now = performance.now();
    let dt = (now - last) / 1000;
    last = now;
    if (dt > 0.1) dt = 0.1;
    const phase = useGame.getState().phase;
    const frozen = engine.juice.hitstop > 0 && phase === "playing";
    if (!frozen && (phase === "playing" || phase === "title" || phase === "ending")) {
      acc += dt;
      while (acc >= FIXED) {
        engine.fixedUpdate(FIXED);
        acc -= FIXED;
      }
    } else if (phase === "paused" || phase === "codex") {
      engine.fixedUpdate(FIXED);
      acc = 0;
    }
    engine.render(dt);
    renderer.render(scene, camera);
  });

  return {
    engine,
    dispose() {
      renderer.setAnimationLoop(null);
      ro.disconnect();
      window.removeEventListener("resize", resize);
      engine.dispose();
      renderer.dispose();
      if (window.__pentaxis === engine) delete window.__pentaxis;
    },
  };
}
