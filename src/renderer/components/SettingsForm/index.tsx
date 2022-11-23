import styles from './styles.module.sass'
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
            <form className={styles.settingsForm}>
                <FileOrFolderField
                    item={{
                        type: 'anyDirURI',
                        name: 'download folder',
                        nicename: 'Default results folder',
                        desc: 'A folder where all jobs will be automatically downloaded',
                        kind: 'input',
                        useSystemPath: false,
                    }}
                    selectedValue={newSettings.downloadFolder}
                    handleSelection={downloadFolderChanged}
                />
                {/* insert local pipeline settings form part here */}
                {/* insert remote pipeline settings form part here */}
                <button
                    id="save-settings"
                    onClick={handleSave}
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
