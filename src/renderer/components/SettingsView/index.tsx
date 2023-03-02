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
        onClosingMainWindows: settings.onClosingMainWindows ?? 'ask', // defaults to ask in form
    })
    const [saved, setSaved] = useState(true)
    useEffect(() => {
        // Reload settings from store if it has changed
        setNewSettings({
            ...settings,
            onClosingMainWindows: settings.onClosingMainWindows ?? 'ask', // defaults to ask in form
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
            onClosingMainWindows: Object.keys(ClosingMainWindowAction)[
                e.target.selectedIndex
            ] as keyof typeof ClosingMainWindowAction,
        })
        setSaved(false)
    }

    // send back the settings and save them on disk
    const handleSave = () => {
        App.store.dispatch(setSettings(newSettings))
        App.store.dispatch(save())
        setSaved(true)
    }
    return (
        <form className="settings-form">
            <div>
                <div className="form-field">
                    <label htmlFor="resultsFolder">Results folder</label>
                    <span className="description">
                        A folder where all jobs will be automatically downloaded
                    </span>
                    <FileOrFolderInput
                        type="open"
                        dialogProperties={['openDirectory']}
                        elemId="resultsFolder"
                        mediaType={['']}
                        name={'Results folder'}
                        onChange={resultsFolderChanged}
                        useSystemPath={false}
                        initialValue={newSettings.downloadFolder}
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
                    <label htmlFor="onMainWindowClosing">
                        Action on closing the main window
                    </label>
                    <span className="description">
                        Choose here if you want to keep the app running in the
                        tray or close the application when closing the
                        application's window.
                    </span>
                    <select
                        id="onMainWindowClosing"
                        onChange={(e) => ClosingActionChanged(e)}
                    >
                        {Object.entries(ClosingMainWindowAction).map(
                            ([k, v]: [string, string]) => {
                                return (
                                    <option
                                        key={k}
                                        selected={
                                            newSettings.onClosingMainWindows ==
                                            k
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
