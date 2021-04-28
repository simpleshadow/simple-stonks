import { format } from 'date-fns'
import Debug from 'debug'
import numbro from 'numbro'
import {
  ChartCanvas,
  Chart,
  XAxis,
  YAxis,
  discontinuousTimeScaleProviderBuilder,
  CrossHairCursor,
  LineSeries,
  MouseCoordinateX,
  MouseCoordinateY,
  withSize,
} from 'react-financial-charts'
import useSWR from 'swr'

import { withDeviceRatio } from './basic-candle-stick-chart'
import { ReportApiResponse } from 'src/pages/api/pair/[id]/report'
import { JSONData } from 'src/types'
import { formatInterval } from 'src/utils'

const debug = Debug('components:screener')

type ScreenerProps = {
  pair: string
}

const Screener = ({ pair }: ScreenerProps) => {
  const { data, error } = useSWR<JSONData<ReportApiResponse>>(`api/pair/${pair}/report`, (url) =>
    fetch(url).then((res) => res.json())
  )

  if (error) return <div>Failed to load users</div>

  return (
    <>
      {!data && <div className="p-2">Loading…</div>}
      {Array.isArray(data) &&
        data.map(({ attributes: { period, report } }) => (
          <>
            <div className="flex-grow">
              <span
                className="absolute z-50 p-2"
                style={{
                  fontSize: 16,
                  fontFamily: `-apple-system, system-ui, 'Helvetica Neue', Ubuntu, sans-serif`,
                  fontWeight: 100,
                }}
              >
                {formatInterval(period / 60)}
              </span>
              <ScreenerStcChart initialData={report} />
            </div>
          </>
        ))}
    </>
  )
}

export default Screener

type ScreenerStcChartProps = {
  width: number
  height: number
  ratio: number
  initialData: {
    time: number
    value: number
  }[]
}

const ScreenerStcChart = withSize()(
  withDeviceRatio()(({ width, height, ratio, initialData }: ScreenerStcChartProps) => {
    const xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
      ({ time }) => new Date(time)
    )
    const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(initialData)

    const max = xAccessor(data[data.length - 1])
    const min = xAccessor(data[Math.max(0, data.length - 100)])
    const xExtents = [min, max]
    const formatValue = (value: number) => numbro(value).format({ thousandSeparated: true, mantissa: 0 })

    const margin = { left: 0, right: 50, top: 0, bottom: 32 }

    return (
      <ChartCanvas
        height={height}
        width={width}
        ratio={ratio}
        data={data}
        margin={margin}
        seriesName="Data"
        displayXAccessor={displayXAccessor}
        xScale={xScale}
        xAccessor={xAccessor}
        xExtents={xExtents}
      >
        <Chart id={1} padding={10} yExtents={({ value }) => value}>
          <XAxis
            showGridLines
            gridLinesStrokeStyle="rgba(255,255,255,.2)"
            strokeStyle="rgba(255,255,255,.6)"
            tickLabelFill="rgba(255,255,255,.6)"
          />
          <YAxis
            showGridLines
            gridLinesStrokeStyle="rgba(255,255,255,.2)"
            strokeStyle="rgba(255,255,255,.6)"
            tickLabelFill="rgba(255,255,255,.6)"
          />
          <LineSeries yAccessor={({ value }) => value} strokeWidth={2} strokeStyle="#5405ff" />
          <LineSeries yAccessor={() => 75} strokeDasharray="ShortDot" strokeStyle="#fe0a6f" />
          <LineSeries yAccessor={() => 25} strokeDasharray="ShortDot" strokeStyle="#05ffa6" />
          <MouseCoordinateX displayFormat={(time) => format(time, ' MMM d   h:mm a ')} />
          <MouseCoordinateY rectWidth={50} displayFormat={formatValue} />
        </Chart>
        <CrossHairCursor strokeDasharray="ShortDot" strokeStyle="#5405ff" />
      </ChartCanvas>
    )
  })
)
