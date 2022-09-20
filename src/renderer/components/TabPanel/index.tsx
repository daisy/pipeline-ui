import { NewJobPane } from '../NewJobPane'
import { JobDetailsPane } from '../JobDetailsPane'
import styles from './styles.module.sass'

export function TabPanel({ job, isSelected }) {
  return (
    <div
      className={styles.TabPanel}
      role="tabpanel"
      hidden={!isSelected}
      aria-labelledby={`tab-${job.id}`}
      tabIndex={0}
    >
      {job.type == 'Job' ? (
        <JobDetailsPane jobHref={job.href} />
      ) : (
        <NewJobPane />
      )}
    </div>
  )
}
