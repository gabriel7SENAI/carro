import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

export async function loadEngine() {
  const gltf = await new GLTFLoader().loadAsync(
    new URL("../twin_turbo_6.0__v8_ls_engine_revised.glb", import.meta.url).href
  );
  const engine = new THREE.Group();
  engine.name = "TwinTurboV8Installation";
  const model = gltf.scene;
  engine.add(model);
  model.traverse((object) => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    // The supplied metal is mirror-smooth; soften it for readable studio reflections.
    for (const material of [object.material].flat()) {
      material.roughness = Math.max(0.26, material.roughness);
      material.envMapIntensity = 0.8;
    }
  });
  model.updateMatrixWorld(true);
  let bounds = new THREE.Box3().setFromObject(model);
  const size = bounds.getSize(new THREE.Vector3());
  model.scale.multiplyScalar(
    Math.min(0.96 / size.x, 0.87 / size.z, 0.62 / size.y)
  );
  model.updateMatrixWorld(true);
  bounds.setFromObject(model);
  const center = bounds.getCenter(new THREE.Vector3());
  model.position.add(new THREE.Vector3(-center.x, -bounds.max.y, -center.z));
  // World units shared with the normalized Audi; the filter box remains on the right.
  engine.position.set(-0.17, 1.12, 1.4);
  engine.visible = false;
  return engine;
}
