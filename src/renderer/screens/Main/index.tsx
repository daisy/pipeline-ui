import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { Status, TabView } from 'renderer/components'
import { useWindowStore } from 'renderer/store'
import { PipelineStatus } from 'shared/types/pipeline'

const queryClient = new QueryClient()

export function MainScreen() {
    const { pipeline } = useWindowStore()
    return (
        <QueryClientProvider client={queryClient}>
            <>
                <header>
                    <h1>DAISY Pipeline</h1>
                    <Status />
                </header>
                <main>
                    {pipeline.status == PipelineStatus.RUNNING ? (
                        <TabView />
                    ) : (
                        ''
                    )}
                </main>
            </>
        </QueryClientProvider>
    )
}
