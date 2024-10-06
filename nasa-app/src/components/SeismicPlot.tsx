import React, { useState, useEffect, Component } from 'react';
import { Data } from '../types/Data';
import { lerp2D, lerp1D } from '../helpers/lerp';

// @ts-ignore
import CanvasJSReact from '@canvasjs/react-charts';
import { toDataPoints } from '../helpers/toDataPoints';

let CanvasJSChart = CanvasJSReact.CanvasJSChart;
const slidingSpeed = 100; // samples per frame
const step2Frames = [20, 20]; // step2 animation frames
const step3Frames = [20, 10, 30]; // step3 animation frames
const step4Frames = 50; // step4 animation frames for each peak
const maxMarkerSize = 10; // step3 peak marker size
const axisColor = "#9b9ebd";
const dataColor = "#57c5cf";


const commonAxisConfig = {
  lineColor: axisColor,
  tickColor: axisColor,
  gridColor: "#34dbeb",
  labelFontColor: axisColor,
  titleFontColor: axisColor,
  lineThickness: 1,
  tickThickness: 1,
  gridThickness: 0,
};

const commonPlotConfig = {
  theme: "dark1",
  backgroundColor: "transparent",
};

interface SeismicPlotProps {
  step: number;
  data: Data[];
  nextData: Data[];
  kernel: Data[];
  peaks: Data[];
  slopes: Data[][];
  level: number;
  startLocations: number[];
  endLocations: number[];
}

interface SeismicPlotState {
  step: number;
  data: Data[];
  nextData: Data[];
  kernel: Data[];
  peaks: Data[];
  slopes: Data[][];
  level: number;
  startLocations: number[];
  endLocations: number[];
  idx: number;
  innerStep: number;
  kernelLocation: number;
  // For animation
  absData: Data[];
  normalizeData: Data[];
  currentData: Data[];
  currentLevel: number;
  currentMarkerSize: number;
  currentSlopes: Data[][];
  slopeVisible: boolean;
  currentPeakLocation: number[];
  currentPeakIndex: number;
  maximum: number;
  minimum: number;
}

class SeismicPlot extends Component<SeismicPlotProps, SeismicPlotState> {
  chart: any;
  updateInterval: number;
  intervalId: any;

  constructor(props: SeismicPlotProps) {
    super(props);

    this.state = {
      step: props.step,
      data: [...props.data],
      nextData: [...props.nextData],
      kernel: [...props.kernel],
      peaks: [...props.peaks],
      slopes: [...props.slopes],
      level: props.level,
      startLocations: props.startLocations,
      endLocations: props.endLocations,
      idx: 0,
      innerStep: 0,
      kernelLocation: 0,
      // animation
      absData: [],
      normalizeData: [],
      currentData: [],
      currentLevel: 0,
      currentMarkerSize: 0,
      currentSlopes: [],
      slopeVisible: false,
      currentPeakLocation: [],
      currentPeakIndex: 0,
      // For axis
      maximum: props.data.reduce((max, p) => p.y > max ? p.y : max, props.data[0].y),
      minimum: props.data.reduce((min, p) => p.y < min ? p.y : min, props.data[0].y),
    };

    this.chart = null;
    this.updateInterval = 33;
    this.updateChart = this.updateChart.bind(this);
  }

  componentDidMount() {
    this.intervalId = setInterval(this.updateChart, this.updateInterval);
  }

  componentWillUnmount() {
    clearInterval(this.intervalId);
  }

  componentDidUpdate(prevProps: SeismicPlotProps) {
    // If props change, update the state with new props
    if (
      prevProps.step !== this.props.step ||
      prevProps.data !== this.props.data ||
      prevProps.nextData !== this.props.nextData ||
      prevProps.kernel !== this.props.kernel ||
      prevProps.peaks !== this.props.peaks ||
      prevProps.slopes !== this.props.slopes ||
      prevProps.level !== this.props.level
    ) {
      let initialSlopes = [];
      for (let i = 0; i < this.props.slopes.length; i++) {
        initialSlopes.push([this.props.slopes[i][1], this.props.slopes[i][1], this.props.slopes[i][1]]);
      }
      // Calculate the average of nextData
      let velocity = this.props.nextData.map((d) => d.y);
      const average: number = velocity.reduce((accumulator, value) => accumulator + value, 0) / velocity.length;
      let normalizedVelocity = velocity.map((val) => val - average);
      normalizedVelocity = normalizedVelocity.map((val) => (val >= 0 ? val : 0));
      const normalizedPoints = toDataPoints(this.props.nextData.map((d) => d.x), normalizedVelocity);

      this.setState({
        step: this.props.step,
        data: [...this.props.data],
        nextData: [...this.props.nextData],
        kernel: [...this.props.kernel],
        peaks: [...this.props.peaks],
        slopes: [...this.props.slopes],
        level: this.props.level,
        startLocations: this.props.startLocations,
        endLocations: this.props.endLocations,
        idx: 0, // Reset the index when new data comes in
        innerStep: 0,
        kernelLocation: 0,
        // Animation
        currentLevel: 0,
        currentMarkerSize: 0,
        currentSlopes: initialSlopes,
        slopeVisible: false,
        currentData: this.props.data.map((d) => (d)),
        absData: this.props.data.map((d) => ({ x: d.x, y: Math.abs(d.y) })),
        normalizeData: normalizedPoints,
        currentPeakLocation: Array(this.props.startLocations.length).fill(0),
        currentPeakIndex: 0,
      });
    }

    if (this.chart) {
      this.chart.render();
    }
  }

