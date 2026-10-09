import { AwilixContainer, Cradle } from "awilix";
import { PrismaClient } from "../../generated/prisma/client";
import { WsHub } from "../websocket/core/WsHub";

declare module 'fastify' {
  interface FastifyInstance {
    prisma: PrismaClient,
    wsHub: WsHub
  }
  interface FastifyRequest {
    diScope: AwilixContainer<Cradle>
  }
}