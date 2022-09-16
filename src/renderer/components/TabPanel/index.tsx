import { CreateJobPane } from '../CreateJobPane'
import { JobDetailsPane } from '../JobDetailsPane'

export function TabPanel({ job, isSelected }) {
  return (
    <div
      role="tabpanel"
      hidden={!isSelected}
      aria-labelledby={`tab-${job.id}`}
      tabIndex={0}
    >
      {job.type == 'Job' ? (
        <JobDetailsPane jobHref={job.href} />
      ) : (
        <CreateJobPane />
      )}
    </div>
  )
}
