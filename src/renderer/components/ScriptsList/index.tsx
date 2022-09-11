import {
  QueryClient,
  QueryClientProvider,
  useQuery,
} from '@tanstack/react-query'

import { scriptsXmlToJson } from 'renderer/pipelineXmlToJson'

const queryClient = new QueryClient()

export function ScriptsList() {
  return (
    <QueryClientProvider client={queryClient}>
      <Scripts />
    </QueryClientProvider>
  )
}

function Scripts() {
  const { isLoading, error, data } = useQuery(['scriptsData'], async () => {
    let res = await fetch('http://localhost:8181/ws/scripts')
    let xmlStr = await res.text()
    return xmlStr
  })

  if (isLoading) return <p>Loading...</p>

  if (error instanceof Error)
    return <p>An error has occurred: {error.message}</p>

  let scripts = scriptsXmlToJson(data)
  if (!scripts) {
    return <p>An error has occurred</p>
  }
  return (
    <ul>
      {scripts.map((script) => (
        <li>{JSON.stringify(script, null, '  ')}</li>
      ))}
    </ul>
  )
}
