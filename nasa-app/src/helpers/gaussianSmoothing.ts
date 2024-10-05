export const gaussianSmoothing = (data: number[], smoothingStd: number) => {
    let absData = data.map(Math.abs);  // absolute value

    const windowSize = Math.floor(6 * smoothingStd);
    const halfWindow = Math.floor(windowSize / 2);
    const x = Array.from({ length: windowSize + 1 }, (_, i) => i - halfWindow); 

    // Generate Gaussian kernel
    const gaussianKernel = x.map(val => Math.exp(0 - val ** 2 / (2 * smoothingStd ** 2)));
    const kernelSum = gaussianKernel.reduce((sum, val) => sum + val, 0);
    const normalizedKernel = gaussianKernel.map(val => val / kernelSum);

    // Convolution with Gaussian kernel (using 'same' mode)
    const smoothedVelocity = convolve(absData, normalizedKernel);

    return smoothedVelocity;
}

const convolve = (data: number[], kernel: number[]) => {
    const output = [];
    const halfKernel = Math.floor(kernel.length / 2);

    for (let i = 0; i < data.length; i++) {
        let sum = 0;
        for (let j = 0; j < kernel.length; j++) {
        const signalIndex = i + j - halfKernel;

        // Handle edge cases where signal index goes out of bounds
        if (signalIndex >= 0 && signalIndex < data.length) {
            sum += data[signalIndex] * kernel[j];
        }
        }
        output.push(sum);
    }

    return output;
}