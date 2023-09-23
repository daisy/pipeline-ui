/*
Select a script and submit a new job
*/
import { useState, useEffect } from 'react'
import { useWindowStore } from 'renderer/store'
import { TtsConfig, TtsVoice } from 'shared/types/ttsConfig'
import { Down, Up } from '../SvgIcons'

export function TtsConfigPane({
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
    // dir: 1 or -1
    let sortVoices = (sortBy) => {
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

        let sortSettings_ = { ...sortSettings }
        // reverse the sort direction in the settings
        sortSettings_[sortBy] = sortSettings_[sortBy] == 1 ? -1 : 1
        sortSettings_.active = sortBy
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
                if ( // look in all the text searchable fields
                    v.name.toLowerCase().indexOf(search) != -1 ||
                    v.engine.toLowerCase().indexOf(search) != -1 ||
                    v.lang.toLowerCase().indexOf(search) != -1 ||
                    v.gender.toLowerCase().indexOf(search) != -1
                ) {
                    v.show = true
                } else {
                    v.show = false
                }
            })
        }
        setVoiceList([...voiceList_])
    }, [searchString])

    let clearSearch = () => {
        setSearchString('')
    }
    // let moveVoice = (currPos, newPos) => {
    //     console.log('Move', currPos, newPos)
    //     let tmpVoices = [...voiceList]
    //     let item = tmpVoices.splice(currPos, 1)[0]
    //     tmpVoices.splice(newPos, 0, item)
    //     setVoiceList(tmpVoices)
    // }

    return (
        <>
            <p id="available-voices-label" className="label">
                <b>Text-to-speech voices</b>
            </p>
            <p>
                Select your preferred voices, saved as your default TTS
                confiuration.
            </p>
            <div id="voice-table-controls">
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
            {voiceList.filter(v => v.show).length > 0 ? (
                <div
                    role="region"
                    aria-labelledby="available-voices-label"
                    tabIndex="0"
                >
                    <table aria-labelledby="available-voices-label">
                        <thead>
                            <tr>
                                <th onClick={(e) => sortVoices('prefer')}>
                                    Prefer
                                </th>
                                <th onClick={(e) => sortVoices('name')}>
                                    Name
                                </th>
                                <th onClick={(e) => sortVoices('engine')}>
                                    Engine
                                </th>
                                <th onClick={(e) => sortVoices('lang')}>
                                    Language
                                </th>
                                <th onClick={(e) => sortVoices('gender')}>
                                    Gender
                                </th>
                                {/* <th>Move</th> */}
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
                                            {/* <td>
                                    {idx > 0 ? (
                                        <button
                                            className="voice-up"
                                            onClick={(e) =>
                                                moveVoice(idx, idx - 1)
                                            }
                                            title="Move up"
                                        >
                                            <Up width="12" height="12" />
                                        </button>
                                    ) : (
                                        ''
                                    )}
                                    {idx < voiceList.length - 1 ? (
                                        <button
                                            className="voice-down"
                                            onClick={(e) =>
                                                moveVoice(idx, idx + 1)
                                            }
                                            title="Move down"
                                        >
                                            <Down width="12" height="12" />
                                        </button>
                                    ) : (
                                        ''
                                    )}
                                </td> */}
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
                        {searchString != '' ? (
                            <button className="inline-button" onClick={(e) => clearSearch()}>
                                Clear search
                            </button>
                        ) : (
                            ''
                        )}
                    </p>
                </>
            )}
        </>
    )
}
