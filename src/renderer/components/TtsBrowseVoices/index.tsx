import { useState } from 'react'
import { TtsVoice } from 'shared/types/ttsConfig'
import { voicesTransliterations } from './voiceTransliterations'
import { VoicePreview } from './VoicePreview'

export function TtsBrowseVoicesConfigPane({
    availableVoices,
    userPreferredVoices,
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
            <h2 id="available-voices-label" className="label">Browse Text-to-speech voices</h2>
            <div className="voice-selection">
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
            </div>
        </>
    )
}
