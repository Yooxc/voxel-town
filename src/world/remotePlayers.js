import * as THREE from "three";
import { createPlayerAnimationRuntime } from "../core/playerAnimationRuntime.js";

function lerpAngle(current, target, alpha) {
  const difference = Math.atan2(Math.sin(target - current), Math.cos(target - current));
  return current + difference * alpha;
}

export function createRemotePlayerRuntime({ scene, uiLayer, camera, viewport = globalThis.window, createPlayerRig }) {
  const players = new Map();
  const projected = new THREE.Vector3();

  function createLabel(name) {
    const label = document.createElement("div");
    Object.assign(label.style, {
      position: "fixed", transform: "translate(-50%, -50%)", padding: "5px 9px", borderRadius: "999px",
      background: "rgba(20,20,20,0.72)", border: "1px solid rgba(255,255,255,0.18)",
      color: "#dff7ff", fontFamily: "system-ui, sans-serif", fontSize: "12px", fontWeight: "800",
      pointerEvents: "none", zIndex: "999996", display: "none",
    });
    label.textContent = name;
    uiLayer.appendChild(label);
    return label;
  }

  function ensurePlayer(snapshot) {
    let remote = players.get(snapshot.id);
    if (remote) return remote;
    const root = createPlayerRig();
    root.name = `EXCIT_REMOTE_PLAYER_${snapshot.id}`;
    root.position.set(snapshot.x, snapshot.y, snapshot.z);
    root.rotation.y = snapshot.rotationY;
    scene.add(root);
    const label = createLabel(snapshot.name);
    remote = { root, label, animation: createPlayerAnimationRuntime(root), target: { ...snapshot } };
    players.set(snapshot.id, remote);
    return remote;
  }

  function removePlayer(id) {
    const remote = players.get(id);
    if (!remote) return;
    remote.root.removeFromParent();
    remote.label.remove();
    players.delete(id);
  }

  function applySnapshot(entries, selfId) {
    const activeIds = new Set();
    for (const snapshot of entries ?? []) {
      if (!snapshot?.id || snapshot.id === selfId || snapshot.mapId !== "광산") continue;
      activeIds.add(snapshot.id);
      const remote = ensurePlayer(snapshot);
      remote.target = { ...snapshot };
      remote.label.textContent = snapshot.name;
    }
    for (const id of players.keys()) if (!activeIds.has(id)) removePlayer(id);
  }

  function update(dt) {
    const alpha = 1 - Math.exp(-Math.max(0, dt) * 12);
    for (const remote of players.values()) {
      const { target, root, label } = remote;
      root.position.lerp(target, alpha);
      root.rotation.y = lerpAngle(root.rotation.y, target.rotationY, alpha);
      remote.animation.update(dt, { isMoving: target.moving, isSprinting: target.sprinting });
      projected.copy(root.position);
      projected.y += 2.8;
      projected.project(camera);
      if (projected.z < -1 || projected.z > 1) {
        label.style.display = "none";
        continue;
      }
      label.style.left = `${(projected.x * 0.5 + 0.5) * viewport.innerWidth}px`;
      label.style.top = `${(-projected.y * 0.5 + 0.5) * viewport.innerHeight}px`;
      label.style.display = "block";
    }
  }

  function clear() {
    for (const id of [...players.keys()]) removePlayer(id);
  }

  return { applySnapshot, update, clear, size: () => players.size };
}
