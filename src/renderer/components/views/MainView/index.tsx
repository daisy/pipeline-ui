/*
Data manager and owner of tab view
*/
import { useEffect, useState } from 'react'
import { JobStatus } from 'shared/types'
import { useWindowStore } from 'renderer/store'

import { ID } from 'renderer/utils/utils'
import { JobState } from 'shared/types'

import {
    addJob,
    removeJob,
    newJob,
    selectJob,
    selectNextJob,
    selectPrevJob,
    removeBatchJob,
} from 'shared/data/slices/pipeline'
import { NewJobPane } from '../../NewJobPane'
import { calculateJobName } from 'shared/jobName'
import { PLATFORM } from 'shared/constants'
import { X } from '../../Widgets/SvgIcons'
import { BatchJobDetailsPane } from 'renderer/components/JobDetailsPane/BatchJobPane'
import { SingleJobDetailsPane } from 'renderer/components/JobDetailsPane/SingleJobPane'
import { ScriptForm } from 'renderer/components/ScriptForm'
import { TabList } from 'renderer/components/Widgets/TabList'
import { areAllJobsInBatchDone } from 'shared/utils'

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

    useEffect(() => {
        if (!(pipeline.jobs && pipeline.jobs.length > 0)) {
            let newJob_ = newJob(pipeline)
            App.store.dispatch(addJob(newJob_))
            App.store.dispatch(selectJob(newJob_))
        }
    }, [pipeline.jobs])

    useEffect(() => {
        if (pipeline.selectedJobId !== '') {
            // for the narrators to announce it
            document
                .getElementById(`${ID(pipeline.selectedJobId)}-tab`)
                ?.focus()
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

    let onKeyDown = (e) => {
        switch (e.key) {
            case 'ArrowRight':
                App.store.dispatch(selectNextJob(settings.editJobOnNewTab))
                break
            case 'ArrowLeft':
                App.store.dispatch(selectPrevJob(settings.editJobOnNewTab))
                break
        }
    }
    let isDone = (job) => {
        if (job.jobRequest && job.jobRequest.batchId) {
            let jobsInBatch = pipeline.jobs.filter(
                (j) =>
                    j.jobRequest &&
                    j.jobRequest.batchId &&
                    j.jobRequest.batchId == job.jobRequest.batchId
            )
            return areAllJobsInBatchDone(job, jobsInBatch)
        } else {
            return (
                [JobStatus.ERROR, JobStatus.FAIL, JobStatus.SUCCESS].includes(
                    job.jobData?.status
                ) || job.state == JobState.NEW
            )
        }
    }
    return (
        <main>
            <div className="tablist-container">
                <TabList
                    items={visibleJobs}
                    onKeyDown={onKeyDown}
                    getTabId={(job, idx) => `${ID(job.internalId)}-tab`}
                    getTabAriaSelected={(job, idx) =>
                        pipeline.selectedJobId == job.internalId
                    }
                    getTabIndex={(job, idx) =>
                        pipeline.selectedJobId == job.internalId ? 0 : -1
                    }
                    getTabAriaControls={(job, idx) =>
                        `${ID(job.internalId)}-tabpanel`
                    }
                    getTabTitle={(job, idx) =>
                        `${idx + 1}. ${calculateJobName(job, pipeline.jobs)}`
                    }
                    getTabLabel={(job, idx) => (
                        <h1>
                            {idx + 1}. {calculateJobName(job, pipeline.jobs)}
                        </h1>
                    )}
                    onTabClick={(job, idx) => {
                        App.store.dispatch(selectJob(job))
                        document
                            .getElementById(`${ID(job.internalId)}-tabpanel`)
                            ?.focus()
                    }}
                ></TabList>
                <button
                    type="button"
                    className="add-tab invisible"
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
            {visibleJobs.map((job, idx) => {
                return (
                    <div
                        className={`${
                            job.internalId == pipeline.selectedJobId
                                ? ''
                                : 'is-hidden'
                        }`}
                        id={`${ID(job.internalId)}-tabpanel`}
                        role="tabpanel"
                        aria-labelledby={`${ID(job.internalId)}-tab`}
                        tabIndex={0}
                        key={idx}
                    >
                        <button
                            disabled={!isDone(job)}
                            type="button"
                            id={`cancel-job-${job.internalId}`}
                            onClick={async (e) => {
                                if (job.jobRequest?.batchId) {
                                    // remove all jobs in batch
                                    let jobsInBatch = pipeline.jobs.filter(
                                        (j) =>
                                            j.jobRequest &&
                                            j.jobRequest.batchId &&
                                            j.jobRequest.batchId ==
                                                job.jobRequest.batchId
                                    )
                                    let result = await App.showMessageBoxYesNo(
                                        'Are you sure you want to close these jobs?'
                                    )
                                    if (result) {
                                        App.store.dispatch(
                                            removeBatchJob(jobsInBatch)
                                        )
                                    }
                                } else {
                                    // remove a single job
                                    let result = await App.showMessageBoxYesNo(
                                        'Are you sure you want to close this job?'
                                    )
                                    if (result) {
                                        App.store.dispatch(removeJob(job))
                                    }
                                }
                            }}
                            title="Close tab"
                            className="close-tab invisible"
                        >
                            <X width={20} height={20} />
                        </button>

                        {job && (
                            <div className="tabpanel-contents">
                                {job.state == JobState.NEW &&
                                    job.script == null && (
                                        <NewJobPane
                                            job={pipeline.jobs.find(
                                                (j) =>
                                                    j.internalId ==
                                                    pipeline.selectedJobId
                                            )}
                                        />
                                    )}
                                {job.state == JobState.NEW &&
                                    job.script != null && (
                                        <ScriptForm job={job} />
                                    )}
                                {job.script != null &&
                                    job.state != JobState.NEW &&
                                    job.jobRequest.batchId == null && (
                                        <SingleJobDetailsPane job={job} />
                                    )}
                                {job.script != null &&
                                    job.state != JobState.NEW &&
                                    job.jobRequest.batchId != null && (
                                        <BatchJobDetailsPane
                                            jobs={[
                                                job,
                                                pipeline.jobs.filter(
                                                    (j) =>
                                                        j.internalId !=
                                                            job.internalId &&
                                                        j.jobRequest?.batchId ==
                                                            job.jobRequest
                                                                ?.batchId
                                                ),
                                            ].flat()}
                                        />
                                    )}
                            </div>
                        )}
                    </div>
                )
            })}
        </main>
    )
}
