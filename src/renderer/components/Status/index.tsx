import { useState, useEffect } from 'react'
import { aliveXmlToJson } from 'renderer/pipelineXmlToJson'
import { useWindowStore } from 'renderer/store'
import { baseurl, PipelineStatus } from 'shared/types'
import styles from './styles.module.sass'

const statusMsgs = {
  starting: 'Starting',
  online: 'Online',
  offline: 'Offline',
  checking: 'Checking',
}

export function Status() {

  const {pipeline} = useWindowStore()
  const [status, setStatus] = useState('offline')

  useEffect(() => {
    if(pipeline.status == PipelineStatus.STARTING){
      setStatus('starting')
    } else if(pipeline.status !== PipelineStatus.RUNNING){
      // No webservice active
      setStatus('offline')
    } else {
      setStatus('checking')
      const ws = pipeline.runningWebservice
      fetch(`${baseurl(ws)}/alive`).then(response => response.text()).then(value => {
        const alive = aliveXmlToJson(value).alive
        if(alive){
          setStatus('online')
        }
      }).catch((error) => setStatus('offline'))
    }
  } ,[pipeline])
  
  return (
    <div className={styles.status}>
      <span className={styles[status]}>{statusMsgs[status]}</span>
    </div>
  )
}
//*/
