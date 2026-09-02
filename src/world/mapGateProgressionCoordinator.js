export function createMapGateProgressionCoordinator(ctx) {
  function notify(message, duration) {
    ctx.showUi(message, duration);
    ctx.setLastMessageUntil(ctx.now() + duration);
  }

  function unlock(gate) {
    if (!gate?.unlockWithItem || !gate.unlockFlag) return false;
    const inventory = ctx.getInventory();
    if (inventory[gate.unlockFlag]) return true;
    if (!ctx.hasItem(gate.unlockWithItem) || !ctx.consumeItem(gate.unlockWithItem, 1)) {
      notify(gate.denyText ?? "필요한 아이템이 없습니다.", 1100);
      return false;
    }
    inventory[gate.unlockFlag] = true;
    const index = ctx.getColliderIndex(gate.lockBlocker, gate.lockColliderIndex);
    if (typeof index === "number") {
      ctx.removeCollider(index);
      gate.lockColliderIndex = null;
    }
    if (gate.lockBlocker?.parent) gate.lockBlocker.removeFromParent();
    ctx.updateInventoryUi();
    ctx.renderQuestIfOpen();
    ctx.scheduleSave();
    notify(gate.unlockText ?? "통로가 열렸습니다.", 1200);
    return true;
  }

  function restore(gate) {
    if (!gate?.lockBlocker) return;
    if (!gate.lockBlocker.parent) ctx.addToScene(gate.lockBlocker);
    const index = ctx.getColliderIndex(gate.lockBlocker, gate.lockColliderIndex);
    if (typeof index !== "number") gate.lockColliderIndex = ctx.addCollider(gate.lockBlocker, 1);
  }

  return { unlock, restore };
}
