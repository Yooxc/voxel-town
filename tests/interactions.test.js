import test from "node:test";
import assert from "node:assert/strict";
import { findNearestInteractable, getInteractableHintText } from "../src/systems/interactions.js";

function createEntry(distance, { visible = true } = {}) {
  return {
    obj: {
      visible,
      position: { distanceTo: () => distance },
    },
  };
}

test("finds the closest visible interactable inside the radius", () => {
  const far = createEntry(1.7);
  const near = createEntry(0.8);
  assert.equal(findNearestInteractable([far, near], {}, 2.0), near);
});

test("ignores hidden and out-of-range interactables", () => {
  const hidden = createEntry(0.2, { visible: false });
  const edge = createEntry(2.0);
  assert.equal(findNearestInteractable([hidden, edge], {}, 2.0), null);
});

test("resolves specialized interactable hints before the default text", () => {
  const dependencies = {
    frontierBoothPlan: { hintText: "E : 전시 관리" },
    getAirPurifierHintText: (mapId) => `E : ${mapId} 정화`,
    hasMansionOneResidenceAuthority: () => true,
    getOwnedMansionRoomPermitName: () => "Mansion ONE",
    getRefineryHintText: () => "E : 재련소 사용",
  };
  assert.equal(getInteractableHintText({ type: "airPurifier", purifierMapId: "폐광" }, dependencies), "E : 폐광 정화");
  assert.equal(getInteractableHintText({ type: "frontierShopBooth" }, dependencies), "E : 전시 관리");
  assert.equal(getInteractableHintText({ type: "mansionEntry" }, { ...dependencies, frontierBoothPlan: null }), "E : Mansion ONE 입장");
  assert.equal(getInteractableHintText({ type: "refinery" }, { ...dependencies, frontierBoothPlan: null }), "E : 재련소 사용");
  assert.equal(getInteractableHintText({ text: "E : 표지판" }, { ...dependencies, frontierBoothPlan: null }), "E : 표지판");
});
