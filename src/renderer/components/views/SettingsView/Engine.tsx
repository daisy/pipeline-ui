import { useEffect, useMemo, useRef, useState } from 'react'
import {
    save,
    setEngineMode,
    setExternalEngineConfig,
} from 'shared/data/slices/settings'
import {
    Alive,
    EngineConnectionMode,
    ExternalEngineConfig,
    Webservice,
    baseurl,
} from 'shared/types'
import { ENVIRONMENT } from 'shared/constants'

const { App } = window

type EngineSettingsProps = {
    newSettings: {
        engineMode?: EngineConnectionMode
        externalEngine?: ExternalEngineConfig
    }
}

type ParsedUrl = {
    webservice?: Webservice
    error?: string
}

type TestStatus = 'idle' | 'testing' | 'success' | 'error'

type TestResult = {
    status: TestStatus
    alive?: Alive
    message?: string
}

type EngineSettingsSnapshot = {
    engineMode: EngineConnectionMode
    externalEngine?: ExternalEngineConfig
}

const defaultExternalEngineUrl = 'http://127.0.0.1:8181/ws'
const restartConfirmationMessage = `Restart DAISY Pipeline now?

The current engine will stop before the app restarts. Any running jobs in the built-in engine will be interrupted.`

function parseExternalEngineUrl(value: string): ParsedUrl {
    const trimmed = value.trim()
    if (trimmed.length === 0) {
        return { error: 'Server URL is required.' }
    }

    try {
        const parsed = new URL(trimmed)
        if (!['http:', 'https:'].includes(parsed.protocol)) {
            return { error: 'Use an http or https URL.' }
        }
        if (parsed.username || parsed.password) {
            return {
                error: 'Use the Auth ID and Secret fields for credentials.',
            }
        }
        if (parsed.search || parsed.hash) {
            return { error: 'Do not include query strings or fragments.' }
        }

        const pathname = parsed.pathname.replace(/\/+$/, '')
        const path = pathname && pathname !== '/' ? pathname : '/ws'
        const port = parsed.port ? Number(parsed.port) : undefined

        return {
            webservice: {
                host: parsed.hostname,
                port,
                path,
                ssl: parsed.protocol === 'https:',
            },
        }
    } catch (err) {
        return { error: 'Enter a valid server URL.' }
    }
}

function webserviceToUrl(webservice?: Webservice) {
    if (!webservice?.host) {
        return defaultExternalEngineUrl
    }

    return baseurl({
        ...webservice,
        path: webservice.path ?? '/ws',
    })
}

function connectionMessage(alive: Alive, error?: string) {
    if (!alive.alive) {
        return error ?? 'The server did not return a valid /alive response.'
    }

    const version = alive.version
        ? `DAISY Pipeline ${alive.version}`
        : 'DAISY Pipeline'
    const auth = alive.authentication
        ? 'authentication enabled'
        : 'authentication disabled'
    const localfs = alive.localfs
        ? 'local file access enabled'
        : 'local file access disabled'

    return `Connected to ${version}; ${auth}; ${localfs}.`
}

function externalEngineConfigsEqual(
    first?: ExternalEngineConfig,
    second?: ExternalEngineConfig
) {
    if (!first && !second) return true
    if (!first || !second) return false

    return (
        first.webservice.host === second.webservice.host &&
        first.webservice.port === second.webservice.port &&
        (first.webservice.path ?? '/ws') ===
            (second.webservice.path ?? '/ws') &&
        !!first.webservice.ssl === !!second.webservice.ssl &&
        (first.authId ?? '') === (second.authId ?? '') &&
        (first.secret ?? '') === (second.secret ?? '')
    )
}

function engineSettingsEqual(
    first: EngineSettingsSnapshot,
    second: EngineSettingsSnapshot
) {
    if (first.engineMode !== second.engineMode) return false
    if (first.engineMode !== 'external') return true

    return externalEngineConfigsEqual(
        first.externalEngine,
        second.externalEngine
    )
}

