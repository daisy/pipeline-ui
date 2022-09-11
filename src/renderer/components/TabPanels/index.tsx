import { useQuery } from '@tanstack/react-query'
import { jobXmlToJson } from 'renderer/pipelineXmlToJson'

export function TabPanels({ selection }) {
  console.log('tab panel', selection)

  if (!selection) {
    return <></>
  }

  const { isLoading, error, data } = useQuery(
    ['job'],
    async () => {
      console.log('fetching', selection)
      let res = await fetch(selection)
      let xmlStr = await res.text()
      return xmlStr
    },
    { refetchOnMount: true }
  )

  if (isLoading) {
    return <p>Loading...</p>
  }
  if (error instanceof Error) {
    return <p>Error...</p>
  }
  if (!data) {
    return <></>
  }
  let job = jobXmlToJson(data)
  return (
    <div>
      <h2>Job</h2>
      <p> {job.id}</p>
      <p>TODO job details</p>
    </div>
  )
}
