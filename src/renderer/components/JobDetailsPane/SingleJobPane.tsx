/*
Details of a submitted job
*/
import { Job, JobState } from '/shared/types'
import { useWindowStore } from 'renderer/store'
import { useState, useEffect } from 'react'
import { JobDetails } from './JobDetails'

export function SingleJobDetailsPane({ job }: { job: Job }) {
    const [canRunJob, setCanRunJob] = useState(false)
    const [isRerunning, setIsRerunning] = useState(false)
    const { settings } = useWindowStore()

    useEffect(() => {
        setCanRunJob(settings?.downloadFolder?.trim() != '')
    }, [settings.downloadFolder])
    useEffect(() => {
        // In case the job is rejected and its state is reset to a previous
        setIsRerunning(
            [JobState.SUBMITTING, JobState.SUBMITTED].includes(job.state)
        )
    }, [job.state])

    return <JobDetails job={job} />
}
