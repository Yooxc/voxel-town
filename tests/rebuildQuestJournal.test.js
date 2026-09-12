import test from "node:test";
import assert from "node:assert/strict";
import { createRebuildQuestJournal } from "../src/systems/rebuildQuestJournal.js";

function createController(status, progress = null) {
  return {
    getStatus: () => status,
    getProgressView: () => progress,
  };
}

test("builds separate entries for accepted rebuild quests", () => {
  const state = {
    firstActivities: {
      selectedId: "explore",
      exploreRestVisited: true,
      exploreWorkVisited: true,
      exploreCompleted: true,
      exploreReactionAcknowledged: false,
      gatherCompleted: false,
      gatherReactionAcknowledged: false,
    },
  };
  const firstCraft = createController(
    { started: true, completed: false },
    {
      title: "첫 제작 준비: 돌 컵",
      objectives: [{ label: "돌가루 준비", current: 2, target: 3, display: "돌가루 준비 2/3" }],
      status: "돌 앞으로 이동한 뒤 Space로 채광하세요",
    },
  );
  const flowerCrown = createController(
    { started: true, completed: false },
    {
      objectives: [
        { label: "풀 채집", current: 3, target: 3, display: "풀 3/3" },
        { label: "꽃 채집", current: 1, target: 2, display: "꽃 1/2" },
      ],
      status: "마을에서 풀과 꽃을 맨손으로 채집하세요",
    },
  );
  const journal = createRebuildQuestJournal({
    getOnboardingState: () => state,
    getFirstCraftController: () => firstCraft,
    getFlowerCrownQuestController: () => flowerCrown,
  });

  const entries = journal.getEntries();
  assert.deepEqual(entries.map((entry) => entry.id), ["activity-explore", "first-craft", "flower-crown"]);
  assert.equal(entries[0].status, "마루에게 돌아가세요");
  assert.equal(entries[0].completed, false);
  assert.equal(entries[1].objectives[0].display, "돌가루 준비 2/3");
  assert.equal(entries[2].issuer, "라온");
});

test("uses saved completion records after quest materials are consumed", () => {
  const state = {
    firstActivities: {
      selectedId: "gather",
      gatherCompleted: true,
      gatherReactionAcknowledged: true,
    },
  };
  const journal = createRebuildQuestJournal({
    getOnboardingState: () => state,
    getFirstCraftController: () => createController({ started: true, completed: true, owned: 0 }),
    getFlowerCrownQuestController: () => createController({ started: true, completed: true, materials: [] }),
  });

  const entries = journal.getEntries();
  assert.equal(entries.length, 3);
  assert.equal(entries.every((entry) => entry.completed), true);
  assert.deepEqual(entries.map((entry) => entry.status), ["완료", "완료", "완료"]);
});

test("does not show quests that have not been accepted", () => {
  const journal = createRebuildQuestJournal({
    getOnboardingState: () => ({ firstActivities: { selectedId: "" } }),
    getFirstCraftController: () => createController({ started: false, completed: false }),
    getFlowerCrownQuestController: () => createController({ started: false, completed: false }),
  });

  assert.deepEqual(journal.getEntries(), []);
});
