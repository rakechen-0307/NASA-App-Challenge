import { Data } from "../types/Data";

export const lerp2D = (src: Data, dest: Data, frame: number, totalFrames: number) => {
    
    let result = { x: 0, y: 0 };
    result.x = src.x + (dest.x - src.x) * frame / totalFrames;
    result.y = src.y + (dest.y - src.y) * frame / totalFrames
    
    return result;
}

export const lerp1D = (src: number, dest: number, frame: number, totalFrames: number) => {
    return src + (dest - src) * frame / totalFrames;
}