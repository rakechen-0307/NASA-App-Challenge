var ndarray = require('ndarray');
var convolve = require('ndarray-convolve');

export const bandPass = (data: any, bp_coef: number[]) : any => {
    // Check if data is an ndarray
    if (data.shape === undefined) {
        console.log('Warning: Data is not an ndarray');
        data = ndarray(data);
    }
    // Convolution
    const coef = ndarray(bp_coef, [bp_coef.length]);
    var result = ndarray(new Float32Array(data.shape[0]), data.shape);
    convolve(result, data, coef);

    return result;
}