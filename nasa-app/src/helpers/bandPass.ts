var ndarray = require('ndarray');
var convolve = require('ndarray-convolve');

let moon_coef = [-0.015468212,0.005414803,-0.021013882,-0.00472374,4.77E-02,
            0.026547969,0.002031613,0.055068256,0.038977124,-0.058782592,
            -0.034768745,0.002012645,-0.170557003,-0.224228809,0.151489773,
            0.437803402,0.151489773,-0.224228809,-0.170557003,0.002012645,
            -0.034768745,-0.058782592,0.038977124,0.055068256,0.002031613,
            0.026547969,0.047658812,-4.72E-03,-0.021013882,0.005414803,-0.015468212];

moon_coef = ndarray(moon_coef, [moon_coef.length]);
export const bandPass = (data: any) : any => {
    // Check if data is an ndarray
    if (data.shape === undefined) {
        console.log('Warning: Data is not an ndarray');
        data = ndarray(data);
    }
    // Convolution
    var result = ndarray(new Float32Array(data.shape[0]), data.shape);
    convolve(result, data, moon_coef);
    
    return result;
}