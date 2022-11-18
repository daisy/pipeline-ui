import React from 'react'
import { SettingsForm } from 'renderer/components/SettingsForm'

import styles from './styles.module.sass'

export function SettingsScreen() {
    return (
        <>
            <header>Settings</header>
            <main>
                <SettingsForm />
            </main>
        </>
    )
}
