import { useEffect, useState } from 'react'
import { useWindowStore } from 'renderer/store'
import {
    ApplicationSettings,
    ClosingMainWindowActionForApp,
    ClosingMainWindowActionForJobs,
    ColorScheme,
} from 'shared/types'
import { FileOrFolderInput } from '../Fields/FileOrFolderInput'
import {
    save,
    setTtsConfig,
    setClosingMainWindowActionForApp,
    setDownloadPath,
    setColorScheme,
    setAutoCheckUpdate,
    setClosingMainWindowActionForJobs,
} from 'shared/data/slices/settings'
import { TtsVoicesConfigPane } from '../TtsVoicesConfig'
import { TtsEnginesConfigPane } from '../TtsEnginesConfig'
import { TtsMoreOptionsConfigPane } from '../TtsMoreOptionsConfig'
const { App } = window // The "App" comes from the bridge

enum SelectedMenuItem {
    General,
    Appearance,
    Behavior,
    Updates,
    TTSVoices,
    TTSEngines,
    TTSMoreOptions,
}

export function SettingsView() {
    // Current registered settings
    const { settings, pipeline } = useWindowStore()

    // Copy settings in new settings for update
    // (without affecting the rest of the app)
    const [newSettings, setNewSettings] = useState<ApplicationSettings>({
        ...settings,
        appStateOnClosingMainWindow:
            settings.appStateOnClosingMainWindow ?? 'ask', // defaults to ask in form
        jobsStateOnClosingMainWindow:
            settings.jobsStateOnClosingMainWindow ?? 'close', // defaults to ask in form
        ttsConfig: {
            ...settings.ttsConfig,
        },
    })
    //const [saved, setSaved] = useState(true)
    useEffect(() => {
        // Reload settings from store if it has changed
        setNewSettings({
            ...settings,
            appStateOnClosingMainWindow:
                settings.appStateOnClosingMainWindow ?? 'ask', // defaults to ask in form
            jobsStateOnClosingMainWindow:
                settings.jobsStateOnClosingMainWindow ?? 'close', // defaults to ask in form
            ttsConfig: {
                ...settings.ttsConfig,
            },
        })
    }, [settings])

    const [selectedSection, setSelectedSection] = useState(
        SelectedMenuItem.General
    )
    // Changed folder
    const resultsFolderChanged = (filename) => {
        App.store.dispatch(setDownloadPath(filename))
        App.store.dispatch(save())
        //setSaved(true)
    }
    const colorModeChanged = (e) => {
        App.store.dispatch(
            setColorScheme(
                Object.keys(ColorScheme)[
                    e.target.selectedIndex
                ] as keyof typeof ColorScheme
            )
        )
        App.store.dispatch(save())
        //setSaved(true)
    }
    const AppClosingActionChanged = (e) => {
        App.store.dispatch(
            setClosingMainWindowActionForApp(
                Object.keys(ClosingMainWindowActionForApp)[
                    e.target.selectedIndex
                ] as keyof typeof ClosingMainWindowActionForApp
            )
        )
        App.store.dispatch(save())
        //setSaved(true)
    }

    const autoCheckUpdateChanged = (e) => {
        App.store.dispatch(setAutoCheckUpdate(e.target.checked))
        App.store.dispatch(save())
        //setSaved(true)
    }

    const JobsClosingActionChanged = (e) => {
        App.store.dispatch(
            setClosingMainWindowActionForJobs(
                Object.keys(ClosingMainWindowActionForJobs)[
                    e.target.selectedIndex
                ] as keyof typeof ClosingMainWindowActionForJobs
            )
        )
        App.store.dispatch(save())
        //setSaved(true)
    }

    const onTtsVoicesPreferenceChange = (voices) => {
        console.log('on tts voices pref change', voices)
        const newConfig = {
            preferredVoices: [...voices],
            ttsEngineProperties: [...settings.ttsConfig.ttsEngineProperties],
            xmlFilepath: newSettings.ttsConfig.xmlFilepath,
        }
        App.store.dispatch(setTtsConfig(newConfig))
        App.store.dispatch(save())
        //setSaved(true)
    }
    const onTtsEnginePropertiesChange = (ttsEngineProperties) => {
        const newConfig = {
            preferredVoices: [...settings.ttsConfig.preferredVoices],
            ttsEngineProperties: [...ttsEngineProperties],
            xmlFilepath: newSettings.ttsConfig.xmlFilepath,
        }
        App.store.dispatch(setTtsConfig(newConfig))
        App.store.dispatch(save())
        //setSaved(true)
    }
    
    return (
        <div className="settings">
            <nav className="settings-menu">
                <ul>
                    <li
                        className={
                            selectedSection == SelectedMenuItem.General
                                ? 'selected-menu-item'
                                : ''
                        }
                    >
                        <button
                            onClick={(e) =>
                                setSelectedSection(SelectedMenuItem.General)
                            }
                        >
                            General
                        </button>
                    </li>
                    <li
                        className={
                            selectedSection == SelectedMenuItem.Appearance
                                ? 'selected-menu-item'
                                : ''
                        }
                    >
                        <button
                            onClick={(e) =>
                                setSelectedSection(SelectedMenuItem.Appearance)
                            }
                        >
                            Appearance
                        </button>
                    </li>
                    <li
                        className={
                            selectedSection == SelectedMenuItem.Behavior
                                ? 'selected-menu-item'
                                : ''
                        }
                    >
                        <button
                            onClick={(e) =>
                                setSelectedSection(SelectedMenuItem.Behavior)
                            }
                        >
                            Behavior
                        </button>
                    </li>
                    <li
                        className={
                            selectedSection == SelectedMenuItem.Updates
                                ? 'selected-menu-item'
                                : ''
                        }
                    >
                        <button
                            onClick={(e) =>
                                setSelectedSection(SelectedMenuItem.Updates)
                            }
                        >
                            Updates
                        </button>
                    </li>
                    <li>
                        <span className="list-subheading">TTS</span>
                        <ul>
                            <li
                                className={
                                    selectedSection ==
                                    SelectedMenuItem.TTSVoices
                                        ? 'selected-menu-item'
                                        : ''
                                }
                            >
                                <button
                                    onClick={(e) =>
                                        setSelectedSection(
                                            SelectedMenuItem.TTSVoices
                                        )
                                    }
                                >
                                    Voices
                                </button>
                            </li>
                            <li
                                className={
                                    selectedSection ==
                                    SelectedMenuItem.TTSEngines
                                        ? 'selected-menu-item'
                                        : ''
                                }
                            >
                                <button
                                    onClick={(e) =>
                                        setSelectedSection(
                                            SelectedMenuItem.TTSEngines
                                        )
                                    }
                                >
                                    Engines
                                </button>
                            </li>
                            <li
                                className={
                                    selectedSection ==
                                    SelectedMenuItem.TTSMoreOptions
                                        ? 'selected-menu-item'
                                        : ''
                                }
                            >
                                <button
                                    onClick={(e) =>
                                        setSelectedSection(
                                            SelectedMenuItem.TTSMoreOptions
                                        )
                                    }
                                >
                                    More options
                                </button>
                            </li>
                        </ul>
                    </li>
                </ul>
            </nav>
            <form className="settings-form">
                <div className="fields">
                    {selectedSection == SelectedMenuItem.General ? (
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
                    ) : selectedSection == SelectedMenuItem.Appearance ? (
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
                                value={newSettings.colorScheme}
                            >
                                {Object.entries(ColorScheme).map(
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
                    ) : selectedSection == SelectedMenuItem.Behavior ? (
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
                                    value={
                                        newSettings.appStateOnClosingMainWindow
                                    }
                                >
                                    {Object.entries(
                                        ClosingMainWindowActionForApp
                                    ).map(([k, v]: [string, string]) => {
                                        return (
                                            <option key={k} value={k}>
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
                                    value={
                                        newSettings.jobsStateOnClosingMainWindow
                                    }
                                >
                                    {Object.entries(
                                        ClosingMainWindowActionForJobs
                                    ).map(([k, v]: [string, string]) => {
                                        return (
                                            <option key={k} value={k}>
                                                {v}
                                            </option>
                                        )
                                    })}
                                </select>
                            </div>
                            {/* insert local pipeline settings form part here */}
                            {/* insert remote pipeline settings form part here */}
                        </>
                    ) : selectedSection == SelectedMenuItem.Updates ? (
                        <div className="form-field">
                            <label className="oneline">
                                <input
                                    id="autoCheckUpdate"
                                    type="checkbox"
                                    checked={newSettings.autoCheckUpdate}
                                    onChange={autoCheckUpdateChanged}
                                />
                                <span>Check for updates in background</span>
                            </label>
                            <span className="description">
                                Choose here if you want to keep the application
                                checking for updates in the background.
                            </span>
                        </div>
                    ) : selectedSection == SelectedMenuItem.TTSVoices ? (
                        <div className="tts-voices-config">
                            <TtsVoicesConfigPane
                                availableVoices={pipeline.ttsVoices}
                                userPreferredVoices={
                                    newSettings.ttsConfig.preferredVoices
                                }
                                onChangePreferredVoices={
                                    onTtsVoicesPreferenceChange
                                }
                            />
                        </div>
                    ) : selectedSection == SelectedMenuItem.TTSEngines ? (
                        <div className="tts-engines-config">
                            <TtsEnginesConfigPane
                                ttsEngineProperties={
                                    newSettings.ttsConfig.ttsEngineProperties
                                }
                                onChangeTtsEngineProperties={
                                    onTtsEnginePropertiesChange
                                }
                            />
                        </div>
                    ) : selectedSection == SelectedMenuItem.TTSMoreOptions ? (
                        <div className="tts-more-options">
                            <TtsMoreOptionsConfigPane
                                ttsEngineProperties={
                                    newSettings.ttsConfig.ttsEngineProperties
                                }
                                onChangeTtsEngineProperties={
                                    onTtsEnginePropertiesChange
                                }
                            />
                        </div>
                    ) : (
                        ''
                    )}
                </div>
                <div className="save-settings">
                    <button
                        id="save-settings"
                        type="submit"
                        onClick={() => window.close()}
                        className="save-button"
                        // disabled={
                        //     JSON.stringify({ ...settings }) !=
                        //     JSON.stringify({ ...newSettings })
                        // }
                    >
                        Close
                    </button>
                    {/* {saved ? (
                        <span className="confirm-save" aria-live="polite">
                            Saved
                        </span>
                    ) : (
                        ''
                    )} */}
                </div>
            </form>
        </div>
    )
}
