import {
    Job,
    NameValue,
    ScriptFrequency,
    ScriptOptionOverrides,
} from 'shared/types'
import {
    selectLastUsedScriptOptionOverrides,
    selectScriptFrequency,
    selectSortScriptsByFrequency,
    selectSuggestOptionValues,
    setLastUsedScriptOptionOverrides,
    setScriptFrequency,
} from 'shared/data/slices/settings'
import { GetStateFunction } from 'shared/types/store'
import { save } from 'shared/data/slices/settings'
import { store } from './data/store'
/*

Record script usage frequency
Record option values used if not defaults

This data is used to visually prioritize frequently used scripts, and to pre-fill option values
*/

export function logJob(job: Job, getState: GetStateFunction) {
    let scriptFrequencies = selectScriptFrequency(getState())
    let scriptOptionOverrides = selectLastUsedScriptOptionOverrides(getState())

    let sortScriptsByFrequency = selectSortScriptsByFrequency(getState())
    let suggestOptionValues = selectSuggestOptionValues(getState())

    // if the relevant feature is enabled, then record the necessary data
    // this also means if the user has the features unchecked in settings, then the data does not get recorded
    // in this way they can turn off local data collection
    if (sortScriptsByFrequency) {
        updateScriptFrequencies(job.script.id, scriptFrequencies)
    }
    if (suggestOptionValues) {
        updateScriptOptionOverrides(job, scriptOptionOverrides)
    }
    store.dispatch(save())
}

function updateScriptFrequencies(
    scriptId: string,
    scriptFrequencies: Array<ScriptFrequency>
) {
    let idx = scriptFrequencies.findIndex((sf) => sf.scriptId == scriptId)
    let scriptFrequencies_ = [...scriptFrequencies]
    let sf = { scriptId, count: 1 }
    // if it exists already, increment the count and remove the old entry
    if (idx != -1) {
        sf.count = scriptFrequencies_[idx].count + 1
        scriptFrequencies_.splice(idx, 1)
    }
    // add the (new) entry
    scriptFrequencies_.push(sf)

    store.dispatch(setScriptFrequency(scriptFrequencies_))
}

// record the most recent (this job's) option overrides for its script, and remove old values
function updateScriptOptionOverrides(
    job: Job,
    scriptOptionOverrides: Array<ScriptOptionOverrides>
) {
    let optionOverrides = getOptionOverrides(job)
    // all the scripts and their option overrides
    let scriptOptionOverrides_ = [...scriptOptionOverrides]
    // this script's option overrides
    let idx = scriptOptionOverrides.findIndex(
        (soo) => soo.scriptId == job.script.id
    )
    if (idx != -1) {
        // remove the old entry
        scriptOptionOverrides_.splice(idx, 1)
    }
    if (optionOverrides.length > 0) {
        // add a new entry
        scriptOptionOverrides_.push({
            scriptId: job.script.id,
            optionOverrides,
        })
    }
    store.dispatch(setLastUsedScriptOptionOverrides(scriptOptionOverrides_))
}

// return list of name/value for overridden options
function getOptionOverrides(job: Job): Array<NameValue> {
    let optionOverrides = job.jobRequest.options.filter(
        (opt) => opt.value != getDefaultOptionValue(opt.name, job.script)
    )
    return optionOverrides.map(
        (oo) =>
            ({
                name: oo.name,
                value: oo.value?.toString(),
            } as NameValue)
    )
}

function getDefaultOptionValue(optionName, script) {
    return script.options.find((opt) => opt.name == optionName)?.default
}

export function clearUsageData() {}
