import { useContext, createContext, useState, useEffect } from 'react'
import { RootState } from 'shared/types/store'
import { getInitialState } from 'shared/data/store'
import { slices } from 'shared/data/slices'

export interface WindowStore {
    reduxStore: RootState
}

const { App } = window

const WindowStoreContext = createContext({
    reduxStore: getInitialState(),
} as WindowStore)

export function useWindowStore() {
    return useContext(WindowStoreContext).reduxStore
}

export function WindowStoreProvider({ children }) {
    // Make a react version of the proxy store for rendering updates
    // We still rely on the proxy store for now to init the react store
    const { reduxStore, sliceUpdaters } = slices.reduce(
        (acc, slice) => {
            const [sliceState, updateSliceState] = useState(
                App.store.getState()[slice.name]
            )
            acc.reduxStore[slice.name] = sliceState
            acc.sliceUpdaters[slice.name] = updateSliceState
            return acc
        },
        {
            reduxStore: {},
            sliceUpdaters: {},
        }
    )

    useEffect(() => {
        slices.forEach((slice) => {
            Object.entries(slice.actions).forEach(([name, { type }]) => {
                console.log('create listeners on ', type)
                App.store.onSliceUpdate(type, (newSliceState) => {
                    console.log(type, newSliceState)
                    sliceUpdaters[slice.name](newSliceState)
                })
            })
        })
        // Add App listerners here
    }, [])

    const sharedStore = {
        reduxStore: reduxStore,
    }

    return (
        <WindowStoreContext.Provider value={sharedStore}>
            {children}
        </WindowStoreContext.Provider>
    )
}
