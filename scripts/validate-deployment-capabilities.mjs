#!/usr/bin/env node
import { readFile } from "node:fs/promises";

const path = new URL("../contracts/deployment-capabilities.json", import.meta.url);

function fail(message) {
  console.error("[deployment-capabilities] FAIL: " + message);
  process.exit(1);
}

let document;
try {
  document = JSON.parse(await readFile(path, "utf8"));
} catch (error) {
  fail("cannot read capability contract: " + (error?.message || error));
}

if (document.schema_version !== 1) fail("unsupported schema_version");
if (document.repository !== "pentaxis-5d-engine") fail("repository identity mismatch");
if (document.runtime?.node !== "22") fail("runtime node must remain 22");
for (const key of ["build_command", "typecheck_command", "test_command"]) {
  if (typeof document.runtime?.[key] !== "string" || !document.runtime[key]) {
    fail("runtime." + key + " must be a non-empty string");
  }
}
if (!Array.isArray(document.targets) || document.targets.length !== 3) {
  fail("expected exactly three candidate deployment targets");
}
for (const target of document.targets) {
  if (!target?.name || target.status !== "candidate") fail("targets must remain candidate-only");
  if (!Array.isArray(target.requires) || target.requires.length === 0) {
    fail("target " + target.name + " must declare evidence requirements");
  }
}
if (document.authority !== "descriptive-only") fail("capability contract cannot grant authority");
if (document.human_gate_required !== true) fail("human promotion gate must remain required");

console.log("[deployment-capabilities] PASS: descriptive capability contract is valid");
