import { useQuery } from '@tanstack/react-query'

import { aliveXmlToJson } from 'renderer/pipelineXmlConverter'
import styles from './styles.module.sass'
const statusMsgs = {
  online: 'Online',
  offline: 'Offline',
  checking: 'Checking',
}
export function Status() {
  const { isLoading, error, data } = useQuery(['aliveData'], async () => {
    let res = await fetch('http://localhost:8181/ws/alive')
    let xmlStr = await res.text()
    return xmlStr
  })

  let status = 'online'
  if (isLoading) status = 'checking'

  if (error instanceof Error) status = 'offline'

  let alive = aliveXmlToJson(data)
  if (!alive) {
    status = 'offline'
  }

  return (
    <div className={styles.status}>
      <span className={styles[status]}>{statusMsgs[status]}</span>
    </div>
  )
}
