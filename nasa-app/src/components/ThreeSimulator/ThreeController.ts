import * as THREE from "three";
// three.js

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare';

import { LENSFLARE0_URL, LENSFLARE1_URL, PLANET_URLS, WORLD_URL } from "../../constants";
import { PolarPosition, Planet } from "../../types/Three";

// postprocessing for three.js

// import { GridHelper } from "./Helper/GridHelper";

// import Stats from "three/examples/jsm/libs/stats.module";
// performance monitor

// import { Dancer } from "./ThreeComponents";
// components

import Controls from "./Controls";
// controls to control the scene

import Settings from "./Settings";
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
  // world: THREE.Mesh;

  light: THREE.DirectionalLight;
  // flareLight: THREE.PointLight;
  lightPosition: PolarPosition;

  controls: Controls;
  // settings: Settings;

  isPlaying: boolean;
  initialized: boolean;

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

    this.planet = this.generatePlanet(Planet.MOON);

    // Initialize controls after the renderer is set up
    this.controls = this.generateControl();
    // this.settings = new Settings(this);

    // Data and status for playback
    this.isPlaying = false;

    // record the return id of requestAnimationFrame
    this.initialized = false;
  }

  triggerQuake(amplitude: number, profile: number[], upsample: number, downsample: number) {
    this.controls.quakeControls.trigger(amplitude, profile, upsample, downsample);
  }

  triggerRandomQuake(amplitude: number, length: number, upsample: number, decay: number = 0.0) {
    this.controls.quakeControls.triggerRandom(amplitude, length, upsample, decay);
  }

  triggerUpdatePlanetMaterial(transitionCycle0: number, transitionCycle1: number, planet: Planet) {
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
    // console.log("updatePlanetMaterial", planetType);
    const newPlanet = this.generatePlanet(planetType);
    this.scene.add(newPlanet);
    this.scene.remove(this.planet);
    this.planet = newPlanet;
    this.controls.updatePlanet(this.planet);
  }

  generatePlanet(planetType: Planet) {
    const geometry = new THREE.SphereGeometry(2, 500, 500);

    const textureLoader = new THREE.TextureLoader();
    let texture = textureLoader.load(PLANET_URLS.moon.texture);
    // const displacementMap = textureLoader.load(PLANET_URLS.moon.displacement);

    if (planetType === Planet.MOON) {
      texture = textureLoader.load(PLANET_URLS.moon.texture);
    } else if (planetType === Planet.MARS) {
      texture = textureLoader.load(PLANET_URLS.mars.texture);
    }

    const material = new THREE.MeshPhongMaterial(
      {
        color: 0xffffff,
        map: texture,
        // displacementMap: displacementMap,
        // displacementScale: 0.16,
        // bumpMap: displacementMap,
        // bumpScale: 0.20,
        reflectivity: 0,
        shininess: 0
      }
    );

    const planet = new THREE.Mesh(geometry, material);
    this.scene.add(planet);

    return planet;
  }

  generateWorld() {
    const textureLoader = new THREE.TextureLoader();
    const worldTexture = textureLoader.load(WORLD_URL);

    const worldGeometry = new THREE.SphereGeometry(3000, 300, 300);
    const worldMaterial = new THREE.MeshBasicMaterial(
      {
        color: 0x000000,
        // map: worldTexture,
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
    this.planet.rotation.y += 0.002;
    this.planet.rotation.x += 0.001;
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
