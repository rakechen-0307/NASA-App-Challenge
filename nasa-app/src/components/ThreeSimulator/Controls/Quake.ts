import * as THREE from "three";

class Quake {
    planet: THREE.Mesh;
    planetOriginalPosition: THREE.Vector3;

    profile: THREE.Vector3[];
    sampleRate: number;
    running: boolean;
    counter: number;

    constructor(planet: THREE.Mesh) {
        this.planet = planet;
        this.planetOriginalPosition = new THREE.Vector3();

        this.profile = [];
        this.sampleRate = 1000;
        this.running = false;
        this.counter = 0;
    }

    trigger(amplitude: number, profile: number[], sampleRate: number) {
        const maxValue = Math.max(...profile);
        profile = profile.map((value) => value / maxValue * amplitude);

        this.planetOriginalPosition = this.planet.position.clone();

        this.profile = profile.map((value) => {
            const dir = new THREE.Vector3(Math.random(), Math.random(), Math.random()).normalize();
            return dir.multiplyScalar(value);
        });
        this.sampleRate = sampleRate;
        this.running = true;
        this.counter = 0;
    }

    triggerRandom(amplitude: number, length: number, sampleRate: number, decay: number) {
        // Generate a random profile
        const profile = new Array(length).fill(0).map(
            (_, index) => Math.random() * amplitude * Math.exp(-decay * index)
        );
        this.trigger(amplitude, profile, sampleRate);
    }

    update() {
        if (this.running) {
            this.counter += 1;
            const index = Math.floor(this.counter / this.sampleRate);
            if (index >= this.profile.length - 1) {
                this.counter = 0;
                this.running = false;
                this.planet.position.set(this.planetOriginalPosition.x, this.planetOriginalPosition.y, this.planetOriginalPosition.z);
                return;
            }

            const nextIndex = index + 1;

            const progress = (this.counter % this.sampleRate) / this.sampleRate;
            const currentProfile = this.profile[index];
            const nextProfile = this.profile[nextIndex];

            const interpolatedProfile = currentProfile.clone().lerp(nextProfile, progress);
            const position = this.planetOriginalPosition.clone().add(interpolatedProfile);
            this.planet.position.set(position.x, position.y, position.z);
        }
    }
}

export default Quake;
