import * as THREE from "three";

export function createMainScene() {
  return new THREE.Scene();
}

export function applyMainSceneAtmosphere(scene, options) {
  scene.background = new THREE.Color(options.initialBackgroundColor);
  scene.fog = new THREE.Fog(options.fogColor, options.fogNear, options.fogFar);
  scene.background = new THREE.Color(options.finalBackgroundColor);
}

export function createMainLights(scene) {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  scene.add(ambientLight);

  const sunLight = new THREE.DirectionalLight(0xffffff, 0.4);
  sunLight.position.set(30, 50, 30);
  sunLight.castShadow = false;
  scene.add(sunLight);

  const torchLight = new THREE.PointLight(0xffc46b, 0, 14, 2);
  torchLight.visible = false;
  scene.add(torchLight);

  return {
    ambientLight,
    sunLight,
    torchLight,
  };
}

export function createMainCamera() {
  return new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    500
  );
}

export function createMainRenderer() {
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  syncMainViewport(renderer, createMainCameraViewportState());
  renderer.domElement.style.position = "fixed";
  renderer.domElement.style.inset = "0";
  renderer.domElement.style.zIndex = "0";
  return renderer;
}

export function createMainGridHelper() {
  const gridHelper = new THREE.GridHelper(200, 200);
  gridHelper.material.opacity = 0.25;
  gridHelper.material.transparent = true;
  return gridHelper;
}

export function createMainCameraViewportState() {
  return {
    width: window.innerWidth,
    height: window.innerHeight,
    pixelRatio: Math.min(window.devicePixelRatio, 2),
  };
}

export function syncMainViewport(renderer, viewportState) {
  renderer.setSize(viewportState.width, viewportState.height);
  renderer.setPixelRatio(viewportState.pixelRatio);
}

export function syncMainCameraAspect(camera, viewportState) {
  camera.aspect = viewportState.width / viewportState.height;
  camera.updateProjectionMatrix();
}
