import { sub } from 'date-fns'
import debug from 'debug'
import type { NextApiRequest, NextApiResponse } from 'next'

import { pairs } from 'config'
import { createStonker } from 'src/create-stonker'
import { Exchange } from 'src/models'

import { JSONData } from 'src/types'
import { Indicatorer } from 'src/interfaces'

type Report = {
  time: number
  value: number
}

export type ReportApiResponse = {
  period: number
  report: Report[]
}

const ReportApiRoute = (req: NextApiRequest, res: NextApiResponse<JSONData<ReportApiResponse>>) => {
  const { id } = req.query

  const periods = [
    // minutes
    5 * 60,
    15 * 60,
    // hours
    1 * 60 * 60,
    6 * 60 * 60,
    24 * 60 * 60,
  ]

  const stonker = createStonker()

  const data: JSONData<ReportApiResponse> =
    typeof id === 'string' &&
    periods.map((period) => {
      const values = stonker.services.database
        .getCandles(Exchange.CoinbasePro, id, period.toString(), sub(new Date(), { days: 90 }).getTime())
        .map(({ time, close }) => ({ time, close }))
      return {
        id: '',
        type: 'report',
        attributes: {
          period,
          report: Indicatorer.stc(values.map(({ close }) => close)).map((value, i) => ({
            time: values[i].time,
            value,
          })),
        },
      }
    })

  data ? res.status(200).json(data) : res.status(400)
}

export default ReportApiRoute
