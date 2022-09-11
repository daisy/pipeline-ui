import { useQuery } from '@tanstack/react-query'
import styles from './styles.module.sass'
import { jobsXmlToJson } from 'renderer/pipelineXmlToJson'

export function TabList({ selection, setSelection }) {
  let newTab = () => {
    setSelection('new-tab')
    console.log('TODO create new tab')
  }

  const { isLoading, error, data } = useQuery(['jobs'], async () => {
    let res = await fetch('http://localhost:8181/ws/jobs')
    let xmlStr = await res.text()
    return xmlStr
  })

  if (isLoading) return <span>Loading...</span>

  if (error instanceof Error)
    return <span>An error has occurred: {error.message}</span>

  let jobs = jobsXmlToJson(data)
  if (!jobs) {
    console.log('No jobs')
    return null
  }
  return (
    <div role="tablist" aria-live="polite" className={styles.tabList}>
      {jobs.map((job, idx) => (
        <button
          role="tab"
          key={idx}
          onClick={(e) => setSelection(job.href)}
          aria-selected={job.href == selection}
          tab-index={job.href == selection ? 0 : -1}
        >
          {job.id}
        </button>
      ))}
      <button
        id="new-tab"
        aria-label="Create job"
        role="tab"
        onClick={(e) => newTab()}
        aria-selected={'newTab' == selection}
        tab-index={'newTab' == selection ? 0 : -1}
      >
        +
      </button>
    </div>
  )
}
