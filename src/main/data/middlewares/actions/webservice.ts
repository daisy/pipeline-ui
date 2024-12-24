import {
    EngineProperty,
    PipelineStatus,
    Script,
    Webservice,
} from 'shared/types'
import { info, error } from 'electron-log'
import { pipelineAPI } from '../../apis/pipeline'
import {
    selectStatus,
    setAlive,
    setDatatypes,
    setProperties,
    setScripts,
    setStatus,
} from 'shared/data/slices/pipeline'
import { getPipelineInstance } from '../../instance'
import { AbortError } from 'node-fetch'
import { GetStateFunction } from 'shared/types/store'
import { PayloadAction } from '@reduxjs/toolkit'

export function useWebservice(
    action: PayloadAction<any>,
    dispatch,
    getState: GetStateFunction
) {
    // Action dispatched when the pipeline instance is launched
    const newWebservice = action.payload as Webservice
    const fetchAlive = pipelineAPI.fetchAlive()
    const fetchScripts = pipelineAPI.fetchScripts()
    let maxAttempt = 2
    const loadPipelineData = async (attempt: number) => {
        if (attempt == maxAttempt) {
            error(
                'useWebservice',
                `${maxAttempt} attempts to fetch webservice data failed, stopping pipeline.`,
                'Please check pipeline logs.'
            )
            getPipelineInstance(getState())?.stop(action.payload)
            dispatch(setStatus(PipelineStatus.STOPPED))
            return
        }
        if (selectStatus(getState()) == PipelineStatus.STOPPED) {
            error(
                'useWebservice',
                'Pipeline has been stopped during webservice monitoring.',
                'Please check pipeline logs.'
            )
            return
        } else if (newWebservice) {
            fetchAlive(newWebservice)
                .then((alive) => {
                    info('useWebservice', 'Pipeline is ready to be used')
                    dispatch(setAlive(alive))
                })
                .then(() => fetchScripts(newWebservice))
                .then((scripts: Array<Script>) => {
                    dispatch(setScripts(scripts))
                    dispatch(setStatus(PipelineStatus.RUNNING))
                    return pipelineAPI.fetchDatatypes()(newWebservice)
                })
                .then((datatypes) => {
                    dispatch(setDatatypes(datatypes))
                    return pipelineAPI.fetchProperties()(newWebservice)
                })
                .then((properties: EngineProperty[]) => {
                    // Note : here we merge the instance properties
                    // with the one extracted from settings
                    let settingsTtsProperties: EngineProperty[] =
                        getState().settings.ttsConfig.ttsEngineProperties.map(
                            (p) => ({ name: p.key, value: p.value })
                        )
                    for (const p of properties) {
                        if (
                            settingsTtsProperties.find(
                                (p2) => p.name === p2.name
                            ) === undefined
                        ) {
                            settingsTtsProperties.push(p)
                        }
                    }
                    // dispatch to sync the properties
                    // in the engine
                    dispatch(setProperties(settingsTtsProperties))
                    // return pipelineAPI.fetchTtsVoices(
                    //     selectTtsConfig(getState())
                    // )(newWebservice)
                })
                // .then((voices: Array<TtsVoice>) => {
                //     // console.log('TTS Voices', voices)
                //     dispatch(setTtsVoices(voices))
                //     return pipelineAPI.fetchTtsEnginesState()(
                //         newWebservice
                //     )
                // })
                // .then((states) => {
                //     //console.log('tts states', states)
                //     dispatch(setTtsEngineState(states))
                // })
                .catch((e) => {
                    error('useWebservice', e, e.parsedText)
                    if (e instanceof AbortError) {
                        info(
                            `Trying for a new attempt ${attempt} / ${maxAttempt}`
                        )
                        loadPipelineData(attempt + 1)
                    } else if (
                        selectStatus(getState()) == PipelineStatus.RUNNING
                    ) {
                        error(
                            'useWebservice',
                            'Pipeline has stopped working during webservice monitoring.',
                            'Please check pipeline logs.'
                        )
                        dispatch(setStatus(PipelineStatus.STOPPED))
                    } else {
                        // Error during webservice check (possibly pipeline starting), retry in 1 second
                        setTimeout(() => loadPipelineData(0), 1000)
                    }
                })
        }
    }
    // Start pipeline data loading process
    loadPipelineData(0)
}
