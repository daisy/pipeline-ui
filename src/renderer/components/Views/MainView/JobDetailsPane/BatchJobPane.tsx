/*
Details of a submitted job
*/
import { Job, JobStatus } from '/shared/types'

import { cancelBatchJob } from 'shared/data/slices/pipeline'
import { useState, useEffect } from 'react'
import { JobDetails } from './JobDetails'
import { getIdleCountInBatch } from 'shared/utils'
import { JobStatusIcon } from '../../../Widgets/SvgIcons'
import { File, FileAsType } from '../../../Widgets/File'
import { getStatus, ID } from 'renderer/utils'
import { TabList } from '../../../Widgets/TabList'

const { App } = window

export function BatchJobDetailsPane({ jobs }: { jobs: Array<Job> }) {
    const [primaryJob] = useState(jobs.find((j) => j.isPrimaryForBatch))
    const [selectedJob, setSelectedJob] = useState(primaryJob)

    // this helps the details pane stay current
    useEffect(() => {
        let selJob = jobs.find((j) => j.internalId == selectedJob.internalId)
        setSelectedJob(selJob)
    }, [jobs])

    let onCancelBatch = () => {
        if (getIdleCountInBatch(primaryJob, jobs) > 0) {
            App.store.dispatch(cancelBatchJob(jobs))
        }
    }

    // get the value of the input parameter named 'source'
    let getSourceValue = (job) => {
        let sourceInput = job.jobRequest.inputs.find(
            (input) => input.name == 'source'
        )
        return sourceInput?.value ?? ''
    }

    let onKeyDown = (e) => {
        let selJobIdx = selectedJob
            ? jobs.findIndex((j) => j.internalId == selectedJob.internalId)
            : -1

        let jobToSelect = null
        switch (e.key) {
            case 'ArrowDown':
                if (selJobIdx >= jobs.length - 1 || selJobIdx < 0) {
                    jobToSelect = jobs[0]
                } else {
                    jobToSelect = jobs[selJobIdx + 1]
                }
                break
            case 'ArrowUp':
                if (selJobIdx <= 0 || selJobIdx > jobs.length) {
                    jobToSelect = jobs[0]
                } else {
                    jobToSelect = jobs[selJobIdx - 1]
                }
                break
        }
        if (jobToSelect) {
            if (jobToSelect.internalId) {
                document
                    .getElementById(`${ID(jobToSelect.internalId)}-batch-tab`)
                    ?.focus()
            }
            setSelectedJob(jobToSelect)
        }
    }

    return (
        <div className="batch-job">
            <div className="sidebar">
                <details open>
                    <summary>
                        <h2 id={`${ID(primaryJob.internalId)}-sidebar`}>
                            Jobs in this batch
                        </h2>
                    </summary>
                    <TabList
                        items={jobs}
                        onKeyDown={onKeyDown}
                        getTabId={(job, idx) =>
                            `${ID(job.internalId)}-batch-tab`
                        }
                        getTabAriaSelected={(job, idx) =>
                            job.internalId == selectedJob.internalId
                        }
                        getTabIndex={(job, idx) =>
                            selectedJob.internalId == job.internalId ? 0 : -1
                        }
                        getTabAriaControls={(job, idx) =>
                            `${ID(job.internalId)}-batch-tabpanel`
                        }
                        getTabTitle={(job, idx) => getSourceValue(job)}
                        getTabLabel={(job, idx) => (
                            <>
                                <span className={`status ${getStatus(job)}`}>
                                    {JobStatusIcon(
                                        job.jobData?.status ||
                                            (job.jobRequestError &&
                                                JobStatus.ERROR),
                                        {
                                            width: 20,
                                            height: 20,
                                        }
                                    )}
                                </span>
                                <File
                                    showAsType={FileAsType.AS_PATH}
                                    fileUrlOrPath={getSourceValue(job)}
                                />
                            </>
                        )}
                        onTabClick={(job, idx) => {
                            setSelectedJob(job)
                            document
                                .getElementById(
                                    `${ID(job.internalId)}-batch-tabpanel`
                                )
                                ?.focus()
                        }}
                    />
                </details>
                {getIdleCountInBatch(primaryJob, jobs) != 0 && (
                    <div className="controls">
                        <button type="button" onClick={(e) => onCancelBatch()}>
                            Cancel remaining
                        </button>
                    </div>
                )}
            </div>
            <div
                id={`${ID(selectedJob.internalId)}-batch-tabpanel`}
                aria-labelledby={`${ID(selectedJob.internalId)}-batch-tab`}
                role="tabpanel"
                tabIndex={0}
            >
                <JobDetails job={selectedJob} />
            </div>
        </div>
    )
}
