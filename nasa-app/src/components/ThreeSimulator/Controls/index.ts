import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import QuakeControls from "./Quake";

class Controls {
  renderer: THREE.WebGLRenderer;
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  planet: THREE.Mesh;

  domElement: HTMLElement;

  orbitControls: OrbitControls;
  quakeControls: QuakeControls;

  constructor(
    renderer: THREE.WebGLRenderer,
    scene: THREE.Scene,
    camera: THREE.PerspectiveCamera,
    planet: THREE.Mesh
  ) {
    this.renderer = renderer;
    this.scene = scene;
    this.camera = camera;
    this.planet = planet;
    this.domElement = renderer.domElement;

    this.orbitControls = this.initOrbitControls();
    this.quakeControls = this.initQuakeControls();
  }

  initOrbitControls() {
    const orbitControls = new OrbitControls(this.camera, this.domElement);

    orbitControls.enablePan = false;
    orbitControls.enableZoom = false;
    orbitControls.enableRotate = true;
    orbitControls.screenSpacePanning = true;
    // Smooth camera movement
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;

    orbitControls.target.set(0, 0, 0);
    orbitControls.update();

    return orbitControls;
  }

  initQuakeControls() {
    const quakeControls = new QuakeControls(this.planet);
    return quakeControls;
  }

  update() {
    this.orbitControls.update();
    this.quakeControls.update();
  }
}

export default Controls;
