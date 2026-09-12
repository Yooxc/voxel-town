import * as THREE from "three";

const DEFAULT_CONFIG = Object.freeze({
  enterDuration: 0.5,
  exitDuration: 0.4,
  reframeDuration: 0.32,
  minDistance: 3.6,
  maxDistance: 6.4,
  subjectHeight: 2.65,
  targetHeight: 1.08,
  cameraLift: 0.42,
  subjectScreenFill: 0.82,
  obstacleMargin: 0.25,
  obstacleMinDistance: 1.4,
  cameraRadius: 0.28,
  pathSamples: 28,
});

const CAMERA_ANGLE_OFFSETS = Object.freeze([0, Math.PI / 9, -Math.PI / 9, Math.PI / 5, -Math.PI / 5]);

function smoothstep(value) {
  const t = THREE.MathUtils.clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
}

export function createDialogueCameraController({
  camera,
  controls,
  player,
  colliders = [],
  getViewportState = () => null,
  config = {},
}) {
  const settings = { ...DEFAULT_CONFIG, ...config };
  const ray = new THREE.Raycaster();
  const playerPosition = new THREE.Vector3();
  const npcPosition = new THREE.Vector3();
  const focusTarget = new THREE.Vector3();
  const subjectDirection = new THREE.Vector3();
  const cameraDirection = new THREE.Vector3();
  const candidateDirection = new THREE.Vector3();
  const up = new THREE.Vector3(0, 1, 0);
  const desiredPosition = new THREE.Vector3();
  const startPosition = new THREE.Vector3();
  const startTarget = new THREE.Vector3();
  const startOrbit = new THREE.Spherical();
  const endOrbit = new THREE.Spherical();
  const orbitOffset = new THREE.Vector3();
  const pathStartOrbit = new THREE.Spherical();
  const pathEndOrbit = new THREE.Spherical();
  const pathOffset = new THREE.Vector3();
  const sampledTarget = new THREE.Vector3();
  const sampledPosition = new THREE.Vector3();
  const previousPathPosition = new THREE.Vector3();
  const proposedPosition = new THREE.Vector3();
  const segmentDirection = new THREE.Vector3();
  const rayOrigin = new THREE.Vector3();
  let orbitTurn = 0;
  let transitionDuration = 0;
  let snapshot = null;
  let target = null;
  let phase = "idle";
  let elapsed = 0;
  let desiredPlayerYaw = 0;
  let desiredTargetYaw = 0;
  let startPlayerYaw = 0;
  let startTargetYaw = 0;

  function lerpAngle(start, end, alpha) {
    const difference = Math.atan2(Math.sin(end - start), Math.cos(end - start));
    return start + difference * alpha;
  }

  function copyWorldPosition(object, destination) {
    if (typeof object?.getWorldPosition === "function") return object.getWorldPosition(destination);
    return destination.copy(object?.position ?? { x: 0, y: 0, z: 0 });
  }

  function prepareTransition(endPosition, endTarget, minimumDuration, plannedOrbitTurn = null) {
    startOrbit.setFromVector3(orbitOffset.copy(startPosition).sub(startTarget));
    endOrbit.setFromVector3(orbitOffset.copy(endPosition).sub(endTarget));
    orbitTurn = plannedOrbitTurn ?? Math.atan2(
      Math.sin(endOrbit.theta - startOrbit.theta),
      Math.cos(endOrbit.theta - startOrbit.theta),
    );
    transitionDuration = Math.max(minimumDuration, Math.abs(orbitTurn) / Math.PI * 1.4);
  }

  function aimCamera() {
    // OrbitControls damping and distance clamps must not overwrite the cinematic path.
    camera.lookAt(controls.target);
    camera.updateMatrixWorld();
  }

  function getOrbitTurns(endPosition, endTarget) {
    pathStartOrbit.setFromVector3(pathOffset.copy(startPosition).sub(startTarget));
    pathEndOrbit.setFromVector3(pathOffset.copy(endPosition).sub(endTarget));
    const delta = pathEndOrbit.theta - pathStartOrbit.theta;
    const shortest = Math.atan2(Math.sin(delta), Math.cos(delta));
    const alternate = shortest >= 0 ? shortest - Math.PI * 2 : shortest + Math.PI * 2;
    return { shortest, alternate };
  }

  function isSegmentClear(from, to) {
    segmentDirection.copy(to).sub(from);
    const distance = segmentDirection.length();
    if (distance <= 1e-6 || colliders.length === 0) return true;
    segmentDirection.multiplyScalar(1 / distance);

    const radius = Math.max(0, settings.cameraRadius);
    const offsets = [
      [0, 0, 0],
      [radius, 0, 0],
      [-radius, 0, 0],
      [0, radius, 0],
      [0, -radius, 0],
      [0, 0, radius],
      [0, 0, -radius],
    ];

    for (const [x, y, z] of offsets) {
      rayOrigin.copy(from).add(pathOffset.set(x, y, z));
      ray.set(rayOrigin, segmentDirection);
      ray.far = distance;
      const hit = ray.intersectObjects(colliders, false)
        .find((intersection) => intersection.distance > 1e-4);
      if (hit && hit.distance <= distance + 1e-4) return false;
    }
    return true;
  }

  function isOrbitPathClear(endPosition, endTarget, turn) {
    pathStartOrbit.setFromVector3(pathOffset.copy(startPosition).sub(startTarget));
    pathEndOrbit.setFromVector3(pathOffset.copy(endPosition).sub(endTarget));
    previousPathPosition.copy(startPosition);

    const sampleCount = Math.max(2, Math.round(settings.pathSamples));
    for (let index = 1; index <= sampleCount; index += 1) {
      const progress = smoothstep(index / sampleCount);
      sampledTarget.lerpVectors(startTarget, endTarget, progress);
      pathOffset.setFromSphericalCoords(
        THREE.MathUtils.lerp(pathStartOrbit.radius, pathEndOrbit.radius, progress),
        THREE.MathUtils.lerp(pathStartOrbit.phi, pathEndOrbit.phi, progress),
        pathStartOrbit.theta + turn * progress,
      );
      sampledPosition.copy(sampledTarget).add(pathOffset);
      if (!isSegmentClear(previousPathPosition, sampledPosition)) return false;
      previousPathPosition.copy(sampledPosition);
    }
    return true;
  }

  function calculateFraming() {
    copyWorldPosition(player, playerPosition);
    copyWorldPosition(target, npcPosition);
    subjectDirection.copy(npcPosition).sub(playerPosition);
    subjectDirection.y = 0;
    const subjectDistance = subjectDirection.length();
    if (subjectDistance > 1e-4) subjectDirection.multiplyScalar(1 / subjectDistance);
    else subjectDirection.set(1, 0, 0);

    const viewport = getViewportState?.() ?? {};
    const viewportHeight = Math.max(1, Number(viewport.height) || 1);
    const dialogHeight = Math.max(0, Number(viewport.dialogHeight) || 0);
    const reservedRatio = THREE.MathUtils.clamp(dialogHeight / viewportHeight, 0, 0.42);
    const usableHeightRatio = Math.max(0.52, 1 - reservedRatio);
    focusTarget.copy(playerPosition).lerp(npcPosition, 0.5);
    focusTarget.y = Math.max(playerPosition.y, npcPosition.y)
      + settings.targetHeight
      - Math.max(0, reservedRatio - 0.18) * 1.5;

    const verticalFov = THREE.MathUtils.degToRad(Number(camera.fov) || 60);
    const verticalDistance = settings.subjectHeight
      / (2 * Math.tan(verticalFov / 2) * usableHeightRatio * settings.subjectScreenFill);
    const horizontalTan = Math.tan(verticalFov / 2) * Math.max(0.75, Number(camera.aspect) || 1);
    const horizontalDistance = subjectDistance / Math.max(0.45, horizontalTan * 0.72);
    const distance = THREE.MathUtils.clamp(
      Math.max(verticalDistance, horizontalDistance),
      settings.minDistance,
      settings.maxDistance,
    );

    cameraDirection.crossVectors(subjectDirection, up).normalize();
    const candidates = [];
    for (const angleOffset of CAMERA_ANGLE_OFFSETS) {
      candidateDirection.copy(cameraDirection).applyAxisAngle(up, angleOffset).multiplyScalar(distance);
      candidateDirection.y = settings.cameraLift;
      const candidateDistance = candidateDirection.length();
      candidateDirection.normalize();
      ray.set(focusTarget, candidateDirection);
      ray.far = candidateDistance;
      const hit = ray.intersectObjects(colliders, false)[0] ?? null;
      const availableDistance = hit
        ? Math.min(candidateDistance, hit.distance - settings.obstacleMargin)
        : candidateDistance;
      if (availableDistance < settings.obstacleMinDistance) continue;
      candidates.push({
        angleOffset,
        distance: availableDistance,
        position: focusTarget.clone().addScaledVector(candidateDirection, availableDistance),
      });
    }

    let selected = null;
    for (const useAlternateTurn of [false, true]) {
      for (const candidate of candidates) {
        const turns = getOrbitTurns(candidate.position, focusTarget);
        const candidateTurn = useAlternateTurn ? turns.alternate : turns.shortest;
        if (!isOrbitPathClear(candidate.position, focusTarget, candidateTurn)) continue;
        const score = candidate.distance
          - Math.abs(candidate.angleOffset) * 0.45
          - Math.abs(candidateTurn) * 0.1;
        if (!selected || score > selected.score) {
          selected = { ...candidate, orbitTurn: candidateTurn, score };
        }
      }
      if (selected) break;
    }

    if (selected) desiredPosition.copy(selected.position);
    else {
      desiredPosition.copy(startPosition);
      focusTarget.copy(startTarget);
    }

    const dx = npcPosition.x - playerPosition.x;
    const dz = npcPosition.z - playerPosition.z;
    desiredPlayerYaw = Math.atan2(dx, dz);
    desiredTargetYaw = Math.atan2(-dx, -dz);
    return { orbitTurn: selected?.orbitTurn ?? 0 };
  }

  function enter(nextTarget) {
    if (!nextTarget?.position || !nextTarget.parent) return false;
    if (nextTarget === target && (phase === "entering" || phase === "active")) return true;
    if (!snapshot) {
      snapshot = {
        position: camera.position.clone(),
        target: controls.target.clone(),
        controlsEnabled: controls.enabled,
        playerYaw: player.rotation.y,
        targetYaw: nextTarget.rotation.y,
      };
    }
    target = nextTarget;
    startPosition.copy(camera.position);
    startTarget.copy(controls.target);
    startPlayerYaw = player.rotation.y;
    startTargetYaw = nextTarget.rotation.y;
    const framing = calculateFraming();
    prepareTransition(desiredPosition, focusTarget, settings.enterDuration, framing.orbitTurn);
    elapsed = 0;
    phase = "entering";
    controls.enabled = false;
    return true;
  }

  function exit() {
    if (!snapshot || phase === "idle" || phase === "exiting") return false;
    startPosition.copy(camera.position);
    startTarget.copy(controls.target);
    startPlayerYaw = player.rotation.y;
    startTargetYaw = target?.rotation?.y ?? snapshot.targetYaw;
    const returnTurns = getOrbitTurns(snapshot.position, snapshot.target);
    const returnTurn = isOrbitPathClear(snapshot.position, snapshot.target, returnTurns.shortest)
      ? returnTurns.shortest
      : isOrbitPathClear(snapshot.position, snapshot.target, returnTurns.alternate)
        ? returnTurns.alternate
        : null;
    if (returnTurn === null) {
      finishExit(false);
      return true;
    }
    prepareTransition(snapshot.position, snapshot.target, settings.exitDuration, returnTurn);
    elapsed = 0;
    phase = "exiting";
    controls.enabled = false;
    return true;
  }

  function finishExit(restoreCamera = true) {
    if (restoreCamera) {
      camera.position.copy(snapshot.position);
      controls.target.copy(snapshot.target);
    } else {
      copyWorldPosition(player, playerPosition);
      controls.target.copy(playerPosition);
      controls.target.y += 1;
    }
    controls.enabled = snapshot.controlsEnabled;
    player.rotation.y = snapshot.playerYaw;
    if (target?.rotation && Number.isFinite(snapshot.targetYaw)) target.rotation.y = snapshot.targetYaw;
    snapshot = null;
    target = null;
    phase = "idle";
    elapsed = 0;
    controls.update();
    return { phase, ended: true };
  }

  function update(dt) {
    if (phase === "idle") return { phase, ended: false };
    if (!target?.parent && phase !== "exiting") return finishExit();
    if (phase === "active") {
      controls.enabled = false;
      aimCamera();
      return { phase, ended: false };
    }

    elapsed += Math.max(0, Number(dt) || 0);
    const duration = transitionDuration;
    const progress = smoothstep(duration > 0 ? elapsed / duration : 1);
    const endPosition = phase === "entering" ? desiredPosition : snapshot.position;
    const endTarget = phase === "entering" ? focusTarget : snapshot.target;
    controls.target.lerpVectors(startTarget, endTarget, progress);
    orbitOffset.setFromSphericalCoords(
      THREE.MathUtils.lerp(startOrbit.radius, endOrbit.radius, progress),
      THREE.MathUtils.lerp(startOrbit.phi, endOrbit.phi, progress),
      startOrbit.theta + orbitTurn * progress,
    );
    proposedPosition.copy(controls.target).add(orbitOffset);
    if (progress === 1) proposedPosition.copy(endPosition);
    if (!isSegmentClear(camera.position, proposedPosition)) {
      if (phase === "exiting") return finishExit(false);
      desiredPosition.copy(camera.position);
      focusTarget.copy(controls.target);
      phase = "active";
      elapsed = 0;
      return { phase, ended: false };
    }
    camera.position.copy(proposedPosition);
    if (phase === "entering") {
      player.rotation.y = lerpAngle(startPlayerYaw, desiredPlayerYaw, progress);
      if (target?.rotation) target.rotation.y = lerpAngle(startTargetYaw, desiredTargetYaw, progress);
    } else {
      player.rotation.y = lerpAngle(startPlayerYaw, snapshot.playerYaw, progress);
      if (target?.rotation) target.rotation.y = lerpAngle(startTargetYaw, snapshot.targetYaw, progress);
    }
    controls.enabled = false;
    aimCamera();
    if (progress < 1) return { phase, ended: false };
    if (phase === "exiting") return finishExit();
    phase = "active";
    return { phase, ended: false };
  }

  function cancel({ restore = true } = {}) {
    if (!snapshot) return false;
    if (restore) {
      camera.position.copy(snapshot.position);
      controls.target.copy(snapshot.target);
      controls.update();
    }
    player.rotation.y = snapshot.playerYaw;
    if (target?.rotation && Number.isFinite(snapshot.targetYaw)) target.rotation.y = snapshot.targetYaw;
    controls.enabled = snapshot.controlsEnabled;
    snapshot = null;
    target = null;
    phase = "idle";
    elapsed = 0;
    return true;
  }

  function refresh() {
    if (!target?.parent || (phase !== "entering" && phase !== "active")) return false;
    startPosition.copy(camera.position);
    startTarget.copy(controls.target);
    startPlayerYaw = player.rotation.y;
    startTargetYaw = target.rotation?.y ?? desiredTargetYaw;
    const framing = calculateFraming();
    prepareTransition(desiredPosition, focusTarget, settings.reframeDuration, framing.orbitTurn);
    controls.enabled = false;
    phase = "entering";
    elapsed = 0;
    return true;
  }

  return {
    enter,
    exit,
    update,
    cancel,
    refresh,
    isActive: () => phase !== "idle",
    isFocused: () => phase === "entering" || phase === "active",
    isTarget: (candidate) => Boolean(candidate && candidate === target && phase !== "idle"),
    getPhase: () => phase,
  };
}
