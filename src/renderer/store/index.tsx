import { useContext, createContext, useState, useEffect } from 'react'
import {
    PipelineState,
    PipelineStatus,
    Webservice,
    baseurl,
    Script,
} from 'shared/types'
import {
    scriptsXmlToJson,
    scriptXmlToJson,
} from 'renderer/pipelineXmlConverter'

export interface WindowStore {
    about: {
        isOpen: boolean
    }
    pipeline: PipelineState
    messages: Array<string>
    errors: Array<string>
    scripts: Array<Script>
    // react dispatcher
    setPipelineState: React.Dispatch<React.SetStateAction<PipelineState>>
    setAboutWindowState: React.Dispatch<
        React.SetStateAction<{ isOpen: boolean }>
    >
    setPipelineErrors: React.Dispatch<React.SetStateAction<string[]>>
    setPipelineMessages: React.Dispatch<React.SetStateAction<string[]>>
}

const { App } = window

const WindowStoreContext = createContext({
    about: {
        isOpen: false,
    },
    pipeline: {
        status: PipelineStatus.UNKNOWN,
    },
    messages: [],
    errors: [],
    scripts: [],
} as WindowStore)

export function useWindowStore() {
    return useContext(WindowStoreContext)
}

export function WindowStoreProvider({ children }) {
    const [about, setAboutWindowState] = useState({
        isOpen: false,
    })
    const [pipeline, setPipelineState] = useState<PipelineState>({
        status: PipelineStatus.UNKNOWN,
    })
    const [messages, setPipelineMessages] = useState<Array<string>>([])
    const [errors, setPipelineErrors] = useState<Array<string>>([])
    const [scripts, setScripts] = useState<Array<Script>>([])

    useEffect(() => {
        App.getPipelineState().then((value) => {
            setPipelineState(value)
        })
        App.getPipelineMessages().then((messages) => {
            setPipelineMessages(messages)
        })
        App.getPipelineMessages().then((errors) => {
            setPipelineMessages(errors)
        })
    }, [])

    useEffect(() => {
        if (pipeline.status == PipelineStatus.RUNNING && scripts.length == 0) {
            console.log('getting scripts (useEffect)')
            getScripts(
                `${baseurl(pipeline.runningWebservice)}/scripts`,
                setScripts
            )
        }
    }, [pipeline])

    App.onPipelineStateChanged(async (event, newState) => {
        setPipelineState(newState)
    })
    App.onPipelineMessage((event, message) => {
        setPipelineMessages([message, ...messages])
    })
    App.onPipelineError((event, error) => {
        setPipelineErrors([error, ...errors])
    })

    const sharedStore = {
        about: about,
        pipeline: pipeline,
        messages: messages,
        errors: errors,
        scripts: scripts,
        setAboutWindowState,
        setPipelineState,
        setPipelineMessages,
        setPipelineErrors,
    }

    return (
        <WindowStoreContext.Provider value={sharedStore}>
            {children}
        </WindowStoreContext.Provider>
    )
}

async function getScripts(url, setScriptsFn) {
    let res = await fetch(url)
    let xmlStr = await res.text()
    console.log(xmlStr)

    let scriptsData = scriptsXmlToJson(xmlStr)
    let completeScriptsData = await Promise.all(
        scriptsData.map(async (scriptData) => {
            res = await fetch(scriptData.href)
            xmlStr = await res.text()
            return scriptXmlToJson(xmlStr)
        })
    )
    console.log('setting scripts', completeScriptsData)
    setScriptsFn(completeScriptsData)
}
