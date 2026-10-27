import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

export async function loadAudi(onProgress) {
  const gltf = await new GLTFLoader().loadAsync(new URL('../audi_s3_limousine_8v_separated.glb', import.meta.url).href, onProgress);
  const car = gltf.scene;
  const paintMaterials = new Set(), lampMaterials = new Set();
  car.traverse(object => {
    if (!object.isMesh) return;
    object.castShadow = true;
    object.receiveShadow = true;
    if (object.material?.name === 'BLACK' && object.geometry.index) {
      // Remove only the old flat under-hood filler, leaving the grille and trim intact.
      const geometry = object.geometry.clone();
      const positions = geometry.attributes.position;
      const indices = geometry.index.array;
      const kept = [];
      for (let i = 0; i < indices.length; i += 3) {
        let x=0, y=0, z=0;
        for (let j = 0; j < 3; j++) {
          const vertex = indices[i+j];
          x+=positions.getX(vertex)/3;y+=positions.getY(vertex)/3;z+=positions.getZ(vertex)/3;
        }
        const inside = Math.abs(x)<.70 && y>.55 && y<1.04 && z>.90 && z<2.04;
        if (!inside) kept.push(indices[i], indices[i+1], indices[i+2]);
      }
      geometry.setIndex(kept);
      object.geometry = geometry;
    }
    if (object.name.startsWith('Audi_') && object.geometry.index) {
      // Extracted parts share vertex buffers; bounds must use their own indices.
      const bounds = new THREE.Box3();
      const point = new THREE.Vector3();
      for (const index of object.geometry.index.array) bounds.expandByPoint(point.fromBufferAttribute(object.geometry.attributes.position, index));
      object.geometry.boundingBox = bounds;
      object.geometry.boundingSphere = bounds.getBoundingSphere(new THREE.Sphere());
    }
    for (const material of [object.material].flat()) {
      if (material.name === 'carpaint') {
        material.metalness = .55;
        material.roughness = .26;
        paintMaterials.add(material);
      }
      if (material.name === 'FLIGHTS') {
        material.emissive.set('#ffffff');
        material.emissiveMap = material.map;
        material.emissiveIntensity = .35;
        lampMaterials.add(material);
      }
    }
  });
  const parts = {};
  for (const [key, name, angle] of [['hood', 'Audi_Hood', -1.12], ['trunk', 'Audi_Trunk', 1.05]]) {
    const part = car.getObjectByName(name);
    if (!part) continue;
    const bounds = part.geometry.boundingBox;
    const pivot = new THREE.Group();
    pivot.name = `${name}_Hinge`;
    pivot.position.set(0, bounds.max.y, key === 'hood' ? bounds.min.z : bounds.max.z);
    part.parent.add(pivot);
    pivot.add(part);
    part.position.sub(pivot.position);
    part.material = part.material.clone();
    part.material.side = THREE.DoubleSide;
    paintMaterials.add(part.material);
    parts[key] = { pivot, angle, open: false };
  }
  // Retain the export's hierarchy and embedded textures, adjusting only its placement.
  car.updateMatrixWorld(true);
  const bounds = new THREE.Box3().setFromObject(car);
  const size = bounds.getSize(new THREE.Vector3());
  car.scale.multiplyScalar(4.2 / size.z);
  car.updateMatrixWorld(true);
  bounds.setFromObject(car);
  const center = bounds.getCenter(new THREE.Vector3());
  car.position.add(new THREE.Vector3(-center.x, .19 - bounds.min.y, -center.z));
  return { car, parts, paintMaterials: [...paintMaterials], lampMaterials: [...lampMaterials] };
}
