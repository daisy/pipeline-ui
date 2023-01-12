import { CounterState } from 'shared/data/slices/counter'
import { ApplicationSettings } from './settings'
//import { NavigationState } from 'shared/data/slices/navigation'
//import { PipelineState } from './pipeline'

/**
 * State managed by the store
 */
export interface RootState {
    counter?: CounterState
    settings?: ApplicationSettings
    // pipeline?: PipelineState
    // navigation?: NavigationState
}
