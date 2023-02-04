/*
Data manager and owner of tab view
*/
import { useEffect, useState } from 'react'
import { Job } from 'shared/types/pipeline'
import { useWindowStore } from 'renderer/store'

import { ID } from 'renderer/utils/utils'
import { JobState } from 'shared/types'

import {
    addJob,
    removeJob,
    updateJob,
    newJob,
    selectJob,
} from 'shared/data/slices/pipeline'
import { NewJobPane } from '../NewJobPane'
import { JobDetailsPane } from '../JobDetailsPane'
import { calculateJobName } from 'shared/jobName'

const { App } = window

export function MainView() {
    const { pipeline } = useWindowStore()

    useEffect(() => {
        if (!(pipeline.jobs && pipeline.jobs.length > 0)) {
            console.log(pipeline.jobs)
            let newJob_ = newJob(pipeline)
            App.store.dispatch(addJob(newJob_))
            App.store.dispatch(selectJob(newJob_))
        }
    }, [])

    return (
        <>
            <div role="tablist" aria-live="polite">
                {pipeline.jobs.map((job, idx) => (
                    <button
                        key={idx}
                        id={`${ID(job.internalId)}-tab`}
                        aria-selected={pipeline.selectedJobId == job.internalId}
                        tabIndex={
                            pipeline.selectedJobId == job.internalId ? 0 : -1
                        }
                        aria-controls={`${ID(job.internalId)}-tabpanel`}
                        role="tab"
                        type="button"
                        onClick={(e) => App.store.dispatch(selectJob(job))}
                    >
                        {idx + 1}. {calculateJobName(job)}
                    </button>
                ))}
            </div>
            {pipeline.jobs.map((job, idx) => {
                return (
                    <div
                        key={idx}
                        className={`"tabPanel" ${
                            job.state == JobState.NEW ? 'new-job' : 'job'
                        }`}
                        id={`${ID(job.internalId)}-tabpanel`}
                        role="tabpanel"
                        hidden={pipeline.selectedJobId != job.internalId}
                        aria-labelledby={`${ID(job.internalId)}-tab`}
                        tabIndex={0}
                    >
                        <div
                            className={`fixed-height-layout ${
                                job.state == JobState.NEW ? 'new-job' : 'job'
                            }`}
                        >
                            {job.state == JobState.NEW ? (
                                <NewJobPane job={job} />
                            ) : (
                                <JobDetailsPane job={job} />
                            )}
                        </div>
                    </div>
                )
            })}
        </>
    )
}
