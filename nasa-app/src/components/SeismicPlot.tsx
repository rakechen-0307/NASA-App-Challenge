import React, { useState, useEffect } from 'react';
import { Data, ChartInfo, PeakInfo } from '../types/Data';
import { bandPass } from '../helpers/bandPass';
import { peaksFinder } from '../helpers/peaksFinder';
import { gaussianSmoothing } from '../helpers/gaussianSmoothing';
// @ts-ignore
import CanvasJSReact from '@canvasjs/react-charts';

let CanvasJSChart = CanvasJSReact.CanvasJSChart;

interface SeismicPlotProps {
  data: Data[];
  std: number;
  widthFactor: number;
  smoothingStd: number;
}

const SeismicPlot: React.FC<SeismicPlotProps> = ({ data, std, widthFactor, smoothingStd }) => {
  const [step, setStep] = useState(0);
  const [chartData, setChartData] = useState<ChartInfo[]>([]);
  const [filteredData, setFilteredData] = useState<Data[]>([]);
  const [centeredData, setCenteredData] = useState<Data[]>([]);
  const [peaksData, setPeaksData] = useState<PeakInfo[]>([]);

  useEffect(() => {
    if (data.length === 0) return;

    // Start the dynamic visualization process
    let currentStep = 0;
    const interval = setInterval(() => {
      currentStep += 1;
      if (currentStep > 3) clearInterval(interval); // Stop after all steps
      setStep(currentStep);
    }, 2000); // Update every 2 seconds

    return () => clearInterval(interval);
  }, [data]);

  useEffect(() => {
    if (step === 0) {
      // Step 1: Original Raw Data
      setChartData([{ type: "line", dataPoints: data, name: "Raw Signal", showInLegend: true }]);
    }
    else if (step == 1) {
      // Step 2: Apply Bandpass Filter
      const velocity = data.map(d => d.y);
      const filteredVelocity = bandPass(velocity);
      const filteredDataPoint = filteredVelocity.map((y, i) => ({ x: data[i].x, y }));
      setFilteredData(filteredDataPoint);
      setChartData([{ type: "line", dataPoints: filteredDataPoint, name: "Apply Bandpass Filter", showInLegend: true }]);
    }
    else if (step == 2) {
      // Step 3: Absolute Value & Gaussian Smoothing & Normalize
      const velocity = filteredData.map(d => d.y);
      const centeredVelocity = gaussianSmoothing(velocity, smoothingStd);
      const centeredDataPoint = centeredVelocity.map((y, i) => ({ x: data[i].x, y }));
      setCenteredData(centeredDataPoint);
      setChartData([{ type: "line", dataPoints: centeredDataPoint, name: "Gaussian Smoothing", showInLegend: true }]);
    }
    else if (step == 3) {
      // Step 4: Find Peak
      const velocity = centeredData.map(d => d.y);
      const { values, locations, level } = peaksFinder(velocity, std, widthFactor);
      const peaks = locations.map(([left, mid, right]) => ({
        x: data[mid].x,
        y: data[mid].y
      }));

      setPeaksData([{ type: "scatter", dataPoints: peaks, name: "Peaks", markerType: "circle", color: "red", showInLegend: true }]);
    }
  }, [step, data, std, widthFactor, smoothingStd, filteredData, centeredData])

  const options = {
    title: { text: "Seismic Detection Process" },
    axisX: { title: "Time" },
    axisY: { title: "Amplitude" },
    data: [...chartData, ...peaksData]
  };

  return <CanvasJSChart options={options} />;
}

export default SeismicPlot;