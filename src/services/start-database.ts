import Sqlite, { Database as SqliteDatabase } from 'better-sqlite3'
import Debug from 'debug'

import { Candle } from '../models/candle'

const debug = Debug('services:start-database')

export type Database = {
  database: SqliteDatabase

  getCandles: (exchange: string, symbol: string, period: string, start: number) => Candle[]
  insertCandles: (candles: Candle[]) => void
}

export const startDatabase = () => {
  const databaseController: Database = {
    database: null,

    getCandles: (exchange, symbol, period, start) => {
      const query = databaseController.database.prepare(
        'SELECT * from candlesticks where exchange = ? AND symbol = ? and period = ? and time > ? order by time ASC'
      )

      return query.all([exchange, symbol, period, start]) as Candle[]
    },
    insertCandles: (candles) => {
      const upsert = databaseController.database.prepare(
        'INSERT INTO candlesticks(exchange, symbol, period, time, open, high, low, close, volume) VALUES ($exchange, $symbol, $period, $time, $open, $high, $low, $close, $volume) ' +
          'ON CONFLICT(exchange, symbol, period, time) DO UPDATE SET open=$open, high=$high, low=$low, close=$close, volume=$volume'
      )

      databaseController.database.transaction(() => candles.forEach((candle) => upsert.run(candle)))()
    },
  }

  const db = Sqlite('stonks.db')
  db.pragma('journal_mode = WAL')

  db.pragma('SYNCHRONOUS = 1;')

  databaseController.database = db

  return databaseController
}
