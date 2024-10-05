import React, { useState, useEffect, Component } from 'react';
import { Data, ChartInfo, PeakInfo } from '../types/Data';
import { bandPass } from '../helpers/bandPass';
import { peaksFinder } from '../helpers/peaksFinder';
import { gaussianSmoothing } from '../helpers/gaussianSmoothing';
// @ts-ignore
import CanvasJSReact from '@canvasjs/react-charts';

let CanvasJSChart = CanvasJSReact.CanvasJSChart;

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
}

class SeismicPlot extends Component<SeismicPlotProps, SeismicPlotState> {
  chart: any;
  updateInterval: number;

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
      innerStep: 0
    };

    this.chart = null;
    this.updateInterval = 33;
    this.updateChart = this.updateChart.bind(this);
  }

  componentDidMount() {
    setInterval(this.updateChart, this.updateInterval);
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

  updateChart() {
    const { step, data, nextData, kernel, idx } = this.state;

    // Bandpass filter logic
    if (step === 1) {
      if (kernel.length > 0) {
        let currentX = 0;
        if (idx < data.length && idx < nextData.length) {
          let stride = idx + 50 < data.length ? 50 : data.length - idx;
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
            let stride = idx + 50 < data.length ? 50 : data.length - idx;
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
    const { step, data, kernel, peaks, slopes, level } = this.state;

    // Render based on step value
    if (step === 0) {
      const options = {
        title: { text: 'Original Signal' },
        axisX: { title: 'Time' },
        axisY: { title: 'Amplitude' },
        data: [{ type: 'line', dataPoints: data }]
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
          stripLines: [{ value: level, thickness: 2, color: 'green' }]
        },
        data: [
          { type: 'line', dataPoints: data },
          { type: 'scatter', dataPoints: peaks, markerType: 'circle', color: 'red' }
        ]
      };

      slopes.forEach((slopeData: Data[]) => {
        options.data.push({ type: 'line', dataPoints: slopeData });
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