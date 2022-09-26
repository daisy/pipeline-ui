import { useEffect, useState } from 'react'
import { scriptsXmlToJson } from 'renderer/pipelineXmlToJson'
import { useWindowStore } from 'renderer/store'
import { baseurl, PipelineStatus, Script } from 'shared/types'
import { useQuery } from '@tanstack/react-query'
import { ScriptForm } from '../ScriptForm'
import styles from './styles.module.sass'

export function NewJobPane() {
  const {pipeline} = useWindowStore()
  
  const [viewState, setViewState] = useState<{
    selectedScript:Script|null
    scripts:Script[],
    error?:Error,
    isLoading:boolean
  }>({
    selectedScript:null,
    scripts:[],
    isLoading:false
  })

  const handleOnSelectChange = (e) => {
    let selection = viewState.scripts.find((script) => script.id == e.target.value)
    setViewState({
      ...viewState,
      selectedScript:selection
    })
  }

  useEffect(() => {
    if(pipeline.status === PipelineStatus.RUNNING){
      const ws = pipeline.runningWebservice
      setViewState({
        ...viewState,
        isLoading:true
      })
      fetch(`${baseurl(ws)}/scripts`).then(async (response) => {
        const scriptsJson = scriptsXmlToJson(await response.text())
        setViewState({
          ...viewState,
          scripts:scriptsJson,
          error:null,
          isLoading:false
        })
      }).catch((error) => {
        // Keep previous list of scripts
        setViewState({
          ...viewState,
          error:error,
          isLoading:false
        })
      })
    } 
  } ,[pipeline])


  if (viewState.isLoading){
    return <span>Loading jobs ...</span>
  } else if (viewState.error && viewState.error instanceof Error){
    return <span>An error has occurred: {viewState.error.message}</span>
  } else {
    return (
      <div className={styles.NewJobPane}>
        {viewState.selectedScript == null ? (
          <>
            <h2>New Job</h2>
            <div>
              <label htmlFor="script">Select a script:</label>
              <select id="script" onChange={(e) => handleOnSelectChange(e)}>
                <option value={null}>None</option>
                {viewState.scripts.map((script, idx) => (
                  <option key={idx} value={script.id}>
                    {script.nicename}
                  </option>
                ))}
              </select>
            </div>
            <button>Cancel new job</button>
          </>
        ) : (
          <></>
        )}
        {viewState.selectedScript != null ? (
          <ScriptForm scriptHref={viewState.selectedScript.href} />
        ) : (
          <></>
        )}
      </div>
    )
  }
}
