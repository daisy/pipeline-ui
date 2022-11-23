/*
Tab panel implementation
*/
import { JobState } from 'shared/types'
import { JobDetailsPane } from '../JobDetailsPane'
import { NewJobPane } from '../NewJobPane'

export function JobTabPanel({ item, isSelected, id, tabId, updateItem }) {
    let job = item // item is a Job
    return (
        <div
            className="tabPanel"
            id={id}
            role="tabpanel"
            hidden={!isSelected}
            aria-labelledby={tabId}
            tabIndex={0}
        >
            <div className="fixed-height-layout">
                {job.state == JobState.NEW ? (
                    <NewJobPane job={job} updateJob={updateItem} />
                ) : (
                    <JobDetailsPane job={job} />
                )}
            </div>
        </div>
    )
}
