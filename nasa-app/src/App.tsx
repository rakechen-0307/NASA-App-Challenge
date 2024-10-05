import './App.css';
import React, { useEffect, useState } from 'react';
import FileInput from './components/FileInput';
import { Data } from './types/Data';
import { bandPass } from './helpers/bandPass';
import { gaussianSmoothing } from './helpers/gaussianSmoothing';
import { peaksFinder } from './helpers/peaksFinder';
import { toDataPoints, toDataPointsSample } from './helpers/toDataPoints';
import SeismicPlot from './components/SeismicPlot';
import { peakSelect } from './helpers/peakSelect';
import { downsample } from './helpers/downSample';

import ThreeSimulator from './components/ThreeSimulator';
import { threeController } from './components/ThreeSimulator/ThreeController';

var ndarray = require('ndarray');
var ops = require('ndarray-ops');

function App() {
  const [step, setStep] = useState<number>(0);
  const [data, setData] = useState<Data[]>([]);
  const [filteredData, setFilteredData] = useState<Data[]>([]);
  const [smoothedData, setSmoothedData] = useState<Data[]>([]);
  const [normalizedData, setNormalizedData] = useState<Data[]>([]);
  const [peaksData, setPeaksData] = useState<Data[]>([]);
  const [slopesData, setSlopesData] = useState<Data[][]>([]);
  const [level, setLevel] = useState<number>(0);
  const [peakLocation, setPeakLocation] = useState<number[]>([]);
  const [planet, setPlanet] = useState<string>("lunar");

  const samples = 10000;
  let ts = 0.1509;
  let std = 2;
  let smoothingStd = 600;
  let slopeThreshold = 5e-13;
  let ratioThreshold = 2;
  let widthFactor = 0.3;
  let bp_coef = Array(-0.015468212,0.005414803,-0.021013882,-0.00472374,4.77E-02,
                      0.026547969,0.002031613,0.055068256,0.038977124,-0.058782592,
                      -0.034768745,0.002012645,-0.170557003,-0.224228809,0.151489773,
                      0.437803402,0.151489773,-0.224228809,-0.170557003,0.002012645,
                      -0.034768745,-0.058782592,0.038977124,0.055068256,0.002031613,
                      0.026547969,0.047658812,-4.72E-03,-0.021013882,0.005414803,-0.015468212);

  useEffect(() => {
    if (planet === "lunar") {
      ts = 0.1509;
      std = 2;
      smoothingStd = 600;
      slopeThreshold = 5e-13;
      ratioThreshold = 1.5;
      widthFactor = 0.3;
      bp_coef = Array(-0.015468212,0.005414803,-0.021013882,-0.00472374,4.77E-02,
                      0.026547969,0.002031613,0.055068256,0.038977124,-0.058782592,
                      -0.034768745,0.002012645,-0.170557003,-0.224228809,0.151489773,
                      0.437803402,0.151489773,-0.224228809,-0.170557003,0.002012645,
                      -0.034768745,-0.058782592,0.038977124,0.055068256,0.002031613,
                      0.026547969,0.047658812,-4.72E-03,-0.021013882,0.005414803,-0.015468212);
    }
    else if (planet === "mars") {
      ts = 0.05;
      std = 1.3;
      smoothingStd = 3e2;
      slopeThreshold = 5e-13;
      ratioThreshold = 1.5;
      widthFactor = 0.3;
      bp_coef = Array(-0.015753723,-0.039009518,-0.032765272,-0.006810152,-0.001507097,-0.034209679,
                      -0.069394178,-0.059643647,-0.012730875,0.005371116,-0.049134331,-0.124987344,
                      -0.110448191,0.04424677,0.249863191,0.345144188,0.249863191,0.04424677,-0.110448191,
                      -0.124987344,-0.049134331,0.005371116,-0.012730875,-0.059643647,-0.069394178,
                      -0.034209679,-0.001507097,-0.006810152,-0.032765272,-0.039009518,-0.015753723);
    }
  }, [planet])

  const handlePlanetSwitch = () => {
    if (planet === "lunar") {
      setPlanet("mars");
    }
    else if (planet === "mars") {
      setPlanet("lunar");
    }
  }

  const bandPassKernel = (ts: number, data: Data[], bp_coef: number[]) : Data[] => {
    let kernel = bp_coef.map((value, i) => ({ x: -i*ts, y: value }));

    const maxDataValue = Math.max(...data.map(d => d.y));
    const maxKernelValue = Math.max(...kernel.map(k => k.y));

    // Normalize the kernel for visulization
    kernel = kernel.map(k => ({ x: k.x, y: k.y * 0.5 * (maxDataValue / maxKernelValue) }));

    return kernel;
  }

  const gaussianKernel = (std: number, ts: number, data: Data[]): Data[] => {
    let window_size = 6 * std;
    let kernel = Array(window_size + 1).fill(0);
    let x = Array(window_size + 1).fill(0);

    for (let i = -window_size / 2; i <= window_size / 2; i++) {
      let value = Math.exp(-i * i / (2 * std * std)) / (Math.sqrt(2 * Math.PI) * std);
      kernel[i + window_size / 2] = value;
      x[i + window_size / 2] = i * ts;
    }

    // Normalize the kernel for visulization
    const maxDataValue = Math.max(...data.map(d => d.y));
    const maxKernelValue = Math.max(...kernel);

    kernel = kernel.map((value, i) => ({ x: x[i], y: value * 0.5 * (maxDataValue / maxKernelValue) }));
  
    return kernel;
  }

  const handleFileLoad = (loadedData: any) => {
    // Load data
    const datapoints: Data[] = loadedData.map((point: any) => ({
      x: point[1],
      y: point[2]
    }));

    // Extract x and y values
    let time = ndarray(datapoints.map(d => d.x));
    let velocity = ndarray(datapoints.map(d => d.y));

    // Apply bandpass filter
    const filteredVelocity = bandPass(velocity, bp_coef);
    const filteredDataPoint = toDataPoints(time, filteredVelocity);

    // Absolute value
    let absVelocity = ndarray(new Float32Array(filteredVelocity.shape[0]), filteredVelocity.shape);
    ops.abs(absVelocity, filteredVelocity);

    // Apply Gaussian smoothing
    const smoothedVelocity = gaussianSmoothing(absVelocity, smoothingStd);
    const smoothedDataPoint = toDataPoints(time, smoothedVelocity);

    // Normalize
    const average = ops.sum(smoothedVelocity) / smoothedVelocity.shape[0];
    let normalizedVelocity = ndarray(new Float32Array(smoothedVelocity.shape[0]), smoothedVelocity.shape);
    ops.subs(normalizedVelocity, smoothedVelocity, average);
    ops.maxs(normalizedVelocity, normalizedVelocity, 0);
    setNormalizedData(toDataPoints(time, normalizedVelocity));

    // Convert back to normal array
    velocity = normalizedVelocity.data;
    time = time.data;

    // Find peaks
    const { locations, level } = peaksFinder(velocity, std, widthFactor);
    let peaks = [];
    let slopes = [];
    for (let i = 0; i < locations.length; i++) {
      let x0 = locations[i][0];
      let x1 = locations[i][1];
      let x2 = locations[i][2];
      peaks.push({ x: x1 * ts, y: velocity[x1] });
      slopes.push(toDataPointsSample([x0, x1, x2], time, velocity));
    }

    const peakLocations = peakSelect(velocity, locations, slopeThreshold, ratioThreshold).map(value => value * ts);
    setData(downsample(datapoints, samples));
    setFilteredData(downsample(filteredDataPoint, samples));
    setSmoothedData(downsample(smoothedDataPoint, samples));
    setPeaksData(peaks);
    setSlopesData(slopes);
    setLevel(level);
    setPeakLocation(peakLocations);
  };

  return (
    <div>
      <ThreeSimulator />
      <h1>Seismic Waveform Detection</h1>
      <div>
        <label>
          <input type="checkbox" onChange={handlePlanetSwitch} />
        </label>
      </div>
      <div className='button-flex'>
        <button onClick={() => setStep(1)}>Step 1: Bandpass Filter</button>
        <button onClick={() => setStep(2)}>Step 2: Gaussian Smoothing</button>
        <button onClick={() => setStep(3)}>Step 3: Find Peaks & Slopes</button>
        <button onClick={() => setStep(4)}>Step 4: Mark Seismic Positions</button>
      </div>
      <FileInput onFileLoad={handleFileLoad} />
      {data.length > 0 && <SeismicPlot
          step={step}
          data={step === 0 ? data : step === 1 ? data : step === 2 ? filteredData : step === 3 ? normalizedData : step === 4 ? data : []}
          nextData={step === 1 ? filteredData : step === 2 ? smoothedData : []}
          kernel={step === 1 ? bandPassKernel(ts, data, bp_coef) : step === 2 ? gaussianKernel(std, ts, filteredData) : []}
          peaks={peaksData}
          slopes={slopesData}
          level={level}
          peakLocation={peakLocation}
        />
      }
      <button onClick={() => threeController.triggerRandomQuake(0.1, 100, 5, 0.02)}>Trigger Quake</button>
    </div>
    // <h1>CSV Import in React.js</h1>
    // <FileInput onFileLoad={handleFileLoad} />
    // {data.length > 0 && <SeismicPlot data={data} std={2} widthFactor={0.3} smoothingStd={600} />}
  );
}

export default App;
