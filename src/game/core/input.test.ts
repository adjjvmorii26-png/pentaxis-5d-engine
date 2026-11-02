import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Input } from "./input.ts";

describe("touch deadzone", () => {
  it("zeroes input inside the deadzone radius", () => {
    const input = new Input();
    assert.deepEqual(input.applyTouchDeadzone(0.02, 0.02), { x: 0, y: 0 });
  });

  it("rescales full deflection to unit magnitude", () => {
    const input = new Input();
    const v = input.applyTouchDeadzone(1, 0);
    assert.ok(Math.abs(v.x - 1) < 1e-9);
    assert.equal(v.y, 0);
  });

  it("preserves direction and grows with deflection", () => {
    const input = new Input();
    const soft = input.applyTouchDeadzone(0.3, 0);
    const hard = input.applyTouchDeadzone(0.8, 0);
    const diag = input.applyTouchDeadzone(0.3, 0.3);
    assert.ok(soft.x > 0 && hard.x > soft.x);
    assert.ok(diag.x > 0 && diag.y > 0);
  });
});

describe("gyro motion tracking", () => {
  it("establishes a baseline on the first reading", () => {
    const input = new Input();
    input.gyroEnabled = true;
    input.onDeviceOrientation({ alpha: 10, beta: 20 } as DeviceOrientationEvent);
    assert.equal(input.lookX, 0);
    assert.equal(input.lookY, 0);
  });

  it("accumulates yaw (alpha) and pitch (beta) deltas", () => {
    const input = new Input();
    input.gyroEnabled = true;
    input.gyroGain = 1;
    input.onDeviceOrientation({ alpha: 10, beta: 20 } as DeviceOrientationEvent);
    input.onDeviceOrientation({ alpha: 14, beta: 18 } as DeviceOrientationEvent);
    assert.ok(Math.abs(input.lookX - 4) < 1e-9);
    assert.ok(Math.abs(input.lookY + 2) < 1e-9);
  });

  it("wraps alpha across the 0/360 boundary", () => {
    const input = new Input();
    input.gyroEnabled = true;
    input.gyroGain = 1;
    input.onDeviceOrientation({ alpha: 359, beta: 0 } as DeviceOrientationEvent);
    input.onDeviceOrientation({ alpha: 1, beta: 0 } as DeviceOrientationEvent);
    // 1 - 359 = -358, normalised to +2
    assert.ok(Math.abs(input.lookX - 2) < 1e-9);
  });

  it("ignores readings while disabled", () => {
    const input = new Input();
    input.gyroGain = 1;
    input.onDeviceOrientation({ alpha: 0, beta: 0 } as DeviceOrientationEvent);
    input.onDeviceOrientation({ alpha: 30, beta: 30 } as DeviceOrientationEvent);
    assert.equal(input.lookX, 0);
    assert.equal(input.lookY, 0);
  });
});
