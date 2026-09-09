import test from "node:test";
import assert from "node:assert/strict";
import { createPresenceService } from "../server/src/world/presenceService.js";

function sync(service, identity, command = null, player = {}) {
  return service.sync({
    identity,
    displayName: identity,
    player: { x: 5, y: 0, z: -1, mapId: "광산", ...player },
    command,
  });
}

test("assigns separate guides to separate visitors", () => {
  let time = 0;
  const service = createPresenceService({ now: () => time });
  const first = sync(service, "local:first", { type: "tour.request", checkpointId: "rest-area" });
  const second = sync(service, "local:second", { type: "tour.request", checkpointId: "rest-area" });

  const firstGuide = first.guides.find((guide) => guide.ownerId === "local:first");
  const secondGuide = second.guides.find((guide) => guide.ownerId === "local:second");
  assert.ok(firstGuide);
  assert.ok(secondGuide);
  assert.notEqual(firstGuide.id, secondGuide.id);
  time += 500;
  assert.equal(sync(service, "local:second").players.length, 2);
});

test("meets a first-time visitor before starting the location tour", () => {
  let time = 0;
  const service = createPresenceService({ now: () => time });
  let state = sync(service, "local:first", { type: "tour.request", checkpointId: "" }, { x: 7.1, y: 2.4, z: 10.2 });

  for (let step = 0; step < 400; step += 1) {
    time += 250;
    state = sync(service, "local:first", null, { x: 7.1, y: 2.4, z: 10.2 });
    if (state.guides.some((guide) => guide.ownerId === "local:first" && guide.status === "waiting")) break;
  }
  const guide = state.guides.find((entry) => entry.ownerId === "local:first");
  assert.equal(guide?.checkpointId, "guide-intro");
  assert.equal(guide?.status, "waiting");
  assert.ok(Math.hypot(guide.x - 7.1, guide.z - 10.2) < 2.5);
});

test("only the assigned visitor can advance a guide", () => {
  let time = 0;
  const service = createPresenceService({ now: () => time });
  sync(service, "local:first", { type: "tour.request", checkpointId: "rest-area" });
  time += 10_000;
  sync(service, "local:first");
  const denied = sync(service, "local:second", { type: "tour.advance" });

  assert.equal(denied.ok, false);
  assert.match(denied.error, /진행할 안내/);
});

test("returns a guide when its visitor leaves the world", () => {
  let time = 0;
  const service = createPresenceService({ now: () => time });
  sync(service, "local:first", { type: "tour.request", checkpointId: "rest-area" });
  service.leave("local:first");
  time += 10_000;
  const state = sync(service, "local:second");

  assert.ok(state.guides.every((guide) => !guide.ownerId || guide.status === "returning"));
});

test("returns an arriving guide when its visitor changes maps", () => {
  let time = 0;
  const service = createPresenceService({ now: () => time });
  sync(service, "local:first", { type: "tour.request", checkpointId: "rest-area" });
  time += 250;
  const state = sync(service, "local:first", null, { mapId: "폐광" });
  const guide = state.guides.find((entry) => entry.ownerId === "local:first");

  assert.equal(guide.status, "returning");
  assert.equal(guide.returnReason, "paused");
});

test("waits for a trailing visitor and resumes when they catch up", () => {
  let time = 0;
  const service = createPresenceService({ now: () => time });
  let state = sync(service, "local:first", { type: "tour.request", checkpointId: "rest-area" }, { x: -5, z: 10.4 });

  for (let step = 0; step < 400; step += 1) {
    time += 250;
    state = sync(service, "local:first", null, { x: -5, z: 10.4 });
    if (state.guides.some((guide) => guide.ownerId === "local:first" && guide.status === "waiting")) break;
  }
  assert.equal(state.guides.find((guide) => guide.ownerId === "local:first")?.status, "waiting");

  state = sync(service, "local:first", { type: "tour.advance" }, { x: -5, z: 10.4 });
  for (let step = 0; step < 160; step += 1) {
    time += 250;
    state = sync(service, "local:first", null, { x: -5, z: 10.4 });
    if (state.guides.some((guide) => guide.ownerId === "local:first" && guide.status === "waiting_for_player")) break;
  }
  const pausedGuide = state.guides.find((guide) => guide.ownerId === "local:first");
  assert.equal(pausedGuide?.status, "waiting_for_player");

  time += 250;
  state = sync(service, "local:first", null, { x: pausedGuide.x, y: pausedGuide.y, z: pausedGuide.z });
  assert.equal(state.guides.find((guide) => guide.ownerId === "local:first")?.status, "moving");
});
