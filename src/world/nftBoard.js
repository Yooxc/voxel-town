import * as THREE from "three";
import { normalizeIpfsUrl } from "../systems/nftExhibit.js";

const NFT_BOARD_CANVAS_WIDTH = 1152;
const NFT_BOARD_CANVAS_HEIGHT = 1000;

export function createBoardTextTexture(title, lines = [], accent = "#d9b24f") {
  const canvas = document.createElement("canvas");
  canvas.width = NFT_BOARD_CANVAS_WIDTH;
  canvas.height = NFT_BOARD_CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#18130f";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#2a211b";
  ctx.fillRect(34, 34, canvas.width - 68, canvas.height - 68);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 14;
  ctx.strokeRect(34, 34, canvas.width - 68, canvas.height - 68);
  ctx.fillStyle = accent;
  ctx.font = "700 54px system-ui";
  ctx.textAlign = "center";
  ctx.fillText(title, canvas.width * 0.5, 132);
  ctx.fillStyle = "#f0e7dc";
  ctx.font = "600 34px system-ui";
  let y = 238;
  for (const line of lines) {
    ctx.fillText(line, canvas.width * 0.5, y);
    y += 56;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}

function loadImageElement(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("NFT 이미지를 불러오지 못했습니다."));
    img.src = src;
  });
}

export async function createBoardImageTexture(imageUrl, title, subtitle = "") {
  const img = await loadImageElement(normalizeIpfsUrl(imageUrl));
  const canvas = document.createElement("canvas");
  canvas.width = NFT_BOARD_CANVAS_WIDTH;
  canvas.height = NFT_BOARD_CANVAS_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.fillStyle = "#f4f6f8";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(24, 24, canvas.width - 48, canvas.height - 48);
  ctx.strokeStyle = "#2a2f37";
  ctx.lineWidth = 10;
  ctx.strokeRect(24, 24, canvas.width - 48, canvas.height - 48);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(54, 96, canvas.width - 108, canvas.height - 248);

  const frameX = 52;
  const frameY = 68;
  const frameW = canvas.width - 104;
  const frameH = canvas.height - 190;
  const scale = Math.min(frameW / img.width, frameH / img.height);
  const drawW = img.width * scale;
  const drawH = img.height * scale;
  const drawX = frameX + (frameW - drawW) * 0.5;
  const drawY = frameY + (frameH - drawH) * 0.5;
  ctx.save();
  ctx.shadowColor = "rgba(0,0,0,0.22)";
  ctx.shadowBlur = 24;
  ctx.shadowOffsetY = 12;
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(drawX - 14, drawY - 14, drawW + 28, drawH + 28);
  ctx.restore();
  ctx.save();
  ctx.filter = "brightness(1.42) contrast(1.16) saturate(1.08)";
  ctx.drawImage(img, drawX, drawY, drawW, drawH);
  ctx.restore();

  ctx.fillStyle = "#eef2f6";
  ctx.fillRect(42, canvas.height - 130, canvas.width - 84, 40);
  ctx.strokeStyle = "#2a2f37";
  ctx.lineWidth = 4;
  ctx.strokeRect(42, canvas.height - 130, canvas.width - 84, 40);
  ctx.fillStyle = "#f7f9fb";
  ctx.fillRect(42, canvas.height - 82, canvas.width - 84, 28);
  ctx.strokeStyle = "rgba(42,47,55,0.42)";
  ctx.lineWidth = 2;
  ctx.strokeRect(42, canvas.height - 82, canvas.width - 84, 28);
  ctx.fillStyle = "#1f2730";
  ctx.textAlign = "center";
  ctx.font = "700 24px system-ui";
  ctx.fillText(title, canvas.width * 0.5, canvas.height - 102);
  if (subtitle) {
    ctx.fillStyle = "#5d6a78";
    ctx.font = "600 15px system-ui";
    ctx.fillText(subtitle, canvas.width * 0.5, canvas.height - 62);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.needsUpdate = true;
  return texture;
}
