import { counter } from './counter'
import { settings } from './settings'
// import { pipeline } from './pipeline'
// import { navigation } from './navigation'
import { PayloadAction } from '@reduxjs/toolkit'
import { RootState } from 'shared/types/store'

export const slices = [counter, settings] // pipeline, navigation

/**
 * Slice actions map that should contain [action.key]:'action.type'
 */
export type SliceActionsObject<T> = {
    [k in keyof T]: string
}

/**
 * Slice actions register
 */
export type SliceActions = {
    slice: string
    actions: SliceActionsObject<unknown>
}

/**
 * array of @see SliceActions `[ { slice:sliceName, actions:{actionName:actionType} }, ... ]`
 */
export const actions = slices.map((slice) => {
    return {
        slice: slice.name,
        actions: Object.entries(slice.actions).reduce(
            (
                acc: SliceActionsObject<unknown>,
                actionCreator: [string, { type }]
            ) => {
                acc[actionCreator[0]] = actionCreator[1].type
                return acc
            },
            {}
        ) as SliceActionsObject<unknown>,
    } as SliceActions
})

export const selectors = {
    selectCounter: (s: RootState) => s.counter,
}

export const { selectCounter } = selectors
