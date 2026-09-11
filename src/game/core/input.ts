export type Actions = {
  moveX: number;
  moveY: number;
  lookX: number;
  lookY: number;
  jump: boolean;
  jumpPressed: boolean;
  sprint: boolean;
  observe: boolean;
  observePressed: boolean;
  focus: boolean;
  reverse: boolean;
  queryPressed: boolean;
  timeline: number | null;
  pausePressed: boolean;
  codexPressed: boolean;
};

const GAME_CODES = new Set([
  "KeyW",
  "KeyA",
  "KeyS",
  "KeyD",
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
  "ShiftLeft",
  "ShiftRight",
  "KeyE",
  "KeyF",
  "KeyQ",
  "KeyR",
  "Digit1",
  "Digit2",
  "Digit3",
  "Tab",
  "KeyP",
]);

function radialDeadzone(x: number, y: number, dz = 0.15) {
  const m = Math.hypot(x, y);
  if (m < dz) return { x: 0, y: 0 };
  const scale = (m - dz) / (1 - dz) / m;
  return { x: x * scale, y: y * scale };
}

export class Input {
  keys = new Set<string>();
  injected = new Set<string>();
  lookX = 0;
  lookY = 0;
  touchMoveX = 0;
  touchMoveY = 0;
  touchLookX = 0;
  touchLookY = 0;
  prevJump = false;
  prevObserve = false;
  prevQuery = false;
  prevPause = false;
  prevCodex = false;
  prevTimeline = [false, false, false];
  invertY = false;
  lookSensitivity = 1;

  constructor() {
    this.onKeyDown = this.onKeyDown.bind(this);
    this.onKeyUp = this.onKeyUp.bind(this);
    this.onBlur = this.onBlur.bind(this);
  }

  attach() {
    window.addEventListener("keydown", this.onKeyDown);
    window.addEventListener("keyup", this.onKeyUp);
    window.addEventListener("blur", this.onBlur);
    document.addEventListener("visibilitychange", this.onBlur);
  }

  detach() {
    window.removeEventListener("keydown", this.onKeyDown);
    window.removeEventListener("keyup", this.onKeyUp);
    window.removeEventListener("blur", this.onBlur);
    document.removeEventListener("visibilitychange", this.onBlur);
  }

  onKeyDown(e: KeyboardEvent) {
    if (e.repeat) {
      if (GAME_CODES.has(e.code)) e.preventDefault();
      return;
    }
    this.keys.add(e.code);
    if (GAME_CODES.has(e.code)) e.preventDefault();
  }

  onKeyUp(e: KeyboardEvent) {
    this.keys.delete(e.code);
  }

  onBlur() {
    this.keys.clear();
  }

  setKeys(codes: string[]) {
    this.injected = new Set(codes);
  }

  held(code: string) {
    return this.keys.has(code) || this.injected.has(code);
  }

  consumeLook() {
    const x = this.lookX + this.touchLookX;
    const y = this.lookY + this.touchLookY;
    this.lookX = 0;
    this.lookY = 0;
    this.touchLookX = 0;
    this.touchLookY = 0;
    return { x, y };
  }

  poll(): Actions {
    let moveX = this.touchMoveX;
    let moveY = this.touchMoveY;
    if (this.held("KeyD") || this.held("ArrowRight")) moveX += 1;
    if (this.held("KeyA") || this.held("ArrowLeft")) moveX -= 1;
    if (this.held("KeyW") || this.held("ArrowUp")) moveY += 1;
    if (this.held("KeyS") || this.held("ArrowDown")) moveY -= 1;
    const ml = Math.hypot(moveX, moveY);
    if (ml > 1) {
      moveX /= ml;
      moveY /= ml;
    }

    const pads = typeof navigator !== "undefined" ? navigator.getGamepads?.() : null;
    if (pads) {
      for (const pad of pads) {
        if (!pad || pad.mapping !== "standard") continue;
        const stick = radialDeadzone(pad.axes[0] ?? 0, pad.axes[1] ?? 0);
        moveX += stick.x;
        moveY += -stick.y;
        const look = radialDeadzone(pad.axes[2] ?? 0, pad.axes[3] ?? 0, 0.12);
        this.lookX += look.x * 6;
        this.lookY += look.y * 4;
        if (pad.buttons[0]?.pressed) this.keys.add("Space");
        if (pad.buttons[1]?.pressed) this.keys.add("KeyE");
        if (pad.buttons[2]?.pressed) this.keys.add("KeyF");
        if (pad.buttons[4]?.pressed) this.keys.add("KeyQ");
        if (pad.buttons[5]?.pressed) this.keys.add("KeyR");
        if (pad.buttons[9]?.pressed) this.keys.add("Escape");
        if (pad.buttons[12]?.pressed) moveY += 1;
        if (pad.buttons[13]?.pressed) moveY -= 1;
        if (pad.buttons[14]?.pressed) moveX -= 1;
        if (pad.buttons[15]?.pressed) moveX += 1;
      }
      const ml2 = Math.hypot(moveX, moveY);
      if (ml2 > 1) {
        moveX /= ml2;
        moveY /= ml2;
      }
    }

    const jump = this.held("Space");
    const observe = this.held("KeyE");
    const query = this.held("KeyR");
    const pause = this.held("Escape") || this.held("KeyP");
    const codex = this.held("Tab") || this.held("KeyC");
    const t1 = this.held("Digit1");
    const t2 = this.held("Digit2");
    const t3 = this.held("Digit3");

    let timeline: number | null = null;
    if (t1 && !this.prevTimeline[0]) timeline = 0;
    if (t2 && !this.prevTimeline[1]) timeline = 1;
    if (t3 && !this.prevTimeline[2]) timeline = 2;

    const actions: Actions = {
      moveX,
      moveY,
      lookX: 0,
      lookY: 0,
      jump,
      jumpPressed: jump && !this.prevJump,
      sprint: this.held("ShiftLeft") || this.held("ShiftRight"),
      observe,
      observePressed: observe && !this.prevObserve,
      focus: this.held("KeyF"),
      reverse: this.held("KeyQ"),
      queryPressed: query && !this.prevQuery,
      timeline,
      pausePressed: pause && !this.prevPause,
      codexPressed: codex && !this.prevCodex,
    };

    this.prevJump = jump;
    this.prevObserve = observe;
    this.prevQuery = query;
    this.prevPause = pause;
    this.prevCodex = codex;
    this.prevTimeline = [t1, t2, t3];
    return actions;
  }
}