  updateChart() {
    const { step, data, nextData, kernel, idx, currentData, currentLevel, currentMarkerSize, currentPeakIndex, currentPeakLocation, currentSlopes, level, slopes, startLocations, absData, normalizeData, kernelLocation } = this.state;

    // Bandpass filter logic
    if (step === 1) {
      if (kernel.length > 0) {
        let currentX = 0;
        if (idx < data.length && idx < nextData.length) {
          let stride = idx + slidingSpeed < data.length ? slidingSpeed : data.length - idx;
          for (let i = 0; i < stride; i++) {
            data[idx + i] = nextData[idx + i];
          }
          currentX = data[idx + stride - 1].x;
          let diff = currentX - kernelLocation;
          this.setState({ kernelLocation: kernelLocation + diff, idx: idx + stride });
        }
        this.chart.render();
      }
    }
    // Gaussian smoothing logic
    else if (step === 2) {
      let { innerStep } = this.state;

      if (innerStep === 0) {        
        if (idx < step2Frames[0]) {
          let newData = data.map(d => ({ ...d }));
          for (let i = 0; i < currentData.length; i++) {
            newData[i].y = lerp1D(data[i].y, absData[i].y, idx, step2Frames[0]);
          }
          this.setState({ idx: idx + 1, currentData: newData });
        }
        else
        {
          this.setState({ innerStep: 1, idx: 0 });
        }
      } else if (innerStep === 1) {
        if (kernel.length > 0) {
          let currentX = 0;
          if (idx < currentData.length && idx < nextData.length) {
            let stride = idx + slidingSpeed < currentData.length ? slidingSpeed : currentData.length - idx;
            let newData = [...currentData];
            for (let i = 0; i < stride; i++) {
              newData[idx + i] = nextData[idx + i];
            }
            currentX = newData[idx + stride - 1].x;
        
            let diff = currentX - kernelLocation;
            this.setState({ kernelLocation: kernelLocation + diff, idx: idx + stride, currentData: newData });
          }
          else {
            this.setState({ innerStep: 2, idx: 0 });
          }
        }
      } else if (innerStep === 2) {
        if (idx < step2Frames[1]) {
          let newData = data.map(d => ({ ...d }));
          for (let i = 0; i < currentData.length; i++) {
            newData[i].y = lerp1D(nextData[i].y, normalizeData[i].y, idx, step2Frames[1]);
          }
          this.setState({ idx: idx + 1, currentData: newData });
        }
        else
        {
          this.setState({ innerStep: 3 });
        }
      }
      else {
        return;
      }
      this.chart.render();
    }
    // Find peaks
    else if (step === 3) {
      if (idx < step3Frames[0]) {
        let newLevel = lerp1D(currentLevel, level, idx, step3Frames[0]);
        this.setState({ idx: idx + 1, currentLevel: newLevel });
        this.chart.render();
      }
      else if (idx < step3Frames[0] + step3Frames[1]) {
        let newMarkerSize = lerp1D(currentMarkerSize, maxMarkerSize, idx - step3Frames[0], step3Frames[1]);
        this.setState({ idx: idx + 1, currentMarkerSize: newMarkerSize });
        this.chart.render();
      }
      else if (idx < step3Frames[0] + step3Frames[1] + step3Frames[2]) {
        let newSlopes = [...currentSlopes];
        for (let i = 0; i < slopes.length; i++) {
          newSlopes[i][0] = lerp2D(currentSlopes[i][0], slopes[i][0], idx - step3Frames[0] - step3Frames[1], step3Frames[2]);
          newSlopes[i][2] = lerp2D(currentSlopes[i][2], slopes[i][2], idx - step3Frames[0] - step3Frames[1], step3Frames[2]);        
        }
        this.setState({ idx: idx + 1, currentSlopes: newSlopes, slopeVisible: true });
        this.chart.render();
      }
    }

    else if (step === 4) {
      if (currentPeakIndex >= startLocations.length) {
        return;
      }
      if (idx >= step4Frames) {
        this.setState({ currentPeakIndex: currentPeakIndex + 1, idx: 0 });
      }
      else {
        let newPeakLocation = [...currentPeakLocation];
        newPeakLocation[currentPeakIndex] = lerp1D(currentPeakLocation[currentPeakIndex], startLocations[currentPeakIndex], idx, step4Frames);
        this.setState({ idx: idx + 1, currentPeakLocation: newPeakLocation });
        this.chart.render();
      }
    }
  }

