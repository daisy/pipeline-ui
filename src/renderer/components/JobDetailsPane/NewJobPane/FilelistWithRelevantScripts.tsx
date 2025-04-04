import { useState, useEffect } from 'react'

export function FilelistWithRelevantScripts({
    files,
    relevantScripts,
    categoryName,
    jobInternalId,
    createJob,
}) {
    const [selectedFiles, setSelectedFiles] = useState([])
    const [selectedScript, setSelectedScript] = useState(relevantScripts[0].id)

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
        console.log('selection', selectedFilesCopy)
    }

    let onSelectScript = (e) => {
        console.log('onSelectScript', e)
        setSelectedScript(e.target.value)
    }
    // create a job form for the selected files and chosen script
    let initJob = () => {
        let script = relevantScripts.find(s => s.id == selectedScript)
        createJob(script, selectedFiles)
    }
    return (
        <>
            <div className="files-by-script">
                <div className="horizontal-input">
                    <select onChange={(e) => onSelectScript(e)}>
                        {relevantScripts.map((script, idx) => (
                            <option key={idx} value={script.id}>{script.nicename}</option>
                        ))}
                    </select>
                    <button onClick={(e) => initJob()}>Create job</button>
                </div>
                <ul>
                    {files
                        .sort((a, b) => (a < b ? -1 : 1))
                        .map((f, idx) => (
                            <li key={idx}>
                                <div className="horizontal-input">
                                    <input
                                        type="checkbox"
                                        checked={selectedFiles && selectedFiles.indexOf(f) != -1}
                                        id={`${jobInternalId}-${categoryName}-${idx}`}
                                        onChange={(e) => {
                                            changeFilesSelection([f])
                                        }}
                                    />
                                    <label
                                        htmlFor={`${jobInternalId}-${categoryName}-${idx}`}
                                    >
                                        {f.replace('file:///', '/')}
                                    </label>
                                </div>
                            </li>
                        ))}
                </ul>
            </div>
        </>
    )
}
