import Debug from 'debug'
import { formatISO, sub } from 'date-fns'

import { Indicatorer } from './interfaces'
import { startCoinbasePro, CoinbasePro, startDatabase, Database } from './services'
import { Exchange } from './models'

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

export const createStonker = () => {
  const stonker: Stonker = {
    indicatorer: Indicatorer,
    pairs: [
      'BTC-USD',
      'CRV-USD',
      'ETH-USD',
      'LINK-USD',
      'LTC-USD',
      'KNC-USD',
      'SNX-USD',
      'XLM-USD',
      'XTZ-USD',
      'ZRX-USD',
    ],
    services: {
      coinbasePro: startCoinbasePro(),
      database: startDatabase(),
    },

    updateCandles: async () => {
      for (const pair of stonker.pairs) {
        const periods = [60, 300, 900, 3600, 21600, 86400]
        const timeNow = new Date()

        for (const period of periods) {
          try {
            const candles = await stonker.services.coinbasePro.rest.product.getCandles(pair, {
              granularity: period,
              end: formatISO(timeNow),
              start: formatISO(sub(timeNow, { months: 1 })),
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
            debug(error)
          }
        }
      }
    },
  }

  stonker.updateCandles()

  // const candles = stonker.services.database.getCandles(
  //   Exchange.CoinbasePro,
  //   'BTC-USD',
  //   `${15 * 60}`,
  //   sub(new Date(), { days: 1 }).getTime()
  // )

  // const stc = stonker.indicatorer.stc(candles.map(({ close }) => close))
  // debug(
  //   stc.map((value, i) => ({
  //     time: format(new Date(candles[i].time), 'h:mm a E MMM d'),
  //     value,
  //   }))
  // )

  return stonker
}
