import { WebSocketEvent, WebSocketTickerMessage } from 'coinbase-pro-node'
import Debug from 'debug'
import { NextPage } from 'next'
import Pair from './pairs/[pair]/periods/[period]'

const debug = Debug(`pages:index`)

type IndexProps = {}

const Index: NextPage<IndexProps> = Pair

export default Index
