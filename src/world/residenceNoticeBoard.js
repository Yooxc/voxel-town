export function renderResidenceNoticeBoardTexture({ canvas, texture, entry }) {
  if (!canvas || !texture || !entry) return false;
  const ctx = canvas.getContext("2d");
  if (!ctx) return false;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#1f2933";
  ctx.font = "bold 54px Arial";
  ctx.textAlign = "center";
  ctx.fillText(entry.title, canvas.width * 0.5, 92);
  ctx.strokeStyle = "#d1d8e0";
  ctx.lineWidth = 6;
  ctx.strokeRect(58, 132, canvas.width - 116, canvas.height - 190);
  ctx.fillStyle = "#425466";
  ctx.font = "700 34px Arial";
  entry.lines.forEach((line, index) => {
    ctx.fillText(line, canvas.width * 0.5, 252 + index * 74);
  });
  texture.needsUpdate = true;
  return true;
}
