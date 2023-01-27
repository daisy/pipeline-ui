import { app, ipcMain, dialog } from 'electron'
import { resolve, delimiter, relative } from 'path'
import {
    Webservice,
    PipelineStatus,
    PipelineState,
    ApplicationSettings,
    PipelineInstanceProperties,
} from 'shared/types'
import { IPC } from 'shared/constants'
import { spawn, ChildProcessWithoutNullStreams } from 'child_process'
import { existsSync, mkdirSync, rmSync } from 'fs'

import { getAvailablePort, Pipeline2Error, walk } from './utils'

import { resolveUnpacked } from 'shared/utils'

import { info, error } from 'electron-log'

import { pathToFileURL } from 'url'

import { store } from 'main/data/store'
import {
    selectPipeline,
    selectStatus,
    setStatus,
    useWebservice,
} from 'shared/data/slices/pipeline'

/**
 * Local DAISY Pipeline 2 management class
 */
export class PipelineInstance {
    props: PipelineInstanceProperties
    messages: Array<string>
    messagesListeners: Map<string, (data: string) => void> = new Map<
        string,
        (data: string) => void
    >()

    errors: Array<string>
    errorsListeners: Map<string, (data: string) => void> = new Map<
        string,
        (data: string) => void
    >()

    private instance?: ChildProcessWithoutNullStreams
    /**
     *
     * @param parameters
     */
    constructor(props?: PipelineInstanceProperties) {
        const osAppDataFolder = app.getPath('userData')
        this.props = {
            localPipelineHome:
                (props && props.localPipelineHome) ??
                resolveUnpacked('resources', 'daisy-pipeline'),
            jrePath:
                (props && props.jrePath) ??
                resolveUnpacked('resources', 'daisy-pipeline', 'jre'),
            // Note : [49152 ; 65535] is the range of dynamic port,  0 is reserved for error case
            webservice: (props && props.webservice) ?? {
                host: '127.0.0.1', // Note : localhost resolve as ipv6 ':::' in nodejs, but we need ipv4 for the pipeline
                port: 0,
                path: '/ws',
            },
            appDataFolder:
                (props && props.appDataFolder) ?? app.getPath('userData'),
            logsFolder:
                (props && props.logsFolder) ??
                resolve(app.getPath('userData'), 'pipeline-logs'),
            onError: (props && props.onError) || error,
            onMessage: (props && props.onMessage) || info,
        }
        this.instance = null
        this.errors = []
        this.messages = []
        store.dispatch(setStatus(PipelineStatus.STOPPED))
    }

    /**
     * Change the webservice configuration (stop and restart the server if so)
     * @param webservice
     */
    updateWebservice(webservice: Webservice) {
        this.stop().then(() => {
            this.props.webservice = webservice
            this.launch()
        })
    }

    pushMessage(message: string) {
        this.messages.push(message)
        if (this.props.onMessage) {
            this.props.onMessage(message)
        }
        this.messagesListeners.forEach((callback) => {
            callback(message)
        })
    }
    pushError(message: string) {
        this.errors.push(message)
        if (this.props.onError) {
            this.props.onError(message)
        }
        this.errorsListeners.forEach((callback) => {
            callback(message)
        })
    }

