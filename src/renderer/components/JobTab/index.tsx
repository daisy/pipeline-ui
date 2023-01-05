/*
Tab implementations
*/
import { Job } from 'shared/types'
import * as SvgIcons from '../SvgIcons'
import { AddItemTabProps, ItemTabProps } from '../TabView'

export function JobTab({
    item,
    id,
    tabpanelId,
    isSelected,
    onSelect,
    index,
}: ItemTabProps<Job>) {
    let job = item // item is a Job
    let label = job?.jobData?.nicename ?? 'New job'

    return (
        <button
            id={id}
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            aria-controls={tabpanelId}
            role="tab"
            type="button"
            onClick={(e) => onSelect(item)}
            accessKey={index < 9 ? `${index + 1}` : index == 9 ? '0' : ''}
        >
            {index + 1}. {label}
        </button>
    )
}

export function AddJobTab({
    onSelect,
    onItemWasCreated,
}: AddItemTabProps<Job>) {
    return (
        <button
            id="create-job"
            aria-selected="false"
            tabIndex={-1}
            role="tab"
            type="button"
            onClick={(e) => onSelect(onItemWasCreated)}
            aria-label="Create job"
            title="Create job"
            accessKey="n"
        >
            <SvgIcons.AddTab width="24" height="24" />
        </button>
    )
}
