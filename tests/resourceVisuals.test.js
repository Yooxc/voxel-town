import test from "node:test";
import assert from "node:assert/strict";
import * as THREE from "three";
import {
  updateHarvestTreeVisualState,
  updateRockFadeIns,
  triggerRockHitReaction,
  updateRockHitReactions,
} from "../src/world/resourceVisuals.js";

function createTree() {
  const tree = new THREE.Group();
  const material = () => new THREE.MeshBasicMaterial({ opacity: 1 });
  const trunk = new THREE.Mesh(new THREE.BoxGeometry(), material());
  const leaves = new THREE.Mesh(new THREE.BoxGeometry(), material());
  const stump = new THREE.Mesh(new THREE.BoxGeometry(), material());
  const sprout = new THREE.Group();
  sprout.add(new THREE.Mesh(new THREE.BoxGeometry(), material()));
  tree.add(trunk, leaves, stump, sprout);
  tree.userData = { trunk, leaves, stump, sprout, trunkBaseY: 1.1, leavesBaseY: 2.6 };
  return tree;
}

test("applies regrowth visual state to inactive harvest trees", () => {
  const tree = createTree();
  updateHarvestTreeVisualState(tree, false, 0.5);
  assert.equal(tree.userData.trunk.material.transparent, true);
  assert.equal(tree.userData.stump.visible, true);
  assert.equal(tree.userData.sprout.visible, true);
  assert.ok(tree.userData.leaves.material.opacity > 0.08);
});

test("finishes rock fade-in and restores rock opacity", () => {
  const rock = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial({ transparent: true, opacity: 0 }));
  const parent = new THREE.Group();
  parent.add(rock);
  rock.userData.fadeInElapsed = 0;
  rock.userData.fadeInDuration = 1;
  updateRockFadeIns([rock], 1);
  assert.equal(rock.material.opacity, 1);
  assert.equal(rock.material.transparent, false);
  assert.equal(rock.userData.fadeInDuration, undefined);
});

test("creates and clears rock hit reactions", () => {
  const rock = new THREE.Mesh(new THREE.BoxGeometry(), new THREE.MeshBasicMaterial());
  const parent = new THREE.Group();
  parent.add(rock);
  const reactions = [];
  triggerRockHitReaction(rock, reactions, 0.1);
  assert.equal(reactions.length, 1);
  updateRockHitReactions(reactions, 0.1);
  assert.equal(reactions.length, 0);
  assert.equal(rock.userData.hitReaction, undefined);
});
