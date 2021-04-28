import { sub } from 'date-fns'
import debug from 'debug'
import type { NextApiRequest, NextApiResponse } from 'next'

import { createStonker } from 'src/create-stonker'
import { Candle, Exchange } from 'src/models'

import { JSONData } from 'src/types'

const CandlesApiRoute = (req: NextApiRequest, res: NextApiResponse<JSONData<Candle>>) => {
  const { id, period } = req.query

  const stonker = createStonker()

  const data: JSONData<Candle> =
    typeof id === 'string' &&
    typeof period === 'string' &&
    stonker.services.database
      .getCandles(Exchange.CoinbasePro, id, period, sub(new Date(), { days: 90 }).getTime())
      .map(({ id, ...candle }) => ({
        id,
        type: 'candle',
        attributes: { ...candle },
      }))

  data ? res.status(200).json(data) : res.status(400)
}

export default CandlesApiRoute
