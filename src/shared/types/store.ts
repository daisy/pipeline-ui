import { ApplicationSettings } from './settings'
import { PipelineState } from './pipeline'

/**
 * State managed by the store
 */
export interface RootState {
    settings?: ApplicationSettings
    pipeline?: PipelineState
}
