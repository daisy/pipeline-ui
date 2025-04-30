/*
Select a script and submit a new job
*/
import { useState, useMemo, useEffect } from 'react'
import { ScriptForm } from '../ScriptForm'
import { useWindowStore } from 'renderer/store'
import { ID } from 'renderer/utils/utils'
import { Job, Script } from 'shared/types'
import {
    prepareJobRequest,
    removeJob,
    updateJob,
} from 'shared/data/slices/pipeline'
import {
    save,
    setSponsorshipMessageLastShown,
} from 'shared/data/slices/settings'
import { externalLinkClick } from 'renderer/utils'

const { App } = window

import {
    defaultSponsorshipMessage,
    updateSponsorshipMessage,
} from '../../utils'
import { is2StepsScript, isScriptTTSEnhanced } from 'shared/utils'
import { getRelevantScripts } from '../scriptFilters'
import { FilelistWithRelevantScripts } from './FilelistWithRelevantScripts'
import { DragFileInput } from '../Fields/DragFileInput'
import { FileTreeEntry } from 'main/ipcs/fileSystem'
import { debug } from 'electron-log'
// is dateInMs more than 2 weeks old
function isExpired(dateInMs: number) {
    if (dateInMs == 0) return true

    const TWOWEEKS_MS = 1209600000
    // const TWOWEEKS_MS = 500 // for testing
    let date = new Date(dateInMs)
    let now = Date.now()
    if (now - date.getTime() > TWOWEEKS_MS) {
        return true
    }
    return false
}

