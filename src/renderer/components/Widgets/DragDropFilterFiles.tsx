import { FilelistWithRelevantScripts } from './FilelistWithRelevantScripts'
import { getRelevantScripts } from '../scriptFilters'
import { DragFileInput } from '../Widgets/DragFileInput'
import { useState, useEffect } from 'react'
import { useWindowStore } from 'renderer/store'
import { FileTreeEntry } from 'main/ipcs/fileSystem'
import { ID } from 'renderer/utils'
import { X } from './SvgIcons'
import { setAnnouncement } from 'shared/data/slices/pipeline'
const { App } = window

export function DragDropFilterFiles({
    job,
    createJob,
    onChange,
    initialValue,
}) {
    const { pipeline } = useWindowStore()
    // files is [{filepath, filetype},...]
    const [files, setFiles] = useState(initialValue)
    const [filteredFiles, setFilteredFiles] = useState(initialValue)
    const [filterText, setFilterText] = useState('')
    const [uniqueFiletypes, setUniqueFiletypes] = useState(
        Array.from(new Set(initialValue.map((f) => f.filetype.type)))
    )
    const [unsupportedMessage, setUnsupportedMessage] = useState('')

    // update dependent states when files changes
    useEffect(() => {
        let filteredFiles_ = applyFilterToFiles()
        setFilteredFiles(filteredFiles_)
        onChange(files)
    }, [files])

    useEffect(() => {
        setUniqueFiletypes(
            Array.from(new Set(filteredFiles.map((f) => f.filetype.type)))
        )
    }, [filteredFiles])

    useEffect(() => {
        let filteredFiles_ = applyFilterToFiles()
        setFilteredFiles(filteredFiles_)
    }, [filterText])

    let applyFilterToFiles = () => {
        let filteredFiles_ = files.filter(
            (f) =>
                f.filepath.toLowerCase().indexOf(filterText.toLowerCase()) !=
                    -1 ||
                (f.filetype.name &&
                    f.filetype.name
                        .toLowerCase()
                        .indexOf(filterText.toLowerCase()) != -1) ||
                f.filetype.type
                    .toLowerCase()
                    .indexOf(filterText.toLowerCase()) != -1
        )
        return filteredFiles_
    }

    // handle user adding more files and folders
    // resolve folder contents and add files to the current files list
    let onDragInputChange = async (filenames) => {
        let resolvedFilenames = await resolveItems(filenames)
        await addFiles(resolvedFilenames)
    }
    // add a list of files to the current files list and filter out duplicates
    let addFiles = async (newFiles) => {
        let currentFiles = files.map((f) => f.filepath)

        // filter out any duplicates
        let uniqueNewFiles = newFiles.filter(
            (file) => currentFiles.indexOf(file) == -1
        )
        let uniqueNewFilesThatAreSupported = []
        let rejectedCount = 0
        // assign a filetype to each one
        for (let file of uniqueNewFiles) {
            let filetype = await App.detectFiletype(file)
            if (filetype) {
                uniqueNewFilesThatAreSupported.push({
                    filepath: file,
                    filetype,
                })
            } else {
                rejectedCount++
            }
        }

        if (rejectedCount > 0 && uniqueNewFilesThatAreSupported.length === 0) {
            const msg =
                rejectedCount === 1
                    ? 'File type not recognized'
                    : 'File types not recognized'
            setUnsupportedMessage(msg)
            App.store.dispatch(setAnnouncement(msg))
        } else {
            setUnsupportedMessage('')
            App.store.dispatch(setAnnouncement(''))
        }

        let filesCopy = [...files]
        filesCopy = filesCopy.concat(
            uniqueNewFilesThatAreSupported.filter((f) => f.filetype != null)
        )
        setFiles(filesCopy)
    }
    // recursively list directory contents
    const resolveItems = async (items) => {
        let resolvedItems: string[] = []
        for (let item of items) {
            let paths = []
            let isFile = await App.isFile(item)
            if (isFile) {
                paths.push(item)
            } else {
                let dirListing: Array<FileTreeEntry> =
                    await App.traverseDirectory(item)
                let gatherPaths = (listing: Array<FileTreeEntry>) => {
                    listing.map((fileTreeEntry) => {
                        if (fileTreeEntry.type == 'directory') {
                            gatherPaths(fileTreeEntry.contents)
                        } else {
                            paths.push(fileTreeEntry.path)
                        }
                    })
                }
                gatherPaths(dirListing)
            }
            resolvedItems = [...resolvedItems, ...paths]
        }
        return resolvedItems
    }

    return (
        <div className="drag-drop-filter-files">
            {files.length == 0 && (
                <p className="info">Add files to see script suggestions:</p>
            )}
            {files.length > 0 && (
                <p className="info row">
                    Add more files to see more suggestions.
                </p>
            )}
            <DragFileInput
                elemId={`${job?.internalId}-new-job-files`}
                mediaType={[]}
                onChange={onDragInputChange}
            />
            {unsupportedMessage && (
                <p className="error">{unsupportedMessage}</p>
            )}

            {files.length > 0 && (
                <>
                    <label htmlFor={`filterFilesInput-${job.internalId}`}>
                        The following files can be used in Pipeline jobs. Type
                        to filter the files listed:
                    </label>
                    <div className="file-filter">
                        <input
                            id={`filterFilesInput-${job.internalId}`}
                            onChange={(e) => setFilterText(e.target.value)}
                            value={filterText}
                            onKeyDown={(e) =>
                                e.key == 'Escape' ? setFilterText('') : ''
                            }
                        ></input>
                        <button
                            type="button"
                            className="remove-button invisible"
                            onClick={() => setFilterText('')}
                            title="Clear filter text"
                            aria-label="Clear filter text"
                        >
                            <X width="20" height="20" />
                        </button>
                    </div>
                </>
            )}
            {filterText != '' && filteredFiles.length == 0 && (
                <>
                    <div className="files">
                        <p>No files to display with filter applied. </p>
                    </div>
                </>
            )}
            {filteredFiles.length > 0 && (
                <>
                    <div className="files">
                        <p>
                            {filterText != '' ? 'Filter applied. ' : ''}Showing{' '}
                            {filteredFiles.length}{' '}
                            {filteredFiles.length > 1 ? 'files' : 'file'} in{' '}
                            {uniqueFiletypes.length}{' '}
                            {uniqueFiletypes.length > 1
                                ? 'categories'
                                : 'category'}
                            .
                        </p>
                        {uniqueFiletypes.map((filetype, idx) => {
                            let filesOfType = filteredFiles
                                .filter((f) => f.filetype.type == filetype)
                                .sort((a, b) => (a.name < b.name ? -1 : 1))
                            return (
                                <FilelistWithRelevantScripts
                                    key={idx}
                                    files={filesOfType.map((f) => f.filepath)}
                                    relevantScripts={getRelevantScripts(
                                        filetype,
                                        pipeline.scripts
                                    )}
                                    categoryName={filesOfType[0]?.filetype.name}
                                    jobInternalId={job?.internalId}
                                    createJob={createJob}
                                />
                            )
                        })}
                    </div>
                    <button
                        onClick={() => {
                            setFiles([])
                            setUnsupportedMessage('')
                            App.store.dispatch(setAnnouncement(''))
                        }}
                        type="button"
                    >
                        Clear files
                    </button>
                </>
            )}
        </div>
    )
}
