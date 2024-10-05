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

class SeismicPlot extends Component<SeismicPlotProps> {

  // variables
  step: number;
  data: Data[];
  nextData: Data[];
  kernel: Data[];
  peaks: Data[];
  slopes: Data[][];
  level: number;
  peakLocation: number[];
  updateInterval: number;
  innerStep: number = 0;
  chart: any;

  constructor(props: SeismicPlotProps) {
    super(props);
    console.log(props);
    this.step = props.step;
    this.data = props.data;
    this.nextData = props.nextData;
    this.kernel = props.kernel;
    this.peaks = props.peaks;
    this.slopes = props.slopes;
    this.level = props.level;
    this.peakLocation = props.peakLocation;

    // Initialize the ref to null
    this.chart = null;

    this.updateInterval = 100;
    this.updateChart = this.updateChart.bind(this);
  }
  componentDidMount() {
		setInterval(this.updateChart, this.updateInterval);
	}
  updateChart() {
    // bandpass filter
    if (this.step === 1) {
      let idx = 0;
      if (this.kernel.length > 0) {
        if (idx < this.data.length && idx < this.nextData.length) {
          this.data[idx] = this.nextData[idx];
          idx++;
        }
    
        if (idx < this.data.length) {
          for (let i = 0; i < this.kernel.length; i++) {
            this.kernel[i].x += 1;
          }
        }
      }   
      this.chart.render();
    }
    // gaussian smoothing
    else if (this.step === 2) {
      if (this.innerStep === 0) {
        let velocity = this.data.map(d => d.y);
        velocity = velocity.map(Math.abs);
        this.data = velocity.map((y, i) => ({ x: this.data[i].x, y }));
        this.innerStep = 1;
      }
      else if (this.innerStep === 1) {
        let idx = 0;
        if (this.kernel.length > 0) {
          if (idx < this.data.length && idx < this.nextData.length) {
            this.data[idx] = this.nextData[idx];
            idx++;
          }
      
          if (idx < this.data.length) {
            for (let i = 0; i < this.kernel.length; i++) {
              this.kernel[i].x += 1;
            }
          }
          else {
            this.innerStep = 2;
          }
        }   
      }
      else if (this.innerStep === 2) {
        let velocity = this.data.map(d => d.y);
        const average: number = velocity.reduce((accumulator, value) => (accumulator + value), 0) / velocity.length;
        let centeredVelocity = velocity.map(val => val - average);
        centeredVelocity = centeredVelocity.map(val => (val >= 0 ? val : 0));
        this.data = centeredVelocity.map((y, i) => ({ x: this.data[i].x, y }));
      }

      this.chart.render();
    }
  }
  render() {
    // original signal
    if (this.step === 0) {
      const options = {
        title: { text: "Original Signal" },
        axisX: { title: "Time" },
        axisY: { title: "Amplitude" },
        data: [
          {
            type: "line",
            dataPoints: this.data
          }
        ]
      }

      return (
        <div>
          <CanvasJSChart options = {options} onRef={(ref: any) => this.chart = ref}/>
        </div>
      )
    }
    // bandpass filter
    else if (this.step === 1) {
      const options = {
        title: { text: "Bandpass Filter" },
        axisX: { title: "Time" },
        axisY: { title: "Amplitude" },
        data: [
          {
            type: "line",
            dataPoints: this.data
          },
          {
            type: "line",
            dataPoints: this.kernel
          }
        ]
      }

      return (
        <div>
          <CanvasJSChart options = {options} onRef={(ref: any) => this.chart = ref}/>
        </div>
      )
    }
    // gaussian smoothing
    else if (this.step === 2) {
      const options = {
        title: { text: "Gaussian Smoothing" },
        axisX: { title: "Time" },
        axisY: { title: "Amplitude" },
        data: [
          {
            type: "line",
            dataPoints: this.data
          },
          {
            type: "line",
            dataPoints: this.kernel
          }
        ]
      }

      return (
        <div>
          <CanvasJSChart options = {options} onRef={(ref: any) => this.chart = ref}/>
        </div>
      )
    }
    // find peaks and slopes
    else if (this.step === 3) {
      const options = {
        title: { text: "Find Peaks & Slopes" },
        axisX: { title: "Time" },
        axisY: { 
          title: "Amplitude", 
          stripLines: [{value: this.level, thickness: 2, color: "green"}] 
        },
        data: [
          {
            type: "line",
            dataPoints: this.data
          },
          {
            type: "scatter",
            dataPoints: this.peaks,
            markerType: "circle",
            color: "red"
          }
        ]
      }
      this.slopes.map((data) => {
        options.data.push({
          type: 'line',
          dataPoints: data
        })
      })

      return (
        <div>
          <CanvasJSChart options = {options} onRef={(ref: any) => this.chart = ref}/>
        </div>
      )
    }
  }
}

export default SeismicPlot;