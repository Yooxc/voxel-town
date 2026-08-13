export function createWorkstationController() {
  let forgeOpen = false;
  let refineryOpen = false;
  let sleepOpen = false;
  let sleepPoseActive = false;

  function setForgeOpen(open) {
    forgeOpen = Boolean(open);
    if (forgeOpen) refineryOpen = false;
    return { forgeOpen, refineryOpen };
  }

  function setRefineryOpen(open) {
    refineryOpen = Boolean(open);
    if (refineryOpen) forgeOpen = false;
    return { forgeOpen, refineryOpen };
  }

  function beginSleep() {
    sleepPoseActive = true;
    sleepOpen = true;
    return { sleepOpen, sleepPoseActive };
  }

  function openSleepDialog() {
    return beginSleep();
  }

  function closeSleep() {
    sleepOpen = false;
    sleepPoseActive = false;
    return { sleepOpen, sleepPoseActive };
  }

  function setSleepOpen(open) {
    if (open) {
      sleepOpen = true;
      return { sleepOpen, sleepPoseActive };
    }
    return closeSleep();
  }

  return {
    isForgeOpen: () => forgeOpen,
    isRefineryOpen: () => refineryOpen,
    isSleepOpen: () => sleepOpen,
    isSleepPoseActive: () => sleepPoseActive,
    setForgeOpen,
    setRefineryOpen,
    setSleepOpen,
    beginSleep,
    openSleepDialog,
    closeSleep,
  };
}
