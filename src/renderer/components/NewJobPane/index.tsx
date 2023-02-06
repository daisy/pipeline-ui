/*
Select a script and submit a new job
*/
import { useState } from 'react'
import { ScriptForm } from '../ScriptForm'
import { useWindowStore } from 'renderer/store'
import { ID } from 'renderer/utils/utils'

export function NewJobPane({ job }) {
    const [selectedScript, setSelectedScript] = useState(null)
    const { pipeline } = useWindowStore()

    let onSelectChange = (e) => {
        let selection = pipeline.scripts.find(
            (script) => script.id == e.target.value
        )
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
                    htmlFor={`${ID(job.internalId)}-script`}
                >
                    Select a script:
                </label>
                <select
                    id={`${ID(job.internalId)}-script`}
                    onChange={(e) => onSelectChange(e)}
                >
                    <option value={null}>None</option>
                    {pipeline.scripts
                        .sort((a, b) => (a.nicename > b.nicename ? 1 : -1))
                        .map((script, idx) => (
                            <option key={idx} value={script.id}>
                                {script.nicename}
                            </option>
                        ))}
                </select>
            </section>
            {selectedScript != null ? (
                <ScriptForm job={job_} script={selectedScript} />
            ) : (
                ''
            )}
        </>
    )
}
