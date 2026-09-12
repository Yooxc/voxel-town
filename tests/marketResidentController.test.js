import test from "node:test";
import assert from "node:assert/strict";
import { createMarketResidentController } from "../src/systems/marketResidentController.js";

function createHarness() {
  const views = [];
  let hidden = 0;
  const entry = {
    obj: {},
    role: "market-resident",
    market: {
      id: "craft-resident",
      stallId: "materials",
      aboutText: "재료를 모아 두고 있어요.",
      displayText: "돌과 나무 견본이 보여요.",
    },
  };
  const controller = createMarketResidentController({
    showChoiceDialog: (text, target, choices) => views.push({ text, target, choices }),
    hideDialog: () => { hidden += 1; },
  });
  return { controller, entry, views, getHidden: () => hidden };
}

test("opens distinct market resident information and display views", () => {
  const harness = createHarness();
  const result = harness.controller.interact(harness.entry);

  assert.deepEqual(result, { handled: true, action: "open", stallId: "materials" });
  assert.deepEqual(harness.views[0].choices.map((choice) => choice.label), [
    "무엇을 하고 있나요?",
    "다음에 올게요",
  ]);
  harness.views[0].choices.find((choice) => choice.label === "무엇을 하고 있나요?").onSelect();
  assert.match(harness.views.at(-1).text, /재료/);
  harness.views.at(-1).choices.find((choice) => choice.label === "진열된 물건 보기").onSelect();
  assert.match(harness.views.at(-1).text, /돌과 나무/);
});

test("closes the market conversation when the resident is no longer nearby", () => {
  const harness = createHarness();
  harness.controller.interact(harness.entry);

  assert.equal(harness.controller.updateNearby(null), true);
  assert.equal(harness.controller.isOpen(), false);
  assert.equal(harness.getHidden(), 1);
});

test("completes only the selected pending resident follow-up conversation", () => {
  const state = {
    firstActivities: {
      introductions: {
        gather: { residentId: "craft-resident", conversationCompleted: false },
        explore: { residentId: "craft-resident", conversationCompleted: false },
      },
    },
  };
  const completed = [];
  const views = [];
  const entry = {
    obj: {}, role: "market-resident",
    market: { id: "craft-resident", stallId: "craft", aboutText: "작업해요.", displayText: "견본이에요." },
  };
  const controller = createMarketResidentController({
    getOnboardingState: () => state,
    completeResidentIntroduction: (activityId, residentId) => {
      completed.push([activityId, residentId]);
      state.firstActivities.introductions[activityId].conversationCompleted = true;
    },
    showChoiceDialog: (text, target, choices) => views.push({ text, target, choices }),
    hideDialog: () => {},
  });

  controller.interact(entry);
  assert.deepEqual(views[0].choices.slice(0, 2).map((choice) => choice.label), [
    "직접 구한 재료에 대해 물어보기",
    "마루가 여기 이야기를 해줬어요",
  ]);
  views[0].choices[0].onSelect();
  assert.deepEqual(completed, [["gather", "craft-resident"]]);
  assert.equal(state.firstActivities.introductions.explore.conversationCompleted, false);
});

test("does not complete a resident introduction when the conversation closes before selection", () => {
  const state = {
    firstActivities: {
      introductions: { gather: { residentId: "craft-resident", conversationCompleted: false } },
    },
  };
  let completed = 0;
  const controller = createMarketResidentController({
    getOnboardingState: () => state,
    completeResidentIntroduction: () => { completed += 1; },
    showChoiceDialog: () => {}, hideDialog: () => {},
  });
  controller.interact({
    obj: {}, role: "market-resident",
    market: { id: "craft-resident", stallId: "craft", aboutText: "", displayText: "" },
  });

  controller.close();
  assert.equal(completed, 0);
});

test("shows individual craft displays and records interest only from the explicit choice", () => {
  const views = [];
  const interestChanges = [];
  const highlighted = [];
  const state = { marketInterestItemIds: [] };
  const item = {
    id: "crafted-box", name: "작은 상자", description: "작은 상자 설명",
    interestResponse: "상자에 관심이 있군요.",
  };
  const controller = createMarketResidentController({
    getOnboardingState: () => state,
    setMarketItemInterest: (itemId, interested) => {
      interestChanges.push([itemId, interested]);
      state.marketInterestItemIds = interested ? [itemId] : [];
    },
    showChoiceDialog: (text, target, choices) => views.push({ text, target, choices }),
    hideDialog: () => {},
  });
  const entry = {
    obj: {}, role: "market-resident",
    market: {
      id: "craft-resident", stallId: "craft", aboutText: "작업해요.", displayText: "견본이에요.",
      displayItems: [item],
      setHighlightedDisplayItem: (itemId) => highlighted.push(itemId),
    },
  };

  controller.interact(entry);
  views.at(-1).choices.find((choice) => choice.label === "무엇을 하고 있나요?").onSelect();
  views.at(-1).choices.find((choice) => choice.label === "진열된 물건 보기").onSelect();
  views.at(-1).choices.find((choice) => choice.label === "작은 상자").onSelect();
  assert.equal(views.at(-1).text, "작은 상자 설명");
  assert.deepEqual(interestChanges, []);
  assert.equal(highlighted.at(-1), "crafted-box");

  views.at(-1).choices.find((choice) => choice.label === "마음에 들어요").onSelect();
  assert.deepEqual(interestChanges, [["crafted-box", true]]);
  assert.equal(views.at(-1).text, "상자에 관심이 있군요.");
  controller.close();
  assert.equal(highlighted.at(-1), "");
});

