import { useState, useEffect } from 'react'
import { AddJobTab, JobTab } from '../Tab'
import { TabPanel } from '../TabPanel'
import { Job, JobStatus, JobState } from 'shared/types/pipeline'
import styles from './styles.module.sass'
import { useQuery } from '@tanstack/react-query'
import { jobXmlToJson } from 'renderer/pipelineXmlConverter'

const NEW_JOB = (id) => ({
    internalId: id,
    state: JobState.NEW,
})

export function TabView() {
    const [selectedJobId, setSelectedJobId] = useState('')
    const [jobs, setJobs] = useState(Array<Job>)

    const { isLoading, error, data } = useQuery(
        ['jobsData'],
        async () => {
            let fetchJobData = async (job) => {
                let res = await fetch(job.jobData.href)
                let xmlStr = await res.text()
                console.log(`Fetching job data ${job.internalId}`, xmlStr)
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
            console.log('jobsData query', updatedJobs)
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
        handleOnTabSelect(theNewJob)
    }

    let removeJob = (jobId) => {
        const jobs_ = jobs.filter((j) => j.internalId !== jobId)
        setJobs(jobs_)
    }

    let updateJob = (jobId, job) => {
        let jobs_ = jobs.map((j) => {
            if (j.internalId == jobId) {
                return { ...job }
            } else return j
        })
        setJobs(jobs_)
        console.log('update jobs', jobs_)
    }

    if (selectedJobId == '' && jobs.length > 0 && jobs[0].internalId) {
        setSelectedJobId(jobs[0].internalId)
    }

    let handleOnTabSelect = (job) => {
        console.log('Select ', job)
        setSelectedJobId(job.internalId)
    }

    return (
        <>
            <div role="tablist" style={styles}>
                {jobs.map((job, idx) => {
                    return (
                        <JobTab
                            job={job}
                            key={idx}
                            isSelected={job.internalId == selectedJobId}
                            onSelect={handleOnTabSelect}
                        />
                    )
                })}
                <AddJobTab onSelect={addJob} />
            </div>
            {jobs.map((job, idx) => (
                <TabPanel
                    job={job}
                    key={idx}
                    isSelected={job.internalId == selectedJobId}
                    removeJob={removeJob}
                    updateJob={updateJob}
                />
            ))}
        </>
    )
}
