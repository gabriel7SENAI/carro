import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

// Intentionally simplified teaching props, not an Audi service diagram.
export function createLesson({
  parent,
  camera,
  controls,
  canvas,
  audi,
  engine,
  stopSpin,
}) {
  const group = new THREE.Group();
  group.name = "EducationalEngine";
  group.visible = false;
  parent.add(group);
  const targets = [];
  function block(name, size, position, color, target) {
    const material = new THREE.MeshStandardMaterial({
      color,
      roughness: 0.55,
      metalness: 0.15,
    });
    const mesh = new THREE.Mesh(
      new RoundedBoxGeometry(...size, 3, 0.018),
      material
    );
    mesh.position.set(...position);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData.part = target || name;
    mesh.name = name;
    group.add(mesh);
    targets.push(mesh);
    return mesh;
  }
  if (!engine) {
    block("Bandeja do cofre", [1.35, 0.07, 0.94], [0, 1.005, 1.38], "#20262a");
    block("Motor", [0.58, 0.16, 0.58], [-0.13, 1.12, 1.38], "#343c43");
    for (let i = 0; i < 4; i++)
      block(
        "Nervura do motor",
        [0.035, 0.018, 0.41],
        [-0.32 + i * 0.12, 1.21, 1.38],
        "#7b858b",
        "Motor"
      );
  } else {
    engine.traverse((object) => {
      if (object.isMesh) {
        object.userData.part = "Motor V8";
        targets.push(object);
      }
    });
  }
  block("Bateria", [0.25, 0.16, 0.32], [-0.53, 1.12, 1.1], "#11171e");
  block(
    "Terminal positivo",
    [0.045, 0.025, 0.045],
    [-0.58, 1.21, 1.05],
    "#d24b45",
    "Bateria"
  );
  block(
    "Caixa do filtro de ar",
    [0.39, 0.13, 0.49],
    [0.46, 1.09, 1.48],
    "#252b31"
  );
  const filter = block(
    "Filtro de ar",
    [0.32, 0.055, 0.4],
    [0.46, 1.18, 1.48],
    "#b9955d",
    "filter"
  );
  const folds = [];
  for (let i = 0; i < 15; i++)
    folds.push(
      block(
        "Dobra do filtro",
        [0.014, 0.025, 0.35],
        [0.32 + i * 0.02, 1.215, 1.48],
        "#e6d5ac",
        "filter"
      )
    );
  const lid = block(
    "Tampa do filtro",
    [0.4, 0.065, 0.5],
    [0.46, 1.25, 1.48],
    "#303940",
    "lid"
  );
  const clips = [-1, 1].map((s) =>
    block(
      "Presilha da tampa",
      [0.035, 0.045, 0.065],
      [0.46 + s * 0.205, 1.245, 1.48],
      "#a9b6be",
      "lid"
    )
  );
  const tube = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.29, 24),
    new THREE.MeshStandardMaterial({ color: "#161b20", roughness: 0.8 })
  );
  tube.rotation.z = Math.PI / 2;
  tube.position.set(0.15, 1.12, 1.56);
  group.add(tube);
  let stage = 0,
    active = false;
  let previousCamera, previousTarget, previousMinDistance;
  const status = document.querySelector("#lessonStatus"),
    feedback = document.querySelector("#lessonFeedback");
  const button = document.querySelector("#lessonAction"),
    reset = document.querySelector("#lessonReset");
  const instructions = [
    "Abra uma atividade curta para conhecer o filtro de ar.",
    "1 de 4 · Localize a tampa destacada e clique nela para soltar as presilhas e abrir.",
    "2 de 4 · Clique no filtro de ar para retirá-lo da caixa.",
    "3 de 4 · Instale um filtro novo na caixa.",
    "4 de 4 · Recoloque a tampa e prenda as presilhas.",
    "Atividade concluída! Você trocou o filtro de ar na simulação.",
  ];
  const labels = [
    "COMEÇAR ATIVIDADE",
    "ABRIR TAMPA",
    "RETIRAR FILTRO",
    "INSTALAR FILTRO NOVO",
    "FECHAR TAMPA",
    "PRATICAR NOVAMENTE",
  ];
  function render() {
    status.textContent = instructions[stage];
    button.textContent = labels[stage];
    document.querySelector("#lessonProgress").value =
      stage === 5 ? 4 : Math.max(0, stage - 1);
    reset.hidden = !active;
    lid.material.emissive.set(
      stage === 1 || stage === 4 ? "#256e61" : "#000000"
    );
    filter.material.emissive.set(
      stage === 2 || stage === 3 ? "#795517" : "#000000"
    );
  }
  function start() {
    if (!active) {
      previousCamera = camera.position.clone();
      previousTarget = controls.target.clone();
      previousMinDistance = controls.minDistance;
    }
    active = true;
    stage = 1;
    group.visible = true;
    stopSpin();
    audi.parts.hood.open = true;
    document.querySelector("#hoodBtn").disabled = true;
    document.querySelector("#hoodBtn").textContent = "CAPÔ ABERTO · ATIVIDADE";
    document.querySelector("#hoodBtn").setAttribute("aria-pressed", "true");
    controls.minDistance = 1.2;
    controls.target.set(0, 1.12, 1.42);
    camera.position.set(2.0, 3.4, 3.4);
    controls.update();
    feedback.textContent =
      "O filtro ajuda a reter partículas do ar admitido pelo motor. As peças desta atividade são simplificadas.";
    render();
  }
  function action(part) {
    if (!active || stage === 5) {
      start();
      return;
    }
    const expected = stage === 1 || stage === 4 ? "lid" : "filter";
    if (part && part !== expected) {
      feedback.textContent =
        "Essa não é a peça desta etapa. Procure a peça destacada ou use o botão abaixo.";
      return;
    }
    stage++;
    feedback.textContent = [
      null,
      null,
      "Tampa aberta. Agora o filtro está acessível.",
      "Filtro retirado. Nesta simulação, a substituição é feita por um elemento novo.",
      "Filtro novo encaixado. Falta fechar a caixa.",
      "Tudo pronto! A caixa do filtro ficou fechada.",
    ][stage];
    render();
  }
  function cancel() {
    if (active) {
      camera.position.copy(previousCamera);
      controls.target.copy(previousTarget);
      controls.minDistance = previousMinDistance;
      controls.update();
    }
    active = false;
    stage = 0;
    group.visible = false;
    audi.parts.hood.open = false;
    const hood = document.querySelector("#hoodBtn");
    hood.disabled = !audi.car.visible;
    hood.textContent = "ABRIR CAPÔ";
    hood.setAttribute("aria-pressed", "false");
    feedback.textContent = "";
    render();
  }
  button.addEventListener("click", () => action());
  reset.addEventListener("click", cancel);
  const raycaster = new THREE.Raycaster(),
    pointer = new THREE.Vector2();
  let down;
  canvas.addEventListener("pointerdown", (e) => {
    down = [e.clientX, e.clientY];
  });
  canvas.addEventListener("pointerup", (e) => {
    if (
      !active ||
      stage === 5 ||
      !down ||
      Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 6
    )
      return;
    const rect = canvas.getBoundingClientRect();
    pointer.set(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      (-(e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(pointer, camera);
    const hit = raycaster.intersectObjects(
      targets.filter((o) => o.visible),
      false
    )[0];
    if (hit) action(hit.object.userData.part);
  });
  render();
  return {
    cancel,
    get active() {
      return active;
    },
    update(dt) {
      const open = active && stage >= 2 && stage < 5;
      lid.position.y = THREE.MathUtils.damp(
        lid.position.y,
        open ? 1.65 : 1.25,
        9,
        dt
      );
      lid.position.x = THREE.MathUtils.damp(
        lid.position.x,
        open ? 0.83 : 0.46,
        9,
        dt
      );
      clips.forEach((clip, i) => {
        clip.position.y = lid.position.y - 0.005;
        clip.position.x = lid.position.x + (i ? 1 : -1) * 0.205;
      });
      filter.visible = stage !== 3;
      folds.forEach((f) => (f.visible = filter.visible));
      const color = stage >= 4 ? "#e4c994" : "#b9955d";
      filter.material.color.set(color);
    },
  };
}
