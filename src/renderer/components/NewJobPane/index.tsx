/*
Select a script and submit a new job
*/
import { useState } from 'react'
import { ScriptForm } from '../ScriptForm'
import { useWindowStore } from 'renderer/store'
import { ID } from 'renderer/utils/utils'
import { Job } from 'shared/types'
import { prepareJobRequest, updateJob } from 'shared/data/slices/pipeline'

const { App } = window

export function NewJobPane({ job }: { job: Job }) {
    const { pipeline } = useWindowStore()

    let onSelectChange = (e) => {
        let selection = pipeline.scripts.find(
            (script) => script.id == e.target.value
        )
        App.store.dispatch(
            updateJob({
                ...job,
                script: selection,
                jobRequest: prepareJobRequest(job, selection),
            })
        )
    }

    return (
        <>
            <section
                className="select-script"
                aria-labelledby={`${ID(job.internalId)}-select-script`}
            >
                <div>
                    <label
                        id={`${ID(job.internalId)}-select-script`}
                        htmlFor={`${ID(job.internalId)}-script`}
                    >
                        Select a script:
                    </label>
                    <select
                        id={`${ID(job.internalId)}-script`}
                        onChange={(e) => onSelectChange(e)}
                        value={job.script ? job.script.id : ''}
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
                </div>
                <div>
                    <label
                        id={`${ID(job.internalId)}-change-name`}
                        htmlFor={`${ID(job.internalId)}-nicename`}
                    >
                        Job's name:
                    </label>
                    <input
                        id={`${ID(job.internalId)}-nicename`}
                        type="text"
                        value={
                            (job.jobData && job.jobData.nicename) ||
                            (job.jobRequest && job.jobRequest.nicename) ||
                            ''
                        }
                        onChange={(e) => {
                            const updatedJob: Job = {
                                ...job,
                                jobData: {
                                    ...job.jobData,
                                    nicename: e.target.value,
                                },
                                jobRequest: {
                                    ...job.jobRequest,
                                    nicename: e.target.value,
                                },
                            }
                            App.store.dispatch(updateJob(updatedJob))
                        }}
                    />
                </div>
            </section>
            {job.script != null ? (
                <ScriptForm job={job} script={job.script} />
            ) : (
                ''
            )}
        </>
    )
}
