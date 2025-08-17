import { updateJob } from 'shared/data/slices/pipeline'
import { ID } from 'renderer/utils/utils'
import { Job } from 'shared/types'
import { useState } from 'react'
const { App } = window

export function CustomName({ job }) {
    const [value, setValue] = useState((job.jobRequest && job.jobRequest.nicename) || '')

    return (
        <div className="custom-name field">
            <label htmlFor={`${ID(job.internalId)}-nicename`}>
                Custom job name:
            </label>
            <input
                id={`${ID(job.internalId)}-nicename`}
                type="text"
                value={value}
                title="Change the current job's name."
                onBlur={(e) => {
                    const updatedJob: Job = {
                        ...job,
                        jobData: {
                            ...job.jobData,
                        },
                        jobRequest: {
                            ...job.jobRequest,
                            nicename: e.target.value,
                        },
                    }
                    App.store.dispatch(updateJob(updatedJob))
                }}
                onChange={(e) => {
                    setValue(e.target.value)
                }}
            />
        </div>
    )
}
