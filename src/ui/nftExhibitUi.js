export function createNftExhibitUi(uiLayer) {
  const nftBoardOverlay = document.createElement("div");
  nftBoardOverlay.id = "nftBoardOverlay";
  nftBoardOverlay.style.position = "fixed";
  nftBoardOverlay.style.inset = "0";
  nftBoardOverlay.style.display = "none";
  nftBoardOverlay.style.alignItems = "center";
  nftBoardOverlay.style.justifyContent = "center";
  nftBoardOverlay.style.background = "rgba(8,10,14,0.58)";
  nftBoardOverlay.style.backdropFilter = "blur(8px)";
  nftBoardOverlay.style.pointerEvents = "auto";
  nftBoardOverlay.style.zIndex = "1000004";
  uiLayer.appendChild(nftBoardOverlay);

  const nftBoardCard = document.createElement("div");
  nftBoardCard.style.width = "min(760px, calc(100vw - 40px))";
  nftBoardCard.style.maxHeight = "min(78vh, 840px)";
  nftBoardCard.style.display = "flex";
  nftBoardCard.style.flexDirection = "column";
  nftBoardCard.style.padding = "22px";
  nftBoardCard.style.background = "rgba(245,245,245,0.97)";
  nftBoardCard.style.border = "1px solid rgba(0,0,0,0.14)";
  nftBoardCard.style.borderRadius = "18px";
  nftBoardCard.style.boxShadow = "0 20px 48px rgba(0,0,0,0.28)";
  nftBoardCard.style.fontFamily = "system-ui, -apple-system, sans-serif";
  nftBoardCard.style.color = "#222";
  nftBoardOverlay.appendChild(nftBoardCard);

  const nftBoardTitleRow = document.createElement("div");
  nftBoardTitleRow.style.display = "flex";
  nftBoardTitleRow.style.alignItems = "center";
  nftBoardTitleRow.style.justifyContent = "space-between";
  nftBoardTitleRow.style.gap = "12px";
  nftBoardCard.appendChild(nftBoardTitleRow);

  const nftBoardTitle = document.createElement("div");
  nftBoardTitle.textContent = "내 NFT 전시 선택";
  nftBoardTitle.style.fontSize = "24px";
  nftBoardTitle.style.fontWeight = "900";
  nftBoardTitleRow.appendChild(nftBoardTitle);

  const nftBoardCloseBtn = document.createElement("button");
  nftBoardCloseBtn.type = "button";
  nftBoardCloseBtn.textContent = "닫기";
  nftBoardCloseBtn.style.padding = "10px 14px";
  nftBoardCloseBtn.style.borderRadius = "12px";
  nftBoardCloseBtn.style.border = "1px solid rgba(0,0,0,0.12)";
  nftBoardCloseBtn.style.background = "rgba(255,255,255,0.9)";
  nftBoardCloseBtn.style.color = "#333";
  nftBoardCloseBtn.style.fontSize = "14px";
  nftBoardCloseBtn.style.fontWeight = "800";
  nftBoardCloseBtn.style.cursor = "pointer";
  nftBoardCloseBtn.style.pointerEvents = "auto";
  nftBoardTitleRow.appendChild(nftBoardCloseBtn);

  const nftBoardDesc = document.createElement("div");
  nftBoardDesc.textContent = "현재 지갑이 보유한 전시 가능 NFT 중 하나를 골라 보드에 전시합니다.";
  nftBoardDesc.style.marginTop = "10px";
  nftBoardDesc.style.fontSize = "14px";
  nftBoardDesc.style.lineHeight = "1.65";
  nftBoardDesc.style.color = "#555";
  nftBoardCard.appendChild(nftBoardDesc);

  const nftBoardStatus = document.createElement("div");
  nftBoardStatus.textContent = "지갑 NFT 목록을 준비하는 중입니다.";
  nftBoardStatus.style.marginTop = "14px";
  nftBoardStatus.style.padding = "10px 12px";
  nftBoardStatus.style.background = "rgba(0,0,0,0.05)";
  nftBoardStatus.style.borderRadius = "12px";
  nftBoardStatus.style.fontSize = "13px";
  nftBoardStatus.style.lineHeight = "1.6";
  nftBoardStatus.style.color = "#444";
  nftBoardCard.appendChild(nftBoardStatus);

  const nftBoardGrid = document.createElement("div");
  nftBoardGrid.style.marginTop = "16px";
  nftBoardGrid.style.display = "grid";
  nftBoardGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(168px, 1fr))";
  nftBoardGrid.style.gap = "14px";
  nftBoardGrid.style.overflowY = "auto";
  nftBoardGrid.style.paddingRight = "4px";
  nftBoardGrid.style.maxHeight = "52vh";
  nftBoardGrid.style.pointerEvents = "auto";
  nftBoardCard.appendChild(nftBoardGrid);

  return {
    nftBoardOverlay,
    nftBoardCloseBtn,
    nftBoardStatus,
    nftBoardGrid,
  };
}

