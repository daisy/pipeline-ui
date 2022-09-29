import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { scriptsXmlToJson } from 'renderer/pipelineXmlConverter'
import { ScriptForm } from '../ScriptForm'
import styles from './styles.module.sass'

// the temporary "new job" has its own ID
export function NewJobPane({job, removeJob, updateJob}) {
  const [selectedScript, setSelectedScript] = useState(null)

  // TODO move this to app-level context
  // we don't need to refetch the list of scripts every time
  const { isLoading, error, data } = useQuery(['scriptsData'], async () => {
    let res = await fetch('http://localhost:8181/ws/scripts')
    let xmlStr = await res.text()
    return xmlStr
  })

  if (isLoading) return <p>Loading...</p>

  if (error instanceof Error)
    return <p>Error {error.message}</p>

  let scripts = []
  try {
    scripts = scriptsXmlToJson(data)
  }
  catch (err) {
    return <p>Error {err.message}</p>
  }

  let handleOnSelectChange = (e) => {
    let selection = scripts.find((script) => script.id == e.target.value)
    setSelectedScript(selection)
  }

  let job_ = {...job}
  if (selectedScript) job_.scriptHref = selectedScript.href
  return (
    <div className={styles.NewJobPane}>
      <div className={styles.SelectScript}>
        <label htmlFor="script">Select a script:</label>
        <select id="script" onChange={(e) => handleOnSelectChange(e)}>
          <option value={null}>None</option>
          {scripts.map((script, idx) => (
            <option key={idx} value={script.id}>
              {script.nicename}
            </option>
          ))}
        </select>
      </div>
      {selectedScript != null ? 
      <ScriptForm 
        job={job_} 
        removeJob={removeJob} 
        updateJob={updateJob}/> 
        : ''}
    </div>
  )
}