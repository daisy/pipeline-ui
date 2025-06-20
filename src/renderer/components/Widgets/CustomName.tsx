import { updateJob } from 'shared/data/slices/pipeline'
import { ID } from 'renderer/utils/utils'
import { Job } from 'shared/types'
const { App } = window

export function CustomName({ job }) {
    return (
        <div className="custom-name">
            <label htmlFor={`${ID(job.internalId)}-nicename`}>
                Custom job name:
            </label>
            <input
                id={`${ID(job.internalId)}-nicename`}
                type="text"
                value={(job.jobRequest && job.jobRequest.nicename) || ''}
                title="Change the current job's name."
                onChange={(e) => {
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
            />
        </div>
    )
}
