export function createNftExhibitRuntime({ normalizeSelection, isSameSelection }) {
  let listRequestToken = 0;
  let boardRefreshToken = 0;

  function getSelectionPlan(currentSelection, nextSelection) {
    const selection = normalizeSelection(nextSelection);
    return {
      selection,
      changed: !isSameSelection(currentSelection, selection),
    };
  }

  function beginListRequest() {
    listRequestToken += 1;
    return listRequestToken;
  }

  function isCurrentListRequest(token) {
    return token === listRequestToken;
  }

  function getListResultState({ tokens, selected }) {
    const normalizedTokens = Array.isArray(tokens) ? tokens : [];
    const hasSelectedToken = selected?.mode !== "none"
      && selected?.contractAddress
      && selected?.tokenId;
    const stillOwned = !hasSelectedToken || normalizedTokens.some(
      (token) => token.contractAddress?.toLowerCase() === selected.contractAddress
        && String(token.tokenId) === String(selected.tokenId)
    );
    const ownershipMismatch = hasSelectedToken && !stillOwned;
    return {
      tokens: normalizedTokens,
      ownershipMismatch,
      ownershipMessage: ownershipMismatch ? "현재 선택한 NFT를 이 지갑이 보유하고 있지 않습니다." : "",
      status: normalizedTokens.length > 0
        ? "전시할 NFT를 하나 선택하세요."
        : "지갑에서 전시 가능한 NFT를 찾지 못했습니다.",
      tone: ownershipMismatch ? "error" : (normalizedTokens.length > 0 ? "success" : "empty"),
    };
  }

  function beginBoardRefresh() {
    boardRefreshToken += 1;
    return boardRefreshToken;
  }

  function isCurrentBoardRefresh(token) {
    return token === boardRefreshToken;
  }

  return {
    getSelectionPlan,
    beginListRequest,
    isCurrentListRequest,
    getListResultState,
    beginBoardRefresh,
    isCurrentBoardRefresh,
  };
}
