import { PipelineStatus } from 'shared/types/pipeline'
import type { EngineConnectionMode } from 'shared/types'
import { Running as RunningIcon } from './SvgIcons'
import { start } from 'shared/data/slices/pipeline'
const { App } = window

type EngineStatusProps = {
    status: PipelineStatus
    engineMode: EngineConnectionMode
}

export function EngineStatus({ status, engineMode }: EngineStatusProps) {
    const externalEngine = engineMode === 'external'

    return (
        <>
            {status == PipelineStatus.STARTING && (
                <div className="starting-engine">
                    <p>
                        {externalEngine
                            ? 'Connecting to the engine...'
                            : 'Starting the engine...'}
                    </p>
                    <span className="status running">
                        <RunningIcon width={200} height={200} />
                    </span>
                </div>
            )}
            {status != PipelineStatus.RUNNING &&
                status != PipelineStatus.STARTING && (
                    <div className="starting-engine">
                        <p>
                            {externalEngine
                                ? 'External engine is unavailable'
                                : 'Engine is stopped'}
                        </p>
                        {!externalEngine && (
                            <button
                                type="button"
                                id="launch-engine"
                                onClick={() => App.store.dispatch(start())}
                            >
                                Start the engine
                            </button>
                        )}
                    </div>
                )}
        </>
    )
}
