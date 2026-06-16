import { app } from 'electron'

import { spawn } from 'child_process'
import { existsSync } from 'fs'
import { readSettings } from 'main/data/settings'
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

export const reservedFlag = ['--bg', '--hidden']
export const settingsCommands = [
    'browse-voices',
    'preferred-voices',
    'external-services',
]
const electronOptions = ['--remote-debugging-port']

export function isOpenFileArg(arg: string) {
    return (
        ['.epub', '.opf'].some((ext) => arg.toLowerCase().endsWith(ext)) &&
        existsSync(arg)
    )
}

// A dp2 command starts with a script name (a non-flag token that isn't a file),
// e.g. `script-name --param value`. When that's why the app launched, forward
// everything to dp2 and skip the open-file flow.
export function isCliCommand(args: string[]) {
    return args.some((arg) => !arg.startsWith('--') && !isOpenFileArg(arg))
}

// Strip the executable prefix and the flags the app handles itself, leaving the
// user-provided arguments. Works on a process' own argv or on the commandLine
// reported by the 'second-instance' event.
export function parseCommandLineArgs(argv: string[]): string[] {
    if (!argv || argv.length === 0) {
        return []
    }
    const isElectron = argv[0]
        .replaceAll('.exe', '')
        .toLowerCase()
        .endsWith('electron')
    return argv
        .slice(isElectron ? 2 : 1)
        .filter(
            (arg) =>
                !reservedFlag.includes(arg) && !settingsCommands.includes(arg)
        )
        .filter(
            (arg) => electronOptions.filter((e) => arg.startsWith(e)).length == 0
        )
}

export function makeAppWithSingleInstanceLock(fn: () => void) {
    let isElectron = false
    let commandLineArgs = []
    let cliArgs = []
    let appLaunchArgs = []
    if (process.argv) {
        isElectron = process.argv[0]
            .replaceAll('.exe', '')
            .toLowerCase()
            .endsWith('electron')
        appLaunchArgs = process.argv.slice(0, isElectron ? 2 : 1)
        commandLineArgs = parseCommandLineArgs(process.argv)
        cliArgs = isCliCommand(commandLineArgs) ? commandLineArgs : []
    }
    // NOTE: do NOT pass additionalData here.
    // requestSingleInstanceLock({ argv }) with argv.length >= 9 causes kill/restart behavior. 
    // The second-instance handler reads the args from its `commandLine` parameter instead.
    const isPrimaryInstance = app.requestSingleInstanceLock()
    const startingTime = isPrimaryInstance ? Date.now() : 0
    if (isPrimaryInstance) {
        // basic initialisation of the app if
        // it does not have cli args or background launch is not requested
        if (cliArgs.length == 0 && !process.argv.includes('--bg')) {
            app.dock?.show()
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
                ...(cliArgs.length > 0 || process.argv.includes('--hidden')
                    ? ['--hidden']
                    : []),
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
    if (cliArgs.length > 0) {
        getWebserviceFromSettings(10, startingTime)
            .then((webservice) => {
                runCliTool(webservice, cliArgs)
            })
            .catch((error) => {
                console.error('Error:', error)
            })
    }
}
