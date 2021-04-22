import { ema, sma, macd } from 'technicalindicators'
import Debug from 'debug'

const debug = Debug('interfaces:indicatorer')

export type Indicatorer = {
  ema: (source: number[], length: number) => number[]
  macd: (source: number[], fastLength?: number, slowLength?: number, signalLength?: number) => MacdOutput[]
  sma: (source: number[], length: number) => number[]
  stc: (
    source: number[],
    length?: number,
    fastLength?: number,
    slowLength?: number,
    factor?: number
  ) => number[]
}

type MacdOutput = {
  macd?: number
  signal?: number
  histogram?: number
}

export const Indicatorer: Indicatorer = {
  ema: (source, length) =>
    source.map((val, i) => {
      let ema: number
      // lookback
      if (i - length >= 0) {
        const xsource = source.slice(i - length, i)
        const sma = xsource.reduce((prev, cur) => prev + cur) / length
        const k = 2 / (length + 1)
        ema = val * k + sma * (1 - k)
      }
      return ema
    }),
  macd: (source, fastLength = 12, slowLength = 26, signalLength = 9) =>
    macd({
      values: source,
      fastPeriod: fastLength,
      slowPeriod: slowLength,
      signalPeriod: signalLength,
      SimpleMAOscillator: false,
      SimpleMASignal: false,
    }).map(({ MACD: macd, ...rest }) => ({ macd, ...rest })),
  sma: (source, length) => sma({ period: length, values: source }),
  stc: (source, length = 10, fastLength = 23, slowLength = 50, factor = 0.5) => {
    const emaFastSeries = Indicatorer.ema(source, fastLength)
    const emaSlowSeries = Indicatorer.ema(source, slowLength)

    const macd = emaFastSeries.map((emaFast, i) => emaFast - emaSlowSeries[i])

    let stoK: number[] = [],
      smoothedStoK: number[] = [],
      stoD: number[] = [],
      smoothedStoD: number[] = []

    macd.forEach((m, i) => {
      const xmacd = macd.slice(i, i + length)

      const min1 = Math.min(...xmacd)
      const max1 = Math.max(...xmacd)

      stoK.push(max1 - min1 > 0 ? ((m - min1) / (max1 - min1)) * 100 : stoK.slice(-1)[0] || 0)

      const currentStoK = stoK.slice(-1)[0]
      const prevSmoothedStoK = smoothedStoK.slice(-1)[0]

      smoothedStoK.push(
        !prevSmoothedStoK ? currentStoK : prevSmoothedStoK + factor * (currentStoK - prevSmoothedStoK)
      )

      const min2 = Math.min(...smoothedStoK)
      const max2 = Math.max(...smoothedStoK)
      const currentSmoothedStoK = smoothedStoK.slice(-1)[0]

      stoD.push(
        max2 - min2 > 0 ? ((currentSmoothedStoK - min2) / (max2 - min2)) * 100 : stoD.slice(-1)[0] || 0
      )

      const currentStoD = stoD.slice(-1)[0]
      const prevSmoothedStoD = smoothedStoD.slice(-1)[0]

      smoothedStoD.push(
        !prevSmoothedStoD ? currentStoD : prevSmoothedStoD + factor * (currentStoD - prevSmoothedStoD)
      )
    })

    return emaFastSeries

    // let f1: number[] = [],
    //   pf: number[] = [],
    //   f2: number[] = [],
    //   pff: number[] = []

    // for (let i = 0; i < macd.length; i = i + 1) {
    //   const _macd = macd.slice(i, i + length).map(({ macd }) => macd)

    //   const v1 = Math.min(..._macd)
    //   const v2 = Math.max(..._macd) - v1

    //   const previousF1 = f1.slice(-1)[0]
    //   f1.push(v2 > 0 ? ((_macd[0] - v1) / v2) * 100 : previousF1 || 0)

    //   const previousPf = pf.slice(-1)[0]
    //   const currentF1 = f1.slice(-1)[0]
    //   pf.push(!previousPf ? currentF1 : previousPf + factor * (currentF1 - previousPf))

    //   const _pf = pf.slice(-10)
    //   const v3 = Math.min(..._pf)
    //   const v4 = Math.max(..._pf) - v3

    //   const currentPf = pf.slice(-1)[0]
    //   const previousF2 = f2.slice(-1)[0]
    //   f2.push(v4 > 0 ? ((currentPf - v3) / v4) * 100 : previousF2 || 0)

    //   const previousPff = pff.slice(-1)[0]
    //   const currentF2 = f2.slice(-1)[0]
    //   pff.push(!previousPff ? currentF2 : previousPff + factor * (currentF2 - previousPff))
    // }
    // return pff

    // let pff: number[] = [],
    //   f1: number[] = [],
    //   pf: number[] = [],
    //   f2: number[] = []

    // for (let i = 0; i < source.length - 1; i = i + 1) {
    //   const m = macd.slice(i, i + length).map(({ macd }) => macd)

    //   if (m.length > 0) {
    //     const v1 = Math.min(...m)
    //     const v2 = Math.max(...m) - v1

    //     f1.push(v2 > 0 ? ((m[i] - v1) / v2) * 100 : f1?.[f1.length - 2] || 0)
    //     pf.push(
    //       !pf?.[pf.length - 2]
    //         ? f1[f1.length - 1]
    //         : pf[pf.length - 2] + factor * (f1[f1.length - 1] - pf[pf.length - 2])
    //     )

    //     const _pf = i == 0 ? pf : pf.slice(i - length - 1, i)
    //     const v3 = Math.min(..._pf)
    //     const v4 = Math.max(..._pf) - v3

    //     f2.push(v4 > 0 ? ((pf[pf.length - 2] - v3) / v4) * 100 : f2?.[f2.length - 2] || 0)
    //     pff.push(
    //       !pff?.[pff.length - 2]
    //         ? f2[f2.length - 1]
    //         : pff[pff.length - 2] + factor * (f2[f2.length - 1] - pff[pff.length - 2])
    //     )
    //   }
    // }
    // return pff
  },
}