export function Engine({ newSettings }: EngineSettingsProps) {
    const runningEngineSettings = useRef<EngineSettingsSnapshot>({
        engineMode: newSettings.engineMode ?? 'embedded',
        externalEngine: newSettings.externalEngine,
    })
    const [mode, setMode] = useState<EngineConnectionMode>(
        newSettings.engineMode ?? 'embedded'
    )
    const [serverUrl, setServerUrl] = useState(
        webserviceToUrl(newSettings.externalEngine?.webservice)
    )
    const [authId, setAuthId] = useState(
        newSettings.externalEngine?.authId ?? ''
    )
    const [secret, setSecret] = useState(
        newSettings.externalEngine?.secret ?? ''
    )
    const [testResult, setTestResult] = useState<TestResult>({ status: 'idle' })

    useEffect(() => {
        setMode(newSettings.engineMode ?? 'embedded')
        setServerUrl(webserviceToUrl(newSettings.externalEngine?.webservice))
        setAuthId(newSettings.externalEngine?.authId ?? '')
        setSecret(newSettings.externalEngine?.secret ?? '')
    }, [newSettings.engineMode, newSettings.externalEngine])

    const parsedUrl = useMemo(
        () => parseExternalEngineUrl(serverUrl),
        [serverUrl]
    )

    const selectedExternalEngine = useMemo<ExternalEngineConfig | undefined>(
        () =>
            parsedUrl.webservice
                ? {
                      webservice: parsedUrl.webservice,
                      ...(authId.trim().length > 0
                          ? { authId: authId.trim() }
                          : {}),
                      ...(secret.length > 0 ? { secret } : {}),
                  }
                : newSettings.externalEngine,
        [authId, newSettings.externalEngine, parsedUrl.webservice, secret]
    )

    const selectedEngineSettings: EngineSettingsSnapshot = {
        engineMode: mode,
        externalEngine: selectedExternalEngine,
    }
    const restartRequired = !engineSettingsEqual(
        runningEngineSettings.current,
        selectedEngineSettings
    )

    const persistExternalConfig = (
        webservice = parsedUrl.webservice
    ): ExternalEngineConfig | null => {
        if (!webservice) return null

        const config: ExternalEngineConfig = {
            webservice,
            ...(authId.trim().length > 0 ? { authId: authId.trim() } : {}),
            ...(secret.length > 0 ? { secret } : {}),
        }

        App.store.dispatch(setExternalEngineConfig(config))
        App.store.dispatch(save())
        setServerUrl(webserviceToUrl(webservice))
        return config
    }

    const engineModeChanged = (nextMode: EngineConnectionMode) => {
        setMode(nextMode)
        setTestResult({ status: 'idle' })
        App.store.dispatch(setEngineMode(nextMode))
        if (nextMode === 'external') {
            persistExternalConfig(parsedUrl.webservice)
        }
        App.store.dispatch(save())
    }

    const serverUrlChanged = (value: string) => {
        setServerUrl(value)
        setTestResult({ status: 'idle' })
    }

    const credentialsChanged = (field: 'authId' | 'secret', value: string) => {
        if (field === 'authId') {
            setAuthId(value)
        } else {
            setSecret(value)
        }
        setTestResult({ status: 'idle' })
    }

    const testConnection = async () => {
        const parsed = parseExternalEngineUrl(serverUrl)
        if (!parsed.webservice) {
            setTestResult({
                status: 'error',
                message: parsed.error,
            })
            return
        }

        persistExternalConfig(parsed.webservice)
        setTestResult({ status: 'testing' })

        try {
            const result = await App.testPipelineConnection(parsed.webservice)
            const alive = result?.alive ?? { alive: false }
            const status = alive.alive ? 'success' : 'error'

            setTestResult({
                status,
                alive,
                message: connectionMessage(alive, result?.error),
            })
        } catch (err) {
            setTestResult({
                status: 'error',
                message:
                    err instanceof Error
                        ? err.message
                        : 'Could not test the connection.',
            })
        }
    }

    const restartApplication = async () => {
        if (ENVIRONMENT.IS_DEV) return

        const confirmed = await App.showMessageBoxYesNo(
            restartConfirmationMessage
        )
        if (confirmed) {
            await App.restartApplication()
        }
    }

    const urlError = mode === 'external' ? parsedUrl.error : null

    return (
        <>
            <div className="field engine-mode-field">
                <label id="engine-mode-label">DAISY Pipeline engine</label>
                <span className="description">
                    Choose the engine that runs jobs and provides scripts.
                </span>
                <div
                    className="engine-mode-options"
                    role="radiogroup"
                    aria-labelledby="engine-mode-label"
                >
                    <label className="engine-mode-option">
                        <input
                            type="radio"
                            name="engine-mode"
                            value="embedded"
                            checked={mode === 'embedded'}
                            onChange={() => engineModeChanged('embedded')}
                        />
                        <span>Use built-in engine</span>
                    </label>
                    <label className="engine-mode-option">
                        <input
                            type="radio"
                            name="engine-mode"
                            value="external"
                            checked={mode === 'external'}
                            onChange={() => engineModeChanged('external')}
                        />
                        <span>Connect to an external server</span>
                    </label>
                </div>
            </div>

            {mode === 'external' && (
                <div className="engine-external-settings">
                    <div className="field">
                        <label htmlFor="external-engine-url">Server URL</label>
                        <span className="description">
                            Enter the Pipeline web service endpoint.
                        </span>
                        <input
                            id="external-engine-url"
                            type="url"
                            value={serverUrl}
                            placeholder="https://engine.example.org/ws"
                            onChange={(e) => serverUrlChanged(e.target.value)}
                            onBlur={() => persistExternalConfig()}
                            aria-invalid={urlError ? true : undefined}
                            aria-describedby={
                                urlError
                                    ? 'external-engine-url-warning'
                                    : undefined
                            }
                        />
                        {urlError && (
                            <span
                                id="external-engine-url-warning"
                                className="warning"
                            >
                                {urlError}
                            </span>
                        )}
                    </div>

                    <div className="engine-credentials">
                        <div className="field">
                            <label htmlFor="external-engine-auth-id">
                                Auth ID
                            </label>
                            <span className="description">
                                Required if the server has authentication
                                enabled.
                            </span>
                            <input
                                id="external-engine-auth-id"
                                type="text"
                                value={authId}
                                autoComplete="username"
                                onChange={(e) =>
                                    credentialsChanged('authId', e.target.value)
                                }
                                onBlur={() => persistExternalConfig()}
                            />
                        </div>

                        <div className="field">
                            <label htmlFor="external-engine-secret">
                                Secret
                            </label>
                            <span className="description">
                                Required if the server has authentication
                                enabled.
                            </span>
                            <input
                                id="external-engine-secret"
                                type="password"
                                value={secret}
                                autoComplete="current-password"
                                onChange={(e) =>
                                    credentialsChanged('secret', e.target.value)
                                }
                                onBlur={() => persistExternalConfig()}
                            />
                        </div>
                    </div>

                    <div className="field engine-test-field">
                        <button
                            type="button"
                            onClick={testConnection}
                            disabled={
                                testResult.status === 'testing' || !!urlError
                            }
                        >
                            Test connection
                        </button>
                        {testResult.status !== 'idle' && (
                            <span
                                className={`engine-test-result ${testResult.status}`}
                                role="status"
                            >
                                {testResult.status === 'testing'
                                    ? 'Testing connection...'
                                    : testResult.message}
                            </span>
                        )}
                    </div>
                </div>
            )}

            {restartRequired && (
                <div className="field engine-restart-field">
                    <label>Restart required</label>
                    <span className="description">
                        Engine changes take effect after restarting DAISY
                        Pipeline.
                    </span>
                    <span className="warning">
                        Restart now to use the updated engine settings.
                    </span>
                    <button
                        type="button"
                        onClick={restartApplication}
                        disabled={ENVIRONMENT.IS_DEV}
                    >
                        {ENVIRONMENT.IS_DEV
                            ? 'Please manually restart when in dev mode'
                            : 'Restart now'}
                    </button>
                </div>
            )}
        </>
    )
}
