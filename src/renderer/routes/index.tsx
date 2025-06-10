import { WindowRouter, Route } from './modules'

import {
    MainScreen,
    AboutScreen,
    SettingsScreen,
    SettingsMenuItem,
} from 'renderer/screens'

export function AppRoutes() {
    return (
        <WindowRouter
            routes={{
                main: () => (
                    <>
                        <Route path="/" element={<MainScreen />} />
                    </>
                ),
                about: () => <Route path="/" element={<AboutScreen />} />,
                settings: () => (
                    <>
                        <Route
                            path="/"
                            element={
                                <SettingsScreen
                                    selectedItem={SettingsMenuItem.General}
                                />
                            }
                        />
                        {...Object.values(SettingsMenuItem).map((key) => (
                            <Route
                                path={key}
                                element={
                                    <SettingsScreen
                                        selectedItem={key as SettingsMenuItem}
                                    />
                                }
                            />
                        ))}
                    </>
                ),
            }}
        />
    )
}
