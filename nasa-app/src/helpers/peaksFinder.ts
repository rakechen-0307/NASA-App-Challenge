export const peaksFinder = (data: number[], std: number, widthFactor: number) => {
    const mu: number = data.reduce((accumulator, value) => (accumulator + value), 0) / data.length;   // mean
    const sigma: number = Math.sqrt(data.map(value => Math.pow(value - mu, 2)).reduce(
        (accumulator, value) => (accumulator + value), 0
    ) / data.length);   // standard deviation
    const level = mu + sigma * std;

    let locations = [];

    // Detect crossing points
    let crossing_indices: number[] = [];
    for (let i = 0; i < data.length - 1; i++) {
        if ((data[i] < level && data[i + 1] > level) || (data[i] > level && data[i + 1] < level)) {
            crossing_indices.push(i);
        }
    }

    let right_most_index = 1;
    for (let i = 0; i < crossing_indices.length - 1; i++) {
        if (crossing_indices[i] <= right_most_index) continue;

        let segment_indices = Array.from({ length: crossing_indices[i + 1] - crossing_indices[i] + 1 }, (_, j) => j + crossing_indices[i]);
        let segment = segment_indices.map(index => data[index]);

        let max_value = Math.max(...segment);
        let max_index = segment.indexOf(max_value) + crossing_indices[i];

        if (max_value <= level) continue;

        let left_index = data.slice(0, max_index).reverse().findIndex(val => val <= max_value * widthFactor);
        let right_index = data.slice(max_index).findIndex(val => val <= max_value * widthFactor);

        left_index = left_index !== -1 ? max_index - left_index - 1 : 0;
        right_index = right_index !== -1 ? max_index + right_index : data.length - 1;

        right_most_index = max_index + (right_index - left_index);

        // Store Results
        locations.push([left_index, max_index, right_index]);
    }
    
    return { locations, level };
} 