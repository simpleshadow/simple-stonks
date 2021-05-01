import { forwardRef, MutableRefObject, useImperativeHandle, useRef, useState } from 'react'
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
  GenericComponent,
  getMouseCanvas,
  getAxisCanvas,
  getStrokeDasharrayCanvas,
  getClosestItem,
} from 'react-financial-charts'
import useSWR from 'swr'
import useMeasure from 'react-use-measure'
import { ResizeObserver } from '@juggle/resize-observer'

import { ReportApiResponse } from 'src/pages/api/pair/[id]/report'
import { JSONData } from 'src/types'
import { formatInterval } from 'src/utils'
import { useDeviceRatio } from 'src/hooks'

const debug = Debug('components:screener')

type ScreenerProps = {
  pair: string
}

const Screener = ({ pair }: ScreenerProps) => {
  const stcChartCanvasRefs = [
    useRef<ChartCanvasLineHandle>(),
    useRef<ChartCanvasLineHandle>(),
    useRef<ChartCanvasLineHandle>(),
    useRef<ChartCanvasLineHandle>(),
  ]
  const cursorLineTimeRef = useRef<number>()

  // const [cursorLineTime, setCursorLineTime] = useState<number>()
  const [screenerElRef, screenerElBounds] = useMeasure({ polyfill: ResizeObserver })
  const deviceRatio = useDeviceRatio()

  const { data, error } = useSWR<JSONData<ReportApiResponse>>(`api/pair/${pair}/report`, (url) =>
    fetch(url).then((res) => res.json())
  )

  if (error) return <div>Failed to load users</div>

  return (
    <div className="flex-grow" ref={screenerElRef}>
      {!data && <div className="p-2">Loading…</div>}
      {Array.isArray(data) &&
        data?.map(({ attributes: { period, report } }, i) => (
          <>
            <span
              className="absolute z-50 p-2 text-xs"
              style={{
                fontFamily: `-apple-system, system-ui, 'Helvetica Neue', Ubuntu, sans-serif`,
                fontWeight: 100,
              }}
            >
              {formatInterval(period / 60)}
            </span>
            <StcChartCanvas
              index={i}
              handleMouseMove={(index) =>
                stcChartCanvasRefs.forEach((ref, j) => j !== index && ref.current?.redrawLine())
              }
              initialData={report}
              cursorLineTimeRef={cursorLineTimeRef}
              width={screenerElBounds.width}
              height={screenerElBounds.height / data.length}
              ratio={deviceRatio}
              ref={stcChartCanvasRefs[i]}
            />
          </>
        ))}
    </div>
  )
}

export default Screener

type CurrentItem = {
  idx: {
    index: number
    level: number
  }
  time: number
  value: number
}

type ScreenerStcChartProps = {
  index: number
  cursorLineTimeRef: MutableRefObject<number>
  width: number
  height: number
  ratio: number
  initialData: {
    time: number
    value: number
  }[]
  handleMouseMove: (index: number) => void
}

type ChartCanvasLineHandle = {
  redrawLine: () => void
}

const StcChartCanvas = forwardRef<ChartCanvasLineHandle, ScreenerStcChartProps>(
  ({ index, width, height, ratio, initialData, handleMouseMove, cursorLineTimeRef }, ref) => {
    const myCursorLineTimeRef = useRef<number>()
    const lineRef = useRef<GenericComponent>()
    const isDrawingRef = useRef<number>()

    const xScaleProvider = discontinuousTimeScaleProviderBuilder().inputDateAccessor(
      ({ time }) => new Date(time)
    )
    const { data, xScale, xAccessor, displayXAccessor } = xScaleProvider(initialData)

    const max = xAccessor(data[data.length - 1])
    const min = xAccessor(data[Math.max(0, data.length - 100)])
    const xExtents = [min, max]
    const formatValue = (value: number) => numbro(value).format({ thousandSeparated: true, mantissa: 0 })

    const margin = { left: 0, right: 50, top: 0, bottom: 32 }

    useImperativeHandle(
      ref,
      () => ({
        redrawLine: () => {
          const closestCursorTime =
            cursorLineTimeRef.current &&
            data
              ?.map((item) => item.time)
              .reduce((prev, curr) =>
                Math.abs(curr - cursorLineTimeRef.current) <= Math.abs(prev - cursorLineTimeRef.current)
                  ? curr
                  : prev
              )
          myCursorLineTimeRef.current = closestCursorTime

          const animate = () => {
            isDrawingRef.current = requestAnimationFrame(() => {
              lineRef.current.draw({
                force: true,
                trigger: '',
              })
              isDrawingRef.current = undefined
            })
          }

          if (myCursorLineTimeRef.current) {
            if (!isDrawingRef.current) {
              animate()
            } else {
              cancelAnimationFrame(isDrawingRef.current)
              animate()
            }
          }
        },
      }),
      [data]
    )

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
          <GenericComponent
            clip={false}
            onMouseMove={() => {
              cursorLineTimeRef.current = myCursorLineTimeRef.current
              handleMouseMove && handleMouseMove(index)
            }}
            onUnHover={() => {
              cursorLineTimeRef.current = undefined
              handleMouseMove && handleMouseMove(index)
            }}
            canvasDraw={(_, { currentItem }) => {
              if (currentItem?.time) {
                myCursorLineTimeRef.current = currentItem.time
              }
            }}
            canvasToDraw={getMouseCanvas}
            drawOn={['mousemove', 'mouseleave']}
          />
          <GenericComponent
            canvasDraw={(ctx, moreProps) => {
              const {
                xScale,
                chartConfig: { width, height },
              } = moreProps
              const myCursorLineTime = myCursorLineTimeRef.current

              const idx = myCursorLineTime && data.findIndex(({ time }) => time === myCursorLineTime)

              ctx.clearRect(0, 0, width, height)

              if (idx) {
                const { x1, y1, x2, y2 } = {
                  x1: Math.round(xScale(idx!)),
                  y1: 0,
                  x2: Math.round(xScale(idx!)),
                  y2: height,
                }

                ctx.beginPath()
                ctx.strokeStyle = '#5405ff'
                ctx.lineWidth = 1
                ctx.setLineDash(getStrokeDasharrayCanvas('ShortDot'))
                ctx.moveTo(x1, y1)
                ctx.lineTo(x2, y2)
                ctx.stroke()
              }
            }}
            canvasToDraw={getMouseCanvas}
            drawOn={['pan']}
            ref={lineRef}
          />
        </Chart>
        <CrossHairCursor strokeDasharray="ShortDot" strokeStyle="#5405ff" />
      </ChartCanvas>
    )
  }
)
