import * as THREE from "three";
// three.js

import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { Lensflare, LensflareElement } from 'three/examples/jsm/objects/Lensflare';

import { LENSFLARE0_URL, LENSFLARE1_URL, PLANET_URLS, WORLD_URL } from "../../constants";

// postprocessing for three.js

// import { GridHelper } from "./Helper/GridHelper";

// import Stats from "three/examples/jsm/libs/stats.module";
// performance monitor

// import { Dancer } from "./ThreeComponents";
// components

import Controls from "./Controls";
// controls to control the scene

import Settings from "./Settings";


/**
 * Control the dancers (or other light objects)'s status and pos
 * @constructor
 */
class ThreeController {
  canvas?: HTMLElement;
  container?: HTMLElement;

  renderer: THREE.WebGLRenderer;
  camera: THREE.PerspectiveCamera;
  // THREE.Object3D<THREE.Event>
  scene: THREE.Scene;
  composer: EffectComposer;
  clock: THREE.Clock;
  // settings: Settings;

  height: number;
  width: number;

  planet: THREE.Mesh;
  // world: THREE.Mesh;

  light: THREE.DirectionalLight;

  controls: Controls;
  settings: Settings;

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

    this.planet = this.generatePlanet();
    // this.world = this.generateWorld();

    // Initialize controls after the renderer is set up
    this.controls = new Controls(this.renderer, this.scene, this.camera, this.planet);
    this.settings = new Settings(this);

    // Data and status for playback
    this.isPlaying = false;

    // record the return id of requestAnimationFrame
    this.initialized = false;
  }

  triggerQuake(amplitude: number, profile: number[], sampleRate: number) {
    this.controls.quakeControls.trigger(amplitude, profile, sampleRate);
  }

  triggerRandomQuake(amplitude: number, length: number, sampleRate: number, decay: number = 0.0) {
    this.controls.quakeControls.triggerRandom(amplitude, length, sampleRate, decay);
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
    this.controls = new Controls(this.renderer, this.scene, this.camera, this.planet);

    // Append the canvas to given ref
    this.canvas.appendChild(this.renderer.domElement);

    // Start rendering
    this.animate();
    this.renderer.render(this.scene, this.camera);

    // this.enablePMREM();
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


  addLensflareLight(
    r: number, g: number, b: number,
    x: number, y: number, z: number,
    sourceTexture: THREE.Texture, flareTexture: THREE.Texture
  ) {

    const light = new THREE.PointLight(0xffffff, 1.5, 2000, 0);
    light.color.setRGB(r, g, b);
    light.position.set(x, y, z);
    this.scene.add(light);

    const lensflare = new Lensflare();
    lensflare.addElement(new LensflareElement(sourceTexture, 500, 0, light.color));
    lensflare.addElement(new LensflareElement(flareTexture, 60, 0.6));
    lensflare.addElement(new LensflareElement(flareTexture, 70, 0.7));
    lensflare.addElement(new LensflareElement(flareTexture, 120, 0.9));
    lensflare.addElement(new LensflareElement(flareTexture, 70, 1));
    light.add(lensflare);
  }

  generateLight() {
    // Add a dim ambient light for overall illumination
    // const ambientLight = new THREE.AmbientLight(0x404040, 0.5);
    // this.scene.add(ambientLight);

    const lightRadius = 1500;
    const lightPhi = Math.PI / 2 * 2.2;
    const lightTheta = Math.PI / 2 * 0.6;

    const lightPosition = new THREE.Vector3();
    lightPosition.z = -lightRadius * Math.cos(lightPhi) * Math.sin(lightTheta);
    lightPosition.x = -lightRadius * Math.sin(lightPhi) * Math.sin(lightTheta);
    lightPosition.y = lightRadius * Math.cos(lightTheta);

    // Add a stronger directional light to create shadows and highlights
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(lightPosition.x, lightPosition.y, lightPosition.z);
    this.scene.add(directionalLight);

    const textureLoader = new THREE.TextureLoader();
    const textureFlare0 = textureLoader.load(LENSFLARE0_URL);
    const textureFlare1 = textureLoader.load(LENSFLARE1_URL);

    this.addLensflareLight(
      1.0, 1.0, 1.0,
      lightPosition.x, lightPosition.y, lightPosition.z,
      textureFlare0, textureFlare1);

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

  generatePlanet() {
    const geometry = new THREE.SphereGeometry(2, 500, 500);

    const textureLoader = new THREE.TextureLoader();
    const texture = textureLoader.load(PLANET_URLS.moon.texture);
    const displacementMap = textureLoader.load(PLANET_URLS.moon.displacement);

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
