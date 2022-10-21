import { aliveXmlToJson } from 'renderer/pipelineXmlConverter'
import { PipelineStatus } from 'shared/types/pipeline'
import styles from './styles.module.sass'
import { useContext } from 'react'
import { useWindowStore } from 'renderer/store'

export function Status() {
    const { pipeline } = useWindowStore()
    return (
        <div className={styles.status}>
            <span className={styles[pipeline.status]}>{pipeline.status}</span>
        </div>
    )
}
