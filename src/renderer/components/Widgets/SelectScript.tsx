import { isScriptTTSEnhanced } from 'shared/utils'
import { ID } from 'renderer/utils/utils'

export function SelectScript({
    priorityScripts,
    scripts, // scripts should be sorted already
    jobInternalId,
    onSelectChange,
    message,
}) {
    let ScriptOptionElm = ({ script, key }) => (
        <option key={key} value={script.id}>
            {script.nicename}
            {isScriptTTSEnhanced(script) ? ' (TTS Enhanced)' : ''}
        </option>
    )

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
                {priorityScripts.length > 0 && (
                    <optgroup label="Frequently-used scripts">
                        {priorityScripts.map((script, idx) => (
                            <ScriptOptionElm
                                script={script}
                                key={`${idx}-prio`}
                            />
                        ))}
                    </optgroup>
                )}
                {scripts.map((script, idx) => (
                    <ScriptOptionElm script={script} key={`${idx}-reg`} />
                ))}
            </select>
        </div>
    )
}
