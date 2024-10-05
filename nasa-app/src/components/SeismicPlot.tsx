import React, { useState, useEffect, Component } from 'react';
import { Data } from '../types/Data';

// @ts-ignore
import CanvasJSReact from '@canvasjs/react-charts';

let CanvasJSChart = CanvasJSReact.CanvasJSChart;
let slidingSpeed = 100; // samples per frame

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
      innerStep: 0
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
    const { step, data, kernel, peaks, slopes, level, peakLocation } = this.state;

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
        data: [
          { type: 'line', dataPoints: data, color: "#34dbeb" },
          { type: 'line', dataPoints: kernel, color: "#f0a314" }
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
        data: [
          { type: 'line', dataPoints: data, color: "#34dbeb" },
          { type: 'line', dataPoints: kernel, color: "#f0a314" }
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
          stripLines: [{ value: level, thickness: 2, color: '#fcc419' }]
        },
        data: [
          { type: 'line', dataPoints: data, color: "#34dbeb" },
          { type: 'scatter', dataPoints: peaks, markerType: 'circle', color: '#f03e3e' }
        ]
      };

      slopes.forEach((slopeData: Data[]) => {
        options.data.push({ type: 'line', dataPoints: slopeData, color: "#74b816" });
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
          stripLines: [] as { thickness: number; value: number; color: string }[] },
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
        data: [
          { type: 'line', dataPoints: data, color: "#34dbeb" },
        ]
      };
      peakLocation.forEach((location: number) => {
        options.axisX.stripLines.push({ thickness: 2, value: location , color: '#f03e3e' });
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