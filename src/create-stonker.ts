import Debug from 'debug'
import { formatISO, sub } from 'date-fns'

import { pairs, periods } from 'config'
import { Indicatorer } from './interfaces'
import { Exchange } from './models'
import { startCoinbasePro, CoinbasePro, startDatabase, Database } from './services'

const debug = Debug('index')

type Stonker = {
  pairs: string[]
  services: {
    coinbasePro: CoinbasePro
    database: Database
  }
  indicatorer: Indicatorer
  updateCandles: () => void
}

const stonker: Stonker = {
  indicatorer: Indicatorer,
  pairs,
  services: {
    coinbasePro: startCoinbasePro(),
    database: startDatabase(),
  },

  updateCandles: async () => {
    for (const pair of stonker.pairs) {
      const timeNow = new Date()

      for (const period of periods) {
        try {
          const candles = await stonker.services.coinbasePro.rest.product.getCandles(pair, {
            granularity: period,
            end: formatISO(timeNow),
            start: formatISO(sub(timeNow, { months: 3 })),
          })
          stonker.services.database.insertCandles(
            candles.map((candle) => ({
              exchange: Exchange.CoinbasePro,
              symbol: pair,
              period: period.toString(),
              time: candle.openTimeInMillis,
              open: candle.open,
              high: candle.high,
              low: candle.low,
              close: candle.close,
              volume: candle.volume,
            }))
          )
        } catch (error) {
          console.log(error)
        }
      }
    }
  },
}

stonker.updateCandles()

export const createStonker = () => {
  return stonker
}
