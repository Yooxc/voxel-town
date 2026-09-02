export function createInventoryRenderer(deps) {
  function addCountBadge(slot, count) {
    if (count <= 1) return;
    const badge = document.createElement("div");
    badge.textContent = String(count);
    Object.assign(badge.style, {
      position: "absolute", right: "6px", bottom: "4px", fontSize: "12px",
      padding: "1px 6px", borderRadius: "10px", background: "rgba(0,0,0,0.65)",
      color: "white", pointerEvents: "none",
    });
    slot.appendChild(badge);
  }

  function addTooltip(slot, entry) {
    const tooltipData = deps.getTooltipData(entry);
    slot.addEventListener("pointerenter", (event) => deps.showTooltip(tooltipData, event.clientX, event.clientY));
    slot.addEventListener("pointermove", (event) => deps.showTooltip(tooltipData, event.clientX, event.clientY));
    slot.addEventListener("pointerleave", deps.hideTooltip);
  }

  function setDragData(event, entry) {
    if (!event.dataTransfer) return;
    event.dataTransfer.effectAllowed = "move";
    event.dataTransfer.setData("text/plain", deps.getEntryName(entry));
  }

  function getTabSlots() {
    const inventory = deps.getInventory();
    const slotsByCategory = {
      equip: [],
      cons: [],
      misc: [],
    };
    const occupiedSlotCount = inventory.slots.filter(Boolean).length;
    const availableSlotCount = Math.max(0, inventory.slots.length - occupiedSlotCount);

    for (const entry of inventory.slots) {
      if (!entry) continue;
      const category = deps.getEntryCategory(entry);
      const slots = slotsByCategory[category] ?? slotsByCategory.misc;
      slots.push(structuredClone(entry));
    }
    for (const slots of Object.values(slotsByCategory)) {
      slots.push(...Array.from({ length: availableSlotCount }, () => null));
    }
    return slotsByCategory;
  }

  function renderInventoryWindow() {
    const slotsByCategory = getTabSlots();
    deps.setTabStyles();
    const activeTab = deps.getActiveTab();
    deps.invgrid.innerHTML = "";
    for (const item of slotsByCategory[activeTab]) {
      const slot = deps.makeSlot();
      if (item) {
        const itemId = deps.getItemId(item);
        slot.draggable = true;
        slot.style.cursor = "grab";
        slot.addEventListener("dragstart", (event) => {
          deps.setInventoryDrag(item);
          setDragData(event, item);
          slot.style.opacity = "0.5";
        });
        slot.addEventListener("dragend", () => {
          deps.clearInventoryDrag();
          slot.style.opacity = "1";
          deps.resetTrashDropZone();
        });
        slot.appendChild(deps.createEntryVisual(item, { size: 38 }));
        if (!deps.isNftEntry(item)) addCountBadge(slot, deps.getEntryCount(item));

        const equipSlot = deps.getEquipSlot(item);
        const equipped = equipSlot && deps.isSameAsEquipped(item, deps.getEquippedItem(equipSlot));
        if (activeTab === "equip" && equipped) deps.highlightSlot(slot, "equip");
        if (activeTab === "equip" && equipSlot) slot.addEventListener("dblclick", () => deps.toggleEquip(item));
        if (activeTab === "cons" && itemId === "freshAirCanister") slot.addEventListener("dblclick", deps.useFreshAirCanister);
        if (activeTab === "misc" && itemId === "fencePost") {
          if (deps.isFencePlacementMode()) deps.highlightSlot(slot, "equip");
          slot.addEventListener("dblclick", deps.toggleFencePlacementMode);
        }
        if (activeTab === "misc" && deps.isBuildPartItemId(itemId)) {
          if (deps.getSelectedStructureItemId() === itemId) deps.highlightSlot(slot, "build");
          slot.addEventListener("dblclick", () => deps.toggleStructurePlacement(itemId));
        }
        if (activeTab === "cons" && deps.isQuickUseAssignable(item)) {
          const assignedKey = deps.getAssignedQuickUseKey(item);
          const pending = deps.isQuickUsePending(item);
          const quickButton = document.createElement("button");
          quickButton.type = "button";
          quickButton.textContent = assignedKey || "";
          Object.assign(quickButton.style, {
            position: "absolute", left: "4px", top: "4px", width: "18px", height: "18px", padding: "0",
            borderRadius: "999px", border: pending || assignedKey ? "1px solid rgba(255,160,60,0.95)" : "1px solid rgba(0,0,0,0.16)",
            background: pending || assignedKey ? "rgba(255,160,60,0.92)" : "rgba(255,255,255,0.88)",
            color: pending || assignedKey ? "#2f1700" : "#3f4650", fontSize: "10px", fontWeight: "800", cursor: "pointer", zIndex: "2",
          });
          quickButton.addEventListener("click", (event) => {
            event.stopPropagation();
            if (assignedKey && !pending) deps.clearQuickUse(item);
            else deps.beginQuickUse(item);
          });
          slot.appendChild(quickButton);
        }
        if (deps.isNftEntry(item)) {
          const badge = document.createElement("div");
          badge.textContent = "NFT";
          Object.assign(badge.style, { position: "absolute", left: "6px", top: "4px", fontSize: "10px", fontWeight: "800", padding: "2px 6px", borderRadius: "999px", background: "rgba(106,76,255,0.88)", color: "white", pointerEvents: "none" });
          slot.appendChild(badge);
        }
        addTooltip(slot, item);
      }
      deps.invgrid.appendChild(slot);
    }
  }

  function decorateStorageSlot(slot, entry) {
    if (!entry) return;
    slot.appendChild(deps.createEntryVisual(entry, { size: 38 }));
    if (!deps.isNftEntry(entry)) addCountBadge(slot, deps.getEntryCount(entry));
    addTooltip(slot, entry);
  }

  function renderPersonalStorageWindow() {
    const inventory = deps.getInventory();
    const storage = deps.getStorage();
    deps.inventoryStoragePanel.subtitle.textContent = `보유 슬롯 ${inventory.slots.filter(Boolean).length}/${inventory.slots.length}`;
    deps.personalStoragePanel.subtitle.textContent = `창고 슬롯 ${storage.slots.filter(Boolean).length}/${storage.slots.length}`;
    deps.inventoryStoragePanel.grid.innerHTML = "";
    deps.personalStoragePanel.grid.innerHTML = "";

    for (const entry of inventory.slots) {
      const slot = deps.makeSlot();
      if (entry) {
        slot.draggable = true;
        slot.style.cursor = "grab";
        slot.addEventListener("dragstart", (event) => { deps.beginStorageDrag({ source: "inventory", entry }); setDragData(event, entry); slot.style.opacity = "0.5"; });
        slot.addEventListener("dragend", () => { deps.clearStorageDrag(); slot.style.opacity = "1"; });
        decorateStorageSlot(slot, entry);
      }
      deps.inventoryStoragePanel.grid.appendChild(slot);
    }

    for (let index = 0; index < storage.slots.length; index += 1) {
      const entry = storage.slots[index];
      const slot = deps.makeSlot();
      slot.addEventListener("dragover", (event) => {
        if (!deps.getStorageDrag()) return;
        event.preventDefault();
        deps.highlightStorageDrop(slot, true);
      });
      slot.addEventListener("dragleave", () => deps.highlightStorageDrop(slot, false));
      slot.addEventListener("drop", (event) => {
        event.preventDefault();
        deps.highlightStorageDrop(slot, false);
        const drag = deps.getStorageDrag();
        if (!drag) return;
        deps.clearStorageDrag();
        if (drag.source !== "inventory") return deps.setStorageMessage("창고 안에서는 빈 인벤토리 칸으로만 다시 옮길 수 있습니다.");
        deps.moveEntry({ source: "inventory", target: "storage", entry: drag.entry });
      });
      if (entry) {
        slot.draggable = true;
        slot.style.cursor = "grab";
        slot.addEventListener("dragstart", (event) => { deps.beginStorageDrag({ source: "storage", index, entry }); setDragData(event, entry); slot.style.opacity = "0.5"; });
        slot.addEventListener("dragend", () => { deps.clearStorageDrag(); slot.style.opacity = "1"; });
        decorateStorageSlot(slot, entry);
      }
      deps.personalStoragePanel.grid.appendChild(slot);
    }

    for (const slot of deps.inventoryStoragePanel.grid.children) {
      slot.addEventListener("dragover", (event) => {
        const drag = deps.getStorageDrag();
        if (!drag || drag.source !== "storage") return;
        event.preventDefault();
        deps.highlightInventoryDrop(slot, true);
      });
      slot.addEventListener("dragleave", () => deps.highlightInventoryDrop(slot, false));
      slot.addEventListener("drop", (event) => {
        event.preventDefault();
        deps.highlightInventoryDrop(slot, false);
        const drag = deps.getStorageDrag();
        if (!drag || drag.source !== "storage") return;
        deps.clearStorageDrag();
        deps.moveEntry({ source: "storage", target: "inventory", entry: drag.entry, index: drag.index });
      });
    }
  }

  return { renderInventoryWindow, renderPersonalStorageWindow };
}
