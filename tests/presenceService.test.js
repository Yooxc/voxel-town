import test from "node:test";
import assert from "node:assert/strict";
import { createPresenceService } from "../server/src/world/presenceService.js";
import { getRebuildLayout } from "../src/world/rebuildLayout.js";

function sync(service, identity, command = null, player = {}) {
  return service.sync({
    identity,
    displayName: identity,
    player: { x: 5, y: 0, z: -1, mapId: "광산", ...player },
    command,
  });
}

test("assigns an isolated Daon instance to every visitor", () => {
  let time = 0;
  const service = createPresenceService({ now: () => time });
  const first = sync(service, "local:first", { type: "tour.request", checkpointId: "rest-area" });
  const second = sync(service, "local:second", { type: "tour.request", checkpointId: "rest-area" });

  assert.equal(first.guides.length, 1);
  assert.equal(second.guides.length, 1);
  assert.equal(first.guides[0].id, "guide-1");
  assert.equal(second.guides[0].id, "guide-1");
  assert.equal(first.guides[0].ownerId, "local:first");
  assert.equal(second.guides[0].ownerId, "local:second");
  assert.equal(service.getGuides().length, 2);
  time += 500;
  const firstUpdate = sync(service, "local:first");
  assert.equal(firstUpdate.players.length, 2);
  assert.deepEqual(firstUpdate.guides.map((guide) => guide.ownerId), ["local:first"]);
});

test("does not impose a shared guide capacity on simultaneous visitors", () => {
  const service = createPresenceService({ now: () => 0 });
  const identities = Array.from({ length: 6 }, (_, index) => `local:${index + 1}`);

  for (const identity of identities) {
    const state = sync(service, identity, { type: "tour.request", checkpointId: "guide-intro" });
    assert.equal(state.ok, true);
    assert.deepEqual(state.guides.map((guide) => guide.ownerId), [identity]);
  }
  assert.equal(service.getGuides().length, identities.length);
});

test("meets a first-time visitor before starting the location tour", () => {
  let time = 0;
  const service = createPresenceService({ now: () => time });
  const meeting = getRebuildLayout().tour.checkpoints.find((checkpoint) => checkpoint.id === "guide-intro").position;
  let state = sync(service, "local:first", { type: "tour.request", checkpointId: "" }, meeting);

  for (let step = 0; step < 400; step += 1) {
    time += 250;
    state = sync(service, "local:first", null, meeting);
    if (state.guides.some((guide) => guide.ownerId === "local:first" && guide.status === "waiting")) break;
  }
  const guide = state.guides.find((entry) => entry.ownerId === "local:first");
  assert.equal(guide?.checkpointId, "guide-intro");
  assert.equal(guide?.status, "waiting");
  assert.ok(Math.hypot(guide.x - meeting.x, guide.z - meeting.z) < 2.5);
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

  assert.equal(service.getGuides().some((guide) => guide.ownerId === "local:first"), false);
  assert.equal(state.guides.length, 1);
  assert.equal(state.guides[0].status, "idle");
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
  const restArea = getRebuildLayout().tour.checkpoints.find((checkpoint) => checkpoint.id === "rest-area").position;
  let state = sync(service, "local:first", { type: "tour.request", checkpointId: "rest-area" }, restArea);

  for (let step = 0; step < 400; step += 1) {
    time += 250;
    state = sync(service, "local:first", null, restArea);
    if (state.guides.some((guide) => guide.ownerId === "local:first" && guide.status === "waiting")) break;
  }
  assert.equal(state.guides.find((guide) => guide.ownerId === "local:first")?.status, "waiting");

  state = sync(service, "local:first", { type: "tour.advance" }, restArea);
  for (let step = 0; step < 160; step += 1) {
    time += 250;
    state = sync(service, "local:first", null, restArea);
    if (state.guides.some((guide) => guide.ownerId === "local:first" && guide.status === "waiting_for_player")) break;
  }
  const pausedGuide = state.guides.find((guide) => guide.ownerId === "local:first");
  assert.equal(pausedGuide?.status, "waiting_for_player");

  time += 250;
  state = sync(service, "local:first", null, { x: pausedGuide.x, y: pausedGuide.y, z: pausedGuide.z });
  assert.equal(state.guides.find((guide) => guide.ownerId === "local:first")?.status, "moving");
});

test("shares one gathered plant result across visitors", () => {
  const service = createPresenceService({ now: () => 0, random: (() => {
    let seed = 17;
    return () => {
      seed = (seed * 16807) % 2147483647;
      return (seed - 1) / 2147483646;
    };
  })() });
  const initial = sync(service, "local:first");
  const plant = initial.gathering.plants[0];
  sync(service, "local:first", null, { x: plant.x, y: plant.y, z: plant.z });
  sync(service, "local:second", null, { x: plant.x, y: plant.y, z: plant.z });

  const first = service.gather({ identity: "local:first", resourceId: plant.id, requestId: "request-1" });
  const second = service.gather({ identity: "local:second", resourceId: plant.id, requestId: "request-2" });
  const secondSnapshot = sync(service, "local:second");

  assert.equal(first.ok, true);
  assert.equal(second.ok, false);
  assert.equal(secondSnapshot.gathering.plants.some((entry) => entry.id === plant.id), false);
});

test("shares only supported equipped headwear with other visitors", () => {
  const service = createPresenceService({ now: () => 0 });
  const equipped = sync(service, "local:first", null, { headItemId: "flowerCrown" });
  assert.equal(equipped.players.find((player) => player.id === "local:first")?.headItemId, "flowerCrown");

  const unsupported = sync(service, "local:first", null, { headItemId: "unknown-item" });
  assert.equal(unsupported.players.find((player) => player.id === "local:first")?.headItemId, "");
});
