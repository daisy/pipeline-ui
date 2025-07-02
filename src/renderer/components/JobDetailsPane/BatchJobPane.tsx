/*
Details of a submitted job
*/
import { Job, JobStatus } from '/shared/types'

import { removeBatchJob, cancelBatchJob } from 'shared/data/slices/pipeline'
import { useState, useEffect } from 'react'
import { JobDetails } from './JobDetails'
import { areAllJobsInBatchDone, getIdleCountInBatch } from 'shared/utils'
import { JobStatusIcon } from '../Widgets/SvgIcons'
import { File, FileAsType } from '../Widgets/File'
import { getStatus, ID } from 'renderer/utils'

const { App } = window

export function BatchJobDetailsPane({ jobs }: { jobs: Array<Job> }) {
    const [primaryJob] = useState(jobs.find((j) => j.isPrimaryForBatch))
    const [selectedJob, setSelectedJob] = useState(primaryJob)

    // this helps the details pane stay current
    useEffect(() => {
        let selJob = jobs.find((j) => j.internalId == selectedJob.internalId)
        setSelectedJob(selJob)
    }, [jobs])

    let selectJob = (job) => {
        setSelectedJob(job)
    }

    let onCloseBatch = async () => {
        if (!areAllJobsInBatchDone(primaryJob, jobs)) {
            return
        }
        let result = await App.showMessageBoxYesNo(
            'Are you sure you want to close these jobs?'
        )
        if (result) {
            App.store.dispatch(removeBatchJob(jobs))
        }
    }

    let onCancelBatch = () => {
        if (getIdleCountInBatch(primaryJob, jobs) > 0) {
            App.store.dispatch(cancelBatchJob(jobs))
        }
    }

    // get the value of the input parameter named 'source'
    let getSourceValue = (job) => {
        let sourceInput = job.jobRequest.inputs.find(
            (input) => input.name == 'source'
        )
        return sourceInput?.value ?? ''
    }
    return (
        <div className="batch-job">
            <section
                className="sidebar"
                aria-labelledby={`${ID(primaryJob.internalId)}-sidebar`}
            >
                <details open>
                    <summary>
                        <h2 id={`${ID(primaryJob.internalId)}-sidebar`}>
                            Jobs in this batch
                        </h2>
                    </summary>

                    <ul>
                        {jobs
                            .sort((a, b) => {
                                return getSourceValue(a) < getSourceValue(b)
                                    ? 1
                                    : -1
                            })
                            .map((job) => (
                                <li
                                    aria-current={
                                        job.internalId == selectedJob.internalId
                                    }
                                    onClick={(e) => selectJob(job)}
                                >
                                    <span
                                        className={`status ${getStatus(job)}`}
                                    >
                                        {JobStatusIcon(
                                            job.jobData?.status ||
                                                (job.jobRequestError &&
                                                    JobStatus.ERROR),
                                            {
                                                width: 20,
                                                height: 20,
                                            }
                                        )}
                                    </span>
                                    <File
                                        showAsType={FileAsType.AS_PATH}
                                        fileUrlOrPath={getSourceValue(job)}
                                    />
                                </li>
                            ))}
                    </ul>
                </details>
                <div className="controls">
                    <button
                        type="button"
                        disabled={!areAllJobsInBatchDone(primaryJob, jobs)}
                        aria-disabled={!areAllJobsInBatchDone(primaryJob, jobs)}
                        onClick={(e) => onCloseBatch()}
                    >
                        Close All
                    </button>
                    <button
                        type="button"
                        disabled={!getIdleCountInBatch(primaryJob, jobs)}
                        aria-disabled={!getIdleCountInBatch(primaryJob, jobs)}
                        onClick={(e) => onCancelBatch()}
                    >
                        Cancel remaining
                    </button>
                </div>
            </section>
            <section aria-labelledby={`${ID(selectedJob.internalId)}-hd`}>
                <h2
                    id={`${ID(selectedJob.internalId)}-hd`}
                    className="visually-hidden"
                >
                    Job details for selected job
                </h2>
                <JobDetails job={selectedJob} />
            </section>
        </div>
    )
}
