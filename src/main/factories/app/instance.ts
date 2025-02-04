import { app } from 'electron'

import { spawn } from 'child_process'

export function makeAppWithSingleInstanceLock(fn: () => void) {
    const isPrimaryInstance = app.requestSingleInstanceLock()
    if (
        (process.argv.includes('--bg') || process.argv.includes('cli')) &&
        isPrimaryInstance
    ) {
        // launch a separate instance
        app.quit()
        const isElectron = process.argv[0]
            .replaceAll('.exe', '')
            .endsWith('electron')
        console.log('launching the pipeline app in the background')
        const appLaunchArgs = isElectron
            ? [...process.argv.slice(0, 2)]
            : process.argv.slice(0, 1)
        spawn(
            appLaunchArgs[0],
            [...(isElectron ? appLaunchArgs.slice(1) : []), '--hidden'],
            {
                cwd: process.cwd(),
                detached: true,
                shell: isElectron,
                stdio: 'ignore',
            }
        )
        // wait 5 seconds to ensure the app is launched
    } else {
        !isPrimaryInstance ? app.quit() : fn()
    }
}
