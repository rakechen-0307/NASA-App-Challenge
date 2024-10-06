import { StationInfo } from "../types/Three";

import { Planet } from "../types/Three";

export const WORLD_URL = "assets/world_texture.jpg";

export const PLANET_URLS = {
  moon: {
    // texture: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/lroc_color_poles_1k.jpg",
    texture: "assets/moon_texture.jpg",
    // displacement: "https://s3-us-west-2.amazonaws.com/s.cdpn.io/17271/ldem_3_8bit.jpg",
    displacement: "assets/moon_displacement.jpg",
  },
  mars: {
    texture: "assets/mars_texture.jpg",
    displacement: "",
  }
}

export const LENSFLARE0_URL = "assets/lensflare0.png";
export const LENSFLARE1_URL = "assets/lensflare3.png";

export const STATIONS: Record<Planet, StationInfo[]> = {
  moon: [
    {
      name: "Apollo 11",
      position: {
        longitude: 23.47314,
        latitude: 0.67416,
      },
    },
    {
      name: "Apollo 12",
      position: {
        longitude: -23.4219,
        latitude: -3.0128,
      },
    },
    {
      name: "Apollo 14",
      position: {
        longitude: -17.47194,
        latitude: -3.64589,
      },
    },
    {
      name: "Apollo 15",
      position: {
        longitude: 3.63330,
        latitude: 26.13239,
      },
    },
    {
      name: "Apollo 16",
      position: {
        longitude: 15.5011,
        latitude: -8.9734,
      },
    },
    {
      name: "Apollo 17",
      position: {
        longitude: 30.7723,
        latitude: 20.1911,
      },
    },
  ],
  mars: [
    {
      name: "Mars",
      position: {
        longitude: 4.5,
        latitude: 135.9,
      },
    }
  ],
};