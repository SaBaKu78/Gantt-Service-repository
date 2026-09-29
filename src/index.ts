import fastify from 'fastify'
import sensible from '@fastify/sensible'
import { fastifyAwilixPlugin, diContainer } from '@fastify/awilix'
import autoload from '@fastify/autoload'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { registerRootContainer } from './container/container'
import { serializerCompiler, validatorCompiler, ZodTypeProvider } from '@fastify/type-provider-zod'
import fastifyFormBody from '@fastify/formbody'
import prismaPlugin from './plugin/prisma-plugin'

const currentFile = fileURLToPath(import.meta.url)
const currentDir = path.dirname(currentFile)

export async function build() {
  const f = fastify({
    logger: true,
  })

  f.setValidatorCompiler(validatorCompiler)
  f.setSerializerCompiler(serializerCompiler)

  const app = f.withTypeProvider<ZodTypeProvider>()

  app.register(sensible)

  app.register(fastifyFormBody)
  await app.register(prismaPlugin)

  await app.register(fastifyAwilixPlugin, {
    disposeOnClose: true,
    disposeOnResponse: true,
  })

  await registerRootContainer(diContainer)


  await app.register(autoload, {
    dir: path.join(currentDir, 'routes'),
    forceESM: true,
  })

  return app
}
