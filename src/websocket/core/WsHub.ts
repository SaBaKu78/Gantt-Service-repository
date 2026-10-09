import { WebSocket } from 'ws'
import { WsConnectionContext, WsEvent } from '../types/type'

interface WsClient {
  socket: WebSocket
  context: WsConnectionContext
}

export class WsHub {
  private clients: Set<WsClient> = new Set<WsClient>()

  add(socket: WebSocket, context: WsConnectionContext) {
    const client: WsClient = {
      socket,
      context,
    }

    this.clients.add(client)

    const remove = () => {
      this.clients.delete(client)
    }

    socket.once('close', remove)
    socket.once('error', remove)
  }

  broadcast<T>(
    event: WsEvent<T>,
    filter?: (context: WsConnectionContext) => boolean,
  ) {
    const payload = JSON.stringify(event)
    for (const client of this.clients) {
      if (filter && !filter(client.context)) continue
      if (client.socket.readyState == WebSocket.OPEN) {
        client.socket.send(payload)
      }
    }
  }

  broadToProject<T>(projectId: string, event: WsEvent<T>) {
    this.broadcast(event, (context) => context.projectId === projectId)
  }
}
