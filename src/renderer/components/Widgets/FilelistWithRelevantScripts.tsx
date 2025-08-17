import { useState } from 'react'
import { ID } from 'renderer/utils'
import { isScriptTTSEnhanced } from 'shared/utils'

export function FilelistWithRelevantScripts({
    files,
    relevantScripts,
    categoryName,
    jobInternalId,
    createJob,
}) {
    const [selectedFiles, setSelectedFiles] = useState([])
    const [selectedScriptId, setSelectedScriptId] = useState(
        relevantScripts[0]?.id ?? null
    )

    // change the files selection
    let changeFilesSelection = (files) => {
        let selectedFilesCopy = [...selectedFiles]
        files.map((file) => {
            let idx = selectedFilesCopy.indexOf(file)
            // add it if not there
            if (idx == -1) {
                selectedFilesCopy.push(file)
            }
            // else remove it
            else {
                selectedFilesCopy.splice(idx, 1)
            }
        })

        setSelectedFiles([...selectedFilesCopy])
    }

    let multiSelectEnabled = (scriptId) => {
        let script = relevantScripts.find((s) => s.id == scriptId)
        return script?.batchable || script?.multidoc
    }
    let onSelectScript = (e) => {
        setSelectedScriptId(e.target.value)
        if (!multiSelectEnabled(e.target.value)) {
            setSelectedFiles(selectedFiles.length > 0 ? [selectedFiles[0]] : [])
        }
    }
    // create a job form for the selected files and chosen script
    let initJob = () => {
        let script = relevantScripts.find((s) => s.id == selectedScriptId)
        createJob(script, selectedFiles)
    }

    return (
        <fieldset className="files-by-script">
            <legend>{categoryName}</legend>
            <div className="row">
                <select onChange={(e) => onSelectScript(e)}>
                    {relevantScripts.map((script, idx) => (
                        <option key={idx} value={script.id}>
                            {script?.nicename}
                            {isScriptTTSEnhanced(script)
                                ? ' (TTS Enhanced)'
                                : ''}
                        </option>
                    ))}
                </select>
                <button
                    type="button"
                    disabled={selectedFiles.length == 0}
                    aria-disabled={selectedFiles.length == 0}
                    onClick={(e) => initJob()}
                >
                    Create job
                </button>
            </div>
            <p className="info">
                {!multiSelectEnabled(selectedScriptId) &&
                    'This script accepts one file at a time.'}
                {relevantScripts.find((s) => s.id == selectedScriptId)
                    ?.multidoc &&
                    'Selecting multiple files for this script creates one job with many input documents.'}
                {relevantScripts.find((s) => s.id == selectedScriptId)
                    ?.batchable &&
                    'Selecting multiple files for this script creates a batch job.'}
            </p>
            <ul>
                {files
                    .sort((a, b) => (a < b ? -1 : 1))
                    .map((f, idx) => (
                        <li key={idx} className="row">
                            <input
                                type={
                                    multiSelectEnabled(selectedScriptId)
                                        ? 'checkbox'
                                        : 'radio'
                                }
                                name="files"
                                checked={
                                    selectedFiles &&
                                    selectedFiles.indexOf(f) != -1
                                }
                                id={`${jobInternalId}-${categoryName}-${idx}`}
                                onChange={(e) => {
                                    changeFilesSelection([f])
                                }}
                            />
                            <label
                                htmlFor={`${jobInternalId}-${categoryName}-${idx}`}
                                className="file"
                            >
                                {f}
                            </label>
                        </li>
                    ))}
            </ul>
        </fieldset>
    )
}
