# 2024 NASA Space Apps Challenge - Seismic

## Run the website

In the project directory, you can run:

```sh
# under nasa-app/
pnpm start
```

Runs the app in the development mode.\
Open [http://localhost:3000](http://localhost:3000) to view it in the browser.

## Instructions

### Step 0: Load Data

Click **STEP 0: LOAD DATA** button and select input data file in the panel below:

![Load data panel](https://storage.googleapis.com/nasa-app/assets/readme/step0.png)

You can either upload your own data or select default data.

### Step 1: Filtering

![alt text](https://storage.googleapis.com/nasa-app/assets/readme/button1.png)

Click step 1 button, then the original signal is filtered with a special tailored bandpass filter. It is clearly shown that several unwanted peaks of noises are filtered out. This helps us preliminarily exclude some noises that we are not interested in, leaving a cleaner profile.

### Step 2: Smoothing

![alt text](https://storage.googleapis.com/nasa-app/assets/readme/button2.png)

In this step, we take the absolute value of the signal and then apply a Gaussian smoothing.

These filters help us further reduce unwanted peaks. And the cleaner profile also allows simpler future analysis.

### Step 3: Detect Peaks

![alt text](https://storage.googleapis.com/nasa-app/assets/readme/button3.png)

Peaks with intensity over the orange threshold set by standard derivation of the signal were chosen for detection. Two green lines measure the rising and falling edge slope to the peaks chosen.

### Step 4: Detection Result

![alt text](https://storage.googleapis.com/nasa-app/assets/readme/button4.png)

Peaks with just the right left and right slope, determined based on their ratio, exhibit the wanted exponential-decaying profile, and are picked out as the seismic events. The red line sets the onset to the seismic event.