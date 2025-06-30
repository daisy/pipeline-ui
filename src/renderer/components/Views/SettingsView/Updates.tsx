import { save, setAutoCheckUpdate } from 'shared/data/slices/settings'

const { App } = window
export function Updates({ newSettings }) {
    const autoCheckUpdateChanged = (e) => {
        App.store.dispatch(setAutoCheckUpdate(e.target.checked))
        App.store.dispatch(save())
    }

    return (
        <div className="field">
            <label htmlFor="autoCheckUpdate">
                Check for updates in background
            </label>
            <input
                id="autoCheckUpdate"
                type="checkbox"
                checked={newSettings.autoCheckUpdate}
                onChange={autoCheckUpdateChanged}
            />
        </div>
    )
}
