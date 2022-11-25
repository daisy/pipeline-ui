import { useEffect, useState } from 'react'
import { useWindowStore } from 'renderer/store'
import { ApplicationSettings } from 'shared/types'
import { FileOrFolderField } from '../CustomFields/FileOrFolderField'

const { App } = window // The "App" comes from the bridge

export function SettingsForm() {
    // Current registered settings
    const { settings } = useWindowStore()
    // Copy settings in new settings
    const [newSettings, setNewSettings] = useState<ApplicationSettings>({
        ...settings,
    })
    useEffect(() => {
        setNewSettings({
            ...settings,
        })
    }, [settings])
    // Changed folder
    const downloadFolderChanged = (filename) => {
        setNewSettings({
            ...newSettings,
            downloadFolder: filename,
        })
    }

    // send back the settings for being save on disk
    const handleSave = () => {
        App.saveSettings(newSettings)
    }
    return (
        <>
            <form className="settings-form">
                <FileOrFolderField
                    options={['openFolder']}
                    elemId="downloadFolder"
                    mediaType={['']}
                    name={'Download folder'}
                    onSelect={downloadFolderChanged}
                    useSystemPath={false}
                />
                {/* insert local pipeline settings form part here */}
                {/* insert remote pipeline settings form part here */}
                <button
                    id="save-settings"
                    onClick={handleSave}
                    className="save-button"
                    // disabled={
                    //     JSON.stringify({ ...settings }) !=
                    //     JSON.stringify({ ...newSettings })
                    // }
                >
                    Save
                </button>
            </form>
        </>
    )
}
