import * as THREE from "three";
import { Planet, PolarPosition } from "../../../types/Three";
import { CartesianToPolar, PolarToCartesian } from "../utils";
import ThreeController from "../ThreeController";


export type UpdateLightPosition = (pos: PolarPosition) => void;


function calculateAxisAndAngle(lightPosition: PolarPosition) {
    const initialPosition = PolarToCartesian(lightPosition);
    const targetPosition = PolarToCartesian({
        radius: lightPosition.radius,
        phi: Math.PI / 2,
        theta: Math.PI / 2
    });
    // Cross product of initial and target position
    const axis = new THREE.Vector3();
    axis.crossVectors(initialPosition, targetPosition);
    axis.normalize();

    const angle = Math.acos(initialPosition.dot(targetPosition) / (initialPosition.length() * targetPosition.length()));

    return { axis, angle };
}


class SwitchPlanet {
    controller: ThreeController;

    running: boolean;
    stage: number;
    counter: number;
    deltaAngle: number;
    stageCycle0: number;
    stageCycle1: number;
    targetPlanet: Planet;

    initialPosition: THREE.Vector3;
    rotationAxis: THREE.Vector3;
    targetAngle: number;
    rotationMatrix: THREE.Matrix4;
    currentPosition: THREE.Vector3;

    constructor(controller: ThreeController) {
        this.controller = controller;
        
        this.running = false;
        this.stage = 0;
        this.counter = 0;
        this.deltaAngle = 0;
        this.targetPlanet = Planet.MOON;

        const axisAndAngle = calculateAxisAndAngle(this.controller.lightPosition);
        this.initialPosition = PolarToCartesian(this.controller.lightPosition);
        this.rotationAxis = axisAndAngle.axis;
        this.targetAngle = axisAndAngle.angle;
        this.rotationMatrix = new THREE.Matrix4();
        this.currentPosition = new THREE.Vector3();

        this.stageCycle0 = 0;
        this.stageCycle1 = 0;
    }

    trigger(cycle: number, planet: Planet) {
        this.stage = 0;
        this.running = true;
        this.counter = 0;
        this.currentPosition = this.initialPosition.clone();

        this.stageCycle0 = Math.floor(cycle * 0.3);
        this.stageCycle1 = cycle - this.stageCycle0;
        this.targetPlanet = planet;

        this.deltaAngle = this.targetAngle / this.stageCycle0;
        this.rotationMatrix.makeRotationAxis(this.rotationAxis, this.deltaAngle);
    }

    update() {
        if (!this.running) {
            return;
        }
        
        this.currentPosition.applyMatrix4(this.rotationMatrix);
        this.controller.updateLightPosition(CartesianToPolar(this.currentPosition));

        this.counter += 1;
        if (this.stage === 0 && this.counter == this.stageCycle0) {
            this.stage = 1;
            this.counter = 0;
            this.deltaAngle = (Math.PI * 2 - this.targetAngle) / this.stageCycle1;
            this.rotationMatrix.makeRotationAxis(this.rotationAxis, this.deltaAngle);
            
            this.controller.updatePlanetMaterial(this.targetPlanet);
        }
        if (this.stage === 1 && this.counter == this.stageCycle1) {
            this.stage = 0;
            this.counter = 0;
            this.running = false;
        }
    }
}

export default SwitchPlanet;
