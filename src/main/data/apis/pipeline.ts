import fetch from 'node-fetch'
import { info } from 'electron-log'
import { PipelineAPI } from 'shared/data/apis/pipeline'

export const pipelineAPI = new PipelineAPI(fetch, info)
