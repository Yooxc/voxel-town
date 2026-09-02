export function createMapEnvironmentController(ctx) {
  function update() {
    const { player, mineGate, campGate, ambientLight, sunLight, torchLight, torchEquipped } = ctx.getState();
    const mineThreshold = mineGate.position.z - 0.35;
    const campThreshold = campGate.position.z + 0.35;
    const caveBlend = player.position.z <= campThreshold ? 1 : player.position.z >= mineThreshold ? 0
      : ctx.MathUtils.smoothstep(1 - ((player.position.z - campThreshold) / (mineThreshold - campThreshold)), 0, 1);
    ambientLight.intensity = 0.8;
    sunLight.intensity = 0.4;
    for (const entry of ctx.caveDarkMaterials) {
      const scalar = ctx.MathUtils.lerp(1, ctx.darkeningEnabled ? entry.minScalar : 1, caveBlend);
      entry.material.color.copy(entry.baseColor).multiplyScalar(scalar);
    }
    const effectiveBlend = ctx.fogEnabled ? caveBlend : 0;
    const fogNear = torchEquipped ? 5.6 : 1.8;
    const fogFar = torchEquipped ? 18 : 5.6;
    ctx.scene.fog.color.copy(ctx.createColor(ctx.worldFogColor)).lerp(ctx.createColor(ctx.caveFogColor), effectiveBlend);
    ctx.scene.fog.near = ctx.MathUtils.lerp(ctx.worldFogNear, fogNear, effectiveBlend);
    ctx.scene.fog.far = ctx.MathUtils.lerp(ctx.worldFogFar, fogFar, effectiveBlend);
    torchLight.visible = effectiveBlend > 0.02 && torchEquipped;
    torchLight.intensity = ctx.MathUtils.lerp(0, 1.8, effectiveBlend);
    torchLight.distance = ctx.MathUtils.lerp(14, 24, effectiveBlend);
    torchLight.position.copy(player.position).add(ctx.createVector3(0, 1.55, 0));
  }
  return { update };
}
