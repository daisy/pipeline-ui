/*
Select a script and submit a new job
*/
import { useState } from 'react'
import { ScriptForm } from '../ScriptForm'
import { useWindowStore } from 'renderer/store'
import { ID } from 'renderer/utils/utils'
import { Job } from 'shared/types'

export function NewJobPane({ job }: { job: Job }) {
    const { pipeline } = useWindowStore()
    const [selectedScript, setSelectedScript] = useState(
        (job.jobData?.script &&
            pipeline.scripts.find(
                (script) => script.id == job.jobData?.script.id
            )) ||
            null
    )

    let onSelectChange = (e) => {
        let selection = pipeline.scripts.find(
            (script) => script.id == e.target.value
        )
        setSelectedScript(selection)
    }
    return (
        <>
            <section
                className="select-script"
                aria-labelledby={`${ID(job.internalId)}-select-script`}
            >
                <label
                    id={`${ID(job.internalId)}-select-script`}
                    htmlFor={`${ID(job.internalId)}-script`}
                >
                    Select a script:
                </label>
                <select
                    id={`${ID(job.internalId)}-script`}
                    onChange={(e) => onSelectChange(e)}
                    value={selectedScript ? selectedScript.id : ''}
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
                <ScriptForm job={job} script={selectedScript} />
            ) : (
                ''
            )}
        </>
    )
}
