import * as THREE from "three";
import { PolarPosition } from "../../../types/Three";


export function PolarToCartesian(polarPosition: PolarPosition) {
    const { radius, phi, theta } = polarPosition;
    const z = -radius * Math.cos(phi) * Math.sin(theta);
    const x = -radius * Math.sin(phi) * Math.sin(theta);
    const y = radius * Math.cos(theta);
    return new THREE.Vector3(x, y, z);
}

export function CartesianToPolar(cartesianPosition: THREE.Vector3) {
    const x = -cartesianPosition.z;
    const y = -cartesianPosition.x;
    const z = cartesianPosition.y;

    const radius = Math.sqrt(x * x + y * y + z * z);
    const phi = Math.atan2(y, x);
    const theta = Math.atan2(Math.sqrt(x * x + y * y), z);
    return { radius, phi, theta };
}
