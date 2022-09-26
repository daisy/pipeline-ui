import { useQuery } from '@tanstack/react-query'
import { jobXmlToJson } from 'renderer/pipelineXmlConverter'
import styles from './styles.module.sass'

export function JobDetailsPane({ jobHref }) {
  let jobData = null
  console.log('Job details pane', jobHref)
  // get the rest of the job data
  const { isLoading, error, data } = useQuery([jobHref], async () => {
    console.log('tabpanel fetching', jobHref)
    let res = await fetch(jobHref)
    let xmlStr = await res.text()
    return xmlStr
  })

  if (isLoading) {
    return <p>Loading...</p>
  }
  if (error instanceof Error) {
    return <p>Error...</p>
  }
  if (!data) {
    console.log('no job data')
    return <></>
  }
  jobData = jobXmlToJson(data)

  return (
    <div>
      <h2>Job</h2>
      <p> {jobData.id}</p>
    </div>
  )
}
