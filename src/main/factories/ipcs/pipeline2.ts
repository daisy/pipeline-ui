import { app, BrowserWindow, ipcMain } from 'electron'
import { resolve, delimiter, relative } from 'path'
import { APP_CONFIG } from '~/app.config'
import { Webservice, PipelineStatus, PipelineState } from 'shared/types'
import { IPC } from 'shared/constants'
import { setTimeout } from 'timers/promises'
import { spawn, ChildProcessWithoutNullStreams, exec } from 'child_process'
import { existsSync, readdirSync, statSync } from 'fs'

import { createServer } from 'net'
import { PipelineTray } from 'main/windows'
import { resolveUnpacked } from 'shared/utils'

import { info } from 'electron-log'

var walk = function (dir, filter?: (name: string) => boolean) {
    var results = []
    var list = readdirSync(dir)
    list.forEach(function (file) {
        file = resolve(dir, file)
        var stat = statSync(file)
        if (stat && stat.isDirectory()) {
            /* Recurse into a subdirectory */
            results = results.concat(walk(file))
        } else {
            /* Is a file */
            ;(!filter || filter(file)) && results.push(file)
        }
    })
    return results
}

/**
 * Properties for initializing ipc with the daisy pipeline 2
 *
 */
export interface Pipeline2IPCProps {
    /**
     * optional path of the local installation of the pipeline,
     *
     * defaults to the application resources/daisy-pipeline
     */
    localPipelineHome?: string

    appDataFolder?: string

    logsFolder?: string
    /**
     * optional path to the java runtime
     *
     * defaults to the application resource/jre folder
     */
    jrePath?: string

    /**
     * Webservice configuration to use for embedded pipeline,
     *
     * defaults to a localhost managed configuration :
     * ```js
     * {
     *      host: "localhost"
     *      port: 0, // will search for an available port on the current host when calling launch() the first time
     *      path: "/ws"
     * }
     * ```
     *
     */
    webservice?: Webservice

    /**
     *
     */
    onError?: (error: string) => void

    onMessage?: (message: string) => void
}

export class Pipeline2Error extends Error {
    name: string

    constructor(name: string, message?: string, options?: ErrorOptions) {
        super(message, options)
        this.name = name
    }
}

// Dev notes :
// - port seeking in nodejs default to ipv6 ':::' for unset or localhost hostname
// - ipv4 and 6 do not share ports (based on some tests, one app could listen to an ipv4 port while another listen to the same on the ipv6 side)
//
// Some comments on SOF say that hostname resolution is OS dependent, but some clues on github issues for nodejs
// states that the resolution for 'localhost' defaults to ipv6, starting a version of nodejs i can't remember the number

/**
 * seek for an opened port, or return null if none is available
 *
 * @param startPort
 * @param endPort
 * @param host optional hostname or ip adress (default to 127.0.0.1)
 */
const getAvailablePort = async (
    startPort: number,
    endPort: number,
    host: string = '127.0.0.1'
) => {
    let server = createServer()
    let portChecked = startPort
    let portOpened = 0

    // Port seeking : if port is in use, retry with a different port
    server.on('error', (err: NodeJS.ErrnoException) => {
        info(`Port ${portChecked.toString()} is not usable : `)
        info(err)
        portChecked += 1
        if (portChecked <= endPort) {
            info(' -> Checking for ' + portChecked.toString())
            server.listen(portChecked, host)
        } else {
            throw new Pipeline2Error(
                'NO_PORT',
                'No port available to host the pipeline webservice'
            )
        }
    })
    // Listening successfully on a port
    server.on('listening', (event) => {
        // close the server if listening a port succesfully
        server.close(() => {
            // select the port when the server is closed
            portOpened = portChecked
        })
        info(portChecked.toString() + ' is available')
    })
    // Start the port seeking
    server.listen(portChecked, host)
    while (portOpened == 0 && portChecked <= endPort) {
        await setTimeout(1000)
    }
    return portOpened
}

/**
 * [Pipeline2IPC description]
 */
export class Pipeline2IPC {
    props: Pipeline2IPCProps
    // Default state
    state: PipelineState
    stateListeners: Array<(data: PipelineState) => void> = []

    messages: Array<string>
    messagesListeners: Array<(data: string) => void> = []

    errors: Array<string>
    errorsListeners: Array<(data: string) => void> = []

