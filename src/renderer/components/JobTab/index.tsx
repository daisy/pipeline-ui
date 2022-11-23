/*
Tab implementations
*/
import * as SvgIcons from '../SvgIcons'

export function JobTab({
    item,
    id,
    tabpanelId,
    isSelected,
    onSelect,
    onClose,
}) {
    let job = item // item is a Job
    let label = job?.jobData?.nicename ?? 'Untitled'

    return (
        <div className="tab" onClick={(e) => onSelect(item)}>
            <button
                id={id}
                aria-selected={isSelected}
                tabIndex={isSelected ? 0 : -1}
                aria-controls={tabpanelId}
                role="tab"
                type="button"
                onClick={(e) => onSelect(item)}
            >
                {label}
            </button>
            <button
                className="close-tab"
                type="button"
                onClick={(e) => onClose()}
                aria-label={`Close tab "${label}"`}
            >
                <SvgIcons.CloseTab width="20" height="20" />
            </button>
        </div>
    )
}

export function AddJobTab({ onSelect }) {
    return (
        <div className="tab">
            <button
                id="create-job"
                aria-selected="false"
                tabIndex={-1}
                role="tab"
                type="button"
                onClick={(e) => onSelect()}
                aria-label="Create job"
            >
                <SvgIcons.AddTab width="24" height="24" />
            </button>
        </div>
    )
}
