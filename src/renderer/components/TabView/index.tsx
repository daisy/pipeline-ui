import { Fragment, useEffect, useState } from 'react'
import { Tab } from '../Tab'
import { TabPanel } from '../TabPanel'
import { useQuery } from '@tanstack/react-query'
import { jobsXmlToJson } from 'renderer/pipelineXmlToJson'
import { AbstractJob, baseurl, Job, NewJob, PipelineState, PipelineStatus, Webservice } from 'shared/types/pipeline'
import styles from './styles.module.sass'
import { useWindowStore } from 'renderer/store'
import { pipeline } from 'stream'



export function TabView() {
  const {App} = window

  const {pipeline} = useWindowStore()
  
  const [viewState, setViewState] = useState<{
    selectedJobId:string,
    newJobs:Array<AbstractJob>,
    jobs:Array<AbstractJob>,
    error?:Error,
    isLoading:boolean
  }>({
    selectedJobId:'',
    newJobs:[],
    jobs:[],
    isLoading:false
  })
  const handleOnTabSelect = (job) => {
    console.log('Select ', job.id)
    setViewState((oldState)=>({
      ...oldState,
      selectedJobId:job.id,
    }))
    
  }
  const createJob = () => {
    const theNewJob: NewJob = {
      id: `new-job-${viewState.newJobs.length + 1}`,
      nicename: 'New job',
      type: 'NewJob',
    }
    const updateNewJobs = [...viewState.newJobs, theNewJob]
    setViewState((oldState)=>({
      ...oldState,
      selectedJobId:theNewJob.id,
      newJobs:updateNewJobs
    }))
    return theNewJob
  }

  useEffect(() => {
    if(pipeline.status === PipelineStatus.RUNNING){
      const ws = pipeline.runningWebservice
      setViewState({
        ...viewState,
        isLoading:true
      })
      fetch(`${baseurl(ws)}/jobs`).then(async (response) => {
        const jobsJson = jobsXmlToJson(await response.text())
        setViewState({
          ...viewState,
          jobs:jobsJson,
          error:null,
          isLoading:false
        })
      }).catch((error) => {
        // Keep previous list of jobs
        setViewState({
          ...viewState,
          error:error,
          isLoading:false
        })
      })
    } 
  } ,[pipeline])

  let displayedJobs = [...viewState.jobs, ...viewState.newJobs] as Array<AbstractJob>

  const selectedJobId = (
    viewState.selectedJobId == '' ? 
      (displayedJobs[0]?.id ?? '') : 
      viewState.selectedJobId
  )
  
  if (viewState.isLoading){
    return <span>Loading jobs ...</span>
  } else if (viewState.error && viewState.error instanceof Error){
    return <span>An error has occurred: {viewState.error.message}</span>
  } else return (
    <>
      <div role="tablist" style={styles}>
        {displayedJobs.map((job, idx) => {
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
      {displayedJobs.map((job, idx) => (
        <TabPanel job={job} key={`job-panel-${idx}`} isSelected={job.id == selectedJobId} />
      ))}
    </>
  )
}
