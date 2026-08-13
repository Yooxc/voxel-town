export function createSessionRuntime({ devProfileIds, fallbackProfileId, devProfileSavePrefix, guestSaveKey }) {
  const sanitizeDevProfileId = (id) => devProfileIds.includes(id) ? id : fallbackProfileId;
  function validateNickname(raw) {
    const name = String(raw ?? "").trim();
    if (name.length < 2 || name.length > 12) return "닉네임은 2자 이상 12자 이하로 입력해주세요.";
    return /^[A-Za-z0-9가-힣_]+$/.test(name) ? "" : "닉네임은 한글, 영문, 숫자, 밑줄만 사용할 수 있습니다.";
  }
  function getPlayerSaveKey(auth, profileId) {
    if (auth?.sessionType === "dev") return `${devProfileSavePrefix}${sanitizeDevProfileId(profileId)}`;
    if (auth?.sessionType === "guest" || auth?.address === "guest-local") return guestSaveKey;
    return "";
  }
  return { sanitizeDevProfileId, validateNickname, getPlayerSaveKey };
}
