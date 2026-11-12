// Renderiza retratos de las criaturas a imágenes (para tarjetas y HUD).
import * as THREE from 'three';
import { buildCreature, animateCreature } from './creatures.js';

let r, scene, cam;
const cache = new Map();

export function portrait(species, stage = 1) {
  const key = species + stage;
  if (cache.has(key)) return cache.get(key);
  if (!r) {
    r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setSize(160, 160);
    r.outputColorSpace = THREE.SRGBColorSpace;
    scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x667744, 1.4));
    const d = new THREE.DirectionalLight(0xffffff, 2.2);
    d.position.set(2, 4, 5);
    scene.add(d);
    cam = new THREE.PerspectiveCamera(30, 1, 0.1, 50);
  }
  const g = buildCreature(species, stage, false);
  animateCreature(g, 0.3, false, 0);
  g.rotation.y = -0.45;
  scene.add(g);
  const box = new THREE.Box3().setFromObject(g);
  const c = box.getCenter(new THREE.Vector3());
  const size = box.getSize(new THREE.Vector3()).length();
  cam.position.set(c.x, c.y + size * 0.25, c.z + size * 1.75);
  cam.lookAt(c);
  r.render(scene, cam);
  const url = r.domElement.toDataURL('image/png');
  scene.remove(g);
  cache.set(key, url);
  return url;
}
