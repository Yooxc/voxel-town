function applyStyles(element, styles) { Object.assign(element.style, styles); }
function miningPower(stats) { return stats ? `${stats.miningPowerMin.toFixed(2)}~${stats.miningPowerMax.toFixed(2)}` : "-"; }
function bonusChance(stats) { return stats ? `${Math.round((stats.bonusDropChance ?? 0) * 100)}%` : "-"; }
function swingDuration(stats) { return stats ? `${stats.swingDuration.toFixed(3)}초` : "-"; }

export function createForgeRenderer({ elements, itemDefs, createUpgradeVisual, getUpgradeState, getTargetItemId, getStoneDustCount, getPendingUpgrade, getLastResult, isForgeOpen, getForgeDistance, defaultStats, now }) {
  function setButtonPressed(pressed) {
    if (elements.action.disabled) {
      applyStyles(elements.action, { transform: "translateY(0)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)" });
      return;
    }
    applyStyles(elements.action, pressed
      ? { transform: "translateY(2px) scale(0.985)", boxShadow: "inset 0 2px 6px rgba(120,70,15,0.22)", background: "rgba(246,233,206,0.96)" }
      : { transform: "translateY(0) scale(1)", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.8)", background: "rgba(255,255,255,0.82)" });
  }

  function renderItemCard(card, heading, itemId, level, stats, emptyText = "") {
    card.replaceChildren();
    applyStyles(card, { display: "grid", gridTemplateRows: "auto 1fr", justifyItems: "center", alignItems: "stretch" });
    const title = document.createElement("div");
    title.textContent = heading;
    applyStyles(title, { fontSize: "14px", fontWeight: "700", color: "rgba(70,70,70,0.76)", marginBottom: "10px", textAlign: "center" });
    card.appendChild(title);
    if (!itemId || !stats) {
      const empty = document.createElement("div");
      applyStyles(empty, { display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: "13px", lineHeight: "1.6", color: "#555", textAlign: "center" });
      empty.innerHTML = emptyText;
      card.appendChild(empty);
      return;
    }
    const content = document.createElement("div");
    applyStyles(content, { display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: "12px", height: "100%" });
    const visual = document.createElement("div");
    applyStyles(visual, { width: "104px", height: "104px", borderRadius: "22px", background: "linear-gradient(180deg, rgba(246,246,246,0.96), rgba(224,224,224,0.9))", border: "1px solid rgba(0,0,0,0.12)", display: "flex", alignItems: "center", justifyContent: "center" });
    visual.appendChild(createUpgradeVisual(itemId, level, 80));
    content.appendChild(visual);
    const name = document.createElement("div");
    name.textContent = `${itemDefs[itemId]?.name ?? itemId} Lv.${level}`;
    applyStyles(name, { fontSize: "24px", fontWeight: "900", color: "#222", textAlign: "center" });
    content.appendChild(name);
    card.appendChild(content);
  }

  function appendInfoCard(parent, label, value, compare = false) {
    const card = document.createElement("div");
    applyStyles(card, { padding: compare ? "14px 16px" : "12px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.92)", border: "1px solid rgba(0,0,0,0.12)", boxSizing: "border-box", height: "88px", display: "flex", flexDirection: "column", justifyContent: "center" });
    card.innerHTML = `<div style="font-size:12px;font-weight:700;color:rgba(70,70,70,0.74);margin-bottom:6px;">${label}</div>${value}`;
    parent.appendChild(card);
  }

  function render() {
    const state = getUpgradeState();
    const stats = state?.current ?? defaultStats;
    const next = state?.next ?? null;
    const stoneDust = getStoneDustCount();
    const pending = getPendingUpgrade();
    const processing = Boolean(pending);
    const canUpgrade = isForgeOpen() && getForgeDistance() < 2.4 && Boolean(state && next) && stoneDust >= next.cost && !processing;
    elements.title.textContent = "장비 강화";
    elements.targetList.replaceChildren();
    const target = document.createElement("button");
    target.type = "button";
    const active = getTargetItemId() === "pickaxe";
    applyStyles(target, { width: "100%", textAlign: "left", border: active ? "1px solid rgba(255,140,0,0.78)" : "1px solid rgba(0,0,0,0.14)", borderRadius: "12px", padding: "12px", background: active ? "linear-gradient(180deg, rgba(255,222,182,0.92), rgba(255,240,220,0.92))" : "rgba(255,255,255,0.94)", cursor: "pointer" });
    target.innerHTML = `<div style="font-size:14px;font-weight:800;color:#222;">${itemDefs.pickaxe?.name ?? "곡괭이"}</div><div style="margin-top:6px;font-size:12px;line-height:1.5;color:#555;">돌가루로 채굴 장비를 강화합니다.</div>`;
    target.addEventListener("click", render);
    elements.targetList.appendChild(target);
    renderItemCard(elements.currentCard, "현재 장비", state?.itemId ?? null, state?.level ?? 0, state?.current ?? null, "현재 착용 중인 강화 가능 장비가 없습니다.<br>장비창에서 곡괭이를 먼저 장착해보세요.");
    elements.action.textContent = processing ? "진행 중" : (next ? "강화 실행" : "최대 단계");
    elements.action.disabled = !canUpgrade;
    elements.action.title = processing ? "강화 진행 중" : (next ? `Lv.${next.level} 강화` : "최대 강화");
    applyStyles(elements.action, { opacity: canUpgrade ? "1" : "0.55", cursor: canUpgrade ? "pointer" : "default", background: canUpgrade ? "rgba(255,255,255,0.82)" : "rgba(255,255,255,0.58)" });
    setButtonPressed(false);
    if (next && state?.itemId) renderItemCard(elements.nextCard, "다음 강화", state.itemId, next.level, next);
    else elements.nextCard.innerHTML = `<div style="font-size:12px;font-weight:700;color:rgba(70,70,70,0.76);margin-bottom:8px;">다음 강화</div><div style="font-size:22px;font-weight:900;color:#222;">최대 단계</div><div style="margin-top:12px;font-size:13px;line-height:1.6;color:#333;">현재 장비는 더 이상 강화할 수 없습니다.</div>`;
    elements.statCompare.replaceChildren();
    const rows = next ? [["채굴력", miningPower(stats), miningPower(next)], ["추가 드랍 확률", bonusChance(stats), bonusChance(next)], ["속도", swingDuration(stats), swingDuration(next)]] : [["채굴력", miningPower(stats), "MAX"], ["추가 드랍 확률", bonusChance(stats), "MAX"], ["속도", swingDuration(stats), "MAX"]];
    for (const [label, current, targetValue] of rows) appendInfoCard(elements.statCompare, label, `<div style="display:flex;align-items:center;justify-content:center;gap:12px;font-size:22px;font-weight:900;color:#242424;line-height:1.1;"><span>${current}</span><span style="color:#9b6f2b;">&gt;</span><span style="color:#9b6f2b;">${targetValue}</span></div>`, true);
    elements.info.replaceChildren();
    for (const [label, value] of [["보유 돌가루", `${stoneDust}`], ["필요 돌가루", next ? `${next.cost}` : "0"], ["강화 성공 확률", next ? `${Math.round((next.successChance ?? 1) * 100)}%` : "MAX"]]) appendInfoCard(elements.info, label, `<div style="font-size:24px;font-weight:900;color:#242424;">${value}</div>`);
    const lastResult = getLastResult();
    if (processing) elements.notice.textContent = `${pending.name} 강화 시도 중... 잠시만 기다려주세요.`;
    else if (lastResult && lastResult.until > now()) {
      elements.notice.textContent = lastResult.text;
      applyStyles(elements.notice, { color: lastResult.success ? "#2f6a1e" : "#7b2a2a", fontWeight: "800" });
      return;
    } else if (!state) elements.notice.textContent = "현재 착용 중인 강화 가능 장비가 없습니다. 장비창에서 곡괭이를 먼저 장착해보세요.";
    else if (!next) elements.notice.textContent = `더 이상 강화할 수 없습니다. 현재 ${state.name ?? "장착 장비"}는 최고 단계입니다.`;
    else if (stoneDust < next.cost) elements.notice.textContent = `강화에는 돌가루 ${next.cost}개가 필요합니다. 광산에서 더 채굴해오세요.`;
    else elements.notice.textContent = `${state.name ?? "장착 장비"}를 강화하면 채굴력, 추가 드랍 확률, 속도가 함께 상승합니다. 이번 강화 비용은 돌가루 ${next.cost}개입니다.`;
    applyStyles(elements.notice, { color: "#444", fontWeight: "500" });
  }

  return { render, setButtonPressed };
}
