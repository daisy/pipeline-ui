import { useEffect, useState } from 'react'
import { useWindowStore } from 'renderer/store'
import {
    ApplicationSettings,
    ClosingMainWindowActionForApp,
    ClosingMainWindowActionForJobs,
    ColorScheme,
} from 'shared/types'
import { FileOrFolderInput } from '../Fields/FileOrFolderInput'
import { setSettings, save } from 'shared/data/slices/settings'
import { TtsConfigPane } from '../TtsConfig'
const { App } = window // The "App" comes from the bridge

export function SettingsView() {
    // Current registered settings
    const { settings } = useWindowStore()
    // Copy settings in new settings for update
    // (without affecting the rest of the app)
    const [newSettings, setNewSettings] = useState<ApplicationSettings>({
        ...settings,
        appStateOnClosingMainWindow:
            settings.appStateOnClosingMainWindow ?? 'ask', // defaults to ask in form
        jobsStateOnClosingMainWindow:
            settings.jobsStateOnClosingMainWindow ?? 'close', // defaults to ask in form
    })
    const [saved, setSaved] = useState(true)

    // TODO this will come from the API
    const availableVoices = [
        {
            engine: 'Acapela',
            name: 'Claire',
            lang: 'fr',
            gender: 'female-adult',
            id: 'acapela-claire',
        },
        {
            engine: 'Sapi',
            name: 'Fred',
            lang: 'en',
            gender: 'neutral',
            id: 'sapi-fred',
        },
        {
            engine: 'Xyz',
            name: 'Sam',
            lang: 'fr',
            gender: 'male',
            id: 'xyz-sam',
        },
    ]

    useEffect(() => {
        // Reload settings from store if it has changed
        setNewSettings({
            ...settings,
            appStateOnClosingMainWindow:
                settings.appStateOnClosingMainWindow ?? 'ask', // defaults to ask in form
            jobsStateOnClosingMainWindow:
                settings.jobsStateOnClosingMainWindow ?? 'close', // defaults to ask in form
        })
    }, [settings])

    const [selectedSection, setSelectedSection] = useState(0)

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
    const AppClosingActionChanged = (e) => {
        setNewSettings({
            ...newSettings,
            appStateOnClosingMainWindow: Object.keys(
                ClosingMainWindowActionForApp
            )[
                e.target.selectedIndex
            ] as keyof typeof ClosingMainWindowActionForApp,
        })
        setSaved(false)
    }

    const JobsClosingActionChanged = (e) => {
        setNewSettings({
            ...newSettings,
            jobsStateOnClosingMainWindow: Object.keys(
                ClosingMainWindowActionForJobs
            )[
                e.target.selectedIndex
            ] as keyof typeof ClosingMainWindowActionForJobs,
        })
        setSaved(false)
    }

    const onTtsPreferenceChange = (voices) => {
        console.log("on tts pref change", voices)
        setNewSettings({
            ...newSettings,
            ttsConfig: {
                preferredVoices: [...voices],
                xmlFilepath: newSettings.ttsConfig.xmlFilepath,
            },
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
        <div className="settings">
            <nav className="settings-menu">
                <ul>
                    <li
                        className={
                            selectedSection == 0 ? 'selected-menu-item' : ''
                        }
                    >
                        <button onClick={(e) => setSelectedSection(0)}>
                            General
                        </button>
                    </li>
                    <li
                        className={
                            selectedSection == 1 ? 'selected-menu-item' : ''
                        }
                    >
                        <button onClick={(e) => setSelectedSection(1)}>
                            Appearance
                        </button>
                    </li>
                    <li
                        className={
                            selectedSection == 2 ? 'selected-menu-item' : ''
                        }
                    >
                        <button onClick={(e) => setSelectedSection(2)}>
                            Behavior
                        </button>
                    </li>
                    <li
                        className={
                            selectedSection == 3 ? 'selected-menu-item' : ''
                        }
                    >
                        <button onClick={(e) => setSelectedSection(3)}>
                            Text-to-speech
                        </button>
                    </li>
                </ul>
            </nav>
            <form className="settings-form">
                <div className="fields">
                    {selectedSection == 0 ? (
                        <div className="form-field">
                            <label htmlFor="resultsFolder">
                                Results folder
                            </label>
                            <span className="description">
                                A folder where all job results will be
                                automatically downloaded
                            </span>
                            <FileOrFolderInput
                                type="open"
                                dialogProperties={['openDirectory']}
                                elemId="resultsFolder"
                                mediaType={['']}
                                name={'Results folder'}
                                onChange={resultsFolderChanged}
                                useSystemPath={false}
                                initialValue={decodeURI(
                                    newSettings.downloadFolder
                                )}
                                buttonLabel="Browse"
                            />
                        </div>
                    ) : selectedSection == 1 ? (
                        <div className="form-field">
                            <label htmlFor="colorMode">
                                Interface color mode
                            </label>
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
                                                selected={
                                                    newSettings.colorScheme == k
                                                }
                                            >
                                                {v}
                                            </option>
                                        )
                                    }
                                )}
                            </select>
                        </div>
                    ) : selectedSection == 2 ? (
                        <>
                            <div className="form-field">
                                <label htmlFor="appStateOnMainWindowClosing">
                                    Action on closing the app window
                                </label>
                                <span className="description">
                                    Choose here if you want to keep the
                                    application running in the tray or close it
                                    when closing the app window.
                                </span>
                                <select
                                    id="appStateOnMainWindowClosing"
                                    onChange={(e) => AppClosingActionChanged(e)}
                                >
                                    {Object.entries(
                                        ClosingMainWindowActionForApp
                                    ).map(([k, v]: [string, string]) => {
                                        return (
                                            <option
                                                key={k}
                                                selected={
                                                    newSettings.appStateOnClosingMainWindow ==
                                                    k
                                                }
                                            >
                                                {v}
                                            </option>
                                        )
                                    })}
                                </select>
                            </div>
                            <div className="form-field">
                                <label htmlFor="jobsStateOnMainWindowClosing">
                                    Keep jobs open when closing the app window
                                </label>
                                <span className="description">
                                    By default, when closing the app window, all
                                    non-running jobs are closed.
                                    <br />
                                    Here you can choose to keep the jobs in
                                    memory when closing the window so that they
                                    reload on reopening the app window.
                                </span>
                                <select
                                    id="jobsStateOnMainWindowClosing"
                                    onChange={(e) =>
                                        JobsClosingActionChanged(e)
                                    }
                                >
                                    {Object.entries(
                                        ClosingMainWindowActionForJobs
                                    ).map(([k, v]: [string, string]) => {
                                        return (
                                            <option
                                                key={k}
                                                selected={
                                                    newSettings.jobsStateOnClosingMainWindow ==
                                                    k
                                                }
                                            >
                                                {v}
                                            </option>
                                        )
                                    })}
                                </select>
                            </div>
                            {/* insert local pipeline settings form part here */}
                            {/* insert remote pipeline settings form part here */}
                        </>
                    ) : (
                        <div className="tts-config">
                            <TtsConfigPane
                                availableVoices={availableVoices}
                                userPreferredVoices={
                                    newSettings.ttsConfig.preferredVoices
                                }
                                onChangePreferredVoices={onTtsPreferenceChange}
                            />
                            {/* <pre>
                                E.g. this would be the output in ttsConfig.xml:
                                <br />
                                <br />
                                <code>
                                    &lt;config&gt;
                                    {newSettings.ttsConfig.preferredVoices
                                        .map(
                                            (v) =>
                                                `\n\t<voice engine="${v.engine}" name="${v.name}" lang="${v.lang}" gender="${v.gender}">`
                                        )
                                        .join('') + '\n'}
                                    &lt;/config&gt;
                                </code>
                            </pre> */}
                        </div>
                    )}
                </div>
                <div className="save-settings">
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
                        Save and close
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
        </div>
    )
}
