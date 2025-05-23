/*
Data manager and owner of tab view
*/
import { useEffect, useState } from 'react'
import { Job } from 'shared/types'
import { useWindowStore } from 'renderer/store'

import { ID } from 'renderer/utils/utils'
import { JobState } from 'shared/types'

import {
    addJob,
    removeJob,
    updateJob,
    newJob,
    selectJob,
    selectNextJob,
    selectPrevJob,
} from 'shared/data/slices/pipeline'
import { NewJobPane } from '../../NewJobPane'
import { calculateJobName } from 'shared/jobName'
import { PLATFORM } from 'shared/constants'
import { Plus } from '../../Widgets/SvgIcons'
import { BatchJobDetailsPane } from 'renderer/components/JobDetailsPane/BatchJobPane'
import { SingleJobDetailsPane } from 'renderer/components/JobDetailsPane/SingleJobPane'

const { App } = window

export function MainView() {
    const { pipeline, settings } = useWindowStore()
    const [visibleJobs, setVisibleJobs] = useState([])

    useEffect(() => {
        if (!(pipeline.jobs && pipeline.jobs.length > 0)) {
            let newJob_ = newJob(pipeline)
            App.store.dispatch(addJob(newJob_))
            App.store.dispatch(selectJob(newJob_))
        }
    }, [])

    // on navigation received for the tab, we need to refocus the selected tab
    // for the narrators to announce it
    useEffect(() => {
        if (pipeline.selectedJobId !== '') {
            document
                .getElementById(`${ID(pipeline.selectedJobId)}-tab`)
                ?.focus()
        } else {
            document.getElementById(`new-job-button`)?.focus()
        }
    }, [pipeline.selectedJobId])

    useEffect(() => {
        let visibleJobs_ = pipeline.jobs.filter(
            (job) =>
                (settings.editJobOnNewTab || !job.invisible) &&
                (!job.jobRequest?.batchId || job.isPrimaryForBatch) // job is not part of a batch or it's the primary
        )
        setVisibleJobs([...visibleJobs_])
    }, [pipeline.jobs])

    const newJobButton = document.getElementById(`new-job-button`)
    /**
     * Keyboard actions on tabs with arrows
     * @param e KeyboardEvent
     */
    const keyboardActions = (e) => {
        switch (e.key) {
            case 'ArrowRight':
                if (newJobButton == document.activeElement) {
                    App.store.dispatch(selectJob(visibleJobs[0]))
                    document
                        .getElementById(`${ID(visibleJobs[0].internalId)}-tab`)
                        ?.focus()
                } else if (
                    pipeline.selectedJobId ==
                    visibleJobs[visibleJobs.length - 1].internalId
                ) {
                    document.getElementById(`new-job-button`)?.focus()
                } else
                    App.store.dispatch(selectNextJob(settings.editJobOnNewTab))
                break
            case 'ArrowLeft':
                if (newJobButton == document.activeElement) {
                    App.store.dispatch(
                        selectJob(visibleJobs[visibleJobs.length - 1])
                    )
                    document
                        .getElementById(
                            `${ID(
                                visibleJobs[visibleJobs.length - 1].internalId
                            )}-tab`
                        )
                        ?.focus()
                } else if (
                    pipeline.selectedJobId == visibleJobs[0].internalId
                ) {
                    document.getElementById(`new-job-button`)?.focus()
                } else
                    App.store.dispatch(selectPrevJob(settings.editJobOnNewTab))
                break
            case 'ArrowDown':
                document
                    .getElementById(`${ID(pipeline.selectedJobId)}-tabpanel`)
                    ?.focus()
                break
            case 'Delete':
                if (pipeline.jobs.length > 0) {
                    // TODO if requested : possibility to delete the selection
                }
                break
        }
    }
    return (
        <>
            <div role="tablist" aria-live="polite" onKeyDown={keyboardActions}>
                {visibleJobs.map((job, idx) => (
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
                        onClick={(e) => {
                            App.store.dispatch(selectJob(job))
                            document
                                .getElementById(
                                    `${ID(job.internalId)}-tabpanel`
                                )
                                ?.focus()
                        }}
                    >
                        {idx + 1}. {calculateJobName(job, pipeline.jobs)}
                    </button>
                ))}
                <button
                    className={'as-tab'}
                    id={`new-job-button`}
                    aria-selected={pipeline.selectedJobId == ''}
                    title={`Create a job (${
                        PLATFORM.IS_MAC ? 'Cmd' : 'Ctrl'
                    }+N)`}
                    onClick={(e) => {
                        const newJob_ = newJob(pipeline)
                        App.store.dispatch(addJob(newJob_))
                        App.store.dispatch(selectJob(newJob_))
                    }}
                >
                    +
                </button>
            </div>
            {visibleJobs
                .filter((job) => settings.editJobOnNewTab || !job.invisible)
                .map((job: Job, idx) => {
                    return (
                        <div
                            key={idx}
                            className={
                                job.state == JobState.NEW ? 'new-job' : 'job'
                            }
                            id={`${ID(job.internalId)}-tabpanel`}
                            role="tabpanel"
                            hidden={pipeline.selectedJobId != job.internalId}
                            aria-labelledby={`${ID(job.internalId)}-tab`}
                            tabIndex={0}
                        >
                            <div
                                className={`fixed-height-layout ${
                                    job.state == JobState.NEW
                                        ? 'new-job'
                                        : 'job'
                                }`}
                            >
                                {job.state == JobState.NEW ? (
                                    <NewJobPane job={job} />
                                ) : job.jobRequest.batchId == null ? (
                                    <SingleJobDetailsPane job={job} />
                                ) : (
                                    <BatchJobDetailsPane
                                        jobs={[
                                            job,
                                            pipeline.jobs.filter(
                                                (j) =>
                                                    j.internalId !=
                                                        job.internalId &&
                                                    j.jobRequest?.batchId ==
                                                        job.jobRequest?.batchId
                                            ),
                                        ].flat()}
                                    />
                                )}
                            </div>
                        </div>
                    )
                })}
        </>
    )
}
