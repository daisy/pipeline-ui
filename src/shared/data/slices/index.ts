import { counter } from './counter'
import { settings } from './settings'
// import { pipeline } from './pipeline'
// import { navigation } from './navigation'
import { PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'shared/types/store'

export const slices = [counter, settings] // pipeline, navigation

/**
 * A tree of actions handled by the store slices
 */
export const actionsTree = {
    ...slices.reduce((slicesActions, slice) => {
        slicesActions[slice.name] = Object.entries(slice.actions).reduce(
            (acc: any, [key, action]: [string, PayloadAction]) => {
                acc[key] = action.type
                return acc
            },
            {}
        )
        return slicesActions
    }, {}),
}

export const selectors = {
    selectCounter: (s: RootState) => s.counter,
    selectSettings: (s: RootState) => s.settings,
    // selectPipeline: (s: RootState) => s.pipeline,
    // selectNavigation: (s: RootState) => s.navigation,
}

export const {
    selectCounter,
    selectSettings,
    // selectPipeline,
    // selectNavigation,
} = selectors
