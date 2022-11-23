/*
Data manager and owner of tab view
*/
import { useState } from 'react'
import { Job, JobStatus, JobState } from 'shared/types/pipeline'
import { useQuery } from '@tanstack/react-query'
import { jobXmlToJson } from 'renderer/pipelineXmlConverter'
import { TabView } from '../TabView'
import { AddJobTab, JobTab } from '../JobTab'
import { JobTabPanel } from '../JobTabPanel'

const NEW_JOB = (id) => ({
    internalId: id,
    state: JobState.NEW,
})

export function MainView() {
    const [jobs, setJobs] = useState(Array<Job>)

    const { isLoading, error, data } = useQuery(
        ['jobsData'],
        async () => {
            let fetchJobData = async (job) => {
                let res = await fetch(job.jobData.href)
                let xmlStr = await res.text()
                if (xmlStr) return jobXmlToJson(xmlStr)
                else return null
            }

            let updatedJobs = await Promise.all(
                jobs.map(async (j) => {
                    // only check submitted jobs (e.g. have a jobData property)
                    // that are either IDLE or RUNNING (e.g. don't recheck ERROR or SUCCESS statuses)
                    if (
                        j.hasOwnProperty('jobData') &&
                        (j.jobData.status == JobStatus.IDLE ||
                            j.jobData.status == JobStatus.RUNNING)
                    ) {
                        let jobData = await fetchJobData(j)
                        j.jobData = jobData
                    }
                    return j
                })
            )
            if (updatedJobs.length == 0) {
                updatedJobs.push(NEW_JOB('job-0'))
            }
            setJobs(updatedJobs)
            return updatedJobs
        },
        { refetchInterval: 3000 }
    )

    if (isLoading) {
        return <></>
    }
    if (error instanceof Error) {
        console.log('Error', error)
        return <></>
    }
    if (!data) {
        return <></>
    }

    let addJob = () => {
        let theNewJob = NEW_JOB(`job-${jobs.length + 1}`)
        setJobs([...jobs, theNewJob])
    }

    let removeJob = (jobId) => {
        const jobs_ = jobs.filter((j) => j.internalId !== jobId)
        setJobs(jobs_)
    }

    let updateJob = (job) => {
        let jobId = job.internalId
        let jobs_ = jobs.map((j) => {
            if (j.internalId == jobId) {
                return { ...job }
            } else return j
        })
        setJobs(jobs_)
    }

    return (
        <TabView<Job>
            items={jobs}
            onTabCreate={addJob}
            onTabClose={removeJob}
            ItemTab={JobTab}
            AddItemTab={AddJobTab}
            ItemTabPanel={JobTabPanel}
            updateItem={updateJob}
        />
    )
}
