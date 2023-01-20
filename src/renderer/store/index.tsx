import { useContext, createContext, useState, useEffect } from 'react'
import {
    PipelineState,
    PipelineStatus,
    Webservice,
    baseurl,
    Script,
    ApplicationSettings,
} from 'shared/types'
import {
    scriptsXmlToJson,
    scriptXmlToJson,
} from 'shared/parser/pipelineXmlConverter'
import { RootState } from 'shared/types/store'
import { getInitialState } from 'shared/data/store'
import { slices } from 'shared/data/slices'

export interface WindowStore {
    reduxStore: RootState
    // about: {
    //     isOpen: boolean
    // }
    // pipeline: PipelineState
    // messages: Array<string>
    // errors: Array<string>
    // scripts: Array<Script>
    // settings: ApplicationSettings
    // // react dispatcher
    // setPipelineState?: React.Dispatch<React.SetStateAction<PipelineState>>
    // setAboutWindowState?: React.Dispatch<
    //     React.SetStateAction<{ isOpen: boolean }>
    // >
    // setPipelineErrors?: React.Dispatch<React.SetStateAction<string[]>>
    // setPipelineMessages?: React.Dispatch<React.SetStateAction<string[]>>
    // setSettings?: React.Dispatch<React.SetStateAction<ApplicationSettings>>
}

const { App } = window

const WindowStoreContext = createContext({
    reduxStore: getInitialState(),
    // about: {
    //     isOpen: false,
    // },
    // pipeline: {
    //     status: PipelineStatus.UNKNOWN,
    // },
    // messages: [],
    // errors: [],
    // scripts: [],
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

    console.log('store', reduxStore)

    // const [about, setAboutWindowState] = useState({
    //     isOpen: false,
    // })
    // const [pipeline, setPipelineState] = useState<PipelineState>({
    //     status: PipelineStatus.UNKNOWN,
    // })
    // const [messages, setPipelineMessages] = useState<Array<string>>([])
    // const [errors, setPipelineErrors] = useState<Array<string>>([])
    // const [scripts, setScripts] = useState<Array<Script>>([])
    // const [settings, setSettings] = useState<ApplicationSettings>({
    //     downloadFolder: '',
    // })

    useEffect(() => {
        slices.forEach((slice) => {
            //console.log('useEffect', slice)
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
        // about: about,
        // pipeline: pipeline,
        // messages: messages,
        // errors: errors,
        // scripts: scripts,
        // settings: settings,
        // setAboutWindowState,
        // setPipelineState,
        // setPipelineMessages,
        // setPipelineErrors,
        // setSettings,
    }

    return (
        <WindowStoreContext.Provider value={sharedStore}>
            {children}
        </WindowStoreContext.Provider>
    )
}
