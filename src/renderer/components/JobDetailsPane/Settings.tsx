// these settings represent the parameters used by a job (as opposed to the application settings dialog)
import { useEffect, useMemo, useState } from 'react'
import { useWindowStore } from 'renderer/store'
import { externalLinkClick, findValue } from 'renderer/utils/utils'
import { Job } from 'shared/types'
import { getAllOptional, getAllRequired } from 'shared/utils'

const { App } = window

let isFile = (item) => ['anyURI', 'anyFileURI'].includes(item.type)

// return [{name, value}...]
// it's a display convenience and not accessed for any other reason
async function getValuesForScriptItems(items, job) {
    let values = []
    for (let item of items) {
        let val = findValue(
            item.name,
            item.kind,
            job.jobRequest,
            item.isStylesheetParameter
        )

        if (Array.isArray(val)) {
            let newVals = []
            for (let valItem of val) {
                if (isFile(item)) {
                    let tmp = await App.fileURLToPath(valItem)
                    newVals.push(tmp)
                }
            }
            val = [...newVals]
        } else {
            if (isFile(item)) {
                val = await App.fileURLToPath(val)
            }
        }

        // @ts-ignore
        let valObj = { name: item.name, value: val }
        values.push(valObj)
    }
    return values
}
function itemValue(item, jobValues) {
    let entry = jobValues.find((v) => v.name == item.name)
    let val = entry?.value ?? ''
    if (Array.isArray(val)) {
        return val.join(', ')
    } else {
        return val
    }
}
export function Settings({ job }: { job: Job }) {
    const [jobValues, setJobValues] = useState([])
    const { pipeline } = useWindowStore()
    const scriptId = job.jobData?.script?.id || job.script?.id
    const scriptDetails = pipeline.scripts.find((s) => s.id == scriptId)

    let scriptRequiredItems = getAllRequired(job.script)
    let scriptOptionalItems = getAllOptional(job.script)

    useMemo(() => {
        // put values in the script items, for display convenience and because of async issues
        const doConversion = async () => {
            let jobValues_ = await getValuesForScriptItems(
                [...scriptRequiredItems, ...scriptOptionalItems],
                job
            )
            // @ts-ignore
            setJobValues(jobValues_)
        }
        doConversion()
    }, [jobValues])
    return (
        <ul>
            <li>
                <span>Script name:</span>
                <span>
                    {scriptDetails.homepage ? (
                        <a
                            href={scriptDetails.homepage}
                            onClick={(e) => externalLinkClick(e, App)}
                        >
                            {scriptDetails.nicename}
                        </a>
                    ) : (
                        scriptDetails.nicename
                    )}
                </span>
            </li>
            {scriptRequiredItems.map((item, idx) => {
                return (
                    <li key={idx}>
                        <span>{item.nicename}: </span>
                        <span className={isFile(item) ? 'file' : ''}>
                            {
                                // @ts-ignore
                                itemValue(item, jobValues)
                            }
                        </span>
                    </li>
                )
            })}
            {getAllOptional(scriptDetails).map((item, idx) => (
                <li key={idx}>
                    <span>{item.nicename}: </span>
                    <span className={isFile(item) ? 'file' : ''}>
                        {
                            // @ts-ignore
                            itemValue(item, jobValues)
                        }
                    </span>
                </li>
            ))}
        </ul>
    )
}
