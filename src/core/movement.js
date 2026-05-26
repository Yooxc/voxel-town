import * as THREE from "three";

const DEV_MOVE_SPEED = 20.0;
const NORMAL_WALK_SPEED = 4.0;
const NORMAL_RUN_SPEED = 5.5;
const DEV_BASE_MOVE_SPEED = 7.0;
const NORMAL_BASE_MOVE_SPEED = 3.0;
const DEV_RUN_MOVE_SPEED = 7.0;
const NORMAL_SHOES_RUN_SPEED = 4.5;
const FAST_WALK_ANIM_SPEED = 1.28;
const NORMAL_WALK_ANIM_SPEED = 1.0;

export function getKeyInputCode(event) {
  return String(event?.code || "");
}

export function getLogicalInputKey(event) {
  const code = getKeyInputCode(event);
  const codeMap = {
    KeyE: "e",
    KeyI: "i",
    KeyQ: "q",
    KeyR: "r",
    KeyT: "t",
    KeyB: "b",
    KeyW: "w",
    KeyA: "a",
    KeyS: "s",
    KeyD: "d",
    ShiftLeft: "shift",
    ShiftRight: "shift",
    Escape: "escape",
    Tab: "tab",
    Digit1: "1",
    Digit2: "2",
    Digit3: "3",
    Digit4: "4",
    Digit5: "5",
  };
  if (codeMap[code]) return codeMap[code];
  return String(event?.key || "").toLowerCase();
}

export function getMovementSpeed({
  isDevMovementMode = false,
  hasShoesEquipped = false,
  shiftPressed = false,
  airMoveScalar = 1,
}) {
  const isSprinting = shiftPressed && (isDevMovementMode || hasShoesEquipped);
  const speed = (
    isSprinting
      ? (isDevMovementMode ? DEV_MOVE_SPEED : NORMAL_RUN_SPEED)
      : (isDevMovementMode ? DEV_MOVE_SPEED : NORMAL_WALK_SPEED)
  ) * airMoveScalar;

  return {
    isSprinting,
    speed,
    baseSpeed: isDevMovementMode ? DEV_BASE_MOVE_SPEED : NORMAL_BASE_MOVE_SPEED,
    runSpeed: isDevMovementMode ? DEV_RUN_MOVE_SPEED : NORMAL_SHOES_RUN_SPEED,
  };
}

export function getWalkAnimationSpeed({
  isMoving = false,
  shiftPressed = false,
  isDevSession = false,
  hasShoesEquipped = false,
}) {
  return isMoving && shiftPressed && (isDevSession || hasShoesEquipped)
    ? FAST_WALK_ANIM_SPEED
    : NORMAL_WALK_ANIM_SPEED;
}

export function buildMoveVector(keys, forward, right, target = new THREE.Vector3()) {
  target.set(0, 0, 0);
  if (keys.w) target.add(forward);
  if (keys.s) target.sub(forward);
  if (keys.d) target.add(right);
  if (keys.a) target.sub(right);
  return target;
}

export function isMoveVectorActive(moveVector) {
  return moveVector.lengthSq() > 0;
}

export function normalizeMoveVector(moveVector) {
  moveVector.normalize();
  return moveVector;
}

export function updateLatestMoveDirection(latestMoveDir, moveVector) {
  latestMoveDir.copy(moveVector);
  return latestMoveDir;
}

export function getMovementDelta(moveVector, speed, dt) {
  return moveVector.clone().multiplyScalar(speed * dt);
}

export function getMovementYaw(moveVector) {
  return Math.atan2(moveVector.x, moveVector.z);
}

export function getMovementBasisVectors(camera, up = new THREE.Vector3(0, 1, 0)) {
  const forward = new THREE.Vector3();
  camera.getWorldDirection(forward);
  forward.y = 0;
  forward.normalize();

  const right = new THREE.Vector3().crossVectors(forward, up).normalize();
  return { forward, right };
}

export function getFacingDirectionFromYaw(yaw, target = new THREE.Vector3()) {
  return target.set(Math.sin(yaw), 0, Math.cos(yaw));
}

export function getCompassDirection(latestMoveDir, yaw) {
  if (latestMoveDir.lengthSq() > 1e-6) return latestMoveDir;
  return getFacingDirectionFromYaw(yaw);
}
