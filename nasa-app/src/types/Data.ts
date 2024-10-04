export type Data = {
    x: number,
    y: number
}

export type ChartInfo = {
    type: string,
    dataPoints: Data[],
    name: string,
    showInLegend: boolean
}

export type PeakInfo = {
    type: string,
    dataPoints: Data[],
    name: string,
    markerType: string,
    color: string,
    showInLegend: boolean
}