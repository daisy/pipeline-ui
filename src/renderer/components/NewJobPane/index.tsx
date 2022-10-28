import { useState } from 'react'
import { ScriptForm } from '../ScriptForm'
import styles from './styles.module.sass'
import { useWindowStore } from 'renderer/store'

// the temporary "new job" has its own ID
export function NewJobPane({ job, removeJob, updateJob }) {
    const [selectedScript, setSelectedScript] = useState(null)
    const { scripts } = useWindowStore()

    let handleOnSelectChange = (e) => {
        let selection = scripts.find((script) => script.id == e.target.value)
        setSelectedScript(selection)
    }

    let job_ = { ...job }
    // if (selectedScript) job_.scriptHref = selectedScript.href
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
            {selectedScript != null ? (
                <ScriptForm
                    job={job_}
                    scriptHref={selectedScript.href}
                    removeJob={removeJob}
                    updateJob={updateJob}
                />
            ) : (
                ''
            )}
        </div>
    )
}
