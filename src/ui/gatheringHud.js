export function formatGatheringStatNumber(value) {
  if (Math.abs(value - Math.round(value)) < 1e-6) return String(Math.round(value));
  return value.toFixed(2);
}

export function getRockHpHudView({ hp, maxHp, labelPrefix = "돌 체력", projectedPosition, viewport }) {
  if (!projectedPosition || !viewport) return null;
  const visible = projectedPosition.z > -1 && projectedPosition.z < 1
    && projectedPosition.x >= -1.15 && projectedPosition.x <= 1.15
    && projectedPosition.y >= -1.15 && projectedPosition.y <= 1.15;
  if (!visible) return null;
  const safeHp = Math.max(0, hp ?? 0);
  const safeMaxHp = Math.max(1, maxHp ?? 1);
  return {
    x: (projectedPosition.x * 0.5 + 0.5) * viewport.width,
    y: (-projectedPosition.y * 0.5 + 0.5) * viewport.height,
    ratio: Math.max(0, Math.min(1, safeHp / safeMaxHp)),
    label: `${labelPrefix} ${formatGatheringStatNumber(safeHp)}/${formatGatheringStatNumber(safeMaxHp)}`,
  };
}

export function createGatheringHud(uiLayer) {
  const pickup = document.createElement("div");
  pickup.id = "pickupHint";
  Object.assign(pickup.style, {
    position: "fixed", left: "50%", bottom: "22%", transform: "translateX(-50%)", padding: "14px 20px",
    background: "rgba(0,0,0,0.60)", color: "white", fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
    fontSize: "20px", borderRadius: "14px", backdropFilter: "blur(4px)", boxShadow: "0 10px 25px rgba(0,0,0,0.35)",
    border: "1px solid rgba(255,255,255,0.25)", letterSpacing: "0.2px", userSelect: "none", zIndex: "999999", display: "none",
  });
  uiLayer.appendChild(pickup);

  const wrap = document.createElement("div");
  wrap.id = "rockHpBar";
  Object.assign(wrap.style, {
    position: "fixed", left: "0", top: "0", width: "84px", padding: "6px 7px 7px", background: "rgba(20,20,20,0.64)",
    border: "1px solid rgba(255,255,255,0.22)", borderRadius: "10px", backdropFilter: "blur(4px)", pointerEvents: "none",
    display: "none", transform: "translate(-50%, -100%)", zIndex: "999999",
  });
  const label = document.createElement("div");
  label.textContent = "채굴 대상";
  Object.assign(label.style, {
    color: "white", fontFamily: "system-ui, -apple-system, sans-serif", fontSize: "11px", fontWeight: "700",
    marginBottom: "5px", textAlign: "center",
  });
  const track = document.createElement("div");
  Object.assign(track.style, {
    width: "100%", height: "8px", background: "rgba(255,255,255,0.14)", borderRadius: "999px",
    overflow: "hidden", boxShadow: "inset 0 1px 1px rgba(0,0,0,0.25)",
  });
  const fill = document.createElement("div");
  Object.assign(fill.style, {
    width: "100%", height: "6px", margin: "1px", background: "linear-gradient(90deg, #ff8a4b, #ffd166)",
    borderRadius: "999px", transition: "width 120ms ease",
  });
  track.appendChild(fill);
  wrap.append(label, track);
  uiLayer.appendChild(wrap);

  function hidePickup() { pickup.style.display = "none"; }
  function showPickup(text) {
    pickup.textContent = text;
    pickup.style.display = "block";
  }
  function hideRockHp() { wrap.style.display = "none"; }
  function updateRockHp(view, { dimmed = false } = {}) {
    if (!view) {
      hideRockHp();
      return;
    }
    wrap.style.display = "block";
    wrap.style.left = `${view.x}px`;
    wrap.style.top = `${view.y}px`;
    wrap.style.opacity = dimmed ? "0.48" : "1";
    wrap.style.background = dimmed ? "rgba(20,20,20,0.42)" : "rgba(20,20,20,0.64)";
    wrap.style.border = dimmed ? "1px solid rgba(255,255,255,0.14)" : "1px solid rgba(255,255,255,0.22)";
    label.style.color = dimmed ? "rgba(255,255,255,0.78)" : "white";
    track.style.background = dimmed ? "rgba(255,255,255,0.10)" : "rgba(255,255,255,0.14)";
    fill.style.background = dimmed
      ? "linear-gradient(90deg, rgba(255,138,75,0.72), rgba(255,209,102,0.72))"
      : "linear-gradient(90deg, #ff8a4b, #ffd166)";
    fill.style.width = `${view.ratio * 100}%`;
    label.textContent = view.label;
  }

  return { showPickup, hidePickup, hideRockHp, updateRockHp };
}
