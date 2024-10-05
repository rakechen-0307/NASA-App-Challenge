export const peakSelect = (data: any, locations: number[][], slopeThreshold: number, ratioThreshold: number) => {
    // Check if data is an ndarray
    data = data.data ? data.data : data;
    // Calculate slopes and ratios
    let selectedPeaks = [];
    for (let i = 0; i < locations.length; i++) {
        let x0 = locations[i][0];
        let x1 = locations[i][1];
        let x2 = locations[i][2];
        let y0 = data[x0];
        let y1 = data[x1];
        let y2 = data[x2];
        let slope1 = (y1 - y0) / (x1 - x0);
        let slope2 = (y2 - y1) / (x2 - x1);
        console.log(slope1);
        console.log(slope2);
        let ratio = Math.abs(slope1 / slope2);
        let slope = Math.abs(slope2);
        /*
        if (slope < slopeThreshold && ratio > ratioThreshold) {
            selectedPeaks.push(x1 - y1 / slope1);
        }
        */
        if (ratio > ratioThreshold) {
            selectedPeaks.push(x1 - y1 / slope1);
        }
    }

    return selectedPeaks;
}