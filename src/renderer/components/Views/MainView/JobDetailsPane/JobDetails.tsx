/*
Details of a submitted job
*/
import { Job, JobState, JobStatus, MessageLevel } from '/shared/types'
//@ts-ignore
import { Messages } from './Messages'
//@ts-ignore
import { Settings } from './Settings'
//@ts-ignore
import { Results } from './Results'

import { externalLinkClick, getStatus } from '../../../../utils/utils'
import { editJob, runJob } from 'shared/data/slices/pipeline'
import { readableStatus } from 'shared/jobName'
import { FileLink } from '../../../Widgets/FileLink'
import { useWindowStore } from 'renderer/store'
import { useState, useEffect } from 'react'
import { JobStatusIcon } from '../../../Widgets/SvgIcons'
import { CanDo } from 'shared/canDo'

const { App } = window

export function JobDetails({ job }: { job: Job }) {
    const [canRunJob, setCanRunJob] = useState(false)
    const [isRerunning, setIsRerunning] = useState(false)
    const { pipeline, settings } = useWindowStore()

    useEffect(() => {
        setCanRunJob(settings?.downloadFolder?.trim() != '')
    }, [settings.downloadFolder])
    useEffect(() => {
        // In case the job is rejected and its state is reset to a previous
        setIsRerunning(
            [JobState.SUBMITTING, JobState.SUBMITTED].includes(job.state)
        )
    }, [job.state])

    let jobIsBatch =
        job.jobRequest.batchId != null && job.jobRequest.batchId != ''

    if (job.jobRequestError) {
        return (
            <>
                <h2>Error</h2>
                <div className="details">
                    <p>{job.jobRequestError.description}</p>
                    {!CanDo.editJob(pipeline, pipeline.status, job) && (
                        <div className="form-buttons">
                            <button
                                type="button"
                                onClick={(e) => {
                                    App.store.dispatch(editJob(job))
                                }}
                            >
                                Edit job
                            </button>
                        </div>
                    )}
                </div>
            </>
        )
    }

    let searchMessages = (msgs, level) => {
        let found = msgs.find((m) => {
            let isThisOne = m.level == level
            let childrenHaveIt = searchMessages(m.messages, level)
            return isThisOne || childrenHaveIt
        })
        return found
    }
    let hasErrors = (job) => {
        if (!job.jobData || !job.jobData.messages) {
            return false
        }

        return searchMessages(job.jobData.messages, MessageLevel.ERROR)
    }
    let hasWarnings = (job) => {
        if (!job.jobData || !job.jobData.messages) {
            return false
        }
        return searchMessages(job.jobData.messages, MessageLevel.WARNING)
    }
    return (
        <div className="job-details">
            <div className="job-status info">
                <p aria-live="polite" className="row">
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
                    <span className={`status ${getStatus(job)}`}>
                        {JobStatusIcon(
                            job.jobData?.status ||
                                (job.jobRequestError && JobStatus.ERROR),
                            {
                                width: 20,
                                height: 20,
                            }
                        )}
                    </span>
                </p>
                {job.jobData.progress &&
                job.jobData?.status == JobStatus.RUNNING ? (
                    <p aria-live="polite">
                        Progress:&nbsp;
                        <span>{Math.ceil(job.jobData.progress * 100)}%</span>
                    </p>
                ) : (
                    ''
                )}
            </div>
            <details className="job-configuration">
                <summary>
                    <h2>Job Configuration</h2>
                </summary>
                <Settings job={job} />
            </details>

            <section className="job-results">
                <h2>Results</h2>
                {job.jobData.downloadedFolder && (
                    <FileLink fileHref={job.jobData.downloadedFolder}>
                        Open folder
                    </FileLink>
                )}

                {job.jobData.results?.namedResults.length > 0 ? (
                    <details>
                        <summary>Individual results</summary>

                        <Results job={job} />
                    </details>
                ) : (
                    <p className="info">No results available</p>
                )}
            </section>
            <section className="job-messages">
                <h2>Messages</h2>
                {hasErrors(job) && hasWarnings(job) && (
                    <p>
                        <span className="error">Error(s)</span> and{' '}
                        <span className="warning">warning(s)</span> found. See
                        below for more information.
                    </p>
                )}
                {hasErrors(job) && !hasWarnings(job) && (
                    <p>
                        <span className="error">Error(s)</span> found. See below
                        for more information.
                    </p>
                )}
                {!hasErrors(job) && hasWarnings(job) && (
                    <p>
                        <span className="warning">Warning(s)</span> found. See
                        below for more information.
                    </p>
                )}
                {job.jobData.messages && job.jobData.messages.length > 0 ? (
                    <details>
                        <summary>Show messages</summary>
                        <Messages job={job} />
                    </details>
                ) : (
                    <p>No messages</p>
                )}

                {job?.jobData?.log && (
                    <a
                        className="loglink"
                        href={job.jobData.log}
                        onClick={(e) => externalLinkClick(e, App)}
                    >
                        View full log
                    </a>
                )}
            </section>

            {job.jobData.status != JobStatus.RUNNING &&
                job.jobData.status != JobStatus.IDLE && (
                    <>
                        {!canRunJob && (
                            <div className="warnings">
                                <p className="warning">
                                    Go under settings and choose a results
                                    folder location before re-running the job.
                                </p>
                            </div>
                        )}
                        <div className="row">
                            {!jobIsBatch && (
                                <button
                                    className="important"
                                    type="button"
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
                                        className="important"
                                        type="button"
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
                                </>
                            )}
                        </div>
                    </>
                )}
        </div>
    )
}
