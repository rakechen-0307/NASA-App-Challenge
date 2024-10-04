/* App.js */
import React, { Component } from 'react';
import CanvasJSReact from '@canvasjs/react-charts';


var ndarray = require("ndarray")
var ops = require("ndarray-ops")
var convolve = require("ndarray-convolve");

var CanvasJS = CanvasJSReact.CanvasJS;
var CanvasJSChart = CanvasJSReact.CanvasJSChart;

function toDataPoints(x, y) {
	return x.map((x, i) => ({ x, y: y.get(i) }));
}
function toDataPoints2(dps, x, y) {
	dps = x.map((x, i) => ({ x, y: y.get(i) }));
}
// Data points
var y = ndarray(new Float32Array(Array.from({ length: 100 }, () => Math.random() * 10)), [100]);
ops.mulseq(y, 0.1);
var x = Array.from({ length: y.shape[0] }, (_, i) => i + 1);

// Square wave kernel
var kernel = ndarray(new Float32Array(10), [10]);
ops.assigns(kernel, 1);
ops.divseq(kernel, kernel.shape[0]);

// Gaussian Kernel
let sigma = 2;
let window_size = 6 * sigma;
let gaussian_kernel = ndarray(new Float32Array(window_size+1), [window_size+1]);
for (let i = -window_size/2; i <= window_size/2; i++) {
	let value = Math.exp(-i * i / (2 * sigma * sigma)) / (Math.sqrt(2 * Math.PI) * sigma);
	gaussian_kernel.set(i + window_size/2, value);
}
kernel = gaussian_kernel;

// Convolve
var y2 = ndarray(new Float32Array(y.shape[0]), y.shape);
convolve(y2, y, kernel);


// Chart points
var dps = toDataPoints(x, y);
var dps2 = toDataPoints(x, y2);
var dps3 = toDataPoints(Array.from({ length: kernel.shape[0] }, (_, i) => i + 1), kernel);

var updateInterval = 100;
class App extends Component {
	constructor() {
		super();
		this.updateChart = this.updateChart.bind(this);
	}
	componentDidMount() {
		setInterval(this.updateChart, updateInterval);
	}
	updateChart() {
		
		// dps.shift();
		// dps.push({x: xVal,y: yVal});
		// xVal++;
		// if (dps.length >  10 ) {
		// 	dps.shift();
		// }
		// Assuming dps and dps3 are defined and populated arrays
		if (dps3.length > 0) {
			let idx = dps3[dps3.length - 1].x;
			if (idx < dps.length && idx < dps2.length) {
				dps[idx] = dps2[idx];
			}
	
			if (dps3[dps3.length - 1].x < dps.length) {
				for (let i = 0; i < dps3.length; i++) {
					dps3[i].x += 1;
				}
			}
		}
		
		this.chart.render();
	}
	render() {
		const options = {
			title :{
				text: "Dynamic Line Chart"
			},
			data: [
				{
					type: "line",
					dataPoints : dps
				},
				// {
				// 	type: "line",
				// 	dataPoints : dps2
				// },
				{
					type: "line",
					dataPoints : dps3
				}
			]
		}
		return (
		<div>
			<CanvasJSChart options = {options}
				 onRef={ref => this.chart = ref}
			/>
			{/*You can get reference to the chart instance as shown above using onRef. This allows you to access all chart properties and methods*/}
		</div>
		);
	}
}
export default App;