    /**
     * Validating pipeline props after finding an opened port
     * @param port to be used to launch the pipeline
     */
    private validatedProps() {
        if (!this.props.webservice.port || this.props.webservice.port === 0) {
            throw new Pipeline2Error(
                'NO_PORT',
                'No valid port provided to launch the pipeline'
            )
        }
        if (this.props.jrePath === null || !existsSync(this.props.jrePath)) {
            throw new Pipeline2Error(
                'NO_JRE',
                'No jre found to launch the pipeline'
            )
        }

        if (
            this.props.localPipelineHome === null ||
            !existsSync(this.props.jrePath)
        ) {
            throw new Pipeline2Error(
                'NO_PIPELINE',
                'No pipeline installation found'
            )
        }
    }
    /**
     * Launch a local instance of the pipeline using the current webservice settings
     */
    async launch(): Promise<PipelineState> {
        if (
            !this.instance ||
            selectStatus(store.getState()) == PipelineStatus.STOPPED
        ) {
            // FIXME: Prune any existing jobs data on the server
            if (existsSync(resolve(this.props.appDataFolder, 'jobs'))) {
                rmSync(resolve(this.props.appDataFolder, 'jobs'), {
                    recursive: true,
                    force: true,
                })
            }
            store.dispatch(setStatus(PipelineStatus.STARTING))
            // Search for port to launch the pipeline
            if (
                this.props.webservice.port &&
                this.props.webservice.port !== 0
            ) {
                const savedPort = this.props.webservice.port
                info(
                    'Port',
                    this.props.webservice.port,
                    'requested, check for availability'
                )
                try {
                    await getAvailablePort(
                        this.props.webservice.port,
                        this.props.webservice.port,
                        this.props.webservice.host
                    )
                        .then((port) => {
                            this.props.webservice.port = port
                        })
                        .catch((err) => {
                            // propagate exception for now
                            throw err
                        })
                } catch (exception) {
                    this.pushError(exception)
                    // Reset to port 0 to auto scan
                    this.props.webservice.port = 0
                }
                if (this.props.webservice.port === 0) {
                    dialog.showMessageBox(null, {
                        message: `Port ${savedPort} requested in settings is not available.

The program will seek and use an available port instead.

If you need the port ${savedPort} to be used, please check if
- another DAISY Pipeline 2 server is running on this port
- another program is running and is using this port
Then close the program using the port and restart this application.`,
                        title: 'Requested port is not available',
                        type: 'warning',
                    })
                }
            }
            // If no port or port 0 is provided
            if (
                !this.props.webservice.port ||
                this.props.webservice.port === 0
            ) {
                info('No valid port provided, searching for a valid port')
                try {
                    await getAvailablePort(
                        49152,
                        65535,
                        this.props.webservice.host
                    )
                        .then((port) => {
                            this.props.webservice.port = port
                        })
                        .catch((err) => {
                            // propagate exception for now
                            throw err
                        })
                } catch (exception) {
                    this.pushError(exception)
                    // no port available, try to use the usual 8181
                    this.props.webservice.port = 8181
                }
            }
            this.validatedProps()
            info(
                `Launching pipeline on ${this.props.webservice.host}:${this.props.webservice.port}`
            )
            let ClassFolders = [
                resolve(this.props.localPipelineHome, 'system'),
                resolve(this.props.localPipelineHome, 'modules'),
            ]
            let jarFiles = ClassFolders.reduce(
                (acc: Array<string>, path: string) => {
                    existsSync(path) &&
                        acc.push(
                            ...walk(path, (name) => {
                                return name.endsWith('.jar')
                            })
                        )
                    return acc
                },
                []
            )
            let relativeJarFiles = jarFiles.reduce(
                (acc: Array<string>, path: string) => {
                    let relativeDirPath = relative(
                        this.props.localPipelineHome,
                        path
                    )
                    if (!acc.includes(relativeDirPath)) {
                        acc.push(relativeDirPath)
                    }
                    return acc
                },
                []
            )

            let JavaOptions = [
                '-server',
                '-Dcom.sun.management.jmxremote',
                '--add-opens=java.base/java.security=ALL-UNNAMED',
                '--add-opens=java.base/java.net=ALL-UNNAMED',
                '--add-opens=java.base/java.lang=ALL-UNNAMED',
                '--add-opens=java.base/java.util=ALL-UNNAMED',
                '--add-opens=java.naming/javax.naming.spi=ALL-UNNAMED',
                '--add-opens=java.rmi/sun.rmi.transport.tcp=ALL-UNNAMED',
                '--add-exports=java.base/sun.net.www.protocol.http=ALL-UNNAMED',
                '--add-exports=java.base/sun.net.www.protocol.https=ALL-UNNAMED',
                '--add-exports=java.base/sun.net.www.protocol.jar=ALL-UNNAMED',
                '--add-exports=jdk.xml.dom/org.w3c.dom.html=ALL-UNNAMED',
                '--add-exports=jdk.naming.rmi/com.sun.jndi.url.rmi=ALL-UNNAMED',
            ]

            let SystemProps = [
                '-Dorg.daisy.pipeline.properties="' +
                    resolve(
                        this.props.localPipelineHome,
                        'etc',
                        'pipeline.properties'
                    ) +
                    '"',
                // Logback configuration file
                '-Dlogback.configurationFile=' +
                    pathToFileURL(
                        resolve(
                            this.props.localPipelineHome,
                            'etc',
                            'config-logback.xml'
                        )
                    ).href +
                    '',
                // XMLCalabash base configuration file
                '-Dorg.daisy.pipeline.xproc.configuration="' +
                    resolve(
                        this.props.localPipelineHome,
                        'etc',
                        'config-calabash.xml'
                    ).replaceAll('\\', '/') +
                    '"',
                // Updater configuration
                '-Dorg.daisy.pipeline.updater.bin="' +
                    resolve(
                        this.props.localPipelineHome,
                        'updater',
                        'pipeline-updater'
                    ).replaceAll('\\', '/') +
                    '"',
                '-Dorg.daisy.pipeline.updater.deployPath="' +
                    this.props.localPipelineHome.replaceAll('\\', '/') +
                    '/"',
                '-Dorg.daisy.pipeline.updater.releaseDescriptor="' +
                    resolve(
                        this.props.localPipelineHome,
                        'etc',
                        'releaseDescriptor.xml'
                    ).replaceAll('\\', '/') +
                    '"',
                // Workaround for encoding bugs on Windows
                '-Dfile.encoding=UTF8',
                // to make ${org.daisy.pipeline.data}, ${org.daisy.pipeline.logdir} and ${org.daisy.pipeline.mode}
                // available in config-logback.xml and felix.properties
                // note that config-logback.xml is the only place where ${org.daisy.pipeline.mode} is used
                '-Dorg.daisy.pipeline.data=' + this.props.appDataFolder + '',
                '-Dorg.daisy.pipeline.logdir=' + this.props.logsFolder + '',
                '-Dorg.daisy.pipeline.mode=webservice',
                '-Dorg.daisy.pipeline.ws.localfs=true',
                '-Dorg.daisy.pipeline.ws.authentication=false',
                '-Dorg.daisy.pipeline.ws.host=' + this.props.webservice.host,
                '-Dorg.daisy.pipeline.ws.cors=true',
            ]
            if (this.props.webservice.path) {
                SystemProps.push(
                    '-Dorg.daisy.pipeline.ws.path=' + this.props.webservice.path
                )
            }
            if (this.props.webservice.port) {
                SystemProps.push(
                    '-Dorg.daisy.pipeline.ws.port=' + this.props.webservice.port
                )
            }

            if (
                !existsSync(this.props.appDataFolder) &&
                mkdirSync(this.props.appDataFolder, { recursive: true })
            ) {
                this.pushMessage(`${this.props.appDataFolder} created`)
            } else {
                this.pushMessage(
                    `Using existing ${this.props.appDataFolder} as pipeline data folder`
                )
            }

            if (
                !existsSync(this.props.logsFolder) &&
                mkdirSync(this.props.logsFolder, { recursive: true })
            ) {
                this.pushMessage(`${this.props.logsFolder} created`)
            } else {
                this.pushMessage(
                    `Using existing ${this.props.logsFolder} for pipeline logs`
                )
            }
            // avoid using bat to control the runner ?
            // Spawn pipeline process
            let command = resolve(this.props.jrePath, 'bin', 'java')
            let args = [
                ...JavaOptions,
                ...SystemProps,
                '-classpath',
                `"${delimiter}${relativeJarFiles.join(delimiter)}${delimiter}"`,
                'org.daisy.pipeline.webservice.impl.PipelineWebService',
            ]
            this.pushMessage(
                `Launching the local pipeline with the following command :
${command} ${args.join(' ')}`
            )
            this.instance = spawn(command, args, {
                cwd: this.props.localPipelineHome,
            })
            // NP Replace stdout analysis by webservice monitoring
            this.instance.stdout.on('data', (data) => {
                // Removing logging on nodejs side,
                // as logging is already done in the pipeline side
                //
                // we might read the pipeline logs
                // or check in the API if there is some logs entry point
                //this.pushMessage(`${data.toString()}`)
            })
            this.instance.stderr.on('data', (data) => {
                // keep error logging in case of error raised by the pipeline instance
                // NP : problem found on the pipeline, the webservice messages are also outputed to the err stream
                //this.pushError(`${data.toString()}`)
            })
            this.instance.on('exit', (code, signal) => {
                let message = `Pipeline exiting with code ${code} and signal ${signal}`
                store.dispatch(setStatus(PipelineStatus.STOPPED))
                this.pushMessage(message)
                if (existsSync(resolve(this.props.appDataFolder, 'jobs'))) {
                    rmSync(resolve(this.props.appDataFolder, 'jobs'), {
                        recursive: true,
                        force: true,
                    })
                }
            })
            this.instance.on('close', (code: number, args: any[]) => {
                let message = `Pipeline closing with code: ${code} args: ${args}`
                store.dispatch(setStatus(PipelineStatus.STOPPED))
                this.pushMessage(message)
                if (existsSync(resolve(this.props.appDataFolder, 'jobs'))) {
                    rmSync(resolve(this.props.appDataFolder, 'jobs'), {
                        recursive: true,
                        force: true,
                    })
                }
            })
            store.dispatch(useWebservice(this.props.webservice))
        }
        return selectPipeline(store.getState())
    }

