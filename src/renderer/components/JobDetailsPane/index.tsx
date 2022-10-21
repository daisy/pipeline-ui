import styles from './styles.module.sass'
import { useQuery } from '@tanstack/react-query'
import { jobXmlToJson } from 'renderer/pipelineXmlConverter'

const { App } = window

export function JobDetailsPane({ job, removeJob }) {
    console.log('Job details pane', JSON.stringify(job))

    const { isLoading, error, data } = useQuery(
        [job.href],
        async () => {
            console.log('fetching job', job.href)
            let res = await fetch(job.href)
            let xmlStr = await res.text()
            return jobXmlToJson(xmlStr)
        },
        { refetchInterval: 3000 }
    )

    if (isLoading) {
        return <>Loading...</>
    }
    if (error instanceof Error) {
        return <>Error {error.message}</>
    }
    if (!data) {
        return <>No data</>
    }

    return (
        <div className={styles.jobDetails}>
            <h2>Job: {data.nicename}</h2>
            <p> Status: {data.status}</p>
            {data.status == 'SUCCESS' ? (
                <JobResults jobId={data.id} results={data.results} />
            ) : (
                ''
            )}
        </div>
    )
}

function JobResults({ jobId, results }) {
    // this is a hack!
    // get the first file and use its path to figure out what is probably the output folder for the job

    let file = ''
    if (results.namedResults.length > 0) {
        if (results.namedResults[0].files.length > 0) {
            file = results.namedResults[0].files[0].file
            let idx = file.indexOf(jobId)
            if (idx != -1) {
                file = file.slice(0, idx + jobId.length) + '/'
                file = file.replace('file:', '')
                file = decodeURI(file)
            }
        }
    }

    if (file != '') {
        return (
            <button
                className={styles.copyPathButton}
                onClick={(e) => App.copyToClipboard(file)}
            >
                Show results folder
            </button>
        )
    } else {
        return <p>Results unavailable</p>
    }
}
