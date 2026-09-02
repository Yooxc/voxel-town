import test from "node:test";
import assert from "node:assert/strict";
import { createWorldFeatureCoordinator } from "../src/world/worldFeatureCoordinator.js";

test("delegates frontier, survival, and map calls to their owning runtimes", () => {
  const calls = [];
  const coordinator = createWorldFeatureCoordinator({
    getFrontier: () => ({
      getBuildState: () => "build",
      openBoothDialog: (options) => { calls.push(options); return true; },
    }),
    getSurvival: () => ({ updateAirSystem: (dt) => dt, useQuickUseItem: (...args) => args }),
    getQuickUseItemId: (key) => `item:${key}`,
    mapRuntime: { registerMapGate: (gate) => gate, registerConnectorTunnelZone: () => {}, findTriggeredGate: () => null, updateCurrentMap: () => "광산", isInConnectorTunnel: () => false, getEffectiveAirMapId: () => "광산" },
  });
  assert.equal(coordinator.frontier.getBuildState(), "build");
  assert.equal(coordinator.survival.updateAirSystem(0.1), 0.1);
  assert.equal(coordinator.map.updateCurrentMap(), "광산");
  assert.equal(coordinator.openFrontierBoothDialog("A", "shop", "상점", "manage"), true);
  assert.deepEqual(calls[0], { parcelLabel: "A", slotKey: "shop", boothTitle: "상점", mode: "manage" });
  const quickUseArgs = coordinator.useQuickUseItem("1");
  assert.equal(quickUseArgs[0], "1");
  assert.equal(quickUseArgs[1]("1"), "item:1");
});
