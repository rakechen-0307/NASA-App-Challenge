import React, { useState, useEffect, Component } from 'react';
import { Data, ChartInfo, PeakInfo } from '../types/Data';

// @ts-ignore
import CanvasJSReact from '@canvasjs/react-charts';

let CanvasJSChart = CanvasJSReact.CanvasJSChart;
const slidingSpeed = 100; // samples per frame
const viewportSize = 100; // zoom in view size (samples)

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
  minView: number,
  maxView: number,
}

class SeismicSubPlot extends Component<SeismicPlotProps, SeismicPlotState> {
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
      minView: 0,
      maxView: viewportSize,
    };
    this.chart = null;
    this.updateInterval = 33;
    this.updateChart = this.updateChart.bind(this);
    this.intervalId = null;
  }

  componentDidMount() {
    this.intervalId = setInterval(this.updateChart, this.updateInterval);
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
      this.setState({
        step: this.props.step,
        data: [...this.props.data],
        nextData: [...this.props.nextData],
        kernel: [...this.props.kernel],
        peaks: [...this.props.peaks],
        slopes: [...this.props.slopes],
        level: this.props.level,
        peakLocation: this.props.peakLocation,
        idx: 0 // Reset the index when new data comes in
      });
    }

    if (this.chart) {
      this.chart.render();
    }
  }
  componentWillUnmount() {
    clearInterval(this.intervalId);
  }
  updateChart() {
    const { step, data, nextData, kernel, idx, peakLocation } = this.state;

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
  }

  render() {
    const { step, data, kernel, minView, maxView, idx } = this.state;

    // Render based on step value
    // Bandpass filter rendering
    if (step === 1) {
      // console.log(data[idx - Math.floor(viewportSize/2)]);
      const halfViewportSize = Math.floor(viewportSize / 2);
      const viewportMinimumIndex = Math.max(0, idx - halfViewportSize);
      const viewportMaximumIndex = Math.min(data.length - 1, idx + halfViewportSize);
      const options = {
        title: { text: 'Bandpass Filter' },
        axisX: { 
          title: 'Time (s)',
          viewportMinimum: data[viewportMinimumIndex].x,
          viewportMaximum: data[viewportMaximumIndex].x,
        },
        axisY: { title: 'Amplitude (m/s)' },
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
      const halfViewportSize = Math.floor(viewportSize / 2);
      const viewportMinimumIndex = Math.max(0, idx - halfViewportSize);
      const viewportMaximumIndex = Math.min(data.length - 1, idx + halfViewportSize);
      const options = {
        title: { text: 'Gaussian Smoothing' },
        axisX: { 
          title: 'Time (s)',
          viewportMinimum: viewportMinimumIndex,
          viewportMaximum: viewportMaximumIndex,
        },
        axisY: { title: 'Amplitude (m/s)' },
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
    return null;
  }
}

export default SeismicSubPlot;