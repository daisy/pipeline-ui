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
        <>
            <header>
                <h1>Settings</h1>
            </header>
            <main>
                <SettingsView selectedItem={props.selectedItem} />
            </main>
        </>
    )
}
