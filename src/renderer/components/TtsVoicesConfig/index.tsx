/*
Select a script and submit a new job
*/
import { useState, useEffect } from 'react'
import { useWindowStore } from 'renderer/store'
import { TtsConfig, TtsVoice } from 'shared/types/ttsConfig'
import { Down, Up } from '../SvgIcons'

export function TtsVoicesConfigPane({
    availableVoices,
    userPreferredVoices,
    onChangePreferredVoices,
}) {
    const { pipeline } = useWindowStore()
    const [voiceList, setVoiceList] = useState(
        availableVoices.map((v) => ({ ...v, show: true }))
    )
    const [preferredVoices, setPreferredVoices] = useState([
        ...userPreferredVoices,
    ])
    const [engines, setEngines] = useState([])
    const [langs, setLangs] = useState([])
    const [enginesChecked, setEnginesChecked] = useState([])

    // table filter search
    const [searchString, setSearchString] = useState('')
    // what direction is each column being sorted in (1 or -1)
    const [sortSettings, setSortSettings] = useState({
        prefer: 1,
        name: -1,
        engine: -1,
        lang: -1,
        gender: -1,
        selected: 'prefer',
    })

    let changePreferredVoices = (e, voice: TtsVoice) => {
        if (e.target.checked) {
            let tmpVoices = [...preferredVoices, voice]
            setPreferredVoices(tmpVoices)
            onChangePreferredVoices(tmpVoices)
        } else {
            let tmpVoices = [...preferredVoices]
            let idx = tmpVoices.findIndex((v) => v.id == voice.id)
            tmpVoices.splice(idx, 1)
            setPreferredVoices(tmpVoices)
            onChangePreferredVoices(tmpVoices)
        }
    }

    let sortVoices = (sortBy) => {
        let sortedVoices = sortVoicesArray(voiceList, preferredVoices, sortBy)

        let sortSettings_ = { ...sortSettings }
        // reverse the sort direction in the settings
        sortSettings_[sortBy] = sortSettings_[sortBy] == 1 ? -1 : 1
        sortSettings_.selected = sortBy
        // reverse the actual data
        if (sortSettings_[sortBy] == -1) {
            sortedVoices.reverse()
        }
        setVoiceList([...sortedVoices])
        setSortSettings(sortSettings_)
    }
    useEffect(() => {
        let search = searchString.trim().toLowerCase()
        let voiceList_ = [...voiceList]
        if (search == '') {
            voiceList_.map((v) => (v.show = true))
        } else {
            voiceList_.map((v) => {
                if (
                    // look in all the text searchable fields
                    v.name.toLowerCase().indexOf(search) != -1 ||
                    v.engine.toLowerCase().indexOf(search) != -1 ||
                    v.lang.toLowerCase().indexOf(search) != -1 ||
                    v.gender.toLowerCase().indexOf(search) != -1
                ) {
                    v.show = true && enginesChecked.includes(v.engine)
                } else {
                    v.show = false
                }
            })
        }
        setVoiceList([...voiceList_])
    }, [searchString])

    useEffect(() => {
        let tmpVoices = [...voiceList]
        for (let v of tmpVoices) {
            v.show = enginesChecked.includes(v.engine)
        }
        setVoiceList(tmpVoices)
    }, [enginesChecked])

    useEffect(() => {
        let langs_ = Array.from(new Set(voiceList.map((v) => v.lang)))
        let engines_ = Array.from(new Set(voiceList.map((v) => v.engine)))
        // sort on startup
        sortVoices(sortSettings.selected)
        // see what engines and languages are included in this voices array
        setLangs(langs_)
        setEngines(engines_)
        // start with all engines selected
        setEnginesChecked(engines_)
    }, [])

    let clearSearch = () => {
        setSearchString('')
        setEnginesChecked([...engines])
    }

    let changeEngineFilter = (e, engine) => {
        let tmpEngines
        if (e.target.checked) {
            tmpEngines = [...enginesChecked, engine]
            setEnginesChecked(tmpEngines)
        } else {
            tmpEngines = [...enginesChecked]
            let idx = tmpEngines.findIndex((eng) => eng == engine)
            tmpEngines.splice(idx, 1)
            setEnginesChecked(tmpEngines)
        }
    }
    let getAriaSortValue = (colName) => {
        return sortSettings.selected == colName
            ? sortSettings[colName] == 1
                ? 'ascending'
                : 'descending'
            : 'none'
    }
    return (
        <>
            <p id="available-voices-label" className="label">
                <b>Text-to-speech voices</b>
            </p>
            <p>
                Select your preferred voices, saved as your default TTS
                configuration.
            </p>
            <div id="voice-table-controls">
                <div className="search">
                    <label htmlFor="voicesearch">Search</label>
                    <input
                        id="voicesearch"
                        type="text"
                        value={searchString}
                        onChange={(e) => {
                            setSearchString(e.target.value)
                        }}
                        onKeyDown={(e) => {
                            e.key === 'Enter' && e.preventDefault()
                        }}
                    />
                </div>
                <div className="includeEngines">
                    <span>Show engines: </span>
                    <ul>
                        {engines.map((engine, idx) => (
                            <li key={idx}>
                                <input
                                    type="checkbox"
                                    id={`filter-engine-${engine}`}
                                    checked={enginesChecked.includes(engine)}
                                    onClick={(e) =>
                                        changeEngineFilter(e, engine)
                                    }
                                    onChange={(e) =>
                                        changeEngineFilter(e, engine)
                                    }
                                />
                                <label htmlFor={`filter-engine-${engine}`}>
                                    {engine}
                                </label>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            {voiceList.filter((v) => v.show).length > 0 ? (
                <div
                    role="region"
                    aria-labelledby="available-voices-label"
                    tabIndex={0}
                >
                    <table
                        aria-labelledby="available-voices-label"
                        aria-live="polite"
                    >
                        <thead>
                            <tr>
                                <th
                                    onClick={(e) => sortVoices('prefer')}
                                    aria-sort={getAriaSortValue('prefer')}
                                    title="Sort by preference"
                                >
                                    <span tabIndex={0} role="button">
                                        Prefer
                                    </span>
                                </th>
                                <th
                                    onClick={(e) => sortVoices('name')}
                                    aria-sort={getAriaSortValue('name')}
                                    title="Sort by name"
                                >
                                    <span tabIndex={0} role="button">
                                        Name
                                    </span>
                                </th>
                                <th
                                    onClick={(e) => sortVoices('engine')}
                                    aria-sort={getAriaSortValue('engine')}
                                    title="Sort by engine"
                                >
                                    <span tabIndex={0} role="button">
                                        Engine
                                    </span>
                                </th>
                                <th
                                    onClick={(e) => sortVoices('lang')}
                                    aria-sort={getAriaSortValue('lang')}
                                    title="Sort by language"
                                >
                                    <span tabIndex={0} role="button">
                                        Language
                                    </span>
                                </th>
                                <th
                                    onClick={(e) => sortVoices('gender')}
                                    aria-sort={getAriaSortValue('gender')}
                                    title="Sort by gender"
                                >
                                    <span tabIndex={0} role="button">
                                        Gender
                                    </span>
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {voiceList
                                .filter((v, idx) => v.show)
                                .map((v, idx) => {
                                    let checked =
                                        preferredVoices.findIndex(
                                            // @ts-ignore
                                            (vx) => vx.id == v.id
                                        ) != -1

                                    return (
                                        <tr key={idx}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    onChange={(e) =>
                                                        changePreferredVoices(
                                                            e,
                                                            v
                                                        )
                                                    }
                                                    title={`Select ${v.name}`}
                                                    checked={checked}
                                                />
                                            </td>
                                            <td>{v.name}</td>
                                            <td>{v.engine}</td>
                                            <td>{v.lang}</td>
                                            <td>{v.gender}</td>
                                        </tr>
                                    )
                                })}
                        </tbody>
                    </table>
                </div>
            ) : (
                <>
                    <p>
                        No voices found{' '}
                        {searchString != '' || enginesChecked.length == 0 ? (
                            <button
                                className="inline-button"
                                onClick={(e) => clearSearch()}
                            >
                                Clear search
                            </button>
                        ) : (
                            ''
                        )}
                    </p>
                </>
            )}
            <p className="selection-summary" aria-live="polite">
                {preferredVoices.length} selected:{' '}
                {preferredVoices.map((v) => v.name).join(', ')}
            </p>
        </>
    )
}

function sortVoicesArray(voiceList, preferredVoices, sortBy) {
    let alphasort = (a, b) => (a > b ? 1 : a == b ? 0 : -1)

    let sortedVoices = voiceList.sort((a, b) => {
        if (sortBy == 'prefer') {
            let prefersA = preferredVoices.map((v) => v.id).includes(a.id)
            let prefersB = preferredVoices.map((v) => v.id).includes(b.id)
            return prefersA ? 1 : prefersB ? -1 : 0
        } else if (sortBy == 'name') {
            return alphasort(a.name, b.name)
        } else if (sortBy == 'engine') {
            return alphasort(a.engine, b.engine)
        } else if (sortBy == 'lang') {
            return alphasort(a.lang, b.lang)
        } else if (sortBy == 'gender') {
            return alphasort(a.gender, b.gender)
        }
    })

    return sortedVoices
}
