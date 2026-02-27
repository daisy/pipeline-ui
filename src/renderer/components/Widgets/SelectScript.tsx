import { isScriptTTSEnhanced } from 'shared/utils'
import { ID } from 'renderer/utils/utils'
import { useEffect, useRef } from 'react'
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
    autoFocus,
}) {
    let selectRef = useRef(null)

    // this should work to give focus to the select element but it's not having an effect
    // maybe something is shifting the focus elsewhere after this renders?
    useEffect(() => {
        if (selectRef.current && autoFocus) {
            selectRef.current.focus()
        }
    }, [])

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
                ref={selectRef}
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
