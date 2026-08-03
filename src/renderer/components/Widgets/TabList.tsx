import type { KeyboardEvent, ReactNode } from 'react'

type TabListProps<T> = {
    items: T[]
    onKeyDown: (event: KeyboardEvent<HTMLDivElement>) => void
    getTabId: (item: T, idx: number) => string
    getTabAriaSelected: (item: T, idx: number) => boolean
    getTabIndex: (item: T, idx: number) => number
    getTabAriaControls: (item: T, idx: number) => string
    getTabTitle: (item: T, idx: number) => string
    getTabLabel: (item: T, idx: number) => ReactNode
    getTabClassName?: (item: T, idx: number) => string
    onTabClick: (item: T, idx: number) => void
}

export function TabList<T>({
    items,
    onKeyDown,
    getTabId,
    getTabAriaSelected,
    getTabIndex,
    getTabAriaControls,
    getTabTitle,
    getTabLabel,
    getTabClassName = () => '',
    onTabClick,
}: TabListProps<T>) {
    return (
        <div role="tablist" onKeyDown={onKeyDown}>
            {items.map((item, idx) => (
                <button
                    role="tab"
                    key={idx}
                    id={getTabId(item, idx)}
                    aria-selected={getTabAriaSelected(item, idx)}
                    tabIndex={getTabIndex(item, idx)}
                    aria-controls={getTabAriaControls(item, idx)}
                    title={getTabTitle(item, idx)}
                    className={getTabClassName?.(item, idx)}
                    onClick={(e) => onTabClick(item, idx)}
                >
                    {getTabLabel(item, idx)}
                </button>
            ))}
        </div>
    )
}
