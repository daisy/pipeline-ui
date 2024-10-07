/*
Select a script and submit a new job
*/
import { useState, useMemo } from 'react'
import { ScriptForm } from '../ScriptForm'
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
} from '../../utils'

// is datestring more than 2 weeks old
// datestring is milliseconds (string)
let isExpired = (dateInMs: number) => {
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
                jobData: {
                    ...job.jobData,
                    nicename: selection.nicename,
                },
                jobRequest: prepareJobRequest(job, selection),
            })
        )
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
                <button
                    id={`cancel-job-${job.internalId}`}
                    onClick={(e) => {
                        App.store.dispatch(removeJob(job))
                    }}
                >
                    Cancel
                </button>
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
