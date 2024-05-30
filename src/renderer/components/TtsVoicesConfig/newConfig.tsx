/*
Select a script and submit a new job
*/
import { useState, useEffect } from 'react'
import { useWindowStore } from 'renderer/store'
import { TtsConfig, TtsVoice } from 'shared/types/ttsConfig'
import { Down, Up } from '../SvgIcons'

export function TtsVoicesConfigPane2({
    availableVoices,
    userPreferredVoices,
    userDefaultVoices,
    onChangePreferredVoices,
    onChangeDefaultVoices,
}) {
    const { pipeline } = useWindowStore()
    const [voiceList, setVoiceList] = useState(
        [
            {
                name: 'None',
                id: 'None',
                gender: 'All',
                langcode: 'All',
                engine: 'All',
                show: true,
            },
        ].concat(availableVoices.map((v) => ({ ...v, show: true })))
    )
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
        console.log('select language ', e.target.value)
        setLang(e.target.value)
        setEngine('All')
        setLangcode('All')
        setGender('All')
        setVoiceId('None')
    }
    let selectEngine = (e) => {
        console.log('select engine ', e.target.value)
        setEngine(e.target.value)
        setLangcode('All')
        setGender('All')
        setVoiceId('None')
    }
    let selectRegion = (e) => {
        console.log('select region ', e.target.value)
        setLangcode(e.target.value)
        setGender('All')
        setVoiceId('None')
    }
    let selectGender = (e) => {
        console.log('select gender ', e.target.value)
        setGender(e.target.value)
        setVoiceId('None')
    }
    let selectVoice = (e) => {
        console.log('select voice id', e.target.value)
        setVoiceId(e.target.value)
    }
    let selectPreferredVoicesLanguage = (e) => {
        setPreferredVoicesLanguage(e.target.value)
    }

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
                                <option value={lang} key={idx}>
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
                                <option value={engine} key={idx}>
                                    {engine.charAt(0).toUpperCase() +
                                        engine.substring(1)}
                                </option>
                            ))}
                    </select>
                </div>
                <div>
                    <label htmlFor="select-region">Region</label>
                    <select
                        id="select-region"
                        onChange={(e) => selectRegion(e)}
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
                                <option value={lang} key={idx}>
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
                                <option value={gender} key={idx}>
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
                                <option value={v.id} key={idx}>
                                    {v.name}
                                </option>
                            ))}
                    </select>
                </div>
            </div>
            <div className="voice-details">
                {voiceId != 'None' ? (
                    <>
                        <p>
                            Selected:{' '}
                            {availableVoices.find((v) => v.id == voiceId).name},{' '}
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
                        </p>
                        <div>
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
                        </div>
                    </>
                ) : (
                    ''
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
                                <option value={lang} key={idx}>
                                    {languageNames.of(lang)}
                                </option>
                            ))}
                    </select>
                    preferred voices:
                </p>
                <div
                    role="region"
                    aria-labelledby="preferred-table-title"
                    tabIndex={0}
                >
                    <table
                        aria-colcount={6}
                        aria-rowcount={
                            userPreferredVoices.filter((v) => {
                                if (preferredVoicesLanguage == 'All') {
                                    return true
                                } else {
                                    return (
                                        getLang(v.lang) ==
                                        preferredVoicesLanguage
                                    )
                                }
                            }).length
                        }
                    >
                        <thead>
                            <tr>
                                <th>Name</th>
                                <th>Engine</th>
                                <th>Language</th>
                                <th>Gender</th>
                                <th>Is default</th>
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
                                .map((v, idx) => (
                                    <tr key={idx}>
                                        <td>{v.name}</td>
                                        <td>{v.engine}</td>
                                        <td>{languageNames.of(v.lang)}</td>
                                        <td>{v.gender}</td>
                                        <td>
                                            <select defaultValue="No">
                                                <option value="Yes">Yes</option>
                                                <option value="No">No</option>
                                            </select>
                                        </td>
                                        <td>
                                            <button
                                                onClick={(e) =>
                                                    removeFromPreferredVoices(v)
                                                }
                                            >
                                                Remove voice
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </>
    )
}
