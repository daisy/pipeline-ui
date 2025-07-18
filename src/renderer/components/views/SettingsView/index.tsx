import { useEffect, useState } from 'react'
import { useWindowStore } from 'renderer/store'
import {
    ApplicationSettings,
    ClosingMainWindowAction,
    ColorScheme,
} from 'shared/types'
import {
    save,
    setTtsConfig,
    setDownloadPath,
    setColorScheme,
    setAutoCheckUpdate,
    setClosingMainWindowAction,
    setEditJobOnNewTab,
} from 'shared/data/slices/settings'

import { TtsEnginesConfigPane } from '../../TtsConfig/Engines'
import { TtsMoreOptionsConfigPane } from '../../TtsConfig/MoreOptions'
import { TtsBrowseVoicesConfigPane } from '../../TtsConfig/BrowseVoices'
import { TtsPreferredVoicesConfigPane } from '../../TtsConfig/PreferredVoices'
import { SingleFileInput } from 'renderer/components/Widgets/SingleFileInput'

const { App } = window // The "App" comes from the bridge

export enum SettingsMenuItem {
    General = '/general',
    Appearance = '/appearance',
    Behavior = '/behavior',
    Updates = '/updates',
    TTSBrowseVoices = '/browse-voices',
    TTSPreferredVoices = '/preferred-voices',
    TTSEngines = '/engines',
    TTSMoreOptions = '/more-options',
}

export const SettingsMenuItems = Object.values(SettingsMenuItem).filter(
    (item) => typeof item === 'string'
)
type VoiceFilter = { id: string; value: string }

type SettingsViewProps = {
    selectedItem?: SettingsMenuItem
}

