import test from "node:test";
import assert from "node:assert/strict";
import { createTutorialNpcRuntime } from "../src/systems/tutorialNpcs.js";

function npc(x, z, attached = true) {
  return { position: { x, z }, parent: attached ? {} : null };
}

test("registers tutorial NPCs with the default dialogue hint", () => {
  const runtime = createTutorialNpcRuntime();
  const entry = runtime.register(npc(1, 1), "감독관");
  assert.deepEqual(entry.name, "감독관");
  assert.equal(entry.hint, "Space : 대화");
});

test("finds the nearest attached tutorial NPC", () => {
  const runtime = createTutorialNpcRuntime();
  const nearby = npc(1, 0);
  runtime.register(npc(0.2, 0, false), "removed");
  runtime.register(nearby, "nearby", "Space : 안내");
  assert.equal(runtime.findNearest({ x: 0, z: 0 }, 2).obj, nearby);
  assert.equal(runtime.findNearest({ x: 0, z: 0 }, 0.5), null);
});
