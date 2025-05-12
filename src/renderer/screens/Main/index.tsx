import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { MainView } from 'renderer/components'
import { useWindowStore } from 'renderer/store'
import { start } from 'shared/data/slices/pipeline'
import { PipelineStatus } from 'shared/types'
import { Running as RunningIcon } from '../../components/Widgets/SvgIcons'
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
                        <div className="startup">
                            <p>Starting the engine...</p>
                            <span className="status running">
                                <RunningIcon width={200} height={200} />
                            </span>
                        </div>
                    ) : (
                        <>
                            <p>Engine is stopped</p>
                            <button
                                id="launch-engine"
                                onClick={() => App.store.dispatch(start())}
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
