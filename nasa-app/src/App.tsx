import React, { useState } from 'react';
import FileInput from './components/FileInput';
import { Data } from './types/Data';
import SeismicPlot from './components/SeismicPlot';
// @ts-ignore
import CanvasJSReact from '@canvasjs/react-charts';

function App() {
  const [data, setData] = useState<Data[]>([]);

  const handleFileLoad = (loadedData: any) => {
    let datapoints: Data[] = [];
    loadedData.map((point: any) => {
      let datapoint: Data = {
        x: point[1],
        y: point[2]
      };
      datapoints.push(datapoint);
    });
    setData(datapoints);
  };

  return (
    <div>
      <h1>CSV Import in React.js</h1>
      <FileInput onFileLoad={handleFileLoad} />
      {data.length > 0 && <SeismicPlot data={data} std={2} widthFactor={0.3} smoothingStd={600} />}
    </div>
  );
}

export default App;
