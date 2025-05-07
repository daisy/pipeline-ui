/*
Details of a submitted job
*/
import { Job, JobStatus } from '/shared/types'

import { removeBatchJob, cancelBatchJob } from 'shared/data/slices/pipeline'
import { readableStatus } from 'shared/jobName'
import { useState, useEffect } from 'react'
import { JobDetails } from './JobDetails'
import { areAllJobsInBatchDone, getIdleCountInBatch } from 'shared/utils'
import { JobStatusIcon } from '../SvgIcons'
import { File, FileAsType } from '../Fields/File'

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

    let getStatus = (job) => {
        if (job.jobRequestError) {
            return readableStatus.ERROR.toLowerCase()
        }
        if (job.jobData?.status) {
            return readableStatus[job.jobData.status].toLowerCase()
        }
        return readableStatus.LAUNCHING.toLowerCase()
    }

    return (
        <div className="batch-job">
            <aside>
                <h2>Jobs in this batch</h2>
                <ul>
                    {jobs
                        .sort((a, b) => {
                            return getSourceValue(a) < getSourceValue(b)
                                ? 1
                                : -1
                        })
                        .map((job) => (
                            <li
                                aria-selected={
                                    job.internalId == selectedJob.internalId
                                }
                                role="button"
                                onClick={(e) => selectJob(job)}
                                aria-title={`Select job in batch`}
                            >
                                <span className={`status ${getStatus(job)}`}>
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
                <div className="controls">
                    <button
                        disabled={!areAllJobsInBatchDone(primaryJob, jobs)}
                        aria-disabled={!areAllJobsInBatchDone(primaryJob, jobs)}
                        onClick={(e) => onCloseBatch()}
                    >
                        Close All
                    </button>
                    <button
                        disabled={!getIdleCountInBatch(primaryJob, jobs)}
                        aria-disabled={!getIdleCountInBatch(primaryJob, jobs)}
                        onClick={(e) => onCancelBatch()}
                    >
                        Cancel remaining
                    </button>
                </div>
            </aside>
            <section>
                <JobDetails job={selectedJob} />
            </section>
        </div>
    )
}
