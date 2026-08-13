import test from "node:test";
import assert from "node:assert/strict";
import { createMapRuntime } from "../src/systems/mapRuntime.js";

function createRuntime({ now = () => 100 } = {}) {
  const mapGates = [];
  const connectorTunnelZones = [];
  const player = { x: 0, z: 0 };
  let mapId = "mine";
  const runtime = createMapRuntime({
    mapGates,
    connectorTunnelZones,
    getPlayerPosition: () => player,
    getCurrentMapId: () => mapId,
    setCurrentMapId: (nextMapId) => { mapId = nextMapId; },
    getMapThresholds: () => ({
      mineDoorThresholdZ: 10,
      campDoorThresholdZ: -10,
      campNorthDoorThresholdZ: -20,
      frontierDoorThresholdZ: -30,
    }),
    isInResidenceZone: () => false,
    residenceMapId: "residence",
    now,
  });
  return { runtime, mapGates, connectorTunnelZones, player, getMapId: () => mapId };
}

test("registers and finds gates unless a transition is locked", () => {
  let currentTime = 100;
  const { runtime, player } = createRuntime({ now: () => currentTime });
  const gate = runtime.registerMapGate({
    mapId: "mine",
    trigger: { x: 0, z: 0, radius: 2 },
  });
  assert.equal(runtime.findTriggeredGate(), gate);
  runtime.lockTransition(50);
  assert.equal(runtime.findTriggeredGate(), null);
  currentTime = 151;
  assert.equal(runtime.findTriggeredGate(), gate);
  player.z = 5;
  assert.equal(runtime.findTriggeredGate(), null);
});

test("updates map identity and excludes connector tunnels from air maps", () => {
  const { runtime, player, getMapId } = createRuntime();
  runtime.registerConnectorTunnelZone(0, -4, 4, 2);
  assert.equal(runtime.isInConnectorTunnel(), true);
  assert.equal(runtime.getEffectiveAirMapId(), null);

  player.z = -15;
  assert.equal(runtime.updateCurrentMap(), "폐광");
  assert.equal(getMapId(), "폐광");
  assert.equal(runtime.getEffectiveAirMapId(), "폐광");
});
