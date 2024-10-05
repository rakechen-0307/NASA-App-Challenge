var ndarray = require('ndarray');
var convolve = require('ndarray-convolve');

export const gaussianSmoothing = (data: any, smoothingStd: number) :any => {
    // Check if data is an ndarray
    if (data.shape === undefined) {
        console.log('Warning: Data is not an ndarray');
        data = ndarray(data);
    }
    let window_size = 6 * smoothingStd;
    let gaussian_kernel = ndarray(new Float32Array(window_size+1), [window_size+1]);
    for (let i = -window_size/2; i <= window_size/2; i++) {
        let value = Math.exp(-i * i / (2 * smoothingStd * smoothingStd)) / (Math.sqrt(2 * Math.PI) * smoothingStd);
        gaussian_kernel.set(i + window_size/2, value);
    }

    // Convolution with Gaussian kernel
    let result = ndarray(new Float32Array(data.shape[0]), data.shape);
    const smoothedVelocity = convolve(result, data, gaussian_kernel);

    return smoothedVelocity;
}