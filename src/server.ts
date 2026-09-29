import { build } from '.'
import { environment } from './config/env'

const app = await build()

try {
  await app.listen({
    host: environment.HOST,
    port: environment.PORT,
  })
} catch (e) {
  app.log.error(e)
  process.exit(1)
}
