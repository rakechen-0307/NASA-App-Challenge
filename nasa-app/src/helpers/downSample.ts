import { Data } from "../types/Data";

export const downsample = (dataPoints: Data[], samples: number) : Data[] => {
    let originalSamples = dataPoints.length;
    if (samples >= originalSamples) {
        // If the requested number of samples is greater than or equal to the original number of samples,
        // return the original data points.
        return dataPoints;
    }

    let step = Math.floor(originalSamples / samples);
    let downsampledData = [];

    for (let i = 0; i < originalSamples; i += step) {
        downsampledData.push(dataPoints[i]);
    }

    return downsampledData;
};