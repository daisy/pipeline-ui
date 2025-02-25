/*
Details of a submitted job
*/
import { Job, JobState, JobStatus } from '/shared/types'
import { Messages } from './Messages'
import { Settings } from './Settings'
import { Results } from './Results'

import { ID, externalLinkClick } from '../../utils/utils'
import { editJob, removeJob, runJob } from 'shared/data/slices/pipeline'
import { readableStatus } from 'shared/jobName'
import { FileLink } from '../FileLink'
import { useWindowStore } from 'renderer/store'
import { useState, useEffect } from 'react'
import { JobDetails } from './JobDetails'

const { App } = window

export function BatchJobDetailsPane({ jobs }: { jobs: Array<Job> }) {
    const [canRunJob, setCanRunJob] = useState(false)
    const [isRerunning, setIsRerunning] = useState(false)
    const { settings } = useWindowStore()
    const [primaryJob] = useState(jobs.find((j) => j.isPrimaryForBatch))
    const [selectedJob, setSelectedJob] = useState(
        jobs.find((j) => j.isPrimaryForBatch)
    )

    useEffect(() => {
        setCanRunJob(settings?.downloadFolder?.trim() != '')
    }, [settings.downloadFolder])

    // useEffect(() => {
    //     // In case the job is rejected and its state is reset to a previous
    //     setIsRerunning(
    //         [JobState.SUBMITTING, JobState.SUBMITTED].includes(job.state)
    //     )
    // }, [job.state])

    let selectJob = (job) => {
        setSelectedJob(job)
    }

    let onCloseBatch = () => {

    }
    
    let onCancelBatch = () => {

    }

    return (
        <div className="batch-job">
            <aside>
                <h2>Jobs in this batch</h2>
                <ul>
                    {jobs.map((job) => (
                        <li><a onClick={(e) => selectJob(job)} aria-title={`Select job in batch`}>
                            {job.jobRequest.inputs[0].value}
                            </a>
                        </li>
                    ))}
                </ul>
                <div>
                    <button onClick={(e) => onCloseBatch()}>Close</button>
                    <button onClick={(e) => onCancelBatch()}>Cancel remaining</button>
                </div>
            </aside>
            <section>
                <JobDetails job={selectedJob} />
            </section>
        </div>
    )
}
