import './App.css';
import React, { useEffect, useState, useRef } from 'react';
import FileUploadButton from './components/MUI-Fileinput';
import { Data } from './types/Data';
import SeismicPlot from './components/SeismicPlot';

import ThreeSimulator from './components/ThreeSimulator';
import { threeController } from './components/ThreeSimulator/ThreeController';
import { AppBar, ThemeProvider, Toolbar } from '@mui/material';

// theme import
import theme from './theme';
import { Box, Typography, Grid, Button, IconButton, Stack, Fade } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import InfoIcon from '@mui/icons-material/Info';
import { MaterialUISwitch } from './components/switches';

import { Planet } from './types/Three';
// import Music from './components/Music';

// import lunarData from './data/lunar.json';
// import marsData from './data/mars.json';

function App() {
  const [step, setStep] = useState<number>(0);
  const [planet, setPlanet] = useState<string>("lunar");
  const [description, setDescription] = useState<string>("");
  const [processedData, setProcessedData] = useState<any>({
    data: [],
    filteredData: [],
    smoothedData: [],
    normalizedData: [],
    peaksData: [],
    slopesData: [],
    level: 0,
    startLocations: [],
    endLocations: []
  });
  const [fadeIn, setFadeIn] = useState<boolean>(false);  // descriptions' fade in effect
  const [useDefault, setUseDefault] = useState<boolean>(false);

  // let defualtData = lunarData;
  let ts = 0.1509;
  let std = 2;
  let smoothingStd = 600;
  let slopeThreshold = 5e-13;
  let ratioThreshold = 2;
  let widthFactor = 0.3;
  let bp_coef = Array(-0.015468212, 0.005414803, -0.021013882, -0.00472374, 4.77E-02,
    0.026547969, 0.002031613, 0.055068256, 0.038977124, -0.058782592,
    -0.034768745, 0.002012645, -0.170557003, -0.224228809, 0.151489773,
    0.437803402, 0.151489773, -0.224228809, -0.170557003, 0.002012645,
    -0.034768745, -0.058782592, 0.038977124, 0.055068256, 0.002031613,
    0.026547969, 0.047658812, -4.72E-03, -0.021013882, 0.005414803, -0.015468212);

  const descriptions = [
    "1. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "2. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "3. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum.",
    "4. Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  ]

  useEffect(() => {
    if (planet === "lunar") {
      // defualtData = lunarData;
      ts = 0.1509;
      std = 2;
      smoothingStd = 600;
      slopeThreshold = 5e-13;
      ratioThreshold = 1.5;
      widthFactor = 0.3;
      bp_coef = Array(-0.015468212, 0.005414803, -0.021013882, -0.00472374, 4.77E-02,
        0.026547969, 0.002031613, 0.055068256, 0.038977124, -0.058782592,
        -0.034768745, 0.002012645, -0.170557003, -0.224228809, 0.151489773,
        0.437803402, 0.151489773, -0.224228809, -0.170557003, 0.002012645,
        -0.034768745, -0.058782592, 0.038977124, 0.055068256, 0.002031613,
        0.026547969, 0.047658812, -4.72E-03, -0.021013882, 0.005414803, -0.015468212);
    }
    else if (planet === "mars") {
      // defualtData = marsData;
      ts = 0.05;
      std = 1.3;
      smoothingStd = 3e2;
      slopeThreshold = 5e-13;
      ratioThreshold = 1.5;
      widthFactor = 0.3;
      bp_coef = Array(-0.015753723, -0.039009518, -0.032765272, -0.006810152, -0.001507097, -0.034209679,
        -0.069394178, -0.059643647, -0.012730875, 0.005371116, -0.049134331, -0.124987344,
        -0.110448191, 0.04424677, 0.249863191, 0.345144188, 0.249863191, 0.04424677, -0.110448191,
        -0.124987344, -0.049134331, 0.005371116, -0.012730875, -0.059643647, -0.069394178,
        -0.034209679, -0.001507097, -0.006810152, -0.032765272, -0.039009518, -0.015753723);
    }
  }, [planet]);

  useEffect(() => {
    setDescription(descriptions[step - 1]);
  }, [step]);

  const quakeIntervalRef = useRef<any>(null);
  const workerRef = useRef<Worker | null>(null);

  useEffect(() => {
    workerRef.current = new Worker(new URL('./helpers/fileProcessWorker.ts', import.meta.url));

    workerRef.current.onmessage = (e) => {
      const { downDataPoints, downFilteredDataPoint, downSmoothedDataPoint,
        downNormalizedDataPoint, peaks, slopes, level, startLocations,
        endLocations } = e.data;

      setProcessedData({
        data: downDataPoints,
        filteredData: downFilteredDataPoint,
        smoothedData: downSmoothedDataPoint,
        normalizedData: downNormalizedDataPoint,
        peaksData: peaks,
        slopesData: slopes,
        level: level,
        startLocations: startLocations,
        endLocations: endLocations
      })

      // Stop the quakes once processing is done
      clearInterval(quakeIntervalRef.current);
    }

    return () => {
      if (workerRef.current) workerRef.current.terminate();
    };
  }, []);

  const handlePlanetSwitch = () => {
    if (planet === "lunar") {
      setPlanet("mars");
      threeController.triggerUpdatePlanetType(100, 100, Planet.MARS);
    }
    else if (planet === "mars") {
      setPlanet("lunar");
      threeController.triggerUpdatePlanetType(100, 100, Planet.MOON);
    }
  }

  const bandPassKernel = (ts: number, data: Data[], bp_coef: number[]): Data[] => {
    let kernel = bp_coef.map((value, i) => ({ x: -i * ts, y: value }));

    const maxDataValue = Math.max(...data.map(d => d.y));
    const maxKernelValue = Math.max(...kernel.map(k => k.y));

    // Normalize the kernel for visulization
    kernel = kernel.map(k => ({ x: k.x, y: k.y * 0.5 * (maxDataValue / maxKernelValue) }));

    return kernel;
  }

  const gaussianKernel = (std: number, ts: number, data: Data[]): Data[] => {
    let window_size = 6 * std;
    let kernel = Array(window_size + 1).fill(0);
    let x = Array(window_size + 1).fill(0);

    for (let i = -window_size / 2; i <= window_size / 2; i++) {
      let value = Math.exp(-i * i / (2 * std * std)) / (Math.sqrt(2 * Math.PI) * std);
      kernel[i + window_size / 2] = value;
      x[i + window_size / 2] = i * ts;
    }

    // Normalize the kernel for visulization
    const maxDataValue = Math.max(...data.map(d => d.y));
    const maxKernelValue = Math.max(...kernel);

    kernel = kernel.map((value, i) => ({ x: x[i], y: value * 0.5 * (maxDataValue / maxKernelValue) }));

    return kernel;
  }

  const handleFileLoad = (loadedData: any) => {
    setStep(0);
    // Trigger quakes while processing
    quakeIntervalRef.current = setInterval(() => {
      threeController.triggerRandomQuake(0.03, 20, 5, 0.02);
    }, 200);

    const params = {
      ts: ts,
      std: std,
      smoothingStd: smoothingStd,
      slopeThreshold: slopeThreshold,
      ratioThreshold: ratioThreshold,
      widthFactor: widthFactor,
      bp_coef: bp_coef
    }

    workerRef.current?.postMessage({ loadedData, params });
  };

  const handleUseDefault = (data: any) => {
    setUseDefault(!useDefault);
    handleFileLoad(data.data);
  }
  // const musicUrls = {
  //   lunar: "assets/indian.mp3",
  //   mars: "assets/indian.mp3"
  // };
  // <Music urls={musicUrls} currentTrack={planet} />

  return (
    <ThemeProvider theme={theme}>
      <ThreeSimulator />
      <Box sx={{ backgroundColor: "transparent", minHeight: "100vh", padding: "30px" }}>
        <Grid container alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
          <Grid item xs={12} md={7}>
            <Typography variant="h3" sx={{ fontFamily: 'Prompt, sans-serif', fontStyle: "bold", fontWeight: 700, color: "white", mr: 4 }}>
              Seismic Waveform Detection
            </Typography>
          </Grid>
          <Grid item xs={12} md={5}>
            <Stack direction="row" spacing={2} alignItems="center" justifyContent="flex-end">
              <Typography variant="h4" sx={{ fontFamily: 'Prompt, sans-serif', fontStyle: "italic", fontWeight: 300, color: "white" }}>
                by Reaching Stars
              </Typography>
              <Stack direction="row" spacing={1}>
                <IconButton aria-label="delete" sx={{ color: "white" }}>
                  <GitHubIcon sx={{ fontSize: 40 }} />
                </IconButton>
                <IconButton aria-label="delete" sx={{ color: "white" }}>
                  <InfoIcon sx={{ fontSize: 40 }} />
                </IconButton>
              </Stack>
            </Stack>
          </Grid>
        </Grid>
        <Typography variant="h6" sx={{ fontFamily: 'Prompt, sans-serif', fontStyle: "normal", fontWeight: 250, color: "white", mb: 1 }}>
          This is a demo of our seismic waveform detection algorithm. Upload a CSV file and choose the step you want to observe !
        </Typography>

        {/* Steps */}
        <Grid container justifyContent="left" spacing={1} sx={{ mb: 4 }}>
          <Grid item>
            <FileUploadButton onFileLoad={handleFileLoad} isDisabled={useDefault} />
          </Grid>
          <Grid item>
            {/*<Button variant="contained"
              sx={{ backgroundColor: "#3c8eaa", color: "white" }}
              onClick={() => handleUseDefault(defualtData)}>
              {useDefault ? "Upload CSV" : "Use Default"}
            </Button>*/}
          </Grid>
          <Grid item>
            <Button variant="contained"
              sx={{ backgroundColor: "#2e2e2e", color: "white" }}
              onClick={() => setStep(1)}>
              Bandpass Filter
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained"
              sx={{ backgroundColor: "#2e2e2e", color: "white" }}
              onClick={() => setStep(2)}>
              Gaussian Smoothing
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained"
              sx={{ backgroundColor: "#2e2e2e", color: "white" }}
              onClick={() => setStep(3)}>
              Find Peaks & Slopes
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained"
              sx={{ backgroundColor: "#2e2e2e", color: "white" }}
              onClick={() => setStep(4)}>
              Mark Seismic Positions
            </Button>
          </Grid>
        </Grid>

        {/*plotting*/}
        <div className='data-div'>
          {processedData.data.length > 0 && <SeismicPlot
            step={step}
            data={step === 0 ? processedData.data : step === 1 ? processedData.data : step === 2 ? processedData.filteredData : step === 3 ? processedData.normalizedData : step === 4 ? processedData.data : []}
            nextData={step === 1 ? processedData.filteredData : step === 2 ? processedData.smoothedData : []}
            kernel={step === 1 ? bandPassKernel(ts, processedData.data, bp_coef) : step === 2 ? gaussianKernel(std, ts, processedData.filteredData) : []}
            peaks={processedData.peaksData}
            slopes={processedData.slopesData}
            level={processedData.level}
            startLocations={processedData.startLocations}
            endLocations={processedData.endLocations}
          />}
        </div>
        <div className='description'>
          <p className='description-text'>{ description }</p>
        </div>

        {/*<button onClick={() => threeController.triggerQuake(0.1, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], 1, 1)}>Trigger Quake</button>*/}
        {/*<button onClick={() => threeController.triggerUpdatePlanetMaterial(100, 100, Planet.MARS)}>Toggle Mars</button>*/}
        {/*<button onClick={() => threeController.triggerUpdatePlanetMaterial(100, 100, Planet.MOON)}>Toggle Moon</button>*/}
      </Box>

      {/* Footer */}
      <AppBar position="fixed" color="transparent" sx={{ top: 'auto', bottom: 0, boxShadow: 'none' }}>
        <Toolbar>
          <MaterialUISwitch defaultChecked onChange={handlePlanetSwitch} />
          <Typography variant="body1" sx={{ fontFamily: 'Prompt, sans-serif', color: 'white', ml: 2 }}>
            {planet === "lunar" ? "Moon" : "Mars"}
          </Typography>
          {/* <Typography variant="body1" sx={{ flexGrow: 1, textAlign: 'right', color: 'white' }}>
            © 2024 Reaching Stars
          </Typography> */}
        </Toolbar>
      </AppBar>
    </ThemeProvider>
    // <h1>CSV Import in React.js</h1>
    // <FileInput onFileLoad={handleFileLoad} />
    // {data.length > 0 && <SeismicPlot data={data} std={2} widthFactor={0.3} smoothingStd={600} />}
  );
}

export default App;