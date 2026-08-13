export function createPlayerSaveRuntime() {
  let baselineState = "unknown";
  let lastSnapshot = "";
  let lastKnownUpdatedAt = "";

  return {
    reset() {
      baselineState = "unknown";
      lastSnapshot = "";
      lastKnownUpdatedAt = "";
    },
    beginHydration() {
      baselineState = "pending";
      lastSnapshot = "";
    },
    markBaselineReady(mode = "hydrated") { baselineState = mode; },
    blockBaseline() { baselineState = "blocked"; },
    hasConfirmedBaseline() { return baselineState === "hydrated" || baselineState === "fresh"; },
    get baselineState() { return baselineState; },
    get lastSnapshot() { return lastSnapshot; },
    set lastSnapshot(value) { lastSnapshot = value ?? ""; },
    get lastKnownUpdatedAt() { return lastKnownUpdatedAt; },
    set lastKnownUpdatedAt(value) { lastKnownUpdatedAt = value ?? ""; },
  };
}