    /**
     * Stopping the pipeline
     */
    async stop(appIsClosing = false) {
        if (appIsClosing) {
            this.messagesListeners.clear()
            this.errorsListeners.clear()
        }
        if (this.instance) {
            info('closing pipeline')
            if (!this.instance.kill()) {
                this.instance.kill('SIGKILL')
            }
            store.dispatch(setStatus(PipelineStatus.STOPPED))
            if (existsSync(resolve(this.props.appDataFolder, 'jobs'))) {
                rmSync(resolve(this.props.appDataFolder, 'jobs'), {
                    recursive: true,
                    force: true,
                })
            }
            return
        }
    }

    /**
     * Add a listener on the messages stack
     * @param callerID the id of the element that register the listener
     * @param callback the function to run when a new message is added on the stack
     */
    registerMessagesListener(
        callerID: string,
        callback: (data: string) => void
    ) {
        this.messagesListeners.set(callerID, callback)
    }

    /**
     * Remove a listener on the messages stack
     * @param callerID the id of the caller which had registered the listener
     */
    removeMessageListener(callerID: string) {
        this.messagesListeners.delete(callerID)
    }

    /**
     * Add a listener on the error messages stack
     * @param callerID the id of the element that register the listener
     * @param callback the function to run when a new error message is added on the stack
     */
    registerErrorsListener(callerID: string, callback: (data: string) => void) {
        this.errorsListeners.set(callerID, callback)
    }

