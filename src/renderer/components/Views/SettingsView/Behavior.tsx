import {
    save,
    setEditJobOnNewTab,
    setClosingMainWindowAction,
} from 'shared/data/slices/settings'
import { ClosingMainWindowAction } from 'shared/types'
const { App } = window

export function Behavior({ newSettings }) {
    const editJobOnNewTabChanged = (e) => {
        App.store.dispatch(setEditJobOnNewTab(e.target.checked))
        App.store.dispatch(save())
    }

    const ClosingActionChanged = (e) => {
        App.store.dispatch(
            setClosingMainWindowAction(
                Object.keys(ClosingMainWindowAction)[
                    e.target.selectedIndex
                ] as keyof typeof ClosingMainWindowAction
            )
        )
        App.store.dispatch(save())
    }

    return (
        <>
            <div className="field">
                <label htmlFor="editJobOnNewTab">
                    Editing jobs in new tabs
                </label>
                <span className="description">
                    If checked, editing a job will open a pre-filled new job
                    instead of reusing the existing job.
                </span>
                <input
                    type="checkbox"
                    id="editJobOnNewTab"
                    checked={newSettings.editJobOnNewTab}
                    onChange={editJobOnNewTabChanged}
                />
            </div>
            <div className="field">
                <label htmlFor="OnMainWindowClosing">
                    Action on closing the app window
                </label>
                <span className="description">
                    Choose here if you want to keep the application running in
                    the tray or quit the application when closing the jobs
                    window.
                    <br />
                    If the application should stay in the tray, you can choose
                    if you want to keep jobs opened or if they should be closed
                    when the window is closed.
                </span>
                <select
                    id="OnMainWindowClosing"
                    onChange={(e) => ClosingActionChanged(e)}
                    value={newSettings.onClosingMainWindow}
                >
                    {Object.entries(ClosingMainWindowAction).map(
                        ([k, v]: [string, string]) => {
                            return (
                                <option key={k} value={k}>
                                    {v}
                                </option>
                            )
                        }
                    )}
                </select>
            </div>
            {/* insert local pipeline settings form part here */}
            {/* insert remote pipeline settings form part here */}
        </>
    )
}
