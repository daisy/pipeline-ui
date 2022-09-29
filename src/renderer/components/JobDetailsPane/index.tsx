import { useQuery } from '@tanstack/react-query'
import { jobXmlToJson } from 'renderer/pipelineXmlConverter'
import styles from './styles.module.sass'

export function JobDetailsPane( {job, removeJob, updateJob}) {
  let jobData = null
  console.log('Job details pane', job.href)
  // get the rest of the job data
  const { isLoading, error, data } = useQuery([job.href], async () => {
    let res = await fetch(job.href)
    let xmlStr = await res.text()
    return xmlStr
  })

  if (isLoading) {
    return <p>Loading...</p>
  }
  if (error instanceof Error) {
    return <p>Error {error.message}</p>
  }
  if (!data) {
    console.log('no job data')
    return <></>
  }
  try {
    jobData = jobXmlToJson(data)
  }
  catch (err) {
    return <p>Error {err.message}</p>
  }
  return (
    <div className={styles.jobDetails}>
      <h2>Job</h2>
      <p> {jobData.id}</p>
      <p> {jobData.status}</p>
      <code>{JSON.stringify(jobData)}</code>
    </div>
  )
}
