import { SettingsView, SettingsMenuItem } from 'renderer/components'

export { SettingsMenuItem } from 'renderer/components'

export type SettingsScreenProps = {
    selectedItem?: SettingsMenuItem
}
export function SettingsScreen(
    props: SettingsScreenProps = {
        selectedItem: SettingsMenuItem.General,
    }
) {
    return (
        <main className="app-settings">
            <SettingsView selectedItem={props.selectedItem} />
        </main>
    )
}
