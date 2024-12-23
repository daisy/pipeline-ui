/*
Select a script and submit a new job
*/
import { useState, useEffect } from 'react'
import { useWindowStore } from 'renderer/store'
import { TtsConfig, TtsVoice } from 'shared/types/ttsConfig'
import { Down, Up } from '../SvgIcons'
import { voicesTransliterations } from './voiceTransliterations'
import { VoicePreview } from './VoicePreview'

export function TtsVoicesConfigPane({
    availableVoices,
    userPreferredVoices,
    ttsEnginesStates,
    userDefaultVoices,
    onChangePreferredVoices,
    onChangeDefaultVoices,
}) {
    const [preferredVoices, setPreferredVoices] = useState([
        ...userPreferredVoices,
    ])
    const [defaultVoices, setDefaultVoices] = useState([...userDefaultVoices])
    // filter selections
    const [engine, setEngine] = useState('All')
    const [lang, setLang] = useState('All')
    const [langcode, setLangcode] = useState('All')
    const [gender, setGender] = useState('All')
    const [voiceId, setVoiceId] = useState('None')
    const [preferredVoicesLanguage, setPreferredVoicesLanguage] =
        useState('All')

    let languageNames = new Intl.DisplayNames(['en'], { type: 'language' })

    let addToPreferredVoices = (voice: TtsVoice) => {
        let tmpVoices = [...preferredVoices, voice]
        setPreferredVoices(tmpVoices)
        onChangePreferredVoices(tmpVoices)
    }

    let removeFromPreferredVoices = (voice: TtsVoice) => {
        if (defaultVoices.find((vx) => vx.id == voice.id)) {
            clearDefaultVoice(voice.lang)
        }

        let tmpVoices = [...preferredVoices]
        let idx = tmpVoices.findIndex((v) => v.id == voice.id)
        tmpVoices.splice(idx, 1)
        setPreferredVoices(tmpVoices)
        onChangePreferredVoices(tmpVoices)
    }

    // return the first part of the language code (e.g. 'en' for 'en-US')
    // or return the whole thing if there is no dash
    let getLang = (str) => {
        let trimmed = str.trim()
        let idxOfDash = trimmed.indexOf('-')
        return str.slice(0, idxOfDash == -1 ? undefined : idxOfDash)
    }

    let selectLanguage = (e) => {
        setLang(e.target.value)
        setEngine('All')
        setLangcode('All')
        setGender('All')
        setVoiceId('None')
    }
    let selectEngine = (e) => {
        setEngine(e.target.value)
        setLangcode('All')
        setGender('All')
        setVoiceId('None')
    }
    let selectLangcode = (e) => {
        setLangcode(e.target.value)
        setGender('All')
        setVoiceId('None')
    }
    let selectGender = (e) => {
        setGender(e.target.value)
        setVoiceId('None')
    }
    let selectVoice = (e) => {
        setVoiceId(e.target.value)
    }
    let selectPreferredVoicesLanguage = (e) => {
        setPreferredVoicesLanguage(e.target.value)
    }
    let selectDefault = (e, voice) => {
        console.log('default voices', defaultVoices)
        let tmpVoices = defaultVoices ? [...defaultVoices] : []
        let oldDefaultIdx = tmpVoices?.findIndex(
            (vx) => getLang(vx.lang) == getLang(voice.lang)
        ) ?? -1
        if (oldDefaultIdx != -1) {
            console.log(getLang(voice.lang), ' has default already')
            tmpVoices.splice(oldDefaultIdx, 1)
        }
        tmpVoices.push(voice)
        setDefaultVoices(tmpVoices)
        onChangeDefaultVoices(tmpVoices)
    }
    let clearDefaultVoice = (langCode) => {
        let tmpVoices = defaultVoices ? [...defaultVoices] : []
        let oldDefaultIdx = tmpVoices.findIndex(
            (vx) => getLang(vx.lang) == langCode
        )
        if (oldDefaultIdx != -1) {
            console.log('found at ', oldDefaultIdx)
            tmpVoices.splice(oldDefaultIdx, 1)
            setDefaultVoices(tmpVoices)
            onChangeDefaultVoices(tmpVoices)
        } else {
            console.log('not found')
        }
    }
    let preferredRowLength = userPreferredVoices.filter((v) => {
        if (preferredVoicesLanguage == 'All') {
            return true
        } else {
            return getLang(v.lang) == preferredVoicesLanguage
        }
    }).length

    return (
        <>
            <div>
                <p id="available-voices-label" className="label">
                    <b>Text-to-speech voices</b>
                </p>
            </div>

            <div className="voice-filters">
                <div>
                    <label htmlFor="select-language">Language</label>
                    <select
                        id="select-language"
                        onChange={(e) => selectLanguage(e)}
                        defaultValue={lang}
                    >
                        <option value="All">All</option>
                        {Array.from(
                            new Set(availableVoices.map((v) => getLang(v.lang)))
                        )
                            .sort((a: string, b: string) =>
                                languageNames.of(a) < languageNames.of(b)
                                    ? -1
                                    : 1
                            )
                            .map((lang: string, idx: number) => (
                                <option value={lang} key={lang}>
                                    {languageNames.of(lang)}
                                </option>
                            ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="select-engine">Engine</label>
                    <select
                        id="select-engine"
                        onChange={(e) => selectEngine(e)}
                        defaultValue={engine}
                    >
                        <option value="All">All</option>
                        {Array.from(
                            new Set(
                                availableVoices
                                    .filter((v) => {
                                        if (lang == 'All') {
                                            return true
                                        }
                                        return getLang(v.lang) == lang
                                    })
                                    .map((v) => v.engine)
                            )
                        )
                            .sort((a: string, b: string) => (a < b ? -1 : 1))
                            .map((engine: string, idx: number) => (
                                <option value={engine} key={engine}>
                                    {engine.charAt(0).toUpperCase() +
                                        engine.substring(1)}
                                </option>
                            ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="select-dialect">Dialect</label>
                    <select
                        id="select-dialect"
                        onChange={(e) => selectLangcode(e)}
                        defaultValue={langcode}
                    >
                        <option value="All">All</option>
                        {Array.from(
                            new Set(
                                availableVoices
                                    .filter((v) => {
                                        if (lang == 'All') {
                                            return true
                                        }
                                        return getLang(v.lang) == lang
                                    })
                                    .filter((v) => {
                                        if (engine == 'All') {
                                            return true
                                        }
                                        return v.engine == engine
                                    })
                                    .map((v) => v.lang)
                            )
                        )
                            .sort((a: string, b: string) =>
                                languageNames.of(a) < languageNames.of(b)
                                    ? -1
                                    : 1
                            )
                            .map((lang: string, idx: number) => (
                                <option value={lang} key={lang}>
                                    {languageNames.of(lang)}
                                </option>
                            ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="select-gender">Gender/Age</label>
                    <select
                        id="select-gender"
                        onChange={(e) => selectGender(e)}
                        defaultValue={gender}
                    >
                        <option value="All">All</option>
                        {Array.from(
                            new Set(
                                availableVoices
                                    .filter((v) => {
                                        if (lang == 'All') {
                                            return true
                                        }
                                        return getLang(v.lang) == lang
                                    })
                                    .filter((v) => {
                                        if (engine == 'All') {
                                            return true
                                        }
                                        return v.engine == engine
                                    })
                                    .filter((v) => {
                                        if (langcode == 'All') {
                                            return true
                                        }
                                        return v.lang == langcode
                                    })
                                    .map((v) => v.gender)
                            )
                        )
                            .sort((a: string, b: string) => (a < b ? -1 : 1))
                            .map((gender: string, idx: number) => (
                                <option value={gender} key={gender}>
                                    {gender.charAt(0).toUpperCase() +
                                        gender.substring(1)}
                                </option>
                            ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="select-voice">Voice</label>
                    <select
                        id="select-voice"
                        onChange={(e) => selectVoice(e)}
                        defaultValue={voiceId}
                    >
                        <option value="None">None</option>
                        {Array.from(
                            new Set(
                                availableVoices
                                    .filter((v) => {
                                        if (lang == 'All') {
                                            return true
                                        }
                                        return getLang(v.lang) == lang
                                    })
                                    .filter((v) => {
                                        if (engine == 'All') {
                                            return true
                                        }
                                        return v.engine == engine
                                    })
                                    .filter((v) => {
                                        if (langcode == 'All') {
                                            return true
                                        }
                                        return v.lang == langcode
                                    })
                                    .filter((v) => {
                                        if (gender == 'All') {
                                            return true
                                        }
                                        return v.gender == gender
                                    })
                            )
                        )
                            // @ts-ignore
                            .sort((a, b) => (a.name < b.name ? -1 : 1))
                            .map((v: TtsVoice, idx) => (
                                //@ts-ignore
                                <option value={v.id} key={`voice-${v.id}`}>
                                    {voicesTransliterations[v.name] ?? v.name}
                                </option>
                            ))}
                    </select>
                </div>
            </div>
            <div className="voice-details">
                {voiceId != 'None' ? (
                    <>
                        <p className="selected-voice">
                            <b>Selected</b>: "
                            {voicesTransliterations[
                                availableVoices.find((v) => v.id == voiceId)
                                    .name
                            ] ??
                                availableVoices.find((v) => v.id == voiceId)
                                    .name}
                            ",{' '}
                            {languageNames.of(
                                availableVoices.find((v) => v.id == voiceId)
                                    .lang
                            )}
                            ,{' '}
                            {
                                availableVoices.find((v) => v.id == voiceId)
                                    .engine
                            }
                            ,{' '}
                            {
                                availableVoices.find((v) => v.id == voiceId)
                                    .gender
                            }
                            .
                        </p>
                        <VoicePreview
                            voice={availableVoices.find((v) => v.id == voiceId)}
                        ></VoicePreview>
                        {preferredVoices.find((v) => v.id == voiceId) ? (
                            <p className="voice-already-exists">
                                <i>This voice is already in your list.</i>
                            </p>
                        ) : (
                            <button
                                onClick={(e) =>
                                    addToPreferredVoices(
                                        availableVoices.find(
                                            (v) => v.id == voiceId
                                        )
                                    )
                                }
                            >
                                Add to preferred voices
                            </button>
                        )}
                    </>
                ) : (
                    <p>
                        <i>No voice selected</i>
                    </p>
                )}
            </div>
            <div className="preferred-voices">
                <p id="preferred-table-title">
                    View
                    <select onChange={(e) => selectPreferredVoicesLanguage(e)}>
                        <option value="All">All</option>
                        {Array.from(
                            new Set(
                                userPreferredVoices.map((v) => getLang(v.lang))
                            )
                        )
                            .sort((a: string, b: string) =>
                                languageNames.of(a) < languageNames.of(b)
                                    ? -1
                                    : 1
                            )
                            .map((lang: string, idx: number) => (
                                <option value={lang} key={lang}>
                                    {languageNames.of(lang)}
                                </option>
                            ))}
                    </select>
                    preferred voices. Showing {preferredRowLength}{' '}
                    {preferredRowLength == 1 ? 'row' : 'rows'}.
                </p>
                <div
                    role="region"
                    aria-labelledby="preferred-table-title"
                    tabIndex={0}
                >
                    <table aria-colcount={5} aria-rowcount={preferredRowLength}>
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Engine</th>
                                <th>Language</th>
                                <th>Gender/Age</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {userPreferredVoices
                                .filter((v) => {
                                    if (preferredVoicesLanguage == 'All') {
                                        return true
                                    } else {
                                        return (
                                            getLang(v.lang) ==
                                            preferredVoicesLanguage
                                        )
                                    }
                                })
                                .sort((a, b) => (a.name > b.name ? 1 : -1))
                                .map((v, idx) => (
                                    <tr key={v.id}>
                                        <td className="voiceName">
                                            {voicesTransliterations[v.name] ??
                                                v.name}
                                        </td>
                                        <td>
                                            {ttsEnginesStates[v.engine]?.name ??
                                                v.engine}
                                        </td>
                                        <td>{languageNames.of(v.lang)}</td>
                                        <td>{v.gender}</td>
                                        <td className="actions">
                                            <div>
                                                <label htmlFor={`cb-${v.id}`}>
                                                    Set as default for{' '}
                                                    {languageNames.of(
                                                        getLang(v.lang)
                                                    )}
                                                </label>
                                                <input
                                                    type="radio"
                                                    name={getLang(v.lang)}
                                                    id={`cb-${v.id}`}
                                                    onChange={(e) =>
                                                        selectDefault(e, v)
                                                    }
                                                    defaultChecked={
                                                        defaultVoices?.find(
                                                            (vx) =>
                                                                vx.id == v.id
                                                        ) != undefined
                                                    }
                                                ></input>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    removeFromPreferredVoices(v)
                                                }}
                                                title={`Remove ${v.name}`}
                                            >
                                                Remove voice
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                    {preferredVoicesLanguage != 'All' ? (
                        <button
                            onClick={(e) =>
                                clearDefaultVoice(preferredVoicesLanguage)
                            }
                        >
                            Clear default for{' '}
                            {languageNames.of(preferredVoicesLanguage)}
                        </button>
                    ) : (
                        ''
                    )}
                </div>
            </div>
        </>
    )
}
