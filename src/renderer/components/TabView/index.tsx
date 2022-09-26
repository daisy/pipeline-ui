import { useState } from 'react'
import { Tab } from '../Tab'
import { TabPanel } from '../TabPanel'
import { useQuery } from '@tanstack/react-query'
import { jobsXmlToJson } from 'renderer/pipelineXmlConverter'
import { NewJob } from 'shared/types/pipeline'
import styles from './styles.module.sass'

export function TabView() {
  const [selectedJobId, setSelectedJobId] = useState('')
  // newJobs have a tab but haven't been submitted to the pipeline yet
  const [newJobs, setNewJobs] = useState([])
  const { isLoading, error, data } = useQuery(['jobs'], async () => {
    let res = await fetch('http://localhost:8181/ws/jobs')
    let xmlStr = await res.text()
    return xmlStr
  })

  if (isLoading) return <span>Loading...</span>

  if (error instanceof Error)
    return <span>An error has occurred: {error.message}</span>

  let jobsJson = jobsXmlToJson(data)
  //@ts-ignore
  let jobs: Array<AbstractJob> = jobsJson.concat(newJobs)
  let handleOnTabSelect = (job) => {
    console.log('Select ', job.id)
    setSelectedJobId(job.id)
  }
  let createJob = () => {
    const theNewJob: NewJob = {
      id: `new-job-${newJobs.length + 1}`,
      nicename: 'New job',
      type: 'NewJob',
    }

    const updateNewJobs = [...newJobs, theNewJob]
    setNewJobs(updateNewJobs)
    setSelectedJobId(theNewJob.id)
    return theNewJob
  }

  if (selectedJobId == '') {
    setSelectedJobId(jobs[0]?.id ?? '')
  }

  return (
    <>
      <div role="tablist" style={styles}>
        {jobs.map((job, idx) => {
          return (
            <Tab
              label={job.nicename}
              isSelected={job.id == selectedJobId}
              onTabSelect={(e) => handleOnTabSelect(job)}
              key={idx}
              id={`tab-${job.id}`}
            />
          )
        })}
        <Tab
          label="+"
          isSelected="false"
          onTabSelect={(e) => createJob()}
          aria-label="Create job"
          id="create-job"
        />
      </div>
      {jobs.map((job, idx) => (
        <TabPanel job={job} key={idx} isSelected={job.id == selectedJobId} />
      ))}
    </>
  )
}
