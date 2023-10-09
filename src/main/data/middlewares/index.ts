import { pipelineMiddleware } from './pipeline'
import { settingsMiddleware } from './settings'
import { updateMiddleware } from './update'

export { readSettings } from './settings'

export const middlewares = [
    settingsMiddleware,
    pipelineMiddleware,
    updateMiddleware,
]