    private instance?: ChildProcessWithoutNullStreams
    /**
     *
     * @param parameters
     */
    constructor(props?: Pipeline2IPCProps) {
        const osAppDataFolder =
            process.env.APPDATA ||
            (process.platform == 'darwin'
                ? process.env.HOME + '/Library/Preferences'
                : process.env.HOME + '/.local/share')
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
                (props && props.appDataFolder) ??
                resolve(osAppDataFolder, 'DAISY Pipeline 2'),
            logsFolder:
                (props && props.logsFolder) ??
                resolve(osAppDataFolder, 'DAISY Pipeline 2', 'log'),
            onError: (props && props.onError) || console.error,
            onMessage: (props && props.onMessage) || console.debug,
        }
        this.instance = null
        this.errors = []
        this.messages = []
        this.setState({
            status: PipelineStatus.STOPPED,
        })
    }

    /**
     * Change the webservice configuration (stop and restart the server if so)
     * @param webservice
     */
    updateWebservice(webservice: Webservice) {
        const isRunning = this.state.status !== PipelineStatus.STOPPED
        isRunning && this.stop()
        this.props.webservice = webservice
        isRunning && this.launch()
    }

    setState(newState: {
        runningWebservice?: Webservice
        status?: PipelineStatus
    }) {
        this.state = {
            runningWebservice:
                newState.runningWebservice ??
                (this.state && this.state.runningWebservice),
            status:
                newState.status ??
                ((this.state && this.state.status) || PipelineStatus.STOPPED),
        }
        this.stateListeners.forEach((callback) => {
            callback(this.state)
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
     * Launch a local instance of the pipeline using the current webservice settings
     */
    async launch(): Promise<PipelineState> {
        if (!this.instance || this.state.status == PipelineStatus.STOPPED) {
            this.setState({
                status: PipelineStatus.STARTING,
            })
            if (
                this.props.webservice.port !== undefined &&
                this.props.webservice.port === 0
            ) {
                info('Searching for an valid port')
                try {
                    await getAvailablePort(
                        49152,
                        65535,
                        this.props.webservice.host
                    )
                        .then(
                            ((port) => {
                                this.props.webservice.port = port
                                //
                                if (
                                    this.props.jrePath === null ||
                                    !existsSync(this.props.jrePath)
                                ) {
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
                            }).bind(this)
                        )
                        .catch((err) => {
                            // propagate exception for now
                            throw err
                        })
                } catch (error) {
                    this.pushError(error)
                    // no port available, try to use the usual 8181
                    this.props.webservice.port = 8181
                }
            }
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
                '-Dlogback.configurationFile="file:' +
                    resolve(
                        this.props.localPipelineHome,
                        'etc',
                        'config-logback.xml'
                    ).replace('\\', '/') +
                    '"',
                // XMLCalabash base configuration file
                '-Dorg.daisy.pipeline.xproc.configuration="' +
                    resolve(
                        this.props.localPipelineHome,
                        'etc',
                        'config-calabash.xml'
                    ).replace('\\', '/') +
                    '"',
                // Updater configuration
                '-Dorg.daisy.pipeline.updater.bin="' +
                    resolve(
                        this.props.localPipelineHome,
                        'updater',
                        'pipeline-updater'
                    ).replace('\\', '/') +
                    '"',
                '-Dorg.daisy.pipeline.updater.deployPath="' +
                    this.props.localPipelineHome.replace('\\', '/') +
                    '/"',
                '-Dorg.daisy.pipeline.updater.releaseDescriptor="' +
                    resolve(
                        this.props.localPipelineHome,
                        'etc',
                        'releaseDescriptor.xml'
                    ).replace('\\', '/') +
                    '"',
                // Workaround for encoding bugs on Windows
                '-Dfile.encoding=UTF8',
                // to make ${org.daisy.pipeline.data}, ${org.daisy.pipeline.logdir} and ${org.daisy.pipeline.mode}
                // available in config-logback.xml and felix.properties
                // note that config-logback.xml is the only place where ${org.daisy.pipeline.mode} is used
                '-Dorg.daisy.pipeline.data=' + this.props.appDataFolder + '',
                '-Dorg.daisy.pipeline.logdir="' + this.props.logsFolder + '"',
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
            this.instance = spawn(command, args, {
                cwd: this.props.localPipelineHome,
            })

            this.instance.stdout.on('data', (data) => {
                // marisa experiment: don't analyze stdout data if the pipeline is already up and running
                // checking each stdout message slows the UI to a crawl when the pipeline is outputting a lot of messages
                // (e.g. when it's running a job)
                if (this.state.status == PipelineStatus.RUNNING) {
                    return
                }

                let message: string = data.toString()
                // Webservice is started and pipeline is ready to run
                // Both formats of messages have been observed from the Pipeline
                // TODO: find out which one(s) to use
                if (
                    message.includes(
                        'PipelineWebService - component started'
                    ) ||
                    message.includes('WebService] component started')
                ) {
                    this.setState({
                        status: PipelineStatus.RUNNING,
                        runningWebservice: this.props.webservice,
                    })
                }
                this.pushMessage(message)
            })
            this.instance.stderr.on('data', (data) => {
                // marisa experiment: don't analyze stdout, see above for explanation
                // let error = data.toString()
                // this.pushError(error)
            })
            this.instance.on('exit', (code, signal) => {
                let message = `Pipeline exiting with code ${code} and signal ${signal}`
                this.setState({
                    status: PipelineStatus.STOPPED,
                })
                this.pushMessage(message)
            })
            this.instance.on('close', (code: number, args: any[]) => {
                let message = `Pipeline closing with code: ${code} args: ${args}`
                this.setState({
                    status: PipelineStatus.STOPPED,
                })
                this.pushMessage(message)
            })
            // */
            this.setState({
                status: PipelineStatus.STARTING,
                runningWebservice: this.props.webservice,
            })
        }
        return this.state
    }

    /**
     * Stopping the pipeline
     */
    async stop(appIsClosing = false) {
        if (appIsClosing) {
            this.stateListeners = []
            this.messagesListeners = []
            this.errorsListeners = []
        }
        if (this.instance) {
            info('closing pipeline')
            let finished = false
            finished = this.instance.kill()
            if (!finished) {
                this.instance.kill('SIGKILL')
            }
            this.instance = null
            this.setState({
                status: PipelineStatus.STOPPED,
            })
        }
    }

    registerStateListener(callback: (data: PipelineState) => void) {
        this.stateListeners.push(callback)
    }
    registerMessageListener(callback: (data: string) => void) {
        this.messagesListeners.push(callback)
    }
    registerErrorsListener(callback: (data: string) => void) {
        this.errorsListeners.push(callback)
    }
}

const bindInstanceToApplication = (
    pipeline2instance: Pipeline2IPC,
    boundedWindows: Array<BrowserWindow> = [],
    tray?: PipelineTray
) => {
    boundedWindows.forEach((window) => {
        pipeline2instance.registerStateListener((state) => {
            window &&
                window.webContents &&
                window.webContents.send(IPC.PIPELINE.STATE.CHANGED, state)
        })
        pipeline2instance.registerMessageListener((message) => {
            window &&
                window.webContents &&
                window.webContents.send(IPC.PIPELINE.MESSAGES.UPDATE, message)
        })
        pipeline2instance.registerErrorsListener((error) => {
            window &&
                window.webContents &&
                window.webContents.send(IPC.PIPELINE.ERRORS.UPDATE, error)
        })
        ipcMain.on(IPC.PIPELINE.STATE.SEND, (event) => {
            window &&
                window.webContents &&
                window.webContents.send(
                    IPC.PIPELINE.STATE.CHANGED,
                    pipeline2instance.state
                )
        })
    })
    tray && tray.bindToPipeline(pipeline2instance)
}

/**
 * Register the management of a pipeline instance to IPC for communication with selected windows
 * @param pipeline2instance global instance to manage
 * @param boundedWindows windows that are allowed to manage pipeline and/or get state updates
 *
 */
export function registerPipeline2ToIPC(
    pipeline2instance: Pipeline2IPC,
    boundedWindows: Array<BrowserWindow> = [],
    applicationTray?: PipelineTray
) {
    // start the pipeline runner.
    ipcMain.handle(IPC.PIPELINE.START, async (event, webserviceProps) => {
        // New settings requested with an existing instance :
        // Destroy the instance if new settings are requested
        if (webserviceProps) {
            pipeline2instance.updateWebservice(webserviceProps)
        }
        console.debug(IPC.PIPELINE.START)
        return pipeline2instance.launch()
    })

    // Stop the pipeline instance
    ipcMain.on(IPC.PIPELINE.STOP, (event) => pipeline2instance.stop())

    // get state from the instance
    ipcMain.handle(IPC.PIPELINE.STATE.GET, (event) => {
        console.debug(IPC.PIPELINE.STATE.GET)
        return pipeline2instance.state || null
    })

    ipcMain.handle(IPC.PIPELINE.PROPS.GET, (event) => {
        console.debug(IPC.PIPELINE.PROPS.GET)
        return pipeline2instance.props || null
    })

    // get messages from the instance
    ipcMain.handle(IPC.PIPELINE.MESSAGES.GET, (event) => {
        console.debug(IPC.PIPELINE.MESSAGES.GET)
        return pipeline2instance.messages || null
    })
    // get errors from the instance
    ipcMain.handle(IPC.PIPELINE.ERRORS.GET, (event) => {
        console.debug(IPC.PIPELINE.ERRORS.GET)
        return pipeline2instance.errors || null
    })

    // pipeline state listener
    bindInstanceToApplication(
        pipeline2instance,
        boundedWindows,
        applicationTray
    )
}
