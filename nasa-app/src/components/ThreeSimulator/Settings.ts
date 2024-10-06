import { GUI } from "three/examples/jsm/libs/lil-gui.module.min";
// GUI to control behavior of three simulator

import ThreeController from "./ThreeController";

interface SettingsConfig {
    Camera: {
        position: {
            x: number;
            y: number;
            z: number;
        };
    };
}

class Settings {
    panel: GUI;
    config: SettingsConfig;
    threeController: ThreeController;

    constructor(threeController: ThreeController) {
        this.threeController = threeController;
        this.panel = new GUI({
            autoPlace: true, 
            container: threeController.container,
        });

        this.config = {
            Camera: {
                position: {
                    x: 0.0,
                    y: 0.0,
                    z: 0.0,
                },
            },
        };

        this.initGUI();
        this.panel.open();
    }

    initGUI() {
        // gui to change paramters including color, positon, controlls
        const { panel, config, threeController } = this;
        const cameraFolder = panel.addFolder("Camera");
        
        const cameraPosition = cameraFolder.addFolder("Position");
        cameraPosition.add(config.Camera.position, "x", -20, 20, 0.01).onChange((value) => {
            threeController.camera.position.x = value;
        }); 
        cameraPosition.add(config.Camera.position, "y", -20, 20, 0.01).onChange((value) => {
            threeController.camera.position.y = value;
        });
        cameraPosition.add(config.Camera.position, "z", -20, 20, 0.01).onChange((value) => {
            threeController.camera.position.z = value;
        });
    }
}

export default Settings;