    /**
     * Remove a listener on the error messages stack
     * @param callerID the id of the caller which had registered the listener
     */
    removeErrorsListener(callerID: string) {
        this.errorsListeners.delete(callerID)
    }
}

/**
 * Register the management of a local pipeline instance to IPC for communication with selected windows
 * @returns the managed instance for supplemental bindings
 */
export function registerPipeline2ToIPC(
    settings?: ApplicationSettings
): PipelineInstance {
    // Instance managed through IPC calls within the app
    let pipeline2instance = new PipelineInstance(
        settings ? settings.localPipelineProps : undefined
    )
    // Update the instance if the settings are being updated
    ipcMain.on(
        IPC.WINDOWS.SETTINGS.UPDATE,
        (event, newSettings: ApplicationSettings) => {
            info('pipeline has received settings update')
            // Check if pipeline should be deactivated
            if (
                newSettings.runLocalPipeline == false &&
                selectStatus(store.getState()) != PipelineStatus.STOPPED
            ) {
                pipeline2instance.stop()
            } else {
                // TODO: restart the pipeline with updated settings if those have changed
                // pipeline2instance.stop().then(() => {
                //     if (newSettings.localPipelineProps) {
                //         pipeline2instance.props = {
                //             ...pipeline2instance.props,
                //             ...newSettings.localPipelineProps,
                //         }
                //     }
                //     pipeline2instance.launch()
                // })
            }
        }
    )
    // start the pipeline runner.
    ipcMain.on(IPC.PIPELINE.START, async (event, webserviceProps) => {
        // New settings requested with an existing instance :
        // Destroy the instance if new settings are requested
        if (webserviceProps) {
            pipeline2instance.updateWebservice(webserviceProps)
        }
        pipeline2instance.launch()
    })

    // Stop the pipeline instance
    ipcMain.on(IPC.PIPELINE.STOP, (event) => pipeline2instance.stop())

    // get state from the instance
    ipcMain.handle(IPC.PIPELINE.STATE.GET, (event) => {
        return selectPipeline(store.getState())
    })

    // get properties of the instance
    ipcMain.handle(IPC.PIPELINE.PROPS.GET, (event) => {
        return pipeline2instance.props || null
    })

    // get messages from the instance
    ipcMain.handle(IPC.PIPELINE.MESSAGES.GET, (event) => {
        return pipeline2instance.messages || null
    })
    // get errors from the instance
    ipcMain.handle(IPC.PIPELINE.ERRORS.GET, (event) => {
        return pipeline2instance.errors || null
    })

    // Launch the pipeline if requested in the settings
    if (!settings || (settings && settings.runLocalPipeline)) {
        pipeline2instance.launch()
    } else {
        console.log('not launching ??', settings)
    }

    return pipeline2instance
}
