import * as THREE from "three";
import { downsample } from "../../../helpers/downSample";

class Quake {
    planet: THREE.Mesh;
    planetOriginalPosition: THREE.Vector3;

    profile: THREE.Vector3[];
    upsample: number;
    running: boolean;
    counter: number;

    constructor(planet: THREE.Mesh) {
        this.planet = planet;
        this.planetOriginalPosition = new THREE.Vector3();

        this.profile = [];
        this.upsample = 1;
        this.running = false;
        this.counter = 0;
    }

    trigger(amplitude: number, profile: number[], upsample: number = 1, downsample: number = 1) {
        if (this.running) {
            return;
        }

        const mean = profile.reduce((sum, value) => sum + value, 0) / profile.length;
        const std = Math.sqrt(profile.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / profile.length);
        profile = profile.map((value) => (value - mean) / std * amplitude);

        if (downsample > 1) {
            profile = profile.reduce((arr: number[], value: number, index: number) => {
                if (index % downsample === 0) {
                    arr.push(value);
                }
                return arr;
            }, []);
        }

        this.planetOriginalPosition = this.planet.position.clone();

        this.profile = profile.map((value) => {
            const dir = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
            return dir.multiplyScalar(value);
        });
        this.upsample = upsample;
        this.running = true;
        this.counter = 0;
    }

    triggerRandom(amplitude: number, length: number, sampleRate: number, decay: number) {
        // Generate a random profile
        const profile = new Array(length).fill(0).map(
            (_, index) => Math.random() * amplitude * Math.exp(-decay * index)
        );
        this.trigger(amplitude, profile, sampleRate, 0);
    }

    update() {
        if (this.running) {
            this.counter += 1;
            const index = Math.floor(this.counter / this.upsample);
            if (index >= this.profile.length - 1) {
                this.counter = 0;
                this.running = false;
                this.planet.position.set(this.planetOriginalPosition.x, this.planetOriginalPosition.y, this.planetOriginalPosition.z);
                return;
            }

            const nextIndex = index + 1;

            const progress = (this.counter % this.upsample) / this.upsample;
            const currentProfile = this.profile[index];
            const nextProfile = this.profile[nextIndex];

            const interpolatedProfile = currentProfile.clone().lerp(nextProfile, progress);
            const position = this.planetOriginalPosition.clone().add(interpolatedProfile);
            this.planet.position.set(position.x, position.y, position.z);
        }
    }
}

export default Quake;
