import { Data } from "../types/Data";

export const toDataPoints = (x: any, y: any) : Data[] => {
    // Convert ndarrays to arrays
    x = x.data ? x.data : x;
    y = y.data ? y.data : y;
    // Check validity of lengths
    if (x.length !== y.length) {
        throw new Error("x and y must have the same length");
    }
    return x.map((x: any, i: any) => ({ x, y: y[i] }));
} 

export const toDataPointsSample = (idx: any, x: any, y: any) : Data[] => {
    // Convert ndarrays to arrays
    idx = idx.data ? idx.data : idx;
    x = x.data ? x.data : x;
    y = y.data ? y.data : y;
    // Check validity of lengths
    if (idx.length > y.length || idx.length > x.length) {
        throw new Error("idx must have a length less than or equal to x and y");
    }
    return idx.map((i: any) => ({ x: x[i], y: y[i] }));
}