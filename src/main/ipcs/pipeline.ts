import { ipcMain } from 'electron'
import { IPC } from 'shared/constants'
import { Alive, Webservice } from 'shared/types'
import { pipelineAPI } from 'main/data/apis/pipeline'

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
                return {
                    ok: false,
                    error: 'No voice preview URL was provided.',
                }
            }
            try {
                const preview = await pipelineAPI.fetchBinary(previewUrl)
                return {
                    ok: true,
                    audio: preview.arrayBuffer,
                    contentType: preview.contentType ?? 'audio/wav',
                }
            } catch (err) {
                const message = err instanceof Error ? err.message : String(err)
                return {
                    ok: false,
                    error: message,
                }
            }
        }
    )
}
