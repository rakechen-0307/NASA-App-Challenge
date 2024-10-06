import * as THREE from "three";
// three.js

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare';

import { LENSFLARE0_URL, LENSFLARE1_URL, PLANET_URLS, STATIONS, WORLD_URL } from "../../constants";
import { PolarPosition, Planet } from "../../types/Three";

// postprocessing for three.js

// import { GridHelper } from "./Helper/GridHelper";

// import Stats from "three/examples/jsm/libs/stats.module";
// performance monitor

// import { Dancer } from "./ThreeComponents";
// components

import Controls from "./Controls";
// controls to control the scene

// import Settings from "./Settings";
import { PolarToCartesian } from "./utils";


/**
 * Control the dancers (or other light objects)'s status and pos
 * @constructor
 */
class ThreeController {
  canvas?: HTMLElement;
  container?: HTMLElement;

  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;

  scene: THREE.Scene;
  composer: EffectComposer;
  clock: THREE.Clock;

  height: number;
  width: number;

  planet: THREE.Mesh;
  PLANET_RADIUS: number = 2;
  STATION_RADIUS: number = 0.03;

  light: THREE.DirectionalLight;
  // flareLight: THREE.PointLight;
  lightPosition: PolarPosition;

  controls: Controls;
  // settings: Settings;

  isPlaying: boolean;
  initialized: boolean;

  stations: THREE.Mesh[] = [];

  currentPlanetType: Planet;

  rotationMatrix: THREE.Matrix4;
  rotationAxis: THREE.Vector3;

  constructor() {
    // Configuration of the scene
    this.height = 100;
    this.width = 200;

    // Basic attributes for three.js
    this.renderer = this.generateRenderer();
    this.camera = this.generateCamera();
    this.scene = this.generateScene();
    this.composer = this.generateComposer();
    this.clock = new THREE.Clock();

    this.light = this.generateLight();
    // this.flareLight = this.generateLensflareLight(this.light);

    this.lightPosition = { radius: 0, phi: 0, theta: 0 };
    this.updateLightPosition(
      {
        radius: 1500,
        phi: Math.PI / 2 * 2.2,
        theta: Math.PI / 2 * 0.6,
      }
    );

    this.currentPlanetType = Planet.MOON; // Initialize with default planet type
    this.planet = this.generatePlanet(this.currentPlanetType);

    // Initialize controls after the renderer is set up
    this.controls = this.generateControl();
    // this.settings = new Settings(this);

    // Data and status for playback
    this.isPlaying = false;

    // record the return id of requestAnimationFrame
    this.initialized = false;

    this.rotationAxis = new THREE.Vector3(1, 1, -0.3).normalize(); // Default rotation around the y-axis
    this.rotationMatrix = new THREE.Matrix4();
    this.rotationMatrix.makeRotationAxis(this.rotationAxis, -0.01);
    this.offsetPlanetAxis(this.planet);
  }

  triggerQuake(amplitude: number, profile: number[], upsample: number, downsample: number) {
    this.controls.quakeControls.trigger(amplitude, profile, upsample, downsample);
  }

  triggerRandomQuake(amplitude: number, length: number, upsample: number, decay: number = 0.0) {
    this.controls.quakeControls.triggerRandom(amplitude, length, upsample, decay);
  }

  triggerUpdatePlanetType(transitionCycle0: number, transitionCycle1: number, planet: Planet) {
    this.currentPlanetType = planet;
    this.controls.switchPlanet.trigger(transitionCycle0, transitionCycle1, planet);
  }

  /**
   * Initiate localStorage, threeApp, dancers
   */
  init(canvas: HTMLElement, container: HTMLElement) {
    // canvas: for 3D rendering, container: for performance monitor
    this.canvas = canvas;
    this.container = container;

    // Set canvas size
    const { width, height } = container.getBoundingClientRect();
    this.width = width;
    this.height = height;
    this.renderer.setSize(this.width, this.height);

    THREE.Cache.enabled = true;

    // Initialization of 3D renderer
    this.renderer = this.generateRenderer();

    // Postprocessing for anti-aliasing effect
    this.composer = this.generateComposer();

    // Initialize controls after the renderer is set up
    this.controls = this.generateControl();

    // Append the canvas to given ref
    this.canvas.appendChild(this.renderer.domElement);

    // Start rendering
    this.animate();
    this.renderer.render(this.scene, this.camera);

    // this.enablePMREM();
  }

  generateControl() {
    return new Controls(this);
  }

