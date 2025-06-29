export function TabList({
    items,
    onKeyDown,
    getTabId,
    getTabAriaSelected,
    getTabIndex,
    getTabAriaControls,
    getTabTitle,
    getTabLabel,
    onTabClick,
}) {
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
                    onClick={(e) => onTabClick(item, idx)}
                >
                    {getTabLabel(item, idx)}
                </button>
            ))}
        </div>
    )
}
