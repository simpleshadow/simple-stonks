import { WebSocketTickerMessage } from 'coinbase-pro-node'
import { pairs } from 'config'
import { createContext, useContext } from 'react'
import { Socket, io } from 'socket.io-client'

export enum SocketIONamespaces {
  Tickers = 'tickers',
}

type TickerSocketListenEvents = {
  [K in typeof pairs[number]]: (tick: WebSocketTickerMessage) => void
}

export const sockets = {
  defaultSocket: io(process.env.NEXT_PUBLIC_SOCKET_IO_HOST),
  tickersSocket: io(`${process.env.NEXT_PUBLIC_SOCKET_IO_HOST}/${SocketIONamespaces.Tickers}`) as Socket<
    TickerSocketListenEvents,
    {}
  >,
}

export const SocketContext = createContext<typeof sockets>(null)

export const useSocketIO = (): typeof sockets => {
  const context = useContext(SocketContext)

  if (!context) {
    throw new Error(`The \`useSocketIO\` hook must be used inside the <SocketIOProvider> component's context`)
  }

  return sockets
}
