/*
Select a script and submit a new job
*/
import { useState, useMemo, useEffect } from 'react'
import { ScriptForm } from '../ScriptForm'
import { useWindowStore } from 'renderer/store'
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
import { is2StepsScript } from 'shared/utils'

import { debug } from 'electron-log'
import { SelectScript } from '../Widgets/SelectScript'
import { DragDropFilterFiles } from '../Widgets/DragDropFilterFiles'

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

    const [files, setFiles] = useState([])

    // see if it's time to show the sponsorship message again
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

    // top level script selection
    let onSelectChange = (scriptId) => {
        let selection = pipeline.scripts.find((script) => script.id == scriptId)
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

    let onDragDropFilesChange = (filesArray) => {
        let filesArrayCopy = [...filesArray]
        setFiles(filesArrayCopy)
    }

    let createJob = async (script: Script, inputFiles: string[]) => {
        let jobRequest = prepareJobRequest(job, script)

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

    return (
        <>
            <div className="new-job">
                <DragDropFilterFiles
                    job={job}
                    createJob={createJob}
                    initialValue={files}
                    onChange={onDragDropFilesChange}
                />
                {files.length == 0 && (
                    <SelectScript
                        jobInternalId={job.internalId}
                        scripts={pipeline.scripts}
                        onSelectChange={onSelectChange}
                        message={'Or, select a script'}
                    />
                )}
                {showSponsorshipMessage && (
                    <div className="sponsorship">
                        <a
                            href={sponsorshipMessage.url}
                            onClick={(e) => externalLinkClick(e, App)}
                        >
                            {sponsorshipMessage.buttonText}
                        </a>
                        <p>{sponsorshipMessage.messageText}</p>
                    </div>
                )}
            </div>
        </>
    )
}
