import { TradingViewAPI } from 'tradingview-scraper'

const debug = Debug('trading-view')

const tv = new TradingViewAPI()

const getEthData = async () => {
  const ethData = await tv.getTicker('COINBASE:ETHUSD')
  debug(ethData)
}
getEthData()
