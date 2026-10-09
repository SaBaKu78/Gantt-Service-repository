import fastifyWebsocket from "@fastify/websocket"
import fp from 'fastify-plugin'
import { WsHub } from "../websocket/core/WsHub"

export default fp(async(app)=>{
  app.register(fastifyWebsocket, {
    options: {
      maxPayload: 1024 * 1024,
      clientTracking: true
    }
  })

  app.decorate("wsHub", new WsHub())
})