import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MainView } from 'renderer/components'
import { useWindowStore } from 'renderer/store'
import { PipelineStatus } from 'shared/types'
import { EngineStatus } from '../../components/Widgets/EngineStatus'
import { loadStyleProperties } from 'renderer/utils'
import { useEffect, useState } from 'react'
const queryClient = new QueryClient()

const { App } = window

export function MainScreen() {
    const { pipeline, settings } = useWindowStore()
    const [announcement, setAnnouncement] = useState('')
    useEffect(() => {
        setAnnouncement(pipeline.announcement)
    }, [pipeline.announcement])

    loadStyleProperties(settings)

    return (
        <QueryClientProvider client={queryClient}>
            <>
                {pipeline.status == PipelineStatus.RUNNING ? (
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
