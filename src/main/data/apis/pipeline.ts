import fetch from 'node-fetch'
import { info } from 'electron-log'
import { PipelineAPI } from 'shared/data/apis/pipeline'
import {
    selectEngineMode,
    selectExternalEngine,
} from 'shared/data/slices/settings'
import { RootState } from 'shared/types/store'
import { signPipelineUrl } from 'main/pipeline/sign'

type FetchOptions = Parameters<typeof fetch>[1]

let getPipelineApiState: (() => RootState) | undefined

export function configurePipelineAPIState(getState: () => RootState) {
    getPipelineApiState = getState
}

function shouldSignPipelineRequest(state: RootState | undefined) {
    if (!state || selectEngineMode(state) !== 'external') {
        return false
    }

    const externalEngine = selectExternalEngine(state)
    return !!externalEngine?.authId && !!externalEngine?.secret
}

export function getPipelineRequestUrl(
    url: string,
    state: RootState | undefined = getPipelineApiState?.()
) {
    if (!shouldSignPipelineRequest(state)) {
        return url
    }

    const externalEngine = selectExternalEngine(state)
    return signPipelineUrl(url, externalEngine.authId, externalEngine.secret)
}

function signedFetch(url: string, options?: FetchOptions) {
    return fetch(getPipelineRequestUrl(url), options)
}

export const pipelineAPI = new PipelineAPI(signedFetch, info)
