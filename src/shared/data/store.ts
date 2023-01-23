import { RootState } from 'shared/types/store'
import { slices } from './slices'

export const getInitialState = () =>
    slices.reduce((store, slice) => {
        //@ts-ignore
        store[slice.name] = slice.getInitialState()
        return store
    }, {} as RootState)
