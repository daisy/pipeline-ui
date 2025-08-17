import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MainView } from 'renderer/components'
import { useWindowStore } from 'renderer/store'
import { PipelineStatus } from 'shared/types'
import { EngineStatus } from '../../components/Widgets/EngineStatus'
const queryClient = new QueryClient()

const { App } = window

export function MainScreen() {
    const { pipeline } = useWindowStore()
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
