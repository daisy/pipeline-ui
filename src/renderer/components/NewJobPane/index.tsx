import { useQuery } from '@tanstack/react-query'
import { useState } from 'react'
import { scriptsXmlToJson } from 'renderer/pipelineXmlConverter'
import { ScriptForm } from '../ScriptForm'
import styles from './styles.module.sass'

export function NewJobPane() {
  const [selectedScript, setSelectedScript] = useState(null)

  const { isLoading, error, data } = useQuery(['scriptsData'], async () => {
    let res = await fetch('http://localhost:8181/ws/scripts')
    let xmlStr = await res.text()
    return xmlStr
  })

  if (isLoading) return <p>Loading...</p>

  if (error instanceof Error)
    return <p>An error has occurred: {error.message}</p>

  let scripts = scriptsXmlToJson(data)
  if (!scripts) {
    return <p>An error has occurred</p>
  }

  let handleOnSelectChange = (e) => {
    let selection = scripts.find((script) => script.id == e.target.value)
    setSelectedScript(selection)
  }

  return (
    <div className={styles.NewJobPane}>
      {selectedScript == null ? (
        <>
          <h2>New Job</h2>
          <div>
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
          <button>Cancel new job</button>
        </>
      ) : (
        <></>
      )}
      {selectedScript != null ? (
        <ScriptForm scriptHref={selectedScript.href} />
      ) : (
        <></>
      )}
      
      
      
    </div>
  )
}
