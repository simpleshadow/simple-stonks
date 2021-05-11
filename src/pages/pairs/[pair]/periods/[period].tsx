import { WebSocketEvent, WebSocketTickerMessage } from 'coinbase-pro-node'
import Debug from 'debug'
import debounce from 'lodash.debounce'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useRef, useState } from 'react'
import useSWR from 'swr'

import { BasicCandleStickChart, SchaffTrendCycles, SelectorBar, SimpleTable } from '../../../../components'
import { SchaffTrendCycleData } from '../../../../components/charts/schaff-trend-cycle'
import { useSocketIO } from '../../../../hooks'
import { Candle, Exchange } from '../../../../models'
import { JSONData } from '../../../../types'
import { formatInterval, roundDownTo } from '../../../../utils'
import { pairs, periods as configPeriods } from '../../../../../config'

const debug = Debug(`pages:pairs:[pair]:periods:[period]`)

const periods = configPeriods.map((period) => period / 60)

type IndexProps = {}

const Pair: NextPage<IndexProps> = () => {
  const router = useRouter()
  const { tickersSocket } = useSocketIO()
  const [, setLiveCandle] = useState<Candle>()
  const liveCandle = useRef<Candle>()
  const tempPrevCandle = useRef<Candle>()

  const { pair, period } = router.query as { pair: typeof pairs[number]; period: string }

  const selectedPairIndex = pairs.findIndex((element) => element === pair)
  const selectedPeriodIndex = periods.findIndex(
    (element) => typeof period === 'string' && element === parseInt(period)
  )

  const selectedPair = pairs[selectedPairIndex]
  const selectedPeriod = periods[selectedPeriodIndex]

  const { data: candlesData, error: candlesError } = useSWR<JSONData<Candle>>(
    `${process.env.NEXT_PUBLIC_API_HOST}/api/pairs/${selectedPair}/candles?period=${selectedPeriod * 60}`,
    (url) => fetch(url).then((res) => res.json()),
    {
      refreshInterval: 2 * 1000,
    }
  )

  const { data: stcData } = useSWR<JSONData<SchaffTrendCycleData>>(
    `${process.env.NEXT_PUBLIC_API_HOST}/api/pairs/${pair}/report`,
    (url) => fetch(url).then((res) => res.json()),
    {
      refreshInterval: 60 * 1000,
    }
  )

  const debouncedSetLiveCandle = useCallback(
    debounce((candle: Candle) => {
      setLiveCandle(candle)
    }, 250),
    [setLiveCandle, liveCandle]
  )

  const liveTickerDataHandler = useCallback(
    ({ price: priceString, product_id, last_size: last_sizeString, time }: WebSocketTickerMessage) => {
      if (
        product_id === selectedPair &&
        candlesData &&
        Array.isArray(candlesData) &&
        candlesData.slice(-1)?.[0]?.attributes
      ) {
        const price = parseFloat(priceString),
          last_size = parseFloat(last_sizeString)

        const currentLiveCandle = liveCandle.current
        const lastRetrievedCandle = candlesData.slice(-1)[0].attributes

        const tickTime = new Date(time).getTime()
        const tickBucketTime = roundDownTo(selectedPeriod * 60 * 1000)(tickTime).getTime()

        if (!tempPrevCandle.current && tickBucketTime !== lastRetrievedCandle.time) {
          tempPrevCandle.current = currentLiveCandle
        } else if (tickBucketTime === lastRetrievedCandle.time) {
          tempPrevCandle.current = null
        }

        liveCandle.current =
          tickBucketTime === lastRetrievedCandle.time
            ? {
                exchange: Exchange.CoinbasePro,
                symbol: selectedPair,
                period: selectedPeriod.toString(),
                time: tickBucketTime,
                open: lastRetrievedCandle.open,
                high:
                  lastRetrievedCandle.volume && currentLiveCandle?.time !== tickBucketTime
                    ? lastRetrievedCandle.high
                    : price > currentLiveCandle.high
                    ? price
                    : currentLiveCandle.high,
                low:
                  lastRetrievedCandle.volume && currentLiveCandle?.time !== tickBucketTime
                    ? lastRetrievedCandle.low
                    : price < currentLiveCandle.low
                    ? price
                    : currentLiveCandle.low,
                close: price,
                volume:
                  lastRetrievedCandle.volume && currentLiveCandle?.time !== tickBucketTime
                    ? lastRetrievedCandle.volume
                    : last_size + (currentLiveCandle ? currentLiveCandle?.volume : 0),
              }
            : {
                exchange: Exchange.CoinbasePro,
                symbol: selectedPair,
                period: selectedPeriod.toString(),
                time: tickBucketTime,
                open:
                  currentLiveCandle?.time === tickBucketTime
                    ? currentLiveCandle.open
                    : tempPrevCandle.current.close,
                high:
                  currentLiveCandle?.time === tickBucketTime
                    ? price > currentLiveCandle.high
                      ? price
                      : currentLiveCandle.high
                    : price,
                low:
                  currentLiveCandle?.time === tickBucketTime
                    ? price < currentLiveCandle.low
                      ? price
                      : currentLiveCandle.low
                    : price,
                close: price,
                volume:
                  currentLiveCandle?.time === tickBucketTime
                    ? last_size + currentLiveCandle.volume
                    : last_size,
              }

        debouncedSetLiveCandle(liveCandle.current)
      }
    },
    [candlesData, selectedPair, selectedPeriod, setLiveCandle]
  )

  useEffect(() => {
    tickersSocket.on(pair, liveTickerDataHandler)

    return () => {
      tickersSocket.off(pair, liveTickerDataHandler)
    }
  }, [pair, tickersSocket, liveTickerDataHandler])

  if (candlesError) return <div>Failed to load users</div>

  const candlestickData = Array.isArray(candlesData)
    ? candlesData.map(({ attributes }) => ({ ...attributes }))
    : []

  liveCandle?.current?.time && candlestickData.length >= 1
    ? liveCandle.current.time === candlestickData.slice(-1)?.[0]?.time
      ? candlestickData.splice(candlestickData.length - 1, 1, liveCandle.current)
      : candlestickData.push(liveCandle.current) && candlestickData.splice(0, 1)
    : candlestickData

  tempPrevCandle?.current &&
    candlestickData.length >= 2 &&
    candlestickData.splice(candlestickData.length - 2, 1, tempPrevCandle.current)

  return (
    <div className="flex flex-col h-screen overflow-hidden text-white ">
      <div className="md:grid md:grid-cols-6 md:gap-6">
        <div className="mt-5 md:mt-0 md:col-span-2">
          <div className="px-2 py-2">
            <div className="grid grid-cols-3 gap-6">
              <div className="col-span-1">
                <label htmlFor="initial-capital" className="block text-sm font-medium ">
                  Initial capital
                </label>
                <div className="mt-1 flex rounded shadow">
                  <input
                    type="number"
                    name="initial-capital"
                    id="initial-capital"
                    className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded border-gray-300 py-1 px-2 text-black"
                    placeholder="0"
                    defaultValue={20000}
                  />
                </div>
              </div>
              <div className="col-span-1">
                <label htmlFor="days-back" className="block text-sm font-medium ">
                  Days back
                </label>
                <div className="mt-1 flex rounded shadow">
                  <input
                    type="number"
                    name="days-back"
                    id="days-back"
                    className="focus:ring-indigo-500 focus:border-indigo-500 flex-1 block w-full rounded border-gray-300 py-1 px-2 text-black"
                    placeholder="0"
                    defaultValue={30}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="flex flex-row flex-grow">
        <SelectorBar
          labels={pairs as readonly string[]}
          isVertical
          selectedIndex={selectedPairIndex}
          onSelectionChange={(index) => {
            router.push(`/pairs/${pairs[index]}/periods/${period}`)
            liveCandle.current = null
          }}
        />

        <div className="flex flex-col flex-grow h-full overflow-hidden">
          <SelectorBar
            labels={periods.map((period) => (typeof period === 'string' ? period : formatInterval(period)))}
            selectedIndex={selectedPeriodIndex}
            onSelectionChange={(index) => {
              router.push(`/pairs/${pair}/periods/${periods[index]}`)
              liveCandle.current = null
            }}
          />
          {(!pair || !period || !candlesData) && <div className="p-2">Loading…</div>}
          {pair && period && candlestickData && (
            <>
              <div style={{ background: '#0d111a', height: '40%' }}>
                <h2 className="absolute p-2">
                  <span className="font-bold">{selectedPair}</span> · {formatInterval(selectedPeriod)}
                </h2>
                <BasicCandleStickChart candles={candlestickData} />
              </div>
              {!stcData && <div className="p-2">Loading…</div>}
              {stcData && Array.isArray(stcData) && (
                <div style={{ background: '#0d111a' }} className="flex flex-col flex-grow">
                  <SchaffTrendCycles
                    data={stcData.map(({ attributes: { period, report } }) => ({ period, report }))}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Pair
