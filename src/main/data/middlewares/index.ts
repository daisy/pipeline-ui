import { pipelineMiddleware } from './pipeline'
import { settingsMiddleware } from './settings'

export { readSettings } from './settings'

export const middlewares = [settingsMiddleware, pipelineMiddleware]
