import { WebSocket } from 'ws'
import { WsHub } from './WsHub'
import { FastifyBaseLogger, FastifyRequest } from 'fastify'
import { WsConnectionContext } from '../types/type'

const getContext = (request: FastifyRequest): WsConnectionContext => {
  const query = request.query as {
    projectId?: string
  }
  return {
    projectId: query.projectId,
  }
}

export function handleWsConnection(
  socket: WebSocket,
  request: FastifyRequest,
  hub: WsHub,
  log: FastifyBaseLogger,
) {
  const context = getContext(request)
  hub.add(socket, context)

  socket.send(
    JSON.stringify({
      type: 'connected',
    }),
  )

  socket.on('message', (raw) => {
    if (raw.toString() == 'ping') {
      socket.send('pong')
    }
  })

  socket.on('error', (error) => {
    log.error(
      {
        error,
        context,
      },
      'Websocket error',
    )
  })
}
