class App extends Component {
    constructor() {
        super();
        this.state = {
            dps: [], // Original signal
            dps2: [], // Smoothed signal
            dps3: [] // Kernel
        };
        this.updateChart = this.updateChart.bind(this);
        this.kernelSize = 5; // Example kernel size
        this.kernel = [1, 1, 1, 1, 1]; // Example kernel values
        this.xVal = 0;
        this.updateInterval = 1000;
    }
    componentDidMount() {
        setInterval(this.updateChart, this.updateInterval);
    }
    updateChart() {
        const { dps, dps2, dps3 } = this.state;
        const newDps = [...dps];
        const newDps2 = [...dps2];
        const newDps3 = [...dps3];

        // Update original signal
        const yVal = Math.sin(this.xVal * 0.1) * 10 + Math.random() * 5; // Example signal
        newDps.push({ x: this.xVal, y: yVal });
        if (newDps.length > 50) {
            newDps.shift();
        }

        // Update kernel position
        const kernelPosition = this.xVal % (newDps.length - this.kernelSize);
        newDps3.length = 0; // Clear previous kernel
        for (let i = 0; i < this.kernelSize; i++) {
            newDps3.push({ x: kernelPosition + i, y: this.kernel[i] });
        }

        // Update smoothed signal
        if (this.xVal >= this.kernelSize) {
            const smoothedValue = this.kernel.reduce((sum, k, i) => sum + k * newDps[kernelPosition + i].y, 0) / this.kernelSize;
            newDps2.push({ x: this.xVal, y: smoothedValue });
            if (newDps2.length > 50) {
                newDps2.shift();
            }
        }

        this.setState({ dps: newDps, dps2: newDps2, dps3: newDps3 });
        this.xVal++;
        this.chart.render();
    }
    render() {
        const options = {
            title: {
                text: "Dynamic Line Chart"
            },
            data: [
                {
                    type: "line",
                    dataPoints: this.state.dps
                },
                {
                    type: "line",
                    dataPoints: this.state.dps2
                },
                {
                    type: "line",
                    dataPoints: this.state.dps3
                }
            ]
        };
        return (
            <div>
                <CanvasJSChart options={options} onRef={ref => this.chart = ref} />
                {/*You can get reference to the chart instance as shown above using onRef. This allows you to access all chart properties and methods*/}
            </div>
        );
    }
}