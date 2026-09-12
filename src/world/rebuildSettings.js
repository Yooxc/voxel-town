// 안개 조절: 이 두 숫자만 수정하고 게임을 새로고침하세요. 0 <= near < far
export const REBUILD_FOG = {
  near: 35, // 안개 시작 거리. 낮추면 가까운 풍경부터 흐려집니다.
  far: 95, // 완전히 가려지는 거리. 낮추면 먼 풍경이 더 빨리 가려집니다.
};

export function getRebuildFogSettings(settings = REBUILD_FOG, warn = console.warn) {
  const { near, far } = settings ?? {};
  if (Number.isFinite(near) && Number.isFinite(far) && near >= 0 && far > near) return { near, far };
  warn("[EXCIT] Invalid fog distances. Use 0 <= near < far. Falling back to 35 / 95.");
  return { near: 35, far: 95 };
}
