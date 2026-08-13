import test from "node:test";
import assert from "node:assert/strict";
import {
  getAirPurifierHintText,
  getNextMapPurificationValue,
} from "../src/systems/air.js";

const config = { displayName: "폐광", purifierPowderCost: 2, purifierGain: 25 };

test("creates air purifier hints from map and inventory state", () => {
  assert.equal(getAirPurifierHintText({ config: null }), "E : 공기 정화탑 가동");
  assert.equal(getAirPurifierHintText({ config, purification: 100, currentMapId: "폐광", mapId: "폐광", powderCount: 2 }), "폐광 정화 완료");
  assert.equal(getAirPurifierHintText({ config, purification: 25, currentMapId: "개척지", mapId: "폐광", powderCount: 2 }), "폐광 정화율 25%");
  assert.equal(getAirPurifierHintText({ config, purification: 25, currentMapId: "폐광", mapId: "폐광", powderCount: 1 }), "정화 가루 2개 필요");
});

test("caps the next map purification value at one hundred", () => {
  assert.equal(getNextMapPurificationValue(80, 25), 100);
  assert.equal(getNextMapPurificationValue(25, 25), 50);
});
