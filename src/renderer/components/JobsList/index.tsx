import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'
import styles from './styles.module.sass'
import { jobsXmlToJson } from 'renderer/pipelineXmlToJson'
import { baseurl, Webservice } from 'shared/types'

const queryClient = new QueryClient()

export function JobsList() {
  return (
    <QueryClientProvider client={queryClient}>
      <Jobs/>
    </QueryClientProvider>
  )
}

function Jobs() {
  const {App} = window
  const { isLoading, error, data } = useQuery(['jobsData'], async () => {
    const state = await App.getPipelineState()
    const ws = state.runningWebservice
    if(!ws) throw new Error("DAISY pipeline is not running")
    let res = await fetch(`${baseurl(ws)}/jobs`)
    let xmlStr = await res.text()
    return xmlStr
  })

  if (isLoading) return <p>Loading...</p>

  if (error instanceof Error)
    return <p>An error has occurred: {error.message}</p>

  let jobs = jobsXmlToJson(data)
  if (!jobs) {
    return <p>An error has occurred</p>
  }
  return (
    <ul className={styles.jobsList}>
      {jobs.map((job) => (
        <li>{JSON.stringify(job, null, '  ')}</li>
      ))}
    </ul>
  )
}
