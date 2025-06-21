import { PipelineStatus } from 'shared/types/pipeline'
import { Running as RunningIcon } from './SvgIcons'
import { start } from 'shared/data/slices/pipeline'
const { App } = window

export function EngineStatus({ status }) {
    return (
        <>
            {status == PipelineStatus.STARTING && (
                <div className="starting-engine">
                    <p>Starting the engine...</p>
                    <span className="status running">
                        <RunningIcon width={200} height={200} />
                    </span>
                </div>
            )}
            {status != PipelineStatus.RUNNING &&
                status != PipelineStatus.STARTING && (
                    <div className="starting-engine">
                        <p>Engine is stopped</p>
                        <button
                            type="button"
                            id="launch-engine"
                            onClick={() => App.store.dispatch(start())}
                        >
                            Start the engine
                        </button>
                    </div>
                )}
        </>
    )
}
