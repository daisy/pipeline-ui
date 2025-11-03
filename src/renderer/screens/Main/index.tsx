import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MainView } from 'renderer/components'
import { useWindowStore } from 'renderer/store'
import { PipelineStatus } from 'shared/types'
import { EngineStatus } from '../../components/Widgets/EngineStatus'
import { loadStyleProperties } from 'renderer/utils'
const queryClient = new QueryClient()

const { App } = window

export function MainScreen() {
    const { pipeline, settings } = useWindowStore()
    loadStyleProperties(settings)

    return (
        <QueryClientProvider client={queryClient}>
            <>
                {pipeline.status == PipelineStatus.RUNNING ? (
                    <MainView />
                ) : (
                    <main>
                        <EngineStatus status={pipeline.status} />
                    </main>
                )}
            </>
        </QueryClientProvider>
    )
}
