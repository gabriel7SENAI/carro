import * as THREE from "three";
import { createCelta } from "./celta.js";
import { loadAudi } from "./audi.js";
import { createLesson } from "./lesson.js";
import { loadEngine } from "./engine.js";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const host = document.querySelector("#scene");
const loading = document.querySelector("#loading");
const scene = new THREE.Scene();
scene.background = new THREE.Color("#111923");
scene.fog = new THREE.Fog("#111923", 13, 28);

const camera = new THREE.PerspectiveCamera(34, 1, 0.1, 100);
camera.position.set(4.1, 2.35, 4.9);

const renderer = new THREE.WebGLRenderer({
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
const pmrem = new THREE.PMREMGenerator(renderer);
const studio = new RoomEnvironment();
scene.environment = pmrem.fromScene(studio, 0.045).texture;
studio.dispose();
pmrem.dispose();
host.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.06;
controls.target.set(0, 0.95, 0);
controls.minDistance = 3.4;
controls.maxDistance = 12;
controls.maxPolarAngle = Math.PI * 0.48;
controls.minPolarAngle = Math.PI * 0.19;
controls.autoRotate = false;
controls.autoRotateSpeed = 0.65;

scene.add(new THREE.HemisphereLight(0xe5edf5, 0x30333a, 1.1));
const keyLight = new THREE.DirectionalLight(0xfff2e4, 2.5);
keyLight.position.set(5, 8, 5);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(2048, 2048);
keyLight.shadow.normalBias = 0.012;
keyLight.shadow.radius = 3;
keyLight.shadow.bias = -0.0002;
keyLight.shadow.camera.left = -3;
keyLight.shadow.camera.right = 3;
keyLight.shadow.camera.top = 3;
keyLight.shadow.camera.bottom = -3;
scene.add(keyLight);
const fillLight = new THREE.DirectionalLight(0xd2e1ff, 1.0);
fillLight.position.set(-5, 4, -4);
scene.add(fillLight);
const rimLight = new THREE.PointLight(0xf2f6ff, 9, 12, 2);
rimLight.position.set(0, 3, -4);
scene.add(rimLight);
const frontLight = new THREE.PointLight(0xe2f0ff, 3, 7, 2);
frontLight.position.set(0, 1.6, 5);
scene.add(frontLight);

const celta = createCelta();
const car = new THREE.Group();
car.add(celta.car);
let paintMaterials = [celta.body],
  lampMaterials = [celta.lamp];
let selectedColor = document.querySelector(".swatch.active").dataset.color;
let audi;
let lesson;
let engine;
scene.add(car);
function mesh(
  geometry,
  material,
  parent = scene,
  position = [0, 0, 0],
  rotation = [0, 0, 0]
) {
  const m = new THREE.Mesh(geometry, material);
  m.position.set(...position);
  m.rotation.set(...rotation);
  m.castShadow = true;
  m.receiveShadow = true;
  parent.add(m);
  return m;
}

// Subtle ground platform and shadow catcher.
const floorMat = new THREE.MeshStandardMaterial({
  color: "#111923",
  roughness: 0.78,
  metalness: 0.12,
});
const floor = mesh(
  new THREE.PlaneGeometry(200, 200),
  floorMat,
  scene,
  [0, 0.07, 0],
  [-Math.PI / 2, 0, 0]
);
floor.receiveShadow = true;
floor.castShadow = false;
const platform = mesh(
  new THREE.CylinderGeometry(2.8, 2.84, 0.12, 96),
  new THREE.MeshStandardMaterial({
    color: "#242b34",
    metalness: 0.15,
    roughness: 0.7,
  }),
  scene,
  [0, 0.13, 0]
);
platform.castShadow = true;
platform.receiveShadow = true;
const ring = mesh(
  new THREE.TorusGeometry(2.68, 0.008, 5, 96),
  new THREE.MeshStandardMaterial({
    color: "#4d6073",
    metalness: 0.6,
    roughness: 0.3,
  }),
  scene,
  [0, 0.195, 0],
  [-Math.PI / 2, 0, 0]
);

let headlightsOn = true;
let autoRotate = false;
const headlightBeams = [];
for (const x of [-0.56, 0.56]) {
  const light = new THREE.SpotLight(0xeaf3ff, 12, 7, Math.PI / 7, 0.55, 1.5);
  light.position.set(x, 0.86, 1.91);
  light.target.position.set(x * 1.1, 0.55, 5.8);
  car.add(light);
  car.add(light.target);
  headlightBeams.push(light);
}
function resize() {
  const w = host.clientWidth || 600,
    h = host.clientHeight || 400;
  renderer.setSize(w, h, false);
  camera.aspect = w / h;
  camera.updateProjectionMatrix();
}
window.addEventListener("resize", resize);
resize();
const modelSelect = document.querySelector("#modelSelect");
function selectModel(value) {
  lesson?.cancel();
  const isAudi = value === "audi" && audi;
  celta.car.visible = !isAudi;
  if (audi) audi.car.visible = !!isAudi;
  paintMaterials = isAudi ? audi.paintMaterials : [celta.body];
  lampMaterials = isAudi ? audi.lampMaterials : [celta.lamp];
  paintMaterials.forEach((m) => m.color.set(selectedColor));
  lampMaterials.forEach((m) => (m.emissiveIntensity = headlightsOn ? 0.35 : 0));
  headlightBeams.forEach((light) => {
    light.position.set(
      Math.sign(light.position.x) * (isAudi ? 0.66 : 0.56),
      isAudi ? 0.9 : 0.86,
      isAudi ? 2.02 : 1.91
    );
  });
  document.querySelector("#modelName").innerHTML = isAudi
    ? "Audi S3.<br /><span>Limousine.</span>"
    : "Celta.<br /><span>2005.</span>";
  document.querySelector("#modelDescription").textContent = isAudi
    ? "Modelo GLB de teste com texturas e interior. Explore o Audi S3 em 360° e experimente as cores e a iluminação."
    : "Carroceria de duas portas inspirada no Celta 2005. Explore o modelo em 360°.";
  document.querySelector("#modelNote").textContent = isAudi
    ? engine
      ? "V8 twin-turbo instalado para demonstração visual. Montagem fictícia: não é o motor original do Audi. Abra o capô para explorar."
      : "Motor detalhado indisponível. A atividade usa peças simplificadas."
    : "Modelo procedural inspirado nas referências do Chevrolet Celta 2005.";
  document.querySelector("#bodyType").textContent = isAudi ? "SEDAN" : "HATCH";
  document.querySelector("#modelVersion").textContent = isAudi ? "8V" : "2005";
  host.setAttribute(
    "aria-label",
    isAudi
      ? "Visualizador 3D do Audi S3 Limousine"
      : "Visualizador 3D do Celta 2005"
  );
  loading.textContent = "CENA PRONTA";
  for (const key of ["hood", "trunk"])
    document.querySelector(`#${key}Btn`).disabled = !isAudi || !audi.parts[key];
  document.querySelector("#lesson").hidden = !isAudi || !lesson;
}
for (const [key, label] of [
  ["hood", "CAPÔ"],
  ["trunk", "PORTA-MALAS"],
]) {
  document.querySelector(`#${key}Btn`).addEventListener("click", (event) => {
    const part = audi?.parts[key];
    if (!part || modelSelect.value !== "audi") return;
    part.open = !part.open;
    event.currentTarget.setAttribute("aria-pressed", String(part.open));
    event.currentTarget.textContent = `${
      part.open ? "FECHAR" : "ABRIR"
    } ${label}`;
  });
}
modelSelect.addEventListener("change", () => selectModel(modelSelect.value));
modelSelect.disabled = true;
loading.textContent = "CARREGANDO AUDI…";
loadAudi((progress) => {
  loading.textContent = progress.total
    ? `CARREGANDO AUDI ${Math.round((progress.loaded / progress.total) * 100)}%`
    : "CARREGANDO AUDI…";
})
  .then(async (model) => {
    audi = model;
    car.add(audi.car);
    loading.textContent = "CARREGANDO MOTOR V8…";
    try {
      engine = await loadEngine();
      car.add(engine);
    } catch (error) {
      console.warn(
        "Motor V8 indisponível; usando representação simples.",
        error
      );
    }
    lesson = createLesson({
      parent: car,
      camera,
      controls,
      canvas: renderer.domElement,
      audi,
      engine,
      stopSpin() {
        autoRotate = false;
        controls.autoRotate = false;
        const button = document.querySelector("#spinBtn");
        button.setAttribute("aria-pressed", "false");
        button.querySelector("b").textContent = "OFF";
      },
    });
    modelSelect.disabled = false;
    modelSelect.value = "audi";
    selectModel("audi");
  })
  .catch((error) => {
    console.error("Não foi possível carregar o Audi:", error);
    modelSelect.querySelector('[value="audi"]').disabled = true;
    modelSelect.disabled = false;
    modelSelect.value = "celta";
    selectModel("celta");
    loading.textContent = "FALHA NO GLB · CELTA DISPONÍVEL";
  });

document.querySelectorAll(".swatch").forEach((btn) => {
  btn.addEventListener("click", () => {
    document
      .querySelectorAll(".swatch")
      .forEach((b) => b.classList.remove("active"));
    btn.classList.add("active");
    selectedColor = btn.dataset.color;
    paintMaterials.forEach((m) => m.color.set(selectedColor));
  });
});
document.querySelector("#lightsBtn").addEventListener("click", (e) => {
  headlightsOn = !headlightsOn;
  headlightBeams.forEach((l) => (l.visible = headlightsOn));
  lampMaterials.forEach((m) => (m.emissiveIntensity = headlightsOn ? 0.35 : 0));
  e.currentTarget.setAttribute("aria-pressed", String(headlightsOn));
  e.currentTarget.querySelector("b").textContent = headlightsOn ? "ON" : "OFF";
});
document.querySelector("#spinBtn").addEventListener("click", (e) => {
  autoRotate = !autoRotate;
  controls.autoRotate = autoRotate;
  e.currentTarget.setAttribute("aria-pressed", String(autoRotate));
  e.currentTarget.querySelector("b").textContent = autoRotate ? "ON" : "OFF";
});
document.querySelector("#resetBtn").addEventListener("click", () => {
  lesson?.cancel();
  camera.position.set(4.1, 2.35, 4.9);
  controls.target.set(0, 0.95, 0);
  controls.update();
  controls.autoRotate = false;
  autoRotate = false;
  const b = document.querySelector("#spinBtn");
  b.setAttribute("aria-pressed", "false");
  b.querySelector("b").textContent = "OFF";
});

const animationClock = new THREE.Clock();
function animate() {
  requestAnimationFrame(animate);
  const dt = Math.min(animationClock.getDelta(), 0.05);
  lesson?.update(dt);
  if (engine)
    engine.visible =
      !!audi?.car.visible &&
      (!!audi.parts.hood.open ||
        Math.abs(audi.parts.hood.pivot.rotation.x) > 0.08);
  if (audi)
    for (const part of Object.values(audi.parts))
      part.pivot.rotation.x = THREE.MathUtils.damp(
        part.pivot.rotation.x,
        part.open ? part.angle : 0,
        7,
        dt
      );
  controls.update();
  renderer.render(scene, camera);
}
animate();
