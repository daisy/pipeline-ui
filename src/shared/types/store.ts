import { ApplicationSettings } from './settings'
import { PipelineState } from './pipeline'
import { UpdateState } from './update'

/**
 * State managed by the store
 */
export interface RootState {
    settings?: ApplicationSettings
    pipeline?: PipelineState
    update?: UpdateState
}

export type GetStateFunction = () => RootState
