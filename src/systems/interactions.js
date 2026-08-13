export function findNearestInteractable(entries, playerPosition, radius = 2.0) {
  let nearest = null;
  let nearestDistance = Infinity;
  for (const entry of entries) {
    if (!entry?.obj || entry.obj.visible === false) continue;
    const distance = entry.obj.position.distanceTo(playerPosition);
    if (distance < radius && distance < nearestDistance) {
      nearest = entry;
      nearestDistance = distance;
    }
  }
  return nearest;
}

export function getInteractableHintText(interactable, {
  frontierBoothPlan,
  getAirPurifierHintText,
  hasMansionOneResidenceAuthority,
  getOwnedMansionRoomPermitName,
  getRefineryHintText,
}) {
  if (!interactable) return "";
  if (interactable.type === "airPurifier") {
    return getAirPurifierHintText(interactable.purifierMapId ?? "폐광");
  }
  if (frontierBoothPlan) return frontierBoothPlan.hintText;
  if (interactable.type === "mansionEntry") {
    return hasMansionOneResidenceAuthority() ? `E : ${getOwnedMansionRoomPermitName()} 입장` : "";
  }
  if (interactable.type === "mansionBed") return "Space : 취침";
  if (interactable.type === "mansionStorage") return "Space : 창고 열기";
  if (interactable.type === "mansionExit") return "E : 외부로 나가기";
  if (interactable.type === "refinery") return getRefineryHintText();
  return interactable.text;
}
