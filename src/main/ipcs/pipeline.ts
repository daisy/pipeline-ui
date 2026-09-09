import { ipcMain } from 'electron'
import { info, error } from 'electron-log'
import { IPC } from 'shared/constants'
import { Alive, Webservice } from 'shared/types'
import { pipelineAPI } from 'main/data/apis/pipeline'
import { store } from 'main/data/store'
import { selectTtsConfig } from 'shared/data/slices/settings'
import { selectWebservice } from 'shared/data/slices/pipeline'

export type PipelineConnectionTestResult = {
    alive: Alive
    error?: string
}

export type PipelineVoicePreviewResult =
    | {
          ok: true
          audio: ArrayBuffer
          contentType?: string
      }
    | {
          ok: false
          error: string
      }

function connectionTestErrorMessage(err: unknown) {
    const message = err instanceof Error ? err.message : String(err)

    if (message.includes('ECONNREFUSED')) {
        return 'No Pipeline server responded at this address. Check that the server is running and that the URL is correct.'
    }
    if (message.includes('ENOTFOUND') || message.includes('EAI_AGAIN')) {
        return 'The server name could not be found. Check the host name and your network connection.'
    }
    if (message.includes('ETIMEDOUT') || message.includes('AbortError')) {
        return 'The connection timed out. Check that the server is reachable and try again.'
    }
    if (message.includes('ECONNRESET')) {
        return 'The server closed the connection before responding. Check the server URL and try again.'
    }
    if (message.includes('certificate') || message.includes('SELF_SIGNED')) {
        return 'The server certificate could not be trusted. Check the HTTPS configuration.'
    }

    return 'Could not connect to the Pipeline server. Check the URL and try again.'
}

export function setupPipelineConnectionEvents() {
    ipcMain.handle(
        IPC.PIPELINE.TEST_CONNECTION,
        async (
            event,
            webservice: Webservice
        ): Promise<PipelineConnectionTestResult> => {
            try {
                const alive = await pipelineAPI.fetchAlive()(webservice)
                return { alive }
            } catch (err) {
                return {
                    alive: { alive: false },
                    error: connectionTestErrorMessage(err),
                }
            }
        }
    )

    ipcMain.handle(
        IPC.PIPELINE.VOICE_PREVIEW,
        async (
            event,
            previewUrl: string
        ): Promise<PipelineVoicePreviewResult> => {
            if (!previewUrl) {
                error('VOICE_PREVIEW: no preview URL was provided')
                return {
                    ok: false,
                    error: 'No voice preview URL was provided.',
                }
            }
            info('VOICE_PREVIEW: fetching', previewUrl)
            try {
                // The engine only serves a preview if a /voices call with
                // matching properties immediately preceded it (otherwise it
                // returns 400 "No /voices call preceeded this call, or
                // settings were changed"). Re-issue that call right before
                // requesting the preview so the client always honors the
                // engine's calling convention.
                const state = store.getState()
                await pipelineAPI.fetchTtsVoices(selectTtsConfig(state))(
                    selectWebservice(state)
                )
                const preview = await pipelineAPI.fetchBinary(previewUrl)
                info(
                    'VOICE_PREVIEW: fetched',
                    previewUrl,
                    'bytes:',
                    preview.arrayBuffer.byteLength,
                    'contentType:',
                    preview.contentType
                )
                return {
                    ok: true,
                    audio: preview.arrayBuffer,
                    contentType: preview.contentType ?? 'audio/wav',
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err)
                error('VOICE_PREVIEW: failed', previewUrl, message)
                return {
                    ok: false,
                    error: message,
                }
            }
        }
    )
}
