const MODE = Object.freeze({
  IDLE: "idle",
  ARRIVING: "arriving",
  MOVING: "moving",
  WAITING: "waiting",
  RETURNING: "returning",
});

function distance2d(a, b) {
  return Math.hypot(a.x - b.x, a.z - b.z);
}

export function createTourController({
  guide,
  getOnboardingState,
  startTour,
  pauseTour,
  completeTour,
  getPlayerPosition,
  getCurrentMapId,
  showDialog,
  hideDialog,
  notify,
  walkSpeed = 2.15,
  pauseDistance = 14,
}) {
  let mode = MODE.IDLE;
  let path = [];
  let pathIndex = 0;
  let checkpointIndex = -1;
  let walkTime = 0;
  let dialogOpen = false;

  const setHint = (text) => { if (guide?.entry) guide.entry.hint = text; };
  const findCheckpointIndex = (id) => guide?.checkpoints?.findIndex((point) => point.id === id) ?? -1;

  function stopWalkingPose() {
    if (!guide) return;
    for (const limb of [guide.leftArm, guide.rightArm, guide.leftLeg, guide.rightLeg]) {
      if (limb) limb.rotation.x = 0;
    }
  }

  function updateWalkingPose(dt) {
    if (!guide) return;
    walkTime += dt * 8;
    const swing = Math.sin(walkTime) * 0.42;
    guide.leftArm.rotation.x = swing;
    guide.rightArm.rotation.x = -swing;
    guide.leftLeg.rotation.x = -swing;
    guide.rightLeg.rotation.x = swing;
  }

  function beginPath(nextPath, nextMode, { keepDialog = false } = {}) {
    path = nextPath.map((point) => ({ ...point }));
    pathIndex = 0;
    mode = nextMode;
    setHint(nextMode === MODE.RETURNING ? "안내소로 돌아가는 중" : "안내 중");
    if (!keepDialog) hideDialog();
    dialogOpen = keepDialog;
  }

  function beginReturn() {
    if (!guide || mode === MODE.RETURNING || mode === MODE.IDLE) return;
    beginPath([guide.origin], MODE.RETURNING);
  }

  function requestTour() {
    if (!guide) return false;
    const state = getOnboardingState();
    if (state?.tourStatus === "completed" || mode === MODE.ARRIVING || mode === MODE.MOVING || mode === MODE.WAITING) {
      return false;
    }
    const savedIndex = findCheckpointIndex(state?.tourCheckpointId);
    checkpointIndex = savedIndex >= 0 ? savedIndex : 0;
    startTour(guide.checkpoints[checkpointIndex].id);
    const arrivalPath = checkpointIndex > 0
      ? [...guide.arrivalPath, guide.checkpoints[checkpointIndex].position]
      : guide.arrivalPath;
    beginPath(arrivalPath, MODE.ARRIVING);
    notify("길잡이 다온이 안내소에서 오고 있어요.", 1800);
    return true;
  }

  function showCheckpoint() {
    const checkpoint = guide.checkpoints[checkpointIndex];
    if (!checkpoint) return;
    mode = MODE.WAITING;
    stopWalkingPose();
    setHint("Space : 안내 계속 듣기");
    showDialog(checkpoint.text, guide.entry);
    dialogOpen = true;
  }

  function finishTour() {
    completeTour(guide.checkpoints.at(-1)?.id ?? "");
    showDialog("여기까지가 동네의 첫 모습이에요. 이제 마음 가는 곳부터 천천히 둘러보세요.", guide.entry, 4200);
    beginPath([guide.origin], MODE.RETURNING, { keepDialog: true });
  }

  function interact(entry) {
    if (!guide || entry !== guide.entry) return { handled: false };
    if (mode !== MODE.WAITING) return { handled: true, action: "busy" };
    if (!dialogOpen) {
      showCheckpoint();
      return { handled: true, action: "repeat" };
    }
    if (checkpointIndex >= guide.checkpoints.length - 1) {
      finishTour();
      return { handled: true, action: "complete" };
    }
    checkpointIndex += 1;
    const checkpoint = guide.checkpoints[checkpointIndex];
    startTour(checkpoint.id);
    beginPath([checkpoint.position], MODE.MOVING);
    return { handled: true, action: "move", checkpointId: checkpoint.id };
  }

  function closeDialog() {
    if (mode !== MODE.WAITING) return false;
    hideDialog();
    dialogOpen = false;
    setHint("Space : 안내 다시 듣기");
    return true;
  }

  function moveGuide(dt) {
    const position = guide.root.position;
    let remainingStep = walkSpeed * dt;
    let moved = false;
    while (pathIndex < path.length) {
      const target = path[pathIndex];
      const dx = target.x - position.x;
      const dz = target.z - position.z;
      const distance = Math.hypot(dx, dz);
      if (distance <= Math.max(0.08, remainingStep)) {
        position.set(target.x, target.y, target.z);
        remainingStep = Math.max(0, remainingStep - distance);
        pathIndex += 1;
        moved = moved || distance > 0.001;
        if (remainingStep <= 0) break;
        continue;
      }
      position.x += (dx / distance) * remainingStep;
      position.z += (dz / distance) * remainingStep;
      position.y = target.y;
      guide.root.rotation.y = Math.atan2(dx, dz);
      moved = remainingStep > 0;
      break;
    }
    if (moved) updateWalkingPose(dt);
    return pathIndex >= path.length;
  }

  function update(dt) {
    if (!guide) return;
    const state = getOnboardingState();
    const active = mode === MODE.ARRIVING || mode === MODE.MOVING || mode === MODE.WAITING;
    if (active && state?.tourStatus !== "in_progress") {
      beginReturn();
    }
    if (active && getCurrentMapId() !== "광산") {
      pauseTour(guide.checkpoints[checkpointIndex]?.id ?? "");
      notify("투어를 잠시 멈췄어요. 마루에게 돌아가면 이어갈 수 있어요.", 2200);
      beginReturn();
    }
    if ((mode === MODE.MOVING || mode === MODE.WAITING)
      && distance2d(guide.root.position, getPlayerPosition()) > pauseDistance) {
      pauseTour(guide.checkpoints[checkpointIndex]?.id ?? "");
      notify("길잡이와 거리가 멀어져 투어를 잠시 멈췄어요.", 2200);
      beginReturn();
    }
    if (mode !== MODE.ARRIVING && mode !== MODE.MOVING && mode !== MODE.RETURNING) return;
    if (!moveGuide(dt)) return;
    if (mode === MODE.RETURNING) {
      mode = MODE.IDLE;
      stopWalkingPose();
      setHint(state?.tourStatus === "completed" ? "동네 길잡이" : "마루에게 안내 요청하기");
      return;
    }
    showCheckpoint();
  }

  return {
    requestTour,
    interact,
    closeDialog,
    update,
    getMode: () => mode,
  };
}
