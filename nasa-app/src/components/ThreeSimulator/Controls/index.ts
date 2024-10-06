import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import QuakeControls from "./Quake";
import SwitchPlanet from "./SwitchPlanet";
import ThreeController from "../ThreeController";

class Controls {
  controller: ThreeController;

  orbitControls: OrbitControls;
  quakeControls: QuakeControls;
  switchPlanet: SwitchPlanet;

  constructor(
    controller: ThreeController,
  ) {
    this.controller = controller;

    this.orbitControls = this.initOrbitControls();
    this.quakeControls = this.initQuakeControls();
    this.switchPlanet = this.initSwitchPlanet(controller);
  }

  initOrbitControls() {
    const orbitControls = new OrbitControls(this.controller.camera, this.controller.renderer.domElement);

    orbitControls.enablePan = false;
    orbitControls.enableZoom = false;
    orbitControls.enableRotate = false;
    orbitControls.screenSpacePanning = true;
    // Smooth camera movement
    orbitControls.enableDamping = true;
    orbitControls.dampingFactor = 0.05;

    orbitControls.target.set(0, 0, 0);
    orbitControls.update();

    return orbitControls;
  }

  initQuakeControls() {
    const quakeControls = new QuakeControls(this.controller.planet);
    return quakeControls;
  }

  initSwitchPlanet(controller: ThreeController) {
    const switchPlanet = new SwitchPlanet(controller);
    return switchPlanet;
  }

  updatePlanet(planet: THREE.Mesh) {
    this.quakeControls.planet = planet;
  }

  update() {
    this.orbitControls.update();
    this.quakeControls.update();
    this.switchPlanet.update();
  }
}

export default Controls;
