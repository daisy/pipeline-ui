import { useContext, createContext, useState, useEffect } from 'react'
import { PipelineState, PipelineStatus, Webservice } from 'shared/types'

export interface WindowStore {
  about: {
    isOpen: boolean
  },
  pipeline:PipelineState,
  messages:Array<string>,
  errors:Array<string>,
  // react dispatcher
  setPipelineState: React.Dispatch<React.SetStateAction<PipelineState>>
  setAboutWindowState:React.Dispatch<React.SetStateAction<{isOpen: boolean}>>,
  setPipelineErrors: React.Dispatch<React.SetStateAction<string[]>>,
  setPipelineMessages: React.Dispatch<React.SetStateAction<string[]>>
}

const { App } = window

const WindowStoreContext = createContext({
  about:{
    isOpen:false
  },
  pipeline : {
    status:PipelineStatus.UNKNOWN
  },
  messages:[],
  errors:[]
} as WindowStore)

export function useWindowStore() {
  return useContext(WindowStoreContext)
}

export function WindowStoreProvider({ children }) {

  const [about, setAboutWindowState] = useState({
    isOpen:false
  })
  const [pipeline, setPipelineState] = useState<PipelineState>({
    status:PipelineStatus.UNKNOWN
  })
  const [messages, setPipelineMessages] = useState<Array<string>>([])
  const [errors, setPipelineErrors] = useState<Array<string>>([])

  useEffect(()=>{
    App.getPipelineState().then((value)=>{
      setPipelineState(value)
    })
  },[])

  App.onPipelineStateChanged((event,newState) => {
    setPipelineState(newState)
  })
  App.onPipelineMessage((event,message)=>{
    setPipelineMessages([message, ...messages])
  })
  App.onPipelineError((event,error)=>{
    setPipelineErrors([error, ...errors])
  })

  const sharedStore = {
    about: about,
    pipeline:pipeline,
    messages:messages,
    errors:errors,
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
