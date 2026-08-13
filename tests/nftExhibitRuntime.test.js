import test from "node:test";
import assert from "node:assert/strict";
import { createNftExhibitRuntime } from "../src/systems/nftExhibitRuntime.js";

function createRuntime() {
  const normalize = (value) => value?.id ? { id: String(value.id) } : null;
  const same = (left, right) => left?.id === right?.id;
  return createNftExhibitRuntime({ normalizeSelection: normalize, isSameSelection: same });
}

test("keeps only the latest list request current", () => {
  const runtime = createRuntime();
  const first = runtime.beginListRequest();
  const second = runtime.beginListRequest();
  assert.equal(runtime.isCurrentListRequest(first), false);
  assert.equal(runtime.isCurrentListRequest(second), true);
});

test("builds normalized selection and ownership mismatch state", () => {
  const runtime = createRuntime();
  assert.deepEqual(runtime.getSelectionPlan({ id: "1" }, { id: 1 }), {
    selection: { id: "1" },
    changed: false,
  });
  const state = runtime.getListResultState({
    tokens: [{ contractAddress: "0xabc", tokenId: "2" }],
    selected: { contractAddress: "0xabc", tokenId: "1" },
  });
  assert.equal(state.ownershipMismatch, true);
  assert.equal(state.tone, "error");
});
