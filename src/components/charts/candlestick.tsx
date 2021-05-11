import { format } from 'date-fns'
import Debug from 'debug'
import numbro from 'numbro'
import React from 'react'
import {
  ChartCanvas,
  Chart,
  CandlestickSeries,
  XAxis,
  YAxis,
  discontinuousTimeScaleProviderBuilder,
  CrossHairCursor,
  BarSeries,
  MouseCoordinateX,
  MouseCoordinateY,
  OHLCTooltip,
  withSize,
  EdgeIndicator,
} from 'react-financial-charts'

import { Candle } from '../../models'

const debug = Debug(`components:basic-candle-stick-chart`)

type BasicCandleStickChartProps = {
  candles: Candle[]
  width: number
  height: number
  ratio: number
}

const BasicCandleStickChart = ({
  candles: initialData,
  width,
  height,
  ratio,
}: BasicCandleStickChartProps) => {
  const xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
    ({ time }: Candle) => new Date(time)
  )
  const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(initialData)

  const max = xAccessor(data[data.length - 1])
  const min = xAccessor(data[Math.max(0, data.length - 100)])
  const xExtents = [min, max]

  const formatPrice = (value: number) => numbro(value).format({ thousandSeparated: true, mantissa: 2 })

  const margin = { left: 0, right: 75, top: 0, bottom: 32 }
  const gridHeight = height - margin.top - margin.bottom
  const volumeChartHeight = gridHeight / 5

  const getOpenCloseColor = ({ close, open }: Candle) => (close > open ? '#05db61' : '#fe0a6f')

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
      <Chart
        id={2}
        height={volumeChartHeight}
        origin={(_, h) => [0, h - volumeChartHeight]}
        yExtents={({ volume }) => volume}
      >
        <BarSeries
          fillStyle={({ close, open }) =>
            close > open ? 'rgba(5, 255, 166, 0.3)' : 'rgba(254, 10, 111, 0.3)'
          }
          yAccessor={({ volume }) => volume}
        />
      </Chart>
      <Chart id={1} padding={10} yExtents={({ high, low }) => [high, low]}>
        <CandlestickSeries fill={({ close, open }) => (close > open ? '#05ffa6' : '#fe0a6f')} />
        <YAxis
          showGridLines
          gridLinesStrokeStyle="rgba(255,255,255,.2)"
          strokeStyle="rgba(255,255,255,.5)"
          tickLabelFill="rgba(255,255,255,.6)"
          tickFormat={formatPrice}
        />
        <XAxis
          showGridLines
          gridLinesStrokeStyle="rgba(255,255,255,.2)"
          strokeStyle="rgba(255,255,255,.6)"
          tickLabelFill="rgba(255,255,255,.6)"
        />
        <MouseCoordinateX displayFormat={(time) => format(time, ' MMM d   h:mm a ')} />
        <MouseCoordinateY rectWidth={margin.right} displayFormat={formatPrice} />
        <EdgeIndicator
          itemType="last"
          rectWidth={margin.right}
          fill={getOpenCloseColor}
          lineStroke={getOpenCloseColor}
          displayFormat={formatPrice}
          yAccessor={({ close }) => close}
        />
        <OHLCTooltip origin={[8, 44]} labelFill="#fff" textFill="#fff" />
      </Chart>
      <CrossHairCursor strokeDasharray="ShortDot" strokeStyle="#5405ff" />
    </ChartCanvas>
  )
}

interface WithRatioProps {
  readonly ratio: number
}

interface WithRatioState {
  ratio: number
}

export const withDeviceRatio = () => {
  return <TProps extends WithRatioProps>(OriginalComponent: React.FC<TProps>) => {
    return class WithRatio extends React.Component<Omit<TProps, 'ratio'>, WithRatioState> {
      public readonly ref = React.createRef<HTMLCanvasElement>()

      public componentDidMount() {
        const { current } = this.ref
        if (current === null) {
          this.setState({
            ratio: 1,
          })

          return
        }

        const context: any = current.getContext('2d')

        const { devicePixelRatio } = window

        const backingStoreRatio =
          context.webkitBackingStorePixelRatio ??
          context.mozBackingStorePixelRatio ??
          context.msBackingStorePixelRatio ??
          context.oBackingStorePixelRatio ??
          context.backingStorePixelRatio ??
          1

        this.setState({
          ratio: devicePixelRatio / backingStoreRatio,
        })
      }

      public render() {
        const state = this.state
        if (state !== null) {
          return <OriginalComponent {...(this.props as TProps)} ratio={state.ratio} />
        }

        return <canvas ref={this.ref} />
      }
    }
  }
}

export default withSize()(withDeviceRatio()(BasicCandleStickChart))
