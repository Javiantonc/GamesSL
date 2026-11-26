// Retratos de los héroes (renderizados una vez a imagen).
import * as THREE from 'three';
import { buildHumanoid, LOOKS } from './world/models.js';

let r, scene, cam;
const cache = new Map();

export function heroPortrait(cls, full = false) {
  const key = cls + full;
  if (cache.has(key)) return cache.get(key);
  if (!r) {
    r = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    r.setSize(256, 256);
    r.outputColorSpace = THREE.SRGBColorSpace;
    scene = new THREE.Scene();
    scene.add(new THREE.HemisphereLight(0xffffff, 0x556677, 1.5));
    const d = new THREE.DirectionalLight(0xffffff, 2.4);
    d.position.set(2, 4, 6);
    scene.add(d);
    cam = new THREE.PerspectiveCamera(28, 1, 0.1, 50);
  }
  const m = buildHumanoid(LOOKS[cls]);
  m.rotation.y = -0.35;
  scene.add(m);
  if (full) { cam.position.set(0, 1.9, 8.2); cam.lookAt(0, 1.55, 0); }
  else { cam.position.set(0, 2.55, 2.9); cam.lookAt(0, 2.38, 0); }
  r.render(scene, cam);
  const url = r.domElement.toDataURL('image/png');
  scene.remove(m);
  cache.set(key, url);
  return url;
}
