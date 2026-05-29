/*
Data manager and owner of tab view
*/
import { useEffect } from 'react'
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
} from 'shared/data/slices/pipeline'
// @ts-ignore
import { NewJobPane } from './NewJobPane'
import { calculateJobName } from 'shared/jobName'
import { PLATFORM } from 'shared/constants'
import { Plus, X } from '../../Widgets/SvgIcons'
// @ts-ignore
import { SingleJobDetailsPane } from 'renderer/components/views/MainView/JobDetailsPane/SingleJobPane'
// @ts-ignore
import { ScriptForm } from 'renderer/components/views/MainView/ScriptForm'
import { TabList } from 'renderer/components/Widgets/TabList'
import { CanDo } from 'shared/canDo'
import * as Utils from 'shared/utils'
const { App } = window

export function MainView() {
    const { pipeline, settings } = useWindowStore()
    const visibleJobs = pipeline.jobs.filter(
        (job) => settings.editJobOnNewTab || !job.invisible
    )

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
            const selectedJob = pipeline.jobs.find(
                (j) => j.internalId === pipeline.selectedJobId
            )
            if (!selectedJob || selectedJob.state !== JobState.NEW) {
                document
                    .getElementById(`${ID(pipeline.selectedJobId)}-tab`)
                    ?.focus()
            } else {
                document
                    .getElementById(`${ID(pipeline.selectedJobId)}-tabpanel`)
                    ?.querySelector('select')
                    ?.focus()
            }
        }
    }, [pipeline.selectedJobId])

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
                {CanDo.createJob(pipeline.status) && (
                    <button
                        type="button"
                        className="add-tab invisible"
                        title={`Create a job (${
                            PLATFORM.IS_MAC ? 'Cmd' : 'Ctrl'
                        }+N)`}
                        aria-label={`Create a job (${
                            PLATFORM.IS_MAC ? 'Cmd' : 'Ctrl'
                        }+N)`}
                        onClick={(e) => {
                            const newJob_ = newJob(pipeline)
                            App.store.dispatch(addJob(newJob_))
                            App.store.dispatch(selectJob(newJob_))
                        }}
                    >
                        <Plus width={20} height={20} />
                    </button>
                )}
            </div>
            {visibleJobs.map((job) => {
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
                        key={job.internalId}
                    >
                        <button
                            disabled={
                                !CanDo.closeJob(pipeline, job) &&
                                !CanDo.cancelJob(pipeline, job)
                            }
                            type="button"
                            id={`cancel-job-${job.internalId}`}
                            onClick={async (e) => {
                                // remove a single job
                                if (
                                    job.state === JobState.NEW &&
                                    Utils.isJobUnchanged(job, settings)
                                ) {
                                    App.store.dispatch(removeJob(job))
                                } else if (
                                    ((job.jobData?.status &&
                                        [
                                            JobStatus.ERROR,
                                            JobStatus.FAIL,
                                            JobStatus.SUCCESS,
                                        ].includes(job.jobData.status)) ||
                                        !!job.jobRequestError) &&
                                    settings.confirmOnCloseFinishedJob === false
                                ) {
                                    App.store.dispatch(removeJob(job))
                                } else {
                                    let result = await App.showMessageBoxYesNo(
                                        'Are you sure you want to close this job?'
                                    )
                                    if (result) {
                                        App.store.dispatch(removeJob(job))
                                    }
                                }
                            }}
                            title={Utils.closeOrCancelLabel(pipeline, job)}
                            aria-label={Utils.closeOrCancelLabel(pipeline, job)}
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
                                    job.state != JobState.NEW && (
                                        <SingleJobDetailsPane job={job} />
                                    )}
                            </div>
                        )}
                    </div>
                )
            })}
        </main>
    )
}
