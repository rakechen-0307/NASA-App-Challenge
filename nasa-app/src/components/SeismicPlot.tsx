import React from 'react';
import { Data } from '../types/Data';
// @ts-ignore
import CanvasJSReact from '@canvasjs/react-charts';

const CanvasJSChart = CanvasJSReact.CanvasJSChart;

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
  data: Data[];
  kernel: Data[];
  innerStep: number;
}

class SeismicPlot extends React.Component<SeismicPlotProps, SeismicPlotState> {
  private chart: any;
  private updateInterval: number;
  private intervalId: NodeJS.Timeout | null;

  constructor(props: SeismicPlotProps) {
    super(props);
    this.state = {
      data: props.data,
      kernel: props.kernel,
      innerStep: 0
    };
    this.chart = null;
    this.updateInterval = 100;
    this.intervalId = null;
  }

  componentDidMount() {
    this.intervalId = setInterval(this.updateChart, this.updateInterval);
  }

  componentWillUnmount() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  componentDidUpdate(prevProps: SeismicPlotProps) {
    if (prevProps.step !== this.props.step || prevProps.data !== this.props.data) {
      this.setState({
        data: this.props.data,
        kernel: this.props.kernel,
        innerStep: 0
      });
    }
  }

  updateChart = () => {
    const { step, nextData } = this.props;
    const { data, kernel, innerStep } = this.state;

    if (step === 1) {
      let idx = data.findIndex((d, i) => d.y !== nextData[i]?.y);
      if (idx !== -1 && idx < data.length) {
        const newData = [...data];
        newData[idx] = nextData[idx];
        const newKernel = kernel.length > 0 ? kernel.map(k => ({ ...k, x: k.x + 1 })) : kernel;
        this.setState({ data: newData, kernel: newKernel });
      }
    } else if (step === 2) {
      if (innerStep === 0) {
        const newData = data.map(d => ({ ...d, y: Math.abs(d.y) }));
        this.setState({ data: newData, innerStep: 1 });
      } else if (innerStep === 1) {
        let idx = data.findIndex((d, i) => d.y !== nextData[i]?.y);
        if (idx !== -1 && idx < data.length) {
          const newData = [...data];
          newData[idx] = nextData[idx];
          const newKernel = kernel.length > 0 ? kernel.map(k => ({ ...k, x: k.x + 1 })) : kernel;
          this.setState({ data: newData, kernel: newKernel });
        } else {
          this.setState({ innerStep: 2 });
        }
      } else if (innerStep === 2) {
        const average = data.reduce((acc, d) => acc + d.y, 0) / data.length;
        const newData = data.map(d => ({ ...d, y: Math.max(d.y - average, 0) }));
        this.setState({ data: newData, innerStep: 3 });
      }
    }

    if (this.chart) {
      this.chart.render();
    }
  };

  getChartOptions = () => {
    const { step, peaks, slopes, level } = this.props;
    const { data, kernel } = this.state;

    let options: any = {
      animationEnabled: true,
      zoomEnabled: true,
      title: { text: this.getTitle() },
      axisX: { title: "Time" },
      axisY: { title: "Amplitude" },
      data: [
        {
          type: "line",
          dataPoints: data
        }
      ]
    };

    if (step === 1 || step === 2) {
      options.data.push({
        type: "line",
        dataPoints: kernel
      });
    }

    if (step === 3) {
      options.axisY.stripLines = [{value: level, thickness: 2, color: "green"}];
      options.data.push({
        type: "scatter",
        dataPoints: peaks,
        markerType: "circle",
        color: "red"
      });
      slopes.forEach(slopeData => {
        options.data.push({
          type: 'line',
          dataPoints: slopeData
        });
      });
    }

    return options;
  };

  getTitle = () => {
    switch (this.props.step) {
      case 0: return "Original Signal";
      case 1: return "Bandpass Filter";
      case 2: return "Gaussian Smoothing";
      case 3: return "Find Peaks & Slopes";
      default: return "Seismic Plot";
    }
  };

  render() {
    return (
      <div>
        <CanvasJSChart options={this.getChartOptions()} onRef={(ref: any) => this.chart = ref} />
      </div>
    );
  }
}

export default SeismicPlot;