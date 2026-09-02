export function createNftExhibitController(ctx) {
  let refreshTimer = null;
  let open = false;
  let loading = false;
  let status = "";
  let tone = "neutral";
  let tokens = [];
  let selectedItem = null;
  let ownershipMismatch = false;
  let ownershipMessage = "";
  let cache = ctx.createTokensCache();
  let screenMaterial = null;

  function getSelectedItem() {
    const normalized = ctx.normalizeSelection(selectedItem);
    return normalized?.mode === "none" ? normalized : normalized ?? ctx.createDefaultSelection();
  }

  function renderState() {
    ctx.updateUiState({ overlay: ctx.ui.overlay, statusElement: ctx.ui.status, open, status, tone });
  }

  function setStatus(nextStatus, nextTone = "neutral") {
    status = nextStatus;
    tone = nextTone;
    renderState();
  }

  function close() {
    open = false;
    renderState();
  }

  function setSelectedItem(nextSelection, { save = true } = {}) {
    const plan = ctx.runtime.getSelectionPlan(selectedItem, nextSelection);
    if (!plan.changed) {
      close();
      return false;
    }
    selectedItem = plan.selection;
    close();
    scheduleRefresh();
    if (save) ctx.scheduleSave();
    return true;
  }

  function renderTokenGrid() {
    ctx.renderTokenGrid({
      grid: ctx.ui.grid, selected: getSelectedItem(), tokens, loading, status, tone,
      ownershipMismatch, ownershipMessage, setStatus, normalizeImageUrl: ctx.normalizeImageUrl,
      onRetry: () => { void reloadList({ forceRefresh: true }); },
      onClear: () => {
        if (setSelectedItem(ctx.createClearedSelection())) ctx.notify("NFT 전시 해제", 1000);
      },
      onSelect: (token) => {
        if (setSelectedItem({ chainId: ctx.target.chainId, contractAddress: token.contractAddress, tokenId: token.tokenId, name: token.name, image: token.image, subtitle: token.subtitle || "" })) {
          ctx.notify(`${token.name} 전시`, 1000);
        }
      },
    });
  }

  function applyTexture(texture) {
    if (!screenMaterial) return;
    if (screenMaterial.map && screenMaterial.map !== texture) screenMaterial.map.dispose?.();
    screenMaterial.map = texture;
    screenMaterial.needsUpdate = true;
  }

  function setBoardMessage(title, lines, accent = "#d9b24f") {
    const texture = ctx.createTextTexture(title, lines, accent);
    if (texture) applyTexture(texture);
  }

  async function reloadList({ forceRefresh = false } = {}) {
    if (!open) return;
    const requestToken = ctx.runtime.beginListRequest();
    loading = true;
    status = "지갑 NFT 목록을 불러오는 중입니다...";
    tone = "loading";
    tokens = [];
    renderState();
    renderTokenGrid();
    try {
      if (forceRefresh) cache.fetchedAt = 0;
      const result = await ctx.fetchTokens(cache);
      cache = result.cache;
      if (!open || !ctx.runtime.isCurrentListRequest(requestToken)) return;
      const listState = ctx.runtime.getListResultState({ tokens: result.items, selected: getSelectedItem() });
      tokens = listState.tokens;
      ownershipMismatch = listState.ownershipMismatch;
      ownershipMessage = listState.ownershipMessage;
      status = listState.status;
      tone = listState.tone;
    } catch (error) {
      if (!open || !ctx.runtime.isCurrentListRequest(requestToken)) return;
      tokens = [];
      status = error?.message || "NFT 목록을 불러오지 못했습니다.";
      tone = "error";
    } finally {
      if (!open || !ctx.runtime.isCurrentListRequest(requestToken)) return;
      loading = false;
      renderState();
      renderTokenGrid();
    }
  }

  async function openSelection() {
    const walletAuth = ctx.getWalletAuth();
    if (!ctx.isServerBackedWalletSession()) return ctx.notify("메타마스크 로그인 후 사용 가능", 1000);
    if ((walletAuth.chainId || "") !== ctx.target.chainId) return ctx.notify("Ethereum 메인넷으로 전환 후 이용 가능", 1200);
    ctx.closeOtherWindows();
    open = true;
    await reloadList();
  }

  function scheduleRefresh() {
    if (refreshTimer) clearTimeout(refreshTimer);
    refreshTimer = setTimeout(() => {
      refreshTimer = null;
      void refreshBoard();
    }, 40);
  }

  async function refreshBoard() {
    if (!screenMaterial) return;
    const refreshToken = ctx.runtime.beginBoardRefresh();
    const selectedNft = getSelectedItem();
    const walletAuth = ctx.getWalletAuth();
    ownershipMismatch = false;
    ownershipMessage = "";
    if (selectedNft?.mode === "none") return setBoardMessage("지갑 NFT 전시", ["현재 선택된 전시 작품이 없습니다.", "선택창에서 원하는 NFT를 골라주세요."], "#9dbce0");
    if (!walletAuth.authenticated || walletAuth.sessionType !== "wallet" || !walletAuth.address) return setBoardMessage("지갑 NFT 전시", ["메타마스크 로그인 후", "보유 NFT를 전시합니다."], "#9dbce0");
    const chainId = walletAuth.chainId || (await window.ethereum?.request?.({ method: "eth_chainId" }).catch(() => ""));
    if (!ctx.runtime.isCurrentBoardRefresh(refreshToken)) return;
    if (chainId !== selectedNft.chainId) return setBoardMessage("지갑 NFT 전시", ["Ethereum 메인넷으로", "전환하면 작품을 불러옵니다."], "#d9b24f");
    setBoardMessage("지갑 NFT 전시", ["작품 정보를", "불러오는 중입니다..."], "#d9b24f");
    try {
      const owner = await ctx.fetchOwner(selectedNft.contractAddress, selectedNft.tokenId);
      if (!ctx.runtime.isCurrentBoardRefresh(refreshToken)) return;
      if (owner.toLowerCase() !== walletAuth.address.toLowerCase()) {
        ownershipMismatch = true;
        ownershipMessage = "현재 선택한 NFT를 이 지갑이 보유하고 있지 않습니다.";
        return setBoardMessage("지갑 NFT 전시", ["현재 선택한 NFT를", "이 지갑이 보유하고 있지 않습니다."], "#d97575");
      }
      const tokenUri = await ctx.fetchTokenUri(selectedNft.contractAddress, selectedNft.tokenId);
      if (!ctx.runtime.isCurrentBoardRefresh(refreshToken)) return;
      const metadata = await ctx.fetchMetadata(tokenUri);
      if (!ctx.runtime.isCurrentBoardRefresh(refreshToken)) return;
      const imageUrl = metadata?.image || metadata?.image_url || metadata?.imageUrl || "";
      if (!imageUrl) return setBoardMessage(metadata?.name || "NFT 작품", ["이미지 메타데이터가", "비어 있습니다."], "#d97575");
      const profile = ctx.getWalletProfile();
      const ownerName = profile.nickname?.trim() ? profile.nickname.trim() : ctx.shortenAddress(walletAuth.address);
      const texture = await ctx.createImageTexture(imageUrl, metadata?.name || selectedNft.name || ctx.target.title, `소유자: ${ownerName}`);
      if (ctx.runtime.isCurrentBoardRefresh(refreshToken) && texture) applyTexture(texture);
    } catch (error) {
      if (ctx.runtime.isCurrentBoardRefresh(refreshToken)) setBoardMessage("지갑 NFT 전시", [error?.message || "NFT를 불러오지 못했습니다."], "#d97575");
    }
  }

  function resetSession() {
    close(); loading = false; status = ""; tone = "neutral"; tokens = []; cache = ctx.createTokensCache(); ownershipMismatch = false; ownershipMessage = "";
  }

  ctx.ui.closeButton.addEventListener("click", close);
  ctx.ui.overlay.addEventListener("click", (event) => { if (event.target === ctx.ui.overlay) close(); });
  return { isOpen: () => open, close, refreshUi: renderState, openSelection, scheduleRefresh, refreshBoard, getSelectedItem, setSelectedItem: (value) => { selectedItem = ctx.normalizeSelection(value); }, setScreenMaterial: (material) => { screenMaterial = material; }, resetSession };
}
