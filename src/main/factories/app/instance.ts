import { app } from 'electron'

import { spawn } from 'child_process'
import { readSettings } from 'main/data/middlewares'
import { runCliTool } from './cli'

async function getWebserviceFromSettings(remain: number, startingTime: number) {
    if (remain == 0) {
        throw new Error('Max attempts reached')
    } else {
        try {
            const settings = readSettings()
            if (
                settings?.pipelineInstanceProps?.webservice?.lastStart >
                startingTime
            ) {
                return settings?.pipelineInstanceProps?.webservice
            }
        } catch (error) {}
        const test = Date.now()
        // Does not work but i don't know why ... possibly an issue
        // with my nodejs version
        // ugly but it works to check every 3 seconds
        do {} while (Date.now() - test < 3000)
        return await getWebserviceFromSettings(remain - 1, startingTime)
    }
}

const reservedFlag = ['--bg', '--hidden']

export function makeAppWithSingleInstanceLock(fn: () => void) {
    let isElectron = false
    let commandLineArgs = []
    let appLaunchArgs = []
    if (process.argv) {
        isElectron = process.argv[0].replaceAll('.exe', '').endsWith('electron')
        appLaunchArgs = process.argv.slice(0, isElectron ? 2 : 1)
        commandLineArgs = process.argv
            .slice(isElectron ? 2 : 1)
            .filter((arg) => !reservedFlag.includes(arg))
    }
    const isPrimaryInstance = app.requestSingleInstanceLock({
        argv: commandLineArgs,
    })
    const startingTime = isPrimaryInstance ? Date.now() : 0
    if (isPrimaryInstance) {
        // basic initialisation of the app if
        // it does not have cli args or background launch is not requested
        if (commandLineArgs.length == 0 && !process.argv.includes('--bg')) {
            fn()
        } else {
            // Command line args are reported or the background launch is requested
            // Quit the app so that it can be launched in the background
            // in a separate process
            app.quit()
            // launch the app in the background
            const bgInstanceArgs = [
                // Launch commands for electron
                ...(isElectron ? [appLaunchArgs[1]] : []),
                // If command line arguments are provided (for cli usage),
                // launch the app in hidden mode
                ...(commandLineArgs.length > 0 ? ['--hidden'] : []),
            ]
            console.log(
                'Launching the app in the background and wait for the webservice ...'
            )
            // launch the app in detached mode in a separate process
            const child = spawn(appLaunchArgs[0], bgInstanceArgs, {
                cwd: process.cwd(),
                env: process.env,
                detached: !isElectron,
                shell: isElectron,
                stdio: 'ignore',
            })
        }
    } else {
        // We are launching a secondary instance
        // Do not continue the original app launch
        app.quit()
    }
    if (commandLineArgs.length > 0) {
        getWebserviceFromSettings(10, startingTime)
            .then((webservice) => {
                runCliTool(webservice, commandLineArgs)
            })
            .catch((error) => {
                console.error('Error:', error)
            })
    }
}
