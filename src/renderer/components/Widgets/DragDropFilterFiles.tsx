import { FilelistWithRelevantScripts } from './FilelistWithRelevantScripts'
import { getRelevantScripts } from '../scriptFilters'
import { DragFileInput } from '../Widgets/DragFileInput'
import { useState, useEffect } from 'react'
import { FileTreeEntry } from 'main/ipcs/fileSystem'
const { App } = window

export function DragDropFilterFiles({
    job,
    createJob,
    onChange,
    initialValue,
}) {
    // files is [{filepath, filetype},...]
    const [files, setFiles] = useState(initialValue)
    const [firstInteraction, setFirstInteraction] = useState(false)

    let updateFiles = (files_) => {
        let filesCopy = [...files_]
        setFiles(filesCopy)
        onChange(filesCopy)
    }

    let uniqueFiletypes = Array.from(new Set(files.map((f) => f.filetype.type)))
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
        // debug(`Unique new files`, uniqueNewFiles)
        let uniqueNewFilesThatAreSupported = []
        // assign a filetype to each one
        for (let file of uniqueNewFiles) {
            // debug(`Detecting type of ${file}`)

            let filetype = await App.detectFiletype(file)
            // debug(`...${filetype}`)
            if (filetype) {
                uniqueNewFilesThatAreSupported.push({
                    filepath: file,
                    filetype,
                })
            }
        }
        // debug(
        //     `Unique new files that are supported ${JSON.stringify(
        //         uniqueNewFilesThatAreSupported
        //     )}`
        // )

        let filesCopy = [...files]
        filesCopy = filesCopy.concat(
            uniqueNewFilesThatAreSupported.filter((f) => f.filetype != null)
        )
        updateFiles(filesCopy)
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
                <p className="info">
                    The following files can be used in Pipeline jobs:
                </p>
            )}
            {files.length > 0 && (
                <div className="files">
                    {uniqueFiletypes.map((filetype, idx) => {
                        let filesOfType = files
                            .filter((f) => f.filetype.type == filetype)
                            .sort((a, b) => (a.name < b.name ? -1 : 1))
                        return (
                            <FilelistWithRelevantScripts
                                key={idx}
                                files={filesOfType.map((f) => f.filepath)}
                                relevantScripts={getRelevantScripts(filetype)}
                                categoryName={filesOfType[0]?.filetype.name}
                                jobInternalId={job.internalId}
                                createJob={createJob}
                            />
                        )
                    })}
                </div>
            )}
            {files.length > 0 && (
                <p className="info row">
                    Add more files to see more suggestions.
                    <button onClick={() => updateFiles([])} type="button">
                        Clear files
                    </button>
                </p>
            )}
            <DragFileInput
                elemId={`${job.internalId}-new-job-files`}
                mediaType={[]}
                onChange={onDragInputChange}
            />
        </div>
    )
}
