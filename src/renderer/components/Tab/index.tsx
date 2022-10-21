import { useQuery } from '@tanstack/react-query'
import { jobXmlToJson } from 'renderer/pipelineXmlConverter'
import styles from './styles.module.sass'

function GenericTab({
    id,
    label,
    isSelected,
    onTabSelect,
    ariaLabel = '',
    title = '',
}) {
    return (
        <button
            style={styles}
            role="tab"
            onClick={(e) => onTabSelect(e)}
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            aria-label={ariaLabel ?? ''}
            title={title ?? ''}
            id={id}
        >
            {label}
        </button>
    )
}

export function AddJobTab({ onSelect }) {
    return (
        <GenericTab
            label="+"
            isSelected="false"
            onTabSelect={onSelect}
            aria-label="Create job"
            id="create-job"
        />
    )
}

export function JobTab({ job, isSelected, onSelect }) {
    // const { isLoading, error, data } = useQuery(
    //     [job.href],
    //     async () => {
    //         console.log('fetching job', job.href)
    //         let res = await fetch(job.href)
    //         let xmlStr = await res.text()
    //         if (xmlStr) return jobXmlToJson(xmlStr)
    //         else return ''
    //     },
    //     { refetchInterval: 3000 }
    // )

    // if (isLoading) {
    //     return <>New job</>
    // }
    // if (error instanceof Error) {
    //     return <>New job</>
    // }
    // if (!data) {
    //     return <>No job data</>
    // }

    return (
        <GenericTab
            label="New job"
            isSelected={isSelected}
            id={job.id}
            onTabSelect={onSelect}
        />
    )
}
