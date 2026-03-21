import { isScriptTTSEnhanced } from 'shared/utils'
import { ID } from 'renderer/utils/utils'
let ScriptOptionElm = ({ script, key }) =>
    script != null &&
    script != undefined && (
        <option key={key} value={script?.id}>
            {script.nicename}
            {isScriptTTSEnhanced(script) ? ' (TTS Enhanced)' : ''}
        </option>
    )

export function SelectScript({
    priorityScripts,
    scripts, // scripts should be sorted already
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
                {priorityScripts.length > 0 && (
                    <optgroup label="Frequently-used scripts">
                        {priorityScripts.filter(s => s != null && s != undefined).map((script, idx) => (
                            <option key={`${idx}-prio`} value={script?.id}>
                                {script?.nicename}
                                {script && isScriptTTSEnhanced(script)
                                    ? ' (TTS Enhanced)'
                                    : ''}
                            </option>
                        ))}
                    </optgroup>
                )}
                {scripts.filter(s => s != null && s != undefined).map((script, idx) => (
                    <option key={`${idx}-reg`} value={script?.id}>
                        {script?.nicename ?? script?.id}
                        {script && isScriptTTSEnhanced(script) ? ' (TTS Enhanced)' : ''}
                    </option>
                ))}
            </select>
        </div>
    )
}
