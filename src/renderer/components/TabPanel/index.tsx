export function TabPanel({ id, tabId, isSelected, children }) {
    return (
        <div
            className="tabPanel"
            id={id}
            role="tabpanel"
            hidden={!isSelected}
            aria-labelledby={tabId}
            tabIndex={0}
        >
            <div className="fixed-height-layout">{children}</div>
        </div>
    )
}