export function updateNftExhibitUiState({ overlay, statusElement, open, status, tone }) {
  overlay.style.display = open ? "flex" : "none";
  statusElement.textContent = status || "지갑 NFT 목록을 준비하는 중입니다.";
  const palette = {
    neutral: { bg: "rgba(0,0,0,0.05)", color: "#444", border: "rgba(0,0,0,0.06)" },
    loading: { bg: "rgba(246,165,58,0.12)", color: "#8f5a00", border: "rgba(246,165,58,0.22)" },
    success: { bg: "rgba(54,179,126,0.12)", color: "#1f6a4a", border: "rgba(54,179,126,0.22)" },
    empty: { bg: "rgba(100,116,139,0.1)", color: "#475569", border: "rgba(100,116,139,0.18)" },
    error: { bg: "rgba(220,38,38,0.1)", color: "#9f1239", border: "rgba(220,38,38,0.2)" },
  };
  const style = palette[tone] ?? palette.neutral;
  statusElement.style.background = style.bg;
  statusElement.style.color = style.color;
  statusElement.style.border = `1px solid ${style.border}`;
}

function applyCardBaseStyle(card) {
  card.style.display = "flex";
  card.style.flexDirection = "column";
  card.style.alignItems = "stretch";
  card.style.padding = "10px";
  card.style.borderRadius = "16px";
  card.style.border = "2px solid rgba(0,0,0,0.08)";
  card.style.background = "#ffffff";
  card.style.cursor = "pointer";
  card.style.textAlign = "left";
  card.style.pointerEvents = "auto";
  card.style.boxShadow = "0 8px 20px rgba(0,0,0,0.08)";
  card.style.transition = "transform 120ms ease, border-color 120ms ease, box-shadow 120ms ease";
  card.addEventListener("mouseenter", () => { card.style.transform = "translateY(-2px)"; });
  card.addEventListener("mouseleave", () => { card.style.transform = "translateY(0)"; });
}

function appendCardLabel(card, text, { sub = false } = {}) {
  const label = document.createElement("div");
  label.textContent = text;
  label.style.marginTop = sub ? "4px" : "10px";
  label.style.fontSize = sub ? "12px" : "14px";
  label.style.fontWeight = sub ? "400" : "800";
  label.style.lineHeight = sub ? "normal" : "1.4";
  label.style.color = sub ? "#64748b" : "#222";
  card.appendChild(label);
}

function appendSelectedBadge(card, text) {
  const badge = document.createElement("div");
  badge.textContent = text;
  badge.style.marginTop = "8px";
  badge.style.alignSelf = "flex-start";
  badge.style.padding = "4px 8px";
  badge.style.borderRadius = "999px";
  badge.style.background = "rgba(246,165,58,0.16)";
  badge.style.color = "#c16b00";
  badge.style.fontSize = "11px";
  badge.style.fontWeight = "800";
  card.appendChild(badge);
}

