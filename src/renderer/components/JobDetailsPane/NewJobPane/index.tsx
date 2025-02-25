/*
Select a script and submit a new job
*/
import { useState, useMemo } from 'react'
import { ScriptForm } from '../../ScriptForm'
import { useWindowStore } from 'renderer/store'
import { ID } from 'renderer/utils/utils'
import { Job } from 'shared/types'
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
} from '../../../utils'
import { is2StepsScript } from 'shared/utils'
import { getRelevantScripts } from '../../../../shared/scriptFilters'
import { FilesSortedByScript } from './FilesSortedByScript'
import { DragFileInput } from '../../Fields/DragFileInput'
import { FileTreeEntry } from 'main/ipcs/fileSystem'

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

    let addFiles = async (newFiles) => {
        let currentFiles = files.map((f) => f.filepath)
        // filter out any duplicates
        let uniqueNewFiles = newFiles.filter(
            (file) => !currentFiles.includes(file)
        )

        let uniqueNewFilesThatAreSupported = []
        // assign a filetype to each one
        for (let file of uniqueNewFiles) {
            let filetype = await App.detectFiletype(file)
            if (filetype) {
                uniqueNewFilesThatAreSupported.push({
                    filepath: file,
                    filetype,
                })
            }
        }
        let filesCopy = [...files]
        filesCopy = filesCopy.concat(
            uniqueNewFilesThatAreSupported.filter((f) => f.filetype != null)
        )
        setFiles(filesCopy)
    }
    let onChange = (filenames) => {
        console.log("DRagInput onchange", filenames)
        let resolvedFilenames = resolveItems(filenames)
        addFiles(resolvedFilenames)
        // addFiles(filenames)
    }
    // recursively list directory contents
    const resolveItems = async (items) => {
        let resolvedItems: string[] = []
        for (let item of items) {
            let dirListing: Array<FileTreeEntry> = await App.traverseDirectory(
                item
            )
            let paths = []
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
            resolvedItems = [...resolvedItems, ...paths]
        }
        return resolvedItems
    }
    return (
        <>
            <section className="select-script">
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
                            .sort((a, b) => (a.nicename > b.nicename ? 1 : -1))
                            .map((script, idx) => (
                                <option key={idx} value={script.id}>
                                    {script.nicename}
                                    {script.inputs.find((i) =>
                                        i.mediaType.includes(
                                            'application/vnd.pipeline.tts-config+xml'
                                        )
                                    )
                                        ? ' (TTS Enhanced)'
                                        : ''}
                                </option>
                            ))}
                    </select>
                </div>
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
                    <FilesSortedByScript
                        job={job}
                        files={files}
                        getRelevantScripts={getRelevantScripts}
                    />

                    {files.length > 0 && (
                        <p className="suggestion">
                            Add more files to see more suggestions.
                        </p>
                    )}
                    <DragFileInput
                        elemId={`${job.internalId}-new-job-files`}
                        mediaType={[]}
                        onChange={onChange}
                    />

                    <button
                        id={`cancel-job-${job.internalId}`}
                        onClick={(e) => {
                            App.store.dispatch(removeJob(job))
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
