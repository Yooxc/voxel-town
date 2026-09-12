function lerpAngle(current, target, alpha) {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * alpha;
}

function getCheckpoint(guide, checkpointId) {
  return guide?.checkpoints?.find((checkpoint) => checkpoint.id === checkpointId) ?? null;
}

function resolveCheckpointText(checkpoint, snapshot) {
  return checkpoint.text.replaceAll("{guideName}", snapshot.name || "길잡이");
}

export function createSharedTourController({
  guides = [],
  getSelfId,
  startTour,
  pauseTour,
  completeTour,
  requestAdvance,
  showDialog,
  hideDialog,
  notify,
}) {
  const guideById = new Map(guides.map((guide) => [guide.id, guide]));
  const snapshots = new Map();
  let dialogKey = "";
  let dismissedDialogKey = "";
  let terminalStateKey = "";
  let ownGuideStatus = "";
  let followDialogOpen = false;

  function setGuideHint(guide, snapshot, selfId) {
    if (!guide?.entry) return;
    if (snapshot.status === "idle") {
      guide.entry.hint = "안내소에서 대기 중";
    }
    else if (snapshot.ownerId === selfId && snapshot.status === "waiting") guide.entry.hint = "Space : 안내 계속 듣기";
    else guide.entry.hint = "안내 중";
  }

  function applySnapshot({ guides: nextGuides = [], selfId }) {
    snapshots.clear();
    const personalSnapshot = nextGuides.find((snapshot) => snapshot.ownerId === selfId)
      ?? nextGuides.find((snapshot) => snapshot.status === "idle" && !snapshot.ownerId && guideById.has(snapshot.id))
      ?? null;
    for (const guide of guides) {
      const visible = Boolean(personalSnapshot && guide.id === personalSnapshot.id);
      guide.root.visible = visible;
      if (!visible) continue;
      snapshots.set(personalSnapshot.id, personalSnapshot);
      setGuideHint(guide, personalSnapshot, selfId);
    }
    const ownGuide = personalSnapshot?.ownerId === selfId ? personalSnapshot : null;
    if (!ownGuide) {
      if (followDialogOpen || ownGuideStatus === "arriving") hideDialog();
      followDialogOpen = false;
      ownGuideStatus = "";
      return;
    }
    const previousStatus = ownGuideStatus;
    ownGuideStatus = ownGuide.status;
    if (ownGuide.status === "waiting_for_player") {
      if (!followDialogOpen) showDialog("저를 따라와주세요.", guideById.get(ownGuide.id)?.entry, { variant: "compact" });
      followDialogOpen = true;
      return;
    }
    if (followDialogOpen) {
      hideDialog();
      followDialogOpen = false;
    }
    const stateKey = `${ownGuide.id}:${ownGuide.status}:${ownGuide.checkpointId}:${ownGuide.returnReason}`;
    if (ownGuide.status === "arriving" || ownGuide.status === "moving" || ownGuide.status === "waiting") {
      startTour(ownGuide.checkpointId);
    }
    if (ownGuide.status === "returning" && terminalStateKey !== stateKey) {
      if (previousStatus === "arriving") hideDialog();
      terminalStateKey = stateKey;
      if (ownGuide.returnReason === "completed") completeTour(ownGuide.checkpointId);
      if (ownGuide.returnReason === "paused") pauseTour(ownGuide.checkpointId);
    }
    if (ownGuide.status !== "waiting") return;
    const nextDialogKey = `${ownGuide.id}:${ownGuide.checkpointId}:${ownGuide.dialogVersion}`;
    if (nextDialogKey === dialogKey || nextDialogKey === dismissedDialogKey) return;
    const guide = guideById.get(ownGuide.id);
    const checkpoint = getCheckpoint(guide, ownGuide.checkpointId);
    if (!guide || !checkpoint) return;
    dialogKey = nextDialogKey;
    showDialog(resolveCheckpointText(checkpoint, ownGuide), guide.entry);
  }

  function update(dt) {
    const alpha = 1 - Math.exp(-Math.max(0, dt) * 12);
    for (const [id, snapshot] of snapshots) {
      const guide = guideById.get(id);
      if (!guide) continue;
      guide.root.position.x += (snapshot.x - guide.root.position.x) * alpha;
      guide.root.position.y += (snapshot.y - guide.root.position.y) * alpha;
      guide.root.position.z += (snapshot.z - guide.root.position.z) * alpha;
      guide.root.rotation.y = lerpAngle(guide.root.rotation.y, snapshot.rotationY, alpha);
      const walking = snapshot.status === "arriving" || snapshot.status === "moving" || snapshot.status === "returning";
      const swing = walking ? Math.sin(performance.now() * 0.008) * 0.42 : 0;
      guide.leftArm.rotation.x = swing;
      guide.rightArm.rotation.x = -swing;
      guide.leftLeg.rotation.x = -swing;
      guide.rightLeg.rotation.x = swing;
    }
  }

  function interact(entry) {
    if (entry?.role !== "tour-guide") return { handled: false };
    const snapshot = snapshots.get(entry.guideId);
    const selfId = getSelfId();
    if (snapshot?.status === "idle") {
      notify("할 일을 찾고 있다면 마루에게 물어봐 주세요.", 1100);
      return { handled: true, action: "idle" };
    }
    if (!snapshot || snapshot.ownerId !== selfId) {
      return { handled: false };
    }
    if (snapshot.status !== "waiting") return { handled: true, action: "moving" };
    const currentKey = `${snapshot.id}:${snapshot.checkpointId}:${snapshot.dialogVersion}`;
    if (dismissedDialogKey === currentKey) {
      dismissedDialogKey = "";
      dialogKey = currentKey;
      const guide = guideById.get(snapshot.id);
      const checkpoint = getCheckpoint(guide, snapshot.checkpointId);
      if (guide && checkpoint) showDialog(resolveCheckpointText(checkpoint, snapshot), guide.entry);
      return { handled: true, action: "repeat" };
    }
    requestAdvance();
    hideDialog();
    dialogKey = "";
    return { handled: true, action: "advance" };
  }

  function closeDialog() {
    if (!dialogKey) return false;
    dismissedDialogKey = dialogKey;
    dialogKey = "";
    hideDialog();
    return true;
  }

  function clear() {
    snapshots.clear();
    dialogKey = "";
    dismissedDialogKey = "";
    terminalStateKey = "";
    ownGuideStatus = "";
    followDialogOpen = false;
    hideDialog();
    for (const guide of guides) {
      guide.root.position.copy(guide.origin);
      guide.root.visible = true;
      guide.entry.hint = "안내소에서 대기 중";
    }
  }

  return { applySnapshot, update, interact, closeDialog, clear };
}