export function NewJobPane({ job }: { job: Job }) {
    const { settings, pipeline } = useWindowStore()
    const [sponsorshipMessage, setSponsorshipMessage] = useState(
        defaultSponsorshipMessage
    )
    const [showSponsorshipMessage, setShowSponsorshipMessage] = useState(
        isExpired(settings.sponsorshipMessageLastShown)
    )
    // files is [{filepath, filetype},...]
    const [files, setFiles] = useState([])

    // useMemo runs once per render (unlike useEffect)
    useMemo(() => {
        const fetchData = async () => {
            let updatedSponsorshipMessage = await updateSponsorshipMessage()
            setSponsorshipMessage({ ...updatedSponsorshipMessage })
        }
        if (isExpired(settings.sponsorshipMessageLastShown)) {
            fetchData().catch()
            setShowSponsorshipMessage(true)
            // update settings with a new date
            App.store.dispatch(setSponsorshipMessageLastShown(Date.now()))
            App.store.dispatch(save())
        }
    }, [])

    useEffect(() => {
        if (!job) {
            setFiles([])
        }
    }, [job])

    // top level script selection
    let onSelectChange = (e) => {
        let selection = pipeline.scripts.find(
            (script) => script.id == e.target.value
        )
        App.store.dispatch(
            updateJob({
                ...job,
                script: selection,
                is2StepsJob: is2StepsScript(selection),
                jobData: {
                    ...job.jobData,
                    nicename: selection?.nicename ?? '',
                },
                jobRequest: prepareJobRequest(job, selection),
            })
        )
    }

    // add a list of files to the current files list and filter out duplicates
    let addFiles = async (newFiles) => {
        console.log('Add files', newFiles)
        let currentFiles = files.map((f) => f.filepath)

        // filter out any duplicates
        let uniqueNewFiles = newFiles.filter(
            (file) => currentFiles.indexOf(file) == -1
        )
        debug(`Unique new files`, uniqueNewFiles)
        let uniqueNewFilesThatAreSupported = []
        // assign a filetype to each one
        for (let file of uniqueNewFiles) {
            debug(`Detecting type of ${file}`)
            let filetype = await App.detectFiletype(file)
            debug(`...${filetype}`)
            if (filetype) {
                uniqueNewFilesThatAreSupported.push({
                    filepath: file,
                    filetype,
                })
            }
        }
        debug(
            `Unique new files that are supported ${JSON.stringify(
                uniqueNewFilesThatAreSupported
            )}`
        )

        let filesCopy = [...files]
        filesCopy = filesCopy.concat(
            uniqueNewFilesThatAreSupported.filter((f) => f.filetype != null)
        )
        setFiles(filesCopy)
    }
    // handle user adding more files and folders
    // resolve folder contents and add files to the current files list
    let onDragInputChange = async (filenames) => {
        let resolvedFilenames = await resolveItems(filenames)
        await addFiles(resolvedFilenames)
    }
    // recursively list directory contents
    const resolveItems = async (items) => {
        console.log('Resolve items', items)

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

    let createJob = async (script: Script, inputFiles: string[]) => {
        console.log('createJob')
        console.log('script', script)
        console.log('inputFiles', inputFiles)

        let jobRequest = prepareJobRequest(job, script)
        // console.log('jobRequest:\n', jobRequest)

        let inputsCopy = [...jobRequest.inputs]
        let sourceInputIdx = inputsCopy.findIndex(
            (input) => input.name == 'source'
        )
        if (sourceInputIdx != -1) {
            inputsCopy[sourceInputIdx].value = []
            for (let inputFile of inputFiles) {
                let retval = await App.pathToFileURL(inputFile)
                inputsCopy[sourceInputIdx].value.push(retval)
            }
        }
        console.log('createJob inputsCopy', inputsCopy)

        jobRequest.inputs = [...inputsCopy]

        App.store.dispatch(
            updateJob({
                ...job,
                script,
                is2StepsJob: is2StepsScript(script),
                jobData: {
                    ...job.jobData,
                    nicename: script?.nicename ?? '',
                },
                jobRequest,
            })
        )
    }

    let uniqueFiletypes = Array.from(new Set(files.map((f) => f.filetype.type)))

    let hasAtLeastOneInput = () => {
        let inputsCopy = job.jobRequest?.inputs
        if (inputsCopy && inputsCopy.length > 0) {
            let anInputValue = inputsCopy.find(
                (input) => input.value != '' && input.value != null
            )
            if (anInputValue) {
                return true
            } else {
                return false
            }
        } else {
            return false
        }
    }
    return (
        <>
            <section className="select-script">
                {hasAtLeastOneInput() == false && (
                    <div>
                        <label
                            id={`${ID(job.internalId)}-select-script`}
                            htmlFor={`${ID(job.internalId)}-script`}
                        >
                            Select a script:
                        </label>
                        <select
                            id={`${ID(job.internalId)}-script`}
                            onChange={(e) => onSelectChange(e)}
                            value={job.script ? job.script.id : ''}
                        >
                            <option value={null}>None</option>
                            {pipeline.scripts
                                .sort((a, b) =>
                                    a.nicename > b.nicename ? 1 : -1
                                )
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
                )}
                <div>
                    <label
                        id={`${ID(job.internalId)}-change-name`}
                        htmlFor={`${ID(job.internalId)}-nicename`}
                    >
                        Custom job name:
                    </label>
                    <input
                        id={`${ID(job.internalId)}-nicename`}
                        type="text"
                        value={
                            (job.jobRequest && job.jobRequest.nicename) || ''
                        }
                        aria-description="Here you can change the current tab's name and its associated job's name."
                        onChange={(e) => {
                            const updatedJob: Job = {
                                ...job,
                                jobData: {
                                    ...job.jobData,
                                },
                                jobRequest: {
                                    ...job.jobRequest,
                                    nicename: e.target.value,
                                },
                            }
                            App.store.dispatch(updateJob(updatedJob))
                        }}
                    />
                </div>
            </section>
            {job.script != null ? (
                <ScriptForm job={job} script={job.script} />
            ) : (
                <>
                    {files.length == 0 && (
                        <p className="suggestion">
                            Add files to see script suggestions, or choose a
                            script above.
                        </p>
                    )}
                    {files.length > 0 && (
                        <p className="suggestion">
                            The following files can be used in a Pipeline job:
                        </p>
                    )}
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
                    {files.length > 0 && (
                        <p className="suggestion">
                            Add more files to see more suggestions.
                            <button onClick={() => setFiles([])}>
                                Clear files
                            </button>
                        </p>
                    )}
                    <DragFileInput
                        elemId={`${job.internalId}-new-job-files`}
                        mediaType={[]}
                        onChange={onDragInputChange}
                    />

                    <button
                        id={`cancel-job-${job.internalId}`}
                        onClick={async (e) => {
                            let result = await App.showMessageBoxYesNo(
                                'Are you sure you want to close this job?'
                            )
                            if (result) {
                                App.store.dispatch(removeJob(job))
                            }
                        }}
                    >
                        Cancel
                    </button>
                </>
            )}
            {job.script == null && showSponsorshipMessage ? (
                <div className="sponsorship">
                    <a
                        href={sponsorshipMessage.url}
                        onClick={(e) => externalLinkClick(e, App)}
                    >
                        {sponsorshipMessage.buttonText}
                    </a>
                    <p>{sponsorshipMessage.messageText}</p>
                </div>
            ) : (
                ''
            )}
        </>
    )
}
