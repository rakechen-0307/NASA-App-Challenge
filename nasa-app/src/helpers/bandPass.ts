const coef = [-0.015468212,0.005414803,-0.021013882,-0.00472374,4.77E-02,
            0.026547969,0.002031613,0.055068256,0.038977124,-0.058782592,
            -0.034768745,0.002012645,-0.170557003,-0.224228809,0.151489773,
            0.437803402,0.151489773,-0.224228809,-0.170557003,0.002012645,
            -0.034768745,-0.058782592,0.038977124,0.055068256,0.002031613,
            0.026547969,0.047658812,-4.72E-03,-0.021013882,0.005414803,-0.015468212];

export const bandPass = (data: number[]) => {
    const len = coef.length;
    for (let i = 0; i < len - 1; i++) {
        data.unshift(0);
    }

    let filteredData = [];
    for (let i = 0; i < data.length - len; i++) {
        let newData = 0;
        for (let j = 0; j < len; j++) {
            newData = newData + coef[j] * data[i + j];
        }
        filteredData.push(newData);
    }

    return filteredData;
}