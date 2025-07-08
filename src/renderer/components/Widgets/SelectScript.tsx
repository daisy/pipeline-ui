import { isScriptTTSEnhanced } from 'shared/utils'
import { ID } from 'renderer/utils/utils'

export function SelectScript({
    scripts,
    jobInternalId,
    onSelectChange,
    message,
}) {
    return (
        <div className="select-script">
            <label
                id={`${ID(jobInternalId)}-select-script`}
                htmlFor={`${ID(jobInternalId)}-script`}
                className="info"
            >
                {message}:
            </label>
            <select
                id={`${ID(jobInternalId)}-script`}
                onChange={(e) => {
                    onSelectChange(e.target.value)
                }}
            >
                <option value={null}>None</option>
                {scripts
                    .sort((a, b) => (a.nicename > b.nicename ? 1 : -1))
                    .map((script, idx) => (
                        <option key={idx} value={script.id}>
                            {script.nicename}
                            {isScriptTTSEnhanced(script)
                                ? ' (TTS Enhanced)'
                                : ''}
                        </option>
                    ))}
            </select>
        </div>
    )
}
