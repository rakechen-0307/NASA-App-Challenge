import './App.css';
import React, { useEffect, useState, useRef } from 'react';
import FileInput from './components/FileInput';
import { Data } from './types/Data';
import SeismicPlot from './components/SeismicPlot';

import ThreeSimulator from './components/ThreeSimulator';
import { threeController } from './components/ThreeSimulator/ThreeController';
import { Planet } from './types/Three';

function App() {
  const [step, setStep] = useState<number>(0);
  const [planet, setPlanet] = useState<string>("lunar");
  const [processedData, setProcessedData] = useState<any>({
    data: [],
    filteredData: [],
    smoothedData: [],
    normalizedData: [],
    peaksData: [],
    slopesData: [],
    level: 0,
    startLocations: [],
    endLocations: []
  });

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
  }, [planet]);

  const quakeIntervalRef = useRef<any>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./helpers/fileProcessWorker.ts', import.meta.url));

    workerRef.current.onmessage = (e) => {
      const { downDataPoints, downFilteredDataPoint, downSmoothedDataPoint, 
              downNormalizedDataPoint, peaks, slopes, level, startLocations,
              endLocations } = e.data;
      
      setProcessedData({
        data: downDataPoints,
        filteredData: downFilteredDataPoint,
        smoothedData: downSmoothedDataPoint,
        normalizedData: downNormalizedDataPoint,
        peaksData: peaks,
        slopesData: slopes,
        level: level,
        startLocations: startLocations,
        endLocations: endLocations
      })

      // Stop the quakes once processing is done
      clearInterval(quakeIntervalRef.current);
    }

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  const handlePlanetSwitch = () => {
    if (planet === "lunar") {
      setPlanet("mars");
      threeController.triggerUpdatePlanetMaterial(500, Planet.MARS);
    }
    else if (planet === "mars") {
      setPlanet("lunar");
      threeController.triggerUpdatePlanetMaterial(500, Planet.MOON);
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
    setStep(0);
    // Trigger quakes while processing
    quakeIntervalRef.current = setInterval(() => {
      threeController.triggerRandomQuake(0.03, 20, 5, 0.02);
    }, 200);

    const params = {
      ts: ts,
      std: std,
      smoothingStd: smoothingStd,
      slopeThreshold: slopeThreshold,
      ratioThreshold: ratioThreshold,
      widthFactor: widthFactor,
      bp_coef: bp_coef
    }

    workerRef.current?.postMessage({ loadedData, params });
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
      {processedData.data.length > 0 && <SeismicPlot
          step={step}
          data={step === 0 ? processedData.data : step === 1 ? processedData.data : step === 2 ? processedData.filteredData : step === 3 ? processedData.normalizedData : step === 4 ? processedData.data : []}
          nextData={step === 1 ? processedData.filteredData : step === 2 ? processedData.smoothedData : []}
          kernel={step === 1 ? bandPassKernel(ts, processedData.data, bp_coef) : step === 2 ? gaussianKernel(std, ts, processedData.filteredData) : []}
          peaks={processedData.peaksData}
          slopes={processedData.slopesData}
          level={processedData.level}
          startLocations={processedData.startLocations}
          endLocations={processedData.endLocations}
        />
      }
      {/*<button onClick={() => threeController.triggerRandomQuake(0.1, 100, 5, 0.02)}>Trigger Quake</button>*/}
      {/*<button onClick={() => threeController.triggerUpdatePlanetMaterial(500, Planet.MARS)}>Toggle Mars</button>*/}
      {/*<button onClick={() => threeController.triggerUpdatePlanetMaterial(500, Planet.MOON)}>Toggle Moon</button>*/}
    </div>
  );
}

export default App;
