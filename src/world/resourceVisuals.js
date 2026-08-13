import * as THREE from "three";

export function updateHarvestTreeVisualState(tree, active, regrowthProgress = 1) {
  if (!tree?.userData) return;
  const { trunk, leaves, stump, sprout } = tree.userData;
  const progress = THREE.MathUtils.clamp(regrowthProgress, 0, 1);
  const trunkBaseY = tree.userData.trunkBaseY ?? 1.1;
  const leavesBaseY = tree.userData.leavesBaseY ?? 2.6;
  if (active) {
    if (trunk?.material) {
      trunk.visible = true;
      trunk.scale.y = 1;
      trunk.position.y = trunkBaseY;
      trunk.material.transparent = false;
      trunk.material.opacity = 1;
    }
    if (leaves?.material) {
      leaves.visible = true;
      leaves.scale.setScalar(1);
      leaves.position.y = leavesBaseY;
      leaves.material.transparent = false;
      leaves.material.opacity = 1;
    }
    if (stump?.material) {
      stump.visible = false;
      stump.material.opacity = 0;
    }
    if (sprout) {
      sprout.visible = false;
      sprout.scale.setScalar(0.2);
      for (const child of sprout.children) if (child.material) child.material.opacity = 0;
    }
    return;
  }
  const trunkScaleY = THREE.MathUtils.lerp(0.22, 1, progress);
  const leavesScale = THREE.MathUtils.lerp(0.12, 1, progress);
  if (trunk?.material) {
    trunk.visible = true;
    trunk.scale.y = trunkScaleY;
    trunk.position.y = trunkBaseY * trunkScaleY;
    trunk.material.transparent = true;
    trunk.material.opacity = THREE.MathUtils.lerp(0.32, 0.9, progress);
  }
  if (leaves?.material) {
    leaves.visible = true;
    leaves.scale.setScalar(leavesScale);
    leaves.position.y = THREE.MathUtils.lerp(0.95, leavesBaseY, progress);
    leaves.material.transparent = true;
    leaves.material.opacity = THREE.MathUtils.lerp(0.08, 0.92, progress);
  }
  if (stump?.material) {
    stump.visible = true;
    stump.material.transparent = true;
    stump.material.opacity = THREE.MathUtils.lerp(0.95, 0.18, progress);
  }
  if (sprout) {
    sprout.visible = true;
    sprout.scale.setScalar(THREE.MathUtils.lerp(0.25, 1.05, progress));
    for (const child of sprout.children) {
      if (child.material) {
        child.material.transparent = true;
        child.material.opacity = THREE.MathUtils.clamp(progress * 1.15, 0, 0.92);
      }
    }
  }
}

export function setHarvestTreeActive(tree, active, { now, respawnMs, getCooldownUntil }) {
  if (!tree?.userData) return;
  tree.userData.harvestDisabled = !active;
  tree.userData.harvestCooldownUntil = active ? 0 : getCooldownUntil(now, respawnMs);
  updateHarvestTreeVisualState(tree, active, active ? 1 : 0);
}

export function updateHarvestTrees(trees, { now, respawnMs, getShakeRotation, getRegrowthProgress, isReady, getCooldownUntil }) {
  for (const tree of trees) {
    if (!tree?.parent) continue;
    const shakeUntil = tree.userData.harvestShakeUntil ?? 0;
    if (shakeUntil > now) {
      tree.rotation.z = getShakeRotation(now, tree.userData.harvestShakeStartedAt ?? now, shakeUntil, tree.userData.baseRotationZ ?? 0, THREE.MathUtils);
    } else {
      tree.rotation.z = THREE.MathUtils.lerp(tree.rotation.z, tree.userData.baseRotationZ ?? 0, 0.24);
    }
    if (!tree.userData.harvestDisabled) continue;
    const cooldownUntil = tree.userData.harvestCooldownUntil ?? 0;
    updateHarvestTreeVisualState(tree, false, getRegrowthProgress(now, cooldownUntil, respawnMs, THREE.MathUtils));
    if (isReady(now, cooldownUntil)) {
      setHarvestTreeActive(tree, true, { now, respawnMs, getCooldownUntil });
    }
  }
}

export function updateRockFadeIns(rocks, dt) {
  for (const rock of rocks) {
    if (!rock?.parent || !rock.userData.fadeInDuration) continue;
    rock.userData.fadeInElapsed += dt;
    const progress = Math.min(1, rock.userData.fadeInElapsed / rock.userData.fadeInDuration);
    rock.material.opacity = progress;
    if (progress >= 1) {
      rock.material.transparent = false;
      delete rock.userData.fadeInElapsed;
      delete rock.userData.fadeInDuration;
    }
  }
}

export function triggerRockHitReaction(rock, reactions, duration) {
  if (!rock?.parent) return;
  if (rock.userData.hitReaction) {
    rock.userData.hitReaction.elapsed = 0;
    return;
  }
  const reaction = {
    rock,
    elapsed: 0,
    duration,
    basePosition: rock.position.clone(),
    baseScale: rock.scale.clone(),
    baseRotation: rock.rotation.clone(),
  };
  rock.userData.hitReaction = reaction;
  reactions.push(reaction);
}

export function updateRockHitReactions(reactions, dt) {
  for (let index = reactions.length - 1; index >= 0; index -= 1) {
    const reaction = reactions[index];
    const rock = reaction.rock;
    if (!rock?.parent) {
      reactions.splice(index, 1);
      continue;
    }
    reaction.elapsed += dt;
    const progress = Math.min(1, reaction.elapsed / reaction.duration);
    const wave = Math.sin(progress * Math.PI);
    rock.position.copy(reaction.basePosition);
    rock.position.x += Math.sin(progress * 28) * 0.035;
    rock.position.z += Math.cos(progress * 22) * 0.025;
    rock.position.y = reaction.basePosition.y - wave * 0.06;
    rock.scale.set(
      reaction.baseScale.x * (1 + wave * 0.08),
      reaction.baseScale.y * (1 - wave * 0.14),
      reaction.baseScale.z * (1 + wave * 0.08)
    );
    rock.rotation.copy(reaction.baseRotation);
    rock.rotation.z += wave * 0.05;
    if (progress < 1) continue;
    rock.position.copy(reaction.basePosition);
    rock.scale.copy(reaction.baseScale);
    rock.rotation.copy(reaction.baseRotation);
    delete rock.userData.hitReaction;
    reactions.splice(index, 1);
  }
}
