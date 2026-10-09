import { FastifyPluginAsync } from 'fastify'
import { handleWsConnection } from '../websocket/core/WsConnection'

const websocketRoutes: FastifyPluginAsync = async (app) => {
  app.get('/ws', { websocket: true }, (socket, request) => {
    handleWsConnection(socket, request, app.wsHub, app.log)
  })
}

export default websocketRoutes