  generateRenderer() {
    // Set best configuration for different monitor devices
    const pixelRatio = window.devicePixelRatio;

    // Initialization of 3D renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: "high-performance",
    });

    renderer.setPixelRatio(pixelRatio);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    // renderer.outputEncoding = THREE.sRGBEncoding;

    return renderer;
  }

  generateScene() {
    // Add a background scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000000);
    return scene;
  }

  updateLightPosition(pos: PolarPosition) {
    const { radius, phi, theta } = pos;

    this.lightPosition = { radius, phi, theta };
    const lightPosition = PolarToCartesian(this.lightPosition);

    this.light.position.set(lightPosition.x, lightPosition.y, lightPosition.z);
    // this.flareLight.position.set(lightPosition.x, lightPosition.y, lightPosition.z);
  }

  generateLensflareLight(light: THREE.DirectionalLight) {
    const lightColor = light.color;

    const flareLight = new THREE.PointLight(0xffffff, 1.5, 2000, 0);
    flareLight.color.setRGB(lightColor.r, lightColor.g, lightColor.b);
    flareLight.position.set(light.position.x, light.position.y, light.position.z);
    this.scene.add(flareLight);

    const textureLoader = new THREE.TextureLoader();
    const sourceTexture = textureLoader.load(LENSFLARE0_URL);
    const flareTexture = textureLoader.load(LENSFLARE1_URL);

    const lensflare = new Lensflare();
    lensflare.addElement(new LensflareElement(sourceTexture, 300, 0, flareLight.color));
    lensflare.addElement(new LensflareElement(flareTexture, 60, 0.6));
    lensflare.addElement(new LensflareElement(flareTexture, 70, 0.7));
    lensflare.addElement(new LensflareElement(flareTexture, 120, 0.9));
    lensflare.addElement(new LensflareElement(flareTexture, 70, 1));
    flareLight.add(lensflare);

    return flareLight;
  }

  generateLight() {
    // Add a dim ambient light for overall illumination
    // const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    // this.scene.add(ambientLight);

    // Add a stronger directional light to create shadows and highlights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    // directionalLight.position.set(lightPosition.x, lightPosition.y, lightPosition.z);
    this.scene.add(directionalLight);

    return directionalLight;
  }

  // enablePMREM() {
  //   const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
  //   pmremGenerator.compileEquirectangularShader();

  //   this.scene.traverse((child) => {
  //     // @ts-ignore
  //     if (child.isMesh) {
  //       // @ts-ignore
  //       child.material.envMapIntensity = 1 - this.light.intensity;
  //     }
  //   });
  // }

  generateCamera() {
    const fov = 75;
    const aspect = this.width / this.height;
    const near = 0.1;
    const far = 100000;

    const camera = new THREE.PerspectiveCamera(fov, aspect, near, far);
    camera.position.set(9, 0, 0);

    camera.aspect = this.width / this.height;
    camera.updateProjectionMatrix();
    return camera;
  }

  generateComposer() {
    const size = this.renderer.getDrawingBufferSize(new THREE.Vector2());
    const renderTarget = new THREE.WebGLRenderTarget(size.width, size.height, {
      minFilter: THREE.LinearFilter,
      magFilter: THREE.LinearFilter,
      format: THREE.RGBAFormat,
      type: THREE.FloatType,
      samples: 4,
    });

    const composer = new EffectComposer(this.renderer, renderTarget);

    // default render pass for post processing
    const renderPass = new RenderPass(this.scene, this.camera);
    composer.addPass(renderPass);

    return composer;
  }

  updatePlanetMaterial(planetType: Planet) {
    // Update the current planet type
    this.currentPlanetType = planetType;
    const newPlanet = this.generatePlanet(planetType);
    this.scene.add(newPlanet);
    this.scene.remove(this.planet);

    this.planet = newPlanet;
    this.offsetPlanetAxis(this.planet);

    this.controls.updatePlanet(this.planet);

    // Update station positions
    this.updateStationPositions();
  }

  updateStationPositions() {
    this.stations.forEach((station, index) => {
      const { longitude, latitude } = STATIONS[this.currentPlanetType][index].position;
      const position = this.calculateStationPosition(this.PLANET_RADIUS, this.STATION_RADIUS, longitude, latitude);
      station.position.set(position.x, position.y, position.z);
    });
  }
  
  offsetPlanetAxis(planet: THREE.Mesh) {
    const initialPosition = new THREE.Vector3(0, 1, 0);
    const offsetAxis = new THREE.Vector3();
    offsetAxis.crossVectors(new THREE.Vector3(0, 1, 0), this.rotationAxis);
    offsetAxis.normalize();

    const angle = Math.acos(initialPosition.dot(this.rotationAxis) / (initialPosition.length() * this.rotationAxis.length()));

    const rotationMatrix = new THREE.Matrix4();
    rotationMatrix.makeRotationAxis(offsetAxis, angle);
    planet.applyMatrix4(rotationMatrix);
  }

  generatePlanet(planetType: Planet) {
    const geometry = new THREE.SphereGeometry(this.PLANET_RADIUS, 500, 500);

    const textureLoader = new THREE.TextureLoader();
    let texture = textureLoader.load(PLANET_URLS.moon.texture);

    if (planetType === Planet.MOON) {
      texture = textureLoader.load(PLANET_URLS.moon.texture);
    } else if (planetType === Planet.MARS) {
      texture = textureLoader.load(PLANET_URLS.mars.texture);
    }

    const material = new THREE.MeshPhongMaterial({
      color: 0xffffff,
      map: texture,
      reflectivity: 0,
      shininess: 0
    });

    const planet = new THREE.Mesh(geometry, material);

    this.scene.add(planet);
    // this.addStations(planetType, planet);

    return planet;
  }

  addStations(planetType: Planet, planet: THREE.Mesh) {
    const stations = STATIONS[planetType];
    this.stations.forEach(station => planet.remove(station));
    this.stations = [];

    stations.forEach(station => {
      const { longitude, latitude } = station.position;
      const stationMesh = this.createStationMesh();
      const position = this.calculateStationPosition(this.PLANET_RADIUS, this.STATION_RADIUS, longitude, latitude);
      stationMesh.position.set(position.x, position.y, position.z);
      planet.add(stationMesh); // Add station as a child of the planet
      this.stations.push(stationMesh);
    });
  }

  createStationMesh() {
    const geometry = new THREE.SphereGeometry(this.STATION_RADIUS, 32, 32);
    const material = new THREE.MeshPhongMaterial({
      color: 0x5f718b,
      shininess: 100,
      emissive: 0x5f718b,
      emissiveIntensity: 0.2
    });
    return new THREE.Mesh(geometry, material);
  }

  calculateStationPosition(planetRadius: number, stationRadius: number, longitude: number, latitude: number) {
    const floatDistance = 0.01; // Distance above the planet's surface
    const radius = planetRadius + stationRadius + floatDistance; // New radius for floating effect

    const phi = (90 - latitude) * (Math.PI / 180);
    const theta = (longitude + 180) * (Math.PI / 180);

    const x = -radius * Math.sin(phi) * Math.cos(theta);
    const y = radius * Math.cos(phi);
    const z = radius * Math.sin(phi) * Math.sin(theta);

    return new THREE.Vector3(x, y, z);
  }

  generateWorld() {
    const textureLoader = new THREE.TextureLoader();
    const worldTexture = textureLoader.load(WORLD_URL);

    const worldGeometry = new THREE.SphereGeometry(3000, 300, 300);
    const worldMaterial = new THREE.MeshBasicMaterial(
      {
        color: 0x000000,
        map: worldTexture,
        side: THREE.BackSide
      }
    );

    const world = new THREE.Mesh(worldGeometry, worldMaterial);
    this.scene.add(world);

    return world;
  }

  // Return true if all the dancer is successfully initialized
  isInitialized() {
    if (!this.initialized) {
      this.initialized = true;
    }
    return this.initialized;
  }

  updateCameraOffset(width: number, height: number) {
    const aspect = width / height;
    const centorPivot = new THREE.Vector2(58.0, 55.0);
    const corner = new THREE.Vector2(0.0, 0.0);

    if (aspect > centorPivot.x / centorPivot.y) {
      corner.y = centorPivot.y - centorPivot.x / aspect;
    } else {
      corner.x = centorPivot.x - centorPivot.y * aspect;
    }

    this.camera.setViewOffset(
      100, 100,
      corner.x, corner.y,
      centorPivot.x - corner.x, centorPivot.y - corner.y
    );
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();

    this.composer.setSize(width, height);
    this.renderer.setSize(width, height);
    this.composer?.setPixelRatio(window.devicePixelRatio);

    this.updateCameraOffset(width, height);
  }

  update() {
    // Apply the rotation matrix to the planet
    this.planet.applyMatrix4(this.rotationMatrix);
    this.controls.update();
  }

  // a recursive function to render each new frame
  animate() {
    if (this.isInitialized()) {
      this.update();
    }

    this.composer.render();
    requestAnimationFrame(() => {
      this.animate();
    });
  }

  // change isPlaying status

  setIsPlaying(isPlaying: boolean) {
    this.isPlaying = isPlaying;
  }

  // render current scene and dancers
  render() {
    if (!this.isPlaying) this.composer.renderer.render(this.scene, this.camera);
    else this.renderer?.render(this.scene, this.camera);
  }
}

export default ThreeController;

export const threeController = new ThreeController();