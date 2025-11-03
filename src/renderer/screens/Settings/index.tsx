import { SettingsView, SettingsMenuItem } from 'renderer/components'
import { useWindowStore } from 'renderer/store'
import { loadStyleProperties } from 'renderer/utils'
export { SettingsMenuItem } from 'renderer/components'

export type SettingsScreenProps = {
    selectedItem?: SettingsMenuItem
}
export function SettingsScreen(
    props: SettingsScreenProps = {
        selectedItem: SettingsMenuItem.General,
    }
) {
    const { pipeline, settings } = useWindowStore()
    loadStyleProperties(settings)

    return (
        <main className="app-settings">
            <SettingsView selectedItem={props.selectedItem} title="Settings" />
        </main>
    )
}
