import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MainView } from 'renderer/components'
import { useWindowStore } from 'renderer/store'
import { PipelineStatus } from 'shared/types/pipeline'

const queryClient = new QueryClient()

const { App } = window

export function MainScreen() {
    const { pipeline } = useWindowStore()
    return (
        <QueryClientProvider client={queryClient}>
            <>
                <main>
                    {pipeline.status == PipelineStatus.RUNNING ? (
                        <MainView />
                    ) : pipeline.status == PipelineStatus.STARTING ? (
                        <p>Starting the engine...</p>
                    ) : (
                        <>
                            <p>Engine is stopped</p>
                            <button
                                id="launch-engine"
                                onClick={() => App.launchPipeline()}
                            >
                                Start the engine
                            </button>
                        </>
                    )}
                </main>
            </>
        </QueryClientProvider>
    )
}
