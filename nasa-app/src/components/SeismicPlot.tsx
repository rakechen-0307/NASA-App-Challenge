import React, { useState, useEffect, Component } from 'react';
import { Data, ChartInfo, PeakInfo } from '../types/Data';

// @ts-ignore
import CanvasJSReact from '@canvasjs/react-charts';
import { lerp1D, lerp2D } from '../helpers/lerp';

let CanvasJSChart = CanvasJSReact.CanvasJSChart;
let slidingSpeed = 100; // samples per frame
const step3Frames = [20, 10, 30];
const maxMarkerSize = 10;

interface SeismicPlotProps {
  step: number;
  data: Data[];
  nextData: Data[];
  kernel: Data[];
  peaks: Data[];
  slopes: Data[][];
  level: number;
  peakLocation: number[];
}

interface SeismicPlotState {
  step: number;
  data: Data[];
  nextData: Data[];
  kernel: Data[];
  peaks: Data[];
  slopes: Data[][];
  level: number;
  peakLocation: number[];
  idx: number;
  innerStep: number;
  // For animation
  currentLevel: number;
  currentMarkerSize: number;
  currentSlopes: Data[][];
  slopeVisible: boolean;
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
      peakLocation: props.peakLocation,
      idx: 0,
      innerStep: 0,
      currentLevel: 0,
      currentMarkerSize: 0,
      currentSlopes: [],
      slopeVisible: false,
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
      
      this.setState({
        step: this.props.step,
        data: [...this.props.data],
        nextData: [...this.props.nextData],
        kernel: [...this.props.kernel],
        peaks: [...this.props.peaks],
        slopes: [...this.props.slopes],
        level: this.props.level,
        peakLocation: this.props.peakLocation,
        idx: 0, // Reset the index when new data comes in
        currentLevel: 0,
        currentMarkerSize: 0,
        currentSlopes: initialSlopes,
        slopeVisible: false,
      });
    }

    if (this.chart) {
      this.chart.render();
    }
  }

  updateChart() {
    const { step, data, nextData, kernel, idx, currentLevel, level, currentMarkerSize, currentSlopes, slopes } = this.state;

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
          this.setState({ idx: idx + stride });
        }

        if (idx < data.length) {
          let diff = currentX - kernel[kernel.length - 1].x;
          for (let i = 0; i < kernel.length; i++) {
            kernel[i].x += diff;
          }
        }
      }
      this.chart.render();
    }
    // Gaussian smoothing logic
    else if (step === 2) {
      let { innerStep } = this.state;
      if (innerStep === 0) {
        let velocity = data.map((d) => d.y);
        velocity = velocity.map(Math.abs);
        this.setState({
          data: velocity.map((y, i) => ({ x: data[i].x, y })),
          innerStep: 1
        });
      } else if (innerStep === 1) {
        if (kernel.length > 0) {
          let currentX = 0;
          if (idx < data.length && idx < nextData.length) {
            let stride = idx + slidingSpeed < data.length ? slidingSpeed : data.length - idx;
            for (let i = 0; i < stride; i++) {
              data[idx + i] = nextData[idx + i];
            }
            currentX = data[idx + stride - 1].x;
            this.setState({ idx: idx + stride });
          }
  
          if (idx < data.length) {
            let diff = currentX - kernel[kernel.length - 1].x;
            for (let i = 0; i < kernel.length; i++) {
              kernel[i].x += diff;
            }
          }
        }
      } else if (innerStep === 2) {
        let velocity = data.map((d) => d.y);
        const average: number = velocity.reduce((accumulator, value) => accumulator + value, 0) / velocity.length;
        let centeredVelocity = velocity.map((val) => val - average);
        centeredVelocity = centeredVelocity.map((val) => (val >= 0 ? val : 0));
        this.setState({
          data: centeredVelocity.map((y, i) => ({ x: data[i].x, y }))
        });
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
  }

  render() {
    const { step, data, kernel, peaks, currentSlopes, currentMarkerSize, peakLocation, currentLevel, slopeVisible } = this.state;

    // Render based on step value
    if (step === 0) {
      const options = {
        theme: "dark1",
        backgroundColor: "transparent",
        axisX: { 
          title: 'Time (s)',
          color: "#34dbeb",
          lineColor: "#34dbeb",
          tickColor: "#34dbeb",
          gridColor: "#34dbeb",
          labelFontColor: "#34dbeb",
          titleFontColor: "#34dbeb",
          lineThickness: 2,
          tickThickness: 1,
          gridThickness: 1,
        },
        axisY: { 
          title: 'Amplitude (m/s)',
          lineColor: "#34dbeb",
          tickColor: "#34dbeb",
          gridColor: "#34dbeb",
          labelFontColor: "#34dbeb",
          titleFontColor: "#34dbeb",
          lineThickness: 2,
          tickThickness: 1,
          gridThickness: 1,
        },
        data: [{
          type: 'line',
          dataPoints: data,
          color: "#34dbeb",
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
        title: { text: 'Bandpass Filter' },
        axisX: { title: 'Time' },
        axisY: { title: 'Amplitude' },
        data: [
          { type: 'line', dataPoints: data },
          { type: 'line', dataPoints: kernel }
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
        title: { text: 'Gaussian Smoothing' },
        axisX: { title: 'Time' },
        axisY: { title: 'Amplitude' },
        data: [
          { type: 'line', dataPoints: data },
          { type: 'line', dataPoints: kernel }
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
        title: { text: 'Find Peaks & Slopes' },
        axisX: { title: 'Time' },
        axisY: {
          title: 'Amplitude',
          stripLines: [{ value: currentLevel, thickness: 2, color: 'green' }]
        },
        data: [
          { type: 'line', dataPoints: data , visible: true},
          { type: 'scatter', dataPoints: peaks, markerType: 'circle', color: 'red', markerSize: currentMarkerSize }
        ]
      };

      currentSlopes.forEach((slopeData: Data[]) => {
        options.data.push({ type: 'line', dataPoints: slopeData, visible: slopeVisible });
      });

      return (
        <div>
          <CanvasJSChart options={options} onRef={(ref: any) => (this.chart = ref)} />
        </div>
      );
    }

    else if (step === 4) {
      const options = {
        title: { text: 'Mark Seismic Positions' },
        axisX: { title: 'Time', stripLines: [] as { thickness: number; value: number; color: string }[] },
        axisY: { title: 'Amplitude' },
        data: [
          { type: 'line', dataPoints: data },
        ]
      };
      peakLocation.forEach((location: number) => {
        options.axisX.stripLines.push({ thickness: 2, value: location , color: 'red' });
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