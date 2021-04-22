import Debug from 'debug'
import { CoinbasePro as CoinbaseProNode } from 'coinbase-pro-node'

const debug = Debug('services:start-coinbase-pro')

export type CoinbasePro = CoinbaseProNode

export const startCoinbasePro = () => {
  if (process.env.COINBASE_PRO_USE_SANDBOX === 'true') {
    debug("Using Coinbase Pro's public sandbox with API key")

    return new CoinbaseProNode({
      apiKey: process.env.COINBASE_PRO_SANDBOX_API_KEY!,
      apiSecret: process.env.COINBASE_PRO_SANDBOX_API_SECRET!,
      passphrase: process.env.COINBASE_PRO_SANDBOX_PASSPHRASE!,
      useSandbox: true,
    })
  } else if (process.env.COINBASE_PRO_USE_SANDBOX === 'false') {
    debug("Using Coinbase Pro's production environment with API key")

    return new CoinbaseProNode({
      apiKey: process.env.COINBASE_PRO_API_KEY!,
      apiSecret: process.env.COINBASE_PRO_API_SECRET!,
      passphrase: process.env.COINBASE_PRO_PASSPHRASE!,
      useSandbox: false,
    })
  }

  debug("Using Coinbase Pro's production environment without API key")

  return new CoinbaseProNode()
}
