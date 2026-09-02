import * as THREE from "three";

function createIndices(columns, rows) {
  const indices = [];
  for (let row = 0; row < rows - 1; row += 1) {
    for (let column = 0; column < columns - 1; column += 1) {
      const a = row * columns + column;
      const b = a + 1;
      const c = a + columns;
      const d = c + 1;
      indices.push(a, c, b, b, c, d);
    }
  }
  return indices;
}

export function createDeformableTerrainMesh({ terrain, color = 0x6f5135, roughness = 1 }) {
  const positions = new Float32Array(terrain.heights.length * 3);
  const geometry = new THREE.BufferGeometry();
  const positionAttribute = new THREE.BufferAttribute(positions, 3);
  positionAttribute.setUsage(THREE.DynamicDrawUsage);
  geometry.setAttribute("position", positionAttribute);
  geometry.setIndex(createIndices(terrain.columns, terrain.rows));

  const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({ color, roughness }));
  mesh.name = "DIGGABLE_terrain_lab_ground";
  mesh.receiveShadow = true;

  function applyHeights() {
    for (let row = 0; row < terrain.rows; row += 1) {
      for (let column = 0; column < terrain.columns; column += 1) {
        const index = terrain.getIndex(column, row);
        const point = terrain.getVertexPosition(column, row);
        positionAttribute.setXYZ(index, point.x, terrain.heights[index], point.z);
      }
    }
    positionAttribute.needsUpdate = true;
    geometry.computeVertexNormals();
    geometry.attributes.normal.needsUpdate = true;
    geometry.computeBoundingBox();
    geometry.computeBoundingSphere();
  }

  applyHeights();

  return {
    mesh,
    applyHeights,
    dispose() {
      geometry.dispose();
      mesh.material.dispose();
    },
  };
}
