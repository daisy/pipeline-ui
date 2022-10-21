import { useState, useEffect } from 'react'
import { AddJobTab, JobTab } from '../Tab'
import { TabPanel } from '../TabPanel'
import { Job, JobState } from 'shared/types/pipeline'
import styles from './styles.module.sass'

export function TabView() {
    const [selectedJobId, setSelectedJobId] = useState('')
    const [jobs, setJobs] = useState(Array<Job>)

    let createJob = () => {
        return {
            id: `job-${jobs.length + 1}`,
            state: JobState.NEW,
        }
    }
    let addJob = () => {
        let theNewJob = createJob()
        setJobs([...jobs, theNewJob])
        handleOnTabSelect(theNewJob)
    }

    let removeJob = (jobId) => {
        const jobs_ = jobs.filter((j) => j.id !== jobId)
        setJobs(jobs_)
    }

    let updateJob = (jobId, job) => {
        let jobs_ = jobs.map((j) => {
            if (j.id == jobId) {
                return { ...job }
            } else return j
        })
        setJobs(jobs_)
        console.log('update jobs')
    }

    if (selectedJobId == '' && jobs.length > 0 && jobs[0].id) {
        setSelectedJobId(jobs[0].id)
    }

    let handleOnTabSelect = (job) => {
        console.log('Select ', job.id)
        setSelectedJobId(job.id)
    }

    // make sure there's at least a new job tab open
    useEffect(() => {
        if (jobs.length == 0) {
            addJob()
        }
    }, [])

    return (
        <>
            <div role="tablist" style={styles}>
                {jobs.map((job, idx) => {
                    return (
                        <JobTab
                            job={job}
                            key={idx}
                            isSelected={job.id == selectedJobId}
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
                    isSelected={job.id == selectedJobId}
                    removeJob={removeJob}
                    updateJob={updateJob}
                />
            ))}
        </>
    )
}
