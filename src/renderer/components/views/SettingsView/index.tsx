import { useEffect, useState } from 'react'
import { useWindowStore } from 'renderer/store'
import { ApplicationSettings } from 'shared/types'
import { save, setTtsConfig } from 'shared/data/slices/settings'

import { Engines } from './Engines'
import { MoreTTSOptions } from './MoreTTSOptions'
import { BrowseVoices } from './BrowseVoices'
import { PreferredVoices } from './PreferredVoices'
import { ID } from 'renderer/utils'
import { TabList } from 'renderer/components/Widgets/TabList'
import { General } from './General'
import { Appearance } from './Appearance'
import { Behavior } from './Behavior'
import { Updates } from './Updates'

const { App } = window

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

    const onTtsVoicesPreferenceChange = (voices) => {
        const newConfig = {
            preferredVoices: [...voices],
            defaultVoices: [...settings.ttsConfig.defaultVoices],
            ttsEngineProperties: [...settings.ttsConfig.ttsEngineProperties],
            xmlFilepath: newSettings.ttsConfig.xmlFilepath,
        }
        App.store.dispatch(setTtsConfig(newConfig))
        App.store.dispatch(save())
    }
    const onTtsVoicesDefaultsChange = (voices) => {
        // make sure the default voices are also preferred voices
        let tmpVoices = [...voices]
        tmpVoices = tmpVoices.filter((vx) =>
            settings.ttsConfig.preferredVoices.find((v) => v.id == vx.id)
        )

        const newConfig = {
            preferredVoices: [...settings.ttsConfig.preferredVoices],
            defaultVoices: [...tmpVoices],
            ttsEngineProperties: [...settings.ttsConfig.ttsEngineProperties],
            xmlFilepath: newSettings.ttsConfig.xmlFilepath,
        }
        App.store.dispatch(setTtsConfig(newConfig))
        App.store.dispatch(save())
    }
    const onTtsVoicesPreferredAndDefaultChange = (
        preferredVoices,
        defaultVoices
    ) => {
        // make sure the default voices are also preferred voices
        let tmpVoices = [...defaultVoices]
        tmpVoices = tmpVoices.filter((vx) =>
            settings.ttsConfig.preferredVoices.find((v) => v.id == vx.id)
        )
        const newConfig = {
            preferredVoices: [...preferredVoices],
            defaultVoices: [...tmpVoices],
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
    }
    const onTtsVoiceFiltersChange = (vf: VoiceFilter[]) => {
        setVoiceFilters(vf)
    }

    let tabItems = [
        {
            label: 'General',
            section: SettingsMenuItem.General,
            markup: <General newSettings={newSettings} />,
        },
        {
            label: 'Appearance',
            section: SettingsMenuItem.Appearance,
            markup: <Appearance newSettings={newSettings} />,
        },
        {
            label: 'Behavior',
            section: SettingsMenuItem.Behavior,
            markup: <Behavior newSettings={newSettings} />,
        },
        {
            label: 'Updates',
            section: SettingsMenuItem.Updates,
            markup: <Updates newSettings={newSettings} />,
        },
        {
            label: 'Browse Voices',
            section: SettingsMenuItem.TTSBrowseVoices,
            markup: pipeline.ttsVoices ? (
                <BrowseVoices
                    availableVoices={pipeline.ttsVoices}
                    userPreferredVoices={newSettings.ttsConfig.preferredVoices}
                    onChangePreferredVoices={onTtsVoicesPreferenceChange}
                    ttsEnginesStates={pipeline.ttsEnginesStates}
                    onChangeVoiceFilters={onTtsVoiceFiltersChange}
                    voiceFilters={voiceFilters}
                />
            ) : (
                <p>Loading voices...</p>
            ),
        },
        {
            label: 'Preferred Voices',
            section: SettingsMenuItem.TTSPreferredVoices,
            markup: pipeline.ttsVoices ? (
                <PreferredVoices
                    ttsEnginesStates={pipeline.ttsEnginesStates}
                    userPreferredVoices={newSettings.ttsConfig.preferredVoices}
                    userDefaultVoices={newSettings.ttsConfig.defaultVoices}
                    onChangePreferredVoices={onTtsVoicesPreferenceChange}
                    onChangeDefaultVoices={onTtsVoicesDefaultsChange}
                    onChangePreferredAndDefaultVoices={
                        onTtsVoicesPreferredAndDefaultChange
                    }
                />
            ) : (
                <p>Loading voices...</p>
            ),
        },
        {
            label: 'TTS Engines',
            section: SettingsMenuItem.TTSEngines,
            markup: (
                <Engines
                    ttsEngineProperties={
                        newSettings.ttsConfig.ttsEngineProperties
                    }
                    onChangeTtsEngineProperties={onTtsEnginePropertiesChange}
                />
            ),
        },
        {
            label: 'More TTS Options',
            section: SettingsMenuItem.TTSMoreOptions,
            markup: (
                <MoreTTSOptions
                    ttsEngineProperties={
                        newSettings.ttsConfig.ttsEngineProperties
                    }
                    ttsEnginesStates={pipeline.ttsEnginesStates}
                    onChangeTtsEngineProperties={onTtsEnginePropertiesChange}
                />
            ),
        },
    ]
    let setFocus = (id) => document.getElementById(id)?.focus()
    let onKeyDown = (e) => {
        let selIdx = tabItems.findIndex(
            (item) => item.section == selectedSection
        )
        switch (e.key) {
            case 'ArrowDown':
                if (selIdx >= tabItems.length - 1 || selIdx < 0) {
                    setSelectedSection(tabItems[0].section)
                    setFocus(`${ID(0)}-tab`)
                } else {
                    setSelectedSection(tabItems[selIdx + 1].section)
                    setFocus(`${ID(selIdx + 1)}-tab`)
                }
                break
            case 'ArrowUp':
                if (selIdx <= 0 || selIdx > tabItems.length) {
                    setSelectedSection(tabItems[tabItems.length - 1].section)
                    setFocus(`${ID(tabItems.length - 1)}-tab`)
                } else {
                    setSelectedSection(tabItems[selIdx - 1].section)
                    setFocus(`${ID(selIdx - 1)}-tab`)
                }
                break
        }
    }

    let getSelectedItem = () =>
        tabItems.find((item) => item.section == selectedSection)
    return (
        <>
            <div className="sidebar">
                <h1>Settings</h1>
                <TabList
                    items={tabItems}
                    onKeyDown={onKeyDown}
                    getTabId={(item, idx) => `${ID(idx)}-tab`}
                    getTabAriaSelected={(item, idx) =>
                        getSelectedItem() == item
                    }
                    getTabIndex={(item, idx) =>
                        selectedSection == item.section ? 0 : -1
                    }
                    getTabAriaControls={(item, idx) => `${ID(idx)}-tabpanel`}
                    getTabTitle={(item, idx) => item.label}
                    getTabLabel={(item, idx) => <h2>{item.label}</h2>}
                    onTabClick={(item, idx) => {
                        setSelectedSection(item.section)
                        setFocus(`${ID(idx)}-tabpanel`)
                    }}
                ></TabList>
            </div>
            <div
                id={`${ID(selectedSection)}-tabpanel`}
                role="tabpanel"
                aria-labelledby={`${ID(selectedSection)}-tab`}
                tabIndex={0}
            >
                <form onSubmit={() => window.close()}>
                    <fieldset>{getSelectedItem().markup}</fieldset>
                    <div className="controls">
                        <button type="submit">Close</button>
                    </div>
                </form>
            </div>
            )
        </>
    )
}
