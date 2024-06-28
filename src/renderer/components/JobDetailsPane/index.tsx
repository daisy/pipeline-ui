/*
Details of a submitted job
*/
import { Job, JobStatus } from '/shared/types'
import { Messages } from './Messages'
import { Settings } from './Settings'
import { Results } from './Results'

import { ID, externalLinkClick } from '../../utils/utils'
import { editJob, removeJob, runJob } from 'shared/data/slices/pipeline'
import { readableStatus } from 'shared/jobName'
import { FileLink } from '../FileLink'
import { useWindowStore } from 'renderer/store'
import { useState, useEffect } from 'react'

const { App } = window

export function JobDetailsPane({ job }: { job: Job }) {
    const [canRunJob, setCanRunJob] = useState(false)
    const { settings } = useWindowStore()

    //let probableLogLink = job?.jobData?.href ? `${job.jobData.href}/log` : ''
    useEffect(() => {
        setCanRunJob(settings?.downloadFolder?.trim() != '')
    }, [settings.downloadFolder])

    return job.jobRequestError ? (
        <>
            <h1>Error</h1>
            <div className="details">
                <p>{job.jobRequestError.description}</p>
                <div className="form-buttons">
                    <button
                        onClick={(e) => {
                            App.store.dispatch(editJob(job))
                        }}
                    >
                        Edit job
                    </button>
                    <button
                        onClick={(e) => {
                            App.store.dispatch(removeJob(job))
                        }}
                    >
                        Close job
                    </button>
                </div>
            </div>
        </>
    ) : (
        <>
            <section
                className="header"
                aria-labelledby={`${ID(job.internalId)}-hd`}
            >
                <div>
                    <h1 id={`${ID(job.internalId)}-hd`}>
                        {job.jobData.nicename}
                    </h1>
                    {/* <p>{job.script.description}</p> */}
                    <p aria-live="polite">
                        Status:&nbsp;
                        <span
                            className={`status ${readableStatus[
                                job.jobData.status
                            ].toLowerCase()}`}
                        >
                            {readableStatus[job.jobData.status]}{' '}
                        </span>
                    </p>
                    {job.jobData.progress ? (
                        <p>
                            Progress:&nbsp;
                            <span>
                                {Math.ceil(job.jobData.progress * 100)}%
                            </span>
                        </p>
                    ) : (
                        ''
                    )}
                    <details
                        id={`${ID(job.internalId)}-job-settings`}
                        className="job-settings"
                    >
                        <summary>Job Settings</summary>
                        <Settings job={job} />
                    </details>
                </div>
            </section>

            <div className="details">
                <div className="scrolling-area">
                    <section
                        className="job-results"
                        aria-labelledby={`${ID(job.internalId)}-job-results`}
                    >
                        <div>
                            <h2 id={`${ID(job.internalId)}-job-results`}>
                                Results
                            </h2>
                            {job.jobData.downloadedFolder && (
                                <FileLink
                                    fileHref={job.jobData.downloadedFolder}
                                >
                                    Open results folder
                                </FileLink>
                            )}
                        </div>
                        <Results job={job} />
                    </section>
                    <section
                        className="job-messages"
                        aria-labelledby={`${ID(job.internalId)}-job-messages`}
                    >
                        <div>
                            <h2 id={`${ID(job.internalId)}-job-messages`}>
                                Messages
                            </h2>
                            {job?.jobData?.log && (
                                <a
                                    className="loglink"
                                    href={job.jobData.log}
                                    onClick={(e) => externalLinkClick(e, App)}
                                >
                                    View detailed log
                                </a>
                            )}
                        </div>

                        <Messages job={job} />
                    </section>
                </div>

                {job.jobData.status != JobStatus.RUNNING &&
                job.jobData.status != JobStatus.IDLE ? (
                    <>
                        {!canRunJob && (
                            <div className="warnings">
                                <p className="warning">
                                    Go under settings and choose a results
                                    folder location before re-running the job.
                                </p>
                            </div>
                        )}
                        <div className="form-buttons">
                            <button
                                onClick={(e) => {
                                    App.store.dispatch(runJob(job))
                                }}
                                disabled={!canRunJob}
                            >
                                Re-run job
                            </button>
                            <button
                                onClick={(e) => {
                                    App.store.dispatch(editJob(job))
                                }}
                            >
                                Edit job
                            </button>
                            <button
                                onClick={(e) => {
                                    App.store.dispatch(removeJob(job))
                                }}
                            >
                                Close job
                            </button>
                        </div>
                    </>
                ) : (
                    ''
                )}
            </div>
        </>
    )
}
