import './App.css';
import React, { useState } from 'react';
import FileInput from './components/FileInput';
import { Data } from './types/Data';
import { bandPass } from './helpers/bandPass';
import { gaussianSmoothing } from './helpers/gaussianSmoothing';
import { peaksFinder } from './helpers/peaksFinder';
import { toDataPoints } from './helpers/toDataPoints';
import SeismicPlot from './components/SeismicPlot';

function App() {
  const [step, setStep] = useState<number>(0);
  const [data, setData] = useState<Data[]>([]);
  const [filteredData, setFilteredData] = useState<Data[]>([]);
  const [smoothedData, setSmoothedData] = useState<Data[]>([]);
  const [centeredData, setCenteredData] = useState<Data[]>([]);
  const [peaksData, setPeaksData] = useState<Data[]>([]);
  const [slopesData, setSlopesData] = useState<Data[][]>([]);
  const [level, setLevel] = useState<number>(0);
  const [peakLocation, setPeakLocation] = useState<number[]>([]);

  const ts = 0.1509;
  const std = 2;

  const bandPassKernel = (ts: number) : Data[] => {
    const moon_coef = Array(-0.015468212,0.005414803,-0.021013882,-0.00472374,4.77E-02,
                              0.026547969,0.002031613,0.055068256,0.038977124,-0.058782592,
                              -0.034768745,0.002012645,-0.170557003,-0.224228809,0.151489773,
                              0.437803402,0.151489773,-0.224228809,-0.170557003,0.002012645,
                              -0.034768745,-0.058782592,0.038977124,0.055068256,0.002031613,
                              0.026547969,0.047658812,-4.72E-03,-0.021013882,0.005414803,-0.015468212);
    
    return moon_coef.map((value, i) => ({ x: -i*ts, y: value }));
  }

  const gaussianKernel = (std: number, ts: number) : Data[] => {
    let window_size = 6 * std;
    let kernel = Array(window_size+1).fill(0);
    let x = Array(window_size+1).fill(0);

    for (let i = -window_size/2; i <= window_size/2; i++) {
        let value = Math.exp(-i * i / (2 * std * std)) / (Math.sqrt(2 * Math.PI) * std);
        kernel[i+window_size/2] = value;
        x[i+window_size/2] = i*ts;
    }
    return toDataPoints(x, kernel);
  }

  const handleFileLoad = (
    loadedData: any, std: number, widthFactor: number, smoothingStd: number
  ) => {
    // Load data
    const datapoints: Data[] = loadedData.map((point: any) => ({
      x: point[1],
      y: point[2]
    }));
    setData(datapoints);

    // Apply bandpass filter
    const filteredVelocity = bandPass(datapoints.map(d => d.y));
    const filteredDataPoint = filteredVelocity.map((y, i) => ({ x: datapoints[i].x, y }));

    // Apply gaussian smoothing
    const smoothedVelocity = gaussianSmoothing(filteredDataPoint.map(d => d.y), smoothingStd);
    const smoothedDataPoint = smoothedVelocity.map((y, i) => ({ x: datapoints[i].x, y }));

    // Normalize
    const average = smoothedVelocity.reduce((acc, val) => acc + val, 0) / smoothedVelocity.length;
    const centeredVelocity = smoothedVelocity.map(val => Math.max(val - average, 0));
    const centeredDataPoint = centeredVelocity.map((y, i) => ({ x: datapoints[i].x, y }));

    // Find peaks
    const { values, locations, level } = peaksFinder(centeredVelocity, std, widthFactor);
    const peaks = locations.map(([left, mid, right]) => ({
      x: datapoints[mid].x,
      y: centeredVelocity[mid]
    }));
    const slopes = locations.map(([left, mid, right]) => ([
      { x: datapoints[left].x, y: centeredVelocity[mid] },
      { x: datapoints[mid].x, y: centeredVelocity[right] }
    ]));

    setFilteredData(filteredDataPoint);
    setSmoothedData(smoothedDataPoint);
    setCenteredData(centeredDataPoint);
    setPeaksData(peaks);
    setSlopesData(slopes);
    setLevel(level);
  };

  return (
    <div>
      <h1>Seismic Waveform Detection</h1>
      <FileInput onFileLoad={handleFileLoad} />
      {data.length > 0 && step === 0 ?
        <SeismicPlot  
          step={step}
          data={data}
          nextData={[]}
          kernel={[]}
          peaks={[]}
          slopes={[]}
          level={0}
          peakLocation={[]}
        /> :
      step === 1 ?
        <SeismicPlot  
          step={step}
          data={data}
          nextData={filteredData}
          kernel={bandPassKernel(ts)}
          peaks={[]}
          slopes={[]}
          level={0}
          peakLocation={[]}
        /> :
      step === 2 ?
        <SeismicPlot  
          step={step}
          data={filteredData}
          nextData={smoothedData}
          kernel={gaussianKernel(std, ts)}
          peaks={[]}
          slopes={[]}
          level={0}
          peakLocation={[]}
        /> :
      step === 3 ?
        <SeismicPlot  
          step={step}
          data={centeredData}
          nextData={[]}
          kernel={[]}
          peaks={peaksData}
          slopes={slopesData}
          level={level}
          peakLocation={[]}
        /> :
        <SeismicPlot  
          step={step}
          data={data}
          nextData={[]}
          kernel={[]}
          peaks={[]}
          slopes={[]}
          level={0}
          peakLocation={peakLocation}
        />
      }
      <div className='button-flex'>
          <button onClick={() => setStep(1)}>Step 1: Bandpass Filter</button>
          <button onClick={() => setStep(2)}>Step 2: Gaussian Smoothing</button>
          <button onClick={() => setStep(3)}>Step 3: Find Peaks & Slopes</button>
          <button onClick={() => setStep(4)}>Step 4: Mark Seismic Positions</button>
      </div>
    </div>
  );
}

export default App;
