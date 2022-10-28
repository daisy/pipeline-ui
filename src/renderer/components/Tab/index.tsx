import styles from './styles.module.sass'

function GenericTab({
    id,
    label,
    isSelected,
    onTabSelect,
    ariaLabel = '',
    title = '',
}) {
    return (
        <button
            style={styles}
            role="tab"
            onClick={(e) => onTabSelect(e)}
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            aria-label={ariaLabel ?? ''}
            title={title ?? ''}
            id={id}
        >
            {label}
        </button>
    )
}

export function AddJobTab({ onSelect }) {
    return (
        <GenericTab
            label="+"
            isSelected="false"
            onTabSelect={(e) => onSelect()}
            aria-label="Create job"
            id="create-job"
        />
    )
}

export function JobTab({ job, isSelected, onSelect }) {
    return (
        <GenericTab
            label="New job"
            isSelected={isSelected}
            id={job.internalId}
            onTabSelect={(e) => onSelect(job)}
        />
    )
}
