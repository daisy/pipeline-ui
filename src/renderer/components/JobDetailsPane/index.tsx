import styles from './styles.module.sass'
import { useQuery } from '@tanstack/react-query'
import { jobXmlToJson } from 'renderer/pipelineXmlConverter'

const { App } = window

export function JobDetailsPane({ job, removeJob }) {
    console.log('Job details pane', JSON.stringify(job))

    return (
        <div className={styles.jobDetails}>
            <h2>Job: {job.jobData.nicename}</h2>
            <p> Status: {job.jobData.status}</p>
            {job.jobData.status == 'SUCCESS' ? (
                <JobResults
                    jobId={job.jobData.jobId}
                    results={job.jobData.results}
                />
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
                onClick={(e) => App.showItemInFolder(file)}
            >
                Show results folder
            </button>
        )
    } else {
        return <p>Results unavailable</p>
    }
}