export function SettingsView(
    props: SettingsViewProps = {
        selectedItem: SettingsMenuItem.General,
    }
) {
    // Current registered settings
    const { settings, pipeline } = useWindowStore()

    // Copy settings in new settings for update
    // (without affecting the rest of the app)
    const [newSettings, setNewSettings] = useState<ApplicationSettings>({
        ...settings,
        onClosingMainWindow: settings.onClosingMainWindow ?? 'ask', // defaults to ask in form
        ttsConfig: {
            ...settings.ttsConfig,
        },
    })
    //const [saved, setSaved] = useState(true)
    useEffect(() => {
        // Reload settings from store if it has changed
        setNewSettings({
            ...settings,
            onClosingMainWindow: settings.onClosingMainWindow ?? 'ask', // defaults to ask in form
            ttsConfig: {
                ...settings.ttsConfig,
            },
        })
    }, [settings])

    // NP 2025 06 10 : replaced by hash router
    // const [selectedSection, setSelectedSection] = useState(
    //     SelectedMenuItem.General
    // )
    const selectedSection = props.selectedItem ?? SettingsMenuItem.General
    const setSelectedSection = (section: SettingsMenuItem) => {
        // see the routes/index.tsx for the corresponding hash router
        window.location.hash = '#/settings' + section
    }

    const [voiceFilters, setVoiceFilters] = useState([])

    // Changed folder
    const resultsFolderChanged = (filename) => {
        App.store.dispatch(setDownloadPath(filename[0]))
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
    const autoCheckUpdateChanged = (e) => {
        App.store.dispatch(setAutoCheckUpdate(e.target.checked))
        App.store.dispatch(save())
    }

    const editJobOnNewTabChanged = (e) => {
        App.store.dispatch(setEditJobOnNewTab(e.target.checked))
        App.store.dispatch(save())
    }

    const onTtsVoicesPreferenceChange = (voices) => {
        const newConfig = {
            preferredVoices: [...voices],
            defaultVoices: [...settings.ttsConfig.defaultVoices],
            ttsEngineProperties: [...settings.ttsConfig.ttsEngineProperties],
            xmlFilepath: newSettings.ttsConfig.xmlFilepath,
        }
        App.store.dispatch(setTtsConfig(newConfig))
        App.store.dispatch(save())
        //setSaved(true)
    }
    const onTtsVoicesDefaultsChange = (voices) => {
        const newConfig = {
            preferredVoices: [...settings.ttsConfig.preferredVoices],
            defaultVoices: [...voices],
            ttsEngineProperties: [...settings.ttsConfig.ttsEngineProperties],
            xmlFilepath: newSettings.ttsConfig.xmlFilepath,
        }
        App.store.dispatch(setTtsConfig(newConfig))
        App.store.dispatch(save())
    }
    const onTtsEnginePropertiesChange = (ttsEngineProperties) => {
        const newConfig = {
            preferredVoices: [...settings.ttsConfig.preferredVoices],
            defaultVoices: [...settings.ttsConfig.defaultVoices],
            ttsEngineProperties: [...ttsEngineProperties],
            xmlFilepath: newSettings.ttsConfig.xmlFilepath,
        }
        App.store.dispatch(setTtsConfig(newConfig))
        App.store.dispatch(save())
        //setSaved(true)
    }
    const onTtsVoiceFiltersChange = (vf: VoiceFilter[]) => {
        setVoiceFilters(vf)
    }
    return (
        <div className="settings">
            <nav className="settings-menu">
                <ul>
                    <li
                        className={
                            selectedSection == SettingsMenuItem.General
                                ? 'selected-menu-item'
                                : ''
                        }
                    >
                        <button
                            onClick={(e) =>
                                setSelectedSection(SettingsMenuItem.General)
                            }
                        >
                            General
                        </button>
                    </li>
                    <li
                        className={
                            selectedSection == SettingsMenuItem.Appearance
                                ? 'selected-menu-item'
                                : ''
                        }
                    >
                        <button
                            onClick={(e) =>
                                setSelectedSection(SettingsMenuItem.Appearance)
                            }
                        >
                            Appearance
                        </button>
                    </li>
                    <li
                        className={
                            selectedSection == SettingsMenuItem.Behavior
                                ? 'selected-menu-item'
                                : ''
                        }
                    >
                        <button
                            onClick={(e) =>
                                setSelectedSection(SettingsMenuItem.Behavior)
                            }
                        >
                            Behavior
                        </button>
                    </li>
                    <li
                        className={
                            selectedSection == SettingsMenuItem.Updates
                                ? 'selected-menu-item'
                                : ''
                        }
                    >
                        <button
                            onClick={(e) =>
                                setSelectedSection(SettingsMenuItem.Updates)
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
                                    SettingsMenuItem.TTSBrowseVoices
                                        ? 'selected-menu-item'
                                        : ''
                                }
                            >
                                <button
                                    onClick={(e) =>
                                        setSelectedSection(
                                            SettingsMenuItem.TTSBrowseVoices
                                        )
                                    }
                                >
                                    Browse Voices
                                </button>
                            </li>
                            <li
                                className={
                                    selectedSection ==
                                    SettingsMenuItem.TTSPreferredVoices
                                        ? 'selected-menu-item'
                                        : ''
                                }
                            >
                                <button
                                    onClick={(e) =>
                                        setSelectedSection(
                                            SettingsMenuItem.TTSPreferredVoices
                                        )
                                    }
                                >
                                    Preferred Voices
                                </button>
                            </li>
                            <li
                                className={
                                    selectedSection ==
                                    SettingsMenuItem.TTSEngines
                                        ? 'selected-menu-item'
                                        : ''
                                }
                            >
                                <button
                                    onClick={(e) =>
                                        setSelectedSection(
                                            SettingsMenuItem.TTSEngines
                                        )
                                    }
                                >
                                    Engines
                                </button>
                            </li>
                            <li
                                className={
                                    selectedSection ==
                                    SettingsMenuItem.TTSMoreOptions
                                        ? 'selected-menu-item'
                                        : ''
                                }
                            >
                                <button
                                    onClick={(e) =>
                                        setSelectedSection(
                                            SettingsMenuItem.TTSMoreOptions
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
                    {selectedSection == SettingsMenuItem.General ? (
                        <div className="form-field">
                            <label htmlFor="resultsFolder">
                                Results folder
                            </label>
                            <span className="description">
                                A folder where all job results will be
                                automatically downloaded
                            </span>
                            <SingleFileInput
                                allowFile={false}
                                allowFolder={true}
                                onChange={resultsFolderChanged}
                                initialValue={[newSettings.downloadFolder]}
                                required={true}
                                elemId="results-folder"
                            />
                            {newSettings.downloadFolder == '' ? (
                                <span className="warning">
                                    This field cannot be empty.
                                </span>
                            ) : (
                                ''
                            )}
                        </div>
                    ) : selectedSection == SettingsMenuItem.Appearance ? (
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
                    ) : selectedSection == SettingsMenuItem.Behavior ? (
                        <>
                            <div className="form-field">
                                <label htmlFor="editJobOnNewTab">
                                    Editing jobs in new tabs
                                </label>
                                <span className="description">
                                    If checked, editing a job will open a
                                    pre-filled new job instead of reusing the
                                    existing job.
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
                                    Choose here if you want to keep the
                                    application running in the tray or quit the
                                    application when closing the jobs window.
                                    <br />
                                    If the application should stay in the tray,
                                    you can choose if you want to keep jobs
                                    opened or if they should be closed when the
                                    window is closed.
                                </span>
                                <select
                                    id="OnMainWindowClosing"
                                    onChange={(e) => ClosingActionChanged(e)}
                                    value={newSettings.onClosingMainWindow}
                                >
                                    {Object.entries(
                                        ClosingMainWindowAction
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
                    ) : selectedSection == SettingsMenuItem.Updates ? (
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
                    ) : selectedSection == SettingsMenuItem.TTSBrowseVoices ? (
                        <div className="tts-browse-voices">
                            {pipeline.ttsVoices ? (
                                <TtsBrowseVoicesConfigPane
                                    availableVoices={pipeline.ttsVoices}
                                    userPreferredVoices={
                                        newSettings.ttsConfig.preferredVoices
                                    }
                                    onChangePreferredVoices={
                                        onTtsVoicesPreferenceChange
                                    }
                                    ttsEnginesStates={pipeline.ttsEnginesStates}
                                    onChangeVoiceFilters={
                                        onTtsVoiceFiltersChange
                                    }
                                    voiceFilters={voiceFilters}
                                />
                            ) : (
                                <p>Loading voices...</p>
                            )}
                        </div>
                    ) : selectedSection ==
                      SettingsMenuItem.TTSPreferredVoices ? (
                        <div className="tts-preferred-voices">
                            {pipeline.ttsVoices ? (
                                <TtsPreferredVoicesConfigPane
                                    ttsEnginesStates={pipeline.ttsEnginesStates}
                                    userPreferredVoices={
                                        newSettings.ttsConfig.preferredVoices
                                    }
                                    userDefaultVoices={
                                        newSettings.ttsConfig.defaultVoices
                                    }
                                    onChangePreferredVoices={
                                        onTtsVoicesPreferenceChange
                                    }
                                    onChangeDefaultVoices={
                                        onTtsVoicesDefaultsChange
                                    }
                                />
                            ) : (
                                <p>Loading voices...</p>
                            )}
                        </div>
                    ) : selectedSection == SettingsMenuItem.TTSEngines ? (
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
                    ) : selectedSection == SettingsMenuItem.TTSMoreOptions ? (
                        <div className="tts-more-options">
                            <TtsMoreOptionsConfigPane
                                ttsEngineProperties={
                                    newSettings.ttsConfig.ttsEngineProperties
                                }
                                ttsEnginesStates={pipeline.ttsEnginesStates}
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
