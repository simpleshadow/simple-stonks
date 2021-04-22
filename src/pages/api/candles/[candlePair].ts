import type { NextApiRequest, NextApiResponse } from 'next'
import { sub } from 'date-fns'
import { Candle, Exchange } from '../../../models'
import { createStonker } from '../../../create-stonker'

import { JSONData } from '../../../types'

export default (req: NextApiRequest, res: NextApiResponse<JSONData<Candle>>) => {
  const { candlePair, period } = req.query

  const stonker = createStonker()

  const data: JSONData<Candle> =
    typeof candlePair === 'string' &&
    typeof period === 'string' &&
    stonker.services.database
      .getCandles(Exchange.CoinbasePro, candlePair, period, sub(new Date(), { days: 1 }).getTime())
      .map(({ id, ...candle }) => ({
        id,
        type: 'candle',
        attributes: { ...candle },
      }))

  data ? res.status(200).json(data) : res.status(400)
}
