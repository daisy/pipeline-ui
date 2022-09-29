import { useQuery } from '@tanstack/react-query'
import { jobXmlToJson } from 'renderer/pipelineXmlConverter'
import styles from './styles.module.sass'
import { useEffect, useState } from 'react'

export function JobDetailsPane( {job, removeJob, updateJob}) {
  console.log('Job details pane', job.href)
  // get the rest of the job data
  const { isLoading, error, data } = useQuery([job.href], async () => {
    console.log('fetching job', job.href)
    let res = await fetch(job.href)
    let xmlStr = await res.text()
    return jobXmlToJson(xmlStr)
  }, {refetchInterval: 3000})

  if (isLoading) {
    return <p>Loading job details...</p>
  }
  if (error instanceof Error) {
    return <p>Error {error.message}</p>
  }

  
  if (!data) {
    console.log('no job data')
    
    return (
    <>
    <p>Loading...</p>
    </>)
  }

  

  return (
    <div className={styles.jobDetails}>
      <h2>Job</h2>
      <p> {data.id}</p>
      <p> {data.status}</p>
      <code>{JSON.stringify(data)}</code>
    </div>
  )
}
