import { counter } from './counter'
import { settings } from './settings'
// import { pipeline } from './pipeline'
// import { navigation } from './navigation'
import { RootState } from 'shared/types/store'

export const slices = [counter, settings] // pipeline, navigation

export const selectors = {
    selectCounter: (s: RootState) => s.counter,
}

export const { selectCounter } = selectors
