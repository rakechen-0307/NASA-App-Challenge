/* eslint-disable no-restricted-globals */

import { bandPass } from "./bandPass";
import { gaussianSmoothing } from "./gaussianSmoothing";
import { peaksFinder } from './peaksFinder';
import { toDataPoints, toDataPointsSample } from './toDataPoints';
import { peakSelect } from './peakSelect';
import { downsample } from './downSample';
import { Data } from '../types/Data';

var ndarray = require('ndarray');
var ops = require('ndarray-ops');

const samples = 5000;

self.onmessage = function(e) {
    const { loadedData, params } = e.data;

    console.log(loadedData);
    // Load data
    const datapoints: Data[] = loadedData.map((point: any) => ({
      x: point[1],
      y: point[2]
    }));

    // Extract x and y values
    let time = ndarray(datapoints.map(d => d.x));
    let velocity = ndarray(datapoints.map(d => d.y));

    // Apply bandpass filter
    const filteredVelocity = bandPass(velocity, params.bp_coef);
    const filteredDataPoint = toDataPoints(time, filteredVelocity);

    // Absolute value
    let absVelocity = ndarray(new Float32Array(filteredVelocity.shape[0]), filteredVelocity.shape);
    ops.abs(absVelocity, filteredVelocity);

    // Apply Gaussian smoothing
    const smoothedVelocity = gaussianSmoothing(absVelocity, params.smoothingStd);
    const smoothedDataPoint = toDataPoints(time, smoothedVelocity);

    // Normalize
    const average = ops.sum(smoothedVelocity) / smoothedVelocity.shape[0];
    let normalizedVelocity = ndarray(new Float32Array(smoothedVelocity.shape[0]), smoothedVelocity.shape);
    ops.subs(normalizedVelocity, smoothedVelocity, average);
    ops.maxs(normalizedVelocity, normalizedVelocity, 0);
    const normalizedDataPoint = toDataPoints(time, normalizedVelocity);

    // Convert back to normal array
    velocity = normalizedVelocity.data;
    time = time.data;

    // Find peaks
    const { locations, level } = peaksFinder(velocity, params.std, params.widthFactor);
    let peaks = [];
    let slopes = [];
    for (let i = 0; i < locations.length; i++) {
      let x0 = locations[i][0];
      let x1 = locations[i][1];
      let x2 = locations[i][2];
      peaks.push({ x: x1 * params.ts, y: velocity[x1] });
      slopes.push(toDataPointsSample([x0, x1, x2], time, velocity));
    }

    let { startLocations, endLocations } = peakSelect(velocity, locations, params.slopeThreshold, params.ratioThreshold);
    startLocations = startLocations.map(value => value * params.ts);
    endLocations = endLocations.map(value => value * params.ts);

    const downDataPoints = downsample(datapoints, samples);
    const downFilteredDataPoint = downsample(filteredDataPoint, samples);
    const downSmoothedDataPoint = downsample(smoothedDataPoint, samples);
    const downNormalizedDataPoint = downsample(normalizedDataPoint, samples);

    // Send processed data back to the main thread
    self.postMessage({
        downDataPoints,
        downFilteredDataPoint,
        downSmoothedDataPoint,
        downNormalizedDataPoint,
        peaks,
        slopes,
        level,
        startLocations,
        endLocations
    });
}