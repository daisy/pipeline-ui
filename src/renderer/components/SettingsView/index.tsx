import { useEffect, useState } from 'react'
import { useWindowStore } from 'renderer/store'
import {
    ApplicationSettings,
    ClosingMainWindowAction,
    ColorScheme,
} from 'shared/types'
import { FileOrFolderInput } from '../Fields/FileOrFolderInput'
import { setSettings, save } from 'shared/data/slices/settings'
const { App } = window // The "App" comes from the bridge

export function SettingsView() {
    // Current registered settings
    const { settings } = useWindowStore()

    // Copy settings in new settings for update
    // (without affecting the rest of the app)
    const [newSettings, setNewSettings] = useState<ApplicationSettings>({
        ...settings,
        onClosingMainWindow: settings.onClosingMainWindow ?? 'ask', // defaults to ask in form
    })
    const [saved, setSaved] = useState(true)
    useEffect(() => {
        // Reload settings from store if it has changed
        setNewSettings({
            ...settings,
            onClosingMainWindow: settings.onClosingMainWindow ?? 'ask', // defaults to ask in form
        })
    }, [settings])

    // Changed folder
    const resultsFolderChanged = (filename) => {
        setNewSettings({
            ...newSettings,
            downloadFolder: filename,
        })
        setSaved(false)
    }
    const colorModeChanged = (e) => {
        setNewSettings({
            ...newSettings,
            colorScheme: Object.keys(ColorScheme)[
                e.target.selectedIndex
            ] as keyof typeof ColorScheme,
        })
        setSaved(false)
    }
    const ClosingActionChanged = (e) => {
        setNewSettings({
            ...newSettings,
            onClosingMainWindow: Object.keys(ClosingMainWindowAction)[
                e.target.selectedIndex
            ] as keyof typeof ClosingMainWindowAction,
        })
        setSaved(false)
    }

    const editJobOnNewTabChanged = (e) => {
        setNewSettings({
            ...newSettings,
            editJobOnNewTab: e.target.checked,
        })
        setSaved(false)
    }

    // send back the settings and save them on disk
    const handleSave = () => {
        App.store.dispatch(setSettings(newSettings))
        App.store.dispatch(save())
        window.close()
        setSaved(true)
    }
    return (
        <form className="settings-form">
            <div className="fields">
                <div className="form-field">
                    <label htmlFor="resultsFolder">Results folder</label>
                    <span className="description">
                        A folder where all job results will be automatically
                        downloaded
                    </span>
                    <FileOrFolderInput
                        type="open"
                        dialogProperties={['openDirectory']}
                        elemId="resultsFolder"
                        mediaType={['']}
                        name={'Results folder'}
                        onChange={resultsFolderChanged}
                        useSystemPath={false}
                        initialValue={decodeURI(newSettings.downloadFolder)}
                        buttonLabel="Browse"
                    />
                </div>
                <div className="form-field">
                    <label htmlFor="colorMode">Interface color mode</label>
                    <span className="description">
                        Select the interface color scheme to use
                    </span>
                    <select
                        id="colorMode"
                        onChange={(e) => colorModeChanged(e)}
                    >
                        {Object.entries(ColorScheme).map(
                            ([k, v]: [string, string]) => {
                                return (
                                    <option
                                        key={k}
                                        selected={newSettings.colorScheme == k}
                                    >
                                        {v}
                                    </option>
                                )
                            }
                        )}
                    </select>
                </div>
                <div className="form-field">
                    <label htmlFor="editJobOnNewTab">
                        Editing jobs in new tabs
                    </label>
                    <span className="description">
                        If checked, editing a job will open a pre-filled new job
                        instead of reuse the existing job.
                    </span>
                    <input
                        type="checkbox"
                        id="editJobOnNewTab"
                        checked={newSettings.editJobOnNewTab}
                        onChange={editJobOnNewTabChanged}
                    />
                </div>
                <div className="form-field">
                    <label htmlFor="OnMainWindowClosing">
                        Action on closing the app window
                    </label>
                    <span className="description">
                        Choose here if you want to keep the application running
                        in the tray or quit the application when closing the
                        jobs window.
                        <br />
                        If the application should stay in the tray, you can
                        choose if you want to keep jobs opened or if they should
                        be closed when the window is closed.
                    </span>
                    <select
                        id="OnMainWindowClosing"
                        onChange={(e) => ClosingActionChanged(e)}
                    >
                        {Object.entries(ClosingMainWindowAction).map(
                            ([k, v]: [string, string]) => {
                                return (
                                    <option
                                        key={k}
                                        selected={
                                            newSettings.onClosingMainWindow == k
                                        }
                                    >
                                        {v}
                                    </option>
                                )
                            }
                        )}
                    </select>
                </div>
                {/* insert local pipeline settings form part here */}
                {/* insert remote pipeline settings form part here */}
            </div>
            <div className="save-settings">
                {' '}
                <button
                    id="save-settings"
                    type="submit"
                    onClick={handleSave}
                    className="save-button"
                    // disabled={
                    //     JSON.stringify({ ...settings }) !=
                    //     JSON.stringify({ ...newSettings })
                    // }
                >
                    Save
                </button>
                {saved ? (
                    <span className="confirm-save" aria-live="polite">
                        Saved
                    </span>
                ) : (
                    ''
                )}
            </div>
        </form>
    )
}
