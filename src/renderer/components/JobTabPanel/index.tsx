/*
Tab panel implementation
*/
import { Job, JobState } from 'shared/types'
import { JobDetailsPane } from '../JobDetailsPane'
import { NewJobPane } from '../NewJobPane'
import { ItemTabPanelProps } from '../TabView'

export function JobTabPanel({
    item,
    isSelected,
    id,
    tabId,
    updateItem,
    onClose,
}: ItemTabPanelProps<Job>) {
    let job = item // item is a Job
    let type = job.state == JobState.NEW ? 'new-job' : 'job'

    return (
        <div
            className={`"tabPanel" ${type}`}
            id={id}
            role="tabpanel"
            hidden={!isSelected}
            aria-labelledby={tabId}
            tabIndex={0}
        >
            <div className={`fixed-height-layout ${type}`}>
                {job.state == JobState.NEW ? (
                    <NewJobPane
                        job={job}
                        updateJob={updateItem}
                        onClose={onClose}
                    />
                ) : (
                    <JobDetailsPane job={job} onClose={onClose} />
                )}
            </div>
        </div>
    )
}
