import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MainView } from 'renderer/components'
import { useWindowStore } from 'renderer/store'
import { PipelineStatus } from 'shared/types'
import { EngineStatus } from '../../components/Widgets/EngineStatus'
import { loadStyleProperties } from 'renderer/utils'
import { useEffect, useRef, useState } from 'react'
import {
    addJob,
    newJob,
    prepareJobRequest,
    runJob,
    selectJob,
} from 'shared/data/slices/pipeline'
import { is2StepsScript } from 'shared/utils'
import { validateJobRequestSync } from 'renderer/utils/jobRequestValidator'
const queryClient = new QueryClient()

const { App } = window

type PendingFile = {
    filePath: string
    scriptIdFragment: string
    autoRun: boolean
}

export function MainScreen() {
    const { pipeline, settings } = useWindowStore()
    const [announcement, setAnnouncement] = useState('')
    const [pendingFile, setPendingFile] = useState<PendingFile | null>(null)
    const pendingFileInProgress = useRef(false)

    useEffect(() => {
        App.onExternalFileOpen((data) => setPendingFile(data))
    }, [])

    useEffect(() => {
        setAnnouncement(pipeline.announcement)
    }, [pipeline.announcement])

    useEffect(() => {
        if (
            pipeline.status === PipelineStatus.RUNNING &&
            pendingFile !== null &&
            !pendingFileInProgress.current
        ) {
            pendingFileInProgress.current = true
            openFileAsJob(pendingFile).finally(() => {
                pendingFileInProgress.current = false
                setPendingFile(null)
            })
        }
    }, [pipeline.status, pendingFile])

    loadStyleProperties(settings)

    async function openFileAsJob({
        filePath,
        scriptIdFragment,
        autoRun,
    }: PendingFile) {
        const script = pipeline.scripts.find((s) =>
            s.id.includes(scriptIdFragment)
        )
        if (!script) {
            console.warn(
                `Could not find script matching "${scriptIdFragment}" for external file open`
            )
            return
        }

        const job = newJob(App.store.getState().pipeline)
        let jobRequest = prepareJobRequest(
            job,
            script,
            pipeline.datatypes,
            App.store.getState()
        )

        const sourceInput = jobRequest.inputs.find(
            (input) => input.name === 'source'
        )
        if (sourceInput) {
            sourceInput.value = [await App.pathToFileURL(filePath)]
        }

        jobRequest.validation = validateJobRequestSync(
            jobRequest,
            script,
            pipeline.datatypes
        )

        const configuredJob = {
            ...job,
            script,
            is2StepsJob: is2StepsScript(script),
            jobData: {
                ...job.jobData,
                nicename: script.nicename,
            },
            jobRequest,
        }

        App.store.dispatch(addJob(configuredJob))
        App.store.dispatch(selectJob(configuredJob))

        if (autoRun) {
            App.store.dispatch(runJob(configuredJob))
        }
    }

    return (
        <QueryClientProvider client={queryClient}>
            <>
                {pipeline.status == PipelineStatus.RUNNING &&
                pendingFile === null ? (
                    <>
                        <MainView />
                        <p id="announce" className="sr-only" aria-live="polite">
                            {announcement}
                        </p>
                    </>
                ) : (
                    <main>
                        <EngineStatus status={pipeline.status} />
                    </main>
                )}
            </>
        </QueryClientProvider>
    )
}