function appendStateCard(grid, { title, description, tone, onRetry }) {
  const card = document.createElement("div");
  card.style.gridColumn = "1 / -1";
  card.style.minHeight = "220px";
  card.style.display = "flex";
  card.style.flexDirection = "column";
  card.style.alignItems = "center";
  card.style.justifyContent = "center";
  card.style.padding = "28px 20px";
  card.style.borderRadius = "18px";
  card.style.border = "1px dashed rgba(0,0,0,0.14)";
  card.style.background = "#fbfcfd";
  card.style.textAlign = "center";
  const icon = document.createElement("div");
  icon.textContent = tone === "loading" ? "..." : tone === "error" ? "!" : tone === "empty" ? "0" : "NFT";
  icon.style.width = "54px";
  icon.style.height = "54px";
  icon.style.display = "flex";
  icon.style.alignItems = "center";
  icon.style.justifyContent = "center";
  icon.style.borderRadius = "999px";
  icon.style.background = tone === "loading" ? "rgba(246,165,58,0.14)" : tone === "error" ? "rgba(220,38,38,0.12)" : tone === "empty" ? "rgba(100,116,139,0.12)" : "rgba(59,130,246,0.12)";
  icon.style.color = tone === "loading" ? "#8f5a00" : tone === "error" ? "#9f1239" : tone === "empty" ? "#475569" : "#1d4ed8";
  icon.style.fontWeight = "900";
  icon.style.fontSize = "22px";
  card.appendChild(icon);
  const titleEl = document.createElement("div");
  titleEl.textContent = title;
  titleEl.style.marginTop = "14px";
  titleEl.style.fontSize = "16px";
  titleEl.style.fontWeight = "900";
  titleEl.style.color = "#1f2937";
  card.appendChild(titleEl);
  const descriptionEl = document.createElement("div");
  descriptionEl.textContent = description;
  descriptionEl.style.marginTop = "8px";
  descriptionEl.style.fontSize = "13px";
  descriptionEl.style.lineHeight = "1.6";
  descriptionEl.style.color = "#64748b";
  descriptionEl.style.maxWidth = "360px";
  card.appendChild(descriptionEl);
  if (onRetry) {
    const retry = document.createElement("button");
    retry.type = "button";
    retry.textContent = "다시 시도";
    retry.style.marginTop = "16px";
    retry.style.padding = "10px 14px";
    retry.style.borderRadius = "12px";
    retry.style.border = "1px solid rgba(0,0,0,0.12)";
    retry.style.background = "#ffffff";
    retry.style.color = "#1f2937";
    retry.style.fontSize = "13px";
    retry.style.fontWeight = "800";
    retry.style.cursor = "pointer";
    retry.addEventListener("click", onRetry);
    card.appendChild(retry);
  }
  grid.appendChild(card);
}

