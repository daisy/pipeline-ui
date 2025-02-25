export function FilesSortedByScript({ files, getRelevantScripts, job }) {
    return (
        <>
            {Array.from(new Set(files.map((f) => f.filetype.type)))
                .map(
                    (filetypeType) =>
                        files.find((f) => f.filetype.type == filetypeType)
                            .filetype
                )
                .sort((a, b) => (a.name < b.name ? -1 : 1))
                .map((filetypeCategory, idx) => (
                    <div className="files-by-script">
                        <div className="horizontal-input">
                            <select>
                                {getRelevantScripts(filetypeCategory.type).map(
                                    (script) => (
                                        <option>{script.nicename}</option>
                                    )
                                )}
                            </select>
                            <button>Run</button>
                        </div>
                        <div className="horizontal-input">
                            <input
                                id={`select-all-${idx}`}
                                type="checkbox"
                            ></input>
                            <label htmlFor={`select-all-${idx}`} className="suggestion">
                                Select all {filetypeCategory.name} files
                            </label>
                        </div>
                        <ul>
                            {files
                                .filter(
                                    (f) =>
                                        f.filetype.type == filetypeCategory.type
                                )
                                .sort((a, b) =>
                                    a.filepath < b.filepath ? -1 : 1
                                )
                                .map((f, idx2) => (
                                    <li key={idx2}>
                                        <div className="horizontal-input">
                                            <input
                                                type="checkbox"
                                                checked={false}
                                                id={`${job.internalId}-${idx}-${idx2}`}
                                            />
                                            <label
                                                htmlFor={`${job.internalId}-${idx}-${idx2}`}
                                            >
                                                {f.filepath.replace(
                                                    'file:///',
                                                    '/'
                                                )}
                                            </label>
                                        </div>
                                    </li>
                                ))}
                        </ul>
                    </div>
                ))}
        </>
    )
}
