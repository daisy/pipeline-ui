/*
Details of a submitted job
*/
import { Job, JobState, JobStatus } from '/shared/types'
import { Messages } from './Messages'
import { Settings } from './Settings'
import { Results } from './Results'

import { ID, externalLinkClick } from '../../utils/utils'
import { editJob, removeJob, runJob } from 'shared/data/slices/pipeline'
import { readableStatus } from 'shared/jobName'
import { FileLink } from '../FileLink'
import { useWindowStore } from 'renderer/store'
import { useState, useEffect } from 'react'
import { debug } from 'electron-log'

const { App } = window

export function JobDetails({ job }: { job: Job }) {
    const [canRunJob, setCanRunJob] = useState(false)
    const [isRerunning, setIsRerunning] = useState(false)
    const { settings } = useWindowStore()

    useEffect(() => {
        setCanRunJob(settings?.downloadFolder?.trim() != '')
    }, [settings.downloadFolder])
    useEffect(() => {
        // In case the job is rejected and its state is reset to a previous
        setIsRerunning(
            [JobState.SUBMITTING, JobState.SUBMITTED].includes(job.state)
        )
    }, [job.state])
    console.log('Job details', JSON.stringify(job, null, '  '))

    let jobIsBatch =
        job.jobRequest.batchId != null && job.jobRequest.batchId != ''

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
                        onClick={async (e) => {
                            let result = await App.showMessageBoxYesNo(
                                'Are you sure you want to close this job?'
                            )
                            if (result) {
                                App.store.dispatch(removeJob(job))
                            }
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
                            className={`status ${
                                job.jobData?.status
                                    ? readableStatus[
                                          job.jobData.status
                                      ].toLowerCase()
                                    : readableStatus.LAUNCHING.toLowerCase()
                            }`}
                        >
                            {job.jobData?.status
                                ? readableStatus[job.jobData.status]
                                : readableStatus.LAUNCHING}{' '}
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
                            {!jobIsBatch && (
                                <button
                                    onClick={(e) => {
                                        App.store.dispatch(runJob(job))
                                        setIsRerunning(true)
                                    }}
                                    disabled={!canRunJob || isRerunning}
                                >
                                    Re-run job
                                </button>
                            )}

                            {!jobIsBatch && (
                                <>
                                    <button
                                        onClick={(e) => {
                                            let job_ = { ...job }
                                            job_.jobRequest = {
                                                ...job.jobRequest,
                                            }
                                            job_.jobData = null
                                            job_.errors = []
                                            job_.isPrimaryForBatch = false
                                            job_.jobRequest.batchId = null
                                            App.store.dispatch(editJob(job))
                                        }}
                                    >
                                        Edit job
                                    </button>
                                    <button
                                        onClick={async (e) => {
                                            let result = await App.showMessageBoxYesNo(
                                                'Are you sure you want to close this job?'
                                            )
                                            if (result) {
                                                App.store.dispatch(
                                                    removeJob(job)
                                                )
                                            }
                                        }}
                                    >
                                        Close job
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                ) : (
                    ''
                )}
            </div>
        </>
    )
}
