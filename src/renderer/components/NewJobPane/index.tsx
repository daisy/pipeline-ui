import { useState } from 'react'
import { ScriptForm } from '../ScriptForm'
import { useWindowStore } from 'renderer/store'
import { ID } from 'renderer/utils'

export function NewJobPane({ job, removeJob, updateJob }) {
    console.log('new job pane for ', job)

    const [selectedScript, setSelectedScript] = useState(null)
    const { scripts } = useWindowStore()

    let handleOnSelectChange = (e) => {
        let selection = scripts.find((script) => script.id == e.target.value)
        setSelectedScript(selection)
    }

    let job_ = { ...job }

    

    return (
        <>
            <section
                className="select-script"
                aria-labelledby={`${ID(job.internalId)}-select-script}`}
            >
                <label
                    id={`${ID(job.internalId)}-select-script}`}
                    htmlFor="script"
                >
                    Select a script:
                </label>
                <select id="script" onChange={(e) => handleOnSelectChange(e)}>
                    <option value={null}>None</option>
                    {scripts.map((script, idx) => (
                        <option key={idx} value={script.id}>
                            {script.nicename}
                        </option>
                    ))}
                </select>
            </section>
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
        </>
    )
}
