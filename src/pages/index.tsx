import useSWR from 'swr'
import Debug from 'debug'
import { NextPage } from 'next'
import { useMemo, useState } from 'react'

import { BasicCandleStickChart, Screener, SelectorBar, SimpleTable } from '../components'
import { pairs } from 'config'
import { Indicatorer } from '../interfaces'
import { Candle } from '../models'
import { JSONData } from '../types'
import { formatInterval } from '../utils'

const debug = Debug(`pages:index`)

type IndexProps = {}

const Index: NextPage<IndexProps> = () => {
  const periods = [5, 15, 60, 360, 24 * 60]

  const [selectedPairIndex, setSelectedPairIndex] = useState(0)
  const [selectedPeriodIndex, setSelectedPeriodIndex] = useState(1)

  const selectedPair = pairs[selectedPairIndex]
  const selectedPeriod = periods[selectedPeriodIndex]

  const { data, error } = useSWR<JSONData<Candle>>(
    `api/pair/${selectedPair}/candles?period=${selectedPeriod * 60}`,
    (url) => fetch(url).then((res) => res.json())
  )

  if (error) return <div>Failed to load users</div>

  const chartData = Array.isArray(data) && data.map(({ attributes }) => ({ ...attributes }))

  return (
    <div className="flex flex-col text-white h-screen overflow-hidden">
      <SelectorBar
        labels={pairs}
        selectedIndex={selectedPairIndex}
        onSelectionChange={setSelectedPairIndex}
      />
      <SelectorBar
        labels={periods.map((period) => (typeof period === 'string' ? period : formatInterval(period)))}
        selectedIndex={selectedPeriodIndex}
        onSelectionChange={setSelectedPeriodIndex}
      />
      {!data && <div className="p-2">Loading…</div>}
      {chartData && (
        <>
          <div style={{ background: '#0d111a', height: '40%' }}>
            <h2 className="absolute p-2">
              <span className="font-bold">{selectedPair}</span> · {selectedPeriod}
            </h2>
            <BasicCandleStickChart candles={chartData} />
          </div>
          <div style={{ background: '#0d111a' }} className="flex flex-col flex-grow">
            <Screener pair={selectedPair} />
          </div>
        </>
      )}
    </div>
  )
}

export default Index