test("offers removal when a displayed item is already marked as interesting", () => {
  const views = [];
  const changes = [];
  const controller = createMarketResidentController({
    getOnboardingState: () => ({ marketInterestItemIds: ["small-tool"] }),
    setMarketItemInterest: (...args) => changes.push(args),
    showChoiceDialog: (text, target, choices) => views.push({ text, target, choices }),
    hideDialog: () => {},
  });
  controller.interact({
    obj: {}, role: "market-resident",
    market: {
      id: "craft-resident", stallId: "craft", aboutText: "", displayText: "",
      displayItems: [{ id: "small-tool", name: "작업 도구", description: "도구 설명", interestResponse: "좋아요." }],
    },
  });
  views.at(-1).choices.find((choice) => choice.label === "무엇을 하고 있나요?").onSelect();
  views.at(-1).choices.find((choice) => choice.label === "진열된 물건 보기").onSelect();
  views.at(-1).choices.find((choice) => choice.label === "작업 도구 (관심 있음)").onSelect();
  views.at(-1).choices.find((choice) => choice.label === "관심 표시 취소").onSelect();

  assert.deepEqual(changes, [["small-tool", false]]);
});

test("guides Se-a through materials and the first stone cup result", () => {
  const views = [];
  let completed = false;
  const firstCraftController = {
    getStatus: () => ({ inputCount: 3, owned: 3, missing: 0, completed }),
    begin: () => ({ inputCount: 3, owned: 3, missing: 0, completed }),
    craft: () => {
      completed = true;
      return { ok: true };
    },
  };
  const controller = createMarketResidentController({
    firstCraftController,
    showChoiceDialog: (text, target, choices) => views.push({ text, choices }),
    hideDialog: () => {},
  });
  controller.interact({
    obj: {}, role: "market-resident",
    market: { id: "craft-resident", stallId: "craft", aboutText: "", displayText: "" },
  });

  views.at(-1).choices.find((choice) => choice.label === "돌 컵을 만들어보고 싶어요").onSelect();
  assert.match(views.at(-1).text, /돌가루: 3 \/ 3/);
  views.at(-1).choices.find((choice) => choice.label === "돌 컵 만들기").onSelect();
  assert.match(views.at(-1).text, /기타 칸/);
});

test("starts the first craft only after accepting Se-a's gathering offer", () => {
  const views = [];
  let beginCalls = 0;
  const controller = createMarketResidentController({
    firstCraftController: {
      getStatus: () => ({ inputCount: 3, owned: 0, missing: 3, completed: false, pickaxeOwned: false }),
      begin: () => { beginCalls += 1; return {}; },
    },
    showChoiceDialog: (text, _target, choices) => views.push({ text, choices }),
    hideDialog: () => {},
  });
  controller.interact({
    obj: {}, role: "market-resident",
    market: { id: "craft-resident", stallId: "craft", aboutText: "", displayText: "" },
  });

  views.at(-1).choices.find((choice) => choice.label === "돌 컵을 만들어보고 싶어요").onSelect();
  assert.equal(beginCalls, 0);
  assert.match(views.at(-1).text, /첫 작업 도구 지원/);
  views.at(-1).choices.find((choice) => choice.label === "직접 구해볼게요").onSelect();
  assert.equal(beginCalls, 1);
});

test("offers free next steps after the first stone cup is complete", () => {
  const views = [];
  const controller = createMarketResidentController({
    firstCraftController: {
      getStatus: () => ({ completed: true }),
    },
    showChoiceDialog: (text, _target, choices) => views.push({ text, choices }),
    hideDialog: () => {},
  });
  controller.interact({
    obj: {}, role: "market-resident",
    market: { id: "craft-resident", stallId: "craft", aboutText: "", displayText: "" },
  });

  views.at(-1).choices.find((choice) => choice.label === "만든 돌 컵에 대해 물어보기").onSelect();
  views.at(-1).choices.find((choice) => choice.label === "이제 뭘 해보면 좋을까요?").onSelect();
  assert.deepEqual(views.at(-1).choices.map((choice) => choice.label), [
    "재료를 더 찾아보고 싶어요",
    "다른 물건도 구경하고 싶어요",
    "일단 자유롭게 둘러볼게요",
  ]);
  views.at(-1).choices[0].onSelect();
  assert.match(views.at(-1).text, /일반 광산/);
});

test("guides Raon flower crown quest from acceptance through reward", () => {
  const views = [];
  let started = false;
  let completed = false;
  let ready = false;
  const flowerCrownQuestController = {
    getStatus: () => ({
      started, completed, ready,
      materials: [
        { itemId: "wildGrass", name: "풀", count: 3, owned: ready ? 3 : 0 },
        { itemId: "wildFlower", name: "꽃", count: 2, owned: ready ? 2 : 0 },
      ],
    }),
    begin: () => { started = true; },
    craft: () => { completed = true; return { ok: true }; },
  };
  const controller = createMarketResidentController({
    flowerCrownQuestController,
    showChoiceDialog: (text, _target, choices) => views.push({ text, choices }),
    hideDialog: () => {},
  });
  const entry = {
    obj: {}, role: "market-resident",
    market: { id: "living-resident", stallId: "living", aboutText: "", displayText: "" },
  };

  controller.interact(entry);
  views.at(-1).choices.find((choice) => choice.label === "화관을 만들어보고 싶어요").onSelect();
  views.at(-1).choices.find((choice) => choice.label === "재료를 모아볼게요").onSelect();
  assert.equal(started, true);

  ready = true;
  controller.interact(entry);
  views.at(-1).choices.find((choice) => choice.label === "화관 재료를 가져왔어요").onSelect();
  views.at(-1).choices.find((choice) => choice.label === "화관 만들기").onSelect();
  assert.equal(completed, true);
  assert.match(views.at(-1).text, /장비 칸/);
});