  render() {
    const { step, data, kernel, peaks, slopeVisible, currentData, currentLevel, 
            currentSlopes, currentMarkerSize, currentPeakLocation, maximum, minimum, kernelLocation } = this.state;

    // Render based on step value
    if (step === 0) {
      const options = {
        theme: "dark1",
        backgroundColor: "transparent",
        height: 200,
        axisX: { 
          title: 'Time (s)',
          ...commonAxisConfig,
        },
        axisY: { 
          title: 'Amplitude (m/s)',
          ...commonAxisConfig,
          viewportMinimum: 1.5 * minimum,
          viewportMaximum: 1.5 * maximum,
        },
        data: [{
          type: 'line',
          dataPoints: data,
          color: dataColor,
        }]
      };

      return (
        <div>
          <CanvasJSChart options={options} onRef={(ref: any) => (this.chart = ref)} />
        </div>
      );
    }

    // Bandpass filter rendering
    else if (step === 1) {
      const options = {
        theme: "dark1",
        backgroundColor: "transparent",
        height: 200,
        axisX: { 
          title: 'Time (s)',
          ...commonAxisConfig,
          stripLines: [{ value: kernelLocation, thickness: 5, color: '#fcc419' }]
        },
        axisY: { 
          title: 'Amplitude (m/s)',
          ...commonAxisConfig,
          viewportMinimum: 1.5 * minimum,
          viewportMaximum: 1.5 * maximum,
        },
        data: [
          { type: 'line', dataPoints: data, color: dataColor },
        ]
      };

      return (
        <div>
          <CanvasJSChart options={options} onRef={(ref: any) => (this.chart = ref)} />
        </div>
      );
    }

    // Gaussian smoothing rendering
    else if (step === 2) {
      const options = {
        theme: "dark1",
        backgroundColor: "transparent",
        height: 200,
        axisX: { 
          title: 'Time (s)',
          ...commonAxisConfig,
          stripLines: [{ value: kernelLocation, thickness: 5, color: '#fcc419' }]
        },
        axisY: { 
          title: 'Amplitude (m/s)',
          ...commonAxisConfig,
          viewportMinimum: minimum,
          viewportMaximum: maximum,
        },
        data: [
          { type: 'line', dataPoints: currentData, color: dataColor },
        ]
      };

      return (
        <div>
          <CanvasJSChart options={options} onRef={(ref: any) => (this.chart = ref)} />
        </div>
      );
    }

    // Peaks and slopes rendering
    else if (step === 3) {
      const options = {
        theme: "dark1",
        backgroundColor: "transparent",
        height: 200,
        axisX: { 
          title: 'Time (s)',
          ...commonAxisConfig,
        },
        axisY: {
          title: 'Amplitude (m/s)',
          ...commonAxisConfig,
          stripLines: [{ value: currentLevel, thickness: 2, color: '#fcc419' }]
        },
        data: [
          { type: 'line', dataPoints: data, color: dataColor, visible: true },
          { type: 'scatter', dataPoints: peaks, markerType: 'circle', color: '#f03e3e', markerSize: currentMarkerSize },
        ]
      };
      currentSlopes.forEach((slopeData: Data[]) => {
        options.data.push({ type: 'line', dataPoints: slopeData, color: "#91e817", visible: slopeVisible });
      });

      return (
        <div>
          <CanvasJSChart options={options} onRef={(ref: any) => (this.chart = ref)} />
        </div>
      );
    }

    else if (step === 4) {
      const options = {
        theme: "dark1",
        backgroundColor: "transparent",
        height: 300,
        axisX: { 
          title: 'Time (s)',
          ...commonAxisConfig,
          stripLines: [] as { thickness: number; value: number; color: string }[] },
        axisY: {
          title: 'Amplitude (m/s)',
          ...commonAxisConfig,
        },
        data: [
          { type: 'line', dataPoints: data, color: dataColor },
        ]
      };
      currentPeakLocation.forEach((location: number) => {
        options.axisX.stripLines.push({ thickness: 5, value: location , color: '#f03e3e' });
      });

      return (
        <div>
          <CanvasJSChart options={options} onRef={(ref: any) => (this.chart = ref)} />
        </div>
      );
    }
    return null;
  }
}

export default SeismicPlot;