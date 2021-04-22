import {
  ChartCanvas,
  Chart,
  CandlestickSeries,
  XAxis,
  YAxis,
  discontinuousTimeScaleProviderBuilder,
  CurrentCoordinate,
  CrossHairCursor,
  BarSeries,
  LineSeries,
  MouseCoordinateX,
  MouseCoordinateY,
} from 'react-financial-charts'
import { format } from 'date-fns'
import Debug from 'debug'

import { Candle } from '../models'
import numbro from 'numbro'

const debug = Debug(`components:basic-candle-stick-chart`)

type BasicCandleStickChartProps = {
  candles: (Candle & { stc?: number })[]
}

const BasicCandleStickChart = ({ candles: initialData }: BasicCandleStickChartProps) => {
  const xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
    ({ time }: Candle) => new Date(time)
  )
  const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(initialData)

  const max = xAccessor(data[data.length - 1])
  const min = xAccessor(data[Math.max(0, data.length - 100)])
  const xExtents = [min, max]

  const priceDisplayFormat = (value: number) => numbro(value).format({ thousandSeparated: true, mantissa: 0 })

  const height = 600
  const margin = { left: 0, right: 50, top: 0, bottom: 24 }
  const gridHeight = height - margin.top - margin.bottom
  const bottomChartHeight = 150
  const volumeChartHeight = gridHeight / 4
  const chartHeight = gridHeight - 150

  return (
    <ChartCanvas
      height={height}
      width={800}
      ratio={1}
      data={data}
      margin={margin}
      seriesName="Data"
      displayXAccessor={displayXAccessor}
      xScale={xScale}
      xAccessor={xAccessor}
      xExtents={xExtents}
    >
      <Chart
        id={2}
        height={volumeChartHeight}
        origin={(_: number, h: number) => [0, h - volumeChartHeight - bottomChartHeight]}
        yExtents={({ volume }) => volume}
      >
        <BarSeries
          fillStyle={({ close, open }) =>
            close > open ? 'rgba(38, 166, 154, 0.3)' : 'rgba(239, 83, 80, 0.3)'
          }
          yAccessor={({ volume }) => volume}
        />
      </Chart>
      <Chart id={1} height={chartHeight} yExtents={({ high, low }) => [high, low]}>
        <CurrentCoordinate yAccessor={({ close }) => close} />
        <CandlestickSeries />
        <XAxis
          showGridLines
          showTickLabel={false}
          axisAt="bottom"
          orient="bottom"
          tickFormat={(index) => typeof index === 'number' && format(initialData[index].time, 'h:mm a')}
        />
        <YAxis showGridLines axisAt="right" orient="right" />
        <MouseCoordinateY rectWidth={margin.right} displayFormat={priceDisplayFormat} />
      </Chart>
      <CrossHairCursor />
      <Chart
        id={3}
        height={bottomChartHeight}
        origin={(_: number, h: number) => [0, h - bottomChartHeight]}
        yExtents={({ stc }) => stc}
      >
        <LineSeries yAccessor={({ stc }) => stc} />
        <XAxis showGridLines gridLinesStrokeStyle="#e0e3eb" />
        <YAxis ticks={4} />
        <MouseCoordinateX displayFormat={(time) => format(time, 'h:mm a')} />
        <MouseCoordinateY rectWidth={50} displayFormat={priceDisplayFormat} />
      </Chart>
    </ChartCanvas>
  )
}

export default BasicCandleStickChart