export function renderNftExhibitTokenGrid({
  grid, selected, tokens, loading, status, tone, ownershipMismatch, ownershipMessage,
  setStatus, normalizeImageUrl, onRetry, onClear, onSelect,
}) {
  grid.innerHTML = "";
  if (loading) {
    setStatus(status || "지갑 NFT 목록을 불러오는 중입니다...", "loading");
    appendStateCard(grid, { title: "NFT 목록을 불러오는 중", description: "지갑과 체인에서 전시 가능한 NFT를 확인하고 있어요. 잠시만 기다려주세요.", tone: "loading" });
    return;
  }
  if (tokens.length === 0) {
    const isError = tone === "error";
    setStatus(status || "전시 가능한 NFT가 없습니다.", isError ? "error" : "empty");
    appendStateCard(grid, { title: isError ? "NFT를 불러오지 못했습니다" : "전시 가능한 NFT 없음", description: isError ? "네트워크 또는 메타데이터 오류가 발생했습니다. 잠시 후 다시 확인해보세요." : "현재 로그인한 지갑에서 전시 가능한 NFT를 찾지 못했습니다.", tone: isError ? "error" : "empty", onRetry });
    return;
  }
  setStatus(ownershipMismatch ? ownershipMessage || "현재 선택한 NFT를 더 이상 보유하고 있지 않습니다." : status || "전시할 NFT를 하나 선택하세요.", ownershipMismatch ? "error" : "success");
  if (ownershipMismatch) {
    const warning = document.createElement("div");
    warning.style.gridColumn = "1 / -1";
    warning.style.padding = "14px 16px";
    warning.style.borderRadius = "14px";
    warning.style.background = "rgba(220,38,38,0.08)";
    warning.style.border = "1px solid rgba(220,38,38,0.18)";
    warning.textContent = "현재 전시 NFT를 더 이상 보유하지 않습니다. 아래 목록에서 다시 선택하거나 전시를 해제하세요.";
    warning.style.fontSize = "13px";
    warning.style.lineHeight = "1.6";
    warning.style.color = "#7f1d1d";
    grid.appendChild(warning);
  }
  const clearCard = document.createElement("button");
  clearCard.type = "button";
  applyCardBaseStyle(clearCard);
  if (selected?.mode === "none") {
    clearCard.style.borderColor = "#f6a53a";
    clearCard.style.boxShadow = "0 10px 24px rgba(246,165,58,0.2)";
  }
  const clearThumb = document.createElement("div");
  clearThumb.textContent = "전시 해제";
  clearThumb.style.width = "100%";
  clearThumb.style.aspectRatio = "1 / 1";
  clearThumb.style.borderRadius = "12px";
  clearThumb.style.background = "repeating-linear-gradient(135deg, #eef2f6 0 18px, #ffffff 18px 36px)";
  clearThumb.style.border = "1px solid rgba(0,0,0,0.06)";
  clearThumb.style.display = "flex";
  clearThumb.style.alignItems = "center";
  clearThumb.style.justifyContent = "center";
  clearThumb.style.color = "#64748b";
  clearThumb.style.fontSize = "14px";
  clearThumb.style.fontWeight = "900";
  clearCard.appendChild(clearThumb);
  appendCardLabel(clearCard, "NFT 전시 해제");
  appendCardLabel(clearCard, "보드를 빈 상태로 둡니다.", { sub: true });
  if (selected?.mode === "none") appendSelectedBadge(clearCard, "현재 적용 중");
  clearCard.addEventListener("click", onClear);
  grid.appendChild(clearCard);
  for (const token of tokens) {
    const card = document.createElement("button");
    card.type = "button";
    applyCardBaseStyle(card);
    const isSelected = selected?.contractAddress === token.contractAddress.toLowerCase() && selected?.tokenId === token.tokenId;
    if (isSelected) {
      card.style.borderColor = "#f6a53a";
      card.style.boxShadow = "0 10px 24px rgba(246,165,58,0.2)";
    }
    const thumb = document.createElement("div");
    thumb.style.width = "100%";
    thumb.style.aspectRatio = "1 / 1";
    thumb.style.borderRadius = "12px";
    thumb.style.overflow = "hidden";
    thumb.style.background = "#eef2f6";
    thumb.style.display = "flex";
    thumb.style.alignItems = "center";
    thumb.style.justifyContent = "center";
    thumb.style.border = "1px solid rgba(0,0,0,0.06)";
    if (token.image) {
      const image = document.createElement("img");
      image.src = normalizeImageUrl(token.image);
      image.alt = token.name;
      image.style.width = "100%";
      image.style.height = "100%";
      image.style.objectFit = "cover";
      thumb.appendChild(image);
    } else {
      thumb.textContent = "NFT";
      thumb.style.fontWeight = "900";
      thumb.style.color = "#475569";
    }
    card.appendChild(thumb);
    appendCardLabel(card, token.name);
    appendCardLabel(card, `Token #${token.tokenId}`, { sub: true });
    if (isSelected) appendSelectedBadge(card, "현재 전시 중");
    card.addEventListener("click", () => onSelect(token));
    grid.appendChild(card);
  }
}
