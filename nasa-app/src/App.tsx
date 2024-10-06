import './App.css';
import React, { useEffect, useState, useRef } from 'react';
import FileUploadButton from './components/MUI-Fileinput';
import { Data } from './types/Data';
import SeismicPlot from './components/SeismicPlot';

import ThreeSimulator from './components/ThreeSimulator';
import { threeController } from './components/ThreeSimulator/ThreeController';
import { AppBar, ThemeProvider, Toolbar } from '@mui/material';
import InputLabel from '@mui/material/InputLabel';
import MenuItem from '@mui/material/MenuItem';
import FormControl from '@mui/material/FormControl';
import Select, { SelectChangeEvent } from '@mui/material/Select';

// theme import
import theme from './theme';
import { Box, Typography, Grid, Button, IconButton, Stack } from '@mui/material';
import GitHubIcon from '@mui/icons-material/GitHub';
import InfoIcon from '@mui/icons-material/Info';
import { MaterialUISwitch } from './components/switches';

import { Planet } from './types/Three';
import { url } from 'inspector';


function App() {
  const [step, setStep] = useState<number>(0);
  const [planet, setPlanet] = useState<string>("lunar");
  const [description, setDescription] = useState<string>("");
  const [title, setTitle] = useState<string>("");
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
  const [defaultEvent, setDefaultEvent] = useState<string>('lunar 1');
  const [uploadMenu, setUploadMenu] = useState<boolean>(false);
  const [dataUrl, setDataUrl] = useState<string>("https://dl.dropboxusercontent.com/scl/fi/x8aosw2xe93uvuc7098in/lunar1.json?rlkey=ucyfp4iilinf7evzfkfdpq22z&st=yx84flln&dl=0");
  const [isLoaded, setIsLoaded] = useState<boolean>(false);
  const [processStatus, setProcessStatus] = useState<string>("");
  const [isLocked, setIsLocked] = useState<boolean>(true);
  const [samplingTime, setSamplingTime] = useState<number>(0.1509);

  // let ts = 0.1509;
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

  const titles = [
    "Step 1. Original Data Through Bandpass Filter",
    "Step 2. Envelope Extraction and Smoothing of Data",
    "Step 3. Peaks from Envelope Selected, with Slopes Calculated for Thresholding",
    "Step 4. Peaks Selected as Seismic Event and Onset Time Estimated"
  ];

  const descriptions = [
    "The original signal is filtered with a special tailored bandpass filter. It is clearly shown that several unwanted peaks of noises are filtered out. This helps us preliminarily exclude some noises that we are not interested in, leaving a cleaner profile.",
    "In this step, we took the absolute value of the signal and then applied a Gaussian smoothing. These filters help us further reduce unwanted peaks. And the cleaner profile also allows simpler future analysis.",
    "Peaks with intensity over the orange threshold set by standard derivation of the signal were chosen for detection. Two green lines measure the rising and falling edge slope to the peaks chosen.",
    "Peaks with just the right left and right slope, determined based on their ratio, exhibit the wanted exponential-decaying profile, and are picked out as the seismic events. The red line sets the onset to the seismic event."
  ];

  const events_lunar = [
    "lunar 1",
    "lunar 2",
    "lunar 3"
  ];
  const events_mars = [
    "mars 1",
    "mars 2",
    "mars 3"
  ];
  const urls_lunar = [
    "https://dl.dropboxusercontent.com/scl/fi/x8aosw2xe93uvuc7098in/lunar1.json?rlkey=ucyfp4iilinf7evzfkfdpq22z&st=yx84flln&dl=0",
    "https://dl.dropboxusercontent.com/scl/fi/vw7wr659im9k0v6i4dqqd/lunar2.json?rlkey=1j0x8vqa6959tv1ades6bvckp&st=yhqnv7yq&dl=0",
    "https://dl.dropboxusercontent.com/scl/fi/c8p4843893qi0tej35f12/lunar3.json?rlkey=kr8gajp87srfovtwtk0ixorse&st=ibb0wuqw&dl=0"
  ];
  const urls_mars = [
    "https://dl.dropboxusercontent.com/scl/fi/5v263ker3dto5n39lcfs5/mars1.json?rlkey=p4lk834b4agyc6ikhudnnzdmb&st=hmkormij&dl=0",
    "https://dl.dropboxusercontent.com/scl/fi/snzddn9exxtg6deth52xj/mars2.json?rlkey=5pxzt0obfaifnc30tubwhhu19&st=0hcwgdkn&dl=0",
    "https://dl.dropboxusercontent.com/scl/fi/lx85s2c9ihaxroi9vm6kv/mars3.json?rlkey=0fgova0lq5j0b2l6rtzex8g9p&st=i9hrkt0b&dl=0"
  ];

  useEffect(() => {
    if (planet === "lunar") {
      // ts = 0.1509;
      setSamplingTime(0.1509);
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
      setDefaultEvent("lunar 1");
      setProcessedData({
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
      setStep(0);
    }
    else if (planet === "mars") {
      // ts = 0.05;
      setSamplingTime(0.05);
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
      setDefaultEvent("mars 1");
      setProcessedData({
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
      setStep(0);
    }
  }, [planet]);

  useEffect(() => {
    setDescription(descriptions[step - 1]);
    setTitle(titles[step - 1]);
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
      ts: samplingTime,
      std: std,
      smoothingStd: smoothingStd,
      slopeThreshold: slopeThreshold,
      ratioThreshold: ratioThreshold,
      widthFactor: widthFactor,
      bp_coef: bp_coef
    }
    console.log("samplingTime: ", samplingTime);
    workerRef.current?.postMessage({ loadedData, params });
    setIsLoaded(false);
    setIsLocked(false);
    setProcessStatus("");
  };

  const handleUseDefault = (dataURL: string) => {
    setIsLoaded(true);
    setIsLocked(true);
    setProcessStatus("Loading Data...");
    fetch(dataURL)
      .then(response => response.text())  // Convert response to text
      .then(jsonData => {
        const loadedData = JSON.parse(jsonData).data.map((d: any) => [0, d.x, d.y])
        handleFileLoad(loadedData);
      })
      .catch(error => {
        console.error("Error fetching default data:", error);
      });
  }

  const handleDefaultValueChange = (event: SelectChangeEvent) => {
    // console.log(event.target.value);
    setDefaultEvent(event.target.value);
    if (planet === "lunar") {
      setDataUrl(urls_lunar[events_lunar.indexOf(event.target.value)]);
    }
    else if (planet === "mars") {
      setDataUrl(urls_mars[events_mars.indexOf(event.target.value)]);
    }
  };

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
            <Button variant="contained"
              sx={{ backgroundColor: "#2e2e2e", color: "white" }}
              onClick={() => {setStep(0); setUploadMenu(true);}}>
              Step 0: Load Data
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" disabled={isLocked}
              sx={{ backgroundColor: "#2e2e2e", color: "white" }}
              onClick={() => {setStep(1); setUploadMenu(false);}}>
              Step 1: Filtering
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" disabled={isLocked}
              sx={{ backgroundColor: "#2e2e2e", color: "white" }}
              onClick={() => {setStep(2); setUploadMenu(false);}}>
              Step 2: Smoothing
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" disabled={isLocked}
              sx={{ backgroundColor: "#2e2e2e", color: "white" }}
              onClick={() => {setStep(3); setUploadMenu(false);}}>
              Step 3: Detect Peaks
            </Button>
          </Grid>
          <Grid item>
            <Button variant="contained" disabled={isLocked}
              sx={{ backgroundColor: "#2e2e2e", color: "white" }}
              onClick={() => {setStep(4); setUploadMenu(false);}}>
              Step 4: Detection Result
            </Button>
          </Grid>
        </Grid>

        {/*plotting*/}
        <div className='data-div'>
          {processedData.data.length > 0 && <SeismicPlot
            step={step}
            data={step === 0 ? processedData.data : step === 1 ? processedData.data : step === 2 ? processedData.filteredData : step === 3 ? processedData.normalizedData : step === 4 ? processedData.data : []}
            nextData={step === 1 ? processedData.filteredData : step === 2 ? processedData.smoothedData : []}
            kernel={step === 1 ? bandPassKernel(samplingTime, processedData.data, bp_coef) : step === 2 ? gaussianKernel(std, samplingTime, processedData.filteredData) : []}
            peaks={processedData.peaksData}
            slopes={processedData.slopesData}
            level={processedData.level}
            startLocations={processedData.startLocations}
            endLocations={processedData.endLocations}
          />}
        </div>
        <div className='description'>
          {uploadMenu?
            <div>
              <p className='title-text'>Step 1. Load Seismic Data</p>
              <p className='description-text'>Upload your own CSV file or select and load a default event data.</p>
              <Grid item>
                <FileUploadButton 
                  onFileLoad={handleFileLoad} 
                  isDisabled={isLoaded} 
                  setDisabled={setIsLoaded} 
                  processStatus={processStatus}
                  setProcessStatus={setProcessStatus}
                />
                <FormControl variant="outlined" sx={{ m: 1, minWidth: 120, color: "white", mt:-0.4 }} size="small">
                <InputLabel sx={{ color: "#b3dce6" }} id="demo-default-event-label">Selected Event</InputLabel>
                  <Select
                    id="demo-default-event"
                    value={defaultEvent}
                    onChange={handleDefaultValueChange}
                    sx={{
                      color: "white",
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: "#666d75", // Change border color to white
                      },
                      '&:hover .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#666d75', // Change border color on hover
                      },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                        borderColor: '#666d75', // Change border color when focused
                      },
                      '& .MuiSelect-icon': {
                        color: '#666d75', // Change the dropdown icon color to white
                      }
                    }}
                  >
                    {planet === "lunar" ? events_lunar.map((event) => (
                      <MenuItem key={event} value={event} sx={{ color: "black" }}>{event}</MenuItem>
                    )) : 
                    events_mars.map((event) => 
                      <MenuItem key={event} value={event} sx={{ color: "black" }}>{event}</MenuItem>
                    )}
                  </Select>
                </FormControl>
                <Button variant="contained"
                  sx={{ backgroundColor: "#3c8eaa", color: "white" }}
                  onClick={() => handleUseDefault(dataUrl)} disabled={isLoaded}>
                  Load Default Event
                </Button>
                <h3 className='loading-info'>{ processStatus }</h3>
              </Grid>
            </div>
            : 
            <div>
              <p className='title-text'>{title}</p>
              <p className='description-text'>{description}</p>
            </div>
          }
        </div>
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
  );
}

export default App;