export type PolarPosition = {
    radius: number;
    phi: number;
    theta: number;
}

export enum Planet {
    MOON = "moon",
    MARS = "mars",
}

export type StationPosition = {
    longitude: number;
    latitude: number;
}

export type StationInfo = {
    name: string;
    position: StationPosition;
}
